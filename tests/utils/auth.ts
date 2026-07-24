import request from "supertest";
import config from "config";

type TestUser = "adminUser" | "customerUser";

export async function getAccessToken(user: TestUser): Promise<string> {
    const serviceUri = config.get<string>("auth.serviceUri");
    const credentials = config.get<{ email: string; password: string }>(
        `auth.${user}`,
    );

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
