<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Resident - Admin')) {
    header("Location: no_access.php");
    exit();
}

// Require the DB connection for the activity logger
require_once '../Connections/db_connect.php'; 
require_once '../Functions/cache_buster.php';

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

// ── ADMIN INFO ─────────────────────────────────────────
$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Residents — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_resident.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_resident.css'); ?>" />
</head>
<body>
<div class="dashboard-wrapper">

  <?php include 'sidebar.php'; ?>

  <main class="main-content">

    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Resident Management</h1>
          <p class="page-subtitle">View, search, and manage all registered residents in Barangay 101.</p>
        </div>
      </div>

      <div class="res-summary-row">
        <div class="summary-chip summary-chip--blue" data-status="">
          <i class="fa-solid fa-users"></i>
          <div><span class="summary-val" id="totalCount">0</span><span class="summary-lbl">Total</span></div>
        </div>
        <div class="summary-chip summary-chip--green" data-status="Active">
          <i class="fa-solid fa-circle-check"></i>
          <div><span class="summary-val" id="activeCount">0</span><span class="summary-lbl">Active</span></div>
        </div>
        <div class="summary-chip summary-chip--red" data-status="Archived">
          <i class="fa-solid fa-box-archive"></i>
          <div><span class="summary-val" id="archivedCount">0</span><span class="summary-lbl">Archived</span></div>
        </div>
      </div>

      <div class="res-split" id="resSplit">
        
        <div class="res-table-col" id="resTableCol">
          <div class="res-toolbar">
           <div class="search-box" style="position: relative; display: flex; align-items: center; width: 100%; background: #ffffff; border: 1px solid #94a3b8; border-radius: 8px; padding: 4px 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: border-color 0.2s;">
              
              <div style="position: static; display: flex; align-items: center; justify-content: center; padding: 0 10px; flex-shrink: 0;">
                <i class="fa-solid fa-magnifying-glass" style="color: #64748b; font-size: 1rem;"></i>
              </div>
              
              <input type="text" id="residentSearch" class="search-input" placeholder="Search name, address, ID…" style="position: static; flex-grow: 1; border: none; outline: none; background: transparent; padding: 8px 0; font-family: inherit; font-size: 0.95rem; color: #1e293b; min-width: 0; box-shadow: none;" />
              
              <button class="search-clear" id="searchClear" style="display: none; position: relative !important; right: auto !important; top: auto !important; transform: none !important; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: #475569; width: 32px; height: 32px; padding: 0; margin: 0 4px; font-size: 1.1rem; flex-shrink: 0;">
                <i class="fa-solid fa-xmark"></i>
              </button>
              
              <button class="search-btn" id="searchBtn" style="position: relative; background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; margin-left: 4px; flex-shrink: 0; transition: background 0.2s; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">Search</button>
              
            </div>
            <div class="toolbar-filters">
              <select class="filter-select" id="filterStatus">
                <option value="">All Status</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
              <select class="filter-select" id="filterGender">
                <option value="">All Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div class="panel res-panel">
            <div class="panel-header">
              <div>
                <p class="panel-title">Resident Directory</p>
                <p class="panel-sub" id="tableCount">0 residents</p>
              </div>
            </div>
            <div class="table-wrap">
              <table class="data-table residents-table">
                <thead>
                  <tr>
                    <th>Resident</th>
                    <th>ID</th>
                    <th>Purok</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="residentTableBody" data-table="residents"></tbody>
              </table>
            </div>
            <div class="pagination-bar">
              <span class="pagination-info" id="paginationInfo">Loading...</span>
              <div class="pagination-controls">
                <button class="page-btn" id="prevPage" disabled><i class="fa-solid fa-chevron-left"></i></button>
                <div class="page-numbers" id="pageNumbers"></div>
                <button class="page-btn" id="nextPage" disabled><i class="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        </div>
        
        <aside class="profile-panel" id="profilePanel">
          <div class="profile-empty" id="profileEmpty">
            <div class="profile-empty-icon"><i class="fa-solid fa-user-magnifying-glass"></i></div>
            <p class="profile-empty-title">No resident selected</p>
            <p class="profile-empty-sub">Click any row in the table to view the full resident profile here.</p>
          </div>

          <div class="profile-content hidden" id="profileContent">
            <div class="profile-panel-topbar">
              <span class="profile-panel-label">Resident Profile</span>
              <div style="display:flex;gap:6px;align-items:center;">
                <button class="panel-edit-btn" id="panelBtnEdit" title="Edit resident">
                  <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="panel-close-btn" id="panelClose" title="Close">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div id="profileActiveWarning" class="active-warning-banner" style="display: none; margin: 16px 18px 0 18px;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>ATTENTION: This resident has an ONGOING / ACTIVE case.</span>
            </div>
            <div class="profile-hero">
              <div class="profile-photo-wrap">
                <div class="profile-photo" id="panelPhoto">
                  <span id="panelInitials"></span>
                </div>
                <div class="profile-status-dot" id="panelStatusDot"></div>
              </div>
              <div class="profile-hero-info">
                <h2 class="profile-hero-name" id="panelName"></h2>
                <div class="profile-hero-meta">
                  <span class="profile-hero-id" id="panelId"></span>
                </div>
                <div id="panelStatusBadge" style="margin-top:7px;"></div>
              </div>
            </div>

            <div class="profile-tabs">
              <button class="profile-tab active" data-tab="info"><i class="fa-solid fa-circle-info"></i> Info</button>
              <button class="profile-tab" data-tab="household"><i class="fa-solid fa-house-chimney-user"></i> Household</button>
              <button class="profile-tab" data-tab="documents"><i class="fa-solid fa-file-lines"></i> Documents</button>
            </div>

            <div class="profile-tab-panel active" id="tab-info">
              <div class="info-section">
                <div class="info-section-title">Personal Details</div>
                <div class="info-grid">
                  <div class="info-item"><span class="info-key">Date of Birth</span><span class="info-val" id="panelDOB"></span></div>
                  <div class="info-item"><span class="info-key">Age</span><span class="info-val" id="panelAge"></span></div>
                  <div class="info-item"><span class="info-key">Gender</span><span class="info-val" id="panelGender"></span></div>
                  <div class="info-item"><span class="info-key">Civil Status</span><span class="info-val" id="panelCivil"></span></div>
                  <div class="info-item"><span class="info-key">Voter Status</span><span class="info-val" id="panelVoter"></span></div>
                  <div class="info-item"><span class="info-key">Registered</span><span class="info-val" id="panelRegistered"></span></div>
                </div>
              </div>
              <div class="info-section">
                <div class="info-section-title">Address & Contact</div>
                <div class="info-grid">
                  <div class="info-item info-item--full"><span class="info-key">Address</span><span class="info-val" id="panelAddress"></span></div>
                  <div class="info-item"><span class="info-key">Purok</span><span class="info-val" id="panelPurok"></span></div>
                  <div class="info-item"><span class="info-key">Contact No.</span><span class="info-val" id="panelContact"></span></div>
                  <div class="info-item info-item--full"><span class="info-key">Email</span><span class="info-val" id="panelEmail"></span></div>
                </div>
              </div>
            </div>

            <div class="profile-tab-panel" id="tab-household">
              <div class="info-section">
                <div class="info-section-title">Household Details</div>
                <div class="info-grid">
                  <div class="info-item info-item--full"><span class="info-key">Household Head</span><span class="info-val" id="panelHouseHead"></span></div>
                  <div class="info-item"><span class="info-key">Total Members</span><span class="info-val" id="panelHouseMembers"></span></div>
                  <div class="info-item"><span class="info-key">Location</span><span class="info-val" id="panelHousePurok"></span></div>
                </div>
              </div>
              <div class="info-section">
                <div class="info-section-title">Other Household Members</div>
                <div id="panelHouseMembersList" class="member-list"></div>
              </div>
            </div>

            <div class="profile-tab-panel" id="tab-documents">
              <div class="info-section">
                <div class="info-section-title">Document Request History</div>
                <div id="panelDocHistory" class="doc-history-list"></div>
              </div>
            </div>

            <div class="profile-action-row" id="profileActionRow" style="padding: 16px; border-top: 1px solid var(--border-light); margin-top: auto; background: var(--bg);">
            </div>

          </div>
        </aside>
      </div>
    </div>
  </main>
