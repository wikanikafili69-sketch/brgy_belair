<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';
// Require the DB connection for the activity logger
require_once '../Connections/db_connect.php'; 
require_once '../Functions/cache_buster.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Blotter - Admin')) {
    header("Location: no_access.php");
    exit();
}



// 2. LOGOUT HANDLER WITH ACTIVITY LOGGING
if (isset($_GET['logout'])) {
    $log_name = isset($_SESSION['admin_name']) ? $_SESSION['admin_name'] : 'Administrator';
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

// ── ADMIN INFO (with safe fallbacks) ─────────────────────────────────────────
$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Blotter Records — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_blotter.css'); ?>" />
</head>
<body>
<div class="dashboard-wrapper">

  <?php include 'sidebar.php'; ?>

  <main class="main-content">

    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Cases & Blotter Records</h1>
          <p class="page-subtitle">Manage Lupon cases, complaints, and barangay mediation records.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" onclick="openModal('modalAddCase')">
            <i class="fa-solid fa-plus"></i> Add Case
          </button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header table-controls">
          <div class="entries-wrap">
            <span style="font-size: 0.8rem; color: var(--text-mid);">Show</span>
            <select class="filter-select" style="width: 70px;">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span style="font-size: 0.8rem; color: var(--text-mid);">entries</span>
          </div>

        <div style="display: flex; gap: 10px; align-items: center;">
            <select class="filter-select" id="filterStatus">
              <option value="active">Active Cases</option>
              <option value="inactive">Inactive Cases</option>
              <option value="all">All Cases</option>
            </select>

            <div class="search-mini blotter-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="caseSearch" placeholder="SEARCH KEYWORDS...">
            </div>
          </div>

        <div class="view-toggle-wrap" id="viewToggleWrap">
          <button class="btn-view-toggle active" id="btnCardView" onclick="switchMobileView('card')">
            <i class="fa-solid fa-table-cells-large"></i> Card View
          </button>
          <button class="btn-view-toggle" id="btnTableView" onclick="switchMobileView('table')">
            <i class="fa-solid fa-table"></i> Table View
          </button>
        </div>

        <div class="blotter-cards" id="blotterCards"></div>

        <div class="table-wrap blotter-table-wrap">
          <table class="data-table blotter-table">
            <thead>
              <tr>
                <th>REPORT TYPE</th>
                <th>CASE NUMBER</th>
                <th>HEARING DATE</th>
                <th>NUMBER OF CASE</th>
                <th>MODERATOR</th>
                <th>DEFENDANTS</th>
                <th>COMPLAINANTS</th>
                <th>ABOUT</th>
                <th>ISSUE PROBLEM</th>
                <th>AGREEMENT</th>
                <th>DOCUMENT REFERENCE</th>
                <th>NOTED BY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <div class="page-info" style="visibility: hidden;">Showing 1 to 2 of 2 entries</div>
          <div class="page-controls">
            <button class="page-btn page-text-btn" disabled>« Previous</button>
            <button class="page-btn active">1</button>
            <button class="page-btn page-text-btn">Next »</button>
          </div>
        </div>
      </div>

    </div>
  </main>
</div>

<div class="modal-overlay" id="modalAddCase" role="dialog" aria-modal="true" aria-labelledby="titleAddCase">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleAddCase"><i class="fa-solid fa-plus"></i> Add New Case</h2>
        <p class="modal-sub">Log a new blotter or Lupon incident</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalAddCase')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Report Type <span class="req">*</span></label>
          <select class="form-input" id="addReportType">
            <option value="LUPON">LUPON</option>
            <option value="BLOTTER">BLOTTER</option>
            <option value="VAWC">VAWC</option>
            <option value="COMPLAIN">COMPLAIN</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Case Number <span class="req">*</span></label>
          <input type="text" class="form-input" id="addCaseNumber" placeholder="JK2M9C1IOX">
        </div>
        <div class="form-group">
          <label class="form-label">Hearing Date</label>
          <input type="date" class="form-input" id="addHearingDate">
        </div>
        <div class="form-group">
          <label class="form-label">Number of Case</label>
          <input type="number" class="form-input" id="addNumberOfCase" placeholder="1" value="1">
        </div>
        <div class="form-group">
          <label class="form-label">Moderator</label>
          <input type="text" class="form-input" id="addModerator" placeholder="Name of moderator">
        </div>
          <div class="form-group form-group--full">
          <label class="form-label">Complainants <span class="req">*</span></label>
          <input type="text" class="form-input autocomplete-input" id="addComplainants" autocomplete="off" placeholder="Name(s) of complainant">
        </div>
        <div class="form-group form-group--full" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="addIsVisitor" value="1" style="width: auto; margin: 0;">
          <label class="form-label" for="addIsVisitor" style="margin: 0; cursor: pointer;">Visitor Complainant</label>
        </div>
          <div class="form-group form-group--full">
          <label class="form-label">Defendants <span class="req">*</span></label>
          <input type="text" class="form-input autocomplete-input" id="addDefendants" autocomplete="off" placeholder="Name(s) of defendant">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Issue / Problem <span class="req">*</span></label>
          <textarea class="form-input form-textarea" id="addIssueProblem" placeholder="e.g. PERJURY, HARASSMENT AND LIBEL"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Agreement</label>
          <input type="text" class="form-input" id="addAgreement" placeholder="e.g. FOR MEDIATION">
        </div>
        <div class="form-group">
          <label class="form-label">Document Reference</label>
          <input type="text" class="form-input" id="addDocumentReference" placeholder="Document Reference">
        </div>
        <div class="form-group">
          <label class="form-label">Noted By</label>
          <input type="text" class="form-input" id="addNotedBy" placeholder="Staff Name" value="">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Attach Document</label>
          <input type="file" class="form-input" id="addAttachedFile" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">About (Tungkol sa)</label>
          <input type="text" class="form-input" id="addAbout" placeholder="Additional details...">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalAddCase')">Cancel</button>
      <button class="btn-primary" onclick="submitNewCase()">
        <i class="fa-solid fa-floppy-disk"></i> Save Case
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalEditCase" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-pen-to-square"></i> Edit Case Details</h2>
        <p class="modal-sub">Update existing blotter information</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalEditCase')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="form-grid">
        <input type="hidden" id="editRecordId">
        <div class="form-group">
          <label class="form-label">Report Type</label>
          <select class="form-input" id="editReportType">
            <option value="LUPON">LUPON</option>
            <option value="BLOTTER">BLOTTER</option>
            <option value="VAWC">VAWC</option>
            <option value="COMPLAIN">COMPLAIN</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Case Number <span class="req">*</span></label>
          <input type="text" class="form-input" id="editCaseNumber">
        </div>
        <div class="form-group">
          <label class="form-label">Hearing Date</label>
          <input type="date" class="form-input" id="editHearingDate">
        </div>
        <div class="form-group">
          <label class="form-label">Number of Case</label>
          <input type="number" class="form-input" id="editNumberOfCase">
        </div>
        <div class="form-group">
          <label class="form-label">Moderator</label>
          <input type="text" class="form-input" id="editModerator">
        </div>
          <div class="form-group form-group--full">
          <label class="form-label">Complainants</label>
          <input type="text" class="form-input autocomplete-input" id="editComplainants" autocomplete="off">
        </div>
        <div class="form-group form-group--full" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="editIsVisitor" value="1" style="width: auto; margin: 0;">
          <label class="form-label" for="editIsVisitor" style="margin: 0; cursor: pointer;">Visitor Complainant</label>
        </div>
          <div class="form-group form-group--full">
          <label class="form-label">Defendants</label>
          <input type="text" class="form-input autocomplete-input" id="editDefendants" autocomplete="off">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Issue / Problem</label>
          <textarea class="form-input form-textarea" id="editIssueProblem"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Agreement</label>
          <input type="text" class="form-input" id="editAgreement">
        </div>
        <div class="form-group">
          <label class="form-label">Document Reference</label>
          <input type="text" class="form-input" id="editDocRef">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">Attach Document <span style="font-size:0.75rem;color:var(--text-mid);">(Leave blank to keep existing)</span></label>
          <input type="file" class="form-input" id="editAttachedFile" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg">
        </div>
        <div class="form-group form-group--full">
          <label class="form-label">About (Tungkol sa)</label>
          <input type="text" class="form-input" id="editAbout">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalEditCase')">Cancel</button>
      <button class="btn-primary" onclick="submitEditCase()">
        <i class="fa-solid fa-floppy-disk"></i> Update Case
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalViewCase" role="dialog" aria-modal="true">
  <div class="modal modal--sm">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-scale-balanced"></i> Case Details</h2>
        <p class="modal-sub">Ref: <strong class="mono-cell" id="viewCaseNumberTitle">—</strong></p>
      </div>
      <button class="modal-close" onclick="closeModal('modalViewCase')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      
      <div id="viewActiveWarning" class="active-warning-banner" style="display: none;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>ATTENTION: This resident has an ONGOING / ACTIVE case.</span>
      </div>
      <div class="detail-row"><span class="detail-label">Report Type</span>   <span class="detail-value" id="viewReportType">—</span></div>
      <div class="detail-row"><span class="detail-label">Hearing Date</span>  <span class="detail-value" id="viewHearingDate" style="font-weight:700;">—</span></div>
      <div class="detail-row"><span class="detail-label">Complainants</span>  <span class="detail-value" id="viewComplainants" style="font-weight:700;">—</span></div>
      <div class="detail-row"><span class="detail-label">Visitor Status</span><span class="detail-value" id="viewIsVisitorStatus">—</span></div>
      <div class="detail-row"><span class="detail-label">Defendants</span>    <span class="detail-value" id="viewDefendants" style="color:var(--red);font-weight:700;">—</span></div>
      <div class="detail-row"><span class="detail-label">Moderator</span>     <span class="detail-value" id="viewModerator">—</span></div>
      <div class="detail-row"><span class="detail-label">Issue/Problem</span> <span class="detail-value" id="viewIssueProblem">—</span></div>
      <div class="detail-row"><span class="detail-label">Agreement</span>     <span class="detail-value" id="viewAgreement">—</span></div>
      <div class="detail-row"><span class="detail-label">Doc Reference</span> <span class="detail-value" id="viewDocRef">—</span></div>
      <div class="detail-row"><span class="detail-label">Attached Doc</span>  <span class="detail-value" id="viewAttachedFile">—</span></div>
      <div class="detail-row"><span class="detail-label">Noted By</span>      <span class="detail-value" id="viewNotedBy">—</span></div>
      <div class="detail-row form-group--full" style="flex-direction:column;align-items:flex-start;margin-top:10px;">
        <span class="detail-label">About (Tungkol sa)</span>
        <span class="detail-value" id="viewAbout" style="width:100%;display:block;background:var(--bg);padding:8px;border-radius:6px;margin-top:5px;">—</span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalViewCase')">Close</button>
      <button class="btn-primary" style="background:var(--gold);color:var(--navy);" onclick="window.print()">
        <i class="fa-solid fa-print"></i> Print Document
      </button>
    </div>
  </div>
</div>

<datalist id="residentList"></datalist>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_blotter.js'); ?>"></script>
</body>
</html>