/**
 * login.js — Staff Login Page
 * Barangay Portal Design System
 */

/* ════════════════════════════════════
   1. DOM REFERENCES
════════════════════════════════════ */
const loginForm      = document.getElementById('loginForm');
const loginBtn       = document.getElementById('loginBtn');
const loginLoader    = document.getElementById('loginLoader');
const loginAlert     = document.getElementById('loginAlert');

const usernameInput  = document.getElementById('username');
const passwordInput  = document.getElementById('password');

const errorUsername  = document.getElementById('errorUsername');
const errorPassword  = document.getElementById('errorPassword');

const statusUsername = document.getElementById('statusUsername');

const togglePwBtn    = document.getElementById('togglePw');
const eyeIcon        = document.getElementById('eyeIcon');

const rememberMe     = document.getElementById('rememberMe');

const particlesContainer = document.getElementById('particles');

/* ════════════════════════════════════
   2. PARTICLE BACKGROUND
════════════════════════════════════ */
const Particles = (() => {
  const PARTICLE_COUNT = 22;

  function create() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = document.createElement('span');
      p.className = 'particle';

      const size       = Math.random() * 3 + 1.5;
      const startLeft  = Math.random() * 100;
      const duration   = Math.random() * 10 + 8;
      const delay      = Math.random() * 10;
      const opacity    = Math.random() * 0.5 + 0.15;

      p.style.cssText = `
        left: ${startLeft}%;
        bottom: ${Math.random() * 30}%;
        width: ${size}px;
        height: ${size}px;
        opacity: ${opacity};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        background: ${Math.random() > 0.5 ? 'var(--gold)' : 'var(--blue-light)'};
      `;
      particlesContainer.appendChild(p);
    }
  }

  return { init: create };
})();

/* ════════════════════════════════════
   3. FORM VALIDATION HELPERS
════════════════════════════════════ */
const Validators = (() => {
  function setFieldState(input, statusEl, errorEl, state, message = '') {
    input.classList.remove('is-valid', 'is-error');
    if (statusEl) statusEl.textContent = '';
    if (errorEl)  errorEl.textContent  = '';

    if (state === 'valid') {
      input.classList.add('is-valid');
      if (statusEl) statusEl.textContent = '✅';
    } else if (state === 'error') {
      input.classList.add('is-error');
      if (statusEl) statusEl.textContent = '❌';
      if (errorEl)  errorEl.textContent  = message;
    }
  }

  function validateUsername(value) {
    if (!value.trim()) return { ok: false, msg: 'Username is required.' };
    return { ok: true };
  }

  function validatePassword(value) {
    if (!value) return { ok: false, msg: 'Password is required.' };
    return { ok: true };
  }

  return { setFieldState, validateUsername, validatePassword };
})();

/* ════════════════════════════════════
   4. FIELD VALIDATION (LIVE)
════════════════════════════════════ */
const LiveValidation = (() => {
  function bindUsername() {
    let debounceTimer;
    usernameInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const result = Validators.validateUsername(usernameInput.value);
        Validators.setFieldState(
          usernameInput,
          statusUsername,
          errorUsername,
          result.ok ? 'valid' : 'error',
          result.msg
        );
      }, 400);
    });

    usernameInput.addEventListener('blur', () => {
      const result = Validators.validateUsername(usernameInput.value);
      Validators.setFieldState(
        usernameInput,
        statusUsername,
        errorUsername,
        result.ok ? 'valid' : 'error',
        result.msg
      );
    });
  }

  function bindPassword() {
    passwordInput.addEventListener('blur', () => {
      const result = Validators.validatePassword(passwordInput.value);
      Validators.setFieldState(
        passwordInput,
        null,
        errorPassword,
        result.ok ? 'valid' : 'error',
        result.msg
      );
    });

    passwordInput.addEventListener('input', () => {
      passwordInput.classList.remove('is-error');
      errorPassword.textContent = '';
    });
  }

  function init() {
    bindUsername();
    bindPassword();
  }

  return { init };
})();

