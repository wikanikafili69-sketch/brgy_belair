/* ============================================================
   BARANGAY 101 — ADMIN STAFF PICTURES SCRIPTS
   File: JS/Admin_js/admin_staff_pictures.js
   ============================================================ */

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

    // ── STATUS FILTER TABS ─────────────────────────────────────────────────
    const filterBtns = document.querySelectorAll('.filter-tabs .filter-btn');
    const rows = document.querySelectorAll('.official-row');

    filterRows('active'); // Default to showing active items

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterRows(e.target.getAttribute('data-filter'));
        });
    });

    function filterRows(status) {
        rows.forEach(row => {
            if (row.getAttribute('data-status') === status) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
});


// ── MODAL LOGIC ────────────────────────────────────────────────────────
function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

// Close modal when clicking outside
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) closeModal(this.id);
    });
});

// ── DYNAMIC DETAIL FIELDS ──────────────────────────────────────────────
function addDetailField(containerId, value = '') {
    const container = document.getElementById(containerId);
    
    const div = document.createElement('div');
    div.className = 'detail-input-group';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'details[]';
    input.className = 'form-input';
    input.placeholder = 'Add another detail or badge...';
    input.value = value;
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-remove-detail';
    removeBtn.innerHTML = '<i class="fa-solid fa-minus"></i>';
    removeBtn.onclick = function() {
        container.removeChild(div);
    };
    
    div.appendChild(input);
    div.appendChild(removeBtn);
    container.appendChild(div);
}

// ── OPEN EDIT MODAL ────────────────────────────────────────────────────
function openEditModal(id) {
    const official = window.officialsData.find(o => o.id == id);
    if (!official) return;

    document.getElementById('edit_id').value = official.id;
    document.getElementById('edit_name').value = official.name;
    document.getElementById('edit_position').value = official.position;
    document.getElementById('edit_bio').value = official.bio;

    const detailsContainer = document.getElementById('edit-details-container');
    const currentGroups = detailsContainer.querySelectorAll('.detail-input-group');
    currentGroups.forEach(group => group.remove());

    let details = [];
    try { details = JSON.parse(official.details) || []; } catch(e) {}
    
    details.forEach(detail => {
        addDetailField('edit-details-container', detail);
    });

    document.getElementById('edit-photo-upload').value = '';
    document.getElementById('edit-image-preview-container').innerHTML = '';

    openModal('modalEditOfficial');
}

// ── SMART IMAGE UPLOAD GRID ────────────────────────────────────────────
function setupSmartImageGrid(inputId, gridId, addBtnId) {
    const input = document.getElementById(inputId);
    const grid = document.getElementById(gridId);
    const addBtn = document.getElementById(addBtnId);
    
    if (!input || !grid || !addBtn) return;

    // Use a DataTransfer object to hold files programmatically
    let dataTransfer = new DataTransfer();

    input.addEventListener('change', function(event) {
        const files = event.target.files;
        const maxSize = 20 * 1024 * 1024; // 20MB

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 1. Limit to 3 files total
            if (dataTransfer.items.length >= 3) {
                alert("You can only upload a maximum of 3 photos.");
                break;
            }

            // 2. Limit size to 20MB
            if (file.size > maxSize) {
                alert(`File "${file.name}" exceeds the 20MB limit.`);
                continue;
            }

            // Add valid file to our DataTransfer object
            dataTransfer.items.add(file);
        }

        // Update the actual input so PHP can see it
        input.files = dataTransfer.files;
        
        // Refresh the visual UI
        renderGrid();
    });

    function renderGrid() {
        // Clear current thumbnails (leave the Add button)
        const thumbnails = grid.querySelectorAll('.photo-thumbnail-box');
        thumbnails.forEach(t => t.remove());

        // Read files from DataTransfer and create thumbnails
        Array.from(dataTransfer.files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const box = document.createElement('div');
                box.className = 'photo-thumbnail-box';

                const img = document.createElement('img');
                img.src = e.target.result;

                const removeBtn = document.createElement('button');
                removeBtn.className = 'photo-remove-btn';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.type = 'button';
                
                // Remove function
                removeBtn.onclick = function() {
                    // Remove from DataTransfer by index
                    let newDataTransfer = new DataTransfer();
                    Array.from(dataTransfer.files).forEach((f, i) => {
                        if (i !== index) newDataTransfer.items.add(f);
                    });
                    dataTransfer = newDataTransfer;
                    input.files = dataTransfer.files; // Update input
                    renderGrid(); // Re-render UI
                };

                box.appendChild(img);
                box.appendChild(removeBtn);
                grid.insertBefore(box, addBtn);
            };
            reader.readAsDataURL(file);
        });

        // Hide the '+' button if we have 3 images
        if (dataTransfer.items.length >= 3) {
            addBtn.style.display = 'none';
        } else {
            addBtn.style.display = 'flex';
        }
    }
}

// Initialize for both Add and Edit modals
setupSmartImageGrid('photo-upload', 'custom-photo-grid', 'photo-add-btn');
setupSmartImageGrid('edit-photo-upload', 'edit-custom-photo-grid', 'edit-photo-add-btn');