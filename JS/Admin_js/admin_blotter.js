/* ============================================================
   BARANGAY 101 — ADMIN BLOTTER SCRIPTS
   File: JS/Admin_js/admin_blotter.js
   ============================================================ */

// Global variable to store fetched records for the View/Edit Modals
let currentBlotterRecords = [];

// --- ACTIVITY LOGGER UTILITY ---
const LOG_ACTIVITY_API = '../API/Admin/admin_log_activity_api.php';
window.logActivity = function(actionMessage) {
    fetch(LOG_ACTIVITY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMessage })
    }).catch(err => console.error("Logging Failed:", err));
};

document.addEventListener("DOMContentLoaded", () => {
    
    // ── SIDEBAR TOGGLE (Mobile Fixed) ───────────────────────────
    const sidebar = document.getElementById("sidebar");
    const btnSidebarToggle = document.getElementById("btnSidebarToggle");
    
    if (btnSidebarToggle && sidebar) {
        btnSidebarToggle.addEventListener("click", (e) => {
            e.stopPropagation();
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

    // Load Blotter Records on Page Load
    fetchBlotterRecords();

    // ── LISTEN FOR STATUS FILTER CHANGES ────────────────────────
    const filterStatusEl = document.getElementById('filterStatus');
    if (filterStatusEl) {
        filterStatusEl.addEventListener('change', fetchBlotterRecords);
    }

    // ── LIVE SEARCH FILTER (filters both table rows AND mobile cards) ──
    const searchInput = document.getElementById('caseSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();

            // Filter table rows
            const rows = document.querySelectorAll('.blotter-table tbody tr');
            rows.forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
            });

            // Filter mobile cards
            const cards = document.querySelectorAll('.blotter-card');
            cards.forEach(card => {
                card.style.display = card.textContent.toLowerCase().includes(query) ? '' : 'none';
            });
        });
    }

    // ── REPORT TYPE TOGGLE LOGIC ────────────────────────────────
    const addReportType = document.getElementById('addReportType');
    if(addReportType) {
        addReportType.addEventListener('change', function() {
            toggleFieldsBasedOnType(this.value, 'add');
        });
    }

    const editReportType = document.getElementById('editReportType');
    if(editReportType) {
        editReportType.addEventListener('change', function() {
            toggleFieldsBasedOnType(this.value, 'edit');
        });
    }

    // ── DYNAMIC RESIDENT SEARCH (CUSTOM UI) ──────────────────────────
    let searchTimeout;
    const residentInputs = document.querySelectorAll('.autocomplete-input');
    
    residentInputs.forEach(input => {
        // 1. Wrap the input in a relative div
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // 2. Create the custom dropdown list
        const dropdown = document.createElement('ul');
        dropdown.className = 'custom-dropdown';
        wrapper.appendChild(dropdown);

        // 3. Listen for typing
        input.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length < 2) {
                dropdown.style.display = 'none';
                return;
            }

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`../API/Admin/admin_blotter_api.php?action=get_residents&q=${encodeURIComponent(query)}`);
                    
                    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                    
                    const result = await response.json();
                    dropdown.innerHTML = ''; // Clear old results
                    
                    if (result.success) {
                        if (result.data.length > 0) {
                            result.data.forEach(resident => {
                                const li = document.createElement('li');
                                li.textContent = resident.full_name;
                                
                                li.addEventListener('mousedown', function() {
                                    input.value = resident.full_name;
                                    dropdown.style.display = 'none';
                                });
                                
                                dropdown.appendChild(li);
                            });
                            dropdown.style.display = 'block'; // Show dropdown
                        } else {
                            dropdown.style.display = 'none'; // Hide if no matches
                        }
                    } else {
                        console.error("API Database Error:", result.message);
                        dropdown.style.display = 'none'; 
                    }
                } catch (error) {
                    console.error("Fetch/JSON Error:", error);
                    dropdown.style.display = 'none';
                }
            }, 300);
        });

        // 4. Hide dropdown when clicking outside the input
        input.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });

        // 5. Show dropdown again if they click back into the input and it has text
        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2 && dropdown.children.length > 0) {
                dropdown.style.display = 'block';
            }
        });
    });
});

