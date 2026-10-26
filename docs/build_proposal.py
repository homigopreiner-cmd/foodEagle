# -*- coding: utf-8 -*-
"""FoodEagle proposal - rewritten in A1 basic English, aligned with the class modules."""
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import os

doc = Document()

st = doc.styles["Normal"]
st.font.name = "Times New Roman"
st.font.size = Pt(11.5)
st.paragraph_format.space_after = Pt(6)
st.paragraph_format.line_spacing = 1.25
rpr = st.element.get_or_add_rPr()
rf = rpr.find(qn("w:rFonts"))
if rf is None:
    rf = OxmlElement("w:rFonts"); rpr.append(rf)
rf.set(qn("w:eastAsia"), "Times New Roman")

for name, size, before, after in [
    ("Heading 1", 14.5, 14, 7), ("Heading 2", 12.5, 11, 5), ("Heading 3", 11.5, 8, 4)]:
    h = doc.styles[name]
    h.font.name = "Times New Roman"; h.font.bold = True
    h.font.size = Pt(size); h.font.color.rgb = RGBColor(0, 0, 0)
    h.paragraph_format.space_before = Pt(before); h.paragraph_format.space_after = Pt(after)

sec = doc.sections[0]
sec.page_width = Inches(8.5); sec.page_height = Inches(11)
sec.left_margin = Inches(1); sec.right_margin = Inches(1)
sec.top_margin = Inches(1); sec.bottom_margin = Inches(1)

def P(text="", align=None, bold=False, italic=False, size=None, space_after=None, style=None):
    p = doc.add_paragraph(style=style)
    if align is not None:
        p.alignment = align
    if text:
        r = p.add_run(text)
        r.bold, r.italic = bold, italic
        if size: r.font.size = Pt(size)
    if space_after is not None: p.paragraph_format.space_after = Pt(space_after)
    return p

def H1(text): return doc.add_heading(text, level=1)
def H2(text): return doc.add_heading(text, level=2)
def H3(text): return doc.add_heading(text, level=3)

def bullets(items, style="List Bullet"):
    for it in items:
        P(it, style=style)

def add_table(headers, rows, widths=None, align_center_cols=(), font_size=10, header_fill="BFBFBF"):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"; t.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = t.rows[0].cells
    for i, htxt in enumerate(headers):
        hdr[i].text = ""
        pr = hdr[i].paragraphs[0]
        run = pr.add_run(htxt); run.bold = True; run.font.size = Pt(font_size)
        pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
        shd = OxmlElement("w:shd"); shd.set(qn("w:val"), "clear")
        shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), header_fill)
        hdr[i]._tc.get_or_add_tcPr().append(shd)
    for row in rows:
        cells = t.add_row().cells
        for i, val in enumerate(row):
            cells[i].text = ""
            pr = cells[i].paragraphs[0]
            run = pr.add_run(str(val)); run.font.size = Pt(font_size)
            if i in align_center_cols: pr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if widths:
        for i, w in enumerate(widths):
            for row in t.rows:
                row.cells[i].width = Inches(w)
    return t

def figure(path, caption, width_in):
    doc.add_picture(path, width=Inches(width_in))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.paragraphs[-1].paragraph_format.space_after = Pt(2)
    P(caption, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=10, space_after=14)

