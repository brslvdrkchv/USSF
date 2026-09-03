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
  if (e.key === 'Escape' && regModal && regModal.classList.contains('open')) {
    closeRegistrationModal(false);
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

  // Persist submission to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('ussf_submissions') || '[]');
    existing.push(currentSubmission);
    localStorage.setItem('ussf_submissions', JSON.stringify(existing));
  } catch (err) {
    console.warn('LocalStorage error:', err);
  }

  // Expand modal window to fit preview
  const modalWindow = document.querySelector('.modal-window');
  if (modalWindow) modalWindow.classList.add('has-preview');

  // Immediately render live visual preview in iframe
  const previewFrame = document.getElementById('abstractPreviewFrame');
  if (previewFrame) {
    previewFrame.srcdoc = buildAbstractHTML(currentSubmission);
  }

  // Update save status indicator
  const savedFilePathDisplay = document.getElementById('savedFilePathDisplay');
  if (savedFilePathDisplay) {
    savedFilePathDisplay.textContent = 'Збереження у папку заявки_тези на вашому пристрої...';
  }

  // Configure mailto link
  const successEmailLink = document.getElementById('successEmailLink');
  if (successEmailLink) {
    const subject = encodeURIComponent(`[USSF 2026 Тези] ${fullName} - ${abstractTitle || 'Наукова робота'}`);
    const bodyLines = [
      `Шановний оргкомітет USSF 2026!`,
      ``,
      `Надсилаю наукові тези на розгляд для участі у форумі за офіційним шаблоном.`,
      ``,
      `--- ДАНІ АВТОРА ТА КАФЕДРИ ---`,
      `ПІБ Автора: ${fullName}`,
      `Установа: ${institution}`,
      `Кафедра: ${department}`,
      `Завідувач кафедри: ${headOfDepartment}`,
      `Науковий керівник: ${scientificSupervisor}`,
      `Місто, Країна: ${cityCountry}`,
      `Статус: ${academicStatusText}`,
      `Форма участі: ${partFormatText}`,
      `Секція: ${sectionText}`,
      `Email: ${email}`,
      `Телефон: ${phone}`,
      ``,
      `--- ТЕЗИ ДОПОВІДІ ---`,
      `НАЗВА: ${abstractTitle}`,
      ``,
      `ВСТУП:`,
      `${abstractIntro}`,
      ``,
      `МЕТА:`,
      `${abstractAim}`,
      ``,
      `МАТЕРІАЛИ І МЕТОДИ:`,
      `${abstractMaterials}`,
      ``,
      `РЕЗУЛЬТАТИ:`,
      `${abstractResults}`,
      ``,
      `ВИСНОВОК:`,
      `${abstractConclusion}`,
      ``,
      `КЛЮЧОВІ СЛОВА:`,
      `${abstractKeywords}`,
      ``,
      `СПИСОК ЛІТЕРАТУРИ:`,
      `${abstractReferences}`,
      ``,
      `--`,
      `Сформовано автоматично на сайті USSF (НМУ імені О.О. Богомольця)`
    ];
    successEmailLink.href = `mailto:derk.boryslav@gmail.com?subject=${subject}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
  }

  // Post to local automation server to automatically write the PDF to device disk with timestamp
  try {
    fetch('http://localhost:5050/api/submit-abstract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentSubmission)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success' && data.pdf_path) {
        if (savedFilePathDisplay) {
          savedFilePathDisplay.innerHTML = `<strong>${data.pdf_path}</strong>`;
        }
      }
    })
    .catch(err => {
      console.warn('Backend server note:', err);
      if (savedFilePathDisplay) {
        savedFilePathDisplay.innerHTML = 'Файл скомпільовано у браузері. Натисніть <strong>«Завантажити PDF»</strong> для збереження на диск.';
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