// ── MOBILE VIEW TOGGLE ───────────────────────────────────────
function switchMobileView(view) {
    const panel = document.querySelector('.panel');
    const btnCard = document.getElementById('btnCardView');
    const btnTable = document.getElementById('btnTableView');

    if (view === 'card') {
        panel.classList.remove('mobile-table-view');
        panel.classList.add('mobile-card-view');
        btnCard.classList.add('active');
        btnTable.classList.remove('active');
    } else {
        panel.classList.remove('mobile-card-view');
        panel.classList.add('mobile-table-view');
        btnTable.classList.add('active');
        btnCard.classList.remove('active');
    }
}

// Helper function to hide/show fields based on Report Type
function toggleFieldsBasedOnType(type, prefix) {
    const isBlotter = type === 'BLOTTER';
    
    const fieldsToToggle = [
        document.getElementById(`${prefix}HearingDate`)?.closest('.form-group'),
        document.getElementById(`${prefix}NumberOfCase`)?.closest('.form-group'),
        document.getElementById(`${prefix}Moderator`)?.closest('.form-group'),
        document.getElementById(`${prefix}Agreement`)?.closest('.form-group'),
        document.getElementById(`${prefix}DocumentReference`)?.closest('.form-group')
    ];

    fieldsToToggle.forEach(field => {
        if (field) {
            field.style.display = isBlotter ? 'none' : 'block';
        }
    });

    const caseNumInput = document.getElementById(`${prefix}CaseNumber`);
    if(caseNumInput && isBlotter && prefix === 'add') {
         caseNumInput.value = 'BLT-' + Math.floor(Math.random() * 1000000);
    } else if (caseNumInput && prefix === 'add') {
         caseNumInput.value = '';
    }
}

