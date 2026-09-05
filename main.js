/* ==========================================================================
   PRIME ROLEPLAY — MAIN JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initPageTransitions();
  initNavbar();
  initMobileMenu();
  initActiveNav();
  initScrollReveal();
  initCounters();
  initAccordions();
  initRulesSearch();
  initVehicleFilter();
  initLightbox();
  initModals();
  initCountdown();
  initForms();
  initBackToTop();
  initAuthParticles();
  initServerStatus();
});

/* --------------------------------------------------------------------------
   PAGE TRANSITIONS
   -------------------------------------------------------------------------- */
function initPageTransitions() {
  document.querySelectorAll('a[href$=".html"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var url = link.getAttribute('href');
      var isExternalTarget = link.target === '_blank';
      if (isExternalTarget || url.indexOf('http') === 0) return;
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(function () { window.location.href = url; }, 260);
    });
  });
}

/* --------------------------------------------------------------------------
   STICKY / SHRINKING NAVBAR
   -------------------------------------------------------------------------- */
function initNavbar() {
  var nav = document.querySelector('.navbar');
  if (!nav) return;
  function onScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   MOBILE MENU
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.querySelector('.mobile-panel');
  if (!toggle || !panel) return;
  toggle.addEventListener('click', function () {
    toggle.classList.toggle('is-open');
    panel.classList.toggle('is-open');
    document.body.style.overflow = panel.classList.contains('is-open') ? 'hidden' : '';
  });
  panel.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      toggle.classList.remove('is-open');
      panel.classList.remove('is-open');
      document.body.style.overflow = '';
    });
  });
}

/* --------------------------------------------------------------------------
   ACTIVE NAV LINK
   -------------------------------------------------------------------------- */
function initActiveNav() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-panel a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

/* --------------------------------------------------------------------------
   SCROLL REVEAL
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  items.forEach(function (el) { observer.observe(el); });
}

/* --------------------------------------------------------------------------
   ANIMATED COUNTERS
   -------------------------------------------------------------------------- */
function initCounters() {
  var counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;
  var run = function (el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = value.toLocaleString('en-US') + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('en-US') + suffix;
    }
    requestAnimationFrame(step);
  };
  if (!('IntersectionObserver' in window)) {
    counters.forEach(run);
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        run(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(function (el) { observer.observe(el); });
}

/* --------------------------------------------------------------------------
   LIVE SERVER STATUS (simulated ping / player fluctuation)
   -------------------------------------------------------------------------- */
function initServerStatus() {
  var pings = document.querySelectorAll('[data-ping]');
  pings.forEach(function (el) {
    var base = parseInt(el.getAttribute('data-ping'), 10);
    setInterval(function () {
      var variance = Math.floor(Math.random() * 9) - 4;
      el.textContent = Math.max(12, base + variance) + 'ms';
    }, 3200);
  });
}

/* --------------------------------------------------------------------------
   ACCORDIONS (FAQ / RULES)
   -------------------------------------------------------------------------- */
function initAccordions() {
  document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var item = trigger.closest('.accordion-item');
      var group = item.closest('[data-accordion-group]');
      var wasOpen = item.classList.contains('is-open');
      if (group && group.getAttribute('data-accordion-group') === 'single') {
        group.querySelectorAll('.accordion-item').forEach(function (i) { i.classList.remove('is-open'); });
      }
      item.classList.toggle('is-open', !wasOpen);
    });
  });
}

/* --------------------------------------------------------------------------
   RULES SEARCH
   -------------------------------------------------------------------------- */
function initRulesSearch() {
  var input = document.getElementById('rulesSearch');
  if (!input) return;
  var items = document.querySelectorAll('.accordion-item[data-search-text]');
  var emptyState = document.getElementById('rulesEmpty');
  input.addEventListener('input', function () {
    var query = input.value.trim().toLowerCase();
    var visibleCount = 0;
    items.forEach(function (item) {
      var text = item.getAttribute('data-search-text').toLowerCase();
      var match = text.indexOf(query) !== -1;
      item.style.display = match ? '' : 'none';
      if (match) visibleCount++;
      if (query && match) item.classList.add('is-open');
    });
    if (emptyState) emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
  });
}

