const controller = require("../controllers/home.controller");
const seo = require("@fastify/formbody");

/**
 * Registers routes for the application.
 * @param {import('fastify').FastifyInstance} app - The Fastify instance.
 */
async function renderRoutes(app) {
    app.get("/", (request, reply) => controller.home(request, seo, reply));

    app.get("/products", async (req, res) =>
        await controller.categories(req, seo, res));

    app.get("/orders/add/", async (req, reply) =>
        await controller.addOrder(req, seo, reply));

    app.get("/orders", (req, reply) =>
        controller.orders(req, seo, reply));

    app.get("/orders/:orderId", async (req, reply) =>
        await controller.order(req, seo, reply));

    app.get("/materials", (req, reply) =>
        controller.materials(req, seo, reply));

    app.get("/customers", async (req, reply) =>
        await controller.customers(req, seo, reply));

    app.get("/products/:categoryId", async (req, reply) =>
        await controller.products(req, seo, reply));
}

module.exports = renderRoutes;
