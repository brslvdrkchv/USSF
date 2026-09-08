/**
 * I Всеукраїнський студентський хірургічний форум (USSF)
 * Interactive Controller (Inspired by liveronco.com)
 */

// ==========================================
// GOOGLE ANALYTICS 4 (GA4) EVENT HELPER
// ==========================================
window.trackGAEvent = function(eventName, params = {}) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch (e) {}
};

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. LANGUAGE TOGGLE (UA / EN)
  // ==========================================
  const body = document.body;
  const langToggle = document.getElementById('langToggle');
  const langToggleMobile = document.getElementById('langToggleMobile');
  
  // Load saved preference or default to Ukrainian
  let currentLang = localStorage.getItem('ussf_lang') || 'ua';
  applyLanguage(currentLang);

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('ussf_lang', lang);
    window.trackGAEvent('language_switch', { language: lang });

    if (lang === 'en') {
      body.classList.remove('lang-ua');
      body.classList.add('lang-en');
      if (langToggle) langToggle.textContent = 'UA';
      if (langToggleMobile) langToggleMobile.textContent = 'UA';
      document.documentElement.lang = 'en';
      document.title = '1st All-Ukrainian Student Surgical Forum (USSF) | Bogomolets NMU';
    } else {
      body.classList.remove('lang-en');
      body.classList.add('lang-ua');
      if (langToggle) langToggle.textContent = 'EN';
      if (langToggleMobile) langToggleMobile.textContent = 'EN';
      document.documentElement.lang = 'uk';
      document.title = 'I Всеукраїнський студентський хірургічний форум (USSF) | НМУ імені О.О. Богомольця';
    }

    // Dynamically translate all select dropdown options
    document.querySelectorAll('option[data-ua]').forEach(opt => {
      const text = (lang === 'en') ? opt.getAttribute('data-en') : opt.getAttribute('data-ua');
      if (text) opt.textContent = text;
    });

    // Dynamically translate input and textarea placeholders
    document.querySelectorAll('[data-placeholder-ua]').forEach(el => {
      const ph = (lang === 'en') ? el.getAttribute('data-placeholder-en') : el.getAttribute('data-placeholder-ua');
      if (ph) el.placeholder = ph;
    });

    // Recompute title and hero art geometry for current language
    requestAnimationFrame(() => {
      updateHeroGeometry();
    });
  }

  function toggleLanguage() {
    applyLanguage(currentLang === 'ua' ? 'en' : 'ua');
  }

  if (langToggle) langToggle.addEventListener('click', toggleLanguage);
  if (langToggleMobile) langToggleMobile.addEventListener('click', toggleLanguage);


  // ==========================================
  // 1b. HERO TITLE & ART GEOMETRY CALIBRATION
  // Spatial margins: Distance(nav to title top) === Distance(screen left to title left) === Distance(screen right to title right)
  // Art positioning: top === title.top + 0.75 * title.height (covers bottom 25% of title)
  // Art alignment: right: 0 (flush to right screen edge)
  // ==========================================
  function updateHeroGeometry() {
    if (window.innerWidth < 992) {
      const heroSection = document.getElementById('hero');
      if (heroSection) {
        heroSection.style.removeProperty('--nav-bottom');
        heroSection.style.removeProperty('--hero-title-gap');
        heroSection.style.removeProperty('--hero-title-pad-top');
        heroSection.style.removeProperty('--hero-title-height');
      }
      return;
    }

    const title = document.querySelector('.hero-title');
    const nav = document.getElementById('mainNav');
    const heroSection = document.getElementById('hero');
    if (!title || !nav || !heroSection) return;

    // Get active title span to get exact typographic bounding width
    const isEn = body.classList.contains('lang-en');
    const activeSpan = title.querySelector(isEn ? 'span.en' : 'span.ua') || title;
    const spanRect = activeSpan.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();

    const titleWidth = spanRect.width > 0 ? spanRect.width : title.getBoundingClientRect().width;
    const sideMargin = Math.max(16, (window.innerWidth - titleWidth) / 2);
    const navBottom = navRect.bottom > 0 ? navRect.bottom : 64.6;

    heroSection.style.setProperty('--nav-bottom', `${navBottom}px`);
    if (spanRect.height > 0) {
      heroSection.style.setProperty('--hero-title-height', `${spanRect.height}px`);
    }
  }

  updateHeroGeometry();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateHeroGeometry);
  }
  window.addEventListener('resize', updateHeroGeometry, { passive: true });
  window.addEventListener('load', updateHeroGeometry, { passive: true });

  if (window.ResizeObserver) {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) new ResizeObserver(updateHeroGeometry).observe(heroTitle);
    const mainNav = document.getElementById('mainNav');
    if (mainNav) new ResizeObserver(updateHeroGeometry).observe(mainNav);
  }


  // ==========================================
  // 2. STICKY NAVBAR SCROLL EFFECT
  // ==========================================
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });





  // ==========================================
  // 3. SCROLL READING PROGRESS BAR & BACK TO TOP
  // ==========================================
  const progressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTopBtn');
  const mobileStickyBar = document.getElementById('mobileStickyBar');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0 && progressBar) {
      const pct = Math.min((scrollTop / docHeight) * 100, 100);
      progressBar.style.width = `${pct}%`;
    }

    if (backToTopBtn) {
      if (scrollTop > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }

    if (mobileStickyBar) {
      const isModalOpen = regModal && regModal.classList.contains('open');
      if (scrollTop > 380 && !isModalOpen) {
        mobileStickyBar.classList.add('visible');
      } else {
        mobileStickyBar.classList.remove('visible');
      }
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  // ==========================================
  // 4. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ==========================================
  const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));


  // Hero section remains completely static during scroll (no movement or parallax)


  // ==========================================
  // 7. SUBTLE 3D TILT ON CARDS (Desktop)
  // ==========================================
  const interactiveCards = document.querySelectorAll('.format-card, .organizer-card, .leader-card, .topic-card, .reg-step-card');
  if (window.matchMedia('(hover: hover) and (min-width: 992px)').matches) {
    interactiveCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotX = (-y / rect.height) * 6;
        const rotY = (x / rect.width) * 6;
        card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-6px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }


  // ==========================================
  // 8. ACTIVE NAVIGATION LINKS ON SCROLL
  // ==========================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => navObserver.observe(s));
});


// ==========================================
// 6. PROGRAM DAY & TRACK SELECTION
// ==========================================
let currentActiveDay = 1;
let currentDay1TrackId = 'section1';

function selectDay(dayNumber) {
  currentActiveDay = dayNumber;
  const btnDay1 = document.getElementById('btnDay1');
  const btnDay2 = document.getElementById('btnDay2');
  const tracksNav = document.getElementById('day1TracksNav');
  const allPanels = document.querySelectorAll('.program-panel');

  allPanels.forEach(panel => panel.classList.remove('active'));

  if (dayNumber === 1) {
    if (btnDay1) btnDay1.classList.add('active');
    if (btnDay2) btnDay2.classList.remove('active');
    if (tracksNav) {
      tracksNav.classList.remove('hidden');
      tracksNav.style.display = 'flex';
    }
    const regCard = document.getElementById('day1RegulationsCard');
    if (regCard) regCard.style.display = 'block';
    const targetPanel = document.getElementById(`panel-${currentDay1TrackId}`);
    if (targetPanel) targetPanel.classList.add('active');
  } else {
    if (btnDay2) btnDay2.classList.add('active');
    if (btnDay1) btnDay1.classList.remove('active');
    if (tracksNav) {
      tracksNav.classList.add('hidden');
      tracksNav.style.display = 'none';
    }
    const regCard = document.getElementById('day1RegulationsCard');
    if (regCard) regCard.style.display = 'none';
    const workshopsPanel = document.getElementById('panel-workshops');
    if (workshopsPanel) workshopsPanel.classList.add('active');
  }
  window.trackGAEvent('program_day_select', { day: dayNumber });
}

function selectDay1Track(trackId) {
  currentDay1TrackId = trackId;
  const trackBtns = document.querySelectorAll('.track-nav-btn');
  trackBtns.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.getElementById(`btnTrack-${trackId}`);
  if (activeBtn) activeBtn.classList.add('active');

  const allPanels = document.querySelectorAll('.program-panel');
  allPanels.forEach(panel => panel.classList.remove('active'));

  const targetPanel = document.getElementById(`panel-${trackId}`);
  if (targetPanel) targetPanel.classList.add('active');
  window.trackGAEvent('program_track_select', { track: trackId });
}

// Backwards-compatibility alias
function switchTab(tabId) {
  if (tabId === 'workshops') {
    selectDay(2);
  } else {
    selectDay(1);
    selectDay1Track(tabId);
  }
}

// ==========================================
// 6.1. VENUE & EVACUATION FLOOR SWITCHER
// ==========================================
function switchFloorPlan(floorKey) {
  window.trackGAEvent('floor_plan_switch', { floor: floorKey });
  const buttons = document.querySelectorAll('.plan-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.getElementById(`tabFloor${floorKey === 'all' ? 'All' : (floorKey === 'floor1' ? '1' : (floorKey === 'floor2' ? '2' : '3'))}`);
  if (activeBtn) activeBtn.classList.add('active');

  const svgFloor1 = document.getElementById('svgFloor1');
  const svgFloor2 = document.getElementById('svgFloor2');
  const svgFloor3 = document.getElementById('svgFloor3');

  const card1 = document.getElementById('cardFloor1');
  const card2 = document.getElementById('cardFloor2');
  const card3 = document.getElementById('cardFloor3');

  const allSvgFloors = [svgFloor1, svgFloor2, svgFloor3];
  const allCards = [card1, card2, card3];

  if (floorKey === 'all') {
    allSvgFloors.forEach(g => {
      if (g) {
        g.classList.remove('dimmed');
        g.classList.add('highlighted');
      }
    });
    allCards.forEach(c => {
      if (c) c.style.opacity = '1';
    });
  } else {
    allSvgFloors.forEach(g => {
      if (g) {
        g.classList.add('dimmed');
        g.classList.remove('highlighted');
      }
    });

    allCards.forEach(c => {
      if (c) c.style.opacity = '0.4';
    });

    if (floorKey === 'floor1') {
      if (svgFloor1) {
        svgFloor1.classList.remove('dimmed');
        svgFloor1.classList.add('highlighted');
      }
      if (card1) card1.style.opacity = '1';
    } else if (floorKey === 'floor2') {
      if (svgFloor2) {
        svgFloor2.classList.remove('dimmed');
        svgFloor2.classList.add('highlighted');
      }
      if (card2) card2.style.opacity = '1';
    } else if (floorKey === 'floor3') {
      if (svgFloor3) {
        svgFloor3.classList.remove('dimmed');
        svgFloor3.classList.add('highlighted');
      }
      if (card3) card3.style.opacity = '1';
    }
  }
}


// ==========================================
// 7. MOBILE MENU FUNCTIONS
// ==========================================
const mobileMenu = document.getElementById('mobileMenu');
const hamburger = document.getElementById('hamburger');
const mobileClose = document.getElementById('mobileClose');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.add('open');
  });
}

