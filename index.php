<?php
require_once 'Functions/index_function.php';
require_once 'Connections/db_connect.php';
require_once 'Functions/cache_buster.php';

// --- PLACEHOLDERS FOR THIS MOCKUP ONLY ---
// Remove these and define properly in Functions/index_function.php
$visionText = "A model Barangay powered by Seizmic Brgy System, where innovation meets public service—creating a safe, organized, and digitally empowered community that promotes transparency, unity, and sustainable development for all residents.";
$missionText = "To provide efficient, transparent, and technology-driven public services through the Seizmic Brgy System while promoting community participation, accountability, and sustainable development for all residents.";
// --- END PLACEHOLDERS ---

// FETCH OFFICIALS FROM DATABASE
$stmt = $pdo->query("SELECT * FROM barangay_officials WHERE status = 'active' ORDER BY id ASC");
$dbOfficials = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Format the data so JavaScript can read it perfectly
$processedOfficials = [];
foreach ($dbOfficials as $off) {
    $processedOfficials[] = [
        'name'     => $off['name'],
        'position' => $off['position'],
        'bio'      => $off['bio'],
        'details'  => json_decode($off['details'], true) ?: [],
        'photos'   => json_decode($off['photos'],  true) ?: []
    ];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo sanitize($pageTitle); ?></title>

    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_ticker.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_services_modal.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_officials_modals.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_hotline_modal.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_news_modal.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_rbi_modal.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_residency_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_business_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_indigency_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_low_income_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_legal_guardian_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_tent_permit_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_concrete_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_job_seeker_prompt.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_delivery_prompt.css'); ?>">
</head>
<body>

<header>
    <div class="header-container">
        <div class="logo-area">
            <div class="logo-circle">
               <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay Logo" class="logo-img">
            </div>
            <span class="logo-text">BARANGAY <span>BEL-AIR</span></span>
        </div>

        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
        </button>

        <nav class="navbar" id="navbar">
            <ul>
                <li><a href="#home"      class="nav-link active" data-section="home">Home</a></li>
                <li><a href="#about"     class="nav-link" data-section="about">About</a></li>
                <li><a href="#officials" class="nav-link" data-section="officials">Officials</a></li>
                <li><a href="#gallery"   class="nav-link" data-section="gallery">Gallery</a></li>
                <li><a href="#news"      class="nav-link" data-section="news">News</a></li>
                <li><a href="#hotline"   class="nav-link" data-section="hotline">Hotline</a></li>
                <li><a href="#contact"   class="nav-link" data-section="contact">Contact</a></li>
            </ul>
        </nav>
    </div>
</header>


<main class="hero-section" id="home">
    <div class="hero-slider">
        <div class="hero-slide active" style="background-image: url('<?php echo get_fresh_asset('Images/BARANGAY_BG.jpg'); ?>');"></div>
        <div class="hero-slide" style="background-image: url('<?php echo get_fresh_asset('Images/BARANGAY_BG2.jpg'); ?>');"></div>
        <div class="hero-slide" style="background-image: url('<?php echo get_fresh_asset('Images/BARANGAY_BG3.jpg'); ?>');"></div>
        <div class="hero-slide-overlay"></div>
    </div>

    <div class="hero-content-wrapper">
        <div class="hero-left">
            <div class="text-block">
                <div class="hero-badge fade-in-up">
                    <span class="hero-badge-dot"></span>
                    <span>Serving Our Community Since 2008</span>
                </div>

                <h1 class="hero-title display-title fade-in-up" style="animation-delay:0.1s">
                    BARANGAY<br>
                    <span class="accent">BEL-AIR</span><br>
                </h1>

                <p class="hero-subtitle fade-in-up" style="animation-delay:0.2s">
                    Connecting residents with essential public services — transparent,
                    accessible, and built for the people of our barangay.
                </p>
            </div>

            <div class="action-block fade-in-up" style="animation-delay:0.3s">
                <div class="hero-actions">
                    <a href="<?php echo sanitize($buttonLink); ?>" class="btn-primary apply-clearance-btn">
                        <span class="icon"><?php echo $buttonIcon; ?></span>
                        <span class="btn-text">Click here for RBI/Census</span>
                        <span class="btn-arrow">→</span>
                    </a>
                    <a href="#about" class="btn-secondary">Learn More →</a>
                </div>

                <div class="hero-stats">
                    <?php foreach ($heroStats as $stat): ?>
                        <div>
                            <span class="hero-stat-num"><?php echo sanitize($stat['number']); ?></span>
                            <span class="hero-stat-label"><?php echo sanitize($stat['label']); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>

        <div class="hero-right fade-in-right" style="animation-delay:0.35s">
            <div class="hero-emblem">
                <div class="emblem-inner">
                       <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay Seal" class="emblem-seal-img">
                </div>
            </div>
        </div>
    </div>

    <div class="scroll-indicator">
        <span class="scroll-text">Scroll to explore</span>
        <div class="scroll-arrow">
            <span></span><span></span><span></span>
        </div>
    </div>
</main>


<div class="ticker-bar">
    <?php
    ob_start();
    for ($pass = 0; $pass < 10; $pass++):
        foreach ($tickerItems as $item):
    ?>
        <span class="ticker-item">
            <?php if ($item['tag']): ?>
                <span class="ticker-tag <?php echo sanitize($item['tagClass']); ?>">
                    <?php echo sanitize($item['tag']); ?>
                </span>
            <?php endif; ?>
            <?php echo sanitize($item['text']); ?>
            <span class="ticker-sep"></span>
        </span>
    <?php
        endforeach;
    endfor;
    $tickerContent = ob_get_clean();
    ?>
    
    <div class="ticker-track">
        <?php echo $tickerContent; ?>
    </div>
    <div class="ticker-track" aria-hidden="true">
        <?php echo $tickerContent; ?>
    </div>
</div>


<section id="about" class="page-section dark-bg">
    <div class="container">

        <div class="about-grid-layout">

            <div class="about-left-column">
                <div class="about-image-card fade-in-left">
               <img src="<?php echo get_fresh_asset('Images/BARANGAY_BG.jpg'); ?>" alt="Barangay Hall" class="about-bg-img">
                    <div class="about-image-overlay">
                        <div>
                            <span class="aio-stat-num">5,200+</span>
                            <div class="aio-stat-lbl">Residents</div>
                        </div>
                        <div>
                            <span class="aio-stat-num">8</span>
                            <div class="aio-stat-lbl">Services Online</div>
                        </div>
                        <div>
                            <span class="aio-stat-num">15+</span>
                            <div class="aio-stat-lbl">Years Active</div>
                        </div>
                    </div>
                    <div class="about-seal-watermark">
                            <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay Seal">
                    </div>
                </div>

                <div class="about-left-actions fade-in-delayed" style="animation-delay:0.2s">

                    <button id="open-vision-modal" class="about-btn">
                        <span class="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                                <line x1="4" y1="22" x2="4" y2="15"/>
                            </svg>
                        </span> Read Our Vision
                    </button>

                    <button id="open-mission-modal" class="about-btn">
                        <span class="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                        </span> Read Our Mission
                    </button>

                </div>
            </div>

            <div class="about-right-content fade-in-right">
                <span class="section-eyebrow">About Our Barangay</span>
                <h2 class="section-title">Serving with <span>Integrity</span> &amp; Transparency</h2>
                <div class="divider" style="margin:16px 0 24px;margin-left:0"></div>

                <p class="about-text" style="margin:0 0 32px;max-width:100%">
                    <?php echo sanitize($aboutText); ?>
                </p>

                <div class="stats-grid" style="margin-top:0">
                    <div class="stat-card fade-in-delayed" style="animation-delay:0.1s">
                        <div class="stat-number">5,200+</div>
                        <div class="stat-label">Residents</div>
                    </div>
                    <div class="stat-card fade-in-delayed" style="animation-delay:0.2s">
                        <div class="stat-number">15+</div>
                        <div class="stat-label">Years Serving</div>
                    </div>
                    <div class="stat-card fade-in-delayed" style="animation-delay:0.3s">
                        <div class="stat-number">8</div>
                        <div class="stat-label">Online Services</div>
                    </div>
                    <div class="stat-card fade-in-delayed" style="animation-delay:0.4s">
                        <div class="stat-number">100%</div>
                        <div class="stat-label">Community Focused</div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</section>


<section id="officials" class="page-section darker-bg">
    <div class="container">
        <div class="section-header fade-in">
            <span class="section-eyebrow">Leadership</span>
            <h2 class="section-title">Barangay <span>Officials</span></h2>
            <div class="divider"></div>
        </div>

        <div class="officials-grid">
            <?php foreach ($processedOfficials as $index => $official): ?>
                <?php
                    $coverPhoto = !empty($official['photos']) ? $official['photos'][0] : null;
                ?>
                <div class="official-card fade-in-delayed"
                     style="animation-delay:<?php echo $index * 0.1; ?>s;"
                     data-index="<?php echo $index; ?>"
                     role="button"
                     tabindex="0"
                     aria-label="View profile of <?php echo sanitize($official['name']); ?>">

                    <div class="official-card-inner">
                        <?php if ($coverPhoto): ?>
                            <img src="<?php echo htmlspecialchars($coverPhoto); ?>"
                                alt="<?php echo htmlspecialchars($official['name']); ?>"
                                style="width:100%; height:100%; object-fit:contain; object-position:bottom center; border-radius:12px; position:absolute; inset:0; z-index:1; padding-top: 15px;">
                        <?php else: ?>
                            <div class="img-placeholder" style="z-index:1;">👤</div>
                        <?php endif; ?>

                        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%); z-index:2; border-radius:12px;"></div>

                        <div class="official-content" style="z-index:3; position:relative;">
                            <h3><?php echo sanitize($official['name']); ?></h3>
                            <p><?php echo sanitize($official['position']); ?></p>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<section id="gallery" class="page-section dark-bg">
    <div class="container">
        <div class="section-header fade-in">
            <span class="section-eyebrow">Moments & Highlights</span>
            <h2 class="section-title">Barangay <span>Gallery</span></h2>
            <div class="divider"></div>
            <p class="about-text" style="margin-bottom:0">
                A glimpse into our community events, programs, and daily barangay life.
            </p>
        </div>

        <div class="gallery-carousel-wrapper fade-in-up">
            
            <button class="gallery-arrow prev-arrow" aria-label="Previous albums">&#10094;</button>

            <div class="gallery-grid" id="gallery-track">
                <?php foreach ($galleryAlbums as $monthKey => $album): ?>
                    <?php 
                        $photosJson = htmlspecialchars(json_encode($album['photos']), ENT_QUOTES, 'UTF-8');
                    ?>
                    <div class="gallery-item" 
                         data-title="<?php echo $album['title']; ?>"
                         data-month="<?php echo $album['display_month']; ?>"
                         data-photos="<?php echo $photosJson; ?>">
                        
                        <div class="gallery-thumb">
                            <img src="<?php echo $album['cover_photo']; ?>" 
                                 alt="<?php echo $album['title']; ?>" 
                                 class="gallery-img" 
                                 onerror="this.src='<?php echo get_fresh_asset('Images/BARANGAY_BG.jpg'); ?>'">
                            
                            <div class="gallery-count-badge">
                                <span style="font-size: 1.1rem;">📸</span> <?php echo count($album['photos']); ?> Photos
                            </div>
                            
                            <div class="gallery-overlay">
                                <span class="gallery-overlay-text">View Album</span>
                            </div>
                        </div>

                        <div class="gallery-info">
                            <h3 class="gallery-title"><?php echo $album['title']; ?></h3>
                            <p class="gallery-date"><?php echo $album['display_month']; ?></p>
                        </div>
                        
                    </div>
                <?php endforeach; ?>
            </div>

            <button class="gallery-arrow next-arrow" aria-label="Next albums">&#10095;</button>
            
        </div>
    </div>
