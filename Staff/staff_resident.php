<?php
// residents.php — Barangay Residents Page
// Require the security bouncer
require_once 'staff_auth.php';
require_once '../Functions/cache_buster.php';

if (!hasAccess('Access Resident - Staff')) {
    header("Location: no_access.php");
    exit();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Residents — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Staff_css/staff_resident.css'); ?>" />
</head>
<body>

<div class="dashboard-wrapper">

  <?php include 'sidebar.php'; ?>

  <div class="main-content">

   <?php include 'topbar.php'; ?>

    <div class="content-container">

      <div class="page-header">
        <div>
          <h1 class="page-title">Residents</h1>
          <p class="page-subtitle">Search, view and manage registered barangay residents</p>
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

          <button class="btn-primary" id="btnAddResident" style="margin-left:auto;">
          <i class="fa-solid fa-plus"></i> Add Resident
        </button>
      </div>

      <div class="res-split" id="resSplit">

        <div class="res-table-col" id="resTableCol">

          <div class="res-toolbar">
            <div class="search-box">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" id="residentSearch" class="search-input" placeholder="Search name, address, ID…" />
              <button class="search-clear" id="searchClear" style="display:none;"><i class="fa-solid fa-xmark"></i></button>
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
              <select class="filter-select" id="filterPurok">
                <option value="">All Purok</option>
                <option value="Purok 1">Purok 1</option>
                <option value="Purok 2">Purok 2</option>
                <option value="Purok 3">Purok 3</option>
                <option value="Purok 4">Purok 4</option>
              </select>
            </div>
          </div>

          <div class="panel res-panel">
            <div class="panel-header">
              <div>
                <p class="panel-title">Resident Records</p>
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
                <tbody id="residentTableBody"></tbody>
              </table>
            </div>
            <div class="pagination-bar">
              <span class="pagination-info" id="paginationInfo">Loading...</span>
              <div class="pagination-controls">
                <button class="page-btn" id="prevPage" disabled><i class="fa-solid fa-chevron-left"></i></button>
                <div class="page-numbers" id="pageNumbers"></div>
                <button class="page-btn" id="nextPage" disabled><i class="fa-solid fa-chevron-right"></i></button>
              </div>
              <select class="filter-select" id="perPageSelect" style="width:auto; display:none;">
                <option value="20">20/page</option>
              </select>
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
  <img id="panelPhotoImg" src="" style="width:100%;height:100%;object-fit:cover;display:none;">
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
              <button class="profile-tab active" data-tab="info">
                <i class="fa-solid fa-circle-info"></i> Info
              </button>
              <button class="profile-tab" data-tab="household">
                <i class="fa-solid fa-house-chimney-user"></i> Household
              </button>
              <button class="profile-tab" data-tab="documents">
                <i class="fa-solid fa-file-lines"></i> Documents
              </button>
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
  </div>
</div>
          
<div class="modal-overlay" id="editModal">
  <div class="modal-box" style="max-width: 850px;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title">Edit Resident Record</h2>
        <p class="modal-sub" id="editModalSub">Update complete resident information</p>
      </div>
      <button class="modal-close" id="editModalClose"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" style="padding: 24px 30px;">
      <form id="residentForm" novalidate>
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:20px;">
  
        <div id="photoPreview" style="
            width:80px; height:80px;
            border-radius:50%;
            background:#e5e7eb;
            display:flex; align-items:center; justify-content:center;
            font-weight:600; font-size:18px;
            overflow:hidden;
        ">
          <img id="photoPreviewImg" src=""
              style="width:100%;height:100%;object-fit:cover;display:none;">
          <span id="photoInitials">IMG</span>
        </div>

  <div>
    <input type="file" id="fldPhoto" accept="image/*" />
    <small style="display:block; font-size:11px; color:#64748b;">
      Max 20MB • JPG / PNG
    </small>
  </div>

</div>
        <input type="hidden" id="residentId" />
        <input type="hidden" id="formMode" value="edit" />

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

      </form>
    </div>
    <div class="modal-footer" style="padding: 16px 30px;">
      <button class="btn-ghost" id="btnCancelEdit">Cancel</button>
      <button type="button" class="btn-primary" id="btnSaveResident">
        <i class="fa-solid fa-floppy-disk"></i> Save Complete Changes
      </button>
    </div>
  </div>
</div>

<div class="toast" id="toast">
  <i class="fa-solid fa-circle-check toast-icon"></i>
  <span id="toastMsg">Done.</span>
</div>

<script src="<?php echo get_fresh_asset('JS/Staff_js/staff_dashboard.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Staff_js/staff_resident.js'); ?>"></script>
</body>
</html>