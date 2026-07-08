// ========================================
// BARANGAY — BUSINESS CLEARANCE PROMPT
// JS/index_business_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initBusinessPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initBusinessPrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); // <-- Toast Notification Container
    buildBusinessPromptModal();
    // WE REMOVED buildBizVerificationModal() HERE!
    buildBusinessFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay  = document.getElementById('biz-confirm-overlay');
    var btnYes         = document.getElementById('biz-confirm-yes');
    var btnNo          = document.getElementById('biz-confirm-no');
    var btnClose       = document.getElementById('biz-confirm-close');

    // WE REMOVED ALL THE OLD VERIFY VARIABLES HERE!

    var formOverlay    = document.getElementById('business-form-overlay');
    var formBack       = document.getElementById('business-form-back');
    var form           = document.getElementById('business-request-form');
    // Safety check for Main Submit Button
    var submitBtn      = form ? form.querySelector('button[type="submit"]') : null;
    
    var termsCheck     = document.getElementById('business-terms-check');
    var successWrap    = document.getElementById('business-success-wrap');
    var formWrap       = document.getElementById('business-form-wrap');
    
    var clearanceInput = document.getElementById('business-clearance');
    var kindField      = document.getElementById('biz-kind-field');
    var kindInput      = document.getElementById('business-kind');
    var typeRow        = document.getElementById('biz-type-row');

    if (!promptOverlay) return;

    // ── INTERCEPT: Business service card click ────────────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="business"]');
        if (card) {
            e.stopImmediatePropagation();
            var servicesOverlay = document.getElementById('services-overlay');
            if (servicesOverlay) servicesOverlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(openPrompt, 180);
        }
    }, true);

    // ── PROMPT CONTROLS ───────────────────────────────────────
    if (btnClose) btnClose.addEventListener('click', closePrompt);
    promptOverlay.addEventListener('click', function (e) {
        if (e.target === promptOverlay) closePrompt();
    });

    // ── THIS IS THE MAGIC LINK TO THE NEW UNIVERSAL SYSTEM ───
    // YES → Open Universal Verification Modal
    if (btnYes) {
        btnYes.addEventListener('click', function () {
            closePrompt();
            
            setTimeout(function() {
                // Open the new Universal System
                ResidentVerification.open(function(userData) {
                    // This runs ONLY if verification was successful!
                    var fullnameInput = document.getElementById('business-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the business form
                    setTimeout(openBusinessForm, 200);
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

    // ── RADIO CHANGE: toggle Kind of Business + layout ────────
    document.addEventListener('change', function (e) {
        if (!e.target || e.target.name !== 'biz-clearance-type') return;
        var val = e.target.value;
        if (clearanceInput) clearanceInput.value = val;
        var isSmall = (val === 'SMALL BUSINESS CLEARANCE' || val === 'SMALL BUSINESS CLEARANCE (DTI)');
        
        if (kindField) {
            if (isSmall) {
                kindField.classList.add('biz-kind-visible');
                if (kindInput) kindInput.setAttribute('data-required', 'true');
            } else {
                kindField.classList.remove('biz-kind-visible');
                if (kindInput) {
                    kindInput.removeAttribute('data-required');
                    kindInput.value = '';
                }
            }
        }
        if (typeRow) {
            typeRow.classList.toggle('rbi-row-3', isSmall);
            typeRow.classList.toggle('rbi-row-2', !isSmall);
        }
    });

    // ── TERMS & SUBMIT ────────────────────────────────────────
    if (termsCheck) {
        termsCheck.addEventListener('change', function () {
            if (submitBtn) submitBtn.disabled = !this.checked;
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateBusinessForm()) return;

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            var selectedRadio = document.querySelector('input[name="biz-clearance-type"]:checked');
            
            const payload = {
                queue_prefix: 'OB-',
                full_name: getVal('business-fullname'),
                clearance_type: selectedRadio ? selectedRadio.value : '',
                business_category: getVal('business-type'),
                kind_of_business: getVal('business-kind'),
                business_name: getVal('business-name'),
                business_address: getVal('business-address'),
                phone: getVal('business-phone')
            };

            fetch('API/Index/business_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    var ref = document.getElementById('business-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showBusinessSuccess();
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

    // ── HELPERS (OPEN/CLOSE) ──────────────────────────────────
    function openPrompt() { promptOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closePrompt() { promptOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    // WE REMOVED THE OLD openVerification AND closeVerification FUNCTIONS HERE!

    function openBusinessForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
    }
    
    // --> THIS IS THE FIX FOR THE BACK BUTTON
    if (formBack) {
        formBack.addEventListener('click', closeBusinessForm);
    }
    
    function closeBusinessForm() { formOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    // ── SUCCESS SCREEN ────────────────────────────────────────
    function showBusinessSuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');
        var doneBtn = document.getElementById('business-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeBusinessForm();
                setTimeout(resetBusinessForm, 400);
            }, { once: true });
        }
    }

    function resetBusinessForm() {
        if (form) form.reset();
        if (clearanceInput) clearanceInput.value = '';
        if (kindField) kindField.classList.remove('biz-kind-visible');
        if (kindInput) kindInput.removeAttribute('data-required');
        if (typeRow) { typeRow.classList.add('rbi-row-2'); typeRow.classList.remove('rbi-row-3'); }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        
        clearBusinessErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
    }

    // ── VALIDATION ────────────────────────────────────────────
    function validateBusinessForm() {
        clearBusinessErrors();
        var valid = true;
        
        var radioChecked = document.querySelector('input[name="biz-clearance-type"]:checked');
        if (!radioChecked) {
            var radioGroup = document.getElementById('biz-radio-group');
            if (radioGroup) {
                radioGroup.classList.add('has-error');
                var errEl = radioGroup.querySelector('.biz-error-msg');
                if (errEl) errEl.textContent = 'Please select a clearance type.';
            }
            valid = false;
        }
        
        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markBusinessError(field, 'This field is required.');
                    valid = false;
                }
            });
        }
        
        var phoneVal = getVal('business-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('business-phone');
            if (phoneEl) markBusinessError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }
        
        if (!valid && form) {
            var firstErr = form.querySelector('.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markBusinessError(field, msg) {
        var group = field.closest('.biz-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.biz-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearBusinessErrors() {
        if (form) {
            form.querySelectorAll('.biz-field.has-error, #biz-radio-group.has-error').forEach(function (g) {
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

    // ── BUILD HTML ────────────────────────────────────────────
    function buildBusinessPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="biz-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="biz-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">🏪</div>
                <h2 class="rbi-confirm-title">Business Clearance</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Business Clearance.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="biz-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text">
                            <strong>No, Register Me</strong>
                            <small>Go to BRGY Registration (RBI)</small>
                        </span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="biz-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text">
                            <strong>Yes, Proceed</strong>
                            <small>Request Business Clearance</small>
                        </span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildBizVerificationModal() HTML BLOCK HERE!

    function buildBusinessFormModal() {
        var html = `
        <div class="residency-form-overlay" id="business-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="business-form-back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">Business Clearance</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="business-form-wrap">
                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST BUSINESS <span>CLEARANCE</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="business-request-form" novalidate>
                    <div class="biz-radio-section" id="biz-radio-group">
                        <label class="rbi-label">Business Clearance Type: <span class="req">*</span></label>
                        <div class="biz-radio-group">
                            <label class="biz-radio-label"><input type="radio" name="biz-clearance-type" value="BUSINESS PERMIT" class="biz-radio"><span class="biz-radio-custom"></span> BUSINESS PERMIT</label>
                            <label class="biz-radio-label"><input type="radio" name="biz-clearance-type" value="SMALL BUSINESS CLEARANCE" class="biz-radio"><span class="biz-radio-custom"></span> SMALL BUSINESS CLEARANCE</label>
                            <label class="biz-radio-label"><input type="radio" name="biz-clearance-type" value="SMALL BUSINESS CLEARANCE (DTI)" class="biz-radio"><span class="biz-radio-custom"></span> SMALL BUSINESS CLEARANCE (DTI)</label>
                        </div>
                        <span class="biz-error-msg"></span>
                    </div>

                    <div class="biz-section-divider"></div>

                    <div class="rbi-row rbi-row-2" id="biz-type-row">
                        <div class="biz-field">
                            <label class="rbi-label" for="business-type">Type: <span class="req">*</span></label>
                            <select id="business-type" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>New</option><option>Renewal</option><option>Amendment</option><option>Closure</option>
                            </select>
                            <span class="biz-error-msg"></span>
                        </div>
                        <div class="biz-field biz-kind-field" id="biz-kind-field">
                            <label class="rbi-label" for="business-kind">Kind of Business: <span class="req">*</span></label>
                            <input type="text" id="business-kind" class="rbi-input" placeholder="ENTER TYPE OF BUSINESS">
                            <span class="biz-error-msg"></span>
                        </div>
                        <div class="biz-field">
                            <label class="rbi-label" for="business-name">Business Name:</label>
                            <input type="text" id="business-name" class="rbi-input" placeholder="">
                        </div>
                    </div>

                    <div class="biz-section-divider"></div>
                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="biz-field">
                            <label class="rbi-label" for="business-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="business-fullname" class="rbi-input readonly-field" data-required="true" readonly>
                            <span class="biz-error-msg"></span>
                        </div>
                        <div class="biz-field">
                            <label class="rbi-label" for="business-address">Business Address:</label>
                            <input type="text" id="business-address" class="rbi-input" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY">
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-2">
                        <div class="biz-field">
                            <label class="rbi-label" for="business-clearance">Clearance: <span class="req">*</span></label>
                            <input type="text" id="business-clearance" class="rbi-input readonly-field" placeholder="" readonly>
                            <span class="biz-error-msg"></span>
                        </div>
                        <div class="biz-field">
                            <label class="rbi-label" for="business-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="business-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="biz-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row"><input type="checkbox" id="business-terms-check" class="rbi-checkbox"> <label for="business-terms-check" class="rbi-terms-label">I agree and accept the <a href="terms.php" target="_blank">terms and conditions</a></label></div>
                    <div class="rbi-submit-row"><button type="submit" id="business-submit-btn" class="rbi-submit-btn" disabled><span>📋</span> Submit Request</button></div>
                </form>
            </div>

            <div class="rbi-success" id="business-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">Your Business Clearance request has been submitted successfully.</p>
                <div class="rbi-success-ref">Reference No: <span id="business-ref-number">—</span></div>
                <button id="business-done-btn" class="rbi-submit-btn"><span>🏠</span> Back to Main Page</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}