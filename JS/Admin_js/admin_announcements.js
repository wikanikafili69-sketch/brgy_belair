/* ============================================================
   BARANGAY 101 — ADMIN ANNOUNCEMENTS SCRIPTS
   File: JS/Admin_js/admin_announcements.js
   ============================================================ */

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
    // ═══════════════════════════════════════════════════
    // SIDEBAR MOBILE TOGGLE (FIXED)
    // ═══════════════════════════════════════════════════
    const sidebar = document.getElementById("sidebar");
    const btnSidebarToggle = document.getElementById("btnSidebarToggle");
    
    if (btnSidebarToggle && sidebar) {
        btnSidebarToggle.addEventListener("click", (e) => { 
            e.stopPropagation(); // Prevents instant closing
            sidebar.classList.toggle("open"); // Use 'open' to match your global CSS
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

    document.getElementById('filterCategory').addEventListener('change', filterTable);
    document.getElementById('filterStatus').addEventListener('change', filterTable);
    document.getElementById('annSearch').addEventListener('input', filterTable);
});

// ── TABLE FILTER LOGIC ──────────────────────────────────────
function filterTable() {
    const catFilter = document.getElementById('filterCategory').value.toLowerCase();
    const statFilter = document.getElementById('filterStatus').value.toLowerCase();
    const searchQ = document.getElementById('annSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#announcementsTable tbody tr.table-row-item');

    rows.forEach(row => {
        const title = row.querySelector('.ann-title').textContent.toLowerCase();
        const category = row.querySelector('.td-category').textContent.toLowerCase();
        const status = row.querySelector('.td-status').textContent.toLowerCase();

        let matchCat = (catFilter === 'all' || category.includes(catFilter));
        let matchStat = (statFilter === 'all' || status.includes(statFilter));
        let matchSearch = (searchQ === '' || title.includes(searchQ));

        if (matchCat && matchStat && matchSearch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ── MODAL UTILITIES ─────────────────────────────────────────
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
        e.target.classList.remove("open");
        document.body.style.overflow = "";
    }
});

// ── MODERN TOAST NOTIFICATIONS ───────────────────────────────
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = 'position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#3b82f6');
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');
    
    toast.style.cssText = `background:${bgColor}; color:#fff; padding:12px 20px; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.15); font-family:var(--font-body, sans-serif); font-size:0.85rem; font-weight:500; display:flex; align-items:center; gap:10px; opacity:0; transform:translateY(20px); transition:all 0.3s ease;`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ── 1. CREATE POST ──────────────────────────────────────────
function submitAnnouncement() {
    const form = document.getElementById('createAnnouncementForm');
    const title = document.getElementById('annTitle').value.trim();
    const content = document.getElementById('annContent').value.trim();
    const fileInput = document.getElementById('annImage');
    
    if (!title || !content) {
        showToast('Title and Content are required.', 'error');
        return;
    }

    if (fileInput.files.length > 0 && fileInput.files[0].size > 20971520) {
        showToast('Image size must be 20MB or below.', 'error');
        return;
    }

    const formData = new FormData(form);
    fetch('../API/Admin/save_announcement_api.php', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            
            // ✅ LOG THE ACTIVITY
            logActivity(`Created a new announcement post: <strong>${title}</strong>.`);

            showToast(data.message, 'success');
            closeModal('modalAnnouncement');
            form.reset();
            setTimeout(() => window.location.reload(), 1000); 
        } else {
            showToast(data.message, 'error');
        }
    }).catch(err => showToast('Error saving data.', 'error'));
}

