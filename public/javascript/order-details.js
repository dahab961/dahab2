'use strict';

import { show, hide, isHiddenElement } from './funcs.js';
import { STATUSES } from './constants.js';

class Product {
    constructor(code, name, quantity = 1) {
        this.code = code;
        this.name = name;
        this.quantity = quantity;
    }
}

class Order {
    constructor(orderId) {
        this.orderId = orderId;
        this.customerNO = '';
        this.status = '';
        this.notes = '';
        this.products = [];
    }

    async fetchOrderDetails() {
        try {
            show(loadingElem);
            const response = await fetch(`/api/orders/${this.orderId}`);
            if (!response.ok) throw new Error("Error fetching order");

            const data = await response.json();
            this.customerNO = data.order.customerNO;
            this.status = data.order.status;
            this.notes = data.order.notes;
            this.products = data.order?.products?.map(p => new Product(p.code, p.name, p.quantity));

            this.updateUI();
        } catch (error) {
            console.error("Error fetching order:", error);
            orderContainer.innerHTML = "<p style='color: red;'>אופס משהו השתבש נא לנסות, מאוחר יותר</p>";
        } finally {
            hide(loadingElem);
        }
    }

    updateUI() {
        document.getElementById("customer-number").textContent = this.customerNO;
        document.getElementById("order-status").textContent = this.status;
        document.getElementById("notes").textContent = this.notes;

        this.populateStatusDropdown();
        this.renderProducts();
    }

    populateStatusDropdown() {
        const statusDropdown = document.getElementById("status-dropdown");
        statusDropdown.innerHTML = '';
        STATUSES.forEach(status => {
            const option = document.createElement("option");
            option.value = status;
            option.textContent = status;
            if (status === this.status) option.selected = true;
            statusDropdown.appendChild(option);
        });
    }

    renderProducts() {
        const productList = document.querySelector("#order ul.list-group");
        productList.innerHTML = '';
        this.products?.forEach(product => {
            const listItem = document.createElement("li");
            listItem.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            listItem.innerHTML = `
                <span class="fw-semibold">${product.name} - ${product.quantity}</span>
                <button class="btn btn-danger btn-sm" onclick="removeProduct('${this.orderId}', '${product.code}')">
                    <i class="fa fa-trash"></i>
                </button>
            `;
            productList.appendChild(listItem);
        });
    }

    updateStatus(newStatus) {
        if (newStatus !== this.status) {
            this.status = newStatus;
            document.getElementById("order-status").textContent = newStatus;
        }
        hideStatusDropdown();
    }

    addProduct(code, name, quantity) {
        this.products.push(new Product(code, name, quantity));
        this.renderProducts();
    }

    removeProduct(code) {
        this.products = this.products.filter(p => p.code !== code);
        this.renderProducts();
    }
}
const loadingElem = document.getElementById("loading");

(function () {
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('loaded');
        const refreshBtn = document.getElementById("refresh-btn");
        const editStatusBtn = document.getElementById("edit-status-btn");
        const saveStatusBtn = document.getElementById("save-status-btn");
        const orderIdElem = document.getElementById("order-number");
        const addProductsBtn = document.getElementById("add-product");

        const orderId = orderIdElem.textContent;
        if (!orderId) {
            orderIdElem.innerHTML = "<p>מספר הזמנה לא תקין</p>";
            return;
        }
        const order = new Order(orderId);
        await order.fetchOrderDetails();

        editStatusBtn.addEventListener("click", () =>
            isHiddenElement(statusDropdownContainer) ? showStatusDropdown() : hideStatusDropdown());

        saveStatusBtn.addEventListener("click", () => {
            const newStatus = document.getElementById("status-dropdown").value;
            order.updateStatus(newStatus);
        });

        refreshBtn.addEventListener("click", async () => await order.fetchOrderDetails());

        document.getElementById("cancel-status-btn").addEventListener("click", hideStatusDropdown);

        addProductsBtn.addEventListener("click", () => {
            const productSelect = document.getElementById("product-select");
            const quantity = document.getElementById("product-quantity").value;
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            order.addProduct(selectedOption.value, selectedOption.text, quantity);
        });

        function showStatusDropdown() {
            statusDropdown.value = order.status;
            statusDropdownContainer.classList.remove("d-none");
            orderStatusElem.classList.add("d-none");
            editStatusBtn.classList.add("d-none");
        }

        function hideStatusDropdown() {
            statusDropdownContainer.classList.add("d-none");
            orderStatusElem.classList.remove("d-none");
            orderStatusElem.textContent = order.status;
            editStatusBtn.classList.remove("d-none");
        }
    })
})();
