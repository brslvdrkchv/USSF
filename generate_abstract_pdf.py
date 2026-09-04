#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
USSF 2026 - Automatic Abstract PDF Generator & Mailer
-----------------------------------------------------
Formats academic abstracts according to official medical conference standards (Bogomolets NMU template):
- Font: Times New Roman (TrueType with full Cyrillic support)
- Font size: 14 pt
- Line spacing: 1.5 lines (leading = 21 pt)
- Margins: Left 30mm, Right 15mm, Top 20mm, Bottom 20mm
- Paragraph indent: 12.5 mm (1.25 cm)
- Structure:
    * Title of abstract (centered, bold, 14 pt)
    * Author (centered, italic, 14 pt)
    * Academic header (left-aligned, italic):
        - Науковий керівник: [посада, звання, ПІБ]
        - Кафедра: [назва кафедри]
        - Завідувач кафедри: [ступінь, вчене звання, ПІБ]
        - [Назва навчального закладу / установи]
        - м. [Місто], [Країна]
    * Вступ:
    * Мета:
    * Матеріали і методи:
    * Результати:
    * Висновок:
    * Ключові слова:
    * Список літератури:
- Recipient: derk.boryslav@gmail.com
"""

import sys
import os
import json
import argparse
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


def register_times_fonts():
    """Locate and register TrueType Times New Roman or compatible Serif fonts."""
    font_candidates = [
        ('/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf',
         '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold.ttf',
         '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Italic.ttf',
         '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold_Italic.ttf'),
        ('/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf',
         '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
         '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf',
         '/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf'),
    ]

    for reg, bold, it, bi in font_candidates:
        if os.path.exists(reg) and os.path.exists(bold):
            try:
                pdfmetrics.registerFont(TTFont('TimesNewRoman', reg))
                pdfmetrics.registerFont(TTFont('TimesNewRoman-Bold', bold))
                it_font = 'TimesNewRoman-Italic' if os.path.exists(it) else 'TimesNewRoman'
                bi_font = 'TimesNewRoman-BoldItalic' if os.path.exists(bi) else 'TimesNewRoman-Bold'
                if os.path.exists(it):
                    pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic', it))
                if os.path.exists(bi):
                    pdfmetrics.registerFont(TTFont('TimesNewRoman-BoldItalic', bi))
                pdfmetrics.registerFontFamily(
                    'TimesNewRoman',
                    normal='TimesNewRoman',
                    bold='TimesNewRoman-Bold',
                    italic=it_font,
                    boldItalic=bi_font
                )
                return 'TimesNewRoman'
            except Exception as e:
                continue

    return 'Helvetica'


def clean_section_text(text: str, label: str, aliases: list = None) -> str:
    """Strip any duplicate label or prefix the user may have typed into the textarea."""
    if not text:
        return ""
    t = text.strip()
    prefixes = [label] + (aliases or [])
    for p in prefixes:
        clean_p = p.rstrip(':').strip().lower()
        if t.lower().startswith(clean_p):
            sub = t[len(clean_p):].lstrip(': -–—\t')
            t = sub.strip()
            break
    return t


def create_abstract_pdf(data: dict, output_path: str = None) -> str:
    """Generate official abstract PDF strictly conforming to the conference template."""
    font_name = register_times_fonts()
    font_bold = f"{font_name}-Bold" if font_name != 'Helvetica' else 'Helvetica-Bold'
    font_italic = f"{font_name}-Italic" if font_name != 'Helvetica' else 'Helvetica-Oblique'

    # Extract all fields
    full_name = data.get('fullName', 'Кузнецов О.О.').strip()
    institution = data.get('institution', 'Національний медичний університет імені О. О. Богомольця').strip()
    department = data.get('department', '').strip()
    head_of_department = data.get('headOfDepartment', '').strip()
    scientific_supervisor = data.get('scientificSupervisor', '').strip()
    city_country = data.get('cityCountry', 'м. Київ, Україна').strip()

    title = data.get('abstractTitle', 'НАЗВА НАУКОВОЇ РОБОТИ').strip()
    intro = data.get('abstractIntro', '').strip()
    aim = data.get('abstractAim', '').strip()
    materials = data.get('abstractMaterials', '').strip()
    results = data.get('abstractResults', data.get('abstractBody', '')).strip()
    conclusion = data.get('abstractConclusion', '').strip()
    keywords = data.get('abstractKeywords', '').strip()
    references = data.get('abstractReferences', '').strip()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    submissions_dir = os.path.join(base_dir, 'заявки_тези')
    os.makedirs(submissions_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    safe_name = "".join(c for c in full_name if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_') or 'Учасник'

    if not output_path:
        output_path = os.path.join(submissions_dir, f"Тези_{safe_name}_{timestamp}.pdf")
    elif os.path.isdir(output_path):
        output_path = os.path.join(output_path, f"Тези_{safe_name}_{timestamp}.pdf")

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=30 * mm,    # 3.0 cm
        rightMargin=15 * mm,   # 1.5 cm
        topMargin=20 * mm,     # 2.0 cm
        bottomMargin=20 * mm   # 2.0 cm
    )

    # Criteria: Times New Roman, 14pt, 1.5 line spacing (14 * 1.5 = 21pt leading)
    title_style = ParagraphStyle(
        'DocTitle',
        fontName=font_bold,
        fontSize=14,
        leading=21,
        alignment=TA_CENTER,
        spaceAfter=12
    )

    author_style = ParagraphStyle(
        'DocAuthor',
        fontName=font_italic,
        fontSize=14,
        leading=21,
        alignment=TA_CENTER,
        spaceAfter=14
    )

    affiliation_style = ParagraphStyle(
        'DocAffiliation',
        fontName=font_italic,
        fontSize=14,
        leading=21,
        alignment=TA_LEFT,
        spaceAfter=14
    )

    body_style = ParagraphStyle(
        'DocBody',
        fontName=font_name,
        fontSize=14,
        leading=21,
        alignment=TA_JUSTIFY,
        firstLineIndent=12.5 * mm,  # 1.25 cm standard academic paragraph indent
        spaceAfter=8
    )

    ref_heading_style = ParagraphStyle(
        'DocRefHeading',
        fontName=font_bold,
        fontSize=14,
        leading=21,
        alignment=TA_LEFT,
        firstLineIndent=12.5 * mm,
        spaceBefore=10,
        spaceAfter=6
    )

    ref_item_style = ParagraphStyle(
        'DocRefItem',
        fontName=font_name,
        fontSize=14,
        leading=21,
        alignment=TA_JUSTIFY,
        firstLineIndent=12.5 * mm,
        spaceAfter=6
    )

    story = []

    # 1. Title (Centered, bold, 14pt)
    story.append(Paragraph(title, title_style))

    # 2. Author (Centered, italic, 14pt)
    story.append(Paragraph(full_name, author_style))

    # 3. Academic affiliation block (Left-aligned, italic, 14pt, 1.5 spacing)
    affil_lines = []
    if scientific_supervisor:
        prefix = "" if scientific_supervisor.lower().startswith("науковий керівник") else "Науковий керівник: "
        affil_lines.append(f"{prefix}{scientific_supervisor}")

    if department:
        prefix = "" if department.lower().startswith("кафедра") else "Кафедра "
        affil_lines.append(f"{prefix}{department}")

    if head_of_department:
        prefix = "" if head_of_department.lower().startswith("завідувач кафедри") else "Завідувач кафедри: "
        affil_lines.append(f"{prefix}{head_of_department}")

    if institution:
        affil_lines.append(institution)

    if city_country:
        affil_lines.append(city_country)

    if affil_lines:
        story.append(Paragraph("<br/>".join(affil_lines), affiliation_style))

    # 4. Structured sections (Justified, 14pt, 1.5 spacing, 1.25 cm indent)
    if intro:
        clean_intro = clean_section_text(intro, "Вступ", ["Вступ:"])
        story.append(Paragraph(f"<b>Вступ:</b> {clean_intro}", body_style))

    if aim:
        clean_aim = clean_section_text(aim, "Мета", ["Мета:"])
        story.append(Paragraph(f"<b>Мета:</b> {clean_aim}", body_style))

    if materials:
        clean_mat = clean_section_text(materials, "Матеріали і методи", ["Матеріали та методи", "Матеріали і методи:", "Матеріали та методи:"])
        story.append(Paragraph(f"<b>Матеріали і методи:</b> {clean_mat}", body_style))

    if results:
        clean_res = clean_section_text(results, "Результати", ["Результати:"])
        story.append(Paragraph(f"<b>Результати:</b> {clean_res}", body_style))

    if conclusion:
        clean_concl = clean_section_text(conclusion, "Висновок", ["Висновки", "Висновок:", "Висновки:"])
        story.append(Paragraph(f"<b>Висновок:</b> {clean_concl}", body_style))

    if keywords:
        clean_kw = clean_section_text(keywords, "Ключові слова", ["Ключові слова:"])
        story.append(Paragraph(f"<b>Ключові слова:</b> {clean_kw}", body_style))

    if references:
        story.append(Paragraph("<b>Список літератури:</b>", ref_heading_style))
        # Split references line-by-line if multiple
        ref_lines = [r.strip() for r in references.split('\n') if r.strip()]
        for ref_line in ref_lines:
            story.append(Paragraph(ref_line, ref_item_style))

    doc.build(story)
    return os.path.abspath(output_path)


def load_email_config():
    """Load email configuration from email_config.json or environment variables."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    config_file = os.path.join(base_dir, 'email_config.json')
    config = {
        'smtp_host': os.environ.get('SMTP_HOST', 'smtp.gmail.com'),
        'smtp_port': int(os.environ.get('SMTP_PORT', 587)),
        'smtp_user': os.environ.get('SMTP_USER', ''),
        'smtp_pass': os.environ.get('SMTP_PASS', ''),
        'committee_email': os.environ.get('COMMITTEE_EMAIL', 'derk.boryslav@gmail.com'),
        'send_copy_to_author': True,
        'sync_secret_token': os.environ.get('SYNC_SECRET_TOKEN', 'ussf_secure_sync_2026_med_nmu'),
        'program_pdf_path': os.environ.get('PROGRAM_PDF_PATH', 'USSF2026_Program.pdf')
    }
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                config.update({k: v for k, v in loaded.items() if v not in (None, '') or k in ('smtp_user', 'smtp_pass')})
        except Exception as e:
            print(f"[WARN] Failed to read email_config.json: {e}")
    return config


