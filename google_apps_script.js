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
  "Список літератури",
  "Файл тез (.docx на Google Диску)"
];

/**
 * Форматування шапки таблиці у фірмовому стилі форуму
 */
function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
  headerRange.setFontWeight("bold");
  headerRange.setFontFamily("Roboto");
  headerRange.setFontSize(10);
  headerRange.setBackground("#1D428A"); // Фірмовий темно-синій колір НМУ
  headerRange.setFontColor("#FFFFFF");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setWrap(true);
  sheet.setRowHeight(1, 42);
  sheet.setFrozenRows(1); // Закріпити шапку при прокручуванні вниз
}

/**
 * Автоматична ініціалізація шапки таблиці, якщо вона порожня або неповна
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMN_HEADERS);
    formatHeaderRow(sheet);
  } else {
    // Якщо шапка вже створена, перевіряємо наявність усіх 23 стовпчиків
    var lastCol = sheet.getLastColumn();
    if (lastCol < COLUMN_HEADERS.length) {
      for (var col = lastCol + 1; col <= COLUMN_HEADERS.length; col++) {
        sheet.getRange(1, col).setValue(COLUMN_HEADERS[col - 1]);
      }
      formatHeaderRow(sheet);
    }
  }
}

/**
 * Екранування тексту для безпечного запису в Google Таблицю.
 * Якщо текст починається з '+', '=' або '-', Google Таблиці
 * помилково вважають це математичною формулою та видають помилку #ERROR! або #NAME?.
 * Додавання одинарного апострофа на початку ('...) змушує Таблиці відображати значення
 * як чистий текст (при цьому сам апостроф у комірці не видно).
 */
