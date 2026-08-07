import type { NextFunction, Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";
import { ToppingService } from "./topping-service";
import { Topping, ToppingEvents, ToppingRequestBody } from "./topping-types";
import { FileStorage } from "../common/types/storage";
import { AuthRequest } from "../common/types";
import { Roles } from "../config/constants";
import { MessageProducerBroker } from "../common/types/broker";
import { config } from "../config";

export class ToppingController {
    constructor(
        private toppingService: ToppingService,
        private storage: FileStorage,
        private broker: MessageProducerBroker,
        private logger: Logger,
    ) {}

    async create(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const body = req.body as ToppingRequestBody;
        const image = req.files!.image as UploadedFile;
        const imageName = uuidv4();

        this.logger.info("Request to create a topping", { name: body.name });

        await this.storage.upload({
            filename: imageName,
            fileData: image.data,
        });

        const newTopping = await this.toppingService.create(
            this.toTopping(body, imageName),
        );

        this.logger.info("Topping has been created", { id: newTopping._id });

        await this.sendToppingEvent(ToppingEvents.TOPPING_CREATE, newTopping);

        res.status(201).json({ id: newTopping._id });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { toppingId } = req.params;

        const topping = await this.toppingService.findById(toppingId);
        if (!topping) {
            return next(createHttpError(404, "Topping not found"));
        }

        const auth = (req as AuthRequest).auth;
        if (auth?.role !== Roles.ADMIN && topping.tenantId !== auth?.tenant) {
            return next(
                createHttpError(
                    403,
                    "You are not allowed to access this topping",
                ),
            );
        }

        let imageName = topping.image;

        if (req.files?.image) {
            const image = req.files.image as UploadedFile;
            const oldImage = topping.image;

            imageName = uuidv4();

            await this.storage.upload({
                filename: imageName,
                fileData: image.data,
            });

            await this.storage.delete(oldImage);
        }

        const body = req.body as ToppingRequestBody;
        const updatedTopping = await this.toppingService.update(
            toppingId,
            this.toTopping(body, imageName),
        );

        if (!updatedTopping) {
            return next(createHttpError(404, "Topping not found"));
        }

        this.logger.info("Topping has been updated", { id: toppingId });

        await this.sendToppingEvent(
            ToppingEvents.TOPPING_UPDATE,
            updatedTopping,
        );

        res.json({ id: updatedTopping._id });
    }

    async index(req: Request, res: Response) {
        const toppings = await this.toppingService.getAll(
            req.query.tenantId as string,
        );

        res.json(
            toppings.map((topping) => ({
                id: topping._id,
                name: topping.name,
                price: topping.price,
                tenantId: topping.tenantId,
                image: this.storage.getObjectUri(topping.image),
            })),
        );
    }

    private async sendToppingEvent(
        event_type: ToppingEvents,
        topping: Topping,
    ) {
        await this.broker.sendMessage(
            config.BROKER_TOPIC_TOPPING,
            JSON.stringify({
                event_type,
                data: {
                    id: topping._id,
                    price: topping.price,
                    tenantId: topping.tenantId,
                },
            }),
        );
    }

    private toTopping(body: ToppingRequestBody, image: string): Topping {
        return {
            name: body.name,
            price: Number(body.price),
            tenantId: body.tenantId,
            image,
        };
    }
}