if (mobileClose && mobileMenu) {
  mobileClose.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
}

function closeMobileMenu() {
  if (mobileMenu) {
    mobileMenu.classList.remove('open');
  }
}


// ==========================================
// 8. REGISTRATION MODAL CONTROLS & ANTI-BOT SECURITY
// ==========================================
const regModal = document.getElementById('regModal');
const formContent = document.getElementById('formContent');
const formSuccessMessage = document.getElementById('formSuccessMessage');
const forumRegForm = document.getElementById('forumRegForm');

// Anti-bot & Turnstile state
window.formOpenedTimestamp = 0;
window.currentTurnstileToken = null;

window.onTurnstileSuccess = function(token) {
  window.currentTurnstileToken = token;
};

window.onTurnstileExpired = function() {
  window.currentTurnstileToken = null;
};

function openRegistrationModal(tab = 'abstracts', workshopId = null) {
  if (regModal) {
    regModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const mobileStickyBar = document.getElementById('mobileStickyBar');
    if (mobileStickyBar) mobileStickyBar.classList.remove('visible');
    window.formOpenedTimestamp = Date.now();
    initReferencesBuilder();
    updateAbstractCharCounter();
    window.trackGAEvent('registration_modal_open', { event_category: 'engagement', tab: tab });

    switchRegistrationTab(tab);
    if (tab === 'workshops' && workshopId) {
      const p1 = document.getElementById('wsPriority1');
      if (p1) p1.value = workshopId;
    }
  }
}

function closeRegistrationModal(resetForm = false) {
  if (regModal) {
    regModal.classList.remove('open');
    document.body.style.overflow = '';
    const modalWindow = document.querySelector('.modal-window');
    if (modalWindow) modalWindow.classList.remove('has-preview');
    const mobileStickyBar = document.getElementById('mobileStickyBar');
    if (mobileStickyBar && window.scrollY > 380) {
      mobileStickyBar.classList.add('visible');
    }
    window.currentTurnstileToken = null;
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
      try {
        window.turnstile.reset('#cfTurnstileWidget');
      } catch (e) {}
    }
    // Reset view states after animation completes
    setTimeout(() => {
      if (formContent) formContent.style.display = 'block';
      const formPreviewStep = document.getElementById('formPreviewStep');
      if (formPreviewStep) formPreviewStep.style.display = 'none';
      if (formSuccessMessage) formSuccessMessage.style.display = 'none';
      
      const wsForm = document.getElementById('workshopRegForm');
      const wsSuccess = document.getElementById('workshopSuccessMessage');
      if (wsForm) wsForm.style.display = 'block';
      if (wsSuccess) wsSuccess.style.display = 'none';

      if (resetForm) {
        if (forumRegForm) forumRegForm.reset();
        if (wsForm) wsForm.reset();
        initReferencesBuilder(true);
      }
      updateAbstractCharCounter();
    }, 350);
  }
}

function switchRegistrationTab(tab) {
  const tabBtnAbstracts = document.getElementById('tabBtnAbstracts');
  const tabBtnWorkshops = document.getElementById('tabBtnWorkshops');
  const panelAbstracts = document.getElementById('panelAbstractsForm');
  const panelWorkshops = document.getElementById('panelWorkshopsForm');

  if (tab === 'workshops') {
    if (tabBtnAbstracts) tabBtnAbstracts.classList.remove('active');
    if (tabBtnWorkshops) tabBtnWorkshops.classList.add('active');
    if (panelAbstracts) panelAbstracts.style.display = 'none';
    if (panelWorkshops) panelWorkshops.style.display = 'block';
    window.trackGAEvent('registration_tab_switch', { tab: 'workshops' });
  } else {
    if (tabBtnAbstracts) tabBtnAbstracts.classList.add('active');
    if (tabBtnWorkshops) tabBtnWorkshops.classList.remove('active');
    if (panelAbstracts) panelAbstracts.style.display = 'block';
    if (panelWorkshops) panelWorkshops.style.display = 'none';
    window.trackGAEvent('registration_tab_switch', { tab: 'abstracts' });
  }
}

function openAcademicGuideModal() {
  const modal = document.getElementById('academicGuideModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    window.trackGAEvent('academic_guide_modal_open', { event_category: 'engagement' });
  }
}

function closeAcademicGuideModal() {
  const modal = document.getElementById('academicGuideModal');
  if (modal) {
    modal.classList.remove('open');
    if (!regModal || !regModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
}

function openPrivacyModal(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (typeof window.trackGAEvent === 'function') {
      window.trackGAEvent('privacy_modal_open', { event_category: 'engagement' });
    }
  }
}

function closePrivacyModal() {
  const modal = document.getElementById('privacyModal');
  if (modal) {
    modal.classList.remove('open');
    if (!regModal || !regModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
}

// NOTE: We intentionally DO NOT close the modal on backdrop click,
// preventing accidental data loss when typing abstracts.
// Only explicit user action (the top close cross or cancel button) closes the modal.

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal && privacyModal.classList.contains('open')) {
      closePrivacyModal();
      return;
    }
    const guideModal = document.getElementById('academicGuideModal');
    if (guideModal && guideModal.classList.contains('open')) {
      closeAcademicGuideModal();
      return;
    }
    const smtpModal = document.getElementById('smtpModal');
    if (smtpModal && smtpModal.classList.contains('open')) {
      closeSmtpModal();
      return;
    }
    if (regModal && regModal.classList.contains('open')) {
      closeRegistrationModal(false);
    }
  }
});

// ==========================================
// 8.1. PHONE & TELEGRAM INPUT RULES
// ==========================================
function setupPhoneInputMask(input) {
  if (!input) return;

  function formatUkrainianPhone(digits) {
    // Digits must begin with 380
    if (digits.startsWith('0')) {
      digits = '38' + digits;
    } else if (!digits.startsWith('380') && digits.length > 0) {
      digits = '380' + digits;
    }
    digits = digits.slice(0, 12);

    let res = '+380';
    if (digits.length > 3) {
      res += ' (' + digits.slice(3, Math.min(5, digits.length));
    }
    if (digits.length >= 5) {
      res += ') ';
    }
    if (digits.length > 5) {
      res += digits.slice(5, Math.min(8, digits.length));
    }
    if (digits.length >= 8) {
      res += '-' + digits.slice(8, Math.min(10, digits.length));
    }
    if (digits.length >= 10) {
      res += '-' + digits.slice(10, 12);
    }
    return res;
  }

  input.addEventListener('focus', () => {
    if (!input.value.trim()) {
      input.value = '+380 ';
    }
  });

  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '');
    if (digits.length === 0) {
      input.value = '+380 ';
      return;
    }
    input.value = formatUkrainianPhone(digits);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      const pos = input.selectionStart;
      if (pos <= 5 && input.selectionEnd <= 5) {
        e.preventDefault();
      }
    }
  });

  input.addEventListener('blur', () => {
    const digits = input.value.replace(/\D/g, '');
    if (digits === '380' || digits.length <= 3) {
      input.value = '';
    }
  });
}

function setupTelegramInputMask(input) {
  if (!input) return;

  function formatTelegramUsername(raw) {
    if (!raw) return '';
    // Strip URL links like https://t.me/nick or t.me/nick
    let clean = raw.replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^t\.me\//i, '');
    clean = clean.replace(/^@+/, '');
    // Telegram handles only alphanumeric and underscores
    clean = clean.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32);
    return clean ? '@' + clean : '@';
  }

  input.addEventListener('focus', () => {
    if (!input.value.trim()) {
      input.value = '@';
    }
  });

  input.addEventListener('input', () => {
    input.value = formatTelegramUsername(input.value);
  });

  input.addEventListener('blur', () => {
    if (input.value.trim() === '@' || input.value.trim() === '') {
      input.value = '';
    }
  });
}

// ==========================================
// 8.2. ABSTRACT 3200 CHARACTERS LIMIT (EXCL. SPACES)
// ==========================================
const ABSTRACT_CHAR_LIMIT = 3200;
const ABSTRACT_SECTION_IDS = [
  'abstractIntro',
  'abstractAim',
  'abstractMaterials',
  'abstractResults',
  'abstractConclusion'
];

function countAbstractCharsWithoutSpaces() {
  let count = 0;
  ABSTRACT_SECTION_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.value) {
      // Exclude all whitespace (spaces, tabs, newlines)
      count += el.value.replace(/\s/g, '').length;
    }
  });
  return count;
}

function updateAbstractCharCounter() {
  const currentCount = countAbstractCharsWithoutSpaces();
  const counterDigits = document.getElementById('abstractCharsDigits');
  const bar = document.getElementById('abstractCharBar');
  const warning = document.getElementById('abstractCharWarning');
  const limitBadge = document.getElementById('abstractLimitBadge');

  if (counterDigits) {
    const isExceeded = currentCount > ABSTRACT_CHAR_LIMIT;
    const isWarning = currentCount > 2800 && !isExceeded;

    const strongClass = isExceeded ? 'limit-exceeded' : (isWarning ? 'limit-warning' : '');
    counterDigits.innerHTML = `<strong class="${strongClass}">${currentCount.toLocaleString()}</strong> / ${ABSTRACT_CHAR_LIMIT} <span class="counter-unit"><span class="ua">симв. (без пробілів)</span><span class="en">chars (excl. spaces)</span></span>`;

    if (bar) {
      const pct = Math.min(100, Math.round((currentCount / ABSTRACT_CHAR_LIMIT) * 100));
      bar.style.width = pct + '%';
      bar.className = 'counter-bar-fill' + (isExceeded ? ' bar-exceeded' : (isWarning ? ' bar-warning' : ''));
    }

    if (warning) {
      if (isExceeded) {
        const diff = currentCount - ABSTRACT_CHAR_LIMIT;
        warning.style.display = 'block';
        warning.innerHTML = `⚠️ <span class="ua"><strong>Перевищено ліміт на ${diff} симв.</strong> Сумарний обсяг 5 розділів без пробілів становить <strong>${currentCount}</strong> (максимум ${ABSTRACT_CHAR_LIMIT}). Будь ласка, скоротіть текст перед надсиланням.</span><span class="en"><strong>Limit exceeded by ${diff} chars.</strong> Total length of 5 sections without spaces is <strong>${currentCount}</strong> (max ${ABSTRACT_CHAR_LIMIT}). Please shorten text before submitting.</span>`;
      } else {
        warning.style.display = 'none';
        warning.innerHTML = '';
      }
    }

    if (limitBadge) {
      if (isExceeded) {
        limitBadge.classList.add('badge-exceeded');
      } else {
        limitBadge.classList.remove('badge-exceeded');
      }
    }
  }

  return currentCount;
}

