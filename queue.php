<?php
session_start();

require_once 'Functions/cache_buster.php';

if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    header("Location: walkin.php");
    exit();
}

if (isset($_GET['logout'])) {
    session_destroy();
    header("Location: walkin.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Walk-In Dashboard - Barangay Management System</title>
    
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Index_css/index_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_residency_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_business_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_indigency_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_concrete_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_delivery_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_job_seeker_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_legal_guardian_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_low_income_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_tent_permit_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_others_prompt_style.css'); ?>">
    <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Queue_css/queue_id_style.css'); ?>">

</head>

<body style="background: var(--navy); min-height: 100vh; overflow-x: hidden;">

    <div class="container fade-in" style="padding: 40px 20px;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 40px; flex-wrap: wrap; gap: 20px;">
            <div>
                <h2 class="section-title" style="font-size: 2.5rem;">Services <span>Dashboard</span></h2>
                <p class="section-desc">Logged in as: <strong style="color: var(--gold);"><?php echo htmlspecialchars($_SESSION['user_email']); ?></strong></p>
            </div>
            <a href="queue.php?logout=true" class="btn-secondary" style="padding: 10px 24px; font-size: 0.85rem;">Logout</a>
        </div>

        <h3 class="display-title" style="color: var(--white); font-size: 1.5rem; margin-bottom: 24px;">Select a Certificate to Request</h3>
        
        <div class="services-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
            
            
            <div class="stat-card service-card" data-service="residency" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🏠</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Certificate of Residency</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Request proof of residence for employment, loans, or school.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="indigency" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📄</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Certificate of Indigency</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Proof of low-income status for financial or medical aid.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="business" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🏪</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Business Clearance</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Apply for a new or renewal of Business Permit/Clearance.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="concrete" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🏗️</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Concrete Pouring</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Permit for construction and concrete pouring activities.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="delivery" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🚛</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Truck / Delivery</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Loading/Unloading clearance for delivery trucks.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="job-seeker" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">💼</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">First Time Job Seeker</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Certificate to waive fees for pre-employment requirements.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="legal-guardian" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">👨‍👧</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Legal Guardian</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Request a certificate indicating legal guardianship status.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="low-income" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">💰</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Certificate of Low Income</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Proof of income for scholarships or medical aid.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="tent-permit" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">⛺</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Tent Permit</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Permit to set up tents for events or gatherings.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>     

            <div class="stat-card service-card" data-service="others" style="text-align: left; padding: 30px; cursor: pointer;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📌</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Other Services</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Request services not listed in the available certificates.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>

            <div class="stat-card service-card" data-service="id" style="text-align: left; padding: 30px; cursor: pointer;">         
                <div style="font-size: 2rem; margin-bottom: 10px;">🆔</div>
                <h3 style="color: var(--white); font-family: var(--font-display); margin-bottom: 12px; font-size: 1.5rem; font-weight: 700;">Barangay ID</h3>
                <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; line-height: 1.6;">Request a Barangay Identification Card with photo and personal details.</p>
                <button class="btn-primary" style="padding: 10px 20px; pointer-events: none;">Add to List <span class="btn-arrow">→</span></button>
            </div>


          </div>
    </div>

    <!-- CART -->
    <div id="kiosk-cart-widget">
        <div class="kiosk-cart-info">
            <div class="kiosk-cart-icon">📋</div>
            <div class="kiosk-cart-text">
                <span class="kiosk-cart-title">Walk-In Batch</span>
                <span class="kiosk-cart-count-text"><span id="kiosk-cart-count">0</span> Service(s)</span>
            </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
            <button id="kiosk-cart-checkout-btn" class="kiosk-cart-btn"><span>✅</span> Submit Batch</button>
            <div style="display: flex; gap: 15px; margin-top: 2px;">
                <button id="kiosk-cart-view-btn" class="kiosk-cart-clear" style="color: #2c57e5;">View List</button>
                <button id="kiosk-cart-clear-btn" class="kiosk-cart-clear">Empty Cart</button>
            </div>
        </div>
    </div>

    <!-- CART LIST -->
    <div class="residency-form-overlay" id="cart-details-overlay" style="z-index: 999998;">
        <div id="business-form-wrap" style="max-width: 550px; padding: 30px; margin: 10vh auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
                <h3 style="margin:0; font-size: 1.6rem; color: #0f172a; font-weight: 800;">Review Batch Requests</h3>
                <button type="button" id="close-cart-details" style="background:none; border:none; font-size: 2.2rem; cursor:pointer; color: #64748b;">&times;</button>
            </div>
            <div id="cart-items-list" style="max-height: 450px; overflow-y: auto;"></div>
        </div>
    </div>

    <!-- SUCCESS -->
    <div class="residency-form-overlay" id="global-success-overlay" style="z-index: 999999;">
        <div class="rbi-success" id="global-success-wrap" style="display: block; margin-top: 10vh;">
            <div class="rbi-success-icon">✅</div>
            <h2 class="rbi-success-title">Batch Submitted!</h2>
            <p class="rbi-success-sub">Requests queued successfully. Please proceed to the waiting area.</p>
            <div class="rbi-success-ref">Batch No: <span id="global-batch-number">—</span></div>
            <button type="button" id="global-done-btn" class="rbi-submit-btn"><span>🏠</span> Finish</button>
        </div>
    </div>

    <!-- ✅ NEW: PRIORITY MODAL -->
    <div class="residency-form-overlay" id="priority-overlay" style="z-index: 999999;">
        <div class="priority-modal">
            <h2>Priority Selection</h2>
            <p>Select if this batch has priority</p>

            <div class="priority-options">
                <button class="priority-btn" data-priority="0">Normal</button>
                <button class="priority-btn" data-priority="1">Senior Citizen</button>
                <button class="priority-btn" data-priority="2">PWD</button>
                <button class="priority-btn" data-priority="3">Pregnant</button>
            </div>

            <button id="close-priority" class="priority-cancel">Cancel</button>
        </div>
    </div>


  <!-- SCRIPTS -->
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_function.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_residency_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_business_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_indigency_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_concrete_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_delivery_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_job_seeker_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_legal_guardian_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_low_income_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_tent_permit_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_others_prompt.js'); ?>"></script>
    <script src="<?php echo get_fresh_asset('JS/Queue_js/queue_id_prompt.js'); ?>"></script>

</body>
</html>