</section>

<section id="news" class="page-section darker-bg">
    <div class="container">
        <div class="news-section-header">
            <div>
                <span class="section-eyebrow">Latest Updates</span>
                <h2 class="section-title">News &amp; <span>Announcements</span></h2>
                <div class="divider" style="margin:16px 0 0"></div>
            </div>
           <a href="all_news.php" class="news-view-all">View All →</a>
        </div>

        <div class="news-layout">

            <?php if (!empty($featuredNewsDB)): ?>
            <div class="featured-news-grid">
                <?php foreach ($featuredNewsDB as $featured): ?>
                <div class="news-card-featured" data-id="<?php echo sanitize($featured['id']); ?>">

                    <div class="news-card-thumb">
                        <?php $coverPhoto = getRelativePath($featured['thumb']); ?>
                        <img src="<?php echo sanitize($coverPhoto); ?>" alt="Announcement Cover Photo" class="news-thumb-img">
                    </div>

                    <div class="news-card-body">
                        <span class="news-chip <?php echo sanitize($featured['tagClass']); ?>">
                            <?php echo sanitize($featured['tag']); ?>
                        </span>
                        <div class="news-card-title"><?php echo sanitize($featured['title']); ?></div>
                        <div class="news-card-meta-vertical">
                            <span class="news-date">📅 <?php echo sanitize(date('M d, Y', strtotime($featured['publish_date']))); ?></span>
                            <span class="news-author">👤 By <?php echo sanitize($featured['created_by']); ?></span>
                        </div>
                    </div>

                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>

            <?php if (!empty($newsItemsDB) || empty($featuredNewsDB)): ?>
            <div class="news-list">
                <div style="font-size:0.8rem; font-weight:700; color:#8fa0c0; text-transform:uppercase; margin-bottom:16px; letter-spacing:1px;">
                    Other Announcements
                </div>

                <?php if (!empty($newsItemsDB)): ?>
                    <?php foreach ($newsItemsDB as $item): ?>
                        <div class="news-list-item" data-id="<?php echo sanitize($item['id']); ?>">
                            <span class="news-list-item-icon"><?php echo sanitize($item['icon']); ?></span>
                            <div>
                                <div class="news-list-item-chip <?php echo sanitize($item['tagClass']); ?>" style="display:inline-block; padding:2px 8px; font-size:0.6rem; border-radius:4px; margin-bottom:4px;">
                                    <?php echo sanitize($item['tag']); ?>
                                </div>
                                <div class="news-list-item-title"><?php echo sanitize($item['title']); ?></div>
                                <div class="news-list-item-date">📅 <?php echo sanitize(date('M d, Y', strtotime($item['publish_date']))); ?></div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p style="color:#8fa0c0; text-align:center; padding:20px 0;">No regular announcements available.</p>
                <?php endif; ?>
            </div>
            <?php endif; ?>

        </div>
    </div>
