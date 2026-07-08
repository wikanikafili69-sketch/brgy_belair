<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';
require_once '../Functions/cache_buster.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Staff - Admin')) {
    header("Location: no_access.php");
    exit();
}

// Require the DB connection for the activity logger
require_once '../Connections/db_connect.php'; 

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

// ═══════════════════════════════════════════════════
// ✅ FETCH ALL ACCESS RIGHTS FOR MODALS
// ═══════════════════════════════════════════════════
$accessStmt = $pdo->query("SELECT id, access_name FROM access_list ORDER BY access_name ASC");
$all_access_rights = $accessStmt->fetchAll(PDO::FETCH_ASSOC);
// ═══════════════════════════════════════════════════

// Handle Toast messages from redirects (Edit/Password Reset/Suspend)
$toast_msg = $_GET['toast'] ?? '';
$toast_type = $_GET['type'] ?? 'success';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Staff Management — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_staff.css'); ?>" />
  <style>
      tr[ondblclick] { cursor: pointer; transition: background 0.2s; }
      tr[ondblclick]:hover { background: rgba(0,0,0,0.02); }
  </style>
</head>
<body>

<?php if ($toast_msg): ?>
<script>
    document.addEventListener("DOMContentLoaded", function() {
        // Clear the URL parameters so the toast doesn't show again on refresh
        window.history.replaceState({}, document.title, "admin_staff.php");
        showToast("<?= htmlspecialchars($toast_msg) ?>", "<?= htmlspecialchars($toast_type) ?>");
    });
</script>
<?php endif; ?>

<div class="dashboard-wrapper">
  
  <?php include 'sidebar.php'; ?>

  <main class="main-content">
    
    <?php include 'topbar.php'; ?>

    <div class="content-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Staff Management</h1>
          <p class="page-subtitle">Manage system access, roles, and accounts for barangay personnel. (Double-click a row to view details).</p>
        </div>
        <div>
          <button class="btn-primary" onclick="openModal('modalAddStaff')"><i class="fa-solid fa-user-plus"></i> Add New Staff</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header" style="flex-wrap: wrap; gap: 16px;">
          <div>
            <p class="panel-title">System Users</p>
          </div>
        </div>
        
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Login Username</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            
            <tbody id="staffTableBody">
                <tr>
                    <td colspan="5" style="text-align:center; padding: 40px;">
                        <i class="fa-solid fa-spinner fa-spin"></i> Loading staff data...
                    </td>
                </tr>
            </tbody>
            
          </table>
        </div>
      </div>
    </div>
  </main>
</div>