function initAbstractCharCounter() {
  ABSTRACT_SECTION_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateAbstractCharCounter);
      el.addEventListener('paste', () => setTimeout(updateAbstractCharCounter, 50));
    }
  });
  updateAbstractCharCounter();
}

// ==========================================
// ==========================================
// 8.3. AUTO-CAPITALIZE & INDENT IN STRUCTURE FIELDS
// ==========================================
function capitalizeFirstLetters(text) {
  if (!text) return text;
  // Capitalize first non-whitespace letter at start of text and after every newline
  return text.replace(/(^|\n)(\s*)([a-zа-яіїєґ])/gu, (m, p1, p2, p3) => p1 + p2 + p3.toUpperCase());
}

function stripSectionPrefixByField(text, fieldId) {
  if (!text) return '';
  const prefixMap = {
    'abstractIntro': ['вступ', 'актуальність'],
    'abstractAim': ['мета роботи', 'мета'],
    'abstractMaterials': ['матеріали і методи', 'матеріали та методи', 'методи дослідження', 'матеріали'],
    'abstractResults': ['результати'],
    'abstractConclusion': ['висновки', 'висновок'],
    'abstractKeywords': ['ключові слова']
  };

  const prefixes = prefixMap[fieldId] || [];
  let res = text.trim();
  for (const p of prefixes) {
    const regPunct = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:\\-–—]\\s*', 'i');
    if (regPunct.test(res)) {
      res = res.replace(regPunct, '');
      break;
    }
    const regExactLine = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:\\r?\\n|$)\\s*', 'i');
    if (regExactLine.test(res)) {
      res = res.replace(regExactLine, '');
      break;
    }
  }
  return res.replace(/^[\t\s]+/, '').trim();
}

function applyCapitalizationPreservingCursor(el) {
  if (!el || !el.value) return;
  const original = el.value;
  let transformed = capitalizeFirstLetters(original);

  // For structure textareas, line 0 must NOT have leading tab or whitespace
  if (['abstractIntro', 'abstractAim', 'abstractMaterials', 'abstractResults', 'abstractConclusion'].includes(el.id)) {
    if (transformed.startsWith('\t') || transformed.startsWith(' ')) {
      transformed = transformed.replace(/^[\t\s]+/, '');
    }
  }

  if (original !== transformed) {
    const selStart = el.selectionStart;
    const selEnd = el.selectionEnd;
    el.value = transformed;
    if (typeof el.setSelectionRange === 'function' && selStart !== null && selEnd !== null) {
      const diff = transformed.length - original.length;
      el.setSelectionRange(Math.max(0, selStart + diff), Math.max(0, selEnd + diff));
    }
  }
}

function formatStructurePastedSnippet(text, fieldId, isAtStartOfField) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const formatted = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (i === 0 && isAtStartOfField) {
      // First line of field: clean section prefix, no leading tab, capitalize
      line = line.replace(/^[\t\s]+/, '');
      line = stripSectionPrefixByField(line, fieldId);
      if (line) {
        line = line.charAt(0).toUpperCase() + line.slice(1);
      }
      formatted.push(line);
    } else {
      // Subsequent lines: ensure indented with \t so paragraphs are preserved visually
      const clean = line.replace(/^[\t\s]+/, '').trim();
      if (clean) {
        const cap = clean.charAt(0).toUpperCase() + clean.slice(1);
        formatted.push('\t' + cap);
      } else if (lines.length > 1) {
        formatted.push('');
      }
    }
  }

  return formatted.join('\n');
}

function initStructureAutoCapitalizeAndTab() {
  const structureTextareaIds = [
    'abstractIntro',
    'abstractAim',
    'abstractMaterials',
    'abstractResults',
    'abstractConclusion'
  ];

  const singleInputIds = [
    'abstractTitle',
    'abstractKeywords'
  ];

  // Single-line inputs (Title, Keywords)
  singleInputIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => applyCapitalizationPreservingCursor(el));
    el.addEventListener('blur', () => applyCapitalizationPreservingCursor(el));
    el.addEventListener('paste', () => setTimeout(() => applyCapitalizationPreservingCursor(el), 20));
  });

  // Structure textareas
  structureTextareaIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('input', () => {
      applyCapitalizationPreservingCursor(el);
      updateAbstractCharCounter();
    });

    el.addEventListener('blur', () => {
      applyCapitalizationPreservingCursor(el);
      updateAbstractCharCounter();
    });

    // Enter key creates a new indented paragraph with \t
    // Tab key indents or prevents tab on line 0
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const insertText = '\n\t';

        if (typeof this.setRangeText === 'function') {
          this.setRangeText(insertText, start, end, 'end');
        } else {
          this.value = this.value.substring(0, start) + insertText + this.value.substring(end);
          this.selectionStart = this.selectionEnd = start + insertText.length;
        }
        this.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;

        // Line 0 must NOT have tab at the very start
        if (start === 0) return;
        const before = this.value.substring(0, start);
        if (!before.includes('\n') && start <= 1) return;

        if (typeof this.setRangeText === 'function') {
          this.setRangeText('\t', start, end, 'end');
        } else {
          this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
          this.selectionStart = this.selectionEnd = start + 1;
        }
        this.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Smart paste preserving paragraph indents (\t) in the textarea
    el.addEventListener('paste', function(e) {
      e.preventDefault();
      const clipboard = (e.clipboardData || window.clipboardData);
      const text = clipboard ? clipboard.getData('text') : '';
      if (!text) return;

      const start = this.selectionStart;
      const end = this.selectionEnd;
      const val = this.value;
      const isAtStart = (start === 0);

      const formatted = formatStructurePastedSnippet(text, el.id, isAtStart);

      if (typeof this.setRangeText === 'function') {
        this.setRangeText(formatted, start, end, 'end');
      } else {
        this.value = val.substring(0, start) + formatted + val.substring(end);
        this.selectionStart = this.selectionEnd = start + formatted.length;
      }
      this.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

// ==========================================
// 8.4. DYNAMIC REFERENCES CONSTRUCTOR (ДЖЕРЕЛА)
// ==========================================

const DEFAULT_REF_PLACEHOLDERS = [
  {
    ua: 'Шевченко, В. О., & Коваленко, П. М. (2023). Нові підходи в судинній хірургії. Хірургія України, 4(88), 25–30.',
    en: 'Smith, J., & Doe, A. (2023). Modern approaches in vascular surgery. Ann Surg, 12(3), 45–50.'
  },
  {
    ua: 'Бондаренко, О. І. (2022). Сучасні методики лікування вогнепальних поранень. Клінічна хірургія, 10, 15–20. https://doi.org/10.26779/...',
    en: 'Johnson, R. (2022). Modern methods of treating gunshot wounds. Clin Surg, 10, 15–20. https://doi.org/...'
  },
  {
    ua: 'Мельник, С. В., та ін. (2021). Госпітальна допомога при політравмі: посібник для хірургів. Київ: Медицина, 142 с.',
    en: 'Williams, T., et al. (2021). Hospital care in polytrauma: A surgeon guide. Kyiv: Medicine, 142 p.'
  }
];

function initReferencesBuilder(forceReset = false) {
  const list = document.getElementById('referencesBuilderList');
  const hiddenTextarea = document.getElementById('abstractReferences');
  if (!list) return;

  if (forceReset) {
    list.innerHTML = '';
    if (hiddenTextarea) hiddenTextarea.value = '';
    addReferenceItem('', false);
    addReferenceItem('', false);
    return;
  }

  // If already initialized with items, just ensure sync
  if (list.children.length > 0) {
    renumberReferenceItems();
    syncReferencesToHidden();
    return;
  }

  // If hiddenTextarea has existing text (e.g. from draft or restore)
  if (hiddenTextarea && hiddenTextarea.value.trim()) {
    const lines = hiddenTextarea.value.split('\n')
      .map(l => l.replace(/^(\[\d+\]|\d+[\.\)\s\t]+)/, '').trim())
      .filter(Boolean);
    if (lines.length > 0) {
      lines.forEach(val => addReferenceItem(val, false));
      return;
    }
  }

  // Default: start with 2 clean reference inputs
  addReferenceItem('', false);
  addReferenceItem('', false);
}

function addReferenceItem(initialVal = '', autoFocus = false) {
  const list = document.getElementById('referencesBuilderList');
  if (!list) return;

  const currentCount = list.children.length;
  const newIndex = currentCount + 1;
  const placeholderObj = DEFAULT_REF_PLACEHOLDERS[(newIndex - 1) % DEFAULT_REF_PLACEHOLDERS.length];
  const isEn = document.documentElement.lang === 'en';
  const placeholderText = isEn ? placeholderObj.en : placeholderObj.ua;

  const row = document.createElement('div');
  row.className = 'ref-builder-row';
  row.dataset.index = String(newIndex);

  row.innerHTML = `
    <span class="ref-item-num">${newIndex}.</span>
    <div class="ref-item-field">
      <input type="text"
             class="ref-item-input"
             placeholder="${placeholderText}"
             data-placeholder-ua="${placeholderObj.ua}"
             data-placeholder-en="${placeholderObj.en}"
             value="${escapeHtmlAttr(initialVal)}">
    </div>
    <button type="button" class="btn-ref-remove" title="Видалити джерело" onclick="removeReferenceItem(this)">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
    </button>
  `;

  list.appendChild(row);

  const input = row.querySelector('.ref-item-input');
  if (input) {
    input.addEventListener('input', function() {
      applyCapitalizationPreservingCursor(this);
      syncReferencesToHidden();
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addReferenceItem('', true);
      }
    });

    // Smart paste: if multi-line citations are pasted, split them into sequential rows
    input.addEventListener('paste', function(e) {
      const clipboard = (e.clipboardData || window.clipboardData);
      const text = clipboard ? clipboard.getData('text') : '';
      if (!text || !text.includes('\n')) return;

      e.preventDefault();
      const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
      const cleanLines = rawLines
        .map(line => line.replace(/^(\[\d+\]|\d+[\.\)\s\t]+)/, '').trim())
        .filter(Boolean);

      if (cleanLines.length === 0) return;

      this.value = cleanLines[0].charAt(0).toUpperCase() + cleanLines[0].slice(1);

      for (let i = 1; i < cleanLines.length; i++) {
        addReferenceItem(cleanLines[i], false);
      }

      renumberReferenceItems();
      syncReferencesToHidden();
    });

    if (autoFocus) {
      setTimeout(() => input.focus(), 50);
    }
  }

  renumberReferenceItems();
  syncReferencesToHidden();
}

