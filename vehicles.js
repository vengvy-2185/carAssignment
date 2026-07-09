// ==========================================
// ១. ការប្រកាស URL API និងប្រថាប់ទិន្នន័យសកល
// ==========================================
const BASE_URL = 'http://127.0.0.1:8000/api';
const VEHICLES_API_URL = `${BASE_URL}/vehicles`;
const TYPES_API_URL = `${BASE_URL}/vehicle-types`; // ផ្លូវទៅកាន់ API ប្រភេទឡាន

let allVehicles = [];
let allTypes = []; // សម្រាប់រក្សាទុកប្រភេទឡានដែលទាញចេញពី DB
let currentFilterStatus = 'All';
let activeVehicleData = null;
let slideIndex = 1;

// ==========================================
// ២. ដំណើរការនៅពេលទំព័រដើម Load រួចរាល់
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof showSlides === 'function') showSlides(slideIndex); // ដំណើរការ Slide Show បដាខាងលើ

    try {
        // ផ្អាកចាំឱ្យវាទាញទិន្នន័យប្រភេទឡាន និងបញ្ជីឡានពី Database មកឱ្យហើយត្រៀមស្រេច
        await Promise.all([
            loadVehicleTypes(),
            loadVehiclesData()
        ]);
        console.log("ប្រព័ន្ធដំណើរការប្រមូលទិន្នន័យពី Database ជោគជ័យដំបូង!");
    } catch (error) {
        console.error("មានបញ្ហាក្នុងការចាប់ផ្តើមទាញទិន្នន័យរួម៖", error);
    }

    // ចាប់ព្រឹត្តិការណ៍ Search ពេលអ្នកប្រើវាយអក្សរ
    const searchInput = document.getElementById('vehicleSearch');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilterAndSearch);
    }

    // ចាប់ព្រឹត្តិការណ៍ Submit លើ Form
    const vehicleForm = document.getElementById('vehicleForm');
    if (vehicleForm) {
        vehicleForm.addEventListener('submit', saveVehicle);
    }
});

// ==========================================
// ៣. មុខងារទាញយក និងបង្ហាញទិន្នន័យ (DYNAMIC API FETCH)
// ==========================================

// 🔄 មុខងារទាញយកប្រភេទឡានពី Oracle DB មកដាក់ក្នុង Dropdown (ស្វ័យប្រវត្តិពិតប្រាកដ)
async function loadVehicleTypes() {
    try {
        const response = await fetch(TYPES_API_URL);
        if (!response.ok) throw new Error("Fetch មិនបានជោគជ័យ");

        allTypes = await response.json();
        const selectElement = document.getElementById('formTypeId');

        if (selectElement) {
            // សម្អាត និងដាក់តម្លៃលំនាំដើម
            selectElement.innerHTML = '<option value="">-- សូមជ្រើសរើសប្រភេទឡាន --</option>';

            // ករណីមានទិន្នន័យ វានឹងរុញចូល Dropdown ស្វ័យប្រវត្តិ
            allTypes.forEach(type => {
                let opt = document.createElement('option');
                opt.value = type.TYPE_ID; // បញ្ជូនទៅ DB ជាលេខ ID ឧទហរណ៍៖ 1, 2
                opt.innerText = `${type.TYPE_NAME} ($${type.DAILY_RATE}/ថ្ងៃ)`; // បង្ហាញលើអេក្រង់
                selectElement.appendChild(opt);
            });
            console.log("✨ បានទាញទិន្នន័យប្រភេទឡានពី DB មកបំពេញស្វ័យប្រវត្តិ៖", allTypes);
        }
    } catch (e) {
        console.error("Error loading types:", e);
        const selectElement = document.getElementById('formTypeId');
        if (selectElement) {
            selectElement.innerHTML = '<option value="">❌ មិនអាចទាញទិន្នន័យប្រភេទបានទេ (ពិនិត្យ Backend)</option>';
        }
    }
}

// ទាញយកបញ្ជីឡានទាំងអស់ពី Backend
async function loadVehiclesData() {
    try {
        const response = await fetch(VEHICLES_API_URL);
        if (!response.ok) throw new Error("មិនអាចទាញយកទិន្នន័យឡានបានទេ");

        allVehicles = await response.json();
        applyFilterAndSearch();
    } catch (error) {
        console.error("Error loading vehicles:", error);
        const tableBody = document.getElementById('vehicles-table-body');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:red; font-weight:bold;">❌ មិនអាចទាញទិន្នន័យបានទេ! (ពិនិត្យ Backend)</td></tr>`;
        }
    }
}

// មុខងារចម្រាញ់ទិន្នន័យ (Filter & Search)
function applyFilterAndSearch() {
    const searchInput = document.getElementById('vehicleSearch');
    const searchKeyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = allVehicles.filter(car => {
        const carStatus = (car.STATUS || '').trim().toLowerCase();
        const filterStatusLower = currentFilterStatus.toLowerCase();
        const matchesStatus = (currentFilterStatus === 'All') || (carStatus === filterStatusLower);

        const matchesKeyword = (car.BRAND_MODEL || '').toLowerCase().includes(searchKeyword) ||
            (car.PLATE_NO || '').toLowerCase().includes(searchKeyword) ||
            (car.TYPE_NAME || '').toLowerCase().includes(searchKeyword);
        return matchesStatus && matchesKeyword;
    });

    renderVehicleTable(filtered);
}