// ── 2. REAL-TIME ARCHIVE / RESTORE TOGGLE ───────────────────
function toggleArchiveStatus(id, targetStatus) {
    const msg = targetStatus === 'Archived' ? "Archive this announcement?" : "Restore this announcement to active?";
    if (confirm(msg)) {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('status', targetStatus);

        fetch('../API/Admin/toggle_announcement_status_api.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast(data.message, "success");
                
                // ✅ LOG THE ACTIVITY
                logActivity(`Marked announcement ID <strong>${id}</strong> as ${targetStatus}.`);
                
                const row = document.getElementById(`annRow_${id}`);
                const statusCell = row.querySelector('.td-status');
                const actionGroup = document.getElementById(`actions_${id}`);
                const titleText = row.querySelector('.ann-title');

                if (targetStatus === 'Archived') {
                    statusCell.innerHTML = `<span class="stat-dot dot-draft"></span> Archived`;
                    titleText.style.color = "var(--text-mid)";
                    actionGroup.innerHTML = `
                        <button class="btn-act btn-act--view" title="View Preview" onclick="openViewModal(${id})"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-act btn-act--edit" title="Edit Post" onclick="openEditModal(${id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-act" style="background:rgba(16,185,129,0.1);color:var(--green);" title="Restore to Active" onclick="toggleArchiveStatus(${id}, 'Active')"><i class="fa-solid fa-rotate-left"></i></button>
                    `;
                } else {
                    statusCell.innerHTML = `<span class="stat-dot dot-active"></span> Active`;
                    titleText.style.color = "var(--text-dark)";
                    actionGroup.innerHTML = `
                        <button class="btn-act btn-act--view" title="View Preview" onclick="openViewModal(${id})"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-act btn-act--edit" title="Edit Post" onclick="openEditModal(${id})"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-act btn-act--delete" title="Archive Post" onclick="toggleArchiveStatus(${id}, 'Archived')"><i class="fa-solid fa-box-archive"></i></button>
                    `;
                }
            } else {
                showToast(data.message, "error");
            }
        }).catch(err => showToast('Network error.', 'error'));
    }
}

// ── 3. PREPARE EDIT MODAL ────────────────────────────────────
function openEditModal(id) {
    fetch(`../API/Admin/get_single_announcement_api.php?id=${id}`)
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            const data = response.data;
            document.getElementById('editId').value = data.id;
            document.getElementById('editTitle').value = data.title;
            document.getElementById('editCategory').value = data.type;
            document.getElementById('editStatus').value = data.status;
            document.getElementById('editContent').value = data.excerpt;
            document.getElementById('editFeatured').checked = (data.is_featured == 1);
            
            // Format DB DATE (YYYY-MM-DD) directly into the date input
            if(data.event_date && data.event_date !== '0000-00-00') {
                document.getElementById('editEventDate').value = data.event_date;
            } else {
                document.getElementById('editEventDate').value = '';
            }

            const imgPreview = document.getElementById('editImagePreview');
            imgPreview.src = data.thumb ? data.thumb : '../Images/BARANGAY_BG.jpg';

            openModal('modalEditAnnouncement');
        } else {
            showToast(response.message, 'error');
        }
    }).catch(err => showToast('Failed to load data.', 'error'));
}

// ── 4. SUBMIT EDIT (NO PAGE RELOAD + 20MB LIMIT) ──────────────
function submitEditAnnouncement() {
    const form = document.getElementById('editAnnouncementForm');
    const fileInput = document.getElementById('editImage');
    const editTitle = document.getElementById('editTitle').value.trim();

    if (fileInput.files.length > 0 && fileInput.files[0].size > 20971520) {
        showToast('Image size must be 20MB or below.', 'error');
        return;
    }

    const formData = new FormData(form);

    fetch('../API/Admin/update_announcement_api.php', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            
            // ✅ LOG THE ACTIVITY
            logActivity(`Updated announcement post: <strong>${editTitle}</strong>.`);

            showToast(data.message, 'success');
            closeModal('modalEditAnnouncement');
            
            const id = document.getElementById('editId').value;
            const row = document.getElementById(`annRow_${id}`);
            
            if (row) {
                const titleEl = row.querySelector('.ann-title');
                if (titleEl) titleEl.textContent = editTitle;
                
                const badgeEl = row.querySelector('.badge');
                if (badgeEl) badgeEl.textContent = document.getElementById('editCategory').value;

                // Format and update EVENT DATE dynamically in the table
                const dateEl = row.querySelector('.td-event-date');
                const rawDate = document.getElementById('editEventDate').value;
                if(dateEl) {
                    if (rawDate) {
                        const d = new Date(rawDate);
                        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        dateEl.innerHTML = `<div style="font-size: 0.8rem; color: var(--purple); font-weight: 600;"><i class="fa-regular fa-calendar-check"></i> ${dateStr}</div>`;
                    } else {
                        dateEl.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted);">No Date Set</div>`;
                    }
                }

                const statusSelect = document.getElementById('editStatus').value;
                if(statusSelect === 'Archived' && row.querySelector('.dot-active')) {
                     toggleArchiveStatus(id, 'Archived');
                } else if (statusSelect === 'Active' && row.querySelector('.dot-draft')) {
                     toggleArchiveStatus(id, 'Active');
                }
            }
        } else {
            showToast(data.message, 'error');
        }
    }).catch(err => showToast('Error updating data.', 'error'));
}

