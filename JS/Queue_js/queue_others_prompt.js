// ========================================
// BARANGAY — OTHER CERTIFICATE (BATCH STYLE)
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    initOthersPrompt();
});

function initOthersPrompt() {

    document.addEventListener('click', function (e) {
        const card = e.target.closest('.service-card[data-service="others"]');
        if (!card) return;

        if (!window.isEditing) {
            resetOthersForm();
        }

        openOthersForm();
    });
}

// ─────────────────────────────
// OPEN FORM
// ─────────────────────────────
function openOthersForm(data = null) {

    const existing = document.getElementById('others-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'residency-form-overlay active';
    overlay.id = 'others-overlay';

overlay.innerHTML = `

    <!-- TOPBAR -->
    <div class="others-topbar">
        <button class="others-back-btn" id="others-back-btn">← Back</button>

        <div class="others-topbar-title">
            <div class="others-topbar-eyebrow">Barangay Hall</div>
            <div class="others-topbar-heading">Other Certificate</div>
        </div>

        <div class="others-topbar-spacer"></div>
    </div>

    <!-- FORM -->
    <div id="others-form-wrap">

        <div class="others-title">
            Request <span>Other Certificate</span>
        </div>

        <div class="others-sub">
            * Please provide correct information
        </div>

        <div class="others-section-label">Requestor Information</div>

        <div class="others-row others-row-2">
            <div class="others-field">
                <label class="others-label">
                    Full Name <span style="color:#ef4444">*</span>
                </label>
                <input id="others-fullname" class="others-input" data-required="true"
                    placeholder="Enter full name">
            </div>

            <div class="others-field">
                <label class="others-label">
                    Contact Number <span style="color:#ef4444">*</span>
                </label>
                <input id="others-contact" class="others-input" data-required="true"
                    placeholder="09XXXXXXXXX" maxlength="11">
            </div>
        </div>

        <div class="others-row">
            <div class="others-field">
                <label class="others-label">
                    Address <span style="color:#ef4444">*</span>
                </label>
                <input id="others-address" class="others-input" data-required="true"
                    placeholder="House No., Street, Brgy, Municipality/City">
            </div>
        </div>

        <div class="others-row others-row-2">
            <div class="others-field">
                <label class="others-label">
                    Birthdate <span style="color:#ef4444">*</span>
                </label>
                <input type="date" id="others-bday" class="others-input" data-required="true">
            </div>

            <div class="others-field">
                <label class="others-label">
                    Certificate Type <span style="color:#ef4444">*</span>
                </label>
                <input id="others-type" class="others-input" data-required="true"
                    placeholder="e.g. Barangay Certification">
            </div>
        </div>

        <!-- TERMS -->
        <div class="rbi-terms-row">
            <input type="checkbox" id="others-terms-check" class="rbi-checkbox">
            <label for="others-terms-check" class="rbi-terms-label">
                I agree and accept the terms and conditions
            </label>
        </div>

        <!-- BUTTON -->
        <div class="rbi-submit-row" style="display:flex; justify-content:flex-end;">
            <button id="others-add-btn" class="rbi-submit-btn" disabled>
                <span>➕</span> Add to List
            </button>
        </div>

    </div>
`;

    document.body.appendChild(overlay);

    // ========================================
// OTHERS DROPDOWN + AUTOFILL BIRTHDATE
// ========================================

const fullnameInput = document.getElementById('others-fullname');
const bdayInput = document.getElementById('others-bday');

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
                updateOthersActiveItem();
            };

            option.onmouseout = () => {
                if (index !== activeIndex) {
                    option.style.background = '#fff';
                }
            };

            option.onclick = () => {
                fullnameInput.value = item.fullname.toUpperCase();

                // --- NEW AUTOFILL LOGIC ---
                // 1. Autofill Birthdate (Your existing logic)
                if (bdayInput && item.birth_date) {
                    bdayInput.value = item.birth_date;
                }

                // 2. Autofill Home Address
                const addressInput = document.getElementById('others-address');
                if (addressInput && item.full_address && item.full_address.trim() !== '') {
                    addressInput.value = item.full_address.toUpperCase();
                }

                // 3. Autofill Cellphone Number
                const phoneInput = document.getElementById('others-contact');
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
            updateOthersActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateOthersActiveItem();
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
function updateOthersActiveItem() {

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

    // ── BACK BUTTON
    document.getElementById('others-back-btn').onclick = () => closeOthersForm();

    const addBtn = document.getElementById('others-add-btn');
    const termsCheck = document.getElementById('others-terms-check');

    // ── TERMS LOGIC
    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    // ── ADD TO CART
    addBtn.addEventListener('click', function () {
        if (!validateOthersForm()) return;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];

        let formData = {
            service_type: 'Other Services',
            fullname: document.getElementById('others-fullname').value,
            address: document.getElementById('others-address').value,
            birthdate: document.getElementById('others-bday').value,
            phone: document.getElementById('others-contact').value,
            certificate_type: document.getElementById('others-type').value
        };

        // ✅ EDIT 2: Prioritize form-bound data attribute to prevent state loss
        const formWrap = document.getElementById('others-form-wrap');
        let targetIndex = null;

        if (formWrap && formWrap.hasAttribute('data-edit-index')) {
            targetIndex = parseInt(formWrap.getAttribute('data-edit-index'), 10);
        } else if (window.editingIndex !== null) {
            targetIndex = window.editingIndex;
        }

        if (targetIndex !== null && !isNaN(targetIndex)) {
            // EDIT MODE → replace existing item
            cart[targetIndex] = formData;
            
            // Wipe states clean
            window.editingIndex = null;
            if(formWrap) formWrap.removeAttribute('data-edit-index');
            window.isEditing = false;
        } else {
            // ADD MODE → new item
            cart.push(formData);
        }

        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        if (window.updateCartUI) window.updateCartUI();

        closeOthersForm();
    });

    document.body.style.overflow = 'hidden';
}

// ─────────────────────────────
// CLOSE FORM
// ─────────────────────────────
function closeOthersForm() {
    const overlay = document.getElementById('others-overlay');
    if (!overlay) return;

    overlay.remove();
    document.body.style.overflow = '';
    
    // ✅ EDIT 3: Ensure we wipe 'isEditing' and 'editingIndex' when modal closes
    setTimeout(resetOthersForm, 300);
}

// ─────────────────────────────
// RESET FORM
// ─────────────────────────────
function resetOthersForm() {
    window.editingIndex = null;
    window.isEditing = false;
}

// ─────────────────────────────
// VALIDATION
// ─────────────────────────────
function validateOthersForm() {

    clearOthersErrors();
    let valid = true;

    document.querySelectorAll('#others-form-wrap [data-required="true"]').forEach(field => {

        let wrapper = field.closest('.others-field');

        if (!field.value.trim()) {

            wrapper.classList.add('has-error');

            if (!wrapper.querySelector('.others-error-msg')) {
                wrapper.insertAdjacentHTML(
                    'beforeend',
                    '<div class="others-error-msg">This field is required.</div>'
                );
            }

            valid = false;

        }
    });

    return valid;
}

function clearOthersErrors() {
    document.querySelectorAll('#others-form-wrap .has-error')
        .forEach(el => el.classList.remove('has-error'));

    document.querySelectorAll('#others-form-wrap .others-error-msg')
        .forEach(el => el.remove());
}

// ─────────────────────────────
// EDIT MODE SUPPORT
// ─────────────────────────────
window.populateOthersForm = function (data) {

    window.isEditing = true;

    const card = document.querySelector('.service-card[data-service="others"]');
    if (card) card.click();

    setTimeout(() => {

        // ✅ EDIT 1: Stamp the index directly onto the form wrapper upon population
        const formWrap = document.getElementById('others-form-wrap');
        if (formWrap && window.editingIndex !== null) {
            formWrap.setAttribute('data-edit-index', window.editingIndex);
        }

        document.getElementById('others-fullname').value = data.fullname || '';
        document.getElementById('others-address').value = data.address || '';
        document.getElementById('others-bday').value = data.birthdate || '';
        document.getElementById('others-contact').value = data.phone || '';
        document.getElementById('others-type').value = data.certificate_type || '';

        // REMOVE TERMS IN EDIT MODE
        const termsRow = document.querySelector('#others-form-wrap .rbi-terms-row');
        if (termsRow) termsRow.remove();

        const addBtn = document.getElementById('others-add-btn');
        if (addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }

    }, 150);
};