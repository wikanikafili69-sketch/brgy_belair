// ========================================
// BARANGAY — ID REQUEST (WITH COMPRESSION & CAMERA)
// ========================================
let activeIndex = -1;
let currentOptions = [];
window.editingIndex = null;
window.isEditing = false;
let capturedImage = null;

document.addEventListener('DOMContentLoaded', () => {
    initIDPrompt();
});

function initIDPrompt() {
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.service-card[data-service="id"]');
        if (!card) return;

        if (!window.isEditing) resetIDForm();

        openIDForm();
    });
}

// ─────────────────────────────
// CLIENT-SIDE IMAGE COMPRESSOR
// ─────────────────────────────
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

            // Convert to Base64 (0.8 quality jpeg) for local storage cart compatibility
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            callback(dataUrl);
        };
    };
}

// ─────────────────────────────
// OPEN FORM
// ─────────────────────────────
function openIDForm() {

    const existing = document.getElementById('id-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'residency-form-overlay active';
    overlay.id = 'id-overlay';

    overlay.innerHTML = `
    <div class="id-topbar">
        <button class="id-back-btn" id="id-back-btn">← Back</button>

        <div class="id-topbar-title">
            <div class="id-topbar-eyebrow">Barangay Hall</div>
            <div class="id-topbar-heading">Barangay ID</div>
        </div>

        <div class="id-topbar-spacer"></div>
    </div>

    <div id="id-form-wrap">

        <div class="id-title">
            Request <span>Barangay ID</span>
        </div>

        <div class="id-sub">
            * Please provide correct information
        </div>

        <div class="id-section-label">Personal Information</div>

        <div class="id-main-grid">

            <div class="id-form-left">

                <div class="id-row id-row-2">
                    <div class="id-field">
                        <label class="id-label">Full Name <span style="color:#ef4444">*</span></label>
                        <input id="id-fullname" class="id-input" data-required="true"
                            placeholder="Juan M Dela Cruz, Jr.">
                    </div>

                    <div class="id-field">
                        <label class="id-label">Contact Number <span style="color:#ef4444">*</span></label>
                        <input id="id-contact" maxlength="11" class="id-input" data-required="true"
                            placeholder="09XXXXXXXXX">
                    </div>
                </div>

                <div class="id-row">
                    <div class="id-field">
                        <label class="id-label">Email Address</label>
                        <input id="id-email" class="id-input" placeholder="example@email.com">
                    </div>
                </div>

                <div class="id-row">
                    <div class="id-field">
                        <label class="id-label">Address <span style="color:#ef4444">*</span></label>
                        <input id="id-address" class="id-input" data-required="true">
                    </div>
                </div>

                <div class="id-row">
                    <div class="id-field">
                        <label class="id-label">Birthdate <span style="color:#ef4444">*</span></label>
                        <input type="date" id="id-bday" class="id-input" data-required="true">
                    </div>
                </div>

                <div class="id-section-label">Emergency Contact</div>

                <div class="id-row id-row-2">
                    <div class="id-field">
                        <label class="id-label">Contact Name <span style="color:#ef4444">*</span></label>
                        <input id="id-ec-name" class="id-input" data-required="true">
                    </div>

                    <div class="id-field">
                        <label class="id-label">Contact Number <span style="color:#ef4444">*</span></label>
                        <input id="id-ec-number" maxlength="11" class="id-input" data-required="true">
                    </div>
                </div>

            </div>

            <div class="id-form-right">

                <img id="id-preview" src="">

                <div class="id-photo-hint">
                    Photo is optional (can be taken at processing desk)
                </div>

                <div class="id-photo-actions">
                    <input type="file" id="id-upload" accept="image/png, image/jpeg, image/jpg" class="id-file-input">
                    <button id="id-camera-btn" class="id-btn">
                        📷 Camera
                    </button>
                </div>

            </div>

        </div>

        <div class="id-terms-row">
            <input type="checkbox" id="id-terms-check">
            <label style="color:black">I agree and accept the terms and conditions</label>
        </div>

        <div class="id-submit-row">
            <button id="id-add-btn" class="id-submit-btn" disabled>
                ➕ Add to List
            </button>
        </div>

    </div>
    `;

    document.body.appendChild(overlay);

    // ========================================
    // AUTO CAPITAL + DROPDOWN + BDAY
    // ========================================
    const inputs = [
        document.getElementById('id-fullname'),
        document.getElementById('id-ec-name')
    ];
    const bdayInput = document.getElementById('id-bday');

    let dropdown = document.getElementById('id-autocomplete-dropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'id-autocomplete-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.background = '#fff';
        dropdown.style.border = '1px solid #e2e8f0';
        dropdown.style.borderRadius = '8px';
        dropdown.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        dropdown.style.maxHeight = '220px';
        dropdown.style.overflowY = 'auto';
        dropdown.style.zIndex = '99999';
        dropdown.style.display = 'none';
        dropdown.style.padding = '5px 0';
        document.body.appendChild(dropdown);
    }

    function formatBirthdate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: '2-digit',
            year: 'numeric'
        });
    }

    let currentInput = null;

    inputs.forEach(inputEl => {
        if (!inputEl) return;

        inputEl.addEventListener('input', function () {
            currentInput = this;
            let value = this.value.toUpperCase();
            value = value.replace(/[^A-Z\s,\.]/g, '');
            this.value = value;

            const search = value.trim().toLowerCase();

            if (!search || !window.residentList || !window.residentList.length) {
                dropdown.style.display = 'none';
                return;
            }

            const matches = window.residentList.filter(r =>
                r.fullname.toLowerCase().includes(search)
            );

            if (!matches.length) {
                dropdown.style.display = 'none';
                return;
            }

            dropdown.innerHTML = '';
            currentOptions = [];
            activeIndex = -1;

            matches.slice(0, 5).forEach((item) => {
                let option = document.createElement('div');
                option.innerHTML = `
                    <div style="font-weight:600; color:#0f172a;">
                        ${item.fullname}
                    </div>
                    <div style="font-size:0.75rem; color:#64748b;">
                        ${formatBirthdate(item.birth_date)}
                    </div>
                `;

                option.style.padding = '10px 12px';
                option.style.cursor = 'pointer';
                option.style.borderBottom = '1px solid #f1f5f9';

                option.onclick = () => {
                    currentInput.value = item.fullname.toUpperCase();

                    // --- NEW AUTOFILL LOGIC ---
                    if (currentInput.id === 'id-fullname') {
                        // 1. Autofill Birthdate
                        if (item.birth_date) {
                            bdayInput.value = item.birth_date;
                        }
                        
                        // 2. Autofill Personal Contact Number
                        const contactInput = document.getElementById('id-contact');
                        if (contactInput && item.contact_no && item.contact_no.trim() !== '') {
                            contactInput.value = item.contact_no;
                        }

                        // 3. Autofill Address
                        const addressInput = document.getElementById('id-address');
                        if (addressInput && item.full_address && item.full_address.trim() !== '') {
                            // Converts the address to uppercase to match your form's style
                            addressInput.value = item.full_address.toUpperCase(); 
                        }

                        // 4. NEW: Autofill Email
                        const emailInput = document.getElementById('id-email');
                        if (emailInput && item.email && item.email.trim() !== '') {
                            emailInput.value = item.email; 
                        }
                    } 
                    else if (currentInput.id === 'id-ec-name') {
                        // 5. Autofill Emergency Contact Number
                        const ecContactInput = document.getElementById('id-ec-number');
                        if (ecContactInput && item.contact_no && item.contact_no.trim() !== '') {
                            ecContactInput.value = item.contact_no;
                        }
                    }
                    // --------------------------

                    dropdown.style.display = 'none';
                };

                dropdown.appendChild(option);
                currentOptions.push(option);
            });

            const rect = this.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
            dropdown.style.left = (rect.left + window.scrollX) + 'px';
            dropdown.style.width = rect.width + 'px';
            dropdown.style.display = 'block';
        });

        inputEl.addEventListener('keydown', function (e) {
            if (!currentOptions.length || dropdown.style.display === 'none') return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex++;
                if (activeIndex >= currentOptions.length) activeIndex = 0;
                updateActiveItem();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex--;
                if (activeIndex < 0) activeIndex = currentOptions.length - 1;
                updateActiveItem();
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIndex >= 0 && currentOptions[activeIndex]) {
                    currentOptions[activeIndex].click();
                }
            }
        });
    });

    document.getElementById('id-back-btn').onclick = closeIDForm;

    const addBtn = document.getElementById('id-add-btn');
    document.getElementById('id-terms-check').onchange = function () {
        if (window.isEditing) return; // Prevent disabling on edit
        addBtn.disabled = !this.checked;
    };

    // ─────────────────────────────
    // UPLOAD WITH COMPRESSION & 10MB LIMIT
    // ─────────────────────────────
    document.getElementById('id-upload').onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Only JPG and PNG are allowed.");
            this.value = '';
            return;
        }

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            alert("File is too large. Maximum size is 10MB only.");
            this.value = ''; 
            return;
        }

        // Compress and extract Base64
        compressImageClientSide(file, 1200, function(dataUrlPreview) {
            document.getElementById('id-preview').src = dataUrlPreview;
            capturedImage = dataUrlPreview;
        });
    };

    document.getElementById('id-camera-btn').onclick = openCamera;

    addBtn.onclick = function () {
        if (!validateIDForm()) return;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];

        let item = {
            service_type: 'Barangay ID',
            fullname: id('id-fullname').value,
            address: id('id-address').value,
            birthdate: id('id-bday').value,
            phone: id('id-contact').value,
            email: id('id-email').value,
            emergency_name: id('id-ec-name').value,
            emergency_number: id('id-ec-number').value,
            photo: capturedImage
        };

        // ✅ EDIT: Prioritize form-bound data attribute to prevent state loss
        const formWrap = document.getElementById('id-form-wrap');
        let targetIndex = null;

        if (formWrap && formWrap.hasAttribute('data-edit-index')) {
            targetIndex = parseInt(formWrap.getAttribute('data-edit-index'), 10);
        } else if (window.editingIndex !== null) {
            targetIndex = window.editingIndex;
        }

        if (targetIndex !== null && !isNaN(targetIndex)) {
            // EDIT MODE → replace existing item
            cart[targetIndex] = item;
            
            // Wipe states clean
            window.editingIndex = null;
            window.isEditing = false;
            if(formWrap) formWrap.removeAttribute('data-edit-index');
        } else {
            // ADD MODE → new item
            cart.push(item);
        }

        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        if (window.updateCartUI) window.updateCartUI();

        closeIDForm();
    };

    document.body.style.overflow = 'hidden';
}

