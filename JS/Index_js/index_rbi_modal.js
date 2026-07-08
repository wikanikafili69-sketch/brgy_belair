// ========================================
// BARANGAY — RBI REGISTRATION MODAL
// JS/index_rbi_modal.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initRBIModal();
});

function initRBIModal() {

    // ── BUILD & INJECT MODAL ──────────────────────────────────
    buildToastUI(); 
    buildRBIModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var overlay    = document.getElementById('rbi-overlay');
    var backBtn    = document.getElementById('rbi-back-btn');
    var form       = document.getElementById('rbi-registration-form');
    var submitBtn  = document.getElementById('rbi-submit-btn');
    var termsCheck = document.getElementById('rbi-terms-check');
    var dobInput   = document.getElementById('rbi-dob');
    var ageInput   = document.getElementById('rbi-age');
    var fileInput  = document.getElementById('rbi-photo-input');
    var fileName   = document.getElementById('rbi-file-name');
    var fileBtn    = document.getElementById('rbi-file-btn');
    var cameraBtn  = document.getElementById('rbi-camera-btn');
    var previewImg = document.getElementById('rbi-preview');
    var formWrap   = document.getElementById('rbi-form-wrap');
    var successWrap= document.getElementById('rbi-success-wrap');

    // This will hold the final file to upload (either from browse or camera)
    var finalImageFile = null; 

    if (!overlay) return;

    // ── AUTO-CAPITALIZE NAMES ─────────────────────────────────
    ['rbi-lastname', 'rbi-firstname', 'rbi-middlename', 'rbi-ext'].forEach(function(id) {
        var el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', function() {
                this.value = this.value.toUpperCase();
            });
        }
    });

    // ── TRIGGER LOGIC ─────────────────────────────────────────
    var triggerBtns = document.querySelectorAll('.apply-clearance-btn, a[href="apply.php"], .services-footer-cta[href="apply.php"]');
    triggerBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault(); openRBI();
        });
    });

    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-type="clearance"]');
        if (card) {
            var servicesOverlay = document.getElementById('services-overlay');
            if (servicesOverlay) servicesOverlay.classList.remove('active');
            setTimeout(openRBI, 200);
        }
    });

    // ── BACK / CLOSE ─────────────────────────────────────────
    backBtn.addEventListener('click', closeRBI);
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeRBI();
    });

    // ── HELPER: RESET FILE INPUT ──────────────────────────────
    function resetFileInput() {
        fileInput.value = ''; 
        fileName.textContent = 'NO FILE CHOSEN';
        finalImageFile = null;
        previewImg.src = '';
    }

    // ── FILE INPUT (BROWSE + CLIENT-SIDE SQUEEZER) ────────────
    fileBtn.addEventListener('click', function () { fileInput.click(); });
    
    fileInput.addEventListener('change', function (e) {
        if (fileInput.files.length > 0) {
            var file = fileInput.files[0];
            var validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            var maxSize = 15 * 1024 * 1024; // 15 Megabytes initial limit

            if (!validTypes.includes(file.type)) {
                showToast('Invalid file type. Only JPG and PNG are allowed.', 'error');
                resetFileInput();
                return;
            }

            if (file.size > maxSize) {
                showToast('File is too large. Maximum size is 15MB.', 'error');
                resetFileInput();
                return;
            }

            fileName.textContent = "Processing image...";

            // Squeeze the image down to 1200px max-width before uploading
            compressImageClientSide(file, 1200, function(compressedFile, dataUrlPreview) {
                finalImageFile = compressedFile;
                fileName.textContent = compressedFile.name;
                previewImg.src = dataUrlPreview;
            });
        }
    });

    // ── CLIENT-SIDE RESIZER FUNCTION ──────────────────────────
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
                    const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg", {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    
                    callback(newFile, canvas.toDataURL('image/jpeg', 0.8));
                }, 'image/jpeg', 0.8);
            };
        };
    }

    // ── CAMERA CAPTURE LOGIC (WITH FACE GUIDE) ────────────────
    cameraBtn.addEventListener('click', openCamera);

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
                    width: 620px; height: 720px;
                    border: 3px dashed rgba(255, 255, 255, 0.8);
                    border-radius: 50%; /* Creates the oval portrait shape */
                    box-shadow: 0 0 0 4000px rgba(0,0,0,0.65); /* Dims the background */
                    position: relative;
                ">
                    <div style="position:absolute; bottom:-45px; width:100%; text-align:center; color:white; font-size:14px; font-weight:500; text-shadow: 0 1px 4px rgba(0,0,0,0.8);">
                        Position your face inside the frame
                    </div>
                </div>
            </div>

            <div style="position:absolute; bottom:40px; width:100%; display:flex; justify-content:center; gap:15px; z-index:10;">
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

                // Since we mirrored the video via CSS, we need to draw it mirrored on the canvas
                // so text doesn't appear backwards in the final photo!
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0);

                tempCapturedImg = canvas.toDataURL("image/jpeg", 0.8); 
                preview.src = tempCapturedImg;
                preview.style.display = 'block';
                video.style.display = 'none';
                guideOverlay.style.display = 'none'; // HIDE the guide to show clear picture

                captureBtn.style.display = 'none';
                retakeBtn.style.display = 'block';
                confirmBtn.style.display = 'block';
            };

            retakeBtn.onclick = () => {
                tempCapturedImg = null;
                preview.style.display = 'none';
                video.style.display = 'block';
                guideOverlay.style.display = 'flex'; // SHOW the guide again
                
                captureBtn.style.display = 'block';
                retakeBtn.style.display = 'none';
                confirmBtn.style.display = 'none';
            };

            confirmBtn.onclick = () => {
                previewImg.src = tempCapturedImg;
                fileName.textContent = 'CAMERA_CAPTURE.jpg';
                
                finalImageFile = dataURLtoFile(tempCapturedImg, 'camera_capture.jpg');

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

    function dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){ u8arr[n] = bstr.charCodeAt(n); }
        return new File([u8arr], filename, {type:mime});
    }

    // ── AUTO-CALCULATE AGE ────────────────────────────────────
    dobInput.addEventListener('change', function () {
        var dob = new Date(this.value);
        if (isNaN(dob)) { ageInput.value = ''; return; }
        var today = new Date();
        var age   = today.getFullYear() - dob.getFullYear();
        var m     = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        ageInput.value = age >= 0 ? age : '';
    });

    // ── DYNAMIC TOGGLES ───────────────────────────────────────
    function setupToggle(selectId, wrapId, triggerValues, requiredIds = [], displayMode = 'flex') {
        var sel = document.getElementById(selectId);
        if(!sel) return;
        sel.addEventListener('change', function() {
            var wrap = document.getElementById(wrapId);
            var isMatch = triggerValues.includes(this.value);
            
            if (isMatch) {
                wrap.style.display = displayMode;
                wrap.classList.add('rbi-animate-in');
                requiredIds.forEach(id => document.getElementById(id)?.setAttribute('data-required', 'true'));
            } else {
                wrap.style.display = 'none';
                wrap.classList.remove('rbi-animate-in');
                requiredIds.forEach(id => {
                    let el = document.getElementById(id);
                    if (el) {
                        el.removeAttribute('data-required');
                        if(el.type !== 'checkbox') el.value = '';
                        else el.checked = false;
                        let field = el.closest('.rbi-field');
                        if (field) {
                            field.classList.remove('has-error');
                            let err = field.querySelector('.rbi-error-msg');
                            if(err) err.textContent = '';
                        }
                    }
                });
            }
        });
    }

    setupToggle('rbi-religion', 'rbi-religion-other-wrap', ['Other'], ['rbi-religion-other']);
    setupToggle('rbi-voter', 'rbi-precinct-wrap', ['Yes'], []);
    setupToggle('rbi-employment', 'rbi-business-wrap', ['Self-Employed / Business Owner'], ['rbi-kind-business']);
    setupToggle('rbi-dswd', 'rbi-dswd-wrap', ['Yes'], ['rbi-dswd-date'], 'grid');
    setupToggle('rbi-livelihood', 'rbi-livelihood-wrap', ['Yes'], ['rbi-livelihood-specify', 'rbi-livelihood-date']);

    // Permanent Address Custom Logic
    var permSelect = document.getElementById('rbi-permanent');
    var addWrap = document.getElementById('rbi-address-wrap');
    var brgyInput = document.getElementById('rbi-brgy');
    var muniInput = document.getElementById('rbi-muni');

    if (permSelect) {
        permSelect.addEventListener('change', function() {
            var val = this.value;
            if (val === 'Yes' || val === 'No') {
                addWrap.style.display = 'grid';
                addWrap.classList.add('rbi-animate-in');
                ['rbi-house', 'rbi-street', 'rbi-brgy', 'rbi-muni', 'rbi-prov'].forEach(id => {
                    document.getElementById(id).setAttribute('data-required', 'true');
                });

                if (val === 'Yes') {
                    brgyInput.readOnly = true;
                    muniInput.readOnly = true;
                    brgyInput.value = 'Barangay test';
                    muniInput.value = 'Municipality test';
                    brgyInput.classList.add('readonly-field');
                    muniInput.classList.add('readonly-field');
                } else {
                    brgyInput.readOnly = false;
                    muniInput.readOnly = false;
                    brgyInput.value = '';
                    muniInput.value = '';
                    brgyInput.classList.remove('readonly-field');
                    muniInput.classList.remove('readonly-field');
                }
            } else {
                addWrap.style.display = 'none';
                addWrap.classList.remove('rbi-animate-in');
                ['rbi-house', 'rbi-street', 'rbi-brgy', 'rbi-muni', 'rbi-prov'].forEach(id => {
                    let el = document.getElementById(id);
                    el.removeAttribute('data-required');
                    el.value = '';
                    el.closest('.rbi-field').classList.remove('has-error');
                });
            }
        });
    }

  // ── SECONDARY TERMS MODAL LOGIC ───────────────────────────
    var openTermsBtn = document.getElementById('open-terms-modal-btn');
    var termsOverlay = document.getElementById('rbi-terms-overlay');
    var termsContentBox = document.getElementById('rbi-terms-modal-content');
    var acceptTermsBtn = document.getElementById('accept-terms-btn');
    var closeTermsXBtn = document.getElementById('close-terms-x-btn');
    var termsHint = document.getElementById('rbi-terms-hint');
    var termsFetched = false;

    if (openTermsBtn && termsOverlay) {
        
        // Open modal & fetch content
        openTermsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            termsOverlay.classList.add('active'); // ✅ FIX: Uses your CSS active class

            if (!termsFetched) {
                var fetchUrl = (window.APP_CONFIG && window.APP_CONFIG.termsUrl) 
                    ? window.APP_CONFIG.termsUrl 
                    : 'Functions/terms_content.php?v=' + new Date().getTime();

                fetch(fetchUrl) 
                    .then(response => {
                        if (!response.ok) throw new Error("Network response was not ok");
                        return response.text();
                    })
                    .then(html => {
                        termsContentBox.innerHTML = html;
                        termsFetched = true;
                        
                        // Fallback if terms are too short to scroll
                        setTimeout(() => {
                            if (termsContentBox.scrollHeight <= termsContentBox.clientHeight + 2) {
                                unlockAcceptBtn();
                            }
                        }, 150);
                    })
                    .catch(err => {
                        termsContentBox.innerHTML = '<span style="color:#ef4444; font-weight:bold;">Failed to load terms. Please check your internet connection.</span>';
                    });
            }
        });

        // Helper to enable the Agree button
        function unlockAcceptBtn() {
            acceptTermsBtn.disabled = false;
            acceptTermsBtn.style.cursor = 'pointer';
            acceptTermsBtn.style.opacity = '1';
            termsHint.style.display = 'none';
        }

        // Listen for scrolling INSIDE the terms modal
        termsContentBox.addEventListener('scroll', function () {
            if (this.scrollHeight - this.scrollTop <= this.clientHeight + 2) {
                unlockAcceptBtn();
            }
        });

        // 'X' button just closes modal without accepting
        closeTermsXBtn.addEventListener('click', function() {
            termsOverlay.classList.remove('active'); // ✅ FIX: Hides cleanly
        });

        // Accept button logic
        acceptTermsBtn.addEventListener('click', function() {
            termsOverlay.classList.remove('active'); // ✅ FIX: Hides cleanly
            
            // Check the main form box and enable submit
            termsCheck.disabled = false;
            termsCheck.style.cursor = 'pointer';
            termsCheck.checked = true;
            submitBtn.disabled = false;
        });

        // Allow manual toggling of the main form checkbox after it's unlocked
        termsCheck.addEventListener('change', function () {
            submitBtn.disabled = !this.checked;
        });
    }

   

    function getVal(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }
    function getCheck(id) {
        var el = document.getElementById(id);
        return el ? el.checked : false;
    }

    // ── FORM SUBMIT ───────────────────────────────────────────
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validateForm()) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="submit-icon">⏳</span> Processing...';

        const payload = {
            first_name: getVal('rbi-firstname'),
            middle_name: getVal('rbi-middlename'),
            last_name: getVal('rbi-lastname'),
            name_ext: getVal('rbi-ext'),
            household_number: getVal('rbi-household-no'),
            household_type: getVal('rbi-household-type'),
            contact_no: getVal('rbi-contact'),
            email: getVal('rbi-email'), 
            gender: getVal('rbi-gender'),
            birth_date: getVal('rbi-dob'),
            birth_place: getVal('rbi-pob'),
            civil_status: getVal('rbi-civil'),
            religion: getVal('rbi-religion'),
            religion_other: getVal('rbi-religion-other'),
            house_number: getVal('rbi-house'),
            street: getVal('rbi-street'),
            barangay: getVal('rbi-brgy'),
            municipality: getVal('rbi-muni'),
            province: getVal('rbi-prov'),
            educational_attainment: getVal('rbi-education'),
            registered_voter: getVal('rbi-voter'),
            precinct_no: getVal('rbi-precinct'),
            employment_business: getVal('rbi-employment'),
            kind_of_business: getVal('rbi-kind-business'),
            citizenship: getVal('rbi-citizenship'),
            years_of_stay: getVal('rbi-years'),
            residence_status: getVal('rbi-residence'),
            priority: getVal('rbi-priority'),
            dswd_beneficiary: getVal('rbi-dswd'),
            chk_aics: getCheck('rbi-chk-aics'),
            chk_akap: getCheck('rbi-chk-akap'),
            chk_tupad: getCheck('rbi-chk-tupad'),
            dswd_other: getVal('rbi-dswd-other'),
            dswd_date: getVal('rbi-dswd-date'),
            livelihood_beneficiary: getVal('rbi-livelihood'),
            livelihood_specify: getVal('rbi-livelihood-specify'),
            livelihood_date: getVal('rbi-livelihood-date')
        };
        
        const formData = new FormData();
        for (const key in payload) {
            formData.append(key, payload[key]);
        }

        if (finalImageFile) {
            formData.append('rbi_photo', finalImageFile);
        }

        fetch('API/Index/rbi_api_insert.php', {
            method: 'POST',
            body: formData
        })
        .then(async res => {
            const text = await res.text();
            try {
                return JSON.parse(text);
            } catch (err) {
                throw new Error("Server Error: " + text); 
            }
        })
        .then(data => {
            if (data.success) {
                document.getElementById('rbi-ref-number').textContent = data.ref_id;
                showSuccess();
            } 
            else {
                if (data.error_type === 'email') {
                    markError(document.getElementById('rbi-email'), data.message);
                    showToast(data.message, "error");
                    document.getElementById('rbi-email').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                else if (data.error_type === 'contact') {
                    markError(document.getElementById('rbi-contact'), data.message);
                    showToast(data.message, "error");
                    document.getElementById('rbi-contact').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                else if (data.error_type === 'ext_required') {
                    markError(document.getElementById('rbi-ext'), 'Required to differentiate identical name.');
                    showToast(data.message, "error");
                    document.getElementById('rbi-ext').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                else if (data.error_type === 'duplicate') {
                    showToast(data.message, "error");
                    markError(document.getElementById('rbi-lastname'), 'Already registered.');
                    markError(document.getElementById('rbi-firstname'), 'Already registered.');
                    markError(document.getElementById('rbi-dob'), 'Already registered.');
                    document.getElementById('rbi-lastname').scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                else {
                    showToast(data.message || "Error occurred", "error");
                }

                submitBtn.disabled = false;
                submitBtn.innerHTML = '<span class="submit-icon">📋</span> Submit Registration';
            }
        })
        .catch(err => {
            showToast(err.message, "error"); 
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="submit-icon">📋</span> Submit Registration';
        });
    });

    // ── OPEN / CLOSE ─────────────────────────────────────────
    function openRBI() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display  = '';
        successWrap.classList.remove('visible');
        overlay.scrollTop = 0;
    }

    function closeRBI() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── SUCCESS SCREEN ───────────────────────────────────────
    function showSuccess() {
        formWrap.style.display = 'none';
        successWrap.classList.add('visible');

        var doneBtn = document.getElementById('rbi-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeRBI();
                setTimeout(function () {
                    form.reset();
                    resetFileInput();
                    ageInput.value = '';
                    
                    ['rbi-religion-other-wrap','rbi-address-wrap','rbi-precinct-wrap','rbi-business-wrap','rbi-dswd-wrap','rbi-livelihood-wrap'].forEach(id => {
                        let el = document.getElementById(id);
                        if(el) { el.style.display = 'none'; el.classList.remove('rbi-animate-in'); }
                    });

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="submit-icon">📋</span> Submit Registration';
                    clearErrors();
                    formWrap.style.display = '';
                    successWrap.classList.remove('visible');
                }, 400);
            }, { once: true });
        }
    }

    // ── VALIDATION ───────────────────────────────────────────
    function validateForm() {
        clearErrors();
        var valid = true;

        var required = form.querySelectorAll('[data-required="true"]');
        required.forEach(function (field) {
            var wrap = field.closest('.rbi-animate-in, .rbi-row, .rbi-field');
            if (wrap && wrap.style.display === 'none') return;

            var val = field.value.trim();
            if (!val || val === '') {
                markError(field, 'This field is required.');
                valid = false;
            }
        });

        var contact = document.getElementById('rbi-contact');
        if (contact && contact.value && !/^\d{11}$/.test(contact.value.trim())) {
            markError(contact, 'Enter a valid 11-digit number.');
            valid = false;
        }

        var email = document.getElementById('rbi-email');
        if (email && email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            markError(email, 'Enter a valid email address.');
            valid = false;
        }

        if (!valid) {
            var firstErr = form.querySelector('.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markError(field, msg) {
        if(!field) return;
        var group = field.closest('.rbi-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.rbi-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearErrors() {
        form.querySelectorAll('.rbi-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.rbi-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    // ── TOAST NOTIFICATION SYSTEM ─────────────────────────────
    function showToast(message, type) {
        var container = document.getElementById('rbi-toast-container');
        if (!container) return;
        var toast = document.createElement('div');
        toast.className = 'rbi-toast ' + (type === 'error' ? 'rbi-toast-error' : 'rbi-toast-success');
        var icon = type === 'error' ? '⚠️' : '✅';
        toast.innerHTML = '<span class="rbi-toast-icon">' + icon + '</span><span class="rbi-toast-text">' + message + '</span>';
        container.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('rbi-toast-show');
        setTimeout(function() {
            toast.classList.remove('rbi-toast-show');
            setTimeout(function() {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, 3500);
    }

    function buildToastUI() {
        if (document.getElementById('rbi-toast-container')) return;
        var style = document.createElement('style');
        style.innerHTML = `
            .rbi-toast-container { position: fixed; top: 24px; right: 24px; z-index: 2147483647; display: flex; flex-direction: column; gap: 12px; pointer-events: none; }
            .rbi-toast { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 12px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transform: translateX(120%); opacity: 0; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); max-width: 350px; pointer-events: auto; }
            .rbi-toast-show { transform: translateX(0); opacity: 1; }
            .rbi-toast-icon { font-size: 1.25rem; }
            .rbi-toast-text { font-family: inherit; font-size: 0.9rem; font-weight: 500; color: #1e293b; line-height: 1.4; }
            .rbi-toast-error { background: rgba(254, 242, 242, 0.95); border-left: 4px solid #ef4444; }
            .rbi-toast-success { background: rgba(240, 253, 244, 0.95); border-left: 4px solid #22c55e; }
        `;
        document.head.appendChild(style);
        var container = document.createElement('div');
        container.id = 'rbi-toast-container';
        container.className = 'rbi-toast-container';
        document.body.appendChild(container);
    }

    // ── BUILD MODAL HTML ─────────────────────────────────────
    function buildRBIModal() {
        var html = `
        <div class="rbi-overlay" id="rbi-overlay" role="dialog" aria-modal="true" aria-labelledby="rbi-form-title">
          <div class="rbi-modal">

            <div class="rbi-topbar">
              <button class="rbi-back-btn" id="rbi-back-btn" aria-label="Go back to main page">
                <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Back
              </button>
              <div class="rbi-topbar-title">
                <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                <p class="rbi-topbar-heading">Resident Registration</p>
              </div>
              <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="rbi-form-wrap">

              <div class="rbi-form-header">
                <h2 class="rbi-form-title" id="rbi-form-title">BRGY REGISTRATION <span>(RBI)</span></h2>
                <div class="rbi-form-divider"></div>
                <p class="rbi-form-notice">* Please Provide Correct Information</p>
              </div>

              <form class="rbi-form-body" id="rbi-registration-form" novalidate>

                <div class="rbi-section-label">Basic Information</div>
                
                <div class="rbi-row" style="display:flex; flex-direction:column; align-items:center; margin-bottom:16px;">
                    <label class="rbi-label" style="margin-bottom:8px;">Upload or Take a Photo <span class="req">*</span></label>
                    
                    <img id="rbi-preview" src="" style="width:140px; height:140px; border-radius:8px; object-fit:cover; background:#f1f5f9; display:block; margin:0 auto 12px; border:1px dashed #cbd5e1;">
                    
                    <div style="display:flex; gap:10px;">
                        <button type="button" class="rbi-file-btn" id="rbi-file-btn" style="padding:8px 16px;">📁 Choose File</button>
                        <button type="button" class="rbi-file-btn" id="rbi-camera-btn" style="background:#2c57e5; color:white; border:none; padding:8px 16px;">📷 Camera</button>
                    </div>
                    <span class="rbi-file-name" id="rbi-file-name" style="margin-top:8px; font-size:12px; color:#64748b;">NO FILE CHOSEN</span>
                    
                    <input type="file" id="rbi-photo-input" class="rbi-file-input-hidden" accept="image/png, image/jpeg, image/jpg" style="display:none;">
                </div>

                <div class="rbi-row rbi-row-custom-top">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-household-no">Household Number:</label>
                    <input type="text" id="rbi-household-no" class="rbi-input readonly-field" value="UM8339W82" readonly>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-household-type">Household Type: <span class="req">*</span></label>
                    <select id="rbi-household-type" class="rbi-select" data-required="true">
                      <option value="">— SELECT —</option>
                      <option>Single Family</option>
                      <option>Extended Family</option>
                      <option>Multi-Family</option>
                      <option>Single Person</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                </div>

                <div class="rbi-row rbi-row-contact">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-contact">Contact No:</label>
                    <input type="tel" id="rbi-contact" class="rbi-input" placeholder="09XXXXXXXXX" maxlength="11">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-gender">Gender: <span class="req">*</span></label>
                    <select id="rbi-gender" class="rbi-select" data-required="true">
                      <option value="">— SELECT —</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Prefer not to say</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-dob">Birth Date: <span class="req">*</span></label>
                    <input type="date" id="rbi-dob" class="rbi-input" data-required="true">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-age">Age:</label>
                    <input type="text" id="rbi-age" class="rbi-input auto-calc" placeholder="AUTO" readonly>
                  </div>
                </div>

                <div class="rbi-section-label">Full Name</div>
                <div class="rbi-row rbi-row-name">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-lastname">Last Name: <span class="req">*</span></label>
                    <input type="text" id="rbi-lastname" class="rbi-input" data-required="true">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-firstname">First Name: <span class="req">*</span></label>
                    <input type="text" id="rbi-firstname" class="rbi-input" data-required="true">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-middlename">Middle Name:</label>
                    <input type="text" id="rbi-middlename" class="rbi-input" placeholder="OPTIONAL">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-ext">Ext:</label>
                    <input type="text" id="rbi-ext" class="rbi-input" placeholder="JR/SR">
                  </div>
                </div>

                <div class="rbi-section-label">Personal Details</div>
                <div class="rbi-row rbi-row-3">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-pob">Place of Birth: <span class="req">*</span></label>
                    <input type="text" id="rbi-pob" class="rbi-input" data-required="true">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-civil">Civil Status: <span class="req">*</span></label>
                    <select id="rbi-civil" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>SINGLE</option>
                      <option>MARRIED</option>
                      <option>LEGALLY SEPERATED</option>
                      <option>WIDOW(ER)</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-religion">Religion: <span class="req">*</span></label>
                    <select id="rbi-religion" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>ROMAN CATHOLIC</option>
                      <option>ISLAM</option>
                      <option>SEVENTH DAY ADVENTIST</option>
                      <option>JEHOVAH WITNESSES</option>
                      <option>ANG DATING DAAN</option>
                      <option>EVANGELICAL CHRISTIANITY</option>
                      <option>NO RELEGION</option>
                      <option>OTHERS</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                </div>
                <div id="rbi-religion-other-wrap" style="display:none;" class="rbi-row rbi-row-1">
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-religion-other">Specify Religion: <span class="req">*</span></label>
                        <input type="text" id="rbi-religion-other" class="rbi-input" placeholder="Enter religion">
                        <span class="rbi-error-msg"></span>
                    </div>
                </div>

                <div class="rbi-row rbi-row-2" style="margin-top:16px;">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-permanent">Permanent Address?: <span class="req">*</span></label>
                    <select id="rbi-permanent" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-education">Educational Attainment: <span class="req">*</span></label>
                    <select id="rbi-education" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>ELEMENTARY LEVEL</option>
                      <option>ELEMENTARY GRADUATE</option>
                      <option>HIGH SCHOOL LEVEL</option>
                      <option>HIGH SCHOOL GRADUATE</option>
                      <option>SENIOR HIGH SCHOOL</option>
                      <option>SENIOR HIGH SCHOOL GRADUATE</option>
                      <option>COLLEGE LEVEL</option>
                      <option>COLLEGE GRADUATE</option>
                      <option>MASTER'S DEGREE</option>
                      <option>DOCTORATE DEGREE</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                </div>

                <div id="rbi-address-wrap" style="display:none;" class="rbi-row rbi-row-3" style="margin-top: 16px;">
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-house">House No.: <span class="req">*</span></label>
                        <input type="text" id="rbi-house" class="rbi-input" placeholder="House No.">
                        <span class="rbi-error-msg"></span>
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-street">Street: <span class="req">*</span></label>
                        <input type="text" id="rbi-street" class="rbi-input" placeholder="Street">
                        <span class="rbi-error-msg"></span>
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-brgy">Barangay: <span class="req">*</span></label>
                        <input type="text" id="rbi-brgy" class="rbi-input" placeholder="Barangay">
                        <span class="rbi-error-msg"></span>
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-muni">Municipality/City: <span class="req">*</span></label>
                        <input type="text" id="rbi-muni" class="rbi-input" placeholder="Municipality">
                        <span class="rbi-error-msg"></span>
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-prov">Province: <span class="req">*</span></label>
                        <input type="text" id="rbi-prov" class="rbi-input" placeholder="Province">
                        <span class="rbi-error-msg"></span>
                    </div>
                </div>

                <div class="rbi-section-label">Residency & Employment</div>
                <div class="rbi-row rbi-row-3">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-voter">Registered Voter: <span class="req">*</span></label>
                    <select id="rbi-voter" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field" id="rbi-precinct-wrap" style="display:none;">
                    <label class="rbi-label" for="rbi-precinct">Precinct No. (Optional):</label>
                    <input type="text" id="rbi-precinct" class="rbi-input" placeholder="e.g. 0012A">
                  </div>
                  
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-employment">Employment/Business: <span class="req">*</span></label>
                    <select id="rbi-employment" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>UNEMPLOYED</option>
                      <option>EMPLOYED</option>
                      <option>SELF-EMPLOYED</option>
                      <option>BUSINESS OWNER</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                </div>

                <div id="rbi-business-wrap" style="display:none;" class="rbi-row rbi-row-1">
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-kind-business">Specify Business: <span class="req">*</span></label>
                        <input type="text" id="rbi-kind-business" class="rbi-input" placeholder="Enter business name or type">
                        <span class="rbi-error-msg"></span>
                    </div>
                </div>

                <div class="rbi-row rbi-row-3">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-citizenship">Citizenship: <span class="req">*</span></label>
                    <input type="text" id="rbi-citizenship" class="rbi-input" data-required="true">
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-years">Years of Stay:</label>
                    <input type="number" id="rbi-years" class="rbi-input" min="0" max="120">
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-residence">Residence Status: <span class="req">*</span></label>
                    <select id="rbi-residence" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>HOME OWNER</option>
                      <option>DEPENDENT</option>
                      <option>RENTER</option>
                      <option>CONDOMINIUM</option>
                      <option>TEMPORARY</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                </div>

                <div class="rbi-row rbi-row-2">
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-priority">Priority Sector:</label>
                        <select id="rbi-priority" class="rbi-select">
                        <option value="">— None —</option>
                        <option>SENIOR CITIZEN</option>
                        <option>PWD</option>
                        <option>SOLO PARENT</option>
                        </select>
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-email">Email Address:</label>
                        <input type="email" id="rbi-email" class="rbi-input">
                        <span class="rbi-error-msg"></span>
                    </div>
                </div>

                <div class="rbi-section-label">Beneficiary Information</div>
                <div class="rbi-row rbi-row-2">
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-dswd">DSWD Beneficiary: <span class="req">*</span></label>
                    <select id="rbi-dswd" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                  <div class="rbi-field">
                    <label class="rbi-label" for="rbi-livelihood">Brgy. Livelihood Beneficiary: <span class="req">*</span></label>
                    <select id="rbi-livelihood" class="rbi-select" data-required="true">
                      <option value="">— Select —</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                    <span class="rbi-error-msg"></span>
                  </div>
                </div>

                <div id="rbi-dswd-wrap" style="display:none; background: #f0f4ff; padding: 16px; border-radius: 8px; margin-bottom:16px;" class="rbi-row rbi-row-2">
                    <div class="rbi-field">
                        <label class="rbi-label">Select Program(s):</label>
                        <div style="display:flex; gap:16px; margin-bottom:8px;">
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem; color: black;"><input type="checkbox" id="rbi-chk-aics" class="rbi-checkbox"> AICS</label>
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem; color: black;"><input type="checkbox" id="rbi-chk-akap" class="rbi-checkbox"> AKAP</label>
                            <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem; color: black;"><input type="checkbox" id="rbi-chk-tupad" class="rbi-checkbox"> TUPAD</label>
                        </div>
                        <input type="text" id="rbi-dswd-other" class="rbi-input" placeholder="Other Program (Specify)">
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-dswd-date">Date Received: <span class="req">*</span></label>
                        <input type="date" id="rbi-dswd-date" class="rbi-input">
                        <span class="rbi-error-msg"></span>
                    </div>
                </div>

                <div id="rbi-livelihood-wrap" style="display:none; background: #fff5e6; padding: 16px; border-radius: 8px; margin-bottom:16px;" class="rbi-row rbi-row-2">
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-livelihood-specify">Specify Livelihood Program: <span class="req">*</span></label>
                        <input type="text" id="rbi-livelihood-specify" class="rbi-input">
                        <span class="rbi-error-msg"></span>
                    </div>
                    <div class="rbi-field">
                        <label class="rbi-label" for="rbi-livelihood-date">Date Finished: <span class="req">*</span></label>
                        <input type="date" id="rbi-livelihood-date" class="rbi-input">
                        <span class="rbi-error-msg"></span>
                    </div>
                </div>

                    <div class="rbi-terms-row" style="margin-top: 24px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="rbi-terms-check" class="rbi-checkbox" disabled style="cursor: not-allowed;">
                    <label for="rbi-terms-check" class="rbi-terms-label" style="font-size: 0.9rem; color: #1e293b;">
                        I have read and agree to the <button type="button" id="open-terms-modal-btn" style="background:none; border:none; color:#2c57e5; text-decoration:underline; font-weight:bold; cursor:pointer; padding:0; font-size:inherit;">Data Privacy Terms & Conditions</button>
                    </label>
                    </div>

                <div class="rbi-submit-row">
                  <button type="submit" id="rbi-submit-btn" class="rbi-submit-btn" disabled>
                    <span class="submit-icon">📋</span> Submit Registration
                  </button>
                </div>

              </form>
            </div>

            <div class="rbi-success" id="rbi-success-wrap">
              <div class="rbi-success-icon">✅</div>
              <h2 class="rbi-success-title">Registration Submitted!</h2>
              <p class="rbi-success-sub">
                Your Barangay Registration (RBI) has been submitted successfully.<br>
                Please wait for confirmation from the Barangay Hall.
              </p>
              <div class="rbi-success-ref">Reference No: <span id="rbi-ref-number">—</span></div>
             <button id="rbi-done-btn" class="rbi-submit-btn">
                <span class="submit-icon">🏠</span> Back to Main Page
              </button>
            </div>

          </div>
        </div> <div class="rbi-overlay" id="rbi-terms-overlay" style="z-index: 2147483647; background: rgba(0,0,0,0.7); align-items: center;">
        <div class="rbi-modal" style="max-width: 500px; width: 90%; padding: 24px; border-radius: 12px; background: #fff; display: flex; flex-direction: column; min-height: auto; max-height: 90vh;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
              <h3 style="margin: 0; font-size: 1.25rem; color: #0f172a; font-weight: bold;">Terms and Conditions</h3>
              <button type="button" id="close-terms-x-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b;">&times;</button>
            </div>
            
            <div id="rbi-terms-modal-content" style="max-height: 50vh; overflow-y: auto; padding-right: 12px; font-size: 0.9rem; color: #475569; line-height: 1.6;">
              <em>Loading terms...</em>
            </div>
            
            <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 16px;">
              <span id="rbi-terms-hint" style="font-size: 0.85rem; color: #ef4444; font-weight: 500;">* Scroll to bottom to accept</span>
              <button type="button" id="accept-terms-btn" style="background: #22c55e; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: not-allowed; opacity: 0.5; transition: all 0.3s ease;" disabled>I Agree & Close</button>
            </div>
            
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}