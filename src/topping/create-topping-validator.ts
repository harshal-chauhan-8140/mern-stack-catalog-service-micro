import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("Topping name is required")
        .isString()
        .withMessage("Topping name should be a string"),
    body("price")
        .exists()
        .withMessage("Price is required")
        .isFloat({ min: 0 })
        .withMessage("Price should be a positive number"),
    body("tenantId").exists().withMessage("Tenant id field is required"),
    body("image").custom((value, { req }) => {
        const files = (req as { files?: Record<string, unknown> }).files;
        if (!files?.image) {
            throw new Error("Topping image is required");
        }
        return true;
    }),
];
