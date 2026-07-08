/* ============================================================
   BARANGAY 101 — ADMIN GALLERY SCRIPTS
   File: JS/Admin_js/admin_gallery.js
   ============================================================ */

// --- ACTIVITY LOGGER ---
const LOG_ACTIVITY_API = '../API/Admin/admin_log_activity_api.php';
function logActivity(actionMessage) {
    fetch(LOG_ACTIVITY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMessage })
    }).catch(err => console.error("Logging Failed:", err));
}

/* ============================================================
   ALBUM MODAL & CRUD
   ============================================================ */

function openGalleryModal(mode, albumMonth = '', caption = '', status = 'active') {
    const modal = document.getElementById('modalGallery');
    const titleSpan = document.querySelector('#titleGallery span');
    const form = document.getElementById('formGallery');
    
    form.reset();
    document.getElementById('multiPreviewContainer').innerHTML = '';
    document.getElementById('actionType').value = mode;

    if (mode === 'edit') {
        titleSpan.textContent = 'Edit Album Details';
        document.getElementById('galMonth').value = albumMonth;
        document.getElementById('galMonth').readOnly = true; // Lock month on edit
        document.getElementById('galCaption').value = caption;
        document.getElementById('galStatus').value = status;
    } else {
        titleSpan.textContent = 'Create / Add to Album';
        document.getElementById('galMonth').readOnly = false;
        
        // Default to current month
        const now = new Date();
        const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');
        document.getElementById('galMonth').value = `${now.getFullYear()}-${monthStr}`;
    }

    modal.classList.add('open');
}

function previewMultipleImages(event) {
    const container = document.getElementById('multiPreviewContainer');
    container.innerHTML = ''; // Clear previous previews
    
    const files = event.target.files;
    
    if(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                container.appendChild(img);
            }
            reader.readAsDataURL(file);
        });
    }
}

function submitGalleryForm() {
    const month = document.getElementById('galMonth').value;
    const caption = document.getElementById('galCaption').value;
    const actionType = document.getElementById('actionType').value;

    if (!month || !caption) {
        alert('Please provide an album month and title.');
        return;
    }

    const form = document.getElementById('formGallery');
    const formData = new FormData(form);

    fetch('../API/Admin/process_gallery.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            
            // ✅ LOG THE ACTIVITY
            const logMsg = actionType === 'edit' 
                ? `Updated details for the <strong>${caption}</strong> gallery album.`
                : `Created a new gallery album: <strong>${caption}</strong>.`;
            logActivity(logMsg);

            alert(data.message);
            // Delay reload by 300ms to allow the fetch log to process
            setTimeout(() => location.reload(), 300); 
        } else {
            alert('Error processing request: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('A network error occurred. Please check the console.');
    });
}

function deleteAlbum(albumMonth) {
    if(confirm('Are you sure you want to permanently delete this ENTIRE album and all its photos?')) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('album_month', albumMonth);

        fetch('../API/Admin/process_gallery.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                
                // ✅ LOG THE DELETION
                logActivity(`Deleted the entire gallery album for <strong>${albumMonth}</strong>.`);

                alert(data.message);
                setTimeout(() => location.reload(), 300); 
            } else {
                alert('Error deleting album: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('A network error occurred.');
        });
    }
}

/* ============================================================
   MANAGE INDIVIDUAL PHOTOS (ADD / BULK DELETE)
   ============================================================ */

function openManagePhotosModal(month, title, status, photosJson) {
    const modal = document.getElementById('modalManagePhotos');
    const grid = document.getElementById('managePhotoGrid');
    
    // Set text headers
    document.getElementById('manageAlbumTitle').textContent = title;
    document.getElementById('manageAlbumMonth').textContent = month;

    // Set hidden inputs for the "Add More Photos" auto-form
    document.getElementById('addExtraMonth').value = month;
    document.getElementById('addExtraTitle').value = title;
    document.getElementById('addExtraStatus').value = status;

    // Reset UI
    grid.innerHTML = '';
    document.getElementById('selectAllPhotos').checked = false;

    // Parse photos JSON and render the grid
    const photos = JSON.parse(photosJson);
    
    photos.forEach(photo => {
        const div = document.createElement('div');
        div.className = 'manage-photo-card';
        div.innerHTML = `
            <img src="../${photo.path}" alt="Photo">
            <input type="checkbox" class="photo-checkbox" value="${photo.id}" onchange="toggleCardStyle(this)">
        `;
        // Make the whole card clickable to check the box
        div.addEventListener('click', function(e) {
            if(e.target.tagName !== 'INPUT') {
                const cb = this.querySelector('input');
                cb.checked = !cb.checked;
                toggleCardStyle(cb);
            }
        });
        grid.appendChild(div);
    });

    modal.classList.add('open');
}

function toggleCardStyle(checkbox) {
    const card = checkbox.closest('.manage-photo-card');
    if (checkbox.checked) {
        card.classList.add('checked');
    } else {
        card.classList.remove('checked');
    }
}

function toggleSelectAllPhotos(mainCheckbox) {
    const checkboxes = document.querySelectorAll('.photo-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = mainCheckbox.checked;
        toggleCardStyle(cb);
    });
}

function deleteSelectedPhotos() {
    const checkedBoxes = document.querySelectorAll('.photo-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        alert('Please select at least one photo to delete.');
        return;
    }

    if (confirm(`Are you sure you want to permanently delete ${checkedBoxes.length} photo(s)?`)) {
        const formData = new FormData();
        formData.append('action', 'delete_photos');
        
        // Append all selected IDs to the formData array
        checkedBoxes.forEach(cb => {
            formData.append('photo_ids[]', cb.value);
        });

        fetch('../API/Admin/process_gallery.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const currentMonth = document.getElementById('manageAlbumMonth').textContent;
                
                // ✅ LOG THE DELETION
                logActivity(`Deleted ${checkedBoxes.length} photo(s) from the <strong>${currentMonth}</strong> album.`);

                // Tell the browser to remember this modal is open before reloading
                sessionStorage.setItem('reopenAlbumMonth', currentMonth);
                setTimeout(() => location.reload(), 300); 
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }
}

function submitExtraPhotos() {
    const input = document.getElementById('addExtraPhotosInput');
    if (input.files.length === 0) return;
    
    const form = document.getElementById('addExtraPhotosForm');
    const formData = new FormData(form);
    const currentMonth = document.getElementById('manageAlbumMonth').textContent;

    fetch('../API/Admin/process_gallery.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const count = input.files.length;

            // ✅ LOG THE ADDITION
            logActivity(`Added ${count} new photo(s) to the <strong>${currentMonth}</strong> album.`);

            // Tell the browser to remember this modal is open before reloading
            sessionStorage.setItem('reopenAlbumMonth', currentMonth);
            setTimeout(() => location.reload(), 300); 
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}