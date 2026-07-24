import type { RequestHandler, Request, Response, NextFunction } from "express";
import express from "express";
import categoryValidator from "./category-validator";
import { CategoryController } from "./category-controller";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import createHttpError from "http-errors";

const asyncWrapper = (requestHandler: RequestHandler) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            if (err instanceof Error) {
                return next(createHttpError(500, err.message));
            }

            return next(createHttpError(500, "Internal server error."));
        });
    };
};

const router = express.Router();

const categoryService = new CategoryService(logger);
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    categoryValidator,
    asyncWrapper(categoryController.create.bind(categoryController)),
);

export default router;
