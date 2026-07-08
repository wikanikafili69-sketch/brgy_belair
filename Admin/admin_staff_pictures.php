<?php

require_once '../Connections/db_connect.php';

// 1. Require the Admin security bouncer
require_once 'admin_auth.php';
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

    session_unset();
    session_destroy();
    header('Location: ../staff.php');
    exit();
}

// ── ADMIN INFO ───────────────────────────────────────────────────────────────
$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';

// Constants for Validation
$MAX_FILES = 3;
$MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

// ── HANDLE ARCHIVE OFFICIAL ──────────────────────────────────────────────────
if (isset($_GET['archive_id'])) {
    $id = (int) $_GET['archive_id'];
    
    // Get official's name for the log
    $stmtName = $pdo->prepare("SELECT name FROM barangay_officials WHERE id = ?");
    $stmtName->execute([$id]);
    $offName = $stmtName->fetchColumn();

    $stmt = $pdo->prepare("UPDATE barangay_officials SET status = 'inactive' WHERE id = ?");
    $stmt->execute([$id]);

    // Log Activity
    if ($offName) {
        $action = "Archived the official profile of <strong>" . htmlspecialchars($offName) . "</strong>.";
        $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (?, ?, ?)")
            ->execute([$admin_name, $action, date('Y-m-d H:i:s')]);
    }

    header("Location: admin_staff_pictures.php?archived=1");
    exit;
}

// ── HANDLE RESTORE OFFICIAL ──────────────────────────────────────────────────
if (isset($_GET['restore_id'])) {
    $id = (int) $_GET['restore_id'];

    // Get official's name for the log
    $stmtName = $pdo->prepare("SELECT name FROM barangay_officials WHERE id = ?");
    $stmtName->execute([$id]);
    $offName = $stmtName->fetchColumn();

    $stmt = $pdo->prepare("UPDATE barangay_officials SET status = 'active' WHERE id = ?");
    $stmt->execute([$id]);

    // Log Activity
    if ($offName) {
        $action = "Restored the official profile of <strong>" . htmlspecialchars($offName) . "</strong>.";
        $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (?, ?, ?)")
            ->execute([$admin_name, $action, date('Y-m-d H:i:s')]);
    }

    header("Location: admin_staff_pictures.php?restored=1");
    exit;
}

// ── HANDLE PERMANENT DELETE ──────────────────────────────────────────────────
if (isset($_GET['delete_id'])) {
    $id = (int) $_GET['delete_id'];

    // Get official's name for the log
    $stmtName = $pdo->prepare("SELECT name FROM barangay_officials WHERE id = ?");
    $stmtName->execute([$id]);
    $offName = $stmtName->fetchColumn();

    $stmt = $pdo->prepare("DELETE FROM barangay_officials WHERE id = ?");
    $stmt->execute([$id]);

    // Log Activity
    if ($offName) {
        $action = "Permanently deleted the official profile of <strong>" . htmlspecialchars($offName) . "</strong>.";
        $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (?, ?, ?)")
            ->execute([$admin_name, $action, date('Y-m-d H:i:s')]);
    }

    header("Location: admin_staff_pictures.php?deleted=1");
    exit;
}

// ── HANDLE FORM SUBMISSION (ADD OFFICIAL) ────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_official'])) {
    $name     = $_POST['name'];
    $position = $_POST['position'];
    $bio      = $_POST['bio'];
    
    $details     = isset($_POST['details']) ? array_filter($_POST['details']) : [];
    $detailsJson = json_encode(array_values($details));

    $uploadedPhotos = [];                               
    $targetDir      = "../Images/officials_pictures/"; 

    if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);

    $filesToProcess = array_filter($_FILES['photos']['name']);
    
    // Server-Side Verification: Max 3 files
    if (count($filesToProcess) > $MAX_FILES) {
        header("Location: admin_staff_pictures.php?error=maxfiles");
        exit;
    }

    if (!empty($filesToProcess)) {
        foreach ($_FILES['photos']['name'] as $key => $filename) {
            if ($_FILES['photos']['error'][$key] !== UPLOAD_ERR_OK) continue;
            
            // Server-Side Verification: Max 20MB
            if ($_FILES['photos']['size'][$key] > $MAX_FILE_SIZE) {
                header("Location: admin_staff_pictures.php?error=maxsize");
                exit;
            }

            $tmpName        = $_FILES['photos']['tmp_name'][$key];
            $newFilename    = time() . "_" . $key . "_" . preg_replace("/[^a-zA-Z0-9.]/", "", basename($filename));
            $targetFilePath = $targetDir . $newFilename;
            if (move_uploaded_file($tmpName, $targetFilePath)) {
                $uploadedPhotos[] = "Images/officials_pictures/" . $newFilename; 
            }
        }
    }
    $photosJson = json_encode($uploadedPhotos);

    $stmt = $pdo->prepare("INSERT INTO barangay_officials (name, position, bio, details, photos, status) VALUES (?, ?, ?, ?, ?, 'active')");
    $stmt->execute([$name, $position, $bio, $detailsJson, $photosJson]);

    // Log Activity
    $action = "Published a new profile for <strong>" . htmlspecialchars($name) . "</strong> (" . htmlspecialchars($position) . ").";
    $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (?, ?, ?)")
        ->execute([$admin_name, $action, date('Y-m-d H:i:s')]);

    header("Location: admin_staff_pictures.php?success=1");
    exit;
}

