// អាសយដ្ឋានកូដភ្ជាប់ទៅកាន់ FastAPI Backend
const API_URL = 'http://127.0.0.1:8000/api/staff';
let allStaffData = [];

// ចាប់ផ្តើមដំណើរការនៅពេលទំព័រដោនឡូតចប់
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    loadStaffList();
    loadTopSalariesRanking();
});

// រៀបចំសកម្មភាពប៊ូតុងចុចផ្សេងៗ (Event Listeners)
function initEvents() {
    const searchInput = document.getElementById('staffSearch');
    if (searchInput) searchInput.addEventListener('input', filterSearchStaff);

    const staffForm = document.getElementById('staffForm');
    if (staffForm) staffForm.addEventListener('submit', handleFormSubmit);

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handleImageUpload);

    // បើក Form បង្កើតថ្មី
    const btnOpenCreateModal = document.getElementById('btnOpenCreateModal');
    if (btnOpenCreateModal) {
        btnOpenCreateModal.onclick = () => {
            document.getElementById('staffForm').reset();
            document.getElementById('formStaffId').value = '';
            document.getElementById('passwordGroup').style.display = 'block';
            document.getElementById('formModalTitle').innerText = 'បញ្ចូលបុគ្គលិកថ្មី';
            document.getElementById('formImgPreview').style.display = 'none';
            document.getElementById('formPhotoBase64').value = '';
            openModal('staffFormModal');
        };
    }

    // ប៊ូតុងបិទ Modals
    if (document.getElementById('btnCloseFormModal')) document.getElementById('btnCloseFormModal').onclick = () => closeModal('staffFormModal');
    if (document.getElementById('btnCancelForm')) document.getElementById('btnCancelForm').onclick = () => closeModal('staffFormModal');
    if (document.getElementById('btnCloseDetailModal')) document.getElementById('btnCloseDetailModal').onclick = () => closeModal('staffDetailModal');
}

// ១. ទាញយកបញ្ជីបុគ្គលិកទាំងអស់មកបង្ហាញក្នុងតារាង
async function loadStaffList() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        allStaffData = await response.json();
        renderStaffTable(allStaffData);
    } catch (error) {
        console.error("Error loading staff list:", error);
    }
}

