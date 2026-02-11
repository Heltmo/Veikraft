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
      data._subject = `veikraft — ${formType === 'bedrift' ? 'Bedrift-forespørsel' : formType === 'courier' ? 'Foretaksregistrering' : 'Sjåfør-registrering'}`;
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
      title: 'Bemanning til varetransport og distribusjon',
      sub: 'Veikraft hjelper bedrifter med sjåfører og transportkapasitet for faste ruter, sesongtopper og ekspresslevering.',
      primary: { text: 'Få bemanningstilbud', modal: 'bedriftModal' },
      secondary: { text: 'Se løsninger', href: '#bedrifter' },
      context: {
        title: 'Vi finner riktig transportkompetanse',
        lead: 'Vi leverer bemanning til varetransport for nettbutikker, matkasser, blomsterlevering og pakkedistribusjon.',
        body: 'Typiske oppdragsmiljøer er aktører som HelloFresh, Oda, Interflora, Bring, Posten og lignende logistikkmiljøer.',
      },
      links: [
        { label: 'Innleie til varetransport', href: '#bedrifter' },
        { label: 'Slik bemanner vi ruter', href: '#how' },
        { label: 'Kontakt oss', href: '#contact' },
        { label: 'Dekningsområder', href: '#contact' },
      ],
    },
    jobbsoker: {
      badge: 'For jobbsøker',
      title: 'Få jobb innen varetransport',
      sub: 'Vi hjelper deg inn i oppdrag hos transport- og logistikkmiljøer som trenger sjåfører nå.',
      primary: { text: 'Opprett profil', modal: 'driverModal' },
      secondary: { text: 'Se oppdrag', href: '#courier' },
      context: {
        title: 'Jobb med kjente transportoppdrag',
        lead: 'Vi matcher deg med oppdrag innen distribusjon, bud og terminaldrift i ditt område.',
        body: 'Du kan bli vurdert til oppdrag for miljøer som Bring, Posten, Oda, Interflora og lignende aktører.',
      },
      links: [
        { label: 'Finn ledige oppdrag', href: '#courier' },
        { label: 'Registrer sjåførprofil', href: '#courier' },
        { label: 'Registrer transportforetak', href: '#courier' },
        { label: 'Se områder vi dekker', href: '#contact' },
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
