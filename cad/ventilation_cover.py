"""
ventilation_cover.py
Skořepina pro odvětrávání exponátu – trapézový hranol,
otevřené dno, všechny stěny perforované honeycomem.

Souřadný systém:
  X  … délka (0 → LENGTH)
  Y  … šířka / hloubka (extruzní osa, 0 → WIDTH)
  Z  … výška
"""
from build123d import *
import math

# ── Parametry ────────────────────────────────────────────────────
LENGTH   = 310    # délka          [mm]
WIDTH    = 120    # šířka          [mm]
H_BACK   =  50    # výška malý konec  [mm]
H_FRONT  = 140    # výška velký konec [mm]
WALL_T   =   2.5  # tloušťka stěny    [mm]
FILLET_R =   8.0  # zaoblení rohových hran [mm]

HEX_R    =  20.0  # opisný poloměr díry   [mm]
HEX_GAP  =   6.0  # stěna mezi dírami     [mm]
FRAME_W  =   8.0  # pevný lem u hran plochy (hexagony se ořezávají) [mm]

RIB_T    =   3.0  # tloušťka příčky     [mm]
RIB_X    = LENGTH / 2  # poloha příčky podél délky [mm]

OUT_FILE = "ventilation_cover.stl"

# ── Generátor mřížky (pointy-top šestiúhelníky) ──────────────────
def hex_grid(u0, u1, v0, v1, r, gap):
    """
    Kandidátní středy přes plochu; filtrování provede make_cutter.
    Začíná o jeden krok před u0/v0, aby bylo zaručeno pokrytí okrajů.
    """
    du = math.sqrt(3) * r + gap
    dv = 1.5 * r + gap * math.sqrt(3) / 2
    pts, row = [], 0
    v = v0 - dv
    while v <= v1 + dv:
        u = u0 - du + (row % 2) * (du / 2)
        while u <= u1 + du:
            pts.append((u, v))
            u += du
        v  += dv
        row += 1
    return pts

# ── 2D polygon helpers ────────────────────────────────────────────
def _poly_area(poly):
    """Signed area (kladná = CCW)."""
    a = 0
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        a += x1 * y2 - x2 * y1
    return a / 2

def erode_convex_polygon(poly, d):
    """
    Smrštit konvexní polygon dovnitř o vzdálenost d.
    Funguje pro obdélníky i lichoběžníky.
    Vrátí [] pokud je polygon příliš malý.
    """
    if _poly_area(poly) < 0:
        poly = list(reversed(poly))      # zajistit CCW
    n = len(poly)
    lines = []
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy)
        if L < 1e-10:
            continue
        nx, ny = -dy / L, dx / L        # vnitřní normála (CCW)
        c = nx * (x1 + nx * d) + ny * (y1 + ny * d)
        lines.append((nx, ny, c))
    if len(lines) < 3:
        return []
    result = []
    m = len(lines)
    for i in range(m):
        nx1, ny1, c1 = lines[i]
        nx2, ny2, c2 = lines[(i + 1) % m]
        det = nx1 * ny2 - nx2 * ny1
        if abs(det) < 1e-10:
            continue
        x = (c1 * ny2 - c2 * ny1) / det
        y = (nx1 * c2 - nx2 * c1) / det
        result.append((x, y))
    return result if len(result) >= 3 else []

def point_in_poly(px, py, poly):
    """Ray casting."""
    inside, j = False, len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside

# ── Výřez honeycomu pro jednu stěnu ──────────────────────────────
def make_cutter(face_ref):
    """
    Vrátí Part pro boolean odečtení honeycomb otvorů skrz stěnu.
    Hexagony pokrývají celou plochu – ty na okraji se OREŽOUJÍ maskou
    (intersection s extrudovaným obrysem plochy), ne vynechávají.
    """
    center = face_ref.center()
    normal = face_ref.normal_at(center)
    plane  = Plane(center, z_dir=normal)

    # Vrcholy plochy → 2D lokální souřadnice, seřadit CCW
    raw = [plane.to_local_coords(v.center()) for v in face_ref.vertices()]
    poly_pts = [(p.X, p.Y) for p in raw]
    cx = sum(p[0] for p in poly_pts) / len(poly_pts)
    cy = sum(p[1] for p in poly_pts) / len(poly_pts)
    poly = sorted(poly_pts, key=lambda p: math.atan2(p[1] - cy, p[0] - cx))

    # Mask = plocha smrštěná o FRAME_W (tenký pevný lem u hran)
    mask_poly = erode_convex_polygon(poly, FRAME_W)
    if not mask_poly:
        return None

    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    depth = WALL_T + 2.0

    # Všechny hexagonové hranoly přes CELOU plochu (včetně přesahu)
    candidates = hex_grid(min(xs), max(xs), min(ys), max(ys), HEX_R, HEX_GAP)
    if not candidates:
        return None

    with BuildPart() as hex_bp:
        with BuildSketch(plane):
            with Locations(*candidates):
                RegularPolygon(radius=HEX_R, side_count=6, rotation=30)
        extrude(amount=depth, both=True)

    # Maska: extrudovaný obrys plochy (seřízne hexagony na okraji)
    with BuildPart() as mask_bp:
        with BuildSketch(plane):
            with BuildLine():
                Polyline(mask_poly, close=True)
            make_face()
        extrude(amount=depth, both=True)

    # Vyřínout jen části hexagonů uvnitř masky
    return hex_bp.part & mask_bp.part

# ── 1. Trapézový hranol + zaoblení rohů ──────────────────────────
print("Stavím trapézový hranol…")
with BuildPart() as bp_solid:
    with BuildSketch(Plane.XZ):
        with BuildLine():
            Polyline(
                [(0, 0), (LENGTH, 0), (LENGTH, H_FRONT), (0, H_BACK)],
                close=True
            )
        make_face()
    extrude(amount=WIDTH)

    # Referenční plochy pro umístění honeycomu
    sorted_raw     = bp_solid.faces().sort_by(Axis.Z)
    wall_faces_ref = list(sorted_raw[1:])   # 5 stěn

solid = bp_solid.part
print(f"  Hranol: {solid.volume:.0f} mm³, plochy: {len(solid.faces())}")

# ── 2. Hollowing – otevřené dno ───────────────────────────────────
print("Vytváření dutiny (otevřené dno)…")
bottom_face = solid.faces().sort_by(Axis.Z)[0]
shelled     = offset(solid, amount=-WALL_T, openings=[bottom_face])
print(f"  Skořepina: {shelled.volume:.0f} mm³")

# ── 3. Honeycomb výřezy ────────────────────────────────────────────
print(f"Perforuji {len(wall_faces_ref)} stěn honeycomem…")
result = shelled
for i, face in enumerate(wall_faces_ref):
    cutter = make_cutter(face)
    if cutter is None:
        print(f"  Stěna {i+1}: přeskočena (příliš malá)")
    else:
        n = face.normal_at(face.center())
        print(f"  Stěna {i+1}: normála ({n.X:+.1f},{n.Y:+.1f},{n.Z:+.1f})")
        result = result - cutter

# ── 4. Výztuzovací příčka uprostřed s honeycombem ──────────────
print("Přidávám výztuzovací příčku s honeycombem…")
# Výška lichoběžníku v místě příčky (lineární interpolace)
rib_h = H_BACK + (H_FRONT - H_BACK) * RIB_X / LENGTH
# Box: celá šířka (Y, od -WIDTH do 0 – extrude jde v -Y), výška v daném X (Z), tloušťka RIB_T (X)
rib_box = Pos(RIB_X, -WIDTH / 2, rib_h / 2) * Box(RIB_T, WIDTH, rib_h)

# Perforovat příčku honeycombem – stačí jeden cutter z jedné plochy:
# make_cutter používá both=True (±4.5 mm), rib má jen 3 mm → projde celou příčkou.
# Dva cuttery z obou stran mají navzájem posunutou mřížku (x_dir je zrcadlový),
# což by vytvořilo rozbitý vzor.
rib_faces = rib_box.faces().sort_by(Axis.X)
cutter = make_cutter(rib_faces[-1])   # normála +X; konzistentní x_dir=(0,0,+1)
if cutter is not None:
    rib_box = rib_box - cutter

# Oříznout na tvar vnějšího hranolu a přidat k modelu
rib_part = rib_box & solid
result = result + rib_part
print(f"  Příčka přidána na X={RIB_X:.0f} mm, výška={rib_h:.0f} mm")

# ── 5. Export ────────────────────────────────────────────────────
print(f"Export → {OUT_FILE}")
export_stl(result, OUT_FILE)
print("Hotovo!")
