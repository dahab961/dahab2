const SHEET_NAMES = {
    CATEGORIES: "קטגוריות",
    CUSTOMERS: "לקוחות",
    PRODUCTS: "מוצרים",
    MATERIALS: "חומרי גלם",
    ORDERS: "הזמנות"
};

const INVALID_CATEGORY_ID = "מזהה קטגוריה לא תקין",
    MISSING_CATEGORY_ID = "חסר מזהה קטגוריה",
    INVALID_ORDER_ID = "מזהה הזמנה לא תקין";

const DEFAULT_PRODUCT_IMG = "/images/product.jpg",
    UNDEFINED_ENV_VARIABLES = "Environment variable GOOGLE_CONFIG is not defined";

module.exports = {
    SHEET_NAMES,
    INVALID_CATEGORY_ID,
    MISSING_CATEGORY_ID,
    INVALID_ORDER_ID,
    DEFAULT_PRODUCT_IMG,
    UNDEFINED_ENV_VARIABLES
};