</section>


<section id="hotline" class="page-section dark-bg">
    <div class="container">
        <div class="section-header fade-in">
            <span class="section-eyebrow">Emergency</span>
            <h2 class="section-title">Emergency <span>Hotlines</span></h2>
            <div class="divider"></div>
            <p class="about-text" style="margin-bottom:0">
                One tap to reach all emergency contacts — available 24/7 for your safety.
            </p>
        </div>

        <div class="hotline-trigger-wrapper">
            <div class="hotline-trigger-card" id="hotline-trigger-card" role="button" tabindex="0">
                <span class="hotline-siren">🚨</span>
                <div class="hotline-trigger-title">Emergency Hotlines</div>
                <div class="hotline-trigger-sub">
                    Tap to view all <?php echo count($hotlines); ?> emergency contacts for our barangay
                </div>
                <div class="hotline-trigger-btn">
                    <span class="hotline-count"><?php echo count($hotlines); ?></span>
                    View All Hotlines
                </div>
            </div>
        </div>
    </div>
</section>


<section id="contact" class="page-section darker-bg">
    <div class="container">
        <div class="section-header fade-in">
            <span class="section-eyebrow">Get In Touch</span>
            <h2 class="section-title">Find &amp; <span>Contact Us</span></h2>
            <div class="divider"></div>
        </div>

        <div class="contact-wrapper">

            <div class="map-container fade-in-left">
                <iframe
                    src="<?php echo sanitize($mapsEmbedUrl); ?>"
                    width="100%" height="300"
                    style="border:0;border-radius:10px;"
                    allowfullscreen="" loading="lazy">
                </iframe>
            </div>

            <div class="contact-info fade-in-right">
                <div class="section-header" style="text-align:left;margin-bottom:var(--spacing-md)">
                    <h2 class="section-title" style="font-size:1.5rem">Contact Information</h2>
                    <div class="divider" style="margin:12px 0 0;margin-left:0"></div>
                </div>
                <ul class="contact-list">
                    <li class="contact-item">
                        <span class="contact-icon">📍</span>
                        <div>
                            <strong>Address</strong>
                            <p><?php echo sanitize($contactAddress); ?></p>
                        </div>
                    </li>
                    <li class="contact-item">
                        <span class="contact-icon">✉️</span>
                        <div>
                            <strong>Email</strong>
                            <p><a href="mailto:<?php echo sanitize($contactEmail); ?>"><?php echo sanitize($contactEmail); ?></a></p>
                        </div>
                    </li>
                    <li class="contact-item">
                        <span class="contact-icon">📞</span>
                        <div>
                            <strong>Phone</strong>
                            <p><?php echo sanitize($contactPhone); ?></p>
                        </div>
                    </li>
                    <li class="contact-item">
                        <span class="contact-icon">🕒</span>
                        <div>
                            <strong>Office Hours</strong>
                            <p><?php echo sanitize($officeHours); ?></p>
                        </div>
                    </li>
                    <li class="contact-item">
                        <span class="contact-icon">🇵🇭</span>
                        <div>
                            <strong>Municipality</strong>
                            <p><?php echo sanitize($municipality); ?></p>
                        </div>
                    </li>
                </ul>

                <button id="open-contact-modal" class="btn-primary" style="margin-top: 24px; width: 100%; justify-content: center;">
                    <span class="icon">✉️</span> Send Us a Message
                </button>

            </div>
        </div>
    </div>
