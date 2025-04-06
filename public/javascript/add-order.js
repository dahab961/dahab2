import { status, json, show, hide, HEADERS, createToastContainer, formatDate, fetchData, ERROR_MESSAGE } from "./funcs.js";
import {
    finalizeOrder,
    copyOrderNumber,
    handleErrorResponse,
    generateOrderId,
    switchStep,
    initializeOrder
} from './add-order-functions.js';

(function () {
    try {
        document.addEventListener("DOMContentLoaded", function () {
            const elements = getDOMElements();
            let newOrder = initializeOrder();
            let selectedCustomer = null;
            let selectedProducts = [];
            let orderCode = '';
            console.log("step3")
            searchCustomer.focus();
            showCustomerList();
            elements.copyBtn.addEventListener("click", () => copyOrderNumber(elements.orderNumber, elements.copyBtn));
            // document.getElementById("saveMaterialBtn").addEventListener("click", saveMaterial);
            document.getElementById("prev-to-step-1").addEventListener("click", () => switchStep(elements.secondStepForm, elements.firstStepForm));
            document.getElementById("prev-to-step-2").addEventListener("click", () => switchStep(elements.thirdStepForm, elements.secondStepForm));
            elements.statusSelect.addEventListener("change", () => newOrder.status = elements.statusSelect.value);
            elements.nextToStep2.addEventListener("click", moveToStep2);
            elements.nextToStep3.addEventListener("click", moveToStep3);
            elements.nextToStep4.addEventListener("click", finalizeOrder);
            elements.orderForm.addEventListener("submit", submitOrder);
            elements.searchCustomer.addEventListener("input", async (event) =>
                await showCustomerList(event.target.value)
            );
            // //todo: remove
            // switchStep(elements.firstStepForm, elements.thirdStepForm);
            // fetchCategories();
            // elements.nextToStep4.disabled = false;



            let categories = [];
            let products = [];
            const categoryFilter = document.getElementById('category-filter');

            async function fetchCategories() {
                try {
                    categoryFilter.innerHTML = elements.loading.innerHTML;
                    categoryFilter.classList.remove('d-none');
                    const data = await fetchData("/api/categories");
                    categories = data.categories ?? [];
                    categories.forEach(category => {
                        const categoryButton = document.createElement('button');
                        categoryButton.classList.add('category-btn', 'btn', 'btn-light');
                        categoryButton.textContent = category.name;
                        categoryButton.dataset.category = category.code;

                        categoryButton.onclick = function (event) {
                            event.preventDefault();
                            filterProductsByCategory(category.code);
                        };
                        categoryFilter.appendChild(categoryButton);
                    });
                } catch (error) {
                    showToast(ERROR_MESSAGE);
                }
            }

            async function filterProductsByCategory(categoryCode) {
                try {
                    const data = await fetchData(`/api/products/${categoryCode}`);
                    products = data.products ?? [];
                    elements.productList.innerHTML = '';
                    const filteredProducts = products.filter(product => product.categoryId === categoryCode);
                    new bootstrap.Modal(document.getElementById('productModal')).show();
                    elements.productList.innerHTML = '';
                    filteredProducts.forEach(product => {
                        const productDiv = document.createElement('div');
                        productDiv.classList.add('product-item', 'product-card', "col-12", "col-md-6", 'col-lg-4');
                        productDiv.dataset.productId = product.id;

                        const productImage = document.createElement('img');
                        productImage.src = product.image;
                        productImage.alt = product.name;
                        productImage.classList.add('img-fluid', 'rounded', 'product-img');
                        productImage.width = 60;
                        productImage.height = 60;

                        const productInfo = document.createElement('div');
                        const productName = document.createElement('p');
                        productName.textContent = product.name;
                        const productCode = document.createElement('p');
                        productCode.textContent = product.id;

                        const selectButton = document.createElement('button');
                        selectButton.textContent = 'בחר';
                        selectButton.classList.add('btn', 'btn-outline-primary', 'w-100');
                        selectButton.dataset.productId = product.id;
                        selectButton.onclick = function (event) {
                            event.preventDefault();
                            selectProduct(product);
                        };
                        productInfo.appendChild(productName);
                        productInfo.appendChild(productCode);
                        productInfo.appendChild(selectButton);
                        productDiv.appendChild(productImage);
                        productDiv.appendChild(productInfo);
                        elements.productList.appendChild(productDiv);
                    });
                } catch (error) {
                    showToast(ERROR_MESSAGE);
                }
            }

            function selectProduct(product) {
                const existingProduct = selectedProducts.find(p => p.id === product.id);

                if (!existingProduct) {
                    selectedProducts.push({
                        ...product,
                        quantity: 1,
                        materials: []
                    });
                    updateSelectedProducts();
                } else {
                    showToast("מוצר זה כבר נמצא ברשימה", "warning", 4000);
                }
            }

            function updateSelectedProducts() {
                elements.selectedProductsCount.textContent = selectedProducts.length;

                const selectedProductsList = document.createElement('div');
                selectedProductsList.classList.add('list-group');

                selectedProducts.forEach(product => {
                    const productDiv = document.createElement('div');
                    productDiv.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

                    const productName = document.createElement('h5');
                    productName.textContent = product.name;
                    productName.classList.add('mb-0');

                    const manageMaterialsButton = document.createElement('button');
                    manageMaterialsButton.classList.add('btn', 'btn-sm', 'btn-info');
                    manageMaterialsButton.textContent = 'ניהול חומרים';
                    manageMaterialsButton.onclick = async function (event) {
                        event.preventDefault();
                        await openMaterialModal(product.id);
                    };

                    const removeButton = document.createElement('i');
                    removeButton.classList.add('fa', 'fa-trash', 'text-danger', 'cursor-pointer');
                    removeButton.style.cursor = 'pointer';
                    removeButton.onclick = function (event) {
                        event.preventDefault();
                        removeProduct(product.id);
                    };

                    const quantityInput = document.createElement('input');
                    quantityInput.type = 'number';
                    quantityInput.value = product.quantity;
                    quantityInput.classList.add('form-control', 'w-25');
                    quantityInput.onchange = function () {
                        updateProductQuantity(product.id, quantityInput.value);
                    };

                    const productActionsDiv = document.createElement('div');
                    productActionsDiv.classList.add('d-flex', 'align-items-center', 'gap-3');
                    productActionsDiv.appendChild(removeButton);
                    productActionsDiv.appendChild(manageMaterialsButton);
                    productActionsDiv.appendChild(quantityInput);

                    productDiv.appendChild(productName);
                    productDiv.appendChild(productActionsDiv);

                    selectedProductsList.appendChild(productDiv);
                });

                elements.selectedProductsDiv.innerHTML = '';
                elements.selectedProductsDiv.appendChild(selectedProductsList);
            }


            function removeProduct(productId) {
                selectedProducts = selectedProducts.filter(product => product.id !== productId);
                updateSelectedProducts();
            }

            function updateProductQuantity(productId, quantity) {
                const product = selectedProducts.find(product => product.id === productId);
                if (product) {
                    product.quantity = quantity;
                }
            }

            async function openMaterialModal(productId) {
                const product = selectedProducts.find(p => p.id === productId);

                const materialModalLabel = document.getElementById('materialModalLabel');
                materialModalLabel.textContent = `ניהול חומרים עבור ${product.name}`;
                document.getElementById("materialModalCode").textContent = productId;

                try {
                    const materialListDiv = document.getElementById('material-list');
                    materialListDiv.innerHTML = '';
                    await fetchData("/api/materials").then(data => {
                        data.materials.forEach(material => {
                            const materialDiv = document.createElement('div');
                            materialDiv.classList.add('col-12', 'col-md-4', 'col-lg-3', 'mb-3');

                            const materialImage = document.createElement('img');
                            materialImage.src = material.imageLink;
                            materialImage.alt = material.name;
                            materialImage.width = 80;
                            materialImage.height = 80;
                            materialImage.classList.add('img-fluid', 'rounded');

                            const materialName = document.createElement('h5');
                            materialName.textContent = material.name;
                            materialName.classList.add('text-center', 'mt-2');

                            const selectButton = document.createElement('button');
                            selectButton.textContent = 'בחר';
                            selectButton.classList.add('btn', 'btn-outline-primary', 'w-100');
                            selectButton.onclick = function () {
                                selectMaterial(productId, material);
                            };

                            const materialCard = document.createElement('div');
                            materialCard.classList.add('card', 'p-3', 'border', 'shadow-sm');
                            materialCard.appendChild(materialImage);
                            materialCard.appendChild(materialName);
                            materialCard.appendChild(selectButton);

                            materialDiv.appendChild(materialCard);
                            materialListDiv.appendChild(materialDiv);
                        });
                    });
                } catch (err) {
                    console.error(err);
                }

                const materialsListDiv = document.getElementById('product-materials-list');
                materialsListDiv.innerHTML = '';

                product.materials.forEach((material, index) => displayMaterial(materialsListDiv, material, index));
                new bootstrap.Modal(document.getElementById('materialModal')).show();
            }


            function selectMaterial(productId, material) {
                const product = selectedProducts.find(p => p.id === productId);

                if (!product) return;

                if (!product.materials) {
                    product.materials = [];
                }

                if (!product.materials.find(m => m.id === material.id)) {
                    product.materials.push(material);
                } else {
                    alert("חומר זה כבר נמצא");
                }

                updateSelectedProducts();
            }

            function displayMaterial(materialsListDiv, material, index) {
                const materialDiv = document.createElement('div');
                materialDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');

                const materialName = document.createElement('span');
                materialName.textContent = material.name;

                const materialQuantity = document.createElement('span');
                materialQuantity.textContent = `כמות: ${material.quantity}`;
                materialQuantity.classList.add('badge', 'bg-secondary');

                const editButton = document.createElement('button');
                editButton.classList.add('btn', 'btn-warning', 'btn-sm', 'ms-3');
                editButton.innerHTML = '<i class="fa fa-edit"></i> ערוך';
                editButton.onclick = function () {
                    openEditMaterialModal(productId, index);
                };

                const removeButton = document.createElement('button');
                removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
                removeButton.innerHTML = '<i class="fa fa-trash"></i> הסר';
                removeButton.onclick = function () {
                    removeMaterial(productId, index);
                };

                materialDiv.appendChild(materialName);
                materialDiv.appendChild(materialQuantity);
                materialDiv.appendChild(editButton);
                materialDiv.appendChild(removeButton);

                materialsListDiv.appendChild(materialDiv);
            }

            function addMaterial() {
                const productId = document.getElementById('productId').value;
                const product = selectedProducts.find(p => p.id === productId);
                const materialName = document.getElementById('materialName').value;
                const materialQuantity = parseInt(document.getElementById('materialQuantity').value);

                if (materialName && materialQuantity) {
                    product.materials.push({ name: materialName, quantity: materialQuantity });
                    updateMaterialsList(productId);
                }
            }

            function openEditMaterialModal(productId, materialIndex) {
                const product = selectedProducts.find(p => p.id === productId);
                const material = product.materials[materialIndex];

                document.getElementById('materialName').value = material.name;
                document.getElementById('materialQuantity').value = material.quantity;

                const saveBtn = document.getElementById('saveMaterialBtn');
                saveBtn.textContent = 'Update Material';
                saveBtn.onclick = function () {
                    updateMaterial(productId, materialIndex);
                };
            }

            function updateMaterial(productId, materialIndex) {
                const product = selectedProducts.find(p => p.id === productId);
                const material = product.materials[materialIndex];

                material.name = document.getElementById('materialName').value;
                material.quantity = parseInt(document.getElementById('materialQuantity').value);

                updateMaterialsList(productId);
                document.getElementById('materialForm').reset();
                document.getElementById('saveMaterialBtn').textContent = 'Save Material';
            }

            function updateMaterialsList(productId) {
                const product = selectedProducts.find(p => p.id === productId);
                const materialsListDiv = document.getElementById('product-materials-list');
                materialsListDiv.innerHTML = '';

                product.materials.forEach((material, index) => {
                    const materialDiv = document.createElement('div');
                    materialDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');

                    const materialName = document.createElement('span');
                    materialName.textContent = material.name;

                    const materialQuantity = document.createElement('span');
                    materialQuantity.textContent = `כמות: ${material.quantity}`;
                    materialQuantity.classList.add('badge', 'bg-secondary');

                    const editButton = document.createElement('button');
                    editButton.classList.add('btn', 'btn-warning', 'btn-sm', 'ms-3');
                    editButton.innerHTML = '<i class="fa fa-edit"></i> ערוך';
                    editButton.onclick = function () {
                        openEditMaterialModal(productId, index);
                    };

                    const removeButton = document.createElement('button');
                    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
                    removeButton.innerHTML = '<i class="fa fa-trash"></i> הסר';
                    removeButton.onclick = function () {
                        removeMaterial(productId, index);
                    };

                    materialDiv.appendChild(materialName);
                    materialDiv.appendChild(materialQuantity);
                    materialDiv.appendChild(editButton);
                    materialDiv.appendChild(removeButton);

                    materialsListDiv.appendChild(materialDiv);
                });
            }

            async function createProductItem(product) {
                const productDiv = document.createElement('div');
                productDiv.classList.add('col-12', 'col-md-4', 'col-lg-3');
                productDiv.id = `product-${product.id}`;

                const productItemDiv = document.createElement('div');
                productItemDiv.classList.add('product-item');

                const productName = document.createElement('h5');
                productName.textContent = product.name;

                const manageButton = document.createElement('button');
                manageButton.classList.add('btn', 'btn-outline-primary', 'btn-sm');
                manageButton.textContent = 'ניהול חומרים';
                manageButton.onclick = async () => await openMaterialModal(product.id);

                productItemDiv.appendChild(productName);
                productItemDiv.appendChild(manageButton);
                productDiv.appendChild(productItemDiv);

                return productDiv;
            }

            function saveMaterial() {
                const productId = document.getElementById('materialModalCode').textContent; // Get product ID from modal title
                const product = selectedProducts.find(p => p.id === productId);

                const materialName = document.getElementById('materialName').value;
                const materialQuantity = parseInt(document.getElementById('materialQuantity').value);

                if (materialName && materialQuantity) {
                    product.materials.push({ name: materialName, quantity: materialQuantity });
                    updateMaterialsList(productId);
                    document.getElementById('materialForm').reset();
                }
            }

            function removeMaterial(productId, materialIndex) {
                const product = selectedProducts.find(p => p.id === productId);
                product.materials.splice(materialIndex, 1);
                updateMaterialsList(productId);
            }
            function removeMaterial(productId, materialIndex) {
                const product = selectedProducts.find(p => p.id === productId);
                product.materials.splice(materialIndex, 1);
                updateMaterialsList(productId);
            }

            function openEditMaterialModal(productId, materialIndex) {
                const product = selectedProducts.find(p => p.id === productId);
                const material = product.materials[materialIndex];

                document.getElementById('materialName').value = material.name;
                document.getElementById('materialQuantity').value = material.quantity;

                const saveBtn = document.getElementById('saveMaterialBtn');
                saveBtn.textContent = 'עדכן חומר';
                saveBtn.onclick = function () {
                    updateMaterial(productId, materialIndex);
                };
            }

            function updateMaterial(productId, materialIndex) {
                const product = selectedProducts.find(p => p.id === productId);
                const material = product.materials[materialIndex];

                material.name = document.getElementById('materialName').value;
                material.quantity = parseInt(document.getElementById('materialQuantity').value);

                updateMaterialsList(productId);
                document.getElementById('materialForm').reset();
                document.getElementById('saveMaterialBtn').textContent = 'שמור חומר';
            }

            function updateMaterialsList(productId) {
                const product = selectedProducts.find(p => p.id === productId);
                const materialsListDiv = document.getElementById('product-materials-list');
                materialsListDiv.innerHTML = '';

                product.materials.forEach((material, index) => {
                    const materialDiv = document.createElement('div');
                    materialDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');

                    const materialName = document.createElement('span');
                    materialName.textContent = material.name;

                    const materialQuantity = document.createElement('span');
                    materialQuantity.textContent = `כמות: ${material.quantity}`;
                    materialQuantity.classList.add('badge', 'bg-secondary');

                    const editButton = document.createElement('button');
                    editButton.classList.add('btn', 'btn-warning', 'btn-sm', 'ms-3');
                    editButton.innerHTML = '<i class="fa fa-edit"></i> ערוך';
                    editButton.onclick = function () {
                        openEditMaterialModal(productId, index);
                    };

                    const removeButton = document.createElement('button');
                    removeButton.classList.add('btn', 'btn-danger', 'btn-sm');
                    removeButton.innerHTML = '<i class="fa fa-trash"></i> הסר';
                    removeButton.onclick = function () {
                        removeMaterial(productId, index);
                    };

                    materialDiv.appendChild(materialName);
                    materialDiv.appendChild(materialQuantity);
                    materialDiv.appendChild(editButton);
                    materialDiv.appendChild(removeButton);

                    materialsListDiv.appendChild(materialDiv);
                });
            }

            async function showCustomerList(searchTerm = "") {
                try {
                    elements.customerList.innerHTML = `
                <div class="text-center py-2">
                <div class="spinner-border text-primary" role="status" style="width: 1.5rem; height: 1.5rem;">
                <span class="visually-hidden">טוען...</span>
                </div>
                </div>
                `;
                    show(elements.customerList);
                    const data = await fetchData("/api/customers");
                    const filteredData = filterCustomers(data.customers, searchTerm);
                    elements.customerList.innerHTML = "";
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

            function selectCustomer(customer) {
                selectedCustomer = customer;
                newOrder.customerNO = customer.customerNO;
                elements.searchCustomer.value = `${customer.firstName} ${customer.lastName} - ${customer.customerNO}`;
                hide(elements.customerList);
                elements.nextToStep2.disabled = false;
            }

            async function submitOrder(event) {
                event.preventDefault();
                console.log(products);
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

                    if (data.errors) {
                        handleErrorResponse(data.errors);
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

            function showToast(message, type = "danger", duration = 5000) {

                const toastContainer = document.getElementById('toastContainer') || createToastContainer();

                const toastElement = document.createElement('div');
                toastElement.classList.add('toast', 'align-items-center', `text-bg-${type}`, 'border-0');
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

                toastContainer.appendChild(toastElement);
                const toast = new bootstrap.Toast(toastElement);
                toast.show();


                setTimeout(() => {
                    toastElement.remove();
                }, duration);
            }

            function moveToStep2() {
                if (!newOrder.customerNO) return showToast(ERROR_MESSAGE);
                orderCode = generateOrderId(selectedCustomer.firstName);
                elements.orderIdInput.value = orderCode;
                switchStep(elements.firstStepForm, elements.secondStepForm);
            }

            async function moveToStep3() {
                try {
                    if (!elements.orderIdInput.value.trim()) return showToast(ERROR_MESSAGE);
                    await fetchCategories();
                    switchStep(elements.secondStepForm, elements.thirdStepForm);
                    elements.nextToStep4.disabled = false;
                } catch (error) {
                    console.error(error);
                    showToast(ERROR_MESSAGE);
                }
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
                    productList: document.getElementById("product-list"),
                    selectedProductsList: document.getElementById("selectedProductsList"),
                    orderForm: document.getElementById("orderForm"),
                    loading: document.getElementById("loading"),
                    errorAlert: document.getElementById("error"),
                    statusSelect: document.getElementById("status"),
                    notes: document.getElementById("notes"),
                    copyBtn: document.getElementById("copy-btn"),
                    orderDetails: document.getElementById("orderDetails"),
                    selectedProductsDiv: document.getElementById('selected-products'),
                    selectedProductsCount: document.getElementById('selected-products-count'),
                    toastContainer: document.getElementById('toastContainer') || createToastContainer(),
                };
            }
        });
    } catch (error) {
        console.error("Error in add-order.js:", error);
        alert(ERROR_MESSAGE);
    }
})();
