// ========================================
// BARANGAY — QUEUE CERTIFICATE OF LOW INCOME (BATCH LOGIC)
// JS/queue_low_income_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueLowIncomePrompt();
});

function initQueueLowIncomePrompt() {

    buildLowIncomeFormModal();

    var formOverlay   = document.getElementById('low-income-form-overlay');
    var formBack      = document.getElementById('low-income-form-back');
    var form          = document.getElementById('low-income-request-form');
    var addBtn        = document.getElementById('low-income-add-btn');
    var termsCheck    = document.getElementById('low-income-terms-check');
    var formWrap      = document.getElementById('low-income-form-wrap');

    if (!formOverlay) return;

    // ========================================
// LOW INCOME DROPDOWN + KEYBOARD NAV
// ========================================

const fullnameInput = document.getElementById('li-fullname');

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
                updateLIActiveItem();
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
                const addressInput = document.getElementById('li-address');
                if (addressInput && item.full_address && item.full_address.trim() !== '') {
                    addressInput.value = item.full_address.toUpperCase();
                }

                // 2. Autofill Cellphone Number
                const phoneInput = document.getElementById('li-phone');
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
            updateLIActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateLIActiveItem();
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
function updateLIActiveItem() {

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
        var card = e.target.closest('.service-card[data-service="low-income"]');
        if (card) {
            e.stopImmediatePropagation();
            if (!window.isEditing) resetLowIncomeFormToDefault();
            openLowIncomeForm(); 
        }
    });

    formBack.addEventListener('click', closeLowIncomeForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLowIncomeForm();
    });

    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'li-purpose') {
            toggleLIOtherPurpose(e.target.value);
        }
    });

    function toggleLIOtherPurpose(val) {
        var otherWrap  = document.getElementById('li-other-purpose-wrap');
        var otherInput = document.getElementById('li-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'block';
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
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

    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    function saveCurrentFormToCart() {
        if (!validateLowIncomeForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Certificate of Low Income', 
            requestor_name: document.getElementById('li-fullname').value, 
            fullname: document.getElementById('li-fullname').value,
            address: document.getElementById('li-address').value,
            purpose: document.getElementById('li-purpose').value,
            other_purpose: document.getElementById('li-other-purpose') ? document.getElementById('li-other-purpose').value : '',
            phone: document.getElementById('li-phone').value,
            amount: document.getElementById('li-amount').value,
            work: document.getElementById('li-work').value
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
        if(saveCurrentFormToCart()) closeLowIncomeForm(); 
    });

    function openLowIncomeForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;
    }
    
    function closeLowIncomeForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetLowIncomeFormToDefault, 300);
    }

    function resetLowIncomeFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;
        form.reset();

        var otherWrap  = document.getElementById('li-other-purpose-wrap');
        var otherInput = document.getElementById('li-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; }
        if (otherInput) { otherInput.removeAttribute('data-required'); }

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="low-income-terms-check" class="rbi-checkbox">
                <label for="low-income-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#low-income-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearLowIncomeErrors();
    }

    function validateLowIncomeForm() {
        clearLowIncomeErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            var wrap = field.closest('#li-other-purpose-wrap, .rbi-row');
            if (wrap && window.getComputedStyle(wrap).display === 'none') return;

            if (!field.value.trim()) {
                markLowIncomeError(field, 'This field is required.');
                valid = false;
            }
        });

        var phone = document.getElementById('li-phone');
        if (phone && phone.value && !/^\d{11}$/.test(phone.value.trim())) {
            markLowIncomeError(phone, 'Enter a valid 11-digit number.');
            valid = false;
        }

        var amount = document.getElementById('li-amount');
        if (amount && amount.value !== '' && (isNaN(amount.value) || parseFloat(amount.value) < 0)) {
            markLowIncomeError(amount, 'Enter a valid amount.');
            valid = false;
        }

        if (!valid) {
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
        form.querySelectorAll('.li-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.li-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    function buildLowIncomeFormModal() {
        if(document.getElementById('low-income-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="low-income-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="low-income-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
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
                            <label class="rbi-label" for="li-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="li-fullname" class="rbi-input" data-required="true" placeholder="FULL NAME" maxlength="100">
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-address">Home Address: <span class="req">*</span></label>
                            <input type="text" id="li-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="li-field">
                            <label class="rbi-label" for="li-purpose">Purpose: <span class="req">*</span></label>
                            <select id="li-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Scholarship</option>
                                <option>Employment</option>
                                <option>Medical Assistance</option>
                                <option>Loan Application</option>
                                <option>Legal Purpose</option>
                                <option>Other</option>
                            </select>
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="li-certificate" class="rbi-input readonly-field" value="CERTIFICATE OF LOW INCOME" readonly>
                            <span class="li-error-msg"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="li-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1" id="li-other-purpose-wrap" style="display:none; margin-bottom: 20px;">
                        <div class="li-field">
                            <label class="rbi-label" for="li-other-purpose">Specify Purpose: <span class="req">*</span></label>
                            <input type="text" id="li-other-purpose" class="rbi-input" placeholder="ENTER PURPOSE">
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-2">
                        <div class="li-field">
                            <label class="rbi-label" for="li-amount">Amount: <span class="req">*</span></label>
                            <input type="number" id="li-amount" class="rbi-input" data-required="true" placeholder="0.00" min="0" step="0.01">
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="li-field">
                            <label class="rbi-label" for="li-work">Work: <span class="req">*</span></label>
                            <input type="text" id="li-work" class="rbi-input" data-required="true" placeholder="WHAT IS YOUR WORK?" maxlength="100">
                            <span class="li-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="low-income-terms-check" class="rbi-checkbox">
                        <label for="low-income-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="low-income-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

window.populateLowIncomeForm = function(data) {
    window.isEditing = true;
    const liCard = document.querySelector('.service-card[data-service="low-income"]');
    if (liCard) liCard.click();

    setTimeout(() => {
        const addBtn = document.getElementById('low-income-add-btn');

        document.getElementById('li-fullname').value = data.fullname || '';
        document.getElementById('li-address').value = data.address || '';
        document.getElementById('li-phone').value = data.phone || '';
        document.getElementById('li-amount').value = data.amount || '';
        document.getElementById('li-work').value = data.work || '';

        const purposeSelect = document.getElementById('li-purpose');
        if (data.purpose) {
            purposeSelect.value = data.purpose;
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true })); 
        }
        
        if (data.other_purpose) {
            const otherInput = document.getElementById('li-other-purpose');
            if (otherInput) otherInput.value = data.other_purpose;
        }

        const termsRow = document.getElementById('low-income-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }
    }, 150);
};