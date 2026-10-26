import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyArrowPatch

INK = "#1a1a1a"
fig, ax = plt.subplots(figsize=(15.5, 9.4))
ax.set_xlim(0, 140); ax.set_ylim(0, 92); ax.axis("off"); ax.set_aspect("equal")

# ---- primitive helpers ----
def entity(x, y, w, h, name, fs=8.2):
    ax.add_patch(Rectangle((x, y), w, h, fc="white", ec=INK, lw=1.2))
    ax.text(x+w/2, y+h/2, name, fontsize=fs, ha="center", va="center", weight="bold")

def process(cx, cy, r, num, title, fs=7.8):
    ax.add_patch(Circle((cx, cy), r, fc="white", ec=INK, lw=1.2))
    ax.text(cx, cy + r*0.32, num, fontsize=fs+0.7, ha="center", va="center", weight="bold")
    ax.text(cx, cy - r*0.24, title, fontsize=fs, ha="center", va="center", weight="bold")

def store(x, y, w, num, name, fs=7.5):
    h = 3.6; xs = x + 4
    for xx in (x, xs, x+w):
        ax.plot([xx, xx], [y, y+h], color=INK, lw=1.2)
    ax.plot([x, x+w], [y+h, y+h], color=INK, lw=1.2)
    ax.text(x+2, y+h/2, num, fontsize=fs, ha="center", va="center", weight="bold")
    ax.text(xs+(w-4)/2, y+h/2, name, fontsize=fs, ha="center", va="center")

def poly(pts, label=None, seg=None, lpos=0.5, rot=0, fs=7.3):
    """Orthogonal polyline; arrowhead on the final segment; label on chosen segment."""
    n = len(pts)
    for i in range(n-1):
        style = "-|>" if i == n-2 else "-"
        ax.add_patch(FancyArrowPatch(pts[i], pts[i+1], arrowstyle=style,
                                     mutation_scale=11, lw=1.0, color=INK))
    if label:
        p1, p2 = (pts[seg], pts[seg+1]) if seg is not None else (pts[0], pts[1])
        mx = p1[0] + lpos*(p2[0]-p1[0]); my = p1[1] + lpos*(p2[1]-p1[1])
        ax.text(mx, my, label, fontsize=fs, ha="center", va="center", rotation=rot,
                color=INK, bbox=dict(boxstyle="round,pad=0.13", fc="white", ec="none"))

def diag(p1, p2, label=None, lpos=0.5, dy=0.0, fs=7.3):
    a = FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=11, lw=1.0, color=INK)
    ax.add_patch(a)
    if label:
        mx = p1[0] + lpos*(p2[0]-p1[0]); my = p1[1] + lpos*(p2[1]-p1[1]) + dy
        ax.text(mx, my, label, fontsize=fs, ha="center", va="center", color=INK,
                bbox=dict(boxstyle="round,pad=0.13", fc="white", ec="none"))

# ---- external entities ----
entity(2, 38, 13, 14, "Student /\nStaff\nCustomer", fs=7.6)
entity(125, 76, 13, 9, "Vendor")
entity(125, 42, 13, 9, "Campus\nRunner", fs=7.8)
entity(125, 6, 13, 9, "System\nAdmin", fs=7.8)

# ---- processes ----
process(34, 74, 5.5, "1.0", "Manage\nAccounts")
process(66, 78, 5.5, "2.0", "Maintain\nMenus")
process(58, 48, 5.5, "3.0", "Process\nOrders")
process(90, 48, 5.5, "4.0", "Track\nOrders")
process(30, 20, 5.5, "5.0", "Record\nPayments")
process(86, 14, 5.5, "6.0", "Generate\nReports")

# ---- data stores ----
store(50, 63, 14, "D1", "Users")
store(88, 84.5, 14, "D2", "Menus")
store(74, 31, 14, "D3", "Orders")
store(42, 12, 14, "D4", "Payments")

# ---- flows ----
# Student <-> P1
poly([(10, 52), (10, 70.5), (28.4, 70.9)], label="registration /\nlogin details", seg=1, lpos=0.52)
poly([(31, 68.5), (13, 68.5), (13, 52)], label="account status", seg=0, lpos=0.45)
# Admin -> P1 (bottom bus, up the left channel)
poly([(125, 10.5), (119, 10.5), (119, 4), (18, 4), (18, 74), (28.4, 74.2)],
     label="verification decision", seg=2, lpos=0.42, fs=7.5)
# P1 -> D1
diag((39.3, 72.8), (50.2, 65.8), label="user records", lpos=0.5, dy=1.6)
# Vendor <-> P2
diag((125, 80.8), (71.4, 81.2), label="menu data", lpos=0.52, dy=-2.4)
diag((71.4, 75.9), (125, 77.5), label="updated\navailability", lpos=0.52, dy=-2.6)
# P2 -> D2
poly([(66, 83.6), (66, 86.3), (87.8, 86.3)], label="menu records", seg=1, lpos=0.36)
# D2 -> P3
diag((94, 84.4), (54.6, 52.2), label="available items", lpos=0.56, dy=-2.2)
# Student <-> P3
diag((15, 45.8), (52.6, 47.5), label="order request", lpos=0.5, dy=1.9)
diag((52.8, 44.4), (15, 43.0), label="order confirmation", lpos=0.5, dy=-1.9)
# P3 -> D3 -> P4
diag((60.4, 43.6), (76.2, 34.8), label="order records", lpos=0.5, dy=-2.0)
diag((84, 34.6), (88.6, 43.1), label="open orders", lpos=0.5, dy=2.0)
# P4 <-> Runner
diag((95.4, 49.0), (125, 48.8), label="delivery task", lpos=0.5, dy=1.7)
diag((125, 44.6), (95.5, 45.4), label="delivery status", lpos=0.5, dy=1.8)
# P4 -> Student (elbow under P3, over D3)
poly([(86.1, 44.1), (86.1, 36.4), (18, 36.4), (18, 40.5), (15, 40.5)],
     label="status updates", seg=1, lpos=0.42)
# P3 -> P5, Student <-> P5 <-> D4
diag((54.2, 44.2), (26.3, 24.0), label="charge request", lpos=0.16, dy=2.0)
diag((15, 39.2), (25.7, 24.4), label="payment details", lpos=0.30, dy=2.4)
poly([(24.5, 20.0), (6, 20.0), (6, 38)], label="official receipt", seg=1, lpos=0.5, rot=90)
diag((33.5, 17.2), (42, 13.9), label="payment records", lpos=0.42, dy=-2.4)
diag((56, 13.8), (80.4, 14.0), label="payment data", lpos=0.5, dy=-1.9)
# D3 / P5 -> P6
poly([(86, 30.9), (86, 19.6)], label="order data", seg=0, lpos=0.5, rot=90)
# P6 -> Vendor / Admin
diag((89.9, 17.9), (123.6, 78.9), label="sales report", lpos=0.52, dy=-2.6)
diag((91.5, 12.6), (125, 10.2), label="usage report, pending list", lpos=0.44, dy=-2.2)

ax.set_title("Figure 2. Data Flow Diagram, Level 1 - FoodEagle", fontsize=12, weight="bold", pad=12)
fig.savefig("figures/dfd_level1.png", dpi=200, bbox_inches="tight", facecolor="white")
print("saved dfd_level1.png")
