// ============================================================
//   BARANGAY 101 — ADMIN CONTACT US SCRIPT (REAL-TIME)
//   File: JS/Admin_js/admin_contact_us.js
// ============================================================

let currentViewedId = null;

document.addEventListener('DOMContentLoaded', () => {
    
    // ── SIDEBAR MOBILE TOGGLE (FIXED) ──
    const btnToggle = document.getElementById('btnSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (btnToggle && sidebar) {
        btnToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            sidebar.classList.toggle('open'); 
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !btnToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // ── Initialize Mobile Layout ──
    const viewWrap = document.getElementById('viewToggleWrap');
    if (viewWrap && window.innerWidth <= 768) {
        switchMobileView('card');
    }

    // ── INITIAL DATA FETCH ──
    fetchContactMessages();

    // ⏱️ ── REAL-TIME POLLING (Every 5 seconds) ──
    setInterval(() => {
        const searchInput = document.getElementById('msgSearch');
        const isSearchActive = searchInput && searchInput.value.trim() !== '';
        const isViewModalOpen = document.getElementById('modalViewMessage').classList.contains('active');

        // Only fetch if admin isn't actively searching or viewing a message
        if (!isSearchActive && !isViewModalOpen) {
            fetchContactMessages();
        }
    }, 5000);

    // ── LIVE SEARCH ──
    const searchInput = document.getElementById('msgSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#contactTableBody tr');
            const cards = document.querySelectorAll('.contact-card');
            
            rows.forEach(row => { row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'; });
            cards.forEach(card => { card.style.display = card.textContent.toLowerCase().includes(query) ? '' : 'none'; });
        });
    }
});

// ── FETCH MESSAGES FROM NEW API ──
async function fetchContactMessages() {
    try {
        // Make sure this path points correctly to where you saved the new API file
        const response = await fetch('../API/Admin/admin_contact_us_api.php');
        const result = await response.json();

        if (result.success) {
            populateTable(result.data);
            populateCards(result.data);
            
            // Update entries count text
            const count = result.data.length;
            const infoText = document.querySelector('.page-info');
            if(infoText) infoText.textContent = `Showing ${count > 0 ? 1 : 0} to ${count} of ${count} entries`;
            
        } else {
            console.error("Failed to load records:", result.message);
        }
    } catch (error) {
        console.error("Network error while fetching records:", error);
    }
}

