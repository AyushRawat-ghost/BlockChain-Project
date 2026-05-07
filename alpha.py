from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import BaseDocTemplate, PageTemplate, Frame
from reportlab.pdfgen import canvas as pdfcanvas
import os

W, H = A4

# ── colour palette ──────────────────────────────────────────────────────────
C_DARK   = colors.HexColor("#0D1117")
C_NAVY   = colors.HexColor("#0F2B4B")
C_BLUE   = colors.HexColor("#1565C0")
C_ACCENT = colors.HexColor("#00B4D8")
C_GREEN  = colors.HexColor("#2E7D32")
C_ORANGE = colors.HexColor("#E65100")
C_PURPLE = colors.HexColor("#6A1B9A")
C_TEAL   = colors.HexColor("#00695C")
C_RED    = colors.HexColor("#B71C1C")
C_GOLD   = colors.HexColor("#F9A825")
C_LIGHT  = colors.HexColor("#F5F7FA")
C_GRAY   = colors.HexColor("#546E7A")
C_MID    = colors.HexColor("#90A4AE")
C_WHITE  = colors.white

# ── styles ───────────────────────────────────────────────────────────────────
def make_styles():
    base = getSampleStyleSheet()

    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    cover_title = S("CoverTitle",
        fontName="Helvetica-Bold", fontSize=36, leading=44,
        textColor=C_WHITE, alignment=TA_CENTER, spaceAfter=8)

    cover_sub = S("CoverSub",
        fontName="Helvetica", fontSize=14, leading=20,
        textColor=C_ACCENT, alignment=TA_CENTER, spaceAfter=6)

    cover_meta = S("CoverMeta",
        fontName="Helvetica", fontSize=11, leading=16,
        textColor=C_MID, alignment=TA_CENTER, spaceAfter=4)

    part_title = S("PartTitle",
        fontName="Helvetica-Bold", fontSize=28, leading=34,
        textColor=C_WHITE, alignment=TA_CENTER, spaceBefore=0, spaceAfter=6)

    part_sub = S("PartSub",
        fontName="Helvetica", fontSize=13, leading=18,
        textColor=C_ACCENT, alignment=TA_CENTER, spaceAfter=4)

    ch_title = S("ChTitle",
        fontName="Helvetica-Bold", fontSize=20, leading=26,
        textColor=C_NAVY, spaceBefore=18, spaceAfter=8,
        borderPad=6)

    sec_title = S("SecTitle",
        fontName="Helvetica-Bold", fontSize=15, leading=20,
        textColor=C_BLUE, spaceBefore=14, spaceAfter=5)

    subsec_title = S("SubSecTitle",
        fontName="Helvetica-Bold", fontSize=12, leading=16,
        textColor=C_TEAL, spaceBefore=10, spaceAfter=4)

    body = S("Body",
        fontName="Helvetica", fontSize=10, leading=15,
        textColor=C_DARK, alignment=TA_JUSTIFY, spaceBefore=3, spaceAfter=3)

    bullet = S("Bullet",
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=C_DARK, leftIndent=16, firstLineIndent=-10,
        spaceBefore=2, spaceAfter=2)

    subbullet = S("SubBullet",
        fontName="Helvetica", fontSize=9.5, leading=13,
        textColor=C_GRAY, leftIndent=32, firstLineIndent=-10,
        spaceBefore=1, spaceAfter=1)

    note = S("Note",
        fontName="Helvetica-Oblique", fontSize=9.5, leading=13,
        textColor=C_PURPLE, leftIndent=12, spaceBefore=4, spaceAfter=4)

    tip = S("Tip",
        fontName="Helvetica-Bold", fontSize=9.5, leading=13,
        textColor=C_GREEN, leftIndent=12, spaceBefore=4, spaceAfter=4)

    warn = S("Warn",
        fontName="Helvetica-Bold", fontSize=9.5, leading=13,
        textColor=C_RED, leftIndent=12, spaceBefore=4, spaceAfter=4)

    toc_part = S("TocPart",
        fontName="Helvetica-Bold", fontSize=12, leading=18,
        textColor=C_NAVY, spaceBefore=8, spaceAfter=2)

    toc_ch = S("TocCh",
        fontName="Helvetica", fontSize=10.5, leading=14,
        textColor=C_DARK, leftIndent=16, spaceBefore=1, spaceAfter=1)

    label = S("Label",
        fontName="Helvetica-Bold", fontSize=10, leading=13,
        textColor=C_ORANGE, spaceBefore=6, spaceAfter=2)

    return dict(
        cover_title=cover_title, cover_sub=cover_sub, cover_meta=cover_meta,
        part_title=part_title, part_sub=part_sub,
        ch_title=ch_title, sec_title=sec_title, subsec_title=subsec_title,
        body=body, bullet=bullet, subbullet=subbullet,
        note=note, tip=tip, warn=warn,
        toc_part=toc_part, toc_ch=toc_ch, label=label
    )

ST = make_styles()

# ── helpers ──────────────────────────────────────────────────────────────────
def B(txt): return f"<b>{txt}</b>"
def I(txt): return f"<i>{txt}</i>"
def A(txt, color=None):
    c = color or C_ACCENT.hexval()
    return f'<font color="{c}">{txt}</font>'

def body(txt): return Paragraph(txt, ST["body"])
def bul(txt):  return Paragraph(f"• {txt}", ST["bullet"])
def sbul(txt): return Paragraph(f"◦ {txt}", ST["subbullet"])
def note(txt): return Paragraph(f"📝 {txt}", ST["note"])
def tip(txt):  return Paragraph(f"💡 {txt}", ST["tip"])
def warn(txt): return Paragraph(f"⚠ {txt}", ST["warn"])
def sp(n=1):   return Spacer(1, n*5)
def hr(c=C_ACCENT, t=1): return HRFlowable(width="100%", thickness=t, color=c, spaceAfter=4, spaceBefore=4)
def sec(txt):  return Paragraph(txt, ST["sec_title"])
def subsec(txt): return Paragraph(txt, ST["subsec_title"])
def label(txt): return Paragraph(txt, ST["label"])

def chapter(num, title, color=C_NAVY):
    style = ParagraphStyle("CH", fontName="Helvetica-Bold", fontSize=20, leading=26,
        textColor=color, spaceBefore=18, spaceAfter=8)
    return [hr(color, 2), Paragraph(f"Chapter {num} — {title}", style), hr(color, 1), sp(2)]

def part_page(num, title, subtitle, color=C_NAVY, bg=C_DARK):
    """Returns flowables that simulate a part divider page."""
    items = [PageBreak()]
    # Big coloured block via a 1-cell table
    tbl = Table([[Paragraph(f"PART {num}", ParagraphStyle("P",
        fontName="Helvetica-Bold", fontSize=11, textColor=C_ACCENT, alignment=TA_CENTER)),
    ]], colWidths=[16*cm])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING", (0,0), (-1,-1), 10),
        ("BOTTOMPADDING", (0,0), (-1,-1), 10),
    ]))
    items.append(tbl)

    title_tbl = Table([[Paragraph(title, ST["part_title"])]], colWidths=[16*cm])
    title_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING", (0,0), (-1,-1), 18),
        ("BOTTOMPADDING", (0,0), (-1,-1), 18),
    ]))
    items.append(title_tbl)

    sub_tbl = Table([[Paragraph(subtitle, ST["part_sub"])]], colWidths=[16*cm])
    sub_tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), C_LIGHT),
        ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    items.append(sub_tbl)
    items.append(sp(4))
    return items

def info_box(title, items_list, color=C_BLUE):
    rows = [[Paragraph(B(title), ParagraphStyle("BT", fontName="Helvetica-Bold",
        fontSize=10, textColor=C_WHITE))]]
    for it in items_list:
        rows.append([Paragraph(f"• {it}", ParagraphStyle("BI", fontName="Helvetica",
            fontSize=9.5, textColor=C_DARK, leading=13))])
    t = Table(rows, colWidths=[16*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,0), color),
        ("BACKGROUND", (0,1), (-1,-1), C_LIGHT),
        ("GRID", (0,0), (-1,-1), 0.3, C_MID),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
    ]))
    return [t, sp(2)]

def two_col_table(headers, rows, col_colors=None):
    w = [5*cm, 11*cm]
    data = [[Paragraph(B(h), ParagraphStyle("H", fontName="Helvetica-Bold",
        fontSize=9.5, textColor=C_WHITE)) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), ParagraphStyle("C", fontName="Helvetica",
            fontSize=9.5, leading=13, textColor=C_DARK)) for c in r])
    t = Table(data, colWidths=w)
    ts = [
        ("BACKGROUND", (0,0), (-1,0), C_NAVY),
        ("BACKGROUND", (0,1), (-1,-1), C_LIGHT),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [C_WHITE, C_LIGHT]),
        ("GRID", (0,0), (-1,-1), 0.3, C_MID),
        ("TOPPADDING", (0,0), (-1,-1), 4),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("VALIGN", (0,0), (-1,-1), "TOP"),
    ]
    t.setStyle(TableStyle(ts))
    return [t, sp(2)]

# ── page template ─────────────────────────────────────────────────────────────
class DocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        frame = Frame(1.5*cm, 1.8*cm, W-3*cm, H-3.2*cm, id="main")
        self.addPageTemplates([PageTemplate(id="main", frames=[frame],
            onPage=self._draw_page)])

    def _draw_page(self, canv, doc):
        canv.saveState()
        # Header bar
        canv.setFillColor(C_NAVY)
        canv.rect(0, H-1.2*cm, W, 1.2*cm, fill=1, stroke=0)
        canv.setFont("Helvetica-Bold", 8)
        canv.setFillColor(C_WHITE)
        canv.drawString(1.5*cm, H-0.8*cm, "ZERO TO HERO — Data & Blockchain Engineering Master Guide")
        canv.setFont("Helvetica", 8)
        canv.setFillColor(C_ACCENT)
        canv.drawRightString(W-1.5*cm, H-0.8*cm,
            "SQL • Python • Databricks • Kafka • dbt • Blockchain • Java")
        # Footer
        canv.setFillColor(C_NAVY)
        canv.rect(0, 0, W, 1.2*cm, fill=1, stroke=0)
        canv.setFont("Helvetica", 8)
        canv.setFillColor(C_MID)
        canv.drawString(1.5*cm, 0.45*cm, "Zero to Hero Master Guide  |  April 2026")
        canv.setFillColor(C_WHITE)
        canv.setFont("Helvetica-Bold", 9)
        canv.drawCentredString(W/2, 0.45*cm, str(doc.page))
        canv.restoreState()

# ═══════════════════════════════════════════════════════════════════════════════
#  CONTENT BUILDERS
# ═══════════════════════════════════════════════════════════════════════════════

def cover_page():
    story = []
    # Dark background block
    bg = Table([[""]], colWidths=[W-3*cm], rowHeights=[4*cm])
    bg.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_DARK)]))
    story.append(bg)
    story.append(sp(2))

    tbl = Table([[Paragraph("ZERO TO HERO", ParagraphStyle("z2h",
        fontName="Helvetica-Bold", fontSize=40, textColor=C_ACCENT, alignment=TA_CENTER))
    ]], colWidths=[16*cm])
    tbl.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_NAVY),
        ("TOPPADDING",(0,0),(-1,-1),20), ("BOTTOMPADDING",(0,0),(-1,-1),20)]))
    story.append(tbl)

    story.append(sp(1))
    story.append(Paragraph("DATA & BLOCKCHAIN ENGINEERING MASTER GUIDE",
        ParagraphStyle("sub", fontName="Helvetica-Bold", fontSize=17,
        textColor=C_NAVY, alignment=TA_CENTER, spaceBefore=6, spaceAfter=6)))

    story.append(hr(C_ACCENT, 2))
    for line in [
        "SQL for Data Analysis  •  Python Zero to Hero  •  Python for Data Science",
        "Pandas • Matplotlib • Seaborn • PySpark • Python Backend Development",
        "Databricks Zero to Hero  •  Apache Kafka  •  dbt Orchestration",
        "End-to-End Capstone Project  •  Blockchain & Solidity  •  JS for Blockchain",
        "Java Zero to Hero for Backend Developers"
    ]:
        story.append(Paragraph(line, ParagraphStyle("ln", fontName="Helvetica",
            fontSize=10.5, textColor=C_GRAY, alignment=TA_CENTER, spaceAfter=3)))
    story.append(hr(C_ACCENT, 2))

    story.append(sp(3))
    for tag in ["10 Comprehensive Parts", "Zero to Hero Level", "Real Dataset Practicals", "April 2026"]:
        story.append(Paragraph(tag, ParagraphStyle("tag", fontName="Helvetica-Bold",
            fontSize=11, textColor=C_BLUE, alignment=TA_CENTER, spaceAfter=3)))

    story.append(PageBreak())
    return story


def toc():
    story = [Paragraph("TABLE OF CONTENTS", ParagraphStyle("TOC",
        fontName="Helvetica-Bold", fontSize=22, textColor=C_NAVY,
        alignment=TA_CENTER, spaceAfter=10)), hr(C_ACCENT, 2), sp(2)]

    sections = [
        ("PART 1", "SQL for Data Analysis", [
            "Ch 1 — Relational Database Foundations",
            "Ch 2 — Core SQL: Querying & Filtering",
            "Ch 3 — Aggregations, Grouping & Window Functions",
            "Ch 4 — Joins, Subqueries & CTEs",
            "Ch 5 — Advanced SQL: Optimisation & Real Datasets",
        ]),
        ("PART 2", "Python Zero to Hero", [
            "Ch 6 — Python Fundamentals & Environment",
            "Ch 7 — Data Structures & OOP",
            "Ch 8 — Functional Programming & Modules",
            "Ch 9 — File I/O, APIs & Error Handling",
        ]),
        ("PART 3", "Python for Data Science", [
            "Ch 10 — NumPy & Pandas Deep Dive",
            "Ch 11 — Data Visualisation: Matplotlib & Seaborn",
            "Ch 12 — PySpark for Big Data",
            "Ch 13 — Python for Backend Development (FastAPI/Flask)",
        ]),
        ("PART 4", "Databricks Zero to Hero", [
            "Ch 14 — Databricks Architecture & Workspace",
            "Ch 15 — Delta Lake & Lakehouse",
            "Ch 16 — MLflow & Feature Engineering",
        ]),
        ("PART 5", "Apache Kafka Zero to Hero", [
            "Ch 17 — Kafka Architecture & Core Concepts",
            "Ch 18 — Producers, Consumers & Streams",
        ]),
        ("PART 6", "dbt as Orchestration & Transformation", [
            "Ch 19 — dbt Fundamentals & Project Structure",
            "Ch 20 — Advanced dbt: Tests, Docs & Orchestration",
        ]),
        ("PART 7", "End-to-End Capstone Project", [
            "Ch 21 — Architecture & Dataset Selection",
            "Ch 22 — Building the Full Pipeline",
        ]),
        ("PART 8", "Blockchain & Solidity Development", [
            "Ch 23 — Blockchain Fundamentals",
            "Ch 24 — Solidity Zero to Hero",
            "Ch 25 — JavaScript for Blockchain (ethers.js / Web3.js)",
        ]),
        ("PART 9", "Java Zero to Hero — Backend Developer", [
            "Ch 26 — Java Foundations & OOP",
            "Ch 27 — Spring Boot & REST APIs",
            "Ch 28 — Databases, Security & Deployment",
        ]),
        ("PART 10", "Appendix & Quick Reference", [
            "SQL Cheat Sheet • Python Cheat Sheet • Kafka Reference",
            "dbt Reference • Solidity Patterns • Java Reference",
        ]),
    ]

    for part, title, chapters in sections:
        story.append(Paragraph(f"{part} — {title}", ST["toc_part"]))
        for ch in chapters:
            story.append(Paragraph(ch, ST["toc_ch"]))
        story.append(sp(1))

    story.append(PageBreak())
    return story


