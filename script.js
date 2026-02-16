// ===== FormSubmit (email delivery) =====
const FORM_EMAIL = 'kundeservice@veikraft.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${encodeURIComponent(FORM_EMAIL)}`;
const FORM_IDS = ['bedriftForm', 'courierForm', 'driverForm'];

// ===== Helpers =====
function showMessage(el, msg, success = true) {
  el.textContent = msg;
  el.style.color = success ? '#16a34a' : '#dc2626';
}

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function trackEvent(eventName, payload = {}) {
  const data = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

async function submitForm(data) {
  return await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
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
  const overlays = document.querySelectorAll('.modal-overlay');

  function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    if (id === 'bedriftModal') {
      trackEvent('modal_open_bedrift');
    }
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Delegated trigger handling so dynamic hero mode updates keep working.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-modal]');
    if (!btn) return;
    const modalId = btn.dataset.modal;

    if (btn.id === 'heroPrimaryBtn') {
      trackEvent('cta_click_hero', { location: 'hero', target: modalId });
    }

    if (modalId === 'courierModal' || modalId === 'driverModal') {
      trackEvent('cta_click_job', { target: modalId });
    }

    e.preventDefault();
    openModal(modalId);
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
  document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!FORM_IDS.includes(form.id)) return;

    const msgEl = form.querySelector('.form-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!msgEl || !submitBtn) return;

    const data = Object.fromEntries(new FormData(form).entries());
    const formType = form.dataset.formType || '';
    data.formType = formType;
    data.page = window.location.pathname;

    data._captcha = 'false';
    data._template = 'table';
    data._subject =
      formType === 'bedrift'
        ? 'veikraft — Bedrift-forespørsel'
        : formType === 'courier'
          ? 'veikraft — Registrer transportforetak'
          : 'veikraft — Registrer sjåfør';

    if (formType === 'bedrift') {
      const companyName = String(data.company_name || '').trim();
      const location = String(data.location || '').trim();
      const contactValue = String(data.contact_value || '').trim();

      if (!companyName) {
        showMessage(msgEl, 'Bedriftsnavn er påkrevd.', false);
        return;
      }

      if (!location) {
        showMessage(msgEl, 'By / område er påkrevd.', false);
        return;
      }

      if (!contactValue) {
        showMessage(msgEl, 'Fyll ut minst e-post eller telefon.', false);
        return;
      }

      if (contactValue.includes('@')) {
        if (!validateEmail(contactValue)) {
          showMessage(msgEl, 'Ugyldig e-postadresse.', false);
          return;
        }
        data.email = contactValue;
        data.phone = '';
      } else {
        data.phone = contactValue;
        data.email = '';
      }

      delete data.contact_value;
    } else if (data.email && !validateEmail(String(data.email))) {
      showMessage(msgEl, 'Ugyldig e-postadresse.', false);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    showMessage(msgEl, '', true);

    if (formType === 'bedrift') {
      trackEvent('form_submit_bedrift_step1');
    }

    try {
      const res = await submitForm(data);
      const out = await res.json().catch(() => ({}));
      const ok = res.ok && (out.success === true || out.success === 'true' || Boolean(out.message));
      if (ok) {
        const successMsg =
          formType === 'bedrift'
            ? 'Takk! Vi tar kontakt innen 2 timer i arbeidstid.'
            : 'Takk! Vi tar kontakt snart.';
        showMessage(msgEl, successMsg, true);
        form.reset();
      } else {
        showMessage(msgEl, 'Noe gikk galt. Prøv igjen.', false);
        console.error(out);
      }
    } catch (error) {
      showMessage(msgEl, 'Kunne ikke sende. Sjekk internett-tilkoblingen.', false);
      console.error(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
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
  initHamburger();
});
