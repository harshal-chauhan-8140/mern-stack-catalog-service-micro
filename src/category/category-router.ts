import express from "express";
import categoryValidator from "./category-validator";
import { CategoryController } from "./category-controller";
import { CategoryService } from "./category-service";
import logger from "../config/logger";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../config/constants";

const router = express.Router();

const categoryService = new CategoryService(logger);
const categoryController = new CategoryController(categoryService, logger);

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    categoryValidator,
    asyncWrapper(categoryController.create.bind(categoryController)),
);

export default router;
