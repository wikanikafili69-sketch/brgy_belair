<?php
// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)
require_once 'admin_auth.php';

// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Gallery - Admin')) {
    header("Location: no_access.php");
    exit();
}

// ── DATABASE CONNECTION ───────────────────────────────────────────────────────
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

// ── ADMIN INFO (with safe fallbacks) ─────────────────────────────────────────
$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';

// FETCH ALBUMS & PHOTOS FROM DATABASE
$galleryAlbums = [];
try {
    // Fetch ALL photos so we can list them inside the "Manage" modal
    $stmt = $pdo->query("SELECT * FROM barangay_gallery ORDER BY album_month DESC, id ASC");
    $allImages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group them by month
    foreach ($allImages as $img) {
        $month = $img['album_month'];
        if (!isset($galleryAlbums[$month])) {
            $galleryAlbums[$month] = [
                'album_month' => $month,
                'title'       => $img['title'],
                'status'      => $img['status'],
                'cover_photo' => $img['photo_path'], // First photo is cover
                'photo_count' => 0,
                'photos'      => []
            ];
        }
        $galleryAlbums[$month]['photo_count']++;
        $galleryAlbums[$month]['photos'][] = [
            'id'   => $img['id'],
            'path' => $img['photo_path']
        ];
    }
} catch (PDOException $e) {
    error_log("Error fetching gallery: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gallery Management — Admin Panel</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  
<link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_gallery.css'); ?>" />

  <style>
    .gallery-filter-bar { display: flex; gap: 10px; margin-top: 24px; margin-bottom: 8px; }
    .filter-btn { background: var(--white); border: 1px solid var(--border-light); color: var(--text-muted); padding: 8px 18px; border-radius: var(--radius-sm); font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all var(--transition); box-shadow: var(--shadow-sm); }
    .filter-btn:hover { border-color: var(--blue-light); color: var(--text-dark); }
    .filter-btn.active { background: var(--blue); color: var(--white); border-color: var(--blue); box-shadow: 0 4px 12px var(--blue-glow); }
    
    .admin-gallery-thumb { position: relative; }
    .album-count-badge { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; z-index: 10; display: flex; align-items: center; gap: 6px; }
    .multi-preview-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
    .multi-preview-container img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; }

    /* Manage Photos Modal Specific Styles */
    .manage-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid var(--border-light); }
    .manage-photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; max-height: 50vh; overflow-y: auto; padding-right: 8px; }
    .manage-photo-card { position: relative; border-radius: 8px; overflow: hidden; border: 2px solid transparent; transition: border 0.2s; }
    .manage-photo-card img { width: 100%; height: 130px; object-fit: cover; display: block; }
    .photo-checkbox { position: absolute; top: 8px; left: 8px; width: 20px; height: 20px; cursor: pointer; z-index: 2; transform: scale(1.2); }
    .manage-photo-card.checked { border-color: var(--red); }
    .manage-photo-card::after { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.2); pointer-events: none; opacity: 0; transition: opacity 0.2s; }
    .manage-photo-card.checked::after { opacity: 1; background: rgba(224, 80, 80, 0.2); }
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
          <h1 class="page-title">Monthly Album Management</h1>
          <p class="page-subtitle">Group photos by month for the public barangay website gallery.</p>
        </div>
        <button class="btn-primary" onclick="openGalleryModal('add')">
          <i class="fa-solid fa-folder-plus"></i> Create New Album
        </button>
      </div>

      <div class="gallery-filter-bar">
        <button class="filter-btn active" data-filter="all">All Albums</button>
        <button class="filter-btn" data-filter="active">Active</button>
        <button class="filter-btn" data-filter="inactive">Inactive</button>
      </div>

      <div class="admin-gallery-grid">
        <?php if (empty($galleryAlbums)): ?>
            <p style="color: var(--text-muted); grid-column: 1 / -1; text-align: center; padding: 40px 0;">No albums found in the gallery.</p>
        <?php else: ?>
            <?php foreach ($galleryAlbums as $album): 
                $statusLabel = ucfirst($album['status']); 
                $coverPath = "../" . htmlspecialchars($album['cover_photo']); 
                $displayMonth = date('F Y', strtotime($album['album_month'] . '-01'));
                
                // Safely pass photo array to JS
                $photosJson = htmlspecialchars(json_encode($album['photos']), ENT_QUOTES, 'UTF-8');
            ?>
              <div class="admin-gallery-card" data-status="<?= htmlspecialchars($album['status']) ?>">
                <div class="admin-gallery-thumb">
                 <img src="<?= $coverPath ?>" alt="Album Cover" onerror="this.src='<?php echo get_fresh_asset('Images/BARANGAY_BG.jpg'); ?>'">
                  <div class="album-count-badge"><i class="fa-solid fa-images"></i> <?= $album['photo_count'] ?> Photos</div>
                  <div class="admin-gallery-status <?= $album['status'] === 'active' ? 'status-active' : 'status-hidden' ?>">
                    <?= $statusLabel ?>
                  </div>
                </div>
                <div class="admin-gallery-info">
                  <h3 class="admin-gallery-caption"><?= htmlspecialchars($album['title']) ?></h3>
                  <p style="font-size: 0.8rem; color: gray; margin-top: 4px; font-weight: 600; text-transform: uppercase;"><?= $displayMonth ?></p>
                </div>
                
                <div class="admin-gallery-actions" style="display:flex; gap:6px; flex-wrap:wrap; margin-top: 10px;">
                  <button id="manage-btn-<?= $album['album_month'] ?>" class="btn-ghost btn-sm" style="flex: 1;" onclick="openManagePhotosModal('<?= $album['album_month'] ?>', '<?= htmlspecialchars(addslashes($album['title'])) ?>', '<?= $album['status'] ?>', '<?= $photosJson ?>')">
                      <i class="fa-solid fa-table-cells-large"></i> Manage Photos
                  </button>
                  
                  <button class="btn-ghost btn-sm" onclick="openGalleryModal('edit', '<?= $album['album_month'] ?>', '<?= htmlspecialchars(addslashes($album['title'])) ?>', '<?= htmlspecialchars($album['status']) ?>')">
                    <i class="fa-solid fa-pen"></i> Edit Info
                  </button>
                  
                  <button class="btn-act btn-act--reject" title="Delete Album" onclick="deleteAlbum('<?= $album['album_month'] ?>')">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            <?php endforeach; ?>
        <?php endif; ?>
      </div>

    </div>
  </main>