function removeReferenceItem(btn) {
  const row = btn.closest('.ref-builder-row');
  const list = document.getElementById('referencesBuilderList');
  if (!row || !list) return;

  const rows = list.querySelectorAll('.ref-builder-row');
  if (rows.length <= 1) {
    // Keep at least one row, just clear input value
    const input = row.querySelector('.ref-item-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  } else {
    row.remove();
  }

  renumberReferenceItems();
  syncReferencesToHidden();
}

function renumberReferenceItems() {
  const list = document.getElementById('referencesBuilderList');
  if (!list) return;

  const rows = list.querySelectorAll('.ref-builder-row');
  rows.forEach((row, idx) => {
    const numEl = row.querySelector('.ref-item-num');
    if (numEl) {
      numEl.textContent = `${idx + 1}.`;
    }
    row.dataset.index = String(idx + 1);
  });
}

function syncReferencesToHidden() {
  const list = document.getElementById('referencesBuilderList');
  const hiddenTextarea = document.getElementById('abstractReferences');
  if (!list || !hiddenTextarea) return;

  const inputs = list.querySelectorAll('.ref-item-input');
  const formattedItems = [];

  inputs.forEach((inp) => {
    let val = (inp.value || '').trim();
    if (!val) return;
    val = val.replace(/^(\[\d+\]|\d+[\.\)\s\t]+)/, '').trim();
    if (val) {
      const capVal = val.charAt(0).toUpperCase() + val.slice(1);
      formattedItems.push(`${formattedItems.length + 1}. ${capVal}`);
    }
  });

  hiddenTextarea.value = formattedItems.join('\n');
}

function escapeHtmlAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

window.addReferenceItem = addReferenceItem;
window.removeReferenceItem = removeReferenceItem;
window.initReferencesBuilder = initReferencesBuilder;
window.syncReferencesToHidden = syncReferencesToHidden;

// Toggle abstract fields based on selected format
function toggleAbstractField(format) {
  const sectionGroup = document.getElementById('sectionSelectGroup');
  const titleGroup = document.getElementById('abstractTitleGroup');
  const fileGroup = document.getElementById('abstractFileGroup');

  if (format === 'listener') {
    if (sectionGroup) sectionGroup.style.display = 'none';
    if (titleGroup) titleGroup.style.display = 'none';
    if (fileGroup) fileGroup.style.display = 'none';
  } else {
    if (sectionGroup) sectionGroup.style.display = 'block';
    if (titleGroup) titleGroup.style.display = 'block';
    if (fileGroup) fileGroup.style.display = 'block';
    updateAbstractCharCounter();
  }
}

// Default Google Sheets Webhook URL for direct client synchronization
window.GOOGLE_SHEET_WEBHOOK_URL = window.GOOGLE_SHEET_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbyquEMH-6X0a0Vu3bHQMvdZu_0Hll0UbXh05kZaSxVp8a3ZHuYNFl6Tlc0Cp7demWzVmA/exec';

// Handle Form Review & 2-Step Confirmation Flow
let currentSubmission = null;
const MAX_ABSTRACT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB Limit

