// ========================================
// BARANGAY OFFICIALS MODAL - JS
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initOfficialsModal();
});

function initOfficialsModal() {

    // ── AUTO-SLIDE INTERVAL (milliseconds)
    var AUTO_INTERVAL = 3000;

    // ── OFFICIALS DATA (PULLED DYNAMICALLY FROM PHP/DATABASE)
    var officialsData = window.barangayOfficialsData || [];

    // ── BUILD MODAL HTML AND INJECT INTO BODY
    buildModal();

    // ── CACHE DOM REFS (after injection)
    var overlay   = document.getElementById('officials-overlay');
    var modal     = document.getElementById('officials-modal');
    var closeBtn  = document.getElementById('officials-modal-close');
    var photoArea = document.getElementById('officials-photo-area');
    var dotsWrap  = document.getElementById('officials-photo-dots');
    var prevBtn   = document.getElementById('officials-photo-prev');
    var nextBtn   = document.getElementById('officials-photo-next');
    var nameEl    = document.getElementById('officials-modal-name');
    var posEl     = document.getElementById('officials-modal-position');
    var bioEl     = document.getElementById('officials-modal-bio');
    var detailsEl = document.getElementById('officials-modal-details');

    // ── STATE
    var currentSlide    = 0;
    var slideTimer      = null;
    var currentOfficial = null;

    // ── ATTACH CLICK TO EACH OFFICIAL CARD
    // ✅ FIX: Read data-index from the card attribute, not the forEach loop index
    var cards = document.querySelectorAll('.official-card');
    cards.forEach(function (card) {
        var dataIndex = parseInt(card.getAttribute('data-index'), 10);

        card.addEventListener('click', function () {
            openModal(dataIndex); // ← uses data-index from PHP, always correct
        });

        // Keyboard accessibility
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'View profile of ' + (officialsData[dataIndex] ? officialsData[dataIndex].name : 'official'));
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(dataIndex);
            }
        });
    });

    // ── CLOSE EVENTS
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
        if (e.key === 'ArrowLeft' && overlay.classList.contains('active')) showSlide(currentSlide - 1);
        if (e.key === 'ArrowRight' && overlay.classList.contains('active')) showSlide(currentSlide + 1);
    });

    // ── PREV / NEXT ARROWS
    prevBtn.addEventListener('click', function () { showSlide(currentSlide - 1); });
    nextBtn.addEventListener('click', function () { showSlide(currentSlide + 1); });

    // ─────────────────────────────────────
    //  OPEN MODAL
    // ─────────────────────────────────────
    function openModal(index) {
        currentOfficial = officialsData[index] || null;

        // ✅ FIX: Debug log so you can verify the correct data is loading
        console.log('Opening official index:', index, currentOfficial);

        if (!currentOfficial) {
            console.warn('No official found at index:', index);
            return;
        }

        // Populate text
        nameEl.textContent = currentOfficial.name;
        posEl.textContent  = currentOfficial.position;
        bioEl.textContent  = currentOfficial.bio;

        // Populate detail badges
        detailsEl.innerHTML = '';
        var details = currentOfficial.details || [];

        // ✅ FIX: Handle both array and object (in case JSON decode returns object)
        if (!Array.isArray(details)) {
            details = Object.values(details);
        }

        details.forEach(function (detail) {
            var badge = document.createElement('span');
            badge.className   = 'officials-detail-badge';
            badge.textContent = detail;
            detailsEl.appendChild(badge);
        });

        // Build photo slides
        var photos = currentOfficial.photos || [];

        // ✅ FIX: Handle both array and object
        if (!Array.isArray(photos)) {
            photos = Object.values(photos);
        }

        buildSlides(photos);

        // Show overlay
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Show first slide & start auto-play
        showSlide(0);
        startAutoSlide();
    }

    // ─────────────────────────────────────
    //  CLOSE MODAL
    // ─────────────────────────────────────
    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        stopAutoSlide();
    }

    // ─────────────────────────────────────
    //  BUILD PHOTO SLIDES
    // ─────────────────────────────────────
    function buildSlides(photos) {
        photoArea.innerHTML = '';
        dotsWrap.innerHTML  = '';

        photoArea.appendChild(prevBtn);
        photoArea.appendChild(nextBtn);
        photoArea.appendChild(dotsWrap);

        if (!photos || photos.length === 0) {
            var placeholder = document.createElement('div');
            placeholder.className   = 'officials-photo-placeholder';
            placeholder.textContent = '👤';
            photoArea.insertBefore(placeholder, prevBtn);
            prevBtn.style.display  = 'none';
            nextBtn.style.display  = 'none';
            dotsWrap.style.display = 'none';
            return;
        }

        prevBtn.style.display  = photos.length > 1 ? 'flex' : 'none';
        nextBtn.style.display  = photos.length > 1 ? 'flex' : 'none';
        dotsWrap.style.display = photos.length > 1 ? 'flex' : 'none';

        photos.forEach(function (src, i) {
            var slide = document.createElement('div');
            slide.className    = 'officials-photo-slide';
            slide.dataset.index = i;

            var img = document.createElement('img');
            img.alt = 'Official photo ' + (i + 1);
            img.src = src;
            img.onerror = function () {
                slide.innerHTML = '<div class="officials-photo-placeholder">👤</div>';
            };
            slide.appendChild(img);

            photoArea.insertBefore(slide, prevBtn);

            if (photos.length > 1) {
                var dot = document.createElement('button');
                dot.className = 'officials-photo-dot';
                dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
                dot.dataset.index = i;
                dot.addEventListener('click', function () {
                    showSlide(parseInt(this.dataset.index));
                    resetAutoSlide();
                });
                dotsWrap.appendChild(dot);
            }
        });
    }

    // ─────────────────────────────────────
    //  SHOW SLIDE
    // ─────────────────────────────────────
    function showSlide(index) {
        var slides = photoArea.querySelectorAll('.officials-photo-slide');
        var dots   = dotsWrap.querySelectorAll('.officials-photo-dot');

        if (slides.length === 0) return;

        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentSlide = index;

        slides.forEach(function (s, i) {
            s.classList.toggle('active', i === currentSlide);
        });
        dots.forEach(function (d, i) {
            d.classList.toggle('active', i === currentSlide);
        });
    }

    // ─────────────────────────────────────
    //  AUTO-SLIDE
    // ─────────────────────────────────────
    function startAutoSlide() {
        stopAutoSlide();
        var slides = photoArea.querySelectorAll('.officials-photo-slide');
        if (slides.length <= 1) return;
        slideTimer = setInterval(function () {
            showSlide(currentSlide + 1);
        }, AUTO_INTERVAL);
    }

    function stopAutoSlide() {
        if (slideTimer) {
            clearInterval(slideTimer);
            slideTimer = null;
        }
    }

    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }

    // ─────────────────────────────────────
    //  BUILD MODAL HTML
    // ─────────────────────────────────────
    function buildModal() {
        if (document.getElementById('officials-overlay')) return;

        var html = [
            '<div class="officials-overlay" id="officials-overlay" role="dialog" aria-modal="true" aria-labelledby="officials-modal-name">',
            '  <div class="officials-modal" id="officials-modal">',
            '    <div class="officials-photo-area" id="officials-photo-area">',
            '      <button class="officials-photo-prev" id="officials-photo-prev" aria-label="Previous photo">&#8592;</button>',
            '      <button class="officials-photo-next" id="officials-photo-next" aria-label="Next photo">&#8594;</button>',
            '      <div class="officials-photo-dots" id="officials-photo-dots"></div>',
            '    </div>',
            '    <button class="officials-modal-close" id="officials-modal-close" aria-label="Close profile">✕</button>',
            '    <div class="officials-modal-content">',
            '      <h2 class="officials-modal-name" id="officials-modal-name"></h2>',
            '      <p class="officials-modal-position" id="officials-modal-position"></p>',
            '      <div class="officials-modal-divider"></div>',
            '      <p class="officials-modal-bio" id="officials-modal-bio"></p>',
            '      <div class="officials-modal-details" id="officials-modal-details"></div>',
            '    </div>',
            '  </div>',
            '</div>'
        ].join('\n');

        document.body.insertAdjacentHTML('beforeend', html);
    }
}