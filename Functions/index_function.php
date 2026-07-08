<?php
// ========================================
// BARANGAY MANAGEMENT SYSTEM
// Functions/index_function.php
// ========================================

// ── DATABASE CONNECTION ────────────────
require_once 'Connections/db_connect.php';

// ── PAGE META ──────────────────────────
$pageTitle = "Barangay Management System";

// ── LOGIN STATE ────────────────────────
$isLoggedIn = false;

if ($isLoggedIn) {
    $buttonText = "GO TO DASHBOARD";
    $buttonLink = "dashboard.php";
    $buttonIcon = "🏠";
} else {
    $buttonText = "APPLY CLEARANCE";
    $buttonLink = "apply.php";
    $buttonIcon = "📋";
}

// ── ABOUT ──────────────────────────────
$aboutText = "Welcome to our Barangay. We are dedicated to fostering a safe,
progressive, and inclusive community. Our administration strives to deliver
transparent, efficient, and accessible public services to all residents,
ensuring that no one is left behind in our journey towards local development.";

// ── HERO STATS ─────────────────────────
$heroStats = [
    ["number" => "5,200+", "label" => "Registered Residents"],
    ["number" => "98%",    "label" => "Satisfaction Rate"],
    ["number" => "15+",    "label" => "Years of Service"],
];

// ── ABOUT STATS (image overlay) ────────
$aboutStats = [
    ["number" => "5,200+", "label" => "Residents"],
    ["number" => "8",      "label" => "Services Online"],
    ["number" => "15+",    "label" => "Years Active"],
];

// ── ABOUT FEATURE POINTS ───────────────
$aboutFeatures = [
    [
        "icon"  => "🛡️",
        "title" => "Safe & Secure Community",
        "desc"  => "We work alongside local authorities to maintain peace and order for all residents and businesses.",
    ],
    [
        "icon"  => "⚡",
        "title" => "Fast Digital Services",
        "desc"  => "Apply for certificates and permits online — no more long queues at the barangay hall.",
    ],
    [
        "icon"  => "🤝",
        "title" => "Community-First Governance",
        "desc"  => "Every decision is made with the welfare of our residents and the future of our community in mind.",
    ],
];


// ── GALLERY (FETCHED FROM DATABASE) ────────────────────────────
$galleryAlbums = [];

try {
    // Fetch active images ordered by month (newest first)
    $stmtGallery = $pdo->query("SELECT * FROM barangay_gallery WHERE status = 'active' ORDER BY album_month ASC, id ASC");
    $dbGallery = $stmtGallery->fetchAll(PDO::FETCH_ASSOC);

    // Group them into an array organized by album_month
    foreach ($dbGallery as $img) {
        $monthStr = $img['album_month']; // e.g., '2024-01'
        
        if (!isset($galleryAlbums[$monthStr])) {
            $galleryAlbums[$monthStr] = [
                'album_month' => $monthStr,
                'display_month' => date('F Y', strtotime($monthStr . '-01')),
                'title'       => sanitize($img['title']),
                'cover_photo' => sanitize($img['photo_path']), // First photo becomes the cover
                'photos'      => []
            ];
        }
        
        // Add all photos belonging to this month
        $galleryAlbums[$monthStr]['photos'][] = [
            'src'     => sanitize($img['photo_path']),
            'caption' => sanitize($img['title'])
        ];
    }
} catch (PDOException $e) {
    error_log("Database Error Fetching Gallery: " . $e->getMessage());
}

// ── HOTLINES ───────────────────────────
$hotlines = [
    ["type" => "barangay", "icon" => "🏛️", "department" => "Barangay Hall Desk",    "number" => "(02) 1234-5678"],
    ["type" => "police",   "icon" => "👮", "department" => "Local Police Station",   "number" => "117 / (02) 8765-4321"],
    ["type" => "fire",     "icon" => "🚒", "department" => "Fire Department",        "number" => "(02) 9876-5432"],
    ["type" => "health",   "icon" => "🏥", "department" => "Barangay Health Center", "number" => "(02) 1122-3344"],
];

// ── SERVICES ───────────────────────────
$services = [
    ["type" => "residency",      "icon" => "📄", "name" => "Certificate of Residency",           "desc" => "Proceed to check the requirements needed for Certificate of Residency."],
    ["type" => "business",       "icon" => "📄", "name" => "Business Clearance",                  "desc" => "Proceed to check the requirements needed for Business Clearance."],
    ["type" => "indigency",      "icon" => "📄", "name" => "Certificate of Indigency",            "desc" => "Proceed to check the requirements needed for Certificate of Indigency."],
    ["type" => "low-income",     "icon" => "📄", "name" => "Certificate of Low Income",           "desc" => "Proceed to check the requirements needed for Certificate of Low Income."],
    ["type" => "legal-guardian", "icon" => "📄", "name" => "Legal Guardian Certificate",          "desc" => "Proceed to check the requirements needed for Legal Guardian Certificate."],
    ["type" => "tent-permit",    "icon" => "📄", "name" => "Certificate of Tent Permit",          "desc" => "Proceed to check the requirements needed for Certificate of Tent Permit."],
    ["type" => "concrete",       "icon" => "📄", "name" => "Concrete Pouring Certification",      "desc" => "Proceed to check the requirements needed for Concrete Pouring Certification."],
    ["type" => "job-seeker",     "icon" => "📄", "name" => "First Time Job Seeker",               "desc" => "Proceed to check the requirements needed for First Time Job Seeker."],
    ["type" => "delivery",       "icon" => "📄", "name" => "Delivery & Loading Unloading, Etc..", "desc" => "Proceed to check the requirements needed for Delivery & Loading/Unloading & Temporary Parking of Delivery Services truck clearance."],
];

