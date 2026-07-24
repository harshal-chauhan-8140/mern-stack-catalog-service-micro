import { param } from "express-validator";

export default [
    param("id")
        .exists()
        .withMessage("category id is required")
        .isMongoId()
        .withMessage("category id is invalid"),
];
