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
            const validKeys = ["base", "additional"];
            if (!validKeys.includes(value)) {
                throw new Error(
                    `${value} is invalid attirbute for priceType field. possible values are [${validKeys.join(
                        ",",
                    )}]`,
                );
            }
        }),
    body("attributes").exists().withMessage("attributes is required."),
];