</div>

<div class="modal-overlay" id="residentModal">
  <div class="modal-box" style="max-width: 850px;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="modalMainTitle">Resident Record</h2>
        <p class="modal-sub" id="modalSubTitle">Update complete resident information</p>
      </div>
      <button class="modal-close" id="modalCloseBtn"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" style="padding: 24px 30px;">
      <form id="residentForm" novalidate>
        <div style="text-align:center; margin-bottom:20px;">
  
  <img id="previewPhoto" src="" alt="Preview"
       style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #e5e7eb;display:block;margin:auto;" />

  <input type="file" id="fldPhoto" accept="image/*" style="margin-top:10px;" />

  <small style="color:#6b7280;">Max 20MB</small>

</div>
        <input type="hidden" id="residentId" />

        <div class="form-section-label">1. Name & Basic Details</div>
        <div class="form-grid" style="grid-template-columns: repeat(4, 1fr);">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">First Name <span class="req">*</span></label>
            <input type="text" class="form-control uppercase-input" id="fldFirstName" required />
          </div>
          <div class="form-group" style="grid-column: span 1;">
            <label class="form-label">Middle Name</label>
            <input type="text" class="form-control uppercase-input" id="fldMiddleName" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Last Name <span class="req">*</span></label>
            <input type="text" class="form-control uppercase-input" id="fldLastName" required />
          </div>
          <div class="form-group" style="grid-column: span 1;">
            <label class="form-label">Ext (JR/SR)</label>
            <input type="text" class="form-control uppercase-input" id="fldExt" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Household Number</label>
            <input type="text" class="form-control" id="fldHouseholdNo" readonly style="background: #f1f5f9; cursor: not-allowed;" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Household Type</label>
            <select class="form-control" id="fldHouseholdType">
              <option value="">— SELECT —</option>
              <option>Single Family</option>
              <option>Extended Family</option>
              <option>Multi-Family</option>
              <option>Single Person</option>
            </select>
          </div>
        </div>

        <div class="form-section-label" style="margin-top:24px;">2. Personal Information</div>
        <div class="form-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="form-group">
            <label class="form-label">Gender <span class="req">*</span></label>
            <select class="form-control" id="fldGender" required>
              <option value="">— SELECT —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Date of Birth <span class="req">*</span></label>
            <input type="date" class="form-control" id="fldDOB" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contact Number</label>
            <input type="tel" class="form-control" id="fldContact" maxlength="11" />
          </div>