</section>


<footer>
    <div class="footer-inner">
        <div class="footer-grid">

            <div>
                <div class="footer-brand-name">
                       <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay Logo" class="footer-brand-icon-img">
                    BARANGAY<span>BEL-AIR</span>
                </div>
                <div class="footer-brand-desc">
                    Dedicated to serving every resident with transparency, efficiency,
                    and genuine care for the community's well-being.
                </div>
                <div class="footer-socials">
                    <a class="footer-social" href="#" aria-label="Facebook">📘</a>
                    <a class="footer-social" href="#" aria-label="Instagram">📸</a>
                    <a class="footer-social" href="#" aria-label="Twitter">🐦</a>
                    <a class="footer-social" href="#" aria-label="YouTube">▶️</a>
                </div>
            </div>

            <div>
                <div class="footer-col-title">Quick Links</div>
                <ul class="footer-links">
                    <?php foreach ($footerQuickLinks as $link): ?>
                        <li><a href="<?php echo sanitize($link['href']); ?>"><?php echo sanitize($link['label']); ?></a></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <div class="footer-copy">
                © <?php echo date('Y'); ?> <span>BARANGAY BEL-AIR</span>. All rights reserved.
            </div>
            <span class="footer-ph-flag">🇵🇭</span>
        </div>
    </div>
