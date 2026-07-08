<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';
require_once '../Functions/cache_buster.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
//if (!hasAccess('Access Dashboard - Admin')) {
//    header("Location: no_access.php");
//    exit();
//}

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
  <title>Admin Dashboard — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
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
          <p class="page-subtitle">Welcome back, <strong><?= htmlspecialchars($admin_name) ?></strong>! Here is the barangay's current status.</p>
        </div>
        <button class="btn-primary" id="btnGenerateReport">
          <i class="fa-solid fa-download"></i> Generate Report
        </button>
      </div>

      <div class="cards-grid">
        <div class="stat-card" data-animate data-link="admin_resident.php">
          <div class="card-info">
            <h3>Total Residents</h3>
            <div class="card-value" data-count="12450">0</div>
            <span class="card-trend trend-up"><i class="fa-solid fa-arrow-trend-up"></i> +45 this month</span>
          </div>
          <div class="card-icon card-icon--blue"><i class="fa-solid fa-users"></i></div>
        </div>
        <div class="stat-card" data-animate data-link="admin_certificates.php">
          <div class="card-info">
            <h3>Pending Certs</h3>
            <div class="card-value" data-count="24">0</div>
            <span class="card-trend trend-down"><i class="fa-solid fa-arrow-trend-down"></i> -5 from yesterday</span>
          </div>
          <div class="card-icon card-icon--gold"><i class="fa-solid fa-file-signature"></i></div>
        </div>
        <div class="stat-card" data-animate data-link="admin_blotter.php">
          <div class="card-info">
            <h3>Active Blotters</h3>
            <div class="card-value" data-count="3">0</div>
            <span class="card-trend trend-neutral"><i class="fa-solid fa-minus"></i> No change</span>
          </div>
          <div class="card-icon card-icon--purple"><i class="fa-solid fa-scale-balanced"></i></div>
        </div>
      </div>

      <div class="lower-grid">

        <div class="left-panels">

          <div id="certCountsContainer"></div>
          <div id="resCountsContainer" style="margin-bottom: 15px;"></div>

          <div class="panel" style="margin-top: 20px;">
            <div class="panel-header">
              <div>
                <p class="panel-title">Recent Certificates</p>
                <p class="panel-sub">Latest barangay clearance and certificate applications</p>
              </div>
              <div class="panel-header-actions">
<select id="certFilter" class="form-input" style="width: auto; padding: 5px 10px; font-size: 0.75rem;">
                  <option value="all">All Status</option>
                  <option value="for approval">For Approval</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="ready for pickup">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
                <div class="search-mini">
                  <i class="fa-solid fa-magnifying-glass"></i>
                  <input type="text" id="certSearch" placeholder="Search…" aria-label="Search certificates">
                </div>
                <button class="btn-ghost btn-sm" onclick="window.location='admin_certificates.php'">View All</button>
              </div>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>Certificate Type</th>
                    <th>Date Filed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody id="certificatesBody"></tbody>
              </table>
            </div>
          </div>

        </div>

        <div class="right-panels">

          <div class="panel">
            <div class="panel-header">
              <div>
                <p class="panel-title">Live Queue</p>
                <p class="panel-sub">Walk-in requests right now</p>
              </div>
              <div class="panel-header-actions">
                <div class="live-badge"><div class="live-dot"></div> Live</div>
                <button class="btn-ghost btn-sm" onclick="window.location='admin_certificates.php'">Manage</button>
              </div>
            </div>
            <div class="queue-list">
            </div>
            <div class="queue-footer">
              <span><i class="fa-solid fa-users"></i> <strong>0</strong> waiting</span>
              <span><i class="fa-solid fa-clock"></i> ~<strong>0 min</strong> avg</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </main>
</div>

