<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';
require_once '../Functions/cache_buster.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Reports - Admin')) {
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
  <title>Admin Reports — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_reports.css'); ?>" />
  
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
      /* Custom styles for the charts container */
      .charts-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid var(--border);
      }
      .chart-box {
          position: relative;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      @media (max-width: 768px) {
          .charts-wrapper { grid-template-columns: 1fr; }
      }
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
          <h1 class="page-title">Generate Reports</h1>
          <p class="page-subtitle">Extract barangay records via Excel or Print.</p>
        </div>
      </div>

      <div class="reports-layout">
        
        <div class="panel reports-sidebar">
          <ul class="report-nav-list" id="reportNavList">
            <li class="report-nav-item" data-target="priority">Priority Reports</li>
            <li class="report-nav-item active" data-target="occupation">Occupation Reports</li>
            <li class="report-nav-item" data-target="residents">Residents Reports</li>
            <li class="report-nav-item" data-target="analytics">Analytics</li>
          </ul>
        </div>

        <div class="panel reports-main">
          
          <div class="report-header">
            <div>
              <h2 class="report-main-title" id="reportMainTitle">Occupation Reports</h2>
              <p class="report-main-sub" id="reportMainSub">View and extract employment statistics and records.</p>
            </div>
            
            <div class="report-actions">
              <button class="btn-ghost" onclick="exportGraphsToPDF()" style="color:#ef4444; border-color:#fca5a5; background:#fef2f2;">
                <i class="fa-solid fa-file-pdf"></i> Export Graphs (PDF)
              </button>
            </div>
          </div>

          <div class="report-filters">
            <div class="filter-group">
              <label>Filter by Date / Range</label>
              <div style="display: flex; gap: 8px;">
                <input type="date" class="filter-input" id="dateFrom">
                <span style="display:flex;align-items:center;color:var(--text-muted);">to</span>
                <input type="date" class="filter-input" id="dateTo">
              </div>
            </div>
            <div class="filter-group">
              <label>Specific Category</label>
              <select class="filter-input" id="dynamicFilterSelect">
                <option value="all">All Occupations</option>
                <option value="employed">Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self-Employed / Business</option>
                <option value="student">Students</option>
              </select>
            </div>
            <div class="filter-group" style="align-items: flex-end;">
              <button class="btn-primary" id="generateReportBtn" style="height: 38px;">
                Apply Filter
            </button>
            </div>
          </div>

          <div id="chartsContainer" class="charts-wrapper">
              <div class="chart-box">
                  <canvas id="reportPieChart"></canvas>
              </div>
              <div class="chart-box">
                  <canvas id="reportBarChart"></canvas>
              </div>
          </div>

          <div class="table-wrap">
            <table class="data-table" id="reportPreviewTable">
              <thead>
                <tr>
                  <th>Resident Name</th>
                  <th>Age / Gender</th>
                  <th>Purok</th>
                  <th>Occupation Status</th>
                  <th>Company / Detail</th>
                </tr>
              </thead>
              <tbody id="reportTableBody">
                  <tr>
                      <td colspan="5" style="text-align:center; padding:20px;">
                          Click "Apply Filter" to load data
                      </td>
                  </tr>
              </tbody>
              </table>
              </div>
        
        </div>
      </div>
    </div>
  </main>
</div>
<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_reports.js'); ?>"></script>
</body>
</html>