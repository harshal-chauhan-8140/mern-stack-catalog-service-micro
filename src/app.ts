import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import config from "config";

const app = express();

app.get("/", (req: Request, res: Response) => {
    res.json({ port: config.get("server.port") });
});

app.use(globalErrorHandler);

export default app;
