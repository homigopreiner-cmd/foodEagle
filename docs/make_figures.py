import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, FancyArrowPatch
import os

os.makedirs("figures", exist_ok=True)
INK = "#1a1a1a"

def save(fig, name):
    fig.savefig(os.path.join("figures", name), dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print("saved", name)

def arrow(ax, p1, p2, label="", rad=0.0, fs=7, off=(0, 0), color=INK, style="-"):
    a = FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=11,
                        connectionstyle=f"arc3,rad={rad}", lw=1.0, color=color, linestyle=style)
    ax.add_patch(a)
    if label:
        mx, my = (p1[0]+p2[0])/2 + off[0], (p1[1]+p2[1])/2 + off[1]
        ax.text(mx, my, label, fontsize=fs, ha="center", va="center", color=INK,
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec="none"))

def entity(ax, x, y, w, h, name, fs=8.5):
    ax.add_patch(Rectangle((x, y), w, h, fc="white", ec=INK, lw=1.2))
    ax.text(x+w/2, y+h/2, name, fontsize=fs, ha="center", va="center", weight="bold")

def process(ax, cx, cy, r, title, num="", fs=8):
    ax.add_patch(Circle((cx, cy), r, fc="white", ec=INK, lw=1.2))
    txt = f"{num}\n{title}" if num else title
    ax.text(cx, cy, txt, fontsize=fs, ha="center", va="center", weight="bold")

def store(ax, x, y, w, num, name, fs=7.5):
    h = 3
    rect = Rectangle((x, y), w, h, fc="white", ec="none")
    ax.add_patch(rect)
    xs = x + 4
    ax.plot([x, x+w], [y+h, y+h], color=INK, lw=1.2)
    ax.plot([xs, xs], [y+h, y], color=INK, lw=1.2)
    ax.plot([x+w, x+w], [y, y+h], color=INK, lw=1.2)
    ax.text(x+2, y+h/2, num, fontsize=fs, ha="center", va="center", weight="bold")
    ax.text(xs + (w-6)/2, y+h/2, name, fontsize=fs, ha="center", va="center")

# ---------------- DFD Level 0 ----------------
fig, ax = plt.subplots(figsize=(9.2, 6.4))
ax.set_xlim(0, 100); ax.set_ylim(0, 74); ax.axis("off"); ax.set_aspect("equal")

process(ax, 50, 37, 13, "FoodEagle\nOrdering and\nDelivery System", "0", fs=9)
entity(ax, 4, 28, 16, 9, "Student /\nStaff Customer")
entity(ax, 80, 58, 16, 9, "Vendor\n(canteen stall)")
entity(ax, 80, 32, 16, 9, "Campus\nRunner")
entity(ax, 80, 5, 16, 9, "System\nAdmin")

arrow(ax, (20, 40.5), (37.8, 42.5), "order request,\npayment details", off=(0, 3.5))
arrow(ax, (37.8, 33.5), (20, 32.0), "order confirmation,\nstatus updates", off=(0, -3))
arrow(ax, (65.0, 44.6), (80, 60.0), "order notification,\nsales report", rad=-0.28, off=(7.5, -1))
arrow(ax, (80, 54.5), (63.5, 40.5), "menu data,\nvendor reply", rad=-0.28, off=(-6, 3.2))
arrow(ax, (65.3, 37.0), (80, 36.0), "delivery task")
arrow(ax, (80, 39.0), (64.6, 39.4), "delivery status")
arrow(ax, (64.0, 30.0), (80, 10.0), "usage report,\npending list", rad=0.18, off=(-9, -3))
arrow(ax, (80, 8.5), (64.8, 27.9), "verification\ndecision", rad=0.18, off=(8, 3))
ax.set_title("Figure 1. Context Diagram (Data Flow Diagram, Level 0) - FoodEagle", fontsize=11, weight="bold", pad=10)
save(fig, "dfd_level0.png")

