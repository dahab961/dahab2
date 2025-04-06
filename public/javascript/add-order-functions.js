import { showToast, hide, show } from "./funcs.js";
function finalizeOrder() {
    if (!document.getElementById("someRequiredField").value.trim()) return showToast(ERROR_MESSAGE);
    if (!selectedProducts.length) return alert("נא לבחור לפחות מוצר אחד");
    newOrder.products = selectedProducts.map(p => ({ productId: p.id, quantity: document.getElementById(`quantity-${p.id}`).value || 1 }));
}

function copyOrderNumber(orderNumberElem, copyBtnElem) {
    const orderNumber = orderNumberElem.innerText;
    navigator.clipboard.writeText(orderNumber).then(() => {
        const icon = elements.copyBtn.querySelector("i");
        copyBtnElem.classList.add("copied");

        icon.classList.remove("fa-copy");
        icon.classList.add("fa-check");

        setTimeout(() => {
            copyBtnElem.classList.remove("copied");
            icon.classList.remove("fa-check");
            icon.classList.add("fa-copy");
        }, 1500);
    });
}

function handleErrorResponse(error) {
    if (Array.isArray(error) && error.length > 0) {
        const errorMessage = error[0].message || "שגיאה לא ידועה";
        showToast(errorMessage);
    } else {
        showToast("שגיאה בלתי צפויה, אנא נסה שנית.");
    }
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
export {
    finalizeOrder,
    copyOrderNumber,
    handleErrorResponse,
    generateOrderId,
    switchStep,
    initializeOrder
}

export function openModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

export function closeModal(modalId) {
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
}

export function populateProductList(products, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    products.forEach(product => {
        const button = document.createElement('button');
        button.className = 'list-group-item list-group-item-action';
        button.innerText = product.name;
        button.addEventListener('click', () => {
            document.getElementById('selectedProduct').value = product.name;
            openModal('materialModal');
        });
        container.appendChild(button);
    });
}
