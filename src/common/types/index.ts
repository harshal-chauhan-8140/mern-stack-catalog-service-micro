import type { Request } from "express";

export type AuthCookie = {
    accessToken: string;
};

export interface AuthRequest extends Request {
    auth?: {
        sub: string;
        role: string;
        tenant?: string;
    };
}
