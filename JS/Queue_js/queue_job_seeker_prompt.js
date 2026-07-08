// ========================================
// BARANGAY — QUEUE FIRST TIME JOB SEEKER (BATCH LOGIC)
// JS/queue_job_seeker_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueJobSeekerPrompt();
});

function initQueueJobSeekerPrompt() {

    buildJobSeekerFormModal();

    var formOverlay   = document.getElementById('job-seeker-form-overlay');
    var formBack      = document.getElementById('job-seeker-form-back');
    var form          = document.getElementById('job-seeker-request-form');
    var addBtn        = document.getElementById('job-seeker-add-btn');
    var termsCheck    = document.getElementById('job-seeker-terms-check');
    var formWrap      = document.getElementById('job-seeker-form-wrap');

    

    if (!formOverlay) return;

    // ========================================
// JOB SEEKER DROPDOWN + KEYBOARD NAV
// ========================================

const fullnameInput = document.getElementById('js-fullname');

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
                updateJobSeekerActiveItem();
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
                const addressInput = document.getElementById('js-address');
                if (addressInput && item.full_address && item.full_address.trim() !== '') {
                    addressInput.value = item.full_address.toUpperCase();
                }

                // 2. Autofill Cellphone Number
                const phoneInput = document.getElementById('js-phone');
                if (phoneInput && item.contact_no && item.contact_no.trim() !== '') {
                    phoneInput.value = item.contact_no;
                }

                // 3. NEW: Autofill Years/Months using years_of_stay
                const yearsMonthsInput = document.getElementById('js-years-months');
                // Notice we changed this to item.years_of_stay to match your column name!
                if (yearsMonthsInput && item.years_of_stay && String(item.years_of_stay).trim() !== '') {
                    yearsMonthsInput.value = item.years_of_stay;
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
            updateJobSeekerActiveItem();
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + currentOptions.length) % currentOptions.length;
            updateJobSeekerActiveItem();
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
function updateJobSeekerActiveItem() {

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
        var card = e.target.closest('.service-card[data-service="job-seeker"]');
        if (card) {
            e.stopImmediatePropagation();
            if (!window.isEditing) resetJobSeekerFormToDefault();
            openJobSeekerForm(); 
        }
    });

    formBack.addEventListener('click', closeJobSeekerForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeJobSeekerForm();
    });

    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    function saveCurrentFormToCart() {
        if (!validateJobSeekerForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'First Time Job Seeker', 
            requestor_name: document.getElementById('js-fullname').value,
            fullname: document.getElementById('js-fullname').value,
            address: document.getElementById('js-address').value,
            years_months: document.getElementById('js-years-months').value,
            phone: document.getElementById('js-phone').value
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
        if(saveCurrentFormToCart()) closeJobSeekerForm(); 
    });

    function openJobSeekerForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;
    }
    
    function closeJobSeekerForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetJobSeekerFormToDefault, 300);
    }

    function resetJobSeekerFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;
        form.reset();

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="job-seeker-terms-check" class="rbi-checkbox">
                <label for="job-seeker-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#job-seeker-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearJobSeekerErrors();
    }

    function validateJobSeekerForm() {
        clearJobSeekerErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            if (!field.value.trim()) {
                markJobSeekerError(field, 'This field is required.');
                valid = false;
            }
        });

        var phone = document.getElementById('js-phone');
        if (phone && phone.value && !/^\d{11}$/.test(phone.value.trim())) {
            markJobSeekerError(phone, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
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
        form.querySelectorAll('.js-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.js-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    function buildJobSeekerFormModal() {
        if(document.getElementById('job-seeker-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="job-seeker-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="job-seeker-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
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
                            <label class="rbi-label" for="js-fullname">Full Name: <span class="req">*</span></label>
                            <input type="text" id="js-fullname" class="rbi-input" data-required="true" placeholder="FULL NAME" maxlength="100">
                            <span class="js-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="js-field">
                            <label class="rbi-label" for="js-address">Home Address: <span class="req">*</span></label>
                            <input type="text" id="js-address" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="js-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="js-field">
                            <label class="rbi-label" for="js-years-months">Years/Months: <span class="req">*</span></label>
                            <input type="text" id="js-years-months" class="rbi-input" data-required="true" placeholder="YEARS/MONTHS" maxlength="50">
                            <span class="js-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="js-field">
                            <label class="rbi-label" for="js-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="js-certificate" class="rbi-input readonly-field" value="FIRST TIME JOB SEEKER" readonly>
                            <span class="js-error-msg"></span>
                        </div>
                        <div class="js-field">
                            <label class="rbi-label" for="js-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="js-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="js-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="job-seeker-terms-check" class="rbi-checkbox">
                        <label for="job-seeker-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="job-seeker-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

window.populateJobSeekerForm = function(data) {
    window.isEditing = true;
    const jobSeekerCard = document.querySelector('.service-card[data-service="job-seeker"]');
    if (jobSeekerCard) jobSeekerCard.click();

    setTimeout(() => {
        const addBtn = document.getElementById('job-seeker-add-btn');

        document.getElementById('js-fullname').value = data.fullname || '';
        document.getElementById('js-address').value = data.address || '';
        document.getElementById('js-years-months').value = data.years_months || '';
        document.getElementById('js-phone').value = data.phone || '';

        const termsRow = document.getElementById('job-seeker-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }
    }, 150);
};