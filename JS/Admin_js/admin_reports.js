/* ============================================================
   BARANGAY 101 — ADMIN REPORTS SCRIPTS
   File: JS/Admin_js/admin_reports.js
   ============================================================ */

// ── GLOBAL CHART STATE ──────────────────────────────────────
let pieChartInstance = null;
let barChartInstance = null;

// 1. HARD RESET FUNCTION
function clearChartsAndTable() {
    const container = document.getElementById('chartsContainer');
    if (container) {
        container.innerHTML = `
            <div class="chart-box" style="position:relative; width:100%; height:300px; display:block;">
                <canvas id="reportPieChart"></canvas>
            </div>
            <div class="chart-box" style="position:relative; width:100%; height:300px; display:block;">
                <canvas id="reportBarChart"></canvas>
            </div>
        `;
    }
    pieChartInstance = null;
    barChartInstance = null;

    const tableBody = document.getElementById('reportTableBody');
    const tableHead = document.querySelector('#reportPreviewTable thead');
    if (tableHead) tableHead.innerHTML = `<tr><th>Notice</th></tr>`;
    if (tableBody) tableBody.innerHTML = `<tr><td style="text-align:center; padding:20px;">Click "Apply Filter" to load data</td></tr>`;
}

// 2. DETERMINE GROUPING KEY based on active tab + data shape
function getGroupByKey(data) {
    if (!data || data.length === 0) return null;
    const sampleRow = data[0];
    const activeTab = document.querySelector('.report-nav-item.active');
    const target = activeTab ? activeTab.getAttribute('data-target') : '';

    if (target === 'occupation') {
        // Use employment_business since that's the actual DB column
        return 'employment_business' in sampleRow ? 'employment_business' : 'status';
    }
    if (target === 'priority'   && 'blotter_type'  in sampleRow) return 'blotter_type';
    if (target === 'analytics'  && 'service_type'  in sampleRow) return 'service_type';
    if (target === 'residents') {
        const category = document.getElementById('dynamicFilterSelect').value;

        // When filtering by a boolean flag, chart by gender for variety
        const booleanFilters = ['voters','senior','pwd','solo_parent','dswd','akap','tupad','livelihood'];

        if (category === 'all')                        return 'gender';
        if (booleanFilters.includes(category))         return 'gender';
        if (category === 'male' || category === 'female') return 'civil_status';
        if (category === 'youth')                      return 'gender';
        if (category === 'active' || category === 'archived') return 'gender';

        return 'gender'; // safe fallback
    }

        if (target === 'analytics') {
        const category = document.getElementById('dynamicFilterSelect').value;
        if (category === 'all') return 'certificate_type';
        return 'record_status';
    }

    if (target === 'priority') {
    const category = document.getElementById('dynamicFilterSelect').value;
    // When showing all priority residents, split by which type they are
    if (category === 'all')        return 'is_senior_citizen'; // chart: senior vs non-senior among priority
    if (category === 'senior')     return 'gender';            // senior breakdown by gender
    if (category === 'pwd')        return 'gender';            // pwd breakdown by gender
    if (category === 'senior_pwd') return 'gender';            // both breakdown by gender
    return 'gender';
}
    // Generic fallback
    if ('blotter_type'  in sampleRow) return 'blotter_type';
    if ('service_type'  in sampleRow) return 'service_type';
    if ('status'        in sampleRow) return 'status';
    return Object.keys(sampleRow)[0];
}

