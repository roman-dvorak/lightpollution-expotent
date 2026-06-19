"""
cover_frame.py
Rámeček ve tvaru U pod spodní hranu ventilation_coveru.

Spodní hrana krytu (stěna tl. WALL_T) se zasune shora do drážky U-profilu.
Profil U:  vnější stěna 4 mm | drážka ~3 mm | vnitřní stěna 4 mm, dno 4 mm,
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
FRAME_WALL = 4.0            # tloušťka stěny U z obou stran [mm]
FLOOR_T    = 4.0            # tloušťka dna [mm]
U_HEIGHT   = 10.0           # výška boční stěny U (hloubka drážky) [mm]
TOTAL_H    = FLOOR_T + U_HEIGHT    # celková výška rámečku [mm] → 14

# ── Parametry průchodů pro ZIP pásky (plochý tunel těsně pod dnem U) ──
ZIP_W   = 8.0             # šířka otvoru podél obvodu (páska je široká) [mm]
ZIP_T   = 2.5            # výška otvoru (páska je plochá) [mm]
N_LONG  = 10              # počet průchodů na každé dlouhé straně
N_SHORT = 3               # počet průchodů na každé krátké straně
N_CROSS = 3               # počet průchodů na středové příčce

OUT_FILE = "cover_frame.stl"

# ── Odvozené rozměry ──────────────────────────────────────────────
inset = WALL_T / 2                 # osa stěny krytu, posun od vnějšku [mm] → 1.25
hf    = SLOT_W / 2 + FRAME_WALL    # poloviční šířka U-profilu od osy [mm] → 5.5
hs    = SLOT_W / 2                 # poloviční šířka drážky od osy [mm]   → 1.5
rs    = (RIB_T + SLOT_CLEAR) / 2   # poloviční šířka drážky pro příčku [mm] → 2.0
cw    = rs + FRAME_WALL            # poloviční šířka příčného dílu [mm]     → 6.0

# osová obdélníková dráha (osa stěny krytu)
mlx0, mlx1 = inset, LENGTH - inset
mly0, mly1 = inset, WIDTH  - inset


def block(x0, x1, y0, y1, z0, z1):
    """Kvádr daný rozsahy souřadnic."""
    return Pos((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2) * \
        Box(x1 - x0, y1 - y0, z1 - z0)


# ── 1. Hrubý prstenec + příčný díl (plné, bez drážek) ─────────────
print("Stavím U-rámeček s příčným dílem…")
outer = block(mlx0 - hf, mlx1 + hf, mly0 - hf, mly1 + hf, -TOTAL_H, 0)
hole  = block(mlx0 + hf, mlx1 - hf, mly0 + hf, mly1 - hf, -TOTAL_H, 0)
frame = outer - hole
# příčný díl přes celou šířku v X=RIB_X (sjednotí se s prstencem)
cross = block(RIB_X - cw, RIB_X + cw, mly0 - hf, mly1 + hf, -TOTAL_H, 0)
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
print(f"  Profil U: vnější {FRAME_WALL} | drážka {SLOT_W} | vnitřní {FRAME_WALL} mm, "
      f"výška {TOTAL_H} mm")
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
                          mly0 - hf - m, mly0 + hf + m, z0, z1))  # přední (Y malé)
    passages.append(block(x - ZIP_W/2, x + ZIP_W/2,
                          mly1 - hf - m, mly1 + hf + m, z0, z1))  # zadní (Y velké)

# krátké strany (běží podél Y): otvor prochází v ose X
for j in range(N_SHORT):
    y = WIDTH * (j + 0.5) / N_SHORT
    passages.append(block(mlx0 - hf - m, mlx0 + hf + m,
                          y - ZIP_W/2, y + ZIP_W/2, z0, z1))      # levá (X malé)
    passages.append(block(mlx1 - hf - m, mlx1 + hf + m,
                          y - ZIP_W/2, y + ZIP_W/2, z0, z1))      # pravá (X velké)

# středová příčka (běží podél Y): otvor prochází v ose X
yi0, yi1 = mly0 + hf, mly1 - hf       # vnitřní otvor v Y
for k in range(N_CROSS):
    y = yi0 + (yi1 - yi0) * (k + 0.5) / N_CROSS
    passages.append(block(RIB_X - cw - m, RIB_X + cw + m,
                          y - ZIP_W/2, y + ZIP_W/2, z0, z1))

for p in passages:
    frame = frame - p
print(f"  Průchodů celkem: {len(passages)}")

# ── 4. Export ─────────────────────────────────────────────────────
print(f"Export → {OUT_FILE}")
export_stl(frame, OUT_FILE)
print("Hotovo!")
