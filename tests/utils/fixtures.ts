import type { Category } from "../../src/category/category-types";

export const makeCategory = (): Category => ({
    name: "Pizza",
    priceConfiguration: {
        Size: {
            priceType: "base",
            availableOptions: ["Small", "Medium", "Large"],
        },
        Crust: {
            priceType: "aditional",
            availableOptions: ["Thin", "Thick"],
        },
    },
    attributes: [
        {
            name: "isHit",
            widgetType: "switch",
            defaultValue: "No",
            availableOptions: ["Yes", "No"],
        },
        {
            name: "Spiciness",
            widgetType: "radio",
            defaultValue: "Medium",
            availableOptions: ["Less", "Medium", "Hot"],
        },
    ],
});

export const UNKNOWN_ID = "507f1f77bcf86cd799439011";
