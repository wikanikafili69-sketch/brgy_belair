<?php
// Require the security bouncer
require_once 'staff_auth.php';

require_once '../Functions/cache_buster.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Barangay ID - Staff')) {
    header("Location: no_access.php");
    exit();
}

// Require the DB connection for the activity logger
require_once '../Connections/db_connect.php'; 

// 2. LOGOUT HANDLER WITH ACTIVITY LOGGING
if (isset($_GET['logout'])) {
    $log_name = isset($_SESSION['admin_name']) ? $_SESSION['admin_name'] : 'Staff Member';
    $action = "Logged out of the system.";
    $timestamp = date('Y-m-d H:i:s');
    
    try {
        $log_stmt = $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (:name, :action, :time)");
        $log_stmt->execute(['name' => $log_name, 'action' => $action, 'time' => $timestamp]);
    } catch(Exception $e) {
        // Silently continue if log fails so logout isn't blocked
    }

    // Burn the session badge and kick them to login
    session_unset();
    session_destroy();
    header('Location: ../staff.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Staff Barangay ID — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_certificate.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Services_css/certificate_print.css'); ?>" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
</head>
<body>

<div class="dashboard-wrapper">
  <?php include 'sidebar.php'; ?>

  <div class="main-content">
    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Barangay ID Processing</h1>
          <p class="page-subtitle">Manage, verify, and process all incoming Barangay ID requests.</p>
        </div>
      </div>

      <div class="cert-summary-row">
        <div class="summary-chip summary-chip--orange" data-status="pending">
          <i class="fa-solid fa-hourglass-half"></i>
          <div>
            <span class="summary-val" id="countPending">0</span>
            <span class="summary-lbl">Pending</span>
          </div>
        </div>
        <div class="summary-chip summary-chip--blue" data-status="processing">
          <i class="fa-solid fa-gears"></i>
          <div>
            <span class="summary-val" id="countProcessing">0</span>
            <span class="summary-lbl">Processing</span>
          </div>
        </div>
        <div class="summary-chip summary-chip--green" data-status="completed">
          <i class="fa-solid fa-circle-check"></i>
          <div>
            <span class="summary-val" id="countCompleted">0</span>
            <span class="summary-lbl">Completed</span>
          </div>
        </div>
        <div class="summary-chip summary-chip--red" data-status="rejected">
          <i class="fa-solid fa-circle-xmark"></i>
          <div>
            <span class="summary-val" id="countRejected">0</span>
            <span class="summary-lbl">Rejected</span>
          </div>
        </div>
      </div>

      <div class="cert-split" id="certSplit">

        <div class="cert-table-col" id="certTableCol">

          <div class="cert-type-chips" id="certTypeChips"></div>

          <div class="res-toolbar">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="certSearch" class="search-input" placeholder="Search queue no. or resident…" />
            </div>
            
            <div class="toolbar-filters">
              
              <select class="filter-select" id="filterCertSource">
                <option value="all">All Sources</option>
                <option value="W" selected>Walk-in Only</option>
                <option value="O">Online Only</option>
              </select>

              <select class="filter-select" id="filterCertStatus">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <div class="form-group form-group--full">
          <label class="form-label" for="certType">Request Type <span class="req">*</span></label>
          <select id="certType" class="form-input" disabled>
            <option value="Barangay ID" selected>Barangay ID</option>
          </select>
        </div>
            </div>
          </div>

          <div class="panel cert-panel">
            <div class="panel-header">
              <div>
                <p class="panel-title">Barangay ID Live Queue</p>
                <p class="panel-sub" id="certTableCount">Loading requests…</p>
              </div>
              <button class="btn-ghost btn-sm" id="btnRefresh">
                <i class="fa-solid fa-rotate-right"></i> Refresh
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table cert-table">
                <thead>
                  <tr>
                    <th>Queue Number</th>
                     <th>Source</th>
                 
                    <th>Request Type</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                          
                  </tr>
                </thead>
                <tbody id="certTableBody"></tbody>
              </table>
            </div>
            
            <div class="pagination-bar">
              <span class="pagination-info" id="certPaginationInfo">—</span>
              <div class="pagination-controls">
                <button class="page-btn" id="certPrevPage" disabled><i class="fa-solid fa-chevron-left"></i></button>
                <div class="page-numbers" id="certPageNumbers"></div>
                <button class="page-btn" id="certNextPage"><i class="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        </div>

        <aside class="cert-detail-panel" id="certDetailPanel">
          <div class="profile-empty" id="certDetailEmpty">
            <h2 class="modal-title" id="titleNewCert"><i class="fa-solid fa-file-circle-plus"></i> Issue New Barangay ID</h2>
        <p class="modal-sub">Create a walk-in Barangay ID request</p>
            <p class="profile-empty-sub">Click any row in the table to view and process the certificate request here.</p>
          </div>

          <div class="profile-content hidden" id="certDetailContent">
            <div class="profile-panel-topbar">
              <span class="profile-panel-label">Request Details</span>
              <button class="panel-close-btn" id="certDetailClose"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <div id="certDetailActiveWarning" class="active-warning-banner" style="display: none; margin: 16px 18px 0 18px;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>ATTENTION: This resident has an ONGOING / ACTIVE case.</span>
            </div>
            <div class="cert-detail-hero">
              <div class="cert-type-icon" id="detailCertIcon">
                <i class="fa-solid fa-file-lines"></i>
              </div>
              <div class="cert-detail-hero-info" style="flex:1;">
                <h2 class="cert-detail-type" id="detailCertType">—</h2>
                <span class="cert-req-id" id="detailReqId">—</span>
                <div id="detailStatusBadge" style="margin-top:7px;"></div>
                
                <div id="multiItemNav" style="display:none; align-items:center; justify-content:space-between; background:var(--bg); border:1px solid var(--border-light); padding:6px 12px; border-radius:8px; margin-top:12px;">
                    <button class="btn-ghost btn-sm" id="btnPrevItem" style="padding:4px 8px;"><i class="fa-solid fa-chevron-left"></i> Prev</button>
                    <span id="multiItemText" style="font-size:0.75rem; font-weight:700; color:var(--text-dark);">Service 1 of 2</span>
                    <button class="btn-ghost btn-sm" id="btnNextItem" style="padding:4px 8px;">Next <i class="fa-solid fa-chevron-right"></i></button>
                </div>
              </div>
            </div>

           <div class="profile-tabs">
              <button class="profile-tab active" data-tab="details"><i class="fa-solid fa-circle-info"></i> Details</button>
            </div>

            <div class="profile-tab-panel active" id="tab-details">
              <div class="info-section">
                <div class="info-section-title">Resident Info</div>
                <div class="info-grid">
                  <div class="info-item info-item--full">
                    <span class="info-key">Full Name</span>
                    <span class="info-val" id="detailResidentName">—</span>
                  </div>
                  <div class="info-item">
                    <span class="info-key">Purpose</span>
                    <span class="info-val" id="detailPurpose">—</span>
                  </div>
                </div>
              </div>

              <div class="cert-actions" id="certActionButtons"></div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  </div>
</div>

<div class="toast" id="toast">
  <i class="fa-solid fa-circle-check toast-icon" id="toastIcon"></i>
  <span id="toastMsg">Done.</span>
</div>

<div id="requestModal" class="modal-fullscreen hidden">
    <div class="modal-content" style="display: flex; flex-direction: column; height: 100vh;">
        
        <div class="modal-header no-print" style="flex-shrink: 0;">
            <div>
                <h2 id="modalTitle">Request Details</h2>
                <p id="modalSubtitle" class="text-muted">Queue Number: <span id="modalQueueNo"></span></p>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <div id="modalItemPagination" class="hidden" style="display:flex; align-items:center; gap:8px; background:var(--bg); padding:5px 10px; border-radius:8px;">
                    <button id="modalPrevItemBtn" class="btn-ghost btn-sm"><i class="fa-solid fa-chevron-left"></i></button>
                    <span id="modalItemCountText">Item 1 of 1</span>
                    <button id="modalNextItemBtn" class="btn-ghost btn-sm"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
                
                <button id="closeModalBtn" class="btn-ghost" style="border: 1px solid var(--border-light);">
                    <i class="fa-solid fa-xmark"></i> Close
                </button>
            </div>
        </div>

        <div id="modalBody" class="modal-body print-area" style="flex: 1; background-color: #f1f5f9; padding: 40px 20px; overflow-y: auto;">
            <div id="dynamicDetailsGrid" style="display: flex; justify-content: center;"></div>
        </div>
        
    </div>
</div>

<div id="processWorkspaceModal" class="modal-fullscreen hidden">
    <div class="modal-content" style="display: flex; flex-direction: column; height: 100vh;">
        
      <div class="modal-header no-print" style="flex-shrink: 0; background: var(--navy); color: white;">
            <div>
                <h2 style="color: white; margin:0;">Processing Workspace</h2>
                <p class="text-muted" style="color: #cbd5e1; margin-top:3px; font-size:0.85rem;">Queue Number: <span id="wsQueueNo"></span></p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <button id="wsPendingBtn" class="btn-ghost" style="color: white; border: 1px solid #cbd5e1;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Mark Pending
                </button>
                <button id="wsProcessBtn" class="btn-primary" style="background-color: #3b82f6; color: white; border: none; display: none;">
                    <i class="fa-solid fa-gears"></i> Process
                </button>
                <button id="wsRejectBtn" class="btn-ghost" style="color: #f87171; border: 1px solid #f87171;">
                    <i class="fa-solid fa-ban"></i> Reject
                </button>
                <button id="wsPrintAllBtn" class="btn-primary" style="background-color: #64748b; color: white; border: none;">
                    <i class="fa-solid fa-print"></i> Print Documents
                </button>
                <button id="wsCompleteBtn" class="btn-primary" style="background-color: #22c55e; color: white; border: none;">
                    <i class="fa-solid fa-check-double"></i> Complete
                </button>
            </div>
        </div>

        <div style="display:flex; flex: 1; overflow: hidden;">
            <div class="no-print" style="width: 260px; flex-shrink: 0; background: white; border-right: 1px solid var(--border-light); padding: 20px; overflow-y: auto;">
                <h3 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; text-transform: uppercase;">Navigation</h3>
                <ul id="wsNavList" style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px;">
                </ul>
            </div>

            <div class="modal-body print-area" style="flex: 1; background-color: #f1f5f9; padding: 40px; overflow: auto; text-align: center;">
                <div id="wsDynamicDetailsGrid" style="display: inline-block; text-align: left; min-width: 100%;">
                </div>
            </div>
        </div>
        
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/certificate_parts.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/business_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/concrete_pouring_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/delivery_parking_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/indigency_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/job_seeker_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/legal_guardian_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/low_income_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/residency_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/tent_permit_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/barangay_id_certificate.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Services_templates/other_services_certificate.js'); ?>"></script>

<script src="<?php echo get_fresh_asset('JS/Staff_js/staff_dashboard.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Staff_js/staff_barangay_id.js'); ?>"></script>
</body>
</html>