// គូរតារាងរថយន្តបង្ហាញលើអេក្រង់
function renderVehicleTable(data) {
    const tableBody = document.getElementById('vehicles-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center">រកមិនឃើញទិន្នន័យឡើយ</td></tr>`;
        return;
    }

    data.forEach(car => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.onclick = () => showVehicleDetail(car);

        const status = (car.STATUS || 'Available').trim();
        let statusClass = 'status-available';
        if (status === 'Rented') statusClass = 'status-rented';
        if (status === 'Maintenance') statusClass = 'status-maintenance';

        const hasImageText = car.VEHICLE_IMAGE
            ? `<span style="color:#10b981; font-size:12px;"><i class="fa-solid fa-image"></i> មានរូបភាព</span>`
            : `<span style="color:#94a3b8; font-size:12px;"><i class="fa-solid fa-image-slash"></i> គ្មានរូប</span>`;

        row.innerHTML = `
            <td><b>${car.VEHICLE_ID}</b></td>
            <td>${hasImageText}</td>
            <td><strong>${car.BRAND_MODEL ?? 'N/A'}</strong></td>
            <td><span class="plate-badge-style">${car.PLATE_NO ?? 'N/A'}</span></td>
            <td>${car.COLOR ?? 'N/A'}</td>
            <td><b style="color:#7c3aed;">${car.TYPE_NAME ?? 'Unknown'}</b></td>
            <td><b style="color:#10b981;">$${car.DAILY_RATE ?? 0}</b></td>
            <td><span class="badge ${statusClass}">${status}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

// ==========================================
// ៤. ផ្ទាំងបង្ហាញព័ត៌មានលម្អិត (DETAIL VIEW POP-UP)
// ==========================================
function showVehicleDetail(car) {
    activeVehicleData = car;
    document.getElementById('modalVehicleId').innerText = car.VEHICLE_ID;
    document.getElementById('modalTypeName').innerText = car.TYPE_NAME ?? 'N/A';
    document.getElementById('modalBrandModel').innerText = car.BRAND_MODEL ?? 'N/A';
    document.getElementById('modalPlateNo').innerText = car.PLATE_NO ?? 'N/A';
    document.getElementById('modalColor').innerText = car.COLOR ?? 'N/A';
    document.getElementById('modalDailyRate').innerText = `$${car.DAILY_RATE ?? 0}/ថ្ងៃ`;
    document.getElementById('modalStatus').innerText = car.STATUS ?? 'Available';

    const img = document.getElementById('modalVehicleImage');
    const noTxt = document.getElementById('noImageText');

    if (car.VEHICLE_IMAGE) {
        img.src = `data:image/jpeg;base64,${car.VEHICLE_IMAGE}`;
        img.style.display = 'inline-block';
        noTxt.style.display = 'none';
    } else {
        img.style.display = 'none';
        noTxt.style.display = 'block';
    }
    document.getElementById('vehicleDetailModal').style.display = 'flex';
}

// ==========================================
// ៥. ដំណើរការបន្ថែម និងកែប្រែទិន្នន័យ (CREATE & EDIT)
// ==========================================

// បើកផ្ទាំងបន្ថែមឡានថ្មី (Create)
const btnOpenCreateModal = document.getElementById('btnOpenCreateModal');
if (btnOpenCreateModal) {
    btnOpenCreateModal.onclick = async () => {
        document.getElementById('vehicleForm').reset();
        document.getElementById('formVehicleId').value = '';
        document.getElementById('formModalTitle').innerText = 'បញ្ចូលរថយន្តថ្មី';
        document.getElementById('formImgPreview').style.display = 'none';
        document.getElementById('formImageBase64').value = '';

        // ធានាថា Dropdown មានទិន្នន័យថ្មីចុងក្រោយជានិច្ច
        await loadVehicleTypes();

        document.getElementById('vehicleFormModal').style.display = 'flex';
    };
}

// 🛠️ បើកផ្ទាំងកែប្រែទិន្នន័យ (Edit) និងកំណត់តម្លៃចាស់ឱ្យ Dropdown ស្វ័យប្រវត្តិ
const btnEditVehicle = document.getElementById('btnEditVehicle');
if (btnEditVehicle) {
    btnEditVehicle.onclick = async () => {
        if (!activeVehicleData) return;

        document.getElementById('formVehicleId').value = activeVehicleData.VEHICLE_ID;
        document.getElementById('formPlateNo').value = activeVehicleData.PLATE_NO ?? '';
        document.getElementById('formColor').value = activeVehicleData.COLOR ?? '';
        document.getElementById('formBrandModel').value = activeVehicleData.BRAND_MODEL ?? '';
        document.getElementById('formStatus').value = activeVehicleData.STATUS ?? 'Available';

        // ទាញយកប្រភេទឡានថ្មីៗចុងក្រោយបង្អស់ពី DB មកបំពេញ Dropdown ជាមុនសិន
        await loadVehicleTypes();

        // កំណត់តម្លៃចាស់ឱ្យ Dropdown រើសយកស្វ័យប្រវត្តិតាមរយៈ TYPE_ID
        document.getElementById('formTypeId').value = activeVehicleData.TYPE_ID ?? '';

        const preview = document.getElementById('formImgPreview');
        if (activeVehicleData.VEHICLE_IMAGE) {
            preview.src = `data:image/jpeg;base64,${activeVehicleData.VEHICLE_IMAGE}`;
            preview.style.display = 'block';
            document.getElementById('formImageBase64').value = activeVehicleData.VEHICLE_IMAGE;
        } else {
            preview.style.display = 'none';
            document.getElementById('formImageBase64').value = '';
        }

        document.getElementById('formModalTitle').innerText = 'កែប្រែព័ត៌មានរថយន្ត';
        closeModal('vehicleDetailModal');
        document.getElementById('vehicleFormModal').style.display = 'flex';
    };
}

// មុខងារអានហ្វាល់រូបភាពបំលែងជា Base64 Text
function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('formImageBase64').value = e.target.result.split(',')[1];
            const p = document.getElementById('formImgPreview');
            p.src = e.target.result;
            p.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

// មុខងាររក្សាទុក (Submit Form ទាំង POST ទាំង PUT) *កែសម្រួលរួច*
async function saveVehicle(event) {
    event.preventDefault();
    const id = document.getElementById('formVehicleId').value;
    const typeIdValue = document.getElementById('formTypeId').value;

    // ការពារកុំឱ្យ Error ពេលអត់ទាញប្រភេទឡាន ឬអត់បានរើស
    if (!typeIdValue || isNaN(parseInt(typeIdValue))) {
        alert("❌ សូមជ្រើសរើសប្រភេទឡានឱ្យបានត្រឹមត្រូវ!");
        return;
    }

    const bodyData = {
        PLATE_NO: document.getElementById('formPlateNo').value.trim(),
        COLOR: document.getElementById('formColor').value.trim(),
        BRAND_MODEL: document.getElementById('formBrandModel').value.trim(),
        TYPE_ID: parseInt(typeIdValue),
        STATUS: document.getElementById('formStatus').value,
        VEHICLE_IMAGE: document.getElementById('formImageBase64').value || null
    };

    const isEdit = id !== '';
    const url = isEdit ? `${VEHICLES_API_URL}/${id}` : VEHICLES_API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        if (res.ok) {
            alert(isEdit ? "✨ កែប្រែទិន្នន័យបានជោគជ័យ!" : "🎉 បន្ថែមរថយន្តថ្មីបានជោគជ័យ!");
            closeModal('vehicleFormModal');
            await loadVehiclesData();
        } else {
            const errData = await res.json();
            alert("❌ បរាជ័យក្នុងការរក្សាទុក៖ " + (errData.detail || "ពិនិត្យទិន្នន័យឡើងវិញ"));
        }
    } catch (e) {
        console.error(e);
        alert("❌ បរាជ័យក្នុងការតភ្ជាប់ទៅកាន់ Server!");
    }
}

// មុខងារលុបទិន្នន័យឡាន (DELETE)
const btnDeleteVehicle = document.getElementById('btnDeleteVehicle');
if (btnDeleteVehicle) {
    btnDeleteVehicle.onclick = async () => {
        if (!activeVehicleData) return;
        if (confirm(`⚠ តើអ្នកពិតជាចង់លុបឡាន ID: ${activeVehicleData.VEHICLE_ID} នេះមែនទេ?`)) {
            try {
                const res = await fetch(`${VEHICLES_API_URL}/${activeVehicleData.VEHICLE_ID}`, { method: 'DELETE' });
                if (res.ok) {
                    alert("🗑 បានលុបទិន្នន័យឡានរួចរាល់!");
                    closeModal('vehicleDetailModal');
                    await loadVehiclesData();
                }
            } catch (e) { console.error(e); }
        }
    };
}

// ==========================================
// ៦. មុខងារជំនួយផ្សេងៗ (MODAL & SLIDESHOW)
// ==========================================
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function filterStatus(status) {
    currentFilterStatus = status;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`filter-${status}`);
    if (targetBtn) targetBtn.classList.add('active');
    applyFilterAndSearch();
}

function plusSlides(n) { showSlides(slideIndex += n); }
function showSlides(n) {
    let slides = document.getElementsByClassName("mySlides");
    if (slides.length === 0) return;
    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }
    for (let i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
    slides[slideIndex - 1].style.display = "block";
}
setInterval(() => { if (typeof plusSlides === 'function') plusSlides(1); }, 6000);