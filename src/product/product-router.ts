import express from "express";
import fileUpload from "express-fileupload";
import createHttpError from "http-errors";
import logger from "../config/logger";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../config/constants";
import { CloudinaryStorage } from "../common/services/CloudinaryStorage";
import { ProductController } from "./product-controller";
import { ProductService } from "./product-service";
import createProductValidator from "./create-product-validator";
import updateProductValidator from "./update-product-validator";

const router = express.Router();

const productService = new ProductService(logger);
const storage = new CloudinaryStorage();
const productController = new ProductController(
    productService,
    storage,
    logger,
);

const uploadImage = fileUpload({
    limits: { fileSize: 500 * 1024 },
    abortOnLimit: true,
    limitHandler: (req, res, next) => {
        next(createHttpError(400, "File size exceeds the limit"));
    },
});

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    uploadImage,
    createProductValidator,
    asyncWrapper(productController.create.bind(productController)),
);

router.put(
    "/:productId",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    uploadImage,
    updateProductValidator,
    asyncWrapper(productController.update.bind(productController)),
);

export default router;
