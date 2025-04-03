const GoogleSheetsApi = require("../services/googleSheetsApi");
const Order = require("../models/order.js")
const { orderSchema } = require("../services/googleSheetsApi.js")
const Customer = require("../models/customer.js")
const DEFAULT_MATERIAL_IMG = "/images/material.webp";
const DEFAULT_PRODUCT_IMG = "/images/product.webp";

const getOrderById = async (req, res) => {
    const { orderId } = req.params;
    let order = null;
    let status = 200;
    let error = null;

    try {
        if (!orderId) throw new Error("Invalid order ID");

        order = await GoogleSheetsApi.GoogleSheetsApi.getOrderById(orderId);
        if (!order) throw new Error("Order not found");

    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching order:", err);
    }

    return res.status(status).send(error ? { error } : { order });
};

const products = async (req, res) => {
    const { categoryId } = req.params;
    let products = [];
    let category = null;
    let status = 200;
    let error = null;

    try {
        if (!categoryId) throw new Error("Invalid category ID");

        const categoryData = await GoogleSheetsApi.GoogleSheetsApi.getCategoryById(categoryId);
        if (!categoryData) throw new Error("Category not found");

        category = {
            code: categoryData.code,
            name: categoryData.name,
            link: '',
            image: categoryData.image || DEFAULT_PRODUCT_IMG,
        };

        products = (await GoogleSheetsApi.GoogleSheetsApi.getProducts(categoryId)) || [];
    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching products:", err);
    }

    return res.status(status).send(error ? { error } : { category, products });
};


const categories = async (req, res) => {
    let categories = [];
    let status = 200;
    let error = null;

    try {
        categories = (await GoogleSheetsApi.GoogleSheetsApi.getCategories()) || [];
    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching categories:", err);
    }

    return res.status(status).send(error ? { error } : { categories });
};


const allProductsAndMaterials = async (req, res) => {
    let products = [];
    let materials = [];
    let status = 200;
    let error = null;
    try {
        products = (await GoogleSheetsApi.GoogleSheetsApi.getProducts()) || [];
        materials = (await GoogleSheetsApi.GoogleSheetsApi.getMaterials()) || [];
    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching products:", err);
    }

    return res.status(status).send(error ? { error } : { products, materials });
};


const addOrder = (req, reply) => {
    try {
        const { error, value } = orderSchema.validate(req.body.order, { abortEarly: false });

        if (error) {
            return reply.status(400).send({
                message: 'שגיאת אימות',
                errors: error.details.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }
        GoogleSheetsApi.GoogleSheetsApi.addOrder(req.body.order);
        return reply.status(200).send({ message: 'הזמנה נוספה בהצלחה' });
    } catch (e) {
        return reply.status(500).send({
            message: e.message
        })
    };
}

const orders = async (req, res) => {
    let orders = [];
    let status = 200;
    let error = null;

    try {
        orders = (await GoogleSheetsApi.GoogleSheetsApi.getOrders()) || [];
    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching orders:", err);
    }

    return res.status(status).send(error ? { error } : { orders });
};

const materials = async (req, res) => {
    let materials = [];
    let status = 200;
    let error = null;

    try {
        materials = (await GoogleSheetsApi.GoogleSheetsApi.getMaterials()) || [];
    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching materials:", err);
    }

    return res.status(status).send(error ? { materials, error } : { materials });
};

const customers = async (req, res) => {
    let customers = [];
    let status = 200;
    let error = null;

    try {
        customers = (await GoogleSheetsApi.GoogleSheetsApi.getCustomers()) || [];
    } catch (err) {
        error = err.message || "An unexpected error occurred";
        status = 500;
        console.error("Error fetching customers:", err);
    }

    return res.status(status).send(error ? { error } : { customers });
};

module.exports = {
    getOrderById,
    products,
    orders,
    materials,
    addOrder,
    customers,
    categories,
    allProductsAndMaterials
};