// ── POPULATE TABLE ──
function populateTable(messages) {
    const tbody = document.getElementById('contactTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (messages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 30px;">No active messages found.</td></tr>`;
        return;
    }

    messages.forEach(msg => {
        const d = new Date(msg.date_created);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const hasAttachment = msg.photo_path && msg.photo_path.trim() !== '';
        const attachmentHtml = hasAttachment ? `<i class="fa-solid fa-image" style="color:var(--blue);"></i> Yes` : `<span style="color:var(--text-mid);">No</span>`;
        
        const tr = document.createElement('tr');
        tr.className = 'row-unread';
        tr.innerHTML = `
            <td>${dateStr} <br><span style="font-size:0.65rem;color:var(--text-mid);">${timeStr}</span></td>
            <td style="font-weight: 700;">${escapeHtml(msg.full_name)}</td>
            <td>${escapeHtml(msg.subject)}</td>
            <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(msg.message)}
            </td>
            <td>${attachmentHtml}</td>
            <td><span class="contact-badge unread-badge">ACTIVE</span></td>
            <td style="text-align: right;">
                <div class="action-group" style="justify-content: flex-end;">
                    <button class="page-btn btn-act--view" title="Read Message" 
                        onclick="viewMessage(${msg.id}, '${escapeHtml(msg.full_name)}', '${escapeHtml(msg.email_address || '')}', '${escapeHtml(msg.contact_num || '')}', '${escapeHtml(msg.subject)}', '${escapeHtml(msg.message)}', '${dateStr} ${timeStr}', '${escapeHtml(msg.photo_path || '')}')">
                        <i class="fa-solid fa-eye"></i> Read
                    </button>
                    <button class="page-btn btn-act--reject" title="Archive Message" onclick="archiveMessage(${msg.id})">
                        <i class="fa-solid fa-box-archive"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── POPULATE CARDS ──
function populateCards(messages) {
    const container = document.getElementById('contactCards');
    if (!container) return;

    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-mid);">No active messages found.</div>`;
        return;
    }

    messages.forEach(msg => {
        const d = new Date(msg.date_created);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const card = document.createElement('div');
        card.className = 'contact-card unread';
        card.innerHTML = `
            <div class="contact-card-header">
                <span class="contact-card-date">${dateStr}</span>
                <span class="contact-badge unread-badge">ACTIVE</span>
            </div>
            <div class="contact-card-row">
                <span class="contact-card-label">Name</span>
                <span class="contact-card-val">${escapeHtml(msg.full_name)}</span>
            </div>
            <div class="contact-card-row">
                <span class="contact-card-label">Subject</span>
                <span class="contact-card-val">${escapeHtml(msg.subject)}</span>
            </div>
            <div class="contact-card-actions">
                <button class="btn-act--view" 
                    onclick="viewMessage(${msg.id}, '${escapeHtml(msg.full_name)}', '${escapeHtml(msg.email_address || '')}', '${escapeHtml(msg.contact_num || '')}', '${escapeHtml(msg.subject)}', '${escapeHtml(msg.message)}', '${dateStr} ${timeStr}', '${escapeHtml(msg.photo_path || '')}')">
                    <i class="fa-solid fa-eye"></i> View
                </button>
                <button class="btn-act--reject page-btn" style="padding: 6px 12px; border-radius: 4px;" onclick="archiveMessage(${msg.id})">
                    <i class="fa-solid fa-box-archive"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Helper for mobile switcher
function switchMobileView(viewType) {
    const btnCard = document.getElementById('btnCardView');
    const btnTable = document.getElementById('btnTableView');
    const container = document.querySelector('.panel');

    if (viewType === 'card') {
        btnCard.classList.add('active'); btnTable.classList.remove('active');
        container.classList.remove('mobile-table-view'); container.classList.add('mobile-card-view');
    } else {
        btnTable.classList.add('active'); btnCard.classList.remove('active');
        container.classList.remove('mobile-card-view'); container.classList.add('mobile-table-view');
    }
}

// View Message Update (No longer relies on dataset attributes from DOM)
function viewMessage(id, name, email, contact, subject, message, date, photoPath) {
    currentViewedId = id;

    document.getElementById('viewMsgName').textContent = name;
    document.getElementById('viewMsgEmail').textContent = email || 'N/A';
    document.getElementById('viewMsgContact').textContent = contact || 'N/A';
    document.getElementById('viewMsgSubject').textContent = subject;
    document.getElementById('viewMsgContent').textContent = message;
    document.getElementById('viewMsgDate').textContent = date;

    const attachmentContainer = document.getElementById('viewMsgAttachmentContainer');
    if (photoPath && photoPath.trim() !== '') {
        const link = `../Images/contact_us/${photoPath}`; 
        attachmentContainer.innerHTML = `
            <div style="margin-top: 10px; border: 1px solid var(--border-light); border-radius: 8px; padding: 6px; background: var(--bg); text-align: center;">
                <a href="${link}" target="_blank" title="Click to view full size">
                    <img src="${link}" alt="User Uploaded Photo" style="max-width: 100%; max-height: 250px; border-radius: 4px; object-fit: contain; display: block; margin: 0 auto;">
                </a>
            </div>
            <div style="margin-top: 10px;">
                <a href="${link}" target="_blank" class="btn-ghost" style="display:inline-flex; align-items:center; gap:8px; text-decoration:none; padding:6px 12px; border:1px solid var(--border-light); border-radius:4px; font-size:0.75rem; color:var(--blue);">
                    <i class="fa-solid fa-expand"></i> Open Full Size
                </a>
            </div>
        `;
    } else {
        attachmentContainer.innerHTML = '<span style="font-size:0.8rem; color:var(--text-mid);">No attachment provided.</span>';
    }

    openModal('modalViewMessage');
}

// Archive Update (Now uses JS fetch to refresh instead of reloading page)
function archiveMessage(id = null) {
    const targetId = id || currentViewedId;
    if (!targetId) return;

    if (confirm("Are you sure you want to archive/resolve this message? It will be hidden from the active list.")) {
        const formData = new FormData();
        formData.append('archive_id', targetId);

        fetch('../Admin/admin_contact_us.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Instantly fetch new list instead of reloading the whole browser!
                fetchContactMessages(); 
                closeModal('modalViewMessage');
            } else {
                alert("Error archiving message: " + data.error);
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert("An error occurred connecting to the server.");
        });
    }
}

// Modal closing helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this.id);
    });
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(overlay => closeModal(overlay.id));
    }
});

// Utility to prevent weird JS injection in HTML strings
function escapeHtml(unsafe) {
    return (unsafe || '').toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .replace(/\n/g, "<br>");
}