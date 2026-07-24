import request from "supertest";
import config from "config";

/**
 * Logs into the running auth-service and returns its access token.
 *
 * The catalog service verifies tokens against that service's JWKS endpoint, so
 * the token has to be signed by it — a hand-made one won't pass `authenticate`.
 * This means auth-service (and its database) must be up for these tests.
 */
export async function getAccessToken(): Promise<string> {
    const serviceUri = config.get("auth.serviceUri") as string;
    const credentials = config.get("auth.testUser") as {
        email: string;
        password: string;
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

    // superagent types set-cookie as a string, but it is an array at runtime.
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
