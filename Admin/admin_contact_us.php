<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';
// Make sure to adjust this path to your db_connect.php if necessary
require_once '../Connections/db_connect.php'; 
require_once '../Functions/cache_buster.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Contact - Admin')) {
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

// ── AJAX ARCHIVE HANDLER ──────────────────────────────────────────────────────
// This catches the fetch request from JS to update the status to 'archive'
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['archive_id'])) {
    header('Content-Type: application/json');
    $id = intval($_POST['archive_id']);
    try {
        // 1. Get sender info for the log BEFORE archiving
        $stmtInfo = $pdo->prepare("SELECT full_name, subject FROM contact_us WHERE id = ?");
        $stmtInfo->execute([$id]);
        $msgInfo = $stmtInfo->fetch(PDO::FETCH_ASSOC);

        // 2. Archive the message
        $stmt = $pdo->prepare("UPDATE contact_us SET status = 'archive' WHERE id = ?");
        $stmt->execute([$id]);

        // 3. LOG THE ACTIVITY
        if ($msgInfo) {
            $log_name = isset($_SESSION['admin_name']) ? $_SESSION['admin_name'] : 'Administrator';
            $action = "Archived/Resolved a contact message from <strong>" . htmlspecialchars($msgInfo['full_name']) . "</strong> (Subject: " . htmlspecialchars($msgInfo['subject']) . ").";
            $timestamp = date('Y-m-d H:i:s');

            $log_stmt = $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (:name, :action, :time)");
            $log_stmt->execute([
                'name' => $log_name,
                'action' => $action,
                'time' => $timestamp
            ]);
        }

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
    exit;
}

// ── ADMIN INFO (with safe fallbacks) ─────────────────────────────────────────
$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';

// NOTE: We no longer fetch active messages here via PHP. 
// It is now handled in real-time by JS and your new admin_contact_us_api.php!
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contact Messages — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_contact_us.css'); ?>" />
</head>
<body>
<div class="dashboard-wrapper">

  <?php include 'sidebar.php'; ?>

  <main class="main-content">

    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Resident Messages</h1>
          <p class="page-subtitle">View and manage inquiries submitted from the public website.</p>
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

          <div class="search-mini contact-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="msgSearch" placeholder="SEARCH MESSAGES...">
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

        <div class="contact-cards" id="contactCards">
            </div>

        <div class="table-wrap contact-table-wrap">
          <table class="data-table contact-table">
            <thead>
              <tr>
                <th>DATE RECEIVED</th>
                <th>SENDER NAME</th>
                <th>SUBJECT</th>
                <th>MESSAGE PREVIEW</th>
                <th>ATTACHMENT</th>
                <th>STATUS</th>
                <th style="text-align: right;">ACTIONS</th>
              </tr>
            </thead>
            <tbody id="contactTableBody">
              </tbody>
          </table>
        </div>

        <div class="pagination">
          <div class="page-info">Loading entries...</div>
          <div class="page-controls">
            <button class="page-btn page-text-btn" disabled>« Previous</button>
            <button class="page-btn active">1</button>
            <button class="page-btn page-text-btn" disabled>Next »</button>
          </div>
        </div>
      </div>

    </div>
  </main>
</div>

<div class="modal-overlay" id="modalViewMessage" role="dialog" aria-modal="true">
  <div class="modal modal--sm">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-envelope-open-text"></i> Read Message</h2>
        <p class="modal-sub">Submitted on: <strong id="viewMsgDate">--</strong></p>
      </div>
      <button class="modal-close" onclick="closeModal('modalViewMessage')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <div class="detail-row"><span class="detail-label">Sender Name</span>  <span class="detail-value" id="viewMsgName" style="font-weight:700;">--</span></div>
      
      <div class="detail-row"><span class="detail-label">Email Address</span>  <span class="detail-value" id="viewMsgEmail">--</span></div>
      <div class="detail-row"><span class="detail-label">Contact Number</span>  <span class="detail-value" id="viewMsgContact">--</span></div>
      
      <div class="detail-row"><span class="detail-label">Subject</span>      <span class="detail-value" id="viewMsgSubject" style="color:var(--primary); font-weight:700;">--</span></div>
      
      <div class="detail-row form-group--full" style="flex-direction:column;align-items:flex-start;margin-top:10px;">
        <span class="detail-label">Full Message</span>
        <div id="viewMsgContent" style="width:100%; display:block; background:var(--bg); padding:12px; border:1px solid var(--border-light); border-radius:6px; margin-top:5px; font-size: 0.85rem; line-height: 1.6; color:var(--text-dark); min-height: 100px;">
            --
        </div>
      </div>

      <div class="detail-row form-group--full" style="flex-direction:column;align-items:flex-start;margin-top:10px;">
        <span class="detail-label">Attached Photo/Document</span>
        <div id="viewMsgAttachmentContainer" style="margin-top: 8px;">
            </div>
      </div>

    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalViewMessage')">Close</button>
      <button class="btn-primary" onclick="archiveMessage()">
        <i class="fa-solid fa-box-archive"></i> Archive & Resolve
      </button>
    </div>
  </div>
</div>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_contact_us.js'); ?>"></script>
</body>
</html>