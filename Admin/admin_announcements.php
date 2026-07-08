<?php

require_once 'admin_auth.php';
require_once '../Connections/db_connect.php';
require_once '../Functions/cache_buster.php';


// 🚨 2. PAGE LEVEL SECURITY CHECK 🚨
if (!hasAccess('Access Announcement - Admin')) {
    header("Location: no_access.php");
    exit();
}




// 1. Require the Admin security bouncer (This automatically starts the session and checks access!)


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

$admin_name     = isset($_SESSION['admin_name'])     ? $_SESSION['admin_name']     : 'Administrator';
$admin_initials = isset($_SESSION['admin_initials']) ? $_SESSION['admin_initials'] : 'AD';

try {
    $totalPosts = $pdo->query("SELECT COUNT(*) FROM news_announcements")->fetchColumn();
    $activePosts = $pdo->query("SELECT COUNT(*) FROM news_announcements WHERE status = 'Active'")->fetchColumn();
    $draftPosts = $pdo->query("SELECT COUNT(*) FROM news_announcements WHERE status = 'Archived'")->fetchColumn();
} catch (PDOException $e) {
    die("Database Error: " . $e->getMessage());
}

$limit = 5; 
$page = isset($_GET['page']) && is_numeric($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) $page = 1;
$offset = ($page - 1) * $limit;
$totalPages = ceil($totalPosts / $limit);

$stmt = $pdo->prepare("SELECT * FROM news_announcements ORDER BY publish_date DESC LIMIT :limit OFFSET :offset");
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();
$announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Announcements — Barangay 101</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_dashboard.css'); ?>" />
  <link rel="stylesheet" href="<?php echo get_fresh_asset('CSS/Admin_css/admin_announcements.css'); ?>" />