/* --------------------------------------------------------------------------
   VEHICLE FILTER + SEARCH
   -------------------------------------------------------------------------- */
function initVehicleFilter() {
  var grid = document.getElementById('vehicleGrid');
  if (!grid) return;
  var tabs = document.querySelectorAll('.filter-tab[data-filter]');
  var search = document.getElementById('vehicleSearch');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('[data-category]'));
  var empty = document.getElementById('vehicleEmpty');
  var activeCategory = 'all';

  function applyFilters() {
    var query = (search && search.value.trim().toLowerCase()) || '';
    var visible = 0;
    cards.forEach(function (card) {
      var category = card.getAttribute('data-category');
      var name = card.getAttribute('data-name').toLowerCase();
      var matchesCategory = activeCategory === 'all' || category === activeCategory;
      var matchesQuery = !query || name.indexOf(query) !== -1;
      var show = matchesCategory && matchesQuery;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (empty) empty.style.display = visible === 0 ? 'block' : 'none';
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      activeCategory = tab.getAttribute('data-filter');
      applyFilters();
    });
  });
  if (search) search.addEventListener('input', applyFilters);

  grid.querySelectorAll('[data-vehicle-view]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('[data-category]');
      openVehicleModal(card);
    });
  });
}

function openVehicleModal(card) {
  var overlay = document.getElementById('vehicleModal');
  if (!overlay || !card) return;
  overlay.querySelector('[data-modal-img]').src = card.querySelector('img').src;
  overlay.querySelector('[data-modal-name]').textContent = card.getAttribute('data-name');
  overlay.querySelector('[data-modal-category]').textContent = card.getAttribute('data-category');
  overlay.querySelector('[data-modal-price]').textContent = card.getAttribute('data-price');
  overlay.querySelector('[data-modal-speed]').textContent = card.getAttribute('data-speed');
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

/* --------------------------------------------------------------------------
   GENERIC MODALS (jobs / news / vehicle close, etc.)
   -------------------------------------------------------------------------- */
function initModals() {
  document.querySelectorAll('[data-open-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-open-modal');
      var overlay = document.getElementById(id);
      if (!overlay) return;
      var srcBtn = btn.closest('[data-modal-source]');
      if (srcBtn) {
        overlay.querySelectorAll('[data-fill]').forEach(function (el) {
          var key = el.getAttribute('data-fill');
          var value = srcBtn.getAttribute('data-' + key);
          if (value !== null) {
            if (el.tagName === 'IMG') el.src = value; else el.textContent = value;
          }
        });
      }
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('.modal-close')) {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.is-open, .lightbox.is-open').forEach(function (o) {
        o.classList.remove('is-open');
      });
      document.body.style.overflow = '';
    }
  });
}

/* --------------------------------------------------------------------------
   IMAGE LIGHTBOX (gallery)
   -------------------------------------------------------------------------- */
