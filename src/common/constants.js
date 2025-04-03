const SPREADSHEET_GOOGLE_AUTH_SCOPE = "https://www.googleapis.com/auth/spreadsheets",
    SHEET_NAMES = {
        CATEGORIES: "קטגוריות",
        CUSTOMERS: "לקוחות",
        PRODUCTS: "מוצרים",
        MATERIALS: "חומרי גלם",
        ORDERS: "הזמנות"
    };

const STATUSES = ["חדשה", "בהכנה", "בייצור"];

const INVALID_CATEGORY_ID = "מזהה קטגוריה לא תקין",
    MISSING_CATEGORY_ID = "חסר מזהה קטגוריה",
    INVALID_ORDER_ID = "מזהה הזמנה לא תקין";

const DEFAULT_PRODUCT_IMG = "/images/product.jpg",
    UNDEFINED_ENV_VARIABLES = "Environment variable GOOGLE_CONFIG is not defined";

module.exports = {
    SHEET_NAMES,
    SPREADSHEET_GOOGLE_AUTH_SCOPE,
    INVALID_CATEGORY_ID,
    MISSING_CATEGORY_ID,
    STATUSES,
    INVALID_ORDER_ID,
    DEFAULT_PRODUCT_IMG,
    UNDEFINED_ENV_VARIABLES
};