</head>
<body>
<div class="dashboard-wrapper">

  <?php include 'sidebar.php'; ?>

  <main class="main-content">
    
    <?php include 'topbar.php'; ?>

    <div class="content-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Announcements & Advisories</h1>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn-primary" style="background: var(--green); border-color: var(--green);" onclick="openBroadcastModal()"><i class="fa-solid fa-comment-sms"></i> Broadcast SMS</button>
          <button class="btn-primary" onclick="openModal('modalAnnouncement')"><i class="fa-solid fa-pen-nib"></i> Create Post</button>
        </div>
      </div>

      <div class="cards-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
        <div class="stat-card" style="padding: 16px;">
          <div class="card-info">
            <h3>Total Posts</h3><div class="card-value"><?= number_format($totalPosts) ?></div>
          </div>
          <div class="card-icon card-icon--blue"><i class="fa-solid fa-newspaper"></i></div>
        </div>
        <div class="stat-card" style="padding: 16px;">
          <div class="card-info">
            <h3>Active on Site</h3><div class="card-value" style="color: var(--green);"><?= number_format($activePosts) ?></div>
          </div>
          <div class="card-icon card-icon--teal"><i class="fa-solid fa-rss"></i></div>
        </div>
        <div class="stat-card" style="padding: 16px;">
          <div class="card-info">
            <h3>Archived / Drafts</h3><div class="card-value" style="color: var(--text-muted);"><?= number_format($draftPosts) ?></div>
          </div>
          <div class="card-icon" style="background: var(--border-light); color: var(--text-mid);"><i class="fa-solid fa-file-pen"></i></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header" style="flex-wrap: wrap; gap: 16px;">
          <div><p class="panel-title">Post Manager</p></div>
          <div class="panel-header-actions">
            <select class="filter-select" id="filterCategory">
              <option value="all">All Categories</option>
              <option value="Official Announcement">Official Announcement</option>
              <option value="Health Advisory">Health Advisory</option>
              <option value="Education">Education</option>
              <option value="Infrastructure Update">Infrastructure Update</option>
              <option value="Safety & Security">Safety & Security</option>
            </select>
            <select class="filter-select" id="filterStatus">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <div class="search-mini ann-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input type="text" id="annSearch" placeholder="Search title...">
            </div>
          </div>
        </div>
        
        <div class="table-wrap">
          <table class="data-table ann-table" id="announcementsTable">
            <thead>
              <tr>
                <th style="width: 35%;">Announcement Details</th>
                <th>Category</th>
                <th>Status</th>
                <th>Event Date</th> 
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($announcements)): ?>
                  <tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">No announcements found.</td></tr>
              <?php else: ?>
                  <?php foreach ($announcements as $row): 
                      $isDraft = ($row['status'] === 'Archived');
                      $iconClass = 'icon--normal';
                      if ($row['icon'] == '🚨') $iconClass = 'icon--urgent';
                      if ($row['icon'] == '🏥') $iconClass = 'icon--important';
                      if ($isDraft) $iconClass = 'icon--draft';
                  ?>
                  <tr id="annRow_<?= htmlspecialchars($row['id']) ?>" class="table-row-item">
                    <td>
                      <div class="ann-cell">
                        <div class="ann-icon <?= $iconClass ?>"><?= htmlspecialchars($row['icon']) ?></div>
                        <div class="ann-info">
                          <div class="ann-title" <?= $isDraft ? 'style="color: var(--text-mid);"' : '' ?>><?= htmlspecialchars($row['title']) ?></div>
                          <div class="ann-snippet" style="font-size: 0.7rem; color: #888;">Posted: <?= date('M d, Y', strtotime($row['publish_date'])) ?></div>
                        </div>
                      </div>
                    </td>
                    <td class="td-category"><span class="badge" style="background: var(--bg); color: var(--text-mid); border: 1px solid currentColor;"><?= htmlspecialchars($row['type']) ?></span></td>
                    <td class="td-status">
                        <?php if ($isDraft): ?><span class="stat-dot dot-draft"></span> Archived
                        <?php else: ?><span class="stat-dot dot-active"></span> Active <?php endif; ?>
                    </td>
                    <td class="td-event-date">
                        <?php if(!empty($row['event_date']) && $row['event_date'] != '0000-00-00'): ?>
                            <div style="font-size: 0.8rem; color: var(--purple); font-weight: 600;"><i class="fa-regular fa-calendar-check"></i> <?= date('M d, Y', strtotime($row['event_date'])) ?></div>
                        <?php else: ?>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">No Date Set</div>
                        <?php endif; ?>
                    </td>
                    <td>
                      <div class="action-group" id="actions_<?= $row['id'] ?>">
                        <button class="btn-act btn-act--view" title="View Preview" onclick="openViewModal(<?= $row['id'] ?>)"><i class="fa-solid fa-eye"></i></button>
                        <button class="btn-act btn-act--edit" title="Edit Post" onclick="openEditModal(<?= $row['id'] ?>)"><i class="fa-solid fa-pen"></i></button>
                        
                        <?php if ($isDraft): ?>
                          <button class="btn-act" style="background:rgba(16,185,129,0.1);color:var(--green);" title="Restore to Active" onclick="toggleArchiveStatus(<?= $row['id'] ?>, 'Active')"><i class="fa-solid fa-rotate-left"></i></button>
                        <?php else: ?>
                          <button class="btn-act btn-act--delete" title="Archive Post" onclick="toggleArchiveStatus(<?= $row['id'] ?>, 'Archived')"><i class="fa-solid fa-box-archive"></i></button>
                        <?php endif; ?>
                      </div>
                    </td>
                  </tr>
                  <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
            <div class="page-info">Showing page <strong><?= $page ?></strong> of <strong><?= max(1, $totalPages) ?></strong></div>
            <div class="page-controls">
                <?php if ($page > 1): ?><a href="?page=<?= $page - 1 ?>" class="page-btn"><i class="fa-solid fa-chevron-left"></i></a>
                <?php else: ?><button class="page-btn" disabled><i class="fa-solid fa-chevron-left"></i></button><?php endif; ?>
                <button class="page-btn active"><?= $page ?></button>
                <?php if ($page < $totalPages): ?><a href="?page=<?= $page + 1 ?>" class="page-btn"><i class="fa-solid fa-chevron-right"></i></a>
                <?php else: ?><button class="page-btn" disabled><i class="fa-solid fa-chevron-right"></i></button><?php endif; ?>
            </div>
        </div>

      </div>
    </div>
  </main>
</div>

