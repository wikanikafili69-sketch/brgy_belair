<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">
    <div class="brand-icon">
  <img src="<?php echo get_fresh_asset('Images/BARANGAY_ICON.png'); ?>" alt="Barangay Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 10px;">
    </div>
    <div class="brand-text">
      <span class="brand-name">Barangay</span>
      <span class="brand-sub">Management Portal</span>
    </div>
  </div>

  <div class="sidebar-section-label">Main Menu</div>
  <nav class="sidebar-nav">
    <ul>
      <li>
        <a href="staff_dashboard.php" class="nav-link" data-section="dashboard">
          <span class="nav-icon"><i class="fa-solid fa-house"></i></span>
          <span class="nav-label">Dashboard</span>
        </a>
      </li>

      <?php if (hasAccess('Access Resident - Staff')): ?>
      <li>
        <a href="staff_resident.php" class="nav-link" data-section="residents">
          <span class="nav-icon"><i class="fa-solid fa-users"></i></span>
          <span class="nav-label">Barangay Residents</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Certificate - Staff')): ?>
      <li>
        <a href="staff_certificate.php" class="nav-link" data-section="certificates">
          <span class="nav-icon"><i class="fa-solid fa-certificate"></i></span>
          <span class="nav-label">Certificate Requests</span>
        </a>
      </li>
      <?php endif; ?>

      <?php if (hasAccess('Access Barangay ID - Staff')): ?>
      <li>
        <a href="staff_barangay_id.php" class="nav-link" data-section="barangay_id">
          <span class="nav-icon"><i class="fa-solid fa-id-card"></i></span>
          <span class="nav-label">Barangay ID</span>
        </a>
      </li>
      <?php endif; ?>
      
      <li>
        <a href="../Connections/logout.php" class="nav-link" data-section="logout" onclick="return confirm('Are you sure you want to log out?')">
          <span class="nav-icon"><i class="fa-solid fa-right-from-bracket"></i></span>
          <span class="nav-label">Logout</span>
        </a>
      </li>
    </ul>
  </nav>
</aside>