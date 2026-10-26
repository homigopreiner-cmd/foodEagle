# -*- coding: utf-8 -*-
"""
Build the Food Eagle feature-screenshot PDF.

Reads `screenshots/figures.json` (written by docs/capture_screenshots.mjs),
renders each screenshot at print size with a numbered caption, and writes
`Food-Eagle-Feature-Screenshots.pdf` at the repository root.

    python docs/build_screenshots_pdf.py
"""
import json
import os
import datetime

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table,
    TableStyle, Image, KeepTogether, Flowable, PageBreak,
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIGURES = os.path.join(ROOT, "screenshots", "figures.json")
OUT = os.path.join(ROOT, "Food-Eagle-Feature-Screenshots.pdf")
CACHE = os.path.join(ROOT, ".tmp-shots", "pdf")

MAROON = colors.HexColor("#791717")
GOLD = colors.HexColor("#F2A93B")
GREY = colors.HexColor("#5F5B57")
INK = colors.HexColor("#231F1C")

PAGE_W, PAGE_H = A4
MARGIN_L = MARGIN_R = 16 * mm
MARGIN_T, MARGIN_B = 20 * mm, 16 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R

# Caption under a phone screenshot, and under a wide desktop screenshot.
CAPTION = ParagraphStyle(
    "caption", fontName="Helvetica", fontSize=8.5, leading=11.4,
    textColor=INK, spaceBefore=4, spaceAfter=0,
)
TITLE = ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=30, leading=34,
                       textColor=colors.white)
SUBTITLE = ParagraphStyle("subtitle", fontName="Helvetica", fontSize=13.5, leading=18,
                          textColor=colors.HexColor("#FFE3C2"))
TAGLINE = ParagraphStyle("tagline", fontName="Helvetica", fontSize=9.5, leading=14,
                         textColor=colors.HexColor("#EFC9C9"))
BODY = ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=15,
                      textColor=INK, spaceAfter=6)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=13, leading=17,
                    textColor=MAROON, spaceBefore=4, spaceAfter=6)
SMALL = ParagraphStyle("small", fontName="Helvetica", fontSize=8, leading=11,
                       textColor=GREY)


def prepare(fig):
    """Downscale the PNG once and return a path reportlab can embed cheaply."""
    os.makedirs(CACHE, exist_ok=True)
    dst = os.path.join(CACHE, os.path.basename(fig["path"]).replace(".png", ".jpg"))
    if not os.path.exists(dst):
        im = PILImage.open(os.path.join(ROOT, fig["path"])).convert("RGB")
        target = 1000 if is_phone(fig) else 1600
        if im.width > target:
            im = im.resize((target, round(im.height * target / im.width)), PILImage.LANCZOS)
        im.save(dst, "JPEG", quality=90, optimize=True)
    return dst


def dimensions(fig):
    im = PILImage.open(os.path.join(ROOT, fig["path"]))
    return im.width, im.height


def is_phone(fig):
    w, h = dimensions(fig)
    return w / h < 0.9


class Band(Flowable):
    """A maroon section band: the app being showcased on the pages below."""

    def __init__(self, text, width=CONTENT_W, height=9 * mm):
        super().__init__()
        self.text = text
        self.width = width
        self.height = height

    def draw(self):
        self.canv.setFillColor(MAROON)
        self.canv.roundRect(0, 0, self.width, self.height, 1.4 * mm, stroke=0, fill=1)
        self.canv.setFillColor(GOLD)
        self.canv.roundRect(0, 0, 2.2 * mm, self.height, 1.1 * mm, stroke=0, fill=1)
        self.canv.setFillColor(colors.white)
        self.canv.setFont("Helvetica-Bold", 9.5)
        self.canv.drawString(7 * mm, self.height / 2 - 3.2, self.text.upper())


def caption(fig):
    return Paragraph(
        f'<font name="Helvetica-Bold" color="#791717">Figure {fig["n"]}.</font> {fig["caption"]}',
        CAPTION,
    )


def phone_row(pair):
    """Two phones side by side, each above its own caption."""
    col_w = (CONTENT_W - 8 * mm) / 2
    cells = []
    for fig in pair:
        w, h = dimensions(fig)
        img = Image(prepare(fig), width=col_w, height=col_w * h / w)
        cells.append([img, caption(fig)])
    while len(cells) < 2:
        cells.append("")
    widths = [col_w, 8 * mm, col_w]
    t = Table([[cells[0], "", cells[1]]], colWidths=widths)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t


def desktop_stack(pair):
    """One or two wide screenshots stacked, full content width."""
    rows = []
    for fig in pair:
        w, h = dimensions(fig)
        img = Image(prepare(fig), width=CONTENT_W, height=CONTENT_W * h / w)
        rows.append([img])
        rows.append([caption(fig)])
    t = Table(rows, colWidths=[CONTENT_W])
    t.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
    ]))
    return t


