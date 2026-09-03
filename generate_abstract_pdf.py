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
                if os.path.exists(it):
                    pdfmetrics.registerFont(TTFont('TimesNewRoman-Italic', it))
                if os.path.exists(bi):
                    pdfmetrics.registerFont(TTFont('TimesNewRoman-BoldItalic', bi))
                return 'TimesNewRoman'
            except Exception as e:
                continue

    return 'Helvetica'


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

    if not output_path:
        safe_name = "".join(c for c in full_name if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
        output_path = f"Тези_USSF_{safe_name}.pdf"

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
        story.append(Paragraph(f"<b>Вступ:</b> {intro}", body_style))

    if aim:
        story.append(Paragraph(f"<b>Мета:</b> {aim}", body_style))

    if materials:
        story.append(Paragraph(f"<b>Матеріали і методи:</b> {materials}", body_style))

    if results:
        story.append(Paragraph(f"<b>Результати:</b> {results}", body_style))

    if conclusion:
        story.append(Paragraph(f"<b>Висновок:</b> {conclusion}", body_style))

    if keywords:
        prefix = "" if keywords.lower().startswith("ключові слова") else "<b>Ключові слова:</b> "
        story.append(Paragraph(f"{prefix}{keywords}", body_style))

    if references:
        story.append(Paragraph("<b>Список літератури:</b>", ref_heading_style))
        # Split references line-by-line if multiple
        ref_lines = [r.strip() for r in references.split('\n') if r.strip()]
        for ref_line in ref_lines:
            story.append(Paragraph(ref_line, ref_item_style))

    doc.build(story)
    return os.path.abspath(output_path)


def send_abstract_email(pdf_path: str, data: dict, recipient: str = "derk.boryslav@gmail.com"):
    """Send compiled abstract PDF to committee email via SMTP."""
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')

    if not smtp_user or not smtp_pass:
        print(f"[INFO] SMTP credentials not configured (SMTP_USER / SMTP_PASS).")
        print(f"[INFO] PDF saved locally at: {pdf_path}")
        print(f"[INFO] To send automatically to {recipient}, configure SMTP_USER and SMTP_PASS.")
        return False

    msg = MIMEMultipart()
    msg['From'] = smtp_user
    msg['To'] = recipient
    msg['Subject'] = f"[USSF 2026 Тези] {data.get('fullName', '')} - {data.get('abstractTitle', '')}"

    body_text = f"""Шановний оргкомітет USSF 2026!

Отримано нові наукові тези для публікації та участі у форумі.

АВТОР: {data.get('fullName')}
НАВЧАЛЬНИЙ ЗАКЛАД: {data.get('institution')}
КАФЕДРА: {data.get('department')}
ЗАВІДУВАЧ КАФЕДРИ: {data.get('headOfDepartment')}
НАУКОВИЙ КЕРІВНИК: {data.get('scientificSupervisor')}
МІСТО / КРАЇНА: {data.get('cityCountry')}

СЕКЦІЯ: {data.get('sectionText')}
EMAIL: {data.get('email')}
ТЕЛЕФОН: {data.get('phone')}

ТЕМА: {data.get('abstractTitle')}

Згенерований офіційний PDF-файл тез згідно з новим зразком-шаблоном додано у вкладенні.
"""
    msg.attach(MIMEText(body_text, 'plain', 'utf-8'))

    with open(pdf_path, 'rb') as f:
        attach = MIMEApplication(f.read(), _subtype='pdf')
        attach.add_header('Content-Disposition', 'attachment', filename=os.path.basename(pdf_path))
        msg.attach(attach)

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)

    print(f"[SUCCESS] Abstract successfully emailed to {recipient}!")
    return True


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
