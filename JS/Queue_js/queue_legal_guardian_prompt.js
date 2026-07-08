// ========================================
// BARANGAY — QUEUE LEGAL GUARDIAN CERTIFICATE (BATCH LOGIC)
// JS/queue_legal_guardian_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueLegalGuardianPrompt();
});

function initQueueLegalGuardianPrompt() {

    buildLegalGuardianFormModal();

    var formOverlay   = document.getElementById('legal-guardian-form-overlay');
    var formBack      = document.getElementById('legal-guardian-form-back');
    var form          = document.getElementById('legal-guardian-request-form');
    var addBtn        = document.getElementById('legal-guardian-add-btn');
    var termsCheck    = document.getElementById('legal-guardian-terms-check');
    var formWrap      = document.getElementById('legal-guardian-form-wrap');

    if (!formOverlay) return;

    // ========================================
// LEGAL GUARDIAN DROPDOWN (2 INPUTS)
// fullname + guardian
// ========================================

const inputs = [
    document.getElementById('lg-fullname'),
    document.getElementById('lg-guardian')
];

// CREATE ONE DROPDOWN
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
let currentInput = null;

// LOOP BOTH INPUTS
inputs.forEach(fullnameInput => {

    if (!fullnameInput) return;

    // INPUT EVENT
    fullnameInput.addEventListener('input', function () {

        currentInput = this;

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
                updateLGActiveItem();
            };

            option.onmouseout = () => {
                if (index !== activeIndex) {
                    option.style.background = '#fff';
                }
            };

            option.onclick = () => {
                currentInput.value = item.fullname.toUpperCase();

                // --- NEW AUTOFILL LOGIC ---
                // Only autofill Address and Phone if the user is typing in the Legal Guardian field
                if (currentInput.id === 'lg-guardian') {
                    
                    // 1. Autofill Address
                    const addressInput = document.getElementById('lg-address');
                    if (addressInput && item.full_address && item.full_address.trim() !== '') {
                        addressInput.value = item.full_address.toUpperCase();
                    }

                    // 2. Autofill Cellphone Number
                    const phoneInput = document.getElementById('lg-phone');
                    if (phoneInput && item.contact_no && item.contact_no.trim() !== '') {
                        phoneInput.value = item.contact_no;
                    }
                }
                // If currentInput.id === 'lg-fullname', it just fills the name and stops here.
                // --------------------------

                dropdown.style.display = 'none';
            };

            dropdown.appendChild(option);
            currentOptions.push(option);
        });

        const rect = this.getBoundingClientRect();

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
            updateLGActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateLGActiveItem();
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0) {
                currentOptions[activeIndex].click();
            }
        }
    });

});

// CLICK OUTSIDE
document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target) && !inputs.includes(e.target)) {
        dropdown.style.display = 'none';
    }
});

