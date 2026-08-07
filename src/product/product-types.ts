import mongoose from "mongoose";

export interface PriceConfigurationValue {
    priceType: "base" | "aditional";
    availableOptions: {
        [key: string]: number;
    };
}

export interface PriceConfiguration {
    [key: string]: PriceConfigurationValue;
}

export interface AttributeValue {
    name: string;
    value: string | number | boolean;
}

export interface Product {
    _id?: mongoose.Types.ObjectId;
    name: string;
    description: string;
    priceConfiguration: PriceConfiguration;
    attributes: AttributeValue[];
    tenantId: string;
    categoryId: mongoose.Types.ObjectId;
    image: string;
    isPublish?: boolean;
}

export enum ProductEvents {
    PRODUCT_CREATE = "PRODUCT_CREATE",
    PRODUCT_UPDATE = "PRODUCT_UPDATE",
    PRODUCT_DELETE = "PRODUCT_DELETE",
}

export interface ProductRequestBody {
    name: string;
    description: string;
    priceConfiguration: string;
    attributes: string;
    tenantId: string;
    categoryId: string;
    isPublish?: string;
}