// ── 5. VIEW PREVIEW MODAL ────────────────────────────────────
function openViewModal(id) {
    fetch(`../API/Admin/get_single_announcement_api.php?id=${id}`)
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            const data = response.data;
            document.getElementById('viewCategory').textContent = data.type;
            document.getElementById('viewTitle').textContent = data.title;
            document.getElementById('viewContent').textContent = data.excerpt;
            
            const viewImg = document.getElementById('viewImagePreview');
            if(data.thumb) {
                viewImg.src = data.thumb;
                viewImg.style.display = 'block';
            } else {
                viewImg.style.display = 'none';
            }
            
            // Show Event Date or Fallback to 'TBA'
            if(data.event_date && data.event_date !== '0000-00-00') {
                const dateObj = new Date(data.event_date);
                document.getElementById('viewDate').textContent = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            } else {
                document.getElementById('viewDate').textContent = "TBA (No exact date set)";
            }
            
            const editBtn = document.getElementById('viewEditBtn');
            editBtn.onclick = function() {
                closeModal('modalViewAnnouncement');
                openEditModal(id);
            };

            openModal('modalViewAnnouncement');
        } else {
            showToast(response.message, 'error');
        }
    }).catch(err => showToast('Failed to load preview.', 'error'));
}

// ── BROADCAST SMS FUNCTIONALITY ──────────────────────────────
const SMS_API = '../API/Admin/admin_send_sms_api.php'; // Your existing API
const RESIDENTS_API = '../API/Admin/admin_get_residents_sms_api.php'; // The new API
let allResidentsLoaded = false;

window.openBroadcastModal = function() {
    document.getElementById('smsBroadcastMessage').value = '';
    document.getElementById('smsSearchResident').value = '';
    if(document.getElementById('smsSelectAll')) document.getElementById('smsSelectAll').checked = false;
    
    // Reset to Group view
    document.querySelector('input[name="smsTarget"][value="group"]').checked = true;
    document.querySelector('input[name="sectorGroup"][value="all"]').checked = true;
    toggleSmsMode();
    
    openModal('modalBroadcastSms');
};

window.toggleSmsMode = function() {
    const isGroup = document.querySelector('input[name="smsTarget"]:checked').value === 'group';
    document.getElementById('smsGroupSection').style.display = isGroup ? 'block' : 'none';
    document.getElementById('smsCustomSection').style.display = isGroup ? 'none' : 'block';
    
    if (isGroup) {
        fetchGroupCount();
    } else {
        // Fetch the table only once when the custom tab is opened
        if (!allResidentsLoaded) fetchAllResidentsForSms();
    }
};

