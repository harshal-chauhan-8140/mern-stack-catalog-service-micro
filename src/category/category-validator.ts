import { body } from "express-validator";

export default [
    body("name")
        .exists()
        .withMessage("category name is required")
        .isString()
        .withMessage("category name should be a string"),
    body("priceConfiguration")
        .exists()
        .withMessage("price configuration is required"),
    body("priceConfiguration.*.priceType")
        .exists()
        .withMessage("price type is required")
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
    body("attributes").exists().withMessage("attributes is required."),
];
