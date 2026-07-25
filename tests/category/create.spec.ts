import request from "supertest";
import app from "../../src/app";
import Category from "../../src/category/category-model";
import { getAccessToken } from "../utils/auth";
import { useInMemoryDatabase } from "../utils/db";
import { makeCategory } from "../utils/fixtures";

describe("POST /categories", () => {
    let adminToken: string;
    let customerToken: string;

    const validCategory = makeCategory();

    useInMemoryDatabase();

    beforeAll(async () => {
        adminToken = await getAccessToken("adminUser");
        customerToken = await getAccessToken("customerUser");
    });

    const createCategory = (payload: object, token = adminToken) =>
        request(app)
            .post("/categories")
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

    describe("given all fields", () => {
        it("should return a 201 status code", async () => {
            const response = await createCategory(validCategory);

            expect(response.statusCode).toBe(201);
        });

        it("should return a JSON response", async () => {
            const response = await createCategory(validCategory);

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });

        it("should return the id of the created category", async () => {
            const response = await createCategory(validCategory);

            expect(response.body).toHaveProperty("id");
            expect(response.body.id).toBeTruthy();
        });

        it("should persist the category in the database", async () => {
            await createCategory(validCategory);

            const categories = await Category.find();
            expect(categories).toHaveLength(1);
        });

        it("should persist the category with all fields intact", async () => {
            await createCategory(validCategory);

            const categories = await Category.find();
            const category = categories[0];

            expect(category.name).toBe("Pizza");
            expect(category.attributes).toHaveLength(2);

            const priceConfiguration =
                category.priceConfiguration as unknown as Map<
                    string,
                    { priceType: string; availableOptions: string[] }
                >;
            expect(priceConfiguration.get("Size")?.priceType).toBe("base");
            expect(priceConfiguration.get("Crust")?.availableOptions).toEqual([
                "Thin",
                "Thick",
            ]);
        });

        it("should return an id that matches the persisted document", async () => {
            const response = await createCategory(validCategory);

            const categories = await Category.find();
            expect(response.body.id).toBe(categories[0]._id.toString());
        });
    });

    describe("given a token without the admin role", () => {
        it("should return 403", async () => {
            const response = await createCategory(validCategory, customerToken);

            expect(response.statusCode).toBe(403);
        });

        it("should not persist the category", async () => {
            await createCategory(validCategory, customerToken);

            const categories = await Category.find();
            expect(categories).toHaveLength(0);
        });
    });

    describe("given no token", () => {
        it("should return 401", async () => {
            const response = await request(app)
                .post("/categories")
                .send(validCategory);

            expect(response.statusCode).toBe(401);
        });

        it("should not persist the category", async () => {
            await request(app).post("/categories").send(validCategory);

            const categories = await Category.find();
            expect(categories).toHaveLength(0);
        });
    });

    describe("given invalid fields", () => {
        it("should return 400 when name is missing", async () => {
            const response = await createCategory({
                priceConfiguration: validCategory.priceConfiguration,
                attributes: validCategory.attributes,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when priceConfiguration is missing", async () => {
            const response = await createCategory({
                name: validCategory.name,
                attributes: validCategory.attributes,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when attributes is missing", async () => {
            const response = await createCategory({
                name: validCategory.name,
                priceConfiguration: validCategory.priceConfiguration,
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when a priceType is not 'base' or 'aditional'", async () => {
            const response = await createCategory({
                ...validCategory,
                priceConfiguration: {
                    Size: {
                        priceType: "invalid",
                        availableOptions: ["Small"],
                    },
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it("should not persist the category when validation fails", async () => {
            await createCategory({
                priceConfiguration: validCategory.priceConfiguration,
                attributes: validCategory.attributes,
            });

            const categories = await Category.find();
            expect(categories).toHaveLength(0);
        });
    });
});
