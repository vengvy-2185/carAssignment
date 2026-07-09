const API_BASE_URL = "http://127.0.0.1:8000/api";
let allRentals = [];
let comboboxData = { customers: [], available_vehicles: [], discounts: [] };

document.addEventListener("DOMContentLoaded", () => {
    setupRentalModalEvents();

    const searchInput = document.getElementById("searchRentalInput");
    const statusSelect = document.getElementById("filterRentalStatus");

    if (searchInput) searchInput.addEventListener("input", filterRentalsData);
    if (statusSelect) statusSelect.addEventListener("change", filterRentalsData);

    // ទាញយកទិន្នន័យ Combobox រួចរាល់ ទើបចាប់ផ្តើមទាញទិន្នន័យតារាងជួល
    loadComboboxData().then(() => {
        fetchRentals();
    });
});

// ========================================================
// ១. មុខងារទាញយកទិន្នន័យ Combobox ពី API (Customers, Free Vehicles, Discounts)
// ========================================================
async function loadComboboxData() {
    try {
        const response = await fetch(`${API_BASE_URL}/combobox-data`);
        if (response.ok) {
            comboboxData = await response.json();
        }
    } catch (error) {
        console.error("Error loading combobox data:", error);
    }
}

// មុខងារចាក់បំពេញទិន្នន័យចូលទៅក្នុង <select> (Combobox)
function populateComboboxes(currentVehicleId = null, currentVehicleName = "") {
    const custSelect = document.getElementById("customerId");
    const vehSelect = document.getElementById("vehicleId");
    const discSelect = document.getElementById("discountId");

    // បំពេញអតិថិជន
    custSelect.innerHTML = '<option value="">-- ជ្រើសរើសអតិថិជន --</option>';
    comboboxData.customers.forEach(c => {
        custSelect.innerHTML += `<option value="${c.id}">${c.name} (ID: ${c.id})</option>`;
    });

    // បំពេញរថយន្ត (លាក់ឡានដែលកំពុងជាប់ Active ជួល)
    vehSelect.innerHTML = '<option value="">-- ជ្រើសរើសរថយន្ត --</option>';
    comboboxData.available_vehicles.forEach(v => {
        vehSelect.innerHTML += `<option value="${v.id}">${v.name}</option>`;
    });

    // ករណីពិសេសពេល Edit៖ ប្រសិនបើឡាននោះកំពុង Active តែជាឡានរបស់កិច្ចសន្យានេះ ត្រូវតែបង្ហាញវាឱ្យជ្រើសរើសវិញ
    if (currentVehicleId && !comboboxData.available_vehicles.some(v => v.id === currentVehicleId)) {
        vehSelect.innerHTML += `<option value="${currentVehicleId}">${currentVehicleName} (ឡានបច្ចុប្បន្ន)</option>`;
    }

    // បំពេញកម្មវិធីបញ្ចុះតម្លៃ
    discSelect.innerHTML = '<option value="">-- គ្មានប្រូម៉ូសិន --</option>';
    comboboxData.discounts.forEach(d => {
        discSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
}

// ========================================================
// ២. មុខងារគ្រប់គ្រងការបង្ហាញតារាងទិន្នន័យ (Render Table)
// ========================================================
function renderRentalsTable(dataList) {
    const tableBody = document.getElementById("rentals-table-body");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (dataList.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding: 20px; color: #64748b;">🔍 មិនមានទិន្នន័យឡើយ!</td></tr>`;
        return;
    }

    dataList.forEach(item => {
        let statusClass = "status-expired";
        let statusText = "🟡 កក់ទុកមុន";

        if (item.STATUS === "Active") { statusClass = "status-active"; statusText = "🟢 កំពុងជួល"; }
        else if (item.STATUS === "Returned") { statusClass = "status-type"; statusText = "🔵 បានប្រគល់"; }

        const row = document.createElement("tr");
        row.innerHTML = `
            <td><b>#${item.RENTAL_ID}</b></td>
            <td><i class="fa-solid fa-user" style="color: #4c1d95;"></i> <b>${item.CUSTOMER_NAME}</b> <br><small style="color:#94a3b8">ID: ${item.CUSTOMER_ID}</small></td>
            <td><i class="fa-solid fa-car" style="color: #10b981;"></i> <b>${item.VEHICLE_NAME}</b> <br><small style="color:#94a3b8">ID: ${item.VEHICLE_ID}</small></td>
            <td><small>📅 ${item.RENTAL_DATE}</small></td>
            <td><small>⌛ ${item.RETURN_PLAN}</small></td>
            <td><b>${item.START_ODOMETER} Km</b></td>
            <td><b style="color: #10b981;">$${parseFloat(item.DEPOSIT_AMOUNT).toFixed(2)}</b></td>
            <td><span class="badge-type"><i class="fa-solid fa-tag"></i> ${item.DISCOUNT_NAME}</span></td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <button class="btn-edit" onclick="editRental(${item.RENTAL_ID})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-delete" onclick="deleteRental(${item.RENTAL_ID})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function fetchRentals() {
    try {
        const response = await fetch(`${API_BASE_URL}/rentals`);
        if (response.ok) {
            allRentals = await response.json();

            // គណនាចំនួនបង្ហាញលើ Metrics
            const activeCount = allRentals.filter(item => item.STATUS === "Active").length;
            const totalDeposit = allRentals.reduce((sum, item) => sum + parseFloat(item.DEPOSIT_AMOUNT || 0), 0);

            document.getElementById("active-rentals-count").innerText = `${activeCount} គ្រឿង`;
            document.getElementById("total-deposit-amount").innerText = `$${totalDeposit.toFixed(2)}`;

            renderRentalsTable(allRentals);
        }
    } catch (error) {
        console.error("Error fetching rentals:", error);
    }
}

// ========================================================
// ៣. មុខងារស្វែងរក និងចម្រោះទិន្នន័យ (Search & Filter)
// ========================================================
function filterRentalsData() {
    const searchKey = document.getElementById("searchRentalInput").value.toLowerCase().trim();
    const selectedStatus = document.getElementById("filterRentalStatus").value;

    const filtered = allRentals.filter(item => {
        const matchesSearch = item.RENTAL_ID.toString().includes(searchKey) ||
            item.CUSTOMER_NAME.toLowerCase().includes(searchKey) ||
            item.VEHICLE_NAME.toLowerCase().includes(searchKey);
        const matchesStatus = (selectedStatus === "All") || (item.STATUS === selectedStatus);
        return matchesSearch && matchesStatus;
    });
    renderRentalsTable(filtered);
}

// ========================================================
// ៤. មុខងារសម្រាប់ បង្កើត និង កែប្រែកិច្ចសន្យា (Create & Edit)
// ========================================================
function setupRentalModalEvents() {
    const modal = document.getElementById("rentalModal");
    const openBtn = document.getElementById("openRentalModalBtn");
    const closeBtn = document.getElementById("closeRentalModalBtn");
    const form = document.getElementById("rentalForm");

    if (openBtn) {
        openBtn.onclick = async () => {
            document.getElementById("rentalIdHidden").value = "";
            if (form) form.reset();

            // ទាញទិន្នន័យឡានទំនេរចុងក្រោយបង្អស់ពី Server រួចដាក់ចូល Combobox
            await loadComboboxData();
            populateComboboxes();

            document.getElementById("rentalModalTitle").innerHTML = "🔑 បង្កើតកិច្ចសន្យាជួលរថយន្តថ្មី";
            if (modal) modal.style.display = "flex";
        };
    }

    if (closeBtn) {
        closeBtn.onclick = () => { if (modal) modal.style.display = "none"; };
    }

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById("rentalIdHidden").value;
            const discVal = document.getElementById("discountId").value;

            const dataPayload = {
                CUSTOMER_ID: parseInt(document.getElementById("customerId").value),
                VEHICLE_ID: parseInt(document.getElementById("vehicleId").value),
                RENTAL_DATE: document.getElementById("rentalDate").value,
                RETURN_PLAN: document.getElementById("returnPlan").value,
                START_ODOMETER: parseInt(document.getElementById("startOdometer").value),
                DEPOSIT_AMOUNT: parseFloat(document.getElementById("depositAmount").value),
                DISCOUNT_ID: discVal ? parseInt(discVal) : null,
                STATUS: document.getElementById("rentalStatus").value
            };

            const isEdit = id !== "";
            const url = isEdit ? `${API_BASE_URL}/rentals/${id}` : `${API_BASE_URL}/rentals`;
            const method = isEdit ? "PUT" : "POST";

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dataPayload)
                });
                if (response.ok) {
                    alert("🎉 រក្សាទុកទិន្នន័យបានជោគជ័យ!");
                    if (modal) modal.style.display = "none";
                    await loadComboboxData(); // ធ្វើបច្ចុប្បន្នភាពទិន្នន័យឡានទំនេរឡើងវិញ
                    fetchRentals();
                } else {
                    const errorText = await response.text();
                    alert(`❌ បរាជ័យ៖ ${errorText}`);
                }
            } catch (error) {
                alert("❌ មានបញ្ហាតភ្ជាប់ទៅកាន់ Server!");
            }
        };
    }
}

async function editRental(id) {
    const item = allRentals.find(r => r.RENTAL_ID === id);
    if (!item) return;

    // ទាញយកព័ត៌មានឡានទំនេរថ្មីៗ រួចចាក់ចូល Combobox ដោយបើកឡានបច្ចុប្បន្នឱ្យឃើញឡើងវិញ
    await loadComboboxData();
    populateComboboxes(item.VEHICLE_ID, item.VEHICLE_NAME);

    // ចាក់បំពេញទិន្នន័យទៅលើ Form
    document.getElementById("rentalIdHidden").value = item.RENTAL_ID;
    document.getElementById("customerId").value = item.CUSTOMER_ID;
    document.getElementById("vehicleId").value = item.VEHICLE_ID;
    document.getElementById("rentalDate").value = item.RENTAL_DATE;
    document.getElementById("returnPlan").value = item.RETURN_PLAN;
    document.getElementById("startOdometer").value = item.START_ODOMETER;
    document.getElementById("depositAmount").value = item.DEPOSIT_AMOUNT;
    document.getElementById("discountId").value = item.DISCOUNT_ID || "";
    document.getElementById("rentalStatus").value = item.STATUS;

    document.getElementById("rentalModalTitle").innerHTML = `📝 កែប្រែកិច្ចសន្យាជួល #${id}`;
    document.getElementById("rentalModal").style.display = "flex";
}

// ========================================================
// ៥. មុខងារលុបទិន្នន័យ (DELETE)
// ========================================================
async function deleteRental(id) {
    if (confirm(`⚠️ តើអ្នកពិតជាចង់លុបកិច្ចសន្យាជួល #${id} មែនទេ?`)) {
        try {
            const response = await fetch(`${API_BASE_URL}/rentals/${id}`, { method: "DELETE" });
            if (response.ok) {
                await loadComboboxData();
                fetchRentals();
            }
        } catch (error) { alert("❌ បរាជ័យក្នុងការលុប!"); }
    }
}

// ដាក់មុខងារចូលក្នុង Window Scope ដើម្បីឱ្យប៊ូតុងក្នុង Table អាចហៅប្រើបាន
window.editRental = editRental;
window.deleteRental = deleteRental;
window.filterRentalsData = filterRentalsData;