// ── CONTACT ────────────────────────────
$contactAddress = "BARANGAY ADDRESS HERE";
$contactEmail   = "admin@ourbarangay.gov.ph";
$contactPhone   = "(02) 1234-5678";
$officeHours    = "Monday to Friday, 8:00 AM – 5:00 PM";
$municipality   = "Caloocan City, National Capital Region";
$mapsEmbedUrl   = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15448.513702172771!2d120.9822!3d14.5995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDM1JzU4LjIiTiAxMjDCsDU4JzU1LjkiRQ!5e0!3m2!1sen!2sph!4v1620000000000!5m2!1sen!2sph";

// ── FOOTER LINKS ───────────────────────
$footerServices = [
    ["label" => "Barangay Clearance",       "href" => "apply.php?type=clearance"],
    ["label" => "Certificate of Indigency", "href" => "apply.php?type=indigency"],
    ["label" => "Certificate of Residency", "href" => "apply.php?type=residency"],
    ["label" => "Business Permit",          "href" => "apply.php?type=business"],
    ["label" => "Barangay ID",              "href" => "apply.php?type=id"],
];
$footerQuickLinks = [
    ["label" => "About",                "href" => "#about"],
    ["label" => "Officials",            "href" => "#officials"],
    ["label" => "News & Announcements", "href" => "#news"],
    ["label" => "Emergency Hotline",    "href" => "#hotline"],
    ["label" => "Apply Online",         "href" => "apply.php"],
];
$footerLegal = [
    ["label" => "Privacy Policy",  "href" => "privacy.php"],
    ["label" => "Terms of Service","href" => "terms.php"],
    ["label" => "Data Protection", "href" => "data.php"],
    ["label" => "Accessibility",   "href" => "accessibility.php"],
];

// ── HELPERS ────────────────────────────
function sanitize($data) {
    return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
}

function getOfficeStatus() {
    $hour = (int) date('H');
    $day  = (int) date('N');
    if ($day < 6 && $hour >= 8 && $hour < 17) {
        return ['status' => 'Open', 'class' => 'open'];
    }
    return ['status' => 'Closed', 'class' => 'closed'];
}

$officeStatus = getOfficeStatus();

function getRelativePath($path) {
    if (!$path) return '';
    if (substr($path, 0, 3) === '../') {
        return substr($path, 3);
    }
    return $path;
}

// ── NEWS, ANNOUNCEMENTS & DYNAMIC TICKER ───────────────────
$featuredNewsDB = [];
$newsItemsDB    = [];
$tickerItems    = [];

try {
    // 1. Fetch Featured News
    $stmtFeatured = $pdo->query("SELECT * FROM news_announcements WHERE is_featured = 1 AND status = 'Active' ORDER BY publish_date DESC LIMIT 3");
    $featuredNewsDB = $stmtFeatured->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch Regular News
    $stmtList = $pdo->query("SELECT * FROM news_announcements WHERE (is_featured = 0 OR is_featured IS NULL) AND status = 'Active' ORDER BY publish_date DESC");
    $newsItemsDB = $stmtList->fetchAll(PDO::FETCH_ASSOC);

// 3. Generate Dynamic Ticker Items
    $allNews = array_merge($featuredNewsDB, $newsItemsDB);
    $recentNews = array_slice($allNews, 0, 8); // Grab up to 8 of the latest announcements

    // Define our new 5-color palette
    $colorPalette = [
        'ticker-tag-blue', 
        'ticker-tag-gold', 
        'ticker-tag-red', 
        'ticker-tag-green', 
        'ticker-tag-purple'
    ];
    $colorIndex = 0; // Start at the first color

    foreach ($recentNews as $news) {
        // If they didn't write a tag, default to 'UPDATE'
        $dbTag = !empty($news['tag']) ? $news['tag'] : 'UPDATE';
        
        // Grab the next color in the list. The '%' math forces it to loop back to 0 when it hits 5!
        $tagClass = $colorPalette[$colorIndex % count($colorPalette)];
        $colorIndex++; // Move to the next color for the next announcement

        $tickerItems[] = [
            "tag"      => $dbTag,
            "tagClass" => $tagClass,
            "text"     => sanitize($news['title'])
        ];
    }

    // Fallback if the database is completely empty
    if (empty($tickerItems)) {
        $tickerItems = [
            ["tag" => "Info", "tagClass" => "ticker-tag-blue", "text" => "Welcome to Barangay Management System. Online services are now available 24/7."]
        ];
    }

} catch (PDOException $e) {
    error_log("Database Error Fetching Announcements: " . $e->getMessage());
    // Fallback on error
    $tickerItems = [
        ["tag" => "System", "tagClass" => "ticker-tag-red", "text" => "System updating announcements. Check back shortly."]
    ];
}
?>