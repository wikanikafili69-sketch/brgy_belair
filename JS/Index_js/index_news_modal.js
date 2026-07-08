// ========================================
// BARANGAY — NEWS ANNOUNCEMENT MODALS (API DRIVEN)
// JS/Index_js/index_news_modal.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initNewsModal();
});

function initNewsModal() {
    var announcements = []; // Will hold the data from the API
    var overlay  = document.getElementById('news-detail-overlay');
    var closeBtn = document.getElementById('news-modal-close');

    // ── 1. BUILD MODAL HTML FIRST ─────────────────────────────
    buildNewsModal();

    // Re-select overlay and closeBtn after they are injected into the DOM
    overlay  = document.getElementById('news-detail-overlay');
    closeBtn = document.getElementById('news-modal-close');

    if (!overlay || !closeBtn) return;

    // ── 2. FETCH DATA FROM API ────────────────────────────────
    fetch('API/Index/get_announcements_api.php')
        .then(response => response.json())
        .then(res => {
            if (res.success && res.data) {
                let combinedData = [];

                // Safely combine the featured and list arrays
                if (Array.isArray(res.data.featured)) {
                    combinedData = combinedData.concat(res.data.featured);
                }
                if (Array.isArray(res.data.list)) {
                    combinedData = combinedData.concat(res.data.list);
                }

                // FILTER OUT THE DUMMY/BLANK BUGS & MAP EVENT DATE
                announcements = combinedData
                    .filter(dbItem => dbItem && dbItem.id && dbItem.title) // THIS LINE KILLS THE BLANK ITEMS
                    .map(function(dbItem) {
                        return {
                            id: parseInt(dbItem.id),
                            icon: dbItem.icon || '📢',
                            tag: dbItem.tag || 'Update',
                            tagClass: dbItem.tagClass || 'chip-default',
                            title: dbItem.title,
                            excerpt: dbItem.excerpt,
                            date: dbItem.formatted_date || dbItem.publish_date,
                            eventDate: dbItem.event_date, // <--- THIS MAKES THE CALENDAR DOTS WORK!
                            type: dbItem.type,
                            // FORCE REMOVE '../' FROM IMAGE PATH SO IT DOESN'T BREAK IN MODAL
                            thumb: dbItem.thumb ? dbItem.thumb.replace('../', '') : '', 
                            isFeatured: parseInt(dbItem.is_featured) === 1,
                            author: dbItem.created_by || 'Admin'
                        };
                    });

                // Expose to calendar
                window._barangayAnnouncements = announcements;
            } else {
                console.error("Failed to load announcements:", res.message);
            }
        })
        .catch(error => console.error("API Fetch Error:", error));

    // ── 3. ATTACH EVENTS ─────────────────────────────────────
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // Attach click to ALL Featured Cards (Updated for the 3-column grid)
    var featuredCards = document.querySelectorAll('.news-card-featured');
    featuredCards.forEach(function (card) {
        card.addEventListener('click', function () {
            var announcementId = parseInt(this.getAttribute('data-id'));
            openModal(announcementId); 
        });
    });

    // Attach click to List Items
    var listItems = document.querySelectorAll('.news-list-item');
    listItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var announcementId = parseInt(this.getAttribute('data-id'));
            openModal(announcementId);
        });
    });

    // Public function to open modal (used by calendar)
    window.openNewsModal = function (id) {
        openModal(parseInt(id));
    };

    // ── 4. OPEN & CLOSE FUNCTIONS ─────────────────────────────
    function openModal(id) {
        if (!announcements.length) return; // Prevent opening if API hasn't loaded
        
        var announcement = announcements.find(function (a) { return a.id === id; });
        if (!announcement) return;

        // Populate DOM elements
        var thumbImg   = document.getElementById('news-modal-thumb-img');
        var thumbIcon  = document.getElementById('news-modal-thumb-icon');
        var chipEl     = document.getElementById('news-modal-chip');
        var titleEl    = document.getElementById('news-modal-title');
        var excerptEl  = document.getElementById('news-modal-excerpt');
        var metaDateEl = document.getElementById('news-modal-meta-date');
        var metaTypeEl = document.getElementById('news-modal-meta-type');

        // FIXED FALLBACK IMAGE PATH (Removed ../)
        if (thumbImg)  thumbImg.src = announcement.thumb || 'Images/BARANGAY_BG.jpg';
        if (thumbIcon) thumbIcon.textContent = announcement.icon || '📢';
        if (chipEl) {
            chipEl.textContent = announcement.tag || '';
            chipEl.className   = 'news-modal-chip ' + (announcement.tagClass || 'chip-default');
        }
        if (titleEl) titleEl.textContent = announcement.title || '';
        if (excerptEl) excerptEl.textContent = announcement.excerpt || '';
        if (metaDateEl) metaDateEl.innerHTML = (announcement.date || '') + ' <span style="font-weight:normal;color:#8fa0c0;">by</span> ' + announcement.author;
        if (metaTypeEl) metaTypeEl.textContent = announcement.type || '';

        // Show overlay
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // ── 5. HTML BUILDER ───────────────────────────────────────
    function buildNewsModal() {
        var html = [
            '<div class="news-overlay" id="news-detail-overlay" role="dialog" aria-modal="true">',
            '  <div class="news-modal">',
            '    <button class="news-modal-close" id="news-modal-close">✕</button>',
            '    <div class="news-modal-thumb">',
            '      <img id="news-modal-thumb-img" src="" alt="Announcement image">',
            '      <div class="news-modal-thumb-overlay"></div>',
            '      <span class="news-modal-thumb-icon" id="news-modal-thumb-icon">📢</span>',
            '    </div>',
            '    <div class="news-modal-body">',
            '      <span class="news-modal-chip chip-gold" id="news-modal-chip">Tag</span>',
            '      <h2 class="news-modal-title" id="news-modal-title"></h2>',
            '      <div class="news-modal-divider"></div>',
            '      <p class="news-modal-excerpt" id="news-modal-excerpt"></p>',
            '      <div class="news-modal-meta">',
            '        <div class="news-modal-meta-item">',
            '          <span>📅</span>',
            '          <span>Posted: <strong id="news-modal-meta-date"></strong></span>',
            '        </div>',
            '        <div class="news-modal-meta-item">',
            '          <span>📢</span>',
            '          <span>Type: <strong id="news-modal-meta-type"></strong></span>',
            '        </div>',
            '      </div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        document.body.insertAdjacentHTML('beforeend', html);
    }
}