# ---------------- DFD Level 1 ----------------
fig, ax = plt.subplots(figsize=(15.4, 8.6))
ax.set_xlim(0, 132); ax.set_ylim(0, 88); ax.axis("off"); ax.set_aspect("equal")

def entity1(ax, x, y, w, h, name, fs=8.5):
    ax.add_patch(Rectangle((x, y), w, h, fc="white", ec=INK, lw=1.2))
    ax.text(x+w/2, y+h/2, name, fontsize=fs, ha="center", va="center", weight="bold")

def process1(ax, cx, cy, r, num, title, fs=7.6):
    ax.add_patch(Circle((cx, cy), r, fc="white", ec=INK, lw=1.2))
    ax.text(cx, cy + r*0.30, num, fontsize=fs+0.6, ha="center", va="center", weight="bold")
    ax.text(cx, cy - r*0.22, title, fontsize=fs, ha="center", va="center", weight="bold")

def store1(ax, x, y, w, num, name, fs=7.5):
    h = 3.4
    xs = x + 4
    ax.plot([x, x+w], [y+h, y+h], color=INK, lw=1.2)
    ax.plot([x, x], [y, y+h], color=INK, lw=1.2)
    ax.plot([xs, xs], [y, y+h], color=INK, lw=1.2)
    ax.plot([x+w, x+w], [y, y+h], color=INK, lw=1.2)
    ax.text(x+2, y+h/2, num, fontsize=fs, ha="center", va="center", weight="bold")
    ax.text(xs + (w - 4)/2, y+h/2, name, fontsize=fs, ha="center", va="center")