</footer>


<div class="services-fab" id="services-fab" role="button" aria-label="View Barangay Services" tabindex="0">
    <button class="services-fab-btn" aria-hidden="true">
           <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Services" class="fab-icon-img">
    </button>
    <span class="services-fab-label">Click here for Our Services</span>
</div>


<div class="services-overlay" id="services-overlay" role="dialog" aria-modal="true" aria-labelledby="services-modal-heading">
    <div class="services-modal">
        <div class="services-modal-header">
            <div class="services-modal-title-group">
                <span class="services-modal-eyebrow">BARANGAY BEL-AIR</span>
                <h2 class="services-modal-title" id="services-modal-heading">Our Services</h2>
            </div>
            <button class="services-modal-close" id="services-modal-close" aria-label="Close services">✕</button>
        </div>

        <div class="services-modal-body">
            <p class="services-intro">
                We offer a range of free and accessible services for all registered residents.
                Select a service below to get started.
            </p>

            <div class="services-grid">
                <?php foreach ($services as $service): ?>
                    <div class="service-card"
                         data-type="<?php echo sanitize($service['type']); ?>"
                         data-service="<?php echo sanitize($service['type']); ?>"
                         role="button" tabindex="0"
                         aria-label="<?php echo sanitize($service['name']); ?>">
                        <span class="service-card-icon"><?php echo $service['icon']; ?></span>
                        <span class="service-card-name"><?php echo sanitize($service['name']); ?></span>
                        <span class="service-card-desc"><?php echo sanitize($service['desc']); ?></span>
                        <span class="service-card-arrow">Learn more →</span>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <div class="services-modal-footer">
            <span class="services-footer-note">
                Office hours: <strong>Mon–Fri, 8:00 AM – 5:00 PM</strong>
            </span>
            <a href="apply.php" class="services-footer-cta">📋 Apply Online</a>
        </div>
    </div>
</div>

<div class="contact-modal-overlay" id="contact-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
    <div class="contact-modal">
        <div class="contact-modal-header">
            <div>
                <span class="section-eyebrow" style="margin-bottom: 4px;">Get in Touch</span>
                <h2 class="contact-modal-title" id="contact-modal-title">Send a Message</h2>
            </div>
            <button class="contact-modal-close" id="contact-modal-close" aria-label="Close modal">✕</button>
        </div>

        <div class="contact-modal-body">
