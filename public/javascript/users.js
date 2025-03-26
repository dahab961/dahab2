'use strict';
import { status, json, show, hide, HEADERS } from "./funcs.js";
import { USERS_FETCH_URL, NO_USERS_HTML } from './constants.js';

(function () {
    document.addEventListener('DOMContentLoaded', function () {
        console.log("loaded")
        let users = [];
        const usersContainer = document.getElementById("users-container");
        const searchInput = document.getElementById("searchInput");
        const errorAlert = document.getElementById("error-alert");
        const loadingSpinner = document.getElementById("loading");
        const refreshButton = document.getElementById("refresh-btn");
        const filterBy = (searchQuery) =>
            users.filter(user =>
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.customerNO.toString().includes(searchQuery)
            );


        function openZoomModal(imageUrl, title) {
            document.getElementById("modalImage").src = imageUrl;
            document.getElementById("modalTitle").innerText = title;
            const zoomModal = new bootstrap.Modal(document.getElementById("imageZoomModal"));
            zoomModal.show();
        }

        async function fetchusers() {
            try {
                show(loadingSpinner);
                hide(errorAlert);
                hide(usersContainer);

                await fetch(USERS_FETCH_URL, {
                    headers: HEADERS
                }).then(status).then(json).then(data => {
                    users = data.customers;

                    if (searchInput.value)
                        users = filterBy(searchInput);

                    displayUsers(users);
                })
            } catch (error) {
                console.error("Error fetching users:", error);
                show(errorAlert);
            } finally {
                hide(loadingSpinner);
                show(usersContainer);
                searchInput.focus();
            }
        }
        function displayUsers(users) {
            if (!users.length) {
                usersContainer.innerHTML = NO_USERS_HTML;
                return;
            }

            let html = `<p class="text-muted mb-4 shadow-sm">נמצאו ${users.length} לקוחות</p>
                        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3" id="users">`;

            users.forEach(user => {
                user.name = `${user.firstName} ${user.lastName}`;
                html += `
                    <div class="col-6 col-sm-6 col-md-4 col-lg-3 mb-4">
                        <div class="card animated-card2 h-100 shadow-sm text-center">
                            <div class="card-img-top d-flex justify-content-center align-items-center" style="height: 100px;">
                                <div class="rounded-circle bg-dark border-dark border border-3 d-flex justify-content-center align-items-center" style="width: 80px; height: 80px;">
                                    <i class="fa fa-user fa-lg fa-sharp text-white"></i>
                                </div>
                            </div>
                            <h5 class="mt-3">${user.name}</h5>
                            <div class="card-body">
                                <div class="text-dark bg-transparent border-top-0">
                                    <p>מס' לקוח: ${user.customerNO}</p>
                                    <button class="btn btn-primary zoom-trigger" data-id="${user.customerNO}">View</button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });

            html += `</div>`; // Closing the grid div
            usersContainer.innerHTML = html;
            searchInput.addEventListener("input", (event) => {
                event.preventDefault();
                const searchQuery = searchInput.value.trim();
                hide(errorAlert);
                const filteredusers = filterBy(searchQuery);
                displayUsers(filteredusers);
            });
        }


        function openZoomModal(customer) {
            // Get modal elements
            const modalTitle = document.getElementById('modalTitle');
            const customerInfo = document.getElementById('customerInfo');

            // Set the customer details in the modal
            customerInfo.querySelector('#customerNO').innerText = customer.customerNO;
            customerInfo.querySelector('#firstName').innerText = customer.firstName;
            customerInfo.querySelector('#lastName').innerText = customer.lastName;
            customerInfo.querySelector('#phone').innerText = customer.phone;
            customerInfo.querySelector('#email').innerText = customer.email;
            customerInfo.querySelector('#address').innerText = customer.address;

            // Optionally, set a title for the modal
            modalTitle.innerText = `פרטי לקוח ${customer.firstName} ${customer.lastName}`;

            // Show the modal using Bootstrap Modal API
            const zoomModal = new bootstrap.Modal(document.getElementById('userZoomModal'));
            zoomModal.show();
        }




        usersContainer.addEventListener("click", (event) => {
            const target = event.target.closest(".zoom-trigger");
            if (target) {
                const customerNO = target.getAttribute("data-id");
                const userData = users.find(user => user.customerNO.toString() === customerNO);
                if (userData) {
                    openZoomModal(userData);
                } else {
                    console.error("User data not found for customerNO:", customerNO);
                }
            }
        });


        fetchusers();
        refreshButton.addEventListener("click", fetchusers);
    });
})();