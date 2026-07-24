import createHttpError from "http-errors";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types";

export const canAccess = (roles: string[] = []) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const role = req.auth?.role;

        if (role && roles.includes(role)) {
            return next();
        }

        return next(
            createHttpError(
                403,
                "You don't have permission to perform this action",
            ),
        );
    };
};
