import express from "express";
import fileUpload from "express-fileupload";
import createHttpError from "http-errors";
import logger from "../config/logger";
import { asyncWrapper } from "../utils/wrapper";
import authenticate from "../common/middlewares/authenticate";
import { canAccess } from "../common/middlewares/canAccess";
import { Roles } from "../config/constants";
import { CloudinaryStorage } from "../common/services/CloudinaryStorage";
import { ToppingController } from "./topping-controller";
import { ToppingService } from "./topping-service";
import createToppingValidator from "./create-topping-validator";
import updateToppingValidator from "./update-topping-validator";
import { createMessageProducerBroker } from "../common/factories/brokerFactory";

const router = express.Router();

const toppingService = new ToppingService(logger);
const broker = createMessageProducerBroker();
const storage = new CloudinaryStorage();
const toppingController = new ToppingController(
    toppingService,
    storage,
    broker,
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
    createToppingValidator,
    asyncWrapper(toppingController.create.bind(toppingController)),
);

router.get("/", asyncWrapper(toppingController.index.bind(toppingController)));

router.put(
    "/:toppingId",
    authenticate,
    canAccess([Roles.ADMIN, Roles.MANAGER]),
    uploadImage,
    updateToppingValidator,
    asyncWrapper(toppingController.update.bind(toppingController)),
);

export default router;