// ─────────────────────────────
// FULL SCREEN CAMERA (ENHANCED WITH GUIDE)
// ─────────────────────────────
function openCamera() {
    const cam = document.createElement('div');
    cam.innerHTML = `
    <div style="position:fixed; inset:0; background:black; z-index:99999; overflow:hidden; font-family:sans-serif;">
        
        <div style="position:absolute; top:0; width:100%; padding:15px; display:flex; justify-content:space-between; align-items:center; color:white; z-index:10;">
            <div style="font-weight:600; font-size:16px;">Take ID Photo</div>
            <button id="close-cam" style="background:#ef4444; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">Close</button>
        </div>

        <video id="cam-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover; transform: scaleX(-1);"></video>
        
        <img id="cam-captured-preview" style="display:none; width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; z-index:1; transform: scaleX(-1);" />
        
        <div id="cam-guide-overlay" style="
            position:absolute; top:0; left:0; width:100%; height:100%;
            display:flex; flex-direction:column; justify-content:center; align-items:center;
            pointer-events:none; z-index:2;
        ">
            <div style="
                width: 85vw; 
                max-width: 620px; 
                aspect-ratio: 620 / 720; 
                border: 4px dashed rgba(255, 255, 255, 0.8);
                border-radius: 50%;
                box-shadow: 0 0 0 4000px rgba(0,0,0,0.65);
                position: relative;
            ">
                <div style="position:absolute; bottom:-45px; width:100%; text-align:center; color:white; font-size:14px; font-weight:500; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">
                    Position your face inside the frame
                </div>
            </div>
        </div>

        <div style="position:absolute; bottom:40px; width:100%; display:flex; justify-content:center; gap:15px; z-index:10; flex-wrap:wrap;">
            <button id="capture-btn" style="background:#22c55e; color:white; border:none; padding:15px 30px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">📸 Capture</button>
            <button id="retake-btn" style="display:none; background:#64748b; color:white; border:none; padding:15px 25px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold;">🔄 Retake</button>
            <button id="confirm-btn" style="display:none; background:#3b82f6; color:white; border:none; padding:15px 25px; border-radius:50px; font-size:16px; cursor:pointer; font-weight:bold;">✅ Use Photo</button>
        </div>

    </div>
    `;
    document.body.appendChild(cam);

    let streamReference = null;
    let tempCapturedImg = null;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }).then(stream => {
        streamReference = stream;
        const video = document.getElementById('cam-video');
        video.srcObject = stream;

        const captureBtn = document.getElementById('capture-btn');
        const retakeBtn = document.getElementById('retake-btn');
        const confirmBtn = document.getElementById('confirm-btn');
        const preview = document.getElementById('cam-captured-preview');
        const guideOverlay = document.getElementById('cam-guide-overlay');

        captureBtn.onclick = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');

            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);

            tempCapturedImg = canvas.toDataURL("image/jpeg", 0.8); 
            preview.src = tempCapturedImg;
            preview.style.display = 'block';
            video.style.display = 'none';
            guideOverlay.style.display = 'none'; 

            captureBtn.style.display = 'none';
            retakeBtn.style.display = 'block';
            confirmBtn.style.display = 'block';
        };

        retakeBtn.onclick = () => {
            tempCapturedImg = null;
            preview.style.display = 'none';
            video.style.display = 'block';
            guideOverlay.style.display = 'flex'; 
            
            captureBtn.style.display = 'block';
            retakeBtn.style.display = 'none';
            confirmBtn.style.display = 'none';
        };

        confirmBtn.onclick = () => {
            document.getElementById('id-preview').src = tempCapturedImg;
            capturedImage = tempCapturedImg; 
            closeCam(streamReference, cam);
        };

        document.getElementById('close-cam').onclick = () => closeCam(streamReference, cam);
    }).catch(() => {
        alert("Camera not allowed or unavailable.");
        cam.remove();
    });
}

