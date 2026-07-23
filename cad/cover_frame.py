"""
cover_frame.py
Rámeček ve tvaru U pod spodní hranu ventilation_coveru.

Spodní hrana krytu (stěna tl. WALL_T) se zasune shora do drážky U-profilu.
Profil U:  vnější čelní stěna 1 mm | vnější dlouhá stěna 3 mm |
drážka ~3.5 mm | vnitřní stěna 3 mm, dno 4 mm,
boční stěny U vysoké 10 mm.  Napříč U jsou vodorovné průchody pro ZIP pásky.

Souřadný systém (shodný s ventilation_cover.py):
  X … délka (0 → LENGTH)
  Y … šířka (0 → WIDTH)
  Z … výška;  horní hrana rámečku v Z = 0, rámeček je celý pod ní (Z < 0)
"""
from build123d import *

# ── Parametry krytu (musí odpovídat ventilation_cover.py) ─────────
LENGTH   = 310    # délka půdorysu krytu [mm]
WIDTH    = 120    # šířka půdorysu krytu [mm]
WALL_T   =   2.5  # tloušťka stěny krytu (to, co se zasouvá) [mm]
RIB_T    =   3.0  # tloušťka středové příčky krytu [mm]
RIB_X    = LENGTH / 2  # poloha příčky podél délky [mm]

# ── Parametry rámečku ─────────────────────────────────────────────
SLOT_CLEAR = 1.0            # celková vůle v drážce (0.5 mm na stranu) [mm]
SLOT_W     = WALL_T + SLOT_CLEAR   # šířka drážky [mm]  → 3.0
OUTER_END_WALL = 1.0        # tloušťka vnějších čelních stěn U v ose X [mm]
OUTER_LONG_WALL = 3.0       # tloušťka vnějších dlouhých stěn U v ose Y [mm]
INNER_FRAME_WALL = 3.0      # tloušťka vnitřní stěny U [mm]
FLOOR_T    = 4.0            # tloušťka dna [mm]
U_HEIGHT   = 10.0           # výška boční stěny U (hloubka drážky) [mm]
TOTAL_H    = FLOOR_T + U_HEIGHT    # celková výška rámečku [mm] → 14

# ── Parametry průchodů pro ZIP pásky (plochý tunel těsně pod dnem U) ──
ZIP_W   = 8.0             # šířka otvoru podél obvodu (páska je široká) [mm]
ZIP_T   = 2.5            # výška otvoru (páska je plochá) [mm]
N_LONG  = 10              # počet průchodů na každé dlouhé straně
N_SHORT = 3               # počet průchodů na každé krátké straně
N_CROSS = 3               # počet průchodů na středové příčce

# ── Parametry výstupků se závlačkou (na dlouhých stranách) ─────────
LUG_W      = 12.0         # šířka výstupku podél strany (X) [mm]
LUG_H      = 4.0          # výška uší nad horní hranou rámečku [mm]
LUG_HOLE_D = 3.3          # průměr otvoru pro M3 šroub [mm]
LUG_HOLE_FROM_U_BOTTOM = 10.0  # výška středu otvoru nad dnem drážky U profilu [mm]
N_LUG      = 3            # počet výstupků na každé dlouhé straně

OUT_FILE = "cover_frame.stl"

# ── Odvozené rozměry ──────────────────────────────────────────────
inset = WALL_T / 2                 # osa stěny krytu, posun od vnějšku [mm] → 1.25
hs    = SLOT_W / 2                 # poloviční šířka drážky od osy [mm]   → 1.5
ho_x  = hs + OUTER_END_WALL        # vnější přesah na čelech, určuje celkovou délku [mm]
ho_y  = hs + OUTER_LONG_WALL       # vnější přesah dlouhých stran [mm]
hi    = hs + INNER_FRAME_WALL      # přesah U-profilu dovnitř od osy stěny [mm]
rs    = (RIB_T + SLOT_CLEAR) / 2   # poloviční šířka drážky pro příčku [mm] → 2.0
cw    = rs + INNER_FRAME_WALL      # poloviční šířka příčného dílu [mm]
u_bottom_z = -U_HEIGHT
lug_z0 = 0
lug_z1 = LUG_H
LUG_HOLE_Z = u_bottom_z + LUG_HOLE_FROM_U_BOTTOM
total_x = LENGTH - 2 * inset + 2 * ho_x
lug_x_positions = [45.0, RIB_X + 10.0, LENGTH * (2.5) / N_LUG]

# osová obdélníková dráha (osa stěny krytu)
mlx0, mlx1 = inset, LENGTH - inset
mly0, mly1 = inset, WIDTH  - inset