function sanitizeForSheets(val) {
  if (val === null || val === undefined) return "";
  var str = String(val).trim();
  if (str && !str.startsWith("'") && (str.charAt(0) === "+" || str.charAt(0) === "=" || str.charAt(0) === "-")) {
    return "'" + str;
  }
  return str;
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

    // 1. Автоматичне збереження файлу тез у папку "Заяви USSF 2026" на Google Диску
    var docxDriveUrl = "";
    if (data.fileBase64 && data.fileName) {
      try {
        var folderName = data.driveFolderName || "Заяви USSF 2026";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

        var decodedBytes = Utilities.base64Decode(data.fileBase64);
        var blob = Utilities.newBlob(
          decodedBytes,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          data.fileName
        );
        var createdFile = folder.createFile(blob);
        docxDriveUrl = createdFile.getUrl();
      } catch (driveErr) {
        Logger.log("Помилка збереження файлу на Google Диск: " + driveErr.toString());
      }
    }

    var newRow = [
      sanitizeForSheets(submissionId),
      sanitizeForSheets(registrationDate),
      sanitizeForSheets(data.fullName),
      sanitizeForSheets(data.email),
      sanitizeForSheets(data.phone),
      sanitizeForSheets(data.telegram),
      sanitizeForSheets(data.institution),
      sanitizeForSheets(data.academicStatusText || data.academicStatus),
      sanitizeForSheets(data.partFormatText || data.partFormat),
      sanitizeForSheets(data.sectionText || (data.targetSection ? "Секція " + data.targetSection : "")),
      sanitizeForSheets(data.abstractTitle),
      sanitizeForSheets(data.scientificSupervisor),
      sanitizeForSheets(data.department),
      sanitizeForSheets(data.headOfDepartment),
      sanitizeForSheets(data.cityCountry),
      sanitizeForSheets(data.abstractIntro),
      sanitizeForSheets(data.abstractAim),
      sanitizeForSheets(data.abstractMaterials),
      sanitizeForSheets(data.abstractResults || data.abstractBody),
      sanitizeForSheets(data.abstractConclusion),
      sanitizeForSheets(data.abstractKeywords),
      sanitizeForSheets(data.abstractReferences),
      docxDriveUrl ? docxDriveUrl : ""
    ];

    sheet.appendRow(newRow);

    // Центруємо стовпці з ID, датою, телефоном та Telegram для кращої читабельності
    var lastRowIdx = sheet.getLastRow();
    sheet.getRange(lastRowIdx, 1, 1, 2).setHorizontalAlignment("center");
    
    // Встановлюємо формат "Простий текст" (@) для стовпців Телефон (5) та Telegram (6)
    var phoneTelegramRange = sheet.getRange(lastRowIdx, 5, 1, 2);
    phoneTelegramRange.setNumberFormat("@");
    phoneTelegramRange.setHorizontalAlignment("center");

    // Форматуємо посилання на файл Google Drive (стовпець 23) як клікабельний текст
    if (docxDriveUrl) {
      try {
        var fileCell = sheet.getRange(lastRowIdx, 23);
        var richText = SpreadsheetApp.newRichTextValue()
          .setText("📄 Відкрити .docx")
          .setLinkUrl(docxDriveUrl)
          .build();
        fileCell.setRichTextValue(richText);
        fileCell.setHorizontalAlignment("center");
      } catch (linkErr) {
        sheet.getRange(lastRowIdx, 23).setValue(docxDriveUrl);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Заявку успішно додано до таблиці та збережено файл на Google Диск",
      id: submissionId,
      row: lastRowIdx,
      fileUrl: docxDriveUrl
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
 * 🛠️ РОЗУМНЕ ВІДНОВЛЕННЯ ТА ВПОРЯДКУВАННЯ ТАБЛИЦІ (Всі 23 стовпчики)
 * 
 * Як скористатися:
 * 1. У верхньому меню редактора Apps Script у випадаючому списку виберіть "repairAndAlignTable".
 * 2. Натисніть кнопку "Виконати" (Run).
 * 3. Готово! Скрипт автоматично перевірить таблицю, розпізнає стовпчики (навіть якщо ви їх перемістили),
 *    переставить дані у правильний порядок та відновить ідеальні фірмові заголовки!
 */
function repairAndAlignTable() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastCol = Math.max(sheet.getLastColumn(), COLUMN_HEADERS.length);
  var lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    sheet.appendRow(COLUMN_HEADERS);
    formatHeaderRow(sheet);
    Logger.log("✅ Створено нову шапку на порожньому аркуші.");
    return;
  }

  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // Патерни для розпізнавання стовпчиків, якщо назви або порядок було змінено
  var COLUMN_MATCHERS = [
    [/id|номер|№|заявк|submission/i],                        // 1. № / ID Заявки
    [/дата|час|date|time|реєстрац/i],                       // 2. Дата і час реєстрації
    [/піб|фіо|учасник|name|автор/i],                        // 3. ПІБ учасника
    [/email|пошта|e-mail|мейл/i],                           // 4. Email адреса
    [/телефон|phone|номер тел|тел/i],                       // 5. Контактний телефон
    [/telegram|телеграм|тг|@/i],                            // 6. Telegram
    [/заклад|університет|установ|нму|інститут|institution/i],// 7. Навчальний заклад / Установа
    [/статус|курс|студент|інтерн|status/i],                 // 8. Статус учасника
    [/форма|усна|слухач|доповідь|format|participation/i],   // 9. Форма участі
    [/секція|секці|section/i],                              // 10. Секція форуму
    [/тема|робот|title|тез/i],                              // 11. Тема наукової роботи / тез
    [/керівник|науковий|supervisor/i],                      // 12. Науковий керівник
    [/кафедра|department/i],                                // 13. Кафедра
    [/завідувач|зав\.|head/i],                              // 14. Завідувач кафедри
    [/місто|країна|city|country/i],                         // 15. Місто, країна
    [/вступ|intro|актуальн/i],                              // 16. Вступ
    [/мета|aim|ціль/i],                                     // 17. Мета
    [/матеріал|метод|materials|methods/i],                  // 18. Матеріали і методи
    [/результат|results/i],                                 // 19. Результати
    [/виснов|conclusion/i],                                 // 20. Висновок
    [/ключов|keywords|слова/i],                             // 21. Ключові слова
    [/літератур|джерел|references|список/i],                // 22. Список літератури
    [/файл|диск|docx|drive|посилання/i]                     // 23. Файл тез (.docx на Google Диску)
  ];

  if (lastRow > 1) {
    var allData = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    var reorderedData = [];

    for (var r = 0; r < lastRow; r++) {
      reorderedData.push(new Array(COLUMN_HEADERS.length).fill(""));
    }

    for (var c = 0; c < COLUMN_HEADERS.length; c++) {
      reorderedData[0][c] = COLUMN_HEADERS[c];
    }

    var mappedCols = {};
    for (var srcCol = 0; srcCol < currentHeaders.length; srcCol++) {
      var hText = String(currentHeaders[srcCol] || "").trim();
      if (!hText) continue;

      var targetIdx = -1;
      // 1. Точний збіг назви
      for (var t = 0; t < COLUMN_HEADERS.length; t++) {
        if (!mappedCols[t] && hText.toLowerCase() === COLUMN_HEADERS[t].toLowerCase()) {
          targetIdx = t;
          break;
        }
      }
      // 2. Збіг за ключовими словами
      if (targetIdx === -1) {
        for (var t = 0; t < COLUMN_MATCHERS.length; t++) {
          if (mappedCols[t]) continue;
          var matchers = COLUMN_MATCHERS[t];
          for (var m = 0; m < matchers.length; m++) {
            if (matchers[m].test(hText)) {
              targetIdx = t;
              break;
            }
          }
          if (targetIdx !== -1) break;
        }
      }

      if (targetIdx !== -1) {
        mappedCols[targetIdx] = true;
        for (var rowIdx = 1; rowIdx < lastRow; rowIdx++) {
          reorderedData[rowIdx][targetIdx] = allData[rowIdx][srcCol];
        }
      } else if (srcCol < COLUMN_HEADERS.length && !mappedCols[srcCol]) {
        for (var rowIdx = 1; rowIdx < lastRow; rowIdx++) {
          reorderedData[rowIdx][srcCol] = allData[rowIdx][srcCol];
        }
      }
    }

    sheet.getRange(1, 1, lastRow, COLUMN_HEADERS.length).setValues(reorderedData);
  } else {
    sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
  }

  formatHeaderRow(sheet);

  // Форматуємо телефонний стовпчик E як простий текст для наявних рядків
  if (lastRow > 1) {
    sheet.getRange(2, 5, lastRow - 1, 1).setNumberFormat("@");
  }

  Logger.log("✅ Таблицю успішно відновлено та впорядковано (23 стовпчики).");
}

/**
 * ⚡ ШВИДКЕ ВІДНОВЛЕННЯ ТІЛЬКИ НАЗВ ШАПКИ
 * Якщо дані в рядках не рухалися, а тільки збилися назви у 1-му рядку
 */
function resetOnlyHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headerRange = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
  headerRange.setValues([COLUMN_HEADERS]);
  formatHeaderRow(sheet);
  Logger.log("✅ Шапку 1-го рядка відновлено за стандартом.");
}

