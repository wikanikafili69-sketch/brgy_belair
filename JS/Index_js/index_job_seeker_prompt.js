// ========================================
// BARANGAY — FIRST TIME JOB SEEKER
// JS/index_job_seeker_prompt.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initJobSeekerPrompt();
});

// ── SAFE VALUE GETTER (Prevents "null" crashes) ───────────
function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function initJobSeekerPrompt() {

    // ── INJECT MODALS & UI ────────────────────────────────────
    buildToastUI(); // <-- Toast Notification Container
    buildJobSeekerPromptModal();
    // WE REMOVED buildJsVerificationModal() HERE!
    buildJobSeekerFormModal();

    // ── CACHE REFS ────────────────────────────────────────────
    var promptOverlay = document.getElementById('js-confirm-overlay');
    var btnYes        = document.getElementById('js-confirm-yes');
    var btnNo         = document.getElementById('js-confirm-no');
    var btnClose      = document.getElementById('js-confirm-close');

    // WE REMOVED THE OLD VERIFY VARIABLES HERE!

    var formOverlay   = document.getElementById('job-seeker-form-overlay');
    var formBack      = document.getElementById('job-seeker-form-back');
    var form          = document.getElementById('job-seeker-request-form');
    // Safety check for Main Submit Button
    var submitBtn     = form ? form.querySelector('button[type="submit"]') : null;
    var termsCheck    = document.getElementById('job-seeker-terms-check');
    var successWrap   = document.getElementById('job-seeker-success-wrap');
    var formWrap      = document.getElementById('job-seeker-form-wrap');

    if (!promptOverlay) return;

    // ── INTERCEPT: Job Seeker service card click ──────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="job-seeker"]');
        if (card) {
            e.stopImmediatePropagation();
            var servicesOverlay = document.getElementById('services-overlay');
            if (servicesOverlay) servicesOverlay.classList.remove('active');
            document.body.style.overflow = '';
            setTimeout(openPrompt, 180);
        }
    }, true);

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
                    var fullnameInput = document.getElementById('js-fullname');
                    if (fullnameInput) fullnameInput.value = userData.full_name;
                    
                    // Proceed to open the form
                    setTimeout(openJobSeekerForm, 200);
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
    if (formBack) formBack.addEventListener('click', closeJobSeekerForm);

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
            if (!validateJobSeekerForm()) return;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>⏳</span> Submitting...';
            }

            // 1. Gather form data
            const payload = {
                queue_prefix: 'OJS-', 
                full_name: getVal('js-fullname'),
                home_address: getVal('js-address'),
                residency_duration: getVal('js-years-months'),
                phone: getVal('js-phone')
            };

            // 2. Send to PHP API
            fetch('API/Index/job_seeker_api_insert.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.success) {
                    var ref = document.getElementById('job-seeker-ref-number');
                    if (ref) ref.textContent = data.queue_no;
                    
                    showJobSeekerSuccess();
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

    function openJobSeekerForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
        formOverlay.scrollTop = 0;
    }
    function closeJobSeekerForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── SUCCESS SCREEN ────────────────────────────────────
    function showJobSeekerSuccess() {
        if (formWrap) formWrap.style.display = 'none';
        if (successWrap) successWrap.classList.add('visible');

        var doneBtn = document.getElementById('job-seeker-done-btn');
        if (doneBtn) {
            doneBtn.addEventListener('click', function () {
                closeJobSeekerForm();
                setTimeout(resetJobSeekerForm, 400);
            }, { once: true });
        }
    }

    function resetJobSeekerForm() {
        if (form) form.reset();
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>📋</span> Submit Request';
        }
        clearJobSeekerErrors();
        if (formWrap) formWrap.style.display = '';
        if (successWrap) successWrap.classList.remove('visible');
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateJobSeekerForm() {
        clearJobSeekerErrors();
        var valid = true;

        if (form) {
            form.querySelectorAll('[data-required="true"]').forEach(function (field) {
                var val = field.value || '';
                if (!val.trim()) {
                    markJobSeekerError(field, 'This field is required.');
                    valid = false;
                }
            });
        }

        var phoneVal = getVal('js-phone');
        if (phoneVal && !/^\d{11}$/.test(phoneVal)) {
            var phoneEl = document.getElementById('js-phone');
            if (phoneEl) markJobSeekerError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid && form) {
            var firstErr = form.querySelector('.js-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markJobSeekerError(field, msg) {
        var group = field.closest('.js-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.js-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearJobSeekerErrors() {
        if (form) {
            form.querySelectorAll('.js-field.has-error').forEach(function (g) {
                g.classList.remove('has-error');
                var errEl = g.querySelector('.js-error-msg');
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
    function buildJobSeekerPromptModal() {
        var html = `
        <div class="rbi-confirm-overlay" id="js-confirm-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal">
                <button class="rbi-confirm-close" id="js-confirm-close" aria-label="Close">✕</button>
                <div class="rbi-confirm-icon">💼</div>
                <h2 class="rbi-confirm-title">First Time Job Seeker</h2>
                <p class="rbi-confirm-question">Have you already registered as a resident <strong>(RBI)</strong>?</p>
                <p class="rbi-confirm-sub">You must be registered in the Barangay Resident Information (RBI) system before you can request a First Time Job Seeker certificate.</p>
                <div class="rbi-confirm-actions">
                    <button class="rbi-confirm-btn rbi-confirm-btn--no" id="js-confirm-no">
                        <span class="rbi-confirm-btn-icon">📝</span>
                        <span class="rbi-confirm-btn-text"><strong>No, Register Me</strong><small>Go to BRGY Registration (RBI)</small></span>
                    </button>
                    <button class="rbi-confirm-btn rbi-confirm-btn--yes" id="js-confirm-yes">
                        <span class="rbi-confirm-btn-icon">✅</span>
                        <span class="rbi-confirm-btn-text"><strong>Yes, Proceed</strong><small>Request First Time Job Seeker</small></span>
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // WE REMOVED THE ENTIRE buildJsVerificationModal() HTML BLOCK HERE!

    // ── BUILD FORM HTML ───────────────────────────────────
    function buildJobSeekerFormModal() {
        var html = `
        <div class="residency-form-overlay" id="job-seeker-form-overlay" role="dialog" aria-modal="true">

            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="job-seeker-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Name Here</span>
                    <p class="rbi-topbar-heading">First Time Job Seeker</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="job-seeker-form-wrap">

                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST <span>FIRST TIME JOB SEEKER</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="job-seeker-request-form" novalidate>

                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="js-field">
                            <label class="rbi-label" for="js-fullname">
                                Full Name: <span class="req">*</span>
                            </label>
                            <input type="text" id="js-fullname" class="rbi-input readonly-field"
                                   data-required="true" placeholder="FULL NAME" maxlength="100" readonly>
                            <span class="js-error-msg"></span>
                        </div>
                        <div class="js-field">
                            <label class="rbi-label" for="js-address">
                                Home Address: <span class="req">*</span>
                            </label>
                            <input type="text" id="js-address" class="rbi-input"
                                   data-required="true"
                                   placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="js-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="js-field">
                            <label class="rbi-label" for="js-years-months">
                                Years/Months: <span class="req">*</span>
                            </label>
                            <input type="text" id="js-years-months" class="rbi-input"
                                   data-required="true" placeholder="YEARS/MONTHS" maxlength="50">
                            <span class="js-error-msg"></span>
                        </div>
                        <div class="js-field">
                            <label class="rbi-label" for="js-certificate">
                                Certificate: <span class="req">*</span>
                            </label>
                            <input type="text" id="js-certificate" class="rbi-input readonly-field"
                                   value="FIRST TIME JOB SEEKER" readonly>
                            <span class="js-error-msg"></span>
                        </div>
                        <div class="js-field">
                            <label class="rbi-label" for="js-phone">
                                Cellphone Number: <span class="req">*</span>
                            </label>
                            <input type="tel" id="js-phone" class="rbi-input"
                                   data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="js-error-msg"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="job-seeker-terms-check" class="rbi-checkbox">
                        <label for="job-seeker-terms-check" class="rbi-terms-label">
                            I agree and accept the
                            <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row">
                        <button type="submit" id="job-seeker-submit-btn" class="rbi-submit-btn" disabled>
                            <span>📋</span> Submit Request
                        </button>
                    </div>

                </form>
            </div>

            <div class="rbi-success" id="job-seeker-success-wrap">
                <div class="rbi-success-icon">✅</div>
                <h2 class="rbi-success-title">Request Submitted!</h2>
                <p class="rbi-success-sub">
                    Your First Time Job Seeker request has been submitted successfully.<br>
                    Please wait for confirmation from the Barangay Hall.
                </p>
                <div class="rbi-success-ref">Reference No: <span id="job-seeker-ref-number">—</span></div>
                <button id="job-seeker-done-btn" class="rbi-submit-btn">
                    <span>🏠</span> Back to Main Page
                </button>
            </div>

        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}