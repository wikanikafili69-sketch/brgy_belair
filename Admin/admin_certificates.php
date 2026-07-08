<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';
require_once '../Functions/cache_buster.php';


// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Certificate - Admin')) {
    header("Location: no_access.php");
    exit();
}

// 2. LOGOUT HANDLER 
if (isset($_GET['logout'])) {
    // Burn the session badge and kick them to login
    session_unset();
    session_destroy();
    header('Location: ../staff.php');
    exit();
}

// ── ADMIN INFO (with safe fallbacks) ─────────────────────────────────────────
$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Certificates — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_certificates.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Services_css/certificate_print.css'); ?>" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
  
  <style>
    .hidden { display: none !important; }
  </style>
</head>
<body>

<div class="dashboard-wrapper">
  <?php include 'sidebar.php'; ?>

  <div class="main-content">
    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Admin: Certificate Requests</h1>
          <p class="page-subtitle">Manage, process, override, and track all certificate requests</p>
        </div>
        <button class="btn-primary" id="btnNewRequest" onclick="openModal('modalNewCert')">
          <i class="fa-solid fa-plus"></i> New Request
        </button>
      </div>

<div class="cert-summary-row" style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px;">
        <div class="summary-chip summary-chip--orange" data-status="for approval">
          <i class="fa-solid fa-file-signature"></i>
          <div>
            <span class="summary-val" id="countForApproval">0</span>
            <span class="summary-lbl">For Approval</span>
          </div>
        </div>
        <div class="summary-chip summary-chip--yellow" data-status="pending">
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
        <div class="summary-chip summary-chip--purple" data-status="ready for pickup">
          <i class="fa-solid fa-box-open"></i>
          <div>
            <span class="summary-val" id="countReady">0</span>
            <span class="summary-lbl">Ready for Pickup</span>
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

            <select class="filter-select" id="filterSource">
              <option value="all">All Sources</option>
              <option value="online">Online</option>
              <option value="walkin">Walk-in</option>
            </select>

            <select class="filter-select" id="filterCertStatus">
                <option value="all">All Status</option>
                <option value="for approval">For Approval</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="ready for pickup">Ready for Pickup</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              
              <select class="filter-select" id="filterCertType" style="display: none;">
                <option value="all">All Types</option>
                <option value="Certificate of Residency">Certificate of Residency</option>
                <option value="Business Clearance">Business Clearance</option>
                <option value="Certificate of Indigency">Certificate of Indigency</option>
                <option value="Certificate of Low Income">Certificate of Low Income</option>
                <option value="Legal Guardian Certificate">Legal Guardian Certificate</option>
                <option value="Certificate of Tent Permit">Certificate of Tent Permit</option>
                <option value="Concrete Pouring Certification">Concrete Pouring Certification</option>
                <option value="First Time Job Seeker">First Time Job Seeker</option>
                <option value="Delivery & Loading/Unloading">Delivery & Loading/Unloading</option>
                <option value="Barangay ID">Barangay ID</option>
                <option value="Other Services">Other Services</option>
              </select>
            </div>
          </div>

          <div class="panel cert-panel">
            <div class="panel-header">
              <div>
                <p class="panel-title">Certificate Request Queue</p>
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
                    <th>Certificate Type</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="certTableBody">
                    <tr><td colspan="5" style="text-align: center; padding: 20px;">Loading data...</td></tr>
                </tbody>
              </table>
            </div>
            
            <div class="pagination-bar" id="adminPagination">
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
            <div class="profile-empty-icon"><i class="fa-solid fa-file-circle-question"></i></div>
            <p class="profile-empty-title">No request selected</p>
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
                <h2 style="color: white; margin:0;">Processing Workspace (Admin)</h2>
                <p class="text-muted" style="color: #cbd5e1; margin-top:3px; font-size:0.85rem;">Queue Number: <span id="wsQueueNo"></span></p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <button id="wsPendingBtn" class="btn-ghost" style="color: white; border: 1px solid #cbd5e1;">
                    <i class="fa-solid fa-clock-rotate-left"></i> Mark Pending
                </button>
                <button id="wsRejectBtn" class="btn-ghost" style="color: #f87171; border: 1px solid #f87171;">
                    <i class="fa-solid fa-ban"></i> Reject
                </button>
                <button id="wsPrintAllBtn" class="btn-primary" style="background-color: #3b82f6; color: white; border: none;">
                    <i class="fa-solid fa-print"></i> Print All
                </button>
                
                <span id="dynamicQueueButtons" style="display:flex; gap:10px;"></span>
                
                <button id="wsCloseBtn" class="btn-ghost" style="color: white; margin-left: 10px;">
                    <i class="fa-solid fa-xmark"></i> Close
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