// ── API INTEGRATION: FETCH & POPULATE DATA ────────────────────
async function fetchBlotterRecords() {
    try {
        const statusFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'active';
        
        const response = await fetch(`../API/Admin/admin_blotter_api.php?status=${statusFilter}`);
        const result = await response.json();

        if (result.success) {
            currentBlotterRecords = result.data;
            populateBlotterTable(currentBlotterRecords);
        } else {
            showToast("Failed to load records: " + result.message, "error");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        showToast("Network error while fetching records.", "error");
    }
}

function populateBlotterTable(records) {
    const tbody = document.querySelector('.blotter-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="13" style="text-align:center;">No records found</td></tr>`;
        populateBlotterCards([]);
        return;
    }

    const currentFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'active';

    records.forEach(record => {
        const safeText = (val) => val ? val : '';
        
        const isActive = record.status ? (record.status.toLowerCase() === 'active') : (currentFilter !== 'inactive');
        
        const rowClass = isActive ? 'active-blotter-row' : '';
        const pulsingDot = isActive ? `<span class="status-indicator-dot" title="Active Case"></span>` : '';
        
        // Conditional Trash Button
        const trashButton = isActive 
            ? `<button class="btn-act btn-act--reject" title="Mark Inactive" onclick="confirmDelete(${record.id})"><i class="fa-solid fa-trash-can"></i></button>`
            : ``;

        const tr = document.createElement('tr');
        tr.className = rowClass; 
        tr.innerHTML = `
            <td>${safeText(record.blotter_type)}</td>
            <td class="mono-cell">${pulsingDot}${safeText(record.case_number)}</td>
            <td>${safeText(record.hearing_date)}</td>
            <td>${safeText(record.number_of_case)}</td>
            <td>${safeText(record.moderator)}</td>
            <td>${safeText(record.defendants)}</td>
            <td>${safeText(record.complainants)}</td>
            <td>${safeText(record.about)}</td>
            <td class="wrap-text">${safeText(record.issue_problem)}</td>
            <td>${safeText(record.agreement)}</td>
            <td>${safeText(record.document_reference)}</td>
            <td>${safeText(record.noted_by)}</td>
            <td>
                <div class="action-group">
                    <button class="btn-act btn-act--view" title="View" onclick="viewCaseData('${record.case_number}')"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-act btn-act--edit" title="Edit" onclick="openEditModal(${record.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    ${trashButton}
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    populateBlotterCards(records);
}

// ── MOBILE CARD VIEW POPULATION ───────────────────────────────
function populateBlotterCards(records) {
    const container = document.getElementById('blotterCards');
    if (!container) return;

    container.innerHTML = '';

    if (records.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:var(--text-mid);font-size:0.85rem;padding:20px 0;">No records found</p>`;
        return;
    }

    const typeBadgeStyle = {
        'LUPON':    'background:rgba(16,185,129,0.12);color:#059669;',
        'BLOTTER':  'background:rgba(13,110,253,0.1);color:#0d6efd;',
        'VAWC':     'background:rgba(239,68,68,0.1);color:#dc2626;',
        'COMPLAIN': 'background:rgba(245,158,11,0.12);color:#d97706;'
    };

    const currentFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'active';

    records.forEach(record => {
        const safeText = (val) => val ? val : '—';
        const isActive = record.status ? (record.status.toLowerCase() === 'active') : (currentFilter !== 'inactive');

        let formattedDate = '—';
        if (record.hearing_date) {
            const d = new Date(record.hearing_date);
            formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        const badgeStyle = typeBadgeStyle[record.blotter_type] || typeBadgeStyle['BLOTTER'];

        const cardClass = isActive ? 'blotter-card active-blotter-card' : 'blotter-card';
        const pulsingDot = isActive ? `<span class="status-indicator-dot" style="margin-left: 8px;"></span>` : '';
        
        // Conditional Trash Button
        const trashButton = isActive 
            ? `<button class="btn-act btn-act--reject" title="Mark Inactive" onclick="confirmDelete(${record.id})"><i class="fa-solid fa-trash-can"></i></button>`
            : ``;

        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <div class="blotter-card-header">
                <span class="blotter-card-case">${safeText(record.case_number)} ${pulsingDot}</span>
                <span class="blotter-card-type" style="${badgeStyle}">${safeText(record.blotter_type)}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Hearing Date</span>
                <span class="blotter-card-val">${formattedDate}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Complainants</span>
                <span class="blotter-card-val">${safeText(record.complainants)}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Defendants</span>
                <span class="blotter-card-val" style="color:var(--red);font-weight:700;">${safeText(record.defendants)}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Issue/Problem</span>
                <span class="blotter-card-val">${safeText(record.issue_problem)}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Moderator</span>
                <span class="blotter-card-val">${safeText(record.moderator)}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Agreement</span>
                <span class="blotter-card-val">${safeText(record.agreement)}</span>
            </div>
            <div class="blotter-card-row">
                <span class="blotter-card-label">Noted By</span>
                <span class="blotter-card-val">${safeText(record.noted_by)}</span>
            </div>
            <div class="blotter-card-actions">
                <button class="btn-act btn-act--view" title="View" onclick="viewCaseData('${record.case_number}')">
                    <i class="fa-solid fa-eye"></i>
                </button>
                <button class="btn-act btn-act--edit" title="Edit" onclick="openEditModal(${record.id})">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                ${trashButton}
            </div>
        `;
        container.appendChild(card);
    });
}

// ── API INTEGRATION: INSERT NEW DATA ──────────────────────────
async function submitNewCase() {
    const formData = new FormData();
    formData.append('blotter_type', document.getElementById('addReportType').value);
    
    // Save these variables so we can log them if successful
    const rType = document.getElementById('addReportType').value;
    let caseNumStr = document.getElementById('addCaseNumber').value.trim();
    if (!caseNumStr) caseNumStr = "Auto-generated";
    
    formData.append('case_number', document.getElementById('addCaseNumber').value.trim());
    formData.append('hearing_date', document.getElementById('addHearingDate').value);
    formData.append('number_of_case', document.getElementById('addNumberOfCase').value);
    formData.append('moderator', document.getElementById('addModerator').value.trim());
    formData.append('complainants', document.getElementById('addComplainants').value.trim());
    
    const isVisitor = document.getElementById('addIsVisitor').checked ? 1 : 0;
    formData.append('is_visitor', isVisitor);

    formData.append('defendants', document.getElementById('addDefendants').value.trim());
    formData.append('issue_problem', document.getElementById('addIssueProblem').value.trim());
    formData.append('agreement', document.getElementById('addAgreement').value.trim());
    formData.append('document_reference', document.getElementById('addDocumentReference').value.trim());
    formData.append('noted_by', document.getElementById('addNotedBy').value.trim());
    formData.append('about', document.getElementById('addAbout').value.trim());

    const fileInput = document.getElementById('addAttachedFile');
    if (fileInput.files.length > 0) {
        formData.append('attached_file', fileInput.files[0]);
    }

    if (!formData.get('case_number') && rType !== 'BLOTTER' || !formData.get('complainants') || !formData.get('defendants') || !formData.get('issue_problem')) {
        showToast('Please fill in all required fields marked with *', 'error');
        return;
    }

    try {
        const response = await fetch('../API/Admin/admin_blotter_api.php', {
            method: 'POST',
            body: formData 
        });
        
        const result = await response.json();

        if (result.success) {
            
            // ✅ LOG THE ADDITION
            logActivity(`Added a new <strong>${rType}</strong> record/case (Ref: ${caseNumStr}).`);

            showToast(result.message, 'success');
            closeModal('modalAddCase');
            
            document.querySelectorAll('#modalAddCase .form-input').forEach(input => {
                if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                    if(input.type === 'checkbox'){
                        input.checked = false;
                    } else {
                         input.value = '';
                    }
                }
            });
            fetchBlotterRecords();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        showToast('Network error while saving data.', 'error');
    }
}


// ── EDIT CASE DATA ───────────────────────────────────────────
function openEditModal(id) {
    const record = currentBlotterRecords.find(r => String(r.id) === String(id));
    if (!record) return showToast("Record not found", "error");

    document.getElementById('editRecordId').value = record.id;
    document.getElementById('editReportType').value = record.blotter_type;
    document.getElementById('editCaseNumber').value = record.case_number;
    document.getElementById('editHearingDate').value = record.hearing_date || '';
    document.getElementById('editNumberOfCase').value = record.number_of_case;
    document.getElementById('editModerator').value = record.moderator;
    document.getElementById('editComplainants').value = record.complainants;
    document.getElementById('editIsVisitor').checked = record.is_visitor == 1;
    document.getElementById('editDefendants').value = record.defendants;
    document.getElementById('editIssueProblem').value = record.issue_problem;
    document.getElementById('editAgreement').value = record.agreement;
    document.getElementById('editDocRef').value = record.document_reference;
    document.getElementById('editAbout').value = record.about || '';
    document.getElementById('editAttachedFile').value = ''; 

    toggleFieldsBasedOnType(record.blotter_type, 'edit');

    openModal('modalEditCase');
}

// ── EDIT CASE DATA ───────────────────────────────────────────
async function submitEditCase() {
    const formData = new FormData();
    const caseNumStr = document.getElementById('editCaseNumber').value;

    formData.append('_method', 'PUT'); 
    formData.append('id', document.getElementById('editRecordId').value);
    formData.append('blotter_type', document.getElementById('editReportType').value);
    formData.append('case_number', caseNumStr);
    formData.append('hearing_date', document.getElementById('editHearingDate').value);
    formData.append('number_of_case', document.getElementById('editNumberOfCase').value);
    formData.append('moderator', document.getElementById('editModerator').value);
    formData.append('complainants', document.getElementById('editComplainants').value);
    formData.append('is_visitor', document.getElementById('editIsVisitor').checked ? 1 : 0);
    formData.append('defendants', document.getElementById('editDefendants').value);
    formData.append('issue_problem', document.getElementById('editIssueProblem').value);
    formData.append('agreement', document.getElementById('editAgreement').value);
    formData.append('document_reference', document.getElementById('editDocRef').value);
    formData.append('about', document.getElementById('editAbout').value);

    const existingRec = currentBlotterRecords.find(r => r.id == formData.get('id'));
    formData.append('noted_by', existingRec?.noted_by || '');

    const fileInput = document.getElementById('editAttachedFile');
    if (fileInput.files.length > 0) {
        formData.append('attached_file', fileInput.files[0]);
    }

    try {
        const response = await fetch('../API/Admin/admin_blotter_api.php', {
            method: 'POST', 
            body: formData
        });
        
        const result = await response.json();

        if (result.success) {
            // ✅ LOG THE EDIT
            logActivity(`Updated details for case/record <strong>${caseNumStr}</strong>.`);

            showToast(result.message, 'success');
            closeModal('modalEditCase');
            fileInput.value = ''; 
            fetchBlotterRecords(); 
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        showToast('Network error while updating data.', 'error');
    }
}

// ── VIEW CASE DATA (MODAL) ───────────────────────────────────
function viewCaseData(caseNumber) {
    const record = currentBlotterRecords.find(r => String(r.case_number) === String(caseNumber));
    if (!record) return showToast("Error: Record not found.", "error");

    // Check if active
    const currentFilter = document.getElementById('filterStatus') ? document.getElementById('filterStatus').value : 'active';
    const isActive = record.status ? (record.status.toLowerCase() === 'active') : (currentFilter !== 'inactive');

    // Show or hide the warning banner
    const warningBanner = document.getElementById('viewActiveWarning');
    if (warningBanner) {
        warningBanner.style.display = isActive ? 'flex' : 'none';
    }

    document.getElementById('viewCaseNumberTitle').textContent = record.case_number;
    document.getElementById('viewReportType').textContent = record.blotter_type || '—';
    
    let formattedDate = '—';
    if(record.hearing_date) {
         const d = new Date(record.hearing_date);
         formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    document.getElementById('viewHearingDate').textContent = formattedDate;

    document.getElementById('viewComplainants').textContent = record.complainants || '—';
    document.getElementById('viewIsVisitorStatus').innerHTML = record.is_visitor == 1 
        ? '<span class="badge" style="background:var(--gold);color:var(--navy);">Yes</span>' 
        : '<span class="badge" style="background:var(--bg);color:var(--text-mid);">No</span>';
    
    document.getElementById('viewDefendants').textContent = record.defendants || '—';
    document.getElementById('viewModerator').textContent = record.moderator || '—';
    document.getElementById('viewIssueProblem').textContent = record.issue_problem || '—';
    document.getElementById('viewAgreement').textContent = record.agreement || '—';
    document.getElementById('viewDocRef').textContent = record.document_reference || '—';
    document.getElementById('viewNotedBy').textContent = record.noted_by || '—';
    document.getElementById('viewAbout').textContent = record.about || '—';

    const fileContainer = document.getElementById('viewAttachedFile');
    if (record.attached_file) {
        fileContainer.innerHTML = `<a href="../${record.attached_file}" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: bold;"><i class="fa-solid fa-file-pdf"></i> View Document</a>`;
    } else {
        fileContainer.innerHTML = '<span style="color: var(--text-mid);">No document attached</span>';
    }

    openModal('modalViewCase');
}

// ── MODAL FUNCTIONS ──────────────────────────────────────────
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("open");
        document.body.style.overflow = "hidden"; 
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("open");
        document.body.style.overflow = ""; 
    }
}

window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
        if (e.target.id === 'modalAddCase' || e.target.id === 'modalEditCase') {
            return;
        }
        e.target.classList.remove("open");
        document.body.style.overflow = "";
    }
});

