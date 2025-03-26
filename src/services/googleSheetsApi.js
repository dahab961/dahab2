const { google } = require("googleapis");
const Customer = require("../models/customer.js");
const dotenv = require("dotenv");
const Joi = require('joi');
const { DEFAULT_PRODUCT_IMG, UNDEFINED_ENV_VARIABLES, SHEET_NAMES } = require('../common/constants.js');

const orderSchema = Joi.object({
  orderNumber: Joi.string().required().messages({
    'string.base': 'מספר הזמנה חייב להיות מחרוזת',
    'any.required': 'מספר הזמנה הוא שדה חובה'
  }),
  customerNO: Joi.string().required().messages({
    'string.base': 'מספר לקוח חייב להיות מחרוזת',
    'any.required': 'מספר לקוח הוא שדה חובה'
  }),
  orderDate: Joi.string().isoDate().optional().messages({
    'string.isoDate': 'תאריך הזמנה חייב להיות בפורמט ISO 8601'
  }),
  status: Joi.string()
    .valid('חדשה', 'בהכנה', 'הושלמה')
    .optional()
    .messages({
      'any.only': 'הסטטוס חייב להיות אחד מהערכים: pending, completed, shipped, cancelled'
    }),
  image: Joi.string().uri().optional().allow(null).messages({
    'string.uri': 'קישור התמונה חייב להיות כתובת URL תקפה'
  }),
  notes: Joi.alternatives().try(Joi.string().allow(null, '')).optional(),
  orderDetails: Joi.alternatives().try(Joi.string().allow(null, '')).optional()
});

const ordersSchema = Joi.array().items(orderSchema);

dotenv.config();

if (!process.env.GOOGLE_CONFIG) {
  throw new Error(UNDEFINED_ENV_VARIABLES);
}

const GOOGLE_CONFIG = JSON.parse(process.env.GOOGLE_CONFIG);

const auth = new google.auth.GoogleAuth({
  credentials: {
    project_id: GOOGLE_CONFIG.project_id,
    private_key: GOOGLE_CONFIG.private_key.replace(/\\n/g, "\n"),
    client_email: GOOGLE_CONFIG.client_email,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = GOOGLE_CONFIG.sheet_id;

const GoogleSheetsApi = {
  async getCategories() {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAMES.CATEGORIES,
    });
    let data = this.getData({ values: response.data.values || undefined }) || [];
    return data.map((category) => ({
      code: category[0],
      name: category[1],
      link: category[2],
      image: category[3],
    }));
  },

  async getCustomers() {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAMES.CUSTOMERS,
    });
    let data = this.getData({ values: response.data.values || undefined }) || [];

    return data.map((customer) => Customer.fromGSheet(customer));
  },

  addOrder(order) {
    try {
      const values = [
        [
          order.orderNumber,
          order.customerNO,
          order.folderLink,
          order?.orderDate ?? '',
          order.status || '',
          order.image || '',
          order.notes || '',
          order.orderDetails = order.orderDetails || ''
        ]
      ];

      const response = sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAMES.ORDERS}!A:H`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values },
      });

      return { success: true, message: 'Order added successfully', response };
    } catch (error) {
      console.error('Error adding order:', error);
      return { success: false, message: 'Failed to add order', error };
    }
  },

  async saveCategory(category) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAMES.CATEGORIES,
      valueInputOption: "RAW",
      requestBody: {
        values: [[category.code, category.name, category.link, category.image || ""]],
      },
    });

    return category;
  },

  async getCategoryById(categoryId) {
    const categories = await this.getCategories();
    return categories.find((category) => category.code === categoryId);
  },

  async getProducts(categoryId) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAMES.PRODUCTS,
    });

    let data = this.getData({ values: response.data.values || undefined }) || []; // Skip the header row

    if (categoryId)
      data.filter((product) => !categoryId || product[2] === categoryId);

    const products = data
      .map((product) => ({
        id: product[0],
        name: product[1],
        categoryId: product[2],
        image: product[4] || DEFAULT_PRODUCT_IMG,
      }));
    return products;
  },

  async getOrderById(orderId) {
    const orders = await this.getOrders();
    return orders.find((order) => order.orderNumber === orderId) || null;
  },
  async getOrders() {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAMES.ORDERS,
    });

    let data = this.getData({ values: response.data.values || undefined }) || [];

    const orders = data.map((order) => ({
      orderNumber: order[0],
      customerNO: order[1],
      folderLink: order[2],
      orderDate: order[3] ? new Date(new Date(order[3]).getTime() + 2 * 60 * 60 * 1000).toISOString() : undefined,
      status: order[4],
      image: order.length > 5 ? order[5] : undefined,
      notes: order.length > 6 ? order[6] : undefined,
    }));

    return orders;
  },

  getData(records) {
    return records.values?.slice(1).filter((data) => data[0] && data[0] !== '') || [];
  },

  async getMaterials() {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAMES.MATERIALS,
    });
    let data = this.getData({ values: response.data.values || undefined }) || []; // Skip the header row

    const materials = data.map((material) => ({
      code: material[0],
      name: material[1],
      imageLink: material.length > 2 ? material[2] : undefined,
    }));
    return materials;
  },
};

class CategoryService {
  getAllCategories = async () => await GoogleSheetsApi.getCategories();

  getCategoryById = async (categoryId) =>
    await GoogleSheetsApi.getCategoryById(categoryId);

  async createCategory(code, name, link, image) {
    const newCategory = { code, name, link, image };
    await GoogleSheetsApi.saveCategory(newCategory);
    return newCategory;
  }
}

class ProductService {
  getAll = async (categoryId) => await GoogleSheetsApi.getProducts();

  getById = async (productId) => {
    if (!productId)
      return null;
    const products = await this.getAll();
    return products.find((product) => product.id === productId);
  }
}

module.exports = {
  GoogleSheetsApi,
  CategoryService,
  ProductService,
  ordersSchema,
  orderSchema
};
