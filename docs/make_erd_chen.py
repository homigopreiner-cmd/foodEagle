import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Ellipse, FancyArrowPatch, Polygon
import os

INK = "#1a1a1a"
os.makedirs("figures", exist_ok=True)

fig, ax = plt.subplots(figsize=(16.0, 11.0))
ax.set_xlim(0, 160); ax.set_ylim(0, 110); ax.axis("off"); ax.set_aspect("equal")

def ent(x, y, w, h, name, weak=False, fs=11):
    ax.add_patch(Rectangle((x, y), w, h, fc="white", ec=INK, lw=1.6))
    if weak:
        ax.add_patch(Rectangle((x+1.1, y+1.1), w-2.2, h-2.2, fc="none", ec=INK, lw=1.2))
    ax.text(x+w/2, y+h/2, name, fontsize=fs, ha="center", va="center", weight="bold")

def attr(cx, cy, text, key=False, dashed=False, fs=9.2, rx=None):
    w = rx if rx else max(9.0, 1.15*len(text)+3.6)
    h = 5.6
    if dashed:
        e = Ellipse((cx, cy), w, h, fc="white", ec=INK, lw=1.0, linestyle=(0, (4, 2)))
    else:
        e = Ellipse((cx, cy), w, h, fc="white", ec=INK, lw=1.0)
    ax.add_patch(e)
    t = ax.text(cx, cy, text, fontsize=fs, ha="center", va="center")
    if key:
        t.set_weight("bold")
        tw = len(text)*fs*0.0115
        ax.plot([cx-tw/2, cx+tw/2], [cy-h*0.34, cy-h*0.34], color=INK, lw=1.2, solid_capstyle="round")
    return (cx, cy)

def line(p1, p2, lw=1.0):
    ax.add_patch(FancyArrowPatch(p1, p2, arrowstyle="-", lw=lw, color=INK))

def card(x, y, text, fs=11.5):
    ax.text(x, y, text, fontsize=fs, ha="center", va="center", weight="bold",
            color=INK, bbox=dict(boxstyle="round,pad=0.16", fc="white", ec="none"))

def diamond(cx, cy, w, h, name, weak=False, fs=9.6):
    pts = [(cx, cy+h/2), (cx+w/2, cy), (cx, cy-h/2), (cx-w/2, cy)]
    ax.add_patch(Polygon(pts, closed=True, fc="white", ec=INK, lw=1.3))
    if weak:
        iw, ih = w*0.78, h*0.60
        pts2 = [(cx, cy+ih/2), (cx+iw/2, cy), (cx, cy-ih/2), (cx-iw/2, cy)]
        ax.add_patch(Polygon(pts2, closed=True, fc="none", ec=INK, lw=1.1))
    ax.text(cx, cy, name, fontsize=fs, ha="center", va="center", weight="bold")

# =================== entities ===================
ent(8, 50, 21, 11, "USER")                       # left-middle
ent(34, 84, 21, 10, "RUNNER")                    # top
ent(74, 38, 21, 11, "ORDER")                     # center
ent(122, 62, 22, 11, "VENDOR")                   # right-top
ent(128, 14, 22, 11, "MENU_ITEM")                # right-bottom
ent(72, 4, 24, 9, "ORDER_LINE", weak=True)       # bottom center
ent(8, 6, 22, 11, "PAYMENT")                     # bottom left

