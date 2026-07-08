// ========================================
// BARANGAY SERVICES MODAL - JS
// ========================================

document.addEventListener('DOMContentLoaded', function () {
    initServicesModal();
});

function initServicesModal() {
    const fab        = document.getElementById('services-fab');
    const overlay    = document.getElementById('services-overlay');
    const closeBtn   = document.getElementById('services-modal-close');
    const modal      = overlay ? overlay.querySelector('.services-modal') : null;

    if (!fab || !overlay || !closeBtn || !modal) return;

    // ── Open
    fab.addEventListener('click', openModal);

    // ── Close via X button
    closeBtn.addEventListener('click', closeModal);

    // ── Close via overlay click (outside modal)
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    // ── Close via Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
            closeModal();
        }
    });

    // ── Service card clicks
    document.querySelectorAll('.service-card').forEach(function (card) {
        card.addEventListener('click', function () {
            const service = this.getAttribute('data-service');
            handleServiceClick(service, this);
        });
    });

    function openModal() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Stagger service cards in
        staggerCards();
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function staggerCards() {
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(function (card, i) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(function () {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 60 * i);
        });
    }

    function handleServiceClick(service, cardEl) {
        // Provide a brief visual "tap" feedback, then navigate / handle
        cardEl.style.transform = 'scale(0.96)';
        setTimeout(function () {
            cardEl.style.transform = '';
        }, 150);

        // Map service types to their destination pages / actions
        const routes = {
        };

        const url = routes[service];
        if (url) {
            // Navigate after short delay so tap-effect is visible
            setTimeout(function () {
                window.location.href = url;
            }, 200);
        }
    }
}