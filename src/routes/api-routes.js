const apiController = require("../controllers/api.controller");

async function apiRoutes(app) {
    app.get("/api/products/:categoryId", async (req, reply) =>
        await apiController.products(req, reply));

    app.get("/api/products-materials", async (req, reply) =>
        await apiController.allProductsAndMaterials(req, reply));

    app.get("/api/orders", async (req, reply) =>
        await apiController.orders(req, reply));

    app.post("/api/orders/add/", async (req, reply) =>
        await apiController.addOrder(req, reply));

    app.get("/api/orders/:orderId", async (req, reply) =>
        await apiController.getOrderById(req, reply));

    app.get("/api/materials", async (req, reply) =>
        await apiController.materials(req, reply));

    app.get("/api/customers", async (req, reply) =>
        await apiController.customers(req, reply));
}

module.exports = apiRoutes;