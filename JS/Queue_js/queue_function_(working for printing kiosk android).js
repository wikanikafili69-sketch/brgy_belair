/* ========================================
   BARANGAY MANAGEMENT SYSTEM
   queue_function.js — Login & Kiosk Cart Scripts
   ======================================== */

window.residentList = [];

// 🖨️ PRINT SETTINGS TOGGLE
const ENABLE_TICKET_PRINTING = true; 

// 🔥 NEW: TICKET MODE TOGGLE
// Options: 
// 'preview'  -> Shows a custom on-screen popup to review the ticket before printing.
// 'straight' -> Immediately fires the print command (requires Chrome --kiosk-printing to be truly silent).
const TICKET_MODE = 'straight'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Password Visibility (Login Page) ---
    const toggleBtn = document.getElementById('togglePassword');
    const passInput = document.getElementById('password');
    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', function () {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            this.textContent = isPass ? 'Hide' : 'Show';
        });
    }

    // --- 2. Initialize Cart Logic (Dashboard Page) ---
    if (document.getElementById('kiosk-cart-widget')) {
        initKioskCartLogic();
    }

    // ✅ PRIORITY MODAL LOGIC
    initPriorityModal();

    loadResidentAutoFill();
});

function loadResidentAutoFill() {
    fetch('API/Queue/user_autofill_api.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.residentList = data.data;
            }
        })
        .catch(err => console.error('Autofill Error:', err));
}

// GLOBAL EDIT MODE HANDLER
window.setEditMode = function(isEdit) {
    window.editingIndex = isEdit ? window.editingIndex : null;
};

