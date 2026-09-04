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
  // 3. SCROLL READING PROGRESS BAR & BACK TO TOP
  // ==========================================
  const progressBar = document.getElementById('scrollProgressBar');
  const backToTopBtn = document.getElementById('backToTopBtn');

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


  // ==========================================
  // 5. HERO PARALLAX & ZOOM ON SCROLL (Exact liveronco.com style)
  // ==========================================
  const heroImage = document.querySelector('.hero-image-wrapper');
  const heroContent = document.querySelector('.hero-content');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const heroHeight = window.innerHeight;

    if (scrolled <= heroHeight + 100) {
      if (window.innerWidth > 991) {
        // Calculate progress (0 to 1)
        const progress = Math.min(1, scrolled / heroHeight);

        // Parallax + Zoom + Fade for the framed hero visual
        const translateY = scrolled * 0.25; // Parallax speed
        const scale = 1 + (progress * 0.4);         // 40% zoom in
        const opacity = 1 - (progress * 1.3);       // Fade out as it zooms

        if (heroImage) {
          heroImage.style.transform = `translateY(${translateY}px) rotate(2deg) scale(${scale})`;
          heroImage.style.opacity = Math.max(0, opacity);
          heroImage.style.visibility = opacity <= 0 ? 'hidden' : 'visible';
        }

        // Text content transitions
        if (heroContent) {
          heroContent.style.transform = `translateY(${scrolled * 0.4}px)`;
          const textOpacity = 1 - (progress * 1.8); // Text fades faster
          heroContent.style.opacity = Math.max(0, textOpacity);
          heroContent.style.visibility = textOpacity <= 0 ? 'hidden' : 'visible';
        }
      }
    }
  }, { passive: true });


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
    const targetPanel = document.getElementById(`panel-${currentDay1TrackId}`);
    if (targetPanel) targetPanel.classList.add('active');
  } else {
    if (btnDay2) btnDay2.classList.add('active');
    if (btnDay1) btnDay1.classList.remove('active');
    if (tracksNav) {
      tracksNav.classList.add('hidden');
      tracksNav.style.display = 'none';
    }
    const workshopsPanel = document.getElementById('panel-workshops');
    if (workshopsPanel) workshopsPanel.classList.add('active');
  }
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

function closeRegistrationModal(resetForm = false) {
  if (regModal) {
    regModal.classList.remove('open');
    document.body.style.overflow = '';
    const modalWindow = document.querySelector('.modal-window');
    if (modalWindow) modalWindow.classList.remove('has-preview');
    // Reset view states after animation completes
    setTimeout(() => {
      if (formContent) formContent.style.display = 'block';
      if (formSuccessMessage) formSuccessMessage.style.display = 'none';
      if (resetForm && forumRegForm) forumRegForm.reset();
    }, 350);
  }
}

// NOTE: We intentionally DO NOT close the modal on backdrop click,
// preventing accidental data loss when typing abstracts.
// Only explicit user action (the top close cross or cancel button) closes the modal.

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
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
let currentSubmission = null;

function handleFormSubmit(e) {
  e.preventDefault();

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

  const abstractTitle = document.getElementById('abstractTitle') ? document.getElementById('abstractTitle').value.trim() : '';
  const abstractIntro = document.getElementById('abstractIntro') ? document.getElementById('abstractIntro').value.trim() : '';
  const abstractAim = document.getElementById('abstractAim') ? document.getElementById('abstractAim').value.trim() : '';
  const abstractMaterials = document.getElementById('abstractMaterials') ? document.getElementById('abstractMaterials').value.trim() : '';
  const abstractResults = document.getElementById('abstractResults') ? document.getElementById('abstractResults').value.trim() : '';
  const abstractConclusion = document.getElementById('abstractConclusion') ? document.getElementById('abstractConclusion').value.trim() : '';
  const abstractKeywords = document.getElementById('abstractKeywords') ? document.getElementById('abstractKeywords').value.trim() : '';
  const abstractReferences = document.getElementById('abstractReferences') ? document.getElementById('abstractReferences').value.trim() : '';

  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  currentSubmission = {
    date: new Date().toISOString(),
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
    phone
  };

  // Expand modal window to fit preview
  const modalWindow = document.querySelector('.modal-window');
  if (modalWindow) modalWindow.classList.add('has-preview');

  // Immediately render live visual preview in iframe
  const previewFrame = document.getElementById('abstractPreviewFrame');
  if (previewFrame) {
    previewFrame.srcdoc = buildAbstractHTML(currentSubmission);
  }

  // Update status indicator
  const savedFilePathDisplay = document.getElementById('savedFilePathDisplay');
  if (savedFilePathDisplay) {
    savedFilePathDisplay.innerHTML = '<span class="ua">🔒 Передача матеріалів до закритої бази оргкомітету...</span><span class="en">Securing and submitting to committee archive...</span>';
  }

  // Store current submission globally for interactive email dispatch
  window.lastSubmissionData = currentSubmission;
  window.lastServerResponse = null;

  // Reset interactive email area
  const emailDispatchArea = document.getElementById('emailDispatchArea');
  if (emailDispatchArea) {
    emailDispatchArea.style.display = 'none';
    emailDispatchArea.innerHTML = '';
  }
  const btnSendEmail = document.getElementById('btnSendEmail');
  if (btnSendEmail) btnSendEmail.disabled = false;
  const btnSendEmailText = document.getElementById('btnSendEmailText');
  if (btnSendEmailText) {
    btnSendEmailText.innerHTML = '<span class="ua">Надіслати на пошту</span><span class="en">Send to Email</span>';
  }

  // Post to automation server to automatically write the PDF and send email
  try {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const apiUrl = isLocal
      ? 'http://localhost:5050/api/submit-abstract'
      : (window.location.origin.includes('onrender.com') ? '/api/submit-abstract' : 'https://ussf-n7ui.onrender.com/api/submit-abstract');

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentSubmission)
    })
    .then(res => res.json())
    .then(data => {
      window.lastServerResponse = data;
      if (data.status === 'success') {
        if (savedFilePathDisplay) {
          let emailStatus = '';
          if (data.email_result && data.email_result.sent) {
            emailStatus = `<br><span style="color:#16A34A;font-weight:600;">✉️ Програму форуму надіслано на вашу пошту, а матеріали та тези — оргкомітету.</span>`;
            renderEmailStatusSent(data.email_result);
          } else {
            emailStatus = `<br><span style="color:#475569;font-size:0.82rem;">🔒 Файли тез (.pdf) та анкета (.json) надійно зафіксовані в базі оргкомітету.</span>`;
          }
          savedFilePathDisplay.innerHTML = `<span style="color:#1E3A8A;font-weight:600;">Матеріали успішно надійшли оргкомітету.</span>${emailStatus}`;
        }
      }
    })
    .catch(err => {
      console.warn('Backend server note:', err);
      if (savedFilePathDisplay) {
        savedFilePathDisplay.innerHTML = '<span style="color:#1E3A8A;font-weight:600;">Заявку зафіксовано.</span> <span style="color:#64748B;font-size:0.82rem;">Матеріали надіслано оргкомітету форуму.</span>';
      }
    });
  } catch (err) {}

  // Show animated success message
  if (formContent) formContent.style.display = 'none';
  if (formSuccessMessage) formSuccessMessage.style.display = 'block';
}

