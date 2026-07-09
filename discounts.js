const API_BASE_URL = "http://127.0.0.1:8000/api";
let allDiscounts = [];
let base64ImageStr = "";

// ដំណើរការភ្លាមៗពេល Web ដើរពេញលេញ
document.addEventListener("DOMContentLoaded", () => {
    // បង្កើត HTML Element សម្រាប់ពង្រីករូបភាពចំកណ្តាលអេក្រង់ (Lightbox)
    createImageLightboxMarkup();

    // ភ្ជាប់ Event ទៅកាន់ប៊ូតុងបង្កើតថ្មី និង Form Submit
    setupModalEvents();

    // ភ្ជាប់ Event បិទ Modal ដោយចុចលើសញ្ញា X
    const closeModalBtn = document.getElementById("closeModalBtn");
    if (closeModalBtn) {
        closeModalBtn.onclick = () => {
            const modal = document.getElementById("discountModal");
            if (modal) modal.style.display = "none";
        };
    }

    // ភ្ជាប់ Event ស្វែងរកទិន្នន័យភ្លាមៗពេលវាយអក្សរ ឬជ្រើសរើសប្រភេទ (Real-time Filter)
    const searchInput = document.getElementById("searchPromoInput");
    const typeSelect = document.getElementById("filterTypeSelect");
    const statusSelect = document.getElementById("filterStatusSelect");

    if (searchInput) searchInput.addEventListener("input", filterDiscountsData);
    if (typeSelect) typeSelect.addEventListener("change", filterDiscountsData);
    if (statusSelect) statusSelect.addEventListener("change", filterDiscountsData);

    // ទាញទិន្នន័យពី API មកបង្ហាញលើតារាងដំបូង
    fetchDiscounts();
});

// ==========================================
// ១. មុខងារទាញទិន្នន័យ និងបង្ហាញតម្លៃពេញ % + ពិនិត្យថ្ងៃផុតកំណត់
// ==========================================
async function fetchDiscounts() {
    const tableBody = document.getElementById("discounts-table-body");
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/discounts`);
        if (!response.ok) throw new Error("Server Error");

        allDiscounts = await response.json();

        const countBadge = document.getElementById("active-discounts-count");
        if (countBadge) countBadge.innerText = `${allDiscounts.length} កម្មវិធី`;

        // បង្ហាញទិន្នន័យដើមទៅកាន់ Table
        renderDiscountsTable(allDiscounts);

    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: red; padding: 20px;">⚠️ មិនអាចតភ្ជាប់ទៅកាន់ API Server បានទេ! ប៉ុន្តែប៊ូតុងបង្កើតថ្មីនៅតែដំណើរការ។</td></tr>`;
    }
}