/* ════════════════════════════════════
   5. LOGIN FORM SUBMISSION
════════════════════════════════════ */
const LoginForm = (() => {
  function showAlert(type, message) {
    loginAlert.removeAttribute('hidden');
    loginAlert.className = `login-alert login-alert--${type}`;
    const icon = type === 'error' ? '⚠️' : '✅';
    loginAlert.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  }

  function hideAlert() {
    loginAlert.setAttribute('hidden', '');
    loginAlert.textContent = '';
  }

  function setLoading(isLoading) {
    if (isLoading) {
      loginBtn.disabled = true;
      loginBtn.querySelector('.btn-login-text').style.display  = 'none';
      loginBtn.querySelector('.btn-login-arrow').style.display = 'none';
      loginLoader.removeAttribute('hidden');
    } else {
      loginBtn.disabled = false;
      loginBtn.querySelector('.btn-login-text').style.display  = '';
      loginBtn.querySelector('.btn-login-arrow').style.display = '';
      loginLoader.setAttribute('hidden', '');
    }
  }

  function validateAll() {
    const userResult = Validators.validateUsername(usernameInput.value);
    const pwResult   = Validators.validatePassword(passwordInput.value);

    Validators.setFieldState(usernameInput, statusUsername, errorUsername,
      userResult.ok ? 'valid' : 'error', userResult.msg);
    Validators.setFieldState(passwordInput, null, errorPassword,
      pwResult.ok ? 'valid' : 'error', pwResult.msg);

    return userResult.ok && pwResult.ok;
  }

  function authenticate(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('API/Staff/login_process.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();

        if (data.success) {
          resolve({ username: data.username, role: data.role });
        } else {
          reject(new Error(data.message));
        }
      } catch (error) {
        console.error('Login Error:', error);
        reject(new Error('Network error. Please check your connection and try again.'));
      }
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    hideAlert();

    if (!validateAll()) return;

    const username = usernameInput.value;
    const password = passwordInput.value;

    setLoading(true);

    try {
      const session = await authenticate(username, password);

      if (rememberMe.checked) {
        localStorage.setItem('brgy_session', JSON.stringify({
          username: session.username,
          role: session.role, 
          remember: true,
        }));
      } else {
        sessionStorage.setItem('brgy_session', JSON.stringify({
          username: session.username,
          role: session.role, 
        }));
      }

      showAlert('success', `Welcome back! Redirecting to dashboard…`);

    setTimeout(() => {
        // Allow BOTH admin and superadmin to navigate to the admin dashboard
        if (session.role === 'admin' || session.role === 'superadmin') {
          window.location.href = `Admin/admin_dashboard.php`;
        } else if (session.role === 'staff') {
          window.location.href = `Staff/staff_dashboard.php`;
        } else {
          showAlert('error', 'Unrecognized user role. Contact system administrator.');
          setLoading(false);
        }
      }, 1200);

    } catch (err) {
      showAlert('error', err.message);
      const card = document.getElementById('loginCard');
      card.style.animation = 'none';
      requestAnimationFrame(() => {
        card.style.animation = 'shake 0.35s ease';
        setTimeout(() => { card.style.animation = ''; }, 400);
      });
    } finally {
      setLoading(false);
    }
  }

  function restoreRemembered() {
    const stored = localStorage.getItem('brgy_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.username) {
          usernameInput.value = session.username;
          rememberMe.checked = true;
          Validators.setFieldState(
            usernameInput, statusUsername, errorUsername, 'valid'
          );
        }
      } catch { /* ignore */ }
    }
  }

  function init() {
    loginForm.addEventListener('submit', handleSubmit);
    restoreRemembered();
  }

  return { init };
})();

/* ════════════════════════════════════
   6. PASSWORD TOGGLE
════════════════════════════════════ */
const PasswordToggle = (() => {
  let visible = false;

  function toggle() {
    visible = !visible;
    passwordInput.type = visible ? 'text' : 'password';
    eyeIcon.textContent = visible ? '🙈' : '👁️';
  }

  function init() {
    togglePwBtn.addEventListener('click', toggle);
  }

  return { init };
})();

/* ════════════════════════════════════
   7. INITIALISATION
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Particles.init();
  LiveValidation.init();
  LoginForm.init();
  PasswordToggle.init();
});