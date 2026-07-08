// ========================================
// BARANGAY — QUEUE CONCRETE POURING CERTIFICATION (BATCH LOGIC)
// JS/queue_concrete_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueConcretePrompt();
});

function initQueueConcretePrompt() {

    // Only build the form! (Skipping the RBI prompt)
    buildConcreteFormModal();

    var formOverlay   = document.getElementById('concrete-form-overlay');
    var formBack      = document.getElementById('concrete-form-back');
    var form          = document.getElementById('concrete-request-form');
    var addBtn        = document.getElementById('concrete-add-btn');
    var termsCheck    = document.getElementById('concrete-terms-check');
    var formWrap      = document.getElementById('concrete-form-wrap');

    if (!formOverlay) return;

    // ── DYNAMICALLY LOAD FLATPICKR (For Single Range Calendar) ──
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

    // ── INTERCEPT: Concrete service card click ────────────
    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="concrete"]');
        if (card) {
            if (!window.isEditing) {
                resetConcreteFormToDefault();
            }
            openConcreteForm();
        }
    });

    // ── FORM BACK / ESC ───────────────────────────────────
    formBack.addEventListener('click', closeConcreteForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeConcreteForm();
    });

    // ── TERMS CHECKBOX ────────────────────────────────────
    termsCheck.addEventListener('change', function () {
        if (window.isEditing) return;
        addBtn.disabled = !this.checked;
    });

    // ── SAVE TO CART ──────────────────────────────────────
    function saveCurrentFormToCart() {
        if (!validateConcreteForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Concrete Pouring', 
            requestor_name: document.getElementById('cp-company').value, // For the cart UI preview
            company_name: document.getElementById('cp-company').value,
            purpose: document.getElementById('cp-purpose').value,
            location: document.getElementById('cp-location').value,
            date_range: document.getElementById('cp-date-range').value,
            time_from: document.getElementById('cp-time-from').value,
            time_to: document.getElementById('cp-time-to').value,
            vehicles: document.getElementById('cp-vehicles').value,
            phone: document.getElementById('cp-phone').value
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
            closeConcreteForm(); 
        }
    });

    // ── OPEN / CLOSE ──────────────────────────────────────
    function openConcreteForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;

        // ✅ Initialize the Range Calendar Picker
        loadFlatpickr(function() {
            flatpickr("#cp-date-range", {
                mode: "range",
                minDate: "today",     // Blocks past dates
                dateFormat: "F j, Y", // Outputs "April 3, 2026"
                locale: {
                    rangeSeparator: " TO " // Automatically adds " TO " between the two dates
                }
            });
        });
    }
    
    function closeConcreteForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetConcreteFormToDefault, 300);
    }

    // ── RESET TO DEFAULT ──────────────────────────────────
    function resetConcreteFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;

        form.reset();

        // ✅ Clear the calendar visually
        var dp = document.getElementById('cp-date-range');
        if (dp && dp._flatpickr) {
            dp._flatpickr.clear();
        }

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="concrete-terms-check" class="rbi-checkbox">
                <label for="concrete-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#concrete-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearConcreteErrors();
    }

    // ── VALIDATION ────────────────────────────────────────
    function validateConcreteForm() {
        clearConcreteErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            if (!field.value.trim()) {
                markConcreteError(field, 'This field is required.');
                valid = false;
            }
        });

        // ✅ Ensure Date Range actually contains " TO " (meaning they picked start AND end)
        var dateRangeVal = document.getElementById('cp-date-range').value;
        if (dateRangeVal && dateRangeVal.indexOf(' TO ') === -1) {
            var dpEl = document.getElementById('cp-date-range');
            if (dpEl) markConcreteError(dpEl, 'Please select both a Start Date and End Date.');
            valid = false;
        }

        var timeFrom = document.getElementById('cp-time-from');
        var timeTo   = document.getElementById('cp-time-to');
        if (timeFrom && timeTo && timeFrom.value && timeTo.value) {
            if (timeFrom.value >= timeTo.value) {
                markConcreteError(timeTo, 'End time must be after start time.');
                valid = false;
            }
        }

        var phone = document.getElementById('cp-phone');
        if (phone && phone.value && !/^\d{11}$/.test(phone.value.trim())) {
            markConcreteError(phone, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
            var firstErr = form.querySelector('.cp-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markConcreteError(field, msg) {
        var group = field.closest('.cp-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.cp-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearConcreteErrors() {
        form.querySelectorAll('.cp-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.cp-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    // ── BUILD FORM HTML ───────────────────────────────────
    function buildConcreteFormModal() {
        if(document.getElementById('concrete-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="concrete-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="concrete-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
                    <p class="rbi-topbar-heading">Concrete Pouring Certification</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="concrete-form-wrap">
                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST <span>CONCRETE POURING CERTIFICATION</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="concrete-request-form" novalidate>
                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-3">
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-company">Company Name: <span class="req">*</span></label>
                            <input type="text" id="cp-company" class="rbi-input" data-required="true" placeholder="COMPANY NAME" maxlength="150">
                            <span class="cp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-purpose">Purpose: <span class="req">*</span></label>
                            <input type="text" id="cp-purpose" class="rbi-input" data-required="true" placeholder="PURPOSE" maxlength="200">
                            <span class="cp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-location">Location: <span class="req">*</span></label>
                            <input type="text" id="cp-location" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="cp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-date-range">Date (from-to): <span class="req">*</span></label>
                            <input type="text" id="cp-date-range" class="rbi-input" data-required="true" placeholder="Select Start & End Date" readonly>
                            <span class="cp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="cp-field">
                            <label class="rbi-label">Time (from-to): <span class="req">*</span></label>
                            <div class="cp-time-range">
                                <input type="time" id="cp-time-from" class="rbi-input cp-time-input" data-required="true">
                                <span class="cp-time-sep">to</span>
                                <input type="time" id="cp-time-to" class="rbi-input cp-time-input" data-required="true">
                            </div>
                            <span class="cp-error-msg" id="cp-time-error" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-vehicles">Vehicle(s): <span class="req">*</span></label>
                            <input type="text" id="cp-vehicles" class="rbi-input" data-required="true" placeholder="VEHICLE(S)" maxlength="200">
                            <span class="cp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-2">
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="cp-certificate" class="rbi-input readonly-field" value="CONCRETE POURING CERTIFICATION" readonly>
                            <span class="cp-error-msg"></span>
                        </div>
                        <div class="cp-field">
                            <label class="rbi-label" for="cp-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="cp-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="cp-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="concrete-terms-check" class="rbi-checkbox">
                        <label for="concrete-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="concrete-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

// ── GLOBAL POPULATE (EDIT MODE) ──
window.populateConcreteForm = function(data) {

    window.isEditing = true;

    const concreteCard = document.querySelector('.service-card[data-service="concrete"]');
    if (concreteCard) concreteCard.click();

    setTimeout(() => {

        const addBtn = document.getElementById('concrete-add-btn');

        // Fill Form Data
        document.getElementById('cp-company').value = data.company_name || '';
        document.getElementById('cp-purpose').value = data.purpose || '';
        document.getElementById('cp-location').value = data.location || '';
        
        // ✅ Special handling to ensure flatpickr instance reflects the edited date
        const dateInput = document.getElementById('cp-date-range');
        dateInput.value = data.date_range || '';
        if (dateInput._flatpickr) {
            dateInput._flatpickr.setDate(data.date_range || '');
        }

        document.getElementById('cp-time-from').value = data.time_from || '';
        document.getElementById('cp-time-to').value = data.time_to || '';
        document.getElementById('cp-vehicles').value = data.vehicles || '';
        document.getElementById('cp-phone').value = data.phone || '';

        // Remove Terms Row
        const termsRow = document.getElementById('concrete-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        // UI change for edit
        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }

    }, 150);
};