def block(x0, x1, y0, y1, z0, z1):
    """Kvádr daný rozsahy souřadnic."""
    return Pos((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2) * \
        Box(x1 - x0, y1 - y0, z1 - z0)


def ytube(xc, y0, y1, zc, d):
    """Válcový otvor s osou rovnoběžnou s Y, mezi y0..y1, ⌀ d."""
    cyl = Rotation(X=90) * Cylinder(radius=d / 2, height=abs(y1 - y0))
    return Pos(xc, (y0 + y1) / 2, zc) * cyl


# ── 1. Hrubý prstenec + příčný díl (plné, bez drážek) ─────────────
print("Stavím U-rámeček s příčným dílem…")
front = block(mlx0 - ho_x, mlx1 + ho_x, mly0 - ho_y, mly0 + hi, -TOTAL_H, 0)
back = block(mlx0 - ho_x, mlx1 + ho_x, mly1 - hi, mly1 + ho_y, -TOTAL_H, 0)
left = block(mlx0 - ho_x, mlx0 + hi, mly0 - ho_y, mly1 + ho_y, -TOTAL_H, 0)
right = block(mlx1 - hi, mlx1 + ho_x, mly0 - ho_y, mly1 + ho_y, -TOTAL_H, 0)
frame = front + back + left + right
# příčný díl přes celou šířku v X=RIB_X (sjednotí se s prstencem)
cross = block(RIB_X - cw, RIB_X + cw, mly0 - ho_y, mly1 + ho_y, -TOTAL_H, 0)
frame = frame + cross

# ── 2. Drážky shora, hluboké U_HEIGHT ─────────────────────────────
# obvodová drážka (mezikruží) pro stěnu krytu
slot_o = block(mlx0 - hs, mlx1 + hs, mly0 - hs, mly1 + hs, -U_HEIGHT, 0)
slot_i = block(mlx0 + hs, mlx1 - hs, mly0 + hs, mly1 - hs, -U_HEIGHT, 0)
frame  = frame - (slot_o - slot_i)
# příčná drážka pro středovou příčku krytu – jen po vnější okraj
# obvodové drážky, aby zůstala vnější stěna U (a obvod) nepřerušená
rib_slot = block(RIB_X - rs, RIB_X + rs, mly0 - hs, mly1 + hs, -U_HEIGHT, 0)
frame    = frame - rib_slot
print(f"  Profil U: vnější čela {OUTER_END_WALL} | vnější dlouhé {OUTER_LONG_WALL} | "
      f"drážka {SLOT_W} | vnitřní {INNER_FRAME_WALL} mm, "
      f"výška {TOTAL_H} mm")
print(f"  Celková délka včetně U-profilu: {total_x:.1f} mm")
print(f"  Příčná drážka {RIB_T + SLOT_CLEAR} mm na X={RIB_X:.0f} mm")

# ── 3. Průchody pro ZIP pásky (vodorovně napříč U) ────────────────
print(f"Vrtám ploché tunely pro ZIP pásky ({ZIP_W}×{ZIP_T} mm, těsně pod dnem U)…")
m = 1.0   # přesah, aby otvor čistě prošel materiálem
z1 = -U_HEIGHT             # strop = dno U-profilu (Z = -10), bez plného stropu
z0 = z1 - ZIP_T            # plochý tunel těsně pod dnem U
passages = []

# dlouhé strany (běží podél X): otvor prochází v ose Y
for i in range(N_LONG):
    x = LENGTH * (i + 0.5) / N_LONG
    passages.append(block(x - ZIP_W/2, x + ZIP_W/2,
                          mly0 - ho_y - m, mly0 + hi + m, z0, z1))  # přední (Y malé)
    passages.append(block(x - ZIP_W/2, x + ZIP_W/2,
                          mly1 - hi - m, mly1 + ho_y + m, z0, z1))  # zadní (Y velké)

# krátké strany (běží podél Y): otvor prochází v ose X
for j in range(N_SHORT):
    y = WIDTH * (j + 0.5) / N_SHORT
    passages.append(block(mlx0 - ho_x - m, mlx0 + hi + m,
                          y - ZIP_W/2, y + ZIP_W/2, z0, z1))      # levá (X malé)
    passages.append(block(mlx1 - hi - m, mlx1 + ho_x + m,
                          y - ZIP_W/2, y + ZIP_W/2, z0, z1))      # pravá (X velké)

# středová příčka (běží podél Y): otvor prochází v ose X
yi0, yi1 = mly0 + hi, mly1 - hi       # vnitřní otvor v Y
for k in range(N_CROSS):
    y = yi0 + (yi1 - yi0) * (k + 0.5) / N_CROSS
    passages.append(block(RIB_X - cw - m, RIB_X + cw + m,
                          y - ZIP_W/2, y + ZIP_W/2, z0, z1))

for p in passages:
    frame = frame - p
print(f"  Průchodů celkem: {len(passages)}")

# ── 3b. Výstupky se závlačkou na dlouhých stranách ────────────────
print(f"Přidávám výstupky se závlačkou ({N_LUG}× na stranu)…")
lugs, holes = [], []
for x in lug_x_positions:
    # přední strana (Y malé) – dvě stojiny ucha, štěrbina U profilu zůstává otevřená
    lugs.append(block(x - LUG_W/2, x + LUG_W/2,
                      mly0 - ho_y, mly0 - hs, lug_z0, lug_z1))
    lugs.append(block(x - LUG_W/2, x + LUG_W/2,
                      mly0 + hs, mly0 + hi, lug_z0, lug_z1))
    holes.append(ytube(x, mly0 - ho_y - m, mly0 + hi + m,
                       LUG_HOLE_Z, LUG_HOLE_D))
    # zadní strana (Y velké)
    lugs.append(block(x - LUG_W/2, x + LUG_W/2,
                      mly1 - hi, mly1 - hs, lug_z0, lug_z1))
    lugs.append(block(x - LUG_W/2, x + LUG_W/2,
                      mly1 + hs, mly1 + ho_y, lug_z0, lug_z1))
    holes.append(ytube(x, mly1 - hi - m, mly1 + ho_y + m,
                       LUG_HOLE_Z, LUG_HOLE_D))
for L in lugs:
    frame = frame + L
for H in holes:
    frame = frame - H
print(f"  Výstupků: {len(lugs)}, otvor ⌀{LUG_HOLE_D} mm,"
      f" střed {LUG_HOLE_FROM_U_BOTTOM} mm nad dnem U profilu")

# ── 4. Export ─────────────────────────────────────────────────────
print(f"Export → {OUT_FILE}")
export_stl(frame, OUT_FILE)
print("Hotovo!")