<form id="contactUsForm" action="process_contact.php" method="POST" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="contactFullName">Full Name <span class="required" style="color:var(--red);">*</span></label>
                    <input type="text" id="contactFullName" name="fullName" required placeholder="e.g. Juan Dela Cruz">
                </div>
                
                <div class="form-group">
                    <label for="contactEmail">Email Address <span class="required" style="color:var(--red);">*</span></label>
                    <input type="email" id="contactEmail" name="emailAddress" required placeholder="e.g. juan@example.com">
                </div>

                <div class="form-group">
                    <label for="contactNum">Contact Number <span class="required" style="color:var(--red);">*</span></label>
                    <input type="tel" id="contactNum" name="contactNum" required placeholder="e.g. 09123456789">
                </div>
                
                <div class="form-group">
                    <label for="contactSubject">Subject <span class="required" style="color:var(--red);">*</span></label>
                    <input type="text" id="contactSubject" name="subject" required placeholder="e.g. Inquiry about clearance">
                </div>
                
                <div class="form-group">
                    <label for="contactMessage">Message <span class="required" style="color:var(--red);">*</span></label>
                    <textarea id="contactMessage" name="message" rows="4" required placeholder="Write your message here..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="contactPhoto">Upload Photo/Attachment (Optional)</label>
                    <input type="file" id="contactPhoto" name="photo" accept="image/*">
                </div>
                
                <div class="contact-modal-footer" style="margin-top: 28px;">
                    <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
                        Submit Message
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<div class="gallery-lightbox-overlay" id="gallery-lightbox-overlay" role="dialog" aria-modal="true" aria-label="Image Gallery">
    <div class="album-modal-content">
        <button class="lightbox-close" id="lightbox-close" aria-label="Close image">✕</button>
        <div class="album-modal-header">
            <h2 id="album-modal-title">Album Title</h2>
            <p id="album-modal-month">Month Year</p>
            <div class="divider" style="margin: 16px auto 0;"></div>
        </div>
        <div class="album-photo-grid" id="album-photo-grid">
        </div>
    </div>
</div>

<div class="single-photo-overlay" id="single-photo-overlay" role="dialog" aria-modal="true">
    <button class="single-photo-close" id="single-photo-close" aria-label="Close image">✕</button>
    <img src="" alt="" id="single-photo-img" class="single-photo-img">
    <div class="single-photo-caption" id="single-photo-caption"></div>
</div>

<div class="contact-modal-overlay" id="vision-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="vision-modal-title">
    <div class="contact-modal" style="max-width: 550px; text-align: center;">
        <div class="contact-modal-header" style="justify-content: center; position: relative;">
            <div style="text-align: center; width: 100%;">
                <span class="section-eyebrow" style="margin-bottom: 4px;">Our Community Goal</span>
                <h2 class="contact-modal-title" id="vision-modal-title">Barangay Vision</h2>
            </div>
            <button class="contact-modal-close" id="vision-modal-close" aria-label="Close modal" style="position: absolute; right: 0; top: -10px;">✕</button>
        </div>
        <div class="contact-modal-body">
            <div style="margin-bottom: 20px; animation: float 3s ease-in-out infinite; display: flex; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
            </div>
            <p style="font-size: 1.05rem; color: var(--muted-light); line-height: 1.8;">
                <?php echo sanitize($visionText); ?>
            </p>
        </div>
    </div>
</div>

<div class="contact-modal-overlay" id="mission-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="mission-modal-title">
    <div class="contact-modal" style="max-width: 550px; text-align: center;">
        <div class="contact-modal-header" style="justify-content: center; position: relative;">
            <div style="text-align: center; width: 100%;">
                <span class="section-eyebrow" style="margin-bottom: 4px;">Our Community Goal</span>
                <h2 class="contact-modal-title" id="mission-modal-title">Barangay Mission</h2>
            </div>
            <button class="contact-modal-close" id="mission-modal-close" aria-label="Close modal" style="position: absolute; right: 0; top: -10px;">✕</button>
        </div>
        <div class="contact-modal-body">
            <div style="margin-bottom: 20px; animation: float 3s ease-in-out infinite; display: flex; justify-content: center;">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            </div>
            <p style="font-size: 1.05rem; color: var(--muted-light); line-height: 1.8;">
                <?php echo sanitize($missionText); ?>
            </p>
        </div>
    </div>
</div>

<script>
    window.barangayOfficialsData = <?php echo json_encode($processedOfficials); ?>;
</script>

<script src="<?php echo get_fresh_asset('JS/Index_js/index_function_animation.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_function_services.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_function_ticker.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_officials_modal.js'); ?>"></script>   
<script src="<?php echo get_fresh_asset('JS/Index_js/index_hotline_modal.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_news_modal.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_news_calendar.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_rbi_modal.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_residency_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_business_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_indigency_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_low_income_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_legal_guardian_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_tent_permit_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_concrete_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_job_seeker_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_delivery_prompt.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Index_js/index_universal_verification.js'); ?>"></script>
</body>
</html>