'use strict';
import { status, json, show, hide, HEADERS } from "./funcs.js";
import { MATERIALS_FETCH_URL, NO_MATERIALS_HTML } from './constants.js';

(function () {
    document.addEventListener('DOMContentLoaded', function () {
        let materials = [];
        const zoomModal = document.getElementById('imageZoomModal');
        const materialsContainer = document.getElementById("materials-container");
        const searchInput = document.getElementById("searchInput");
        const errorAlert = document.getElementById("error-alert");
        const loadingSpinner = document.getElementById("loading");
        const refreshButton = document.getElementById("refresh-btn");
        const filterBy = (searchQuery) => {
            const query = searchQuery.toLowerCase();
            return materials.filter(material => 
            material.name.toLowerCase().includes(query) || 
            material.code.toLowerCase().includes(query)
            );
        };


        function openZoomModal(imageUrl, title) {
            document.getElementById("modalImage").src = imageUrl;
            document.getElementById("modalTitle").innerText = title;
            const zoomModal = new bootstrap.Modal(document.getElementById("imageZoomModal"));
            zoomModal.show();
        }

        async function fetchMaterials() {
            try {
                show(loadingSpinner);
                hide(errorAlert);
                hide(materialsContainer);

                await fetch(MATERIALS_FETCH_URL, {
                    headers: HEADERS
                }).then(status).then(json).then(data => {
                    materials = data.materials;
                    console.log(materials);

                    if (searchInput.value)
                        materials = filterBy(searchInput);

                    displayMaterials(materials);
                })
            } catch (error) {
                console.error("Error fetching materials:", error);
                show(errorAlert);
            } finally {
                hide(loadingSpinner);
                show(materialsContainer);
                searchInput.focus();
            }
        }
        function displayMaterials(materials) {
            if (!materials.length) {
                materialsContainer.innerHTML = NO_MATERIALS_HTML;
                return;
            }

            let html = `<p class="text-muted mb-4 shadow-sm">נמצאו ${materials.length} חומרים</p>
                        <div class="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-3" id="materials">`;

            materials.forEach(material => {
                html += `
                     <div class="col-6 col-sm-6 col-md-4 col-lg-3 mb-4">
                <a class="card animated-card2 h-100 shadow-sm text-decoration-none zoom-trigger" 
                data-image-link="${material.imageLink}" data-title="${material.name}">
                    <img src="${material.imageLink}" class="card-img card-img-top img-fluid" alt="${material.name}">
                    <h5 class="">${material.name}</h5>
                    <div class="card-body text-center">
                        </div>
                        <div class=" text-dark bg-transparent border-top-0">
                          קוד:  ${material.code} <br>
                        </div>
                </a>
            </div>`;
            });

            html += `</div>`; // Closing grid div
            materialsContainer.innerHTML = html;
        }

        searchInput.addEventListener("input", (event) => {
            event.preventDefault();
            const searchQuery = searchInput.value.trim();
            hide(errorAlert);
            const filteredMaterials = filterBy(searchQuery);
            displayMaterials(filteredMaterials);
        });

        materialsContainer.addEventListener("click", (event) => {
            const target = event.target.closest(".zoom-trigger");
            if (target) {
                const imageUrl = target.getAttribute("data-image-link");
                const title = target.getAttribute("data-title");
                openZoomModal(imageUrl, title);
            }
        });

        fetchMaterials();
        refreshButton.addEventListener("click", fetchMaterials);
    });
})();