const apiRoutes = require("./src/routes/api-routes.js");
const renderRoutes = require("./src/routes/render-routes.js");

const path = require("path");
const dotenv = require("dotenv");
const Fastify = require("fastify");


dotenv.config();

const app = Fastify({ logger: false });

// Setup our static files
app.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/",
});

// Formbody lets us parse incoming forms
app.register(require("@fastify/formbody"));

// View is a templating manager for fastify
app.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
  root: path.join(__dirname, "src/views"),
  layout: "layout.hbs",
  options: {
    partials: {
      header: "/partials/header.hbs",
      footer: "/partials/footer.hbs",
      navbar: "/partials/navbar.hbs",
      backButton: "/partials/back-button.hbs",
    },
  },
});

app.register(renderRoutes);
app.register(apiRoutes);

const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

app.setNotFoundHandler((req, reply) => {
  console.log("404");
  reply.view("/pages/404.hbs");
});

app.setErrorHandler((error, req, reply) => {
  const isDev = process.env.NODE_ENV === "development";

  const errorData = {
    message: error.message,
    error: isDev ? error : {}, // Show full error in development
  };
  return reply.view("/pages/error.hbs", errorData);
});


// Run the server and report out to the logs
app.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
