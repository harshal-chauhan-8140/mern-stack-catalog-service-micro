import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { Category, PriceConfiguration } from "./category-types";
import { CategoryService } from "./category-service";
import { Logger } from "winston";

export class CategoryController {
    constructor(
        private categoryService: CategoryService,
        private logger: Logger,
    ) {}

    async create(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { name, priceConfiguration, attributes } = req.body as Category;

        this.logger.info("Request to create a category", { name });

        const category = await this.categoryService.create({
            name,
            priceConfiguration,
            attributes,
        });

        this.logger.info("Category has been created", { id: category._id });

        res.status(201).json({ id: category._id });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { id } = req.params;
        const updateData = req.body as Partial<Category>;

        const existingCategory = await this.categoryService.findById(id);
        if (!existingCategory) {
            return next(createHttpError(404, "Category not found"));
        }

        // $set replaces priceConfiguration wholesale, so merge it with what is
        // already stored — otherwise updating one key drops the others.
        if (updateData.priceConfiguration) {
            const existingConfig: PriceConfiguration =
                existingCategory.priceConfiguration instanceof Map
                    ? (Object.fromEntries(
                          existingCategory.priceConfiguration,
                      ) as PriceConfiguration)
                    : existingCategory.priceConfiguration;

            updateData.priceConfiguration = {
                ...existingConfig,
                ...updateData.priceConfiguration,
            };
        }

        const updatedCategory = await this.categoryService.update(
            id,
            updateData,
        );

        this.logger.info("Category has been updated", { id });

        res.json({ id: updatedCategory?._id });
    }

    async index(req: Request, res: Response) {
        const categories = await this.categoryService.findAll();

        this.logger.info("Fetched the category list", {
            count: categories.length,
        });

        res.json(categories);
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { id } = req.params;
        const category = await this.categoryService.findById(id);

        if (!category) {
            return next(createHttpError(404, "Category not found"));
        }

        this.logger.info("Fetched a category", { id });

        res.json(category);
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { id } = req.params;
        const category = await this.categoryService.deleteById(id);

        if (!category) {
            return next(createHttpError(404, "Category not found"));
        }

        this.logger.info("Category has been deleted", { id });

        res.json({ id: category._id });
    }
}
