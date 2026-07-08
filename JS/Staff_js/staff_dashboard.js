/**
 * staff_dashboard.js
 * Handles interactivity, real-time fetching, dynamic modal interactions,
 * and persistent pagination for the overview dashboard.
 */

// --- ACTIVITY LOGGER UTILITY (Safe Cross-File Version) ---
window.LOG_ACTIVITY_API = window.LOG_ACTIVITY_API || '../API/Staff/staff_log_activity_api.php';

window.logActivity = window.logActivity || function(actionMessage) {
    fetch(window.LOG_ACTIVITY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMessage })
    }).catch(err => console.error("Logging Failed:", err));
};
document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL STATE ---
    let currentPage = 1; // Tracks current page to prevent reset on refresh
    const rowsPerPage = 20;

    // --- 1. LOGOUT ---
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm("Are you sure you want to log out?")) {
                // ✅ LOG THE LOGOUT ACTIVITY
                logActivity("Logged out of the system.");
                
                // Slight delay to allow the fetch to reach the database before leaving the page
                setTimeout(() => {
                    sessionStorage.removeItem('brgy_session');
                    localStorage.removeItem('brgy_session');
                    window.location.href = '../Views/staff.php'; 
                }, 200);
            }
        });
    }

    // --- 2. AUTO-HIGHLIGHT ACTIVE SIDEBAR LINK ---
    const currentPath = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');

    navLinks.forEach(link => {
        if (currentPath === link.getAttribute('href')) {
            link.classList.add('active');
            const label = link.querySelector('.nav-label')?.textContent?.trim();
            if (breadcrumbCurrent && label) breadcrumbCurrent.textContent = label;
        } else {
            link.classList.remove('active');
        }
    });

    // --- 3. SIDEBAR TOGGLE (MOBILE) ---
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- 4. LIVE DATE & TIME IN TOPBAR ---
    const topbarDate = document.getElementById('topbarDate');
    function updateDateTime() {
        if (!topbarDate) return;
        const now = new Date();
        topbarDate.textContent = `${now.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} · ${now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
    }
    updateDateTime();
    setInterval(updateDateTime, 60000); 

    // --- 5. API & POLLING LOGIC ---
    const filterForm = document.getElementById('queueFilterForm');
    const tableBody = document.getElementById('queueTableBody');
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationButtons = document.getElementById('paginationButtons');

    const FETCH_TABLE_API_URL = '../API/Staff/staff_dashboard_fetch_api.php'; 
    const FETCH_STATS_API_URL = '../API/Staff/get_overview_stats_api.php'; 


    // --- HANDLE FILTER (Auto-filter on change & Reset to page 1) ---
    if (filterForm) {
        // Keep submit event in case they press Enter
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            currentPage = 1; 
            fetchTableData(currentPage, false); 
        });

        // Automatically filter whenever the date or status dropdown is changed
        const filterInputs = filterForm.querySelectorAll('.filter-input');
        filterInputs.forEach(input => {
            input.addEventListener('change', function() {
                currentPage = 1; // Reset to page 1
                fetchTableData(currentPage, false); 
            });
        });
    }

    // --- FETCH TABLE DATA ---
    window.fetchTableData = function(page = 1, isSilent = false) {
        if (!tableBody) return;

        currentPage = page; // Save current state
        const formData = new FormData(filterForm);
        const dateVal = formData.get('filter_date') || '';
        const statusVal = formData.get('filter_status') || 'all';

        if (!isSilent) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Loading overview...</td></tr>`;
        }

        fetch(`${FETCH_TABLE_API_URL}?limit=${rowsPerPage}&page=${currentPage}&filter_date=${dateVal}&filter_status=${statusVal}`) 
            .then(response => response.json())
            .then(result => {
                if (!result.success) {
                    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">${result.message}</td></tr>`;
                    return;
                }

                if (!result.data || result.data.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No records found.</td></tr>`;
                    if (paginationContainer) paginationContainer.style.display = 'none';
                    return;
                }

                let newHtml = '';
                result.data.forEach(row => {
                    // Capitalizes all words (e.g., "For Approval")
                    const statusLabel = row.status.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

                    // Replaces spaces with hyphens for the CSS class (e.g., "badge--for-approval")
                    const badgeClass = row.status.replace(/\s+/g, '-').toLowerCase();

                    const actionButton = `<button type="button" class="btn-action btn-action--ghost" onclick="viewQueue('${row.queue_number}')">View</button>`;

                    // Blotter Checks for Styling
                    const hasBlotter = row.has_blotter == 1;
                    const trClass = hasBlotter ? 'active-blotter-row' : '';
                    const blotterDot = hasBlotter ? `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>` : '';

                        newHtml += `
                            <tr class="${trClass}">
                                <td><div class="resident-cell"><strong>${blotterDot}${row.queue_number}</strong></div></td>
                                <td>${row.service_type}</td>
                                <td>${row.formatted_date}</td>
                                <td>${actionButton}</td>
                                <td><span class="badge badge--${badgeClass}">${statusLabel}</span></td>
                            </tr>
                        `;
                });

                tableBody.innerHTML = newHtml;
                
                // Update Pagination Buttons
                if (result.pagination) {
                    renderPaginationUI(result.pagination);
                }
            })
            .catch(error => {
                console.error('Fetch error:', error);
                if (!isSilent) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Failed to load data.</td></tr>`;
            });
    };

    // --- RENDER PAGINATION UI ---
    function renderPaginationUI(meta) {
        if (!paginationContainer || !paginationButtons) return;

        if (meta.total_pages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';
        paginationInfo.textContent = `Showing page ${meta.current_page} of ${meta.total_pages}`;
        
        let btnsHTML = '';
        // Previous Button
        btnsHTML += `
            <button type="button" class="btn-ghost btn-sm" 
                onclick="fetchTableData(${meta.current_page - 1}, false)" 
                ${meta.current_page === 1 ? 'disabled style="opacity:0.3"' : ''}>
                <i class="fa-solid fa-chevron-left"></i> Prev
            </button>`;

        // Next Button
        btnsHTML += `
            <button type="button" class="btn-ghost btn-sm" 
                onclick="fetchTableData(${meta.current_page + 1}, false)" 
                ${meta.current_page === meta.total_pages ? 'disabled style="opacity:0.3"' : ''}>
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>`;
        
        paginationButtons.innerHTML = btnsHTML;
    }

    // --- FETCH OVERVIEW STATS (REALTIME) ---
    function fetchOverviewStats() {
        const miniQueueList = document.getElementById('miniQueueList');

        fetch(FETCH_STATS_API_URL)
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;
                const d = result.data;

                // Update Cards
                document.getElementById('stat-total-residents').textContent = d.stats.total_residents;
                document.getElementById('trend-total-residents').textContent = `+${d.stats.new_residents_month} this month`;
                document.getElementById('stat-total-requests').textContent = d.stats.total_requests;
                document.getElementById('trend-total-requests').textContent = `+${d.stats.new_requests_week} this week`;
                document.getElementById('stat-walkin-today').textContent = d.stats.walkin_today;
                document.getElementById('stat-online-today').textContent = d.stats.online_today;

                // Update Sidebar Pulse
                let pulseHTML = '';
                if (d.serving.length > 0) {
                    pulseHTML += `<div style="font-size:0.7rem; font-weight:800; color:var(--text-mid); margin-bottom:10px; letter-spacing:1px;">NOW SERVING</div>`;
                    d.serving.forEach(item => {
                        const hasBlotter = item.has_blotter == 1;
                        const blotterClass = hasBlotter ? 'active-blotter-item' : '';
                        const blotterDot = hasBlotter ? `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>` : '';

                        pulseHTML += `
                            <div class="queue-item queue-item--serving ${blotterClass}">
                                <div class="queue-num">${item.queue_number}</div>
                                <div class="queue-details">
                                    <span class="queue-name">${blotterDot}In Progress</span>
                                    <span class="queue-type">${item.service_type}</span>
                                </div>
                                <span class="queue-status-dot serving"></span>
                            </div>`;
                    });
                }

                pulseHTML += `<div style="font-size:0.7rem; font-weight:800; color:var(--text-mid); margin:20px 0 10px; letter-spacing:1px;">RECENT UPDATES</div>`;
                d.activity.forEach(act => {
                    const timeStr = new Date(act.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    let statusColor = act.status === 'completed' ? '#10b981' : (act.status === 'cancelled' ? '#ef4444' : '#f59e0b');
                    pulseHTML += `
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px; font-size:0.85rem;">
                            <div style="width:8px; height:8px; border-radius:50%; background:${statusColor};"></div>
                            <div style="flex:1;">
                                <strong>${act.queue_number}</strong> is now <span style="text-transform:lowercase; font-weight:600;">${act.status}</span>
                            </div>
                            <div style="font-size:0.7rem; color:var(--text-mid);">${timeStr}</div>
                        </div>`;
                });

                miniQueueList.innerHTML = pulseHTML;
            })
            .catch(err => console.error("Pulse Error:", err));
    }

    // --- INITIALIZE POLLING ---
    function startRealtimeUpdates() {
        fetchTableData(currentPage, false); 
        fetchOverviewStats(); 

        setInterval(fetchOverviewStats, 5000); 

        // CRITICAL FIX: We refresh the current page, not page 1
        setInterval(() => { fetchTableData(currentPage, true); }, 10000); 
    }

    if (tableBody) {
        startRealtimeUpdates();   
    }

    