<div class="modal-overlay" id="modalAddResident" role="dialog" aria-modal="true" aria-labelledby="titleAddResident">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleAddResident"><i class="fa-solid fa-user-plus"></i> Add New Resident</h2>
        <p class="modal-sub">Register a new barangay resident to the system</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalAddResident')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <form id="formAddResident">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="resFirstName">First Name <span class="req">*</span></label>
            <input type="text" id="resFirstName" name="first_name" class="form-input" placeholder="Juan" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="resLastName">Last Name <span class="req">*</span></label>
            <input type="text" id="resLastName" name="last_name" class="form-input" placeholder="Dela Cruz" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="resMiddleName">Middle Name</label>
            <input type="text" id="resMiddleName" name="middle_name" class="form-input" placeholder="Santos">
          </div>
          <div class="form-group">
            <label class="form-label" for="resDob">Date of Birth <span class="req">*</span></label>
            <input type="date" id="resDob" name="birth_date" class="form-input" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="resGender">Gender <span class="req">*</span></label>
            <select id="resGender" name="gender" class="form-input" required>
              <option value="">Select…</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="resCivilStatus">Civil Status</label>
            <select id="resCivilStatus" name="civil_status" class="form-input">
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="resAddress">Address / Purok <span class="req">*</span></label>
            <input type="text" id="resAddress" name="street" class="form-input" placeholder="e.g. Purok 1, Block 3 Lot 5" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="resContact">Contact Number</label>
            <input type="tel" id="resContact" name="contact_no" class="form-input" placeholder="09XX XXX XXXX">
          </div>
          <div class="form-group">
            <label class="form-label" for="resVoter">Voter Status</label>
            <select id="resVoter" name="registered_voter" class="form-input">
              <option value="1">Registered Voter</option>
              <option value="0">Not Registered</option>
            </select>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalAddResident')">Cancel</button>
      <button class="btn-primary" onclick="submitAddResident()">
        <i class="fa-solid fa-floppy-disk"></i> Save Resident
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalNewCert" role="dialog" aria-modal="true" aria-labelledby="titleNewCert">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleNewCert"><i class="fa-solid fa-file-circle-plus"></i> Issue Certificate</h2>
        <p class="modal-sub">Create a new certificate request for a resident</p>
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
          <label class="form-label" for="certResident">Resident Name <span class="req">*</span></label>
          <input type="text" id="certResident" class="form-input" placeholder="Search resident name…">
        </div>
        <div class="form-group">
          <label class="form-label" for="certPurpose">Purpose</label>
          <input type="text" id="certPurpose" class="form-input" placeholder="e.g. Employment, Scholarship">
        </div>
        <div class="form-group">
          <label class="form-label" for="certStaff">Assigned Staff</label>
          <select id="certStaff" class="form-input">
            <option>Staff 01 – Jose Mercado</option>
            <option>Staff 02 – Ana Corpus</option>
            <option>Admin</option>
          </select>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="certRemarks">Remarks</label>
          <textarea id="certRemarks" class="form-input form-textarea" placeholder="Any notes…"></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalNewCert')">Cancel</button>
      <button class="btn-primary" onclick="showToast('Certificate request submitted!','success');closeModal('modalNewCert')">
        <i class="fa-solid fa-paper-plane"></i> Submit Request
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalBlotter" role="dialog" aria-modal="true" aria-labelledby="titleBlotter">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleBlotter"><i class="fa-solid fa-gavel"></i> File Blotter Record</h2>
        <p class="modal-sub">Log a new incident or complaint</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalBlotter')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <form id="formBlotter" enctype="multipart/form-data">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label" for="case_number">Case Number <span class="req">*</span></label>
            <input type="text" id="case_number" name="case_number" class="form-input" placeholder="e.g., 2026-001">
          </div>
          <div class="form-group">
            <label class="form-label" for="number_of_case">Number of Case</label>
            <input type="text" id="number_of_case" name="number_of_case" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label" for="blotter_type">Blotter Type <span class="req">*</span></label>
            <input type="text" id="blotter_type" name="blotter_type" class="form-input" placeholder="e.g., Dispute, Theft">
          </div>
          <div class="form-group">
            <label class="form-label" for="hearing_date">Hearing Date</label>
            <input type="datetime-local" id="hearing_date" name="hearing_date" class="form-input">
          </div>
          <div class="form-group">
            <label class="form-label" for="complainants">Complainant(s) <span class="req">*</span></label>
            <input type="text" id="complainants" name="complainants" class="form-input" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="form-label" for="defendants">Defendant(s) <span class="req">*</span></label>
            <input type="text" id="defendants" name="defendants" class="form-input" placeholder="Full name">
          </div>
          <div class="form-group">
            <label class="form-label" for="moderator">Moderator</label>
            <input type="text" id="moderator" name="moderator" class="form-input" placeholder="Assigned moderator">
          </div>
          <div class="form-group" style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" id="is_visitor" name="is_visitor" value="1">
            <label class="form-label" for="is_visitor" style="margin:0;">Is Visitor?</label>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="about">About (Subject) <span class="req">*</span></label>
            <input type="text" id="about" name="about" class="form-input" placeholder="Brief subject of the incident">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="issue_problem">Issue / Problem Narrative <span class="req">*</span></label>
            <textarea id="issue_problem" name="issue_problem" class="form-input form-textarea" rows="3" placeholder="Describe the incident in detail…"></textarea>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="agreement">Agreement / Resolution</label>
            <textarea id="agreement" name="agreement" class="form-input form-textarea" rows="2" placeholder="Agreements made, if any…"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="document_reference">Document Reference</label>
            <input type="text" id="document_reference" name="document_reference" class="form-input" placeholder="Ref No.">
          </div>
          <div class="form-group">
            <label class="form-label" for="noted_by">Noted By</label>
            <input type="text" id="noted_by" name="noted_by" class="form-input" placeholder="Officer Name">
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="attached_file">Attached File</label>
            <input type="file" id="attached_file" name="attached_file" class="form-input">
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalBlotter')">Cancel</button>
      <button class="btn-primary" onclick="showToast('Blotter filed successfully!','success');closeModal('modalBlotter')">
        <i class="fa-solid fa-floppy-disk"></i> File Blotter
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalAnnouncement" role="dialog" aria-modal="true" aria-labelledby="titleAnnouncement">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleAnnouncement"><i class="fa-solid fa-bullhorn"></i> Post Announcement</h2>
        <p class="modal-sub">Broadcast a barangay-wide announcement</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalAnnouncement')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label" for="annTitle">Title <span class="req">*</span></label>
          <input type="text" id="annTitle" class="form-input" placeholder="e.g. Community Clean-Up Drive">
        </div>
        <div class="form-group">
          <label class="form-label" for="annCategory">Category</label>
          <select id="annCategory" class="form-input">
            <option>General</option><option>Health</option>
            <option>Safety</option><option>Event</option><option>Advisory</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="annPriority">Priority</label>
          <select id="annPriority" class="form-input">
            <option>Normal</option><option>Important</option><option>Urgent</option>
          </select>
        </div>
        <div class="form-group form-group--full">
          <label class="form-label" for="annMessage">Message <span class="req">*</span></label>
          <textarea id="annMessage" class="form-input form-textarea" rows="4" placeholder="Write your announcement here…"></textarea>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalAnnouncement')">Cancel</button>
      <button class="btn-primary" onclick="showToast('Announcement posted!','success');closeModal('modalAnnouncement')">
        <i class="fa-solid fa-bullhorn"></i> Post Now
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalViewDetails" role="dialog" aria-modal="true" aria-labelledby="titleViewDetails">
  <div class="modal modal--sm">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleViewDetails"><i class="fa-solid fa-eye"></i> Record Details</h2>
        <p class="modal-sub">Full transaction information</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalViewDetails')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div id="dashViewActiveWarning" class="active-warning-banner" style="display: none; margin-bottom: 16px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>ATTENTION: This resident has an ONGOING / ACTIVE case.</span>
      </div>
      <div class="detail-row"><span class="detail-label">Resident</span>       <span class="detail-value" id="dResident">—</span></div>
      <div class="detail-row"><span class="detail-label">Purok</span>          <span class="detail-value" id="dPurok">—</span></div>
      <div class="detail-row"><span class="detail-label">Service Type</span>   <span class="detail-value" id="dType">—</span></div>
      <div class="detail-row"><span class="detail-label">Status</span>         <span class="detail-value" id="dStatus">—</span></div>
      <div class="detail-row"><span class="detail-label">Assigned Staff</span> <span class="detail-value" id="dStaff">—</span></div>
      <div class="detail-row"><span class="detail-label">Date Filed</span>     <span class="detail-value" id="dDate">—</span></div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalViewDetails')">Close</button>
      <button class="btn-primary" onclick="window.print()"><i class="fa-solid fa-print"></i> Print Record</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalReport" role="dialog" aria-modal="true" aria-labelledby="titleReport">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleReport"><i class="fa-solid fa-download"></i> Generate Report</h2>
        <p class="modal-sub">Export barangay data reports</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalReport')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group form-group--full">
          <label class="form-label" for="reportType">Report Type</label>
          <select id="reportType" class="form-input">
            <option>Monthly Certificate Summary</option>
            <option>Resident Population Report</option>
            <option>Blotter Incident Report</option>
            <option>Staff Activity Log</option>
            <option>Queue Activity Report</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="reportFrom">Date From</label>
          <input type="date" id="reportFrom" class="form-input">
        </div>
        <div class="form-group">
          <label class="form-label" for="reportTo">Date To</label>
          <input type="date" id="reportTo" class="form-input">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Export Format</label>
          <input type="text" class="form-input" value="Excel Data (.csv)" disabled style="background-color: #f1f5f9; cursor: not-allowed; color: #64748b;">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalReport')">Cancel</button>
      <button class="btn-primary" onclick="generateReport()">
        <i class="fa-solid fa-download"></i> Generate & Download
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalCertType" role="dialog" aria-modal="true" aria-labelledby="titleCertType">
  <div class="modal" style="max-width:780px;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleCertType">
          <i class="fa-solid fa-file-lines"></i>
          <span id="certTypeModalTitle">Certificate Details</span>
        </h2>
        <p class="modal-sub" id="certTypeModalSub">Showing all requests for this certificate type</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalCertType')" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="modal-body">
      <div class="cert-type-stats" id="certTypeStats"></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Resident</th>
              <th>Certificate Type</th>
              <th>Date Filed</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="certTypeModalBody"></tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalCertType')">Close</button>
      <button class="btn-primary" onclick="window.location='admin_certificates.php'">
        <i class="fa-solid fa-arrow-right"></i> Go to Certificates
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalCertOverview" role="dialog" aria-modal="true" aria-labelledby="titleCertOverview">
  <div class="modal" style="max-width:720px;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleCertOverview">
          <i class="fa-solid fa-file-lines"></i> Certificate Overview
        </h2>
        <p class="modal-sub">All certificate types and their current counts</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalCertOverview')" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="modal-body" id="certOverviewModalBody"></div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalCertOverview')">Close</button>
      <button class="btn-primary" onclick="window.location='admin_certificates.php'">
        <i class="fa-solid fa-arrow-right"></i> Go to Certificates
      </button>
    </div>
  </div>
</div>


<div class="modal-overlay" id="modalResOverview" role="dialog" aria-modal="true" aria-labelledby="titleResOverview">
  <div class="modal" style="max-width:720px;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleResOverview">
          <i class="fa-solid fa-users-viewfinder"></i> Residents Demographics
        </h2>
        <p class="modal-sub">Comprehensive breakdown of the barangay population</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalResOverview')" aria-label="Close">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="modal-body" id="resOverviewModalBody">
      </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalResOverview')">Close</button>
      <button class="btn-primary" onclick="window.location='admin_resident.php'">
        <i class="fa-solid fa-arrow-right"></i> Manage Residents
      </button>
    </div>
  </div>
</div>

<div id="toastContainer"></div>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_dashboard.js'); ?>"></script>
</body>
</html>