<div class="modal-overlay" id="modalAddStaff" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-user-plus"></i> Create Staff Account</h2>
        <p class="modal-sub">Add a new user to the barangay management system</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalAddStaff')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form id="addStaffForm" enctype="multipart/form-data">
        <div class="modal-body">
          <div class="form-grid">
              
            <div class="form-group form-group--full" style="display:flex; flex-direction:column; align-items:center; margin-bottom:16px;">
               <label class="form-label" style="margin-bottom:8px;">Profile Picture (10MB Max, Optional)</label>
                
                <img id="add_preview" src="" style="width:140px; height:140px; border-radius:50%; object-fit:cover; background:#f1f5f9; display:block; margin:0 auto 12px; border:2px dashed #cbd5e1;">
                
                <div style="display:flex; gap:10px;">
                    <button type="button" class="btn-ghost" id="add_file_btn" style="padding:8px 16px; border: 1px solid var(--border-light);">📁 Choose File</button>
                    <button type="button" class="btn-primary" id="add_camera_btn" style="padding:8px 16px; background: #2c57e5;">📷 Camera</button>
                </div>
                <span id="add_file_name" style="margin-top:8px; font-size:12px; color:#64748b;">NO FILE CHOSEN</span>
                
                <input type="file" id="add_photo" accept="image/png, image/jpeg, image/jpg" style="display:none;">
            </div>

            <div class="form-group">
              <label class="form-label">First Name <span class="req">*</span></label>
              <input type="text" id="add_f_name" class="form-input" placeholder="e.g. Maria" required>
            </div>
            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input type="text" id="add_m_name" class="form-input" placeholder="e.g. Cruz">
            </div>
            <div class="form-group form-group--full">
              <label class="form-label">Last Name <span class="req">*</span></label>
              <input type="text" id="add_l_name" class="form-input" placeholder="e.g. Santos" required>
            </div>

            <div class="form-group form-group--full">
              <label class="form-label">Email Address <span class="req">*</span></label>
              <input type="email" id="add_email" class="form-input" placeholder="e.g. maria@email.com" required>
            </div>

            <div class="form-group">
              <label class="form-label">System Role <span class="req">*</span></label>
              <select id="add_position" class="form-input" required>
                <option value="admin">Administrator</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Initial Status</label>
              <select id="add_status" class="form-input">
                <option value="active">Active</option>
                <option value="pending" selected>Pending</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div class="form-group form-group--full" style="border-top: 1px solid var(--border-light); padding-top: 15px; margin-top: 10px;">
              <label class="form-label">System Access Rights</label>
              
              <div class="access-dropdown">
                  <button type="button" class="dropdown-btn" onclick="toggleAccessDropdown('add')">
                      Select Modules <i class="fa-solid fa-chevron-down" id="add_chevron"></i>
                  </button>
                  <div class="dropdown-menu" id="add_access_menu">
                      <label class="dropdown-item" style="font-weight: bold; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 8px;">
                          <input type="checkbox" id="add_select_all" onchange="toggleSelectAll('add')"> Select All Modules
                      </label>
                      <?php foreach ($all_access_rights as $access): ?>
                        <label class="dropdown-item">
                          <input type="checkbox" name="access_rights[]" value="<?= $access['id'] ?>" data-name="<?= htmlspecialchars($access['access_name']) ?>" class="add-access-checkbox" onchange="updateAccessTable('add')">
                          <?= htmlspecialchars($access['access_name']) ?>
                        </label>
                      <?php endforeach; ?>
                  </div>
              </div>

              <div class="access-table-wrap">
                  <table>
                      <thead>
                          <tr>
                              <th style="width: 40px; text-align: center;">
                                  <input type="checkbox" id="add_table_select_all" onchange="toggleTableSelectAll('add')">
                              </th>
                              <th>Selected Modules</th>
                          </tr>
                      </thead>
                      <tbody id="add_access_table_body">
                          <tr><td colspan="2" style="text-align: center; color: var(--text-mid); font-style: italic;">No modules selected.</td></tr>
                      </tbody>
                  </table>
              </div>
              <button type="button" id="add_remove_btn" class="btn-ghost" style="display: none; margin-top: 10px; color: var(--red); border-color: var(--red); padding: 6px 12px; font-size: 0.8rem;" onclick="removeSelectedFromTable('add')">
                  <i class="fa-solid fa-trash"></i> Remove Selected
              </button>
              </div>

            <div class="form-group form-group--full" style="border-top: 1px solid var(--border-light); padding-top: 15px; margin-top: 10px;">
              <label class="form-label">Login Username <span class="req">*</span></label>
              <input type="text" id="add_username" class="form-input" placeholder="e.g. msantos123" required>
            </div>
            
            <div class="form-group form-group--full">
                <label class="form-label">Set Password <span class="req">*</span></label>
                <div style="position: relative; display: flex; align-items: center;">
                    <input type="password" id="add_password" class="form-input" placeholder="Enter custom password" required style="width: 100%; padding-right: 40px;">
                    <button type="button" onclick="toggleAdminPassword('add_password', 'add_eye')" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: var(--text-mid);">
                        <i class="fa-solid fa-eye" id="add_eye"></i>
                    </button>
                </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-ghost" onclick="closeModal('modalAddStaff')">Cancel</button>
          <button type="submit" id="btnSaveStaff" class="btn-primary"><i class="fa-solid fa-check"></i> Create Account</button>
        </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="modalEditStaff" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-user-pen"></i> Edit Staff Profile</h2>
        <p class="modal-sub">Update information for selected user</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalEditStaff')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    
    <form id="editStaffForm" enctype="multipart/form-data">
        <input type="hidden" id="edit_user_id">
        <input type="hidden" id="edit_existing_image">
        
        <div class="modal-body">
          <div class="form-grid">
              
            <div class="form-group form-group--full" style="display:flex; flex-direction:column; align-items:center; margin-bottom:16px;">
               <label class="form-label" style="margin-bottom:8px;">Update Profile Picture (10MB Max, Optional)</label>
                
                <img id="edit_preview" src="" style="width:140px; height:140px; border-radius:50%; object-fit:cover; background:#f1f5f9; display:block; margin:0 auto 12px; border:2px dashed #cbd5e1;">
                
                <div style="display:flex; gap:10px;">
                    <button type="button" class="btn-ghost" id="edit_file_btn" style="padding:8px 16px; border: 1px solid var(--border-light);">📁 Choose File</button>
                    <button type="button" class="btn-primary" id="edit_camera_btn" style="padding:8px 16px; background: #2c57e5;">📷 Camera</button>
                </div>
                <span id="edit_file_name" style="margin-top:8px; font-size:12px; color:#64748b;">Keep Current Photo</span>
                
                <input type="file" id="edit_photo" accept="image/png, image/jpeg, image/jpg" style="display:none;">
            </div>

            <div class="form-group">
              <label class="form-label">First Name <span class="req">*</span></label>
              <input type="text" id="edit_f_name" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Middle Name</label>
              <input type="text" id="edit_m_name" class="form-input">
            </div>
            <div class="form-group form-group--full">
              <label class="form-label">Last Name <span class="req">*</span></label>
              <input type="text" id="edit_l_name" class="form-input" required>
            </div>

            <div class="form-group form-group--full">
              <label class="form-label">Email Address <span class="req">*</span></label>
              <input type="email" id="edit_email" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">System Role <span class="req">*</span></label>
              <select id="edit_position" class="form-input" required>
                <option value="admin">Administrator</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            
            <div class="form-group form-group--full" style="border-top: 1px solid var(--border-light); padding-top: 15px; margin-top: 10px;">
              <label class="form-label">System Access Rights</label>
              <p style="font-size: 0.8rem; color: var(--text-mid); margin-bottom: 10px;">Modify the modules this staff member can access.</p>
              
              <div class="access-dropdown">
                  <button type="button" class="dropdown-btn" onclick="toggleAccessDropdown('edit')">
                      Modify Modules <i class="fa-solid fa-chevron-down" id="edit_chevron"></i>
                  </button>
                  <div class="dropdown-menu" id="edit_access_menu">
                      <label class="dropdown-item" style="font-weight: bold; border-bottom: 1px solid var(--border-light); padding-bottom: 12px; margin-bottom: 8px;">
                          <input type="checkbox" id="edit_select_all" onchange="toggleSelectAll('edit')"> Select All Modules
                      </label>
                      <?php foreach ($all_access_rights as $access): ?>
                        <label class="dropdown-item">
                          <input type="checkbox" name="access_rights[]" value="<?= $access['id'] ?>" data-name="<?= htmlspecialchars($access['access_name']) ?>" class="edit-access-checkbox" id="edit_access_<?= $access['id'] ?>" onchange="updateAccessTable('edit')">
                          <?= htmlspecialchars($access['access_name']) ?>
                        </label>
                      <?php endforeach; ?>
                  </div>
              </div>

              <div class="access-table-wrap">
                  <table>
                      <thead>
                          <tr>
                              <th style="width: 40px; text-align: center;">
                                  <input type="checkbox" id="edit_table_select_all" onchange="toggleTableSelectAll('edit')">
                              </th>
                              <th>Selected Modules</th>
                          </tr>
                      </thead>
                      <tbody id="edit_access_table_body">
                          <tr><td colspan="2" style="text-align: center; color: var(--text-mid); font-style: italic;">No modules selected.</td></tr>
                      </tbody>
                  </table>
              </div>
              <button type="button" id="edit_remove_btn" class="btn-ghost" style="display: none; margin-top: 10px; color: var(--red); border-color: var(--red); padding: 6px 12px; font-size: 0.8rem;" onclick="removeSelectedFromTable('edit')">
                  <i class="fa-solid fa-trash"></i> Remove Selected
              </button>
              </div>

            <div class="form-group form-group--full" style="border-top: 1px solid var(--border-light); padding-top: 15px; margin-top: 10px;">
              <label class="form-label">Login Username <span class="req">*</span></label>
              <input type="text" id="edit_username" class="form-input" required>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-ghost" onclick="closeModal('modalEditStaff')">Cancel</button>
          <button type="submit" id="btnUpdateStaff" class="btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
        </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="modalViewStaff" role="dialog" aria-modal="true">
  <div class="modal modal--sm">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-address-card"></i> User Profile</h2>
      </div>
      <button class="modal-close" onclick="closeModal('modalViewStaff')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" style="padding: 24px; text-align: center;">
        
        <div style="width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 50%; background: linear-gradient(135deg, var(--blue), var(--blue-light)); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" id="view_avatar_container">
            </div>

        <h3 style="margin-bottom: 5px; color: var(--text-dark);" id="view_full_name">Name</h3>
        <p style="color: var(--text-mid); font-size: 0.9rem; margin-bottom: 20px;" id="view_username">@username</p>

        <div style="background: var(--bg); border-radius: 8px; padding: 16px; text-align: left; border: 1px solid var(--border-light);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--text-mid); font-size: 0.85rem;">System Role</span>
                <span style="font-weight: 600; text-transform: capitalize; color: var(--blue);" id="view_role">Role</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: var(--text-mid); font-size: 0.85rem;">Account Status</span>
                <span style="font-weight: 600; text-transform: capitalize;" id="view_status">Status</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-mid); font-size: 0.85rem;">Date Joined</span>
                <span style="font-weight: 600;" id="view_date">Date</span>
            </div>
        </div>

    </div>
  </div>
