<?php
// Require the security bouncer
require_once 'staff_auth.php';
require_once '../Functions/cache_buster.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Staff Dashboard — Barangay Portal</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_resident.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Services_css/certificate_print.css'); ?>" />

  <script src="<?php echo get_fresh_asset('JS/Services_templates/certificate_parts.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/business_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/low_income_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/residency_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/tent_permit_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/delivery_parking_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/job_seeker_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/legal_guardian_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/indigency_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/concrete_pouring_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/barangay_id_certificate.js'); ?>"></script>
  <script src="<?php echo get_fresh_asset('JS/Services_templates/other_services_certificate.js'); ?>"></script>

  <style>
    .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-top: 1px solid var(--border-light);
        background: var(--bg);
        font-size: 0.8rem;
        color: var(--text-mid);
    }
    .pagination-buttons { display: flex; gap: 8px; }
    .hidden { display: none !important; }
  </style>
</head>
<body>

<div class="dashboard-wrapper">
  <?php include 'sidebar.php'; ?>

  <main class="main-content">
    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Overview</h1>
          <p class="page-subtitle">Here's what's happening in your barangay today.</p>
        </div>
      </div>

      <div class="row overview-row" id="overviewStatsRow">
          <div class="stats-card">
              <div class="card-left">
                  <div class="card-label">TOTAL RESIDENTS</div>
                  <div class="stats-value" id="stat-total-residents">...</div> 
                  <div class="trend-group text-green">
                      <i class="fa-solid fa-chart-line trend-icon"></i>
                      <span class="trend-value" id="trend-total-residents">...</span> 
                  </div>
              </div>
              <div class="card-right icon-users"><i class="fa-solid fa-users"></i></div>
          </div>

          <div class="stats-card">
              <div class="card-left">
                  <div class="card-label">RESIDENT REQUESTS</div>
                  <div class="stats-value" id="stat-total-requests">...</div>
                  <div class="trend-group text-green">
                      <i class="fa-solid fa-chart-simple trend-icon"></i>
                      <span class="trend-value" id="trend-total-requests">...</span>
                  </div>
              </div>
              <div class="card-right icon-file"><i class="fa-solid fa-file-export"></i></div>
          </div>

          <div class="stats-card">
              <div class="card-left">
                  <div class="card-label">WALK-IN QUEUEING</div>
                  <div class="stats-value" id="stat-walkin-today">...</div>
                  <div class="trend-group text-red">
                      <i class="fa-solid fa-person-walking trend-icon"></i>
                      <span class="trend-value">Today</span>
                  </div>
              </div>
              <div class="card-right icon-walkin"><i class="fa-solid fa-walkie-talkie"></i></div>
          </div>

          <div class="stats-card">
              <div class="card-left">
                  <div class="card-label">TODAY'S ONLINE REQ.</div>
                  <div class="stats-value" id="stat-online-today">...</div>
                  <div class="trend-group text-mid">
                      <i class="fa-solid fa-globe trend-icon"></i>
                      <span class="trend-value">Today</span>
                  </div>
              </div>
              <div class="card-right icon-online"><i class="fa-solid fa-wifi"></i></div>
          </div>
      </div>

      <div class="lower-grid">
        <section class="panel panel--table">
          <div class="panel-header" style="flex-wrap: wrap; gap: 15px;">
            <div>
              <h2 class="panel-title">Service Queues Overview</h2>
              <p class="panel-sub">Recent activity from all services</p>
            </div>
            
            <form id="queueFilterForm" class="filter-form">
              <input type="date" name="filter_date" value="<?= date('Y-m-d') ?>" class="filter-input" />
              <select name="filter_status" class="filter-input">
                <option value="all">All Status</option>
                <option value="pending" selected>Pending</option> 
                <option value="for approval">For Approval</option> <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
         
            </form>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Queue Number</th>
                  <th class="col-service-type">Service Type</th>
                  <th>Date Requested</th>
                  <th>Actions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="queueTableBody"></tbody>
            </table>
          </div>
          
          <div id="paginationContainer" class="pagination-container" style="display:none;">
              <div id="paginationInfo">Showing page 1 of 1</div>
              <div class="pagination-buttons" id="paginationButtons"></div>
          </div>
        </section>

        <div class="right-panels">
          <section class="panel panel--actions">
            <div class="panel-header"><h2 class="panel-title">Quick Actions</h2></div>
            <div class="quick-actions">
              <button class="quick-action-btn" onclick="printReport()">
                  <span class="qa-icon qa-icon--purple"><i class="fa-solid fa-print"></i></span>
                  <span>Print Report</span>
              </button>
            </div>
          </section>

          <section class="panel panel--queue">
            <div class="panel-header">
              <h2 class="panel-title">Live Status</h2>
              <span class="live-badge"><span class="live-dot"></span> Live</span>
            </div>
            <div class="queue-list" id="miniQueueList">
               </div>
          </section>
        </div>
      </div>

    </div>
  </main>
</div>

<!-- RESTRUCTURED DASHBOARD VIEW MODAL (Split Layout) -->
<di<!-- RESTRUCTURED DASHBOARD VIEW MODAL (Split Layout) -->
<div id="requestModal" class="modal-fullscreen hidden">
    <div class="modal-content" style="display: flex; flex-direction: column; height: 100vh;">
        
        <!-- 1. DARK NAVY HEADER (View Only & Print) -->
        <div class="modal-header no-print" style="flex-shrink: 0; background: var(--navy); color: white;">
            <div>
                <h2 id="modalTitle" style="color: white; margin: 0;">Request Details</h2>
                <p class="text-muted" style="color: #cbd5e1; margin-top: 3px; font-size: 0.85rem;">
                    Queue Number: <span id="modalQueueNo"></span>
                </p>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
                <!-- Just Print and Close Buttons -->
                <button id="closeModalBtn" class="btn-ghost" style="color: white; border: 1px solid #cbd5e1;">
                    <i class="fa-solid fa-xmark"></i> Close
                </button>
            </div>
        </div>

        <!-- 2. SPLIT WORKSPACE BODY -->
        <div style="display:flex; flex: 1; overflow: hidden;">
            
            <!-- LEFT NAVIGATION SIDEBAR -->
            <div class="no-print" style="width: 260px; flex-shrink: 0; background: white; border-right: 1px solid var(--border-light); padding: 20px; overflow-y: auto;">
                <h3 style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; text-transform: uppercase;">Navigation</h3>
                
                <!-- JS WILL DYNAMICALLY POPULATE THIS LIST -->
                <ul id="modalNavList" style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px;">
                </ul>
            </div>

            <!-- RIGHT PAPER AREA -->
            <div id="modalBody" class="modal-body print-area" style="flex: 1; background-color: #f1f5f9; padding: 40px; overflow: auto; text-align: center;">
                
                <!-- Blotter Warning -->
                <div id="viewActiveWarning" class="active-warning-banner" style="display: none; margin-bottom: 16px; text-align: left; max-width: 800px; margin-left: auto; margin-right: auto;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span>ATTENTION: This resident has an ONGOING / ACTIVE case.</span>
                </div>
                
                <!-- The Paper mounts here -->
                <div id="dynamicDetailsGrid" style="display: inline-block; text-align: left; min-width: 100%;"></div>
                
            </div>
        </div>
        
    </div>
</div>

<script src="<?php echo get_fresh_asset('JS/Staff_js/staff_dashboard.js'); ?>"></script>

</body>
</html>