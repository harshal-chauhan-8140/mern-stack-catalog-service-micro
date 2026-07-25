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

export const CATEGORY_ID = "6597d1b6f7c1b2a3d4e5f601";

export const makeProductFields = (): Record<string, string> => ({
    name: "Margherita",
    description: "Classic cheese pizza",
    priceConfiguration: JSON.stringify({
        Size: {
            priceType: "base",
            availableOptions: { Small: 400, Medium: 500, Large: 600 },
        },
    }),
    attributes: JSON.stringify([
        { name: "isHit", value: true },
        { name: "Spiciness", value: "Medium" },
    ]),
    tenantId: "1",
    categoryId: CATEGORY_ID,
    isPublish: "true",
});

export const IMAGE_BUFFER = Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
        "1f15c4890000000a49444154789c6360000002000100ffff0300000600" +
        "0557bfabd40000000049454e44ae426082",
    "hex",
);
