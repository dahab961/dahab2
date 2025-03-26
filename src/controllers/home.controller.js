const GoogleSheetsApi = require("../services/googleSheetsApi");
const { INVALID_CATEGORY_ID, MISSING_CATEGORY_ID, INVALID_ORDER_ID } = require("../common/constants");



const home = (request, seo, reply) => {
    const cards = [
        { link: "/materials", img: "/images/materials.webp", title: "חומרי גלם" },
        { link: "/products", img: "/images/product.webp", title: "מוצרים" },
        { link: "/orders", img: "/images/image.webp", title: "הזמנות" },
        { link: "/customers", img: "/images/customers.png", title: "לקוחות" }
    ];

    return defaultRes(request, seo, reply, "index", { cards });
};

const customers = (request, seo, reply) => defaultRes(request, seo, reply, "customers");
const addOrder = (request, seo, reply) => defaultRes(request, seo, reply, "orders/add");

const materials = (request, seo, reply) => defaultRes(request, seo, reply, "materials");

const orders = (request, seo, reply) => defaultRes(request, seo, reply, "orders/index");

const categories = async (req, seo, res) => {
    let error = null;
    let categories = [];
    try {
        categories = await GoogleSheetsApi.GoogleSheetsApi.getCategories();
    } catch (err) {
        error = err.message;
        console.error(err);
    }
    return res.view("/pages/products/categories.hbs", {
        categories,
        error,
        seo,
    });
};

const order = async (req, seo, res) => {
    return res.view("/pages/orders/order-details.hbs", {
        seo,
        orderId: req.params.orderId,
    });
};


const products = async (req, seo, res) => {
    let categoryId = req.params.categoryId;
    let searchQuery = req.query?.search || "";
    let error = null;
    let category = null;

    try {
        if (!categoryId) {
            throw new CustomException(MISSING_CATEGORY_ID);
        }

        category = (await GoogleSheetsApi.GoogleSheetsApi.getCategoryById(categoryId)) || null;

        if (!category) {
            throw new CustomException(INVALID_CATEGORY_ID);
        }
    } catch (err) {
        if (err instanceof CustomException) {
            error = err.message;
        } else {
            error = "אירעה שגיאה";
        }
        console.error(err);
    }

    return res.view("/pages/products/products.hbs", {
        category,
        searchQuery,
        error,
        seo,
    });
};

function defaultRes(request, seo, reply, name, params = {}) {
    return reply.view(`/pages/${name}.hbs`, { seo, ...params });
}

class CustomException extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = "CustomException";
        this.statusCode = statusCode;
    }
}

module.exports = {
    home,
    orders,
    categories,
    products,
    customers,
    materials,
    order,
    addOrder,
    CustomException,
};
