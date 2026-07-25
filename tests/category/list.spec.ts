import request from "supertest";
import app from "../../src/app";
import Category from "../../src/category/category-model";
import { useInMemoryDatabase } from "../utils/db";
import { makeCategory } from "../utils/fixtures";

describe("GET /categories", () => {
    useInMemoryDatabase();

    const listCategories = () => request(app).get("/categories");

    it("should return a 200 status code without a token", async () => {
        const response = await listCategories();

        expect(response.statusCode).toBe(200);
    });

    it("should return a JSON response", async () => {
        const response = await listCategories();

        expect(response.headers["content-type"]).toEqual(
            expect.stringContaining("json"),
        );
    });

    it("should return an empty array when there are no categories", async () => {
        const response = await listCategories();

        expect(response.body).toEqual([]);
    });

    it("should return every stored category", async () => {
        await Category.create(makeCategory());
        await Category.create({ ...makeCategory(), name: "Pasta" });

        const response = await listCategories();

        expect(response.body).toHaveLength(2);
        expect(
            (response.body as { name: string }[]).map((c) => c.name).sort(),
        ).toEqual(["Pasta", "Pizza"]);
    });

    it("should return each category with all of its fields", async () => {
        await Category.create(makeCategory());

        const response = await listCategories();
        const category = (
            response.body as {
                _id: string;
                name: string;
                priceConfiguration: Record<
                    string,
                    { priceType: string; availableOptions: string[] }
                >;
                attributes: unknown[];
            }[]
        )[0];

        expect(category._id).toBeTruthy();
        expect(category.name).toBe("Pizza");
        expect(category.attributes).toHaveLength(2);
        expect(category.priceConfiguration.Size.priceType).toBe("base");
        expect(category.priceConfiguration.Crust.availableOptions).toEqual([
            "Thin",
            "Thick",
        ]);
    });
});
