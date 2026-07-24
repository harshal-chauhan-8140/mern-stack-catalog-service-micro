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
}
