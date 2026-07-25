import ProductModel from "./product-model";
import { Product } from "./product-types";
import { Logger } from "winston";

export class ProductService {
    constructor(private logger: Logger) {}

    async create(product: Product) {
        this.logger.info("Persisting product to the database", {
            name: product.name,
        });

        const newProduct = await ProductModel.create(product);

        this.logger.info("Product persisted to the database", {
            id: newProduct._id,
        });

        return newProduct;
    }

    async findById(id: string) {
        return await ProductModel.findById(id);
    }

    async update(id: string, product: Product) {
        this.logger.info("Updating product in the database", { id });

        return await ProductModel.findByIdAndUpdate(
            id,
            { $set: product },
            { returnDocument: "after" },
        );
    }
}