# ═══ PART 1: SQL ═══════════════════════════════════════════════════════════════
def part1_sql():
    story = part_page(1, "SQL FOR DATA ANALYSIS",
        "Relational databases, querying, window functions, optimisation & real datasets",
        C_BLUE, C_DARK)

    story += chapter(1, "Relational Database Foundations")
    story.append(sec("1.1 What is a Relational Database?"))
    story.append(body("A relational database organises data into structured tables with rows and columns. Each table represents an entity, and relationships between entities are expressed through primary and foreign keys. The Structured Query Language (SQL) is the standard interface for creating, querying, and managing relational data."))
    story.append(sp())
    for b in [
        B("RDBMS Examples:") + " PostgreSQL, MySQL, Microsoft SQL Server, Oracle, SQLite, Amazon Redshift, Google BigQuery, Snowflake.",
        B("ACID Properties:") + " Atomicity (all or nothing), Consistency (valid state always), Isolation (transactions independent), Durability (committed data persists).",
        B("Table:") + " A named collection of rows (records) and columns (attributes). Every column has a defined data type.",
        B("Primary Key (PK):") + " Uniquely identifies each row. Cannot be NULL. Often an auto-incrementing integer or UUID.",
        B("Foreign Key (FK):") + " A column referencing the PK of another table. Enforces referential integrity.",
        B("Normalisation:") + " Process of structuring tables to reduce data redundancy. 1NF removes repeating groups; 2NF removes partial dependencies; 3NF removes transitive dependencies.",
        B("Schema:") + " The blueprint of a database — the collection of tables, views, indexes, and relationships.",
    ]:
        story.append(bul(b))
    story.append(sp())

    story.append(sec("1.2 Data Types & Constraints"))
    story += two_col_table(["Data Type", "Description & Use Case"], [
        ["INTEGER / BIGINT", "Whole numbers. Use BIGINT for large IDs or counts exceeding 2 billion."],
        ["DECIMAL / NUMERIC", "Exact fixed-point numbers. Essential for financial data to avoid float rounding errors."],
        ["FLOAT / REAL", "Approximate floating-point. Suitable for scientific measurements, not money."],
        ["VARCHAR(n)", "Variable-length string up to n characters. Most common for names, emails, labels."],
        ["TEXT", "Unlimited-length string. Good for descriptions, JSON blobs, long content."],
        ["DATE / TIMESTAMP", "Date only or date+time. Always store in UTC; convert at presentation layer."],
        ["BOOLEAN", "True/False. NULL means unknown in three-valued logic."],
        ["UUID", "128-bit universally unique identifier. Preferred for distributed systems over sequential IDs."],
        ["JSONB (Postgres)", "Binary JSON column. Allows querying nested fields with operators like -> and ->>"],
        ["ARRAY (Postgres)", "Native array of any type. Use when cardinality is low and ordering matters."],
    ])

    story.append(sp())
    story.append(body("Constraints enforce business rules at the database level, preventing invalid data from ever being stored:"))
    for b in [
        B("NOT NULL:") + " Column must always have a value. Apply to every mandatory field.",
        B("UNIQUE:") + " No two rows may have the same value in this column (or combination of columns).",
        B("CHECK:") + " Validates that column values satisfy a Boolean expression (e.g., salary > 0).",
        B("DEFAULT:") + " Provides a value when none is supplied during INSERT.",
        B("PRIMARY KEY:") + " Combination of NOT NULL + UNIQUE. Each table should have exactly one.",
        B("FOREIGN KEY:") + " References another table's PK. Add ON DELETE CASCADE or RESTRICT depending on business logic.",
    ]:
        story.append(bul(b))

    story.append(sec("1.3 Entity-Relationship (ER) Modelling"))
    story.append(body("Before writing a single line of SQL, model your domain with an Entity-Relationship diagram. Identify entities (nouns), attributes (properties), and relationships (verbs connecting entities). Cardinality expresses how many of one entity relate to another: one-to-one, one-to-many, or many-to-many."))
    story.append(sp())
    story.append(body("Many-to-many relationships require a junction (bridge) table. For example, a student can enrol in many courses, and a course can have many students. The Enrolment table holds student_id and course_id as a composite primary key, plus attributes like enrolment_date and grade."))
    story.append(sp())
    story += info_box("Real Dataset Practice — E-Commerce Schema", [
        "customers (customer_id PK, name, email, city, signup_date)",
        "products (product_id PK, name, category, unit_price, stock_qty)",
        "orders (order_id PK, customer_id FK, order_date, status, total_amount)",
        "order_items (item_id PK, order_id FK, product_id FK, quantity, line_total)",
        "reviews (review_id PK, customer_id FK, product_id FK, rating, review_text, created_at)",
        "Use this schema throughout all SQL chapters for hands-on practice.",
    ], C_GREEN)

    story += chapter(2, "Core SQL — Querying & Filtering")
    story.append(sec("2.1 The SELECT Statement"))
    story.append(body("The SELECT statement is the foundation of SQL data retrieval. Every query follows the same logical processing order regardless of how you write the clauses. Understanding this processing order is essential for writing correct queries and debugging unexpected results."))
    story.append(sp())
    story.append(body("Logical query processing order: FROM and JOIN (determine the working dataset) → WHERE (filter rows) → GROUP BY (partition rows into groups) → HAVING (filter groups) → SELECT (compute output columns) → DISTINCT (deduplicate) → ORDER BY (sort) → LIMIT/OFFSET (page results). Note that aliases defined in SELECT cannot be referenced in WHERE because WHERE executes first."))
    story.append(sp())
    for b in [
        B("SELECT *:") + " Retrieve all columns. Avoid in production code — always list explicit columns for clarity and performance.",
        B("Column aliases (AS):") + " Rename output columns. Aliases are available in ORDER BY but not in WHERE or GROUP BY in most databases.",
        B("DISTINCT:") + " Eliminates duplicate rows from output. Operates after SELECT expansion, before ORDER BY.",
        B("LIMIT / OFFSET:") + " Restrict the number of rows returned. OFFSET skips rows — useful for pagination but slow on large offsets.",
        B("ORDER BY:") + " Sort results ascending (ASC, default) or descending (DESC). Can sort by multiple columns with comma-separated list.",
        B("NULLS FIRST / LAST:") + " Control where NULL values appear in sorted output.",
        B("CASE expression:") + " Conditional logic inline in SELECT. CASE WHEN condition THEN result ELSE default END.",
    ]:
        story.append(bul(b))

    story.append(sec("2.2 Filtering with WHERE"))
    story.append(body("The WHERE clause filters rows before aggregation. It accepts comparison operators, logical operators, and a rich set of predicates designed for common data analysis patterns."))
    story.append(sp())
    story += two_col_table(["Operator / Predicate", "Behaviour & Data Analysis Use Case"], [
        ["=, <>, !=", "Exact equality or inequality. Use = for string matching (case-sensitive in Postgres, insensitive in MySQL by default)."],
        ["<, <=, >, >=", "Numeric and date range comparisons. Critical for filtering sales by date range or filtering outliers."],
        ["BETWEEN x AND y", "Inclusive range. Equivalent to col >= x AND col <= y. Use with dates for period analysis."],
        ["IN (list)", "Matches any value in a set. More readable than multiple OR conditions. Works with subqueries."],
        ["NOT IN (list)", "Excludes values. Beware: if the list contains NULL, NOT IN returns no rows — always filter NULLs first."],
        ["LIKE / ILIKE", "Pattern matching. % matches any sequence; _ matches one character. ILIKE is case-insensitive (Postgres)."],
        ["IS NULL / IS NOT NULL", "NULL comparison. Never use = NULL — this always evaluates to UNKNOWN in SQL's three-valued logic."],
        ["EXISTS (subquery)", "Returns TRUE if subquery produces at least one row. Often more efficient than IN with subqueries."],
        ["AND / OR / NOT", "Combine conditions. AND has higher precedence than OR — use parentheses to make intent explicit."],
    ])

    story.append(sec("2.3 String, Date & Numeric Functions"))
    story.append(body("SQL provides built-in functions for transforming data during querying. These are invaluable for data cleaning and feature engineering directly in SQL without needing external tools."))
    story.append(sp())
    story.append(subsec("String Functions"))
    for b in [
        B("UPPER / LOWER:") + " Normalise case for comparisons and display.",
        B("TRIM / LTRIM / RTRIM:") + " Remove leading or trailing whitespace — common data quality fix.",
        B("SUBSTRING(col, start, length):") + " Extract part of a string. Useful for parsing codes, phone numbers.",
        B("CONCAT or ||:") + " Combine strings. CONCAT handles NULLs by treating them as empty; || propagates NULL.",
        B("REPLACE(col, from, to):") + " Find-and-replace within strings.",
        B("LENGTH / CHAR_LENGTH:") + " Number of characters. Use to validate field lengths during audit queries.",
        B("SPLIT_PART(col, delimiter, n):") + " Extract the nth part of a delimited string (Postgres).",
        B("REGEXP_REPLACE / REGEXP_MATCH:") + " Regex-powered transformation and extraction.",
    ]:
        story.append(bul(b))

    story.append(subsec("Date & Time Functions"))
    for b in [
        B("CURRENT_DATE / NOW():") + " Current date or timestamp. Foundation for relative time filters.",
        B("DATE_TRUNC('month', col):") + " Truncate a timestamp to a specific precision — key for time-series aggregation.",
        B("DATE_PART('year', col) / EXTRACT:") + " Pull out individual components (year, month, day, hour) for grouping.",
        B("col + INTERVAL '7 days':") + " Date arithmetic. Calculate deadlines, days since event, sliding windows.",
        B("AGE(end_date, start_date):") + " Returns an interval representing the difference — useful for customer age, tenure.",
        B("TO_CHAR(date, 'YYYY-MM'):") + " Format a date for display or grouping at a custom granularity.",
    ]:
        story.append(bul(b))

    story += chapter(3, "Aggregations, Grouping & Window Functions")
    story.append(sec("3.1 Aggregate Functions"))
    story.append(body("Aggregate functions collapse multiple rows into a single value per group. They are the workhorses of data analysis — computing summaries, counts, averages, and distributions that transform raw data into actionable insights."))
    story.append(sp())
    story += two_col_table(["Aggregate Function", "Description & Analytics Use Case"], [
        ["COUNT(*)", "Total row count including NULLs. Use to measure record volume per segment."],
        ["COUNT(col)", "Count of non-NULL values in a column. Compare with COUNT(*) to measure completeness."],
        ["COUNT(DISTINCT col)", "Count of unique values. Essential for distinct customer counts, unique product views."],
        ["SUM(col)", "Total of a numeric column. Revenue, quantity sold, pageviews."],
        ["AVG(col)", "Arithmetic mean. Ignores NULLs — may mislead if NULLs are common; check with COUNT."],
        ["MIN(col) / MAX(col)", "Minimum or maximum value. Works on dates, strings, and numbers."],
        ["STDDEV(col)", "Standard deviation. Identify outliers, understand data spread for normalisation."],
        ["PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY col)", "Median and any percentile. More robust than AVG for skewed distributions."],
        ["STRING_AGG(col, ', ')", "Concatenate string values from multiple rows into one. Postgres/MySQL GROUP_CONCAT."],
        ["ARRAY_AGG(col)", "Collect values into an array. Useful for collecting IDs or labels per group."],
    ])

    story.append(sec("3.2 GROUP BY & HAVING"))
    story.append(body("GROUP BY partitions rows into groups sharing identical values in the specified columns. HAVING filters those groups after aggregation — it is the WHERE clause for aggregated results."))
    story.append(sp())
    for b in [
        B("GROUP BY column list:") + " Every column in SELECT that is not inside an aggregate function must appear in GROUP BY.",
        B("HAVING vs WHERE:") + " WHERE filters raw rows; HAVING filters aggregated groups. Use WHERE to reduce data volume first, then HAVING to filter aggregates.",
        B("ROLLUP:") + " Generates subtotals at each grouping level plus a grand total. Powerful for hierarchical reporting (region → country → total).",
        B("CUBE:") + " Generates all possible subtotal combinations for all columns in the GROUP BY — creates a hypercube of aggregations.",
        B("GROUPING SETS:") + " Explicitly specify which combinations to aggregate. More targeted than CUBE; avoids unnecessary combinations.",
        B("GROUPING():") + " Returns 1 when a column is aggregated (used in ROLLUP/CUBE) vs 0 when it is a real group key — helps distinguish subtotal rows.",
    ]:
        story.append(bul(b))

    story.append(sec("3.3 Window Functions — The Most Powerful SQL Feature for Analytics"))
    story.append(body("Window functions compute values across a set of rows related to the current row without collapsing them into a single group. Unlike aggregate functions with GROUP BY, window functions return one row per input row while providing access to aggregated context. They are the cornerstone of modern analytical SQL."))
    story.append(sp())
    story.append(subsec("Window Function Anatomy"))
    story.append(body("Every window function follows the pattern: FUNCTION() OVER (PARTITION BY ... ORDER BY ... ROWS/RANGE BETWEEN ...). The OVER clause defines the window — the subset of rows visible to the function for each output row."))
    story.append(sp())
    story.append(bul(B("PARTITION BY:") + " Divides rows into independent groups (like GROUP BY but rows are not collapsed). Resets the window function for each partition."))
    story.append(bul(B("ORDER BY within OVER:") + " Determines the logical ordering of rows within the partition — required for ranking and running totals."))
    story.append(bul(B("Frame specification:") + " ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW defines a cumulative window. ROWS BETWEEN 6 PRECEDING AND CURRENT ROW is a 7-day rolling window."))
    story.append(sp())

    story.append(subsec("Ranking Functions"))
    story += two_col_table(["Function", "Behaviour"], [
        ["ROW_NUMBER()", "Assigns unique sequential integers. No ties — arbitrary tiebreaking if ORDER BY is not unique."],
        ["RANK()", "Assigns same rank to tied rows; leaves gaps after ties (1, 1, 3, 4)."],
        ["DENSE_RANK()", "Same rank to tied rows; no gaps (1, 1, 2, 3). Preferred for customer/product leaderboards."],
        ["NTILE(n)", "Divides rows into n equal buckets. Use for quartile, decile, percentile segmentation."],
        ["PERCENT_RANK()", "Relative rank as a fraction between 0 and 1. Useful for normalised scoring."],
        ["CUME_DIST()", "Cumulative distribution — fraction of rows with value <= current row's value."],
    ])

    story.append(subsec("Value / Navigation Functions"))
    story += two_col_table(["Function", "Analytics Use Case"], [
        ["LAG(col, n)", "Value of col from n rows before current. Calculate day-over-day change, churn signals."],
        ["LEAD(col, n)", "Value of col from n rows ahead. Look-forward analysis, next event prediction."],
        ["FIRST_VALUE(col)", "First value in the window frame. Baseline or starting point comparisons."],
        ["LAST_VALUE(col)", "Last value in the window frame. Requires correct ROWS BETWEEN to avoid frame default."],
        ["NTH_VALUE(col, n)", "nth value in the window frame. Reference any specific position."],
    ])

    story += info_box("Real Dataset Exercise — E-Commerce Window Functions", [
        "Running total of revenue by month: SUM(total_amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING)",
        "Rank customers by total spend: DENSE_RANK() OVER (ORDER BY total_spent DESC)",
        "Day-over-day revenue change: revenue - LAG(revenue, 1) OVER (ORDER BY order_date)",
        "7-day rolling average order value: AVG(total_amount) OVER (ORDER BY order_date ROWS 6 PRECEDING)",
        "Customer's order number: ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date)",
        "Percentage of monthly revenue from each product: SUM(line_total) / SUM(SUM(line_total)) OVER (PARTITION BY month)",
    ], C_PURPLE)

    story += chapter(4, "Joins, Subqueries & CTEs")
    story.append(sec("4.1 Join Types"))
    story.append(body("Joins combine rows from two or more tables based on a related column. Choosing the correct join type is one of the most important skills in SQL data analysis — the wrong join silently returns incorrect results."))
    story.append(sp())
    story += two_col_table(["Join Type", "Behaviour & When to Use"], [
        ["INNER JOIN", "Returns only rows where the join condition matches in BOTH tables. Most common. Use when you only care about records that exist on both sides."],
        ["LEFT (OUTER) JOIN", "Returns all rows from the left table plus matching rows from the right. Non-matching right rows get NULL. Use to find customers who have or have not placed orders."],
        ["RIGHT (OUTER) JOIN", "Mirror of LEFT JOIN. Rarely used — simply swap table order and use LEFT JOIN for consistency."],
        ["FULL (OUTER) JOIN", "Returns all rows from both tables. Non-matches on either side get NULLs. Use for reconciliation between two datasets."],
        ["CROSS JOIN", "Cartesian product — every row from left combined with every row from right. Use for generating combinations (date × product for a full calendar grid)."],
        ["SELF JOIN", "Join a table with itself using different aliases. Use for hierarchical data (employee and their manager in same table) or comparing rows within a table."],
        ["LATERAL JOIN", "Each left row calls a subquery that can reference columns from the left table. Powerful for top-N per group queries."],
    ])

    story.append(sec("4.2 Subqueries"))
    story.append(body("A subquery is a SELECT statement nested inside another query. Subqueries are a fundamental building block — they appear in the SELECT list (scalar subquery), in the FROM clause (derived table), in the WHERE clause (filtering subquery), and in the HAVING clause."))
    story.append(sp())
    for b in [
        B("Scalar subquery:") + " Returns exactly one row and one column. Can appear anywhere a single value is expected — in SELECT, WHERE, or SET clauses.",
        B("Row subquery:") + " Returns one row with multiple columns. Used with comparison operators like = (SELECT a, b).",
        B("Table subquery (derived table):") + " Returns multiple rows and columns. Must be aliased in the FROM clause. Treated as a temporary table.",
        B("Correlated subquery:") + " References columns from the outer query. Executes once per outer row — can be slow on large datasets. Often replaceable with window functions or joins.",
        B("EXISTS vs IN:") + " EXISTS short-circuits after finding the first match — faster for large subquery results. IN materialises the full result set first.",
        B("NOT EXISTS anti-join:") + " Find rows in one table with no match in another (e.g., customers who have never ordered). More reliable than NOT IN when NULLs may be present.",
    ]:
        story.append(bul(b))

    story.append(sec("4.3 Common Table Expressions (CTEs)"))
    story.append(body("CTEs, introduced with the WITH keyword, are named temporary result sets defined at the beginning of a query. They make complex queries dramatically more readable by breaking them into named, logical steps — like named intermediate dataframes in pandas."))
    story.append(sp())
    for b in [
        B("Basic CTE:") + " WITH cte_name AS (SELECT ...) SELECT * FROM cte_name. Can reference the CTE multiple times in the main query.",
        B("Multiple CTEs:") + " Chain several CTEs separated by commas. Each CTE can reference those defined before it.",
        B("Recursive CTE:") + " WITH RECURSIVE allows a CTE to reference itself. Essential for hierarchical data traversal — organisation charts, bill of materials, category trees, graph paths.",
        B("CTE vs subquery:") + " Both produce the same result in most cases. CTEs win on readability. Subqueries win when the CTE would be scanned only once and the planner can inline it.",
        B("Materialisation hint:") + " In PostgreSQL, CTEs are by default optimisation fences (materialised once). Add NOT MATERIALIZED to allow the planner to inline and optimise.",
    ]:
        story.append(bul(b))

    story.append(sec("4.4 Set Operations"))
    story.append(body("Set operations combine results from two or more SELECT statements that have the same number of columns with compatible data types."))
    story.append(sp())
    for b in [
        B("UNION:") + " Combines result sets and removes duplicate rows. Implicit DISTINCT on the combined output.",
        B("UNION ALL:") + " Combines result sets and keeps all rows including duplicates. Faster than UNION — use when duplicates don't matter or you need all rows.",
        B("INTERSECT:") + " Returns only rows present in both result sets. Useful for finding common customers, products, etc.",
        B("EXCEPT / MINUS:") + " Returns rows in the first result set that are not in the second. Classic tool for data reconciliation and identifying gaps.",
    ]:
        story.append(bul(b))

    story += chapter(5, "Advanced SQL — Optimisation & Real Datasets")
    story.append(sec("5.1 Indexing Strategy"))
    story.append(body("An index is a data structure that speeds up row retrieval at the cost of additional write overhead and storage. Choosing the right indexes is the single highest-impact optimisation in SQL performance."))
    story.append(sp())
    story += two_col_table(["Index Type", "Use Case & Characteristics"], [
        ["B-tree (default)", "General-purpose. Supports =, <, >, BETWEEN, LIKE 'prefix%'. The default for most scenarios."],
        ["Hash", "Only equality (=) lookups. Faster than B-tree for pure equality but no range support."],
        ["GIN (Postgres)", "Multi-value columns: JSONB, arrays, full-text search. Inverted index — maps values to row locations."],
        ["GiST (Postgres)", "Geometric, geographic, and range data types. Used with PostGIS for spatial queries."],
        ["Partial index", "Index only rows satisfying a WHERE condition. Smaller, faster. Great for status columns (active=true)."],
        ["Composite index", "Index multiple columns together. Column order matters — most selective column first. Supports prefix queries."],
        ["Covering index (INCLUDE)", "Add non-key columns to the index so the engine never needs to visit the heap for covered queries. Eliminates table lookups."],
        ["Expression index", "Index a function applied to a column: INDEX ON orders (LOWER(email)). Supports queries using the same expression."],
    ])

    story.append(sec("5.2 Query Optimisation Techniques"))
    story.append(body("Understanding how the query planner works allows you to write queries that give the planner the best chance of choosing an efficient execution plan. Always test with EXPLAIN ANALYZE — never guess."))
    story.append(sp())
    for b in [
        B("EXPLAIN ANALYZE:") + " Shows the actual execution plan with timing. Read from inside-out; find the most expensive nodes. Look for Sequential Scans on large tables — these often need indexes.",
        B("Filter early with WHERE:") + " Push the most selective filter as early as possible to reduce rows in subsequent joins and aggregations.",
        B("Avoid functions on indexed columns in WHERE:") + " WHERE UPPER(email) = 'A@B.COM' prevents index use. Create an expression index or normalise data at write time.",
        B("Use covering indexes for hot queries:") + " If a query always retrieves the same three columns filtered by the same column, an index including all four columns serves the query entirely from the index.",
        B("Avoid SELECT *:") + " Fetching unnecessary wide columns wastes I/O and prevents covering index use.",
        B("Prefer EXISTS over COUNT for existence checks:") + " EXISTS stops scanning at the first match; COUNT scans all matching rows.",
        B("Partition large tables:") + " Range-partition orders by year/month. Queries filtering by date touch only relevant partitions (partition pruning).",
        B("Analyse and vacuum:") + " Statistics must be up-to-date for the planner to make good decisions. VACUUM reclaims dead tuple space.",
        B("Connection pooling:") + " Use PgBouncer or similar for high-throughput workloads. Opening new connections is expensive.",
    ]:
        story.append(bul(b))

    story.append(sec("5.3 Real Dataset Analysis Practicals"))
    story += info_box("Dataset 1 — NYC Taxi Trips (public dataset)", [
        "Analyse pickup/dropoff patterns by hour and borough.",
        "Calculate average fare per mile by payment type.",
        "Find top 10 most profitable driver-shift combinations using window functions.",
        "Identify rush-hour surge using LEAD/LAG to compare consecutive trip times.",
        "Build a cohort analysis: passengers who take their first trip each month and track retention.",
    ], C_BLUE)
    story += info_box("Dataset 2 — Retail Sales (Kaggle Superstore)", [
        "Monthly sales trend with running totals and MoM growth percentage.",
        "Profitability by product sub-category using GROUP BY ROLLUP.",
        "Customer RFM segmentation using NTILE on recency, frequency, and monetary score.",
        "Identify products with declining sales over rolling 3-month windows.",
        "Regional market basket analysis using self-joins on order_items.",
    ], C_GREEN)
    story += info_box("Dataset 3 — Stack Overflow Developer Survey", [
        "Compensation distribution by country, language, and experience using PERCENTILE_CONT.",
        "Technology adoption trends over years using PIVOT-style CASE aggregation.",
        "Career transition analysis: percentage who changed roles using CTEs.",
        "Identify communities of co-occurring languages using GROUP BY STRING_AGG.",
    ], C_ORANGE)

    story.append(PageBreak())
    return story


