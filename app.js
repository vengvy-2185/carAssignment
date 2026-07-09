const METRICS_URL = 'http://127.0.0.1:8000/api/dashboard-metrics';
const CHARTS_URL = 'http://127.0.0.1:8000/api/dashboard-charts';

let revenueChartInstance = null;
let statusChartInstance = null;

// ១. មុខងារទាញទិន្នន័យកាតខាងលើ (ដូចមុន)
async function loadDashboardMetrics() {
    try {
        const response = await fetch(METRICS_URL);
        const data = await response.json();
        document.getElementById('metric-rentals').innerText = data.TOTAL_RENTALS ?? 0;
        document.getElementById('metric-revenue').innerText = data.TOTAL_REVENUE || "$0.00";
        document.getElementById('metric-income').innerText = data.TOTAL_REVENUE || "$0.00";
        document.getElementById('metric-customers').innerText = data.TOTAL_CUSTOMERS ?? 0;
        document.getElementById('metric-available-cars').innerText = data.AVAILABLE_CARS ?? 0;
        document.getElementById('metric-rented-cars').innerText = data.RENTED_CARS ?? 0;
        document.getElementById('metric-blacklist').innerText = data.BLACKLIST_COUNT ?? 0;
    } catch (error) {
        console.error("Error loading metrics:", error);
    }
}

// ២. មុខងារគូរ និងធ្វើបច្ចុប្បន្នភាពក្រាហ្វិក (Charts)
async function loadDashboardCharts(filterType = "Day") {
    try {
        const response = await fetch(`${CHARTS_URL}?filter_type=${filterType}`);
        const data = await response.json();

        // កែប្រែអក្សរបញ្ជាក់នៅលើតម្រងពេលវេលា
        document.getElementById('chart-badge-time').innerText = filterType;

        // --- គូរក្រាហ្វិក Revenue Over Time (Line Chart) ---
        const ctxRevenue = document.getElementById('revenueChart').getContext('2d');
        if (revenueChartInstance) revenueChartInstance.destroy(); // បំផ្លាញក្រាហ្វិកចាស់មុនគូរថ្មីការពារជាន់គ្នា

        revenueChartInstance = new Chart(ctxRevenue, {
            type: 'line',
            data: {
                labels: data.revenue.labels,
                datasets: [{
                    label: 'Revenue ($)',
                    data: data.revenue.data,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // --- គូរក្រាហ្វិក Orders by Status (Doughnut Chart) ---
        const ctxStatus = document.getElementById('statusChart').getContext('2d');
        if (statusChartInstance) statusChartInstance.destroy();

        statusChartInstance = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: data.status.labels,
                datasets: [{
                    data: data.status.data,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

    } catch (error) {
        console.error("Error loading charts:", error);
    }
}

// ៣. ដាក់ឲ្យដំណើរការប៊ូតុងចុច Day, Week, Month, Year
function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            // ដក Active ពីប៊ូតុងចាស់ ថែមឲ្យប៊ូតុងថ្មី
            document.querySelector('.filter-btn.active').classList.remove('active');
            this.classList.add('active');

            // ហៅទិន្នន័យក្រាហ្វិកថ្មីតាមតម្រងដែលបានចុច
            const selectedFilter = this.innerText; // 'Day', 'Week', 'Month', 'Year'
            loadDashboardCharts(selectedFilter);
        });
    });
}

// រត់ដំណើរការទាំងអស់ពេលបើក Web ភ្លាម
window.onload = function () {
    loadDashboardMetrics();
    loadDashboardCharts("Day");
    setupFilterButtons();
};