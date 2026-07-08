// ========================================
// BARANGAY — RBI CONFIRMATION PROMPT
// JS/index_residency_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initResidencyPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initResidencyPrompt() {

    // ── INJECT HTML MODALS & UI ───────────────────────────────
    buildToastUI(); // <-- Toast Notification Container
    buildPromptModal();
    // WE REMOVED buildVerificationModal() HERE!
    buildResidencyFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay   = document.getElementById('rbi-confirm-overlay');
    var btnYes          = document.getElementById('rbi-confirm-yes');
    var btnNo           = document.getElementById('rbi-confirm-no');
    var btnClose        = document.getElementById('rbi-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay     = document.getElementById('residency-form-overlay');
    var formBack        = document.getElementById('residency-form-back');
    var form            = document.getElementById('residency-request-form');
    // Safety check for Main Submit Button
    var submitBtn       = form ? form.querySelector('button[type="submit"]') : null;
    
    var termsCheck      = document.getElementById('residency-terms-check');
    var successWrap     = document.getElementById('residency-success-wrap');
    var formWrap        = document.getElementById('residency-form-wrap');

    if (!promptOverlay) return;

    // ── INTERCEPT: Residency service card click ───────────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="residency"]');
        if (card) {
            e.stopImmediatePropagation();
            var servicesOverlay = document.getElementById('services-overlay');
            if (servicesOverlay) servicesOverlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(openPrompt, 180);
        }
    }, true); 

    // ── PURPOSE CHANGE — show/hide Other Purpose field ────────
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'residency-purpose') {
            toggleResOtherPurpose(e.target.value);
        }
    });

    function toggleResOtherPurpose(val) {
        var otherWrap  = document.getElementById('res-other-purpose-wrap');
        var otherInput = document.getElementById('res-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('res-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('res-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.res-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.res-error-msg');
                    if (errEl) errEl.textContent = '';
                }
            }
        }
    }

    // ── PROMPT CONTROLS ───────────────────────────────────────
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
                    // This runs ONLY if verification was successful!
                    var fullnameInput = document.getElementById('residency-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the residency form
                    setTimeout(openResidencyForm, 200);
                });
            }, 200);
        });
    }

    // NO → open RBI registration modal
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

    // ── RESIDENCY FORM CONTROLS ───────────────────────────────
    if (formBack) formBack.addEventListener('click', closeResidencyForm);
    
    if (termsCheck) {
        termsCheck.addEventListener('change', function () {
            if (submitBtn) submitBtn.disabled = !this.checked;
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateResidencyForm()) return;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            const payload = {
                queue_prefix: 'OR-', 
                full_name: getVal('residency-fullname'),
                home_address: getVal('residency-address'),
                purpose: getVal('residency-purpose'),
                other_purpose_details: getVal('res-other-purpose'),
                phone: getVal('residency-phone')
            };

            fetch('API/Index/residency_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    var ref = document.getElementById('residency-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showResidencySuccess();
                } else {
                    showToast('Submission Error: ' + data.message, "error");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>📋</span> Submit Request';
                    }
                }
            })
            .catch(err => {
                showToast("A network error occurred. Please try again.", "error");
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span>📋</span> Submit Request';
                }
            });
        });
    }

    // ── HELPER FUNCTIONS (OPEN/CLOSE) ─────────────────────────
    function openPrompt() { promptOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closePrompt() { promptOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    // WE REMOVED openVerification AND closeVerification HERE!

    function openResidencyForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
    }
    function closeResidencyForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── SUCCESS SCREEN ────────────────────────────────────────
    function showResidencySuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');

        var doneBtn = document.getElementById('residency-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeResidencyForm();
                setTimeout(function () {
                    if (form) form.reset();

                    var otherWrap  = document.getElementById('res-other-purpose-wrap');
                    var otherInput = document.getElementById('res-other-purpose');
                    if (otherWrap)  { otherWrap.style.display = 'none'; otherWrap.classList.remove('res-animate-in'); }
                    if (otherInput) { otherInput.removeAttribute('data-required'); otherInput.value = ''; }

                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<span>📋</span> Submit Request';
                    }
                    clearResidencyErrors();
                    if (formWrap) formWrap.style.display = '';
                    if (successWrap) successWrap.classList.remove('visible');
                }, 400);
            }, { once: true });
        }
    }

    // ── VALIDATION ────────────────────────────────────────────
    function validateResidencyForm() {
        clearResidencyErrors();
        var valid = true;

        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markResidencyError(field, 'This field is required.');
                    valid = false;
                }
            });
        }

        var phoneVal = getVal('residency-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('residency-phone');
            if (phoneEl) markResidencyError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid && form) {
            var firstErr = form.querySelector('.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markResidencyError(field, msg) {
        var group = field.closest('.res-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.res-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearResidencyErrors() {
        if (form) {
            form.querySelectorAll('.res-field.has-error').forEach(function (g) {
                g.classList.remove('has-error');
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

        // Trigger reflow to start animation
        void toast.offsetWidth;
        toast.classList.add('rbi-toast-show');

        // Remove toast after 3.5 seconds
        setTimeout(function() {
            toast.classList.remove('rbi-toast-show');
            setTimeout(function() {
                if (toast.parentNode) toast.remove();
            }, 300); // Wait for exit animation
        }, 3500);
    }

    function buildToastUI() {
        if (document.getElementById('rbi-toast-container')) return;
        
        // Inject Premium Glassmorphism CSS for Toast
        var style = document.createElement('style');
        style.innerHTML = `
            .rbi-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 2147483647; /* <--- BOOSTED Z-INDEX TO STAY ABOVE MODALS */
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
            .rbi-toast-show {
                transform: translateX(0);
                opacity: 1;
            }
            .rbi-toast-icon {
                font-size: 1.25rem;
            }
            .rbi-toast-text {
                font-family: inherit;
                font-size: 0.9rem;
                font-weight: 500;
                color: #1e293b;
                line-height: 1.4;
            }
            .rbi-toast-error {
                background: rgba(254, 242, 242, 0.9);
                border-left: 4px solid #ef4444;
            }
            .rbi-toast-success {
                background: rgba(240, 253, 244, 0.9);
                border-left: 4px solid #22c55e;
            }
        `;
        document.head.appendChild(style);

        // Inject Container
        var container = document.createElement('div');
        container.id = 'rbi-toast-container';
        container.className = 'rbi-toast-container';
        document.body.appendChild(container);
    }

    // ── BUILD CONFIRMATION PROMPT HTML ────────────────────────
    function buildPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="rbi-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="rbi-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">🏠</div>
                <h2 class="rbi-confirm-title">Certificate of Residency</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Certificate of Residency.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="rbi-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text">
                            <strong>No, Register Me</strong>
                            <small>Go to BRGY Registration (RBI)</small>
                        </span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="rbi-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text">
                            <strong>Yes, Proceed</strong>
                            <small>Request Certificate of Residency</small>
                        </span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildVerificationModal() HTML BLOCK HERE!

    // ── BUILD RESIDENCY FORM MODAL HTML ───────────────────────
    function buildResidencyFormModal() {
        var html = `
        <div class="residency-form-overlay" id="residency-form-overlay" role="dialog" aria-modal="true">

            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="residency-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">Certificate of Residency</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="residency-form-wrap">

                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST CERTIFICATE OF <span>RESIDENCY</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="residency-request-form" novalidate>

                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="res-field">
                            <label class="rbi-label" for="residency-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="residency-fullname" class="rbi-input readonly-field" data-required="true" readonly>
                            <span class="res-error-msg"></span>
                        </div>
                        <div class="res-field">
                            <label class="rbi-label" for="residency-address">Home Address: <span class="req">*</span></label>
                            <input type="text" id="residency-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY">
                            <span class="res-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="res-field">
                            <label class="rbi-label" for="residency-purpose">Purpose: <span class="req">*</span></label>
                            <select id="residency-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Employment</option>
                                <option>Loan Application</option>
                                <option>School Enrollment</option>
                                <option>Government Benefit</option>
                                <option>Legal Transaction</option>
                                <option>Travel / Visa</option>
                                <option>Other</option>
                            </select>
                            <span class="res-error-msg"></span>
                        </div>
                        <div class="res-field">
                            <label class="rbi-label" for="residency-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="residency-certificate" class="rbi-input readonly-field" value="CERTIFICATE OF RESIDENCY" readonly>
                        </div>
                        <div class="res-field">
                            <label class="rbi-label" for="residency-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="residency-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="res-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 res-extra-row" id="res-other-purpose-wrap" style="display:none;">
                        <div class="res-field res-field-narrow">
                            <label class="rbi-label" for="res-other-purpose">Please specify purpose: <span class="req">*</span></label>
                            <input type="text" id="res-other-purpose" class="rbi-input" placeholder="SPECIFY YOUR PURPOSE" maxlength="150">
                            <span class="res-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="residency-terms-check" class="rbi-checkbox">
                        <label for="residency-terms-check" class="rbi-terms-label">
                            I agree and accept the <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row">
                        <button type="submit" id="residency-submit-btn" class="rbi-submit-btn" disabled>
                            <span>📋</span> Submit Request
                        </button>
                    </div>

                </form>
            </div>
            <div class="rbi-success" id="residency-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">
                    Your Certificate of Residency request has been submitted successfully.<br>
                    Please wait for confirmation from the Barangay Hall.
                </p>
                <div class="rbi-success-ref">Reference No: <span id="residency-ref-number">—</span></div>
                <button id="residency-done-btn" class="rbi-submit-btn">
                    <span>🏠</span> Back to Main Page
                </button>
            </div>

        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}