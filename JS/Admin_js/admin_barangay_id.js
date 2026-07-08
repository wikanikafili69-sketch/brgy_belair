/**
 * admin_certificates.js
 * Professional AJAX Management with Locking, Multi-item Support, Fullscreen View, Camera, SMS Integration, and Activity Logging
 */

document.addEventListener('DOMContentLoaded', () => {

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const photoInput = document.getElementById('fldPhoto');
    const photoPreviewImg = document.getElementById('photoPreviewImg');
    const photoInitials = document.getElementById('photoInitials');

    if (photoInput) {
        photoInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                photoPreviewImg.src = e.target.result;
                photoPreviewImg.style.display = 'block';
                photoInitials.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }
    
    if (!document.getElementById('certTableBody')) return;

    // --- GLOBAL STATE ---
    let currentPage = 1;
    let perPage = 20;
    let activeQueueNo = null;
    let currentItems = []; 
    let itemIndex = 0; 

    // ==========================================
    // ADMIN API ROUTES
    // ==========================================
    const FETCH_API = '../API/Admin/admin_barangay_id_fetch_api.php'; 
    const DETAILS_API = '../API/Admin/admin_get_request_details_api.php';
    const LOCK_API = '../API/Admin/admin_certificates_lock_api.php';
    const STATUS_API = '../API/Admin/admin_update_status_api.php';
    const UPDATE_DETAILS_API = '../API/Admin/admin_update_service_details_api.php';
    const LOG_ACTIVITY_API = '../API/Admin/admin_log_activity_api.php'; // <-- NEW API ROUTE

    // --- UTILITY: SILENT ACTIVITY LOGGER ---
    window.logActivity = function(actionMessage) {
        fetch(LOG_ACTIVITY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionMessage })
        }).catch(err => console.error("Silent Logging Failed:", err));
    };

    // --- UTILITY: FORMAT SERVICE NAMES ---
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

    function parseMultipleServices(rawString) {
        if (!rawString) return [];
        const parts = rawString.split(',');
        const formalNames = parts.map(p => getFormalServiceName(p.trim()));
        return [...new Set(formalNames)];
    }

    // --- 1. TABLE FETCHING & PAGINATION ---
    window.fetchTableData = function(page = 1, isSilent = false) {
        currentPage = page;
        
        const search = document.getElementById('certSearch').value.trim();
        const status = document.getElementById('filterCertStatus') ? document.getElementById('filterCertStatus').value : 'all';
        const typeEl = document.getElementById('filterCertType');
        const type = typeEl ? typeEl.value : 'all';
        
        const sourceFilterEl = document.getElementById('filterSource');
        const source = sourceFilterEl ? sourceFilterEl.value : 'all';

        if (!isSilent) document.getElementById('certTableBody').innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px;">Loading data...</td></tr>';

        const t = new Date().getTime();

        fetch(`${FETCH_API}?page=${currentPage}&limit=${perPage}&search=${search}&filter_status=${status}&filter_type=${type}&filter_source=${source}&t=${t}`)
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;
                
                renderTableRows(result.data);
                renderPagination(result.pagination);
                
                if (result.summary) updateSummaryChips(result.summary);
                if (result.type_summary) updateTypeChips(result.type_summary);
            })
            .catch(err => console.error("Fetch failure:", err));
    };

    function renderTableRows(data) {
        const tbody = document.getElementById('certTableBody');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted);">No requests match your filter.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(row => {
            const servicesArray = parseMultipleServices(row.service_type);
            const formalTypeHTML = servicesArray.length > 1 
                ? servicesArray.map(s => `• ${s}`).join('<br>') 
                : servicesArray[0];

            const hasBlotter = row.has_blotter == 1; 
            let rowStyle = '';
            
            if (row.priority == 1) rowStyle = 'background-color: rgba(59, 130, 246, 0.06);';
            if (row.priority == 2) rowStyle = 'background-color: rgba(245, 158, 11, 0.08);';
            if (row.priority == 3) rowStyle = 'background-color: rgba(239, 68, 68, 0.08);';

            let trClass = activeQueueNo === row.queue_number ? 'row-active' : '';
            let blotterDot = '';
            
            if (hasBlotter) {
                trClass += ' active-blotter-row'; 
                blotterDot = `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>`;
            }
            
            const priorityIcon = row.priority == 3 ? `<i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; margin-right: 5px;" title="High Priority"></i>` : '';

            const isWalkin = row.queue_number.startsWith('WK');
            const sourceClass = isWalkin ? 'walkin' : 'online';
            const sourceText = isWalkin ? 'Walk-in' : 'Online';

            const currentStatus = row.record_status ? row.record_status.toLowerCase() : 'for approval';
            const displayStatus = currentStatus.toUpperCase();

            return `
                <tr class="${trClass}" onclick="viewRequest('${row.queue_number}')" style="cursor:pointer; ${rowStyle}">
                    <td style="font-weight:700; color:var(--text-dark); font-size: 0.9rem;">${blotterDot}${priorityIcon}${row.queue_number}</td>
                    <td><span class="source-badge source-badge--${sourceClass}">${sourceText}</span></td>
                    <td style="font-size:0.82rem; line-height: 1.4;">${formalTypeHTML}</td>
                    <td style="font-size:0.78rem;">${row.formatted_date}</td>
                    <td><span class="badge badge--${currentStatus.replace(/\s+/g, '-')}">${displayStatus}</span></td>
                </tr>
            `;
        }).join('');
    }

    function updateSummaryChips(summary) {
        if (document.getElementById('countForApproval')) document.getElementById('countForApproval').textContent = summary['for approval'] || summary.for_approval || 0;
        if (document.getElementById('countPending')) document.getElementById('countPending').textContent = summary.pending || 0;
        if (document.getElementById('countProcessing')) document.getElementById('countProcessing').textContent = summary.processing || 0;
        if (document.getElementById('countReady')) document.getElementById('countReady').textContent = summary['ready for pickup'] || summary.ready_for_pickup || 0;
        if (document.getElementById('countCompleted')) document.getElementById('countCompleted').textContent = summary.completed || 0;
        if (document.getElementById('countRejected')) document.getElementById('countRejected').textContent = summary.rejected || 0;
    }

    document.querySelectorAll('.summary-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const status = chip.getAttribute('data-status');
            const dropdown = document.getElementById('filterCertStatus');
            dropdown.value = dropdown.value === status ? 'all' : status;
            fetchTableData(1, false);
        });
    });

    function updateTypeChips(typeData) {
        const container = document.getElementById('certTypeChips');
        if (!container) return;

        const dropdown = document.getElementById('filterCertType');
        const activeType = dropdown ? dropdown.value : 'all';

        let totalAll = 0;
        const mappedCounts = {};

        typeData.forEach(row => {
            const count = parseInt(row.total || row.count);
            totalAll += count; 
            
            const servicesArray = parseMultipleServices(row.service_type);
            servicesArray.forEach(formalName => {
                mappedCounts[formalName] = (mappedCounts[formalName] || 0) + count;
            });
        });

        const definedTypes = [
            "Certificate of Residency", "Business Clearance", "Certificate of Indigency",
            "Certificate of Low Income", "Legal Guardian Certificate", "Certificate of Tent Permit",
            "Concrete Pouring Certification", "First Time Job Seeker", "Delivery & Loading/Unloading",
            "Barangay ID" , "Other Services"
        ];

        let html = `<button class="type-chip ${activeType === 'all' ? 'active' : ''}" data-type="all">All Types <span class="type-chip-count" style="background:#6c757d;">${totalAll}</span></button>`;

        definedTypes.forEach(type => {
            const count = mappedCounts[type] || 0;
            const isActive = activeType === type ? 'active' : '';
            const displayName = type === 'Business Clearance' ? 'Business Permit' : type;
            html += `<button class="type-chip ${isActive}" data-type="${type}">${displayName} <span class="type-chip-count">${count}</span></button>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('.type-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                if (dropdown) dropdown.value = e.currentTarget.getAttribute('data-type');
                fetchTableData(1, false); 
            });
        });
    }

    // --- ADMIN VIEWER WORKSPACE ---
    window.openReadOnlyWorkspace = function(queueNo) {
        activeQueueNo = queueNo;
        fetch(`${DETAILS_API}?queue_number=${queueNo}`)
            .then(res => res.json())
            .then(response => {
                if (response.success) {
                    currentItems = response.data;
                    setupWorkspaceModal(queueNo); 
                } else {
                    alert(response.message || "Failed to fetch details.");
                }
            });
    };



    function setupWorkspaceModal(queueNo) {
        const modal = document.getElementById('processWorkspaceModal');
        document.getElementById('wsQueueNo').textContent = queueNo;
        
        const navList = document.getElementById('wsNavList');
        let navHTML = `<li id="ws-nav-overview" class="ws-nav-item" style="padding: 10px; border-radius: 6px; cursor:pointer; margin-bottom: 5px; transition: 0.2s;" onclick="renderWorkspaceOverview()">Overview</li>`;
        
        currentItems.forEach((item, index) => {
            const sName = getFormalServiceName(item.service_type || item.internal_service_type);
            navHTML += `<li id="ws-nav-${index}" class="ws-nav-item" style="padding: 10px; border-bottom: 1px solid var(--border-light); border-radius: 6px; cursor:pointer; transition: 0.2s;" onclick="renderWorkspaceService(${index})"><i class="fa-solid fa-file-lines" style="color: var(--blue); margin-right: 5px;"></i> ${sName} ${index + 1}</li>`;
        });
        navList.innerHTML = navHTML;

        renderWorkspaceOverview(); 
        modal.classList.remove('hidden');

        // ==========================================
        // DYNAMIC BUTTON LOGIC (O vs W)
        // ==========================================
        let dynamicBtns = document.getElementById('dynamicQueueButtons');
        
        if (!dynamicBtns) {
            dynamicBtns = document.createElement('span');
            dynamicBtns.id = 'dynamicQueueButtons';
            dynamicBtns.style.display = 'flex';
            dynamicBtns.style.gap = '10px';
            const printBtn = document.getElementById('wsPrintAllBtn');
            if (printBtn) printBtn.parentNode.insertBefore(dynamicBtns, printBtn.nextSibling);
        }
        
        if (queueNo.toUpperCase().startsWith('O')) {
            dynamicBtns.innerHTML = `
                <button class="btn-primary btn-ready-pickup" style="background-color: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    <i class="fa-solid fa-box-open"></i> Ready for Pickup
                </button>
                <button class="btn-primary btn-mark-completed" style="background-color: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    <i class="fa-solid fa-check-double"></i> Mark Completed
                </button>
            `;
            dynamicBtns.querySelector('.btn-ready-pickup').onclick = () => { updateStatus(queueNo, 'ready for pickup'); modal.classList.add('hidden'); };
            dynamicBtns.querySelector('.btn-mark-completed').onclick = () => { updateStatus(queueNo, 'completed'); modal.classList.add('hidden'); };
        } else {
            dynamicBtns.innerHTML = `
                <button class="btn-primary btn-mark-completed" style="background-color: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    <i class="fa-solid fa-check-double"></i> Mark Completed
                </button>
            `;
            dynamicBtns.querySelector('.btn-mark-completed').onclick = () => { updateStatus(queueNo, 'completed'); modal.classList.add('hidden'); };
        }

        const btnPending = document.getElementById('wsPendingBtn');
        if (btnPending) btnPending.onclick = () => { updateStatus(queueNo, 'pending'); modal.classList.add('hidden'); };

        const btnReject = document.getElementById('wsRejectBtn');
        if (btnReject) btnReject.onclick = () => { updateStatus(queueNo, 'rejected'); modal.classList.add('hidden'); };

        const closeBtn = document.getElementById('wsCloseBtn');
        if (closeBtn) closeBtn.onclick = () => { modal.classList.add('hidden'); };

        // PRINT LOGIC
        const printBtn = document.getElementById('wsPrintAllBtn');
        if (printBtn) {
            printBtn.onclick = () => {
                // LOG PRINT ACTIVITY
                logActivity(`Printed documents for queue number <strong>${queueNo}</strong>`);

                let allCertsHTML = '';
                
                currentItems.forEach((item, index) => {
                    const sName = getFormalServiceName(item.service_type || item.internal_service_type);
                    const formalDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
                    
                    let htmlContent = '';
                    const serviceLower = sName.toLowerCase();

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

                    const pageBreak = index < currentItems.length - 1 ? 'page-break-after: always; break-after: page;' : '';
                    allCertsHTML += `<div style="${pageBreak} width: 100%; display: block; overflow: hidden; background: white;">${htmlContent}</div>`;
                });

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

                const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                    .map(link => `<link rel="stylesheet" href="${link.href}">`)
                    .join('');

 // 4. Write the HTML into the iframe document
               // 4. Write the HTML into the iframe document (PRINT ALL)
                // 4. Write the HTML into the iframe document (PRINT ALL)
                const frameDoc = printFrame.contentWindow.document;
                frameDoc.open();
                frameDoc.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Print Certificates</title>
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
                                    /* Force EXACT A4 dimensions */
                                    width: 210mm !important;
                                    height: 296mm !important; /* 1mm short to prevent spill */
                                    max-height: 297mm !important;
                                    margin: 0 auto !important; 
                                    padding: 20mm 25mm !important; /* Standard formal margins */
                                    box-sizing: border-box !important;
                                    border: none !important;
                                    box-shadow: none !important;
                                    page-break-after: always !important; /* Forces 1 service per page */
                                    page-break-inside: avoid !important;
                                    overflow: hidden !important; /* Clips any stray pixels */
                                    position: relative !important; /* Keeps watermark centered */
                                    -webkit-print-color-adjust: exact !important; 
                                    print-color-adjust: exact !important; 
                                }
                                .certificate-paper:last-child {
                                    page-break-after: auto !important;
                                }
                                .no-print { display: none !important; }
                            }
                        </style>
                    </head>
                    <body style="background: white; margin: 0; padding: 0;">
                        ${allCertsHTML}
                    </body>
                    </html>
                `);
                frameDoc.close();

                setTimeout(() => {
                    printFrame.contentWindow.focus();
                    printFrame.contentWindow.print();
                    setTimeout(() => { document.body.removeChild(printFrame); }, 1500);
                }, 1000);
            };
        }
    }

    window.updateNavHighlight = function(activeIndex) {
        document.querySelectorAll('.ws-nav-item').forEach(el => {
            el.style.background = 'transparent';
            el.style.fontWeight = 'normal';
        });

        const activeEl = document.getElementById(`ws-nav-${activeIndex}`);
        if(activeEl) {
            activeEl.style.background = 'rgba(44,87,229,0.1)'; 
            activeEl.style.fontWeight = 'bold';
        }
    };

    window.renderWorkspaceOverview = function() {
        const container = document.getElementById('wsDynamicDetailsGrid');
        if (!currentItems || currentItems.length === 0) return;
        
        updateNavHighlight('overview');
        
        let servicesCardsHTML = '';
        currentItems.forEach((item, index) => {
            const sName = getFormalServiceName(item.service_type || item.internal_service_type);
            const purpose = item.purpose || 'Not specified';
            
            servicesCardsHTML += `
                <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: 8px; padding: 16px; margin-bottom: 12px; text-align: left;">
                    <div style="font-weight: 700; color: var(--text-dark); margin-bottom: 6px; font-size: 0.95rem;">
                        <i class="fa-solid fa-file-invoice" style="color: var(--blue); margin-right: 6px;"></i> ${sName}
                    </div>
                    <div style="font-size: 0.85rem; color: var(--text-mid); margin-bottom: 12px;">
                        <strong>Purpose:</strong> ${purpose}
                    </div>
                    <button class="btn-ghost btn-sm" style="font-size: 0.75rem; padding: 6px 12px; border: 1px solid var(--border-light); border-radius: 4px; cursor: pointer; background: white;" onclick="renderWorkspaceService(${index})">
                        Open Document
                    </button>
                </div>
            `;
        });

        const hasBlotter = currentItems[0].has_blotter == 1;
        const warningHTML = hasBlotter ? `
            <div class="active-warning-banner" style="margin-bottom: 20px;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>ATTENTION: This resident has an ONGOING / ACTIVE blotter case. Please review before proceeding.</span>
            </div>
        ` : '';

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; margin-top: 20px;">
                <div style="background: white; padding: 30px; border-radius: 12px; width: 100%; max-width: 650px; box-shadow: var(--shadow-sm);">
                    ${warningHTML}
                    <h3 style="margin-bottom: 20px; font-size: 1.2rem; color: var(--text-dark); text-align: left;">Request Overview</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 0.9rem; margin-bottom: 24px; text-align: left; padding: 18px; background: rgba(44,87,229,0.04); border: 1px solid rgba(44,87,229,0.1); border-radius: 8px;">
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Resident Name</span><br>
                            <strong style="color: var(--text-dark); font-size: 1rem;">${currentItems[0].full_name || currentItems[0].resident_name || 'Walk-in'}</strong>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Queue Number</span><br>
                            <strong style="color: var(--text-dark); font-size: 1rem;">${currentItems[0].queue_number}</strong>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 700;">Total Services</span><br>
                            <strong style="color: var(--text-dark); font-size: 1rem;">${currentItems.length}</strong>
                        </div>
                    </div>
                    <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; text-align: left;">Acquired Services Details</h4>
                    ${servicesCardsHTML}
                </div>
            </div>
        `;
    };

    window.renderWorkspaceService = function(index) {
        const container = document.getElementById('wsDynamicDetailsGrid');
        const item = currentItems[index];
        const sName = getFormalServiceName(item.service_type || item.internal_service_type);
        const formalDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        
        updateNavHighlight(index);
        
        let htmlContent = '';
        const serviceLower = sName.toLowerCase();

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

const actionBarHTML = `
            <div class="no-print workspace-action-bar">
                <div class="workspace-action-title">
                    <i class="fa-solid fa-file-invoice"></i> Document Editor (Admin)
                </div>
                <div class="workspace-action-buttons">
                    <!-- NEW: Print Individual Service Button -->
                    <button class="btn-cert-print" onclick="printIndividualService(${index})" style="background: #f8fafc; color: var(--text-dark); border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                        <i class="fa-solid fa-print"></i> Print This Document
                    </button>

                    <button id="btnEditService" class="btn-ghost" onclick="toggleServiceEditMode()" style="border: 1px solid var(--border-light); padding: 8px 16px; border-radius: 6px;">
                        <i class="fa-solid fa-pen"></i> Edit Details
                    </button>
                    <button id="btnSaveService" class="btn-primary hidden" onclick="saveServiceDetails(${index})" style="background-color: var(--blue); color: white; border: none; padding: 8px 16px; border-radius: 6px;">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = actionBarHTML + htmlContent;
    };

    // --- EDIT & SAVE LOGIC ---

    window.toggleServiceEditMode = function() {
        const container = document.getElementById('wsDynamicDetailsGrid'); 
        const editBtn = document.getElementById('btnEditService');
        const saveBtn = document.getElementById('btnSaveService');
        
        const editPanel = container.querySelector('.edit-form-panel');

        if (editPanel) {
            editPanel.classList.toggle('hidden');
        }

        if (saveBtn.classList.contains('hidden')) {
            saveBtn.classList.remove('hidden');
            editBtn.innerHTML = `<i class="fa-solid fa-xmark"></i> Cancel Edit`;
            editBtn.style.color = 'var(--red)';
        } else {
            saveBtn.classList.add('hidden');
            editBtn.innerHTML = `<i class="fa-solid fa-pen"></i> Edit Details`;
            editBtn.style.color = 'var(--text-dark)'; 
        }
    };

    window.saveServiceDetails = function(itemIndex) {
        const container = document.getElementById('wsDynamicDetailsGrid');
        
        container.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));
        container.querySelectorAll('.biz-error-msg').forEach(el => el.remove());

        let isValid = true;

        const requiredInputs = container.querySelectorAll('.edit-input[data-required="true"]');
        requiredInputs.forEach(input => {
            if (input.closest('div').style.display === 'none') return;

            if (!input.value.trim()) {
                input.classList.add('error-border'); 
                const wrapper = input.parentElement;
                
                if (!wrapper.querySelector('.biz-error-msg')) {
                    wrapper.insertAdjacentHTML('beforeend', '<div class="biz-error-msg" style="color: #ef4444; font-size: 0.75rem; margin-top: 4px; font-weight: 600;">This field is required.</div>');
                }
                isValid = false;
            }
        });

        if (!isValid) {
            showToast("Please fill in all required fields.");
            return; 
        }

        if (!confirm("Are you sure you want to update these details in the database?")) return;

        const inputs = container.querySelectorAll('.edit-input');
        const currentItem = currentItems[itemIndex];
        
        let recordId = currentItem.request_id || currentItem.id || currentItem.business_id || currentItem.concrete_id || currentItem.barangay_id;
        const serviceName = getFormalServiceName(currentItem.service_type || currentItem.internal_service_type);

        let updatedData = {
            record_id: recordId,
            service_type: serviceName,
            fields: {}
        };

        inputs.forEach(input => {
            const fieldName = input.getAttribute('name');
            if (fieldName) {
                if (input.type === 'radio') {
                    if (input.checked) updatedData.fields[fieldName] = input.value;
                } else {
                    updatedData.fields[fieldName] = input.value;
                }
            }
        });

        currentItems[itemIndex] = { ...currentItems[itemIndex], ...updatedData.fields };

        for (const [key, value] of Object.entries(updatedData.fields)) {
            const labelEl = document.getElementById(`lbl_${key}_${recordId}`);
            if (labelEl) labelEl.textContent = value || 'N/A'; 
        }
        
        toggleServiceEditMode();
        showToast("Updating database...");

        fetch(UPDATE_DETAILS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast("Details saved successfully!");

                // ✅ LOG THE EDIT ACTIVITY
                const queueToLog = currentItem.queue_number || activeQueueNo || recordId;
                logActivity(`Updated document fields for <strong>${serviceName}</strong> (Queue: ${queueToLog})`);
                
                if (data.new_photo_path) {
                    const cacheBuster = "?t=" + new Date().getTime();
                    currentItems[itemIndex].photo_path = data.new_photo_path + cacheBuster;
                    
                    const newSrc = '../' + data.new_photo_path + cacheBuster;
                    const previewImg = document.getElementById(`staff_photo_preview_${recordId}`);
                    const paperImg = document.getElementById(`paper_photo_${recordId}`);
                    
                    if (previewImg) previewImg.src = newSrc;
                    if (paperImg) paperImg.src = newSrc;
                }
                
                currentItems[itemIndex].new_photo_base64 = ""; 

            } else {
                alert("Failed to save to database: " + data.message);
            }
        });
    };

    // ==========================================
    // VIEW REQUEST MODAL LOGIC
    // ==========================================
    let modalItems = [];
    let modalItemIndex = 0;

    window.openRequestModal = function(queueNo) {
        fetch(`${DETAILS_API}?queue_number=${queueNo}`)
            .then(res => res.json())
            .then(response => {
                if (!response.success) return;

                modalItems = response.data;
                modalItemIndex = 0;
                
                document.getElementById('modalQueueNo').textContent = queueNo;
                document.getElementById('requestModal').classList.remove('hidden');
                
                renderModalItem();
            })
            .catch(err => console.error("Error fetching modal details:", err));
    };

    function renderModalItem() {
        if (!modalItems || modalItems.length === 0) return;

        const item = modalItems[modalItemIndex];
        const container = document.getElementById('dynamicDetailsGrid');
        const sName = getFormalServiceName(item.service_type || item.internal_service_type);
        const formalDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        
        document.getElementById('modalTitle').textContent = sName;

        let htmlContent = '';
        const serviceLower = sName.toLowerCase();

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

        container.innerHTML = htmlContent;

        const nav = document.getElementById('modalItemPagination');
        if (modalItems.length > 1) {
            nav.classList.remove('hidden');
            document.getElementById('modalItemCountText').textContent = `Item ${modalItemIndex + 1} of ${modalItems.length}`;
            
            document.getElementById('modalPrevItemBtn').disabled = (modalItemIndex === 0);
            document.getElementById('modalNextItemBtn').disabled = (modalItemIndex === modalItems.length - 1);
            
            document.getElementById('modalPrevItemBtn').style.opacity = (modalItemIndex === 0) ? '0.3' : '1';
            document.getElementById('modalNextItemBtn').style.opacity = (modalItemIndex === modalItems.length - 1) ? '0.3' : '1';
        } else {
            nav.classList.add('hidden');
        }
    }

    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('requestModal').classList.add('hidden');
        });
    }

    const modalPrevItemBtn = document.getElementById('modalPrevItemBtn');
    if (modalPrevItemBtn) {
        modalPrevItemBtn.addEventListener('click', () => {
            if (modalItemIndex > 0) { 
                modalItemIndex--; 
                renderModalItem(); 
            }
        });
    }

    const modalNextItemBtn = document.getElementById('modalNextItemBtn');
    if (modalNextItemBtn) {
        modalNextItemBtn.addEventListener('click', () => {
            if (modalItemIndex < modalItems.length - 1) { 
                modalItemIndex++; 
                renderModalItem(); 
            }
        });
    }

    // --- 3. DETAIL PANEL & MULTI-ITEM TABS ---
    window.viewRequest = function(queueNo) {
        activeQueueNo = queueNo;
        const panel = document.getElementById('certDetailContent');
        const empty = document.getElementById('certDetailEmpty');

        fetch(`${DETAILS_API}?queue_number=${queueNo}`)
            .then(res => res.json())
            .then(response => {
                if (!response.success) return;

                currentItems = response.data;
                itemIndex = 0; 
                
                empty.classList.add('hidden');
                panel.classList.remove('hidden');
                
                renderItemDetail();
                fetchTableData(currentPage, true); 
            });
    };

    function renderItemDetail() {
        if (!currentItems || currentItems.length === 0) return;

        const item = currentItems[itemIndex];
        const itemStatus = item.record_status ? String(item.record_status).toLowerCase() : 'for approval';
        const formalName = getFormalServiceName(item.service_type || item.internal_service_type);
        const hasBlotter = item.has_blotter == 1;
        
        const residentName = item.full_name || item.resident_name || 'Walk-in Resident';
        const blotterWarning = hasBlotter 
            ? ' <i class="fa-solid fa-triangle-exclamation" style="color: #ef4444; margin-left: 6px;" title="Active Blotter/Complaint Record"></i>' 
            : '';

        const warningBanner = document.getElementById('certDetailActiveWarning');
        if (warningBanner) {
            warningBanner.style.display = hasBlotter ? 'flex' : 'none';
        }

        document.getElementById('detailCertType').textContent = formalName;
        document.getElementById('detailReqId').textContent = item.queue_number || 'N/A';
        document.getElementById('detailResidentName').innerHTML = residentName + blotterWarning;
        document.getElementById('detailPurpose').textContent = item.purpose || 'N/A';
        
        const displayStatus = itemStatus === 'processing' ? 'APPROVED' : itemStatus.toUpperCase();
        document.getElementById('detailStatusBadge').innerHTML = `<span class="badge badge--${itemStatus.replace(/\s+/g, '-')}">${displayStatus}</span>`;
        
        const navContainer = document.getElementById('multiItemNav');
        if (currentItems.length > 1) {
            navContainer.style.display = 'flex';
            document.getElementById('multiItemText').textContent = `Service ${itemIndex + 1} of ${currentItems.length}`;
            
            document.getElementById('btnPrevItem').disabled = (itemIndex === 0);
            document.getElementById('btnNextItem').disabled = (itemIndex === currentItems.length - 1);
            
            document.getElementById('btnPrevItem').style.opacity = (itemIndex === 0) ? '0.3' : '1';
            document.getElementById('btnNextItem').style.opacity = (itemIndex === currentItems.length - 1) ? '0.3' : '1';
        } else {
            navContainer.style.display = 'none';
        }

        const phoneNumber = item.phone_number || item.contact_number || '';
        const isOnline = item.queue_number.startsWith('OR');

        renderActionButtons(itemStatus, item.queue_number, isOnline, residentName, phoneNumber);
    }

    document.getElementById('btnPrevItem').addEventListener('click', () => {
        if (itemIndex > 0) { itemIndex--; renderItemDetail(); }
    });

    document.getElementById('btnNextItem').addEventListener('click', () => {
        if (itemIndex < currentItems.length - 1) { itemIndex++; renderItemDetail(); }
    });

    // --- MAIN ADMIN ACTION BUTTONS (SIDEBAR) ---
    function renderActionButtons(status, queueNo, isOnline, residentName, phoneNumber) {
        const container = document.getElementById('certActionButtons');
        
        let smsButtonHTML = '';
        if (isOnline) {
            const safeName = residentName.replace(/'/g, "\\'");
            smsButtonHTML = `<button class="btn-cert-action btn-cert-full" style="background: #10b981; color: white; border: none; margin-top: 8px;" onclick="openSmsModal('${safeName}', '${phoneNumber}')"><i class="fa-solid fa-comment-sms"></i> Send SMS Notice</button>`;
        }

        if (status === 'for approval') {
            container.innerHTML = `
                <button class="btn-cert-action btn-cert-approve btn-cert-full" onclick="updateStatus('${queueNo}', 'pending')"><i class="fa-solid fa-thumbs-up"></i> Approve Request</button>
                <button class="btn-cert-action btn-cert-reject btn-cert-full" style="margin-top: 8px;" onclick="updateStatus('${queueNo}', 'rejected')"><i class="fa-solid fa-ban"></i> Reject Request</button>
                <button class="btn-cert-action btn-cert-full" style="background: #f1f5f9; color: var(--text-dark); border: 1px solid var(--border-light); padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px;" onclick="openReadOnlyWorkspace('${queueNo}')">
                    <i class="fa-solid fa-eye" style="margin-right: 5px;"></i> View Document
                </button>
            `;
        } else if (status === 'pending') {
            container.innerHTML = `
                <button class="btn-cert-action btn-cert-approve btn-cert-full" onclick="lockAndProcessDocument('${queueNo}')"><i class="fa-solid fa-gears"></i> Process Document</button>
                <button class="btn-cert-action btn-cert-reject btn-cert-full" style="margin-top: 8px;" onclick="updateStatus('${queueNo}', 'rejected')"><i class="fa-solid fa-ban"></i> Reject Request</button>
                <button class="btn-cert-action btn-cert-full" style="background: #f1f5f9; color: var(--text-dark); border: 1px solid var(--border-light); padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px;" onclick="openReadOnlyWorkspace('${queueNo}')">
                    <i class="fa-solid fa-eye" style="margin-right: 5px;"></i> View Document
                </button>
                ${smsButtonHTML}
            `;
        } else if (status === 'processing') {
            let processActionButtons = '';
            if (isOnline) { 
                processActionButtons = `
                    <button class="btn-cert-action btn-cert-approve btn-cert-full" onclick="updateStatus('${queueNo}', 'ready for pickup')"><i class="fa-solid fa-box-open"></i> Mark Ready for Pickup</button>
                    <button class="btn-cert-action btn-cert-full" style="background: #8b5cf6; color: white; border: none; margin-top: 8px; font-weight: 600; padding: 10px; border-radius: 6px; cursor: pointer;" onclick="updateStatus('${queueNo}', 'completed')"><i class="fa-solid fa-check-double"></i> Mark Completed</button>
                `;
            } else { 
                processActionButtons = `
                    <button class="btn-cert-action btn-cert-full" style="background: #8b5cf6; color: white; border: none; font-weight: 600; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%;" onclick="updateStatus('${queueNo}', 'completed')"><i class="fa-solid fa-check-double"></i> Mark Completed</button>
                `;
            }
            container.innerHTML = `
                <div style="background: rgba(34,197,94,0.1); color: var(--green); text-align:center; border-radius:8px; padding:12px; font-weight:600; border: 1px solid rgba(34,197,94,0.3); margin-bottom: 10px;">
                    <i class="fa-solid fa-gears"></i> This request is currently PROCESSING.
                </div>
                ${processActionButtons}
                <button class="btn-cert-action btn-cert-full" style="background: #f1f5f9; color: var(--text-dark); border: 1px solid var(--border-light); padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 8px; margin-bottom: 8px;" onclick="openReadOnlyWorkspace('${queueNo}')">
                    <i class="fa-solid fa-eye" style="margin-right: 5px;"></i> View Document
                </button>
                ${smsButtonHTML}
            `;
        } else if (status === 'ready for pickup') {
             container.innerHTML = `
                <div style="background: rgba(16,185,129,0.1); color: #10b981; text-align:center; border-radius:8px; padding:12px; font-weight:600; border: 1px solid rgba(16,185,129,0.3); margin-bottom: 10px;">
                    <i class="fa-solid fa-box-open"></i> This document is READY FOR PICKUP.
                </div>
                <button class="btn-cert-action btn-cert-full" style="background: #8b5cf6; color: white; border: none; font-weight: 600; padding: 10px; border-radius: 6px; cursor: pointer; width: 100%;" onclick="updateStatus('${queueNo}', 'completed')"><i class="fa-solid fa-check-double"></i> Mark as Claimed / Completed</button>
                ${smsButtonHTML}
             `;
        } else {
            const displayStatus = status === 'completed' ? 'COMPLETED' : 'REJECTED';
            container.innerHTML = `
                <div style="background:var(--bg); text-align:center; border-radius:8px; padding:12px; font-weight:600; color:var(--text-mid); border: 1px solid var(--border-light); margin-bottom: 10px;">
                    This request has been ${displayStatus}.
                </div>
                <button class="btn-cert-action btn-cert-full" style="background: #f1f5f9; color: var(--text-dark); border: 1px solid var(--border-light); padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; margin-bottom: 8px;" onclick="openReadOnlyWorkspace('${queueNo}')">
                    <i class="fa-solid fa-eye" style="margin-right: 5px;"></i> View Document (Read-Only)
                </button>
                <button class="btn-cert-action btn-cert-full" style="background: #f59e0b; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600; width: 100%;" onclick="updateStatus('${queueNo}', 'pending')">
                    <i class="fa-solid fa-clock-rotate-left" style="margin-right: 5px;"></i> Revert to Pending
                </button>
                ${smsButtonHTML}
            `;
        }
    }

    window.updateStatus = function(queueNo, newStatus) {
        if (!confirm(`Are you sure you want to mark this request as ${newStatus.toUpperCase()}?`)) return;

        fetch(STATUS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queue_number: queueNo, status: newStatus })
        })
        .then(async res => {
            if (!res.ok) {
                const text = await res.text();
                throw new Error("Server Error: " + text);
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                showToast(`Request marked as ${newStatus}!`);

                // ✅ LOG THE STATUS CHANGE
                logActivity(`Updated request status for <strong>${queueNo}</strong> to <strong>${newStatus.toUpperCase()}</strong>.`);

                fetchTableData(currentPage, true);
                viewRequest(queueNo); 
            } else {
                alert(data.message || "Failed to update status.");
            }
        })
        .catch(err => {
            console.error("Fetch Error Details:", err);
            alert("System Error: Could not connect to the API. Press F12 and check the Console for details.");
        });
    }

    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-tab');
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.profile-tab-panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });

    document.getElementById('certDetailClose').addEventListener('click', () => {
        document.getElementById('certDetailContent').classList.add('hidden');
        document.getElementById('certDetailEmpty').classList.remove('hidden');
        activeQueueNo = null;
        fetchTableData(currentPage, true); 
    });

    // --- 4. PAGINATION UI ---
    function renderPagination(meta) {
        const info = document.getElementById('certPaginationInfo');
        const prev = document.getElementById('certPrevPage');
        const next = document.getElementById('certNextPage');

        if(!meta) return;

        info.textContent = `Page ${meta.current_page} of ${meta.total_pages}`;
        prev.disabled = meta.current_page === 1;
        next.disabled = meta.current_page === meta.total_pages;

        prev.onclick = () => fetchTableData(meta.current_page - 1);
        next.onclick = () => fetchTableData(meta.current_page + 1);
    }

    // --- 5. FILTERS & SEARCH ---
    document.getElementById('certSearch').addEventListener('input', () => fetchTableData(1, true));
    document.getElementById('filterCertStatus').addEventListener('change', () => fetchTableData(1, false));
    const filterCertTypeEl = document.getElementById('filterCertType');
    if (filterCertTypeEl) {
        filterCertTypeEl.addEventListener('change', () => fetchTableData(1, false));
    }
    
    const filterSourceEl = document.getElementById('filterSource');
    if (filterSourceEl) {
        filterSourceEl.addEventListener('change', () => fetchTableData(1, false));
    }
    
    document.getElementById('btnRefresh').addEventListener('click', () => {
        fetchTableData(currentPage, false);
        showToast("Queue refreshed.");
    });

    // --- 6. SMS LOGIC ---
    window.openSmsModal = function(name, phone) {
        document.getElementById('smsResidentName').value = name;
        document.getElementById('smsPhoneNumber').value = phone || '';
        document.getElementById('smsMessage').value = `Hello ${name}, your certificate request is now ready. Please proceed to Barangay 101 to claim it.`;
        
        const modal = document.getElementById('modalSms');
        modal.classList.remove('hidden');
        
        if (typeof openModal === 'function') {
            openModal('modalSms');
        } else {
            modal.classList.add('open');
        }
    };

    window.processSendSms = function() {
        const phone = document.getElementById('smsPhoneNumber').value.trim();
        const message = document.getElementById('smsMessage').value.trim();
        const resName = document.getElementById('smsResidentName').value.trim(); // for logging

        if (!phone || !message) {
            alert("Phone number and message are required.");
            return;
        }

        const btn = document.getElementById('btnSendSms');
        const originalBtnText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        fetch('../API/Admin/admin_send_sms_api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: phone, message: message })
        })
        .then(res => res.json())
        .then(data => {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;

            if (data.success) {
                showToast("SMS Sent Successfully!");

                // ✅ LOG THE SMS NOTIFICATION
                logActivity(`Sent SMS notification to <strong>${resName}</strong>.`);

                if (typeof closeModal === 'function') {
                    closeModal('modalSms');
                } else {
                    document.getElementById('modalSms').classList.remove('open');
                    document.getElementById('modalSms').classList.add('hidden');
                }
            } else {
                alert("Failed to send SMS: " + data.message);
            }
        })
        .catch(err => {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            console.error("SMS Error:", err);
            alert("An error occurred while sending the SMS.");
        });
    };

    // --- LOCK AND AUTO-OPEN WORKSPACE ---
    window.lockAndProcessDocument = async function(queueNo) {
        try {
            const res = await fetch('../API/Admin/admin_certificates_lock_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queue_number: queueNo })
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("PHP Server Error:", text);
                alert("Server Error while locking. Please check the console.");
                return;
            }

            const data = await res.json();

            if (data.success) {
                showToast("Document Locked! Opening Workspace...");

                // ✅ LOG THE DOCUMENT LOCK/PROCESS
                logActivity(`Locked and started processing document for <strong>${queueNo}</strong>.`);

                fetchTableData(currentPage, true);
                viewRequest(queueNo); 
                openReadOnlyWorkspace(queueNo); 
            } else {
                alert(data.message || "Failed to process document.");
            }

        } catch (err) {
            console.error("Lock JS Error:", err);
            alert("System Error: Could not connect to the server to lock the document.");
        }
    };

    // --- INITIALIZE ---
    fetchTableData(1);
    setInterval(() => { fetchTableData(currentPage, true); }, 10000);

    // --- INDIVIDUAL PRINT LOGIC ---
    // Notice this is placed INSIDE the DOMContentLoaded block so it can read 'currentItems'
    window.printIndividualService = function(index) {
        const item = currentItems[index];
        const sName = getFormalServiceName(item.service_type || item.internal_service_type);
        const formalDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        
        // Log the individual print activity
        const queueToLog = item.queue_number || activeQueueNo;
        logActivity(`Printed individual document: <strong>${sName}</strong> for queue number <strong>${queueToLog}</strong>`);

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

        // 3. Grab all stylesheets from the main document to ensure styling transfers over
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => `<link rel="stylesheet" href="${link.href}">`)
            .join('');

        // 4. Write the HTML into the iframe document
        // 4. Write the HTML into the iframe document (INDIVIDUAL PRINT)
        // 4. Write the HTML into the iframe document (INDIVIDUAL PRINT)
        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Print Certificate - ${sName}</title>
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
                            /* Force EXACT A4 dimensions */
                            width: 210mm !important;
                            height: 296mm !important; /* 1mm short to prevent spill */
                            max-height: 297mm !important;
                            margin: 0 auto !important; 
                            padding: 20mm 25mm !important; /* Standard formal margins */
                            box-sizing: border-box !important;
                            border: none !important;
                            box-shadow: none !important;
                            page-break-after: always !important; /* Forces 1 service per page */
                            page-break-inside: avoid !important;
                            overflow: hidden !important; /* Clips any stray pixels */
                            position: relative !important; /* Keeps watermark centered */
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
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
            
            // Clean up the iframe after printing
            setTimeout(() => { document.body.removeChild(printFrame); }, 1500);
        }, 1000);
    };

}); // <-- MAIN CLOSING BRACKET

function showToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toastMsg');
    if (toast && msgEl) {
        msgEl.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// ========================================
// CAMERA & SMART COMPRESSION LOGIC
// ========================================

window.compressStaffPhoto = function(base64Str, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        callback(canvas.toDataURL("image/jpeg", 0.7)); 
    }
};

window.handleStaffPhotoUpload = function(input, recordId) {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("File is too large. Maximum size is 10MB only.");
        input.value = ""; 
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        window.compressStaffPhoto(e.target.result, function(compressedBase64) {
            const preview = document.getElementById(`staff_photo_preview_${recordId}`);
            if (preview) { preview.src = compressedBase64; preview.style.display = 'block'; }
            
            const paperImg = document.getElementById(`paper_photo_${recordId}`);
            if (paperImg) { paperImg.src = compressedBase64; paperImg.style.display = 'block'; }
            
            const hiddenInput = document.getElementById(`new_photo_base64_${recordId}`);
            if (hiddenInput) { hiddenInput.value = compressedBase64; }
            
            input.value = ""; 
        });
    };
    reader.readAsDataURL(file);
};

window.openStaffCamera = function(recordId) {
    const cam = document.createElement('div');
    cam.innerHTML = `
        <div style="position:fixed; inset:0; background:black; z-index:99999; overflow:hidden;">
            <div style="position:absolute; top:0; width:100%; padding:15px; display:flex; justify-content:space-between; align-items:center; color:white; z-index:10; box-sizing: border-box;">
                <div style="font-weight:600;">Take ID Photo</div>
                <button id="close-cam-staff" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">Close</button>
            </div>
            <video id="cam-video-staff" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
            <img id="cam-preview-staff" style="display:none; width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1;" />
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:85vw; max-width:620px; aspect-ratio:620/720; border:4px dashed rgba(255,255,255,0.8); border-radius:50%; box-shadow: 0 0 0 4000px rgba(0,0,0,0.5); pointer-events:none; z-index:2;"></div>
            <div style="position:absolute; bottom:40px; width:100%; display:flex; justify-content:center; gap:15px; z-index:10;">
                <button id="capture-btn-staff" style="background:#22c55e; color:white; border:none; padding:15px 30px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">📸 Capture</button>
                <button id="retake-btn-staff" style="display:none; background:#64748b; color:white; border:none; padding:15px 25px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold;">🔄 Retake</button>
                <button id="confirm-btn-staff" style="display:none; background:#3b82f6; color:white; border:none; padding:15px 25px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold;">✅ Use Photo</button>
            </div>
        </div>
    `;
    document.body.appendChild(cam);

    let streamReference = null;
    let tempCapturedImg = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(stream => {
        streamReference = stream;
        const video = document.getElementById('cam-video-staff');
        video.srcObject = stream;

        document.getElementById('capture-btn-staff').onclick = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            window.compressStaffPhoto(canvas.toDataURL("image/jpeg", 0.9), function(compressedBase64) {
                tempCapturedImg = compressedBase64;
                document.getElementById('cam-preview-staff').src = tempCapturedImg;
                document.getElementById('cam-preview-staff').style.display = 'block';
                video.style.display = 'none';
                document.getElementById('capture-btn-staff').style.display = 'none';
                document.getElementById('retake-btn-staff').style.display = 'block';
                document.getElementById('confirm-btn-staff').style.display = 'block';
            });
        };

        document.getElementById('retake-btn-staff').onclick = () => {
            document.getElementById('cam-preview-staff').style.display = 'none';
            video.style.display = 'block';
            document.getElementById('capture-btn-staff').style.display = 'block';
            document.getElementById('retake-btn-staff').style.display = 'none';
            document.getElementById('confirm-btn-staff').style.display = 'none';
        };

        document.getElementById('confirm-btn-staff').onclick = () => {
            document.getElementById(`staff_photo_preview_${recordId}`).src = tempCapturedImg;
            document.getElementById(`staff_photo_preview_${recordId}`).style.display = 'block';
            document.getElementById(`paper_photo_${recordId}`).src = tempCapturedImg;
            document.getElementById(`paper_photo_${recordId}`).style.display = 'block';
            document.getElementById(`new_photo_base64_${recordId}`).value = tempCapturedImg;
            
            if (streamReference) streamReference.getTracks().forEach(t => t.stop());
            cam.remove();
        };

        document.getElementById('close-cam-staff').onclick = () => {
            if (streamReference) streamReference.getTracks().forEach(t => t.stop());
            cam.remove();
        };
    }).catch(() => {
        alert("Camera not allowed or unavailable.");
        cam.remove();
    });
};

