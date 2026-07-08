<?php
// Dynamically set the breadcrumb title based on the current page
$current_page = basename($_SERVER['PHP_SELF']);
$page_title = 'Dashboard'; // Default

switch ($current_page) {
    case 'admin_resident.php':       $page_title = 'Resident Management'; break;
    case 'admin_certificates.php':   $page_title = 'Certificates'; break;
    case 'admin_blotter.php':        $page_title = 'Blotter Records'; break;
    case 'admin_staff.php':          $page_title = 'Staff Management'; break;
    case 'admin_gallery.php':        $page_title = 'Barangay Gallery'; break;
    case 'admin_staff_pictures.php': $page_title = 'Admin and Staff Photos'; break;
    case 'admin_reports.php':        $page_title = 'Reports & Analytics'; break;
    case 'admin_contact_us.php':     $page_title = 'Contact Messages'; break;
    case 'admin_announcements.php':  $page_title = 'Announcements'; break;
}
?>

<style>
/* ========================================
   ACTIVITY LOG MODAL STYLES (TABLE VIEW)
   ======================================== */
.activity-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.activity-modal-overlay.open {
    opacity: 1;
    visibility: visible;
}

.activity-modal-box {
    background: #ffffff;
    width: 100%;
    max-width: 750px;
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    flex-direction: column;
    max-height: 85vh;
}

.activity-modal-overlay.open .activity-modal-box {
    transform: translateY(0);
}

.activity-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
}

.activity-modal-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: 8px;
}

.activity-modal-header h2 i {
    color: #3b82f6;
}

.btn-close-modal {
    background: #f1f5f9;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-close-modal:hover {
    background: #fee2e2;
    color: #ef4444;
}

/* --- Toolbar (Search) --- */
.activity-toolbar {
    padding: 16px 24px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    background: #f8fafc;
}

.activity-search {
    padding: 8px 14px 8px 32px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.85rem;
    width: 260px;
    outline: none;
    transition: border-color 0.2s;
    background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>') no-repeat 10px center;
}

.activity-search:focus {
    border-color: #3b82f6;
}

.activity-modal-body {
    padding: 0;
    overflow-y: auto;
    flex: 1;
}

/* --- Table Styles --- */
.activity-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    text-align: left;
}

.activity-table th {
    background: #ffffff;
    color: #64748b;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 14px 24px;
    border-bottom: 1px solid #cbd5e1;
    position: sticky;
    top: 0;
    z-index: 10;
}

.activity-table td {
    padding: 16px 24px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: middle;
    line-height: 1.4;
}

.activity-table tbody tr:hover {
    background: #f8fafc;
}

.activity-table td strong {
    color: #0f172a;
    font-weight: 600;
}

/* Empty State */
.activity-empty {
    text-align: center;
    padding: 40px 20px;
    color: #64748b;
    font-size: 0.9rem;
}

/* Badges for Staff Names */
.staff-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
}