function initKioskCartLogic() {
    const cartWidget    = document.getElementById('kiosk-cart-widget');
    const cartCountEl   = document.getElementById('kiosk-cart-count');
    const viewListBtn   = document.getElementById('kiosk-cart-view-btn');
    const clearCartBtn  = document.getElementById('kiosk-cart-clear-btn');
    const checkoutBtn   = document.getElementById('kiosk-cart-checkout-btn');

    const listOverlay   = document.getElementById('cart-details-overlay');
    const itemsList     = document.getElementById('cart-items-list');
    const closeListBtn  = document.getElementById('close-cart-details');

    const successOverlay = document.getElementById('global-success-overlay');
    const batchNumEl     = document.getElementById('global-batch-number');
    const finishBtn      = document.getElementById('global-done-btn');

    // ── REFRESH UI ──
    window.updateCartUI = function() {
        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        cartCountEl.textContent = cart.length;
        if (cart.length > 0) {
            cartWidget.classList.add('visible');
        } else {
            cartWidget.classList.remove('visible');
            listOverlay.classList.remove('active');
        }
    };

    // ── REMOVE ITEM ──
    window.removeItemFromCart = function(index) {
        if(!confirm("Are you sure you want to remove this request?")) return;
        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        window.updateCartUI();
        renderCartList();
    };

    // ── EDIT ITEM ──
    window.editItemFromCart = function(index) {
        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        let item = cart[index];

        window.editingIndex = index;
        window.setEditMode(true);

        const listOverlay = document.getElementById('cart-details-overlay');
        if(listOverlay) listOverlay.classList.remove('active');

        if (item.service_type === 'Business Clearance' && typeof window.populateBusinessForm === 'function') {
            window.populateBusinessForm(item);
        } else if (item.service_type === 'Concrete Pouring' && typeof window.populateConcreteForm === 'function') {
            window.populateConcreteForm(item);
        } else if (item.service_type === 'Truck / Delivery' && typeof window.populateDeliveryForm === 'function') {
            window.populateDeliveryForm(item);
        } else if (item.service_type === 'Certificate of Indigency' && typeof window.populateIndigencyForm === 'function') {
            window.populateIndigencyForm(item);
        } else if (item.service_type === 'First Time Job Seeker' && typeof window.populateJobSeekerForm === 'function') {
            window.populateJobSeekerForm(item);
        } else if (item.service_type === 'Legal Guardian Certificate' && typeof window.populateLegalGuardianForm === 'function') {
            window.populateLegalGuardianForm(item);
        } else if (item.service_type === 'Certificate of Low Income' && typeof window.populateLowIncomeForm === 'function') {
            window.populateLowIncomeForm(item);
        } else if (item.service_type === 'Certificate of Residency' && typeof window.populateResidencyForm === 'function') {
            window.populateResidencyForm(item);
        } else if (item.service_type === 'Certificate of Tent Permit' && typeof window.populateTentPermitForm === 'function') {
            window.populateTentPermitForm(item);
        }
        else if (item.service_type === 'Other Services' && typeof window.openOthersForm === 'function') {
            window.openOthersForm(item);
        }
        else if (item.service_type === 'Barangay ID' && typeof window.openIDForm === 'function') {
            window.openIDForm(item);
        }
    };

    // ── RENDER LIST ──
    function renderCartList() {
        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        itemsList.innerHTML = ''; 

        if (cart.length === 0) {
            listOverlay.classList.remove('active');
            return;
        }

        cart.forEach((item, index) => {
            let row = document.createElement('div');
            let clientName = item.requestor_name || item.fullname || 'Walk-In';

            row.innerHTML = `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:15px;
                    border:1px solid #e2e8f0;
                    border-radius:10px;
                    margin-bottom:12px;
                    background:#f8fafc;
                ">
                    <div style="flex:1;">
                        <div style="font-weight:800; color:#0f172a; font-size:1rem; margin-bottom:4px;">
                            ${item.service_type}
                        </div>
                        <div style="color:#64748b; font-size:0.85rem;">
                            Requestor: ${clientName}
                        </div>
                        ${item.photo ? `<img src="${item.photo}" style="width:45px; height:45px; object-fit:cover; border-radius:6px; margin-top:8px;">` : ''}
                    </div>

                    <div style="display:flex; gap:8px;">
                        <button onclick="editItemFromCart(${index})" style="background:#2c57e5; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">Edit</button>
                        <button onclick="removeItemFromCart(${index})" style="background:#ef4444; color:#fff; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.8rem;">Remove</button>
                    </div>
                </div>
            `;
            itemsList.appendChild(row);
        });
    }

    // ── VIEW LIST ──
    viewListBtn.addEventListener('click', () => {
        renderCartList();
        listOverlay.classList.add('active');
    });

    if(closeListBtn) closeListBtn.addEventListener('click', () => listOverlay.classList.remove('active'));

    clearCartBtn.addEventListener('click', () => {
        if(confirm("Clear all items in your batch?")) {
            localStorage.removeItem('kiosk_cart');
            window.updateCartUI();
        }
    });

    if(finishBtn) finishBtn.addEventListener('click', () => {
        successOverlay.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.updateCartUI();
}


// ✅ PRIORITY MODAL HANDLER
function initPriorityModal() {
    const checkoutBtn = document.getElementById('kiosk-cart-checkout-btn');
    const priorityOverlay = document.getElementById('priority-overlay');
    const closePriority = document.getElementById('close-priority');

    if (!checkoutBtn) return;

    // OPEN MODAL
    checkoutBtn.addEventListener('click', function (e) {
        e.preventDefault();

        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        if (cart.length === 0) return;

        priorityOverlay.classList.add('active');
    });

    // CLOSE MODAL
    if (closePriority) {
        closePriority.addEventListener('click', () => {
            priorityOverlay.classList.remove('active');
        });
    }

    // SELECT PRIORITY
    document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            let selectedPriority = parseInt(this.dataset.priority);
            let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];

            cart = cart.map(item => {
                item.priority = selectedPriority;
                return item;
            });

            localStorage.setItem('kiosk_cart', JSON.stringify(cart));
            priorityOverlay.classList.remove('active');

            submitBatch(cart);
        });
    });
}


// ✅ FINAL SUBMIT FUNCTION
function submitBatch(cart) {
    const checkoutBtn = document.getElementById('kiosk-cart-checkout-btn');
    const listOverlay = document.getElementById('cart-details-overlay');
    const successOverlay = document.getElementById('global-success-overlay');
    const batchNumEl = document.getElementById('global-batch-number');

    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = 'Processing...';

    fetch('API/Queue/submit_batch_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart)
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            localStorage.removeItem('kiosk_cart');
            window.updateCartUI();
            listOverlay.classList.remove('active');

            batchNumEl.textContent = data.queue_no;
            successOverlay.classList.add('active');

            // 🖨️ TRIGGER THERMAL RECEIPT PRINTING
            if (ENABLE_TICKET_PRINTING) {
                processQueueTicket(data.queue_no);
            }

        } else {
            alert(data.message);
        }
    })
    .catch(() => alert("Network error"))
    .finally(() => {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Submit Batch';
    });
}

// ========================================
// 🖨️ 57mm THERMAL RECEIPT PRINTER LOGIC
// ========================================