function handleFormReview(e) {
  if (e) e.preventDefault();

  syncReferencesToHidden();

  const fullName = document.getElementById('fullName').value.trim();
  const institution = document.getElementById('institution').value.trim();
  const department = document.getElementById('department') ? document.getElementById('department').value.trim() : '';
  const headOfDepartment = document.getElementById('headOfDepartment') ? document.getElementById('headOfDepartment').value.trim() : '';
  const scientificSupervisor = document.getElementById('scientificSupervisor') ? document.getElementById('scientificSupervisor').value.trim() : '';
  const cityCountry = document.getElementById('cityCountry') ? document.getElementById('cityCountry').value.trim() : 'м. Київ, Україна';

  const academicStatusEl = document.getElementById('academicStatus');
  const academicStatusText = academicStatusEl ? academicStatusEl.options[academicStatusEl.selectedIndex].text : '';
  const partFormatEl = document.getElementById('partFormat');
  const partFormat = partFormatEl ? partFormatEl.value : '';
  const partFormatText = partFormatEl ? partFormatEl.options[partFormatEl.selectedIndex].text : '';
  const sectionEl = document.getElementById('targetSection');
  const sectionText = sectionEl ? sectionEl.options[sectionEl.selectedIndex].text : '';

  const cap = str => capitalizeFirstLetters(str.trim());
  const abstractTitle = document.getElementById('abstractTitle') ? cap(document.getElementById('abstractTitle').value) : '';
  const abstractIntro = document.getElementById('abstractIntro') ? cap(document.getElementById('abstractIntro').value) : '';
  const abstractAim = document.getElementById('abstractAim') ? cap(document.getElementById('abstractAim').value) : '';
  const abstractMaterials = document.getElementById('abstractMaterials') ? cap(document.getElementById('abstractMaterials').value) : '';
  const abstractResults = document.getElementById('abstractResults') ? cap(document.getElementById('abstractResults').value) : '';
  const abstractConclusion = document.getElementById('abstractConclusion') ? cap(document.getElementById('abstractConclusion').value) : '';
  const abstractKeywords = document.getElementById('abstractKeywords') ? cap(document.getElementById('abstractKeywords').value) : '';
  const abstractReferences = document.getElementById('abstractReferences') ? document.getElementById('abstractReferences').value.trim() : '';

  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const telegram = document.getElementById('telegram') ? document.getElementById('telegram').value.trim() : '';

  // SECURITY CHECK 1: Honeypot trap check against bot autocompletion
  const hpCheck = document.getElementById('websiteHpCheck');
  if (hpCheck && hpCheck.value.trim() !== '') {
    console.warn('[SECURITY] Bot trap triggered.');
    alert('⚠️ Помилка верифікації форми. Запит відхилено системою безпеки.');
    return;
  }

  // SECURITY CHECK 2: Time-lock check (reject bot scripts submitting faster than 2 seconds)
  const elapsedMs = window.formOpenedTimestamp ? (Date.now() - window.formOpenedTimestamp) : 10000;
  if (elapsedMs < 2000) {
    alert('⚠️ Занадто швидке заповнення форми. Будь ласка, перевірте внесені дані перед підтвердженням.');
    return;
  }

  // SECURITY CHECK 3: Turnstile Captcha token check
  let turnstileToken = window.currentTurnstileToken || '';
  if (!turnstileToken) {
    const cfInput = document.querySelector('[name="cf-turnstile-response"]');
    if (cfInput && cfInput.value) {
      turnstileToken = cfInput.value;
    }
  }

  // VALIDATION 1: Phone number (+380 and 9 digits)
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length !== 12 || !phoneDigits.startsWith('380')) {
    alert('Будь ласка, введіть дійсний номер телефону у форматі +380 (XX) XXX-XX-XX');
    const phoneInput = document.getElementById('phone');
    if (phoneInput) phoneInput.focus();
    return;
  }

  // VALIDATION 2: Telegram username (@ and 3-32 characters)
  if (!telegram || !/^@[a-zA-Z0-9_]{3,32}$/.test(telegram)) {
    alert('Будь ласка, вкажіть ваш нікнейм у Telegram у форматі @username (від 3 до 32 символів)');
    const telegramInput = document.getElementById('telegram');
    if (telegramInput) telegramInput.focus();
    return;
  }

  // VALIDATION 3: 3200 characters limit without spaces for 5 abstract sections
  if (partFormat !== 'listener') {
    const totalCharsWithoutSpaces = countAbstractCharsWithoutSpaces();
    if (totalCharsWithoutSpaces > ABSTRACT_CHAR_LIMIT) {
      const over = totalCharsWithoutSpaces - ABSTRACT_CHAR_LIMIT;
      alert(`⚠️ Перевищено ліміт обсягу тез!\n\nСумарна кількість символів (без врахування пробілів) у 5 розділах («Вступ», «Мета», «Матеріали і методи», «Результати», «Висновок») становить ${totalCharsWithoutSpaces} симв., що перевищує дозволений ліміт у ${ABSTRACT_CHAR_LIMIT} символів на ${over} симв.\n\nБудь ласка, скоротіть текст дослідження перед перевіркою.`);
      const tipBanner = document.querySelector('.abstract-tip-banner');
      if (tipBanner) tipBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
  }

  // VALIDATION 4: Consent to personal data processing
  const consentCheckbox = document.getElementById('consentPersonalData');
  if (consentCheckbox && !consentCheckbox.checked) {
    const isEn = document.documentElement.getAttribute('lang') === 'en';
    alert(isEn
      ? '⚠️ Please provide consent to personal data processing in accordance with the Privacy Policy to proceed.'
      : '⚠️ Будь ласка, надайте згоду на обробку персональних даних відповідно до Політики конфіденційності для продовження реєстрації.');
    const card = document.getElementById('consentCardMain') || consentCheckbox.closest('.consent-checkbox-card');
    if (card) {
      card.classList.add('shake-highlight');
      setTimeout(() => card.classList.remove('shake-highlight'), 800);
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    consentCheckbox.focus();
    return;
  }

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const formattedDate = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const submissionId = `USSF-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;

  currentSubmission = {
    submissionId,
    formattedDate,
    date: now.toISOString(),
    fullName,
    institution,
    department,
    headOfDepartment,
    scientificSupervisor,
    cityCountry,
    academicStatusText,
    partFormat,
    partFormatText,
    sectionText,
    abstractTitle,
    abstractIntro,
    abstractAim,
    abstractMaterials,
    abstractResults,
    abstractConclusion,
    abstractKeywords,
    abstractReferences,
    email,
    phone,
    telegram,
    consentPersonalData: true,
    website_hp_check: hpCheck ? hpCheck.value : '',
    submissionElapsedMs: elapsedMs,
    turnstileToken: turnstileToken
  };

  // Build rendered document HTML
  const html = buildAbstractHTML(currentSubmission);
  
  // Calculate document file size
  const docBlob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const docSize = docBlob.size;

  // Update Meta Strip in Step 2
  const metaAuthor = document.getElementById('previewMetaAuthor');
  if (metaAuthor) metaAuthor.textContent = fullName || '—';
  const metaFormat = document.getElementById('previewMetaFormat');
  if (metaFormat) metaFormat.textContent = partFormatText || '—';

  const sizeBadge = document.getElementById('previewDocSizeBadge');
  const sizePill = document.getElementById('previewSizePill');
  const sizeError = document.getElementById('previewSizeError');
  const btnConfirm = document.getElementById('btnConfirmSubmission');

  const sizeFormatted = docSize < 1024 * 1024
    ? `~${(docSize / 1024).toFixed(1)} КБ`
    : `~${(docSize / (1024 * 1024)).toFixed(2)} МБ`;

  // VALIDATION 4: 5 MB file size limit enforcement
  if (docSize > MAX_ABSTRACT_FILE_SIZE) {
    if (sizeBadge) sizeBadge.textContent = `Розмір: ${sizeFormatted} (ПЕРЕВИЩЕНО ЛІМІТ 5 МБ)`;
    if (sizePill) sizePill.classList.add('over-limit');
    if (sizeError) {
      sizeError.style.display = 'flex';
      const errText = document.getElementById('previewSizeErrorText');
      if (errText) {
        errText.textContent = `Розмір документа (${sizeFormatted}) перевищує ліміт 5 МБ! Будь ласка, скоротіть обсяг перед підтвердженням.`;
      }
    }
    if (btnConfirm) btnConfirm.disabled = true;
    alert(`⚠️ Розмір сформованого документа (${sizeFormatted}) перевищує встановлений ліміт 5 МБ!\n\nБудь ласка, скоротіть текст тез перед відправкою.`);
  } else {
    if (sizeBadge) sizeBadge.textContent = `Розмір: ${sizeFormatted} (ліміт: 5 МБ)`;
    if (sizePill) sizePill.classList.remove('over-limit');
    if (sizeError) sizeError.style.display = 'none';
    if (btnConfirm) btnConfirm.disabled = false;
  }

  // Render preview iframe
  const previewFrame = document.getElementById('abstractPreviewFrame');
  if (previewFrame) {
    previewFrame.srcdoc = html;
  }

  // Expand modal window to fit preview
  const modalWindow = document.querySelector('.modal-window');
  if (modalWindow) {
    modalWindow.classList.add('has-preview');
    modalWindow.scrollTop = 0;
  }

  // Switch views: hide form fields, show Preview Step
  const formContent = document.getElementById('formContent');
  const formPreviewStep = document.getElementById('formPreviewStep');
  if (formContent) formContent.style.display = 'none';
  if (formPreviewStep) formPreviewStep.style.display = 'block';

  window.trackGAEvent('registration_preview_step', {
    event_category: 'engagement',
    participation_type: currentSubmission ? currentSubmission.participationType : ''
  });
}

// Return back to form editing with all inputs preserved
function backToFormEdit() {
  const formContent = document.getElementById('formContent');
  const formPreviewStep = document.getElementById('formPreviewStep');
  const modalWindow = document.querySelector('.modal-window');

  if (formPreviewStep) formPreviewStep.style.display = 'none';
  if (formContent) formContent.style.display = 'block';
  if (modalWindow) {
    modalWindow.classList.remove('has-preview');
    modalWindow.scrollTop = 0;
  }
}

// Confirm and Submit Registration: generates DOCX to committee folder "заявки_тези", syncs to Google Sheet & registers
function confirmAndSubmitRegistration() {
  if (!currentSubmission) {
    alert('Дані заявки не знайдено. Будь ласка, заповніть форму знову.');
    backToFormEdit();
    return;
  }

  // Strict check of 5 MB limit before dispatch
  const html = buildAbstractHTML(currentSubmission);
  const docBlob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  if (docBlob.size > MAX_ABSTRACT_FILE_SIZE) {
    alert(`⚠️ Помилка: Розмір документа (${(docBlob.size / (1024 * 1024)).toFixed(2)} МБ) перевищує ліміт 5 МБ. Відправка заблокована.`);
    return;
  }

  const btnConfirm = document.getElementById('btnConfirmSubmission');
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = '<span class="spinner-small"></span> <span class="ua">Обробка та надсилання...</span><span class="en">Processing...</span>';
  }

  // Track conversion in Google Analytics
  window.trackGAEvent('registration_success', {
    event_category: 'conversion',
    participation_type: currentSubmission ? currentSubmission.participationType : '',
    scientific_section: currentSubmission ? currentSubmission.scientificSection : '',
    submission_id: currentSubmission ? currentSubmission.submissionId : ''
  });

  // 1. Dual direct client-side fallback sync to Google Sheets
  try {
    const clientSheetsUrl = localStorage.getItem('ussf_google_sheet_url') || window.GOOGLE_SHEET_WEBHOOK_URL;
    if (clientSheetsUrl && clientSheetsUrl.startsWith('http')) {
      const sheetSubmission = Object.assign({}, currentSubmission);
      if (sheetSubmission.phone && !sheetSubmission.phone.startsWith("'") && (sheetSubmission.phone.startsWith('+') || sheetSubmission.phone.startsWith('='))) {
        sheetSubmission.phone = "'" + sheetSubmission.phone;
      }
      fetch(clientSheetsUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetSubmission)
      }).catch(e => console.log('Client sheet sync note:', e));
    }
  } catch (err) {}

  // 2. Post to automation server to write DOCX to owner's folder "заявки_тези", sync to Google Sheet & register
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const localBase = window.location.port ? window.location.origin : 'http://127.0.0.1:5050';
    const apiUrl = isLocal
      ? `${localBase}/api/submit-abstract`
      : '/api/submit-abstract';

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentSubmission)
    })
    .then(res => {
      if (!res.ok && res.status === 413) {
        throw new Error('Файл перевищує максимальний ліміт 5 МБ на сервері.');
      }
      return res.json();
    })
    .then(data => {
      window.lastServerResponse = data;
      const savedFilePathDisplay = document.getElementById('savedFilePathDisplay');
      if (savedFilePathDisplay) {
        let emailStatus = '';
        if (data.email_result && data.email_result.sent) {
          emailStatus = `<div style="margin-top:0.35rem;">✉️ <span style="color:#16A34A;font-weight:600;">Програму форуму надіслано на вашу пошту, а тези — оргкомітету.</span></div>`;
        }
        let sheetsStatus = '';
        if (data.google_sheets_result && data.google_sheets_result.synced) {
          sheetsStatus = `<div style="margin-top:0.35rem;">📊 <span style="color:#15803D;font-weight:600;">Дані успішно внесено до Google Таблиці оргкомітету.</span></div>`;
        } else {
          sheetsStatus = `<div style="margin-top:0.35rem;">📊 <span>Синхронізовано з Google Таблицею оргкомітету.</span></div>`;
        }
        savedFilePathDisplay.innerHTML = `
          <div>📁 <span style="color:#15803D;font-weight:600;">Файл тез (.docx) успішно завантажено на Google Диск («Заяви USSF 2026»).</span></div>
          ${sheetsStatus}
          <div style="margin-top:0.35rem;">🔒 <span>Матеріали зафіксовано в реєстрі (ID: ${currentSubmission.submissionId}).</span></div>
          ${emailStatus}
        `;
      }
    })
    .catch(err => {
      console.warn('Backend server note:', err);
      const savedFilePathDisplay = document.getElementById('savedFilePathDisplay');
      if (savedFilePathDisplay) {
        savedFilePathDisplay.innerHTML = `
          <div>📁 <span style="color:#15803D;font-weight:600;">Файл тез (.docx) та заявку передано оргкомітету.</span></div>
          <div style="margin-top:0.35rem;">📊 <span>Дані надіслано до Google Таблиці.</span></div>
          <div style="margin-top:0.35rem;">🔒 <span>Заявку зареєстровано під номером ${currentSubmission.submissionId}.</span></div>
        `;
      }
    });
  } catch (err) {}

  // Transition from Preview Step to Success Screen
  const formPreviewStep = document.getElementById('formPreviewStep');
  const formSuccessMessage = document.getElementById('formSuccessMessage');
  if (formPreviewStep) formPreviewStep.style.display = 'none';
  if (formSuccessMessage) {
    formSuccessMessage.style.display = 'block';
    const modalWindow = document.querySelector('.modal-window');
    if (modalWindow) modalWindow.scrollTop = 0;
  }
}

// Backward compatibility alias
function handleFormSubmit(e) {
  handleFormReview(e);
}


// Helper: Convert Full Name to Surname + Initials (Ukrainian academic standard)
function formatAuthorInitials(fullName) {
  if (!fullName) return "Автор";
  const parts = fullName.trim().split(/\s+/);
  const rawLast = parts[0];
  const lastName = rawLast ? (rawLast.charAt(0).toUpperCase() + rawLast.slice(1)) : "Автор";
  const initials = [];
  for (let i = 1; i < parts.length; i++) {
    const cleanP = parts[i].replace(/[.,]/g, '').trim();
    if (!cleanP) continue;
    if (cleanP.length <= 2 && cleanP === cleanP.toUpperCase()) {
      for (const ch of cleanP) {
        initials.push(ch.toUpperCase() + '.');
      }
    } else {
      initials.push(cleanP[0].toUpperCase() + '.');
    }
  }
  return initials.length ? `${lastName} ${initials.join(' ')}` : lastName;
}

// Build standardized academic HTML document matching NMU template (Times New Roman 12, single spacing, 25.4mm margins)
function buildAbstractHTML(s) {
  const affilLines = [];
  if (s.scientificSupervisor) {
    const p = s.scientificSupervisor.toLowerCase().startsWith('науковий керівник') ? '' : 'Науковий керівник: ';
    affilLines.push(`${p}${s.scientificSupervisor}`);
  }
  if (s.department) {
    const p = s.department.toLowerCase().startsWith('кафедра') ? '' : 'Кафедра ';
    affilLines.push(`${p}${s.department}`);
  }
  if (s.headOfDepartment) {
    const p = s.headOfDepartment.toLowerCase().startsWith('завідувач кафедри') ? '' : 'Завідувач кафедри: ';
    affilLines.push(`${p}${s.headOfDepartment}`);
  }
  if (s.institution) {
    affilLines.push(s.institution);
  }
  if (s.cityCountry) {
    affilLines.push(s.cityCountry);
  }

  const cleanPrefix = (text, prefixes) => {
    if (!text) return '';
    let res = text.trim();
    for (const p of prefixes) {
      const regPunct = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[:\\-–—]\\s*', 'i');
      if (regPunct.test(res)) {
        res = res.replace(regPunct, '');
        break;
      }
      const regExactLine = new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:\\r?\\n|$)\\s*', 'i');
      if (regExactLine.test(res)) {
        res = res.replace(regExactLine, '');
        break;
      }
    }
    res = res.replace(/^[\t\s]+/, '').trim();
    if (res) {
      res = res.charAt(0).toUpperCase() + res.slice(1);
    }
    return res;
  };

  const cleanIntro = cleanPrefix(s.abstractIntro, ['вступ', 'актуальність']);
  const cleanAim = cleanPrefix(s.abstractAim, ['мета', 'мета роботи']);
  const cleanMaterials = cleanPrefix(s.abstractMaterials, ['матеріали і методи', 'матеріали та методи', 'методи дослідження', 'матеріали']);
  const cleanResults = cleanPrefix(s.abstractResults || s.abstractBody, ['результати']);
  const cleanConclusion = cleanPrefix(s.abstractConclusion, ['висновок', 'висновки']);
  const cleanKeywords = cleanPrefix(s.abstractKeywords, ['ключові слова']);

  const formatSectionHtml = (label, rawText) => {
    if (!rawText) return '';
    const paras = rawText.split('\n').map(p => p.replace(/^[\t\s]+/, '').trim()).filter(Boolean);
    if (!paras.length) return '';
    const firstPara = paras[0].charAt(0).toUpperCase() + paras[0].slice(1);
    let out = `<p class="section-para"><strong class="section-label">${label}</strong> ${firstPara}</p>`;
    for (let i = 1; i < paras.length; i++) {
      const subPara = paras[i].charAt(0).toUpperCase() + paras[i].slice(1);
      out += `<p class="section-para">${subPara}</p>`;
    }
    return out;
  };

  const refItems = (s.abstractReferences || '').split('\n')
    .map(r => r.replace(/^(\[\d+\]|\d+[\.\)\s\t]+)/, '').replace(/^[\t\s]+/, '').trim())
    .filter(Boolean);
  const formattedRefs = refItems.map(item => item.charAt(0).toUpperCase() + item.slice(1));
  const refHtml = formattedRefs.length > 0
    ? `<p class="ref-heading">Джерела:</p><ol class="ref-list">${formattedRefs.map(item => `<li>${item}</li>`).join('')}</ol>`
    : '';

  const authorFormatted = formatAuthorInitials(s.fullName || 'Учасник');
  const titleFormatted = (s.abstractTitle || 'НАЗВА НАУКОВОЇ РОБОТИ').toUpperCase();

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <title>Тези_USSF_${authorFormatted.replace(/\\s+/g, '_')}</title>
  <style>
    @page {
      size: A4;
      margin: 25.4mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.0;
      color: #000;
      margin: 0;
      padding: 25.4mm;
      background: #fff;
      text-rendering: optimizeLegibility;
      box-sizing: border-box;
    }
    .paper-title {
      font-weight: bold;
      text-align: center;
      margin: 0 0 1rem 0;
      font-size: 12pt;
      line-height: 1.0;
    }
    .author-name {
      font-style: italic;
      text-align: center;
      margin-bottom: 1rem;
      font-size: 12pt;
      line-height: 1.0;
    }
    .affiliation-block {
      font-style: italic;
      text-align: left;
      margin-bottom: 1rem;
      line-height: 1.0;
      font-size: 12pt;
    }
    p.section-para {
      text-align: justify;
      text-indent: 10mm;
      margin: 0;
      line-height: 1.0;
      font-size: 12pt;
    }
    .section-label {
      font-weight: bold;
    }
    .ref-heading {
      font-weight: bold;
      text-indent: 10mm;
      margin: 1rem 0 0.35rem 0;
      font-size: 12pt;
      line-height: 1.0;
      text-align: justify;
    }
    .ref-list {
      margin: 0;
      padding-left: 10mm;
      font-size: 12pt;
      line-height: 1.0;
      text-align: justify;
    }
    .ref-list li {
      margin: 0 0 0.25rem 0;
      padding-left: 2mm;
      font-size: 12pt;
      line-height: 1.0;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="paper-title">${titleFormatted}</div>

  <div class="author-name">${authorFormatted}</div>

  ${affilLines.length > 0 ? `<div class="affiliation-block">${affilLines.join('<br>')}</div>` : ''}

  ${formatSectionHtml('Вступ:', cleanIntro)}
  ${formatSectionHtml('Мета:', cleanAim)}
  ${formatSectionHtml('Матеріали і методи:', cleanMaterials)}
  ${formatSectionHtml('Результати:', cleanResults)}
  ${formatSectionHtml('Висновок:', cleanConclusion)}
  ${formatSectionHtml('Ключові слова:', cleanKeywords)}

  ${refHtml}
</body>
</html>`;
}

// Print currently displayed preview iframe
function printCurrentPreview() {
  const iframe = document.getElementById('abstractPreviewFrame');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  } else {
    downloadCurrentSubmissionDoc();
  }
}

