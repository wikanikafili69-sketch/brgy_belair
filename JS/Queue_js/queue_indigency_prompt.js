// ========================================
// BARANGAY — QUEUE INDIGENCY (BATCH LOGIC)
// JS/queue_indigency_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueIndigencyPrompt();
});

function initQueueIndigencyPrompt() {

    buildIndigencyFormModal();

    var formOverlay    = document.getElementById('indigency-form-overlay');
    var formBack       = document.getElementById('indigency-form-back');
    var form           = document.getElementById('indigency-request-form');
    var addBtn         = document.getElementById('indigency-add-btn');
    var termsCheck     = document.getElementById('indigency-terms-check');
    var formWrap       = document.getElementById('indigency-form-wrap');

    // ========================================
// INDIGENCY DROPDOWN + KEYBOARD NAV
// ========================================

const fullnameInput = document.getElementById('indigency-fullname');

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
dropdown.style.fontFamily = 'inherit';

document.body.appendChild(dropdown);

// KEYBOARD STATE
let activeIndex = -1;
let currentOptions = [];

// INPUT EVENT
if (fullnameInput) {

    fullnameInput.addEventListener('input', function () {

        let value = this.value.toUpperCase();

        // CLEAN INPUT
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
                updateIndigencyActiveItem();
            };

            option.onmouseout = () => {
                if (index !== activeIndex) {
                    option.style.background = '#fff';
                }
            };

          option.onclick = () => {
                fullnameInput.value = item.fullname.toUpperCase();

                // --- NEW AUTOFILL LOGIC ---
                // 1. Autofill Address
                const addressInput = document.getElementById('indigency-address');
                if (addressInput && item.full_address && item.full_address.trim() !== '') {
                    addressInput.value = item.full_address.toUpperCase();
                }

                // 2. Autofill Cellphone Number
                const phoneInput = document.getElementById('indigency-phone');
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

    // KEYBOARD NAVIGATION
    fullnameInput.addEventListener('keydown', function (e) {

        if (!currentOptions.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % currentOptions.length;
            updateIndigencyActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateIndigencyActiveItem();
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
function updateIndigencyActiveItem() {

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
    
    var purposeSelect  = document.getElementById('indigency-purpose');
    var otherFieldWrap = document.getElementById('ind-other-purpose-wrap');
    var otherInput     = document.getElementById('indigency-other-purpose');

    if (!formOverlay || !formWrap) return; 

    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="indigency"]');
        if (card) {
            e.stopImmediatePropagation();
            e.preventDefault();
            if (!window.isEditing) resetIndigencyFormToDefault();
            openIndigencyForm();
        }
    });

    if (formBack) {
        formBack.addEventListener('click', closeIndigencyForm);
    }
    
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeIndigencyForm();
    });

    if (purposeSelect) {
        purposeSelect.addEventListener('change', function () {
            if (this.value === 'Other') {
                otherFieldWrap.classList.add('ind-other-visible');
                if (otherInput) otherInput.setAttribute('data-required', 'true');
            } else {
                otherFieldWrap.classList.remove('ind-other-visible');
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
        });
    }

    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    function saveCurrentFormToCart() {
        if (!validateIndigencyForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Certificate of Indigency', 
            requestor_name: document.getElementById('indigency-fullname').value, 
            fullname: document.getElementById('indigency-fullname').value,
            address: document.getElementById('indigency-address').value,
            purpose: document.getElementById('indigency-purpose').value,
            other_purpose: document.getElementById('indigency-other-purpose').value,
            phone: document.getElementById('indigency-phone').value
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
        if(saveCurrentFormToCart()) closeIndigencyForm(); 
    });

    function openIndigencyForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;
    }
    
    function closeIndigencyForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetIndigencyFormToDefault, 300);
    }

    function resetIndigencyFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;
        form.reset();

        if (otherFieldWrap) otherFieldWrap.classList.remove('ind-other-visible');
        if (otherInput) otherInput.removeAttribute('data-required');

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="indigency-terms-check" class="rbi-checkbox">
                <label for="indigency-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#indigency-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearIndigencyErrors();
    }

    function validateIndigencyForm() {
        clearIndigencyErrors();
        var valid = true;
        if (!form) return false;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            var wrap = field.closest('.ind-other-visible, .rbi-row');
            if (wrap && window.getComputedStyle(wrap).display === 'none') return;

            if (!field.value.trim()) {
                markIndigencyError(field, 'This field is required.');
                valid = false;
            }
        });

        var phone = document.getElementById('indigency-phone');
        if (phone && phone.value && !/^\d{11}$/.test(phone.value.trim())) {
            markIndigencyError(phone, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
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
        if (!form) return;
        form.querySelectorAll('.ind-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.ind-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    function buildIndigencyFormModal() {
        if(document.getElementById('indigency-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="indigency-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="indigency-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
                    <p class="rbi-topbar-heading">Certificate of Indigency</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="indigency-form-wrap" style="background: #ffffff !important; max-width: 900px; width: 95%; margin: 40px auto; border-radius: 16px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative;">
                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST CERTIFICATE OF <span>INDIGENCY</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="indigency-request-form" novalidate>
                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="ind-field">
                            <label class="rbi-label" for="indigency-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="indigency-fullname" class="rbi-input" data-required="true" placeholder="LAST NAME, FIRST NAME MI.">
                            <span class="ind-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;"></span>
                        </div>
                        <div class="ind-field">
                            <label class="rbi-label" for="indigency-address">Address: <span class="req">*</span></label>
                            <input type="text" id="indigency-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY">
                            <span class="ind-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="ind-field">
                            <label class="rbi-label" for="indigency-purpose">Purpose: <span class="req">*</span></label>
                            <select id="indigency-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Medical Assistance</option>
                                <option>Financial Assistance</option>
                                <option>Scholarship / Educational Assistance</option>
                                <option>Burial Assistance</option>
                                <option>Hospital Requirement</option>
                                <option>Other</option>
                            </select>
                            <span class="ind-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;"></span>
                        </div>
                        <div class="ind-field">
                            <label class="rbi-label" for="indigency-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="indigency-certificate" class="rbi-input readonly-field" value="CERTIFICATE OF INDIGENCY" readonly>
                            <span class="ind-error-msg"></span>
                        </div>
                        <div class="ind-field">
                            <label class="rbi-label" for="indigency-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="indigency-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="ind-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;"></span>
                        </div>
                    </div>

                    <div class="ind-field ind-other-field" id="ind-other-purpose-wrap">
                        <label class="rbi-label" for="indigency-other-purpose">Specify Purpose: <span class="req">*</span></label>
                        <input type="text" id="indigency-other-purpose" class="rbi-input" placeholder="ENTER PURPOSE">
                        <span class="ind-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;"></span>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="indigency-terms-check" class="rbi-checkbox">
                        <label for="indigency-terms-check" class="rbi-terms-label">
                            I agree and accept the <a href="terms.php" target="_blank">terms and conditions</a>
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="indigency-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

window.populateIndigencyForm = function(data) {
    window.isEditing = true;
    const indigencyCard = document.querySelector('.service-card[data-service="indigency"]');
    if (indigencyCard) indigencyCard.click();

    setTimeout(() => {
        const addBtn = document.getElementById('indigency-add-btn');

        document.getElementById('indigency-fullname').value = data.fullname || '';
        document.getElementById('indigency-address').value = data.address || '';
        document.getElementById('indigency-phone').value = data.phone || '';

        const purposeSelect = document.getElementById('indigency-purpose');
        if (data.purpose) {
            purposeSelect.value = data.purpose;
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true })); 
        }
        
        if (data.other_purpose) {
            document.getElementById('indigency-other-purpose').value = data.other_purpose;
        }

        const termsRow = document.getElementById('indigency-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }
    }, 150);
};