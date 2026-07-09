const API_BASE_URL = "http://127.0.0.1:8000/api";
let allCustomers = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchCustomers();
    initModalEvents();
    initSearchEvent();
});

// ទាញទិន្នន័យអតិថិជន និងធ្វើបច្ចុប្បន្នភាពចំនួនសរុប (Total Summary)
async function fetchCustomers() {
    const tableBody = document.getElementById("customers-table-body");
    try {
        const response = await fetch(`${API_BASE_URL}/customers`);
        if (!response.ok) throw new Error("មិនអាចទាញទិន្នន័យបានឡើយ");

        allCustomers = await response.json();

        // បង្ហាញការបូកសរុបអតិថិជនទៅកាន់ Stat Card
        document.getElementById("total-customers-count").innerText = `${allCustomers.length} នាក់`;

        displayCustomers(allCustomers);
    } catch (error) {
        console.error("Error:", error);
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: #ef4444; font-weight: bold; padding: 20px;">⚠️ មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ Database! សូមពិនិត្យ API Server របស់អ្នក។</td></tr>`;
    }
}

function displayCustomers(customersList) {
    const tableBody = document.getElementById("customers-table-body");
    tableBody.innerHTML = "";

    if (customersList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color: #64748b;">មិនមានទិន្នន័យអតិថិជនឡើយ។</td></tr>`;
        return;
    }

    customersList.forEach(customer => {
        const row = document.createElement("tr");

        let photoHTML = `<i class="fa-solid fa-user-circle fa-2x" style="color: #cbd5e1;"></i>`;
        if (customer.PHOTO && customer.PHOTO !== "N/A") {
            photoHTML = `<img src="${customer.PHOTO}" alt="Photo" style="width: 35px; height: 35px; border-radius: 50%; object-fit: cover; border: 1px solid #cbd5e1;">`;
        }

        row.innerHTML = `
            <td><b>#${customer.CUSTOMER_ID}</b></td>
            <td>${photoHTML}</td>
            <td>${customer.FULL_NAME}</td>
            <td>${customer.PHONE}</td>
            <td>${customer.ADDRESS}</td>
            <td><span class="badge" style="color: #071c4b; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${customer.ID_CARD_OR_PASSPORT}</span></td>
            <td>${customer.REGISTER_DATE}</td>
            <td>
                <button class="btn-edit" onclick="editCustomer(${customer.CUSTOMER_ID})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-delete" onclick="deleteCustomer(${customer.CUSTOMER_ID})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function initSearchEvent() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredCustomers = allCustomers.filter(customer => {
            const fullName = customer.FULL_NAME ? customer.FULL_NAME.toLowerCase() : "";
            const phone = customer.PHONE ? customer.PHONE.toLowerCase() : "";
            return fullName.includes(searchTerm) || phone.includes(searchTerm);
        });
        displayCustomers(filteredCustomers);
    });
}

function initModalEvents() {
    const modal = document.getElementById("customerModal");
    const openBtn = document.getElementById("openModalBtn");
    const closeBtn = document.getElementById("closeModalBtn");
    const form = document.getElementById("addCustomerForm");

    openBtn.onclick = () => {
        document.getElementById("customerIdHidden").value = "";
        document.getElementById("modalTitle").innerHTML = `<i class="fa-solid fa-user-plus"></i> បញ្ចូលព័ត៌មានអតិថិជនថ្មី`;
        document.getElementById("submitBtn").innerText = "រក្សាទុកទិន្នន័យ";
        form.reset();
        modal.style.display = "block";
    };

    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById("customerIdHidden").value;

        const customerData = {
            FULL_NAME: document.getElementById("fullName").value,
            PHONE: document.getElementById("phone").value,
            ADDRESS: document.getElementById("address").value,
            ID_CARD_OR_PASSPORT: document.getElementById("idCard").value
        };

        const isEdit = id !== "";
        const url = isEdit ? `${API_BASE_URL}/customers/${id}` : `${API_BASE_URL}/customers`;
        const method = isEdit ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customerData)
            });

            if (response.ok) {
                alert(isEdit ? "🎉 បានកែប្រែព័ត៌មានអតិថិជនជោគជ័យ!" : "🎉 បានបញ្ចូលព័ត៌មានថ្មីដោយជោគជ័យ!");
                form.reset();
                modal.style.display = "none";
                fetchCustomers();
            } else {
                const errData = await response.json();
                alert("❌ បរាជ័យ: " + errData.detail);
            }
        } catch (error) {
            console.error("Error saving customer:", error);
            alert("❌ មានបញ្ហាបច្ទេកទេស!");
        }
    };
}

function editCustomer(id) {
    const customer = allCustomers.find(c => c.CUSTOMER_ID === id);
    if (!customer) return;

    document.getElementById("customerIdHidden").value = customer.CUSTOMER_ID;
    document.getElementById("fullName").value = customer.FULL_NAME;
    document.getElementById("phone").value = customer.PHONE;
    document.getElementById("address").value = customer.ADDRESS === "N/A" ? "" : customer.ADDRESS;
    document.getElementById("idCard").value = customer.ID_CARD_OR_PASSPORT;

    document.getElementById("modalTitle").innerHTML = `<i class="fa-solid fa-user-pen"></i> កែប្រែព័ត៌មានអតិថិជន #${id}`;
    document.getElementById("submitBtn").innerText = "ធ្វើបច្ចុប្បន្នភាព";

    document.getElementById("customerModal").style.display = "block";
}

async function deleteCustomer(id) {
    if (confirm(`តើអ្នកប្រាកដជាចង់លុបអតិថិជនលេខរៀង #${id} នេះមែនទេ?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
                method: "DELETE"
            });

            if (response.ok) {
                alert("🗑️ លុបទិន្នន័យបានជោគជ័យ!");
                fetchCustomers();
            } else {
                const errData = await response.json();
                alert("❌ មិនអាចលុបបានទេ: " + errData.detail);
            }
        } catch (error) {
            console.error("Error deleting customer:", error);
            alert("❌ មានបញ្ហាក្នុងការតភ្ជាប់!");
        }
    }
}