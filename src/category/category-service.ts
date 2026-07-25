import CategoryModel from "./category-model";
import { Category } from "./category-types";
import { Logger } from "winston";

export class CategoryService {
    constructor(private logger: Logger) {}

    async create(category: Category) {
        this.logger.info("Persisting category to the database", {
            name: category.name,
        });

        const newCategory = new CategoryModel(category);
        const savedCategory = await newCategory.save();

        this.logger.info("Category persisted to the database", {
            id: savedCategory._id,
        });

        return savedCategory;
    }

    async findAll() {
        return await CategoryModel.find();
    }

    async findById(id: string) {
        return await CategoryModel.findById(id);
    }

    async update(id: string, category: Partial<Category>) {
        this.logger.info("Updating category in the database", { id });

        return await CategoryModel.findByIdAndUpdate(
            id,
            { $set: category },
            { returnDocument: "after" },
        );
    }

    async deleteById(id: string) {
        this.logger.info("Deleting category from the database", { id });

        return await CategoryModel.findByIdAndDelete(id);
    }
}
