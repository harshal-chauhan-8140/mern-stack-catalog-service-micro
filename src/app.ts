import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";
import { config } from "./config";
import categoryRouter from "./category/category-router";
import productRouter from "./product/product-router";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
    res.json({ port: config.PORT });
});

app.use("/categories", categoryRouter);
app.use("/products", productRouter);

app.use(globalErrorHandler);

export default app;