// ── TOAST / ALERTS ───────────────────────────────────────────
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        Object.assign(container.style, {
            position: 'fixed', bottom: '24px', right: '24px', zIndex: '9999',
            display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
        });
        document.body.appendChild(container);
    }

    const color = type === 'success' ? '#22c55e' : (type === 'error' ? '#ef4444' : '#f59e0b');
    const toast = document.createElement('div');
    
    Object.assign(toast.style, {
        background: '#fff', borderLeft: `4px solid ${color}`, borderRadius: '4px',
        padding: '12px 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '14px', fontWeight: '500', color: '#333',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: 'translateX(100%)', opacity: '0'
    });

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => { toast.style.transform = 'translateX(0)'; toast.style.opacity = '1'; }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(100%)'; toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── CONFIRM ACTIONS (SOFT DELETE) ─────────────────────────────────
async function confirmDelete(id) {
    if (!confirm("Are you sure you want to mark this case record as inactive?")) {
        return;
    }

    try {
        const response = await fetch('../API/Admin/admin_blotter_api.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        
        const result = await response.json();

        if (result.success) {
            // Locate the record so we can log the case number
            const record = currentBlotterRecords.find(r => r.id == id);
            const caseNumStr = record ? record.case_number : `ID ${id}`;
            
            // ✅ LOG THE INACTIVE STATUS UPDATE
            logActivity(`Marked case/record <strong>${caseNumStr}</strong> as inactive.`);

            showToast(result.message, 'success');
            fetchBlotterRecords(); // Refresh the table
        } else {
            showToast("Failed to update: " + result.message, "error");
        }
    } catch (error) {
        console.error("Error updating data:", error);
        showToast("Network error while updating record.", "error");
    }
}