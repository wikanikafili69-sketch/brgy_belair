/**
 * admin_dashboard.js
 * Barangay 101 — Admin Dashboard Interactivity
 * File: JS/Admin_js/admin_dashboard.js
 */

// Tracks which cert type is active ('all' by default) — global scope for modal access
let activeCertTypeFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {

  // 🔴 OLD TOPBAR DATE CODE REMOVED HERE. 
  // It is now handled universally by topbar.php

  // ═══════════════════════════════════════════════════
  // 2. AUTO-HIGHLIGHT ACTIVE SIDEBAR LINK
  // ═══════════════════════════════════════════════════
  const currentFile       = window.location.pathname.split('/').pop() || 'admin_dashboard.php';
  const breadcrumbCurrent = document.getElementById('breadcrumbCurrent');

  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentFile === href) {
      link.classList.add('active');
      const label = link.querySelector('.nav-label')?.textContent?.trim();
      if (breadcrumbCurrent && label) breadcrumbCurrent.textContent = label;
    }
  });

  if (currentFile === 'admin_dashboard.php' || currentFile === '') {
    const dashLink = document.querySelector('.nav-link[href="admin_dashboard.php"]');
    if (dashLink) {
      dashLink.classList.add('active');
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = 'Dashboard';
    }
  }


  // ═══════════════════════════════════════════════════
  // 3. SIDEBAR MOBILE TOGGLE
  // ═══════════════════════════════════════════════════
  const btnToggle = document.getElementById('btnSidebarToggle');
  const sidebar   = document.getElementById('sidebar');

  if (btnToggle && sidebar) {
    btnToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

    document.addEventListener('click', (e) => {
      if (
        window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !btnToggle.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
    });
  }


  // ═══════════════════════════════════════════════════
  // 4. NOTIFICATION DROPDOWN
  // ═══════════════════════════════════════════════════
  const notifBtn      = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const notifClear    = document.getElementById('notifClear');
  const notifDot      = document.getElementById('notifDot');

  function syncNotifDot() {
    if (!notifDot) return;
    const hasUnread = document.querySelector('.notif-item.unread') !== null;
    notifDot.style.display = hasUnread ? 'block' : 'none';
  }
  syncNotifDot();

  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
        notifDropdown.classList.remove('open');
      }
    });

    if (notifClear) {
      notifClear.addEventListener('click', () => {
        document.querySelectorAll('.notif-item.unread').forEach(i => i.classList.remove('unread'));
        syncNotifDot();
        showToast('All notifications cleared.', 'info');
      });
    }
  }


  // ═══════════════════════════════════════════════════
  // 5. STAT CARD → NAVIGATE ON CLICK
  // ═══════════════════════════════════════════════════
  document.querySelectorAll('.stat-card[data-link]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.getAttribute('data-link');
    });
  });


  // ═══════════════════════════════════════════════════
  // 6. STAT CARD COUNTER ANIMATION
  // ═══════════════════════════════════════════════════
  function animateCounter(el, target, duration) {
    const start    = performance.now();
    const startVal = 0;

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      const current  = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current.toLocaleString('en-PH');
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }


  // ═══════════════════════════════════════════════════
  // 7. CERTIFICATES TABLE LIVE SEARCH & STATUS FILTER
  // ═══════════════════════════════════════════════════
  const certSearch       = document.getElementById('certSearch');
  const certFilter       = document.getElementById('certFilter');
  const certificatesBody = document.getElementById('certificatesBody');

  window.filterCertificatesTable = function () {
    if (!certificatesBody) return;
    const query        = certSearch ? certSearch.value.toLowerCase().trim() : '';
    const statusFilter = certFilter ? certFilter.value.toLowerCase() : 'all';

    certificatesBody.querySelectorAll('tr').forEach(row => {
      const textContent = row.textContent.toLowerCase();
      const statusCell  = row.querySelectorAll('td')[3]?.textContent.toLowerCase() || '';
      const typeCell    = row.querySelectorAll('td')[1]?.textContent.trim() || '';

      const matchesSearch   = textContent.includes(query);
      const matchesStatus   = statusFilter === 'all' || statusCell.includes(statusFilter);
      const matchesCertType = activeCertTypeFilter === 'all' || typeCell === activeCertTypeFilter;

      row.style.display = (matchesSearch && matchesStatus && matchesCertType) ? '' : 'none';
    });
  };

  if (certSearch) certSearch.addEventListener('input', filterCertificatesTable);
  if (certFilter) certFilter.addEventListener('change', filterCertificatesTable);


  // ═══════════════════════════════════════════════════
  // 8. GENERATE REPORT BUTTON → OPEN MODAL
  // ═══════════════════════════════════════════════════
  const btnGenerateReport = document.getElementById('btnGenerateReport');
  if (btnGenerateReport) {
    btnGenerateReport.addEventListener('click', () => openModal('modalReport'));
  }


  // ═══════════════════════════════════════════════════
  // 9. CLOSE ALL MODALS ON ESC KEY
  // ═══════════════════════════════════════════════════
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });


  // ═══════════════════════════════════════════════════
  // 10. CLOSE MODAL ON BACKDROP CLICK
  // ═══════════════════════════════════════════════════
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  });


  // ═══════════════════════════════════════════════════
  // 11. CERT STRIP — static fallback tooltips
  // ═══════════════════════════════════════════════════
  document.querySelectorAll('.cert-strip-item').forEach(item => {
    const label = item.querySelector('.cert-strip-label')?.textContent?.trim() || '';
    item.title  = `View all ${label} certificates`;
  });


  // ═══════════════════════════════════════════════════
  // 12. FETCH ADMIN DATA FROM API
  // ═══════════════════════════════════════════════════
  async function fetchAdminData() {
    try {
      const response = await fetch('../API/Admin/get_admin_overview_api.php');
      const result   = await response.json();

      if (result.success) {
        const data = result.data;

        // Update Stat Cards
        const totalResidentsCard = document.querySelector('.stat-card:nth-child(1) .card-value');
        const pendingCertsCard   = document.querySelector('.stat-card:nth-child(2) .card-value');
        const activeBlottersCard = document.querySelector('.stat-card:nth-child(3) .card-value');

        if (totalResidentsCard) totalResidentsCard.setAttribute('data-count', data.stats.total_residents);
        if (pendingCertsCard)   pendingCertsCard.setAttribute('data-count', data.stats.pending_certs);
        if (activeBlottersCard) activeBlottersCard.setAttribute('data-count', data.stats.active_blotters);

        document.querySelectorAll('.card-value[data-count]').forEach(el => {
          const target = parseInt(el.getAttribute('data-count'), 10);
          if (!isNaN(target)) animateCounter(el, target, 1200);
        });

        // Populate all dynamic sections
        if (data.resident_stats) populateResCounts(data.resident_stats);
        populateCertificatesTable(data.recent_certificates);
        populateCertCounts(data.certificate_counts);
        populateLiveQueue(data.live_queue);
        populateStaffOnDuty(data.staff_on_duty);

      } else {
        console.error("API Error:", result.message);
        showToast("Failed to load dashboard data.", "error");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      showToast("Network error while fetching data.", "error");
    }
  }


  // ═══════════════════════════════════════════════════
  // HELPER: RESIDENTS SUMMARY BAR + OVERVIEW MODAL
  // ═══════════════════════════════════════════════════
  function populateResCounts(resData) {
    const container = document.getElementById('resCountsContainer');
    if (!container || !resData) return;

    container.innerHTML = '';

    const bar = document.createElement('div');
    bar.className = 'cert-summary-bar'; // Reusing your existing CSS class for consistency
    bar.title = 'Click to view full demographics';
    bar.innerHTML = `
      <div class="csb-left">
        <div class="csb-icon" style="background: rgba(38,181,160,0.1); color: var(--teal);">
          <i class="fa-solid fa-users"></i>
        </div>
        <div class="csb-info">
          <span class="csb-label">Residents Overview</span>
          <span class="csb-sub">Barangay Demographics</span>
        </div>
      </div>
      <div class="csb-stats">
        <div class="csb-stat">
          <span class="csb-stat-num">${resData.total_residents || 0}</span>
          <span class="csb-stat-label">Total</span>
        </div>
        <div class="csb-divider"></div>
        <div class="csb-stat">
          <span class="csb-stat-num" style="color: var(--blue);">${resData.total_voters || 0}</span>
          <span class="csb-stat-label">Voters</span>
        </div>
        <div class="csb-divider"></div>
        <div class="csb-stat">
          <span class="csb-stat-num" style="color: var(--gold);">${resData.total_senior || 0}</span>
          <span class="csb-stat-label">Seniors</span>
        </div>
      </div>
      <div class="csb-cta">
        <span>View Breakdown</span>
        <i class="fa-solid fa-chevron-right"></i>
      </div>
    `;

    bar.addEventListener('click', () => {
      populateResOverviewModal(resData);
      openModal('modalResOverview');
    });

    container.appendChild(bar);
  }

  function populateResOverviewModal(data) {
    const body = document.getElementById('resOverviewModalBody');
    if (!body) return;

    // Calculate percentages for gender
    const total = data.total_residents || 1; // Prevent division by zero
    const pctMale = Math.round((data.total_male / total) * 100);
    const pctFemale = Math.round((data.total_female / total) * 100);
    
    // Calculate percentages for voters
    const pctVoters = Math.round((data.total_voters / total) * 100);

    body.innerHTML = `
      <div class="com-totals">
        <div class="com-total-card">
          <span class="com-total-num">${data.total_residents || 0}</span>
          <span class="com-total-label">Population</span>
        </div>
        <div class="com-total-card">
          <span class="com-total-num" style="color: var(--blue);">${data.total_voters || 0}</span>
          <span class="com-total-label">Reg. Voters</span>
        </div>
        <div class="com-total-card">
          <span class="com-total-num" style="color: var(--red);">${data.total_non_voters || 0}</span>
          <span class="com-total-label">Non-Voters</span>
        </div>
        <div class="com-total-card">
          <span class="com-total-num" style="color: var(--teal);">${data.total_officials || 0}</span>
          <span class="com-total-label">Officials</span>
        </div>
      </div>

      <div class="com-grid" style="grid-template-columns: 1fr 1fr; gap: 15px;">
        
        <div class="com-card">
          <div class="com-card-top">
            <span class="com-card-name"><i class="fa-solid fa-venus-mars"></i> Gender Ratio</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 5px; font-size: 0.8rem; font-weight: 600;">
            <span style="color: var(--blue);">${pctMale}% Male (${data.total_male})</span>
            <span style="color: #ec4899;">${pctFemale}% Female (${data.total_female})</span>
          </div>
          <div class="com-bar-track" style="display:flex; height: 8px;">
            <div style="width:${pctMale}%; background: var(--blue); border-radius: 100px 0 0 100px;"></div>
            <div style="width:${pctFemale}%; background: #ec4899; border-radius: 0 100px 100px 0;"></div>
          </div>
        </div>

        <div class="com-card">
          <div class="com-card-top">
            <span class="com-card-name"><i class="fa-solid fa-check-to-slot"></i> Voter Registration</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom: 5px; font-size: 0.8rem; font-weight: 600;">
            <span style="color: var(--green);">${pctVoters}% Voters</span>
            <span style="color: var(--text-muted);">${100 - pctVoters}% Non-Voters</span>
          </div>
          <div class="com-bar-track" style="display:flex; height: 8px;">
            <div style="width:${pctVoters}%; background: var(--green); border-radius: 100px 0 0 100px;"></div>
            <div style="width:${100 - pctVoters}%; background: var(--border-light); border-radius: 0 100px 100px 0;"></div>
          </div>
        </div>

        <div class="com-card" style="grid-column: 1 / -1;">
          <div class="com-card-top" style="margin-bottom: 12px;">
            <span class="com-card-name"><i class="fa-solid fa-star"></i> Demographics & Special Sectors</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--purple); font-family: var(--font-mono);">${data.total_pwd || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">PWDs</div>
            </div>
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--teal); font-family: var(--font-mono);">${data.total_solo_parent || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Solo Parents</div>
            </div>
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--gold); font-family: var(--font-mono);">${data.total_senior || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Senior Citizens</div>
            </div>
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--blue); font-family: var(--font-mono);">${data.total_home_owner || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Home Owners</div>
            </div>
          </div>
        </div>

        <div class="com-card" style="grid-column: 1 / -1;">
          <div class="com-card-top" style="margin-bottom: 12px;">
            <span class="com-card-name"><i class="fa-solid fa-hand-holding-heart"></i> Government Beneficiaries</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: #ef4444; font-family: var(--font-mono);">${data.total_dswd || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">DSWD</div>
            </div>
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: #3b82f6; font-family: var(--font-mono);">${data.total_aics || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">AICS</div>
            </div>
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: #10b981; font-family: var(--font-mono);">${data.total_akap || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">AKAP</div>
            </div>
            <div style="background: var(--bg); padding: 10px; border-radius: var(--radius-sm); text-align: center;">
              <div style="font-size: 1.2rem; font-weight: 800; color: #f59e0b; font-family: var(--font-mono);">${data.total_tupad || 0}</div>
              <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">TUPAD</div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // ═══════════════════════════════════════════════════
  // HELPER: CERT SUMMARY BAR + OVERVIEW MODAL
  // ═══════════════════════════════════════════════════
  function populateCertCounts(countsData) {
    const container = document.getElementById('certCountsContainer');
    if (!container || !countsData) return;

    container.innerHTML = '';

    const grandTotal     = countsData.reduce((s, i) => s + i.total_count, 0);
    const grandPending   = countsData.reduce((s, i) => s + i.pending,     0);
    const grandCompleted = countsData.reduce((s, i) => s + i.completed,   0);
    const grandCancelled = countsData.reduce((s, i) => s + i.cancelled,   0);

    const bar = document.createElement('div');
    bar.className = 'cert-summary-bar';
    bar.title = 'Click to view all certificate types';
    bar.innerHTML = `
      <div class="csb-left">
        <div class="csb-icon"><i class="fa-solid fa-file-lines"></i></div>
        <div class="csb-info">
          <span class="csb-label">Certificates Overview</span>
          <span class="csb-sub">${countsData.length} types tracked</span>
        </div>
      </div>
      <div class="csb-stats">
        <div class="csb-stat">
          <span class="csb-stat-num">${grandTotal}</span>
          <span class="csb-stat-label">Total</span>
        </div>
        <div class="csb-divider"></div>
        <div class="csb-stat csb-stat--pending">
          <span class="csb-stat-num">${grandPending}</span>
          <span class="csb-stat-label">Pending</span>
        </div>
        <div class="csb-divider"></div>
        <div class="csb-stat csb-stat--done">
          <span class="csb-stat-num">${grandCompleted}</span>
          <span class="csb-stat-label">Completed</span>
        </div>
        <div class="csb-divider"></div>
        <div class="csb-stat csb-stat--cancel">
          <span class="csb-stat-num">${grandCancelled}</span>
          <span class="csb-stat-label">Cancelled</span>
        </div>
      </div>
      <div class="csb-cta">
        <span>View All</span>
        <i class="fa-solid fa-chevron-right"></i>
      </div>
    `;

    bar.addEventListener('click', () => {
      populateCertOverviewModal(countsData, grandTotal, grandPending, grandCompleted, grandCancelled);
      openModal('modalCertOverview');
    });

    container.appendChild(bar);
  }

  function populateCertOverviewModal(countsData, grandTotal, grandPending, grandCompleted, grandCancelled) {
    const body = document.getElementById('certOverviewModalBody');
    if (!body) return;

    body.innerHTML = `
      <div class="com-totals">
        <div class="com-total-card">
          <span class="com-total-num">${grandTotal}</span>
          <span class="com-total-label">Total All</span>
        </div>
        <div class="com-total-card com-total-card--pending">
          <span class="com-total-num">${grandPending}</span>
          <span class="com-total-label">Pending</span>
        </div>
        <div class="com-total-card com-total-card--done">
          <span class="com-total-num">${grandCompleted}</span>
          <span class="com-total-label">Completed</span>
        </div>
        <div class="com-total-card com-total-card--cancel">
          <span class="com-total-num">${grandCancelled}</span>
          <span class="com-total-label">Cancelled</span>
        </div>
      </div>
      <div class="com-grid">
        ${countsData.map(item => {
          const pct = grandTotal > 0 ? Math.round((item.total_count / grandTotal) * 100) : 0;
          return `
            <div class="com-card" onclick="activeCertTypeFilter='${item.certificate_type ?? item.label}'; filterCertificatesTable(); closeModal('modalCertOverview');" title="Filter table by this type">
              <div class="com-card-top">
                <span class="com-card-name">${item.certificate_type ?? item.label}</span>
                <span class="com-card-total">${item.total_count}</span>
              </div>
              <div class="com-bar-track">
                <div class="com-bar-fill" style="width:${pct}%"></div>
              </div>
              <div class="com-card-stats">
                <span class="com-pill com-pill--pending">${item.pending} Pending</span>
                <span class="com-pill com-pill--done">${item.completed} Done</span>
                <span class="com-pill com-pill--cancel">${item.cancelled} Cancelled</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <p class="com-hint"><i class="fa-solid fa-circle-info"></i> Click any card to filter the certificates table.</p>
    `;
  }


  // ═══════════════════════════════════════════════════
  // HELPER: CERTIFICATES TABLE (with Active Blotter highlighting)
  // ═══════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════
  // HELPER: CERTIFICATES TABLE (with Active Blotter & New Statuses)
  // ═══════════════════════════════════════════════════
  function populateCertificatesTable(certificates) {
    const tbody = document.getElementById('certificatesBody');
    if (!tbody || !certificates) return;

    tbody.innerHTML = '';

    if (certificates.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent certificate requests.</td></tr>';
      return;
    }

    certificates.forEach(cert => {
      const initials = cert.resident_name
        ? cert.resident_name.substring(0, 2).toUpperCase()
        : 'NA';

      // ✅ Read new 'record_status' (fallback to 'status' just in case)
      const status = (cert.record_status || cert.status || 'for approval').toLowerCase();

      let badgeClass = 'badge--pending';
      let icon       = '<i class="fa-solid fa-hourglass-half"></i>';

      // ✅ Map the new workflow statuses to the correct icons and colors
      if (status === 'completed') {
        badgeClass = 'badge--approved';
        icon       = '<i class="fa-solid fa-check-double"></i>';
      } else if (status === 'processing') {
        badgeClass = 'badge--processing';
        icon       = '<i class="fa-solid fa-gears"></i>';
      } else if (status === 'rejected' || status === 'cancelled') {
        badgeClass = 'badge--rejected';
        icon       = '<i class="fa-solid fa-circle-xmark"></i>';
      } else if (status === 'ready for pickup') {
        badgeClass = 'badge--purple'; // A nice distinct color for pickup
        icon       = '<i class="fa-solid fa-box-open"></i>';
      } else if (status === 'for approval') {
        badgeClass = 'badge--orange';
        icon       = '<i class="fa-solid fa-file-signature"></i>';
      }

      const displayStatus = status === 'processing' ? 'APPROVED' : status.toUpperCase();

      const dateFiled = cert.date_filed
        ? new Date(cert.date_filed).toLocaleDateString('en-PH', {
            year: 'numeric', month: 'short', day: 'numeric'
          })
        : '—';

      // Blotter Logic check
      const hasBlotter = cert.has_blotter == 1;
      const trClass = hasBlotter ? 'active-blotter-row' : '';
      const blotterDot = hasBlotter ? `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>` : '';

      // ✅ FIXED BUG: Redirects to the certificates page with the queue number instead of breaking!
      const clickAction = `window.location.href='admin_certificates.php?search=${cert.queue_number}'`;

      const tr = document.createElement('tr');
      tr.className = trClass;
      tr.innerHTML = `
        <td onclick="${clickAction}" style="cursor:pointer;">
          <div class="resident-cell">
            <div class="res-avatar" style="background:var(--blue);">${initials}</div>
            <div>
              <div class="res-name">${blotterDot}${cert.resident_name ?? '—'}</div>
              <div class="res-purok">${cert.queue_number ?? ''}</div>
            </div>
          </div>
        </td>
        <td onclick="${clickAction}" style="cursor:pointer;">${cert.certificate_type}</td>
        <td onclick="${clickAction}" style="cursor:pointer;" class="mono-cell">${dateFiled}</td>
        <td onclick="${clickAction}" style="cursor:pointer;"><span class="badge ${badgeClass}">${icon} ${displayStatus}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }


  // ═══════════════════════════════════════════════════
  // HELPER: LIVE QUEUE
  // ═══════════════════════════════════════════════════
  function populateLiveQueue(queueData) {
    const queueList = document.querySelector('.queue-list');
    if (!queueList || !queueData) return;

    queueList.innerHTML = '';
    if (queueData.length === 0) {
      queueList.innerHTML = '<div style="padding:1rem;text-align:center;font-size:0.9rem;color:#64748b;">No active queues.</div>';
      return;
    }

    queueData.forEach(q => {
      const isServing = q.status === 'Serving';
      
      const hasBlotter = q.has_blotter == 1;
      const blotterClass = hasBlotter ? 'active-blotter-item' : '';
      const blotterDot = hasBlotter ? `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>` : '';

      const baseClass = isServing ? 'queue-item queue-item--serving' : 'queue-item';

      const item      = document.createElement('div');
      item.className  = `${baseClass} ${blotterClass}`;
      item.innerHTML  = `
        <div class="queue-num">${q.queue_number}</div>
        <div class="queue-details">
          <span class="queue-name">${blotterDot}${q.resident_name}</span>
          <span class="queue-type">${q.service_type}</span>
        </div>
        ${isServing
          ? '<span class="badge badge--processing" style="font-size:0.6rem;padding:2px 7px;">Serving</span>'
          : '<div class="queue-status-dot waiting"></div>'}
      `;
      queueList.appendChild(item);
    });
  }


  // ═══════════════════════════════════════════════════
  // HELPER: STAFF ON DUTY
  // ═══════════════════════════════════════════════════
  function populateStaffOnDuty(staffData) {
    const staffList = document.querySelector('.staff-duty-list');
    if (!staffList || !staffData) return;

    staffList.innerHTML = '';
    if (staffData.length === 0) {
      staffList.innerHTML = '<div style="padding:1rem;text-align:center;font-size:0.9rem;color:#64748b;">No staff online.</div>';
      return;
    }

    staffData.forEach(staff => {
      const initials  = `${staff.first_name.charAt(0)}${staff.last_name.charAt(0)}`.toUpperCase();
      const row       = document.createElement('div');
      row.className   = 'staff-duty-row';
      row.innerHTML   = `
        <div class="duty-avatar" style="background:linear-gradient(135deg,#2c57e5,#4a78ff);">${initials}</div>
        <div class="duty-info">
          <span class="duty-name">${staff.first_name} ${staff.last_name}</span>
          <span class="duty-role">${staff.role}</span>
        </div>
        <span class="duty-dot duty-dot--online"></span>
      `;
      staffList.appendChild(row);
    });
  }


  // Trigger initial data fetch
  fetchAdminData();


  // ═══════════════════════════════════════════════════
  // ADD RESIDENT MODAL SUBMIT
  // ═══════════════════════════════════════════════════
  window.submitAddResident = async function () {
    const form = document.getElementById('formAddResident');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch('../API/Admin/add_resident_api.php', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.success) {
        showToast('Resident saved successfully!', 'success');
        closeModal('modalAddResident');
        form.reset();
        fetchAdminData();
      } else {
        showToast(result.message || 'Failed to save resident.', 'error');
      }
    } catch (error) {
      console.error('Error saving resident:', error);
      showToast('Network error while connecting to server.', 'error');
    }
  };

}); // END DOMContentLoaded


/* ═══════════════════════════════════════════════════
   MODAL HELPERS
═══════════════════════════════════════════════════ */

function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}


/* ═══════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
═══════════════════════════════════════════════════ */

function showToast(message, type = 'success') {
  if (!document.getElementById('toastStyles')) {
    const s   = document.createElement('style');
    s.id      = 'toastStyles';
    s.textContent = `
      @keyframes toastIn  { from { opacity:0; transform:translateX(30px); } to { opacity:1; transform:translateX(0); } }
      @keyframes toastOut { from { opacity:1; transform:translateX(0);    } to { opacity:0; transform:translateX(30px); } }
    `;
    document.head.appendChild(s);
  }

  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    Object.assign(container.style, {
      position:      'fixed',
      bottom:        '24px',
      right:         '24px',
      zIndex:        '9999',
      display:       'flex',
      flexDirection: 'column',
      gap:           '8px',
      pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }

  const palette = {
    success: { color: '#22c55e', icon: 'fa-circle-check'         },
    warning: { color: '#f59e0b', icon: 'fa-triangle-exclamation' },
    error:   { color: '#ef4444', icon: 'fa-circle-xmark'         },
    info:    { color: '#2c57e5', icon: 'fa-circle-info'          },
  };
  const { color, icon } = palette[type] ?? palette.info;

  const toast = document.createElement('div');
  Object.assign(toast.style, {
    display:       'flex',
    alignItems:    'center',
    gap:           '10px',
    background:    '#fff',
    border:        `1.5px solid ${color}`,
    borderLeft:    `4px solid ${color}`,
    borderRadius:  '10px',
    padding:       '12px 16px',
    boxShadow:     '0 4px 20px rgba(7,16,42,0.12)',
    fontSize:      '0.83rem',
    fontFamily:    "'Plus clamp Sans', sans-serif",
    color:         '#07102a',
    fontWeight:    '500',
    pointerEvents: 'all',
    minWidth:      '260px',
    maxWidth:      '340px',
    animation:     'toastIn 0.25s ease',
  });

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color:${color};font-size:1rem;flex-shrink:0;"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.25s ease forwards';
    setTimeout(() => toast.remove(), 280);
  }, 3200);
}


/* ═══════════════════════════════════════════════════
   13. LIVE QUEUE MONITOR FETCH
═══════════════════════════════════════════════════ */

async function fetchLiveQueueMonitor() {
  try {
    const response = await fetch('../API/Monitor/monitor_api.php');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();

    const queueList   = document.querySelector('.queue-list');
    const queueFooter = document.querySelector('.queue-footer');
    if (!queueList) return;

    queueList.innerHTML = '';

    const processing   = [...data.proc_priority, ...data.proc_normal, ...data.proc_online];
    const pending      = [...data.pend_priority, ...data.pend_normal, ...data.pend_online];
    const totalWaiting = pending.length;

    const getQueueType = (queueNum, priority) => {
      if (queueNum.startsWith('O')) return 'Online Request';
      if (priority > 0)             return 'Priority / Senior';
      return 'Standard Walk-in';
    };

    if (processing.length === 0 && pending.length === 0) {
      queueList.innerHTML = '<div style="padding:1rem;text-align:center;font-size:0.9rem;color:#64748b;">No active queues.</div>';
    } else {
      processing.forEach(q => {
        const hasBlotter = q.has_blotter == 1;
        const blotterClass = hasBlotter ? 'active-blotter-item' : '';
        const blotterDot = hasBlotter ? `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>` : '';

        const item     = document.createElement('div');
        item.className = `queue-item queue-item--serving ${blotterClass}`;
        item.innerHTML = `
          <div class="queue-num">${q.queue_number}</div>
          <div class="queue-details">
            <span class="queue-name">${blotterDot}${q.resident_name || 'Serving Now'}</span>
            <span class="queue-type">${getQueueType(q.queue_number, q.priority)}</span>
          </div>
          <span class="badge badge--processing" style="font-size:0.6rem;padding:2px 7px;">Serving</span>
        `;
        queueList.appendChild(item);
      });

      pending.slice(0, 5).forEach(q => {
        const hasBlotter = q.has_blotter == 1;
        const blotterClass = hasBlotter ? 'active-blotter-item' : '';
        const blotterDot = hasBlotter ? `<span class="status-indicator-dot" title="Active Blotter/Complaint Record"></span>` : '';

        const item     = document.createElement('div');
        item.className = `queue-item ${blotterClass}`;
        item.innerHTML = `
          <div class="queue-num">${q.queue_number}</div>
          <div class="queue-details">
            <span class="queue-name">${blotterDot}${q.resident_name || 'Waiting'}</span>
            <span class="queue-type">${getQueueType(q.queue_number, q.priority)}</span>
          </div>
          <div class="queue-status-dot waiting"></div>
        `;
        queueList.appendChild(item);
      });
    }

    if (queueFooter) {
      queueFooter.innerHTML = `
        <span><i class="fa-solid fa-users"></i> <strong>${totalWaiting}</strong> waiting</span>
        <span><i class="fa-solid fa-clock"></i> ~<strong>${totalWaiting * 5} min</strong> est</span>
      `;
    }

  } catch (error) {
    console.error("Error fetching live queue monitor:", error);
  }
}

fetchLiveQueueMonitor();
setInterval(fetchLiveQueueMonitor, 5000);


/* ═══════════════════════════════════════════════════
   14. GENERATE REPORT SUBMISSION
═══════════════════════════════════════════════════ */

window.generateReport = function () {
  const reportType = document.getElementById('reportType').value;
  const dateFrom   = document.getElementById('reportFrom').value;
  const dateTo     = document.getElementById('reportTo').value;

  let format = 'CSV';
  document.querySelectorAll('input[name="fmt"]').forEach(radio => {
    if (radio.checked) format = radio.parentElement.textContent.trim();
  });

  if (!dateFrom || !dateTo) {
    showToast('Please select both "Date From" and "Date To".', 'warning');
    return;
  }

  if (new Date(dateFrom) > new Date(dateTo)) {
    showToast('Invalid date range.', 'error');
    return;
  }

  showToast(`Generating ${reportType}...`, 'info');
  closeModal('modalReport');

  const params = new URLSearchParams({ type: reportType, from: dateFrom, to: dateTo, format });
  window.open(`../API/Admin/generate_report_api.php?${params.toString()}`, '_blank');
};