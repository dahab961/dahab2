import { status, json, show, hide, HEADERS } from "./funcs.js";

document.addEventListener("DOMContentLoaded", function () {
    const searchCustomer = document.getElementById("searchCustomer");
    const orderIdInput = document.getElementById("orderId");
    const nextToStep2 = document.getElementById("nextToStep2");
    const nextToStep3 = document.getElementById("nextToStep3");
    const nextToStep4 = document.getElementById("submit-btn");
    const firstStepForm = document.getElementById("first-step-form");
    const secondStepForm = document.getElementById("second-step-form");
    const thirdStepForm = document.getElementById("third-step-form");
    const customerList = document.getElementById("customerList");
    const orderForm = document.getElementById("orderForm");
    const loading = document.getElementById("loading");
    const errorAlert = document.getElementById("error");
    const status = document.getElementById("status");
    const notes = document.getElementById("notes");
    const orderDetails = document.getElementById("orderDetails");

    const statusSelect = document.getElementById("status");

    let newOrder = {
        orderNumber: null,
        customerNO: null,
        image: null,
        orderDate: null,
        status: "חדשה",
        notes: "",

    };
    let selectedCustomer = null;
    let code = '';

    statusSelect.addEventListener("change", () => newOrder.status = this.value);


    async function loadCustomers(searchTerm = "") {
        try {
            await fetch("/api/customers", { headers: HEADERS }).then(status).then(json).then(data => {
                customerList.innerHTML = "";
                if (!data.customers || data.customers.length === 0) {
                    customerList.innerHTML = "<p class='text-muted text-center'>אין לקוחות זמינים</p>";
                    return;
                }

                const filteredCustomers = data.customers.filter(customer => {
                    const fullName = `${customer.firstName} ${customer.lastName}`;
                    const displayText = `${fullName} - ${customer.customerNO}`;
                    return displayText.toLowerCase().includes(searchTerm.toLowerCase());
                });

                if (filteredCustomers.length === 0) {
                    customerList.innerHTML = "<p class='text-muted text-center'>לא נמצאו לקוחות תואמים</p>";
                    return;
                }

                filteredCustomers.forEach(customer => {
                    const fullName = `${customer.firstName} ${customer.lastName}`;
                    const displayText = `${fullName} - ${customer.customerNO}`;

                    const customerItem = document.createElement("button");
                    customerItem.classList.add("list-group-item", "list-group-item-action");
                    customerItem.textContent = displayText;
                    customerItem.addEventListener("click", () => {
                        selectedCustomer = customer;
                        newOrder.customerNO = customer.customerNO;
                        searchCustomer.value = displayText;
                        customerList.classList.add("d-none");
                        nextToStep2.disabled = false;
                    });

                    customerList.appendChild(customerItem);
                });
            })
        } catch (error) {
            show(errorAlert);
        }
    }

    searchCustomer.addEventListener("focus", () => {
        loadCustomers();
        customerList.classList.remove("d-none");
    });

    searchCustomer.addEventListener("input", function () {
        const searchTerm = this.value;
        loadCustomers(searchTerm);
        customerList.classList.remove("d-none");
    });

    document.addEventListener("click", (event) => {
        if (!searchCustomer.contains(event.target) && !customerList.contains(event.target)) {
            customerList.classList.add("d-none");
        }
    });

    function isStep1Valid() {
        return newOrder.customerNO !== null;
    }

    function isStep2Valid() {
        return orderIdInput.value.trim() !== "";
    }

    function isStep3Valid() {
        const someRequiredField = document.getElementById("someRequiredField");
        return someRequiredField && someRequiredField.value.trim() !== "";
    }

    nextToStep2.addEventListener("click", function () {
        if (!isStep1Valid()) {
            show(errorAlert);
            return;
        }
        hide(firstStepForm);
        show(secondStepForm);

        orderIdInput.value = code = generateOrderId(selectedCustomer.firstName);

    });

    function generateOrderId(customerFirstName) {
        const now = new Date();
        return `${customerFirstName.toUpperCase()}-${now.getFullYear()}${("0" + (now.getMonth() + 1)).slice(-2)}${("0" + now.getDate()).slice(-2)}${("0" + now.getHours()).slice(-2)}${("0" + now.getMinutes()).slice(-2)}`;
    }

    nextToStep3.addEventListener("click", function () {
        if (!isStep2Valid()) {
            show(errorAlert);
            return;
        }
        hide(secondStepForm);
        show(thirdStepForm);
        nextToStep4.disabled = false;
    });

    nextToStep4.addEventListener("click", function () {
        if (!isStep3Valid()) {
            show(errorAlert);
            return;
        }
    });

    document.getElementById("prev-step4").addEventListener("click", function () {
        show(secondStepForm);
        hide(thirdStepForm);
    });

    document.getElementById("prev-step2").addEventListener("click", () => {
        show(firstStepForm);
        hide(secondStepForm);
    });
    statusSelect.addEventListener("change", () => newOrder.status = statusSelect.value);
    orderForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        newOrder.
            orderDetails = orderDetails.value || '';
        newOrder.notes = notes.value || '';
        newOrder.orderDate = new Date().toISOString();
        newOrder.orderNumber = code;
        try {
            show(loading);
            hide(errorAlert);
            await fetch('/api/orders/add/', {
                headers: HEADERS,
                method: 'POST',
                body: JSON.stringify({ order: newOrder })
            }).then(status).then((_) => alert("הזמנה נוספה בהצלחה"));
        } catch (e) {
            show(errorAlert);
        }
        hide(loading);
    });
});