def send_abstract_email(pdf_path: str, data: dict, recipient: str = None) -> dict:
    """
    Send two emails upon registration:
    1. Automated No-Reply email to Participant with thank-you note, attached Program PDF and abstract PDF.
    2. Notification email to Committee (derk.boryslav@gmail.com) with full registration data and abstract PDF.
    """
    cfg = load_email_config()
    base_dir = os.path.dirname(os.path.abspath(__file__))

    smtp_host = cfg.get('smtp_host', 'smtp.gmail.com')
    smtp_port = int(cfg.get('smtp_port', 587))
    smtp_user = cfg.get('smtp_user', '').strip()
    smtp_pass = cfg.get('smtp_pass', '').strip()

    committee_email = recipient or cfg.get('committee_email', 'derk.boryslav@gmail.com')
    author_email = data.get('email', '').strip()

    if not smtp_user or not smtp_pass:
        return {
            "sent": False,
            "error": "SMTP_NOT_CONFIGURED",
            "message": "Поштові реквізити не налаштовано у файлі email_config.json (потрібно вказати smtp_user та smtp_pass).",
            "recipients": [committee_email] + ([author_email] if author_email else [])
        }

    full_name = data.get('fullName', 'Учасник USSF')
    title = data.get('abstractTitle', 'Наукова робота')
    pdf_filename = os.path.basename(pdf_path)

    # Read the abstract PDF content
    try:
        with open(pdf_path, 'rb') as f:
            abstract_pdf_bytes = f.read()
    except Exception as e:
        return {"sent": False, "error": f"ABSTRACT_PDF_READ_ERROR: {e}"}

    # Locate and read Program PDF
    program_rel = cfg.get('program_pdf_path', 'USSF2026_Program.pdf')
    program_path = os.path.join(base_dir, program_rel) if not os.path.isabs(program_rel) else program_rel
    program_bytes = None
    if os.path.exists(program_path):
        try:
            with open(program_path, 'rb') as pf:
                program_bytes = pf.read()
        except Exception as e:
            print(f"[WARN] Could not read program PDF: {e}")

    sent_recipients = []
    errors = []

    try:
        # Establish SMTP connection
        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=20)
            server.starttls()

        server.login(smtp_user, smtp_pass)

        # ----------------------------------------------------
        # 1. PARTICIPANT CONFIRMATION EMAIL (No-Reply)
        # ----------------------------------------------------
        if author_email:
            p_msg = MIMEMultipart()
            p_msg['From'] = f"USSF 2026 No-Reply <{smtp_user}>"
            p_msg['To'] = author_email
            p_msg['Reply-To'] = f"no-reply@ussf2026.org"
            p_msg['Subject'] = f"Дякуємо за участь та реєстрацію на форумі USSF 2026!"

            p_body = f"""Шановний(-а) {full_name}!

Щиро дякуємо за участь та реєстрацію на I Всеукраїнському студентському хірургічному форумі (USSF 2026) в Національному медичному університеті імені О. О. Богомольця (м. Київ).

Вашу заявку та тези наукової доповіді на тему:
«{title}»
успішно прийнято та передано науковому комітету форуму.

📎 У додатку до цього листа надсилаємо:
• Офіційну програму форуму (USSF2026_Program.pdf) — розклад доповідей, практичних майстер-класів та хірургічних секцій заходу.

Зверніть увагу: це повідомлення сформовано автоматично (no-reply). Всі матеріали надійшли оргкомітету на розгляд. З усіх питань звертайтеся до оргкомітету за адресою: derk.boryslav@gmail.com.

З повагою,
Оргкомітет USSF 2026
Національний медичний університет імені О. О. Богомольця
"""
            p_msg.attach(MIMEText(p_body, 'plain', 'utf-8'))

            # Attach program PDF exclusively to participant
            if program_bytes:
                p_attach = MIMEApplication(program_bytes, _subtype='pdf')
                p_attach.add_header('Content-Disposition', 'attachment', filename='USSF2026_Program.pdf')
                p_msg.attach(p_attach)

            try:
                server.sendmail(smtp_user, [author_email], p_msg.as_string())
                sent_recipients.append(author_email)
                print(f"[SUCCESS] Participant confirmation email sent to {author_email}")
            except Exception as pe:
                print(f"[ERROR] Sending to participant {author_email} failed: {pe}")
                errors.append(f"Author: {pe}")

        # ----------------------------------------------------
        # 2. COMMITTEE NOTIFICATION EMAIL
        # ----------------------------------------------------
        c_msg = MIMEMultipart()
        c_msg['From'] = f"USSF 2026 Реєстрація <{smtp_user}>"
        c_msg['To'] = committee_email
        c_msg['Subject'] = f"[USSF 2026 Заявка + Тези] {full_name} — {title}"

        c_body = f"""Шановні колеги!

Отримано нову заявку та тези наукової доповіді на I Всеукраїнський студентський хірургічний форум (USSF 2026).

---------------------------------------------------------
ВІДОМОСТІ ПРО УЧАСНИКА ТА РОБОТУ:
---------------------------------------------------------
ПІБ автора: {full_name}
Університет / заклад: {data.get('institution', 'НМУ імені О.О. Богомольця')}
Кафедра: {data.get('department', 'Не вказано')}
Завідувач кафедри: {data.get('headOfDepartment', 'Не вказано')}
Науковий керівник: {data.get('scientificSupervisor', 'Не вказано')}
Місто, Країна: {data.get('cityCountry', 'м. Київ, Україна')}
Секція: {data.get('sectionText', '')}
Email автора: {author_email}
Телефон автора: {data.get('phone', '')}
Telegram автора: {data.get('telegram', 'Не вказано')}

Тема наукової роботи: {title}
---------------------------------------------------------

Готовий до друку PDF-файл тез (Times New Roman 14 pt, 1.5 інтервал) прикріплено у вкладенні:
📎 {pdf_filename}

--
Система онлайн-реєстрації USSF 2026
"""
        c_msg.attach(MIMEText(c_body, 'plain', 'utf-8'))

        # Attach abstract PDF
        ca_attach = MIMEApplication(abstract_pdf_bytes, _subtype='pdf')
        ca_attach.add_header('Content-Disposition', 'attachment', filename=pdf_filename)
        c_msg.attach(ca_attach)

        try:
            server.sendmail(smtp_user, [committee_email], c_msg.as_string())
            sent_recipients.append(committee_email)
            print(f"[SUCCESS] Committee notification sent to {committee_email}")
        except Exception as ce:
            print(f"[ERROR] Sending to committee failed: {ce}")
            errors.append(f"Committee: {ce}")

        server.quit()

        return {
            "sent": len(sent_recipients) > 0,
            "recipients": sent_recipients,
            "errors": errors if errors else None
        }

    except Exception as e:
        print(f"[ERROR] SMTP connection failed: {e}")
        return {
            "sent": False,
            "error": str(e),
            "recipients": sent_recipients
        }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Generate and email USSF 2026 conference abstract PDF")
    parser.add_argument('--json', type=str, help="JSON string or file path containing submission data")
    parser.add_argument('--out', type=str, help="Output PDF file path")
    parser.add_argument('--send', action='store_true', help="Send email to derk.boryslav@gmail.com")
    parser.add_argument('--recipient', type=str, default="derk.boryslav@gmail.com", help="Recipient email")

    args = parser.parse_args()

    # Exact replica of the user's template data for testing
    sample_data = {
        "fullName": "Кузнецов О.О.",
        "institution": "Національний медичний університет імені О. О. Богомольця",
        "department": "Кафедра патофізіології",
        "headOfDepartment": "д.мед.н., професор Зябліцев С. В.",
        "scientificSupervisor": "асистентка кафедри Александренко Н. О.",
        "cityCountry": "м. Київ, Україна",
        "sectionText": "Секція 3: Абдомінальна й торакальна онкохірургія та трансплантологія",
        "email": "kuznetsov@gmail.com",
        "phone": "+38 (050) 987-65-43",
        "abstractTitle": "Молекулярні механізми злоякісної трансформації кістозних новоутворень підшлункової залози",
        "abstractIntro": "За даними літератури кістозні новоутворення підшлункової залози стають випадковою знахідкою під час радіологічного обстеження пацієнтів з частотою 1-3% при виконанні КТ і 2-20% у загальній популяції та 30-49% у старшій віковій групі (60+ років) при виконанні МРТ [1]. Внутрішньопротокова папілярна муцинозна неоплазія (IPMN) та муцинозна кістозна неоплазія (MCN) — морфологічні форми, що найчастіше зустрічаються серед кістозних новоутворень і асоціюються з потенційним злоякісним переродженням у протокову аденокарциному підшлункової залози (PDAC) — шосте за рівнем смертності онкологічне захворювання у світі з 5-річним рівнем виживаності 8-10% [2, 3, 4, 5].",
        "abstractAim": "Визначити патофізіологічне підґрунтя злоякісної трансформації кістозних новоутворень підшлункової залози на прикладі IPMN та MCN.",
        "abstractMaterials": "Дослідження виконано у форматі огляду літератури. Проведено пошук наукових публікацій за ключовими словами у науковометричних базах PubMed, Scopus та Web of Science. Внаслідок аналізу результатів пошуку було відібрано літературні джерела за останні 5 років, які найбільш якісно висвітлювали поставлену проблему.",
        "abstractResults": "IPMN — макроскопічне внутрішньопротокове новоутворення розміром понад 5 мм, що характеризується кістозним розширенням панкреатичних проток, папілярним розростанням муцин-продукуючого неопластичного епітелію і переважною локалізацією в голівці залози [1, 3, 6]. На підставі визначення експресії апомуцинів клітинами IPMN виокремлено 3 епітеліальні підтипи пухлини: низькодиференційований шлунковий (MUC5AC, MUC6), високодиференційовані кишковий (MUC2, MUC5AC, CDX2) та панкреатобіліарний (MUC1, MUC5AC, MUC6) [4, 5, 7].",
        "abstractConclusion": "Злоякісна трансформація IPMN та MCN грунтується на генетичних мутаціях, епігенетичних модифікаціях і супутньому хронічному запаленні, що пов’язане з присутністю бактеріальної флори. Ініціаторами пухлинної прогресії визнано мутації генів KRAS та GNAS, що у комбінації з мутаціями CDX2 та RNF43 або PTEN та LKB1 визначають морфологічний шлях малігнізації.",
        "abstractKeywords": "кістозні новоутворення, підшлункова залоза, злоякісна трансформація, IPMN, MCN",
        "abstractReferences": "1. Ohtsuka, T., Fernandez-Del Castillo, C., Furukawa, T., et al. (2024). International evidence-based Kyoto guidelines for the management of intraductal papillary mucinous neoplasm of the pancreas. Pancreatology, 24(2), 255–270.\n2. Ducreux, M., Seufferlein, T., Ba-Akunin, G., et al. (2023). Pancreatic cancer: ESMO Clinical Practice Guideline for diagnosis, treatment and follow-up. Annals of Oncology, 34(11), 987–1002.\n3. National Comprehensive Cancer Network. (2025). Pancreatic adenocarcinoma (Version 2.2025)."
    }

    data = sample_data
    if args.json:
        if os.path.exists(args.json):
            with open(args.json, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.loads(args.json)

    pdf_file = create_abstract_pdf(data, args.out)
    print(f"Generated PDF: {pdf_file}")

    if args.send:
        send_abstract_email(pdf_file, data, args.recipient)
