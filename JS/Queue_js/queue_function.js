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
window.setEditMode = function (isEdit) {
    window.editingIndex = isEdit ? window.editingIndex : null;
};

function initKioskCartLogic() {
    const cartWidget = document.getElementById('kiosk-cart-widget');
    const cartCountEl = document.getElementById('kiosk-cart-count');
    const viewListBtn = document.getElementById('kiosk-cart-view-btn');
    const clearCartBtn = document.getElementById('kiosk-cart-clear-btn');
    const checkoutBtn = document.getElementById('kiosk-cart-checkout-btn');

    const listOverlay = document.getElementById('cart-details-overlay');
    const itemsList = document.getElementById('cart-items-list');
    const closeListBtn = document.getElementById('close-cart-details');

    const successOverlay = document.getElementById('global-success-overlay');
    const batchNumEl = document.getElementById('global-batch-number');
    const finishBtn = document.getElementById('global-done-btn');

    // ── REFRESH UI ──
    window.updateCartUI = function () {
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
    window.removeItemFromCart = function (index) {
        if (!confirm("Are you sure you want to remove this request?")) return;
        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('kiosk_cart', JSON.stringify(cart));
        window.updateCartUI();
        renderCartList();
    };

    // ── EDIT ITEM ──
    window.editItemFromCart = function (index) {
        let cart = JSON.parse(localStorage.getItem('kiosk_cart')) || [];
        let item = cart[index];

        window.editingIndex = index;
        window.setEditMode(true);

        const listOverlay = document.getElementById('cart-details-overlay');
        if (listOverlay) listOverlay.classList.remove('active');

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

    if (closeListBtn) closeListBtn.addEventListener('click', () => listOverlay.classList.remove('active'));

    clearCartBtn.addEventListener('click', () => {
        if (confirm("Clear all items in your batch?")) {
            localStorage.removeItem('kiosk_cart');
            window.updateCartUI();
        }
    });

    if (finishBtn) finishBtn.addEventListener('click', () => {
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
            if (data.success) {
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
            <meta charset="UTF-8">
            <style>
                @page { 
                    size: 57mm auto; 
                    margin: 0; 
                }
                * {
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    width: 57mm;
                    margin: 0;
                    padding: 3mm 2mm;
                    text-align: center;
                    color: #000;
                    background: #fff;
                }

                /* ---- Header ---- */
                .logo {
                    width: 42px;
                    height: 42px;
                    margin-bottom: 4px;
                    filter: grayscale(100%);
                }
                .header {
                    font-size: 15px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 1px;
                }
                .sub-header {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 6px;
                }

                /* ---- Decorative dividers ---- */
                .divider {
                    border-top: 1px dashed #000;
                    margin: 8px 0;
                }
                .divider-solid {
                    border-top: 2px solid #000;
                    margin: 6px 0;
                }
                .zigzag {
                    width: 100%;
                    height: 8px;
                    margin: 4px 0;
                    background-image: linear-gradient(135deg, #000 25%, transparent 25%),
                                       linear-gradient(225deg, #000 25%, transparent 25%);
                    background-size: 8px 8px;
                    background-position: 0 0;
                }

                /* ---- Queue number block (the star of the show) ---- */
                .queue-label {
                    font-size: 11px;
                    font-weight: 700;
                    margin-top: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1.5px;
                }
                .queue-box {
                    margin: 8px auto 6px;
                    padding: 6px 4px 8px;
                    border: 3px solid #000;
                    border-radius: 8px;
                    width: 100%;
                }
                .queue-number {
                    font-size: 64px;
                    line-height: 1;
                    font-weight: 900;
                    letter-spacing: 1px;
                    margin: 4px 0 0;
                    font-family: 'Arial Black', Helvetica, Arial, sans-serif;
                }

                /* ---- Footer ---- */
                .date-time {
                    font-size: 10px;
                    margin-top: 4px;
                    font-weight: 600;
                }
                .footer {
                    font-size: 9px;
                    margin-top: 10px;
                    font-style: italic;
                    line-height: 1.4;
                }
                .stars {
                    font-size: 11px;
                    letter-spacing: 4px;
                    margin: 4px 0;
                }
            </style>
        </head>
        <body>
            <img src="${logoPath}" class="logo" onerror="this.style.display='none'">
            <div class="header">Barangay 101</div>
            <div class="sub-header">Document Request</div>

            <div class="zigzag"></div>

            <div class="queue-label">Your Queue Number</div>
            <div class="queue-box">
                <div class="queue-number">${queueNo}</div>
            </div>

            <div class="zigzag"></div>

            <div class="date-time">${dateFormatted} &bull; ${timeFormatted}</div>

            <div class="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>

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

// ========================================
// 🖨️ ESC/POS RAW BYTE HELPERS
// (Free RawBT only relays raw bytes to the printer — it can't render
// HTML/CSS. So "bigger text" and "design" have to come from the
// printer's own ESC/POS commands, not from styling.)
// ========================================

const ESC = '\x1B';
const GS = '\x1D';

// GS ! n -> set character size. n's bits: 0-3 = height multiplier (0-7),
// 4-7 = width multiplier (0-7). 0x00 = normal, 0x11 = double W+H,
// 0x33 = quadruple-ish (width x4, height x4) — most 58mm printers cap
// useful legible width around double-to-triple before columns overflow.
const SIZE_NORMAL = GS + '!' + '\x00';
const SIZE_DOUBLE = GS + '!' + '\x11';   // 2x width, 2x height
const SIZE_QUAD   = GS + '!' + '\x33';   // 4x width, 4x height — used for the queue number

const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';

const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_LEFT = ESC + 'a' + '\x00';

const INIT = ESC + '@'; // reset printer state
const CUT = GS + 'V' + '\x00'; // full paper cut (ignored harmlessly if no cutter)

// 32 columns is the safe default print width for 58mm paper at normal font size.
const LINE_WIDTH = 32;

function repeatChar(ch, n) {
    return new Array(Math.max(n, 0) + 1).join(ch);
}

function centerLine(text, width = LINE_WIDTH) {
    const pad = Math.max(0, Math.floor((width - text.length) / 2));
    return repeatChar(' ', pad) + text;
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
    iframe.style.height = '420px';
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

// 🔥 UPDATED: Free RawBT can't render HTML/CSS — it only relays raw bytes
// to the printer. So instead of sending styled HTML, we build a plain-text
// ticket using actual ESC/POS commands for size/bold, plus box-drawing
// characters for a "designed" look (border box, dashed dividers, stars).
//
// RawBT plain-text scheme (works on the free version):
//   rawbt:data:text/plain;base64,<data>
//
// Reference: GS ! n sets character size (Epson ESC/POS spec, "GS !").
function buildQueueReceiptText(queueNo) {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const dashLine = repeatChar('-', LINE_WIDTH);
    const zigzagLine = repeatChar('=', LINE_WIDTH);
    const starsLine = centerLine('* * * * *');

    let out = '';
    out += INIT;
    out += ALIGN_CENTER;

    // Header
    out += SIZE_DOUBLE + BOLD_ON;
    out += 'BARANGAY 101\n';
    out += SIZE_NORMAL + BOLD_OFF;
    out += 'Document Request\n';

    out += zigzagLine + '\n';

    // Queue label
    out += BOLD_ON + 'YOUR QUEUE NUMBER\n' + BOLD_OFF;

    // Top frame rule (drawn at normal size, full 32-col width)
    out += dashLine + '\n';

    // Big queue number — quad size so it's as large as the printer
    // can legibly produce on 58mm paper. Note: at quad size, the
    // printer's effective columns-per-line shrinks (each char is 4x
    // wider), so this is centered by the printer's own centering,
    // not by padding spaces (padding math only applies at normal size).
    out += SIZE_QUAD + BOLD_ON;
    out += queueNo + '\n';
    out += SIZE_NORMAL + BOLD_OFF;

    // Bottom frame rule
    out += dashLine + '\n';
    out += zigzagLine + '\n';

    out += BOLD_ON + dateFormatted + ' - ' + timeFormatted + '\n' + BOLD_OFF;
    out += starsLine + '\n';
    out += '\n';
    out += 'Please wait for your number\n';
    out += 'to be called by the staff.\n';
    out += '\n\n\n';
    out += CUT;

    return out;
}

function executeHiddenPrint(queueNo) {
    const receipt = buildQueueReceiptText(queueNo);

    // Encode for RawBT (handles UTF-8 safely; ESC/POS control bytes pass through as-is)
    const encoded = btoa(unescape(encodeURIComponent(receipt)));

    window.location.href = "rawbt:data:text/plain;base64," + encoded;
}