function initLightbox() {
  var lightbox = document.getElementById('lightbox');
  var items = document.querySelectorAll('.masonry-item[data-full]');
  if (!lightbox || !items.length) return;
  var imgEl = lightbox.querySelector('img');
  var captionEl = lightbox.querySelector('.lightbox-caption');
  var current = 0;
  var visibleItems = [];

  function refreshVisible() {
    visibleItems = Array.prototype.filter.call(items, function (it) { return it.style.display !== 'none'; });
  }

  function show(index) {
    refreshVisible();
    if (!visibleItems.length) return;
    current = (index + visibleItems.length) % visibleItems.length;
    var item = visibleItems[current];
    imgEl.src = item.getAttribute('data-full');
    captionEl.textContent = item.getAttribute('data-caption') || '';
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  items.forEach(function (item, idx) {
    item.addEventListener('click', function () {
      refreshVisible();
      var visIdx = visibleItems.indexOf(item);
      show(visIdx === -1 ? 0 : visIdx);
    });
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', function () {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  });
  lightbox.querySelector('.lightbox-next').addEventListener('click', function () { show(current + 1); });
  lightbox.querySelector('.lightbox-prev').addEventListener('click', function () { show(current - 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  var galleryTabs = document.querySelectorAll('.filter-tab[data-gallery-filter]');
  galleryTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      galleryTabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var cat = tab.getAttribute('data-gallery-filter');
      items.forEach(function (item) {
        var show = cat === 'all' || item.getAttribute('data-category') === cat;
        item.style.display = show ? '' : 'none';
      });
    });
  });
}

/* --------------------------------------------------------------------------
   EVENT COUNTDOWN
   -------------------------------------------------------------------------- */
function initCountdown() {
  var el = document.getElementById('countdown');
  if (!el) return;
  var targetAttr = el.getAttribute('data-target');
  var target = targetAttr ? new Date(targetAttr).getTime() : (Date.now() + 1000 * 60 * 60 * 52);
  var d = el.querySelector('[data-days]');
  var h = el.querySelector('[data-hours]');
  var m = el.querySelector('[data-minutes]');
  var s = el.querySelector('[data-seconds]');

  function tick() {
    var diff = Math.max(0, target - Date.now());
    var days = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins = Math.floor((diff % 3600000) / 60000);
    var secs = Math.floor((diff % 60000) / 1000);
    if (d) d.textContent = String(days).padStart(2, '0');
    if (h) h.textContent = String(hours).padStart(2, '0');
    if (m) m.textContent = String(mins).padStart(2, '0');
    if (s) s.textContent = String(secs).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

/* --------------------------------------------------------------------------
   FORM VALIDATION (support + register + login)
   -------------------------------------------------------------------------- */
function setFieldError(field, message) {
  field.classList.toggle('has-error', !!message);
  var errEl = field.querySelector('.field-error');
  if (errEl) errEl.textContent = message || '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function initForms() {
  var supportForm = document.getElementById('supportForm');
  if (supportForm) {
    supportForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      var name = supportForm.querySelector('#supportName');
      var email = supportForm.querySelector('#supportEmail');
      var category = supportForm.querySelector('#supportCategory');
      var message = supportForm.querySelector('#supportMessage');

      if (!name.value.trim()) { setFieldError(name.closest('.field'), 'Please enter your name.'); valid = false; }
      else setFieldError(name.closest('.field'), '');

      if (!isValidEmail(email.value.trim())) { setFieldError(email.closest('.field'), 'Enter a valid email address.'); valid = false; }
      else setFieldError(email.closest('.field'), '');

      if (!category.value) { setFieldError(category.closest('.field'), 'Please select a category.'); valid = false; }
      else setFieldError(category.closest('.field'), '');

      if (message.value.trim().length < 12) { setFieldError(message.closest('.field'), 'Please add a bit more detail (12+ characters).'); valid = false; }
      else setFieldError(message.closest('.field'), '');

      if (valid) {
        showToast('success', 'Request submitted', "We've received your ticket and will reply by email shortly.");
        supportForm.reset();
      } else {
        showToast('error', 'Check the form', 'Some fields need your attention before we can submit this.');
      }
    });
  }

  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = loginForm.querySelector('#loginEmail');
      var password = loginForm.querySelector('#loginPassword');
      var valid = true;
      if (!isValidEmail(email.value.trim())) { setFieldError(email.closest('.field'), 'Enter a valid email address.'); valid = false; }
      else setFieldError(email.closest('.field'), '');
      if (!password.value) { setFieldError(password.closest('.field'), 'Enter your password.'); valid = false; }
      else setFieldError(password.closest('.field'), '');
      if (valid) showToast('info', 'This is a demo', 'Login is not connected to a live server in this preview.');
    });
  }

  var registerForm = document.getElementById('registerForm');
  if (registerForm) {
    var passwordInput = registerForm.querySelector('#registerPassword');
    if (passwordInput) passwordInput.addEventListener('input', function () { updateStrengthMeter(passwordInput.value); });

    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      var username = registerForm.querySelector('#registerUsername');
      var email = registerForm.querySelector('#registerEmail');
      var password = registerForm.querySelector('#registerPassword');
      var confirm = registerForm.querySelector('#registerConfirm');
      var agree = registerForm.querySelector('#registerAgree');

      if (username.value.trim().length < 3) { setFieldError(username.closest('.field'), 'Username must be at least 3 characters.'); valid = false; }
      else setFieldError(username.closest('.field'), '');

      if (!isValidEmail(email.value.trim())) { setFieldError(email.closest('.field'), 'Enter a valid email address.'); valid = false; }
      else setFieldError(email.closest('.field'), '');

      if (password.value.length < 8) { setFieldError(password.closest('.field'), 'Password must be at least 8 characters.'); valid = false; }
      else setFieldError(password.closest('.field'), '');

      if (confirm.value !== password.value || !confirm.value) { setFieldError(confirm.closest('.field'), 'Passwords do not match.'); valid = false; }
      else setFieldError(confirm.closest('.field'), '');

      if (!agree.checked) { showToast('error', 'Terms required', 'You must agree to the Terms of Service and Server Rules.'); valid = false; }

      if (valid) {
        showToast('success', 'Account created', 'Welcome to Prime Roleplay — check your email to verify your account.');
        registerForm.reset();
        updateStrengthMeter('');
      } else if (agree.checked) {
        showToast('error', 'Check the form', 'Some fields need your attention before creating your account.');
      }
    });
  }
}