def flow(pts, labels, fs=7.4, gap=2.6):
    """pts: list of waypoints; labels: one per segment (or None) drawn at midpoint."""
    for i in range(len(pts)-1):
        p1, p2 = pts[i], pts[i+1]
        if i == len(pts)-2:
            style = "-|>"
        else:
            style = "-"
        ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle=style, mutation_scale=12, lw=1.0, color=INK))
        lab = labels[i] if i < len(labels) else None
        if lab:
            mx, my = (p1[0]+p2[0])/2, (p1[1]+p2[1])/2
            horiz = abs(p2[0]-p1[0]) > abs(p2[1]-p1[1])
            ax.text(mx, my + (gap if horiz else 0) if horiz else mx - gap, lab
                    if horiz else lab, fontsize=fs, ha="center" if horiz else "center",
                    va="center", color=INK,
                    bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none"))

# ---- external entities ----
entity1(ax, 2, 32, 12, 10, "Student /\nStaff\nCustomer", fs=7.4)
entity1(ax, 118, 74, 12, 9, "Vendor", fs=8.2)
entity1(ax, 118, 40, 12, 9, "Campus\nRunner", fs=7.8)
entity1(ax, 118, 6, 12, 9, "System\nAdmin", fs=7.8)

# ---- processes ----
process1(ax, 26, 68, 6.0, "1.0", "Manage\nAccounts")
process1(ax, 43, 80.5, 5.4, "2.0", "Maintain\nMenus", fs=7.2)
process1(ax, 60, 52, 6.0, "3.0", "Process\nOrders")
process1(ax, 88, 52, 6.0, "4.0", "Track\nOrders")
process1(ax, 26, 30, 6.0, "5.0", "Record\nPayments")
process1(ax, 74, 12, 6.0, "6.0", "Generate\nReports")

# ---- data stores ----
store1(ax, 52, 68, 12, "D1", "Users")
store1(ax, 74, 84, 12, "D2", "Menus")
store1(ax, 74, 30, 12, "D3", "Orders")
store1(ax, 8, 14, 12, "D4", "Payments")

# ---- flows ----
# P1 <-> Student
flow([(14, 40.5), (21.8, 66.0)], ["registration /\nlogin details"])
flow([(22.6, 62.6), (14, 37.5)], ["verified\naccount status"], fs=7.2)
# P1 -> D1
flow([(31.6, 69.0), (52, 71.2)], ["user records"])
# Admin -> P1
flow([(118, 10.0), (32.0, 65.0)], ["verification\ndecision"], fs=7.2)
# Vendor -> P2 -> D2
flow([(118, 80.0), (48.4, 82.0)], ["menu data"])
flow([(48.0, 78.6), (118, 77.5)], ["availability\nupdates"], fs=7.2)
flow([(43.6, 75.6), (43.6, 71.6), (52.0, 71.2)], [None, "menu records"], fs=7.0)
# D2 -> P3
flow([(80.0, 68.4), (63.0, 56.8)], ["available\nitems"], fs=7.2)
# Student -> P3, P3 -> Student
flow([(14, 39.2), (54.2, 53.0)], ["order request"])
flow([(55.4, 48.6), (14, 34.6)], ["order\nconfirmation"], fs=7.2)
# P3 -> D3, D3 -> P4
flow([(65.6, 49.0), (74.0, 33.4)], ["order records"], fs=7.2)
flow([(80.0, 33.4), (83.5, 47.6)], [None, "status\ndata"], fs=7.0)
# P3 -> Vendor (notification), Vendor -> P3 (reply)
flow([(65.0, 57.0), (118, 78.6)], ["order notification"], fs=7.2)
flow([(118, 76.4), (66.6, 53.6)], ["accept /\nreject reply"], fs=7.2)
# P4 <-> Runner
flow([(93.6, 55.0), (118, 46.5)], ["delivery task"])
flow([(118, 44.0), (94.0, 50.0)], ["delivery status"], fs=7.2)
# P4 -> Student (status updates)
flow([(84.0, 48.6), (14, 35.8)], [], fs=7.4)
ax.text(49, 43.6, "status updates", fontsize=7.4, ha="center", va="center", color=INK,
        bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none"))
# P3 -> P5 (charge), Student -> P5, P5 -> D4, D4 -> Student (receipt)
flow([(58.5, 47.2), (30.0, 33.4)], ["charge request"], fs=7.2)
flow([(14, 33.2), (20.6, 29.6)], ["payment\ndetails"], fs=7.2)
flow([(28.0, 26.4), (20.0, 17.4)], ["payment records"], fs=7.2)
flow([(18.4, 14.2), (14, 31.0)], [], fs=7.2)
ax.text(10.6, 22.0, "official receipt", fontsize=7.2, ha="center", va="center", rotation=90,
        color=INK, bbox=dict(boxstyle="round,pad=0.12", fc="white", ec="none"))
# D3/P5/D4 -> P6
flow([(80.0, 29.0), (77.5, 17.6)], ["order data"], fs=7.2)
flow([(32.0, 27.6), (68.4, 13.6)], ["payment data"], fs=7.2)
# P6 -> Vendor, P6 -> Admin
flow([(79.8, 15.0), (118, 76.4)], ["sales report"], fs=7.2)
flow([(80.0, 10.6), (118, 9.0)], ["usage report,\npending list"], fs=7.2)

ax.set_title("Figure 2. Data Flow Diagram, Level 1 - FoodEagle", fontsize=12, weight="bold", pad=12)
save(fig, "dfd_level1.png")

# ---------------- ERD ----------------
fig, ax = plt.subplots(figsize=(12.8, 7.4))
ax.set_xlim(0, 130); ax.set_ylim(0, 76); ax.axis("off")

def ent_box(ax, x, y, w, title, rows):
    h = 4.8 + 2.1 * len(rows)
    ax.add_patch(Rectangle((x, y - h), w, h, fc="white", ec=INK, lw=1.1))
    ax.add_patch(Rectangle((x, y - 4.4), w, 4.4, fc="#e8e8e8", ec=INK, lw=1.1))
    ax.text(x + w/2, y - 2.2, title, fontsize=9, ha="center", va="center", weight="bold")
    for i, r in enumerate(rows):
        ax.text(x + 1.4, y - 5.4 - 2.1*i, r, fontsize=7.2, ha="left", va="center")
    cx, cy = x + w/2, y - h/2
    return (x + w/2, y), (x + w/2, y - h), (x, y - h/2), (x + w, y - h/2), h

top     = ent_box(ax, 88, 74, 30, "MENU_ITEMS",
                  ["item_id (PK)", "vendor_id (FK)", "name, price", "category, availability", "photo_url"])
users   = ent_box(ax, 4, 60, 30, "USERS",
                  ["user_id (PK)", "full_name, student_no", "email (unique)", "password_hash", "role, status, section"])
orders  = ent_box(ax, 45, 62, 32, "ORDERS",
                  ["order_id (PK)", "user_id (FK)", "vendor_id (FK)", "status, placed_at", "pickup_point, total_amount"])
vend    = ent_box(ax, 88, 34, 30, "VENDORS",
                  ["vendor_id (PK)", "stall_name, owner_name", "contact_number", "category, stall_no", "status, approved_by"])
oitem   = ent_box(ax, 45, 27, 32, "ORDER_ITEMS",
                  ["orderline_id (PK)", "order_id (FK)", "item_id (FK)", "quantity, unit_price", "line_total"])
paym    = ent_box(ax, 4, 26, 30, "PAYMENTS",
                  ["payment_id (PK)", "order_id (FK)", "method, reference_no", "amount, status", "paid_at"])
feed    = ent_box(ax, 45, 1, 32, "FEEDBACK",
                  ["feedback_id (PK)", "order_id (FK)", "rating (1-5)", "comment, created_at"])

# connectors: (box edge points computed loosely with lines)
def link(p1, p2, l1, l2, sx, sy):
    a = FancyArrowPatch(p1, p2, arrowstyle="-", lw=1.0, color=INK)
    ax.add_patch(a)
    ax.text(p1[0] + (p2[0]-p1[0])*sx, p1[1] + (p2[1]-p1[1])*sy, l1, fontsize=7.5, ha="center", va="bottom")
    ax.text(p2[0] - (p2[0]-p1[0])*sx, p2[1] - (p2[1]-p1[1])*sy, l2, fontsize=7.5, ha="center", va="bottom")

def ctr(b):
    return (b[0] + 15, b[1] - 8) if isinstance(b, tuple) else b

link((60, 53.5), (75, 74 - 30.5), "M", "1", 0.4, 0.15)      # ORDERS top-left -> ITS above? no
plt.close(fig)

# rebuild ERD cleanly with straight center-to-center links
fig, ax = plt.subplots(figsize=(12.8, 7.4))
ax.set_xlim(0, 130); ax.set_ylim(0, 80); ax.axis("off")

def ent_box2(ax, x, ytop, w, title, rows):
    h = 4.4 + 2.2 * len(rows)
    ax.add_patch(Rectangle((x, ytop - h), w, h, fc="white", ec=INK, lw=1.1))
    ax.add_patch(Rectangle((x, ytop - 4.4), w, 4.4, fc="#ececec", ec=INK, lw=1.1))
    ax.text(x + w/2, ytop - 2.2, title, fontsize=9, ha="center", va="center", weight="bold")
    for i, r in enumerate(rows):
        ax.text(x + 1.4, ytop - 5.6 - 2.2*i, r, fontsize=7.2, ha="left", va="center")
    return (x + w/2, ytop - h/2)

c_users  = ent_box2(ax, 2,   76, 28, "USERS",       ["user_id (PK)", "full_name, student_no", "email, password_hash", "role, status, section"])
c_orders = ent_box2(ax, 44,  60, 30, "ORDERS",      ["order_id (PK)", "user_id (FK)", "vendor_id (FK)", "status, placed_at", "pickup_point, total_amount"])
c_vend   = ent_box2(ax, 90,  76, 28, "VENDORS",     ["vendor_id (PK)", "stall_name, owner", "contact_number", "category, stall_no", "status"])
c_mi     = ent_box2(ax, 90,  44, 28, "MENU_ITEMS",  ["item_id (PK)", "vendor_id (FK)", "name, price", "category, availability", "photo_url"])
c_oi     = ent_box2(ax, 44,  25, 30, "ORDER_ITEMS", ["orderline_id (PK)", "order_id (FK)", "item_id (FK)", "quantity, unit_price", "line_total"])
c_pay    = ent_box2(ax, 2,   40, 28, "PAYMENTS",    ["payment_id (PK)", "order_id (FK)", "method, reference_no", "amount, status", "paid_at"])
c_feed   = ent_box2(ax, 44,   7, 30, "FEEDBACK",   ["feedback_id (PK)", "order_id (FK)", "rating (1-5)", "comment, created_at"])

def link(c1, c2, l1, l2, fx=0.22, fy=0.62):
    ax.add_patch(FancyArrowPatch(c1, c2, arrowstyle="-", lw=1.0, color=INK))
    x1, y1 = c1[0] + fx*(c2[0]-c1[0]), c1[1] + fy*(c2[1]-c1[1])
    x2, y2 = c2[0] - fx*(c2[0]-c1[0]), c2[1] - fy*(c2[1]-c1[1])
    ax.text(x1 - 2.6, y1 + 1.0, l1, fontsize=8, ha="center", va="bottom", weight="bold")
    ax.text(x2 + 2.6, y2 - 1.0, l2, fontsize=8, ha="center", va="bottom", weight="bold")

link(c_users, c_orders, "1", "M")
link(c_orders, c_vend, "M", "1")
link(c_vend, c_mi, "1", "M")
link(c_mi, c_oi, "1", "M")
link(c_orders, c_oi, "1", "M")
link(c_pay, c_oi, "1", "1")
link(c_orders, c_feed, "1", "1")
ax.set_title("Figure 3. Entity Relationship Diagram - FoodEagle", fontsize=12, weight="bold", pad=12)
save(fig, "erd.png")

# ---------------- Structure chart ----------------
fig, ax = plt.subplots(figsize=(12.4, 7.2))
ax.set_xlim(0, 130); ax.set_ylim(0, 78); ax.axis("off")

def mod(ax, cx, cy, w, h, title, fs=7.6):
    ax.add_patch(FancyBboxPatch((cx-w/2, cy-h/2), w, h, boxstyle="square,pad=2.5",
                                fc="white", ec=INK, lw=1.1, mutation_aspect=0.045))
    ax.text(cx, cy, title, fontsize=fs, ha="center", va="center", weight="bold")

mod(ax, 65, 66, 46, 7, "FoodEagle System", fs=10)
mod(ax, 24, 46, 32, 7, "Student Mobile App\nModule")
mod(ax, 65, 46, 32, 7, "Vendor Portal\nModule")
mod(ax, 105, 46, 30, 7, "Admin Console\nModule")

leaves = [
    (24, [(6.5, "Log In /\nRegister"), (17.5, "Browse\nVendors /\nMenus"), (29.5, "Cart &\nCheckout"), (41.5, "Track\nOrder"), (54, "Send\nFeedback")]),
    (65, [(75.5, "Manage Stall\nProfile"), (87.5, "Maintain\nMenu"), (99.5, "Order\nQueue"), (112, "Sales\nReport")]),
    (105, [(119, "Approve\nUsers / Vendors"), (128, "View\nPlatform\nReport")]),
    ]
for parent_x, kids in leaves:
    for kx, kname in kids:
        ax.plot([parent_x, kx], [42, 33.4], color=INK, lw=0.9)
        mod(ax, kx, 26.5, 11.0 if "Register" in kname or "Feedback" in kname else 11.6, 10.5, kname, fs=6.6)
ax.plot([65, 24], [62.3, 49.7], color=INK, lw=0.9)
ax.plot([65, 65], [62.3, 49.7], color=INK, lw=0.9)
ax.plot([65, 105], [62.3, 49.7], color=INK, lw=0.9)
ax.set_title("Figure 4. Structure Chart - FoodEagle", fontsize=12, weight="bold", pad=10)
save(fig, "structure_chart.png")

# ---------------- System architecture ----------------
fig, ax = plt.subplots(figsize=(10.6, 6.8))
ax.set_xlim(0, 100); ax.set_ylim(0, 70); ax.axis("off")

def archbox(ax, x, y, w, h, title, sub, fc="white"):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1.0", fc=fc, ec=INK, lw=1.1))
    ax.text(x+w/2, y+h*0.62, title, fontsize=9, ha="center", va="center", weight="bold")
    ax.text(x+w/2, y+h*0.30, sub, fontsize=7.6, ha="center", va="center", color="#333")

archbox(ax, 6, 55, 36, 12, "Student Mobile App", "Flutter (Android)")
archbox(ax, 58, 55, 36, 12, "Vendor Web Portal", "Any browser, responsive")
archbox(ax, 30, 33, 40, 11, "REST API Backend", "Node.js / Express        ")
archbox(ax, 6, 10, 40, 12, "PostgreSQL Database", "Hosted on Supabase")
archbox(ax, 62, 10, 32, 12, "Push Notification", "Service (FCM)")

arrow(ax, (24, 54.6), (38, 44.6), "HTTPS /\nREST + JSON", off=(-9, 1.5), fs=7)
arrow(ax, (76, 54.6), (62, 44.6), "HTTPS /\nREST + JSON", off=(10, 1.5), fs=7)
arrow(ax, (34, 32.6), (28, 22.6), "SQL queries", off=(-6.5, 0.5), fs=7)
arrow(ax, (50, 32.6), (70, 22.4), "push messages", off=(9, 0.5), fs=7)
ax.set_title("Figure 5. System Architecture - FoodEagle", fontsize=12, weight="bold", pad=10)
save(fig, "architecture.png")

# ---------------- Gantt ----------------
tasks = [
    ("1. Topic approval & planning", 1, 2, False),
    ("2. Survey, interviews, observation", 2, 3, False),
    ("3. Requirements specification", 4, 4, False),
    ("4. Modeling: DFD, ERD, charts", 5, 5, False),
    ("5. UI design & paper prototype", 5, 6, True),
    ("6. Backend setup & authentication", 6, 7, True),
    ("7. Ordering & payment module", 7, 9, True),
    ("8. Tracking & vendor portal", 8, 10, True),
    ("9. Testing & debugging session", 10, 11, False),
    ("10. Survey round 2 (validation)", 11, 11, False),
    ("11. Deployment & documentation", 11, 12, False),
    ("12. Final presentation rehearsal", 12, 12, False),
]
fig, ax = plt.subplots(figsize=(11.6, 5.4))
for i, (name, w1, w2, dev) in enumerate(tasks[::-1]):
    ax.barh(i, w2-w1+1, left=w1-0.6, height=0.55, color="#b23b3b" if dev else "#5b7fbd", edgecolor="#222", lw=0.6)
ax.set_yticks(range(len(tasks)))
ax.set_yticklabels([t[0] for t in tasks[::-1]], fontsize=8.2)
ax.set_xticks(range(0, 13))
ax.set_xticklabels(["start"] + [f"W{k}" for k in range(1, 13)], fontsize=8)
ax.set_xlim(0.4, 12.7)
for wk in range(1, 13):
    ax.axvline(wk + 0.4, color="#dddddd", lw=0.7)
ax.set_xlabel("Week number", fontsize=9)
ax.grid(axis="x", alpha=0.25)
ax.set_title("Figure 6. Project Gantt Chart (12 weeks) - FoodEagle", fontsize=12, weight="bold", pad=10)
import matplotlib.patches as mp
handles = [mp.Patch(facecolor="#b23b3b", edgecolor="#222", label="Development work"),
           mp.Patch(facecolor="#5b7fbd", edgecolor="#222", label="Planning / paperwork")]
ax.legend(handles=handles, loc="upper right", fontsize=8, frameon=False)
save(fig, "gantt.png")

print("ALL FIGURES DONE")