// ២. ទាញយកចំណាត់ថ្នាក់ប្រាក់ខែខ្ពស់ជាងគេ Top 5 (ប្តូរពណ៌តាមលំដាប់ និងរុញរូបថតទៅក្រោម)
async function loadTopSalariesRanking() {
    try {
        const response = await fetch(`${API_URL}/top-salaries`);
        if (!response.ok) throw new Error('Network response was not ok');
        const topStaff = await response.json();
        const container = document.getElementById('topSalariesList');
        if (!container) return;

        container.innerHTML = '';

        topStaff.forEach((staff, index) => {
            const rank = index + 1;
            // កំណត់ Class ពណ៌ទៅតាមលំដាប់លេខ ១, លេខ ២, លេខ ៣ និងលេខទូទៅ
            let rankClass = 'rank-others';
            if (rank === 1) rankClass = 'rank-first';
            else if (rank === 2) rankClass = 'rank-second';
            else if (rank === 3) rankClass = 'rank-third';
            else if (rank === 4) rankClass = 'rank-fourth';


            // ឈ្មោះ Field អាចជា PHOTO ឬ PHOTO_BASE64 ទៅតាម Backend របស់អ្នក
            const photoData = staff.PHOTO || staff.PHOTO_BASE64;
            const imageSrc = photoData ? `data:image/jpeg;base64,${photoData}` : 'https://via.placeholder.com/150';

            // ទាញឈ្មោះពេញ (ផ្អែកលើការឆ្លើយតបពី API)
            const staffName = staff.FULL_NAME_STAFF || staff.FULL_NAME || 'មិនមានឈ្មោះ';

            container.innerHTML += `
                <div class="top-card ${rankClass}">
                    <div class="top-badge">${rank}</div>
                    <div class="top-info-text">
                        <h4 style="font-size: 15px; color: #0f172a; font-weight: bold;">${staffName}</h4>
                        <p style="font-size: 12px; color: #f3f2f3; margin: 2px 0;">${staff.ROLE}</p>
                        <b style="color: #f7f5f6; font-size: 14px;">$${Number(staff.SALARY).toLocaleString()}</b>
                    </div>
                    <!-- រុញរូបថតមកនៅផ្នែកខាងក្រោមគេបង្អស់នៃកាត -->
                    <img src="${imageSrc}" class="top-img" style="margin-top: 12px;">
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading top salaries ranking:", error);
    }
}

// បង្ហាញទិន្នន័យចូលតារាង HTML
function renderStaffTable(data) {
    const tableBody = document.getElementById('staffTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#94a3b8;">ស្វែងរកមិនឃើញទិន្នន័យបុគ្គលិកឡើយ</td></tr>`;
        return;
    }

    data.forEach(staff => {
        const photoData = staff.PHOTO || staff.PHOTO_BASE64;
        const imageSrc = photoData ? `data:image/jpeg;base64,${photoData}` : 'https://via.placeholder.com/150';
        const statusClass = staff.STATUS === 'Active' ? 'active-status' : 'inactive-status';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><img src="${imageSrc}" class="staff-avatar"></td>
            <td><b>${staff.STAFF_ID}</b></td>
            <td><strong>${staff.FULL_NAME_STAFF}</strong></td>
            <td>${staff.USERNAME}</td>
            <td>${staff.PHONE}</td>
            <td><span style="color:#2563eb; font-weight:600;">${staff.ROLE}</span></td>
            <td><b style="color:#10b981;">$${Number(staff.SALARY).toLocaleString()}</b></td>
            <td><span class="status-badge ${statusClass}">${staff.STATUS}</span></td>
            <td>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-info" style="padding:6px 12px; font-size:12px; background-color:#06b6d4;" onclick="viewStaffHistoryAndRentals(${staff.STAFF_ID}, '${staff.FULL_NAME_STAFF}')">
                        <i class="fa-solid fa-clock-rotate-left"></i> ប្រវត្តិ
                    </button>
                    <button class="btn btn-warning" style="padding:6px 12px; font-size:12px; background-color:#f59e0b;" id="editBtn-${staff.STAFF_ID}">
                        <i class="fa-solid fa-pen"></i> កែប្រែ
                    </button>
                    <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="deleteStaffRecord(${staff.STAFF_ID})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);

        // ចាប់ព្រឹត្តិការណ៍នៅពេលចុចប៊ូតុងកែប្រែ (Edit)
        document.getElementById(`editBtn-${staff.STAFF_ID}`).addEventListener('click', () => prepareEditForm(staff));
    });
}

// ស្វែងរកបុគ្គលិក (Client-side Search)
function filterSearchStaff() {
    const keyword = document.getElementById('staffSearch').value.toLowerCase().trim();
    const filtered = allStaffData.filter(staff =>
        (staff.FULL_NAME_STAFF && staff.FULL_NAME_STAFF.toLowerCase().includes(keyword)) ||
        (staff.USERNAME && staff.USERNAME.toLowerCase().includes(keyword)) ||
        (staff.PHONE && staff.PHONE.includes(keyword))
    );
    renderStaffTable(filtered);
}

// បំប្លែងរូបភាពពីការរើស File ទៅជា Base64
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('formPhotoBase64').value = e.target.result.split(',')[1];
            const imgPreview = document.getElementById('formImgPreview');
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}
async function handleFormSubmit(event) {
    event.preventDefault();

    // ១. ទាញយក ID មកផ្ទៀងផ្ទាត់
    const id = document.getElementById('formStaffId').value;
    const isEdit = id !== '';

    // ២. ចាប់យកតម្លៃពី Form
    const payload = {
        USERNAME: document.getElementById('formUsername').value.trim(),
        FULL_NAME_STAFF: document.getElementById('formFullName').value.trim(),
        PHONE: document.getElementById('formPhone').value.trim(),
        ROLE: document.getElementById('formRole').value,
        // សាកល្បងប្រើ parseInt បើប្រាក់ខែជាលេខគត់ ឬទុក parseFloat បើមានក្បៀស (ផ្ទៀងផ្ទាត់ជាមួយ Backend)
        SALARY: parseFloat(document.getElementById('formSalary').value),
        STATUS: document.getElementById('formStatus').value,
        // បើគ្មានរូបថតទេ គួរផ្ញើជាខ្សែអក្សរទទេ "" ឬ null ទៅតាមការកំណត់របស់ Backend
        PHOTO: document.getElementById('formPhotoBase64').value || ""
    };

    // ៣. បន្ថែម STAFF_ID ទៅក្នុង Payload ក្នុងករណីកែប្រែ (Edit) ព្រោះ Backend ភាគច្រើនត្រូវការវាដើម្បីផ្ទៀងផ្ទាត់
    if (isEdit) {
        payload.STAFF_ID = parseInt(id); // បំប្លែងទៅជា integer
    } else {
        payload.PASSWORD = document.getElementById('formPassword').value || "12345";
    }

    const url = isEdit ? `${API_URL}/${id}` : API_URL;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        console.log("Sending payload to server:", payload); // មើលក្នុង Console របស់អ្នក

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("រក្សាទុកទិន្នន័យបុគ្គលិកបានជោគជ័យ!");
            closeModal('staffFormModal');
            loadStaffList();
            if (typeof loadTopSalariesRanking === 'function') loadTopSalariesRanking();
        } else {
            // ទាញយកសារកំហុសលម្អិតពី FastAPI មកបង្ហាញ
            const errorData = await response.json();
            console.error("FastAPI Error Details:", errorData);

            // បង្ហាញប្រាប់អ្នកប្រើប្រាស់ចំៗថាខុស Field មួយណា
            let detailMessage = "";
            if (errorData.detail && Array.isArray(errorData.detail)) {
                detailMessage = errorData.detail.map(err => `${err.loc.join(' -> ')}: ${err.msg}`).join('\n');
            } else {
                detailMessage = JSON.stringify(errorData.detail);
            }

            alert(`Server មិនព្រមទទួលទិន្នន័យឡើយ! (Error Code: ${response.status})\n\nមូលហេតុ៖\n${detailMessage}`);
        }
    } catch (error) {
        console.error("Fetch Connection Error:", error);
        alert("មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើបានទេ!");
    }
}
// រៀបចំបញ្ចូលទិន្នន័យទៅក្នុង Form ដើម្បីកែប្រែ
function prepareEditForm(staff) {
    document.getElementById('formStaffId').value = staff.STAFF_ID;
    document.getElementById('formFullName').value = staff.FULL_NAME_STAFF;
    document.getElementById('formUsername').value = staff.USERNAME;
    document.getElementById('passwordGroup').style.display = 'none'; // លាក់ប្រអប់លេខសម្ងាត់ពេលកែប្រែ
    document.getElementById('formPhone').value = staff.PHONE;
    document.getElementById('formRole').value = staff.ROLE;
    document.getElementById('formSalary').value = staff.SALARY;
    document.getElementById('formStatus').value = staff.STATUS;

    const preview = document.getElementById('formImgPreview');
    const photoData = staff.PHOTO || staff.PHOTO_BASE64;
    if (photoData) {
        preview.src = `data:image/jpeg;base64,${photoData}`;
        preview.style.display = 'block';
        document.getElementById('formPhotoBase64').value = photoData;
    } else {
        preview.style.display = 'none';
        document.getElementById('formPhotoBase64').value = '';
    }

    document.getElementById('formModalTitle').innerText = 'កែប្រែព័ត៌មានបុគ្គលិក';
    openModal('staffFormModal');
}

