// ===== FormSubmit.co — emails go to kundeservice@veikraft.com =====
const FORM_EMAIL = 'kundeservice@veikraft.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${FORM_EMAIL}`;

// ===== Smooth scroll =====
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const hash = a.getAttribute('href');
  if (hash.startsWith('#')) {
    e.preventDefault();
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// ===== Helpers =====
function showMessage(el, msg, success = true) {
  el.textContent = msg;
  el.style.color = success ? '#16a34a' : '#dc2626';
}

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

async function submitForm(data) {
  const res = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

// ===== Scroll animations =====
function initScrollAnimations() {
  const els = document.querySelectorAll('.fade-up');
  if (!els.length) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => observer.observe(el));
}

// ===== Modals =====
function initModals() {
  const triggers = document.querySelectorAll('[data-modal]');
  const overlays = document.querySelectorAll('.modal-overlay');

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  triggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(btn.dataset.modal);
    });
  });

  overlays.forEach((overlay) => {
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
    // Close button
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(overlay));
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      overlays.forEach((overlay) => {
        if (overlay.classList.contains('active')) closeModal(overlay);
      });
    }
  });
}

// ===== Modal form handling =====
function initModalForms() {
  const forms = document.querySelectorAll('.modal-form');

  forms.forEach((form) => {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msgEl = form.querySelector('.form-message');
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      const formType = form.dataset.formType;

      // Collect data
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => { data[k] = v; });
      data._subject = `veikraft — ${formType === 'bedrift' ? 'Bedrift-forespørsel' : formType === 'courier' ? 'Courier-registrering' : 'Sjåfør-registrering'}`;
      data.formType = formType;

      // Validate email if present
      if (data.email && !validateEmail(data.email)) {
        showMessage(msgEl, 'Ugyldig e-postadresse.', false);
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      showMessage(msgEl, '', true);

      try {
        const res = await submitForm(data);
        if (res.ok) {
          showMessage(msgEl, 'Takk! Vi tar kontakt snart.', true);
          form.reset();
        } else {
          showMessage(msgEl, 'Noe gikk galt. Prøv igjen eller send e-post direkte.', false);
        }
      } catch {
        showMessage(msgEl, 'Kunne ikke sende. Sjekk internett-tilkoblingen.', false);
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
      }
    });
  });
}

// ===== Tabs =====
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      // Deactivate all
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
      // Activate selected
      btn.classList.add('active');
      const content = document.getElementById(tabId);
      if (content) content.classList.add('active');
    });
  });
}

// ===== Hamburger =====
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const mainNav = document.getElementById('mainNav');
  if (!hamburger || !mainNav) return;

  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('open');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initModals();
  initModalForms();
  initTabs();
  initHamburger();
});