// ── HANDLE FORM SUBMISSION (EDIT OFFICIAL) ───────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_official'])) {
    $id       = (int)$_POST['id'];
    $name     = $_POST['name'];
    $position = $_POST['position'];
    $bio      = $_POST['bio'];
    
    $details     = isset($_POST['details']) ? array_filter($_POST['details']) : [];
    $detailsJson = json_encode(array_values($details));

    $filesToProcess = array_filter($_FILES['edit_photos']['name']);

    if (!empty($filesToProcess)) {
        // Server-Side Verification: Max 3 files
        if (count($filesToProcess) > $MAX_FILES) {
            header("Location: admin_staff_pictures.php?error=maxfiles");
            exit;
        }

        $uploadedPhotos = [];                               
        $targetDir      = "../Images/officials_pictures/"; 
        if (!is_dir($targetDir)) mkdir($targetDir, 0777, true);

        foreach ($_FILES['edit_photos']['name'] as $key => $filename) {
            if ($_FILES['edit_photos']['error'][$key] !== UPLOAD_ERR_OK) continue;

            // Server-Side Verification: Max 20MB
            if ($_FILES['edit_photos']['size'][$key] > $MAX_FILE_SIZE) {
                header("Location: admin_staff_pictures.php?error=maxsize");
                exit;
            }

            $tmpName        = $_FILES['edit_photos']['tmp_name'][$key];
            $newFilename    = time() . "_" . $key . "_" . preg_replace("/[^a-zA-Z0-9.]/", "", basename($filename));
            $targetFilePath = $targetDir . $newFilename;
            if (move_uploaded_file($tmpName, $targetFilePath)) {
                $uploadedPhotos[] = "Images/officials_pictures/" . $newFilename; 
            }
        }
        $photosJson = json_encode($uploadedPhotos);
        $stmt = $pdo->prepare("UPDATE barangay_officials SET name=?, position=?, bio=?, details=?, photos=? WHERE id=?");
        $stmt->execute([$name, $position, $bio, $detailsJson, $photosJson, $id]);
    } else {
        $stmt = $pdo->prepare("UPDATE barangay_officials SET name=?, position=?, bio=?, details=? WHERE id=?");
        $stmt->execute([$name, $position, $bio, $detailsJson, $id]);
    }

    // Log Activity
    $action = "Updated the profile information for <strong>" . htmlspecialchars($name) . "</strong>.";
    $pdo->prepare("INSERT INTO activity_logs (staff_name, action, timestamp) VALUES (?, ?, ?)")
        ->execute([$admin_name, $action, date('Y-m-d H:i:s')]);

    header("Location: admin_staff_pictures.php?edited=1");
    exit;
}

