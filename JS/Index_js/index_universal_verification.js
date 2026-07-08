// ========================================
// BARANGAY — UNIVERSAL RESIDENT VERIFICATION
// JS/index_universal_verification.js
// ========================================

const ResidentVerification = (function() {
    let isBuilt = false;
    let onSuccessCallback = null;

    function buildModal() {
        if (isBuilt) return;

        var html = `
        <div class="rbi-confirm-overlay" id="verify-univ-overlay" role="dialog" aria-modal="true">
            <div class="rbi-confirm-modal" style="text-align: left; max-width: 400px; padding: 32px;">
                <button class="rbi-confirm-close" id="verify-univ-close" aria-label="Close">✕</button>
                <h2 class="rbi-confirm-title" style="margin-bottom: 8px;">Resident Verification</h2>
                <p class="rbi-form-notice" style="margin-bottom: 24px;">Enter your details as registered in RBI to proceed.</p>
                
                <form id="verify-univ-form">
                    <div class="rbi-field" style="margin-bottom: 12px;">
                        <label class="rbi-label">Last Name: <span class="req">*</span></label>
                        <input type="text" id="verify-univ-lastname" class="rbi-input" placeholder="DELA CRUZ" required>
                    </div>
                    
                    <div class="rbi-field" style="margin-bottom: 12px;">
                        <label class="rbi-label">First Name: <span class="req">*</span></label>
                        <input type="text" id="verify-univ-firstname" class="rbi-input" placeholder="JUAN" required>
                    </div>
                    
                    <div class="rbi-row rbi-row-2" style="margin-bottom: 24px; display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                        <div class="rbi-field">
                            <label class="rbi-label">Middle Name: <span style="font-weight:normal; color:#64748b;">(Optional)</span></label>
                            <input type="text" id="verify-univ-middlename" class="rbi-input" placeholder="SANTOS">
                        </div>
                        <div class="rbi-field">
                            <label class="rbi-label">Ext: <span style="font-weight:normal; color:#64748b;">(Optional)</span></label>
                            <input type="text" id="verify-univ-ext" class="rbi-input" placeholder="JR, SR" maxlength="5">
                        </div>
                    </div>

                    <div class="rbi-field" style="margin-bottom: 24px;">
                        <label class="rbi-label">Birth Date: <span class="req">*</span></label>
                        <input type="date" id="verify-univ-birthdate" class="rbi-input" required>
                    </div>

                    <button type="submit" class="rbi-submit-btn" id="verify-univ-submit-btn" style="width: 100%;">
                        <span>🔍</span> Verify Resident
                    </button>
                </form>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', html);

        // Auto-capitalize text inputs
        ['verify-univ-lastname', 'verify-univ-firstname', 'verify-univ-middlename', 'verify-univ-ext'].forEach(function(id) {
            var el = document.getElementById(id);
            if(el) {
                el.addEventListener('input', function() {
                    this.value = this.value.toUpperCase();
                });
            }
        });

        // Event Listeners
        document.getElementById('verify-univ-close').addEventListener('click', close);
        document.getElementById('verify-univ-form').addEventListener('submit', handleSubmit);
        
        isBuilt = true;
    }

    function showToast(message, type) {
        var container = document.getElementById('rbi-toast-container');
        if (!container) return; // Failsafe if toast container isn't ready
        var toast = document.createElement('div');
        toast.className = 'rbi-toast ' + (type === 'error' ? 'rbi-toast-error' : 'rbi-toast-success');
        toast.innerHTML = '<span class="rbi-toast-icon">' + (type === 'error' ? '⚠️' : '✅') + '</span><span class="rbi-toast-text">' + message + '</span>';
        container.appendChild(toast);
        void toast.offsetWidth;
        toast.classList.add('rbi-toast-show');
        setTimeout(() => {
            toast.classList.remove('rbi-toast-show');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    function handleSubmit(e) {
        e.preventDefault();
        
        var btn = document.getElementById('verify-univ-submit-btn');
        var last = document.getElementById('verify-univ-lastname').value.trim();
        var first = document.getElementById('verify-univ-firstname').value.trim();
        var middle = document.getElementById('verify-univ-middlename').value.trim();
        var ext = document.getElementById('verify-univ-ext').value.trim();
        var birthdate = document.getElementById('verify-univ-birthdate').value;

        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span> Checking...';

        fetch('API/Index/verify_resident.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lastname: last,
                firstname: first,
                middlename: middle,
                name_ext: ext,
                birthdate: birthdate
            })
        })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.innerHTML = '<span>🔍</span> Verify Resident';
            
            if(data.success) {
                close();
                // Pass the data back to whatever service called it!
                if (typeof onSuccessCallback === 'function') {
                    onSuccessCallback(data);
                }
            } else {
                showToast(data.message, "error");
                // If it asked for Extension, highlight the field
                if(data.message.includes("Extension")) {
                    document.getElementById('verify-univ-ext').focus();
                    document.getElementById('verify-univ-ext').style.borderColor = "var(--red)";
                }
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = '<span>🔍</span> Verify Resident';
            showToast("A network error occurred. Please try again.", "error");
        });
    }

    function open(callback) {
        buildModal(); // Builds only once
        onSuccessCallback = callback;
        document.getElementById('verify-univ-form').reset();
        document.getElementById('verify-univ-ext').style.borderColor = ""; // reset border
        document.getElementById('verify-univ-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        var overlay = document.getElementById('verify-univ-overlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    return {
        open: open,
        close: close
    };
})();