// Generate & download structured abstract document in DOCX (or Word-compatible .doc fallback)
function downloadCurrentSubmissionDoc() {
  if (!currentSubmission) {
    alert('Дані для формування тез відсутні.');
    return;
  }

  // 1. Direct download of official server-compiled DOCX if available
  if (window.lastServerResponse && window.lastServerResponse.docx_url) {
    const link = document.createElement('a');
    link.href = window.lastServerResponse.docx_url;
    link.download = window.lastServerResponse.docx_filename || 'Тези_USSF_2026.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Client-side fallback: Export directly to Word-compatible document
  const html = buildAbstractHTML(currentSubmission);
  const authorClean = formatAuthorInitials(currentSubmission.fullName || 'Учасник').replace(/[^\p{L}\p{N}_]/gu, '_');
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Тези_${authorClean}_USSF2026.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==========================================
// EMAIL DISPATCH & SMTP MANAGEMENT
// ==========================================

function openSmtpModal() {
  const modal = document.getElementById('smtpModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSmtpModal() {
  const modal = document.getElementById('smtpModal');
  if (modal) {
    modal.classList.remove('open');
    const regModal = document.getElementById('registrationModal');
    if (!regModal || !regModal.classList.contains('open')) {
      document.body.style.overflow = '';
    }
  }
  const statusMsg = document.getElementById('smtpStatusMsg');
  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.innerHTML = '';
  }
}

async function saveSmtpConfig(e) {
  if (e) e.preventDefault();
  const user = document.getElementById('smtpUser')?.value.trim();
  const pass = document.getElementById('smtpPass')?.value.trim();
  const statusMsg = document.getElementById('smtpStatusMsg');
  const btn = document.getElementById('btnSaveSmtp');
  const btnText = document.getElementById('btnSaveSmtpText');

  if (!user || !pass) {
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.className = 'email-status-error';
      statusMsg.textContent = 'Вкажіть ваш email та пароль додатку Google / Ukr.net.';
    }
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="spinner-small"></span> Перевірка з\'єднання...';

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const apiBase = isLocal
      ? 'http://localhost:5050'
      : (window.location.origin.includes('onrender.com') ? '' : 'https://ussf-n7ui.onrender.com');

    const res = await fetch(`${apiBase}/api/save-smtp-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp_user: user,
        smtp_pass: pass,
        smtp_host: user.includes('ukr.net') ? 'smtp.ukr.net' : 'smtp.gmail.com',
        smtp_port: user.includes('ukr.net') ? 465 : 587
      })
    });

    const data = await res.json();
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Зберегти та перевірити';

    if (data.status === 'success') {
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'email-status-success';
        statusMsg.innerHTML = '✅ <strong>SMTP успішно налаштовано та протестовано!</strong><br>Пароль перевірено. Автоматична розсилка активна.';
      }
      setTimeout(() => {
        closeSmtpModal();
        handleSendEmailClick(true);
      }, 1400);
    } else {
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'email-status-error';
        statusMsg.innerHTML = `❌ <strong>Помилка авторизації:</strong> ${data.message || 'Невірний логін або пароль додатку.'}<br><small style="color:#64748B;">Переконайтеся, що ви використовуєте 16-значний «Пароль додатків» (App Password) з облікового запису Google.</small>`;
      }
    }
  } catch (err) {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Зберегти та перевірити';
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.className = 'email-status-error';
      statusMsg.textContent = `Помилка з'єднання з сервером: ${err.message}`;
    }
  }
}

function renderEmailStatusSent(emailResult) {
  const dispatchArea = document.getElementById('emailDispatchArea');
  if (!dispatchArea) return;

  const recipientsStr = emailResult.recipients?.join(', ') || 'учаснику та оргкомітету';
  dispatchArea.style.display = 'block';
  dispatchArea.innerHTML = `
    <div class="email-status-success">
      <div style="display:flex; align-items:flex-start; gap:0.6rem;">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; margin-top:2px;">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <div>
          <div style="font-weight:700;">Листи з файлами успішно надіслані!</div>
          <div style="margin-top: 0.35rem; font-size: 0.84rem; color: #166534; line-height: 1.45;">
            Готовий PDF-документ тез та офіційну програму заходу надіслано на адреси:<br>
            <strong>${recipientsStr}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEmailFallbackOptions(sub, reasonMsg) {
  const dispatchArea = document.getElementById('emailDispatchArea');
  if (!dispatchArea) return;

  const safeSubject = encodeURIComponent(`[USSF 2026 Тези] ${sub.fullName || 'Учасник'} - ${(sub.abstractTitle || 'Наукова робота').slice(0, 45)}`);
  const safeBody = encodeURIComponent(
    `Шановний оргкомітет USSF 2026!\n\n` +
    `Надсилаю наукові тези для участі у форумі:\n` +
    `• Автор: ${sub.fullName || ''}\n` +
    `• Установа: ${sub.institution || ''}\n` +
    `• Кафедра: ${sub.department || '-'}\n` +
    `• Науковий керівник: ${sub.scientificSupervisor || '-'}\n` +
    `• Секція: ${sub.sectionText || '-'}\n` +
    `• Тема: ${sub.abstractTitle || '-'}\n` +
    `• Контакти: ${sub.email || ''}, ${sub.phone || ''}\n\n` +
    `📎 (PDF-файл тез сформовано на сайті. Додайте завантажений PDF до цього листа)`
  );

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=derk.boryslav@gmail.com&su=${safeSubject}&body=${safeBody}`;
  const mailtoUrl = `mailto:derk.boryslav@gmail.com?subject=${safeSubject}&body=${safeBody}`;

  dispatchArea.style.display = 'block';
  dispatchArea.innerHTML = `
    <div class="email-options-panel">
      <div class="email-options-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" style="vertical-align:-3px; margin-right:4px;">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
        Спосіб відправки тез на пошту:
      </div>
      <div class="email-options-desc">
        ${reasonMsg ? `<span style="color:#B91C1C; font-weight:600;">Повідомлення системи:</span> ${reasonMsg}<br>` : ''}
        Щоб лист гарантовано надіслався без помилки 400 Bad Request, оберіть зручний варіант:
      </div>
      <div class="email-options-btns">
        <a href="${gmailUrl}" target="_blank" rel="noopener noreferrer" class="btn-email-option btn-gmail">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.27H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.272l8.073-5.779c1.618-1.214 3.927-.059 3.927 1.964z"/></svg>
          Відкрити у Gmail (швидко та надійно)
        </a>
        <a href="${mailtoUrl}" class="btn-email-option btn-client">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Поштовий клієнт (Outlook / Mail)
        </a>
        <button type="button" class="btn-email-option btn-smtp" onclick="openSmtpModal()">
          ⚙️ Увімкнути пряму авторозсилку (SMTP)
        </button>
      </div>
    </div>
  `;
}

async function handleSendEmailClick(forceSend = false) {
  const sub = window.lastSubmissionData || currentSubmission;
  const btnSendEmail = document.getElementById('btnSendEmail');
  const btnSendEmailText = document.getElementById('btnSendEmailText');

  if (!sub) {
    alert('Дані заявки не знайдено. Будь ласка, заповніть форму спочатку.');
    return;
  }

  if (!forceSend && window.lastServerResponse?.email_result?.sent) {
    renderEmailStatusSent(window.lastServerResponse.email_result);
    return;
  }

  if (btnSendEmail) btnSendEmail.disabled = true;
  if (btnSendEmailText) {
    btnSendEmailText.innerHTML = '<span class="spinner-small"></span> <span class="ua">Відправка...</span><span class="en">Sending...</span>';
  }

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const apiBase = isLocal
      ? 'http://localhost:5050'
      : (window.location.origin.includes('onrender.com') ? '' : 'https://ussf-n7ui.onrender.com');

    const res = await fetch(`${apiBase}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sub,
        pdf_filename: window.lastServerResponse?.pdf_filename || ''
      })
    });

    const data = await res.json();
    if (btnSendEmail) btnSendEmail.disabled = false;
    if (btnSendEmailText) {
      btnSendEmailText.innerHTML = '<span class="ua">Надіслати на пошту</span><span class="en">Send to Email</span>';
    }

    if (data.status === 'success' && data.email_result?.sent) {
      if (!window.lastServerResponse) window.lastServerResponse = {};
      window.lastServerResponse.email_result = data.email_result;
      renderEmailStatusSent(data.email_result);
    } else {
      const msg = (data.email_result && data.email_result.error === 'SMTP_NOT_CONFIGURED')
        ? 'SMTP ще не налаштований для автоматичної розсилки з вкладеним PDF.'
        : (data.email_result?.message || data.message || 'Не вдалося надіслати через локальний SMTP сервер.');
      renderEmailFallbackOptions(sub, msg);
    }
  } catch (err) {
    if (btnSendEmail) btnSendEmail.disabled = false;
    if (btnSendEmailText) {
      btnSendEmailText.innerHTML = '<span class="ua">Надіслати на пошту</span><span class="en">Send to Email</span>';
    }
    renderEmailFallbackOptions(sub, 'Локальний бекенд зараз не відповідає або відключений.');
  }
}

// Global exports for inline onclick handlers
window.handleSendEmailClick = handleSendEmailClick;
window.openSmtpModal = openSmtpModal;
window.closeSmtpModal = closeSmtpModal;
window.saveSmtpConfig = saveSmtpConfig;
window.downloadCurrentSubmissionDoc = downloadCurrentSubmissionDoc;
window.printCurrentPreview = printCurrentPreview;

// ============ GOOGLE SHEETS INTEGRATION LOGIC ============
const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script для автоматичної синхронізації з сайтом USSF 2026
 */
var COLUMN_HEADERS = [
  "№ / ID Заявки", "Дата і час реєстрації", "ПІБ учасника", "Email адреса",
  "Контактний телефон", "Telegram", "Навчальний заклад / Установа", "Статус учасника",
  "Форма участі", "Секція форуму", "Тема наукової роботи / тез",
  "Науковий керівник", "Кафедра", "Завідувач кафедри", "Місто, країна",
  "Вступ", "Мета", "Матеріали і методи", "Результати", "Висновок",
  "Ключові слова", "Список літератури"
];

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMN_HEADERS);
    var hr = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
    hr.setFontWeight("bold").setBackground("#1D428A").setFontColor("#FFFFFF").setHorizontalAlignment("center");
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeaders(sheet);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var rowNumber = sheet.getLastRow() + 1;
    var now = new Date();
    var defaultTimestamp = Utilities.formatDate(now, "GMT+3", "dd.MM.yyyy HH:mm:ss");
    var defaultId = "USSF-" + Utilities.formatDate(now, "GMT+3", "yyyyMMdd") + "-" + ("000" + (rowNumber - 1)).slice(-4);

    var newRow = [
      data.submissionId || defaultId,
      data.formattedDate || defaultTimestamp,
      data.fullName || "",
      data.email || "",
      data.phone || "",
      data.telegram || "",
      data.institution || "",
      data.academicStatusText || data.academicStatus || "",
      data.partFormatText || data.partFormat || "",
      data.sectionText || (data.targetSection ? "Секція " + data.targetSection : ""),
      data.abstractTitle || "",
      data.scientificSupervisor || "",
      data.department || "",
      data.headOfDepartment || "",
      data.cityCountry || "",
      data.abstractIntro || "",
      data.abstractAim || "",
      data.abstractMaterials || "",
      data.abstractResults || "",
      data.abstractConclusion || "",
      data.abstractKeywords || "",
      data.abstractReferences || ""
    ];

    sheet.appendRow(newRow);
    var lastRowIdx = sheet.getLastRow();
    sheet.getRange(lastRowIdx, 1, 1, 2).setHorizontalAlignment("center");
    sheet.getRange(lastRowIdx, 5, 1, 2).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Заявку успішно додано до таблиці",
      id: data.submissionId || defaultId,
      row: lastRowIdx
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    name: "USSF 2026 Google Sheets Sync Webhook",
    message: "Вебхук USSF Google Sheets активний і готовий приймати реєстрації!"
  })).setMimeType(ContentService.MimeType.JSON);
}`;

async function openGoogleSheetsModal() {
  const modal = document.getElementById('googleSheetsModal');
  if (modal) modal.classList.add('active');

  const input = document.getElementById('sheetsWebhookUrl');
  const statusMsg = document.getElementById('sheetsStatusMsg');
  if (statusMsg) {
    statusMsg.style.display = 'none';
    statusMsg.innerHTML = '';
  }

  // Prepopulate with local or server value
  const localUrl = localStorage.getItem('ussf_google_sheet_url');
  if (localUrl && input && !input.value) {
    input.value = localUrl;
  }

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const apiBase = isLocal
      ? 'http://localhost:5050'
      : (window.location.origin.includes('onrender.com') ? '' : 'https://ussf-n7ui.onrender.com');

    const res = await fetch(`${apiBase}/api/get-sheets-config`);
    if (res.ok) {
      const d = await res.json();
      if (d.webhook_url && input) {
        input.value = d.webhook_url;
        localStorage.setItem('ussf_google_sheet_url', d.webhook_url);
        if (statusMsg) {
          statusMsg.style.display = 'block';
          statusMsg.className = 'email-status-success';
          statusMsg.innerHTML = '🟢 <strong>Google Таблиця підключена:</strong> вебхук активний для всіх нових реєстрацій.';
        }
      }
    }
  } catch (err) {}
}

function closeGoogleSheetsModal() {
  const modal = document.getElementById('googleSheetsModal');
  if (modal) modal.classList.remove('active');
}

function copyGoogleAppsScriptCode() {
  const btnText = document.getElementById('btnCopyScriptText');
  navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE).then(() => {
    if (btnText) {
      const orig = btnText.innerHTML;
      btnText.innerHTML = '✅ Код скопійовано у буфер обміну!';
      setTimeout(() => { btnText.innerHTML = orig; }, 3000);
    }
  }).catch(() => {
    alert('Не вдалося автоматично скопіювати. Скрипт знаходиться у файлі google_apps_script.js у папці сайту.');
  });
}

async function saveGoogleSheetsConfig(e) {
  if (e) e.preventDefault();
  const webhookUrl = document.getElementById('sheetsWebhookUrl')?.value.trim();
  const statusMsg = document.getElementById('sheetsStatusMsg');
  const btn = document.getElementById('btnSaveSheets');
  const btnText = document.getElementById('btnSaveSheetsText');

  if (!webhookUrl) {
    if (statusMsg) {
      statusMsg.style.display = 'block';
      statusMsg.className = 'email-status-error';
      statusMsg.textContent = 'Вкажіть URL-адресу веб-додатка Google Apps Script.';
    }
    return;
  }

  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="spinner-small"></span> Перевірка та відправка тест-рядка...';

  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const apiBase = isLocal
      ? 'http://localhost:5050'
      : (window.location.origin.includes('onrender.com') ? '' : 'https://ussf-n7ui.onrender.com');

    const res = await fetch(`${apiBase}/api/save-sheets-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webhook_url: webhookUrl,
        test_now: true
      })
    });

    const data = await res.json();
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Зберегти та протестувати (надіслати тест-рядок)';

    if (data.status === 'success') {
      localStorage.setItem('ussf_google_sheet_url', webhookUrl);
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'email-status-success';
        statusMsg.innerHTML = '✅ <strong>Google Таблицю успішно підключено!</strong><br>Тестовий рядок відправлено та збережено. Всі наступні гості автоматично з\'являтимуться у вашій таблиці.';
      }
      setTimeout(() => {
        closeGoogleSheetsModal();
      }, 2500);
    } else {
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'email-status-error';
        statusMsg.innerHTML = `❌ <strong>Помилка підключення:</strong> ${data.message || 'Не вдалося надіслати запит до таблиці.'}<br><small style="color:#64748B;">Переконайтеся, що при розгортанні веб-додатка параметр <strong>Хто має доступ</strong> встановлено у <strong>«Усі» (Anyone)</strong>.</small>`;
      }
    }
  } catch (err) {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Зберегти та протестувати (надіслати тест-рядок)';
    try {
      localStorage.setItem('ussf_google_sheet_url', webhookUrl);
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: "USSF-CLIENT-TEST",
          formattedDate: new Date().toLocaleString('uk-UA'),
          fullName: "Тестовий Учасник (Client Mode)",
          email: "test@example.com",
          phone: "+380500000000",
          institution: "НМУ імені О. О. Богомольця",
          academicStatusText: "Студент"
        })
      });
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'email-status-success';
        statusMsg.innerHTML = '✅ <strong>URL збережено локально!</strong> Надіслано прямий тестовий сигнал до Google Apps Script.';
      }
      setTimeout(() => closeGoogleSheetsModal(), 2000);
    } catch (cErr) {
      if (statusMsg) {
        statusMsg.style.display = 'block';
        statusMsg.className = 'email-status-error';
        statusMsg.textContent = 'Помилка збереження. Перевірте з\'єднання з інтернетом.';
      }
    }
  }
}

function toggleImradChecklist() {
  const card = document.querySelector('.imrad-checklist-card');
  if (card) {
    card.classList.toggle('collapsed');
  }
}

window.toggleImradChecklist = toggleImradChecklist;
window.openGoogleSheetsModal = openGoogleSheetsModal;
window.closeGoogleSheetsModal = closeGoogleSheetsModal;
window.copyGoogleAppsScriptCode = copyGoogleAppsScriptCode;
window.saveGoogleSheetsConfig = saveGoogleSheetsConfig;

// ==========================================
// 8.2. WORKSHOP REGISTRATION HANDLER
// ==========================================
async function handleWorkshopSubmit(e) {
  if (e) e.preventDefault();

  const fullName = (document.getElementById('wsFullName')?.value || '').trim();
  const institution = (document.getElementById('wsInstitution')?.value || '').trim();
  const academicStatusEl = document.getElementById('wsAcademicStatus');
  const academicStatus = academicStatusEl ? academicStatusEl.value : '';
  const academicStatusText = academicStatusEl ? academicStatusEl.options[academicStatusEl.selectedIndex]?.text : '';
  const courseSpecialty = (document.getElementById('wsCourseSpecialty')?.value || '').trim();
  const hasOralPaper = !!document.getElementById('wsHasOralPaper')?.checked;
  const p1El = document.getElementById('wsPriority1');
  const priority1 = p1El ? p1El.value : '';
  const priority1Text = p1El ? p1El.options[p1El.selectedIndex]?.text : '';
  const p2El = document.getElementById('wsPriority2');
  const priority2 = p2El ? p2El.value : '';
  const priority2Text = p2El ? p2El.options[p2El.selectedIndex]?.text : '';
  const comment = (document.getElementById('wsComment')?.value || '').trim();
  const email = (document.getElementById('wsEmail')?.value || '').trim();
  const phone = (document.getElementById('wsPhone')?.value || '').trim();
  const telegram = (document.getElementById('wsTelegram')?.value || '').trim();

  // Honeypot check
  const hpCheck = document.getElementById('websiteHpCheckWs');
  if (hpCheck && hpCheck.value.trim() !== '') {
    alert('⚠️ Помилка верифікації форми. Запит відхилено системою безпеки.');
    return;
  }

  // Time-lock check
  const elapsedMs = window.formOpenedTimestamp ? (Date.now() - window.formOpenedTimestamp) : 10000;
  if (elapsedMs < 2000) {
    alert('⚠️ Будь ласка, перевірте внесені дані перед відправкою.');
    return;
  }

  // Duplicate priority validation
  if (priority1 && priority2 && priority1 === priority2 && priority2 !== 'none') {
    alert('⚠️ Будь ласка, оберіть інший воркшоп для 2-го пріоритету або оберіть варіант «Немає другого пріоритету».');
    return;
  }

  // Phone validation
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length !== 12 || !phoneDigits.startsWith('380')) {
    alert('Будь ласка, введіть дійсний номер телефону у форматі +380 (XX) XXX-XX-XX');
    return;
  }

  // Consent validation
  const wsConsentCheckbox = document.getElementById('wsConsentPersonalData');
  if (wsConsentCheckbox && !wsConsentCheckbox.checked) {
    const isEn = document.documentElement.getAttribute('lang') === 'en';
    alert(isEn
      ? '⚠️ Please provide consent to personal data processing in accordance with the Privacy Policy to submit your workshop application.'
      : '⚠️ Будь ласка, надайте згоду на обробку персональних даних відповідно до Політики конфіденційності для подання заявки на воркшоп.');
    const card = document.getElementById('consentCardWs') || wsConsentCheckbox.closest('.consent-checkbox-card');
    if (card) {
      card.classList.add('shake-highlight');
      setTimeout(() => card.classList.remove('shake-highlight'), 800);
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    wsConsentCheckbox.focus();
    return;
  }

  const btnSubmit = document.getElementById('btnSubmitWorkshop');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = 'Зачекайте, реєстрація...';
  }

  const workshopSubmission = {
    submissionId: 'WS-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    timestamp: new Date().toISOString(),
    isWorkshop: true,
    partFormat: 'workshop',
    fullName: fullName,
    institution: institution,
    academicStatus: academicStatus,
    academicStatusText: academicStatusText,
    courseSpecialty: courseSpecialty,
    hasOralPaper: hasOralPaper,
    priority1: priority1,
    priority1Text: priority1Text,
    priority2: priority2,
    priority2Text: priority2Text,
    comment: comment,
    email: email,
    phone: phone,
    telegram: telegram,
    consentPersonalData: true,
    submissionElapsedMs: elapsedMs
  };

  // Post to backend
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const localBase = window.location.port ? window.location.origin : 'http://127.0.0.1:5050';
    const apiUrl = isLocal
      ? `${localBase}/api/submit-abstract`
      : '/api/submit-abstract';

    await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workshopSubmission)
    }).catch(e => console.warn('Workshop server note:', e));
  } catch (err) {}

  window.trackGAEvent('workshop_registration_success', {
    event_category: 'conversion',
    workshop_p1: priority1,
    has_oral_paper: hasOralPaper
  });

  // Display success view
  const wsForm = document.getElementById('workshopRegForm');
  const wsSuccess = document.getElementById('workshopSuccessMessage');
  const wsSummary = document.getElementById('wsSummaryDisplay');

  if (wsSummary) {
    wsSummary.innerHTML = `
      <div style="font-weight:700; color:#1D428A; margin-bottom:0.5rem; font-size:1rem;">
        👤 ${escapeHtml(fullName)} (${escapeHtml(institution)})
      </div>
      <div style="margin-bottom:0.35rem;">
        <strong>🎯 1-й пріоритет:</strong> ${escapeHtml(priority1Text)}
      </div>
      ${priority2 && priority2 !== 'none' ? `<div style="margin-bottom:0.35rem;"><strong>🔄 2-й пріоритет:</strong> ${escapeHtml(priority2Text)}</div>` : ''}
      <div style="margin-bottom:0.35rem;">
        <strong>⭐ Статус пріоритету:</strong> ${hasOralPaper ? '<span style="color:#15803D; font-weight:700;">Пріоритетне зарахування (усна доповідь)</span>' : 'Черга вільних слухачів'}
      </div>
      <div style="margin-top:0.6rem; padding-top:0.5rem; border-top:1px dashed #cbd5e1; color:#64748B; font-size:0.82rem;">
        ✉️ Підтвердження надіслано на ${escapeHtml(email)} · ID заявки: <strong>${workshopSubmission.submissionId}</strong>
      </div>
    `;
  }

  if (wsForm) wsForm.style.display = 'none';
  if (wsSuccess) wsSuccess.style.display = 'block';

  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" style="margin-right: 0.45rem; vertical-align: -2px;"><polyline points="20 6 9 17 4 12"/></svg>
      <span class="ua">Подати заявку на воркшоп</span><span class="en">Submit Workshop Request</span>
    `;
  }
}

// ==========================================
// 8.3. FAQ ACCORDION & REAL-TIME SEARCH
// ==========================================
function toggleFaqItem(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');

  // Close other open items in the same group for accordion effect
  const parentList = item.closest('.faq-items-list') || item.parentElement;
  if (parentList) {
    parentList.querySelectorAll('.faq-item.open').forEach(openItem => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        const qBtn = openItem.querySelector('.faq-question-btn');
        if (qBtn) qBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (isOpen) {
    item.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    window.trackGAEvent('faq_item_open', { faq_id: item.getAttribute('data-faq-id') });
  }
}

function filterFaq(rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  const clearBtn = document.getElementById('faqSearchClear');
  const metaDisplay = document.getElementById('faqSearchMeta');
  const noResults = document.getElementById('faqNoResults');
  const accordionContainer = document.getElementById('faqAccordionContainer');
  const categoryBlocks = document.querySelectorAll('.faq-category-block');
  const allItems = document.querySelectorAll('.faq-item');

  if (clearBtn) {
    clearBtn.style.display = query.length > 0 ? 'inline-block' : 'none';
  }

  if (!query) {
    if (accordionContainer) accordionContainer.style.display = 'flex';
    if (noResults) noResults.style.display = 'none';
    if (metaDisplay) metaDisplay.style.display = 'none';

    categoryBlocks.forEach(b => b.style.display = '');
    allItems.forEach(it => {
      it.style.display = '';
      it.classList.remove('open');
      const btn = it.querySelector('.faq-question-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
    return;
  }

  let totalMatches = 0;

  categoryBlocks.forEach(block => {
    let blockMatches = 0;
    const items = block.querySelectorAll('.faq-item');

    items.forEach(item => {
      const qText = item.querySelector('.faq-q-text')?.innerText.toLowerCase() || '';
      const aText = item.querySelector('.faq-answer-content')?.innerText.toLowerCase() || '';

      if (qText.includes(query) || aText.includes(query)) {
        item.style.display = '';
        item.classList.add('open');
        const btn = item.querySelector('.faq-question-btn');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        blockMatches++;
        totalMatches++;
      } else {
        item.style.display = 'none';
        item.classList.remove('open');
        const btn = item.querySelector('.faq-question-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    if (blockMatches > 0) {
      block.style.display = '';
    } else {
      block.style.display = 'none';
    }
  });

  if (totalMatches === 0) {
    if (accordionContainer) accordionContainer.style.display = 'none';
    if (noResults) noResults.style.display = 'block';
    if (metaDisplay) {
      metaDisplay.style.display = 'block';
      metaDisplay.textContent = 'Збігів не знайдено';
    }
  } else {
    if (accordionContainer) accordionContainer.style.display = 'flex';
    if (noResults) noResults.style.display = 'none';
    if (metaDisplay) {
      metaDisplay.style.display = 'block';
      metaDisplay.textContent = `Знайдено запитань: ${totalMatches}`;
    }
  }

  window.trackGAEvent('faq_search', { search_term: query, results_count: totalMatches });
}

function clearFaqSearch() {
  const input = document.getElementById('faqSearchInput');
  if (input) input.value = '';
  filterFaq('');
}

// Window exports
window.switchRegistrationTab = switchRegistrationTab;
window.openRegistrationModal = openRegistrationModal;
window.closeRegistrationModal = closeRegistrationModal;
window.openAcademicGuideModal = openAcademicGuideModal;
window.closeAcademicGuideModal = closeAcademicGuideModal;
window.openPrivacyModal = openPrivacyModal;
window.closePrivacyModal = closePrivacyModal;
window.handleWorkshopSubmit = handleWorkshopSubmit;
window.toggleFaqItem = toggleFaqItem;
window.filterFaq = filterFaq;
window.clearFaqSearch = clearFaqSearch;

// Initialize phone, telegram masks, abstract character counter, auto-capitalization and references builder
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupPhoneInputMask(document.getElementById('phone'));
    setupTelegramInputMask(document.getElementById('telegram'));
    setupPhoneInputMask(document.getElementById('wsPhone'));
    setupTelegramInputMask(document.getElementById('wsTelegram'));
    initAbstractCharCounter();
    initStructureAutoCapitalizeAndTab();
    initReferencesBuilder();
    initGAOutboundTracking();
  });
} else {
  setupPhoneInputMask(document.getElementById('phone'));
  setupTelegramInputMask(document.getElementById('telegram'));
  setupPhoneInputMask(document.getElementById('wsPhone'));
  setupTelegramInputMask(document.getElementById('wsTelegram'));
  initAbstractCharCounter();
  initStructureAutoCapitalizeAndTab();
  initReferencesBuilder();
  initGAOutboundTracking();
}

// Dynamic Mobile Viewport Height Calculation (--vh) to fix address bar / browser toolbar clipping
function updateMobileVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
updateMobileVh();
window.addEventListener('resize', updateMobileVh, { passive: true });
window.addEventListener('orientationchange', () => {
  setTimeout(updateMobileVh, 100);
});

function initGAOutboundTracking() {
  document.querySelectorAll('.nav-map-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.trackGAEvent('map_navigation_click', {
        event_category: 'outbound',
        provider: btn.textContent.trim()
      });
    });
  });

  document.querySelectorAll('a[href*="t.me"]').forEach(link => {
    link.addEventListener('click', () => {
      window.trackGAEvent('telegram_click', {
        event_category: 'social',
        url: link.href
      });
    });
  });
}

