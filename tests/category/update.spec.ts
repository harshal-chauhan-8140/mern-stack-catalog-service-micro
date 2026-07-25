import request from "supertest";
import app from "../../src/app";
import Category from "../../src/category/category-model";
import { getAccessToken } from "../utils/auth";
import { useInMemoryDatabase } from "../utils/db";
import { makeCategory, UNKNOWN_ID } from "../utils/fixtures";

describe("PATCH /categories/:id", () => {
    let adminToken: string;
    let customerToken: string;

    useInMemoryDatabase();

    beforeAll(async () => {
        adminToken = await getAccessToken("adminUser");
        customerToken = await getAccessToken("customerUser");
    });

    const seedCategory = async () => {
        const category = await Category.create(makeCategory());
        return category._id.toString();
    };

    const updateCategory = (id: string, payload: object, token = adminToken) =>
        request(app)
            .patch(`/categories/${id}`)
            .set("Authorization", `Bearer ${token}`)
            .send(payload);

    describe("given a valid partial update", () => {
        it("should return a 200 status code", async () => {
            const id = await seedCategory();

            const response = await updateCategory(id, { name: "Pasta" });

            expect(response.statusCode).toBe(200);
        });

        it("should return the id of the updated category", async () => {
            const id = await seedCategory();

            const response = await updateCategory(id, { name: "Pasta" });

            expect(response.body.id).toBe(id);
        });

        it("should persist the changed field", async () => {
            const id = await seedCategory();

            await updateCategory(id, { name: "Pasta" });

            const category = await Category.findById(id);
            expect(category?.name).toBe("Pasta");
        });

        it("should leave the fields that were not sent untouched", async () => {
            const id = await seedCategory();

            await updateCategory(id, { name: "Pasta" });

            const category = await Category.findById(id);
            expect(category?.attributes).toHaveLength(2);

            const priceConfiguration =
                category?.priceConfiguration as unknown as Map<
                    string,
                    { priceType: string; availableOptions: string[] }
                >;
            expect(priceConfiguration.get("Size")?.priceType).toBe("base");
            expect(priceConfiguration.get("Crust")?.priceType).toBe(
                "aditional",
            );
        });

        it("should merge a partial priceConfiguration instead of replacing it", async () => {
            const id = await seedCategory();

            await updateCategory(id, {
                priceConfiguration: {
                    Size: {
                        priceType: "base",
                        availableOptions: ["Small", "Large"],
                    },
                },
            });

            const category = await Category.findById(id);
            const priceConfiguration =
                category?.priceConfiguration as unknown as Map<
                    string,
                    { priceType: string; availableOptions: string[] }
                >;

            expect(priceConfiguration.get("Size")?.availableOptions).toEqual([
                "Small",
                "Large",
            ]);
            expect(priceConfiguration.get("Crust")?.availableOptions).toEqual([
                "Thin",
                "Thick",
            ]);
        });

        it("should replace the attributes array when it is sent", async () => {
            const id = await seedCategory();

            await updateCategory(id, {
                attributes: [
                    {
                        name: "isHit",
                        widgetType: "switch",
                        defaultValue: "Yes",
                        availableOptions: ["Yes", "No"],
                    },
                ],
            });

            const category = await Category.findById(id);
            expect(category?.attributes).toHaveLength(1);
            expect(category?.attributes[0].defaultValue).toBe("Yes");
        });
    });

    describe("given an id that does not resolve", () => {
        it("should return 404 for an unknown category", async () => {
            const response = await updateCategory(UNKNOWN_ID, {
                name: "Pasta",
            });

            expect(response.statusCode).toBe(404);
        });

        it("should return 400 for a malformed id", async () => {
            const response = await updateCategory("not-an-object-id", {
                name: "Pasta",
            });

            expect(response.statusCode).toBe(400);
        });
    });

    describe("given invalid fields", () => {
        it("should return 400 when the body is empty", async () => {
            const id = await seedCategory();

            const response = await updateCategory(id, {});

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when name is an empty string", async () => {
            const id = await seedCategory();

            const response = await updateCategory(id, { name: "" });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when a priceType is not 'base' or 'aditional'", async () => {
            const id = await seedCategory();

            const response = await updateCategory(id, {
                priceConfiguration: {
                    Size: {
                        priceType: "invalid",
                        availableOptions: ["Small"],
                    },
                },
            });

            expect(response.statusCode).toBe(400);
        });

        it("should return 400 when a widgetType is not 'switch' or 'radio'", async () => {
            const id = await seedCategory();

            const response = await updateCategory(id, {
                attributes: [
                    {
                        name: "isHit",
                        widgetType: "dropdown",
                        defaultValue: "No",
                        availableOptions: ["Yes", "No"],
                    },
                ],
            });

            expect(response.statusCode).toBe(400);
        });

        it("should not modify the category when validation fails", async () => {
            const id = await seedCategory();

            await updateCategory(id, { name: "" });

            const category = await Category.findById(id);
            expect(category?.name).toBe("Pizza");
        });
    });

    describe("given a token without the admin role", () => {
        it("should return 403", async () => {
            const id = await seedCategory();

            const response = await updateCategory(
                id,
                { name: "Pasta" },
                customerToken,
            );

            expect(response.statusCode).toBe(403);
        });

        it("should not modify the category", async () => {
            const id = await seedCategory();

            await updateCategory(id, { name: "Pasta" }, customerToken);

            const category = await Category.findById(id);
            expect(category?.name).toBe("Pizza");
        });
    });

    describe("given no token", () => {
        it("should return 401", async () => {
            const id = await seedCategory();

            const response = await request(app)
                .patch(`/categories/${id}`)
                .send({ name: "Pasta" });

            expect(response.statusCode).toBe(401);
        });

        it("should not modify the category", async () => {
            const id = await seedCategory();

            await request(app)
                .patch(`/categories/${id}`)
                .send({ name: "Pasta" });

            const category = await Category.findById(id);
            expect(category?.name).toBe("Pizza");
        });
    });
});
