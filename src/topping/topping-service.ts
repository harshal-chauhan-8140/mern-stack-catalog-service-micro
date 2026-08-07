import ToppingModel from "./topping-model";
import { Topping } from "./topping-types";
import { Logger } from "winston";

export class ToppingService {
    constructor(private logger: Logger) {}

    async create(topping: Topping) {
        this.logger.info("Persisting topping to the database", {
            name: topping.name,
        });

        const newTopping = await ToppingModel.create(topping);

        this.logger.info("Topping persisted to the database", {
            id: newTopping._id,
        });

        return newTopping;
    }

    async findById(id: string) {
        return await ToppingModel.findById(id);
    }

    async getAll(tenantId: string) {
        return await ToppingModel.find({ tenantId });
    }

    async update(id: string, topping: Topping) {
        this.logger.info("Updating topping in the database", { id });

        return await ToppingModel.findByIdAndUpdate(
            id,
            { $set: topping },
            { returnDocument: "after" },
        );
    }
}