// មុខងារ Render បោះទិន្នន័យចូលតារាង HTML
function renderDiscountsTable(dataList) {
    const tableBody = document.getElementById("discounts-table-body");
    if (!tableBody) return;

    tableBody.innerHTML = "";
    const todayStr = new Date().toISOString().split('T')[0];

    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding: 20px; color: #6b7280;">🔍 មិនមានទិន្នន័យឡើយ!</td></tr>`;
        return;
    }

    dataList.forEach(item => {
        let currentStatus = item.STATUS;
        if (item.END_DATE < todayStr) {
            currentStatus = "Expired";
        }

        const statusClass = currentStatus === "Active" ? "status-active" : "status-expired";
        const statusText = currentStatus === "Active" ? "🟢 កំពុងដើរ" : "🔴 ផុតកំណត់";

        let displayValue = item.DISCOUNT_VALUE;
        if (item.DISCOUNT_TYPE === "Percentage") {
            displayValue = (item.DISCOUNT_VALUE < 1) ? (item.DISCOUNT_VALUE * 100) + "%" : item.DISCOUNT_VALUE + "%";
        } else {
            displayValue = "$" + item.DISCOUNT_VALUE;
        }

        const promoImage = (item.IMAGE_DATA && item.IMAGE_DATA !== "N/A")
            ? item.IMAGE_DATA
            : "https://placehold.co/600x400/881337/ffffff?text=No+Image";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><b>#${item.DISCOUNT_ID}</b></td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${promoImage}" class="zoomable-img" onclick="zoomImage('${promoImage}', '${item.DISCOUNT_NAME}')" 
                         style="width: 55px; height: 40px; border-radius: 6px; object-fit: cover; cursor: pointer; border: 1px solid #fecdd3;">
                    <div>
                        <b style="color: #881337; display:block;">${item.DISCOUNT_NAME}</b>
                    </div>
                </div>
            </td>
            <td><span class="badge-type">${item.DISCOUNT_TYPE === "Percentage" ? "ភាគរយ (%)" : "ទឹកប្រាក់ ($)"}</span></td>
            <td><b style="color: #dc2626; font-size: 15px;">${displayValue}</b></td>
            <td><small>📅 ${item.START_DATE}</small></td>
            <td><small>⌛ ${item.END_DATE}</small></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editDiscount(${item.DISCOUNT_ID})" style="background-color: #eab308; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                    <i class="fa-solid fa-pen"></i> កែប្រែ
                </button>
                <button class="btn-delete" onclick="deleteDiscount(${item.DISCOUNT_ID})" style="background-color: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    <i class="fa-solid fa-trash"></i> លុប
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// ២. មុខងារចុចពង្រីករូបភាព (Lightbox)
// ==========================================
function createImageLightboxMarkup() {
    let lightbox = document.getElementById("imageLightbox");
    if (!lightbox) {
        lightbox = document.createElement("div");
        lightbox.id = "imageLightbox";
        lightbox.style = `
            display: none; position: fixed; z-index: 9999; top: 0; left: 0; 
            width: 100%; height: 100%; background-color: rgba(0,0,0,0.85); 
            align-items: center; justify-content: center;
        `;
        lightbox.innerHTML = `
            <div style="position: relative; max-width: 85%; max-height: 85%; display: flex; flex-direction: column; align-items: center;">
                <span id="closeZoomBtn" style="position: absolute; top: -18px; right: -18px; color: #ffffff; font-size: 28px; font-weight: bold; cursor: pointer; background: #881337; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; line-height: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.3); z-index: 10000;" onclick="closeZoom()">&times;</span>
                <img id="lightboxImg" style="max-width: 100%; max-height: 75vh; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); transform: scale(0.95); transition: transform 0.2s ease; cursor: pointer;">
                <h3 id="lightboxCaption" style="color: white; margin-top: 15px; font-family: 'Kantumruy Pro', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.8);"></h3>
            </div>
        `;
        document.body.appendChild(lightbox);

        const lightboxImg = document.getElementById("lightboxImg");
        lightboxImg.addEventListener("dblclick", closeZoom);
    }
}

function zoomImage(imgSrc, caption) {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaption = document.getElementById("lightboxCaption");

    if (lightbox && lightboxImg && lightboxCaption) {
        lightboxImg.src = imgSrc;
        lightboxCaption.innerText = caption;
        lightbox.style.display = "flex";
        setTimeout(() => { lightboxImg.style.transform = "scale(1)"; }, 50);
    }
}

// មុខងារស្វែងរក និង ចម្រោះទិន្នន័យ (Search & Multi-Filter)
function filterDiscountsData() {
    const searchKey = document.getElementById("searchPromoInput").value.toLowerCase().trim();
    const selectedType = document.getElementById("filterTypeSelect").value;
    const selectedStatus = document.getElementById("filterStatusSelect").value;
    const todayStr = new Date().toISOString().split('T')[0];

    const filtered = allDiscounts.filter(item => {
        const matchesName = item.DISCOUNT_NAME.toLowerCase().includes(searchKey);
        const matchesType = (selectedType === "All") || (item.DISCOUNT_TYPE === selectedType);

        let currentStatus = item.STATUS;
        if (item.END_DATE < todayStr) {
            currentStatus = "Expired";
        }
        const matchesStatus = (selectedStatus === "All") || (currentStatus === selectedStatus);

        return matchesName && matchesType && matchesStatus;
    });

    renderDiscountsTable(filtered);
}

function closeZoom() {
    const lightbox = document.getElementById("imageLightbox");
    const lightboxImg = document.getElementById("lightboxImg");
    if (lightbox && lightboxImg) {
        lightbox.style.display = "none";
        lightboxImg.style.transform = "scale(0.95)";
    }
}

// ==========================================
// ៣. មុខងារប៊ូតុងបង្កើតថ្មី (CREATE) និងកែប្រែ (EDIT) រក្សាទុកទៅ API
// ==========================================
function setupModalEvents() {
    const modal = document.getElementById("discountModal");
    const openBtn = document.getElementById("openModalBtn");
    const form = document.getElementById("discountForm");

    if (openBtn) {
        openBtn.onclick = () => {
            const hiddenId = document.getElementById("discountIdHidden");
            const imgPreview = document.getElementById("imagePreview");
            const modalTitle = document.getElementById("modalTitle");
            const submitBtn = document.getElementById("submitBtn");

            if (hiddenId) hiddenId.value = "";
            if (form) form.reset();
            if (imgPreview) imgPreview.src = "https://placehold.co/600x400/881337/ffffff?text=ឡូហ្គោប្រូម៉ូសិន";
            base64ImageStr = "";

            if (modalTitle) modalTitle.innerHTML = "🎁 បង្កើតកម្មវិធីប្រូម៉ូសិនថ្មី";
            if (submitBtn) submitBtn.innerText = "រក្សាទុកទិន្នន័យ";
            if (modal) modal.style.display = "flex";
        };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById("discountIdHidden").value;
            const submitBtn = document.getElementById("submitBtn");

            const dataPayload = {
                DISCOUNT_NAME: document.getElementById("discountName").value,
                DISCOUNT_TYPE: document.getElementById("discountType").value,
                DISCOUNT_VALUE: parseFloat(document.getElementById("discountValue").value),
                START_DATE: document.getElementById("startDate").value,
                END_DATE: document.getElementById("endDate").value,
                STATUS: document.getElementById("discountStatus").value,
                IMAGE_DATA: base64ImageStr ? base64ImageStr : "N/A"
            };

            // បំប្លែងតម្លៃជាភាគរយទៅជាលេខទសភាគ (ឧ. 10 ទៅជា 0.1) មុនផ្ញើទៅ Back-end
            if (dataPayload.DISCOUNT_TYPE === "Percentage" && dataPayload.DISCOUNT_VALUE > 1) {
                dataPayload.DISCOUNT_VALUE = dataPayload.DISCOUNT_VALUE / 100;
            }

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/discounts/${id}` : `${API_BASE_URL}/discounts`;
            const method = isEdit ? "PUT" : "POST";

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerText = "កំពុងរក្សាទុក...";
                }

                const response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataPayload)
                });

                if (response.ok) {
                    alert(isEdit ? "🎉 ធ្វើបច្ចុប្បន្នភាពទិន្នន័យជោគជ័យ!" : "🎉 បង្កើតកម្មវិធីប្រូម៉ូសិនថ្មីជោគជ័យ!");
                    if (modal) modal.style.display = "none";
                    fetchDiscounts();
                } else {
                    alert("❌ មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យទៅកាន់ Server");
                }
            } catch (error) {
                console.error(error);
                alert("❌ បរាជ័យក្នុងការតភ្ជាប់ទៅកាន់ API!");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = "រក្សាទុកទិន្នន័យ";
                }
            }
        };
    }
}

function editDiscount(id) {
    const item = allDiscounts.find(d => d.DISCOUNT_ID === id);
    if (!item) return;

    const modal = document.getElementById("discountModal");
    if (!modal) return;

    document.getElementById("discountIdHidden").value = item.DISCOUNT_ID;
    document.getElementById("discountName").value = item.DISCOUNT_NAME;
    document.getElementById("discountType").value = item.DISCOUNT_TYPE;

    // បង្ហាញជាលេខពេញក្នុង Form កែប្រែ (ឧ. 0.1 ប្តូរជា 10 វិញ)
    let val = item.DISCOUNT_VALUE;
    if (item.DISCOUNT_TYPE === "Percentage" && item.DISCOUNT_VALUE < 1) {
        val = item.DISCOUNT_VALUE * 100;
    }
    document.getElementById("discountValue").value = val;

    document.getElementById("startDate").value = item.START_DATE;
    document.getElementById("endDate").value = item.END_DATE;
    document.getElementById("discountStatus").value = item.STATUS;

    const imgPreview = document.getElementById("imagePreview");
    if (imgPreview) {
        if (item.IMAGE_DATA && item.IMAGE_DATA !== "N/A") {
            imgPreview.src = item.IMAGE_DATA;
            base64ImageStr = item.IMAGE_DATA;
        } else {
            imgPreview.src = "https://placehold.co/600x400/881337/ffffff?text=No+Image";
            base64ImageStr = "";
        }
    }

    document.getElementById("modalTitle").innerHTML = `📝 កែប្រែកម្មវិធីប្រូម៉ូសិន #${id}`;
    document.getElementById("submitBtn").innerText = "ធ្វើបច្ចុប្បន្នភាព";
    modal.style.display = "flex";
}

// ==========================================
// ៤. មុខងារលុបទិន្នន័យ (DELETE)
// ==========================================
async function deleteDiscount(id) {
    if (confirm(`⚠️ តើអ្នកពិតជាចង់លុបកម្មវិធីប្រូម៉ូសិន #${id} នេះមែនទេ?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/discounts/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                alert("🗑️ បានលុបកម្មវិធីប្រូម៉ូសិនដោយជោគជ័យ!");
                fetchDiscounts();
            } else {
                alert("❌ មិនអាចលុបបានឡើយ!");
            }
        } catch (error) {
            console.error(error);
            alert("❌ មានបញ្ហាបច្ចេកទេសក្នុងការតភ្ជាប់ទៅកាន់ Server!");
        }
    }
}

function previewAndConvertImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const imgPreview = document.getElementById("imagePreview");
            if (imgPreview) imgPreview.src = e.target.result;
            base64ImageStr = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// ចងភ្ជាប់អនុគមន៍ទៅ Window Scope
window.editDiscount = editDiscount;
window.deleteDiscount = deleteDiscount;
window.zoomImage = zoomImage;
window.closeZoom = closeZoom;
window.previewAndConvertImage = previewAndConvertImage;
window.filterDiscountsData = filterDiscountsData;