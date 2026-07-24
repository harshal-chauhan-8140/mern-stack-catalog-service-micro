import request from "supertest";
import app from "../../src/app";
import Category from "../../src/category/category-model";
import { useInMemoryDatabase } from "../utils/db";
import { makeCategory, UNKNOWN_ID } from "../utils/fixtures";

describe("GET /categories/:id", () => {
    useInMemoryDatabase();

    const seedCategory = async () => {
        const category = await Category.create(makeCategory());
        return category._id.toString();
    };

    // No token is set on any of these — the endpoint is deliberately public.
    const getCategory = (id: string) => request(app).get(`/categories/${id}`);

    describe("given an existing category", () => {
        it("should return a 200 status code without a token", async () => {
            const id = await seedCategory();

            const response = await getCategory(id);

            expect(response.statusCode).toBe(200);
        });

        it("should return a JSON response", async () => {
            const id = await seedCategory();

            const response = await getCategory(id);

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            );
        });

        it("should return the requested category with all of its fields", async () => {
            const id = await seedCategory();

            const response = await getCategory(id);
            const category = response.body as {
                _id: string;
                name: string;
                priceConfiguration: Record<
                    string,
                    { priceType: string; availableOptions: string[] }
                >;
                attributes: { name: string }[];
            };

            expect(category._id).toBe(id);
            expect(category.name).toBe("Pizza");
            expect(category.attributes).toHaveLength(2);
            expect(category.priceConfiguration.Size.availableOptions).toEqual([
                "Small",
                "Medium",
                "Large",
            ]);
        });

        it("should not return a different category", async () => {
            await seedCategory();
            const other = await Category.create({
                ...makeCategory(),
                name: "Pasta",
            });

            const response = await getCategory(other._id.toString());

            expect((response.body as { name: string }).name).toBe("Pasta");
        });
    });

    describe("given an id that does not resolve", () => {
        it("should return 404 for an unknown category", async () => {
            const response = await getCategory(UNKNOWN_ID);

            expect(response.statusCode).toBe(404);
        });

        it("should return 400 for a malformed id", async () => {
            const response = await getCategory("not-an-object-id");

            expect(response.statusCode).toBe(400);
        });
    });
});
