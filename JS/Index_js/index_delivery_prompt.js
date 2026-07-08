// ========================================
// BARANGAY — DELIVERY & LOADING/UNLOADING
//            TRUCK CLEARANCE
// JS/index_delivery_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initDeliveryPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initDeliveryPrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); 
    buildDeliveryPromptModal();
    // WE REMOVED buildDlVerificationModal() HERE!
    buildDeliveryFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay = document.getElementById('dl-confirm-overlay');
    var btnYes        = document.getElementById('dl-confirm-yes');
    var btnNo         = document.getElementById('dl-confirm-no');
    var btnClose      = document.getElementById('dl-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay   = document.getElementById('delivery-form-overlay');
    var formBack      = document.getElementById('delivery-form-back');
    var form          = document.getElementById('delivery-request-form');
    var submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
    var termsCheck    = document.getElementById('delivery-terms-check');
    var successWrap   = document.getElementById('delivery-success-wrap');
    var formWrap      = document.getElementById('delivery-form-wrap');

    if (!promptOverlay) return;

    // ── DYNAMICALLY LOAD FLATPICKR (For Single Range Calendar) 
    function loadFlatpickr(callback) {
        if (window.flatpickr) {
            callback();
            return;
        }
        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
        document.head.appendChild(css);

        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
        script.onload = callback;
        document.head.appendChild(script);
    }

    // ── INTERCEPT: Delivery service card click ────────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="delivery"]');
        if (card) {
            e.stopImmediatePropagation();
            var servicesOverlay = document.getElementById('services-overlay');
            if (servicesOverlay) servicesOverlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(openPrompt, 180);
        }
    }, true);

    // ── PURPOSE CHANGE — show/hide Other Purpose field ──────
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'dl-purpose') {
            toggleDeliveryOtherPurpose(e.target.value);
        }
    });

    function toggleDeliveryOtherPurpose(val) {
        var otherWrap  = document.getElementById('dl-other-purpose-wrap');
        var otherInput = document.getElementById('dl-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('dl-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('dl-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.dl-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.dl-error-msg');
                    if (errEl) errEl.textContent = '';
                }
            }
        }
    }

    // ── PROMPT CONTROLS ───────────────────────────────────
    if (btnClose) btnClose.addEventListener('click', closePrompt);
    promptOverlay.addEventListener('click', function (e) {
        if (e.target === promptOverlay) closePrompt();
    });

    // ── LINK TO UNIVERSAL VERIFICATION ────────────────────
    // YES → Open Universal Verification Modal
    if (btnYes) {
        btnYes.addEventListener('click', function () {
            closePrompt();
            setTimeout(function() {
                // Open the Universal System
                ResidentVerification.open(function(userData) {
                    // Delivery form doesn't need to auto-fill the requestor's name, 
                    // so we just proceed to open the form directly!
                    setTimeout(openDeliveryForm, 200);
                });
            }, 200);
        });
    }

    // NO → Open RBI registration
    if (btnNo) {
        btnNo.addEventListener('click', function () {
            closePrompt();
            setTimeout(function () {
                var rbiOverlay = document.getElementById('rbi-overlay');
                if (rbiOverlay) {
                    rbiOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    var rbiFormWrap    = document.getElementById('rbi-form-wrap');
                    var rbiSuccessWrap = document.getElementById('rbi-success-wrap');
                    if (rbiFormWrap)    rbiFormWrap.style.display = '';
                    if (rbiSuccessWrap) rbiSuccessWrap.classList.remove('visible');
                    rbiOverlay.scrollTop = 0;
                }
            }, 200);
        });
    }

    // WE REMOVED ALL THE OLD VERIFICATION FORM LOGIC HERE!

    // ── FORM BACK / ESC ───────────────────────────────────
    if (formBack) formBack.addEventListener('click', closeDeliveryForm);

    if (termsCheck) {
        termsCheck.addEventListener('change', function () {
            if (submitBtn) submitBtn.disabled = !this.checked;
        });
    }

    // ── FORM SUBMIT ───────────────────────────────────────
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateDeliveryForm()) return;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            // 1. Gather form data
            const payload = {
                queue_prefix: 'ODL-', 
                company_name: getVal('dl-company'),
                location: getVal('dl-location'),
                date_range: getVal('dl-date-range'), // Formatted nicely by flatpickr
                time_from: getVal('dl-time-from'),
                time_to: getVal('dl-time-to'),
                vehicles: getVal('dl-vehicles'),
                purpose: getVal('dl-purpose'),
                other_purpose_details: getVal('dl-other-purpose'), // REPLACED additional contact number
                phone: getVal('dl-phone')
            };

            // 2. Send to PHP API
            fetch('API/Index/delivery_api_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.success) {
                    var ref = document.getElementById('delivery-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showDeliverySuccess();
                } else {
                    showToast('Submission Error: ' + data.message, "error");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>📋</span> Submit Request';
                    }
                }
            })
            .catch(function(err) {
                showToast('A network error occurred. Please try again.', "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>📋</span> Submit Request';
                }
            });
        });
    }

    // ── OPEN / CLOSE ──────────────────────────────────────
    function openPrompt() { promptOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closePrompt() { promptOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    // WE REMOVED openVerification AND closeVerification HERE!

    function openDeliveryForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;

        // Initialize the Range Calendar Picker
        loadFlatpickr(function() {
            flatpickr("#dl-date-range", {
                mode: "range",
                minDate: "today",     // Blocks past dates
                dateFormat: "F j, Y", // Outputs e.g., "April 3, 2026"
                locale: {
                    rangeSeparator: " TO " // Automatically adds " TO " between the two dates
                }
            });
        });
    }
    
    function closeDeliveryForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── SUCCESS SCREEN ────────────────────────────────────
    function showDeliverySuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');

        var doneBtn = document.getElementById('delivery-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeDeliveryForm();
                setTimeout(resetDeliveryForm, 400);
            }, { once: true });
        }
    }

    function resetDeliveryForm() {
        if (form) form.reset();

        // Clear the calendar visually
        var dp = document.getElementById('dl-date-range');
        if (dp && dp._flatpickr) {
            dp._flatpickr.clear();
        }

        // Hide other purpose
        var otherWrap  = document.getElementById('dl-other-purpose-wrap');
        var otherInput = document.getElementById('dl-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; otherWrap.classList.remove('dl-animate-in'); }
        if (otherInput) { otherInput.removeAttribute('data-required'); otherInput.value = ''; }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        clearDeliveryErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateDeliveryForm() {
        clearDeliveryErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            var val = field.value || '';
            if (!val.trim()) {
                markDeliveryError(field, 'This field is required.');
                valid = false;
            }
        });

        // Ensure Date Range actually contains " TO " (meaning they picked start AND end)
        var dateRangeVal = getVal('dl-date-range');
        if (dateRangeVal && dateRangeVal.indexOf(' TO ') === -1) {
            var dpEl = document.getElementById('dl-date-range');
            if (dpEl) markDeliveryError(dpEl, 'Please select both a Start Date and End Date.');
            valid = false;
        }

        // Time from must be before time to
        var timeFrom = document.getElementById('dl-time-from');
        var timeTo   = document.getElementById('dl-time-to');
        if (timeFrom && timeTo && timeFrom.value && timeTo.value) {
            if (timeFrom.value >= timeTo.value) {
                markDeliveryError(timeTo, 'End time must be after start time.');
                valid = false;
            }
        }

        // Phone validation 
        var phoneVal = getVal('dl-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('dl-phone');
            if (phoneEl) markDeliveryError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid && form) {
            var firstErr = form.querySelector('.dl-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markDeliveryError(field, msg) {
        var group = field.closest('.dl-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.dl-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearDeliveryErrors() {
        if (form) {
            form.querySelectorAll('.dl-field.has-error').forEach(function (g) {
                g.classList.remove('has-error');
                var errEl = g.querySelector('.dl-error-msg');
                if (errEl) errEl.textContent = '';
            });
        }
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
            .rbi-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 2147483647; 
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            }
            .rbi-toast {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 20px;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.4);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                transform: translateX(120%);
                opacity: 0;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                max-width: 350px;
                pointer-events: auto;
            }
            .rbi-toast-show { transform: translateX(0); opacity: 1; }
            .rbi-toast-icon { font-size: 1.25rem; }
            .rbi-toast-text { font-family: inherit; font-size: 0.9rem; font-weight: 500; color: #1e293b; line-height: 1.4; }
            .rbi-toast-error { background: rgba(254, 242, 242, 0.9); border-left: 4px solid #ef4444; }
            .rbi-toast-success { background: rgba(240, 253, 244, 0.9); border-left: 4px solid #22c55e; }
        `;
        document.head.appendChild(style);

        var container = document.createElement('div');
        container.id = 'rbi-toast-container';
        container.className = 'rbi-toast-container';
        document.body.appendChild(container);
    }

    // ── BUILD PROMPT HTML ─────────────────────────────────
    function buildDeliveryPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="dl-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="dl-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">🚛</div>
                <h2 class="rbi-confirm-title">Delivery & Loading/Unloading Truck Clearance</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Delivery & Loading/Unloading Truck Clearance.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="dl-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text"><strong>No, Register Me</strong><small>Go to BRGY Registration (RBI)</small></span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="dl-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text"><strong>Yes, Proceed</strong><small>Request Truck Clearance</small></span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildDlVerificationModal() HTML BLOCK HERE!

    // ── BUILD FORM HTML ───────────────────────────────────
    function buildDeliveryFormModal() {
        var html = `
        <div class="residency-form-overlay" id="delivery-form-overlay" role="dialog" aria-modal="true">

            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="delivery-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">Delivery & Loading/Unloading Truck Clearance</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="delivery-form-wrap">

                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST <span>DELIVERY & LOADING/UNLOADING &amp;<br>TEMPORARY PARKING OF DELIVERY SERVICES TRUCK CLEARANCE</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="delivery-request-form" novalidate>

                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-company">
                                Company Name: <span class="req">*</span>
                            </label>
                            <input type="text" id="dl-company" class="rbi-input"
                                   data-required="true" placeholder="COMPANY NAME" maxlength="150">
                            <span class="dl-error-msg"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-location">
                                Location: <span class="req">*</span>
                            </label>
                            <input type="text" id="dl-location" class="rbi-input"
                                   data-required="true"
                                   placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="dl-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-date-range">
                                Date (from-to): <span class="req">*</span>
                            </label>
                            <input type="text" id="dl-date-range" class="rbi-input"
                                   data-required="true"
                                   placeholder="Select Start & End Date" readonly>
                            <span class="dl-error-msg"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label">
                                Time (from-to): <span class="req">*</span>
                            </label>
                            <div class="dl-time-range">
                                <input type="time" id="dl-time-from" class="rbi-input dl-time-input"
                                       data-required="true">
                                <span class="dl-time-sep">to</span>
                                <input type="time" id="dl-time-to" class="rbi-input dl-time-input"
                                       data-required="true">
                            </div>
                            <span class="dl-error-msg"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-vehicles">
                                Vehicle(s) / Plate Number: <span class="req">*</span>
                            </label>
                            <input type="text" id="dl-vehicles" class="rbi-input"
                                   data-required="true"
                                   placeholder="VEHICLE(S) / PLATE NUMBER" maxlength="200">
                            <span class="dl-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-purpose">
                                Purpose: <span class="req">*</span>
                            </label>
                            <select id="dl-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Goods Delivery</option>
                                <option>Furniture Moving</option>
                                <option>Construction Materials</option>
                                <option>Appliance Delivery</option>
                                <option>Commercial Supply</option>
                                <option>Other</option>
                            </select>
                            <span class="dl-error-msg"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-certificate">
                                Certificate: <span class="req">*</span>
                            </label>
                            <input type="text" id="dl-certificate" class="rbi-input readonly-field"
                                   value="DELIVERY & LOADING/UNLOADING, ETC, CLEARANCE" readonly>
                            <span class="dl-error-msg"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-phone">
                                Cellphone Number: <span class="req">*</span>
                            </label>
                            <input type="tel" id="dl-phone" class="rbi-input"
                                   data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="dl-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 dl-extra-row" id="dl-other-purpose-wrap" style="display:none;">
                        <div class="dl-field dl-field-narrow">
                            <label class="rbi-label" for="dl-other-purpose">
                                Please specify purpose: <span class="req">*</span>
                            </label>
                            <input type="text" id="dl-other-purpose" class="rbi-input"
                                   placeholder="SPECIFY YOUR PURPOSE" maxlength="150">
                            <span class="dl-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="delivery-terms-check" class="rbi-checkbox">
                        <label for="delivery-terms-check" class="rbi-terms-label">
                            I agree and accept the
                            <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row">
                        <button type="submit" id="delivery-submit-btn" class="rbi-submit-btn" disabled>
                            <span>📋</span> Submit Request
                        </button>
                    </div>

                </form>
            </div>

            <div class="rbi-success" id="delivery-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">
                    Your Delivery & Loading/Unloading Truck Clearance request has been submitted successfully.<br>
                    Please wait for confirmation from the Barangay Hall.
                </p>
                <div class="rbi-success-ref">Reference No: <span id="delivery-ref-number">—</span></div>
                <button id="delivery-done-btn" class="rbi-submit-btn">
                    <span>🏠</span> Back to Main Page
                </button>
            </div>

        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}