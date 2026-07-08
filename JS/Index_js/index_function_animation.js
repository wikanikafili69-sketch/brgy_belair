// ========================================
// BARANGAY MANAGEMENT SYSTEM
// index_function_animation.js
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initScrollAnimations();
    initNavigation();
    initParallax(); // Kept safe (it will auto-exit if it doesn't find the old bg)
    initHeroSlider(); // <-- ADDED: Slider Initialization
    initButtonEffects();
    initCallButtons();
    initLazyImages();
    initThemeToggle();
    initPerformanceMonitor();
    initContactModal();
    initGalleryLightbox();
    initGalleryCarousel();
    initMobileMenu();
    initVisionMissionModals();
});

// ────────────────────────────────────────
//  SCROLL ANIMATIONS
// ────────────────────────────────────────
function initScrollAnimations() {
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;

            entry.target.style.opacity = '1';

            if (entry.target.classList.contains('fade-in')) {
                entry.target.style.animation = 'fadeIn 0.8s ease forwards';
            }
            if (entry.target.classList.contains('fade-in-delayed')) {
                entry.target.style.animation =
                    'fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            }
            if (entry.target.classList.contains('fade-in-left')) {
                entry.target.style.animation =
                    'fadeInLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            }
            if (entry.target.classList.contains('fade-in-right')) {
                entry.target.style.animation =
                    'fadeInRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            }

            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll(
        '.fade-in, .fade-in-delayed, .fade-in-up, .fade-in-left, .fade-in-right'
    ).forEach(function (el) {
        observer.observe(el);
    });
}

// ────────────────────────────────────────
//  NAVIGATION
// ────────────────────────────────────────
function initNavigation() {
    var navLinks = document.querySelectorAll('.nav-link');
    var sections = document.querySelectorAll('.page-section, .hero-section, section[id]');

    // Smooth scroll on click
    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.forEach(function (l) { l.classList.remove('active'); });
            this.classList.add('active');

            var targetId = this.getAttribute('href').replace('#', '');
            var target = document.getElementById(targetId);
            if (target) {
                var headerH = document.querySelector('header').offsetHeight;
                window.scrollTo({ top: target.offsetTop - headerH, behavior: 'smooth' });
            }
        });
    });

    // Active link on scroll
    window.addEventListener('scroll', throttle(function () {
        var current = '';
        sections.forEach(function (sec) {
            if (window.pageYOffset >= sec.offsetTop - 220) {
                current = sec.getAttribute('id');
            }
        });
        navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current ||
                link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }, 80));

    // Scroll to top when clicking the logo
    var logoArea = document.querySelector('.logo-area');
    if (logoArea) {
        logoArea.style.cursor = 'pointer'; // Changes mouse to a pointing hand
        logoArea.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}



// ────────────────────────────────────────
//  PARALLAX
// ────────────────────────────────────────
function initParallax() {
    var bg = document.querySelector('.hero-bg-animation');
    if (!bg) return;

    window.addEventListener('mousemove', throttle(function (e) {
        var x = (e.clientX / window.innerWidth) * 18 - 9;
        var y = (e.clientY / window.innerHeight) * 18 - 9;
        bg.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    }, 30));

    window.addEventListener('scroll', function () {
        bg.style.transform = 'translateY(' + window.pageYOffset * 0.45 + 'px)';
    });
}

// ────────────────────────────────────────
//  BUTTON RIPPLE EFFECT
// ────────────────────────────────────────
function initButtonEffects() {
    // Inject ripple style once
    if (!document.getElementById('ripple-style')) {
        var style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent =
            '.ripple{position:absolute;border-radius:50%;background:rgba(255,255,255,0.45);' +
            'transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none}' +
            '@keyframes rippleAnim{to{transform:scale(4);opacity:0}}';
        document.head.appendChild(style);
    }

    document.querySelectorAll('.btn-primary, .apply-clearance-btn, .nav-cta').forEach(function (btn) {
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';

        btn.addEventListener('click', function (e) {
            var rect = this.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height);
            var ripple = document.createElement('span');

            ripple.className = 'ripple';
            ripple.style.cssText =
                'width:' + size + 'px;height:' + size + 'px;' +
                'left:' + (e.clientX - rect.left - size / 2) + 'px;' +
                'top:' + (e.clientY - rect.top - size / 2) + 'px;';

            this.appendChild(ripple);
            setTimeout(function () { ripple.remove(); }, 600);
        });
    });
}

// ────────────────────────────────────────
//  CALL BUTTONS (desktop fallback)
// ────────────────────────────────────────
function initCallButtons() {
    document.querySelectorAll('.call-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
                .test(navigator.userAgent);
            if (!isMobile) {
                e.preventDefault();
                var number = this.getAttribute('href').replace('tel:', '');
                alert('Please call: ' + number);
            }
        });
    });
}

