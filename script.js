// ===== Same-origin proxy endpoint =====
const SUBMIT_URL = '/api/submit';
const FORM_IDS = ['bedriftForm', 'courierForm', 'driverForm'];

// ===== Helpers =====
function showMessage(el, msg, success = true) {
  el.textContent = msg;
  el.style.color = success ? '#16a34a' : '#dc2626';
}

function validateEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

async function submitForm(data) {
  return await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!FORM_IDS.includes(form.id)) return;

    const msgEl = form.querySelector('.form-message');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!msgEl || !submitBtn) return;

    if (!WEB_APP_URL || !WEB_APP_URL.includes('/exec')) {
      showMessage(msgEl, 'Apps Script URL mangler eller er ugyldig.', false);
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.sheet = form.dataset.sheet;
    data.page = window.location.pathname;

    if (!data.sheet) {
      showMessage(msgEl, 'Skjema mangler gyldig sheet-navn.', false);
      return;
    }

    if (data.email && !validateEmail(data.email)) {
      showMessage(msgEl, 'Ugyldig e-postadresse.', false);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    showMessage(msgEl, '', true);

    try {
      const res = await submitForm(data);
      const out = await res.json();
      if (out.ok === true) {
        showMessage(msgEl, 'Takk! Vi tar kontakt snart.', true);
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
});
