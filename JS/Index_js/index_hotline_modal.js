

document.addEventListener('DOMContentLoaded', function () {
    initHotlineModal();
});

function initHotlineModal() {

    // ── HOTLINE DATA ──────────────────────────────────────────
    var hotlinesData = [
        {
            type:   "barangay",
            icon:   "🏛️",
            dept:   "Barangay Hall Desk",
            number: "(02) 1234-5678"
        },
        {
            type:   "police",
            icon:   "👮",
            dept:   "Local Police Station",
            number: "117 / (02) 8765-4321"
        },
        {
            type:   "fire",
            icon:   "🚒",
            dept:   "Fire Department",
            number: "(02) 9876-5432"
        },
        {
            type:   "health",
            icon:   "🏥",
            dept:   "Barangay Health Center",
            number: "(02) 1122-3344"
        }
        // Add more entries here as needed:
        // {
        //     type:   "disaster",
        //     icon:   "🌪️",
        //     dept:   "DRRM Office",
        //     number: "(02) 5566-7788"
        // }
    ];

    // ── REPLACE EXISTING HOTLINE SECTION CONTENT ────────────
    replaceHotlineSection(hotlinesData);

    // ── BUILD & INJECT MODAL ──────────────────────────────────
    buildModal(hotlinesData);

    // ── CACHE REFS ────────────────────────────────────────────
    var overlay  = document.getElementById('hotline-overlay');
    var closeBtn = document.getElementById('hotline-modal-close');
    var trigger  = document.getElementById('hotline-trigger-card');

    if (!overlay || !closeBtn || !trigger) return;

    // ── EVENTS ────────────────────────────────────────────────
    trigger.addEventListener('click', openModal);
    trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(); }
    });

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // Desktop: alert fallback for CALL NOW buttons
    document.querySelectorAll('.hotline-item-call').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (!isMobile) {
                e.preventDefault();
                var number = this.getAttribute('href').replace('tel:', '');
                alert('Please call: ' + number);
            }
        });
    });

    // ─────────────────────────────────────────────────────────
    function openModal() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        staggerItems();
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function staggerItems() {
        var items = document.querySelectorAll('.hotline-item');
        items.forEach(function (item, i) {
            item.style.opacity   = '0';
            item.style.transform = 'translateX(-18px)';
            setTimeout(function () {
                item.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                item.style.opacity    = '1';
                item.style.transform  = 'translateX(0)';
            }, 70 * i);
        });
    }


    // ── REPLACE HOTLINE SECTION ───────────────────────────────
    function replaceHotlineSection(data) {
        var grid = document.querySelector('#hotline .hotline-grid');
        if (!grid) return;

        // Replace the entire grid with a single trigger card
        grid.outerHTML = buildTriggerCardHTML(data.length);
    }

    // ── BUILD TRIGGER CARD HTML ───────────────────────────────
    function buildTriggerCardHTML(count) {
        return [
            '<div class="hotline-trigger-wrapper">',
            '  <div class="hotline-trigger-card" id="hotline-trigger-card" role="button" tabindex="0" aria-haspopup="dialog" aria-label="View all emergency hotlines">',
            '    <span class="hotline-trigger-icon">🚨</span>',
            '    <p class="hotline-trigger-title">Emergency Hotlines</p>',
            '    <p class="hotline-trigger-sub">Tap to view all ' + count + ' emergency contacts for our barangay</p>',
            '    <span class="hotline-trigger-badge">',
            '      <span class="hotline-count-chip">' + count + '</span>',
            '      View All Hotlines',
            '    </span>',
            '  </div>',
            '</div>'
        ].join('\n');
    }


    // ── BUILD & INJECT MODAL ──────────────────────────────────
    function buildModal(data) {
        var itemsHTML = data.map(function (h) {
            var tel = h.number.replace(/[^0-9+]/g, '');
            return [
                '<div class="hotline-item" data-type="' + (h.type || 'default') + '">',
                '  <div class="hotline-item-icon">' + h.icon + '</div>',
                '  <div class="hotline-item-info">',
                '    <div class="hotline-item-dept">' + h.dept + '</div>',
                '    <div class="hotline-item-number">' + h.number + '</div>',
                '  </div>',
                '  <a href="tel:' + tel + '" class="hotline-item-call">📞 Call Now</a>',
                '</div>'
            ].join('\n');
        }).join('\n');

        var html = [
            '<div class="hotline-overlay" id="hotline-overlay" role="dialog" aria-modal="true" aria-labelledby="hotline-modal-heading">',
            '  <div class="hotline-modal">',

            '    <!-- Header -->',
            '    <div class="hotline-modal-header">',
            '      <div class="hotline-modal-title-group">',
            '        <span class="hotline-modal-siren">🚨</span>',
            '        <div>',
            '          <span class="hotline-modal-eyebrow">BARANGAY NAME HERE</span>',
            '          <h2 class="hotline-modal-title" id="hotline-modal-heading">Emergency Hotlines</h2>',
            '        </div>',
            '      </div>',
            '      <button class="hotline-modal-close" id="hotline-modal-close" aria-label="Close hotlines">✕</button>',
            '    </div>',

            '    <!-- Body -->',
            '    <div class="hotline-modal-body">',
            '      <p class="hotline-modal-intro">',
            '        In case of emergency, contact any of the departments below immediately.',
            '        All lines are available during and after office hours.',
            '      </p>',
            '      <div class="hotline-list">',
            itemsHTML,
            '      </div>',
            '    </div>',

            '    <!-- Footer -->',
            '    <div class="hotline-modal-footer">',
            '      <p>For life-threatening emergencies, always call <strong>911</strong> first.</p>',
            '    </div>',

            '  </div>',
            '</div>'
        ].join('\n');

        document.body.insertAdjacentHTML('beforeend', html);
    }
}