// ACTIVE ITEM + SCROLL FOLLOW
function updateLGActiveItem() {

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

    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="legal-guardian"]');
        if (card) {
            e.stopImmediatePropagation();
            if (!window.isEditing) resetLegalGuardianFormToDefault();
            openLegalGuardianForm(); 
        }
    });

    formBack.addEventListener('click', closeLegalGuardianForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLegalGuardianForm();
    });

    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'lg-purpose') {
            toggleLGOtherPurpose(e.target.value);
        }
    });

    function toggleLGOtherPurpose(val) {
        var otherWrap  = document.getElementById('lg-other-purpose-wrap');
        var otherInput = document.getElementById('lg-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'block';
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
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

    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    function saveCurrentFormToCart() {
        if (!validateLegalGuardianForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Legal Guardian Certificate', 
            requestor_name: document.getElementById('lg-fullname').value, 
            fullname: document.getElementById('lg-fullname').value,
            guardian: document.getElementById('lg-guardian').value,
            address: document.getElementById('lg-address').value,
            purpose: document.getElementById('lg-purpose').value,
            other_purpose: document.getElementById('lg-other-purpose') ? document.getElementById('lg-other-purpose').value : '',
            phone: document.getElementById('lg-phone').value
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

    addBtn.addEventListener('click', function() {
        if(saveCurrentFormToCart()) closeLegalGuardianForm(); 
    });

    function openLegalGuardianForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;
    }
    
    function closeLegalGuardianForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetLegalGuardianFormToDefault, 300);
    }

    function resetLegalGuardianFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;
        form.reset();

        var otherWrap  = document.getElementById('lg-other-purpose-wrap');
        var otherInput = document.getElementById('lg-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; }
        if (otherInput) { otherInput.removeAttribute('data-required'); }

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="legal-guardian-terms-check" class="rbi-checkbox">
                <label for="legal-guardian-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#legal-guardian-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearLegalGuardianErrors();
    }

    function validateLegalGuardianForm() {
        clearLegalGuardianErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            var wrap = field.closest('#lg-other-purpose-wrap, .rbi-row');
            if (wrap && window.getComputedStyle(wrap).display === 'none') return;

            if (!field.value.trim()) {
                markLegalGuardianError(field, 'This field is required.');
                valid = false;
            }
        });

        var phone = document.getElementById('lg-phone');
        if (phone && phone.value && !/^\d{11}$/.test(phone.value.trim())) {
            markLegalGuardianError(phone, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
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
        form.querySelectorAll('.lg-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.lg-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    function buildLegalGuardianFormModal() {
        if(document.getElementById('legal-guardian-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="legal-guardian-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="legal-guardian-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
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
                            <label class="rbi-label" for="lg-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="lg-fullname" class="rbi-input" data-required="true" placeholder="FULL NAME" maxlength="100">
                            <span class="lg-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-guardian">Legal Guardian: <span class="req">*</span></label>
                            <input type="text" id="lg-guardian" class="rbi-input" data-required="true" placeholder="LEGAL GUARDIAN" maxlength="100">
                            <span class="lg-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-address">Home Address: <span class="req">*</span></label>
                            <input type="text" id="lg-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="lg-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-purpose">Purpose: <span class="req">*</span></label>
                            <select id="lg-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>School Enrollment</option>
                                <option>Medical Consent</option>
                                <option>Travel Authorization</option>
                                <option>Financial Transactions</option>
                                <option>Legal Proceedings</option>
                                <option>Other</option>
                            </select>
                            <span class="lg-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="lg-certificate" class="rbi-input readonly-field" value="LEGAL GUARDIAN CERTIFICATE" readonly>
                            <span class="lg-error-msg"></span>
                        </div>
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="lg-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="lg-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1" id="lg-other-purpose-wrap" style="display:none; margin-bottom: 20px;">
                        <div class="lg-field">
                            <label class="rbi-label" for="lg-other-purpose">Specify Purpose: <span class="req">*</span></label>
                            <input type="text" id="lg-other-purpose" class="rbi-input" placeholder="ENTER PURPOSE">
                            <span class="lg-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="legal-guardian-terms-check" class="rbi-checkbox">
                        <label for="legal-guardian-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="legal-guardian-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

window.populateLegalGuardianForm = function(data) {
    window.isEditing = true;
    const lgCard = document.querySelector('.service-card[data-service="legal-guardian"]');
    if (lgCard) lgCard.click();

    setTimeout(() => {
        const addBtn = document.getElementById('legal-guardian-add-btn');

        document.getElementById('lg-fullname').value = data.fullname || '';
        document.getElementById('lg-guardian').value = data.guardian || '';
        document.getElementById('lg-address').value = data.address || '';
        document.getElementById('lg-phone').value = data.phone || '';

        const purposeSelect = document.getElementById('lg-purpose');
        if (data.purpose) {
            purposeSelect.value = data.purpose;
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true })); 
        }
        
        if (data.other_purpose) {
            const otherInput = document.getElementById('lg-other-purpose');
            if (otherInput) otherInput.value = data.other_purpose;
        }

        const termsRow = document.getElementById('legal-guardian-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }
    }, 150);
};