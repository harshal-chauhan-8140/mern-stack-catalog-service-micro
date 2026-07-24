import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../src/app";
import Category from "../../src/category/category-model";
import { getAccessToken } from "../utils/auth";

describe("POST /categories", () => {
    let mongoServer: MongoMemoryServer;
    let accessToken: string;

    const validCategory = {
        name: "Pizza",
        priceConfiguration: {
            Size: {
                priceType: "base",
                availableOptions: ["Small", "Medium", "Large"],
            },
            Crust: {
                priceType: "aditional",
                availableOptions: ["Thin", "Thick"],
            },
        },
        attributes: [
            {
                name: "isHit",
                widgetType: "switch",
                defaultValue: "No",
                availableOptions: ["Yes", "No"],
            },
            {
                name: "Spiciness",
                widgetType: "radio",
                defaultValue: "Medium",
                availableOptions: ["Less", "Medium", "Hot"],
            },
        ],
    };

    const createCategory = (payload: object) =>
        request(app)
            .post("/categories")
            .set("Authorization", `Bearer ${accessToken}`)
            .send(payload);

    beforeAll(async () => {
        accessToken = await getAccessToken();
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    }, 120000);

    beforeEach(async () => {
        await mongoose.connection.dropDatabase();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

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

            // priceConfiguration is stored as a Mongoose Map at runtime.
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
