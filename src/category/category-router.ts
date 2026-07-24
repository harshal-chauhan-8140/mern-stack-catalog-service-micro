import express from "express";
import categoryValidator from "./category-validator";
import { CategoryController } from "./category-controller";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../common/middlewares/authenticate";

const router = express.Router();

const categoryService = new CategoryService(logger);
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    authenticate,
    categoryValidator,
    asyncWrapper(categoryController.create.bind(categoryController)),
);

export default router;
