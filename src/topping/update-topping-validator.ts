import { body, param } from "express-validator";

export default [
    param("toppingId")
        .exists()
        .withMessage("Topping id is required")
        .isMongoId()
        .withMessage("Topping id should be a valid id"),
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
];
