import request from "supertest";
import app from "../../src/app";
import Category from "../../src/category/category-model";
import { getAccessToken } from "../utils/auth";
import { useInMemoryDatabase } from "../utils/db";
import { makeCategory, UNKNOWN_ID } from "../utils/fixtures";

describe("DELETE /categories/:id", () => {
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

    const deleteCategory = (id: string, token = adminToken) =>
        request(app)
            .delete(`/categories/${id}`)
            .set("Authorization", `Bearer ${token}`);

    describe("given an existing category", () => {
        it("should return a 200 status code", async () => {
            const id = await seedCategory();

            const response = await deleteCategory(id);

            expect(response.statusCode).toBe(200);
        });

        it("should return the id of the deleted category", async () => {
            const id = await seedCategory();

            const response = await deleteCategory(id);

            expect(response.body.id).toBe(id);
        });

        it("should remove the category from the database", async () => {
            const id = await seedCategory();

            await deleteCategory(id);

            expect(await Category.findById(id)).toBeNull();
        });

        it("should leave the other categories alone", async () => {
            const id = await seedCategory();
            await Category.create({ ...makeCategory(), name: "Pasta" });

            await deleteCategory(id);

            const remaining = await Category.find();
            expect(remaining).toHaveLength(1);
            expect(remaining[0].name).toBe("Pasta");
        });
    });

    describe("given an id that does not resolve", () => {
        it("should return 404 for an unknown category", async () => {
            const response = await deleteCategory(UNKNOWN_ID);

            expect(response.statusCode).toBe(404);
        });

        it("should return 400 for a malformed id", async () => {
            const response = await deleteCategory("not-an-object-id");

            expect(response.statusCode).toBe(400);
        });
    });

    describe("given a token without the admin role", () => {
        it("should return 403", async () => {
            const id = await seedCategory();

            const response = await deleteCategory(id, customerToken);

            expect(response.statusCode).toBe(403);
        });

        it("should not delete the category", async () => {
            const id = await seedCategory();

            await deleteCategory(id, customerToken);

            expect(await Category.findById(id)).not.toBeNull();
        });
    });

    describe("given no token", () => {
        it("should return 401", async () => {
            const id = await seedCategory();

            const response = await request(app).delete(`/categories/${id}`);

            expect(response.statusCode).toBe(401);
        });

        it("should not delete the category", async () => {
            const id = await seedCategory();

            await request(app).delete(`/categories/${id}`);

            expect(await Category.findById(id)).not.toBeNull();
        });
    });
});
