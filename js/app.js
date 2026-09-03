/**
 * I Всеукраїнський студентський хірургічний форум (USSF)
 * Interactive Controller (Inspired by liveronco.com)
 */

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
  }

  function toggleLanguage() {
    applyLanguage(currentLang === 'ua' ? 'en' : 'ua');
  }

  if (langToggle) langToggle.addEventListener('click', toggleLanguage);
  if (langToggleMobile) langToggleMobile.addEventListener('click', toggleLanguage);


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
  // 4. SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ==========================================
  const reveals = document.querySelectorAll('.reveal, .reveal-left');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));


  // ==========================================
  // 5. ACTIVE NAVIGATION LINKS ON SCROLL
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
// 6. PROGRAM TABS SWITCHER
// ==========================================
function switchTab(tabId) {
  // Update button states
  const tabButtons = document.querySelectorAll('.program-tabs .tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));

  // Update panels
  const panels = document.querySelectorAll('.program-panel');
  panels.forEach(panel => panel.classList.remove('active'));

  const activePanel = document.getElementById(`panel-${tabId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Highlight matching button
  const currentBtn = Array.from(tabButtons).find(btn => 
    btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)
  );
  if (currentBtn) {
    currentBtn.classList.add('active');
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
// 8. REGISTRATION MODAL CONTROLS
// ==========================================
const regModal = document.getElementById('regModal');
const formContent = document.getElementById('formContent');
const formSuccessMessage = document.getElementById('formSuccessMessage');
const forumRegForm = document.getElementById('forumRegForm');

function openRegistrationModal() {
  if (regModal) {
    regModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeRegistrationModal() {
  if (regModal) {
    regModal.classList.remove('open');
    document.body.style.overflow = '';
    // Reset success message after delay
    setTimeout(() => {
      if (formContent) formContent.style.display = 'block';
      if (formSuccessMessage) formSuccessMessage.style.display = 'none';
      if (forumRegForm) forumRegForm.reset();
    }, 350);
  }
}

// Close when clicking overlay backdrop
if (regModal) {
  regModal.addEventListener('click', (e) => {
    if (e.target === regModal) {
      closeRegistrationModal();
    }
  });
}

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && regModal && regModal.classList.contains('open')) {
    closeRegistrationModal();
  }
});

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
  }
}

// Handle Form Submission
function handleFormSubmit(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;

  console.log('Registration submitted:', { fullName, email });

  // Show animated success message
  if (formContent) formContent.style.display = 'none';
  if (formSuccessMessage) formSuccessMessage.style.display = 'block';
}