<div class="modal-overlay" id="modalAnnouncement" role="dialog" aria-modal="true">
  <div class="modal" style="max-width: 900px; width: 95%;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-pen-nib"></i> Create Announcement</h2>
        <p class="modal-sub">Draft a new post for the barangay website</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalAnnouncement')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <form id="createAnnouncementForm" enctype="multipart/form-data">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
            <div style="display: flex; flex-direction: column; gap: 16px;">
                
                <div class="form-group form-group--full">
                  <label class="form-label" for="annTitle">Post Title <span class="req">*</span></label>
                  <input type="text" id="annTitle" name="title" class="form-input" required>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div class="form-group">
                      <label class="form-label" for="annCategory">Category</label>
                      <select id="annCategory" name="category" class="form-input">
                        <option>Official Announcement</option>
                        <option>Health Advisory</option>
                        <option>Education</option>
                        <option>Infrastructure Update</option>
                        <option>Safety & Security</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label" for="annPublishOption">Status</label>
                      <select id="annPublishOption" name="publish_option" class="form-input">
                        <option value="Publish Now">Publish Now (Active)</option>
                        <option value="Save as Draft">Save as Draft (Archived)</option>
                      </select>
                    </div>
                </div>

                <div class="form-group form-group--full">
                  <label class="form-label" for="annEventDate">Date of Event (Optional)</label>
                  <input type="date" id="annEventDate" name="event_date" class="form-input">
                </div>

                <div class="form-group form-group--full">
                  <label class="form-label" for="annContent">Post Content <span class="req">*</span></label>
                  <textarea id="annContent" name="content" class="form-input form-textarea" rows="4" required></textarea>
                </div>

                <div class="form-group form-group--full" style="display:flex; align-items:center; gap:8px; background:var(--bg); padding:12px; border-radius:8px;">
                  <input type="checkbox" id="annFeatured" name="is_featured" style="width:18px;height:18px;cursor:pointer;">
                  <label class="form-label" for="annFeatured" style="margin-bottom:0;cursor:pointer;">Feature on Homepage Landing Page</label>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; justify-content: flex-start; align-items: center; background: var(--bg); padding: 24px; border-radius: 8px; border: 1px dashed var(--border-light);">
                <div style="text-align: center; margin-bottom: 16px;">
                    <i class="fa-solid fa-image" style="font-size: 3rem; color: var(--blue); margin-bottom: 8px;"></i>
                    <h3 style="font-size: 1rem; color: var(--text-dark);">Upload Featured Image</h3>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">Max file size: 20MB. Accepts JPG, PNG.</p>
                </div>
                <input type="file" id="annImage" name="image" class="form-input" accept="image/*" style="width: 100%;">
            </div>
          </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalAnnouncement')">Cancel</button>
      <button class="btn-primary" onclick="submitAnnouncement()"><i class="fa-solid fa-paper-plane"></i> Publish Post</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalEditAnnouncement" role="dialog" aria-modal="true">
  <div class="modal" style="max-width: 900px; width: 95%;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-pen-to-square"></i> Edit Announcement</h2>
        <p class="modal-sub">Update live post details</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalEditAnnouncement')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      <form id="editAnnouncementForm">
        <input type="hidden" id="editId" name="id"> 
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
            
          <div style="display: flex; flex-direction: column; gap: 16px;">
              <div class="form-group form-group--full">
                <label class="form-label">Post Title <span class="req">*</span></label>
                <input type="text" id="editTitle" name="title" class="form-input" required>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div class="form-group">
                    <label class="form-label">Category</label>
                    <select class="form-input" id="editCategory" name="category">
                        <option>Official Announcement</option>
                        <option>Health Advisory</option>
                        <option>Education</option>
                        <option>Infrastructure Update</option>
                        <option>Safety & Security</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-input" id="editStatus" name="status">
                      <option value="Active">Active</option>
                      <option value="Archived">Archived (Draft)</option>
                    </select>
                  </div>
              </div>

              <div class="form-group form-group--full">
                <label class="form-label" for="editEventDate">Date of Event (Optional)</label>
                <input type="date" id="editEventDate" name="event_date" class="form-input">
              </div>

              <div class="form-group form-group--full">
                <label class="form-label">Post Content <span class="req">*</span></label>
                <textarea id="editContent" name="content" class="form-input form-textarea" rows="4" required></textarea>
              </div>

              <div class="form-group form-group--full" style="display:flex; align-items:center; gap:8px; background:var(--bg); padding:12px; border-radius:8px;">
                <input type="checkbox" id="editFeatured" name="is_featured" style="width:18px;height:18px;cursor:pointer;">
                <label class="form-label" for="editFeatured" style="margin-bottom:0;cursor:pointer;">Feature on Homepage Landing Page</label>
              </div>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; background: #fff; padding: 16px; border-radius: 8px; border: 1px solid var(--border-light);">
              <label class="form-label" style="align-self: flex-start;">Current Image</label>
              <img id="editImagePreview" src="" alt="Featured Image" style="width: 100%; height: 250px; border-radius: 8px; margin-bottom: 16px; object-fit: cover; border: 1px solid var(--border-light); background: #eee;">
              <div style="width: 100%; border-top: 1px dashed var(--border-light); padding-top: 16px;">
                  <label class="form-label" for="editImage">Change Image (Max 20MB)</label>
                  <input type="file" id="editImage" name="image" class="form-input" accept="image/*" style="width: 100%;">
              </div>
          </div>

        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalEditAnnouncement')">Cancel</button>
      <button class="btn-primary" onclick="submitEditAnnouncement()"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalViewAnnouncement" role="dialog" aria-modal="true">
  <div class="modal">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-desktop"></i> Website Preview</h2>
      </div>
      <button class="modal-close" onclick="closeModal('modalViewAnnouncement')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body" style="background: var(--bg); padding: 24px;">
      <div style="background: #fff; padding: 24px; border-radius: var(--radius-md); box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-left: 4px solid var(--gold);">
        <img id="viewImagePreview" src="" style="width:100%; height:150px; object-fit:cover; border-radius:4px; margin-bottom:12px; display:none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span class="badge badge--processing" id="viewCategory">Category</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);"><i class="fa-regular fa-calendar-check"></i> Event Date: <strong id="viewDate" style="color:var(--text-dark);">Date</strong></span>
        </div>
        <h3 id="viewTitle" style="font-size: 1.2rem; color: var(--text-dark); margin-bottom: 12px; font-weight: 800;">Title</h3>
        <p id="viewContent" style="font-size: 0.85rem; color: var(--text-mid); line-height: 1.6; white-space: pre-wrap;"></p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalViewAnnouncement')">Close</button>
      <button class="btn-primary" id="viewEditBtn"><i class="fa-solid fa-pen"></i> Edit Post</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modalBroadcastSms" role="dialog" aria-modal="true">
  <div class="modal" style="max-width: 650px; width: 95%;">
    <div class="modal-header">
      <div>
        <h2 class="modal-title"><i class="fa-solid fa-tower-broadcast"></i> Broadcast SMS</h2>
        <p class="modal-sub">Send announcements directly to residents' phones</p>
      </div>
      <button class="modal-close" onclick="closeModal('modalBroadcastSms')"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="modal-body">
      
      <div class="form-group">
        <label class="form-label">Select Target Audience</label>
        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
            <label class="radio-label"><input type="radio" name="smsTarget" value="group" checked onchange="toggleSmsMode()"> Target by Sector</label>
            <label class="radio-label"><input type="radio" name="smsTarget" value="custom" onchange="toggleSmsMode()"> Custom Selection</label>
        </div>
      </div>

      <div id="smsGroupSection" style="background: var(--bg); padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border-light);">
        <label class="form-label">Select Sector</label>
        <div class="radio-group-cards">
            <label><input type="radio" name="sectorGroup" value="all" checked onchange="fetchGroupCount()"> All Residents</label>
            <label><input type="radio" name="sectorGroup" value="senior" onchange="fetchGroupCount()"> Senior Citizens</label>
            <label><input type="radio" name="sectorGroup" value="pwd" onchange="fetchGroupCount()"> PWDs</label>
            <label><input type="radio" name="sectorGroup" value="solo_parent" onchange="fetchGroupCount()"> Solo Parents</label>
        </div>
        <p style="margin-top: 12px; font-size: 0.85rem; color: var(--blue);"><i class="fa-solid fa-users"></i> Estimated Recipients: <strong id="smsRecipientCount">Loading...</strong></p>
        <input type="hidden" id="smsBulkNumbers" value="">
      </div>

