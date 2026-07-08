// ========================================
// BARANGAY — QUEUE BUSINESS CLEARANCE (FIXED BATCH LOGIC)
// JS/queue_business_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false; // ✅ NEW

document.addEventListener('DOMContentLoaded', function () {
    initQueueBusinessPrompt();
});

function formatBirthdate(dateStr) {
    const date = new Date(dateStr);

    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
    });
}

function initQueueBusinessPrompt() {
    // 1. Build the modal using your EXACT original design
    buildBusinessFormModal();

    var formOverlay    = document.getElementById('business-form-overlay');
    var formBack       = document.getElementById('business-form-back');
    var form           = document.getElementById('business-request-form');



        

// ========================================
// BUSINESS DROPDOWN (WITH BIRTHDATE REFERENCE)
// + KEYBOARD NAV + SCROLL FOLLOW
// ========================================

const fullnameInput = document.getElementById('business-fullname');

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

        if (!search || !window.residentList.length) {
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
                updateActiveItem();
            };

            option.onmouseout = () => {
                if (index !== activeIndex) {
                    option.style.background = '#fff';
                }
            };

                option.onclick = () => {
                fullnameInput.value = item.fullname.toUpperCase();
                
                // --- NEW AUTOFILL LOGIC ---
                // Get the phone input element
                const phoneInput = document.getElementById('business-phone');
                
                // Check if contact_no exists and is not null or empty
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
            updateActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateActiveItem();
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
function updateActiveItem() {

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



    var addBtn         = document.getElementById('business-add-btn');
    var termsCheck     = document.getElementById('business-terms-check');
    var termsRow       = document.getElementById('business-request-form')?.querySelector('.rbi-terms-row');
    var clearanceInput = document.getElementById('business-clearance');
    var kindField      = document.getElementById('biz-kind-field');
    var kindInput      = document.getElementById('business-kind');
    var typeRow        = document.getElementById('biz-type-row');

    if(!formOverlay) return;

    // ── CLICK DASHBOARD CARD: Always Fresh Start ──
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="business"]');
        if (!card) return;

        if (!window.isEditing) {
            resetBusinessFormToDefault();
        }

        openBusinessForm();
    });

    formBack.addEventListener('click', closeBusinessForm);

    // ── FORM LOGIC: Radio Toggle (Your original logic) ──
    document.addEventListener('change', function (e) {
        if (!e.target || e.target.name !== 'biz-clearance-type') return;
        var val = e.target.value;
        if (clearanceInput) clearanceInput.value = val;
        var isSmall = (val === 'SMALL BUSINESS CLEARANCE' || val === 'SMALL BUSINESS CLEARANCE (DTI)');
        if (kindField) {
            kindField.classList.toggle('biz-kind-visible', isSmall);
            if (kindInput) isSmall ? kindInput.setAttribute('data-required', 'true') : kindInput.removeAttribute('data-required');
        }
        if (typeRow) {
            typeRow.classList.toggle('rbi-row-3', isSmall);
            typeRow.classList.toggle('rbi-row-2', !isSmall);
        }
    });

    termsCheck.addEventListener('change', function () {
        // ONLY apply in ADD MODE
       if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    // ── SAVE TO CART ──
    function saveCurrentFormToCart() {
        if (!validateBusinessForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        let radioChecked = document.querySelector('input[name="biz-clearance-type"]:checked');
        
        let formData = {
            service_type: 'Business Clearance', 
            clearance_type: radioChecked ? radioChecked.value : '',
            business_type: document.getElementById('business-type').value,
            business_kind: document.getElementById('business-kind').value,
            business_name: document.getElementById('business-name').value,
            requestor_name: document.getElementById('business-fullname').value, // Used for cart preview
            fullname: document.getElementById('business-fullname').value,
            address: document.getElementById('business-address').value,
            phone: document.getElementById('business-phone').value
        };

        if (window.editingIndex !== null) {
            // EDIT MODE → replace existing item
            cart[window.editingIndex] = formData;
            window.editingIndex = null; // reset after save
        } else {
            // ADD MODE → new item
            cart.push(formData);
        }
        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        if (window.updateCartUI) window.updateCartUI();
        return true;
    }

    // ── MAIN BUTTON ACTION ──
    addBtn.addEventListener('click', function() {
        if(saveCurrentFormToCart()) {
            closeBusinessForm(); 
        }
    });

    function openBusinessForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeBusinessForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetBusinessFormToDefault, 300);
    }

    // ── RESET TO DEFAULT (ADD MODE) ──
    function resetBusinessFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;

        form.reset();

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');

        // 🔥 CHECK INSIDE FORM ONLY (IMPORTANT)
        let termsRow = form.querySelector('.rbi-terms-row');

        // ✅ ONLY CREATE IF NOT EXIST
        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="business-terms-check" class="rbi-checkbox">
                <label for="business-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;

            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        // 🔥 ALWAYS REBIND (SAFE)
        const termsCheck = termsRow.querySelector('#business-terms-check');
        termsCheck.checked = false;

        termsCheck.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearBusinessErrors();
    }

    // ✅ UPDATED VALIDATION FUNCTION to include error text
    function validateBusinessForm() {
        clearBusinessErrors();
        var valid = true;
        
        // Validate Radio Group
        if (!document.querySelector('input[name="biz-clearance-type"]:checked')) {
            let radioGroup = document.getElementById('biz-radio-group');
            radioGroup.classList.add('has-error');
            // Inject error message
            if (!radioGroup.querySelector('.biz-error-msg')) {
                radioGroup.insertAdjacentHTML('beforeend', '<div class="biz-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;">This field is required.</div>');
            }
            valid = false;
        }
        
        // Validate required inputs
        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            // Skip hidden elements
            var wrap = field.closest('.biz-kind-visible, .rbi-row');
            if (wrap && window.getComputedStyle(wrap).display === 'none') return;

            if (!field.value.trim()) {
                let wrapper = field.closest('.biz-field');
                wrapper.classList.add('has-error');
                // Inject error message
                if (!wrapper.querySelector('.biz-error-msg')) {
                    wrapper.insertAdjacentHTML('beforeend', '<div class="biz-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600;">This field is required.</div>');
                }
                valid = false;
            }
        });
        
        return valid;
    }



    // ✅ UPDATED ERROR CLEARING FUNCTION to remove the error text
    function clearBusinessErrors() {
        form.querySelectorAll('.has-error').forEach(function (g) { g.classList.remove('has-error'); });
        form.querySelectorAll('.biz-error-msg').forEach(function (msg) { msg.remove(); });
    }

    function buildBusinessFormModal() {
        if(document.getElementById('business-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="business-form-overlay">
            <div class="rbi-topbar">
                <button type="button" class="rbi-back-btn" id="business-form-back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
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
                    <div class="biz-radio-section biz-field" id="biz-radio-group">
                        <label class="rbi-label">Business Clearance Type: <span class="req">*</span></label>
                        <div class="biz-radio-group">
                            <label class="biz-radio-label"><input type="radio" name="biz-clearance-type" value="BUSINESS PERMIT" class="biz-radio"><span class="biz-radio-custom"></span> BUSINESS PERMIT</label>
                            <label class="biz-radio-label"><input type="radio" name="biz-clearance-type" value="SMALL BUSINESS CLEARANCE" class="biz-radio"><span class="biz-radio-custom"></span> SMALL BUSINESS CLEARANCE</label>
                            <label class="biz-radio-label"><input type="radio" name="biz-clearance-type" value="SMALL BUSINESS CLEARANCE (DTI)" class="biz-radio"><span class="biz-radio-custom"></span> SMALL BUSINESS CLEARANCE (DTI)</label>
                        </div>
                    </div>

                    <div class="biz-section-divider"></div>

                    <div class="rbi-row rbi-row-2" id="biz-type-row">
                        <div class="biz-field">
                            <label class="rbi-label">Type: <span class="req">*</span></label>
                            <select id="business-type" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>New</option><option>Renewal</option><option>Amendment</option><option>Closure</option>
                            </select>
                        </div>
                        <div class="biz-field biz-kind-field" id="biz-kind-field">
                            <label class="rbi-label">Kind of Business: <span class="req">*</span></label>
                            <input type="text" id="business-kind" class="rbi-input" placeholder="ENTER TYPE OF BUSINESS">
                        </div>
                        <div class="biz-field">
                            <label class="rbi-label">Business Name:</label>
                            <input type="text" id="business-name" class="rbi-input" placeholder="">
                        </div>
                    </div>

                    <div class="biz-section-divider"></div>
                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="biz-field">
                            <label class="rbi-label">Full Name: <span class="req">*</span></label>
                            <input type="text" id="business-fullname" class="rbi-input" data-required="true" placeholder="OWNER NAME">
                        </div>
                        <div class="biz-field">
                            <label class="rbi-label">Business Address:</label>
                            <input type="text" id="business-address" class="rbi-input" placeholder="Address">
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-2">
                        <div class="biz-field">
                            <label class="rbi-label">Clearance Text:</label>
                            <input type="text" id="business-clearance" class="rbi-input readonly-field" readonly>
                        </div>
                        <div class="biz-field">
                            <label class="rbi-label">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="business-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="business-terms-check" class="rbi-checkbox">
                        <label for="business-terms-check" class="rbi-terms-label">I agree and accept the terms and conditions</label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="business-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

// ── GLOBAL POPULATE (EDIT MODE) ──
window.populateBusinessForm = function(data) {

    window.isEditing = true;

    const bizCard = document.querySelector('.service-card[data-service="business"]');
    if (bizCard) bizCard.click();

    setTimeout(() => {

        const addBtn = document.getElementById('business-add-btn');

        // ✅ 1. FILL DATA FIRST
        document.getElementById('business-type').value = data.business_type || '';
        document.getElementById('business-kind').value = data.business_kind || '';
        document.getElementById('business-name').value = data.business_name || '';
        document.getElementById('business-fullname').value = data.fullname || ''; // Using unified 'fullname' field
        document.getElementById('business-address').value = data.address || '';
        document.getElementById('business-phone').value = data.phone || '';

        // ✅ 2. RESTORE RADIO BUTTON SELECTION
        if (data.clearance_type) {
            const radioToSelect = document.querySelector(`input[name="biz-clearance-type"][value="${data.clearance_type}"]`);
            if (radioToSelect) {
                radioToSelect.checked = true;
                // Dispatch change event to trigger the visual updates (like showing 'Kind of Business')
                radioToSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }

        // 🔥 THEN REMOVE TERMS (PUT IT HERE)
        const termsRow = document.getElementById('business-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        // UI change for edit
        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }

    }, 150);
};

