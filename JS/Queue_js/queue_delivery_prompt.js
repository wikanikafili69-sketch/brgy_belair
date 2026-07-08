// ========================================
// BARANGAY — QUEUE DELIVERY & LOADING/UNLOADING
// JS/queue_delivery_prompt.js
// ========================================

window.editingIndex = null;
window.isEditing = false;

document.addEventListener('DOMContentLoaded', function () {
    initQueueDeliveryPrompt();
});

function initQueueDeliveryPrompt() {

    buildDeliveryFormModal();

    var formOverlay   = document.getElementById('delivery-form-overlay');
    var formBack      = document.getElementById('delivery-form-back');
    var form          = document.getElementById('delivery-request-form');
    var addBtn        = document.getElementById('delivery-add-btn');
    var termsCheck    = document.getElementById('delivery-terms-check');
    var formWrap      = document.getElementById('delivery-form-wrap');

    if (!formOverlay) return;

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

    document.addEventListener('click', function (e) {
        var card = e.target.closest('.service-card[data-service="delivery"]');
        if (card) {
            if (!window.isEditing) resetDeliveryFormToDefault();
            openDeliveryForm();
        }
    });

    formBack.addEventListener('click', closeDeliveryForm);
    formOverlay.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDeliveryForm();
    });

    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'dl-purpose') {
            toggleDeliveryOtherPurpose(e.target.value);
        }
    });

    function toggleDeliveryOtherPurpose(val) {
        var otherWrap  = document.getElementById('dl-other-purpose-wrap');
        var otherInput = document.getElementById('dl-other-purpose');
        if (!otherWrap) return;

        if (val === 'Other') {
            otherWrap.style.display = 'flex';
            otherWrap.classList.add('dl-animate-in');
            if (otherInput) otherInput.setAttribute('data-required', 'true');
        } else {
            otherWrap.style.display = 'none';
            otherWrap.classList.remove('dl-animate-in');
            if (otherInput) {
                otherInput.removeAttribute('data-required');
                otherInput.value = '';
                var field = otherInput.closest('.dl-field');
                if (field) {
                    field.classList.remove('has-error');
                    var errEl = field.querySelector('.dl-error-msg');
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
        if (!validateDeliveryForm()) return false;

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        
        let formData = {
            service_type: 'Truck / Delivery', 
            requestor_name: document.getElementById('dl-company').value, 
            company_name: document.getElementById('dl-company').value,
            location: document.getElementById('dl-location').value,
            date_range: document.getElementById('dl-date-range').value,
            time_from: document.getElementById('dl-time-from').value,
            time_to: document.getElementById('dl-time-to').value,
            vehicles: document.getElementById('dl-vehicles').value,
            purpose: document.getElementById('dl-purpose').value,
            other_purpose: document.getElementById('dl-other-purpose').value,
            phone: document.getElementById('dl-phone').value
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
        if(saveCurrentFormToCart()) closeDeliveryForm(); 
    });

    function openDeliveryForm() {
        formOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        formWrap.style.display = '';
        formOverlay.scrollTop = 0;

        loadFlatpickr(function() {
            flatpickr("#dl-date-range", {
                mode: "range",
                minDate: "today",     
                dateFormat: "F j, Y", 
                locale: { rangeSeparator: " TO " }
            });
        });
    }
    
    function closeDeliveryForm() {
        formOverlay.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(resetDeliveryFormToDefault, 300);
    }

    function resetDeliveryFormToDefault() {
        window.editingIndex = null;
        window.isEditing = false;
        form.reset();

        var dp = document.getElementById('dl-date-range');
        if (dp && dp._flatpickr) dp._flatpickr.clear();

        var otherWrap  = document.getElementById('dl-other-purpose-wrap');
        var otherInput = document.getElementById('dl-other-purpose');
        if (otherWrap)  { otherWrap.style.display = 'none'; otherWrap.classList.remove('dl-animate-in'); }
        if (otherInput) { otherInput.removeAttribute('data-required'); otherInput.value = ''; }

        addBtn.innerHTML = "<span>➕</span> Add to List";
        addBtn.disabled = true;

        const submitRow = form.querySelector('.rbi-submit-row');
        let termsRow = form.querySelector('.rbi-terms-row');

        if (!termsRow) {
            const termsHTML = `
            <div class="rbi-terms-row">
                <input type="checkbox" id="delivery-terms-check" class="rbi-checkbox">
                <label for="delivery-terms-check" class="rbi-terms-label">
                    I agree and accept the terms and conditions
                </label>
            </div>`;
            submitRow.insertAdjacentHTML('beforebegin', termsHTML);
            termsRow = form.querySelector('.rbi-terms-row');
        }

        const termsCheckbox = termsRow.querySelector('#delivery-terms-check');
        termsCheckbox.checked = false;
        termsCheckbox.onchange = function () {
            if (window.isEditing) return;
            addBtn.disabled = !this.checked;
        };

        clearDeliveryErrors();
    }

    function validateDeliveryForm() {
        clearDeliveryErrors();
        var valid = true;

        form.querySelectorAll('[data-required="true"]').forEach(function (field) {
            if (!field.value.trim()) {
                markDeliveryError(field, 'This field is required.');
                valid = false;
            }
        });

        var dateRangeVal = document.getElementById('dl-date-range').value;
        if (dateRangeVal && dateRangeVal.indexOf(' TO ') === -1) {
            var dpEl = document.getElementById('dl-date-range');
            if (dpEl) markDeliveryError(dpEl, 'Please select both a Start Date and End Date.');
            valid = false;
        }

        var timeFrom = document.getElementById('dl-time-from');
        var timeTo   = document.getElementById('dl-time-to');
        if (timeFrom && timeTo && timeFrom.value && timeTo.value) {
            if (timeFrom.value >= timeTo.value) {
                markDeliveryError(timeTo, 'End time must be after start time.');
                valid = false;
            }
        }

        var el = document.getElementById('dl-phone');
        if (el && el.value.trim() && !/^\d{11}$/.test(el.value.trim())) {
            markDeliveryError(el, 'Enter a valid 11-digit number.');
            valid = false;
        }

        if (!valid) {
            var firstErr = form.querySelector('.dl-field.has-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return valid;
    }

    function markDeliveryError(field, msg) {
        var group = field.closest('.dl-field');
        if (!group) return;
        group.classList.add('has-error');
        var errEl = group.querySelector('.dl-error-msg');
        if (errEl) errEl.textContent = msg;
    }

    function clearDeliveryErrors() {
        form.querySelectorAll('.dl-field.has-error').forEach(function (g) {
            g.classList.remove('has-error');
            var errEl = g.querySelector('.dl-error-msg');
            if (errEl) errEl.textContent = '';
        });
    }

    function buildDeliveryFormModal() {
        if(document.getElementById('delivery-form-overlay')) return;
        var html = `
        <div class="residency-form-overlay" id="delivery-form-overlay" role="dialog" aria-modal="true">
            <div class="rbi-topbar">
                <button class="rbi-back-btn" id="delivery-form-back" aria-label="Go back">
                    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Back
                </button>
                <div class="rbi-topbar-title">
                    <span class="rbi-topbar-eyebrow">Barangay Hall</span>
                    <p class="rbi-topbar-heading">Delivery & Loading/Unloading Truck Clearance</p>
                </div>
                <div class="rbi-topbar-spacer"></div>
            </div>

            <div id="delivery-form-wrap">
                <div class="rbi-form-header">
                    <h2 class="rbi-form-title">REQUEST <span>DELIVERY & LOADING/UNLOADING &amp;<br>TEMPORARY PARKING OF DELIVERY SERVICES TRUCK CLEARANCE</span></h2>
                    <div class="rbi-form-divider"></div>
                    <p class="rbi-form-notice">* Please Provide Correct Information</p>
                </div>

                <form class="rbi-form-body residency-form-body" id="delivery-request-form" novalidate>
                    <div class="rbi-section-label">Requestor Information</div>

                    <div class="rbi-row rbi-row-2">
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-company">Company Name: <span class="req">*</span></label>
                            <input type="text" id="dl-company" class="rbi-input" data-required="true" placeholder="COMPANY NAME" maxlength="150">
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-location">Location: <span class="req">*</span></label>
                            <input type="text" id="dl-location" class="rbi-input" data-required="true" placeholder="HOUSE NO., STREET, BRGY, MUNICIPALITY/CITY" maxlength="200">
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-date-range">Date (from-to): <span class="req">*</span></label>
                            <input type="text" id="dl-date-range" class="rbi-input" data-required="true" placeholder="Select Start & End Date" readonly>
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label">Time (from-to): <span class="req">*</span></label>
                            <div class="dl-time-range">
                                <input type="time" id="dl-time-from" class="rbi-input dl-time-input" data-required="true">
                                <span class="dl-time-sep">to</span>
                                <input type="time" id="dl-time-to" class="rbi-input dl-time-input" data-required="true">
                            </div>
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-vehicles">Vehicle(s) / Plate Number: <span class="req">*</span></label>
                            <input type="text" id="dl-vehicles" class="rbi-input" data-required="true" placeholder="VEHICLE(S) / PLATE NUMBER" maxlength="200">
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-3">
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-purpose">Purpose: <span class="req">*</span></label>
                            <select id="dl-purpose" class="rbi-select" data-required="true">
                                <option value="">— Select —</option>
                                <option>Goods Delivery</option>
                                <option>Furniture Moving</option>
                                <option>Construction Materials</option>
                                <option>Appliance Delivery</option>
                                <option>Commercial Supply</option>
                                <option>Other</option>
                            </select>
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-certificate">Certificate: <span class="req">*</span></label>
                            <input type="text" id="dl-certificate" class="rbi-input readonly-field" value="DELIVERY & LOADING/UNLOADING, ETC, CLEARANCE" readonly>
                            <span class="dl-error-msg"></span>
                        </div>
                        <div class="dl-field">
                            <label class="rbi-label" for="dl-phone">Cellphone Number: <span class="req">*</span></label>
                            <input type="tel" id="dl-phone" class="rbi-input" data-required="true" placeholder="09XXXXXXXXX" maxlength="11">
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-row rbi-row-1 dl-extra-row" id="dl-other-purpose-wrap" style="display:none;">
                        <div class="dl-field dl-field-narrow">
                            <label class="rbi-label" for="dl-other-purpose">Specify the Purpose: <span class="req">*</span></label>
                            <input type="text" id="dl-other-purpose" class="rbi-input" placeholder="Please specify your purpose">
                            <span class="dl-error-msg" style="color: #ef4444; font-size: 0.8rem; margin-top: 5px; font-weight: 600; display: block;"></span>
                        </div>
                    </div>

                    <div class="rbi-terms-row">
                        <input type="checkbox" id="delivery-terms-check" class="rbi-checkbox">
                        <label for="delivery-terms-check" class="rbi-terms-label">
                            I agree and accept the terms and conditions
                        </label>
                    </div>

                    <div class="rbi-submit-row" style="display: flex; justify-content: flex-end;">
                        <button type="button" id="delivery-add-btn" class="rbi-submit-btn" disabled><span>➕</span> Add to List</button>
                    </div>
                </form>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
}

window.populateDeliveryForm = function(data) {
    window.isEditing = true;
    const deliveryCard = document.querySelector('.service-card[data-service="delivery"]');
    if (deliveryCard) deliveryCard.click();

    setTimeout(() => {
        const addBtn = document.getElementById('delivery-add-btn');

        document.getElementById('dl-company').value = data.company_name || '';
        document.getElementById('dl-location').value = data.location || '';
        
        const dateInput = document.getElementById('dl-date-range');
        dateInput.value = data.date_range || '';
        if (dateInput._flatpickr) dateInput._flatpickr.setDate(data.date_range || '');

        document.getElementById('dl-time-from').value = data.time_from || '';
        document.getElementById('dl-time-to').value = data.time_to || '';
        document.getElementById('dl-vehicles').value = data.vehicles || '';
        document.getElementById('dl-phone').value = data.phone || '';

        const purposeSelect = document.getElementById('dl-purpose');
        if (data.purpose) {
            purposeSelect.value = data.purpose;
            purposeSelect.dispatchEvent(new Event('change', { bubbles: true })); 
        }
        
        if (data.other_purpose) {
            document.getElementById('dl-other-purpose').value = data.other_purpose;
        }

        const termsRow = document.getElementById('delivery-request-form')?.querySelector('.rbi-terms-row');
        if (termsRow) termsRow.remove();

        if(addBtn) {
            addBtn.innerHTML = "<span>💾</span> Save Changes";
            addBtn.disabled = false;
        }
    }, 150);
};