function getReceiptHTML(queueNo) {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const logoPath = '../Images/brgy_logo.png'; 

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { 
                    size: 57mm auto; 
                    margin: 0; 
                }
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    width: 57mm;
                    margin: 0;
                    padding: 4mm;
                    text-align: center;
                    color: black;
                    box-sizing: border-box;
                    background: white;
                }
                .logo {
                    width: 45px;
                    height: 45px;
                    margin-bottom: 5px;
                    filter: grayscale(100%); 
                }
                .header {
                    font-size: 14px;
                    font-weight: 900;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .sub-header {
                    font-size: 10px;
                    margin-bottom: 10px;
                }
                .divider {
                    border-top: 1px dashed black;
                    margin: 10px 0;
                }
                .queue-label {
                    font-size: 11px;
                    font-weight: bold;
                    margin-top: 10px;
                    text-transform: uppercase;
                }
                .queue-number {
                    font-size: 28px;
                    font-weight: 900;
                    margin: 5px 0;
                    padding: 5px 0;
                    border: 2px solid black;
                    border-radius: 5px;
                }
                .date-time {
                    font-size: 10px;
                    margin-top: 5px;
                }
                .footer {
                    font-size: 9px;
                    margin-top: 12px;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <img src="${logoPath}" class="logo" onerror="this.style.display='none'">
            <div class="header">Barangay 101</div>
            <div class="sub-header">Document Request</div>
            
            <div class="divider"></div>
            
            <div class="queue-label">Your Queue Number</div>
            <div class="queue-number">${queueNo}</div>
            
            <div class="divider"></div>
            
            <div class="date-time">${dateFormatted} &bull; ${timeFormatted}</div>
            
            <div class="footer">Please wait for your number<br>to be called by the staff.</div>
        </body>
        </html>
    `;
}

// Routes the logic based on the TICKET_MODE setting
function processQueueTicket(queueNo) {
    if (TICKET_MODE === 'preview') {
        showPreviewModal(queueNo);
    } else {
        executeHiddenPrint(queueNo);
    }
}

// 🔥 NEW: Custom On-Screen Preview Modal
function showPreviewModal(queueNo) {
    const html = getReceiptHTML(queueNo);
    
    // Create the overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    // Create the "Receipt Box" wrapper
    const receiptBox = document.createElement('div');
    receiptBox.style.backgroundColor = 'white';
    receiptBox.style.width = '250px'; // Slightly larger for screen visibility
    receiptBox.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    receiptBox.style.borderRadius = '8px';
    receiptBox.style.overflow = 'hidden';
    
    // Create an iframe to hold the exact receipt styling safely
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '350px';
    iframe.style.border = 'none';
    receiptBox.appendChild(iframe);
    
    // Controls
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '10px';
    controls.style.marginTop = '20px';
    
    const printBtn = document.createElement('button');
    printBtn.innerText = '🖨️ Print Ticket';
    printBtn.style.padding = '12px 24px';
    printBtn.style.backgroundColor = '#22c55e';
    printBtn.style.color = 'white';
    printBtn.style.border = 'none';
    printBtn.style.borderRadius = '6px';
    printBtn.style.fontWeight = 'bold';
    printBtn.style.cursor = 'pointer';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerText = 'Close';
    closeBtn.style.padding = '12px 24px';
    closeBtn.style.backgroundColor = '#ef4444';
    closeBtn.style.color = 'white';
    closeBtn.style.border = 'none';
    closeBtn.style.borderRadius = '6px';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';

    controls.appendChild(closeBtn);
    controls.appendChild(printBtn);
    
    overlay.appendChild(receiptBox);
    overlay.appendChild(controls);
    document.body.appendChild(overlay);

    // Inject HTML into the preview iframe
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    // Event Listeners
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    printBtn.onclick = () => {
        executeHiddenPrint(queueNo);
        document.body.removeChild(overlay);
    };
}

function executeHiddenPrint(queueNo) {

    const now = new Date();

    const dateFormatted = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Thermal receipt text
    let receipt =
`BARANGAY 101
Document Request
--------------------------
QUEUE NUMBER

${queueNo}

--------------------------
${dateFormatted}
${timeFormatted}

Please wait for your number
to be called by the staff.
`;

    // Encode for RawBT
    const encoded =
        btoa(unescape(encodeURIComponent(receipt)));

    // Open RawBT print
    window.location.href =
        "rawbt:base64," + encoded;
}