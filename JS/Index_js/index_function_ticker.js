// ========================================
// BARANGAY MANAGEMENT SYSTEM
// index_function_ticker.js
// ========================================
// Handles the announcement ticker bar and
// the News & Announcements section.
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initTicker();
    initNewsSection();
});

// ────────────────────────────────────────
//  TICKER
// ────────────────────────────────────────
function initTicker() {
    var track = document.querySelector('.ticker-track');
    if (!track) return;

    // Pause on hover (already handled by CSS, but keep JS fallback)
    track.addEventListener('mouseenter', function () {
        this.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', function () {
        this.style.animationPlayState = 'running';
    });

    // Pause on touch
    track.addEventListener('touchstart', function () {
        this.style.animationPlayState = 'paused';
    }, { passive: true });
    track.addEventListener('touchend', function () {
        this.style.animationPlayState = 'running';
    });
}

// ────────────────────────────────────────
//  NEWS SECTION — card interactions
// ────────────────────────────────────────
function initNewsSection() {
    // Featured card click
    var featured = document.querySelector('.news-card-featured');
    if (featured) {
        featured.addEventListener('click', function () {
            // Navigate to full article / announcements page
            // Replace with your actual URL:
            // window.location.href = 'announcements.php?id=featured';
            console.log('[BMS] Featured news clicked');
        });
        featured.setAttribute('role', 'button');
        featured.setAttribute('tabindex', '0');
        featured.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // List items click
    document.querySelectorAll('.news-list-item').forEach(function (item, i) {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', function () {
            // window.location.href = 'announcements.php?id=' + i;
            console.log('[BMS] News item ' + i + ' clicked');
        });
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}