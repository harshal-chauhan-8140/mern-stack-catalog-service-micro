import { config as dotenvConfig } from "dotenv";
import path from "path";

dotenvConfig({
    path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`),
});

export function requireEnv(key: string): string {
    const value = process.env[key];
    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const config = {
    PORT: requireEnv("PORT"),
    NODE_ENV: requireEnv("NODE_ENV"),
    DB_URL: requireEnv("DB_URL"),
    JWKS_URI: requireEnv("JWKS_URI"),
    CLOUDINARY_CLOUD_NAME: requireEnv("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: requireEnv("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: requireEnv("CLOUDINARY_API_SECRET"),
    CLOUDINARY_FOLDER: requireEnv("CLOUDINARY_FOLDER"),
    KAFKA_BROKER: requireEnv("KAFKA_BROKER"),
    BROKER_TOPIC_PRODUCT: requireEnv("BROKER_TOPIC_PRODUCT"),
};