// ────────────────────────────────────────
//  LAZY LOAD IMAGES
// ────────────────────────────────────────
function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    var imgObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
            obs.unobserve(img);
        });
    });

    document.querySelectorAll('img[data-src]').forEach(function (img) {
        imgObserver.observe(img);
    });
}

// ────────────────────────────────────────
//  THEME
// ────────────────────────────────────────
function initThemeToggle() {
    var saved = localStorage.getItem('theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
}

// ────────────────────────────────────────
//  PERFORMANCE MONITOR
// ────────────────────────────────────────
function initPerformanceMonitor() {
    window.addEventListener('load', function () {
        var timing = window.performance && window.performance.timing;
        if (timing) {
            var loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log('[BMS] Page loaded in ' + loadTime + 'ms');
        }
    });

    window.addEventListener('error', function (e) { console.error('[BMS] Error:', e.error); });
    window.addEventListener('unhandledrejection', function (e) { console.error('[BMS] Unhandled:', e.reason); });
}


// ────────────────────────────────────────
//  CONTACT MODAL
// ────────────────────────────────────────
function initContactModal() {
    var modalOverlay = document.getElementById('contact-modal-overlay');
    var openBtn = document.getElementById('open-contact-modal');
    var closeBtn = document.getElementById('contact-modal-close');
    var form = document.getElementById('contactUsForm');

    if (!modalOverlay || !openBtn || !closeBtn) return;

    function openModal() {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Stop background scrolling
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Open & Close Events
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);

    // Close when clicking outside the modal box
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) closeModal();
    });

    // Close on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // Form Submission (Real AJAX/Fetch API)
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault(); // Stop the page from refreshing

            var submitBtn = form.querySelector('button[type="submit"]');

            // Show loading spinner
            setButtonLoading(submitBtn, true);

            // Package the form data (including the file)
            var formData = new FormData(form);

            // Send data to process_contact.php
            fetch('API/Index/process_contact.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert(data.message);
                        form.reset();
                        closeModal();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred while sending your message. Please check your connection.');
                })
                .finally(() => {
                    // Remove loading spinner
                    setButtonLoading(submitBtn, false);
                });
        });
    }
}

// ────────────────────────────────────────
//  MOBILE MENU
// ────────────────────────────────────────
function initMobileMenu() {
    var menuBtn = document.getElementById('mobile-menu-btn');
    var navbar = document.getElementById('navbar');
    var navLinks = document.querySelectorAll('.nav-link');

    if (!menuBtn || !navbar) return;

    // Toggle menu open/close on button click
    menuBtn.addEventListener('click', function () {
        this.classList.toggle('active');
        navbar.classList.toggle('active');
    });

    // Close the menu when a link is clicked
    navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            menuBtn.classList.remove('active');
            navbar.classList.remove('active');
        });
    });
}

// ────────────────────────────────────────
//  UTILITIES
// ────────────────────────────────────────
function debounce(fn, wait) {
    var timer;
    return function () {
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(this, args); }, wait);
    };
}

function throttle(fn, limit) {
    var inThrottle = false;
    return function () {
        if (inThrottle) return;
        fn.apply(this, arguments);
        inThrottle = true;
        setTimeout(function () { inThrottle = false; }, limit);
    };
}

function isInViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top >= 0 && r.left >= 0 &&
        r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        r.right <= (window.innerWidth || document.documentElement.clientWidth);
}

function setButtonLoading(btn, loading) {
    if (loading) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent;
        btn.innerHTML = '<span class="spinner"></span> Loading...';
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.originalText;
    }
}

console.log('[BMS] Animations initialized');