function closeCam(stream, camElement) {
    if (stream) stream.getTracks().forEach(t => t.stop());
    camElement.remove();
}

// ─────────────────────────────
// VALIDATION
// ─────────────────────────────
function validateIDForm() {
    clearErrors();
    let valid = true;

    document.querySelectorAll('#id-form-wrap [data-required="true"]').forEach(field => {
        if (!field.value.trim()) {
            field.closest('.id-field').classList.add('has-error');
            field.closest('.id-field').insertAdjacentHTML('beforeend',
                '<div class="id-error-msg">Required</div>');
            valid = false;
        }
    });

    const phone = document.getElementById('id-contact').value;
    const phoneRegex = /^09\d{9}$/;

    if (phone && !phoneRegex.test(phone)) {
        let wrapper = document.getElementById('id-contact').closest('.id-field');
        wrapper.classList.add('has-error');
        wrapper.insertAdjacentHTML('beforeend',
            '<div class="id-error-msg">Must be 11 digits (e.g. 09123456789)</div>');
        valid = false;
    }

    const ecPhone = document.getElementById('id-ec-number').value;

    if (ecPhone && !phoneRegex.test(ecPhone)) {
        let wrapper = document.getElementById('id-ec-number').closest('.id-field');
        wrapper.classList.add('has-error');
        wrapper.insertAdjacentHTML('beforeend',
            '<div class="id-error-msg">Must be 11 digits (e.g. 09123456789)</div>');
        valid = false;
    }

    return valid;
}

