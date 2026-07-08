// ========================================
// BARANGAY — LEGAL GUARDIAN CERTIFICATE
// JS/index_legal_guardian_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initLegalGuardianPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initLegalGuardianPrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); // <-- Toast Notification Container
    buildLegalGuardianPromptModal();
    // WE REMOVED buildLgVerificationModal() HERE!
    buildLegalGuardianFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay = document.getElementById('lg-confirm-overlay');
    var btnYes        = document.getElementById('lg-confirm-yes');
    var btnNo         = document.getElementById('lg-confirm-no');
    var btnClose      = document.getElementById('lg-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay   = document.getElementById('legal-guardian-form-overlay');
    var formBack      = document.getElementById('legal-guardian-form-back');
    var form          = document.getElementById('legal-guardian-request-form');
    // Safety check for Main Submit Button
    var submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
    var termsCheck    = document.getElementById('legal-guardian-terms-check');
    var successWrap   = document.getElementById('legal-guardian-success-wrap');
    var formWrap      = document.getElementById('legal-guardian-form-wrap');

    if (!promptOverlay) return;

    // ── INTERCEPT: Legal Guardian service card click ──────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="legal-guardian"]');
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
        if (e.target && e.target.id === 'lg-purpose') {
            toggleLgOtherPurpose(e.target.value);
        }
    });

    function toggleLgOtherPurpose(val) {
        var otherWrap  = document.getElementById('lg-other-purpose-wrap');
        var otherInput = document.getElementById('lg-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('lg-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('lg-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.lg-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.lg-error-msg');
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
                    var fullnameInput = document.getElementById('lg-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the form
                    setTimeout(openLegalGuardianForm, 200);
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
    if (formBack) formBack.addEventListener('click', closeLegalGuardianForm);

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
            if (!validateLegalGuardianForm()) return;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            // 1. Gather form data
            const payload = {
                queue_prefix: 'OLG-',
                full_name: getVal('lg-fullname'),
                legal_guardian_name: getVal('lg-guardian'),
                home_address: getVal('lg-address'),
                purpose: getVal('lg-purpose'),
                other_purpose_details: getVal('lg-other-purpose'), // <-- ADDED FOR "OTHER"
                phone: getVal('lg-phone')
            };

            // 2. Send to PHP API
            fetch('API/Index/legal_guardian_api_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.success) {
                    var ref = document.getElementById('legal-guardian-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showLegalGuardianSuccess();
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

    function openLegalGuardianForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
    }
    function closeLegalGuardianForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── SUCCESS SCREEN ────────────────────────────────────
    function showLegalGuardianSuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');

        var doneBtn = document.getElementById('legal-guardian-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeLegalGuardianForm();
                setTimeout(resetLegalGuardianForm, 400);
            }, { once: true });
        }
    }

    function resetLegalGuardianForm() {
        if (form) form.reset();
        
        var otherWrap  = document.getElementById('lg-other-purpose-wrap');
        var otherInput = document.getElementById('lg-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; otherWrap.classList.remove('lg-animate-in'); }
        if (otherInput) { otherInput.removeAttribute('data-required'); otherInput.value = ''; }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        clearLegalGuardianErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateLegalGuardianForm() {
        clearLegalGuardianErrors();
        var valid = true;

        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markLegalGuardianError(field, 'This field is required.');
                    valid = false;
                }
            });
        }

        var phoneVal = getVal('lg-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('lg-phone');
            if (phoneEl) markLegalGuardianError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid && form) {
            var firstErr = form.querySelector('.lg-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markLegalGuardianError(field, msg) {
        var group = field.closest('.lg-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.lg-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearLegalGuardianErrors() {
        if (form) {
            form.querySelectorAll('.lg-field.has-error').forEach(function (g) {
                g.classList.remove('has-error');
                var errEl = g.querySelector('.lg-error-msg');
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
    function buildLegalGuardianPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="lg-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="lg-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">👨‍👧</div>
                <h2 class="rbi-confirm-title">Legal Guardian Certificate</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Legal Guardian Certificate.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="lg-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text"><strong>No, Register Me</strong><small>Go to BRGY Registration (RBI)</small></span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="lg-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text"><strong>Yes, Proceed</strong><small>Request Legal Guardian Certificate</small></span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildLgVerificationModal() HTML BLOCK HERE!

    // ── BUILD FORM HTML ───────────────────────────────────
    function buildLegalGuardianFormModal() {
        var html = `
        <div class="residency-form-overlay" id="legal-guardian-form-overlay" role="dialog" aria-modal="true">

            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="legal-guardian-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">Legal Guardian Certificate</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="legal-guardian-form-wrap">

                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST <span>LEGAL GUARDIAN CERTIFICATE</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="legal-guardian-request-form" novalidate>

                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-3">
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-fullname">
                                Full Name: <span class="req">*</span>
                            </label>
                            <input type="text" id="lg-fullname" class="rbi-input readonly-field"
                                   data-required="true" placeholder="FULL NAME" maxlength="100" readonly>
                            <span class="lg-error-msg"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-guardian">
                                Legal Guardian: <span class="req">*</span>
                            </label>
                            <input type="text" id="lg-guardian" class="rbi-input"
                                   data-required="true" placeholder="LEGAL GUARDIAN" maxlength="100">
                            <span class="lg-error-msg"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-address">
                                Home Address: <span class="req">*</span>
                            </label>
                            <input type="text" id="lg-address" class="rbi-input"
                                   data-required="true"
                                   placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="lg-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-purpose">
                                Purpose: <span class="req">*</span>
                            </label>
                            <select id="lg-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>School Enrollment</option>
                                <option>Medical Consent</option>
                                <option>Travel Authorization</option>
                                <option>Financial Transactions</option>
                                <option>Legal Proceedings</option>
                                <option>Other</option>
                            </select>
                            <span class="lg-error-msg"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-certificate">
                                Certificate: <span class="req">*</span>
                            </label>
                            <input type="text" id="lg-certificate" class="rbi-input readonly-field"
                                   value="LEGAL GUARDIAN CERTIFICATE" readonly>
                            <span class="lg-error-msg"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-phone">
                                Cellphone Number: <span class="req">*</span>
                            </label>
                            <input type="tel" id="lg-phone" class="rbi-input"
                                   data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="lg-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 lg-extra-row" id="lg-other-purpose-wrap" style="display:none;">
                        <div class="lg-field lg-field-narrow">
                            <label class="rbi-label" for="lg-other-purpose">Please specify purpose: <span class="req">*</span></label>
                            <input type="text" id="lg-other-purpose" class="rbi-input" placeholder="SPECIFY YOUR PURPOSE" maxlength="150">
                            <span class="lg-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="legal-guardian-terms-check" class="rbi-checkbox">
                        <label for="legal-guardian-terms-check" class="rbi-terms-label">
                            I agree and accept the
                            <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row">
                        <button type="submit" id="legal-guardian-submit-btn" class="rbi-submit-btn" disabled>
                            <span>📋</span> Submit Request
                        </button>
                    </div>

                </form>
            </div>

            <div class="rbi-success" id="legal-guardian-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">
                    Your Legal Guardian Certificate request has been submitted successfully.<br>
                    Please wait for confirmation from the Barangay Hall.
                </p>
                <div class="rbi-success-ref">Reference No: <span id="legal-guardian-ref-number">—</span></div>
                <button id="legal-guardian-done-btn" class="rbi-submit-btn">
                    <span>🏠</span> Back to Main Page
                </button>
            </div>

        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}