# =================== relationships ===================
# USER Places ORDER
diamond(40, 44, 21, 11, "Places"); 
line((18, 50), (30, 47)); card(24.5, 44.5, "1")
line((50.5, 42.5), (74, 44)); card(62, 40, "M")
# RUNNER Delivers ORDER
diamond(48, 70, 22, 11, "Delivers")
line((46, 84), (48, 75.5)); card(51, 80.5, "1")
line((58, 66.5), (74, 49)); card(66, 57.5, "M")
# VENDOR Receives ORDER
diamond(100, 54, 22, 11, "Receives")
line((122, 62), (110, 58.5)); card(117, 62.5, "1")
line((94, 49), (84, 46.5)); card(89, 45.5, "M")
# VENDOR Offers MENU_ITEM
diamond(128, 40, 20, 10.5, "Offers")
line((133, 62), (130, 45.5)); card(137, 55, "1")
line((127, 34.8), (128, 25)); card(129.5, 31, "M")
# ORDER Contains ORDER_LINE (identifying -> double diamond)
diamond(73, 22, 21, 11, "Contains", weak=True)
line((79, 38), (75, 27.5)); card(82, 34, "1")
line((73, 16.5), (74, 13)); card(72, 14.6, "M")
# ORDER_LINE Refers_to MENU_ITEM
diamond(103, 12, 21, 11, "Refers_to")
line((96, 9), (103, 10.5)); card(99.5, 12.5, "M")
line((113.5, 13.5), (128, 17)); card(122, 13.0, "1")
# ORDER Paid_by PAYMENT
diamond(38, 22, 21, 11, "Paid_by")
line((74, 38), (48.5, 26)); card(60, 29, "1")
line((29, 16), (19, 12.5)); card(24, 12.2, "1")

# =================== attributes ===================
# USER
attr(4, 78, "User_ID", key=True); line((11, 74), (13, 61))
attr(2, 66, "Full_Name"); line((7, 63), (8, 58))
attr(0, 57, "Email"); line((5, 55.5), (8, 52.5))
attr(22, 66, "Student_No"); line((19, 61), (18, 58))
attr(27, 59, "Password"); line((24, 56), (23, 56.5))
attr(22, 44, "Role"); line((20, 49.6), (19.5, 50.4))

# RUNNER
attr(30, 97, "Motor_No"); line((38, 91.5), (40, 94))
attr(52, 97, "Plate_No"); line((45, 91.5), (43, 94))

# ORDER
attr(62, 60, "Order_ID", key=True); line((70, 49), (71, 47))
attr(80, 58, "Status"); line((80, 49), (80, 53.2))
attr(92, 56, "Pickup_Point"); line((88, 48.4), (89, 53))
attr(88, 66, "Total_Amount"); line((85, 49), (87, 60.5))

# derived example: Estimated_Arrival on ORDER (dashed - computed from status + time)
attr(100, 68, "Est_Arrival_Time", dashed=True, rx=15.0); line((94, 48.6), (97, 63.5))

# VENDOR
attr(104, 82, "Vendor_ID", key=True); line((114, 73), (120, 69))
attr(120, 90, "Stall_Name"); line((125, 73), (128, 78))
attr(138, 90, "Category"); line((137, 73), (138, 79))
attr(152, 76, "Open_Hours"); line((144, 66), (147, 70))
attr(122, 74, "Stall_No"); line((126, 65), (126, 68.5))

# MENU_ITEM
attr(148, 34, "Item_ID", key=True); line((143, 26), (146, 29))
attr(152, 22, "Price"); line((144, 21), (148, 22.5))
attr(146, 8, "Item_Name"); line((140, 15.5), (143, 12.5))
attr(132, 3.5, "Available"); line((134, 13.9), (133, 9.5))

# ORDER_LINE (weak -> partial key, underlined too)
attr(66, 16.9, "Line_No", key=True, rx=8.0); line((72, 14.6), (74, 14.4))
attr(60, 27, "Quantity"); line((65, 12.5), (67, 16.5))
attr(88, 21, "Unit_Price"); line((85, 12.5), (84, 16.5))

# PAYMENT
attr(2, 22, "Payment_ID", key=True); line((8, 17), (12, 13.5))
attr(16, 22, "Method"); line((16, 17), (17, 14.5))
attr(0, 1.5, "Amount"); line((9, 5.9), (12, 7.5))
attr(18, 1.5, "Ref_No"); line((20, 5.9), (21, 7.5))

fig.savefig("figures/erd.png", dpi=200, bbox_inches="tight", facecolor="white")
print("saved Chen ERD v2")
