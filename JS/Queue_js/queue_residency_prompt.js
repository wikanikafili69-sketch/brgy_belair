// ========================================
// BARANGAY — QUEUE RESIDENCY PROMPT (BATCH LOGIC)
// JS/queue_residency_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueResidencyPrompt();
});

function initQueueResidencyPrompt() {

    buildResidencyFormModal();

    var formOverlay     = document.getElementById('residency-form-overlay');
    var formBack        = document.getElementById('residency-form-back');
    var form            = document.getElementById('residency-request-form');
    var addBtn          = document.getElementById('residency-add-btn');
    var termsCheck      = document.getElementById('residency-terms-check');
    var formWrap        = document.getElementById('residency-form-wrap');

    if (!formOverlay) return;

    // ========================================
// RESIDENCY DROPDOWN + KEYBOARD NAV
// ========================================

const fullnameInput = document.getElementById('residency-fullname');

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
                updateResidencyActiveItem();
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
                const addressInput = document.getElementById('residency-address');
                if (addressInput && item.full_address && item.full_address.trim() !== '') {
                    addressInput.value = item.full_address.toUpperCase();
                }

                // 2. Autofill Cellphone Number
                const phoneInput = document.getElementById('residency-phone');
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
            updateResidencyActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateResidencyActiveItem();
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
function updateResidencyActiveItem() {

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
        var card = e.target.closest('.service-card[data-service="residency"]');
        if (card) {
            e.stopImmediatePropagation(); 
            if (!window.isEditing) resetResidencyFormToDefault();
            openResidencyForm();          
        }
    });

    formBack.addEventListener('click', closeResidencyForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeResidencyForm();
    });

    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'residency-purpose') {
            toggleResOtherPurpose(e.target.value);
        }
    });

    function toggleResOtherPurpose(val) {
        var otherWrap  = document.getElementById('res-other-purpose-wrap');
        var otherInput = document.getElementById('residency-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'block';
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
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

    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    function saveCurrentFormToCart() {
        if (!validateResidencyForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Certificate of Residency', 
            requestor_name: document.getElementById('residency-fullname').value, 
            fullname: document.getElementById('residency-fullname').value,
            address: document.getElementById('residency-address').value,
            purpose: document.getElementById('residency-purpose').value,
            other_purpose: document.getElementById('residency-other-purpose') ? document.getElementById('residency-other-purpose').value : '',
            phone: document.getElementById('residency-phone').value
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
        if(saveCurrentFormToCart()) closeResidencyForm(); 
    });

    function openResidencyForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;
    }

    function closeResidencyForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetResidencyFormToDefault, 300);
    }

    function resetResidencyFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;
        form.reset();

        var otherWrap  = document.getElementById('res-other-purpose-wrap');
        var otherInput = document.getElementById('residency-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; }
        if (otherInput) { otherInput.removeAttribute('data-required'); }

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="residency-terms-check" class="rbi-checkbox">
                <label for="residency-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#residency-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearResidencyErrors();
    }

    function validateResidencyForm() {
        clearResidencyErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            var wrap = field.closest('#res-other-purpose-wrap, .rbi-row');
            if (wrap && window.getComputedStyle(wrap).display === 'none') return;

            if (!field.value.trim()) {
                markResidencyError(field, 'This field is required.');
                valid = false;
            }
        });

        var phone = document.getElementById('residency-phone');
        if (phone && phone.value && !/^\d{11}$/.test(phone.value.trim())) {
            markResidencyError(phone, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
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
        form.querySelectorAll('.res-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.res-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    function buildResidencyFormModal() {
        if(document.getElementById('residency-form-overlay')) return;
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
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
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
                            <input type="text" id="residency-fullname" class="rbi-input" data-required="true" placeholder="FULL NAME" maxlength="100">
                            <span class="res-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="res-field">
                            <label class="rbi-label" for="residency-address">Home Address: <span class="req">*</span></label>
                            <input type="text" id="residency-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="res-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
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
                            <span class="res-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="res-field">
                            <label class="rbi-label" for="residency-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="residency-certificate" class="rbi-input readonly-field" value="CERTIFICATE OF RESIDENCY" readonly>
                            <span class="res-error-msg"></span>
                        </div>
                        <div class="res-field">
                            <label class="rbi-label" for="residency-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="residency-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="res-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1" id="res-other-purpose-wrap" style="display:none; margin-bottom: 20px;">
                        <div class="res-field">
                            <label class="rbi-label" for="residency-other-purpose">Specify Purpose: <span class="req">*</span></label>
                            <input type="text" id="residency-other-purpose" class="rbi-input" placeholder="ENTER PURPOSE">
                            <span class="res-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="residency-terms-check" class="rbi-checkbox">
                        <label for="residency-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="residency-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>

                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

window.populateResidencyForm = function(data) {
    window.isEditing = true;
    const resCard = document.querySelector('.service-card[data-service="residency"]');
    if (resCard) resCard.click();

    setTimeout(() => {
        const addBtn = document.getElementById('residency-add-btn');

        document.getElementById('residency-fullname').value = data.fullname || '';
        document.getElementById('residency-address').value = data.address || '';
        document.getElementById('residency-phone').value = data.phone || '';

        const purposeSelect = document.getElementById('residency-purpose');
        if (data.purpose) {
            purposeSelect.value = data.purpose;
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true })); 
        }
        
        if (data.other_purpose) {
            const otherInput = document.getElementById('residency-other-purpose');
            if (otherInput) otherInput.value = data.other_purpose;
        }

        const termsRow = document.getElementById('residency-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }
    }, 150);
};