// ────────────────────────────────────────
//  ALBUM GALLERY & SINGLE PHOTO MODAL
// ────────────────────────────────────────
function initGalleryLightbox() {
    var galleryItems = document.querySelectorAll('.gallery-item');
    var lightboxOverlay = document.getElementById('gallery-lightbox-overlay');
    var closeBtn = document.getElementById('lightbox-close');

    var modalTitle = document.getElementById('album-modal-title');
    var modalMonth = document.getElementById('album-modal-month');
    var photoGrid = document.getElementById('album-photo-grid');

    // SINGLE PHOTO ELEMENTS
    var singleOverlay = document.getElementById('single-photo-overlay');
    var singleImg = document.getElementById('single-photo-img');
    var singleCaption = document.getElementById('single-photo-caption');
    var singleCloseBtn = document.getElementById('single-photo-close');

    if (!lightboxOverlay || galleryItems.length === 0) return;

    // 1. OPEN ALBUM MODAL
    function openAlbumModal(title, month, photos) {
        modalTitle.textContent = title;
        modalMonth.textContent = month;
        photoGrid.innerHTML = '';

        photos.forEach(function (photo) {
            var img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.caption;
            img.className = 'album-modal-img';
            img.onerror = function () { this.src = 'Images/BARANGAY_BG.jpg'; };

            // When an image in the grid is clicked, enlarge it!
            img.addEventListener('click', function () {
                openSinglePhoto(photo.src, photo.caption);
            });

            photoGrid.appendChild(img);
        });

        lightboxOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 2. OPEN SINGLE PHOTO
    function openSinglePhoto(src, caption) {
        singleImg.src = src;
        singleCaption.textContent = caption;
        singleOverlay.classList.add('active');
    }

    function closeSinglePhoto() {
        singleOverlay.classList.remove('active');
        // Clear image source after animation finishes
        setTimeout(() => {
            singleImg.src = '';
            singleCaption.textContent = '';
        }, 300);
    }

    // Attach click events to the album cards on the page
    galleryItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var title = this.getAttribute('data-title');
            var month = this.getAttribute('data-month');
            var photosData = this.getAttribute('data-photos');

            if (photosData) {
                var photos = JSON.parse(photosData);
                openAlbumModal(title, month, photos);
            }
        });
    });

    // Event Listeners for Closing Modals
    closeBtn.addEventListener('click', closeLightbox);
    if (singleCloseBtn) singleCloseBtn.addEventListener('click', closeSinglePhoto);

    // Close when clicking the dark background
    lightboxOverlay.addEventListener('click', function (e) {
        if (e.target === lightboxOverlay) closeLightbox();
    });

    if (singleOverlay) {
        singleOverlay.addEventListener('click', function (e) {
            if (e.target === singleOverlay) closeSinglePhoto();
        });
    }

    // Close Modals with the Escape Key (Top-most modal closes first)
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (singleOverlay && singleOverlay.classList.contains('active')) {
                closeSinglePhoto(); // Close picture if open
            } else if (lightboxOverlay.classList.contains('active')) {
                closeLightbox(); // Otherwise, close album grid
            }
        }
    });
}

// ────────────────────────────────────────
//  GALLERY CAROUSEL (AUTO-SCROLL & ARROWS)
// ────────────────────────────────────────
function initGalleryCarousel() {
    const track = document.getElementById('gallery-track');
    const prevBtn = document.querySelector('.prev-arrow');
    const nextBtn = document.querySelector('.next-arrow');
    const wrapper = document.querySelector('.gallery-carousel-wrapper');

    if (!track || !prevBtn || !nextBtn) return;

    // How far to scroll on each click/tick (card width + gap)
    const getScrollAmount = () => track.querySelector('.gallery-item').offsetWidth + 24;

    // Arrow Buttons
    prevBtn.addEventListener('click', () => {
        track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        resetAutoScroll();
    });

    nextBtn.addEventListener('click', () => {
        track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        resetAutoScroll();
    });

    // Auto-Scroll Logic
    let autoScrollInterval;

    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            // Check if we hit the end of the scrollable area
            if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 10) {
                // Smoothly rewind to the beginning
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // Scroll one card over
                track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            }
        }, 5000); // Scrolls every 5 seconds
    }

    function resetAutoScroll() {
        clearInterval(autoScrollInterval);
        startAutoScroll();
    }

    // Pause the auto-scroll when the user's mouse is hovering over the gallery
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => clearInterval(autoScrollInterval));
        wrapper.addEventListener('mouseleave', startAutoScroll);
    }

    // Start the interval
    startAutoScroll();
}

// ────────────────────────────────────────
//  VISION & MISSION MODALS (SEPARATED)
// ────────────────────────────────────────
function initVisionMissionModals() {
    const visionOverlay = document.getElementById('vision-modal-overlay');
    const missionOverlay = document.getElementById('mission-modal-overlay');

    const openVisionBtn = document.getElementById('open-vision-modal');
    const openMissionBtn = document.getElementById('open-mission-modal');

    const closeVisionBtn = document.getElementById('vision-modal-close');
    const closeMissionBtn = document.getElementById('mission-modal-close');

    if (!visionOverlay || !missionOverlay) return;

    function openModal(modal) {
        document.body.style.overflow = 'hidden'; // Stop background scrolling
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => { document.body.style.overflow = ''; }, 300); // Restore scrolling
    }

    // Attach click events to open buttons
    if (openVisionBtn) openVisionBtn.addEventListener('click', () => openModal(visionOverlay));
    if (openMissionBtn) openMissionBtn.addEventListener('click', () => openModal(missionOverlay));

    // Event Listeners for Close buttons
    if (closeVisionBtn) closeVisionBtn.addEventListener('click', () => closeModal(visionOverlay));
    if (closeMissionBtn) closeMissionBtn.addEventListener('click', () => closeModal(missionOverlay));

    // Close when clicking outside the modal box
    [visionOverlay, missionOverlay].forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeModal(overlay);
        });
    });

    // Close on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (visionOverlay.classList.contains('active')) closeModal(visionOverlay);
            if (missionOverlay.classList.contains('active')) closeModal(missionOverlay);
        }
    });
}

// ────────────────────────────────────────
//  HERO BACKGROUND SLIDER
// ────────────────────────────────────────
function initHeroSlider() {
    var slides = document.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;

    var currentSlide = 0;

    // Rotate the image every 6 seconds
    setInterval(function () {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 6000);
}