# ═══ PART 2: PYTHON ZERO TO HERO ═══════════════════════════════════════════════
def part2_python():
    story = part_page(2, "PYTHON ZERO TO HERO",
        "Environment, fundamentals, data structures, OOP, functional patterns & modules",
        C_GREEN, C_DARK)

    story += chapter(6, "Python Fundamentals & Environment")
    story.append(sec("6.1 Python Philosophy & Environment Setup"))
    story.append(body("Python's design philosophy — as captured in the Zen of Python — prioritises readability, simplicity, and explicitness. It is interpreted, dynamically typed, and garbage-collected, which makes it highly productive for data engineering, analysis, and backend development."))
    story.append(sp())
    for b in [
        B("Python versions:") + " Always use Python 3.10+ for new projects. Python 3.11 and 3.12 bring significant performance improvements (10-60% faster) and better error messages.",
        B("Virtual environments:") + " Isolate project dependencies. venv (built-in), conda (data science), or Poetry (dependency management). Never install packages globally.",
        B("pip & pip install:") + " The package installer. Always pin versions in requirements.txt or pyproject.toml for reproducibility.",
        B("pyenv:") + " Manage multiple Python versions on the same machine — essential for working across projects with different Python requirements.",
        B("Jupyter notebooks:") + " Interactive computing environment. Ideal for exploratory data analysis, visualisation, and communicating findings. JupyterLab is the modern interface.",
        B("IDEs:") + " VS Code (lightweight, excellent Python extensions), PyCharm (full-featured IDE), or Jupyter for notebooks.",
        B("PEP 8:") + " Python's official style guide. Follow consistently. Use Black or Ruff for automated code formatting.",
        B("Type hints (PEP 484):") + " Annotate function parameters and return types. Not enforced at runtime but enables static analysis with mypy and IDE autocompletion.",
    ]:
        story.append(bul(b))

    story.append(sec("6.2 Core Python Data Types"))
    story += two_col_table(["Type", "Characteristics & Data Engineering Use"], [
        ["int", "Arbitrary precision integers. No overflow in Python — integers grow as needed."],
        ["float", "IEEE 754 double-precision. Avoid for money — use decimal.Decimal for exact arithmetic."],
        ["str", "Immutable Unicode string. Rich built-in methods. f-strings (f'Hello {name}') for formatting."],
        ["bool", "Subclass of int (True=1, False=0). Short-circuit evaluation in and/or — useful for efficiency."],
        ["None", "Null value / absence of data. Check with 'is None', not '== None'."],
        ["bytes / bytearray", "Raw binary data. Essential for file I/O, network protocols, serialisation."],
        ["complex", "Complex numbers with real and imaginary parts. Niche use in signal processing."],
    ])

    story.append(sec("6.3 Variables, Expressions & Control Flow"))
    story.append(body("Python uses dynamic typing — you do not declare types, the interpreter infers them. Variables are references to objects, not containers holding values. Understanding this distinction prevents subtle bugs when working with mutable objects."))
    story.append(sp())
    for b in [
        B("Assignment and multiple assignment:") + " x = 5; a, b, c = 1, 2, 3 (tuple unpacking); a, *rest = [1,2,3,4] (starred assignment).",
        B("Augmented assignment:") + " x += 1 is equivalent to x = x + 1 but more idiomatic. Works for +=, -=, *=, /=, //=, **=, %=.",
        B("if / elif / else:") + " Ternary expression: value = a if condition else b. Walrus operator (:=) assigns and evaluates in one expression.",
        B("for loops:") + " Iterate over any iterable. Enumerate adds index: for i, val in enumerate(items). Zip combines iterables: for a, b in zip(list1, list2).",
        B("while loops:") + " Continue until condition is False. Use break to exit early; continue to skip to the next iteration; else clause runs if the loop completes without break.",
        B("Comprehensions:") + " List: [x**2 for x in range(10) if x % 2 == 0]. Dict: {k: v for k, v in items.items()}. Set: {x for x in data}. Generator: (x for x in data).",
        B("Exception handling:") + " try / except ExceptionType as e / else (no exception) / finally (always runs). Catch specific exceptions — never bare except.",
    ]:
        story.append(bul(b))

    story += chapter(7, "Data Structures & Object-Oriented Python")
    story.append(sec("7.1 Built-in Data Structures"))
    story += two_col_table(["Structure", "Characteristics, Time Complexity & Best Use"], [
        ["list []", "Ordered, mutable, allows duplicates. O(1) append/index, O(n) insert/search. Use as a general-purpose sequence."],
        ["tuple ()", "Ordered, immutable, hashable. Slightly faster and less memory than list. Use for fixed-shape records (x, y coordinates, DB rows)."],
        ["dict {}", "Key-value pairs. O(1) average get/set/delete. Keys must be hashable. Ordered by insertion since Python 3.7."],
        ["set {}", "Unordered, unique elements, hashable. O(1) average add/remove/in. Use for membership testing and deduplication."],
        ["frozenset", "Immutable set. Hashable — can be used as dict key or stored in a set."],
        ["collections.deque", "Double-ended queue. O(1) append and pop from both ends. Use for queues and sliding windows."],
        ["collections.defaultdict", "dict with default factory for missing keys. Eliminates KeyError on first access."],
        ["collections.Counter", "dict subclass counting hashable objects. top_n = counter.most_common(10). Ideal for frequency analysis."],
        ["collections.namedtuple", "Tuple with named fields. Readable, immutable, memory-efficient. Use for structured records without full class."],
        ["dataclasses.dataclass", "Auto-generates __init__, __repr__, __eq__. Modern replacement for namedtuple with mutability and defaults."],
    ])

    story.append(sec("7.2 Object-Oriented Programming (OOP)"))
    story.append(body("Python is a multi-paradigm language with first-class support for OOP. The four pillars — Encapsulation, Inheritance, Polymorphism, and Abstraction — help you build modular, maintainable, and reusable data engineering components."))
    story.append(sp())

    story.append(subsec("Classes & Instances"))
    for b in [
        B("class definition:") + " Define with class ClassName(ParentClass): block. __init__ is the initialiser (not constructor — object is already created by __new__).",
        B("self:") + " Explicit reference to the current instance. Always the first parameter of instance methods. Python passes it automatically when calling method on instance.",
        B("Instance variables:") + " Defined with self.attribute. Belong to a specific instance. Set in __init__ or any method.",
        B("Class variables:") + " Defined directly in class body. Shared across all instances. Mutable class variables can cause subtle bugs.",
        B("@property:") + " Define computed attributes with getter/setter/deleter without breaking the public API. Enables lazy computation.",
        B("@classmethod:") + " Receives the class as first argument (cls). Use for alternative constructors.",
        B("@staticmethod:") + " No implicit first argument. A regular function that lives in the class namespace for organisational purposes.",
        B("__repr__ and __str__:") + " __repr__ is for developers (unambiguous); __str__ is for users (readable). Implement both for all data classes.",
        B("__eq__, __hash__, __lt__:") + " Define equality, hashing, and ordering. If you define __eq__, also define __hash__ or the class becomes unhashable.",
    ]:
        story.append(bul(b))

    story.append(subsec("Inheritance & Polymorphism"))
    for b in [
        B("Single inheritance:") + " class Child(Parent). Inherits all methods and attributes. Call parent method with super().",
        B("Multiple inheritance:") + " Python supports it. Method Resolution Order (MRO) uses C3 linearisation — view it with ClassName.__mro__.",
        B("Abstract base classes (ABC):") + " from abc import ABC, abstractmethod. Define interfaces — subclasses must implement all abstract methods.",
        B("Mixin pattern:") + " Small classes providing specific behaviour mixed into other classes. Use for cross-cutting concerns (LoggingMixin, SerializableMixin).",
        B("Duck typing:") + " If it has a quack() method, treat it as a duck. Python relies on protocols (structural subtyping) rather than strict type hierarchies.",
        B("Protocol (typing.Protocol):") + " Structural subtyping without inheritance. Define what methods an object must have — no explicit registration.",
    ]:
        story.append(bul(b))

    story += chapter(8, "Functional Programming & Modules")
    story.append(sec("8.1 Functions as First-Class Objects"))
    story.append(body("In Python, functions are objects — they can be assigned to variables, passed as arguments, returned from other functions, and stored in data structures. This enables powerful functional programming patterns that are heavily used in data engineering pipelines."))
    story.append(sp())
    for b in [
        B("Higher-order functions:") + " Functions that take other functions as arguments or return them. map(), filter(), sorted(key=...) are examples.",
        B("Lambda functions:") + " Anonymous single-expression functions. lambda x: x**2. Use for short, one-off transformations — avoid for anything complex.",
        B("Closures:") + " A function that captures variables from its enclosing scope. Essential for building configurable functions and decorators.",
        B("Decorators:") + " A function that takes a function and returns a modified function. Use @decorator syntax. Foundation of Flask/FastAPI routing, caching, retry logic.",
        B("functools.partial:") + " Create a new function with some arguments pre-filled. Useful for configuring generic functions.",
        B("functools.lru_cache:") + " Memoisation decorator. Cache function results by arguments — instant speedup for expensive pure functions called repeatedly.",
        B("itertools:") + " Standard library of composable iterators. chain, product, combinations, permutations, groupby, islice, takewhile — learn all of them.",
        B("Generator functions (yield):") + " Memory-efficient iteration. Process large datasets record-by-record without loading all into memory. Essential for streaming ETL.",
    ]:
        story.append(bul(b))

    story.append(sec("8.2 The Python Module System"))
    story.append(body("Python's module and package system provides excellent tools for organising code into reusable, namespaced units. Understanding imports, package structure, and the __init__.py convention is essential for building production-grade data engineering code."))
    story.append(sp())
    for b in [
        B("Module:") + " Any .py file. Import with import module_name or from module_name import specific_name.",
        B("Package:") + " A directory containing an __init__.py file. Can contain sub-packages. __init__.py controls what's exported.",
        B("Relative imports:") + " from . import sibling or from .. import parent. Only valid inside packages — not in top-level scripts.",
        B("__all__:") + " List in __init__.py or module that defines what from module import * exports. Documents the public API.",
        B("sys.path:") + " List of directories Python searches for modules. Modify with care — prefer virtual environments and proper package installation.",
        B("Circular imports:") + " Modules importing each other. Often a sign of poor architecture. Resolve by extracting shared code into a third module.",
        B("importlib:") + " Dynamic import machinery. importlib.import_module(name) for plugin architectures where module names are determined at runtime.",
    ]:
        story.append(bul(b))

    story += chapter(9, "File I/O, APIs & Error Handling")
    story.append(sec("9.1 File Operations"))
    story.append(body("Python provides comprehensive file I/O through built-in open() and the pathlib module. The pathlib.Path API is the modern, object-oriented approach and should be preferred over the older os.path string-based API."))
    story.append(sp())
    for b in [
        B("pathlib.Path:") + " Path(r'/data/sales.csv'). Supports / operator for joining paths, .stem, .suffix, .parent, .exists(), .glob() — cross-platform and readable.",
        B("open(file, mode, encoding):") + " Always specify encoding='utf-8'. Modes: 'r' (read text), 'w' (write text, truncates), 'a' (append), 'rb'/'wb' (binary). Always use context manager (with open(...) as f).",
        B("Reading large files:") + " Iterate line by line (for line in file) or in chunks (file.read(chunk_size)) to avoid loading gigabytes into memory.",
        B("CSV with csv module:") + " csv.DictReader for reading into dicts; csv.DictWriter for writing. Always set newline='' on Windows.",
        B("JSON:") + " json.load(file) reads from file; json.loads(string) from string. json.dump(obj, file, indent=2) writes formatted JSON.",
        B("Pickle:") + " Python-native object serialisation. Fast but not secure for untrusted data and not interoperable with other languages.",
        B("shutil:") + " High-level file operations: copy, move, delete directories. shutil.copytree, shutil.rmtree, shutil.make_archive for backups.",
        B("tempfile:") + " Create temporary files/directories that clean up automatically. Essential for safe atomic writes and testing.",
    ]:
        story.append(bul(b))

    story.append(sec("9.2 REST APIs & HTTP"))
    story.append(body("Interacting with external REST APIs is a daily task in data engineering — pulling data from third-party services, triggering webhooks, and calling internal microservices. The requests library is the de facto standard."))
    story.append(sp())
    for b in [
        B("requests library:") + " Simple, human-friendly HTTP client. requests.get(url, params=dict, headers=dict, timeout=30). Always set a timeout.",
        B("Response handling:") + " response.status_code, response.json(), response.text, response.content (bytes). Raise for HTTP errors with response.raise_for_status().",
        B("Authentication patterns:") + " API key in header (Authorization: Bearer token), OAuth2 client credentials, Basic Auth, JWT tokens.",
        B("Pagination:") + " Many APIs paginate responses. Implement loop checking next_page or offset. Use generators to stream pages lazily.",
        B("Rate limiting:") + " Respect Retry-After headers. Implement exponential backoff with jitter for retries on 429 Too Many Requests.",
        B("httpx:") + " Modern async-capable alternative to requests. Same API but supports async/await for concurrent API calls — much faster for high-volume data ingestion.",
        B("Session reuse:") + " requests.Session() reuses TCP connections across multiple requests. Critical for performance when calling the same host repeatedly.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 3: DATA SCIENCE ═══════════════════════════════════════════════════
def part3_datascience():
    story = part_page(3, "PYTHON FOR DATA SCIENCE",
        "NumPy, Pandas, Matplotlib, Seaborn, PySpark & Python Backend Development",
        C_ORANGE, C_DARK)

    story += chapter(10, "NumPy & Pandas Deep Dive")
    story.append(sec("10.1 NumPy — Foundation of Numerical Computing"))
    story.append(body("NumPy provides the ndarray — an n-dimensional, fixed-type, contiguous array stored in C. Every major Python data science library (Pandas, SciPy, scikit-learn, TensorFlow, PyTorch) is built on NumPy arrays under the hood. Understanding NumPy unlocks the ability to write fast, vectorised code that avoids slow Python for loops."))
    story.append(sp())
    for b in [
        B("ndarray:") + " N-dimensional array with a single data type (dtype). Shape is a tuple of dimension sizes. NumPy stores data in contiguous memory for CPU cache efficiency.",
        B("dtype:") + " Data type of array elements: float32, float64, int32, int64, bool, complex128. Choose the smallest dtype that fits your data to save memory.",
        B("Broadcasting:") + " Rules for performing operations on arrays of different shapes without explicit loops or copies. Fundamental to writing efficient numerical code.",
        B("Vectorisation:") + " Apply operations to entire arrays at once using NumPy's C-implemented ufuncs. 10-1000x faster than equivalent Python loops.",
        B("Fancy indexing:") + " Index with arrays of integers or booleans. arr[arr > 0] selects positive elements; arr[[0,2,4]] selects specific rows.",
        B("Views vs copies:") + " Slicing creates a view (shared memory); fancy indexing creates a copy. Modifying a view modifies the original — a common source of bugs.",
        B("np.nan:") + " IEEE floating-point NaN (Not a Number). Use np.isnan() to detect, np.nanmean() for NaN-aware aggregations.",
        B("Linear algebra (np.linalg):") + " Matrix multiplication (@), dot product, eigenvalues, singular value decomposition, matrix inverse, determinant.",
        B("Random number generation (np.random):") + " Reproducible random arrays with rng = np.random.default_rng(seed=42). Generate normal, uniform, integer distributions.",
        B("Universal functions (ufuncs):") + " np.sqrt, np.exp, np.log, np.sin applied element-wise. Support reduce, accumulate, outer operations.",
    ]:
        story.append(bul(b))

    story.append(sec("10.2 Pandas — The Data Analysis Workhorse"))
    story.append(body("Pandas is the dominant tool for tabular data manipulation in Python. It provides two primary data structures: Series (1D labelled array) and DataFrame (2D labelled table). Pandas excels at data loading, cleaning, transformation, merging, and exploratory analysis."))
    story.append(sp())

    story.append(subsec("DataFrame Fundamentals"))
    for b in [
        B("Creating DataFrames:") + " From dict of lists, list of dicts, NumPy array, CSV, Excel, SQL query, JSON, or Parquet. pd.read_csv('file.csv', parse_dates=['date'], dtype={'id': 'int32'}).",
        B("Inspecting data:") + " df.shape, df.dtypes, df.info(), df.head(10), df.tail(), df.sample(20), df.describe(include='all').",
        B("Index:") + " The row label. Default is a RangeIndex (0, 1, 2...). Set meaningful indexes with df.set_index('column'). Reset with df.reset_index().",
        B("Column selection:") + " df['col'] returns Series; df[['col1','col2']] returns DataFrame. Never chain column selection with row selection.",
        B("Boolean indexing:") + " df[df['sales'] > 1000] filters rows. Combine conditions with & (and), | (or), ~ (not) — not Python's and/or.",
        B(".loc vs .iloc:") + " .loc selects by label (inclusive both ends); .iloc selects by integer position (exclusive end). Always prefer .loc for clarity.",
        B("copy() vs view:") + " Pandas doesn't always warn about chained assignment. Use df.copy() explicitly to avoid SettingWithCopyWarning.",
    ]:
        story.append(bul(b))

    story.append(subsec("Data Cleaning with Pandas"))
    for b in [
        B("Missing values:") + " Detect with df.isnull().sum(). Fill with df.fillna(value or method). Drop with df.dropna(subset=['col'], how='any'). Impute with transform for group-wise imputation.",
        B("Duplicates:") + " df.duplicated(subset=['key_cols']).sum() counts duplicates. df.drop_duplicates(subset=..., keep='first') removes them.",
        B("Type casting:") + " df['col'].astype('int32') or pd.to_numeric(df['col'], errors='coerce') to force numeric conversion, making unparseable values NaN.",
        B("String operations (.str accessor):") + " df['name'].str.lower(), .str.strip(), .str.contains('pattern'), .str.split(',').str[0]. Vectorised string operations — no loops needed.",
        B("Category dtype:") + " For low-cardinality string columns (gender, status), use df['status'].astype('category'). Reduces memory by 5-10x and speeds up groupby.",
        B("Outlier detection:") + " IQR method: Q1 = df['col'].quantile(0.25); Q3 = df['col'].quantile(0.75); IQR = Q3-Q1. Filter: df[(df['col'] >= Q1-1.5*IQR) & (df['col'] <= Q3+1.5*IQR)].",
        B("Reshaping:") + " df.melt() converts wide to long format. df.pivot_table() creates pivot tables with aggregation. df.stack()/unstack() transpose levels.",
    ]:
        story.append(bul(b))

    story.append(subsec("Advanced Pandas — GroupBy, Merge & Time Series"))
    for b in [
        B("groupby + agg:") + " df.groupby('region').agg({'sales': 'sum', 'orders': 'count', 'price': ['mean','median']}). agg accepts list of functions per column.",
        B("groupby + transform:") + " Returns a Series with same index as original df — useful for group-wise normalisation and filling missing values with group mean.",
        B("groupby + apply:") + " Apply any function returning a scalar, Series, or DataFrame. More flexible than agg but slower — prefer vectorised solutions when possible.",
        B("merge:") + " pd.merge(left, right, on='key', how='inner'). Supports left_on/right_on for differently named keys, suffixes for column conflicts, validate for key uniqueness checks.",
        B("concat:") + " pd.concat([df1, df2], axis=0) for stacking rows; axis=1 for stacking columns. Use ignore_index=True to reset index.",
        B("Time series with DatetimeIndex:") + " df.resample('M').sum() resamples to monthly. df.rolling(7).mean() computes 7-day rolling average. df.shift(1) shifts values one period.",
        B("pd.Grouper:") + " df.groupby(pd.Grouper(key='date', freq='W')).agg() — group by time frequency without setting index.",
        B("Performance tips:") + " Use .loc for targeted assignment; vectorise with np.where() instead of apply(lambda); categorise low-cardinality strings; read Parquet not CSV for large datasets.",
    ]:
        story.append(bul(b))

    story += chapter(11, "Data Visualisation — Matplotlib & Seaborn")
    story.append(sec("11.1 Matplotlib Architecture"))
    story.append(body("Matplotlib is the foundational plotting library. Every other Python visualisation library either wraps it (Seaborn, Pandas .plot()) or is inspired by it. Understanding the Figure/Axes object hierarchy lets you control every aspect of a plot."))
    story.append(sp())
    for b in [
        B("Figure:") + " The entire canvas/window. Contains one or more Axes. Created with fig = plt.figure() or fig, axes = plt.subplots(nrows, ncols).",
        B("Axes:") + " A single plot area with x and y axes. The Axes object is where you call .plot(), .scatter(), .bar(), .hist() etc.",
        B("pyplot interface:") + " plt.plot(), plt.show() — a stateful interface convenient for quick scripts. Use the object-oriented interface (ax.plot()) for production code.",
        B("Subplots:") + " fig, axes = plt.subplots(2, 3, figsize=(15,8)) creates a 2×3 grid. Access with axes[row, col]. Flatten with axes.flatten() for iteration.",
        B("Figure size and DPI:") + " figsize=(width, height) in inches. dpi controls resolution (72 for screen, 300 for print). savefig('file.png', dpi=300, bbox_inches='tight').",
        B("Customisation:") + " ax.set_title(), ax.set_xlabel(), ax.set_ylabel(), ax.set_xlim(), ax.set_ylim(), ax.legend(), ax.grid(True), ax.tick_params(), ax.set_facecolor().",
        B("Colour maps:") + " plt.cm.viridis, .plasma, .coolwarm for continuous; tab10, Set2 for categorical. Avoid rainbow — poor for colour blindness.",
        B("Saving figures:") + " plt.savefig('output.svg', format='svg') for vector graphics; PNG for raster. Always call before plt.show().",
    ]:
        story.append(bul(b))

    story.append(sec("11.2 Chart Types — When to Use What"))
    story += two_col_table(["Chart Type", "Purpose & Data Analysis Use Case"], [
        ["Line chart", "Trends over time. Ideal for time series: revenue per month, website traffic, stock prices."],
        ["Bar / Horizontal bar", "Comparing discrete categories. Horizontal for many categories or long labels. Use grouped bars for side-by-side comparison."],
        ["Scatter plot", "Relationship between two continuous variables. Add hue for a third dimension (colour by group)."],
        ["Histogram", "Distribution of a continuous variable. Adjust bins carefully — too few hides shape, too many creates noise."],
        ["Box plot", "Distribution summary: median, quartiles, whiskers, outliers. Compare distributions across groups."],
        ["Violin plot", "Like box plot but shows full distribution shape via KDE. More informative for multimodal distributions."],
        ["Heatmap", "Correlation matrix, confusion matrix, or any 2D grid of values. Colour intensity encodes magnitude."],
        ["Pie / Donut", "Part-to-whole. Only use with 2-4 categories. Prefer bar chart for more categories — angles are hard to judge."],
        ["Area chart", "Stacked or filled line chart. Shows both trend and composition over time."],
        ["Pair plot", "All pairwise scatter plots for multiple numeric columns. Excellent for exploratory analysis of feature relationships."],
    ])

    story.append(sec("11.3 Seaborn — Statistical Visualisation"))
    story.append(body("Seaborn is a high-level statistical visualisation library built on Matplotlib. It directly understands Pandas DataFrames, integrates with statistical concepts, and produces publication-quality plots with minimal code. It shines for exploratory data analysis and communicating statistical findings."))
    story.append(sp())
    for b in [
        B("sns.set_theme():") + " Apply a consistent visual theme (darkgrid, whitegrid, dark, white, ticks) plus a colour palette across all plots in the session.",
        B("sns.displot / histplot / kdeplot:") + " Distribution plots. displot is a figure-level function; histplot and kdeplot are axes-level (preferred for subplots).",
        B("sns.boxplot / violinplot / stripplot:") + " Categorical distribution plots. sns.boxplot(x='category', y='value', data=df, hue='segment').",
        B("sns.scatterplot / lineplot:") + " Relational plots with automatic hue, size, and style mapping for multi-dimensional data.",
        B("sns.barplot:") + " Shows mean (or other estimator) with confidence intervals. The error bars communicate statistical uncertainty.",
        B("sns.heatmap:") + " sns.heatmap(df.corr(), annot=True, fmt='.2f', cmap='coolwarm', vmin=-1, vmax=1) for correlation matrices.",
        B("sns.pairplot:") + " All pairwise relationships in one call. sns.pairplot(df, hue='species', diag_kind='kde', plot_kws={'alpha':0.5}).",
        B("sns.FacetGrid:") + " Create multi-panel figures stratified by categorical variables. Powerful for comparing distributions across subgroups.",
        B("Seaborn objects API (v0.12+):") + " New declarative API — so.Plot(df, x='col', y='val').add(so.Dot()).add(so.Line()). Composable and more flexible.",
    ]:
        story.append(bul(b))

    story += info_box("Visualisation Best Practices for Data Analysis", [
        "Choose chart type based on the relationship you want to convey, not aesthetics.",
        "Always label axes with variable name and unit. Include a descriptive title.",
        "Use colour purposefully — to encode data, not to decorate. Max 6-7 colours in a categorical palette.",
        "Show uncertainty: confidence intervals, error bars, or distribution plots rather than just point estimates.",
        "Reduce chart junk: remove unnecessary gridlines, borders, tick marks, and legends when not needed.",
        "Use consistent scales when comparing multiple charts. Log scale for data spanning orders of magnitude.",
        "For dashboards: use Plotly (interactive) or Streamlit (full app) instead of static Matplotlib/Seaborn.",
    ], C_PURPLE)

    story += chapter(12, "PySpark for Big Data")
    story.append(sec("12.1 Spark Architecture"))
    story.append(body("Apache Spark is a unified analytics engine for large-scale data processing. PySpark is the Python API for Spark. Unlike Pandas which runs on a single machine, Spark distributes computation across a cluster of nodes, enabling processing of datasets that are terabytes to petabytes in size."))
    story.append(sp())
    for b in [
        B("Driver:") + " The main process running your PySpark application. Coordinates the work and collects results. Runs on the master node.",
        B("Executor:") + " Worker processes running on cluster nodes. Execute tasks and store data in memory (RDD partitions or DataFrame partitions).",
        B("SparkContext / SparkSession:") + " SparkContext is the legacy entry point. SparkSession is the modern unified entry point for all Spark functionality — creates DataFrames, reads data, runs SQL.",
        B("RDD (Resilient Distributed Dataset):") + " Low-level distributed collection. Fault-tolerant through lineage. Generally prefer DataFrames (Spark SQL) over RDDs for performance and readability.",
        B("DataFrame (Spark):") + " Distributed table with named columns and schema. Spark optimises via the Catalyst query planner. Very similar API to Pandas but executed on the cluster.",
        B("Dataset (Scala/Java):") + " Typed version of DataFrame. Python doesn't have Datasets — use DataFrames with type hints instead.",
        B("Transformations vs Actions:") + " Transformations (filter, select, join, groupBy) are lazy — they build a logical plan but don't execute. Actions (count, collect, show, write) trigger execution.",
        B("DAG (Directed Acyclic Graph):") + " Spark builds a DAG of transformations. The Catalyst optimizer rewrites the logical plan to a more efficient physical plan before execution.",
        B("Partitions:") + " Each DataFrame is divided into partitions stored across executors. Number of partitions affects parallelism — aim for 2-4 partitions per CPU core.",
    ]:
        story.append(bul(b))

    story.append(sec("12.2 PySpark DataFrame Operations"))
    story.append(body("PySpark's DataFrame API is deliberately similar to Pandas but operates on distributed data. The key difference is that operations are lazy — you can chain many transformations and Spark will optimise them together before executing."))
    story.append(sp())
    story.append(subsec("Reading Data"))
    for b in [
        B("CSV:") + " spark.read.option('header','true').option('inferSchema','true').csv('s3://bucket/data/*.csv'). Prefer explicit schema over inferSchema for production.",
        B("Parquet:") + " spark.read.parquet('path') — columnar format with compression. The standard format for large-scale analytics. Significantly faster than CSV.",
        B("Delta Lake:") + " spark.read.format('delta').load('path') — transactional storage layer on Parquet. Preferred in Databricks environments.",
        B("JSON:") + " spark.read.json('path') — handles nested/semi-structured data. Use df.select(explode('array_col')) to flatten arrays.",
        B("Explicit schema:") + " Define schema with StructType and StructField for production pipelines. Avoids slow schema inference and catches data quality issues early.",
    ]:
        story.append(bul(b))
    story.append(subsec("Core Transformations"))
    for b in [
        B("select / selectExpr:") + " Choose or compute columns. selectExpr accepts SQL strings — selectExpr('col * 2 as doubled', 'UPPER(name) as upper_name').",
        B("filter / where:") + " Filter rows. df.filter(df['age'] > 25) or df.filter('age > 25'). Both are equivalent.",
        B("withColumn:") + " Add or replace a column. df.withColumn('new_col', df['a'] + df['b']). For multiple columns, chain withColumn calls.",
        B("groupBy + agg:") + " df.groupBy('region', 'product').agg(sum('revenue').alias('total_rev'), avg('price').alias('avg_price')). Import functions from pyspark.sql.functions.",
        B("join:") + " df1.join(df2, on='key', how='inner'). Broadcast hint for small tables: df1.join(broadcast(df2), 'key') prevents shuffle.",
        B("Window functions:") + " Same analytical functions as SQL. from pyspark.sql.window import Window. spec = Window.partitionBy('region').orderBy('date'). F.rank().over(spec).",
        B("UDFs (User-Defined Functions):") + " Extend Spark with Python functions. Pandas UDF (vectorised UDF) is dramatically faster than scalar UDF — use it whenever possible.",
    ]:
        story.append(bul(b))

    story.append(sec("12.3 Performance & Optimisation in PySpark"))
    for b in [
        B("Avoid collect() on large datasets:") + " collect() brings all data to the driver — causes OOM for large datasets. Use show(n), take(n), or write to storage instead.",
        B("Broadcast joins:") + " When joining a large table with a small table (<100MB), broadcast the small table to all executors — eliminates shuffle.",
        B("Repartition vs coalesce:") + " repartition(n) creates exactly n partitions (shuffles data). coalesce(n) reduces partitions without full shuffle — use after filtering.",
        B("Cache / persist:") + " df.cache() (MEMORY_AND_DISK) or df.persist(StorageLevel.MEMORY_ONLY). Cache DataFrames that are reused multiple times in the same application.",
        B("Adaptive Query Execution (AQE):") + " Spark 3.0+ feature that automatically optimises join strategies, coalesces shuffle partitions, and handles data skew at runtime.",
        B("Data skew:") + " When some partitions have far more data than others, those tasks become bottlenecks. Detect with Spark UI. Fix with salting (adding random prefix to skewed key).",
        B("Spark UI:") + " Access at localhost:4040 during execution. Inspect DAG, stages, tasks, and identify shuffle bottlenecks, skewed tasks, and slow stages.",
    ]:
        story.append(bul(b))

    story += chapter(13, "Python Backend Development")
    story.append(sec("13.1 FastAPI — Modern Python Web Framework"))
    story.append(body("FastAPI is the premier Python web framework for building APIs. It leverages Python's type hints to auto-generate OpenAPI documentation, perform request validation, and provide excellent IDE support. It is one of the fastest Python web frameworks, matching Node.js and Go in benchmarks thanks to async support."))
    story.append(sp())
    for b in [
        B("Async support:") + " FastAPI is built on Starlette (ASGI framework). Use async def for endpoints that do I/O (DB queries, HTTP calls). FastAPI uses Uvicorn as the ASGI server.",
        B("Path and query parameters:") + " Declared as function parameters with type hints. FastAPI automatically parses, validates, and documents them.",
        B("Request bodies:") + " Use Pydantic models. Define a class inheriting from BaseModel with typed fields. FastAPI validates incoming JSON against the model automatically.",
        B("Pydantic models:") + " Data validation and serialisation using Python type hints. Field(...) for required fields with validation rules. Validators with @field_validator.",
        B("Dependency injection:") + " Depends() function for reusable logic (authentication, DB sessions, rate limiting). Deeply composable — dependencies can have their own dependencies.",
        B("Routers:") + " APIRouter groups related endpoints. Include with app.include_router(router, prefix='/api/v1', tags=['users']). Keeps code modular.",
        B("Middleware:") + " Process requests/responses globally. Use for authentication, logging, CORS, compression, rate limiting.",
        B("Background tasks:") + " BackgroundTasks.add_task(fn, args) — runs after response is sent. For longer tasks, use Celery with Redis or RabbitMQ.",
        B("Exception handling:") + " HTTPException(status_code=404, detail='Not found'). Custom exception handlers with @app.exception_handler(ExcType).",
        B("Lifespan events:") + " @asynccontextmanager lifespan function handles startup (connect to DB, warm cache) and shutdown (close connections).",
    ]:
        story.append(bul(b))

    story.append(sec("13.2 Database Integration with SQLAlchemy & Async"))
    for b in [
        B("SQLAlchemy ORM:") + " Map Python classes to database tables. Session for unit of work. Declarative Base for model definition.",
        B("Async SQLAlchemy:") + " Use async_sessionmaker with asyncpg (Postgres) or aiosqlite. async with session.begin() for transaction management.",
        B("Alembic:") + " Database schema migration tool for SQLAlchemy. autogenerate detects model changes and generates migration scripts.",
        B("Repository pattern:") + " Abstract DB access behind a repository class. Makes testing easier (mock the repo, not the DB) and keeps business logic clean.",
        B("Connection pooling:") + " SQLAlchemy's built-in pool. Set pool_size, max_overflow, pool_timeout appropriately for production load.",
        B("N+1 query problem:") + " Lazy loading related models triggers one query per row — use eager loading (joinedload, selectinload) to fetch in a single query.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 4: DATABRICKS ═══════════════════════════════════════════════════════
def part4_databricks():
    story = part_page(4, "DATABRICKS ZERO TO HERO",
        "Lakehouse architecture, Delta Lake, Spark, MLflow & data engineering workflows",
        C_TEAL, C_DARK)

    story += chapter(14, "Databricks Architecture & Workspace")
    story.append(sec("14.1 The Databricks Lakehouse Platform"))
    story.append(body("Databricks is a unified data analytics platform built on top of Apache Spark. It introduced the Lakehouse paradigm — combining the low-cost storage and flexibility of a data lake with the ACID transactions and performance of a data warehouse. It runs on all major cloud providers (AWS, Azure, GCP) and abstracts infrastructure management."))
    story.append(sp())
    for b in [
        B("Lakehouse:") + " Architecture combining data lake (cheap object storage) with data warehouse (ACID, schema, governance). Eliminates the costly and fragile ETL pipeline from lake to warehouse.",
        B("Unity Catalog:") + " Databricks' unified governance layer. Provides fine-grained access control, data lineage, automated tagging, and cross-workspace discovery for all data assets.",
        B("Workspace:") + " The collaborative environment containing notebooks, clusters, jobs, repos, and the data explorer. Think of it as the Databricks IDE.",
        B("Clusters:") + " Managed Spark clusters. All-purpose clusters for interactive development; Job clusters for automated pipelines (cheaper, terminated after job). Delta Live Tables manages its own compute.",
        B("Databricks Runtime (DBR):") + " Pre-configured environment with specific versions of Spark, Delta Lake, MLflow, and Python. ML Runtime adds GPU support and popular ML libraries.",
        B("Repos (Git integration):") + " Native Git integration in the workspace. Connect notebooks to GitHub, GitLab, or Azure DevOps for version-controlled development.",
        B("Secrets:") + " Databricks secret scopes store credentials (API keys, passwords) securely. Reference in notebooks with dbutils.secrets.get(scope, key) — never hardcode credentials.",
        B("dbutils:") + " Databricks Utilities. dbutils.fs for filesystem operations (DBFS, cloud storage), dbutils.secrets, dbutils.widgets for notebook parameters, dbutils.notebook for notebook chaining.",
    ]:
        story.append(bul(b))

    story.append(sec("14.2 Cluster Configuration & Optimisation"))
    story.append(body("Choosing the right cluster configuration significantly impacts both performance and cost. Databricks clusters are Spark clusters — understanding Spark's resource model helps you make informed decisions."))
    story.append(sp())
    for b in [
        B("Cluster modes:") + " Standard (multi-user, single access), High Concurrency (multi-user SQL, Python), Single Node (no distributed processing, cheap for dev/ML). Serverless compute avoids cluster management entirely.",
        B("Driver vs Worker nodes:") + " Driver runs the SparkContext and your notebook. Workers run Executors. Driver should be smaller (unless collecting lots of data); workers should have enough memory for partitions.",
        B("Autoscaling:") + " Enable for workloads with variable resource needs. Min and max workers. Databricks enhanced autoscaling scales based on queue and shuffle data.",
        B("Spot instances (AWS Preemptible/Azure Spot):") + " 60-80% cost reduction. On-demand for driver, spot for workers. Use with checkpointing for fault tolerance.",
        B("Instance types:") + " Memory-optimised (r5, Standard_E) for wide DataFrames; Compute-optimised (c5) for CPU-bound transformations; GPU instances for ML training.",
        B("Init scripts:") + " Shell scripts run at cluster start. Install custom libraries, configure OS settings. Stored in DBFS or cloud storage.",
        B("Cluster policies:") + " Admins define templates restricting cluster configuration options — enforces cost control and security standards for team clusters.",
    ]:
        story.append(bul(b))

    story += chapter(15, "Delta Lake & Lakehouse Data Engineering")
    story.append(sec("15.1 Delta Lake Fundamentals"))
    story.append(body("Delta Lake is an open-source storage layer that brings ACID transactions, versioning, and schema enforcement to data lakes. It stores data as Parquet files with a transaction log (_delta_log/) that records every change. Delta Lake is the foundation of the Databricks Lakehouse."))
    story.append(sp())
    for b in [
        B("ACID transactions:") + " All writes to Delta tables are atomic — they either fully succeed or fully fail. Readers always see a consistent snapshot. No more partial writes corrupting your data lake.",
        B("Time travel:") + " Every change creates a new version in the transaction log. Read historical data with VERSION AS OF 5 or TIMESTAMP AS OF '2024-01-01'. Invaluable for auditing and recovery.",
        B("Schema enforcement:") + " By default, Delta rejects writes with schemas incompatible with the table. Schema evolution (mergeSchema option) allows adding new columns safely.",
        B("Upserts with MERGE:") + " MERGE INTO target USING source ON condition WHEN MATCHED UPDATE... WHEN NOT MATCHED INSERT... — atomic, efficient upsert without delete-and-reinsert.",
        B("Compaction (OPTIMIZE):") + " Small files accumulate from streaming writes and frequent updates. OPTIMIZE compacts them into larger Parquet files. ZORDER BY collocates related data for faster queries.",
        B("Vacuum:") + " Removes old Parquet files no longer referenced by the transaction log. Respects retention period (default 7 days for time travel). VACUUM table RETAIN 168 HOURS.",
        B("Change Data Feed (CDF):") + " Captures all row-level changes (insert, update, delete) as a stream. Enable with delta.enableChangeDataFeed. Read changes with table_changes('table', startVersion).",
        B("Liquid Clustering (new):") + " Replaces static partitioning with dynamic, self-optimising clustering. No need to choose partition columns upfront — cluster on query columns.",
    ]:
        story.append(bul(b))

    story.append(sec("15.2 Medallion Architecture"))
    story.append(body("The Medallion Architecture is the standard data organisation pattern in a Databricks Lakehouse. It structures data into three quality layers, each with progressively higher data quality and readiness for consumption."))
    story.append(sp())
    story += info_box("Bronze Layer — Raw Ingestion", [
        "Exact copy of raw data from source systems — no transformations applied.",
        "Preserves original format (JSON, CSV, Avro) and all fields including corrupted or null data.",
        "Append-only. Serves as the system of record for raw data — replay from here if downstream logic changes.",
        "Store with minimal Parquet conversion and source metadata (ingestion timestamp, source file name).",
        "Tools: Auto Loader (Databricks), Kafka connector, JDBC connectors, cloud storage events.",
    ], colors.HexColor("#5D4037"))
    story += info_box("Silver Layer — Cleaned & Conformed", [
        "Cleansed, standardised, and joined data. Apply data quality rules, deduplication, and type casting.",
        "Normalise naming conventions, enforce referential integrity, handle NULL values consistently.",
        "Apply business logic that is independent of specific use cases — universal transformations.",
        "Store as Delta tables with enforced schemas. Primary key constraints for deduplication.",
        "Result: Reliable, query-ready data that any downstream team can trust.",
    ], C_GRAY)
    story += info_box("Gold Layer — Business-Ready Aggregates", [
        "Aggregated, denormalised, and use-case-specific data ready for BI, dashboards, and ML.",
        "Optimised for read performance — pre-aggregated metrics, wide tables, materialised views.",
        "Dimensional models (star schema) for BI tools. Feature store tables for ML pipelines.",
        "Each Gold table has a clear owner, SLA, and documentation. Versioned and tested with dbt or DLT.",
        "Result: The 'source of truth' tables that power dashboards, executive reports, and model training.",
    ], C_GOLD)

    story.append(sec("15.3 Delta Live Tables (DLT)"))
    story.append(body("Delta Live Tables is Databricks' declarative ETL framework. You declare what your tables should contain, and DLT manages orchestration, error handling, data quality, and infrastructure automatically. It is the most productive way to build Medallion Architecture pipelines on Databricks."))
    story.append(sp())
    for b in [
        B("Streaming vs batch tables:") + " @dlt.table for batch materialised tables; @dlt.append_flow or dlt.read_stream() for streaming. DLT handles the complexity of incremental processing.",
        B("Expectations (data quality):") + " @dlt.expect('valid_age', 'age >= 0') defines quality rules. Choose WARN (log violation), FAIL (abort pipeline), or DROP (drop violating rows).",
        B("Dependency graph:") + " DLT automatically builds the DAG of dependencies between tables. Run the entire pipeline with one click — no need to manually sequence jobs.",
        B("Live vs complete mode:") + " Complete mode recomputes the entire table each run. Live (streaming) mode processes only new data incrementally — far more efficient.",
        B("Continuous pipelines:") + " DLT can run continuously, processing new streaming data within seconds of arrival — without you writing any streaming state management code.",
        B("Pipeline monitoring:") + " Built-in event log, data quality metrics, lineage graph, and row counts for each table in the pipeline UI.",
    ]:
        story.append(bul(b))

    story += chapter(16, "MLflow & Feature Engineering")
    story.append(sec("16.1 MLflow on Databricks"))
    story.append(body("MLflow is an open-source platform for the ML lifecycle. Databricks is the primary maintainer of MLflow and provides deep native integration. Every Databricks cluster comes with MLflow pre-installed and experiment tracking automatically logged to the managed MLflow server."))
    story.append(sp())
    for b in [
        B("Experiment tracking:") + " Log parameters (hyperparameters), metrics (accuracy, loss), and artefacts (model files, plots) for every training run. Compare runs visually in the UI.",
        B("Model registry:") + " Central catalogue of registered models with versioning, staging (None → Staging → Production → Archived), and alias management.",
        B("Auto-logging (mlflow.autolog()):") + " One line that automatically logs all parameters and metrics for scikit-learn, XGBoost, LightGBM, PyTorch, TensorFlow, and more.",
        B("Model flavours:") + " MLflow wraps models in a standard format. Log with mlflow.sklearn.log_model(), mlflow.pytorch.log_model(). Serve any flavour with the same inference API.",
        B("MLflow Projects:") + " Package ML code in a reproducible format (MLproject file). Run locally, on Databricks, or on Kubernetes with mlflow run.",
        B("MLflow Deployments:") + " Deploy registered models to REST endpoints, Databricks Model Serving, SageMaker, Azure ML, or as batch scoring jobs.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 5: KAFKA ════════════════════════════════════════════════════════════
def part5_kafka():
    story = part_page(5, "APACHE KAFKA ZERO TO HERO",
        "Distributed streaming, producers, consumers, Kafka Streams & real-time pipelines",
        C_RED, C_DARK)

    story += chapter(17, "Kafka Architecture & Core Concepts")
    story.append(sec("17.1 What is Apache Kafka?"))
    story.append(body("Apache Kafka is a distributed event streaming platform. It provides a persistent, high-throughput, fault-tolerant log that enables systems to publish and subscribe to streams of events, store them durably, and process them in real-time or retrospectively. Kafka has become the backbone of modern data architectures."))
    story.append(sp())
    for b in [
        B("Event / Message:") + " The fundamental unit of data in Kafka. An event is an immutable record of something that happened. It has a key, value, timestamp, and optional headers.",
        B("Topic:") + " A named category to which events are published. Topics are the central abstraction — producers write to topics, consumers read from topics.",
        B("Partition:") + " Each topic is divided into partitions — ordered, immutable sequences of events. Partitions are the unit of parallelism. More partitions = more parallelism.",
        B("Offset:") + " Each event within a partition has a unique, sequential integer offset. Consumers track their position by storing the offset of the last processed event.",
        B("Broker:") + " A single Kafka server. A Kafka cluster typically has 3-9 brokers for fault tolerance. Each partition has one leader broker handling reads and writes.",
        B("Producer:") + " A client application writing events to Kafka topics. Producers choose which partition to send to (by key hash, round-robin, or custom partitioner).",
        B("Consumer:") + " A client application reading events from Kafka topics. Consumers commit offsets to track their progress.",
        B("Consumer Group:") + " A group of consumers sharing the same group.id. Kafka assigns partitions to consumers within a group — each partition consumed by exactly one consumer in the group. This is Kafka's horizontal scaling model.",
        B("ZooKeeper / KRaft:") + " Traditionally Kafka used ZooKeeper for cluster coordination. Kafka 3.x+ replaces ZooKeeper with the built-in KRaft consensus protocol — simpler and faster.",
    ]:
        story.append(bul(b))

    story.append(sec("17.2 Kafka's Storage Model"))
    story.append(body("Understanding Kafka's storage model is key to configuring it correctly and understanding its performance characteristics. Unlike a traditional message queue, Kafka retains messages on disk for a configurable period regardless of whether they have been consumed."))
    story.append(sp())
    for b in [
        B("Log-based storage:") + " Each partition is an ordered, immutable, append-only log stored on disk. Sequential I/O makes Kafka extremely fast — disk can match or exceed random-access SSD in throughput.",
        B("Log segments:") + " Each partition log is divided into segments. The active segment receives new messages; older segments are candidates for deletion.",
        B("Retention policy:") + " Delete by time (retention.ms, default 7 days) or by size (retention.bytes). Compact policy retains only the latest value per key — ideal for changelog topics.",
        B("Log compaction:") + " Kafka periodically merges segments to keep only the most recent event per key. Guarantees at least the latest state is always available, regardless of retention period.",
        B("Replication:") + " Each partition has a configurable replication factor (typically 3). One broker is the leader; others are followers. If the leader fails, a follower is elected leader automatically.",
        B("ISR (In-Sync Replicas):") + " The set of replicas that are fully caught up with the leader. Acks=all ensures a write is confirmed by all ISR replicas — highest durability but higher latency.",
    ]:
        story.append(bul(b))

    story.append(sec("17.3 Key Configuration Parameters"))
    story += two_col_table(["Parameter", "Impact & Recommended Setting"], [
        ["replication.factor", "Copies of each partition. Set to 3 for production. Higher = more fault tolerance but more storage cost."],
        ["min.insync.replicas", "Minimum ISR replicas for a write to succeed. Set to 2 with acks=all for strong durability guarantees."],
        ["retention.ms", "How long to retain messages. 7 days (604800000ms) is a common default. Increase for replay-heavy workloads."],
        ["num.partitions", "Default partition count for new topics. Start with number of expected consumer instances. Can increase but not decrease."],
        ["compression.type", "lz4 or zstd offer best compression/CPU balance. Enable for topics with compressible data (JSON, Avro)."],
        ["max.message.bytes", "Maximum message size (default 1MB). Increase with caution — large messages impact memory and latency."],
        ["unclean.leader.election.enable", "false for financial/critical data. Prevents out-of-sync replica becoming leader — avoids data loss."],
    ])

    story += chapter(18, "Producers, Consumers & Kafka Streams")
    story.append(sec("18.1 Producer Deep Dive"))
    story.append(body("The producer is responsible for publishing events to Kafka. Producer configuration choices directly impact throughput, latency, and durability guarantees. Understanding the producer internals helps you tune for your specific requirements."))
    story.append(sp())
    for b in [
        B("acks (acknowledgements):") + " 0 = fire and forget (fastest, no durability). 1 = leader ack (fast, loses data if leader fails before replication). all = all ISR acks (safest, recommended).",
        B("Batching:") + " Producers batch events before sending. batch.size (bytes) and linger.ms (wait time) control batching. More batching = higher throughput, higher latency.",
        B("Partitioning:") + " With a key, Kafka uses hash(key) % num_partitions — same key always goes to same partition (ordering guarantee). Without key, round-robin across partitions.",
        B("Idempotent producer:") + " enable.idempotence=true ensures exactly-once delivery to a single partition even with retries. Should always be enabled in production.",
        B("Transactional producer:") + " initTransactions(), beginTransaction(), commitTransaction() — atomic writes across multiple partitions. Used for exactly-once end-to-end.",
        B("Retries and retry.backoff.ms:") + " Automatic retries on transient failures. With idempotent producer, retries are safe — no duplicates.",
        B("Serialisation:") + " Values must be serialised to bytes. Common serialisers: ByteArraySerializer, StringSerializer, Avro (with Schema Registry), Protobuf, JSON.",
    ]:
        story.append(bul(b))

    story.append(sec("18.2 Consumer Deep Dive"))
    for b in [
        B("Offset management:") + " enable.auto.commit=true (at-most-once semantics). For at-least-once, disable auto-commit and commit manually after successful processing.",
        B("Consumer group rebalancing:") + " When a consumer joins or leaves, Kafka reassigns partition ownership. During rebalance, consumption pauses. Cooperative sticky rebalancing minimises disruption.",
        B("Lag monitoring:") + " Consumer lag = latest offset - committed offset. High lag means consumers can't keep up. Monitor with kafka-consumer-groups.sh or Burrow.",
        B("max.poll.records:") + " Maximum records returned per poll. Lower values reduce memory pressure; higher values increase throughput. Tune based on processing time per record.",
        B("session.timeout.ms / heartbeat.interval.ms:") + " If no heartbeat received within session.timeout.ms, broker assumes consumer is dead and triggers rebalance.",
        B("Seek operations:") + " seekToBeginning() and seekToEnd() allow replaying from the start or jumping to the latest offset — useful for backfills and debugging.",
        B("Dead Letter Queue (DLQ):") + " Route messages that fail processing after max retries to a separate DLQ topic for manual inspection and replay.",
    ]:
        story.append(bul(b))

    story.append(sec("18.3 Kafka Streams & ksqlDB"))
    story.append(body("Kafka Streams is a client library for building stream processing applications that read from and write to Kafka topics. It runs inside your application — no separate cluster needed. ksqlDB provides a SQL interface for stream processing on top of Kafka Streams."))
    story.append(sp())
    for b in [
        B("KStream:") + " Unbounded stream of events. Each record is an independent event. Stream processing operations: filter, map, flatMap, join, branch.",
        B("KTable:") + " Changelog stream that represents the current state of a key. Each new event with a key replaces the previous value — a materialised view of the latest state.",
        B("GlobalKTable:") + " KTable replicated to all instances. Use for small lookup tables (product catalogue, user details) that need to be joinable from any partition of a stream.",
        B("Windowing:") + " Tumbling windows (non-overlapping, fixed size), Hopping windows (overlapping, fixed size), Session windows (activity-based, variable size). Windowed aggregations emit results per window.",
        B("Stateful operations:") + " Count, aggregate, and join operations require local state stores (backed by a changelog topic for fault tolerance).",
        B("ksqlDB:") + " SQL on Kafka streams. CREATE STREAM, CREATE TABLE, SELECT with real-time windowed aggregations. Ideal for analytics teams who know SQL but not Java.",
        B("Schema Registry:") + " Confluent Schema Registry stores Avro/Protobuf/JSON Schema schemas. Ensures producers and consumers agree on the format — critical for production data governance.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 6: DBT ══════════════════════════════════════════════════════════════
def part6_dbt():
    story = part_page(6, "dbt — DATA BUILD TOOL",
        "Transformation-as-code, testing, documentation, orchestration & best practices",
        C_PURPLE, C_DARK)

    story += chapter(19, "dbt Fundamentals & Project Structure")
    story.append(sec("19.1 What is dbt?"))
    story.append(body("dbt (data build tool) is a transformation tool that enables data analysts and engineers to transform raw data in the warehouse using SQL. dbt brings software engineering best practices — version control, testing, documentation, and modularity — to the transformation layer of the modern data stack."))
    story.append(sp())
    for b in [
        B("Core philosophy:") + " dbt only does the T in ELT (Extract, Load, Transform). It assumes data is already loaded into your data warehouse (Snowflake, BigQuery, Redshift, Databricks, DuckDB).",
        B("Models:") + " A dbt model is a SQL SELECT statement in a .sql file. dbt compiles it into DDL/DML and runs it against your warehouse. Output can be a view, table, incremental table, or ephemeral CTE.",
        B("Materialisation strategies:") + " view (default, no storage), table (full refresh each run), incremental (append/merge only new records), ephemeral (inline CTE, no object created), snapshot (SCD Type 2).",
        B("Jinja templating:") + " dbt uses Jinja2 to make SQL dynamic. {{ ref('model_name') }} creates dependencies; {{ source('schema', 'table') }} references raw data; if/for blocks enable conditional logic.",
        B("ref():") + " The most important dbt function. References another model by name — automatically resolves to the correct schema and creates the DAG dependency. Never hardcode schema names.",
        B("source():") + " References raw data sources defined in sources.yml. Enables source freshness testing and documents lineage from raw tables to final models.",
        B("DAG (Directed Acyclic Graph):") + " dbt builds a dependency graph from ref() calls. Executes models in correct order, in parallel where possible. Visualise with dbt docs generate + dbt docs serve.",
        B("dbt Cloud vs dbt Core:") + " dbt Core is open source CLI tool. dbt Cloud adds a web IDE, job scheduling, CI/CD integration, and a managed metadata store.",
    ]:
        story.append(bul(b))

    story.append(sec("19.2 Project Structure"))
    story.append(body("A well-organised dbt project maps closely to the Medallion Architecture or a logical staging → intermediate → mart layer structure. Consistency in naming and organisation enables teams to navigate large projects with hundreds of models."))
    story.append(sp())
    story += info_box("Recommended dbt Project Structure", [
        "models/staging/ — One model per source table. Light transformations: rename columns, cast types, add source metadata. Prefix: stg_",
        "models/intermediate/ — Join and combine staging models. Business logic applied. Not exposed to BI directly. Prefix: int_",
        "models/marts/ — Final, denormalised, business-ready tables. Organised by business domain (marketing, finance, product). Prefix: fct_ or dim_",
        "models/utilities/ — Reusable utility models: date spine, calendar table, etc.",
        "tests/ — Custom singular tests (SQL files that should return zero rows when test passes).",
        "macros/ — Reusable Jinja macros. Extract repeated SQL patterns into parameterised macros.",
        "snapshots/ — SCD Type 2 history tables using dbt's snapshot feature.",
        "seeds/ — Small, static CSV files loaded as tables (country codes, segment mappings).",
        "analyses/ — Ad-hoc SQL queries not materialised but version-controlled and compilable.",
    ], C_PURPLE)

    story.append(sec("19.3 dbt Configuration Files"))
    for b in [
        B("dbt_project.yml:") + " Project-level configuration. Set default materialisations, schema names, and paths by model folder. Configure the project name, profile, and model paths.",
        B("profiles.yml:") + " Connection credentials per target environment (dev, staging, prod). Typically stored in ~/.dbt/ (not in the repo). Use environment variables for secrets.",
        B("schema.yml:") + " YAML files defining sources, model documentation, column descriptions, and generic tests for models. dbt uses these for documentation and test generation.",
        B("sources.yml:") + " Define raw source tables. Set freshness checks (loaded_at_field, warn_after, error_after). dbt source freshness command validates data is recent.",
        B("packages.yml:") + " External dbt packages. dbt-utils (utility macros), dbt-expectations (data quality tests), dbt-date (date utilities). Install with dbt deps.",
    ]:
        story.append(bul(b))

    story += chapter(20, "Advanced dbt — Tests, Docs & Orchestration")
    story.append(sec("20.1 Testing in dbt"))
    story.append(body("Testing is a first-class citizen in dbt. Tests run after models are built and validate data quality. dbt distinguishes between generic tests (applied to any model via YAML) and singular tests (custom SQL assertions)."))
    story.append(sp())
    story.append(subsec("Generic Tests (Built-in + dbt-utils)"))
    story += two_col_table(["Test", "What It Validates"], [
        ["unique", "Every value in a column is unique. Apply to primary keys and natural keys."],
        ["not_null", "No NULL values exist in a column. Apply to every mandatory column."],
        ["accepted_values", "All values are in a predefined set (e.g., status IN ('active','inactive','pending'))."],
        ["relationships", "Foreign key integrity — every value in a column exists in a referenced column."],
        ["dbt_utils.expression_is_true", "A SQL expression evaluates to TRUE for every row. Very flexible — custom business rules."],
        ["dbt_utils.recency", "The most recent record is within a specified threshold. Detects stale data."],
        ["dbt_expectations.expect_column_values_to_be_between", "Values fall within a specified numeric range. Validate amount columns, scores."],
        ["dbt_expectations.expect_table_row_count_to_be_between", "Row count is within expected bounds. Detect unexpected data drops or explosions."],
    ])

    story.append(subsec("Test Configuration"))
    for b in [
        B("Severity:") + " Tests can be warn (log warning, continue) or error (stop the run). Use warn for data quality metrics you track over time; error for critical integrity constraints.",
        B("store_failures:") + " Persist failed rows to a table in the database. Invaluable for investigating which specific records failed a test.",
        B("where clause:") + " Apply tests only to a subset of rows. E.g., only test not_null on records created after the data quality initiative launch date.",
        B("Test selection:") + " dbt test --select model_name or dbt test --select tag:daily. Run tests on specific models or tagged groups.",
    ]:
        story.append(bul(b))

    story.append(sec("20.2 Documentation & Data Lineage"))
    for b in [
        B("Column-level documentation:") + " Add description to every column in schema.yml. Good descriptions explain business meaning, units, and any important caveats.",
        B("dbt docs generate:") + " Compiles documentation from schema.yml + model SQL into a static website with full lineage graph, model source, and test results.",
        B("dbt docs serve:") + " Launches a local web server to browse the documentation site. Share with stakeholders for self-service data discovery.",
        B("Lineage graph:") + " Interactive DAG showing every source, model, and exposure. Trace the origin of any metric back to the raw source — essential for debugging data issues.",
        B("Exposures:") + " Define downstream consumers (dashboards, ML models, APIs) in exposures.yml. Connects the dbt DAG to BI tools, enabling full end-to-end lineage.",
        B("doc blocks:") + " Write longer documentation in markdown .md files and reference with {{ doc('block_name') }} in schema.yml — keeps YAML files clean.",
    ]:
        story.append(bul(b))

    story.append(sec("20.3 Orchestration & Production Patterns"))
    story.append(body("Running dbt models in production requires a reliable orchestration layer. dbt Cloud provides built-in scheduling; for complex dependencies with other tools (ingestion, ML, notifications), use Airflow, Prefect, or Dagster."))
    story.append(sp())
    for b in [
        B("dbt Cloud Jobs:") + " Schedule model runs with cron syntax. Configure retries, notifications (Slack, email on failure). Generate and serve docs as part of the job.",
        B("dbt Cloud CI:") + " Trigger dbt runs on pull requests against a slim CI schema. dbt build --select state:modified+ builds only changed models and their downstream dependents.",
        B("Apache Airflow:") + " Most popular orchestrator. DbtTaskGroup or BashOperator running dbt CLI commands. Astronomer Cosmos creates individual Airflow tasks per dbt model — fine-grained observability.",
        B("Prefect:") + " Python-native orchestration. dbt-prefect integration. Flow-based DAGs with native retry, alerting, and deployment management.",
        B("Dagster:") + " Asset-based orchestration that natively understands dbt models as software-defined assets. Best-in-class dbt integration with full lineage in Dagster's UI.",
        B("Incremental models in production:") + " Use --full-refresh flag periodically to rebuild from scratch. Set is_incremental() logic carefully to handle late-arriving data.",
        B("Blue/Green deployments with dbt:") + " Run new model version in a staging schema; validate with tests; swap aliases to production. Zero-downtime schema changes.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 7: CAPSTONE ══════════════════════════════════════════════════════════
def part7_capstone():
    story = part_page(7, "END-TO-END CAPSTONE PROJECT",
        "Full data pipeline: ingestion → Kafka → Databricks → dbt → visualisation",
        C_GOLD, C_DARK)

    story += chapter(21, "Architecture & Dataset Selection")
    story.append(sec("21.1 Capstone Overview"))
    story.append(body("This capstone project builds a complete, production-grade data pipeline for a fictional e-commerce company. It integrates every technology covered in this guide: SQL for analysis, Python for ingestion and transformation, Kafka for real-time event streaming, Databricks with Delta Lake for the Lakehouse, dbt for SQL transformations, and a BI tool for visualisation."))
    story.append(sp())
    story += info_box("Project: RealShop Analytics Platform", [
        "Business Goal: Real-time and historical analytics for an e-commerce marketplace.",
        "Dataset: NYC Taxi + Synthetically generated orders, customers, products, events.",
        "Scale: ~10M orders, ~1M customers, ~100K products, ~50M clickstream events.",
        "Architecture: Producer apps → Kafka → Databricks Structured Streaming → Delta Lake (Bronze/Silver/Gold) → dbt (Gold transformations) → Tableau/Power BI.",
        "Deliverables: Real-time sales dashboard, customer cohort analysis, product recommendation feature table, daily business metrics report.",
    ], C_GOLD)

    story.append(sec("21.2 Technology Stack Decisions"))
    story += two_col_table(["Component", "Technology Choice & Rationale"], [
        ["Event streaming", "Apache Kafka (Confluent Cloud) — industry standard, replayable, decouples producers from consumers."],
        ["Raw ingestion to lake", "Databricks Auto Loader — monitors cloud storage, incrementally ingests, handles schema evolution."],
        ["Storage format", "Delta Lake on Azure Data Lake Storage Gen2 — ACID, time travel, schema enforcement."],
        ["Compute", "Databricks with autoscaling job clusters — managed Spark, cost-efficient for batch; serverless for interactive."],
        ["Transformation framework", "dbt Core on Databricks SQL Warehouse — SQL-first, testable, documented transformations."],
        ["Orchestration", "Apache Airflow (Astronomer) — production-grade scheduling, Kafka → Databricks → dbt chain."],
        ["Visualisation", "Power BI connected to Databricks SQL Warehouse — DirectQuery for real-time; Import for historical."],
        ["Data quality", "dbt tests + Great Expectations for raw data validation before Bronze ingestion."],
        ["CI/CD", "GitHub Actions for dbt model deployment; Databricks Asset Bundles for job deployment."],
    ])

    story += chapter(22, "Building the Full Pipeline")
    story.append(sec("22.1 Layer 1 — Event Generation & Kafka Ingestion"))
    story.append(body("Simulate real-time e-commerce events: page views, add-to-cart, order placement, payment completion, and order status updates. Each event type has its own Kafka topic following a consistent naming convention: environment.domain.entity.event_type."))
    story.append(sp())
    for b in [
        B("Event schema design:") + " Each event has: event_id (UUID), event_type, user_id, session_id, timestamp, payload (JSONB). Schema registered in Confluent Schema Registry as Avro.",
        B("Producer application:") + " Python FastAPI service that produces events to Kafka on each API call. Uses Confluent Kafka Python client with idempotent producer and acks=all.",
        B("Topic design:") + " prod.commerce.orders.placed (partitioned by customer_id), prod.commerce.clickstream.pageview (partitioned by session_id), prod.commerce.payments.completed.",
        B("Schema evolution:") + " All schemas use BACKWARD_TRANSITIVE compatibility — consumers on older schema versions can read messages produced with newer schemas.",
    ]:
        story.append(bul(b))

    story.append(sec("22.2 Layer 2 — Bronze Ingestion with Databricks"))
    for b in [
        B("Kafka → Bronze:") + " Databricks Structured Streaming reads from Kafka. Write to Delta Bronze tables with: event arrival time, Kafka partition+offset metadata, and raw payload as STRING.",
        B("Auto Loader for batch:") + " Historical CSV/JSON files dropped to ADLS trigger Auto Loader. cloudFiles format auto-detects schema changes and processes new files incrementally.",
        B("Bronze schema:") + " raw_payload (STRING), source_topic (STRING), kafka_offset (BIGINT), kafka_partition (INT), ingestion_timestamp (TIMESTAMP), processing_date (DATE).",
        B("Error handling:") + " Corrupt records written to _corrupt_record column. Dead letter topics in Kafka for messages that consistently fail deserialization.",
    ]:
        story.append(bul(b))

    story.append(sec("22.3 Layer 3 — Silver Transformations with PySpark"))
    for b in [
        B("Parse and validate:") + " Parse JSON payload from Bronze using from_json() with explicit schema. Validate required fields are not null, event_type is in accepted set, timestamp is valid.",
        B("Deduplicate:") + " Use event_id + watermarking to deduplicate events in the streaming job. For batch, use ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY ingestion_timestamp).",
        B("Enrich:") + " Join with customer, product, and category dimension tables from Silver. Add derived fields: device_type (parsed from user_agent), country (from IP geolocation lookup).",
        B("MERGE for upserts:") + " Delta MERGE to update Silver order tables when order status changes arrive — maintain current state while CDF captures full history.",
    ]:
        story.append(bul(b))

    story.append(sec("22.4 Layer 4 — Gold with dbt"))
    for b in [
        B("Staging models:") + " stg_orders, stg_customers, stg_products, stg_clickstream — clean field names, cast types, add descriptive aliases.",
        B("Intermediate models:") + " int_order_items_with_product (join order items with product details), int_customer_sessions (aggregate clickstream to session level).",
        B("Fact tables:") + " fct_orders (grain: one row per order), fct_order_items (grain: one row per line item), fct_pageviews (grain: one row per pageview).",
        B("Dimension tables:") + " dim_customers (current state with SCD Type 2 history via snapshot), dim_products, dim_date (date spine with business calendar).",
        B("Metrics layer:") + " mart_daily_sales_summary, mart_customer_cohort_retention, mart_product_performance — pre-aggregated Gold tables for BI consumption.",
        B("dbt tests:") + " Unique + not_null on all PKs, relationships FKs, accepted_values on status columns, expression_is_true on business rules (order_total >= 0), recency on daily fact tables.",
    ]:
        story.append(bul(b))

    story.append(sec("22.5 Layer 5 — Visualisation"))
    for b in [
        B("Executive dashboard:") + " Daily revenue, order volume, AOV (Average Order Value), conversion rate. MoM and YoY comparisons. Trend lines with 7-day and 30-day rolling averages.",
        B("Customer analytics:") + " Cohort retention heatmap (month joined vs months retained). RFM segmentation scatter plot. New vs returning customer split over time.",
        B("Product performance:") + " Top/bottom products by revenue, margin, and return rate. Category tree with drill-down. Cross-sell affinity matrix.",
        B("Real-time operations:") + " Live order volume per minute (Direct Query to Gold streaming table). Geographic heatmap of current demand. Anomaly alert when hourly volume drops >20%.",
        B("Power BI best practices:") + " Star schema model in Power BI. Calculated measures in DAX for YTD, MoM%, Rank. Row-level security by region for regional managers.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 8: BLOCKCHAIN ════════════════════════════════════════════════════════
def part8_blockchain():
    story = part_page(8, "BLOCKCHAIN & SOLIDITY DEVELOPMENT",
        "Blockchain fundamentals, Solidity zero to hero & JavaScript for blockchain",
        C_NAVY, C_DARK)

    story += chapter(23, "Blockchain Fundamentals")
    story.append(sec("23.1 What is a Blockchain?"))
    story.append(body("A blockchain is a distributed, decentralised ledger that records transactions across a network of computers. Once data is recorded, it is extremely difficult to alter. Each block contains a cryptographic hash of the previous block, transaction data, and a timestamp — creating an immutable, verifiable chain."))
    story.append(sp())
    for b in [
        B("Block:") + " A container for a set of validated transactions plus metadata: block number, timestamp, hash of previous block (parent hash), and the Merkle root of all transactions.",
        B("Chain:") + " Blocks are cryptographically linked. Changing any block invalidates all subsequent blocks — this immutability is the core security property.",
        B("Decentralisation:") + " No single authority controls the blockchain. Thousands of independent nodes each hold a full or partial copy of the ledger. Consensus mechanisms synchronise the state.",
        B("Consensus mechanisms:") + " Algorithms ensuring all nodes agree on the valid chain. Proof of Work (computational puzzle, used by Bitcoin), Proof of Stake (economic stake, used by Ethereum), Delegated PoS, Proof of Authority, BFT variants.",
        B("Cryptographic hash:") + " SHA-256 (Bitcoin) or Keccak-256 (Ethereum). Deterministic one-way function — any change in input produces a completely different output. Underpins block linking and address generation.",
        B("Merkle tree:") + " Binary tree of transaction hashes. The Merkle root summarises all transactions in a block. Enables efficient proof that a transaction is included without downloading the whole block.",
        B("Digital signatures:") + " Elliptic Curve Digital Signature Algorithm (ECDSA) on secp256k1. Private key signs transactions; public key (derived as Ethereum address) verifies. Only the private key owner can authorise spending.",
        B("Gas (Ethereum):") + " Unit measuring computational work. Every operation has a gas cost. Users pay gas_price × gas_used in ETH. EIP-1559 introduced base fee (burned) + priority tip (to validator).",
    ]:
        story.append(bul(b))

    story.append(sec("23.2 Ethereum Architecture"))
    story.append(body("Ethereum extended Bitcoin's model with a Turing-complete virtual machine (EVM) enabling programmable smart contracts. This transformed blockchain from a simple value transfer mechanism into a general-purpose decentralised computing platform."))
    story.append(sp())
    for b in [
        B("EVM (Ethereum Virtual Machine):") + " Stack-based virtual machine running on every Ethereum node. Executes smart contract bytecode deterministically. All nodes must produce identical output for the same input.",
        B("Accounts:") + " Two types: Externally Owned Accounts (EOA) controlled by private keys, and Contract Accounts controlled by their smart contract code. Both have an address, ETH balance, and transaction nonce.",
        B("Transactions:") + " Signed messages from an EOA to the network. Can transfer ETH, deploy a contract, or call a contract function. Broadcast to mempool, included in a block by validators.",
        B("Smart contracts:") + " Programs stored on the blockchain. Deployed once at an address; callable by anyone. State changes are recorded in the blockchain. Code is immutable after deployment (unless designed with upgradeable proxy patterns).",
        B("ABI (Application Binary Interface):") + " JSON specification of a smart contract's functions, events, and parameters. Used by frontends and tools to encode function calls and decode return values.",
        B("Events / Logs:") + " Smart contracts emit events stored in transaction receipts (not in the EVM state). Cheap storage for data that doesn't need to be read on-chain. Indexed to enable efficient log filtering.",
        B("Ethereum 2.0 (The Merge):") + " Transitioned from Proof of Work to Proof of Stake in September 2022. Validators stake 32 ETH to participate. Reduced energy consumption by ~99.95%.",
        B("Layer 2 solutions:") + " Rollups (Optimistic: Optimism, Arbitrum; ZK-Rollups: zkSync, Starknet, Polygon zkEVM) batch transactions off-chain and post proofs to Ethereum mainnet. Orders of magnitude cheaper and faster.",
    ]:
        story.append(bul(b))

    story += chapter(24, "Solidity Zero to Hero")
    story.append(sec("24.1 Solidity Language Fundamentals"))
    story.append(body("Solidity is the primary programming language for writing Ethereum smart contracts. It is statically typed, contract-oriented, and compiles to EVM bytecode. Every design decision has security and gas cost implications that don't exist in traditional programming."))
    story.append(sp())
    for b in [
        B("Pragma:") + " pragma solidity ^0.8.20 specifies the compiler version. The ^ allows any compatible patch version. Always pin major and minor versions in production.",
        B("SPDX license identifier:") + " // SPDX-License-Identifier: MIT is required. The compiler emits a warning without it.",
        B("Value types:") + " uint (uint8 to uint256), int (int8 to int256), bool, address, address payable, bytes1 to bytes32, fixed-size arrays. Stored by value on the stack or in storage.",
        B("Reference types:") + " string, bytes, structs, arrays, mappings. Must specify data location: storage (persistent), memory (temporary), or calldata (read-only function argument).",
        B("address vs address payable:") + " address cannot receive ETH; address payable can. Use payable(addr) to cast. Prevents accidentally sending ETH to contracts that can't receive it.",
        B("uint256 as the default:") + " Ethereum works natively with 256-bit integers. Smaller types (uint8) save storage slot packing space but cost extra gas for type conversion in computations.",
        B("Visibility:") + " public (callable externally and internally, auto-generates getter for state vars), private (only this contract), internal (this contract and derived contracts), external (only from outside).",
        B("State mutability:") + " view (reads state, no writes), pure (no reads or writes, just computation), payable (can receive ETH). Non-payable functions revert if ETH is sent.",
    ]:
        story.append(bul(b))

    story.append(sec("24.2 Data Structures in Solidity"))
    story.append(body("Solidity's storage model is fundamentally different from traditional programming. Storage is a key-value store of 32-byte slots on the EVM, costing 20,000 gas to write a non-zero value to a zero slot and 5,000 to update. Understanding this drives efficient contract design."))
    story.append(sp())
    story += two_col_table(["Data Structure", "Characteristics, Gas Cost & Best Practices"], [
        ["mapping(K => V)", "Hash map with O(1) read/write. Keys are not enumerable — cannot iterate. Default value for any key is zero value of V. Most common data structure in contracts."],
        ["mapping(K => mapping(K2 => V))", "Nested mapping. Common for two-dimensional relationships like token allowances (owner => spender => amount)."],
        ["uint256[]", "Dynamic array. push() costs O(1) amortised, pop() O(1). Never iterate unboundedly — gas limit prevents processing long arrays in a single transaction."],
        ["uint256[n]", "Fixed-size array. Size known at compile time. More gas-efficient than dynamic array when size is predictable."],
        ["struct", "User-defined type grouping related data. Pack smaller types (uint128, uint64, bool) together in a struct to fit in fewer storage slots — saves gas."],
        ["enum", "User-defined type with named values stored as uint8. Improves readability. Extend cautiously — adding values at the end is safe; reordering breaks ABI compatibility."],
    ])

    story.append(sec("24.3 Functions, Modifiers & Events"))
    for b in [
        B("Function structure:") + " function name(params) visibility stateMutability returns(type) { body }. Functions are the public API of a contract.",
        B("Modifiers:") + " Reusable pieces of code that modify function behaviour. modifier onlyOwner() { require(msg.sender == owner); _; } — the underscore _ is where the function body executes.",
        B("Events:") + " Logs emitted to the blockchain transaction receipt. event Transfer(address indexed from, address indexed to, uint256 value). emit Transfer(from, to, amount). Indexed parameters are searchable.",
        B("Fallback function:") + " fallback() external payable executes when called with unknown function signature. receive() external payable executes when ETH is sent with no calldata.",
        B("Custom errors (Solidity 0.8+):") + " error InsufficientBalance(uint256 available, uint256 required). revert InsufficientBalance(balance, amount). More gas-efficient than revert strings.",
        B("Function overloading:") + " Solidity supports overloading by parameter types (same name, different signature). Not common but valid.",
        B("Return multiple values:") + " function foo() returns (uint256, bool) { return (42, true); }. Destructure with (a, b) = foo().",
    ]:
        story.append(bul(b))

    story.append(sec("24.4 Inheritance, Interfaces & Libraries"))
    for b in [
        B("Inheritance:") + " contract Child is Parent { }. Child inherits all non-private state variables and functions. Use override to override virtual functions. Multiple inheritance resolved via C3 linearisation.",
        B("abstract contracts:") + " Contract with at least one unimplemented function. Cannot be deployed directly. Similar to abstract classes in OOP.",
        B("Interfaces:") + " interface IERC20 { function transfer(...) external returns (bool); }. Only function signatures — no implementations, no state variables. Every function is implicitly external.",
        B("Libraries:") + " Reusable, stateless code. Deploy once (library address) and all contracts using it share the deployment. SafeMath was the classic library — now built into 0.8.x with checked arithmetic.",
        B("Using for directive:") + " using SafeERC20 for IERC20; attaches library functions to a type. Enables token.safeTransfer(to, amount) calling SafeERC20.safeTransfer(token, to, amount).",
        B("OpenZeppelin Contracts:") + " The gold standard library for secure Solidity patterns. ERC20, ERC721, ERC1155, Ownable, AccessControl, ReentrancyGuard, Pausable, Upgradeable proxies. Audited and battle-tested.",
        B("EIP standards:") + " ERC-20 (fungible tokens), ERC-721 (NFTs), ERC-1155 (multi-token), ERC-4626 (tokenised vaults), ERC-2981 (NFT royalties). Always implement standard interfaces for ecosystem compatibility.",
    ]:
        story.append(bul(b))

    story.append(sec("24.5 Security Patterns & Common Vulnerabilities"))
    story.append(body("Smart contract security is paramount — once deployed, contracts are immutable and control real financial value. Vulnerabilities have led to hundreds of millions of dollars in losses. Every developer must understand the most common attack vectors."))
    story.append(sp())
    story += two_col_table(["Vulnerability", "Description & Prevention"], [
        ["Reentrancy", "External contract calls back into your contract before state is updated. Fix: checks-effects-interactions pattern (update state BEFORE external calls) or ReentrancyGuard modifier."],
        ["Integer overflow/underflow", "Arithmetic wraps around. Fixed in Solidity 0.8+ by default (reverts on overflow). Use unchecked{} block only when intentional and proven safe."],
        ["Access control", "Missing or incorrect access checks allow unauthorised callers. Fix: onlyOwner modifier, OpenZeppelin AccessControl, role-based permissions on every sensitive function."],
        ["Tx.origin vs msg.sender", "tx.origin is the original transaction sender; msg.sender is the immediate caller. Never use tx.origin for authentication — vulnerable to phishing proxy attacks."],
        ["Timestamp dependence", "block.timestamp can be manipulated by miners within ~15 seconds. Don't use for random number generation or critical time comparisons with small windows."],
        ["Unchecked return values", "Calling token.transfer() without checking the bool return can silently fail. Use SafeERC20.safeTransfer() which reverts on failure."],
        ["Denial of Service (DoS)", "Loops over unbounded arrays or pushing ether to arbitrary addresses can cause permanent DoS. Use pull-over-push pattern for ETH payments."],
        ["Flash loan attacks", "Borrow millions in a single transaction to manipulate prices and exploit logic. Fix: Use Chainlink oracles for prices, never use spot DEX prices as oracles."],
        ["Front-running", "Mempool visibility allows miners/bots to order transactions advantageously. Fix: commit-reveal schemes, slippage limits, MEV-protection relayers."],
    ])

    story.append(sec("24.6 Development Tools & Testing"))
    for b in [
        B("Hardhat:") + " JavaScript-based Ethereum development environment. Hardhat Network (local EVM), compile, test (Mocha/Chai/Ethers.js), deploy scripts, console.log in Solidity for debugging.",
        B("Foundry:") + " Rust-based toolchain. Forge for testing (tests written in Solidity — very fast), Cast for CLI interaction, Anvil for local node. Preferred for complex protocol development.",
        B("Slither:") + " Static analysis tool for Solidity. Detects 70+ vulnerability patterns. Run in CI pipeline — catches common bugs automatically before human review.",
        B("Mythril / Echidna:") + " Symbolic execution and property-based fuzzing tools. Find edge-case vulnerabilities that static analysis misses.",
        B("OpenZeppelin Defender:") + " Automated smart contract operations: governance automation, monitoring, relayers, autotasks. Production security and operations infrastructure.",
        B("Tenderly:") + " Transaction simulation, debugging, monitoring, and alerting. Decode reverts with full stack traces — invaluable for mainnet debugging.",
        B("Gas optimisation:") + " Use storage packing, events instead of storage for history, mappings over arrays for lookups, unchecked arithmetic for safe overflow paths, calldata vs memory for external function arrays.",
    ]:
        story.append(bul(b))

    story += chapter(25, "JavaScript for Blockchain Development")
    story.append(sec("25.1 ethers.js — The Modern Web3 Library"))
    story.append(body("ethers.js is the most popular JavaScript library for interacting with Ethereum. It provides a clean, well-documented API for connecting to the blockchain, reading state, sending transactions, and listening to events. It is significantly smaller and more modern than Web3.js."))
    story.append(sp())
    for b in [
        B("Provider:") + " Represents a connection to the Ethereum network. Read-only. Types: JsonRpcProvider (node URL), WebSocketProvider (real-time events), BrowserProvider (MetaMask/wallet in browser).",
        B("Signer:") + " An account that can sign and send transactions. Wraps a private key or delegates to a wallet. provider.getSigner() returns the connected wallet's signer.",
        B("Contract:") + " new ethers.Contract(address, abi, signerOrProvider). Call read-only functions directly. Write functions return a transaction response.",
        B("Reading contract state:") + " Await any view/pure function call. Returns JavaScript types mapped from Solidity types: uint256 → BigInt, address → string (checksummed), bool → boolean.",
        B("Sending transactions:") + " Call a write function on contract — returns TransactionResponse. Await tx.wait() for TransactionReceipt with status, logs, gas used.",
        B("Listening to events:") + " contract.on('Transfer', (from, to, value, event) => {...}). Use contract.queryFilter(filter, startBlock, endBlock) for historical events.",
        B("BigInt for amounts:") + " Ethereum values are uint256 — use ethers.parseEther('1.5') → BigInt in wei. ethers.formatEther(bigint) → human-readable string. Never use floating point for ETH amounts.",
        B("ENS resolution:") + " provider.resolveName('vitalik.eth') returns the address. provider.lookupAddress(addr) returns the ENS name for an address.",
    ]:
        story.append(bul(b))

    story.append(sec("25.2 Building a DApp Frontend"))
    for b in [
        B("Wallet connection:") + " Request accounts with window.ethereum.request({method:'eth_requestAccounts'}). User approves in MetaMask. BrowserProvider wraps window.ethereum for ethers.js.",
        B("Network detection:") + " Always check the connected chainId matches your expected network. Display helpful error if user is on wrong network.",
        B("Transaction lifecycle UI:") + " Show pending spinner while tx is in mempool. Show confirmation count (1/1, 2/3...). Handle revert errors gracefully with decoded error messages.",
        B("Wagmi + RainbowKit:") + " React hooks for Web3. Wagmi abstracts wallet connection, contract reading/writing, and account management. RainbowKit provides beautiful wallet connection UI.",
        B("viem:") + " TypeScript-first alternative to ethers.js. Used by Wagmi v2. Fully typed, composable, tree-shakeable. Excellent for TypeScript projects.",
        B("IPFS for decentralised storage:") + " Store NFT metadata, images, and frontend files on IPFS. Use Pinata or NFT.Storage for pinning. CID (content identifier) is the hash-based address.",
        B("The Graph Protocol:") + " Index blockchain events and query with GraphQL. Define a Subgraph (manifest, schema, mapping). Eliminates need to scan all blocks for historical events — orders of magnitude faster.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 9: JAVA ══════════════════════════════════════════════════════════════
def part9_java():
    story = part_page(9, "JAVA ZERO TO HERO — BACKEND DEVELOPER",
        "Core Java, Spring Boot, REST APIs, databases, security, testing & cloud deployment",
        C_RED, C_DARK)

    story += chapter(26, "Java Foundations & OOP")
    story.append(sec("26.1 Java Platform & Ecosystem"))
    story.append(body("Java is a statically typed, object-oriented, platform-independent language that runs on the Java Virtual Machine (JVM). Its write-once-run-anywhere philosophy, mature ecosystem, and enterprise adoption make it one of the most widely used languages for backend development globally. Modern Java (17+) has shed its verbose reputation with records, sealed classes, pattern matching, and local variable inference."))
    story.append(sp())
    for b in [
        B("JDK vs JRE vs JVM:") + " JDK (Java Development Kit) includes compiler (javac) and tools. JRE (Runtime Environment) includes JVM + class libraries. JVM executes bytecode — platform-specific implementation, platform-neutral bytecode.",
        B("Java LTS versions:") + " Java 8 (still widely used), Java 11, Java 17, Java 21 (current LTS). Use Java 21 for new projects — virtual threads, record patterns, sequenced collections.",
        B("Build tools:") + " Maven (XML pom.xml, convention over configuration, vast plugin ecosystem) or Gradle (Groovy/Kotlin DSL, incremental builds, faster for large projects). Both resolve dependencies from Maven Central.",
        B("Strong typing & type inference:") + " Java is statically typed — all types resolved at compile time. var keyword (Java 10+) allows local variable type inference: var list = new ArrayList<String>().",
        B("Autoboxing:") + " Automatic conversion between primitive types (int, long, double, boolean) and their wrapper class equivalents (Integer, Long, Double, Boolean). Use primitives in performance-critical code.",
        B("Garbage collection:") + " Automatic memory management. G1GC (default), ZGC (low-latency, <1ms pauses), Shenandoah, parallel GC. Tune with -Xms, -Xmx, -XX:+UseZGC for production.",
        B("Classpath & modules (JPMS):") + " Java 9 introduced the Java Platform Module System. module-info.java declares module dependencies. Improves encapsulation — internal packages truly hidden.",
    ]:
        story.append(bul(b))

    story.append(sec("26.2 Core Java — Types, Collections & Generics"))
    story.append(body("Mastering Java's type system and Collections Framework is fundamental. The Collections Framework provides standardised interfaces and implementations for data structures used throughout every Java application."))
    story.append(sp())
    story += two_col_table(["Interface", "Common Implementations & Use Case"], [
        ["List<E>", "ArrayList (random access O(1), slow insert middle), LinkedList (fast insert/remove at ends), CopyOnWriteArrayList (thread-safe reads). Use ArrayList for most cases."],
        ["Set<E>", "HashSet (O(1) add/contains, unordered), LinkedHashSet (insertion order), TreeSet (sorted, O(log n)). Use HashSet for fast membership testing."],
        ["Map<K,V>", "HashMap (O(1) average), LinkedHashMap (insertion order), TreeMap (sorted by key), ConcurrentHashMap (thread-safe). HashMap is the default choice."],
        ["Queue<E>", "LinkedList, ArrayDeque (preferred for queue/stack), PriorityQueue (heap-based, natural ordering or Comparator)."],
        ["Deque<E>", "ArrayDeque — efficient double-ended queue. Preferred over Stack class. O(1) push, pop, peek from both ends."],
    ])

    story.append(subsec("Generics"))
    for b in [
        B("Purpose:") + " Type safety at compile time without casting. List<String> guarantees all elements are Strings — ClassCastException impossible without unchecked warnings.",
        B("Bounded wildcards:") + " ? extends T (upper bound — read from, covariant), ? super T (lower bound — write to, contravariant). PECS: Producer Extends, Consumer Super.",
        B("Generic methods:") + " public <T extends Comparable<T>> T max(T a, T b) — type parameter declared before return type.",
        B("Type erasure:") + " Generics are compile-time only — erased at runtime. List<String> and List<Integer> are both List at runtime. Cannot do instanceof checks on generic parameters.",
    ]:
        story.append(bul(b))

    story.append(sec("26.3 Java OOP — Advanced Patterns"))
    story.append(body("Modern Java has evolved beyond traditional OOP with powerful new constructs. Understanding both classic patterns and modern Java features is essential for writing clean, maintainable backend code."))
    story.append(sp())
    story.append(subsec("Modern Java Features"))
    for b in [
        B("Records (Java 14+):") + " Immutable data carriers. record Point(int x, int y) {} auto-generates constructor, getters, equals, hashCode, toString. Perfect for DTOs and value objects.",
        B("Sealed classes (Java 17+):") + " sealed interface Shape permits Circle, Rectangle, Triangle. Closed hierarchy — exhaustive pattern matching in switch. Enables algebraic data types.",
        B("Pattern matching instanceof (Java 16+):") + " if (obj instanceof String s) { s.toUpperCase(); } — no cast needed. Pattern matching in switch (Java 21) enables full structural matching.",
        B("Text blocks (Java 15+):") + " Multi-line string literals with \"\"\" delimiters. Preserves indentation correctly. Ideal for JSON/SQL/HTML in tests and configuration.",
        B("Optional<T>:") + " Explicit nullable value. Optional.ofNullable(value).map(fn).orElse(default). Forces callers to handle absence. Never return null from public APIs.",
        B("Functional interfaces:") + " Single abstract method interfaces: Supplier<T>, Consumer<T>, Function<T,R>, Predicate<T>, BiFunction<T,U,R>. Foundation of lambda expressions and Streams.",
    ]:
        story.append(bul(b))

    story.append(subsec("Streams API"))
    for b in [
        B("Stream pipeline:") + " source → intermediate operations (lazy) → terminal operation (triggers execution). list.stream().filter(...).map(...).collect(Collectors.toList()).",
        B("Collectors:") + " Collectors.toList(), toSet(), toMap(keyFn, valueFn), groupingBy(classifier), partitioningBy(predicate), joining(delimiter), counting(), summingInt().",
        B("Parallel streams:") + " list.parallelStream() uses ForkJoinPool for parallel processing. Beneficial for CPU-bound, stateless operations on large collections. Avoid for I/O or stateful operations.",
        B("flatMap:") + " Flattens a Stream<List<T>> into Stream<T>. Essential for nested data structures.",
        B("Collectors.groupingBy + downstream:") + " groupingBy(Person::getDept, Collectors.averagingInt(Person::getSalary)) — group then aggregate in one pass.",
    ]:
        story.append(bul(b))

    story.append(sec("26.4 Concurrency in Java"))
    story.append(body("Java's concurrency model has evolved from raw threads to high-level abstractions. Modern Java 21 virtual threads revolutionise I/O-bound concurrency, making Spring Boot applications massively more scalable without complex reactive programming."))
    story.append(sp())
    for b in [
        B("Thread fundamentals:") + " Platform threads (OS threads, expensive ~1MB stack). Synchronised blocks/methods, volatile keyword, Object.wait()/notify()/notifyAll().",
        B("java.util.concurrent:") + " ExecutorService, ThreadPoolExecutor, ScheduledExecutorService. Submit Callable<T> or Runnable tasks; get Future<T> for results.",
        B("CompletableFuture:") + " Composable async programming. thenApply (transform result), thenCompose (chain futures), allOf (wait for all), exceptionally (error handling). Non-blocking.",
        B("Virtual threads (Java 21):") + " Lightweight JVM-managed threads. Thread.ofVirtual().start(task) — millions of concurrent threads possible. Perfect for blocking I/O (DB, HTTP). Minimal code change from platform threads.",
        B("Structured concurrency (Java 21):") + " StructuredTaskScope — manage a group of subtasks with clear lifecycle. Cancels all on first failure (ShutdownOnFailure) or first success (ShutdownOnSuccess).",
        B("Atomic classes:") + " AtomicInteger, AtomicLong, AtomicReference, AtomicBoolean — lock-free thread-safe operations using CAS (Compare-And-Swap) hardware instructions.",
        B("Concurrent collections:") + " ConcurrentHashMap, CopyOnWriteArrayList, BlockingQueue (ArrayBlockingQueue, LinkedBlockingQueue), ConcurrentLinkedQueue — thread-safe without external synchronisation.",
    ]:
        story.append(bul(b))

    story += chapter(27, "Spring Boot & REST API Development")
    story.append(sec("27.1 Spring Boot Fundamentals"))
    story.append(body("Spring Boot is the dominant Java framework for building production-ready applications. It builds on the Spring Framework, auto-configuring components based on the classpath. Spring Boot eliminates boilerplate and lets you focus on business logic while providing enterprise-grade features out of the box."))
    story.append(sp())
    for b in [
        B("Auto-configuration:") + " Spring Boot scans the classpath and automatically configures beans based on what's present (DataSource if JPA is on classpath, EmbeddedServletContainer if web is present).",
        B("Starters:") + " Curated dependency bundles: spring-boot-starter-web (REST API with Tomcat), spring-boot-starter-data-jpa, spring-boot-starter-security, spring-boot-starter-test.",
        B("application.properties / application.yml:") + " Central configuration file. Override with environment variables (SPRING_DATASOURCE_URL) or command-line args. Profile-specific files: application-prod.yml.",
        B("@SpringBootApplication:") + " Combines @Configuration, @EnableAutoConfiguration, and @ComponentScan. Main entry point — starts the embedded Tomcat (or Jetty/Undertow) server.",
        B("Dependency injection (DI):") + " Annotate classes with @Component, @Service, @Repository. Inject with @Autowired (constructor injection preferred). @Bean in @Configuration classes for custom beans.",
        B("Spring IoC Container:") + " Manages bean lifecycle (creation, wiring, destruction). ApplicationContext holds all beans. BeanFactory is the lower-level interface.",
        B("Profiles (@Profile):") + " Different beans/configurations per environment. @Profile(\"prod\") activates the bean only when spring.profiles.active=prod. Ideal for dev vs production data sources.",
        B("Actuator:") + " Production-ready features: /health endpoint, /metrics, /info, /loggers, /env, /threaddump, /heapdump. Integrates with Prometheus/Micrometer for monitoring.",
    ]:
        story.append(bul(b))

    story.append(sec("27.2 Building REST APIs with Spring MVC"))
    for b in [
        B("@RestController:") + " Combines @Controller + @ResponseBody. All methods return JSON directly (serialised by Jackson). @Controller is for server-side rendering with Thymeleaf.",
        B("Request mapping annotations:") + " @GetMapping, @PostMapping, @PutMapping, @PatchMapping, @DeleteMapping. Map HTTP methods + paths to handler methods.",
        B("@PathVariable and @RequestParam:") + " @PathVariable extracts from URL path /users/{id}. @RequestParam extracts query string ?page=2&size=20. Add required=false for optional params.",
        B("@RequestBody:") + " Deserialise request JSON to Java object (validated if annotated with @Valid + Bean Validation annotations like @NotNull, @Email, @Size).",
        B("ResponseEntity<T>:") + " Full control over HTTP response: status code, headers, body. return ResponseEntity.status(201).header('Location', url).body(dto).",
        B("Content negotiation:") + " Spring MVC serves JSON by default. Clients can request XML with Accept: application/xml header (add jackson-dataformat-xml dependency).",
        B("Pagination (Spring Data):") + " Pageable parameter in repository methods. @PageableDefault(size=20) in controller. Returns Page<T> with content, totalElements, totalPages.",
        B("HATEOAS:") + " Hypermedia As The Engine Of Application State. Add links to responses for discoverability. Spring HATEOAS provides EntityModel, CollectionModel, WebMvcLinkBuilder.",
    ]:
        story.append(bul(b))

    story.append(sec("27.3 Spring Data JPA"))
    for b in [
        B("JPA (Java Persistence API):") + " Standard ORM specification. Hibernate is the most common JPA implementation. Maps Java classes (entities) to database tables.",
        B("@Entity, @Table, @Id:") + " @Entity marks a class as a persistent entity. @Table(name='orders') maps to table. @Id marks the primary key. @GeneratedValue for auto-increment.",
        B("Relationships:") + " @OneToMany, @ManyToOne, @ManyToMany, @OneToOne. Define EAGER vs LAZY loading. Default LAZY for collections (best practice) — load only when accessed.",
        B("JpaRepository:") + " Extend JpaRepository<Entity, IdType> for built-in CRUD + paging. Add custom methods by declaring findByEmailAndStatus(String email, Status status) — Spring Data derives the query.",
        B("@Query:") + " Custom JPQL or native SQL queries. @Query('SELECT u FROM User u WHERE u.age > :age'). Use nativeQuery=true for database-specific SQL.",
        B("N+1 problem:") + " Accessing lazy collections in a loop triggers one query per entity. Fix with JOIN FETCH in JPQL, EntityGraph annotation, or Hibernate batch loading.",
        B("Transactions:") + " @Transactional on service methods. Declares transaction boundaries — Spring wraps in try/commit, rolls back on RuntimeException. Read-only transactions can use read replicas.",
    ]:
        story.append(bul(b))

    story += chapter(28, "Databases, Security & Cloud Deployment")
    story.append(sec("28.1 Spring Security"))
    story.append(body("Spring Security is the standard authentication and authorisation framework for Spring applications. Modern Spring Security 6 uses a lambda-based, composable DSL and defaults to secure configurations."))
    story.append(sp())
    for b in [
        B("SecurityFilterChain:") + " The central configuration bean. Defines which requests require authentication, CSRF settings, session management, and authentication mechanisms.",
        B("JWT (JSON Web Tokens):") + " Stateless authentication. JWTs contain claims (user ID, roles, expiry) signed with a secret. Validate signature and expiry on every request without hitting the database.",
        B("OAuth2 / OIDC:") + " Delegate authentication to an Identity Provider (Keycloak, Auth0, Okta, Google). Spring Security OAuth2 Resource Server validates JWTs from the IdP.",
        B("@PreAuthorize:") + " Method-level security. @PreAuthorize('hasRole(\"ADMIN\")') — checks before method execution. Requires @EnableMethodSecurity.",
        B("Password encoding:") + " BCryptPasswordEncoder — one-way hash with built-in salt. Never store plain-text or MD5 passwords. Work factor adjustable to match current hardware.",
        B("CORS configuration:") + " Cross-Origin Resource Sharing. Configure allowed origins, methods, headers. Spring Security CORS configuration must align with Spring MVC CORS config.",
        B("CSRF protection:") + " Enabled by default for browser clients. Disable for stateless REST APIs using JWT (clients use Authorization header, not cookies).",
    ]:
        story.append(bul(b))

    story.append(sec("28.2 Testing Spring Boot Applications"))
    for b in [
        B("@SpringBootTest:") + " Loads full application context. Use for integration tests. Slow — use slices for focused testing.",
        B("@WebMvcTest:") + " Loads only web layer (controllers, filters, security). Use MockMvc to make HTTP requests and assert responses without starting a real server.",
        B("@DataJpaTest:") + " Loads only JPA layer with an embedded H2 database. Test repositories in isolation without web layer.",
        B("MockMvc:") + " Test controllers without starting a server. perform(get('/users/1')).andExpect(status().isOk()).andExpect(jsonPath('$.name').value('Alice')).",
        B("Mockito:") + " @Mock creates a mock; @InjectMocks injects mocks into the class under test. when(mock.method(arg)).thenReturn(value). verify(mock).method(arg) asserts interaction.",
        B("Testcontainers:") + " Start real Docker containers (PostgreSQL, Redis, Kafka) in tests. @Container PostgreSQLContainer<...>. Eliminates H2 inconsistencies — tests run against real database.",
        B("AssertJ:") + " Fluent assertion library. assertThat(result).isNotNull().hasSize(3).extracting('name').containsExactly('Alice','Bob','Charlie').",
    ]:
        story.append(bul(b))

    story.append(sec("28.3 Cloud Deployment for Java Applications"))
    for b in [
        B("Containerisation:") + " Multi-stage Dockerfile: builder stage (Maven build), runtime stage (minimal JRE image like eclipse-temurin:21-jre-alpine). Resulting image ~180MB vs ~800MB without multi-stage.",
        B("Spring Native / GraalVM:") + " Compile Spring Boot to native executable — sub-second startup, low memory. Excellent for serverless. Requires native-image ahead-of-time compilation with reflection config.",
        B("Kubernetes deployment:") + " Deployment with readiness/liveness probes on /actuator/health. Resource requests and limits. HPA on CPU metric. ConfigMaps for application.yml, Secrets for credentials.",
        B("Observability:") + " Micrometer (metrics), Spring Boot Actuator (endpoints), Sleuth/Brave (distributed tracing). Export to Prometheus + Grafana, Zipkin, Datadog, or Dynatrace.",
        B("CI/CD pipeline:") + " GitHub Actions: checkout → mvn test → docker build → push to registry → deploy to Kubernetes. Use Kustomize or Helm for environment-specific configuration.",
        B("Database migrations:") + " Flyway or Liquibase for schema versioning. Migrations run on startup. Never modify existing migration scripts — always add new ones.",
        B("12-factor app principles:") + " Codebase in VCS, explicit dependencies, config in environment variables, backing services as attached resources, stateless processes, port binding, disposability, dev/prod parity.",
    ]:
        story.append(bul(b))

    story.append(PageBreak())
    return story


# ═══ PART 10: APPENDIX ════════════════════════════════════════════════════════
def part10_appendix():
    story = part_page(10, "APPENDIX — QUICK REFERENCE",
        "Cheat sheets, formulae, patterns & recommended learning paths",
        C_GRAY, C_DARK)

    story += chapter(29, "Quick Reference Cheat Sheets")

    story.append(sec("A. SQL Cheat Sheet"))
    story += info_box("Core SQL Patterns", [
        "SELECT ... FROM ... JOIN ... ON ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT",
        "Window: FUNCTION() OVER (PARTITION BY col ORDER BY col ROWS BETWEEN ... AND ...)",
        "Ranking: ROW_NUMBER() | RANK() | DENSE_RANK() | NTILE(n) | PERCENT_RANK()",
        "Navigation: LAG(col,n,default) | LEAD(col,n,default) | FIRST_VALUE | LAST_VALUE | NTH_VALUE",
        "Aggregates: COUNT(*) | COUNT(DISTINCT col) | SUM | AVG | MIN | MAX | PERCENTILE_CONT(0.5)",
        "Set ops: UNION ALL | INTERSECT | EXCEPT",
        "CTE: WITH cte AS (SELECT ...) SELECT * FROM cte",
        "Upsert (Postgres): INSERT ... ON CONFLICT (key) DO UPDATE SET col = EXCLUDED.col",
        "Index types: B-tree | Hash | GIN (JSONB,arrays) | GiST (geo) | Partial | Composite | Expression | Covering (INCLUDE)",
    ], C_BLUE)

    story.append(sec("B. Python Data Science Cheat Sheet"))
    story += info_box("Pandas One-Liners", [
        "Read: pd.read_csv('f.csv', parse_dates=['dt'], dtype={'id':'int32'}, usecols=['a','b'])",
        "Profile: df.shape | df.dtypes | df.describe(include='all') | df.isnull().sum()",
        "Filter: df.loc[df['col'].between(10,100) & df['status'].isin(['A','B'])]",
        "GroupBy agg: df.groupby('region').agg({'rev':'sum','cnt':'count','price':['mean','std']})",
        "Window: df['rolling_avg'] = df.groupby('cat')['val'].transform(lambda x: x.rolling(7).mean())",
        "Merge: pd.merge(a, b, on='key', how='left', validate='many_to_one', suffixes=('_l','_r'))",
        "Melt: pd.melt(df, id_vars=['id','date'], value_vars=['q1','q2','q3','q4'], var_name='quarter')",
        "Pivot: df.pivot_table(values='sales', index='month', columns='region', aggfunc='sum', fill_value=0)",
        "Category: df['status'] = df['status'].astype('category')  # memory: 5-10x reduction",
    ], C_GREEN)

    story += info_box("PySpark Patterns", [
        "Read Parquet: spark.read.parquet('s3://bucket/path/').filter('date >= \"2024-01-01\"')",
        "Window: spec = Window.partitionBy('region').orderBy('date'); F.rank().over(spec)",
        "Broadcast join: df1.join(F.broadcast(small_df), 'key', 'left')",
        "Agg: df.groupBy('cat').agg(F.sum('amt').alias('total'), F.countDistinct('user').alias('uniq_users'))",
        "Upsert: target.alias('t').merge(source.alias('s'), 't.id = s.id').whenMatchedUpdateAll().whenNotMatchedInsertAll().execute()",
        "Repartition: df.repartition(200, 'date') before shuffle; df.coalesce(10) after filter",
        "Cache: df.cache() then df.count() to materialise. df.unpersist() when done.",
    ], C_ORANGE)

    story.append(sec("C. Kafka Quick Reference"))
    story += two_col_table(["Concept", "Key Details"], [
        ["Topic partitioning", "Partition by high-cardinality key (user_id, order_id) for ordering guarantees per entity."],
        ["Consumer group design", "One consumer group per independent use case. Don't share a group between ETL and analytics."],
        ["Exactly-once semantics", "Producer: enable.idempotence=true + transactional.id. Consumer: isolation.level=read_committed."],
        ["Lag monitoring", "kafka-consumer-groups --describe. Alert when lag > 10 minutes of expected throughput."],
        ["Retention sizing", "retention.bytes = daily_throughput × retention_days × 1.3 (safety margin) / partition_count."],
        ["Schema evolution", "Use Avro + Schema Registry with BACKWARD_TRANSITIVE compatibility for safe rolling upgrades."],
    ])

    story.append(sec("D. dbt Quick Reference"))
    story += info_box("dbt Patterns & Commands", [
        "dbt run — execute all models. dbt run --select marts.finance+ — run finance mart and all downstream.",
        "dbt test — run all tests. dbt test --select tag:daily --severity warn — warn-only for daily tagged models.",
        "dbt build — run + test + snapshot in dependency order. Preferred for production jobs.",
        "dbt docs generate && dbt docs serve — generate and browse documentation locally.",
        "dbt source freshness — check all sources are within freshness thresholds.",
        "Incremental model: is_incremental() block filters to new/changed records only.",
        "Snapshot: SCD Type 2 history. strategy='timestamp' or strategy='check'. Unique_key required.",
        "Macro pattern: call macro with {{ macro_name(arg1, arg2) }} in model SQL.",
    ], C_PURPLE)

    story.append(sec("E. Solidity Security Checklist"))
    story += info_box("Pre-Deployment Security Review", [
        "Checks-Effects-Interactions: update ALL state before any external call or ETH transfer.",
        "ReentrancyGuard on every function that sends ETH or calls external contracts.",
        "Access control: onlyOwner, onlyRole, or AccessControl on every privileged function.",
        "Integer arithmetic: Solidity 0.8+ has built-in overflow checks. Use unchecked only for proven-safe paths.",
        "Pull over push: store owed amounts in a mapping; users call withdraw() — avoid push to unknown addresses.",
        "Oracle safety: use Chainlink Price Feeds with staleness check (answer, updatedAt returned by latestRoundData).",
        "Emergency pause: OpenZeppelin Pausable — pause withdrawals and critical functions if exploit is detected.",
        "Audit: Run Slither (static analysis) + manual code review + formal audit before mainnet deployment.",
    ], C_RED)

    story.append(sec("F. Java / Spring Boot Quick Reference"))
    story += info_box("Spring Boot Production Checklist", [
        "Use Java 21 LTS with virtual threads: spring.threads.virtual.enabled=true (Spring Boot 3.2+)",
        "Connection pool: HikariCP (default). spring.datasource.hikari.maximum-pool-size=20",
        "Pagination: always paginate list endpoints. Return Page<DTO> with size capped at 100.",
        "Validation: @Valid on @RequestBody. Bean Validation annotations on DTO fields.",
        "Global exception handler: @RestControllerAdvice with @ExceptionHandler methods.",
        "Actuator security: expose only /health and /info publicly. Secure all others.",
        "Logging: SLF4J + Logback. Use MDC for correlation IDs. Structured JSON logs in production.",
        "Flyway migrations: in src/main/resources/db/migration/. V1__init.sql naming convention.",
        "Docker: multi-stage build. eclipse-temurin:21-jre-alpine runtime image.",
        "Graceful shutdown: server.shutdown=graceful, spring.lifecycle.timeout-per-shutdown-phase=30s",
    ], C_RED)

    story.append(sec("G. Recommended Learning Path"))
    story += info_box("Zero to Hero — Structured Schedule (24 Weeks)", [
        "Weeks 1-3: SQL (PostgreSQL). Install locally. Complete all 3 real dataset practicals from Part 1.",
        "Weeks 4-6: Python Zero to Hero (Part 2). Build CLI tools, work with files and APIs.",
        "Weeks 7-9: Python for Data Science (Part 3). Complete EDA on NYC Taxi dataset with Pandas + Seaborn.",
        "Weeks 10-12: Databricks (Part 4). Free community edition. Build a Medallion pipeline on public data.",
        "Weeks 13-14: Apache Kafka (Part 5). Local Docker setup. Build producer-consumer in Python.",
        "Weeks 15-16: dbt (Part 6). dbt Core + DuckDB (free, local). Build staging→marts transformation project.",
        "Weeks 17-19: Capstone Project (Part 7). Integrate all tools. Use free tiers of all platforms.",
        "Weeks 20-21: Blockchain & Solidity (Part 8). Hardhat local node. Deploy ERC-20 + ERC-721 to testnet.",
        "Weeks 22-24: Java Zero to Hero (Part 9). Build a Spring Boot REST API with PostgreSQL, JWT, tests.",
        "Week 25+: Contribute to open source, build portfolio projects, target data engineering / backend roles.",
    ], C_TEAL)

    story += info_box("Free Tools & Resources for Hands-On Practice", [
        "SQL: PostgreSQL (local), DuckDB (in-process), BigQuery sandbox (free tier), Snowflake 30-day trial.",
        "Python/Data Science: Google Colab (free GPU), Kaggle Notebooks, GitHub Codespaces.",
        "Databricks: Community Edition (free), Databricks on Azure/AWS with $200 cloud credits.",
        "Kafka: Confluent Cloud free tier (no credit card), local Docker Compose setup.",
        "dbt: dbt Core (open source, free), DuckDB as warehouse for local development.",
        "Blockchain: Hardhat (local EVM), Remix IDE (browser-based), Ethereum Sepolia testnet (free ETH from faucet).",
        "Java/Spring Boot: IntelliJ IDEA Community (free), start.spring.io project generator.",
        "Datasets: Kaggle, UCI ML Repository, NYC Open Data, data.gov, Google Dataset Search.",
    ], C_GREEN)

    return story


# ═══ MAIN BUILD ═══════════════════════════════════════════════════════════════
def build():
    path = "Zero_to_Hero_Data_Blockchain_Engineering.pdf"
    if os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    doc = DocTemplate(path,
        pagesize=A4,
        leftMargin=1.5*cm, rightMargin=1.5*cm,
        topMargin=1.4*cm, bottomMargin=1.8*cm,
        title="Zero to Hero — Data & Blockchain Engineering Master Guide",
        author="Zero to Hero Series",
        subject="SQL, Python, Databricks, Kafka, dbt, Blockchain, Java")

    story = []
    story += cover_page()
    story += toc()
    story += part1_sql()
    story += part2_python()
    story += part3_datascience()
    story += part4_databricks()
    story += part5_kafka()
    story += part6_dbt()
    story += part7_capstone()
    story += part8_blockchain()
    story += part9_java()
    story += part10_appendix()

    doc.build(story)
    print(f"PDF built: {path}")

build()