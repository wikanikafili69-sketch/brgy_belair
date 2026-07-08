/* ============================================================
   BARANGAY 101 — ADMIN STAFF SCRIPTS
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    
    // ═══════════════════════════════════════════════════
    // SIDEBAR & INITIALIZATION
    // ═══════════════════════════════════════════════════
    const sidebar = document.getElementById("sidebar");
    const btnSidebarToggle = document.getElementById("btnSidebarToggle");
    
    if (btnSidebarToggle && sidebar) {
        btnSidebarToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            sidebar.classList.toggle("open");
        });
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && !btnSidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    fetchStaffData();

    // --- ACTIVITY LOGGER UTILITY ---
    const LOG_ACTIVITY_API = '../API/Admin/admin_log_activity_api.php';
    window.logActivity = function(actionMessage) {
        fetch(LOG_ACTIVITY_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: actionMessage })
        }).catch(err => console.error("Logging Failed:", err));
    };

    // ═══════════════════════════════════════════════════
    // REUSABLE IMAGE UPLOAD & CAMERA LOGIC (10MB LIMIT)
    // ═══════════════════════════════════════════════════
    let addImageFile = null;
    let editImageFile = null;

    function setupImageUI(prefix) {
        const fileInput = document.getElementById(`${prefix}_photo`);
        const fileBtn = document.getElementById(`${prefix}_file_btn`);
        const cameraBtn = document.getElementById(`${prefix}_camera_btn`);
        const previewImg = document.getElementById(`${prefix}_preview`);
        const fileName = document.getElementById(`${prefix}_file_name`);

        if (fileBtn && fileInput) {
            fileBtn.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', function () {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                    const maxSize = 10 * 1024 * 1024; // 🔴 10MB LIMIT ENFORCED HERE

                    if (!validTypes.includes(file.type)) {
                        showToast('Invalid file type. Only JPG and PNG allowed.', 'error');
                        fileInput.value = ''; return;
                    }
                    if (file.size > maxSize) {
                        showToast('File is too large. Max size is 10MB.', 'error');
                        fileInput.value = ''; return;
                    }

                    fileName.textContent = "Processing image...";
                    compressImageClientSide(file, 800, function(compressedFile, dataUrlPreview) {
                        if (prefix === 'add') addImageFile = compressedFile;
                        if (prefix === 'edit') editImageFile = compressedFile;
                        fileName.textContent = compressedFile.name;
                        previewImg.src = dataUrlPreview;
                    });
                }
            });
        }

        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => {
                openCamera((file, dataUrl) => {
                    if (prefix === 'add') addImageFile = file;
                    if (prefix === 'edit') editImageFile = file;
                    previewImg.src = dataUrl;
                    fileName.textContent = 'CAMERA_CAPTURE.jpg';
                });
            });
        }
    }

    setupImageUI('add');
    setupImageUI('edit');

    // Client-side image compressor
    function compressImageClientSide(file, maxWidth, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(function(blob) {
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", { type: 'image/jpeg', lastModified: Date.now() });
                    callback(newFile, canvas.toDataURL('image/jpeg', 0.8));
                }, 'image/jpeg', 0.8);
            };
        };
    }

    // Reusable Camera Modal
    function openCamera(onConfirmCallback) {
        const cam = document.createElement('div');
        cam.innerHTML = `
        <div style="position:fixed; inset:0; background:black; z-index:99999; overflow:hidden; font-family:sans-serif;">
            <div style="position:absolute; top:0; width:100%; padding:15px; display:flex; justify-content:space-between; align-items:center; color:white; z-index:10;">
                <div style="font-weight:600; font-size:16px;">Take Photo</div>
                <button id="close-cam" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">Close</button>
            </div>
            <video id="cam-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; transform: scaleX(-1);"></video>
            <img id="cam-captured-preview" style="display:none; width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1; transform: scaleX(-1);" />
            <div id="cam-guide-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; pointer-events:none; z-index:2;">
                <div style="width: 620px; height: 720px; border: 3px dashed rgba(255, 255, 255, 0.8); border-radius: 50%; box-shadow: 0 0 0 4000px rgba(0,0,0,0.65); position: relative;"></div>
            </div>
            <div style="position:absolute; bottom:40px; width:100%; display:flex; justify-content:center; gap:15px; z-index:10;">
                <button id="capture-btn" style="background:#22c55e; color:white; border:none; padding:15px 30px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold;">📸 Capture</button>
                <button id="retake-btn" style="display:none; background:#64748b; color:white; border:none; padding:15px 25px; border-radius:50px; font-size:16px; cursor:pointer;">🔄 Retake</button>
                <button id="confirm-btn" style="display:none; background:#3b82f6; color:white; border:none; padding:15px 25px; border-radius:50px; font-size:16px; cursor:pointer;">✅ Use Photo</button>
            </div>
        </div>`;
        document.body.appendChild(cam);

        let streamReference = null;
        let tempCapturedImg = null;

        navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(stream => {
            streamReference = stream;
            const video = document.getElementById('cam-video');
            video.srcObject = stream;

            document.getElementById('capture-btn').onclick = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0);

                tempCapturedImg = canvas.toDataURL("image/jpeg", 0.8); 
                document.getElementById('cam-captured-preview').src = tempCapturedImg;
                document.getElementById('cam-captured-preview').style.display = 'block';
                video.style.display = 'none';
                document.getElementById('cam-guide-overlay').style.display = 'none';

                document.getElementById('capture-btn').style.display = 'none';
                document.getElementById('retake-btn').style.display = 'block';
                document.getElementById('confirm-btn').style.display = 'block';
            };

            document.getElementById('retake-btn').onclick = () => {
                tempCapturedImg = null;
                document.getElementById('cam-captured-preview').style.display = 'none';
                video.style.display = 'block';
                document.getElementById('cam-guide-overlay').style.display = 'flex';
                
                document.getElementById('capture-btn').style.display = 'block';
                document.getElementById('retake-btn').style.display = 'none';
                document.getElementById('confirm-btn').style.display = 'none';
            };

            document.getElementById('confirm-btn').onclick = () => {
                const file = dataURLtoFile(tempCapturedImg, 'camera_capture.jpg');
                onConfirmCallback(file, tempCapturedImg);
                if (streamReference) streamReference.getTracks().forEach(t => t.stop());
                cam.remove();
            };

            document.getElementById('close-cam').onclick = () => {
                if (streamReference) streamReference.getTracks().forEach(t => t.stop());
                cam.remove();
            };
        }).catch(() => {
            showToast("Camera not allowed or unavailable.", "error");
            cam.remove();
        });
    }

    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        return new File([u8arr], filename, {type:mime});
    }

    // ═══════════════════════════════════════════════════
    // ADD STAFF SUBMISSION
    // ═══════════════════════════════════════════════════
    const addStaffForm = document.getElementById('addStaffForm');
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fName = document.getElementById('add_f_name').value.trim();
            const lName = document.getElementById('add_l_name').value.trim();

            const btnSave = document.getElementById('btnSaveStaff');
            btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btnSave.disabled = true;

            const formData = new FormData();
            formData.append('f_name', fName);
            formData.append('m_name', document.getElementById('add_m_name').value.trim());
            formData.append('l_name', lName);
            formData.append('username', document.getElementById('add_username').value.trim());
            formData.append('email', document.getElementById('add_email').value.trim());
            formData.append('password', document.getElementById('add_password').value);
            formData.append('position', document.getElementById('add_position').value);
            formData.append('status', document.getElementById('add_status').value);
            formData.append('photo', addImageFile);

            // 🚨 Gather checked access rights from the dropdown checkboxes 🚨
            const addAccessChecked = Array.from(document.querySelectorAll('.add-access-checkbox:checked')).map(cb => cb.value);
            formData.append('access_rights', JSON.stringify(addAccessChecked));

            fetch('../API/Admin/admin_staff_add_api.php', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Create Account'; btnSave.disabled = false;
                if (data.success) {
                    logActivity(`Created a new system account for <strong>${fName} ${lName}</strong>.`);
                    showToast(data.message, 'success');
                    closeModal('modalAddStaff'); addStaffForm.reset(); 
                    document.getElementById('add_preview').src = ''; addImageFile = null;
                    document.getElementById('add_file_name').textContent = 'NO FILE CHOSEN';
                    
                    // Reset Access Dropdown items
                    document.querySelectorAll('.add-access-checkbox').forEach(cb => cb.checked = false);
                    updateAccessTable('add');

                    fetchStaffData(); 
                } else { showToast(data.message, 'error'); }
            }).catch(() => {
                btnSave.innerHTML = '<i class="fa-solid fa-check"></i> Create Account'; btnSave.disabled = false;
                showToast("Server connection failed.", 'error');
            });
        });
    }

    // ═══════════════════════════════════════════════════
    // EDIT STAFF SUBMISSION (AJAX)
    // ═══════════════════════════════════════════════════
    const editStaffForm = document.getElementById('editStaffForm');
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fName = document.getElementById('edit_f_name').value.trim();
            const lName = document.getElementById('edit_l_name').value.trim();

            const btnUpdate = document.getElementById('btnUpdateStaff');
            btnUpdate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btnUpdate.disabled = true;

            const formData = new FormData();
            formData.append('action', 'edit_staff');
            formData.append('user_id', document.getElementById('edit_user_id').value);
            formData.append('existing_image', document.getElementById('edit_existing_image').value);
            formData.append('f_name', fName);
            formData.append('m_name', document.getElementById('edit_m_name').value.trim());
            formData.append('l_name', lName);
            formData.append('username', document.getElementById('edit_username').value.trim());
            formData.append('email', document.getElementById('edit_email').value.trim());
            formData.append('position', document.getElementById('edit_position').value);
            
            if (editImageFile) { formData.append('profile_image', editImageFile); }

            // 🚨 Gather checked access rights from dropdown 🚨
            const editAccessChecked = Array.from(document.querySelectorAll('.edit-access-checkbox:checked')).map(cb => cb.value);
            formData.append('access_rights', JSON.stringify(editAccessChecked));

            fetch('../API/Admin/admin_staff_actions.php', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                btnUpdate.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes'; btnUpdate.disabled = false;
                if (data.success) {
                    logActivity(`Updated account details for <strong>${fName} ${lName}</strong>.`);
                    showToast(data.message, 'success');
                    closeModal('modalEditStaff'); 
                    fetchStaffData(); 
                } else { showToast(data.message, 'error'); }
            }).catch(() => {
                btnUpdate.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes'; btnUpdate.disabled = false;
                showToast("Server connection failed.", 'error');
            });
        });
    }

    // ═══════════════════════════════════════════════════
    // PASSWORD RESET SUBMISSION (FORM)
    // ═══════════════════════════════════════════════════
    const resetForm = document.querySelector('form[action="../API/Admin/admin_staff_actions.php"]');
    if (resetForm) {
        resetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            logActivity(`Reset the account password for User ID <strong>${document.getElementById('reset_user_id').value}</strong>.`);
            setTimeout(() => { this.submit(); }, 200);
        });
    }
});


// ── FETCH AND RENDER STAFF TABLE (API) ───────────────────────
function fetchStaffData() {
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) return;

    fetch('../API/Admin/admin_staff_fetch_api.php')
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Error: ${result.message}</td></tr>`;
                showToast(result.message, 'error'); return;
            }
            const users = result.data;
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No users found.</td></tr>';
                return;
            }
            tbody.innerHTML = users.map(user => {
                const fullName = `${user.f_name} ${user.m_name} ${user.l_name}`.trim();
                const initials = `${user.f_name.charAt(0)}${user.l_name.charAt(0)}`.toUpperCase();
                const imagePath = user.profile_image_location ? `../Images/staff_profiles/${user.profile_image_location}` : '';
                const dateObj = new Date(user.created_at);
                const joinedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                const isArchived = user.status === 'archived';
                const rowStyle = isArchived ? 'background: rgba(239, 68, 68, 0.02);' : '';
                const avatarStyle = isArchived ? 'background: var(--muted-light); color: var(--text-mid);' : 'background: linear-gradient(135deg, var(--blue), var(--blue-light));';
                
                const avatarHTML = imagePath ? `<img src="${imagePath}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : initials;
                
                let statusHTML = user.status === 'active' ? `<div class="status-indicator"><span class="duty-dot duty-dot--online"></span> Active</div>` :
                                 user.status === 'archived' ? `<div class="status-indicator status--suspended"><i class="fa-solid fa-lock" style="font-size: 0.7rem;"></i> Suspended</div>` :
                                 `<div class="status-indicator status--offline"><span class="duty-dot duty-dot--offline"></span> Pending</div>`;

                let actionHTML = '';
                
                if (user.position === 'superadmin') {
                    actionHTML = `<span style="color: var(--text-mid); font-size: 0.8rem; font-style: italic; display: block; text-align: center;"><i class="fa-solid fa-shield-halved"></i> Protected</span>`;
                } else if (!isArchived) {
                    actionHTML = `
                        <button class="btn-act btn-act--edit" title="Edit Staff" onclick="event.stopPropagation(); openEditModal(${user.user_id}, '${escapeQuote(user.f_name)}', '${escapeQuote(user.m_name)}', '${escapeQuote(user.l_name)}', '${escapeQuote(user.username)}', '${escapeQuote(user.email)}', '${user.position}', '${escapeQuote(user.profile_image_location || '')}', '${escapeQuote(JSON.stringify(user.access_rights || []))}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-act btn-act--pass" title="Reset Password" onclick="event.stopPropagation(); openResetModal(${user.user_id})"><i class="fa-solid fa-key"></i></button>
                        <button class="btn-act btn-act--suspend" title="Suspend Account" onclick="event.stopPropagation(); confirmActionLink('Suspend ${escapeQuote(fullName)}\\'s account?', '../API/Admin/admin_staff_actions.php?action=suspend&id=${user.user_id}', 'Suspended the account of ${escapeQuote(fullName)}')"><i class="fa-solid fa-ban"></i></button>
                    `;
                } else {
                    actionHTML = `
                        <button class="btn-act btn-act--approve" title="Reactivate Account" onclick="event.stopPropagation(); confirmActionLink('Reactivate ${escapeQuote(fullName)}\\'s account?', '../API/Admin/admin_staff_actions.php?action=activate&id=${user.user_id}', 'Reactivated the account of ${escapeQuote(fullName)}')"><i class="fa-solid fa-unlock"></i></button>
                        <button class="btn-act btn-act--reject" title="Delete Permanently" onclick="event.stopPropagation(); confirmActionLink('Permanently delete this account?', '../API/Admin/admin_staff_actions.php?action=delete&id=${user.user_id}', 'Permanently deleted the account of ${escapeQuote(fullName)}')"><i class="fa-solid fa-trash"></i></button>
                    `;
                }

                return `<tr ondblclick="openViewModal('${escapeQuote(fullName)}', '${escapeQuote(user.username)}', '${user.position}', '${user.status}', '${joinedDate}', '${escapeQuote(imagePath)}', '${initials}')" style="${rowStyle}" title="Double-click to view details">
                    <td>
                        <div class="resident-cell"><div class="res-avatar" style="${avatarStyle}">${avatarHTML}</div>
                        <div><div class="res-name" ${isArchived ? 'style="color: var(--text-mid);"' : ''}>${fullName}</div><div class="mono-cell">ID: ${user.user_id}</div></div></div>
                    </td>
                    <td><span class="role-badge role--frontdesk" style="text-transform: capitalize; ${isArchived ? 'opacity: 0.6;' : ''}">${user.position}</span></td>
                    <td><div style="font-size: 0.8rem; color: var(--text-dark); font-weight: 500;"><i class="fa-solid fa-user"></i> ${user.username}</div><div class="res-purok">Joined: ${joinedDate}</div></td>
                    <td>${statusHTML}</td><td><div class="action-group">${actionHTML}</div></td>
                </tr>`;
            }).join('');
        }).catch(err => { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load data.</td></tr>'; showToast("Error retrieving data.", "error"); });
}

function escapeQuote(str) { return str ? str.replace(/'/g, "\\'").replace(/"/g, '&quot;') : ''; }

// ── MODALS ──────────────────────────────────────────
function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add("open"); document.body.style.overflow = "hidden"; } }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove("open"); document.body.style.overflow = ""; } }
window.addEventListener("click", (e) => { if (e.target.classList.contains("modal-overlay")) { e.target.classList.remove("open"); document.body.style.overflow = ""; } });

// ── SPECIFIC CRUD MODAL OPENERS ──────────────────────────────
window.openEditModal = function(id, fname, mname, lname, username, email, position, existingImage, accessRights) {
    document.getElementById('edit_user_id').value = id;
    document.getElementById('edit_f_name').value = fname;
    document.getElementById('edit_m_name').value = mname;
    document.getElementById('edit_l_name').value = lname;
    document.getElementById('edit_username').value = username;
    document.getElementById('edit_email').value = email; 
    document.getElementById('edit_position').value = position;
    document.getElementById('edit_existing_image').value = existingImage;
    
    const preview = document.getElementById('edit_preview');
    if (existingImage) {
        preview.src = `../Images/staff_profiles/${existingImage}`;
    } else {
        preview.src = ''; 
    }
    
    document.getElementById('edit_file_name').textContent = 'Keep Current Photo';
    editImageFile = null;

    // Reset dropdown checkboxes
    document.querySelectorAll('.edit-access-checkbox').forEach(cb => cb.checked = false);
    
    // Parse saved access rights and check the dropdown checkboxes
    if (accessRights && accessRights !== 'null' && accessRights !== '') {
        try {
            const rightsArray = JSON.parse(accessRights);
            rightsArray.forEach(accessId => {
                const checkbox = document.getElementById(`edit_access_${accessId}`);
                if (checkbox) checkbox.checked = true;
            });
        } catch (e) {}
    }

    // Refresh the selected modules table!
    updateAccessTable('edit');

    openModal('modalEditStaff');
}

window.openResetModal = function(id) { document.getElementById('reset_user_id').value = id; openModal('modalResetPass'); }

window.openViewModal = function(fullName, username, role, status, dateJoined, imagePath, initials) {
    document.getElementById('view_full_name').textContent = fullName; document.getElementById('view_username').textContent = '@' + username;
    document.getElementById('view_role').textContent = role; document.getElementById('view_date').textContent = dateJoined;
    const statusEl = document.getElementById('view_status'); statusEl.textContent = status;
    if(status === 'active') statusEl.style.color = 'var(--green)'; else if(status === 'archived') statusEl.style.color = 'var(--red)'; else statusEl.style.color = 'var(--text-mid)';
    const avatarContainer = document.getElementById('view_avatar_container');
    avatarContainer.innerHTML = imagePath ? `<img src="${imagePath}" style="width: 100%; height: 100%; object-fit: cover;">` : initials;
    openModal('modalViewStaff');
}

// ── TOAST & UTILS ───────────────────────────────────────────
window.showToast = function(message, type = 'success') {
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast) return;

    toastMessage.textContent = message;
    if (type === 'success') { toast.className = 'custom-toast success show'; toastIcon.className = 'fa-solid fa-circle-check'; } 
    else if (type === 'error') { toast.className = 'custom-toast error show'; toastIcon.className = 'fa-solid fa-circle-xmark'; } 
    else { toast.className = 'custom-toast info show'; toastIcon.className = 'fa-solid fa-circle-info'; }

    setTimeout(() => { closeCustomToast(); }, 4000);
}
window.closeCustomToast = function() { const toast = document.getElementById('customToast'); if (toast) toast.classList.remove('show'); }

window.confirmActionLink = function(alertMessage, url, logMessage) { 
    if (confirm(alertMessage)) {
        if(typeof logActivity === 'function') logActivity(logMessage);
        setTimeout(() => { window.location.href = url; }, 200);
    }
}

window.toggleAdminPassword = function(inputId, iconId) {
    const input = document.getElementById(inputId), icon = document.getElementById(iconId);
    if (input.type === 'password') { input.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); } 
    else { input.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
}


// ═══════════════════════════════════════════════════
// 🚨 NEW: ACCESS RIGHTS DROPDOWN & TABLE LOGIC 🚨
// ═══════════════════════════════════════════════════

// Toggle Dropdown
window.toggleAccessDropdown = function(prefix) {
    const menu = document.getElementById(`${prefix}_access_menu`);
    const chevron = document.getElementById(`${prefix}_chevron`);
    menu.classList.toggle('show');
    if (menu.classList.contains('show')) {
        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}

// Close Dropdown if clicked outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.access-dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
        document.querySelectorAll('.dropdown-btn i').forEach(icon => icon.classList.replace('fa-chevron-up', 'fa-chevron-down'));
    }
});

// Select All in DROPDOWN
window.toggleSelectAll = function(prefix) {
    const selectAllBox = document.getElementById(`${prefix}_select_all`);
    const checkboxes = document.querySelectorAll(`.${prefix}-access-checkbox`);
    checkboxes.forEach(cb => { cb.checked = selectAllBox.checked; });
    updateAccessTable(prefix);
}

// ----------------------------------------------------
// THE NEW SELECTED MODULES TABLE LOGIC
// ----------------------------------------------------

// 1. Draw the Table with Checkboxes
window.updateAccessTable = function(prefix) {
    const dropdownCheckboxes = document.querySelectorAll(`.${prefix}-access-checkbox`);
    const tbody = document.getElementById(`${prefix}_access_table_body`);
    let rowsHTML = '';
    let checkedCount = 0;

    dropdownCheckboxes.forEach(cb => {
        if (cb.checked) {
            checkedCount++;
            const name = cb.getAttribute('data-name');
            // We use standard HTML Checkboxes now!
            rowsHTML += `
                <tr>
                    <td style="width: 40px; text-align: center;">
                        <input type="checkbox" class="${prefix}-table-checkbox" value="${cb.value}" onchange="checkTableIndeterminate('${prefix}')">
                    </td>
                    <td>${name}</td>
                </tr>
            `;
        }
    });

    // Update dropdown select-all box
    const selectAllBox = document.getElementById(`${prefix}_select_all`);
    if (selectAllBox) { selectAllBox.checked = (checkedCount === dropdownCheckboxes.length && dropdownCheckboxes.length > 0); }

    // Toggle Remove Button & render rows
    const removeBtn = document.getElementById(`${prefix}_remove_btn`);
    if (checkedCount === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-mid); font-style: italic;">No modules selected.</td></tr>`;
        if(removeBtn) removeBtn.style.display = 'none';
    } else {
        tbody.innerHTML = rowsHTML;
        if(removeBtn) removeBtn.style.display = 'inline-block';
    }

    // Reset table select-all box
    const tableSelectAll = document.getElementById(`${prefix}_table_select_all`);
    if(tableSelectAll) {
        tableSelectAll.checked = false;
        tableSelectAll.indeterminate = false;
    }
}

// 2. Select All inside the DISPLAY TABLE
window.toggleTableSelectAll = function(prefix) {
    const tableSelectAll = document.getElementById(`${prefix}_table_select_all`);
    const tableCheckboxes = document.querySelectorAll(`.${prefix}-table-checkbox`);
    tableCheckboxes.forEach(cb => { cb.checked = tableSelectAll.checked; });
}

// 3. Make Select All Box look 'half-checked' if only some are checked
window.checkTableIndeterminate = function(prefix) {
    const tableSelectAll = document.getElementById(`${prefix}_table_select_all`);
    const tableCheckboxes = document.querySelectorAll(`.${prefix}-table-checkbox`);
    if (!tableSelectAll || tableCheckboxes.length === 0) return;

    const allChecked = Array.from(tableCheckboxes).every(cb => cb.checked);
    const someChecked = Array.from(tableCheckboxes).some(cb => cb.checked);

    tableSelectAll.checked = allChecked;
    tableSelectAll.indeterminate = someChecked && !allChecked;
}

// 4. Batch Remove Button
window.removeSelectedFromTable = function(prefix) {
    // Find everything checked in the TABLE
    const tableCheckboxes = document.querySelectorAll(`.${prefix}-table-checkbox:checked`);
    
    if(tableCheckboxes.length === 0) {
        showToast("Please check the boxes in the table to remove them.", "info");
        return;
    }

    // Uncheck those items in the DROPDOWN
    tableCheckboxes.forEach(tcb => {
        const dropCb = document.querySelector(`.${prefix}-access-checkbox[value="${tcb.value}"]`);
        if (dropCb) dropCb.checked = false;
    });

    // Uncheck the main dropdown 'select all'
    const mainSelectAll = document.getElementById(`${prefix}_select_all`);
    if (mainSelectAll) mainSelectAll.checked = false;

    // Redraw the table
    updateAccessTable(prefix);
}