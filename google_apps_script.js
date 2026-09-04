/**
 * =========================================================================
 * Google Apps Script для автоматичної синхронізації реєстрацій з сайту
 * I Всеукраїнського студентського хірургічного форуму (USSF 2026)
 * =========================================================================
 * 
 * ІНСТРУКЦІЯ З ПІДКЛЮЧЕННЯ (2 хвилини):
 * 1. Відкрийте ваш Google Диск (drive.google.com) та створіть нову порожню Google Таблицю
 *    (назвіть її, наприклад, "USSF 2026 - Заявки учасників").
 * 2. У верхньому меню таблиці натисніть: Розширення (Extensions) -> Apps Script.
 * 3. Видаліть увесь стандартний код у редакторі та повністю вставте весь цей файл.
 * 4. Натисніть кнопку "Зберегти" (іконка дискети або Ctrl+S).
 * 5. У правому верхньому кутку натисніть синю кнопку:
 *    "Розгорнути" (Deploy) -> "Нове розгортання" (New deployment).
 * 6. Натисніть на шестірню "Виберіть тип" (Select type) -> "Веб-додаток" (Web app).
 * 7. Вкажіть налаштування:
 *    - Опис: "USSF Registration Webhook"
 *    - Виконувати від імені (Execute as): "Я" (Me / ваш акаунт)
 *    - Хто має доступ (Who has access): "Усі" (Anyone)  <--- ОБОВ'ЯЗКОВО!
 * 8. Натисніть "Розгорнути" (Deploy) та підтвердьте дозволи (Натисніть "Advanced" -> "Go to (unsafe)" -> "Allow").
 * 9. Скопіюйте отриманий "URL-адреса веб-додатка" (починається з https://script.google.com/macros/s/...)
 *    та вставте його у налаштування сайту!
 * 
 * Таблиця САМА створить усі потрібні стовпці при першому ж зверненні.
 * =========================================================================
 */

// Визначення заголовків стовпців
var COLUMN_HEADERS = [
  "№ / ID Заявки",
  "Дата і час реєстрації",
  "ПІБ учасника",
  "Email адреса",
  "Контактний телефон",
  "Telegram",
  "Навчальний заклад / Установа",
  "Статус учасника",
  "Форма участі",
  "Секція форуму",
  "Тема наукової роботи / тез",
  "Науковий керівник",
  "Кафедра",
  "Завідувач кафедри",
  "Місто, країна",
  "Вступ",
  "Мета",
  "Матеріали і методи",
  "Результати",
  "Висновок",
  "Ключові слова",
  "Список літератури"
];

/**
 * Автоматична ініціалізація шапки таблиці, якщо вона порожня
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMN_HEADERS);
    var headerRange = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#1D428A"); // Фірмовий темно-синій колір НМУ
    headerRange.setFontColor("#FFFFFF");
    headerRange.setHorizontalAlignment("center");
    headerRange.setVerticalAlignment("middle");
    sheet.setRowHeight(1, 38);
    sheet.setFrozenRows(1); // Закріпити шапку при прокручуванні вниз
  }
}

/**
 * Обробка POST запитів від веб-сайту
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Очікуємо до 10 секунд на чергу записів, щоб уникнути конфліктів при одночасному надсиланні
    lock.waitLock(10000);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    ensureHeaders(sheet);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var rowNumber = sheet.getLastRow() + 1;
    var now = new Date();
    var defaultTimestamp = Utilities.formatDate(now, "GMT+3", "dd.MM.yyyy HH:mm:ss");
    var defaultId = "USSF-" + Utilities.formatDate(now, "GMT+3", "yyyyMMdd") + "-" + ("000" + (rowNumber - 1)).slice(-4);

    var submissionId = data.submissionId || defaultId;
    var registrationDate = data.formattedDate || defaultTimestamp;

    var newRow = [
      submissionId,
      registrationDate,
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

    // Центруємо стовпці з ID, датою, телефоном та Telegram для кращої читабельності
    var lastRowIdx = sheet.getLastRow();
    sheet.getRange(lastRowIdx, 1, 1, 2).setHorizontalAlignment("center");
    sheet.getRange(lastRowIdx, 5, 1, 2).setHorizontalAlignment("center");

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Заявку успішно додано до таблиці",
      id: submissionId,
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

/**
 * Обробка GET запиту для швидкої перевірки статусу в браузері
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    name: "USSF 2026 Google Sheets Sync Webhook",
    timestamp: new Date().toISOString(),
    message: "Вебхук USSF Google Sheets активний і готовий приймати реєстрації!"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Тестова функція для запуску прямо в редакторі Apps Script (кнопка 'Run')
 */
function testAddRow() {
  var dummyEvent = {
    postData: {
      contents: JSON.stringify({
        submissionId: "USSF-TEST-0001",
        formattedDate: Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy HH:mm:ss"),
        fullName: "Тестовий Учасник Тестович",
        email: "test@example.com",
        phone: "+380501234567",
        institution: "НМУ імені О. О. Богомольця",
        academicStatusText: "Студент",
        partFormatText: "Усна доповідь + публікація тез",
        sectionText: "Секція 1: Сучасні питання лікування бойової травми",
        abstractTitle: "Тестова тема наукової роботи",
        scientificSupervisor: "д.мед.н., проф. Шевченко Т. Г.",
        department: "Кафедра хірургії №1",
        headOfDepartment: "д.мед.н., проф. Франко І. Я.",
        cityCountry: "м. Київ, Україна",
        abstractIntro: "Тестовий вступ дослідження.",
        abstractAim: "Тестова мета дослідження.",
        abstractMaterials: "Тестові матеріали та методи.",
        abstractResults: "Тестові результати.",
        abstractConclusion: "Тестовий висновок.",
        abstractKeywords: "хірургія, тест, форум",
        abstractReferences: "1. Тестове джерело 2026."
      })
    }
  };
  var res = doPost(dummyEvent);
  Logger.log(res.getContent());
}