</div>

<div class="modal-overlay" id="modalGallery" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title" id="titleGallery"><i class="fa-solid fa-images"></i> <span>Create Album</span></h2>
        <p class="modal-sub">Set up a new album month.</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalGallery')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <form id="formGallery" enctype="multipart/form-data">
        <input type="hidden" id="actionType" name="action" value="add">
        
        <div class="form-grid">
          <div class="form-group form-group--full">
            <label class="form-label" for="galMonth">Album Month <span class="req">*</span></label>
            <input type="month" id="galMonth" name="album_month" class="form-input" required>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="galCaption">Album Title <span class="req">*</span></label>
            <input type="text" id="galCaption" name="caption" class="form-input" placeholder="e.g. Barangay Activities" required>
          </div>
          <div class="form-group form-group--full">
            <label class="form-label" for="galStatus">Visibility Status</label>
            <select id="galStatus" name="status" class="form-input">
              <option value="active">Active (Visible to public)</option>
              <option value="inactive">Inactive (Hidden/Draft)</option>
            </select>
          </div>
          <div class="form-group form-group--full" id="uploadPhotosGroup">
            <label class="form-label">Upload Initial Photos (Select Multiple)</label>
            <div class="image-preview-container" style="padding: 20px; text-align: center; border: 2px dashed #ccc; cursor: pointer; border-radius: 8px;" onclick="document.getElementById('galImages').click()">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size: 2rem; color: #aaa; margin-bottom: 8px;"></i>
              <p style="color: #666; font-size: 0.9rem;">Click to browse images</p>
            </div>
            <input type="file" id="galImages" name="gallery_images[]" accept="image/*" multiple class="hidden-input" onchange="previewMultipleImages(event)" style="display:none;">
            <div class="multi-preview-container" id="multiPreviewContainer"></div>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalGallery')">Cancel</button>
      <button class="btn-primary" onclick="submitGalleryForm()">
        <i class="fa-solid fa-floppy-disk"></i> Save Info
      </button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalManagePhotos" role="dialog" aria-modal="true">
  <div class="modal" style="max-width: 800px; width: 90%;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-table-cells-large"></i> Manage Photos: <span id="manageAlbumTitle"></span></h2>
        <p class="modal-sub">Month: <strong id="manageAlbumMonth"></strong></p>
      </div>
      <button class="modal-close" onclick="closeModal('modalManagePhotos')" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    
    <div class="modal-body">
<div class="manage-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px solid var(--border-light); flex-wrap: wrap; gap: 16px;">
        
        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="selectAllPhotos" onchange="toggleSelectAllPhotos(this)" style="width: 18px; height: 18px; cursor: pointer; margin: 0;">
                <label for="selectAllPhotos" style="font-weight: 600; cursor: pointer; margin: 0; white-space: nowrap; color: var(--text-dark);">Select All</label>
            </div>
            
            <button type="button" onclick="deleteSelectedPhotos()" style="background-color: #e05050; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; font-family: inherit; white-space: nowrap; transition: 0.2s opacity;">
                <i class="fa-solid fa-trash"></i> Delete Selected
            </button>
        </div>
        
        <div>
            <button type="button" class="btn-primary btn-sm" onclick="document.getElementById('addExtraPhotosInput').click()" style="white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px;">
                <i class="fa-solid fa-plus"></i> Add More Photos
            </button>
            <form id="addExtraPhotosForm" style="display:none;" enctype="multipart/form-data">
                <input type="hidden" id="addExtraMonth" name="album_month">
                <input type="hidden" id="addExtraTitle" name="caption">
                <input type="hidden" id="addExtraStatus" name="status">
                <input type="hidden" name="action" value="add">
                <input type="file" id="addExtraPhotosInput" name="gallery_images[]" multiple accept="image/*" onchange="submitExtraPhotos()">
            </form>
        </div>
        
      </div>

      <div class="manage-photo-grid" id="managePhotoGrid">
          </div>

    </div>
  </div>
</div>

<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_dashboard.js'); ?>"></script>
<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_gallery.js'); ?>"></script>

<script>
// Filter Script
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.admin-gallery-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const filterValue = e.target.getAttribute('data-filter');
            cards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-status') === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});

// ── AUTO-REOPEN MANAGE MODAL SCRIPT ──
document.addEventListener('DOMContentLoaded', () => {
    const reopenMonth = sessionStorage.getItem('reopenAlbumMonth');
    if (reopenMonth) {
        // Clear the memory so it doesn't get stuck in a loop
        sessionStorage.removeItem('reopenAlbumMonth');
        
        // Find the exact button for the album we were editing
        const btnToClick = document.getElementById('manage-btn-' + reopenMonth);
        if (btnToClick) {
            // A tiny delay ensures the photos are fully loaded into the DOM first
            setTimeout(() => { btnToClick.click(); }, 150);
        }
    }
});
</script>

</body>
</html>