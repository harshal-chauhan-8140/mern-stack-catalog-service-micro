import { v2 as cloudinary } from "cloudinary";
import config from "config";
import createHttpError from "http-errors";
import { FileData, FileStorage } from "../types/storage";

export class CloudinaryStorage implements FileStorage {
    private readonly folder: string;

    constructor() {
        cloudinary.config({
            cloud_name: config.get<string>("storageBucket.cloudName"),
            api_key: config.get<string>("storageBucket.apiKey"),
            api_secret: config.get<string>("storageBucket.apiSecret"),
            secure: true,
        });

        this.folder = config.get<string>("storageBucket.folder");
    }

    async upload(data: FileData): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { public_id: this.publicId(data.filename) },
                (error) => {
                    if (error) {
                        return reject(
                            createHttpError(
                                500,
                                "Failed to upload the image to Cloudinary",
                            ),
                        );
                    }
                    resolve();
                },
            );

            uploadStream.end(data.fileData);
        });
    }

    async delete(filename: string): Promise<void> {
        await cloudinary.uploader.destroy(this.publicId(filename));
    }

    getObjectUri(filename: string): string {
        return cloudinary.url(this.publicId(filename), { secure: true });
    }

    private publicId(filename: string): string {
        return `${this.folder}/${filename}`;
    }
}