<div id="smsCustomSection" style="display: none; background: var(--bg); padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border-light);">
        <div class="form-group">
            <label class="form-label">Search Resident</label>
            <input type="text" id="smsSearchResident" class="form-input" placeholder="Search by name or number..." onkeyup="filterCustomSmsTable()">
        </div>
        
        <div style="max-height: 250px; overflow-y: auto; background: #fff; border: 1px solid var(--border-light); border-radius: 4px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;" id="smsCustomTable">
                <thead style="background: var(--bg); position: sticky; top: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); z-index: 10;">
                    <tr>
                        <th style="padding: 10px; border-bottom: 1px solid var(--border-light); width: 40px; text-align: center;">
                            <input type="checkbox" id="smsSelectAll" onchange="toggleAllSmsCheckboxes(this)" style="cursor: pointer;">
                        </th>
                        <th style="padding: 10px; border-bottom: 1px solid var(--border-light); font-size: 0.8rem; color: var(--text-mid);">Resident Name</th>
                        <th style="padding: 10px; border-bottom: 1px solid var(--border-light); font-size: 0.8rem; color: var(--text-mid);">Contact Number</th>
                    </tr>
                </thead>
                <tbody id="smsCustomListBody">
                    <tr><td colspan="3" style="text-align:center; padding: 20px; font-size: 0.85rem; color: var(--text-muted);">Loading residents...</td></tr>
                </tbody>
            </table>
        </div>
      </div>

      <div class="form-group form-group--full">
        <label class="form-label">Message <span class="req">*</span></label>
        <textarea id="smsBroadcastMessage" class="form-input form-textarea" rows="4" placeholder="Write your announcement here..."></textarea>
        <div style="font-size: 0.75rem; color: var(--text-muted); text-align: right; margin-top: 4px;">Keep it concise. Standard SMS is 160 characters.</div>
      </div>

    </div>
    <div class="modal-footer">
      <button class="btn-ghost" onclick="closeModal('modalBroadcastSms')">Cancel</button>
      <button class="btn-primary" id="btnSendBroadcast" onclick="sendBroadcastSms()"><i class="fa-solid fa-paper-plane"></i> Send Broadcast</button>
    </div>
  </div>
</div>
                  
<script src="<?php echo get_fresh_asset('JS/Admin_js/admin_announcements.js'); ?>"></script>
</body>
</html>