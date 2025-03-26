'use strict';

import { status, json, show, hide, formatDate, HEADERS } from "./funcs.js";
const ORDERS_DEFAULT_IMG = '/images/order.webp';

(function () {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("page loaded")
        let orders = [];
        let filteredOrders = [];

        const ordersContainer = document.getElementById("ordersContainer");
        const searchInput = document.getElementById("searchInput");
        const refreshBtn = document.getElementById("refreshBtn");
        const statusFilters = document.getElementById("statusFilters");
        const loadingSpinner = document.getElementById("loadingSpinner");
        const errorAlert = document.getElementById("errorAlert");
        const dateForm = document.getElementById("date-form"); // Prevent form submission
        const dateFilterBtn = document.getElementById("date-form");
        const fromDateInput = document.getElementById("fromDate");
        const toDateInput = document.getElementById("toDate");
        const dateError = document.getElementById("date-error");
        // Function to display multiple images locally
        function displayImagesLocally(event) {
            const files = event.target.files;
            const orderImgContainer = document.getElementById("order-img");

            // Clear the existing images in the container
            orderImgContainer.innerHTML = '';

            // Loop through selected files and create image elements
            Array.from(files).forEach(file => {
                const reader = new FileReader();

                reader.onload = function (e) {
                    const imgElement = document.createElement("img");
                    imgElement.src = e.target.result;
                    imgElement.classList.add("img-thumbnail", "mt-2");
                    imgElement.style.maxWidth = "200px"; // You can adjust the size
                    imgElement.style.marginRight = "10px"; // Space between images

                    // Append each image to the container
                    orderImgContainer.appendChild(imgElement);
                }

                // Read the file as a data URL (for displaying it)
                reader.readAsDataURL(file);
            });
        }

        async function fetchOrders() {
            try {
                show(loadingSpinner);
                hide(errorAlert);
                hide(ordersContainer);
                hide(dateError);

                const response = await fetch(`/api/orders`, { headers: HEADERS });
                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Failed to fetch orders");

                orders = data.orders;
                filteredOrders = [...orders];
                updateStatusFilters();
                applyFilters();
            } catch (error) {
                console.error("Error fetching orders:", error);
                show(errorAlert);
            } finally {
                hide(loadingSpinner);
                show(ordersContainer);
            }
        }

        function displayOrders(orderList) {
            if (!orderList.length) {
                ordersContainer.innerHTML = `<div class="alert alert-warning mt-4">אין הזמנות להצגה</div>`;
                return;
            }

            let html = `<p class="text-muted mb-4 shadow-sm">נמצאו ${orderList.length} הזמנות</p><div class="row">`;

            orderList.forEach(order => {
                html += `
            <div class="col-6 col-md-4 col-lg-3 mb-4">
                <a class="card order-card h-100 text-decoration-none" href='/orders/${order.orderNumber}'>
                    <img src="${ORDERS_DEFAULT_IMG}" class="img-fluid" alt="Order Image">
                    <div class="order-body text-center">
                        <h5 class="order-title">${order.orderNumber || 'Unknown Order No'}</h5>
                        <p class="order-info"><i class="fa fa-user"></i> לקוח: ${order.customerNO || 'Unknown Customer'}</p>
                        <p class="order-info"><i class="fa fa-clock"></i> ${formatDate(order.orderDate) || 'Unknown Date'}</p>
                        <span class="badge bg-${getStatusColor(order.status)}">${order.status}</span>
                    </div>
                </a>
            </div>`;
            });

            html += `</div > `;
            ordersContainer.innerHTML = html;
        }

        function updateStatusFilters() {
            const uniqueStatuses = [...new Set(orders.map(order => order.status))];

            statusFilters.innerHTML = uniqueStatuses.map(status => `
                <span class="badge bg-${getStatusColor(status)} m-1 status-filter" data-status="${status}">
                    ${status}
                </span>
                `).join("");

            document.querySelectorAll(".status-filter").forEach(el => {
                el.addEventListener("click", () => toggleStatusFilter(el));
            });
        }

        function applyFilters() {
            const searchQuery = searchInput.value.trim().toLowerCase();
            const activeStatuses = Array.from(document.querySelectorAll(".status-filter.bg-dark"))
                .map(el => el.getAttribute("data-status"));

            const fromDate = fromDateInput.value ? new Date(fromDateInput.value) : null;
            const toDate = toDateInput.value ? new Date(toDateInput.value) : null;

            if (fromDate && toDate && fromDate > toDate) {
                show(dateError);
                return;
            }

            const normalizeDate = (date) => {
                const normalized = new Date(date);
                normalized.setHours(0, 0, 0, 0);
                return normalized;
            };

            const normalizedFromDate = fromDate ? normalizeDate(fromDate) : null;
            const normalizedToDate = toDate ? normalizeDate(toDate) : null;

            filteredOrders = orders.filter(order => {
                const matchesSearch = ["orderNumber", "customerNO"].some(key =>
                    order[key]?.toLowerCase().includes(searchQuery)
                );

                const matchesStatus = activeStatuses.length === 0 || activeStatuses.includes(order.status);

                const orderDate = order.orderDate ? normalizeDate(new Date(order.orderDate)) : null;
                const matchesDate = (!normalizedFromDate || (orderDate && orderDate >= normalizedFromDate)) &&
                    (!normalizedToDate || (orderDate && orderDate <= normalizedToDate));

                return matchesSearch && matchesStatus && matchesDate;
            });

            displayOrders(filteredOrders);
        }

        function toggleStatusFilter(element) {
            element.classList.toggle("bg-dark");
            applyFilters();
        }

        dateForm.addEventListener("submit", function (event) {
            event.preventDefault();
            applyFilters();
        });

        searchInput.addEventListener("input", (event) => {
            event.preventDefault();
            applyFilters();
        });
        refreshBtn.addEventListener("click", fetchOrders);
        dateFilterBtn.addEventListener("submit", (event) => {
            event.preventDefault();
            applyFilters();
        });
        function getStatusColor(status) {
            const statusColors = {
                "חדשה": "secondary",
                "בהכנה": "warning",
                "בייצור": "info",
            };
            return statusColors[status] || "black";
        }

        fetchOrders();
    })
})();
