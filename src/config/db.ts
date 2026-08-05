import mongoose from "mongoose";
import { config } from ".";

export const initDb = async () => {
    await mongoose.connect(config.DB_URL);
};
