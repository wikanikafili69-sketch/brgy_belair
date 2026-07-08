// ========================================
// BARANGAY — CERTIFICATE OF INDIGENCY PROMPT
// JS/index_indigency_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initIndigencyPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initIndigencyPrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); // <-- Toast Notification Container
    buildIndigencyPromptModal();
    // WE REMOVED buildIndVerificationModal() HERE! 
    buildIndigencyFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay   = document.getElementById('ind-confirm-overlay');
    var btnYes          = document.getElementById('ind-confirm-yes');
    var btnNo           = document.getElementById('ind-confirm-no');
    var btnClose        = document.getElementById('ind-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay     = document.getElementById('indigency-form-overlay');
    var formBack        = document.getElementById('indigency-form-back');
    var form            = document.getElementById('indigency-request-form');
    // Safety check for Main Submit Button
    var submitBtn       = form ? form.querySelector('button[type="submit"]') : null;
    
    var termsCheck      = document.getElementById('indigency-terms-check');
    var successWrap     = document.getElementById('indigency-success-wrap');
    var formWrap        = document.getElementById('indigency-form-wrap');

    if (!promptOverlay) return;

    // ── INTERCEPT: Indigency service card click ───────────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="indigency"]');
        if (card) {
            e.stopImmediatePropagation();
            var servicesOverlay = document.getElementById('services-overlay');
            if (servicesOverlay) servicesOverlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(openPrompt, 180);
        }
    }, true);

    // ── EVENT LISTENERS (RADIO & PURPOSE DROPDOWN) ────────────
    document.addEventListener('change', function (e) {
        if (!e.target) return;
        
        // Handle Certificate Type change
        if (e.target.name === 'ind-cert-type') {
            applyIndigencyLayout(e.target.value);
        }
        
        // Handle Purpose Dropdown change (Show/Hide Other field)
        if (e.target.id === 'indigency-purpose') {
            toggleIndOtherPurpose(e.target.value);
        }
    });

    function toggleIndOtherPurpose(val) {
        var otherWrap  = document.getElementById('ind-other-purpose-wrap');
        var otherInput = document.getElementById('ind-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('ind-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('ind-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.ind-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.ind-error-msg');
                    if (errEl) errEl.textContent = '';
                }
            }
        }
    }

    function applyIndigencyLayout(val) {
        var isClaimant = (val === 'CERTIFICATE OF INDIGENCY (CLAIMANT)');
        var clearanceInput = document.getElementById('indigency-clearance');
        if (clearanceInput) clearanceInput.value = val;

        var mainInfoRow = document.getElementById('ind-info-row');
        if (mainInfoRow) {
            mainInfoRow.className = 'rbi-row ' + (isClaimant ? 'rbi-row-3' : 'rbi-row-2');
        }

        var authorizedWrap = document.getElementById('ind-authorized-wrap');
        var authorizedInput = document.getElementById('indigency-authorized');
        if (authorizedWrap) {
            if (isClaimant) {
                authorizedWrap.style.display = 'flex';
                authorizedWrap.classList.add('ind-animate-in');
                if (authorizedInput) authorizedInput.setAttribute('data-required', 'true');
            } else {
                authorizedWrap.style.display = 'none';
                authorizedWrap.classList.remove('ind-animate-in');
                if (authorizedInput) {
                    authorizedInput.removeAttribute('data-required');
                    authorizedInput.value = '';
                }
            }
        }

        var householdWrap   = document.getElementById('ind-household-wrap');
        var householdSelect = document.getElementById('indigency-household');
        if (householdWrap) {
            if (isClaimant) {
                householdWrap.style.display = 'flex';
                householdWrap.classList.add('ind-animate-in');
                if (householdSelect) householdSelect.setAttribute('data-required', 'true');
            } else {
                householdWrap.style.display = 'none';
                householdWrap.classList.remove('ind-animate-in');
                if (householdSelect) {
                    householdSelect.removeAttribute('data-required');
                    householdSelect.value = '';
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
                    var fullnameInput = document.getElementById('indigency-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the indigency form
                    setTimeout(openIndigencyForm, 200);
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

    // ── TERMS & SUBMIT ────────────────────────────────────────
    if (termsCheck) {
        termsCheck.addEventListener('change', function () {
            if (submitBtn) submitBtn.disabled = !this.checked;
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!validateIndigencyForm()) return;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            var selectedRadio = document.querySelector('input[name="ind-cert-type"]:checked');
            
            const payload = {
                queue_prefix: 'OI-',
                full_name: getVal('indigency-fullname'),
                home_address: getVal('indigency-address'),
                certificate_type: selectedRadio ? selectedRadio.value : '',
                authorized_person: getVal('indigency-authorized'),
                household_type: getVal('indigency-household'),
                purpose: getVal('indigency-purpose'),
                other_purpose_details: getVal('ind-other-purpose'), // <-- ADDED FOR "OTHER"
                phone: getVal('indigency-phone')
            };

            fetch('API/Index/indigency_api_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    var ref = document.getElementById('indigency-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    showIndigencySuccess();
                } else {
                    showToast('Submission Error: ' + data.message, "error");
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>📋</span> Submit Request';
                    }
                }
            })
            .catch(err => {
                showToast('A network error occurred.', "error");
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

    // WE REMOVED openVerification AND closeVerification HERE!

    function openIndigencyForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
    }
    
    if (formBack) {
        formBack.addEventListener('click', closeIndigencyForm);
    }
    
    function closeIndigencyForm() { formOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    // ── SUCCESS SCREEN ────────────────────────────────────────
    function showIndigencySuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');
        var doneBtn = document.getElementById('indigency-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeIndigencyForm();
                setTimeout(resetIndigencyForm, 400);
            }, { once: true });
        }
    }

    function resetIndigencyForm() {
        if (form) form.reset();
        var authorizedWrap = document.getElementById('ind-authorized-wrap');
        var householdWrap  = document.getElementById('ind-household-wrap');
        var mainInfoRow    = document.getElementById('ind-info-row');
        var otherWrap      = document.getElementById('ind-other-purpose-wrap');
        var otherInput     = document.getElementById('ind-other-purpose');

        if (authorizedWrap) { authorizedWrap.style.display = 'none'; authorizedWrap.classList.remove('ind-animate-in'); }
        if (householdWrap)  { householdWrap.style.display  = 'none'; householdWrap.classList.remove('ind-animate-in'); }
        if (mainInfoRow)    mainInfoRow.className = 'rbi-row rbi-row-2';
        if (otherWrap)      { otherWrap.style.display = 'none'; otherWrap.classList.remove('ind-animate-in'); }
        if (otherInput)     { otherInput.removeAttribute('data-required'); otherInput.value = ''; }
        
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        clearIndigencyErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
    }

    // ── VALIDATION ────────────────────────────────────────────
    function validateIndigencyForm() {
        clearIndigencyErrors();
        var valid = true;
        
        var radioChecked = document.querySelector('input[name="ind-cert-type"]:checked');
        if (!radioChecked) {
            var radioGroup = document.getElementById('ind-radio-group');
            if (radioGroup) {
                radioGroup.classList.add('has-error');
                var errEl = radioGroup.querySelector('.ind-error-msg');
                if (errEl) errEl.textContent = 'Please select a certificate type.';
            }
            valid = false;
        }
        
        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markIndigencyError(field, 'This field is required.');
                    valid = false;
                }
            });
        }
        
        var phoneVal = getVal('indigency-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('indigency-phone');
            if (phoneEl) markIndigencyError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }
        
        if (!valid && form) {
            var firstErr = form.querySelector('.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markIndigencyError(field, msg) {
        var group = field.closest('.ind-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.ind-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearIndigencyErrors() {
        if (form) {
            form.querySelectorAll('.ind-field.has-error, #ind-radio-group.has-error').forEach(function (g) {
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
        
        var style = document.createElement('style');
        style.innerHTML = `
            .rbi-toast-container {
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 2147483647; /* Boosted to show over modal */
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

    // ── BUILD HTML ────────────────────────────────────────────
    function buildIndigencyPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="ind-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="ind-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">🤝</div>
                <h2 class="rbi-confirm-title">Certificate of Indigency</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a Certificate of Indigency.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="ind-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text"><strong>No, Register Me</strong><small>Go to BRGY Registration (RBI)</small></span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="ind-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text"><strong>Yes, Proceed</strong><small>Request Certificate of Indigency</small></span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildIndVerificationModal() HTML BLOCK HERE!

    function buildIndigencyFormModal() {
        var html = `
        <div class="residency-form-overlay" id="indigency-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="indigency-form-back"><svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Back</button>
                <div class="rbi-topbar-title"><span class="rbi-topbar-eyebrow">Barangay Name Here</span><p class="rbi-topbar-heading">Certificate of Indigency</p></div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="indigency-form-wrap">
                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST CERTIFICATE OF <span>INDIGENCY</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="indigency-request-form" novalidate>
                    <div class="biz-radio-section" id="ind-radio-group">
                        <label class="rbi-label">Certificate Type: <span class="req">*</span></label>
                        <div class="biz-radio-group">
                            <label class="biz-radio-label"><input type="radio" name="ind-cert-type" value="CERTIFICATE OF INDIGENCY" class="biz-radio"><span class="biz-radio-custom"></span> CERTIFICATE OF INDIGENCY</label>
                            <label class="biz-radio-label"><input type="radio" name="ind-cert-type" value="CERTIFICATE OF INDIGENCY (CLAIMANT)" class="biz-radio"><span class="biz-radio-custom"></span> CERTIFICATE OF INDIGENCY (CLAIMANT)</label>
                        </div>
                        <span class="ind-error-msg"></span>
                    </div>

                    <div class="biz-section-divider"></div>

                    <div class="rbi-row rbi-row-1 ind-claimant-extra" id="ind-authorized-wrap" style="display:none;">
                        <div class="ind-field"><label class="rbi-label" for="indigency-authorized">Authorized Person: <span class="req">*</span></label><input type="text" id="indigency-authorized" class="rbi-input" placeholder="NAME OF AUTHORIZED PERSON"></div>
                    </div>

                    <div class="rbi-row rbi-row-2" id="ind-info-row">
                        <div class="ind-field"><label class="rbi-label" for="indigency-fullname">Full Name: <span class="req">*</span></label><input type="text" id="indigency-fullname" class="rbi-input readonly-field" data-required="true" readonly></div>
                        <div class="ind-field"><label class="rbi-label" for="indigency-address">Home Address: <span class="req">*</span></label><input type="text" id="indigency-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY"></div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="ind-field"><label class="rbi-label" for="indigency-purpose">Purpose: <span class="req">*</span></label><select id="indigency-purpose" class="rbi-select" data-required="true"><option value="">— Select —</option><option>Medical Assistance</option><option>Financial Assistance</option><option>Government Benefit</option><option>Scholarship</option><option>Legal Aid</option><option>Other</option></select></div>
                        <div class="ind-field"><label class="rbi-label" for="indigency-clearance">Clearance: <span class="req">*</span></label><input type="text" id="indigency-clearance" class="rbi-input readonly-field" readonly></div>
                        <div class="ind-field"><label class="rbi-label" for="indigency-phone">Cellphone Number: <span class="req">*</span></label><input type="tel" id="indigency-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11"></div>
                    </div>

                    <div class="rbi-row rbi-row-1 ind-extra-row" id="ind-other-purpose-wrap" style="display:none;">
                        <div class="ind-field ind-field-narrow">
                            <label class="rbi-label" for="ind-other-purpose">Please specify purpose: <span class="req">*</span></label>
                            <input type="text" id="ind-other-purpose" class="rbi-input" placeholder="SPECIFY YOUR PURPOSE" maxlength="150">
                            <span class="ind-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 ind-claimant-extra" id="ind-household-wrap" style="display:none;">
                        <div class="ind-field ind-field-narrow"><label class="rbi-label" for="indigency-household">Household Type: <span class="req">*</span></label><select id="indigency-household" class="rbi-select"><option value="">— SELECT —</option><option>Single Family</option><option>Extended Family</option><option>Multi-Family</option><option>Single Person</option></select></div>
                    </div>

                    <div class="rbi-terms-row"><input type="checkbox" id="indigency-terms-check" class="rbi-checkbox"> <label for="indigency-terms-check" class="rbi-terms-label">I agree and accept the <a href="terms.php" target="_blank">terms and conditions</a></label></div>
                    <div class="rbi-submit-row"><button type="submit" id="indigency-submit-btn" class="rbi-submit-btn" disabled><span>📋</span> Submit Request</button></div>
                </form>
            </div>

            <div class="rbi-success" id="indigency-success-wrap">
                <div class="rbi-success-icon">✅</div><h2 class="rbi-success-title">Request Submitted!</h2><p class="rbi-success-sub">Your Certificate of Indigency request has been submitted successfully.</p><div class="rbi-success-ref">Reference No: <span id="indigency-ref-number">—</span></div><button id="indigency-done-btn" class="rbi-submit-btn"><span>🏠</span> Back to Main Page</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}