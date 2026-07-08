/* ============================================================
   BARANGAY 101 — ADMIN/STAFF RESIDENTS SCRIPTS
   File: JS/Staff_js/staff_resident.js
   ============================================================ */

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
    
    if (!document.getElementById('residentTableBody')) return;

    // --- GLOBAL STATE ---
    let currentPage = 1;
    let perPage = 20; 
    let activeResidentId = null;
    let currentResidents = []; 
    let editingId = null; 

    // API Routes
    const FETCH_API = '../API/Staff/staff_resident_fetch_api.php'; 
    const STATUS_API = '../API/Staff/staff_resident_status_api.php';
    const EDIT_API = '../API/Staff/staff_resident_edit_api.php';
    const ADD_API = '../API/Staff/staff_resident_add_api.php';

    // --- HELPERS ---
    const avatarColors = ['av-blue','av-teal','av-purple','av-gold','av-green'];
    const avatarColor  = id => avatarColors[parseInt(String(id).replace(/\D/g, '') || 0, 10) % avatarColors.length];
    const initials     = r => `${r.first_name?.[0]||''}${r.last_name?.[0]||''}`.toUpperCase();
    const fullName     = r => [r.first_name, r.middle_name, r.last_name, r.name_ext].filter(Boolean).join(' ');

    // DATE FIX: Handles both short dates AND full MySQL timestamps!
    const fmtDate = (d) => {
        if (!d) return '—';
        let dateStr = d;
        // If it's a MySQL timestamp like "2026-04-11 17:15:06", convert space to "T"
        if (typeof d === 'string' && d.includes(' ')) {
            dateStr = d.replace(' ', 'T');
        } else if (typeof d === 'string' && !d.includes('T')) {
            // Short date like "2026-04-11", add T00:00:00 to avoid timezone issues
            dateStr = d + 'T00:00:00';
        }
        
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj)) return 'Invalid Date';
        return dateObj.toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });
    };

    const calcAge = (dob) => {
        if (!dob) return '—';
        const today = new Date(), b = new Date(dob);
        let age = today.getFullYear() - b.getFullYear();
        if (today < new Date(today.getFullYear(), b.getMonth(), b.getDate())) age--;
        return age >= 0 ? age : '—';
    };

    const statusBadge = (s) => {
        const lower = String(s).toLowerCase();
        if (lower === 'active') return '<span class="badge badge--approved">Active</span>';
        if (lower === 'archived') return '<span class="badge badge--rejected">Archived</span>';
        return `<span class="badge badge--pending">${s}</span>`;
    };

    function showToast(msg) {
        const el = document.getElementById('toast');
        document.getElementById('toastMsg').textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 3000);
    }

    // --- 1. TABLE FETCHING & PAGINATION ---
    window.fetchTableData = function(page = 1, isSilent = false) {
        currentPage = page;
        
        const search = document.getElementById('residentSearch').value.trim();
        const status = document.getElementById('filterStatus').value || '';
        const gender = document.getElementById('filterGender').value || '';
        const purok = document.getElementById('filterPurok').value || '';

        if (!isSilent) document.getElementById('residentTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">Loading data...</td></tr>';

        fetch(`${FETCH_API}?page=${currentPage}&limit=${perPage}&search=${encodeURIComponent(search)}&filter_status=${encodeURIComponent(status)}&filter_gender=${encodeURIComponent(gender)}&filter_purok=${encodeURIComponent(purok)}`)
            .then(res => res.json())
            .then(result => {
                if (!result.success) return;
                currentResidents = result.data; 
                renderTableRows(result.data);
                renderPagination(result.pagination);
                if (result.summary) updateSummaryChips(result.summary);
            })
            .catch(err => console.error("Fetch failure:", err));
    };

    function renderTableRows(data) {
        const tbody = document.getElementById('residentTableBody');
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr class="empty-state-row"><td colspan="6">
                <i class="fa-solid fa-users-slash"></i> No residents found matching your search.
            </td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(r => {
            const avatar = r.photo_path
                ? `<img src="../${r.photo_path}" class="res-avatar-img"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=\'res-avatar-initials\'>${initials(r)}</span>';">`
                : `<span class="res-avatar-initials">${initials(r)}</span>`;
            const isActive = activeResidentId == r.rbi_id ? 'selected' : '';
            const addressStr = [r.house_number, r.street].filter(Boolean).join(' ');

            // 🔥 Check for active Blotter/Complaint and apply styling
            const hasBlotter = r.has_blotter == 1;
            let trClass = `res-row ${isActive}`;
            let blotterDot = '';

            if (hasBlotter) {
                trClass += ' active-blotter-row';
                blotterDot = `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>`;
            }

            return `<tr class="${trClass}" data-id="${r.rbi_id}" onclick="openProfile('${r.rbi_id}')">
                <td>
                    <div class="resident-cell">
                        <div class="res-avatar">
                            ${avatar}
                        </div>
                        <div>
                            <div class="res-name">${blotterDot} ${fullName(r)}</div>
                            <div class="res-addr">${addressStr || 'No Address Provided'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="res-id-chip">RBI-${r.rbi_id}</span></td>
                <td style="font-size:0.82rem;color:var(--text-mid);">${r.street || '—'}</td>
                <td style="font-family:var(--font-mono);font-size:0.76rem;color:var(--text-mid);">${r.contact_no || '—'}</td>
                <td>${statusBadge(r.status)}</td>
                <td>
                    <button class="btn-view-row" title="View profile" onclick="event.stopPropagation(); openProfile('${r.rbi_id}')">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    function updateSummaryChips(summary) {
        if (document.getElementById('totalCount')) document.getElementById('totalCount').textContent = summary.total || 0;
        if (document.getElementById('activeCount')) document.getElementById('activeCount').textContent = summary.active || 0;
        if (document.getElementById('archivedCount')) document.getElementById('archivedCount').textContent = summary.archived || 0;
    }

    document.querySelectorAll('.summary-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const targetStatus = chip.getAttribute('data-status');
            const dropdown = document.getElementById('filterStatus');
            dropdown.value = dropdown.value === targetStatus ? '' : targetStatus;
            fetchTableData(1, false);
        });
    });

    // --- 2. PAGINATION UI ---
    function renderPagination(meta) {
        const info = document.getElementById('paginationInfo');
        const prev = document.getElementById('prevPage');
        const next = document.getElementById('nextPage');
        const pn = document.getElementById('pageNumbers');

        if(!meta) return;

        const start = (meta.current_page - 1) * meta.limit + 1;
        const end = Math.min(meta.current_page * meta.limit, meta.total_records);
        
        info.textContent = meta.total_records === 0 ? '0 residents' : `${start}–${end} of ${meta.total_records}`;
        if (document.getElementById('tableCount')) document.getElementById('tableCount').textContent = `${meta.total_records} residents`;

        prev.disabled = meta.current_page === 1;
        next.disabled = meta.current_page === meta.total_pages || meta.total_pages === 0;

        prev.onclick = () => fetchTableData(meta.current_page - 1);
        next.onclick = () => fetchTableData(meta.current_page + 1);

        pn.innerHTML = '';
        let from = Math.max(1, meta.current_page - 2);
        let to = Math.min(meta.total_pages, from + 4);
        from = Math.max(1, to - 4);

        for (let i = from; i <= to; i++) {
            const b = document.createElement('button');
            b.className = 'page-num' + (i === meta.current_page ? ' active' : '');
            b.textContent = i;
            b.addEventListener('click', () => fetchTableData(i));
            pn.appendChild(b);
        }
    }

    // --- 3. PROFILE PANEL MAPPER & ACTION BUTTONS ---
    const profilePanel   = document.getElementById('profilePanel');
    const profileEmpty   = document.getElementById('profileEmpty');
    const profileContent = document.getElementById('profileContent');
    const resSplit       = document.getElementById('resSplit');

    window.openProfile = function(id) {
        const r = currentResidents.find(x => x.rbi_id == id);
        if (!r) return;
        activeResidentId = id;

        document.querySelectorAll('.res-row').forEach(tr => {
            tr.classList.toggle('selected', tr.dataset.id == id);
        });

        const ac = avatarColor(r.rbi_id);
        const addressStr = [r.house_number, r.street, r.barangay, r.municipality_city, r.province].filter(Boolean).join(', ');

        const hasBlotter = r.has_blotter == 1;

        // Show/Hide Warning Banner
        const warningBanner = document.getElementById('profileActiveWarning');
        if (warningBanner) {
            warningBanner.style.display = hasBlotter ? 'flex' : 'none';
        }

        document.getElementById('panelPhoto').className = `profile-photo ${ac}`;
        document.getElementById('panelInitials').textContent = initials(r);

        const panelPhotoImg = document.getElementById('panelPhotoImg');
const panelInitials = document.getElementById('panelInitials');

if (r.photo_path) {
    panelPhotoImg.src = "../" + r.photo_path;
    panelPhotoImg.style.display = "block";
    panelInitials.style.display = "none";

    panelPhotoImg.onerror = function () {
        this.style.display = "none";
        panelInitials.style.display = "block";
        panelInitials.textContent = initials(r);
    };

} else {
    panelPhotoImg.style.display = "none";
    panelInitials.style.display = "block";
    panelInitials.textContent = initials(r);
}

        document.getElementById('panelStatusDot').className = `profile-status-dot status-dot--${String(r.status).toLowerCase()}`;

        document.getElementById('panelName').textContent = fullName(r);
        document.getElementById('panelId').textContent = `RBI-${r.rbi_id}`;
        document.getElementById('panelStatusBadge').innerHTML = statusBadge(r.status);

        // Info mapping
        document.getElementById('panelDOB').textContent = fmtDate(r.birth_date);
        document.getElementById('panelAge').textContent = `${calcAge(r.birth_date)} years`;
        document.getElementById('panelGender').textContent = r.gender || '—';
        document.getElementById('panelCivil').textContent = r.civil_status || '—';
        document.getElementById('panelVoter').textContent = parseInt(r.registered_voter) === 1 ? 'Registered Voter' : 'Not Registered';
        
        // NOW FORMATS PROPERLY:
        document.getElementById('panelRegistered').textContent = fmtDate(r.created_at);
        
        document.getElementById('panelAddress').textContent = addressStr || '—';
        document.getElementById('panelPurok').textContent = r.street || '—'; 
        document.getElementById('panelContact').textContent = r.contact_no || '—';
        document.getElementById('panelEmail').textContent = r.email || '—';

        // Household mapping
        document.getElementById('panelHouseHead').textContent = '—'; 
        document.getElementById('panelHouseMembers').textContent = r.household_type || '—';
        document.getElementById('panelHousePurok').textContent = r.street || '—';

        document.getElementById('panelHouseMembersList').innerHTML = `<div class="empty-list-msg"><i class="fa-solid fa-users"></i>Feature coming soon.</div>`;
        document.getElementById('panelDocHistory').innerHTML = `<div class="empty-list-msg"><i class="fa-solid fa-file-circle-xmark"></i>Feature coming soon.</div>`;

        // DYNAMIC ARCHIVE / REVERT BUTTON
        const actionRow = document.getElementById('profileActionRow');
        if (String(r.status).toLowerCase() === 'active') {
            actionRow.innerHTML = `
                <button onclick="updateResidentStatus('${r.rbi_id}', 'Archived')" style="width: 100%; padding: 12px; border-radius: 8px; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; font-weight: 600; cursor: pointer; transition: 0.2s;">
                    <i class="fa-solid fa-box-archive" style="margin-right: 6px;"></i> Archive Resident
                </button>
            `;
        } else {
            actionRow.innerHTML = `
                <button onclick="updateResidentStatus('${r.rbi_id}', 'Active')" style="width: 100%; padding: 12px; border-radius: 8px; background: #dcfce7; color: #22c55e; border: 1px solid #86efac; font-weight: 600; cursor: pointer; transition: 0.2s;">
                    <i class="fa-solid fa-rotate-left" style="margin-right: 6px;"></i> Revert to Active
                </button>
            `;
        }

        switchTab('info');
        profileEmpty.classList.add('hidden');
        profileContent.classList.remove('hidden');
        profilePanel.classList.add('visible');
        resSplit.classList.add('panel-open');
    }

    window.updateResidentStatus = function(rbi_id, newStatus) {
        const actionText = newStatus === 'Archived' ? 'archive this resident' : 'revert this resident to active';
        if (!confirm(`Are you sure you want to ${actionText}?`)) return;

        fetch(STATUS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rbi_id: rbi_id, status: newStatus })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast(data.message);
             fetchTableData(currentPage, true);

            setTimeout(() => {
                openProfile(rbi_id);
            }, 300);
                openProfile(rbi_id); 
            } else {
                alert(data.message || "Failed to update status.");
            }
        });
    };

    function closeProfile() {
        activeResidentId = null;
        profileEmpty.classList.remove('hidden');
        profileContent.classList.add('hidden');
        profilePanel.classList.remove('visible');
        resSplit.classList.remove('panel-open');
        document.querySelectorAll('.res-row').forEach(tr => tr.classList.remove('selected'));
    }

    document.getElementById('panelClose').addEventListener('click', closeProfile);

    // --- 4. TABS ---
    function switchTab(tabId) {
        document.querySelectorAll('.profile-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
        document.querySelectorAll('.profile-tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tabId}`));
    }
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // --- 5. EDIT MODAL WIRING & DYNAMIC FIELDS ---
    const editModal = document.getElementById('editModal');

    // Auto-capitalize names
    document.querySelectorAll('.uppercase-input').forEach(input => {
        input.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
    });

    // TOGGLE LOGIC FOR HIDE/SHOW
    function setupToggle(selectId, wrapId, triggerValue, displayMode = 'block') {
        const sel = document.getElementById(selectId);
        const wrap = document.getElementById(wrapId);
        if(!sel || !wrap) return;

        sel.addEventListener('change', function() {
            const isMatch = this.value === triggerValue;
            wrap.style.display = isMatch ? displayMode : 'none';
        });
    }

    setupToggle('fldReligion', 'wrapReligionOther', 'Other', 'block');
    setupToggle('fldEmployment', 'wrapBusinessKind', 'Self-Employed / Business Owner', 'block');
    setupToggle('fldIsDSWD', 'wrapDSWD', '1', 'grid');
    setupToggle('fldIsLivelihood', 'wrapLivelihood', '1', 'grid');

    window.openEditModal = function(id) {
        const r = currentResidents.find(x => x.rbi_id == id);
        if (!r) return;
        editingId = id;
        document.getElementById('formMode').value = 'edit';

        document.getElementById('residentId').value = r.rbi_id;
        document.getElementById('fldFirstName').value = r.first_name || '';
        document.getElementById('fldMiddleName').value = r.middle_name || '';
        document.getElementById('fldLastName').value = r.last_name || '';
        document.getElementById('fldExt').value = r.name_ext || '';
        document.getElementById('fldHouseholdNo').value = r.household_number || '';
        document.getElementById('fldHouseholdType').value = r.household_type || '';

        let formattedGender = '';
        if(r.gender) formattedGender = r.gender.toUpperCase();
        document.getElementById('fldGender').value = formattedGender;
        document.getElementById('fldDOB').value = r.birth_date || '';
        document.getElementById('fldContact').value = r.contact_no || '';
        document.getElementById('fldEmail').value = r.email || '';

        const previewImg = document.getElementById('photoPreviewImg');
        const previewInitials = document.getElementById('photoInitials');

        if (r.photo_path) {
            previewImg.src = "../" + r.photo_path;
            previewImg.style.display = "block";
            previewInitials.style.display = "none";
        } else {
            previewImg.style.display = "none";
            previewInitials.style.display = "block";
            previewInitials.textContent = initials(r);
        }

        document.getElementById('fldPOB').value = r.birth_place || '';
        document.getElementById('fldCivilStatus').value = r.civil_status || '';
        
        // Handle Religion Logic
        const standardReligions = ['Roman Catholic', 'Iglesia ni Cristo', 'Islam', 'Born Again Christian', 'Seventh-day Adventist'];
        if (r.religion && !standardReligions.includes(r.religion) && r.religion !== "") {
            document.getElementById('fldReligion').value = 'Other';
            document.getElementById('fldReligionOther').value = r.religion;
        } else {
            document.getElementById('fldReligion').value = r.religion || '';
            document.getElementById('fldReligionOther').value = '';
        }

        document.getElementById('fldHouseNo').value = r.house_number || '';
        document.getElementById('fldStreet').value = r.street || '';
        document.getElementById('fldBrgy').value = r.barangay || '';
        document.getElementById('fldMuni').value = r.municipality_city || '';
        document.getElementById('fldProv').value = r.province || '';

        document.getElementById('fldEducation').value = r.educational_attainment || '';
        document.getElementById('fldVoter').value = parseInt(r.registered_voter) === 1 ? "1" : "0";
        document.getElementById('fldPrecinct').value = r.precinct_no || '';
        document.getElementById('fldEmployment').value = r.employment_business || '';
        document.getElementById('fldBusinessKind').value = r.kind_of_business || '';
        document.getElementById('fldCitizenship').value = r.citizenship || '';
        document.getElementById('fldYears').value = r.years_of_stay || '';
        document.getElementById('fldResidenceStatus').value = r.residence_status || '';

        document.getElementById('chkSenior').checked = parseInt(r.is_senior_citizen) === 1;
        document.getElementById('chkPWD').checked = parseInt(r.is_pwd) === 1;
        document.getElementById('chkSoloParent').checked = parseInt(r.is_solo_parent) === 1;
        
        document.getElementById('fldIsDSWD').value = parseInt(r.is_dswd_beneficiary) === 1 ? "1" : "0";
        document.getElementById('chkAICS').checked = parseInt(r.is_aics_beneficiary) === 1;
        document.getElementById('chkAKAP').checked = parseInt(r.is_akap_beneficiary) === 1;
        document.getElementById('chkTUPAD').checked = parseInt(r.is_tupad_beneficiary) === 1;
        document.getElementById('fldDSWDOther').value = r.dswd_other || '';
        document.getElementById('fldDSWDDate').value = r.dswd_date_received || '';

        document.getElementById('fldIsLivelihood').value = parseInt(r.is_livelihood_beneficiary) === 1 ? "1" : "0";
        document.getElementById('fldLivelihoodSpecify').value = r.livelihood_specify || '';
        document.getElementById('fldLivelihoodDate').value = r.livelihood_date_finished || '';

        // Trigger change events to visually open/close dynamic fields based on loaded data
        document.getElementById('fldReligion').dispatchEvent(new Event('change'));
        document.getElementById('fldEmployment').dispatchEvent(new Event('change'));
        document.getElementById('fldIsDSWD').dispatchEvent(new Event('change'));
        document.getElementById('fldIsLivelihood').dispatchEvent(new Event('change'));

        document.getElementById('editModalSub').textContent = `Editing record for ${fullName(r)}`;
        editModal.classList.add('open');
    }

    function closeEditModal() {
        editModal.classList.remove('open');
        document.querySelectorAll('#residentForm .invalid').forEach(el => el.classList.remove('invalid'));
    }

    document.getElementById('editModalClose').addEventListener('click', closeEditModal);
    document.getElementById('btnCancelEdit').addEventListener('click', closeEditModal);

    // SAVE EDITS
    document.getElementById('btnSaveResident').addEventListener('click', () => {
        const required = ['fldFirstName', 'fldLastName', 'fldGender', 'fldDOB', 'fldBrgy', 'fldMuni', 'fldProv'];
        let valid = true;
        required.forEach(id => {
            const el = document.getElementById(id);
            el.classList.toggle('invalid', !el.value.trim());
            if (!el.value.trim()) valid = false;
        });
        if (!valid) { alert("Please fill required fields highlighted in red."); return; }

        // Extract Religion logic
        const finalReligion = document.getElementById('fldReligion').value === 'Other' 
            ? document.getElementById('fldReligionOther').value.trim() 
            : document.getElementById('fldReligion').value;

        const payload = {
            rbi_id: document.getElementById('residentId').value,
            first_name: document.getElementById('fldFirstName').value.trim(),
            middle_name: document.getElementById('fldMiddleName').value.trim(),
            last_name: document.getElementById('fldLastName').value.trim(),
            name_ext: document.getElementById('fldExt').value.trim(),
            household_type: document.getElementById('fldHouseholdType').value,
            gender: document.getElementById('fldGender').value,
            birth_date: document.getElementById('fldDOB').value,
            contact_no: document.getElementById('fldContact').value.trim(),
             email: document.getElementById('fldEmail')?.value.trim() || '',
            birth_place: document.getElementById('fldPOB').value.trim(),
            civil_status: document.getElementById('fldCivilStatus').value,
            religion: finalReligion, // Uses the extracted value

            house_number: document.getElementById('fldHouseNo').value.trim(),
            street: document.getElementById('fldStreet').value.trim(),
            barangay: document.getElementById('fldBrgy').value.trim(),
            municipality_city: document.getElementById('fldMuni').value.trim(),
            province: document.getElementById('fldProv').value.trim(),

            educational_attainment: document.getElementById('fldEducation').value,
            registered_voter: parseInt(document.getElementById('fldVoter').value),
            precinct_no: document.getElementById('fldPrecinct').value.trim(),
            employment_business: document.getElementById('fldEmployment').value,
            kind_of_business: document.getElementById('fldBusinessKind').value.trim(),
            citizenship: document.getElementById('fldCitizenship').value.trim(),
            years_of_stay: document.getElementById('fldYears').value.trim(),
            residence_status: document.getElementById('fldResidenceStatus').value,

            is_senior_citizen: document.getElementById('chkSenior').checked ? 1 : 0,
            is_pwd: document.getElementById('chkPWD').checked ? 1 : 0,
            is_solo_parent: document.getElementById('chkSoloParent').checked ? 1 : 0,

            is_dswd_beneficiary: parseInt(document.getElementById('fldIsDSWD').value),
            is_aics_beneficiary: document.getElementById('chkAICS').checked ? 1 : 0,
            is_akap_beneficiary: document.getElementById('chkAKAP').checked ? 1 : 0,
            is_tupad_beneficiary: document.getElementById('chkTUPAD').checked ? 1 : 0,
            dswd_other: document.getElementById('fldDSWDOther').value.trim(),
            dswd_date_received: document.getElementById('fldDSWDDate').value,

            is_livelihood_beneficiary: parseInt(document.getElementById('fldIsLivelihood').value),
            livelihood_specify: document.getElementById('fldLivelihoodSpecify').value.trim(),
            livelihood_date_finished: document.getElementById('fldLivelihoodDate').value
        };

        const btn = document.getElementById('btnSaveResident');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            const formData = new FormData();

            // append all fields
            for (let key in payload) {
                formData.append(key, payload[key]);
            }

            // append image
            const photoFile = document.getElementById('fldPhoto').files[0];
            if (photoFile) {
                formData.append('photo', photoFile);
            }

            const mode = document.getElementById('formMode')?.value || 'edit';
            const API_URL = mode === 'add' ? ADD_API : EDIT_API;

            fetch(API_URL, {
                method: 'POST',
                body: formData
            })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (data.success) {
                closeEditModal();
                showToast(data.message);
                fetchTableData(currentPage, true);
                if (editingId) openProfile(editingId); 
            } else alert(data.message);
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = originalText;
            console.error(err);
        });
    });

        document.getElementById('panelBtnEdit').addEventListener('click', () => {
            if (activeResidentId) openEditModal(activeResidentId);
        });

        // ✅ ADD BUTTON HERE
        document.getElementById('btnAddResident').addEventListener('click', () => {
            document.getElementById('residentForm').reset();
            document.getElementById('residentId').value = '';
            document.getElementById('formMode').value = 'add';
            editingId = null; // ✅ ADD THIS

            document.getElementById('editModalSub').textContent = "Add New Resident";

            editModal.classList.add('open');
        });

    // --- 6. SEARCH & FILTERS ---
const searchInput = document.getElementById('residentSearch');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', debounce(() => {
    const value = searchInput.value.trim();

    searchClear.style.display = value ? 'flex' : 'none';

    fetchTableData(1, true);
}, 400));
    
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        fetchTableData(1, false);
    });

    document.getElementById('filterStatus').addEventListener('change', () => fetchTableData(1, false));
    document.getElementById('filterGender').addEventListener('change', () => fetchTableData(1, false));
    document.getElementById('filterPurok').addEventListener('change', () => fetchTableData(1, false));

    fetchTableData(1);
});