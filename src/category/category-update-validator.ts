import { body, param } from "express-validator";

export default [
    param("id")
        .exists()
        .withMessage("category id is required")
        .isMongoId()
        .withMessage("category id is invalid"),

    body().custom((value: Record<string, unknown>) => {
        if (Object.keys(value).length === 0) {
            throw new Error("at least one field must be provided for update");
        }
        return true;
    }),

    body("name")
        .optional()
        .isString()
        .withMessage("category name should be a string")
        .trim()
        .notEmpty()
        .withMessage("category name cannot be empty"),

    body("priceConfiguration")
        .optional()
        .custom((value: unknown) => {
            if (typeof value !== "object" || value === null) {
                throw new Error("price configuration should be an object");
            }
            return true;
        }),

    body("priceConfiguration.*.priceType")
        .optional()
        .custom((value: string) => {
            const validKeys = ["base", "aditional"];
            if (!validKeys.includes(value)) {
                throw new Error(
                    `${value} is an invalid attribute for the priceType field. Possible values are [${validKeys.join(
                        ", ",
                    )}]`,
                );
            }
            return true;
        }),

    body("priceConfiguration.*.availableOptions")
        .optional()
        .isArray()
        .withMessage("available options should be an array"),

    body("attributes")
        .optional()
        .isArray()
        .withMessage("attributes should be an array"),

    body("attributes.*.name")
        .optional()
        .isString()
        .withMessage("attribute name should be a string")
        .trim()
        .notEmpty()
        .withMessage("attribute name cannot be empty"),

    body("attributes.*.widgetType")
        .optional()
        .custom((value: string) => {
            const validTypes = ["switch", "radio"];
            if (!validTypes.includes(value)) {
                throw new Error(
                    `${value} is an invalid widget type. Possible values are [${validTypes.join(
                        ", ",
                    )}]`,
                );
            }
            return true;
        }),

    body("attributes.*.defaultValue")
        .optional()
        .notEmpty()
        .withMessage("default value is required for an attribute"),

    body("attributes.*.availableOptions")
        .optional()
        .isArray()
        .withMessage("available options should be an array"),
];
