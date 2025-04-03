import { status, json, show, hide, HEADERS, formatDate, ERROR_MESSAGE } from "./funcs.js";

(function () {
    document.addEventListener("DOMContentLoaded", function () {
        const elements = getDOMElements();
        let newOrder = initializeOrder();
        let selectedCustomer = null;
        let selectedProducts = [];
        let orderCode = '';

        elements.statusSelect.addEventListener("change", () => newOrder.status = elements.statusSelect.value);
        elements.searchCustomer.addEventListener("focus", showCustomerList);
        elements.nextToStep2.addEventListener("click", moveToStep2);
        elements.nextToStep3.addEventListener("click", moveToStep3);
        elements.nextToStep4.addEventListener("click", finalizeOrder);
        elements.prevStep2.addEventListener("click", () => switchStep(elements.firstStepForm, elements.secondStepForm));
        elements.prevStep4.addEventListener("click", () => switchStep(elements.secondStepForm, elements.thirdStepForm));
        elements.orderForm.addEventListener("submit", submitOrder);
        elements.searchCustomer.addEventListener("input", async (event) =>
            await showCustomerList(event.target.value)
        );

        const categories = [
            { code: 'cat1', name: 'קטגוריה 1' },
            { code: 'cat2', name: 'קטגוריה 2' },
            { code: 'cat3', name: 'קטגוריה 3' },
        ];

        const products = [
            { id: 'prod1', name: 'מוצר 1', imageLink: '/images/product.jpg', code: 'P1', categoryCode: 'cat1' },
            { id: 'prod2', name: 'מוצר 2', imageLink: '/images/product.jpg', code: 'P2', categoryCode: 'cat2' },
            { id: 'prod3', name: 'מוצר 3', imageLink: '/images/product.jpg', code: 'P3', categoryCode: 'cat1' },
            { id: 'prod4', name: 'מוצר 4', imageLink: '/images/product.jpg', code: 'P4', categoryCode: 'cat2' },
        ];

        // Selected products (initially empty)

        // Create category filter dynamically
        const categoryFilter = document.getElementById('category-filter');
        categories.forEach(category => {
            const categoryButton = document.createElement('button');
            categoryButton.classList.add('category-btn');
            categoryButton.textContent = category.name;
            categoryButton.dataset.category = category.code;
            categoryButton.onclick = function (event) {
                event.preventDefault();
                filterProductsByCategory(category.code);
            };
            categoryFilter.appendChild(categoryButton);
        });

        // Filter products by category
        function filterProductsByCategory(categoryCode) {
            const productList = document.getElementById('product-list');
            productList.innerHTML = ''; // Clear the product list

            const filteredProducts = products.filter(product => product.categoryCode === categoryCode);

            filteredProducts.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.classList.add('product-item');
                productDiv.dataset.productId = product.id;

                const productImage = document.createElement('img');
                productImage.src = product.imageLink;
                productImage.alt = product.name;
                productImage.width = 60;
                productImage.height = 60;

                const productInfo = document.createElement('div');
                const productName = document.createElement('h3');
                productName.textContent = product.name;
                const productCode = document.createElement('p');
                productCode.textContent = product.code;

                const selectButton = document.createElement('button');
                selectButton.textContent = 'Select';
                selectButton.onclick = function (event) {
                    event.preventDefault();
                    selectProduct(product);
                };

                productInfo.appendChild(productName);
                productInfo.appendChild(productCode);
                productInfo.appendChild(selectButton);
                productDiv.appendChild(productImage);
                productDiv.appendChild(productInfo);

                productList.appendChild(productDiv);
            });
        }

        // Select a product and add it to the selected list
        function selectProduct(product) {
            if (!selectedProducts.find(p => p.id === product.id)) {
                selectedProducts.push({ ...product, quantity: 1 }); // Add selected product
                updateSelectedProducts();
            }
        }

        // Update the selected products section
        function updateSelectedProducts() {
            const selectedProductsDiv = document.getElementById('selected-products');
            const selectedProductsCount = document.getElementById('selected-products-count');
            selectedProductsCount.textContent = selectedProducts.length;

            const selectedProductsList = document.createElement('div');
            selectedProducts.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.classList.add('selected-product');

                const productName = document.createElement('h4');
                productName.textContent = product.name;

                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.onclick = function (event) {
                    event.preventDefault();
                    removeProduct(product.id);
                };

                const quantityInput = document.createElement('input');
                quantityInput.type = 'number';
                quantityInput.value = product.quantity;
                quantityInput.classList.add('product-quantity');
                quantityInput.onchange = function () {
                    updateProductQuantity(product.id, quantityInput.value);
                };

                productDiv.appendChild(productName);
                productDiv.appendChild(removeButton);
                productDiv.appendChild(quantityInput);
                selectedProductsList.appendChild(productDiv);
            });

            selectedProductsDiv.innerHTML = ''; // Clear the list before adding updated content
            selectedProductsDiv.appendChild(selectedProductsList);
        }

        // Remove a product from the selected list
        function removeProduct(productId) {
            selectedProducts = selectedProducts.filter(product => product.id !== productId);
            updateSelectedProducts();
        }

        // Update the quantity of a selected product
        function updateProductQuantity(productId, quantity) {
            const product = selectedProducts.find(product => product.id === productId);
            if (product) {
                product.quantity = quantity;
            }
        }

        async function showCustomerList(searchTerm = "") {
            try {
                const data = await fetchData("/api/customers");
                // console.log("Customers Data:", data);

                const filteredData = filterCustomers(data.customers, searchTerm);
                renderCustomers(filteredData);
            } catch (error) {
                console.log(error);
                showToast(ERROR_MESSAGE);
            }
        }

        function filterCustomers(customers, searchTerm) {
            if (typeof searchTerm !== "string" || searchTerm.trim() === "") {
                return customers;
            }
            return customers.filter(customer => {
                const fullName = `${customer.firstName} ${customer.lastName}`;
                const displayText = `${fullName} - ${customer.customerNO}`;

                return displayText.toLowerCase().includes(searchTerm?.toLowerCase());
            });
        }

        function renderCustomers(filteredCustomers) {
            elements.customerList.innerHTML = "";
            show(elements.customerList);

            if (filteredCustomers.length === 0) {
                elements.customerList.innerHTML = "<p class='text-muted text-center'>לא נמצאו לקוחות תואמים</p>";
                return;
            }

            filteredCustomers.forEach(customer => {
                const fullName = `${customer.firstName} ${customer.lastName}`;
                const displayText = `${fullName} - ${customer.customerNO}`;

                const customerItem = document.createElement("button");
                customerItem.classList.add("list-group-item", "list-group-item-action");
                customerItem.textContent = displayText;
                customerItem.addEventListener("click", (event) => {
                    event.preventDefault();
                    selectCustomer(customer);
                });

                elements.customerList.appendChild(customerItem);
            });
        }

        function customerItemHTML(customer) {
            return `<button class='list-group-item list-group-item-action' onclick='selectCustomer(${JSON.stringify(customer)})'>
                        ${customer.firstName} ${customer.lastName} - ${customer.customerNO}
                    </button>`;
        }

        function selectCustomer(customer) {
            selectedCustomer = customer;
            newOrder.customerNO = customer.customerNO;
            elements.searchCustomer.value = `${customer.firstName} ${customer.lastName} - ${customer.customerNO}`;
            hide(elements.customerList);
            elements.nextToStep2.disabled = false;
        }

        async function loadProducts() {
            try {
                const data = await fetchData("/api/products-materials");
                renderProducts(data.products);
            } catch (error) {
                console.error("Error loading products:", error);
            }
        }

        function renderProducts(products) {
            elements.productList.innerHTML = products.map(productItemHTML).join("");
        }

        function productItemHTML(product) {
            return `<div class='list-group-item d-flex justify-content-between align-items-center'>
                        ${product.name}
                        <input type='number' class='form-control w-25' id='quantity-${product.id}' placeholder='כמות' disabled>
                        <button class='btn btn-outline-primary btn-sm' onclick='toggleProductSelection(${JSON.stringify(product)})'>בחר</button>
                    </div>`;
        }

        function toggleProductSelection(product) {
            const index = selectedProducts.findIndex(p => p.id === product.id);
            if (index !== -1) {
                selectedProducts.splice(index, 1);
            } else {
                selectedProducts.push(product);
            }
            updateProductList();
        }

        function updateProductList() {
            elements.selectedProductsList.innerHTML = selectedProducts
                .map(p => `<div>${p.name} - כמות: ${document.getElementById(`quantity-${p.id}`).value || 1}</div>`)
                .join("");
        }
        function showToast(message) {
            // Create a new toast element
            const toastElement = document.createElement('div');
            toastElement.classList.add('toast');
            toastElement.classList.add('align-items-center');
            toastElement.classList.add('text-bg-danger');
            toastElement.classList.add('border-0');
            toastElement.setAttribute('role', 'alert');
            toastElement.setAttribute('aria-live', 'assertive');
            toastElement.setAttribute('aria-atomic', 'true');
            toastElement.innerHTML = `
              <div class="d-flex">
                <div class="toast-body">
                  ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
            `;

            // Append the toast to the container
            document.getElementById('toastContainer').appendChild(toastElement);

            // Initialize the toast and show it
            const toast = new bootstrap.Toast(toastElement);
            toast.show();

            // Remove the toast after it has disappeared (5 seconds)
            setTimeout(() => {
                toastElement.remove();
            }, 5000);
        }
        function moveToStep2() {
            if (!newOrder.customerNO) return showToast(ERROR_MESSAGE);
            orderCode = generateOrderId(selectedCustomer.firstName);
            elements.orderIdInput.value = orderCode;
            switchStep(elements.firstStepForm, elements.secondStepForm);
        }

        function moveToStep3() {
            if (!elements.orderIdInput.value.trim()) return showToast(ERROR_MESSAGE);
            switchStep(elements.secondStepForm, elements.thirdStepForm);
            elements.nextToStep4.disabled = false;
        }

        function finalizeOrder() {
            if (!document.getElementById("someRequiredField").value.trim()) return showToast(ERROR_MESSAGE);
            if (!selectedProducts.length) return alert("נא לבחור לפחות מוצר אחד");
            newOrder.products = selectedProducts.map(p => ({ productId: p.id, quantity: document.getElementById(`quantity-${p.id}`).value || 1 }));
        }

        async function submitOrder(event) {
            event.preventDefault();
            Object.assign(newOrder, {
                orderDetails: elements.orderDetails.value || "",
                notes: elements.notes.value || "",
                orderDate: new Date().toISOString(),
                orderNumber: orderCode,
                // products: selectedProducts
            });
            console.log(products)
            try {
                show(elements.loading);

                const response = await fetch("/api/orders/add/", {
                    headers: HEADERS,
                    method: "POST",
                    body: JSON.stringify({ order: newOrder })
                });

                const data = await response.json();

                // If response contains an error, handle it
                if (data.errors) {
                    handleErrorResponse(data.errors);  // Handle error using the custom function
                } else {
                    const successStep = document.getElementById("success-step");
                    successStep.querySelector("#order-number").textContent = orderCode;
                    show(successStep);
                    hide(elements.orderForm)
                }
            } catch (error) {
                console.error("Unexpected error:", error);
                showToast(ERROR_MESSAGE);
            } finally {
                hide(elements.loading);
            }
        }
        document.getElementById("copy-btn").addEventListener("click", copyOrderNumber);
        function copyOrderNumber() {
            const orderNumber = elements.orderNumber.innerText;
            navigator.clipboard.writeText(orderNumber).then(() => {
                const copyBtn = document.querySelector(".copy-btn");
                const icon = copyBtn.querySelector("i");
                copyBtn.classList.add("copied");

                // Change icon temporarily
                icon.classList.remove("fa-copy");
                icon.classList.add("fa-check");

                setTimeout(() => {
                    copyBtn.classList.remove("copied");
                    icon.classList.remove("fa-check");
                    icon.classList.add("fa-copy");
                }, 1500);
            });
        }

        function handleErrorResponse(error) {
            // Assuming 'error' is already parsed and is an array of error objects
            if (Array.isArray(error) && error.length > 0) {
                // Extract the first error message from the array
                const errorMessage = error[0].message || "שגיאה לא ידועה"; // Default error message if no message is found

                // Show the error message in a toast
                showToast(errorMessage);
            } else {
                showToast("שגיאה בלתי צפויה, אנא נסה שנית.");
            }
        }


        async function fetchData(url) {
            return await fetch(url, { headers: HEADERS }).then(status).then(json);
        }

        function generateOrderId(name) {
            const now = new Date();
            return `${name.toUpperCase()}-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}`;
        }

        function switchStep(hideElement, showElement) {
            hide(hideElement);
            show(showElement);
        }

        function initializeOrder() {
            return {
                orderNumber: null,
                customerNO: null,
                image: null,
                orderDate: null,
                status: "חדשה",
                notes: ""
            };
        }

        function getDOMElements() {
            return {
                searchCustomer: document.getElementById("searchCustomer"),
                orderIdInput: document.getElementById("orderId"),
                orderNumber: document.getElementById("order-number"),
                nextToStep2: document.getElementById("nextToStep2"),
                nextToStep3: document.getElementById("nextToStep3"),
                nextToStep4: document.getElementById("submit-btn"),
                prevStep2: document.getElementById("prev-step2"),
                prevStep4: document.getElementById("prev-step4"),
                firstStepForm: document.getElementById("first-step-form"),
                secondStepForm: document.getElementById("second-step-form"),
                thirdStepForm: document.getElementById("third-step-form"),
                customerList: document.getElementById("customerList"),
                productList: document.getElementById("productList"),
                selectedProductsList: document.getElementById("selectedProductsList"),
                orderForm: document.getElementById("orderForm"),
                loading: document.getElementById("loading"),
                errorAlert: document.getElementById("error"),
                statusSelect: document.getElementById("status"),
                notes: document.getElementById("notes"),
                orderDetails: document.getElementById("orderDetails")
            };
        }

        function showToast(message) {
            // Create a new toast element
            const toastElement = document.createElement('div');
            toastElement.classList.add('toast');
            toastElement.classList.add('align-items-center');
            toastElement.classList.add('text-bg-danger');
            toastElement.classList.add('border-0');
            toastElement.setAttribute('role', 'alert');
            toastElement.setAttribute('aria-live', 'assertive');
            toastElement.setAttribute('aria-atomic', 'true');
            toastElement.innerHTML = `
              <div class="d-flex">
                <div class="toast-body">
                  ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
              </div>
            `;

            // Append the toast to the container
            document.getElementById('toastContainer').appendChild(toastElement);

            // Initialize the toast and show it
            const toast = new bootstrap.Toast(toastElement);
            toast.show();

            // Remove the toast after it has disappeared (5 seconds)
            setTimeout(() => {
                toastElement.remove();
            }, 5000);
        }
    });
})();