// 3. EXTRACT REAL DATA FOR CHARTS
function updateChartsFromAPI(data) {
    if (!data || data.length === 0) {
        clearChartsAndTable();
        return;
    }

    const groupByKey = getGroupByKey(data);
    if (!groupByKey) return;

    const counts = {};
    data.forEach(item => {
        const key = (item[groupByKey] && String(item[groupByKey]).trim() !== '')
            ? item[groupByKey]
            : 'Unspecified';
        counts[key] = (counts[key] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const chartValues = Object.values(counts);

    console.log(`[Chart Debug] Grouping by: "${groupByKey}" | Labels:`, labels, '| Values:', chartValues);

    updateChartsDynamic(labels, chartValues);
}

// 4. DRAW CHARTS WITH REAL DATA
function updateChartsDynamic(labels, chartValues) {
    const container = document.getElementById('chartsContainer');
    if (!container) return;

    // Hard reset canvases
    container.innerHTML = `
        <div class="chart-box" style="position:relative; width:100%; height:300px; display:block;">
            <canvas id="reportPieChart"></canvas>
        </div>
        <div class="chart-box" style="position:relative; width:100%; height:300px; display:block;">
            <canvas id="reportBarChart"></canvas>
        </div>
    `;

    const pieCanvas = document.getElementById('reportPieChart');
    const barCanvas = document.getElementById('reportBarChart');

    const bgColors = [
        '#2c57e5', '#f59e0b', '#22c55e', '#ef4444',
        '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'
    ];

    pieChartInstance = new Chart(pieCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ data: chartValues, backgroundColor: bgColors, borderWidth: 1 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });

    barChartInstance = new Chart(barCanvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Total Count', data: chartValues, backgroundColor: '#2c57e5', borderRadius: 4 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

// ── API FETCH AND TABLE RENDER ─────────────────────────────────

async function fetchReportData(type, dateFrom, dateTo, category) {
    const tableBody = document.getElementById('reportTableBody');
    const tableHead = document.querySelector('#reportPreviewTable thead');

    // Show loading state
    if (tableHead) tableHead.innerHTML = `<tr><th>Loading...</th></tr>`;
    if (tableBody) tableBody.innerHTML = `<tr><td style="text-align:center;padding:20px;">Fetching data...</td></tr>`;

    try {
        const response = await fetch(
            `../API/Admin/admin_reports_api.php?type=${encodeURIComponent(type)}&dateFrom=${dateFrom}&dateTo=${dateTo}&category=${encodeURIComponent(category)}`
        );

        const result = await response.json();

        if (result.status === 'success') {
            renderTable(result.data);
            updateChartsFromAPI(result.data);
        } else {
            alert('Error: ' + result.message);
            clearChartsAndTable();
        }

    } catch (error) {
        console.error('Fetch error:', error);
        alert('Failed to connect to the server. Check the console for details.');
        clearChartsAndTable();
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('reportTableBody');
    const tableHead = document.querySelector('#reportPreviewTable thead');
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        tableHead.innerHTML = `<tr><th>Notice</th></tr>`;
        tableBody.innerHTML = `<tr><td style="text-align:center; padding:20px;">No data found for this selection</td></tr>`;
        return;
    }

    let headerHTML = '<tr>';
    Object.keys(data[0]).forEach(key => {
        let cleanKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        headerHTML += `<th>${cleanKey}</th>`;
    });
    headerHTML += '</tr>';
    tableHead.innerHTML = headerHTML;

    data.forEach(row => {
        let tr = `<tr>`;
        Object.values(row).forEach(value => {
            tr += `<td>${value ?? ''}</td>`;
        });
        tr += `</tr>`;
        tableBody.innerHTML += tr;
    });
}

// ── EXPORT FUNCTIONS ──────────────────────────────────────────

function exportGraphsToPDF() {
    const chartsContainer = document.getElementById('chartsContainer');
    const activeTabEl = document.querySelector('.report-nav-item.active');
    const activeTab = activeTabEl ? activeTabEl.textContent : 'Report';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${activeTab.replace(/\s+/g, '_')}_Graphs_${dateStr}.pdf`;

    const tempTitle = document.createElement('h2');
    tempTitle.textContent = `${activeTab} - Visual Data`;
    tempTitle.style.cssText = 'text-align:center; margin-bottom:20px; font-family:sans-serif;';
    chartsContainer.prepend(tempTitle);

    const opt = {
        margin: 0.5,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(chartsContainer).save().then(() => { tempTitle.remove(); });
}

function exportToExcel() {
    const activeTabEl = document.querySelector('.report-nav-item.active');
    const activeTab = activeTabEl ? activeTabEl.textContent : 'Report';
    const dateStr = new Date().toISOString().slice(0, 10);
    alert(`Generating Excel file for "${activeTab}"...\nFile will be saved as: ${activeTab.replace(/\s+/g, '_')}_${dateStr}.xlsx`);
}

// ── DOM READY ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {

    // ═══════════════════════════════════════════════════
    // SIDEBAR MOBILE TOGGLE (FIXED)
    // ═══════════════════════════════════════════════════
    const sidebar = document.getElementById("sidebar");
    const btnSidebarToggle = document.getElementById("btnSidebarToggle");
    
    if (btnSidebarToggle && sidebar) {
        btnSidebarToggle.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevents instant closing
            sidebar.classList.toggle("open");
        });

        // Close sidebar if user clicks outside of it
        document.addEventListener('click', (e) => {
            if (
                window.innerWidth <= 768 &&
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) &&
                !btnSidebarToggle.contains(e.target)
            ) {
                sidebar.classList.remove('open');
            }
        });
    }

    // 🔴 OLD TOPBAR DATE CODE REMOVED HERE. 
    // It is now handled universally by topbar.php

    // ── REPORT TABS LOGIC ───────────────────────────────────
    const navItems = document.querySelectorAll('.report-nav-item');
    const mainTitle = document.getElementById('reportMainTitle');
    const mainSub = document.getElementById('reportMainSub');
    const filterSelect = document.getElementById('dynamicFilterSelect');

    const reportConfigs = {
            'priority': {
                title: 'Priority Reports',
                sub: 'Extract data on senior citizens and persons with disability (PWD).',
                options: [
                    { val: 'all',        text: 'All Priority Residents (Senior + PWD)' },
                    { val: 'senior',     text: 'Senior Citizens Only' },
                    { val: 'pwd',        text: 'PWD (Persons with Disability) Only' },
                    { val: 'senior_pwd', text: 'Senior Citizens who are also PWD' },
                ]
            },
            'occupation': {
                title: 'Occupation Reports',
                sub: 'View and extract employment statistics and records.',
                options: [
                    { val: 'all',           text: 'All Residents' },
                    { val: 'employed',      text: 'Employed' },
                    { val: 'unemployed',    text: 'Unemployed' },
                    { val: 'self_employed', text: 'Self-Employed' },
                    { val: 'business',      text: 'Business Owner' },
                    { val: 'student',       text: 'Students' },
                    { val: 'retired',       text: 'Retired' },
                ]
            },
            'residents': {
                title: 'Residents Reports',
                sub: 'Comprehensive demographic data, voter status, and population metrics.',
                options: [
                    { val: 'all',         text: 'All Residents' },
                    { val: 'male',        text: 'Male' },
                    { val: 'female',      text: 'Female' },
                    { val: 'voters',      text: 'Registered Voters' },
                    { val: 'senior',      text: 'Senior Citizens' },
                    { val: 'pwd',         text: 'PWD (Persons with Disability)' },
                    { val: 'solo_parent', text: 'Solo Parents' },
                    { val: 'youth',       text: 'Youth (15–30)' },
                    { val: 'dswd',        text: 'DSWD Beneficiaries' },
                    { val: 'akap',        text: 'AKAP Beneficiaries' },
                    { val: 'tupad',       text: 'TUPAD Beneficiaries' },
                    { val: 'livelihood',  text: 'Livelihood Beneficiaries' },
                    { val: 'active',      text: 'Active Residents' },
                    { val: 'archived',    text: 'Archived Residents' },
                ]
            },
'analytics': {
    title: 'System Analytics',
    sub: 'Certificate issuance counts, and system logs.',
    options: [
        { val: 'all',                   text: 'All Certificates' },
        { val: 'business_clearance',    text: 'Business Clearance' },
        { val: 'concrete_pouring',      text: 'Concrete Pouring Certificate' },
        { val: 'indigency',             text: 'Certificate of Indigency' },
        { val: 'legal_guardian',        text: 'Legal Guardian Certificate' },
        { val: 'low_income',            text: 'Low Income Certificate' },
        { val: 'residency',             text: 'Certificate of Residency' },
        { val: 'tent_permit',           text: 'Tent Permit Certificate' },
        { val: 'delivery_parking',      text: 'Delivery / Parking Clearance' },
        { val: 'first_time_job_seeker', text: 'First Time Job Seeker' },
    ]
},
    };

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const target = this.getAttribute('data-target');
            const config = reportConfigs[target];

            if (config) {
                mainTitle.textContent = config.title;
                mainSub.textContent = config.sub;

                filterSelect.innerHTML = '';
                config.options.forEach(opt => {
                    const optionEl = document.createElement('option');
                    optionEl.value = opt.val;
                    optionEl.textContent = opt.text;
                    filterSelect.appendChild(optionEl);
                });

                clearChartsAndTable();
            }
        });
    });

    // ── GENERATE / APPLY FILTER ─────────────────────────────
    const btn = document.getElementById('generateReportBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            const category = document.getElementById('dynamicFilterSelect').value;

            if (!dateFrom || !dateTo) {
                alert("Please select a date range");
                return;
            }

            const activeTab = document.querySelector('.report-nav-item.active');
            let type = 'Resident Population Report';

            if (activeTab) {
                const target = activeTab.getAttribute('data-target');
                if (target === 'priority')        type = 'Priority Report';           // ← updated
                else if (target === 'occupation') type = 'Resident Population Report';
                else if (target === 'residents')  type = 'Resident Demographics Report';
                else if (target === 'analytics')  type = 'Certificate Issuance Report';
            }

            fetchReportData(type, dateFrom, dateTo, category);
        });
    }

    // Initial clear
    clearChartsAndTable();
});