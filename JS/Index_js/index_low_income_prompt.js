// ========================================
// BARANGAY — CERTIFICATE OF LOW INCOME
// JS/index_low_income_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initLowIncomePrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initLowIncomePrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); // <-- Toast Notification Container
    buildLowIncomePromptModal();
    // WE REMOVED buildLiVerificationModal() HERE!
    buildLowIncomeFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay = document.getElementById('li-confirm-overlay');
    var btnYes        = document.getElementById('li-confirm-yes');
    var btnNo         = document.getElementById('li-confirm-no');
    var btnClose      = document.getElementById('li-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay   = document.getElementById('low-income-form-overlay');
    var formBack      = document.getElementById('low-income-form-back');
    var form          = document.getElementById('low-income-request-form');
    // Safety check for Main Submit Button
    var submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
    var termsCheck    = document.getElementById('low-income-terms-check');
    var successWrap   = document.getElementById('low-income-success-wrap');
    var formWrap      = document.getElementById('low-income-form-wrap');

    if (!promptOverlay) return;

    // ── INTERCEPT: Low Income service card click ──────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="low-income"]');
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
        if (e.target && e.target.id === 'li-purpose') {
            toggleLiOtherPurpose(e.target.value);
        }
    });

    function toggleLiOtherPurpose(val) {
        var otherWrap  = document.getElementById('li-other-purpose-wrap');
        var otherInput = document.getElementById('li-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('li-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('li-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.li-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.li-error-msg');
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
                    var fullnameInput = document.getElementById('li-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the form
                    setTimeout(openLowIncomeForm, 200);
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
    if (formBack) formBack.addEventListener('click', closeLowIncomeForm);

    // ── TERMS CHECKBOX ────────────────────────────────────
    if (termsCheck) {
        termsCheck.addEventListener('change', function () {
            if (submitBtn) submitBtn.disabled = !this.checked;
        });
    }

   // ── FORM SUBMIT ───────────────────────────────────────
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateLowIncomeForm()) return;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            // 1. Gather form data
            const payload = {
                queue_prefix: 'OLI-', 
                full_name: getVal('li-fullname'),
                home_address: getVal('li-address'),
                purpose: getVal('li-purpose'),
                other_purpose_details: getVal('li-other-purpose'), // <-- ADDED FOR "OTHER"
                phone: getVal('li-phone'),
                amount: getVal('li-amount'),
                work: getVal('li-work')
            };

            // 2. Send to PHP API
            fetch('API/Index/low_income_api_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.success) {
                    var ref = document.getElementById('low-income-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showLowIncomeSuccess();
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

    function openLowIncomeForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
    }
    function closeLowIncomeForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── SUCCESS SCREEN ────────────────────────────────────
    function showLowIncomeSuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');

        var doneBtn = document.getElementById('low-income-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeLowIncomeForm();
                setTimeout(resetLowIncomeForm, 400);
            }, { once: true });
        }
    }

    function resetLowIncomeForm() {
        if (form) form.reset();
        
        var otherWrap  = document.getElementById('li-other-purpose-wrap');
        var otherInput = document.getElementById('li-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; otherWrap.classList.remove('li-animate-in'); }
        if (otherInput) { otherInput.removeAttribute('data-required'); otherInput.value = ''; }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        clearLowIncomeErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateLowIncomeForm() {
        clearLowIncomeErrors();
        var valid = true;

        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markLowIncomeError(field, 'This field is required.');
                    valid = false;
                }
            });
        }

        var phoneVal = getVal('li-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('li-phone');
            if (phoneEl) markLowIncomeError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        var amountVal = getVal('li-amount');
        if (amountVal !== '' && (isNaN(amountVal) || parseFloat(amountVal) < 0)) {
            var amountEl = document.getElementById('li-amount');
            if (amountEl) markLowIncomeError(amountEl, 'Enter a valid amount.');
            valid = false;
        }

        if (!valid && form) {
            var firstErr = form.querySelector('.li-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markLowIncomeError(field, msg) {
        var group = field.closest('.li-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.li-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearLowIncomeErrors() {
        if (form) {
            form.querySelectorAll('.li-field.has-error').forEach(function (g) {
                g.classList.remove('has-error');
                var errEl = g.querySelector('.li-error-msg');
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
    function buildLowIncomePromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="li-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="li-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">💰</div>
                <h2 class="rbi-confirm-title">Certificate of Low Income</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Certificate of Low Income.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="li-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text"><strong>No, Register Me</strong><small>Go to BRGY Registration (RBI)</small></span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="li-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text"><strong>Yes, Proceed</strong><small>Request Certificate of Low Income</small></span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildLiVerificationModal() HTML BLOCK HERE!

    // ── BUILD FORM HTML ─────────────────────────────────
    function buildLowIncomeFormModal() {
        var html = `
        <div class="residency-form-overlay" id="low-income-form-overlay" role="dialog" aria-modal="true">

            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="low-income-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">Certificate of Low Income</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="low-income-form-wrap">

                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST CERTIFICATE OF <span>LOW INCOME</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="low-income-request-form" novalidate>

                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="li-field">
                            <label class="rbi-label" for="li-fullname">
                                Full Name: <span class="req">*</span>
                            </label>
                            <input type="text" id="li-fullname" class="rbi-input readonly-field"
                                   data-required="true" placeholder="FULL NAME" maxlength="100" readonly>
                            <span class="li-error-msg"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-address">
                                Home Address: <span class="req">*</span>
                            </label>
                            <input type="text" id="li-address" class="rbi-input"
                                   data-required="true"
                                   placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="li-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="li-field">
                            <label class="rbi-label" for="li-purpose">
                                Purpose: <span class="req">*</span>
                            </label>
                            <select id="li-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Scholarship</option>
                                <option>Employment</option>
                                <option>Medical Assistance</option>
                                <option>Loan Application</option>
                                <option>Legal Purpose</option>
                                <option>Other</option>
                            </select>
                            <span class="li-error-msg"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-certificate">
                                Certificate: <span class="req">*</span>
                            </label>
                            <input type="text" id="li-certificate" class="rbi-input readonly-field"
                                   value="CERTIFICATE OF LOW INCOME" readonly>
                            <span class="li-error-msg"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-phone">
                                Cellphone Number: <span class="req">*</span>
                            </label>
                            <input type="tel" id="li-phone" class="rbi-input"
                                   data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="li-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 li-extra-row" id="li-other-purpose-wrap" style="display:none;">
                        <div class="li-field li-field-narrow">
                            <label class="rbi-label" for="li-other-purpose">Please specify purpose: <span class="req">*</span></label>
                            <input type="text" id="li-other-purpose" class="rbi-input" placeholder="SPECIFY YOUR PURPOSE" maxlength="150">
                            <span class="li-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-2">
                        <div class="li-field">
                            <label class="rbi-label" for="li-amount">
                                Amount: <span class="req">*</span>
                            </label>
                            <input type="number" id="li-amount" class="rbi-input"
                                   data-required="true" placeholder="0.00" min="0" step="0.01">
                            <span class="li-error-msg"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-work">
                                Work: <span class="req">*</span>
                            </label>
                            <input type="text" id="li-work" class="rbi-input"
                                   data-required="true" placeholder="WHAT IS YOUR WORK?" maxlength="100">
                            <span class="li-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="low-income-terms-check" class="rbi-checkbox">
                        <label for="low-income-terms-check" class="rbi-terms-label">
                            I agree and accept the
                            <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row">
                        <button type="submit" id="low-income-submit-btn" class="rbi-submit-btn" disabled>
                            <span>📋</span> Submit Request
                        </button>
                    </div>

                </form>
            </div>

            <div class="rbi-success" id="low-income-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">
                    Your Certificate of Low Income request has been submitted successfully.<br>
                    Please wait for confirmation from the Barangay Hall.
                </p>
                <div class="rbi-success-ref">Reference No: <span id="low-income-ref-number">—</span></div>
                <button id="low-income-done-btn" class="rbi-submit-btn">
                    <span>🏠</span> Back to Main Page
                </button>
            </div>

        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}