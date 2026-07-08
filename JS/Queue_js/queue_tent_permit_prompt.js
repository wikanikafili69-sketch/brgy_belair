// ========================================
// BARANGAY — QUEUE CERTIFICATE OF TENT PERMIT (BATCH LOGIC)
// JS/queue_tent_permit_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueTentPermitPrompt();
});

function initQueueTentPermitPrompt() {

    buildTentPermitFormModal();

    var formOverlay   = document.getElementById('tent-permit-form-overlay');
    var formBack      = document.getElementById('tent-permit-form-back');
    var form          = document.getElementById('tent-permit-request-form');
    var addBtn        = document.getElementById('tent-permit-add-btn');
    var termsCheck    = document.getElementById('tent-permit-terms-check');
    var formWrap      = document.getElementById('tent-permit-form-wrap');

    if (!formOverlay) return;

    // ========================================
// TENT PERMIT DROPDOWN + KEYBOARD NAV
// ========================================

const fullnameInput = document.getElementById('tp-fullname');

// CREATE DROPDOWN
let dropdown = document.createElement('div');

dropdown.className = 'autofill-dropdown';
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

// STATE
let activeIndex = -1;
let currentOptions = [];

// INPUT EVENT
if (fullnameInput) {

    fullnameInput.addEventListener('input', function () {

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

        matches.slice(0, 5).forEach((item, index) => {

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
            option.style.background = '#fff';

            option.onmouseover = () => {
                activeIndex = index;
                updateTPActiveItem();
            };

            option.onmouseout = () => {
                if (index !== activeIndex) {
                    option.style.background = '#fff';
                }
            };

            option.onclick = () => {
                fullnameInput.value = item.fullname.toUpperCase();

                // --- NEW AUTOFILL LOGIC ---
                // 1. Autofill Home Address
                const addressInput = document.getElementById('tp-address');
                if (addressInput && item.full_address && item.full_address.trim() !== '') {
                    addressInput.value = item.full_address.toUpperCase();
                }

                // 2. Autofill Cellphone Number
                const phoneInput = document.getElementById('tp-phone');
                if (phoneInput && item.contact_no && item.contact_no.trim() !== '') {
                    phoneInput.value = item.contact_no;
                }
                // --------------------------

                dropdown.style.display = 'none';
            };

            dropdown.appendChild(option);
            currentOptions.push(option);
        });

        const rect = fullnameInput.getBoundingClientRect();

        dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
        dropdown.style.left = (rect.left + window.scrollX) + 'px';
        dropdown.style.width = rect.width + 'px';
        dropdown.style.display = 'block';
    });

    // KEYBOARD NAV
    fullnameInput.addEventListener('keydown', function (e) {

        if (!currentOptions.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % currentOptions.length;
            updateTPActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateTPActiveItem();
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                currentOptions[activeIndex].click();
            }
        }
    });

    // CLICK OUTSIDE
    document.addEventListener('click', function (e) {
        if (!dropdown.contains(e.target) && e.target !== fullnameInput) {
            dropdown.style.display = 'none';
        }
    });
}