function updateStrengthMeter(value) {
  var bars = document.querySelectorAll('.strength-meter span');
  var label = document.getElementById('strengthLabel');
  if (!bars.length) return;
  var score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  var colors = ['#2a3548', '#ff4d5e', '#ffb23e', '#35a7ff', '#2be08a'];
  var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  bars.forEach(function (bar, i) {
    bar.style.background = i < score ? colors[score] : '#2a3548';
  });
  if (label) label.textContent = value ? labels[score] : '';
}

/* --------------------------------------------------------------------------
   TOAST SYSTEM
   -------------------------------------------------------------------------- */
function showToast(type, title, message) {
  var stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  var icons = { success: '✓', error: '!', info: 'i' };
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<div class="toast-icon">' + (icons[type] || 'i') + '</div>' +
    '<div><strong>' + title + '</strong><div class="text-muted" style="margin-top:4px;font-size:13px;">' + message + '</div></div>';
  stack.appendChild(toast);
  requestAnimationFrame(function () { toast.classList.add('is-visible'); });
  setTimeout(function () {
    toast.classList.remove('is-visible');
    setTimeout(function () { toast.remove(); }, 300);
  }, 5000);
}
window.showToast = showToast;

/* --------------------------------------------------------------------------
   BACK TO TOP
   -------------------------------------------------------------------------- */
function initBackToTop() {
  var btn = document.querySelector('.back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* --------------------------------------------------------------------------
   AUTH PAGE FLOATING PARTICLES
   -------------------------------------------------------------------------- */
function initAuthParticles() {
  var wrap = document.querySelector('.auth-particles');
  if (!wrap) return;
  for (var i = 0; i < 26; i++) {
    var span = document.createElement('span');
    span.style.left = Math.random() * 100 + '%';
    span.style.animationDuration = (8 + Math.random() * 10) + 's';
    span.style.animationDelay = (Math.random() * 10) + 's';
    span.style.opacity = (0.3 + Math.random() * 0.5).toFixed(2);
    wrap.appendChild(span);
  }
}