// ── FETCH EXISTING OFFICIALS ─────────────────────────────────────────────────
$stmt = $pdo->query("SELECT * FROM barangay_officials ORDER BY id DESC");
$officials      = $stmt->fetchAll(PDO::FETCH_ASSOC);
$totalOfficials = count(array_filter($officials, fn($o) => $o['status'] === 'active'));
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin & Staff Photos — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_staff_pictures.css'); ?>" />
</head>
<body>
<div class="dashboard-wrapper">

  <?php include 'sidebar.php'; ?>

  <main class="main-content">
    
    <?php include 'topbar.php'; ?>

    <div class="content-container">

      <?php if (isset($_GET['success'])): ?>
        <div class="alert alert-success"><i class="fa-solid fa-check-circle"></i> Official profile successfully published!</div>
      <?php endif; ?>
      <?php if (isset($_GET['edited'])): ?>
        <div class="alert alert-success"><i class="fa-solid fa-pen"></i> Official profile updated successfully!</div>
      <?php endif; ?>
      <?php if (isset($_GET['archived'])): ?>
        <div class="alert alert-success" style="color: var(--orange); border-color: rgba(245,158,11,0.2); background: rgba(245,158,11,0.1);"><i class="fa-solid fa-box-archive"></i> Official archived successfully.</div>
      <?php endif; ?>
      <?php if (isset($_GET['restored'])): ?>
        <div class="alert alert-success"><i class="fa-solid fa-rotate-left"></i> Official restored successfully.</div>
      <?php endif; ?>
      <?php if (isset($_GET['deleted'])): ?>
        <div class="alert alert-success alert-danger"><i class="fa-solid fa-trash"></i> Official permanently deleted.</div>
      <?php endif; ?>
      
      <?php if (isset($_GET['error']) && $_GET['error'] === 'maxfiles'): ?>
        <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> Upload failed: You can only upload a maximum of 3 pictures per official.</div>
      <?php endif; ?>
      <?php if (isset($_GET['error']) && $_GET['error'] === 'maxsize'): ?>
        <div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> Upload failed: One or more images exceed the 20MB file size limit.</div>
      <?php endif; ?>

      <div class="page-header">
        <div>
          <h1 class="page-title">Officials & Staff Profiles</h1>
          <p class="page-subtitle">Manage the public-facing profiles displayed on the main website.</p>
        </div>
        <div>
          <button class="btn-primary" onclick="openModal('modalAddOfficial')">
            <i class="fa-solid fa-user-plus"></i> Add Official Profile
          </button>
        </div>
      </div>

      <div class="filter-tabs">
        <button class="filter-btn active" data-filter="active">Active Profiles</button>
        <button class="filter-btn" data-filter="inactive">Archived</button>
      </div>

      <div class="panel">
        <div class="panel-header" style="flex-wrap: wrap; gap: 16px;">
          <div>
            <p class="panel-title">Profile Directory</p>
          </div>
          <div class="panel-header-actions">
            <div class="search-mini staff-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="officialSearch" placeholder="Search profiles...">
            </div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Official Name</th>
                <th>Position</th>
                <th>Biography / Details</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($officials)): ?>
                <tr><td colspan="5" style="text-align:center; padding: 30px;">No officials added yet.</td></tr>
              <?php else: ?>
                <?php foreach ($officials as $off):
                  $photos    = json_decode($off['photos'],  true) ?: [];
                  $details   = json_decode($off['details'], true) ?: [];
                  $coverPhoto = !empty($photos) ? '../' . $photos[0] : '';
                ?>
                <tr class="official-row" data-status="<?= htmlspecialchars($off['status']) ?>">
                  <td>
                    <div class="resident-cell">
                      <?php if ($coverPhoto): ?>
                        <img src="<?= htmlspecialchars($coverPhoto); ?>" class="res-avatar" style="object-fit:cover;">
                      <?php else: ?>
                        <div class="res-avatar" style="background: linear-gradient(135deg, var(--blue), var(--blue-light));">👤</div>
                      <?php endif; ?>
                      <div>
                        <div class="res-name"><?= htmlspecialchars($off['name']); ?></div>
                        <div class="mono-cell">ID-<?= str_pad($off['id'], 4, '0', STR_PAD_LEFT); ?></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="role-badge" style="background: rgba(44,87,229,0.1); color: var(--blue); padding: 4px 10px; border-radius: 20px; font-weight: 600; font-size:0.75rem;">
                      <?= htmlspecialchars($off['position']); ?>
                    </span>
                  </td>
                  <td>
                    <div style="font-size: 0.8rem; color: var(--text-dark); font-weight: 500; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      <?= htmlspecialchars($off['bio']); ?>
                    </div>
                    <div class="res-purok"><?= count($details); ?> Badges assigned</div>
                  </td>
                  <td>
                     <?php if($off['status'] === 'active'): ?>
                        <span class="badge badge--approved">Active</span>
                     <?php else: ?>
                        <span class="badge badge--pending" style="color:var(--text-muted); background:var(--border-light)">Archived</span>
                     <?php endif; ?>
                  </td>
                  <td>
                    <div class="action-group">
                      <?php if($off['status'] === 'active'): ?>
                          <button class="btn-act btn-act--view" title="Edit Profile" onclick="openEditModal(<?= $off['id'] ?>)">
                            <i class="fa-solid fa-pen"></i>
                          </button>
                          <button class="btn-act btn-act--reject" title="Archive Profile" onclick="if(confirm('Archive <?= htmlspecialchars(addslashes($off['name'])); ?>? They will be hidden from the website.')) window.location.href='admin_staff_pictures.php?archive_id=<?= $off['id']; ?>'">
                            <i class="fa-solid fa-box-archive"></i>
                          </button>
                      <?php else: ?>
                          <button class="btn-act btn-act--approve" title="Restore Profile" onclick="if(confirm('Restore <?= htmlspecialchars(addslashes($off['name'])); ?> to the main website?')) window.location.href='admin_staff_pictures.php?restore_id=<?= $off['id']; ?>'">
                            <i class="fa-solid fa-rotate-left"></i>
                          </button>
                          <button class="btn-act btn-act--reject" title="Permanent Delete" onclick="if(confirm('WARNING: Permanently delete <?= htmlspecialchars(addslashes($off['name'])); ?>? This cannot be undone.')) window.location.href='admin_staff_pictures.php?delete_id=<?= $off['id']; ?>'">
                            <i class="fa-solid fa-trash"></i>
                          </button>
                      <?php endif; ?>
                    </div>
                  </td>
                </tr>
                <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </main>
