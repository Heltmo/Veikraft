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

// ===== Hero mode switch (Jobbsoker / Bedrift) =====
function initHeroModeSwitch() {
  const hero = document.getElementById('hero');
  const modeTabs = document.querySelectorAll('[data-hero-mode-tab]');
  if (!hero || !modeTabs.length) return;

  const ui = {
    badge: document.getElementById('heroBadge'),
    title: document.getElementById('heroTitle'),
    sub: document.getElementById('heroSub'),
    primaryBtn: document.getElementById('heroPrimaryBtn'),
    secondaryBtn: document.getElementById('heroSecondaryBtn'),
    contextTitle: document.getElementById('heroContextTitle'),
    contextLead: document.getElementById('heroContextLead'),
    contextBody: document.getElementById('heroContextBody'),
    links: [
      { anchor: document.getElementById('heroLink1'), label: document.getElementById('heroLinkLabel1') },
      { anchor: document.getElementById('heroLink2'), label: document.getElementById('heroLinkLabel2') },
      { anchor: document.getElementById('heroLink3'), label: document.getElementById('heroLinkLabel3') },
      { anchor: document.getElementById('heroLink4'), label: document.getElementById('heroLinkLabel4') },
    ],
  };

  const modes = {
    bedrift: {
      badge: 'For bedrift',
      title: 'Vi finner din neste medarbeider',
      sub: 'Trenger du ekstra kapasitet, innleie eller stotte i rekruttering? Vi matcher riktig personell raskt.',
      primary: { text: 'Kontakt oss', modal: 'bedriftModal' },
      secondary: { text: 'Se losninger', href: '#bedrifter' },
      context: {
        title: 'Vi finner din neste medarbeider',
        lead: 'Trenger du en midlertidig ansatt eller onsker hjelp til rekruttering til fast stilling? Vi hjelper deg med begge deler.',
        body: 'Vi dekker et bredt spekter av behov og matcher deg med riktig kapasitet, raskt og effektivt.',
      },
      links: [
        { label: 'Innleie av arbeidskraft', href: '#bedrifter' },
        { label: 'Var rekrutteringsprosess', href: '#how' },
        { label: 'Kontakt oss', href: '#contact' },
        { label: 'Finn ditt lokalomrade', href: '#contact' },
      ],
    },
    jobbsoker: {
      badge: 'For jobbsoker',
      title: 'Finn jobb der du er best',
      sub: 'Uansett om du vil ha oppdrag eller fast jobb, kobler vi deg med bedrifter som trenger din kompetanse.',
      primary: { text: 'Opprett profil', modal: 'driverModal' },
      secondary: { text: 'Se oppdrag', href: '#courier' },
      context: {
        title: 'Jobb der DU er best',
        lead: 'Vi vet at du er mer enn en CV. Nar du registrerer deg, matcher vi deg med relevante oppdrag og stillinger.',
        body: 'Du far tydelige forventninger, rask oppfolging og mulighet til a velge oppdrag som passer din hverdag.',
      },
      links: [
        { label: 'Finn ledige oppdrag', href: '#courier' },
        { label: 'Opprett profil', href: '#courier' },
        { label: 'Bli courier-partner', href: '#courier' },
        { label: 'Finn ditt lokalomrade', href: '#contact' },
      ],
    },
  };

  function applyMode(modeKey) {
    const mode = modes[modeKey] || modes.bedrift;
    hero.dataset.heroMode = modeKey;

    if (ui.badge) ui.badge.textContent = mode.badge;
    if (ui.title) ui.title.textContent = mode.title;
    if (ui.sub) ui.sub.textContent = mode.sub;

    if (ui.primaryBtn) {
      ui.primaryBtn.textContent = mode.primary.text;
      ui.primaryBtn.dataset.modal = mode.primary.modal;
    }

    if (ui.secondaryBtn) {
      ui.secondaryBtn.textContent = mode.secondary.text;
      ui.secondaryBtn.setAttribute('href', mode.secondary.href);
    }

    if (ui.contextTitle) ui.contextTitle.textContent = mode.context.title;
    if (ui.contextLead) ui.contextLead.textContent = mode.context.lead;
    if (ui.contextBody) ui.contextBody.textContent = mode.context.body;

    ui.links.forEach((link, index) => {
      const data = mode.links[index];
      if (!data) return;
      if (link.label) link.label.textContent = data.label;
      if (link.anchor) link.anchor.setAttribute('href', data.href);
    });

    modeTabs.forEach((tab) => {
      const active = tab.dataset.heroModeTab === modeKey;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  }

  modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      applyMode(tab.dataset.heroModeTab || 'bedrift');
    });
  });

  applyMode(hero.dataset.heroMode || 'bedrift');
}

// ===== Hero Selector =====
function initHeroSelector() {
  const trigger = document.getElementById('mainSelector');
  const dropdown = document.getElementById('selectorDropdown');
  const driverOption = document.getElementById('driverOption');
  const driverSubmenu = document.getElementById('driverSubmenu');

  if (!trigger || !dropdown) return;

  // Toggle main dropdown
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    trigger.classList.toggle('active');
    dropdown.classList.toggle('active');
  });

  // Toggle driver submenu
  if (driverOption && driverSubmenu) {
    driverOption.addEventListener('click', (e) => {
      e.stopPropagation();
      driverOption.classList.toggle('active');
      driverSubmenu.classList.toggle('active');
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      trigger.classList.remove('active');
      dropdown.classList.remove('active');
      if (driverOption) driverOption.classList.remove('active');
      if (driverSubmenu) driverSubmenu.classList.remove('active');
    }
  });

  // Handle option clicks - open modal
  dropdown.querySelectorAll('.selector-option[data-modal]').forEach((option) => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = option.dataset.modal;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      // Close dropdown
      trigger.classList.remove('active');
      dropdown.classList.remove('active');
      if (driverOption) driverOption.classList.remove('active');
      if (driverSubmenu) driverSubmenu.classList.remove('active');
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
  initHeroModeSwitch();
  initModals();
  initModalForms();
  initTabs();
  initHamburger();
  initHeroSelector();
});