def title_page(figs):
    groups = []
    for f in figs:
        if not groups or groups[-1][0] != f["group"]:
            groups.append([f["group"], []])
        groups[-1][1].append(f["n"])

    story = [Spacer(1, 8 * mm)]
    header = Table([[Paragraph("FOOD EAGLE", TITLE)],
                    [Paragraph("Campus food delivery — key feature screenshots", SUBTITLE)],
                    [Paragraph("Ionic · Angular · Capacitor — one codebase, four role-based apps",
                               TAGLINE)]],
                   colWidths=[CONTENT_W])
    header.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), MAROON),
        ("LEFTPADDING", (0, 0), (-1, -1), 12 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12 * mm),
        ("TOPPADDING", (0, 0), (-1, 0), 12 * mm),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 12 * mm),
        ("TOPPADDING", (0, 1), (-1, -1), 5 * mm),
    ]))
    story += [header, Spacer(1, 10 * mm)]

    today = datetime.date.today().strftime("%d %B %Y")
    story.append(Paragraph(
        "This appendix walks through the platform one feature at a time. Every "
        f"figure is a screenshot of the running application, captured on {today} "
        "through the real user flows: a customer builds a basket and checks out, "
        "the restaurant moves the ticket through the kitchen, a rider claims and "
        "completes the delivery, and the admin console reports on the same records.",
        BODY))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("Figures in this document", H2))
    rows = [["Section", "Figures", "Screens"]]
    for name, nums in groups:
        span = f"{nums[0]}" if len(nums) == 1 else f"{nums[0]}–{nums[-1]}"
        rows.append([name, span, str(len(nums))])
    rows.append(["Total", "", str(len(figs))])
    idx = Table(rows, colWidths=[CONTENT_W * 0.5, CONTENT_W * 0.3, CONTENT_W * 0.2])
    idx.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), MAROON),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#F7F1EE")]),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, colors.HexColor("#E3D9D4")),
        ("LINEABOVE", (0, -1), (-1, -1), 0.75, MAROON),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story += [idx, Spacer(1, 9 * mm)]

    story.append(Paragraph("How the screenshots were taken", H2))
    story.append(Paragraph(
        "The app was served by <font name=\"Courier\">ng serve</font> and driven with a "
        "headless browser at a 430 × 932 phone viewport for the customer, restaurant "
        "and rider apps, and at 1440 × 900 for the admin console. A single browser "
        "profile was reused, which is why one order can be followed from checkout "
        "through the kitchen and the rider to the admin ledger: the four apps share "
        "one local database.",
        BODY))
    story.append(Paragraph(
        "Data is the app's own first-run seed plus the order placed during the run, "
        "so names, prices and totals are the ones the application generates — nothing "
        "was staged by hand.",
        BODY))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "Reproduce with:  node docs/capture_screenshots.mjs  then  "
        "python docs/build_screenshots_pdf.py", SMALL))
    return story


def figure_story(figs):
    story = []
    last_group = None
    i = 0
    while i < len(figs):
        fig = figs[i]
        group = fig["group"]
        block = []
        if group != last_group:
            block.append(Band(group))
            block.append(Spacer(1, 4 * mm))
            last_group = group

        group_figs = [f for f in figs[i:] if f["group"] == group]
        if is_phone(fig):
            pair = group_figs[:2]
            i += len(pair)
            block.append(phone_row(pair))
        else:
            pair = group_figs[:2]
            i += len(pair)
            block.append(desktop_stack(pair))
        block.append(Spacer(1, 9 * mm))
        story.append(KeepTogether(block))
    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#E3D9D4"))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_L, MARGIN_B - 4 * mm, PAGE_W - MARGIN_R, MARGIN_B - 4 * mm)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawString(MARGIN_L, MARGIN_B - 9 * mm, "Food Eagle — key feature screenshots")
    canvas.drawRightString(PAGE_W - MARGIN_R, MARGIN_B - 9 * mm, f"{doc.page}")
    canvas.restoreState()


def main():
    with open(FIGURES, encoding="utf-8") as fh:
        figs = json.load(fh)

    doc = BaseDocTemplate(
        OUT, pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="Food Eagle - key feature screenshots",
        author="Food Eagle project",
    )
    frame = Frame(MARGIN_L, MARGIN_B, CONTENT_W, PAGE_H - MARGIN_T - MARGIN_B, id="body")
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame], onPage=footer)])

    story = title_page(figs)
    story.append(PageBreak())
    story += figure_story(figs)

    doc.build(story)
    size = os.path.getsize(OUT) / (1024 * 1024)
    print(f"wrote {OUT} ({size:.1f} MB, {len(figs)} figures)")


if __name__ == "__main__":
    main()
