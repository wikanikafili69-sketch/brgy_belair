<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Staff Login — Barangay Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  
  <link rel="stylesheet" href="CSS/Staff_css/staff_login.css" />
</head>
<body>

  <div class="bg-grid"></div>
  <div class="bg-glow bg-glow--blue"></div>
  <div class="bg-glow bg-glow--gold"></div>
  <div class="bg-particles" id="particles"></div>

  <main class="login-wrapper">

    <aside class="login-panel login-panel--left fade-in-left">
    <div class="panel-brand">
        <div class="brand-seal">
          <img src="Images/BARANGAY_ICON.png" alt="Barangay Icon" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
        </div>
        <div class="brand-text">
          <span class="brand-name">Barangay <span>Portal</span></span>
          <span class="brand-sub">Official Staff System</span>
        </div>
      </div>

      <div class="panel-hero">
        <span class="panel-eyebrow">Secure Access</span>
        <h1 class="panel-title display-title">
          Staff<br /><span class="accent">Dashboard</span>
        </h1>
        <p class="panel-desc">
          Access barangay records, manage residents, issue clearances, and monitor community services — all in one secure portal.
        </p>
        <div class="gold-line"></div>
      </div>

      <div class="panel-footer">
        <span class="pf-flag">🇵🇭</span>
        <span class="pf-text">Republic of the Philippines</span>
      </div>
    </aside>

    <section class="login-panel login-panel--right fade-in-right">
      <div class="login-card" id="loginCard">

        <div class="card-header">
          <span class="section-eyebrow">Staff Authentication</span>
          <h2 class="card-title display-title">Welcome Back</h2>
          <p class="card-subtitle">Sign in with your official staff credentials to continue.</p>
        </div>

        <form class="login-form" id="loginForm" novalidate>

          <div class="field-group" id="fieldUsername">
            <label class="field-label" for="username">Username</label>
            <div class="field-wrap">
              <span class="field-icon">👤</span>
              <input
                class="field-input"
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                autocomplete="username"
                spellcheck="false"
              />
              <span class="field-status" id="statusUsername"></span>
            </div>
            <span class="field-error" id="errorUsername"></span>
          </div>

          <div class="field-group" id="fieldPassword">
            <label class="field-label" for="password">
              Password
            </label>
            <div class="field-wrap">
              <span class="field-icon">🔒</span>
              <input
                class="field-input"
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                autocomplete="current-password"
              />
              <button class="toggle-pw" type="button" id="togglePw" aria-label="Toggle password visibility">
                <span id="eyeIcon">👁️</span>
              </button>
            </div>
            <span class="field-error" id="errorPassword"></span>
          </div>

          <div class="remember-row">
            <label class="checkbox-label">
              <input type="checkbox" id="rememberMe" name="rememberMe" />
              <span class="checkbox-custom"></span>
              Keep me signed in
            </label>
          </div>

          <button class="btn-login" type="submit" id="loginBtn">
            <span class="btn-login-text">Sign In to Portal</span>
            <span class="btn-login-arrow">→</span>
            <span class="btn-login-loader" id="loginLoader" hidden>
              <span class="loader-dot"></span>
              <span class="loader-dot"></span>
              <span class="loader-dot"></span>
            </span>
          </button>

          <div class="login-alert" id="loginAlert" hidden role="alert"></div>

        </form>

      </div>
    </section>

  </main>

  <script src="JS/Staff_js/staff_login.js?v=<?php echo time(); ?>"></script>
</body>
</html>