import { body, param } from "express-validator";

export default [
    param("productId")
        .exists()
        .withMessage("Product id is required")
        .isMongoId()
        .withMessage("Product id should be a valid id"),
    body("name")
        .exists()
        .withMessage("Product name is required")
        .isString()
        .withMessage("Product name should be a string"),
    body("description").exists().withMessage("Description is required"),
    body("priceConfiguration")
        .exists()
        .withMessage("Price configuration is required"),
    body("attributes").exists().withMessage("Attributes field is required"),
    body("tenantId").exists().withMessage("Tenant id field is required"),
    body("categoryId")
        .exists()
        .withMessage("Category id field is required")
        .isMongoId()
        .withMessage("Category id should be a valid id"),
];