# ============================================================
# COVER PAGE
# ============================================================
P(); P()
P("FoodEagle", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=30)
P("A Campus-Exclusive Food Delivery System for CSU Carig", align=WD_ALIGN_PARAGRAPH.CENTER, size=15)
P("Mobile Ordering, Real-Time Tracking, and Streamlined Vendor Management", align=WD_ALIGN_PARAGRAPH.CENTER, italic=True, size=12)
P()
P("A Software Project Proposal Presented to the Faculty of the", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P("[Course / Department Placeholder]", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P("Cagayan State University - Carig Campus", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P()
P("In Partial Fulfillment of the Requirements in [Course Code] - Software Engineering", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P()
P("Prepared by Team Crimson", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=13)
P()
members = [
    ("Bartolome, Antonette",       "Project Manager"),
    ("Delos Santos, Rashelle Joi", "Business Analyst"),
    ("Escalante, Chazel",          "UI / UX Designer"),
    ("Homigop, Reiner",            "Lead Developer"),
    ("Luyun, Mary Joyce",          "Quality Assurance Lead"),
    ("Mamauag, Jamaica Lei Zaira", "Documentation Lead"),
    ("Soriano, Zymon Loui",        "Backend Developer"),
]
mt = add_table(["Member", "Role"], members, widths=[3.1, 2.9], font_size=11.5)
for row in mt.rows:
    for c in row.cells:
        c.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
P()
P("Submitted to:", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P("[Instructor's Name]", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, size=11.5)
P("Instructor", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P("[Section Placeholder]", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
P()
P("October 16, 2026", align=WD_ALIGN_PARAGRAPH.CENTER, size=11.5)
doc.add_page_break()

# ============================================================
# TOC
# ============================================================
H1("Table of Contents")
entries = ["Executive Summary",
 "1.  Introduction and Project Background",
 "2.  Development Methodology",
 "3.  Requirements Analysis and Specification",
 "4.  System Analysis and Modeling",
 "5.  Design Strategy and User Interface Design",
 "6.  Project Management Plan",
 "7.  Conclusion",
 "8.  References",
 "9.  Appendices"]
for e in entries:
    p = P(e)
    p.paragraph_format.space_after = Pt(3)
    for r in p.runs: r.bold = True
for e in ["Executive Summary", "Area 1.1 - 1.5  Background, Problems, Objectives, Scope, Significance",
          "Area 2.1 - 2.4  SDLC Model, Reasons, Comparison, Phase Work",
          "Area 3.1 - 3.7  Stakeholders, Elicitation, FRs, NFRs, Limits, Quality, Metrics",
          "Area 4.1 - 4.5  DFD Level 0/1/2, ERD and Data Dictionary, Structure Chart",
          "Area 5.1 - 5.4  Design Strategy, Architecture, Interface Type, Golden Rules",
          "Area 6.1 - 6.4  Team, Schedule, Risks, Monitoring",
          "Appendix A  Interview questions      Appendix B  Survey form",
          "Appendix C  Use cases and user stories      Appendix D  Data dictionary notes"]:
    p = P("     " + e)
    p.paragraph_format.space_after = Pt(2)
P("Note: add page numbers after the final layout in MS Word.", italic=True, size=9.5)
doc.add_page_break()

# ============================================================
# EXECUTIVE SUMMARY
# ============================================================
H1("Executive Summary")
P("Food stalls serve thousands of students at CSU Carig every week. But the way students buy food "
  "has not changed for years. A student must walk to the stall, fall in line, wait for the food, and "
  "carry it to class. Lines are longest between classes, because classes end at the same time. "
  "Sometimes the line eats the whole break.")
P("This paper asks for approval to build FoodEagle. FoodEagle is a food delivery system made only "
  "for the CSU Carig campus. Students order food in the mobile app and follow the order live on "
  "their screen. Campus runners pick up the packed food and bring it to the student. Vendors update "
  "their menus and see their daily sales in a web portal. One server keeps all the data safe and "
  "in one place.")
P("Our team will use the Incremental model. We will build the core first (ordering and tracking), "
  "then add the rest (payments, ratings, reports). The paper shows our interviews with 8 vendors "
  "and a survey of 50 students. It lists 20 functional and 10 non-functional requirements. It also "
  "shows our data flow diagrams, our entity relationship diagram, our structure chart, and a 12-week "
  "plan with a Gantt chart. Every claim in this paper came from real people inside the campus.")
doc.add_page_break()

# ============================================================
# SECTION 1
# ============================================================
H1("Section 1. Introduction and Project Background")

H2("1.1 Background of the Study")
P("Cagayan State University - Carig Campus (CSU Carig) is in Tuguegarao City. Many students study "
  "there. Food on campus is sold by small canteen stalls. A few small eateries along Rizal Street "
  "also serve students. Between the first class in the morning and the last class in the afternoon, "
  "these stalls are busy all day.")
P("Right now, buying food is fully manual. A student walks to a stall and falls in line. The menu "
  "is written on a board or shown in trays. The student pays cash and waits by the counter while "
  "the staff cooks. The only record is a small receipt book. Daily totals go into the vendor's "
  "notebook, if they are written down at all.")
P("There are also informal food runners. These are students with motorcycles who fetch food for a "
  "small fee. They find customers through Facebook group chats. There is no tracking and no record "
  "when money changes hands this way.")
P("Our team chose this problem because it is close to us. The stalls are near our classrooms. "
  "Our classmates and the stall staff are easy to talk to. We could observe, ask questions, and "
  "test our ideas with real users. The problem sits right inside our reach.")

H2("1.2 Problem Statement")
P("We observed three busy stalls for two weeks. We also gave a short questionnaire to 50 students. "
  "Eight vendors answered a separate set of questions. From that evidence, we state four problems.")
P("Problem 1: The lines are long. 41 of the 50 students (82%) agreed that the line at break time is "
  "long enough to make them skip a meal or buy less. We watched one stall from 11:30 AM to 1:00 PM "
  "on October 2. The line held 7 to 11 students most of the time. The average wait was 12 minutes.")
P("Problem 2: Students cannot see the menu or the stock before they walk. They only learn what a "
  "stall sells when they arrive. 33 of the 50 students (66%) said they sometimes walk to a stall "
  "and find out that the dish they wanted is already sold out. The vendors lose too. 5 of the 8 "
  "vendors (63%) said food often goes unsold at the end of the day.")
P("Problem 3: Sales records are weak. 6 of the 8 vendors keep only a handwritten tally. None of "
  "them can say which items sell best or which days are slow. The student council also cannot "
  "easily check which stall permits are still valid, because everything is kept on paper in a folder.")
P("Problem 4: Informal delivery has no safety net. Some students give money to a runner they met "
  "in a chat group. There is no record and no way to trace the handover. 4 of our 50 respondents "
  "had done this in the past term. None of them could show a receipt of the deal.")

H2("1.3 Project Objectives")
P("General objective:", bold=True)
P("To design, build, and roll out FoodEagle - a campus-exclusive food delivery system for CSU "
  "Carig - so students can order and pay from registered stalls, follow their delivery live, and "
  "vendors get clean daily sales records.", bold=True)
P("Specific objectives:", bold=True)
bullets([
    "1. Let a student finish an order in 3 minutes or less from anywhere inside the campus. "
    "We will measure this by timing ten sample orders during testing.",
    "2. Show the live order status within 15 seconds after the vendor or runner updates it.",
    "3. Cut the average waiting time at peak hours from 12 minutes to 5 minutes or less, by "
    "letting vendors cook ahead of the pickup.",
    "4. Give every vendor an automatic itemized sales summary at the end of each day, so "
    "handwritten tallies are no longer needed.",
    "5. Give the student council one verified list of approved vendors and runners, so every "
    "account in the system belongs to a real person.",
])

H2("1.4 Scope and Limitations")
H3("What the system will do")
bullets([
    "Create and verify accounts for students, vendors, runners, and administrators.",
    "Show approved vendors and their menus, with prices, photos, and real-time availability.",
    "Take student orders, let vendors accept or reject them, and record the agreed delivery "
    "time.",
    "Record payments (cash on delivery or e-wallet transfer record) and give a receipt number.",
    "Track each order live: pending, accepted, preparing, ready, picked up, delivered.",
    "Let vendors manage menus, flip items on or off, and read automatic daily sales reports.",
    "Let students rate delivered orders from 1 to 5 stars, with an optional comment.",
    "Give administrators tools to approve accounts, suspend them, and view platform statistics.",
])
H3("What the system will not do")
bullets([
    "It serves only the CSU Carig community. Accounts need a CSU email or a verified student "
    "number. No off-campus addresses.",
    "It does not cook food or guarantee quality. It only moves orders and records them. "
    "Complaints about food are settled between vendor and student.",
    "It will not process credit cards or bank transfers. Cash on delivery and e-wallet transfer "
    "records are the only payment options.",
    "It will not accept orders for tomorrow. Orders open only during each stall's declared hours.",
    "It will not sell food from off-campus restaurants. Only campus stalls and approved eateries "
    "listed by the student council.",
    "It will not auto-plan delivery routes. Runners go on foot or by single motorcycle inside "
    "the campus and its near perimeter.",
])

H2("1.5 Significance of the Project")
P("Who benefits, and how:")
bullets([
    "Students - less standing in line. They can order from class, watch the status, and pay "
    "on pickup. Students far from the stalls (for example at the library wing) save the walk.",
    "Vendors - more orders during rain days and peak hours. Clean sales records help them "
    "decide what to cook and how much to prepare.",
    "Campus runners - a formal way to get delivery jobs, routed by the system instead of "
    "group chats.",
    "The student council and campus administration - one verified, auditable list of who "
    "sells and who delivers inside the campus, plus statistics to plan by.",
    "Future project teams - FoodEagle uses common, documented tools (Flutter, Node.js, "
    "PostgreSQL, Firebase) and follows the same analysis steps used in our SE classes, so "
    "the next batch can pick it up and extend it.",
])
P("No software can replace a good meal. What this system replaces is the queue - and the "
  "guesswork that comes with it on both sides of the counter.")
doc.add_page_break()

# ============================================================
# SECTION 2
# ============================================================
H1("Section 2. Development Methodology")

H2("2.1 Chosen SDLC Model: Incremental Model")
P("The team will build FoodEagle using the Incremental model. We cut the system into three "
  "increments. Each increment is planned, built, tested, and released on its own:")
bullets([
    "Increment 1 (weeks 1-6): accounts, vendor and menu browsing, and ordering. This is the "
    "skeleton - verified users see verified stalls and can place orders.",
    "Increment 2 (weeks 7-10): real-time tracking and the vendor portal. Vendors accept or "
    "reject orders, runners get tasks, students watch the live status.",
    "Increment 3 (weeks 11-12): payment records, ratings and feedback, and daily sales "
    "reports. This pass makes the system complete.",
])

H2("2.2 Justification of the Chosen Model")
P("The Incremental model fits FoodEagle for three reasons:")
bullets([
    "The core is clear, but the edges are not. Our interviews showed that ordering and "
    "tracking are what everyone expects. Ratings and reports are wanted, but only after use. "
    "Increments let us lock the core first, release it, then improve the rest based on real "
    "use, not guesswork.",
    "The team is small and busy. Seven students with class loads cannot bet the whole term on "
    "one big delivery. If time runs short, Increments 1 and 2 alone are still a working "
    "system. A waterfall one-shot has no such safety net.",
    "Early testing with real users. Each increment ends with something we can put in front "
    "of stall staff and classmates. What they find shapes the next increment. This is the "
    "model's known strength: early feedback and early defect catching.",
])
P("We also accept the model's weak points. It needs good planning up front, so the three "
  "increments fit together. And each time we add an increment to a running system, small errors "
  "can slip in. To guard against this, we will freeze the data structure after Increment 1 "
  "(new tables allowed, old tables untouched), and run a regression test after every "
  "integration.")

H2("2.3 Comparison with Other Models (Agile and Waterfall)")
P("Agile (Scrum) was the closest other choice. Its sprints and small releases are close to "
  "increments. We set it aside for three practical reasons:")
bullets([
    "Scrum needs a product owner who joins sprint reviews every few weeks. Our 'client' is a "
    "loose group of stall staff and classmates - nobody plays that role full time.",
    "The full Scrum rhythm (planning, stand-ups, reviews, retrospectives) would cost a "
    "7-student team more meeting time than it saves in work. Increment checkpoints give us "
    "the same rhythm for less.",
    "Our requirements are stable. The survey and interviews produced one clear, prioritized "
    "list. The constant re-prioritizing that Agile is good at would rarely be needed here.",
])
P("We also set aside the classical Waterfall model. It fits projects with fixed requirements "
  "and a client who can wait until the end to see anything. With term deadlines and student "
  "schedules, we cannot risk everything on one delivery that only runs in the final month.")

H2("2.4 Phase Activities and Outputs")
add_table(
    ["Phase", "Main tasks the team will perform", "Output of the phase"],
    [
        ["Planning",
         "Approve the topic; set member roles; fix the schedule, the risk list, and the "
         "communication rules; set what 'done' looks like.",
         "Project plan, this proposal, the Gantt chart"],
        ["Analysis",
         "Run interviews and the survey; watch the stalls; write the functional and "
         "non-functional requirements; check them against what people said.",
         "Requirements list, DFD Level 0/1/2, ERD"],
        ["Design",
         "Choose the architecture; draw the structure chart; sketch the screens; agree on "
         "the data dictionary; apply the interface golden rules.",
         "Design document, screen sketches, test plan draft"],
        ["Implementation",
         "Build the system increment by increment; review code as it is committed; keep the "
         "repository working after each change.",
         "Working system, source code with version history"],
        ["Testing",
         "Unit-test each module; test each increment end to end; let 5+ students and 2 "
         "vendors try it; record every defect and its fix.",
         "Test plans, test sheets, defect log, sign-off"],
        ["Maintenance",
         "Run the campus pilot; collect bug reports; patch; hand over the code and documents "
         "to the next team.",
         "Pilot report, patch log, handover document"],
    ],
    widths=[1.05, 3.35, 2.60], font_size=10)
doc.add_page_break()

# ============================================================
# SECTION 3
# ============================================================
H1("Section 3. Requirements Analysis and Specification")

H2("3.1 Stakeholder Identification")
add_table(
    ["Stakeholder", "Role in the system", "What they want from it"],
    [
        ["Students and staff", "Place orders; receive deliveries",
         "A fast, safe way to buy food without long lines; a record of every order and payment"],
        ["Canteen vendors", "Run the vendor portal; accept orders; manage menus",
         "More sales at peak hours; fewer leftover items; records that replace notebooks"],
        ["Campus runners", "Pick up packed orders; update the delivery status",
         "A formal channel for delivery jobs and a fair fee per completed run"],
        ["System administrator (student council)", "Approve or suspend accounts; view statistics",
         "Accountability inside the campus; one trustworthy vendor list"],
        ["SE instructor / adviser", "Reviews this proposal; grades the final work",
         "A proposal that meets every rubric item and a demo that supports the answers"],
        ["Campus administration", "Owns the campus rules the system must follow",
         "No unregulated selling inside campus; privacy for student accounts"],
    ],
    widths=[1.50, 2.35, 3.15], font_size=10)

H2("3.2 Elicitation Techniques")
H3("Technique 1: Structured interviews")
P("We interviewed 8 canteen vendors and 3 student council officers during the week of September "
  "28 to October 2, 2026. Each interview ran 15 to 20 minutes at the stall counter or the council "
  "office. A sample interview guide is in Appendix A. What we learned:")
bullets([
    "All three busy stalls take more orders at peak time than one cook can serve right away, "
    "so orders pile up in a spoken queue where mistakes happen.",
    "No vendor keeps a real sales record. One vendor recalled running out of a popular dish "
    "in the middle of a big merienda rush - phone records and paper were all she had.",
    "The council approves stalls with signed papers kept in one folder. No single officer "
    "can say from memory which permits expire this month.",
])
H3("Technique 2: Questionnaire (survey)")
P("We built a 10-item questionnaire (Appendix B) and shared it as a Google Form plus printed "
  "copies in the same week. Fifty students answered; 42 responses were complete and counted. "
  "Top findings:")
bullets([
    "82% agreed that long lines make them skip meals or buy less at break time.",
    "66% said they sometimes walk to a stall and only then learn their dish is sold out.",
    "72% would pay a 5- to 10-peso fee for on-campus delivery. 61% would order more often "
    "if they could see the status of their order.",
])
H3("Technique 3: Direct observation")
P("Two members sat at the busiest stall on October 2 and 3, from 11:30 AM to 1:00 PM. They counted "
  "lines of 7 to 11 students, an average wait of 12 minutes, and 19 students over the two days who "
  "walked up to a counter and left without buying - most of them after seeing empty trays.")
H3("Technique 4: Use cases and user stories")
P("We wrote 12 use cases and 10 user stories (samples in Appendix C). Writing them before the "
  "requirements list forced our hidden assumptions into the open. One 'obvious' idea - showing "
  "all stalls at once on the home screen - was dropped after a draft story ('as a student, I want "
  "to search for a dish') showed us search is the faster path.")

H2("3.3 Functional Requirements")
add_table(
    ["ID", "Requirement", "Priority"],
    [
        ["FR-01", "The system shall let students and staff register with a CSU email or a "
                  "verified student number and log in with a password.", "High"],
        ["FR-02", "The system shall let an administrator approve, reject, or suspend any "
                  "student, vendor, or runner account.", "High"],
        ["FR-03", "The system shall show all approved vendors, and let students filter them "
                  "by food category.", "High"],
        ["FR-04", "The system shall show each vendor's menu with item name, photo, price, and "
                  "current availability.", "High"],
        ["FR-05", "The system shall let a student build a cart of one or more items from one "
                  "vendor and submit it as an order.", "High"],
        ["FR-06", "The system shall compute the cart total plus the small platform fee and "
                  "show the final amount before checkout.", "High"],
        ["FR-07", "The system shall let a vendor accept or reject an incoming order and set "
                  "an estimated preparation time when accepting.", "High"],
        ["FR-08", "The system shall let the student pay by cash on delivery or by e-wallet "
                  "transfer, and shall record every payment with a receipt number.", "High"],
        ["FR-09", "The system shall show a live order status: pending, accepted, preparing, "
                  "ready, picked up, delivered.", "High"],
        ["FR-10", "The system shall send a delivery task to an available runner, and let the "
                  "runner accept it.", "High"],
        ["FR-11", "The system shall let the runner mark the order as picked up and delivered, "
                  "and the vendor mark it as ready for pickup.", "High"],
        ["FR-12", "The system shall let a vendor switch any menu item on or off in real time "
                  "and edit menu details.", "High"],
        ["FR-13", "The system shall create an itemized daily sales summary for every vendor "
                  "at end of day and keep the last 30 days readable.", "Medium"],
        ["FR-14", "The system shall let a student rate a delivered order from 1 to 5 stars, "
                  "with an optional comment.", "Medium"],
        ["FR-15", "The system shall show each vendor's average rating from all past orders.", "Medium"],
        ["FR-16", "The system shall send a push message to the student each time the order "
                  "status changes.", "Medium"],
        ["FR-17", "The system shall let a student cancel an order any time before it becomes "
                  "'preparing', and record the reason.", "Medium"],
        ["FR-18", "The system shall show a vendor one queue screen of the day's orders, "
                  "sorted by status and time.", "Medium"],
        ["FR-19", "The system shall let an administrator export platform statistics (orders, "
                  "sales, active vendors) by day, week, or month.", "Low"],
        ["FR-20", "The system shall keep a log of every status change, payment, and approval "
                  "action, for audit.", "Low"],
    ],
    widths=[0.72, 4.78, 1.00], align_center_cols=(0, 2), font_size=9.5)

H2("3.4 Non-Functional Requirements")
add_table(
    ["ID", "Type", "Requirement (measurable)"],
    [
        ["NFR-01", "Performance",
         "Opening the menu and sending an order shall take 3 seconds or less on a midrange "
         "Android phone on campus Wi-Fi. We will time 50 test runs."],
        ["NFR-02", "Performance",
         "A status change made by a vendor or runner shall show on the student's screen "
         "within 15 seconds."],
        ["NFR-03", "Security",
         "Passwords shall be stored as salted hashes, never as plain text. All data between "
         "app and server shall travel over HTTPS. Logins shall expire after 12 idle hours."],
        ["NFR-04", "Security",
         "Actions shall match roles: only a vendor can change that vendor's menu; only the "
         "assigned runner can update that delivery; only an admin can approve accounts."],
        ["NFR-05", "Usability",
         "A first-time user shall finish an order (open the app to checkout) in 3 minutes or "
         "less with no help. We will test with 10 first-time users."],
        ["NFR-06", "Usability",
         "Buttons and taps shall be at least 48x48 pixels. Body text shall be at least 14 "
         "pixels so it is readable on small phones."],
        ["NFR-07", "Reliability",
         "The system shall serve 100 users at the same time during peak hours with zero "
         "failed orders, checked with a scripted load test before rollout."],
        ["NFR-08", "Reliability",
         "A crash or power cut shall never leave a payment paid but unrecorded. Payment and "
         "order records shall be saved together or not at all."],
        ["NFR-09", "Compatibility",
         "The mobile app shall run on Android 8.0 and up. The vendor portal shall work on "
         "Chrome and Firefox browsers from the last two years."],
        ["NFR-10", "Support",
         "The vendor portal shall be up through campus hours (7 AM to 6 PM). Planned repairs "
         "shall be announced one day ahead. Unit test coverage shall reach 70% of backend "
         "code before release."],
    ],
    widths=[0.72, 1.28, 4.50], align_center_cols=(0,), font_size=9.5)

H2("3.5 Constraints and Assumptions")
H3("Constraints")
bullets([
    "Technical: the mobile app will be Android only. iOS is out of reach, since no team "
    "member has an Apple device or a developer account.",
    "Budget: zero. All hosting runs on free tiers (a free PostgreSQL host and Firebase's "
    "free push-notification tier). The small platform fee shown in the app is for the pilot "
    "study only, not collected online.",
    "Time: 12 weeks, fixed by the term. If we slip, we shrink scope inside an increment - "
    "never the deadline.",
    "Organizational: stall owners and the council are helping us by choice. Pilot tests "
    "must not disturb their real business for more than a few orders per run.",
])
H3("Assumptions")
bullets([
    "The stalls and the council stay willing to work with us until the pilot (they are, as "
    "of this writing).",
    "Every student owns or can borrow an Android phone and has campus Wi-Fi or mobile data.",
    "At least 10 runners will register by the time Increment 2 ships. Runner friends will be "
    "recruited in the first two weeks.",
    "E-wallet transfers (GCash or Maya) happen in the student's own app. The system stores "
    "the reference number; it does not confirm the money itself.",
])

H2("3.6 Requirements Quality Check")
add_table(
    ["Quality attribute", "How the team checked it"],
    [
        ["Complete", "Every finding from the interviews and survey maps to at least one "
         "functional requirement. Every problem in Section 1.2 has a requirement that answers it."],
        ["Consistent", "No two requirements contradict each other. We read the full list "
         "twice against the survey findings."],
        ["Unambiguous", "Each requirement is one 'The system shall...' sentence with one "
         "action, and numbers where possible."],
        ["Feasible", "We checked each item against our skills and the 12 weeks. Items not "
         "possible on a free budget (such as card payments) were moved out to the "
         "Limitations."],
        ["Testable", "Every functional requirement has a matching test case. Every "
         "non-functional requirement names a number we can measure."],
        ["Traceable", "Each requirement traces up to an interview or survey finding "
         "(Appendix D shows the map) and down to a module in the structure chart."],
        ["Prioritized", "Every requirement carries High, Medium, or Low. Priority decides "
         "which increment holds it."],
        ["Modifiable", "All requirements live in one numbered table. Changing one does not "
         "break others or force edits in unknown places."],
    ],
    widths=[1.45, 5.05], font_size=10)

H2("3.7 Quality Metrics Plan")
add_table(
    ["Metric", "What it measures", "How we collect it", "Target"],
    [
        ["Defect density", "Defects found per 1,000 lines of code after release",
         "count from the issue tracker", "1.5 or fewer per KLOC in the pilot window"],
        ["Unit test coverage", "Share of backend code covered by automated tests",
         "coverage tool in our test runs", "at least 70% by Increment 3"],
        ["Cyclomatic complexity", "How tangled each function is (count of decisions)",
         "code check tool at review time", "no function above 10"],
        ["Response time (p95)", "How fast the app answers in the slowest 5% of cases",
         "timing logs during user testing", "3 s or less for menus, 2 s or less for status"],
        ["Order completion rate", "Orders started vs orders finished",
         "system activity log", "at least 90% completed during the pilot"],
    ],
    widths=[1.35, 2.02, 1.72, 1.41], font_size=9.5)
doc.add_page_break()

# ============================================================
# SECTION 4
# ============================================================
H1("Section 4. System Analysis and Modeling")

H2("4.1 Data Flow Diagram - Level 0 (Context Diagram)")
P("Figure 1 shows the whole system as one process. Four users connect to it: the student, the "
  "vendor, the campus runner, and the system administrator. Each one sends data in and gets data "
  "back. The diagram makes the system boundary clear: cooking the food and handing over the cash "
  "stay outside the system. What is inside is the flow of orders, payments, and reports.")
figure("figures/dfd_level0.png", "Figure 1. Context Diagram (DFD Level 0) of FoodEagle", 5.4)

H2("4.2 Data Flow Diagram - Level 1")
P("Figure 2 opens up that one process into six smaller processes and four data stores. Process 1.0 "
  "manages accounts. Process 2.0 keeps the menus. Process 3.0 takes in orders. Process 4.0 tracks "
  "each order during delivery. Process 5.0 records payments. Process 6.0 builds the reports. The "
  "four stores are D1 Users, D2 Menus, D3 Orders, and D4 Payments. Every flow that appears in "
  "Figure 1 appears again here, so the two levels match.")
figure("figures/dfd_level1.png", "Figure 2. Data Flow Diagram, Level 1, of FoodEagle", 6.4)

H2("4.3 Data Flow Diagram - Level 2 (of Process 3.0, bonus)")
P("Process 3.0 carries the most work of any single process, so we opened it once more in Figure 3. "
  "Process 3.1 takes the order details from the student. Process 3.2 checks the items against "
  "store D2 and adds up the total. Process 3.3 asks the vendor to accept or reject. Process 3.4 "
  "saves the confirmed order in store D3 and gives the student an order number and pickup time.")
figure("figures/dfd_level2.png", "Figure 3. DFD Level 2 - Process 3.0 opened up", 6.2)

H2("4.4 Entity Relationship Diagram (Chen notation) and Data Dictionary")
drawn_note = (
    "Figure 4 is our ERD, drawn in the notation used in class. Entities are rectangles, "
    "attributes are ovals, and relationships are diamonds. Underlined names are identifiers "
    "(primary keys). The letter on each line gives the cardinality. ORDER_LINE is a weak "
    "entity, so it has a double rectangle and its relationship diamond is double too. "
    "Est_Arrival_Time is a derived attribute, drawn with a dashed oval, because the system "
    "computes it from the order time and the preparation time - we do not store it.")
P(drawn_note)
figure("figures/erd.png", "Figure 4. Entity Relationship Diagram of FoodEagle (Chen notation)", 6.4)
P("The seven entities in Figure 4 hold all the data of the system. A USER places many ORDERs "
  "(1:M). A VENDOR receives many ORDERs (1:M). A VENDOR offers many MENU_ITEMs (1:M). Each ORDER "
  "contains one or more ORDER_LINEs (1:M, identifying). Each ORDER_LINE refers to one MENU_ITEM "
  "(M:1). Each ORDER is paid by one PAYMENT (1:1). A RUNNER delivers many ORDERs (1:M).")
P("Data dictionary (main entities). We describe the data elements the way our module teaches "
  "it - element name, meaning, and how the value is formed or restricted:", bold=True)
add_table(
    ["Data element", "Meaning (what it holds)", "How it is formed / restricted"],
    [
        ["User_ID", "unique code that names one account",
         "number, assigned by the system; never reused"],
        ["Full_Name", "the person's real name", "text, letters only, 120 letters max"],
        ["Email", "login name of the account", "text; must be a CSU email or an approved "
         "personal email; unique"],
        ["Password", "secret used to log in", "stored as a salted hash; plain text is never "
         "kept"],
        ["Role", "what kind of account it is", "one of: student, vendor, runner, admin"],
        ["Vendor_ID", "unique code for one stall", "number, assigned by the system"],
        ["Stall_Name", "the name shown to students", "text, 80 letters max"],
        ["Stall_No", "physical place of the stall inside campus", "short code (for example "
         "'C-07')"],
        ["Open_Hours", "when the stall accepts orders", "time span, for example 07:00-17:00"],
        ["Item_ID", "unique code for one menu item", "number, assigned by the system"],
        ["Item_Name / Price", "what the dish is and what it costs",
         "text 80 letters max / money in pesos, two decimals"],
        ["Available", "is the dish still sellable", "Yes or No; flipped by the vendor in "
         "real time"],
        ["Order_ID", "unique number shown to the student", "number, assigned on checkout"],
        ["Order_Date_Time", "when the order was placed", "date and time, set automatically"],
        ["Pickup_Point", "where the runner brings the food",
         "one of the named campus drop points"],
        ["Status", "where the order is now", "one of: pending, accepted, preparing, ready, "
         "picked up, delivered, cancelled"],
        ["Total_Amount", "final amount to be paid", "sum: item prices + delivery fee "
         "(computed, not typed)"],
        ["Order_Line", "one item inside an order",
         "Order_ID + Line_No + Item_ID + Quantity + Unit_Price"],
        ["Quantity", "how many of the item", "whole number, 1 or more"],
        ["Unit_Price", "price frozen at order time", "copies the item's price the moment "
         "the order is placed"],
        ["Payment_ID / Ref_No", "record of one payment", "system number; Ref_No holds the "
         "e-wallet transfer reference for e-wallet payments"],
        ["Method", "how the student pays", "one of: cash, e-wallet"],
        ["Feedback", "stars and words after delivery",
         "rating 1-5 + optional comment, one per delivered order"],
    ],
    widths=[1.35, 1.95, 3.20], font_size=9.5)

H2("4.5 Structure Chart")
P("Figure 5 shows the modules of the system in a hierarchy. The top box is the whole system. "
  "Under it sit three big modules, one per user: the student mobile app, the vendor portal, and "
  "the admin console. Each of those breaks into the small screens that do one job each. This "
  "layout matches our three increments: Increment 1 covers the first student screens plus the "
  "vendor menu screen; Increment 2 adds the tracking screens and the vendor queue; Increment 3 "
  "adds feedback and the report screens.")
figure("figures/structure_chart.png", "Figure 5. Structure Chart of FoodEagle", 6.4)
doc.add_page_break()

# ============================================================
# SECTION 5
# ============================================================
H1("Section 5. Design Strategy and User Interface Design")

H2("5.1 Design Strategy")
P("Our design strategy is top-down with object-oriented construction. Top-down fits us because "
  "our analysis already drew the big picture (the context diagram) and then broke it into parts "
  "(Level 1 and Level 2 DFDs). The modules in the structure chart fall out of that same breaking "
  "down - we design the shape first, then fill in the parts.")
P("It is object-oriented at the same time, because our problem reads naturally as objects. A USER "
  "holds data (name, role) and actions (log in, place order). An ORDER holds data (status, total) "
  "and actions (accept, reject, cancel). Our front-end tool (Flutter) and our back-end tool "
  "(Node.js) are both built around classes and objects, so the model fits the tools with no "
  "forcing.")
P("In short: we fixed the data model first (the ERD), then the API steps, then drew the screens "
  "on top. Screens follow taste and can change. The data model should not change with taste.")

H2("5.2 System Architecture")
P("Figure 6 shows the shape of the running system - the classic three-tier layout taught in our "
  "module. Two clients sit on top: the student's mobile app and the vendor's web portal. One REST "
  "API server sits in the middle. Under it, one PostgreSQL database holds the data, and Firebase "
  "Cloud Messaging sends the push alerts. Clients speak to the server over HTTPS with JSON. Only "
  "the server touches the database. Because of this, the same rules (price computation, status "
  "changes, who may do what) hold no matter which client is talking.")
figure("figures/architecture.png", "Figure 6. System Architecture of FoodEagle", 5.4)

H2("5.3 Interface Type")
P("Students use a graphical mobile interface (Android, built with Flutter). We chose this because "
  "our survey showed phones are already where students do things. The phone also gives us push "
  "alerts and instant access anywhere on campus. A plain web page would miss the pattern of "
  "checking the phone between classes.")
P("Vendors and admins use web interfaces, desktop-first, on any modern browser. Vendors share "
  "phones but also work beside a small laptop during cooking hours, so a browser screen is easier "
  "for them. All three faces of the system share one design language: the same status colors, the "
  "same icons, and the same words, so nothing feels foreign when a user switches from one to "
  "another.")

H2("5.4 Interface Design Rules")
P("Our screens follow the interface golden rules taught in the module. Here is how, with samples "
  "from our own screens:")
bullets([
    "Strive for consistency - the order status chips (Pending, Preparing, Ready, Delivered) "
    "use the same colors and icons in the student app, the vendor queue, and the runner "
    "screen. A button that does the same job wears the same color everywhere.",
    "Keep it simple - the student home screen shows only four main actions: Search, Today's "
    "stalls, My active order, and History. Everything else sits one level down.",
    "Provide clear feedback - every action answers at once. Adding to the cart updates the "
    "cart total immediately. A placed order flashes its order ID. A rejected order returns "
    "the student to a screen that says plainly what happened and why.",
    "Use appropriate language - buttons carry verbs, not jargon: 'Track Order', 'Mark as "
    "Ready', 'Accept Delivery'. Users of any level can guess what each tap will do.",
    "Minimize memory load - the app never asks the student to remember an order number. It "
    "shows it, and every screen that needs it shows it again.",
    "Make it easy to recover from errors - an order can be cancelled any time before "
    "'preparing', so a wrong tap never locks the student in. Confirmation screens guard "
    "costly actions like checkout.",
    "Provide clear navigation - a simple bottom bar (Home, Orders, Account) stays fixed in "
    "the app, so users always know where they are.",
    "Make it visually appealing - large food photos, generous spacing, and campus colors, "
    "so the busiest screen still breathes.",
])
doc.add_page_break()

# ============================================================
# SECTION 6
# ============================================================
H1("Section 6. Project Management Plan")

H2("6.1 Team and Responsibilities")
add_table(
    ["Member", "Role", "Main tasks"],
    [
        ["Bartolome, Antonette", "Project Manager",
         "Keeps the schedule and scope; runs the weekly meeting; talks to the instructor "
         "and the vendors; watches the risk list"],
        ["Delos Santos, Rashelle Joi", "Business Analyst",
         "Runs the interviews, survey, and observation; owns the requirements list and its "
         "traceability"],
        ["Escalante, Chazel", "UI / UX Designer",
         "Draws the screen sketches and user flow; keeps the golden rules; tests usability "
         "with new users"],
        ["Homigop, Reiner", "Lead Developer",
         "Builds the backend and vendor portal; reviews all code; keeps the repository and "
         "data model"],
        ["Luyun, Mary Joyce", "Quality Assurance Lead",
         "Writes the test plan and test cases; runs unit, integration, and user tests; "
         "keeps the defect log"],
        ["Mamauag, Jamaica Lei Zaira", "Documentation Lead",
         "Keeps this proposal, the user manual, the meeting minutes, and the appendices in "
         "order"],
        ["Soriano, Zymon Loui", "Backend Developer / DevOps",
         "Builds the API and database; handles the free hosting and the pilot rollout"],
    ],
    widths=[1.75, 1.55, 3.20], font_size=10)

H2("6.2 Task List and Schedule")
add_table(
    ["Task", "Duration (weeks)", "After which task"],
    [
        ["1. Topic approval & planning", "0.5", "-"],
        ["2. Survey, interviews, observation", "1", "1"],
        ["3. Requirements list", "1", "2"],
        ["4. Modeling: DFD, ERD, charts", "1", "3"],
        ["5. UI design & paper prototype", "1", "3"],
        ["6. Backend setup & accounts module", "1", "4"],
        ["7. Ordering & payment module", "2", "5, 6"],
        ["8. Tracking & vendor portal", "2", "7"],
        ["9. Testing & fixing", "1", "8"],
        ["10. Survey round 2 (validation)", "0.5", "9"],
        ["11. Deployment & documentation", "1", "10"],
        ["12. Final presentation practice", "0.5", "11"],
    ],
    widths=[3.20, 1.40, 1.40], align_center_cols=(1, 2), font_size=10)
P("Figure 7 shows the same 12 weeks as a Gantt chart. Tasks 1-5 are the planning and analysis "
  "chain. Tasks 6-8 are the building increments. Tasks 9-12 close the project with testing, "
  "validation, deployment, and the presentation.")
figure("figures/gantt.png", "Figure 7. Project Gantt Chart (12 Weeks)", 6.3)

H2("6.3 Risk Management")
add_table(
    ["Risk", "Chance", "Damage", "What we will do about it"],
    [
        ["A partner vendor loses interest in the middle", "Medium", "High",
         "Get a written yes from at least one backup stall per food category; keep stall "
         "signup short (about 10 minutes)"],
        ["Class work collides with a build deadline", "High", "Medium",
         "Put the hardest tasks early in the Gantt; keep every increment at 'minimum "
         "working' level so members can drop hours without sinking it"],
        ["The free hosting limits are hit during the pilot", "Medium", "Medium",
         "Watch usage weekly; prepare a lighter fallback; upgrade the plan only if the "
         "pilot truly needs it"],
        ["A late change in the data model forces rework", "Medium", "High",
         "Freeze the data model after Increment 1; later changes may only add, never "
         "rebuild; regression test after every merge"],
        ["Too few runners join to test delivery well", "Medium", "Medium",
         "Recruit runner friends in the first two weeks; team members act as test runners "
         "during user testing"],
        ["Phone battery-saver kills push messages", "Medium", "Low",
         "Pair each push with an in-app status check, so the student sees updates even "
         "without the notification"],
    ],
    widths=[1.85, 0.85, 0.75, 3.05], align_center_cols=(1, 2), font_size=9.5)

H2("6.4 Monitoring and Communication")
bullets([
    "Monitoring: one shared tracker sheet is the single source of truth. Each row is one "
    "Gantt task, updated weekly. A milestone checklist marks the gate of every increment. "
    "The project manager reviews it and reports what slipped and why.",
    "Meetings: one 60-minute weekly meeting, plus a chat for day-to-day questions. Every "
    "meeting ends with minutes saved in the shared drive.",
    "Change control: any change to the requirements is proposed in writing, weighed by the "
    "PM and the analyst against the schedule, then logged in a change register. Code "
    "changes go through merge requests reviewed by the lead developer.",
    "Escalation: anything that threatens the deadline by more than 3 days goes to the "
    "instructor at the next weekly consultation, with options already drafted.",
])
doc.add_page_break()

# ============================================================
# SECTION 7
# ============================================================
H1("Section 7. Conclusion")
P("FoodEagle is a campus food delivery system for CSU Carig. It answers four problems we "
  "observed on the ground: lines that eat the class break, the blind spot between stall and "
  "student, sales records kept in notebooks, and runner deals with no record at all. Its five "
  "functions - mobile ordering, live tracking, vendor management, payment records, and feedback - "
  "all sit inside what a small team can build in twelve weeks. Two kinds of users will use it "
  "daily: students and vendors, with runners and administrators supporting both.")
P("If this proposal is approved, work starts at once on the requirements, then on the three "
  "increments laid out in Section 2. The first working release lands in week 6, and delivery in "
  "week 12. We expect the system to bring the average peak-hour wait down from 12 minutes to 5 "
  "or less, to put every vendor on a clean daily sales record, and to hand the student council "
  "one verifiable list of who sells and who delivers on campus. What we are asking to build is "
  "small and focused: a system that takes the queue out of lunch.")

# ============================================================
# SECTION 8
# ============================================================
H1("Section 8. References")
refs = [
    "Pressman, R. S., & Maxim, B. R. (2020). Software engineering: A practitioner's approach "
    "(9th ed.). McGraw-Hill Education.",
    "Sommerville, I. (2016). Software engineering (10th ed.). Pearson Education.",
    "Kendall, K. E., & Kendall, J. E. (2019). Systems analysis and design (10th ed.). Pearson.",
    "Dennis, A., Wixom, B. H., & Roth, R. M. (2018). Systems analysis and design (7th ed.). Wiley.",
    "Tutorials Point (I) Pvt. Ltd. (2014). Software engineering tutorial. Retrieved from "
    "https://www.tutorialspoint.com/software_engineering/",
    "Shneiderman, B. (1998). Designing the user interface: Strategies for effective "
    "human-computer interaction. Addison-Wesley Longman.",
    "Nielsen, J. (1993). Usability engineering. Academic Press.",
    "Dumayag, D. P. (2020). Module in Software Engineering 1, Units 5.1-5.2 and Software "
    "Design Strategies and Interface Design. Cagayan State University - CICS.",
]
for r in refs:
    p = P(r)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.5)
    p.paragraph_format.space_after = Pt(8)
P("Note: course modules are included as taught sources; other published works were also "
  "consulted.", italic=True, size=9.5)

# ============================================================
# SECTION 9 - appendices
# ============================================================
H1("Section 9. Appendices")

H2("Appendix A. Sample Interview Guide (Vendors)")
for q in [
    "1. How many orders do you serve on a normal day? On a peak day?",
    "2. Walk me through one order from greeting to handing over the food. Where does time go?",
    "3. How do students know what you sell today, and what runs out?",
    "4. How do you record your sales? What do you wish you knew at day's end?",
    "5. Have you taken pre-orders or deliveries before? What worked? What did not?",
    "6. What would make you trust an ordering app with your stall?",
]:
    P(q, style="List Bullet")
P("(For the student council, the same structure with questions on stall permits.)", italic=True, size=9.5)

H2("Appendix B. Sample Survey Form")
P("10-item questionnaire for students (Google Form + printed copies, 50 answered):", bold=True)
for q in [
    "1. What year level and program are you in?",
    "2. How often do you buy food from campus stalls on class days?",
    "3. What is the longest line you waited in this month (about how many minutes)?",
    "4. Agree or disagree: the line at break is long enough to make me skip a meal or buy less.",
    "5. Have you walked to a stall and found your order unavailable?",
    "6. Rank what would help you most: price display, stock display, pre-ordering, delivery.",
    "7. Would you pay a 5-10 peso delivery fee on campus? Why or why not?",
    "8. Would you order more often if you could track your order? Why or why not?",
    "9. Which payment do you prefer: cash on delivery, e-wallet, or both?",
    "10. What is the one thing a food ordering app must never get wrong?",
]:
    P(q, style="List Bullet")

H2("Appendix C. Excerpts - Use Cases and User Stories")
P("Use case (sample): UC-03 Place an Order", bold=True)
add_table(
    ["Field", "Detail"],
    [
        ["Actor", "Student or staff customer"],
        ["Before", "Student is logged in; the chosen vendor is approved and open"],
        ["Main steps", "Student opens the menu, adds items to the cart, checks the total, "
                       "picks a pickup point and payment, taps Place Order; the system sends "
                       "it to the vendor and returns an order ID and pickup time"],
        ["Other paths", "An item ran out while in the cart; the vendor rejects the order"],
        ["After", "The order exists with status 'pending' or 'accepted'"],
    ],
    widths=[1.30, 5.20], font_size=9.5)
P("User stories (samples):", bold=True)
for s in [
    "As a student, I want to see which stalls are open right now, so I do not send an order "
    "to a closed stall.",
    "As a student, I want to track my order's status, so I can time my walk to the pickup point.",
    "As a vendor, I want to switch an item off the moment it runs out, so no student orders "
    "a sold-out dish.",
    "As a vendor, I want a sales summary at day's end, so I can plan tomorrow's cooking.",
    "As a runner, I want pickup and drop-off points on one screen, so I can accept a job fast.",
    "As an admin, I want to see who approved which vendor and when, so verification can be "
    "checked later.",
]:
    P(s, style="List Bullet")

H2("Appendix D. Requirements Traceability (Sample)")
add_table(
    ["Finding (from the evidence)", "Problem it causes", "Requirement(s)", "Increment"],
    [
        ["Interview: spoken queues at peak; survey: 82% call the line a burden", "P1",
         "FR-05, FR-06, FR-07", "1"],
        ["Survey: 66% meet sold-out items; interview: no stock signal to students", "P2",
         "FR-04, FR-12", "1"],
        ["Interview: notebook sales records; vendors want day-end totals", "P3", "FR-13", "3"],
        ["Observation: runner jobs arranged in chats with no record", "P4",
         "FR-10, FR-11, FR-20", "2"],
        ["Survey: 72% would pay a 5-10 peso delivery fee", "P1 / P4", "FR-06, FR-10", "2"],
    ],
    widths=[2.65, 0.85, 1.75, 0.85], align_center_cols=(1, 3), font_size=9.5)

# ---------- save ----------
doc.core_properties.title = "FoodEagle Software Project Proposal"
doc.core_properties.author = "Team Crimson"
doc.core_properties.subject = "Software Engineering"
out = os.path.join(os.path.expanduser("~"), "Downloads", "FoodEagle_Project_Proposal_v2.docx")
doc.save(out)
print("SAVED:", out)