<div class="modal-overlay hidden" id="modalNewCert" role="dialog" aria-modal="true" aria-labelledby="titleNewCert">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleNewCert"><i class="fa-solid fa-file-circle-plus"></i> Issue New Certificate</h2>
        <p class="modal-sub">Create a walk-in certificate request</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalNewCert')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label" for="certType">Certificate Type <span class="req">*</span></label>
          <select id="certType" class="form-input">
            <option value="">Select type…</option>
            <option>Certificate of Residency</option>
            <option>Business Clearance</option>
            <option>Concrete Pouring</option>
            <option>Truck / Delivery</option>
            <option>First Time Job Seeker</option>
            <option>Legal Guardian</option>
            <option>Certificate of Low Income</option>
            <option>Tent Permit</option>
          </select>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="certResident">Search Resident <span class="req">*</span></label>
          <div style="position: relative;">
              <input type="text" id="certResident" class="form-input" placeholder="Type resident name...">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; right: 12px; top: 12px; color: var(--text-muted);"></i>
          </div>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="certPurpose">Purpose of Request <span class="req">*</span></label>
          <input type="text" id="certPurpose" class="form-input" placeholder="e.g. Local Employment, Scholarship, Bank Requirements">
        </div>
        <div class="form-group">
          <label class="form-label" for="certFee">OR Number (If paid)</label>
          <input type="text" id="certFee" class="form-input" placeholder="OR-XXXXXX">
        </div>
        <div class="form-group">
          <label class="form-label" for="certStaff">Assigned Staff</label>
          <select id="certStaff" class="form-input">
            <option><?= htmlspecialchars($admin_name) ?> (You)</option>
            <option>Staff 01 – Jose Mercado</option>
            <option>Staff 02 – Ana Corpus</option>
          </select>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="certRemarks">Remarks / Notes</label>
          <textarea id="certRemarks" class="form-input form-textarea" placeholder="Internal notes..."></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalNewCert')">Cancel</button>
      <button class="btn-primary" onclick="showToast('Certificate processed and saved!');closeModal('modalNewCert')">
        <i class="fa-solid fa-check"></i> Process Request
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay hidden" id="modalSms" role="dialog" aria-modal="true" aria-labelledby="titleSms">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleSms"><i class="fa-solid fa-comment-sms"></i> Send SMS Notification</h2>
        <p class="modal-sub">Notify resident that their certificate is ready.</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalSms')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label" for="smsResidentName">Resident Name</label>
          <input type="text" id="smsResidentName" class="form-input" readonly style="background: var(--bg); color: var(--text-muted);">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="smsPhoneNumber">Phone Number <span class="req">*</span></label>
          <input type="text" id="smsPhoneNumber" class="form-input" placeholder="e.g. 09123456789">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="smsMessage">Message <span class="req">*</span></label>
          <textarea id="smsMessage" class="form-input form-textarea" style="min-height: 100px;"></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalSms')">Cancel</button>
      <button class="btn-primary" id="btnSendSms" onclick="processSendSms()">
        <i class="fa-solid fa-paper-plane"></i> Send SMS
      </button>
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

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_dashboard.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_certificates.js'); ?>"></script>
</body>
</html>