/**
 * Обробка GET запиту для швидкої перевірки статусу в браузері
 */
function doGet(e) {
  if (e && e.parameter && (e.parameter.action === "repair" || e.parameter.action === "fixHeaders")) {
    repairAndAlignTable();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Шапку та стовпчики Google Таблиці успішно відновлено та впорядковано (23 стовпчики)!",
      headers: COLUMN_HEADERS
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    name: "USSF 2026 Google Sheets & Drive Sync Webhook",
    timestamp: new Date().toISOString(),
    message: "Вебхук USSF Google Sheets активний і готовий приймати реєстрації!"
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 🧪 Функція для перевірки та одноразової авторизації доступу до Google Диска
 * 
 * Як авторизувати:
 * 1. У верхньому меню Apps Script біля кнопки "Виконати" (Run) виберіть "testDrivePermission".
 * 2. Натисніть "Виконати" (Run).
 * 3. Google покаже вікно: "Потрібна авторизація" -> виберіть свій акаунт -> "Advanced" (Додатково) -> "Go to ... (unsafe)" -> "Allow" (Дозволити).
 * 4. Усе! Тепер скрипт має офіційний дозвіл створювати файли у вашій папці на Google Диску.
 */
function testDrivePermission() {
  var folderName = "Заяви USSF 2026";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
  var testBlob = Utilities.newBlob("Тестова перевірка дозволів Google Drive", "text/plain", "test_permission.txt");
  var file = folder.createFile(testBlob);
  Logger.log("✅ Успішно створено тестовий файл: " + file.getUrl());
  file.setTrashed(true); // одразу видаляємо тимчасовий тестовий файл
}

/**
 * 🛠️ Функція для швидкого виправлення вже наявних помилок #ERROR! у таблиці.
 * 
 * Як скористатися:
 * 1. У верхньому меню редактора Apps Script у випадаючому списку виберіть "fixExistingPhoneErrors".
 * 2. Натисніть кнопку "Виконати" (Run).
 * 3. Поверніться до таблиці — усі #ERROR! у стовпчику "Контактний телефон" миттєво відновляться до нормальних номерів!
 */
function fixExistingPhoneErrors() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log("Таблиця порожня або містить лише шапку.");
    return;
  }
  
  var phoneColumn = 5; // Стовпець E: Контактний телефон
  var range = sheet.getRange(2, phoneColumn, lastRow - 1, 1);
  var formulas = range.getFormulas();
  var countFixed = 0;
  
  for (var i = 0; i < formulas.length; i++) {
    var formula = formulas[i][0];
    if (formula) {
      // Якщо в комірці через знак '+' утворилася помилкова формула
      range.getCell(i + 1, 1).setNumberFormat("@").setValue("'" + formula);
      countFixed++;
    }
  }
  Logger.log("Успішно виправлено комірок: " + countFixed);
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