// ACTIVE ITEM + SCROLL FOLLOW
function updateTPActiveItem() {

    currentOptions.forEach((opt, i) => {

        if (i === activeIndex) {
            opt.style.background = '#e2e8f0';

            opt.scrollIntoView({
                block: 'nearest'
            });

        } else {
            opt.style.background = '#fff';
        }

    });

}

    // ── DYNAMICALLY LOAD FLATPICKR ──
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

    // ── INTERCEPT: Tent Permit service card click ─────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="tent-permit"]');
        if (card) {
            e.stopImmediatePropagation();
            if (!window.isEditing) {
                resetTentPermitFormToDefault();
            }
            openTentPermitForm(); 
        }
    });

    formBack.addEventListener('click', closeTentPermitForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeTentPermitForm();
    });

    // ── PURPOSE CHANGE — show/hide Other Purpose field ──────
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'tp-purpose') {
            toggleOtherPurpose(e.target.value);
        }
    });

    function toggleOtherPurpose(val) {
        var otherWrap  = document.getElementById('tp-other-purpose-wrap');
        var otherInput = document.getElementById('tp-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'block';
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
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

    // ── TERMS CHECKBOX ────────────────────────────────────
    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    // ── SAVE TO CART ──────────────────────────────────────
    function saveCurrentFormToCart() {
        if (!validateTentPermitForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Certificate of Tent Permit', 
            requestor_name: document.getElementById('tp-fullname').value, 
            fullname: document.getElementById('tp-fullname').value,
            address: document.getElementById('tp-address').value,
            purpose: document.getElementById('tp-purpose').value,
            other_purpose: document.getElementById('tp-other-purpose') ? document.getElementById('tp-other-purpose').value : '',
            phone: document.getElementById('tp-phone').value,
            date_used: document.getElementById('tp-date-used').value
        };

        if (window.editingIndex !== null) {
            cart[window.editingIndex] = formData;
            window.editingIndex = null;
        } else {
            cart.push(formData);
        }
        
        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        if (window.updateCartUI) window.updateCartUI();
        return true;
    }

    // ── MAIN BUTTON ACTION ────────────────────────────────
    addBtn.addEventListener('click', function() {
        if(saveCurrentFormToCart()) {
            closeTentPermitForm(); 
        }
    });

    // ── OPEN / CLOSE ──────────────────────────────────────
    function openTentPermitForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;

        loadFlatpickr(function() {
            flatpickr("#tp-date-used", {
                minDate: "today",     
                dateFormat: "F j, Y", 
                defaultDate: "today"  
            });
        });
    }
    
    function closeTentPermitForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetTentPermitFormToDefault, 300);
    }

    // ── RESET TO DEFAULT ──────────────────────────────────
    function resetTentPermitFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;

        form.reset();

        var dp = document.getElementById('tp-date-used');
        if (dp && dp._flatpickr) {
            dp._flatpickr.setDate("today");
        }

        var otherWrap  = document.getElementById('tp-other-purpose-wrap');
        var otherInput = document.getElementById('tp-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; }
        if (otherInput) { otherInput.removeAttribute('data-required'); }

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="tent-permit-terms-check" class="rbi-checkbox">
                <label for="tent-permit-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#tent-permit-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearTentPermitErrors();
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateTentPermitForm() {
        clearTentPermitErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            var wrap = field.closest('#tp-other-purpose-wrap, .rbi-row');
            if (wrap && window.getComputedStyle(wrap).display === 'none') return;

            if (!field.value.trim()) {
                markTentPermitError(field, 'This field is required.');
                valid = false;
            }
        });

        var phoneEl = document.getElementById('tp-phone');
        if (phoneEl && phoneEl.value.trim() && !/^\d{11}$/.test(phoneEl.value.trim())) {
            markTentPermitError(phoneEl, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
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
        form.querySelectorAll('.tp-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.tp-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    // ── BUILD FORM HTML ───────────────────────────────────
    function buildTentPermitFormModal() {
        if(document.getElementById('tent-permit-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="tent-permit-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="tent-permit-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
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
                            <label class="rbi-label" for="tp-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="tp-fullname" class="rbi-input" data-required="true" placeholder="FULL NAME" maxlength="100">
                            <span class="tp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-address">Home Address: <span class="req">*</span></label>
                            <input type="text" id="tp-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="tp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-purpose">Purpose: <span class="req">*</span></label>
                            <select id="tp-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Fiesta Celebration</option>
                                <option>Wedding Reception</option>
                                <option>Birthday Party</option>
                                <option>Community Event</option>
                                <option>Religious Activity</option>
                                <option>Other</option>
                            </select>
                            <span class="tp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="tp-certificate" class="rbi-input readonly-field" value="CERTIFICATE OF TENT PERMIT" readonly>
                            <span class="tp-error-msg"></span>
                        </div>
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="tp-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="tp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1" id="tp-other-purpose-wrap" style="display:none; margin-bottom: 20px;">
                        <div class="tp-field">
                            <label class="rbi-label" for="tp-other-purpose">Specify Purpose: <span class="req">*</span></label>
                            <input type="text" id="tp-other-purpose" class="rbi-input" placeholder="ENTER PURPOSE">
                            <span class="tp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1">
                        <div class="tp-field tp-field-narrow">
                            <label class="rbi-label" for="tp-date-used">Date Used: <span class="req">*</span></label>
                            <input type="text" id="tp-date-used" class="rbi-input" data-required="true" placeholder="Select Date" readonly>
                            <span class="tp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="tent-permit-terms-check" class="rbi-checkbox">
                        <label for="tent-permit-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="tent-permit-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

// ── GLOBAL POPULATE (EDIT MODE) ──
window.populateTentPermitForm = function(data) {

    window.isEditing = true;

    const tentCard = document.querySelector('.service-card[data-service="tent-permit"]');
    if (tentCard) tentCard.click();

    setTimeout(() => {

        const addBtn = document.getElementById('tent-permit-add-btn');

        document.getElementById('tp-fullname').value = data.fullname || '';
        document.getElementById('tp-address').value = data.address || '';
        document.getElementById('tp-phone').value = data.phone || '';

        const dateInput = document.getElementById('tp-date-used');
        dateInput.value = data.date_used || '';
        if (dateInput._flatpickr) {
            dateInput._flatpickr.setDate(data.date_used || '');
        }

        const purposeSelect = document.getElementById('tp-purpose');
        if (data.purpose) {
            purposeSelect.value = data.purpose;
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true })); 
        }
        
        if (data.other_purpose) {
            const otherInput = document.getElementById('tp-other-purpose');
            if (otherInput) otherInput.value = data.other_purpose;
        }

        const termsRow = document.getElementById('tent-permit-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }

    }, 150);
};