// --- MODAL LOGIC (Templates) ---
    const DETAILS_API_URL = '../API/Staff/staff_get_request_details_api.php';
    const requestModal = document.getElementById('requestModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalQueueNo = document.getElementById('modalQueueNo');
    const dynamicDetailsGrid = document.getElementById('dynamicDetailsGrid');
    const modalNavList = document.getElementById('modalNavList'); // The new sidebar list
    const warningBanner = document.getElementById('viewActiveWarning');
    
let currentModalData = [];
    let currentModalIndex = 0; // Tracks which document is currently viewed

    if (closeModalBtn) closeModalBtn.addEventListener('click', () => requestModal.classList.add('hidden'));

    // Helper function to format service names
    function getFormalServiceName(rawName) {
        if (!rawName) return 'Unknown Service';
        const lower = rawName.toLowerCase();
        if (lower.includes('business')) return 'Business Clearance';
        if (lower.includes('guardian')) return 'Legal Guardian Certificate';
        if (lower.includes('indigency')) return 'Certificate of Indigency';
        if (lower.includes('low income')) return 'Certificate of Low Income';
        if (lower.includes('residency')) return 'Certificate of Residency';
        if (lower.includes('tent')) return 'Certificate of Tent Permit';
        if (lower.includes('parking') || lower.includes('delivery')) return 'Delivery & Loading/Unloading';
        if (lower.includes('job seeker')) return 'First Time Job Seeker';
        if (lower.includes('pouring') || lower.includes('concrete')) return 'Concrete Pouring Certification';
        if (lower.includes('barangay id')) return 'Barangay ID';
        if (lower.includes('other')) return 'Other Services';
        return rawName.trim().replace(/\b\w/g, l => l.toUpperCase());
    }

    // Opens the Modal and builds the left sidebar
    window.openRequestModal = function(queueNumber) {
        requestModal.classList.remove('hidden');
        
        fetch(`${DETAILS_API_URL}?queue_number=${queueNumber}`)
            .then(res => res.json())
            .then(response => {
                if (!response.success) return;
                currentModalData = response.data; 
                modalQueueNo.textContent = queueNumber;
                
                // Build the left sidebar navigation dynamically
                let navHTML = '';
                currentModalData.forEach((item, index) => {
                    const sName = getFormalServiceName(item.service_type || item.internal_service_type);
                    navHTML += `<li id="dash-nav-${index}" class="ws-nav-item" style="padding: 10px; border-bottom: 1px solid var(--border-light); border-radius: 6px; cursor:pointer; transition: 0.2s;" onclick="renderDashboardService(${index})"><i class="fa-solid fa-file-lines" style="color: var(--blue); margin-right: 5px;"></i> ${sName} ${index + 1}</li>`;
                });
                
                if(modalNavList) modalNavList.innerHTML = navHTML;

                // Auto-render the first document
                renderDashboardService(0);
            });
    };

    // Renders the selected document into the right panel
    window.renderDashboardService = function(index) {
        currentModalIndex = index; // <-- ADD THIS LINE
        const itemData = currentModalData[index];
        const sName = getFormalServiceName(itemData.service_type || itemData.internal_service_type);
        const formalDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

        // Highlight the active tab in the sidebar
        document.querySelectorAll('#modalNavList .ws-nav-item').forEach(el => {
            el.style.background = 'transparent';
            el.style.fontWeight = 'normal';
        });
        const activeEl = document.getElementById(`dash-nav-${index}`);
        if(activeEl) {
            activeEl.style.background = 'rgba(44,87,229,0.1)'; 
            activeEl.style.fontWeight = 'bold';
        }

        // Show/Hide Warning Banner
        if (warningBanner) {
            warningBanner.style.display = (itemData.has_blotter == 1) ? 'flex' : 'none';
        }

        modalTitle.textContent = `${sName.toUpperCase()}`;

        // Get HTML Content from your existing templates
        let htmlContent = '';
        const serviceLower = sName.toLowerCase();
        if (serviceLower.includes('business')) htmlContent = getBusinessClearanceHTML(itemData, formalDate);
        else if (serviceLower.includes('guardian')) htmlContent = getLegalGuardianHTML(itemData, formalDate);
        else if (serviceLower.includes('indigency')) htmlContent = getIndigencyHTML(itemData, formalDate);
        else if (serviceLower.includes('low income')) htmlContent = getLowIncomeHTML(itemData, formalDate);
        else if (serviceLower.includes('residency')) htmlContent = getResidencyHTML(itemData, formalDate);
        else if (serviceLower.includes('tent')) htmlContent = getTentPermitHTML(itemData, formalDate);
        else if (serviceLower.includes('parking') || serviceLower.includes('delivery')) htmlContent = getDeliveryParkingHTML(itemData, formalDate);
        else if (serviceLower.includes('job seeker')) htmlContent = getFirstTimeJobSeekerHTML(itemData, formalDate);
        else if (serviceLower.includes('pouring')) htmlContent = getConcretePouringHTML(itemData, formalDate);
        else if (serviceLower.includes('barangay id')) htmlContent = getBarangayIdHTML(itemData, formalDate);
        else if (serviceLower.includes('other')) htmlContent = getOtherServicesHTML(itemData, formalDate);
        else htmlContent = `<p style="padding:40px; text-align:center;">No template found.</p>`;

        // Construct the Read-Only banner above the paper
        const actionBarHTML = `
            <div class="no-print workspace-action-bar" style="display:flex; justify-content:space-between; align-items:center; background:var(--white); padding:15px 20px; border-bottom:1px solid var(--border-light); margin-bottom: 20px; border-radius: 8px;">
                <div class="workspace-action-title" style="font-weight:700; color:var(--text-dark);">
                    <i class="fa-solid fa-file-invoice" style="color:var(--blue);"></i> Document Viewer
                </div>
                <div class="workspace-action-buttons">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--orange); font-size: 0.85rem; font-weight: 700; background: rgba(245, 158, 11, 0.1); padding: 8px 16px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">
                        <i class="fa-solid fa-eye"></i> Locked: Read-Only View
                    </div>
                </div>
            </div>
        `;

        dynamicDetailsGrid.innerHTML = actionBarHTML + htmlContent;
    };

    window.viewQueue = function(queueNumber) {
        openRequestModal(queueNumber);
    };

    // 🔥 DASHBOARD ISOLATED PRINT LOGIC (IFRAME METHOD) 🔥
    window.printDashboardDocument = function() {
        if (!currentModalData || currentModalData.length === 0) return;
        
        const item = currentModalData[currentModalIndex];
        const sName = getFormalServiceName(item.service_type || item.internal_service_type);
        const formalDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        
        logActivity(`Printed document (Read-Only View): <strong>${sName}</strong> for Queue <strong>${item.queue_number || 'Unknown'}</strong>.`);

        let htmlContent = '';
        const serviceLower = sName.toLowerCase();

        // 1. Generate only the HTML for the selected item
        if (serviceLower.includes('business')) htmlContent = getBusinessClearanceHTML(item, formalDate);
        else if (serviceLower.includes('guardian')) htmlContent = getLegalGuardianHTML(item, formalDate);
        else if (serviceLower.includes('indigency')) htmlContent = getIndigencyHTML(item, formalDate);
        else if (serviceLower.includes('low income')) htmlContent = getLowIncomeHTML(item, formalDate);
        else if (serviceLower.includes('residency')) htmlContent = getResidencyHTML(item, formalDate);
        else if (serviceLower.includes('tent')) htmlContent = getTentPermitHTML(item, formalDate);
        else if (serviceLower.includes('parking') || serviceLower.includes('delivery')) htmlContent = getDeliveryParkingHTML(item, formalDate);
        else if (serviceLower.includes('job seeker')) htmlContent = getFirstTimeJobSeekerHTML(item, formalDate);
        else if (serviceLower.includes('pouring')) htmlContent = getConcretePouringHTML(item, formalDate);
        else if (serviceLower.includes('barangay id')) htmlContent = getBarangayIdHTML(item, formalDate);
        else if (serviceLower.includes('other')) htmlContent = getOtherServicesHTML(item, formalDate);
        else htmlContent = `<p style="padding:40px; text-align:center;">No template found for ${sName}.</p>`;

        const singleCertHTML = `<div style="width: 100%; display: block; overflow: hidden; background: white;">${htmlContent}</div>`;

        // 2. Create the hidden iframe to handle the clean printing
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '1px';
        printFrame.style.height = '1px';
        printFrame.style.opacity = '0';
        printFrame.style.pointerEvents = 'none';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        // 3. Grab all stylesheets from the main document
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => `<link rel="stylesheet" href="${link.href}">`)
            .join('');

            const baseUrl = window.location.href; // 🔥 1. ADD THIS: Capture current directory path

        // 4. Write the HTML into the iframe document with strict A4 rules
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Document - ${sName}</title>
                <base href="${baseUrl}">
                ${stylesheets}
               <style>
                    @media print {
                        @page { 
                            size: A4 portrait; 
                            margin: 0 !important; 
                        } 
                        body {
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        .certificate-paper { 
                            width: 210mm !important;
                            height: 296mm !important; 
                            max-height: 297mm !important;
                            margin: 0 auto !important; 
                            padding: 20mm 25mm !important; 
                            box-sizing: border-box !important;
                            border: none !important;
                            box-shadow: none !important;
                            page-break-after: always !important; 
                            page-break-inside: avoid !important;
                            overflow: hidden !important; 
                            position: relative !important; 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                        }
                        
                        /* 🔥 THE WATERMARK FIX 🔥 */
                        .certificate-paper.with-watermark::before {
                            background-image: url('../Images/BARANGAY_ICON.png') !important;
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important;
                            z-index: 0 !important; /* Pulls it in front of the white paper background */
                            opacity: 0.15 !important; /* Slightly boosted visibility for print */
                        }
                        
                        /* Ensures all text and content stays strictly above the watermark */
                        .certificate-paper > * {
                            position: relative !important;
                            z-index: 1 !important; 
                        }

                        .certificate-paper:last-child {
                            page-break-after: auto !important;
                        }
                        .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body style="background: white; margin: 0; padding: 0;">
                ${singleCertHTML}
            </body>
            </html>
        `);
        frameDoc.close();
        
        // 5. Trigger the print dialog safely after styles load
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
            setTimeout(() => { document.body.removeChild(printFrame); }, 1500);
        }, 1000);
    };

});

window.printReport = function() {
    const filterForm = document.getElementById('queueFilterForm');
    const formData = new FormData(filterForm);
    const dateVal = formData.get('filter_date');
    const statusVal = formData.get('filter_status');

    // Show a loading state (Optional)
    const btn = document.querySelector('.quick-action-btn[onclick*="print"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';

    // ✅ LOG THE ACTIVITY
    let displayDate = dateVal ? `for date ${dateVal}` : 'for all time';
    logActivity(`Generated and printed a Service Queue Report (${displayDate}, Status: ${statusVal}).`);

    // Fetch ALL filtered data
    fetch(`../API/Staff/staff_print_report_api.php?filter_date=${dateVal}&filter_status=${statusVal}`)
        .then(res => res.json())
        .then(response => {
            btn.innerHTML = originalText; // Reset button
            
            if (!response.success || response.data.length === 0) {
                alert("No data found for the current filters.");
                return;
            }

            // Create a temporary iframe or new window for printing
            const printWindow = window.open('', '_blank');
            
            // Build the HTML for the report
            let reportHTML = `
            <html>
            <head>
                <title>Barangay TEST - Service Report</title>
                <style>
                    @page { size: auto; margin: 0mm; } /* Hides browser headers/footers */
                    body { 
                        font-family: 'Arial', sans-serif; 
                        padding: 20mm; 
                        color: #333; 
                    }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header p { margin: 2px 0; font-size: 12px; }
                    .header h2 { margin: 10px 0; text-transform: uppercase; }
                    
                    .report-info { margin-bottom: 20px; font-size: 14px; display: flex; justify-content: space-between; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th { background: #f2f2f2; font-weight: bold; text-transform: uppercase; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
                    
                    .status-badge { font-weight: bold; text-transform: uppercase; font-size: 10px; }
                    
                    .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                    .sig-box { width: 200px; text-align: center; border-top: 1px solid #000; padding-top: 5px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <p>Republic of the Philippines</p>
                    <p>Province of Masbate</p>
                    <p>Municipality of Cataingan</p>
                    <h2>Barangay TEST</h2>
                    <p style="font-weight:bold;">OFFICE OF THE BARANGAY SECRETARY</p>
                </div>

                <h3 style="text-align:center; text-decoration: underline;">SERVICE QUEUE REPORT</h3>

                <div class="report-info">
                    <span><strong>Filter Date:</strong> ${dateVal || 'All Time'}</span>
                    <span><strong>Status:</strong> ${statusVal.toUpperCase()}</span>
                    <span><strong>Generated:</strong> ${new Date().toLocaleString()}</span>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Queue Number</th>
                            <th>Service Type</th>
                            <th>Date/Time Requested</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.data.map((row, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td><strong>${row.queue_number}</strong></td>
                                <td>${row.service_type}</td>
                                <td>${new Date(row.created_at).toLocaleString()}</td>
                                <td class="status-badge">${row.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <div class="sig-box" style="border:none; text-align:left;">
                        Prepared by:<br><br><strong>${document.querySelector('.admin-name')?.textContent || 'Staff'}</strong>
                    </div>
                    <div class="sig-box">
                        Noted by:<br><br><strong>HON. BARANGAY CAPTAIN</strong>
                    </div>
                </div>

                <script>
                    window.onload = function() { 
                        window.print(); 
                        setTimeout(function() { window.close(); }, 500); 
                    };
                </script>
            </body>
            </html>`;

            printWindow.document.open();
            printWindow.document.write(reportHTML);
            printWindow.document.close();
        });
};