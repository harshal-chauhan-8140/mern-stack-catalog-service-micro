import { v2 as cloudinary } from "cloudinary";
import { config } from "../../src/config";

export interface CloudinaryAsset {
    public_id: string;
    bytes: number;
    width: number;
    height: number;
    format: string;
    secure_url: string;
}

function client() {
    cloudinary.config({
        cloud_name: config.CLOUDINARY_CLOUD_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
        secure: true,
    });

    return cloudinary;
}

export function testFolder(): string {
    const folder = config.CLOUDINARY_FOLDER;

    if (!folder.split("/").includes("test")) {
        throw new Error(
            `Refusing to run storage tests against "${folder}" — not a test folder.`,
        );
    }

    return folder;
}

export async function findAsset(
    imageName: string,
): Promise<CloudinaryAsset | null> {
    try {
        return (await client().api.resource(
            `${testFolder()}/${imageName}`,
        )) as unknown as CloudinaryAsset;
    } catch {
        return null;
    }
}

export async function listAssets(): Promise<string[]> {
    const response = await client().api.resources({
        type: "upload",
        prefix: `${testFolder()}/`,
        max_results: 500,
    });

    return (response.resources as { public_id: string }[]).map(
        (resource) => resource.public_id,
    );
}

export async function uploadAsset(imageName: string, data: Buffer) {
    await new Promise<void>((resolve, reject) => {
        const uploadStream = client().uploader.upload_stream(
            { public_id: `${testFolder()}/${imageName}` },
            (error) => (error ? reject(error) : resolve()),
        );

        uploadStream.end(data);
    });
}

export async function clearTestFolder() {
    await client().api.delete_resources_by_prefix(`${testFolder()}/`);
}
