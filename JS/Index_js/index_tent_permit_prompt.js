// ========================================
// BARANGAY — CERTIFICATE OF TENT PERMIT
// JS/index_tent_permit_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initTentPermitPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initTentPermitPrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); 
    buildTentPermitPromptModal();
    // WE REMOVED buildTpVerificationModal() HERE!
    buildTentPermitFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay = document.getElementById('tp-confirm-overlay');
    var btnYes        = document.getElementById('tp-confirm-yes');
    var btnNo         = document.getElementById('tp-confirm-no');
    var btnClose      = document.getElementById('tp-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay   = document.getElementById('tent-permit-form-overlay');
    var formBack      = document.getElementById('tent-permit-form-back');
    var form          = document.getElementById('tent-permit-request-form');
    var submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
    var termsCheck    = document.getElementById('tent-permit-terms-check');
    var successWrap   = document.getElementById('tent-permit-success-wrap');
    var formWrap      = document.getElementById('tent-permit-form-wrap');

    if (!promptOverlay) return;

    // ── INTERCEPT: Tent Permit service card click ─────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="tent-permit"]');
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
        if (e.target && e.target.id === 'tp-purpose') {
            toggleTpOtherPurpose(e.target.value);
        }
    });

    function toggleTpOtherPurpose(val) {
        var otherWrap  = document.getElementById('tp-other-purpose-wrap');
        var otherInput = document.getElementById('tp-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('tp-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('tp-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.tp-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.tp-error-msg');
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
    // Yes → open Universal Verification Modal
    if (btnYes) {
        btnYes.addEventListener('click', function () {
            closePrompt();
            setTimeout(function() {
                // Open the Universal System
                ResidentVerification.open(function(userData) {
                    // This runs ONLY if verification was successful!
                    var fullnameInput = document.getElementById('tp-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the form
                    setTimeout(openTentPermitForm, 200);
                });
            }, 200);
        });
    }

    // No → open RBI registration
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
    if (formBack) formBack.addEventListener('click', closeTentPermitForm);

    if (termsCheck) {
        termsCheck.addEventListener('change', function () {
            if (submitBtn) submitBtn.disabled = !this.checked;
        });
    }

    // ── FORM SUBMIT ───────────────────────────────────────
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateTentPermitForm()) return;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            const payload = {
                queue_prefix: 'OTP-',
                full_name: getVal('tp-fullname'),
                home_address: getVal('tp-address'),
                purpose: getVal('tp-purpose'),
                other_purpose_details: getVal('tp-other-purpose'),
                phone: getVal('tp-phone'),
                date_used: getVal('tp-date-used')
            };

            fetch('API/Index/tent_permit_api_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.success) {
                    var ref = document.getElementById('tent-permit-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showTentPermitSuccess();
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

    function openTentPermitForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
        setDefaultDate();
    }
    function closeTentPermitForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── DEFAULT DATE CALENDAR LOGIC ───────────────────────
    function setDefaultDate() {
        var dateInput = document.getElementById('tp-date-used');
        if (!dateInput) return;
        
        var now = new Date();
        var year = now.getFullYear();
        // JavaScript months are 0-indexed, so add 1. Pad with leading zero if needed.
        var month = String(now.getMonth() + 1).padStart(2, '0'); 
        var day = String(now.getDate()).padStart(2, '0');
        
        var today = year + '-' + month + '-' + day;
        
        // This locks the calendar so past dates cannot be clicked
        dateInput.min = today;
        // This sets the visual default date to today
        dateInput.value = today;
    }

    // ── SUCCESS SCREEN ────────────────────────────────────
    function showTentPermitSuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');

        var doneBtn = document.getElementById('tent-permit-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeTentPermitForm();
                setTimeout(resetTentPermitForm, 400);
            }, { once: true });
        }
    }

    function resetTentPermitForm() {
        if (form) form.reset();

        var otherWrap  = document.getElementById('tp-other-purpose-wrap');
        var otherInput = document.getElementById('tp-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; otherWrap.classList.remove('tp-animate-in'); }
        if (otherInput) { otherInput.removeAttribute('data-required'); otherInput.value = ''; }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        clearTentPermitErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        setDefaultDate();
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateTentPermitForm() {
        clearTentPermitErrors();
        var valid = true;

        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markTentPermitError(field, 'This field is required.');
                    valid = false;
                }
            });
        }

        var phoneVal = getVal('tp-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('tp-phone');
            if (phoneEl) markTentPermitError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid && form) {
            var firstErr = form.querySelector('.tp-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markTentPermitError(field, msg) {
        var group = field.closest('.tp-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.tp-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearTentPermitErrors() {
        if (form) {
            form.querySelectorAll('.tp-field.has-error').forEach(function (g) {
                g.classList.remove('has-error');
                var errEl = g.querySelector('.tp-error-msg');
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
    function buildTentPermitPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="tp-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="tp-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">⛺</div>
                <h2 class="rbi-confirm-title">Certificate of Tent Permit</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Certificate of Tent Permit.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="tp-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text"><strong>No, Register Me</strong><small>Go to BRGY Registration (RBI)</small></span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="tp-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text"><strong>Yes, Proceed</strong><small>Request Certificate of Tent Permit</small></span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildTpVerificationModal() HTML BLOCK HERE!

    // ── BUILD FORM HTML ───────────────────────────────────
    function buildTentPermitFormModal() {
        var html = `
        <div class="residency-form-overlay" id="tent-permit-form-overlay" role="dialog" aria-modal="true">

            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="tent-permit-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">Certificate of Tent Permit</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="tent-permit-form-wrap">

                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST CERTIFICATE OF <span>TENT PERMIT</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="tent-permit-request-form" novalidate>

                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-fullname">
                                Full Name: <span class="req">*</span>
                            </label>
                            <input type="text" id="tp-fullname" class="rbi-input readonly-field"
                                   data-required="true" placeholder="FULL NAME" maxlength="100" readonly>
                            <span class="tp-error-msg"></span>
                        </div>
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-address">
                                Home Address: <span class="req">*</span>
                            </label>
                            <input type="text" id="tp-address" class="rbi-input"
                                   data-required="true"
                                   placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="tp-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-purpose">
                                Purpose: <span class="req">*</span>
                            </label>
                            <select id="tp-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Fiesta Celebration</option>
                                <option>Wedding Reception</option>
                                <option>Birthday Party</option>
                                <option>Community Event</option>
                                <option>Religious Activity</option>
                                <option>Other</option>
                            </select>
                            <span class="tp-error-msg"></span>
                        </div>
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-certificate">
                                Certificate: <span class="req">*</span>
                            </label>
                            <input type="text" id="tp-certificate" class="rbi-input readonly-field"
                                   value="CERTIFICATE OF TENT PERMIT" readonly>
                            <span class="tp-error-msg"></span>
                        </div>
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-phone">
                                Cellphone Number: <span class="req">*</span>
                            </label>
                            <input type="tel" id="tp-phone" class="rbi-input"
                                   data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="tp-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 tp-extra-row" id="tp-other-purpose-wrap" style="display:none;">
                        <div class="tp-field tp-field-narrow">
                            <label class="rbi-label" for="tp-other-purpose">Please specify purpose: <span class="req">*</span></label>
                            <input type="text" id="tp-other-purpose" class="rbi-input" placeholder="SPECIFY YOUR PURPOSE" maxlength="150">
                            <span class="tp-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1">
                        <div class="tp-field tp-field-narrow">
                            <label class="rbi-label" for="tp-date-used">
                                Date Used: <span class="req">*</span>
                            </label>
                            <input type="date" id="tp-date-used" class="rbi-input"
                                   data-required="true">
                            <span class="tp-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="tent-permit-terms-check" class="rbi-checkbox">
                        <label for="tent-permit-terms-check" class="rbi-terms-label">
                            I agree and accept the
                            <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row">
                        <button type="submit" id="tent-permit-submit-btn" class="rbi-submit-btn" disabled>
                            <span>📋</span> Submit Request
                        </button>
                    </div>

                </form>
            </div>

            <div class="rbi-success" id="tent-permit-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">
                    Your Certificate of Tent Permit request has been submitted successfully.<br>
                    Please wait for confirmation from the Barangay Hall.
                </p>
                <div class="rbi-success-ref">Reference No: <span id="tent-permit-ref-number">—</span></div>
                <button id="tent-permit-done-btn" class="rbi-submit-btn">
                    <span>🏠</span> Back to Main Page
                </button>
            </div>

        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}