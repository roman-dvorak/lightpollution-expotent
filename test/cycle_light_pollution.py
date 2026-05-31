#!/usr/bin/env python3
"""Sekvenčně posílá příkazy do Stellaria přes /api/scripts/direct."""

import math
import requests
import time
from datetime import datetime, timedelta

STEL_API = "http://localhost:8090/api"

HOLD_TIME = 3       # doba zobrazení na každé lokaci [s]
FLY_DURATION = 3    # doba přeletu mezi lokacemi [s]
LP_FADE_TIME = 1.5  # doba animace LP [s]
LP_FADE_STEPS = 30  # počet kroků pro animaci LP
TIME_ANIM_STEPS = 50   # počet kroků pro animaci času
TIME_ANIM_DT = 0.05    # čekání mezi kroky animace času [s]

# Různé lokace na Zemi (název, lat, lon)
LOCATIONS = [
    ("Prague",       50.08,   14.42),
    ("Atacama",     -24.63,  -70.40),
    ("Mauna Kea",    19.82, -155.47),
    ("Paranal",     -24.63,  -70.40),
    ("La Palma",     28.76,  -17.89),
    ("Sutherland",  -32.38,   20.81),
    ("Flagstaff",    35.20, -111.65),
]

LP_CLEAN = 0.00001  # čistá obloha

# Hodnoty lightPollutionLuminance: 1e-5 až 1e0
LIGHT_POLLUTION_VALUES = [0.00001, 0.0001, 0.001, 0.01, 0.1, 0.2]


def run_script(code, wait_extra=0):
    """Pošle skript do Stellaria a počká na dokončení."""
    r = requests.post(f"{STEL_API}/scripts/direct", data={"code": code})
    print(f"    -> {r.text.strip()}")
    if wait_extra > 0:
        time.sleep(wait_extra)
    return r


def setup():
    """Počáteční nastavení."""
    print("=== Setup ===")
    run_script(
        'core.setGuiVisible(false);\n'
        'core.setProjectionMode("ProjectionFisheye");\n'
        'StelMovementMgr.zoomTo(180, 0);\n'
        'core.wait(1);',
        wait_extra=2
    )


def build_step_script(name, lat, lon, duration, date_str):
    """Sestaví Stellarium skript pro přelet + animaci času."""
    return (
        # Přelet na lokaci
        f'core.setObserverLocation({lon}, {lat}, 0, {duration}, "{name}", "Earth");\n'
        # Plynulá animace času na půlnoc
        f'var startJD = core.getJDay();\n'
        f'core.setDate("{date_str}", "utc");\n'
        f'var targetJD = core.getJDay();\n'
        f'core.setJDay(startJD);\n'
        f'var steps = {TIME_ANIM_STEPS};\n'
        f'for (var i = 0; i <= steps; i++) {{\n'
        f'    var t = i / steps;\n'
        f'    core.setJDay(startJD + (targetJD - startJD) * t);\n'
        f'    core.wait({TIME_ANIM_DT});\n'
        f'}}\n'
    )


def fade_lp(from_val, to_val, duration=None, steps=None):
    """Plynulá změna LP přes API požadavky z Pythonu."""
    if duration is None:
        duration = LP_FADE_TIME
    if steps is None:
        steps = LP_FADE_STEPS
    dt = duration / steps
    log_from = math.log10(from_val)
    log_to = math.log10(to_val)
    print(f"  Fading LP: {from_val} -> {to_val} ({duration}s)")
    for i in range(steps + 1):
        t = i / steps
        val = 10 ** (log_from + t * (log_to - log_from))
        requests.post(f"{STEL_API}/stelproperty/set",
                      data={"id": "StelSkyDrawer.lightPollutionLuminance",
                            "value": str(val)})
        time.sleep(dt)


def main():
    setup()

    time_anim_total = TIME_ANIM_STEPS * TIME_ANIM_DT
    current_lp = LP_CLEAN

    print("\n=== Cycling light pollution ===")
    for i, lp in enumerate(LIGHT_POLLUTION_VALUES):
        loc_name, lat, lon = LOCATIONS[i % len(LOCATIONS)]
        duration = 0 if i == 0 else FLY_DURATION

        utc_offset_hours = lon / 15.0
        midnight_utc = datetime(2026, 4, 12, 0, 0, 0) - timedelta(hours=utc_offset_hours)
        date_str = midnight_utc.strftime("%Y-%m-%dT%H:%M:%S")

        # Fade LP na čistou oblohu
        if current_lp != LP_CLEAN:
            fade_lp(current_lp, LP_CLEAN)

        # Přelet + animace času (Stellarium skript)
        print(f"  [{loc_name}] flying, midnight UTC = {date_str}")
        script = build_step_script(loc_name, lat, lon, duration, date_str)
        run_script(script)
        time.sleep(duration + time_anim_total)

        # Fade LP na cílovou hodnotu
        fade_lp(LP_CLEAN, lp)

        current_lp = lp
        print(f"  [{loc_name}] LP={lp} - hold {HOLD_TIME}s")
        time.sleep(HOLD_TIME)
        print()

    print("Done.")


if __name__ == "__main__":
    main()