window.fetchGroupCount = function() {
    const group = document.querySelector('input[name="sectorGroup"]:checked').value;
    const countLabel = document.getElementById('smsRecipientCount');
    countLabel.textContent = 'Calculating...';

    fetch(`${RESIDENTS_API}?action=get_group&group=${group}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                countLabel.textContent = `${data.count} People`;
                document.getElementById('smsBulkNumbers').value = data.numbers; // Store comma-separated numbers safely in a hidden input
            } else {
                countLabel.textContent = 'Error fetching count';
            }
        }).catch(() => countLabel.textContent = 'Network Error');
};

window.fetchAllResidentsForSms = function() {
    const tbody = document.getElementById('smsCustomListBody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching all residents...</td></tr>';
    
    fetch(`${RESIDENTS_API}?action=search&query=`)
        .then(res => res.json())
        .then(data => {
            allResidentsLoaded = true;
            if (!data.success || data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 20px; font-size: 0.85rem; color: var(--text-muted);">No residents found in database.</td></tr>';
                return;
            }
            
            let html = '';
            data.data.forEach(res => {
                // Check if they actually have a number
                const hasNumber = res.contact_number && res.contact_number.trim() !== '';
                
                // If no number, show a warning and disable the checkbox
                const phoneDisplay = hasNumber ? res.contact_number : '<span style="color: var(--red); font-size: 0.75rem;"><i class="fa-solid fa-triangle-exclamation"></i> No Number Saved</span>';
                const checkboxStr = hasNumber ? `<input type="checkbox" class="custom-sms-checkbox" value="${res.contact_number}" style="cursor: pointer;">` : `<input type="checkbox" disabled title="No phone number saved">`;

                html += `
                <tr class="sms-resident-row" style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px; text-align: center;">
                        ${checkboxStr}
                    </td>
                    <td style="padding: 8px; font-size: 0.85rem; font-weight: 500;" class="sms-res-name">${res.full_name}</td>
                    <td style="padding: 8px; font-size: 0.85rem; color: var(--text-muted);" class="sms-res-number">${phoneDisplay}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
        });
};

// Instantly filters the table rows without calling the database again
window.filterCustomSmsTable = function() {
    const query = document.getElementById('smsSearchResident').value.toLowerCase();
    const rows = document.querySelectorAll('.sms-resident-row');
    
    rows.forEach(row => {
        const name = row.querySelector('.sms-res-name').textContent.toLowerCase();
        const number = row.querySelector('.sms-res-number').textContent.toLowerCase();
        
        if (name.includes(query) || number.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
            // Uncheck the hidden row so it doesn't accidentally get sent if 'Select All' was clicked prior
            const cb = row.querySelector('.custom-sms-checkbox');
            if (cb) cb.checked = false;
        }
    });
};

// Select All Checkbox Logic (Only selects visible rows!)
window.toggleAllSmsCheckboxes = function(masterCheckbox) {
    const rows = document.querySelectorAll('.sms-resident-row');
    rows.forEach(row => {
        // Only check the box if the row is currently visible (matches search)
        if (row.style.display !== 'none') {
            const cb = row.querySelector('.custom-sms-checkbox');
            if(cb) cb.checked = masterCheckbox.checked;
        }
    });
};

window.sendBroadcastSms = function() {
    const message = document.getElementById('smsBroadcastMessage').value.trim();
    const isGroup = document.querySelector('input[name="smsTarget"]:checked').value === 'group';
    const btnSend = document.getElementById('btnSendBroadcast');
    
    let numbersToSend = "";

    if (!message) {
        showToast("Please enter a message.", "error");
        return;
    }

    if (isGroup) {
        numbersToSend = document.getElementById('smsBulkNumbers').value;
    } else {
        const checkboxes = document.querySelectorAll('.custom-sms-checkbox:checked');
        let selectedNumbers = [];
        checkboxes.forEach(cb => selectedNumbers.push(cb.value));
        numbersToSend = selectedNumbers.join(',');
    }

    if (!numbersToSend) {
        showToast("No recipients found or selected.", "error");
        return;
    }

    // Confirmation
    const count = numbersToSend.split(',').length;
    if (!confirm(`You are about to send this SMS to ${count} recipient(s). Proceed?`)) return;

    // UI Update
    btnSend.disabled = true;
    btnSend.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

    // Send payload to Semaphore API endpoint
    fetch(SMS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: numbersToSend, message: message })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            
            // ✅ LOG THE ACTIVITY
            logActivity(`Sent an SMS broadcast to <strong>${count}</strong> recipient(s).`);

            showToast(`Broadcast sent successfully!`, 'success');
            closeModal('modalBroadcastSms');
        } else {
            alert("Failed to send broadcast: " + (data.message || "Unknown error"));
        }
    })
    .catch(err => {
        console.error("Broadcast Error:", err);
        alert("A network error occurred while sending the broadcast.");
    })
    .finally(() => {
        btnSend.disabled = false;
        btnSend.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Broadcast';
    });
};