function clearErrors() {
    document.querySelectorAll('#id-form-wrap .has-error').forEach(el => el.classList.remove('has-error'));
    document.querySelectorAll('#id-form-wrap .id-error-msg').forEach(el => el.remove());
}

function closeIDForm() {
    document.getElementById('id-overlay')?.remove();
    document.getElementById('id-autocomplete-dropdown')?.remove();
    document.body.style.overflow = '';
    
    // ✅ EDIT: Ensure we wipe 'isEditing' and 'editingIndex' when modal closes
    setTimeout(resetIDForm, 300);
}

function resetIDForm() {
    capturedImage = null;
    window.editingIndex = null;
    window.isEditing = false;
}

function id(x){ return document.getElementById(x); }

function updateActiveItem() {
    currentOptions.forEach((opt, i) => {
        if (i === activeIndex) {
            opt.style.background = '#e2e8f0';
            opt.scrollIntoView({ block: 'nearest' });
        } else {
            opt.style.background = '#fff';
        }
    });
}

// ─────────────────────────────
// ✅ NEW: EDIT MODE SUPPORT
// ─────────────────────────────
window.populateIDForm = function (data) {
    window.isEditing = true;

    const card = document.querySelector('.service-card[data-service="id"]');
    if (card) card.click();

    setTimeout(() => {
        // Stamp the index directly onto the form wrapper upon population
        const formWrap = document.getElementById('id-form-wrap');
        if (formWrap && window.editingIndex !== null) {
            formWrap.setAttribute('data-edit-index', window.editingIndex);
        }

        // Fill Data
        id('id-fullname').value = data.fullname || '';
        id('id-address').value = data.address || '';
        id('id-bday').value = data.birthdate || '';
        id('id-contact').value = data.phone || '';
        id('id-email').value = data.email || '';
        id('id-ec-name').value = data.emergency_name || '';
        id('id-ec-number').value = data.emergency_number || '';

        // Load Photo Preview if exists
        if (data.photo) {
            document.getElementById('id-preview').src = data.photo;
            capturedImage = data.photo;
        }

        // REMOVE TERMS IN EDIT MODE
        const termsRow = document.querySelector('#id-form-wrap .id-terms-row');
        if (termsRow) termsRow.remove();

        const addBtn = document.getElementById('id-add-btn');
        if (addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }

    }, 150);
};