.badge-admin { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.badge-staff { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }

/* Timestamp styling */
.time-col {
    color: #64748b;
    font-size: 0.8rem;
    white-space: nowrap;
}

/* --- Pagination Styles --- */
.activity-pagination {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
}

.activity-page-info {
    font-size: 0.85rem;
    color: #64748b;
}

.activity-page-controls {
    display: flex;
    gap: 8px;
}

.btn-page {
    padding: 6px 12px;
    border: 1px solid #cbd5e1;
    background: #fff;
    color: #334155;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #94a3b8;
}

.btn-page:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>

<header class="topbar">
  <div class="topbar-left">
    <button class="btn-sidebar-toggle" id="btnSidebarToggle" aria-label="Toggle sidebar">
      <i class="fa-solid fa-bars"></i>
    </button>
    <div class="breadcrumb">
      <span class="breadcrumb-root"><i class="fa-solid fa-shield-halved"></i> Admin</span>
      <span class="breadcrumb-sep"><i class="fa-solid fa-chevron-right"></i></span>
      <span class="breadcrumb-current" id="breadcrumbCurrent"><?= $page_title ?></span>
    </div>
  </div>
  <div class="topbar-right">
    <div class="topbar-date" id="topbarDate"></div>
    
    <div class="notif-wrapper">
      <button class="icon-btn" id="notifBtn" aria-label="Activity Logs">
        <i class="fa-regular fa-bell"></i>
        <span class="notif-dot" id="notifDot" style="display:block;"></span> 
      </button>
    </div>
  </div>
</header>

<div id="activityLogModal" class="activity-modal-overlay">
    <div class="activity-modal-box" onclick="event.stopPropagation()">
        <div class="activity-modal-header">
            <h2><i class="fa-solid fa-clipboard-list"></i> Activity Logs</h2>
            <button class="btn-close-modal" id="closeActivityBtn">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        
        <div class="activity-toolbar">
            <input type="text" id="activitySearch" class="activity-search" placeholder="Search logs...">
        </div>

        <div class="activity-modal-body">
            <table class="activity-table">
                <thead>
                    <tr>
                        <th width="20%">Staff Name</th>
                        <th width="55%">Action</th>
                        <th width="25%">Timestamp</th>
                    </tr>
                </thead>
                <tbody id="activityTableBody">
                    </tbody>
            </table>
        </div>

        <div class="activity-pagination">
            <span class="activity-page-info" id="activityPageInfo">Page 1 of 1</span>
            <div class="activity-page-controls">
                <button class="btn-page" id="activityPrevBtn" disabled>Prev</button>
                <button class="btn-page" id="activityNextBtn" disabled>Next</button>
            </div>
        </div>
    </div>
</div>

<script>
  // --- TIME UNIFICATION SCRIPT ---
  function updateUnifiedTime() {
    const now = new Date();
    
    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const timeString = `${hours}:${minutes} ${ampm}`;
    
    const dateEl = document.getElementById('topbarDate');
    if (dateEl) {
        dateEl.innerHTML = `${dateString} &bull; ${timeString}`;
    }
  }
  
  updateUnifiedTime();
  setInterval(updateUnifiedTime, 60000);

  // --- ACTIVITY MODAL LOGIC (Live DB Fetching) ---
  const notifBtn = document.getElementById('notifBtn');
  const activityModal = document.getElementById('activityLogModal');
  const closeActivityBtn = document.getElementById('closeActivityBtn');
  const notifDot = document.getElementById('notifDot');

  const searchInput = document.getElementById('activitySearch');
  const tableBody = document.getElementById('activityTableBody');
  const pageInfo = document.getElementById('activityPageInfo');
  const prevBtn = document.getElementById('activityPrevBtn');
  const nextBtn = document.getElementById('activityNextBtn');

  // State variables
  let currentLogPage = 1;
  const logsPerPage = 5;
  let currentSearchQuery = '';
  let searchTimeout;

  // Fetch logic connects to the API provided previously
  function fetchActivityLogs() {
      // Adjust path if needed
      const url = `../API/Admin/admin_fetch_activity_logs_api.php?page=${currentLogPage}&limit=${logsPerPage}&search=${encodeURIComponent(currentSearchQuery)}`;

      tableBody.innerHTML = `<tr><td colspan="3" class="activity-empty"><i class="fa-solid fa-spinner fa-spin"></i> Loading logs...</td></tr>`;

      fetch(url)
          .then(res => res.json())
          .then(response => {
              if (response.success) {
                  renderActivityTable(response.data, response.pagination);
              } else {
                  tableBody.innerHTML = `<tr><td colspan="3" class="activity-empty" style="color: red;">Failed to load data: ${response.message || 'Unknown error'}</td></tr>`;
              }
          })
          .catch(err => {
              console.error("Error fetching logs:", err);
              tableBody.innerHTML = `<tr><td colspan="3" class="activity-empty" style="color: red;">Failed to connect to server. Check console.</td></tr>`;
          });
  }

  // Renders the data to the DOM
  function renderActivityTable(logs, pagination) {
      tableBody.innerHTML = '';

      if (!logs || logs.length === 0) {
          tableBody.innerHTML = `<tr><td colspan="3" class="activity-empty">No matching logs found.</td></tr>`;
      } else {
          logs.forEach(log => {
              const iconClass = log.role === 'admin' ? 'fa-user-shield' : 'fa-user';
              const badgeClass = log.role === 'admin' ? 'badge-admin' : 'badge-staff';
              
              const tr = document.createElement('tr');
              tr.innerHTML = `
                  <td><span class="staff-badge ${badgeClass}"><i class="fa-solid ${iconClass}"></i> ${log.staff_name}</span></td>
                  <td>${log.action}</td>
                  <td class="time-col">${log.formatted_time || log.timestamp}</td>
              `;
              tableBody.appendChild(tr);
          });
      }

      // Update Pagination Controls
      pageInfo.textContent = `Page ${pagination.current_page} of ${pagination.total_pages || 1}`;
      prevBtn.disabled = pagination.current_page <= 1;
      nextBtn.disabled = pagination.current_page >= pagination.total_pages || pagination.total_pages === 0;
  }

  // Debounced search logic to prevent spamming the database
  if(searchInput) {
      searchInput.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          searchTimeout = setTimeout(() => {
              currentSearchQuery = e.target.value.trim();
              currentLogPage = 1; // Reset to page 1 on new search
              fetchActivityLogs();
          }, 300);
      });
  }

  // Pagination Listeners
  if(prevBtn) prevBtn.addEventListener('click', () => { currentLogPage--; fetchActivityLogs(); });
  if(nextBtn) nextBtn.addEventListener('click', () => { currentLogPage++; fetchActivityLogs(); });

  // Open Modal logic
  if (notifBtn && activityModal) {
      notifBtn.addEventListener('click', () => {
          // Reset view and fetch fresh data every time modal opens
          searchInput.value = '';
          currentSearchQuery = '';
          currentLogPage = 1;
          fetchActivityLogs();
          
          activityModal.classList.add('open');
          
          if(notifDot) notifDot.style.display = 'none';
      });
  }

  // Close Modal (via X button ONLY)
  if (closeActivityBtn) {
      closeActivityBtn.addEventListener('click', () => {
          activityModal.classList.remove('open');
      });
  }
</script>