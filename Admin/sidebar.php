<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">
    <div class="brand-icon">
    <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay 101 Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 10px;">
    </div>
    <div class="brand-text">
      <span class="brand-name">Barangay 101</span>
      <span class="brand-sub">Admin Panel</span>
    </div>
  </div>

  <div class="sidebar-section-label">Main Menu</div>
  <nav class="sidebar-nav">
    <ul>
      <li>
        <a href="admin_dashboard.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_dashboard.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-house"></i></div>
          <span class="nav-label">Dashboard</span>
        </a>
      </li>

      <?php if (hasAccess('Access Resident - Admin')): ?>
      <li>
        <a href="admin_resident.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_resident.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-users"></i></div>
          <span class="nav-label">Residents</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Certificate - Admin')): ?>
      <li>
        <a href="admin_certificates.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_certificates.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-file-lines"></i></div>
          <span class="nav-label">Certificates</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Barangay ID - Admin')): ?>
      <li>
        <a href="admin_barangay_id.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_barangay_id.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-id-card"></i></div>
          <span class="nav-label">Barangay ID</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Blotter - Admin')): ?>
      <li>
        <a href="admin_blotter.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_blotter.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-scale-balanced"></i></div>
          <span class="nav-label">Blotter Records</span>
        </a>
      </li>
      <?php endif; ?>
    </ul>
  </nav>

  <div class="sidebar-section-label">System</div>
  <nav class="sidebar-nav">
    <ul>
      <?php if (hasAccess('Access Staff - Admin')): ?>
      <li>
        <a href="admin_staff.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_staff.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-user-tie"></i></div>
          <span class="nav-label">Staff Management</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Gallery - Admin')): ?>
      <li>
        <a href="admin_gallery.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_gallery.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-images"></i></div>
          <span class="nav-label">Barangay Gallery</span>
        </a>
      </li>
      <li>
        <a href="admin_staff_pictures.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_staff_pictures.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-images"></i></div>
          <span class="nav-label">Admin and Staff Photos</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Reports - Admin')): ?>
      <li>
        <a href="admin_reports.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_reports.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-chart-bar"></i></div>
          <span class="nav-label">Reports & Analytics</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Contact - Admin')): ?>
      <li>
        <a href="admin_contact_us.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_contact_us.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-envelope"></i></div>
          <span class="nav-label">Contacts and Concerns</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Announcement - Admin')): ?>
      <li>
        <a href="admin_announcements.php" class="nav-link <?= basename($_SERVER['PHP_SELF']) === 'admin_announcements.php' ? 'active' : '' ?>">
          <div class="nav-icon"><i class="fa-solid fa-bullhorn"></i></div>
          <span class="nav-label">Announcements</span>
        </a>
      </li>
      <?php endif; ?>
    </ul>
  </nav>

  <div class="sidebar-footer">
    <div class="staff-chip">
      <div class="staff-avatar"><?= htmlspecialchars($admin_initials) ?></div>
      <div class="staff-info">
        <span class="staff-name"><?= htmlspecialchars($admin_name) ?></span>
        <span class="staff-role">System Administrator</span>
      </div>
      <a href="?logout=true" class="btn-logout-icon" title="Logout"
         onclick="return confirm('Are you sure you want to log out?')">
        <i class="fa-solid fa-right-from-bracket"></i>
      </a>
    </div>
  </div>
</aside>