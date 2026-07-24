import express, { Request, Response, NextFunction } from "express";
import categoryValidator from "./category-validator";
import { CategoryController } from "./category-controller";

const router = express.Router();

const categoryController = new CategoryController();

router.post(
    "/",
    categoryValidator,
    (req: Request, res: Response, next: NextFunction) => {
        categoryController.create(req, res).catch(next);
    },
);

export default router;
