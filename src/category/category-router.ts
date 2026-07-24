import express from "express";
import categoryValidator from "./category-validator";
import categoryUpdateValidator from "./category-update-validator";
import categoryIdValidator from "./category-id-validator";
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

router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    categoryUpdateValidator,
    asyncWrapper(categoryController.update.bind(categoryController)),
);

router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    categoryIdValidator,
    asyncWrapper(categoryController.destroy.bind(categoryController)),
);

router.get(
    "/",
    asyncWrapper(categoryController.index.bind(categoryController)),
);

router.get(
    "/:id",
    categoryIdValidator,
    asyncWrapper(categoryController.getOne.bind(categoryController)),
);

export default router;