<div class="form-group">
    <label class="form-label">Email</label>
    <input type="email" class="form-control" id="fldEmail" placeholder="example@email.com" />
</div>

          <div class="form-group" style="grid-column: span 3;">
            <label class="form-label">Place of Birth</label>
            <input type="text" class="form-control" id="fldPOB" />
          </div>
          <div class="form-group">
            <label class="form-label">Civil Status</label>
            <select class="form-control" id="fldCivilStatus">
              <option value="">— Select —</option>
              <option>Single</option>
              <option>Married</option>
              <option>Widowed</option>
              <option>Separated</option>
              <option>Annulled</option>
            </select>
          </div>
          
          <div class="form-group" style="grid-column: span 1;">
            <label class="form-label">Religion</label>
            <select class="form-control" id="fldReligion">
              <option value="">— Select —</option>
              <option>Roman Catholic</option>
              <option>Iglesia ni Cristo</option>
              <option>Islam</option>
              <option>Born Again Christian</option>
              <option>Seventh-day Adventist</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" id="wrapReligionOther" style="display:none; grid-column: span 1;">
            <label class="form-label">Specify Religion</label>
            <input type="text" class="form-control uppercase-input" id="fldReligionOther" placeholder="Specify..." />
          </div>
        </div>

        <div class="form-section-label" style="margin-top:24px;">3. Address Details</div>
        <div class="form-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="form-group">
            <label class="form-label">House No.</label>
            <input type="text" class="form-control" id="fldHouseNo" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Street / Purok</label>
            <input type="text" class="form-control" id="fldStreet" />
          </div>
          <div class="form-group">
            <label class="form-label">Barangay <span class="req">*</span></label>
            <input type="text" class="form-control" id="fldBrgy" required />
          </div>
          <div class="form-group">
            <label class="form-label">Municipality/City <span class="req">*</span></label>
            <input type="text" class="form-control" id="fldMuni" required />
          </div>
          <div class="form-group">
            <label class="form-label">Province <span class="req">*</span></label>
            <input type="text" class="form-control" id="fldProv" required />
          </div>
        </div>

        <div class="form-section-label" style="margin-top:24px;">4. Background & Residency</div>
        <div class="form-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="form-group" style="grid-column: span 3;">
            <label class="form-label">Educational Attainment</label>
            <select class="form-control" id="fldEducation">
              <option value="">— Select —</option>
              <option>No Formal Education</option>
              <option>Elementary Level</option>
              <option>Elementary Graduate</option>
              <option>High School Level</option>
              <option>High School Graduate</option>
              <option>College Level</option>
              <option>College Graduate</option>
              <option>Vocational / Technical</option>
              <option>Post Graduate</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Registered Voter?</label>
            <select class="form-control" id="fldVoter">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Precinct No.</label>
            <input type="text" class="form-control" id="fldPrecinct" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Employment / Business Status</label>
            <select class="form-control" id="fldEmployment">
              <option value="">— Select —</option>
              <option>Employed (Private)</option>
              <option>Employed (Government)</option>
              <option>Self-Employed / Business Owner</option>
              <option>Unemployed</option>
              <option>Student</option>
              <option>Retired</option>
              <option>OFW</option>
            </select>
          </div>
          
          <div class="form-group" id="wrapBusinessKind" style="display:none; grid-column: span 1;">
            <label class="form-label">Kind of Business</label>
            <input type="text" class="form-control uppercase-input" id="fldBusinessKind" />
          </div>

          <div class="form-group">
            <label class="form-label">Citizenship</label>
            <input type="text" class="form-control uppercase-input" id="fldCitizenship" />
          </div>
          <div class="form-group">
            <label class="form-label">Years of Stay</label>
            <input type="number" class="form-control" id="fldYears" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">Residence Status</label>
            <select class="form-control" id="fldResidenceStatus">
              <option value="">— Select —</option>
              <option>Owner</option>
              <option>Renter</option>
              <option>Sharer</option>
              <option>Caretaker</option>
            </select>
          </div>
        </div>

        <div class="form-section-label" style="margin-top:24px;">5. Sector & Beneficiary Status</div>
        
        <div style="display:flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; font-size: 0.85rem; color: var(--text-dark);">
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="chkSenior"> Senior Citizen</label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="chkPWD"> PWD</label>
            <label style="display:flex; align-items:center; gap:6px; cursor:pointer;"><input type="checkbox" id="chkSoloParent"> Solo Parent</label>
        </div>

        <div class="form-grid" style="grid-template-columns: repeat(2, 1fr); background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid var(--border-light);">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">DSWD Beneficiary?</label>
            <select class="form-control" id="fldIsDSWD">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div id="wrapDSWD" style="display:none; grid-column: span 2; grid-template-columns: repeat(2, 1fr); gap: 14px;">
            <div class="form-group" style="grid-column: span 2; display:flex; gap: 20px; font-size: 0.8rem;">
              <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" id="chkAICS"> AICS</label>
              <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" id="chkAKAP"> AKAP</label>
              <label style="display:flex; align-items:center; gap:6px;"><input type="checkbox" id="chkTUPAD"> TUPAD</label>
            </div>
            <div class="form-group">
              <label class="form-label">Other DSWD Program</label>
              <input type="text" class="form-control" id="fldDSWDOther" />
            </div>
            <div class="form-group">
              <label class="form-label">Date Received</label>
              <input type="date" class="form-control" id="fldDSWDDate" />
            </div>
          </div>

          <div class="form-group" style="grid-column: span 2; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            <label class="form-label">Livelihood Beneficiary?</label>
            <select class="form-control" id="fldIsLivelihood">
              <option value="0">No</option>
              <option value="1">Yes</option>
            </select>
          </div>
          <div id="wrapLivelihood" style="display:none; grid-column: span 2; grid-template-columns: repeat(2, 1fr); gap: 14px;">
            <div class="form-group">
              <label class="form-label">Specify Program</label>
              <input type="text" class="form-control" id="fldLivelihoodSpecify" />
            </div>
            <div class="form-group">
              <label class="form-label">Date Finished</label>
              <input type="date" class="form-control" id="fldLivelihoodDate" />
            </div>
          </div>
        </div>

        <div class="form-group" id="termsGroup" style="margin-top: 24px;">
          <label style="display:flex; align-items:center; gap:8px; font-weight:600; cursor:pointer;">
            <input type="checkbox" id="chkTerms" required> 
            I agree to the terms and conditions and confirm this data is accurate.
          </label>
        </div>

      </form>
    </div>
    <div class="modal-footer" style="padding: 16px 30px;">
      <button class="btn-ghost" id="btnCancelModal">Cancel</button>
      <button class="btn-primary" id="btnSaveResident">
        <i class="fa-solid fa-floppy-disk"></i> <span id="btnSaveText">Save Changes</span>
      </button>
    </div>
  </div>
</div>

<div class="toast" id="toast">
  <i class="fa-solid fa-circle-check toast-icon"></i>
  <span id="toastMsg">Done.</span>
</div>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_resident.js'); ?>"></script>
</body>
</html>