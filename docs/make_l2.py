import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle, FancyArrowPatch

INK = "#1a1a1a"
fig, ax = plt.subplots(figsize=(11.6, 6.6))
ax.set_xlim(0, 130); ax.set_ylim(0, 76); ax.axis("off"); ax.set_aspect("equal")

def entity(x, y, w, h, name, fs=8.2):
    ax.add_patch(Rectangle((x, y), w, h, fc="white", ec=INK, lw=1.2))
    ax.text(x+w/2, y+h/2, name, fontsize=fs, ha="center", va="center", weight="bold")

def proc(cx, cy, r, num, title, fs=7.4):
    ax.add_patch(Circle((cx, cy), r, fc="white", ec=INK, lw=1.2))
    ax.text(cx, cy + r*0.30, num, fontsize=fs+0.6, ha="center", va="center", weight="bold")
    ax.text(cx, cy - r*0.26, title, fontsize=fs, ha="center", va="center", weight="bold")

def store(x, y, w, num, name, fs=7.5):
    h = 3.6; xs = x + 4
    for xx in (x, xs, x+w):
        ax.plot([xx, xx], [y, y+h], color=INK, lw=1.2)
    ax.plot([x, x+w], [y+h, y+h], color=INK, lw=1.2)
    ax.text(x+2, y+h/2, num, fontsize=fs, ha="center", va="center", weight="bold")
    ax.text(xs+(w-4)/2, y+h/2, name, fontsize=fs, ha="center", va="center")

def lab(mx, my, text, fs=7.3, rot=0):
    ax.text(mx, my, text, fontsize=fs, ha="center", va="center", rotation=rot,
            color=INK, bbox=dict(boxstyle="round,pad=0.13", fc="white", ec="none"))

def diag(p1, p2, label=None, lpos=0.5, dy=0.0, rot=0):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-|>", mutation_scale=11, lw=1.0, color=INK))
    if label:
        mx = p1[0] + lpos*(p2[0]-p1[0]); my = p1[1] + lpos*(p2[1]-p1[1]) + dy
        lab(mx, my, label, rot=rot)

# entities
entity(3, 38, 12, 9, "Student /\nStaff", fs=7.8)
entity(116, 64, 12, 8, "Vendor", fs=8.2)

# subprocesses
proc(24, 46, 4.8, "3.1", "Capture order\ndetails")
proc(52, 46, 4.8, "3.2", "Check items &\ncompute total")
proc(80, 46, 4.8, "3.3", "Vendor\nreview")
proc(106, 46, 4.8, "3.4", "Confirm order\n& queue")

# data stores
store(45, 63, 14, "D2", "Menus")
store(96, 24, 14, "D3", "Orders")

# flows
diag((15, 47.0), (19.0, 47.0), None)
diag((28.9, 46), (47.0, 46), "item list &\nrequest info", dy=2.3)
diag((56.9, 46), (75.0, 46), "stock result &\ncomputed total", dy=2.3)
diag((84.9, 46), (101.0, 46), "approved order", dy=2.4)
diag((52, 62.9), (52, 51.0), "current stock\n& prices", lpos=0.45, dy=0.6)
diag((80.5, 50.2), (116.5, 66.4), "order sent\nfor review", lpos=0.30, dy=2.0)
diag((115.5, 63.4), (83.6, 49.6), "decision\n(accept / reject)", lpos=0.55, dy=2.4)
diag((104.5, 41.6), (100.0, 27.7), "order record", lpos=0.42, dy=1.8)
ax.add_patch(FancyArrowPatch((103.0, 41.3), (103.0, 33.0), arrowstyle="-", lw=1.0, color=INK))
ax.add_patch(FancyArrowPatch((103.0, 33.0), (9.0, 33.0), arrowstyle="-", lw=1.0, color=INK))
ax.add_patch(FancyArrowPatch((9.0, 33.0), (9.0, 37.7), arrowstyle="-|>", mutation_scale=11, lw=1.0, color=INK))
lab(56, 35.4, "confirmation, order ID & estimated pickup time")

fig.savefig("figures/dfd_level2.png", dpi=200, bbox_inches="tight", facecolor="white")
print("saved figures/dfd_level2.png")