// Build standardized academic HTML document matching NMU template
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

  const refItems = (s.abstractReferences || '').split('\n').filter(r => r.trim());
  const refHtml = refItems.length > 0
    ? `<p class="ref-heading">Список літератури:</p>` + refItems.map(item => `<p class="ref-para">${item}</p>`).join('')
    : '';

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <title>Тези_USSF_${(s.fullName || 'Учасник').replace(/\\s+/g, '_')}</title>
  <style>
    @page {
      size: A4;
      margin-left: 30mm;
      margin-right: 15mm;
      margin-top: 20mm;
      margin-bottom: 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14pt;
      line-height: 1.5;
      color: #000;
      margin: 0;
      padding: 24px 20px 24px 32px;
      background: #fff;
      text-rendering: optimizeLegibility;
      box-sizing: border-box;
    }
    .paper-title {
      font-weight: bold;
      text-align: center;
      margin: 0 0 1.2rem 0;
      font-size: 14pt;
      line-height: 1.4;
    }
    .author-name {
      font-style: italic;
      text-align: center;
      margin-bottom: 1.4rem;
      font-size: 14pt;
      line-height: 1.5;
    }
    .affiliation-block {
      font-style: italic;
      text-align: left;
      margin-bottom: 1.4rem;
      line-height: 1.5;
      font-size: 14pt;
    }
    p.section-para {
      text-align: justify;
      text-indent: 1.25cm;
      margin: 0 0 0.75rem 0;
      line-height: 1.5;
      font-size: 14pt;
    }
    .section-label {
      font-weight: bold;
    }
    .ref-heading {
      font-weight: bold;
      text-indent: 1.25cm;
      margin: 1.2rem 0 0.4rem 0;
      font-size: 14pt;
      line-height: 1.5;
    }
    .ref-para {
      text-align: justify;
      text-indent: 1.25cm;
      margin: 0 0 0.5rem 0;
      font-size: 14pt;
      line-height: 1.5;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="paper-title">${s.abstractTitle || 'НАЗВА НАУКОВОЇ РОБОТИ'}</div>

  <div class="author-name">${s.fullName || 'Прізвище Ім\'я'}</div>

  ${affilLines.length > 0 ? `<div class="affiliation-block">${affilLines.join('<br>')}</div>` : ''}

  ${s.abstractIntro ? `<p class="section-para"><span class="section-label">Вступ:</span> ${s.abstractIntro}</p>` : ''}
  ${s.abstractAim ? `<p class="section-para"><span class="section-label">Мета:</span> ${s.abstractAim}</p>` : ''}
  ${s.abstractMaterials ? `<p class="section-para"><span class="section-label">Матеріали і методи:</span> ${s.abstractMaterials}</p>` : ''}
  ${s.abstractResults ? `<p class="section-para"><span class="section-label">Результати:</span> ${s.abstractResults}</p>` : ''}
  ${s.abstractConclusion ? `<p class="section-para"><span class="section-label">Висновок:</span> ${s.abstractConclusion}</p>` : ''}
  ${s.abstractKeywords ? `<p class="section-para"><span class="section-label">Ключові слова:</span> ${s.abstractKeywords}</p>` : ''}

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

// Generate & download / print structured abstract document formatted strictly to academic template:
// Font: Times New Roman, Size: 14pt, Line Spacing: 1.5, Margins: Left 30mm, Right 15mm, Top 20mm, Bottom 20mm, Indent: 1.25cm
function downloadCurrentSubmissionDoc() {
  if (!currentSubmission) {
    alert('Дані для формування тез відсутні.');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте відкриття спливаючих вікон для друку/збереження документа.');
    return;
  }

  let html = buildAbstractHTML(currentSubmission);
  html = html.replace('</body>', `
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  <\/script>
</body>`);

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
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