</div>

<div class="modal-overlay" id="modalResetPass" role="dialog" aria-modal="true">
    <div class="modal modal--sm">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-key"></i> Reset Password</h2>
        <p class="modal-sub">Generate a new password for this user</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalResetPass')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    
    <form method="POST" action="../API/Admin/admin_staff_actions.php">
        <input type="hidden" name="action" value="reset_password">
        <input type="hidden" name="user_id" id="reset_user_id">
        <div class="modal-body" style="padding: 20px;">
            <p style="font-size: 0.85rem; color: var(--text-mid); line-height: 1.5; margin-bottom: 20px; text-align: center;">
                Enter a new password for this staff member.
            </p>
            <div class="form-group">
                <label class="form-label">New Password <span class="req">*</span></label>
                <div style="position: relative; display: flex; align-items: center;">
                    <input type="password" name="new_password" id="reset_new_password" class="form-input" placeholder="Enter new password" required style="width: 100%; padding-right: 40px;">
                    <button type="button" onclick="toggleAdminPassword('reset_new_password', 'reset_eye')" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: var(--text-mid);">
                        <i class="fa-solid fa-eye" id="reset_eye"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-footer" style="justify-content: center;">
          <button type="button" class="btn-ghost" onclick="closeModal('modalResetPass')">Cancel</button>
          <button type="submit" class="btn-primary" style="background: var(--purple);">Confirm Reset</button>
        </div>
    </form>
  </div>
</div>

<div id="customToast" class="custom-toast">
    <div style="display: flex; align-items: center; gap: 12px;">
        <i id="toastIcon" class="fa-solid fa-circle-check"></i>
        <span id="toastMessage">Message goes here.</span>
    </div>
    <button onclick="closeCustomToast()" style="background:none; border:none; color:var(--text-mid); cursor:pointer; font-size:1.1rem;">
        <i class="fa-solid fa-xmark"></i>
    </button>
</div>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_staff.js'); ?>"></script>
</body>
</html>