import request from "supertest";
import { requireEnv } from "../../src/config";

type TestUser = "adminUser" | "customerUser";

export async function getAccessToken(user: TestUser): Promise<string> {
    const serviceUri = requireEnv("AUTH_SERVICE_URI");
    const prefix = user === "adminUser" ? "ADMIN" : "CUSTOMER";
    const credentials = {
        email: requireEnv(`${prefix}_EMAIL`),
        password: requireEnv(`${prefix}_PASSWORD`),
    };

    let response: request.Response;
    try {
        response = await request(serviceUri)
            .post("/auth/login")
            .send(credentials);
    } catch (error) {
        throw new Error(
            `Could not reach the auth service at ${serviceUri}. ` +
                `Start it before running these tests. ` +
                `(${(error as Error).message})`,
        );
    }

    if (response.statusCode !== 200) {
        throw new Error(
            `Login as ${credentials.email} failed with ${response.statusCode}: ` +
                JSON.stringify(response.body),
        );
    }

    const cookies = (response.headers["set-cookie"] ??
        []) as unknown as string[];

    for (const cookie of cookies) {
        const match = /(?:^|;\s*)accessToken=([^;]+)/.exec(cookie);
        if (match) {
            return match[1];
        }
    }

    throw new Error("Auth service login did not set an accessToken cookie.");
}
