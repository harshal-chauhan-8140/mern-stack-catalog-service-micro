import request from "supertest";
import app from "../../src/app";
import Product from "../../src/product/product-model";
import { getAccessToken } from "../utils/auth";
import { useInMemoryDatabase } from "../utils/db";
import {
    CATEGORY_ID,
    IMAGE_BUFFER,
    makeProductFields,
} from "../utils/fixtures";
import { clearTestFolder, findAsset, listAssets } from "../utils/cloudinary";

jest.setTimeout(60000);

describe("POST /products", () => {
    let adminToken: string;
    let customerToken: string;

    useInMemoryDatabase();

    beforeAll(async () => {
        adminToken = await getAccessToken("adminUser");
        customerToken = await getAccessToken("customerUser");
    });

    beforeEach(async () => {
        await clearTestFolder();
    });

    afterAll(async () => {
        await clearTestFolder();
    });

    const createProduct = (
        fields: Record<string, string> = makeProductFields(),
        { token = adminToken, withImage = true } = {},
    ) => {
        const req = request(app)
            .post("/products")
            .set("Authorization", `Bearer ${token}`);

        Object.entries(fields).forEach(([key, value]) => req.field(key, value));

        if (withImage) {
            req.attach("image", IMAGE_BUFFER, "product.png");
        }

        return req;
    };

    const withoutField = (field: string) => {
        const fields = makeProductFields();
        delete fields[field];
        return fields;
    };

    describe("given all fields", () => {
        it("should return a 201 status code", async () => {
            const response = await createProduct();

            expect(response.statusCode).toBe(201);
        });

        it("should return the id of the created product", async () => {
            const response = await createProduct();

            expect(response.body).toHaveProperty("id");
            expect(response.body.id).toBeTruthy();
        });

        it("should persist the product in the database", async () => {
            await createProduct();

            const products = await Product.find();
            expect(products).toHaveLength(1);
            expect(products[0].name).toBe("Margherita");
            expect(products[0].description).toBe("Classic cheese pizza");
            expect(products[0].tenantId).toBe("1");
            expect(products[0].categoryId.toString()).toBe(CATEGORY_ID);
        });

        it("should parse priceConfiguration from its JSON string", async () => {
            await createProduct();

            const product = (await Product.find())[0];
            const priceConfiguration =
                product.priceConfiguration as unknown as Map<
                    string,
                    { priceType: string; availableOptions: Map<string, number> }
                >;

            expect(priceConfiguration.get("Size")?.priceType).toBe("base");
            expect(
                priceConfiguration.get("Size")?.availableOptions.get("Large"),
            ).toBe(600);
        });

        it("should parse attributes from its JSON string", async () => {
            await createProduct();

            const product = (await Product.find())[0];

            expect(product.attributes).toHaveLength(2);
            expect(product.attributes[0].value).toBe(true);
            expect(product.attributes[1].value).toBe("Medium");
        });

        it("should store the image in Cloudinary under the test folder", async () => {
            await createProduct();

            const product = (await Product.find())[0];
            const asset = await findAsset(product.image);

            expect(asset).not.toBeNull();
            expect(asset?.public_id).toBe(`products/test/${product.image}`);
        });

        it("should upload a readable image with the sent dimensions", async () => {
            await createProduct();

            const product = (await Product.find())[0];
            const asset = await findAsset(product.image);

            expect(asset?.format).toBe("png");
            expect(asset?.width).toBe(1);
            expect(asset?.height).toBe(1);
            expect(asset?.bytes).toBeGreaterThan(0);
        });

        it("should upload exactly one image", async () => {
            await createProduct();

            expect(await listAssets()).toHaveLength(1);
        });

        it("should honour isPublish when it is sent", async () => {
            await createProduct();

            expect((await Product.find())[0].isPublish).toBe(true);
        });

        it("should default isPublish to false when it is not sent", async () => {
            await createProduct(withoutField("isPublish"));

            expect((await Product.find())[0].isPublish).toBe(false);
        });
    });

    describe("given invalid fields", () => {
        it.each([
            "name",
            "description",
            "priceConfiguration",
            "attributes",
            "tenantId",
            "categoryId",
        ])("should return 400 when %s is missing", async (field) => {
            const response = await createProduct(withoutField(field));

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when categoryId is not a valid id", async () => {
            const response = await createProduct({
                ...makeProductFields(),
                categoryId: "not-an-object-id",
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when no image is attached", async () => {
            const response = await createProduct(makeProductFields(), {
                withImage: false,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when priceConfiguration is not valid JSON", async () => {
            const response = await createProduct({
                ...makeProductFields(),
                priceConfiguration: "{not json",
            });

            expect(response.statusCode).toBe(400);
        });

        it("should not persist the product when validation fails", async () => {
            await createProduct(withoutField("name"));

            expect(await Product.find()).toHaveLength(0);
        });

        it("should not upload an image when validation fails", async () => {
            await createProduct(withoutField("name"));

            expect(await listAssets()).toHaveLength(0);
        });
    });

    describe("given a token without a write role", () => {
        it("should return 403 for a customer", async () => {
            const response = await createProduct(makeProductFields(), {
                token: customerToken,
            });

            expect(response.statusCode).toBe(403);
        });

        it("should not persist the product", async () => {
            await createProduct(makeProductFields(), { token: customerToken });

            expect(await Product.find()).toHaveLength(0);
        });

        it("should not upload an image", async () => {
            await createProduct(makeProductFields(), { token: customerToken });

            expect(await listAssets()).toHaveLength(0);
        });
    });

    describe("given no token", () => {
        const anonymousCreate = () => {
            const req = request(app).post("/products");
            Object.entries(makeProductFields()).forEach(([key, value]) =>
                req.field(key, value),
            );
            return req.attach("image", IMAGE_BUFFER, "product.png");
        };

        it("should return 401", async () => {
            const response = await anonymousCreate();

            expect(response.statusCode).toBe(401);
        });

        it("should not persist the product", async () => {
            await anonymousCreate();

            expect(await Product.find()).toHaveLength(0);
        });

        it("should not upload an image", async () => {
            await anonymousCreate();

            expect(await listAssets()).toHaveLength(0);
        });
    });
});
