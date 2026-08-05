import { v2 as cloudinary } from "cloudinary";
import { config } from "../../config";
import createHttpError from "http-errors";
import { FileData, FileStorage } from "../types/storage";

export class CloudinaryStorage implements FileStorage {
    private readonly folder: string;

    constructor() {
        cloudinary.config({
            cloud_name: config.CLOUDINARY_CLOUD_NAME,
            api_key: config.CLOUDINARY_API_KEY,
            api_secret: config.CLOUDINARY_API_SECRET,
            secure: true,
        });

        this.folder = config.CLOUDINARY_FOLDER;
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
