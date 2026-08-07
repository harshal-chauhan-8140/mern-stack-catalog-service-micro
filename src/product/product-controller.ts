import type { NextFunction, Request, Response } from "express";
import type { UploadedFile } from "express-fileupload";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import mongoose, { HydratedDocument } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "winston";
import { ProductService } from "./product-service";
import { Product, ProductEvents, ProductRequestBody } from "./product-types";
import { FileStorage } from "../common/types/storage";
import { AuthRequest } from "../common/types";
import { Roles } from "../config/constants";
import { MessageProducerBroker } from "../common/types/broker";
import { config } from "../config";

export class ProductController {
    constructor(
        private productService: ProductService,
        private storage: FileStorage,
        private broker: MessageProducerBroker,
        private logger: Logger,
    ) {}

    async create(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const body = req.body as ProductRequestBody;
        const image = req.files!.image as UploadedFile;
        const imageName = uuidv4();

        this.logger.info("Request to create a product", { name: body.name });

        await this.storage.upload({
            filename: imageName,
            fileData: image.data,
        });

        const product = this.toProduct(body, imageName);
        const newProduct = await this.productService.create(product);

        this.logger.info("Product has been created", { id: newProduct._id });

        await this.sendProductEvent(ProductEvents.PRODUCT_CREATE, newProduct);

        res.status(201).json({ id: newProduct._id });
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return next(createHttpError(400, result.array()[0].msg as string));
        }

        const { productId } = req.params;

        const product = await this.productService.findById(productId);
        if (!product) {
            return next(createHttpError(404, "Product not found"));
        }

        const auth = (req as AuthRequest).auth;
        if (auth?.role !== Roles.ADMIN && product.tenantId !== auth?.tenant) {
            return next(
                createHttpError(
                    403,
                    "You are not allowed to access this product",
                ),
            );
        }

        let imageName = product.image;

        if (req.files?.image) {
            const image = req.files.image as UploadedFile;
            const oldImage = product.image;

            imageName = uuidv4();

            await this.storage.upload({
                filename: imageName,
                fileData: image.data,
            });

            await this.storage.delete(oldImage);
        }

        const body = req.body as ProductRequestBody;
        const updatedProduct = await this.productService.update(
            productId,
            this.toProduct(body, imageName),
        );

        if (!updatedProduct) {
            return next(createHttpError(404, "Product not found"));
        }

        this.logger.info("Product has been updated", { id: productId });

        await this.sendProductEvent(
            ProductEvents.PRODUCT_UPDATE,
            updatedProduct,
        );

        res.json({ id: updatedProduct._id });
    }

    private async sendProductEvent(
        event_type: ProductEvents,
        product: HydratedDocument<Product>,
    ) {
        await this.broker.sendMessage(
            config.BROKER_TOPIC_PRODUCT,
            JSON.stringify({
                event_type,
                data: {
                    id: product._id,
                    priceConfiguration: product.toJSON().priceConfiguration,
                },
            }),
        );
    }

    private toProduct(body: ProductRequestBody, image: string): Product {
        return {
            name: body.name,
            description: body.description,
            priceConfiguration: this.parseJson(
                body.priceConfiguration,
                "priceConfiguration",
            ) as Product["priceConfiguration"],
            attributes: this.parseJson(
                body.attributes,
                "attributes",
            ) as Product["attributes"],
            tenantId: body.tenantId,
            categoryId: new mongoose.Types.ObjectId(body.categoryId),
            isPublish: body.isPublish === "true",
            image,
        };
    }

    private parseJson(value: string, field: string): unknown {
        try {
            return JSON.parse(value);
        } catch {
            throw createHttpError(400, `${field} should be a valid JSON`);
        }
    }
}
