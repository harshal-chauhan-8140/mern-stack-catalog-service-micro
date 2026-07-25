import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import Product from "../../src/product/product-model";
import { getAccessToken } from "../utils/auth";
import { useInMemoryDatabase } from "../utils/db";
import {
    CATEGORY_ID,
    IMAGE_BUFFER,
    makeProductFields,
    UNKNOWN_ID,
} from "../utils/fixtures";
import {
    clearTestFolder,
    findAsset,
    listAssets,
    uploadAsset,
} from "../utils/cloudinary";

jest.setTimeout(60000);

const OLD_IMAGE = "old-image-name";

describe("PUT /products/:productId", () => {
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

    const seedProduct = async () => {
        await uploadAsset(OLD_IMAGE, IMAGE_BUFFER);

        const product = await Product.create({
            name: "Margherita",
            description: "Classic cheese pizza",
            image: OLD_IMAGE,
            priceConfiguration: {
                Size: {
                    priceType: "base",
                    availableOptions: { Small: 400, Large: 600 },
                },
            },
            attributes: [{ name: "isHit", value: false }],
            tenantId: "1",
            categoryId: new mongoose.Types.ObjectId(CATEGORY_ID),
            isPublish: false,
        });

        return product._id.toString();
    };

    const updateProduct = (
        id: string,
        fields: Record<string, string> = makeProductFields(),
        { token = adminToken, withImage = false } = {},
    ) => {
        const req = request(app)
            .put(`/products/${id}`)
            .set("Authorization", `Bearer ${token}`);

        Object.entries(fields).forEach(([key, value]) => req.field(key, value));

        if (withImage) {
            req.attach("image", IMAGE_BUFFER, "new-product.png");
        }

        return req;
    };

    describe("given a valid update without a new image", () => {
        it("should return a 200 status code", async () => {
            const id = await seedProduct();

            const response = await updateProduct(id);

            expect(response.statusCode).toBe(200);
        });

        it("should return the id of the updated product", async () => {
            const id = await seedProduct();

            const response = await updateProduct(id);

            expect(response.body.id).toBe(id);
        });

        it("should persist the changed fields", async () => {
            const id = await seedProduct();

            await updateProduct(id, {
                ...makeProductFields(),
                name: "Pepperoni",
                description: "Now with pepperoni",
            });

            const product = await Product.findById(id);
            expect(product?.name).toBe("Pepperoni");
            expect(product?.description).toBe("Now with pepperoni");
            expect(product?.isPublish).toBe(true);
        });

        it("should replace priceConfiguration and attributes", async () => {
            const id = await seedProduct();

            await updateProduct(id);

            const product = await Product.findById(id);
            const priceConfiguration =
                product?.priceConfiguration as unknown as Map<
                    string,
                    { availableOptions: Map<string, number> }
                >;

            expect(
                priceConfiguration.get("Size")?.availableOptions.get("Medium"),
            ).toBe(500);
            expect(product?.attributes).toHaveLength(2);
        });

        it("should keep the existing image", async () => {
            const id = await seedProduct();

            await updateProduct(id);

            expect((await Product.findById(id))?.image).toBe(OLD_IMAGE);
        });

        it("should leave the stored image untouched", async () => {
            const id = await seedProduct();

            await updateProduct(id);

            expect(await findAsset(OLD_IMAGE)).not.toBeNull();
            expect(await listAssets()).toHaveLength(1);
        });
    });

    describe("given a new image", () => {
        it("should upload the new image to Cloudinary", async () => {
            const id = await seedProduct();

            await updateProduct(id, makeProductFields(), { withImage: true });

            const product = await Product.findById(id);
            const asset = await findAsset(product!.image);

            expect(asset).not.toBeNull();
            expect(asset?.format).toBe("png");
            expect(asset?.width).toBe(1);
            expect(asset?.height).toBe(1);
        });

        it("should delete the old image from Cloudinary", async () => {
            const id = await seedProduct();

            await updateProduct(id, makeProductFields(), { withImage: true });

            expect(await findAsset(OLD_IMAGE)).toBeNull();
        });

        it("should leave exactly one image behind", async () => {
            const id = await seedProduct();

            await updateProduct(id, makeProductFields(), { withImage: true });

            const product = await Product.findById(id);
            expect(await listAssets()).toEqual([
                `products/test/${product!.image}`,
            ]);
        });

        it("should store the new image name on the product", async () => {
            const id = await seedProduct();

            await updateProduct(id, makeProductFields(), { withImage: true });

            expect((await Product.findById(id))?.image).not.toBe(OLD_IMAGE);
        });
    });

    describe("given an id that does not resolve", () => {
        it("should return 404 for an unknown product", async () => {
            const response = await updateProduct(UNKNOWN_ID);

            expect(response.statusCode).toBe(404);
        });

        it("should return 400 for a malformed id", async () => {
            const response = await updateProduct("not-an-object-id");

            expect(response.statusCode).toBe(400);
        });

        it("should not upload an image for an unknown product", async () => {
            await updateProduct(UNKNOWN_ID, makeProductFields(), {
                withImage: true,
            });

            expect(await listAssets()).toHaveLength(0);
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
            const id = await seedProduct();
            const fields = makeProductFields();
            delete fields[field];

            const response = await updateProduct(id, fields);

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when attributes is not valid JSON", async () => {
            const id = await seedProduct();

            const response = await updateProduct(id, {
                ...makeProductFields(),
                attributes: "[not json",
            });

            expect(response.statusCode).toBe(400);
        });

        it("should not modify the product when validation fails", async () => {
            const id = await seedProduct();
            const fields = makeProductFields();
            delete fields.name;

            await updateProduct(id, fields);

            expect((await Product.findById(id))?.name).toBe("Margherita");
        });
    });

    describe("given a token without a write role", () => {
        it("should return 403 for a customer", async () => {
            const id = await seedProduct();

            const response = await updateProduct(id, makeProductFields(), {
                token: customerToken,
            });

            expect(response.statusCode).toBe(403);
        });

        it("should not modify the product", async () => {
            const id = await seedProduct();

            await updateProduct(id, makeProductFields(), {
                token: customerToken,
            });

            expect((await Product.findById(id))?.isPublish).toBe(false);
        });

        it("should not replace the image", async () => {
            const id = await seedProduct();

            await updateProduct(id, makeProductFields(), {
                token: customerToken,
                withImage: true,
            });

            expect(await findAsset(OLD_IMAGE)).not.toBeNull();
        });
    });

    describe("given no token", () => {
        it("should return 401", async () => {
            const id = await seedProduct();

            const response = await request(app)
                .put(`/products/${id}`)
                .field(makeProductFields());

            expect(response.statusCode).toBe(401);
        });

        it("should not modify the product", async () => {
            const id = await seedProduct();

            await request(app)
                .put(`/products/${id}`)
                .field(makeProductFields());

            expect((await Product.findById(id))?.isPublish).toBe(false);
        });
    });
});