</div>

<script>
  window.officialsData = <?= json_encode($officials) ?>;
</script>

<div class="modal-overlay" id="modalAddOfficial" role="dialog" aria-modal="true" aria-labelledby="titleAddOfficial">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleAddOfficial"><i class="fa-solid fa-address-card"></i> Publish Official Profile</h2>
      </div>
      <button class="modal-close" onclick="closeModal('modalAddOfficial')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form action="admin_staff_pictures.php" method="POST" enctype="multipart/form-data">
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label">Full Name <span class="req">*</span></label>
            <input type="text" name="name" class="form-input" required>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Official Position <span class="req">*</span></label>
            <input type="text" name="position" class="form-input" required>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Biography <span class="req">*</span></label>
            <textarea name="bio" class="form-input form-textarea" required></textarea>
          </div>
          <div class="form-group form-group--full" id="details-container">
            <label class="form-label">Profile Badges / Details</label>
            <div class="detail-input-group">
              <input type="text" name="details[]" class="form-input" placeholder="e.g. 📅 Term: 2023 - 2026">
              <button type="button" class="btn-primary" style="padding: 0 15px;" onclick="addDetailField('details-container')"><i class="fa-solid fa-plus"></i></button>
            </div>
          </div>
          <div class="form-group form-group--full photo-upload-area">
            <label class="form-label">Upload Profile Photos <span class="req">*</span></label>
            <p style="font-size:0.7rem; color:var(--text-muted); margin-bottom:10px;">Select up to <strong>3 images</strong> (Max 20MB per photo). The first image is the cover.</p>
            
            <input type="file" name="photos[]" id="photo-upload" accept="image/*" class="hidden-input" multiple>
            
            <div class="custom-photo-grid" id="custom-photo-grid">
              <div class="photo-add-btn" id="photo-add-btn" onclick="document.getElementById('photo-upload').click()">
                <i class="fa-solid fa-plus"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-ghost" onclick="closeModal('modalAddOfficial')">Cancel</button>
        <button type="submit" name="add_official" class="btn-primary"><i class="fa-solid fa-globe"></i> Publish</button>
      </div>
    </form>
  </div>
</div>

<div class="modal-overlay" id="modalEditOfficial" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-pen"></i> Edit Profile</h2>
      </div>
      <button class="modal-close" onclick="closeModal('modalEditOfficial')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <form action="admin_staff_pictures.php" method="POST" enctype="multipart/form-data">
      <input type="hidden" name="id" id="edit_id">
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label">Full Name <span class="req">*</span></label>
            <input type="text" name="name" id="edit_name" class="form-input" required>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Official Position <span class="req">*</span></label>
            <input type="text" name="position" id="edit_position" class="form-input" required>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label">Biography <span class="req">*</span></label>
            <textarea name="bio" id="edit_bio" class="form-input form-textarea" required></textarea>
          </div>
          <div class="form-group form-group--full" id="edit-details-container">
            <label class="form-label">Profile Badges / Details</label>
            <button type="button" class="btn-ghost btn-sm" style="margin-bottom: 8px;" onclick="addDetailField('edit-details-container')"><i class="fa-solid fa-plus"></i> Add Badge</button>
          </div>
          <div class="form-group form-group--full photo-upload-area">
            <label class="form-label">Update Photos (Optional)</label>
            <p style="font-size:0.7rem; color:var(--text-muted); margin-bottom:10px;">Select up to <strong>3 images</strong> (Max 20MB per photo). Leave blank to keep existing photos.</p>
            <input type="file" name="edit_photos[]" id="edit-photo-upload" accept="image/*" class="form-input" multiple>
            <div id="edit-image-preview-container" class="preview-container"></div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-ghost" onclick="closeModal('modalEditOfficial')">Cancel</button>
        <button type="submit" name="edit_official" class="btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
      </div>
    </form>
  </div>
</div>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_staff_pictures.js'); ?>"></script>
</body>
</html>