// ៤. លុបទិន្នន័យបុគ្គលិក
async function deleteStaffRecord(id) {
    if (confirm("តើអ្នកពិតជាចង់លុបកំណត់ត្រាបុគ្គលិកនេះចេញពីប្រព័ន្ធមែនទេ?")) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert("បានលុបទិន្នន័យជោគជ័យ!");
                loadStaffList();
                loadTopSalariesRanking();
            } else {
                alert("មិនអាចលុបបានទេ!");
            }
        } catch (error) { console.error(error); }
    }
}

// ៥. មើលប្រវត្តិលម្អិត (STAFF_HISTORY និងប្រវត្តិជួលឡាន)
async function viewStaffHistoryAndRentals(id, fullName) {
    const detailTitle = document.getElementById('detailTitle');
    if (detailTitle) detailTitle.innerText = `ប្រវត្តិការងាររបស់៖ ${fullName}`;

    // បង្ហាញ Loading ក្នុងតារាងជាបណ្តោះអាសន្ន
    document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center;">កំពុងទាញយក...</td></tr>';
    document.getElementById('rentalTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center;">កំពុងទាញយក...</td></tr>';

    openModal('staffDetailModal');

    // ក. ទាញយកប្រវត្តិដូរតួនាទី និងប្រាក់ខែ
    try {
        const resHistory = await fetch(`${API_URL}/history/${id}`);
        if (resHistory.ok) {
            const histories = await resHistory.json();
            const historyBody = document.getElementById('historyTableBody');
            historyBody.innerHTML = '';

            histories.forEach(h => {
                historyBody.innerHTML += `<tr><td>${h.OLD_ROLE}</td><td>${h.NEW_ROLE}</td><td>$${Number(h.OLD_SALARY).toLocaleString()}</td><td>$${Number(h.NEW_SALARY).toLocaleString()}</td><td>${h.CHANGE_DATE}</td></tr>`;
            });
            if (histories.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">គ្មានប្រវត្តិផ្លាស់ប្ដូរឡើយ</td></tr>';
            }
        } else {
            document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">មិនអាចទាញយកប្រវត្តិបានទេ</td></tr>';
        }
    } catch (err) {
        document.getElementById('historyTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">កំហុសក្នុងការតភ្ជាប់ប្រព័ន្ធ</td></tr>';
    }

    // ខ. ទាញយកប្រវត្តិជួលឡានឱ្យអតិថិជន
    try {
        const resRentals = await fetch(`${API_URL}/rentals/${id}`);
        if (resRentals.ok) {
            const rentals = await resRentals.json();
            const rentalBody = document.getElementById('rentalTableBody');
            rentalBody.innerHTML = '';

            rentals.forEach(r => {
                rentalBody.innerHTML += `<tr><td><b>${r.RENTAL_ID}</b></td><td>${r.VEHICLE}</td><td><span class="plate-tag">${r.PLATE_NO}</span></td><td>${r.CUSTOMER_NAME}</td><td>${r.RENTAL_DATE}</td></tr>`;
            });
            if (rentals.length === 0) {
                rentalBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">បុគ្គលិកនេះមិនទាន់ធ្លាប់ជួលឡានឱ្យនរណាម្នាក់ឡើយ</td></tr>';
            }
        } else {
            document.getElementById('rentalTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">មិនអាចទាញយកប្រវត្តិជួលរថយន្តបានទេ</td></tr>';
        }
    } catch (err) {
        document.getElementById('rentalTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ef4444;">កំហុសក្នុងការតភ្ជាប់ប្រព័ន្ធ</td></tr>';
    }
}

// ជំនួយការសម្រាប់បើក-បិទផ្ទាំង Popup (Modals)
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}