import React, { useRef, useState, useCallback, useEffect, type ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { fadeLightPollution, lpToBortle } from '../services/skyService'
import { useBortleAudio } from '../hooks/useBortleAudio'

// ─── Types ─────────────────────────────────────────────────────────────────────

type LightType =
  | 'globe' | 'fullCutoff' | 'coldLED' | 'pcAmber' | 'floodlight'
  | 'church' | 'house' | 'badBillboard' | 'betterBillboard' | 'darkBillboard' | 'cars'
  | 'astronomer'

type LampDef = {
  contribution: number   // luminance contribution
  glowColor: string
  glowRadius: number
  upwardRatio: number    // 0 = all down, 1 = fully omnidirectional
  coneAngle: number      // degrees of downward beam
  kelvin: number
  heightM: number        // mounting height in metres (displayed, affects visual scale)
  svgW: number           // canvas render width
  svgH: number           // canvas render height
  glowFx: number         // light-source X as fraction of svgW (0 = left, 0.5 = centre, 1 = right)
  glowFy: number         // light-source Y as fraction of svgH (0 = top, 1 = bottom/ground)
}

const LAMPS: Record<LightType, LampDef> = {
  // glowFx/glowFy: light-source position in the SVG viewBox as fractions of svgW/svgH
  globe:           { contribution: 0.006,     glowColor: '#ffcc44', glowRadius: 160, upwardRatio: 0.9,  coneAngle: 360, kelvin: 2700, heightM: 6,  svgW: 36, svgH: 110, glowFx: 26/36,  glowFy: 20/110  },
  fullCutoff:      { contribution: 0.0003,    glowColor: '#ffffff', glowRadius: 30,  upwardRatio: 0.0,  coneAngle: 80,  kelvin: 4000, heightM: 8,  svgW: 36, svgH: 110, glowFx: 26/36,  glowFy: 25/110  },
  coldLED:         { contribution: 0.002,     glowColor: '#cce8ff', glowRadius: 80,  upwardRatio: 0.25, coneAngle: 100, kelvin: 6000, heightM: 7,  svgW: 36, svgH: 110, glowFx: 26/36,  glowFy: 26/110  },
  pcAmber:         { contribution: 0.0005,    glowColor: '#ffaa22', glowRadius: 40,  upwardRatio: 0.05, coneAngle: 90,  kelvin: 1900, heightM: 7,  svgW: 36, svgH: 110, glowFx: 26/36,  glowFy: 26/110  },
  floodlight:      { contribution: 0.015,     glowColor: '#ffffff', glowRadius: 200, upwardRatio: 0.6,  coneAngle: 45,  kelvin: 5500, heightM: 12, svgW: 40, svgH: 110, glowFx: 0.5,    glowFy: 25/110  },
  church:          { contribution: 0.012,     glowColor: '#aaddff', glowRadius: 180, upwardRatio: 0.92, coneAngle: 25,  kelvin: 5000, heightM: 0,  svgW: 60, svgH: 140, glowFx: 0.5,    glowFy: 134/140 },
  house:           { contribution: 0.0003,    glowColor: '#ffcc66', glowRadius: 60,  upwardRatio: 0.28, coneAngle: 120, kelvin: 2700, heightM: 0,  svgW: 55, svgH: 120, glowFx: 0.5,    glowFy: 88/120  },
  badBillboard:    { contribution: 0.005,     glowColor: '#ffffff', glowRadius: 120, upwardRatio: 0.72, coneAngle: 50,  kelvin: 6500, heightM: 5,  svgW: 46, svgH: 140, glowFx: 0.5,    glowFy: 80/140  },
  betterBillboard: { contribution: 0.0008,    glowColor: '#ffe8a0', glowRadius: 35,  upwardRatio: 0.1,  coneAngle: 50,  kelvin: 4000, heightM: 5,  svgW: 46, svgH: 130, glowFx: 0.5,    glowFy: 12/130  },
  darkBillboard:   { contribution: 0.000001,  glowColor: '#222233', glowRadius: 0,   upwardRatio: 0.0,  coneAngle: 0,   kelvin: 0,    heightM: 5,  svgW: 46, svgH: 120, glowFx: 0.5,    glowFy: 0.5     },
  cars:            { contribution: 0.0015,    glowColor: '#cce8ff', glowRadius: 90,  upwardRatio: 0.08, coneAngle: 12,  kelvin: 6500, heightM: 0,  svgW: 90, svgH: 55,  glowFx: 84/90,  glowFy: 36/55   },
  astronomer:      { contribution: 0.000001,  glowColor: '#ff3300', glowRadius: 18,  upwardRatio: 0.0,  coneAngle: 0,   kelvin: 1600, heightM: 0,  svgW: 80, svgH: 130, glowFx: 59/80,  glowFy: 62/130  },
}

const LAMP_ORDER: LightType[] = [
  'globe', 'fullCutoff', 'coldLED', 'pcAmber', 'floodlight',
  'church', 'house', 'badBillboard', 'betterBillboard', 'darkBillboard', 'cars',
  'astronomer',
]

const MAX_LIGHTS = 25

// ─── Sky colour ─────────────────────────────────────────────────────────────────

function smoothSkyColor(pct: number): string {
  const t = Math.pow(Math.max(0, Math.min(1, pct / 100)), 4.0)
  function lerp(a: number, b: number, u: number) { return Math.round(a + (b - a) * u) }
  let r, g, b
  if (t < 0.35) { const u = t / 0.35;          r = lerp(0, 8, u);   g = lerp(5, 18, u);  b = lerp(32, 60, u) }
  else if (t < 0.65) { const u = (t - 0.35) / 0.30; r = lerp(8, 60, u);  g = lerp(18, 42, u); b = lerp(60, 50, u) }
  else { const u = (t - 0.65) / 0.35;          r = lerp(60, 176, u); g = lerp(42, 88, u); b = lerp(50, 24, u) }
  return `rgb(${r},${g},${b})`
}

// ─── Kelvin → colour ────────────────────────────────────────────────────────────

function kelvinToHex(k: number): string {
  if (k <= 1600) return '#ff3300'
  if (k <= 1900) return '#ffaa22'
  if (k <= 2700) return '#ffcc55'
  if (k <= 3500) return '#ffe08a'
  if (k <= 4500) return '#fff0c8'
  if (k <= 5500) return '#f0f8ff'
  return '#cce8ff'
}

// ─── Lamp SVGs ──────────────────────────────────────────────────────────────────

function GlobeLampSVG({ color }: { color: string }) {
  return (
    <svg width="36" height="110" viewBox="0 0 36 110" fill="none">
      <rect x="16.5" y="50" width="3" height="60" rx="1.5" fill="#4a4a5a"/>
      <path d="M18 50 Q18 28 26 26" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="26" cy="20" r="13" fill={color} fillOpacity="0.25" filter="url(#gblur)"/>
      <circle cx="26" cy="20" r="9" fill={color} fillOpacity="0.85"/>
      <circle cx="26" cy="20" r="9" fill="none" stroke="#888" strokeWidth="0.8"/>
      <circle cx="23" cy="17" r="2.5" fill="white" fillOpacity="0.35"/>
      <defs><filter id="gblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
    </svg>
  )
}

function FullCutoffSVG({ color }: { color: string }) {
  return (
    <svg width="36" height="110" viewBox="0 0 36 110" fill="none">
      <rect x="16.5" y="40" width="3" height="70" rx="1.5" fill="#4a4a5a"/>
      <path d="M18 40 Q18 22 28 22" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="18" y="12" width="16" height="12" rx="2" fill="#555566"/>
      <rect x="19" y="22" width="14" height="3" rx="1" fill={color} fillOpacity="0.9"/>
      <rect x="20" y="23" width="12" height="1.5" rx="0.5" fill="white" fillOpacity="0.4"/>
      <rect x="18" y="12" width="16" height="3" rx="2" fill="#666677"/>
    </svg>
  )
}

function ColdLEDSVG({ color }: { color: string }) {
  return (
    <svg width="36" height="110" viewBox="0 0 36 110" fill="none">
      <rect x="16.5" y="42" width="3" height="68" rx="1.5" fill="#4a4a5a"/>
      <path d="M18 42 Q18 24 28 24" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="19" y="13" width="15" height="13" rx="3" fill="#44445a"/>
      <rect x="20" y="24" width="13" height="3" rx="1" fill={color} fillOpacity="0.95"/>
      <circle cx="22" cy="25.5" r="1" fill="white" fillOpacity="0.6"/>
      <circle cx="25" cy="25.5" r="1" fill="white" fillOpacity="0.6"/>
      <circle cx="28" cy="25.5" r="1" fill="white" fillOpacity="0.6"/>
      <circle cx="31" cy="25.5" r="1" fill="white" fillOpacity="0.6"/>
      <line x1="22" y1="13" x2="22" y2="10" stroke="#555" strokeWidth="1"/>
      <line x1="25" y1="13" x2="25" y2="10" stroke="#555" strokeWidth="1"/>
      <line x1="28" y1="13" x2="28" y2="10" stroke="#555" strokeWidth="1"/>
      <line x1="31" y1="13" x2="31" y2="10" stroke="#555" strokeWidth="1"/>
    </svg>
  )
}

function PcAmberSVG({ color }: { color: string }) {
  return (
    <svg width="36" height="110" viewBox="0 0 36 110" fill="none">
      <rect x="16.5" y="42" width="3" height="68" rx="1.5" fill="#4a4a5a"/>
      <path d="M18 42 Q18 24 28 24" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="19" y="13" width="15" height="13" rx="3" fill="#3d3830"/>
      <rect x="20" y="24" width="13" height="3" rx="1" fill={color} fillOpacity="0.95"/>
      <circle cx="22" cy="25.5" r="1" fill={color} fillOpacity="0.9"/>
      <circle cx="25" cy="25.5" r="1" fill={color} fillOpacity="0.9"/>
      <circle cx="28" cy="25.5" r="1" fill={color} fillOpacity="0.9"/>
      <circle cx="31" cy="25.5" r="1" fill={color} fillOpacity="0.9"/>
      <rect x="19" y="13" width="15" height="2.5" rx="2" fill="#5a4a30"/>
    </svg>
  )
}

function FloodlightSVG({ color }: { color: string }) {
  return (
    <svg width="40" height="110" viewBox="0 0 40 110" fill="none">
      <rect x="18" y="30" width="4" height="80" rx="2" fill="#4a4a5a"/>
      <rect x="10" y="28" width="20" height="4" rx="2" fill="#555566"/>
      <g transform="rotate(-30, 15, 26)">
        <rect x="6" y="16" width="18" height="10" rx="2" fill="#555566"/>
        <rect x="7" y="24" width="16" height="3" rx="1" fill={color} fillOpacity="0.9"/>
        <circle cx="10" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
        <circle cx="14" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
        <circle cx="18" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
        <circle cx="22" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
      </g>
      <g transform="rotate(30, 25, 26)">
        <rect x="16" y="16" width="18" height="10" rx="2" fill="#555566"/>
        <rect x="17" y="24" width="16" height="3" rx="1" fill={color} fillOpacity="0.9"/>
        <circle cx="19" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
        <circle cx="23" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
        <circle cx="27" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
        <circle cx="31" cy="25.5" r="1.2" fill="white" fillOpacity="0.5"/>
      </g>
    </svg>
  )
}

function ChurchSVG() {
  return (
    <svg width="60" height="140" viewBox="0 0 60 140" fill="none">
      {/* Body */}
      <rect x="8" y="80" width="44" height="58" rx="1" fill="#25253a"/>
      {/* Arched windows */}
      <path d="M13,136 L13,112 Q20,104 27,112 L27,136" fill="#ffd700" fillOpacity="0.85"/>
      <path d="M33,136 L33,112 Q40,104 47,112 L47,136" fill="#ffd700" fillOpacity="0.85"/>
      {/* Upper facade */}
      <rect x="14" y="55" width="32" height="25" fill="#22223a"/>
      {/* Roof gable */}
      <polygon points="30,18 10,55 50,55" fill="#2e2e44"/>
      {/* Cross */}
      <rect x="28" y="8"  width="4" height="22" fill="#4a4a6a"/>
      <rect x="21" y="16" width="18" height="4"  fill="#4a4a6a"/>
      {/* Ground spotlights (upward!) */}
      <rect x="4"  y="134" width="10" height="5" rx="1" fill="#555"/>
      <rect x="46" y="134" width="10" height="5" rx="1" fill="#555"/>
      <circle cx="9"  cy="134" r="3.5" fill="#cce8ff" fillOpacity="0.95"/>
      <circle cx="51" cy="134" r="3.5" fill="#cce8ff" fillOpacity="0.95"/>
    </svg>
  )
}

function HouseSVG() {
  return (
    <svg width="55" height="120" viewBox="0 0 55 120" fill="none">
      {/* Body */}
      <rect x="5" y="70" width="45" height="50" rx="1" fill="#25253a"/>
      {/* Roof */}
      <polygon points="3,70 27.5,36 52,70" fill="#303046"/>
      {/* Windows lit */}
      <rect x="9"  y="78" width="14" height="13" rx="1.5" fill="#ffd066" fillOpacity="0.9"/>
      <rect x="32" y="78" width="14" height="13" rx="1.5" fill="#ffd066" fillOpacity="0.9"/>
      <rect x="9"  y="99" width="14" height="10" rx="1.5" fill="#ffd066" fillOpacity="0.75"/>
      <rect x="32" y="99" width="14" height="10" rx="1.5" fill="#ffd066" fillOpacity="0.75"/>
      {/* Door */}
      <rect x="21" y="104" width="13" height="16" rx="1" fill="#2a2a40"/>
      {/* Chimney */}
      <rect x="38" y="44" width="7" height="22" fill="#2e2e44"/>
      {/* Exterior lamp */}
      <circle cx="4" cy="88" r="3" fill="#ffcc55" fillOpacity="0.9"/>
    </svg>
  )
}

function BadBillboardSVG({ color }: { color: string }) {
  return (
    <svg width="46" height="140" viewBox="0 0 46 140" fill="none">
      {/* Pole */}
      <rect x="21" y="82" width="4" height="58" rx="2" fill="#4a4a5a"/>
      {/* Frame */}
      <rect x="2" y="12" width="42" height="70" rx="2" fill="#333344"/>
      {/* Bright face */}
      <rect x="3" y="13" width="40" height="68" rx="1" fill="#fff" fillOpacity="0.88"/>
      {/* Content */}
      <rect x="7" y="20" width="32" height="9" rx="1" fill="#0055cc" fillOpacity="0.8"/>
      <rect x="7" y="34" width="24" height="7" rx="1" fill="#333" fillOpacity="0.45"/>
      <rect x="7" y="45" width="30" height="7" rx="1" fill="#cc2200" fillOpacity="0.7"/>
      <rect x="7" y="57" width="18" height="6" rx="1" fill="#333" fillOpacity="0.35"/>
      {/* Bottom spotlights pointing UP at face */}
      <rect x="5"  y="80" width="10" height="5" rx="1" fill="#555"/>
      <rect x="31" y="80" width="10" height="5" rx="1" fill="#555"/>
      <circle cx="10" cy="80" r="3.5" fill={color} fillOpacity="0.95"/>
      <circle cx="36" cy="80" r="3.5" fill={color} fillOpacity="0.95"/>
    </svg>
  )
}

function BetterBillboardSVG({ color }: { color: string }) {
  return (
    <svg width="46" height="130" viewBox="0 0 46 130" fill="none">
      {/* Pole */}
      <rect x="21" y="82" width="4" height="48" rx="2" fill="#4a4a5a"/>
      {/* Frame */}
      <rect x="2" y="18" width="42" height="64" rx="2" fill="#333344"/>
      {/* Top visor / shield */}
      <rect x="0" y="10" width="46" height="9" rx="2" fill="#3a3a55"/>
      {/* Top spotlights pointing DOWN */}
      <circle cx="10" cy="12" r="3.5" fill={color} fillOpacity="0.9"/>
      <circle cx="36" cy="12" r="3.5" fill={color} fillOpacity="0.9"/>
      {/* Face — less bright */}
      <rect x="3" y="19" width="40" height="62" rx="1" fill="#fff" fillOpacity="0.70"/>
      {/* Content */}
      <rect x="7" y="26" width="30" height="8" rx="1" fill="#0055cc" fillOpacity="0.7"/>
      <rect x="7" y="38" width="22" height="6" rx="1" fill="#333" fillOpacity="0.4"/>
      <rect x="7" y="48" width="28" height="6" rx="1" fill="#cc2200" fillOpacity="0.6"/>
    </svg>
  )
}

function DarkBillboardSVG() {
  return (
    <svg width="46" height="120" viewBox="0 0 46 120" fill="none">
      {/* Pole */}
      <rect x="21" y="72" width="4" height="48" rx="2" fill="#4a4a5a"/>
      {/* Frame — dark */}
      <rect x="2" y="10" width="42" height="62" rx="2" fill="#1e1e2e"/>
      <rect x="3" y="11" width="40" height="60" rx="1" fill="#181828"/>
      {/* Faint content lines */}
      <rect x="7" y="20" width="28" height="6" rx="1" fill="#2a2a3a"/>
      <rect x="7" y="30" width="20" height="5" rx="1" fill="#242434"/>
      <rect x="7" y="38" width="24" height="5" rx="1" fill="#2a2a3a"/>
    </svg>
  )
}

function AstronomerSVG() {
  // Tube: pivot (46,87) → objective (15,48)
  // perp unit ≈ (0.78, −0.63); eyepiece w=4, objective w=6.5
  return (
    <svg width="80" height="130" viewBox="0 0 80 130" fill="none">
      {/* ── Tripod ── */}
      <line x1="46" y1="87" x2="20" y2="128" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="46" y1="87" x2="46" y2="128" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="46" y1="87" x2="68" y2="128" stroke="#4a4a5a" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="30" y1="113" x2="60" y2="113" stroke="#4a4a5a" strokeWidth="1.5" strokeLinecap="round"/>

      {/* ── Mount head + counterweight ── */}
      <circle cx="46" cy="87" r="6" fill="#555566"/>
      <line x1="46" y1="87" x2="54" y2="104" stroke="#555566" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="55" cy="107" r="4.5" fill="#444455"/>

      {/* ── Telescope tube (tapered) ── */}
      <path d="M50,84 L42,90 L9,53 L20,44 Z" fill="#555566"/>
      {/* Dew shield / objective cap */}
      <line x1="8" y1="54" x2="21" y2="43" stroke="#3a3a55" strokeWidth="6" strokeLinecap="round"/>
      <line x1="8" y1="54" x2="21" y2="43" stroke="#444455" strokeWidth="4" strokeLinecap="round"/>
      {/* Lens glass glint */}
      <line x1="10" y1="52" x2="15" y2="47" stroke="#5577aa" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
      {/* Tube band */}
      <line x1="27" y1="71" x2="35" y2="64" stroke="#666677" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Focuser box */}
      <rect x="43" y="84" width="8" height="8" rx="2" fill="#444455"/>
      <rect x="44.5" y="92" width="5" height="5" rx="1.5" fill="#333344"/>

      {/* ── Person ── */}
      <circle cx="65" cy="38" r="7" fill="#3a3a55"/>
      {/* Baseball cap */}
      <path d="M58,37 Q65,26 72,37" fill="#252535"/>
      <rect x="56" y="37" width="18" height="2.5" rx="1" fill="#252535"/>
      {/* Body */}
      <rect x="60" y="45" width="10" height="23" rx="4" fill="#2e2e4a"/>
      {/* Arm to eyepiece */}
      <path d="M62,56 C57,63 52,73 49,87" stroke="#2e2e4a" strokeWidth="5" strokeLinecap="round" fill="none"/>
      {/* Legs */}
      <line x1="62" y1="68" x2="57" y2="100" stroke="#2e2e4a" strokeWidth="5" strokeLinecap="round"/>
      <line x1="68" y1="68" x2="72" y2="100" stroke="#2e2e4a" strokeWidth="5" strokeLinecap="round"/>

      {/* ── Red astronomy lamp ── */}
      <rect x="55" y="57" width="9" height="5" rx="2.5" fill="#550000"/>
      <circle cx="59" cy="59.5" r="3.5" fill="#cc1100" fillOpacity="0.9"/>
      <circle cx="59" cy="59.5" r="1.8" fill="#ff5533"/>
    </svg>
  )
}

function CarsSVG() {
  return (
    <svg width="90" height="55" viewBox="0 0 90 55" fill="none">
      {/* Body */}
      <rect x="4" y="30" width="78" height="18" rx="5" fill="#2a2a4a"/>
      {/* Cabin */}
      <path d="M18,30 L24,10 L64,10 L72,30 Z" fill="#32324e"/>
      {/* Windows */}
      <path d="M26,28 L30,13 L56,13 L62,28 Z" fill="#3a5080" fillOpacity="0.55"/>
      {/* Wheels */}
      <circle cx="20" cy="50" r="8" fill="#1a1a28"/>
      <circle cx="68" cy="50" r="8" fill="#1a1a28"/>
      <circle cx="20" cy="50" r="4" fill="#333"/>
      <circle cx="68" cy="50" r="4" fill="#333"/>
      {/* Headlights */}
      <rect x="80" y="33" width="8" height="6" rx="2" fill="#cce8ff" fillOpacity="0.95"/>
      <circle cx="84" cy="36" r="2.5" fill="white"/>
      {/* Tail lights */}
      <rect x="2"  y="33" width="6" height="6" rx="2" fill="#cc0000" fillOpacity="0.9"/>
    </svg>
  )
}

const LAMP_SVG: Record<LightType, (color: string) => ReactElement> = {
  globe:           (c) => <GlobeLampSVG color={c} />,
  fullCutoff:      (c) => <FullCutoffSVG color={c} />,
  coldLED:         (c) => <ColdLEDSVG color={c} />,
  pcAmber:         (c) => <PcAmberSVG color={c} />,
  floodlight:      (c) => <FloodlightSVG color={c} />,
  church:          (_) => <ChurchSVG />,
  house:           (_) => <HouseSVG />,
  badBillboard:    (c) => <BadBillboardSVG color={c} />,
  betterBillboard: (c) => <BetterBillboardSVG color={c} />,
  darkBillboard:   (_) => <DarkBillboardSVG />,
  cars:            (_) => <CarsSVG />,
  astronomer:      (_) => <AstronomerSVG />,
}

// ─── Glow overlay ───────────────────────────────────────────────────────────────
//
// Coordinate system: the glow anchor div (width:0, height:0) is placed at the
// click point with transform:translate(-50%,-100%), which with zero size gives
// no shift — the anchor is exactly at (lamp.x%, lamp.y%) = bottom of the SVG.
//
// To reach SVG point (fx*svgW, fy*svgH) from the anchor:
//   gx = (fx - 0.5) * svgW   (positive = right of SVG centre)
//   gy = (fy - 1)   * svgH   (negative = above click point)

function LampGlow({ lamp, def, canvasH }: { lamp: PlacedLight; def: LampDef; canvasH: number }) {
  if (def.glowRadius === 0) return null
  const color = kelvinToHex(def.kelvin)
  const gx = (def.glowFx - 0.5) * def.svgW
  const gy = (def.glowFy - 1)   * def.svgH
  const W: React.CSSProperties = { left: `${lamp.x}%`, top: `${lamp.y}%`, transform: 'translate(-50%, -100%)', width: 0, height: 0 }

  // Globe: large omnidirectional sphere centred on the globe head
  if (lamp.type === 'globe') {
    const r = def.glowRadius
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left: gx-r*2.5, top: gy-r*2.5, width: r*5, height: r*5, borderRadius:'50%', background:`radial-gradient(circle, ${color}44 0%, ${color}18 40%, transparent 70%)`, filter:`blur(${r*0.5}px)` }}/>
        <div style={{ position:'absolute', left: gx-r,     top: gy-r,     width: r*2, height: r*2, borderRadius:'50%', background:`radial-gradient(circle, ${color}cc 0%, ${color}55 30%, transparent 70%)`, filter:`blur(${r*0.15}px)` }}/>
        <div style={{ position:'absolute', left: gx-r*1.5, top: gy,       width: r*3, height: r*3, background:`radial-gradient(ellipse at 50% 0%, ${color}55 0%, transparent 70%)`, filter:`blur(${r*0.2}px)` }}/>
      </div>
    )
  }

  // Church: two upward cones from the ground spotlights (SVG cx=9/51, cy=134 in 60×140)
  if (lamp.type === 'church') {
    const cH  = canvasH * 0.75
    const cW  = Math.tan((25/2) * Math.PI/180) * cH * 2
    const skyR = def.glowRadius
    const lx  = (9/60  - 0.5) * 60   // -21  left spotlight
    const rx  = (51/60 - 0.5) * 60   //  21  right spotlight
    const sy  = (134/140 - 1) * 140  //  -6  spotlight y above click
    const skY = (20/140  - 1) * 140  // -121 cross height for sky glow
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left:-skyR, top:skY-skyR*0.5, width:skyR*2, height:skyR, borderRadius:'50%', background:`radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`, filter:`blur(${skyR*0.35}px)` }}/>
        <div style={{ position:'absolute', left:lx-cW/2, top:sy-cH, width:cW, height:cH, background:`linear-gradient(to top, ${color}99 0%, ${color}00 100%)`, clipPath:'polygon(50% 100%, 0% 0%, 100% 0%)', filter:'blur(14px)' }}/>
        <div style={{ position:'absolute', left:rx-cW/2, top:sy-cH, width:cW, height:cH, background:`linear-gradient(to top, ${color}99 0%, ${color}00 100%)`, clipPath:'polygon(50% 100%, 0% 0%, 100% 0%)', filter:'blur(14px)' }}/>
      </div>
    )
  }

  // Cars: forward headlight beam + tail light (headlight SVG cx=84, cy=36 in 90×55)
  if (lamp.type === 'cars') {
    const bW = 240
    const bH = 80
    const tx = (5/90 - 0.5) * 90  // -40  tail light x
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left:gx,    top:gy-bH/2, width:bW, height:bH, background:`linear-gradient(to right, ${color}77 0%, ${color}00 100%)`, clipPath:'polygon(0% 50%, 100% 0%, 100% 100%)', filter:'blur(14px)' }}/>
        <div style={{ position:'absolute', left:gx-22, top:gy-22,   width:44, height:44, borderRadius:'50%', background:`radial-gradient(circle, ${color}cc 0%, transparent 70%)`, filter:'blur(8px)' }}/>
        <div style={{ position:'absolute', left:tx-25, top:gy-15,   width:50, height:30, borderRadius:'50%', background:'radial-gradient(circle, #cc000099 0%, transparent 70%)', filter:'blur(8px)' }}/>
      </div>
    )
  }

  // Bad billboard: two upward cones from bottom spotlights (cx=10/36, cy=80 in 46×140)
  if (lamp.type === 'badBillboard') {
    const spH  = canvasH * 0.5
    const spW  = 140
    const skyR = def.glowRadius
    const lx   = (10/46 - 0.5) * 46  // -13
    const rx   = (36/46 - 0.5) * 46  //  13
    const sy   = (80/140 - 1)  * 140  // -60  spotlight y
    const fY   = (47/140 - 1)  * 140  // -93  billboard face centre
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left:-skyR*0.8, top:fY-skyR*0.6, width:skyR*1.6, height:skyR*1.2, borderRadius:'50%', background:`radial-gradient(circle, ${color}66 0%, transparent 70%)`, filter:`blur(${skyR*0.3}px)` }}/>
        <div style={{ position:'absolute', left:lx-spW/2, top:sy-spH, width:spW, height:spH, background:`linear-gradient(to top, ${color}88 0%, ${color}00 100%)`, clipPath:'polygon(50% 100%, 0% 0%, 100% 0%)', filter:'blur(18px)' }}/>
        <div style={{ position:'absolute', left:rx-spW/2, top:sy-spH, width:spW, height:spH, background:`linear-gradient(to top, ${color}88 0%, ${color}00 100%)`, clipPath:'polygon(50% 100%, 0% 0%, 100% 0%)', filter:'blur(18px)' }}/>
      </div>
    )
  }

  // Better billboard: two downward cones from top spotlights (cx=10/36, cy=12 in 46×130)
  if (lamp.type === 'betterBillboard') {
    const cH = 90
    const cW = Math.tan((30/2) * Math.PI/180) * cH * 2
    const r  = def.glowRadius
    const lx = (10/46 - 0.5) * 46   // -13
    const rx = (36/46 - 0.5) * 46   //  13
    const sy = (12/130 - 1)  * 130  // -118
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left:lx-cW/2, top:sy,   width:cW, height:cH, background:`linear-gradient(to bottom, ${color}88 0%, ${color}00 100%)`, clipPath:'polygon(50% 0%, 0% 100%, 100% 100%)', filter:'blur(8px)' }}/>
        <div style={{ position:'absolute', left:rx-cW/2, top:sy,   width:cW, height:cH, background:`linear-gradient(to bottom, ${color}88 0%, ${color}00 100%)`, clipPath:'polygon(50% 0%, 0% 100%, 100% 100%)', filter:'blur(8px)' }}/>
        <div style={{ position:'absolute', left:lx-r,   top:sy-r,  width:r*2, height:r*2, borderRadius:'50%', background:`radial-gradient(circle, ${color}99 0%, transparent 70%)`, filter:'blur(5px)' }}/>
        <div style={{ position:'absolute', left:rx-r,   top:sy-r,  width:r*2, height:r*2, borderRadius:'50%', background:`radial-gradient(circle, ${color}99 0%, transparent 70%)`, filter:'blur(5px)' }}/>
      </div>
    )
  }

  // House: diffuse window glow + exterior lamp (exterior at SVG cx=4, cy=88 in 55×120)
  if (lamp.type === 'house') {
    const r    = def.glowRadius
    const extX = (4/55 - 0.5) * 55    // -23.5
    const extY = (88/120 - 1) * 120   //  -32
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left:-r*1.5, top:extY-r*0.5, width:r*3, height:r, borderRadius:'50%', background:`radial-gradient(ellipse, ${color}66 0%, transparent 70%)`, filter:`blur(${r*0.35}px)` }}/>
        <div style={{ position:'absolute', left:extX-18, top:extY-18, width:36, height:36, borderRadius:'50%', background:`radial-gradient(circle, ${color}bb 0%, transparent 70%)`, filter:'blur(7px)' }}/>
      </div>
    )
  }

  // Astronomer: tiny red glow from handheld lamp only, no sky contribution
  if (lamp.type === 'astronomer') {
    const r = 16
    return (
      <div className="absolute pointer-events-none" style={W}>
        <div style={{ position:'absolute', left:gx-r, top:gy-r, width:r*2, height:r*2, borderRadius:'50%', background:'radial-gradient(circle, #ff330055 0%, transparent 70%)', filter:'blur(4px)' }}/>
        <div style={{ position:'absolute', left:gx-6, top:gy-6, width:12, height:12, borderRadius:'50%', background:'radial-gradient(circle, #ff3300aa 0%, transparent 70%)', filter:'blur(2px)' }}/>
      </div>
    )
  }

  // Generic directional: fullCutoff, coldLED, pcAmber, floodlight
  const alpha    = Math.min(0.65, 0.15 + def.upwardRatio * 0.5)
  const hexA     = Math.round(alpha * 255).toString(16).padStart(2, '0')
  const skyR     = def.glowRadius
  const coneH    = canvasH * 0.5
  const coneW    = Math.tan((def.coneAngle / 2) * Math.PI / 180) * coneH * 2
  return (
    <div className="absolute pointer-events-none" style={W}>
      {def.upwardRatio > 0.02 && (
        <div style={{ position:'absolute', left:gx-skyR, top:gy-skyR, width:skyR*2, height:skyR*2, borderRadius:'50%', background:`radial-gradient(circle, ${color}${hexA} 0%, transparent 70%)`, filter:`blur(${skyR*0.25}px)` }}/>
      )}
      <div style={{ position:'absolute', left:gx-24, top:gy-12, width:48, height:24, borderRadius:'50%', background:`radial-gradient(circle, ${color}99 0%, transparent 70%)`, filter:'blur(6px)' }}/>
      {def.coneAngle > 0 && (
        <div style={{ position:'absolute', left:gx-coneW/2, top:gy, width:coneW, height:coneH, background:`linear-gradient(to bottom, ${color}66 0%, ${color}00 100%)`, clipPath:'polygon(50% 0%, 0% 100%, 100% 100%)', filter:`blur(${6+def.coneAngle*0.15}px)` }}/>
      )}
    </div>
  )
}

// ─── Placed light ───────────────────────────────────────────────────────────────

type PlacedLight = { id: number; type: LightType; x: number; y: number }
let nextId = 1

const LP_BAR_GRADIENT = 'linear-gradient(to right, #001a4d, #336699, #c4a35a, #d4812c)'

// ─── Stars (more visible) ───────────────────────────────────────────────────────

function Stars({ bortle }: { bortle: number }) {
  const opacity = Math.max(0, 1 - (bortle - 1) / 5.5)
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity }} xmlns="http://www.w3.org/2000/svg">
      {STAR_POSITIONS.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" fillOpacity={s.a} />
      ))}
    </svg>
  )
}

const STAR_POSITIONS = (() => {
  const stars = []
  let seed = 42
  function rand() { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff }
  for (let i = 0; i < 500; i++) {
    const bright = rand() < 0.08
    const giant  = rand() < 0.02
    stars.push({
      x: rand() * 100,
      y: rand() * 78,
      r: giant ? 2.5 + rand() : bright ? 1.4 + rand() * 0.8 : 0.7 + rand() * 0.7,
      a: giant ? 0.95 : bright ? 0.75 + rand() * 0.25 : 0.45 + rand() * 0.45,
    })
  }
  return stars
})()

// ─── Main component ─────────────────────────────────────────────────────────────

export default function CityGame() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<LightType>('globe')
  const [lights, setLights] = useState<PlacedLight[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasH, setCanvasH] = useState(500)
  const [isDemo, setIsDemo] = useState(false)
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const resetInactivityTimer = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current)
    inactivityRef.current = setTimeout(() => setIsDemo(true), 60_000)
  }, [])

  useEffect(() => {
    const obs = new ResizeObserver(e => setCanvasH(e[0]?.contentRect.height ?? 500))
    if (canvasRef.current) obs.observe(canvasRef.current)
    return () => obs.disconnect()
  }, [])

  // inactivity timer — 60s without click triggers demo
  useEffect(() => {
    resetInactivityTimer()
    return () => { if (inactivityRef.current) clearTimeout(inactivityRef.current) }
  }, [resetInactivityTimer])

  // demo interval
  useEffect(() => {
    if (!isDemo) {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current)
      return
    }
    demoIntervalRef.current = setInterval(() => {
      setLights(prev => {
        const r = Math.random()
        // 10%: clear all
        if (r < 0.10) return []
        // 20%: remove 1-2 random lights
        if (r < 0.30 && prev.length > 0) {
          const count = Math.min(1 + Math.floor(Math.random() * 2), prev.length)
          const toRemove = new Set<number>()
          while (toRemove.size < count) toRemove.add(Math.floor(Math.random() * prev.length))
          return prev.filter((_, i) => !toRemove.has(i))
        }
        // 70%: add a light near bottom (if under limit)
        if (prev.length >= MAX_LIGHTS) return prev
        const type = LAMP_ORDER[Math.floor(Math.random() * LAMP_ORDER.length)]
        const x = 5 + Math.random() * 90
        const y = 93 + Math.random() * 3
        return [...prev, { id: nextId++, type, x, y }]
      })
    }, 1500)
    return () => { if (demoIntervalRef.current) clearInterval(demoIntervalRef.current) }
  }, [isDemo])

  const totalLP = Math.min(1.0, lights.reduce((s, l) => s + LAMPS[l.type].contribution, 0.00001))
  const bortle  = lpToBortle(totalLP)
  const lpPercent = Math.min(100, ((Math.log10(totalLP) + 5) / 5) * 100)
  const skyColor  = smoothSkyColor(lpPercent)
  const { muted, toggleMute } = useBortleAudio(bortle)


  const lpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (lpTimerRef.current) clearTimeout(lpTimerRef.current)
    lpTimerRef.current = setTimeout(() => {
      const lp = Math.min(1.0, lights.reduce((s, l) => s + LAMPS[l.type].contribution, 0.00001))
      // Power curve: compress low LP values so first few lamps barely change the sky
      const stelLP = Math.pow(lp, 1.5)
      fadeLightPollution(stelLP)
        .then(() => console.debug('stel LP ok', stelLP))
        .catch(() => setStatus(t('stel.error')))
    }, 300)
    return () => { if (lpTimerRef.current) clearTimeout(lpTimerRef.current) }
  }, [lights, t])

  const handleReset = useCallback(() => {
    if (isDemo) setIsDemo(false)
    setLights([])
    resetInactivityTimer()
  }, [isDemo, resetInactivityTimer])

  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const type = e.dataTransfer.getData('text/plain') as LightType
    if (!LAMP_ORDER.includes(type)) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    if (y > 97) return
    if (isDemo) {
      setIsDemo(false)
      setLights([{ id: nextId++, type, x, y }])
    } else {
      setLights(prev => prev.length >= MAX_LIGHTS ? prev : [...prev, { id: nextId++, type, x, y }])
    }
    resetInactivityTimer()
  }, [isDemo, resetInactivityTimer])

  const handleLampClick = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (isDemo) setIsDemo(false)
    setLights(prev => prev.filter(l => l.id !== id))
    resetInactivityTimer()
  }, [isDemo, resetInactivityTimer])


  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // clicking during demo stops it and clears lights
    if (isDemo) {
      setIsDemo(false)
      setLights([])
      resetInactivityTimer()
      return
    }
    resetInactivityTimer()
    if (lights.length >= MAX_LIGHTS) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    if (y > 97) return
    setLights(prev => [...prev, { id: nextId++, type: selected, x, y }])
  }, [selected, lights.length, isDemo, resetInactivityTimer])

  const atLimit = lights.length >= MAX_LIGHTS

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 53px)", overflow: "hidden" }}>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
        onDrop={handleCanvasDrop}
        className={`relative flex-1 overflow-hidden select-none ${atLimit ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        style={{ background: `linear-gradient(to bottom, ${skyColor} 0%, #0d0d1a 80%)` }}
      >
        <Stars bortle={bortle} />

        {/* City silhouette */}
        <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 1440 220" preserveAspectRatio="none" style={{ height: '38%' }}>
          <path d="M0,220 L0,160 L40,160 L40,130 L70,130 L70,145 L100,145 L100,110 L120,110 L120,90 L140,90 L140,70 L155,70 L155,50 L165,50 L165,30 L175,30 L175,50 L185,50 L185,70 L200,70 L200,55 L215,55 L215,40 L230,40 L230,20 L242,20 L242,0 L254,0 L254,20 L262,20 L262,40 L278,40 L278,55 L295,55 L295,80 L320,80 L320,60 L340,60 L340,40 L358,40 L358,60 L375,60 L375,80 L400,80 L400,95 L425,95 L425,70 L445,70 L445,50 L460,50 L460,30 L472,30 L472,10 L484,10 L484,30 L494,30 L494,50 L510,50 L510,70 L535,70 L535,90 L560,90 L560,70 L580,70 L580,50 L596,50 L596,30 L610,30 L610,50 L625,50 L625,70 L650,70 L650,50 L668,50 L668,30 L682,30 L682,10 L694,10 L694,30 L706,30 L706,50 L722,50 L722,70 L748,70 L748,90 L775,90 L775,70 L795,70 L795,50 L812,50 L812,70 L830,70 L830,90 L855,90 L855,110 L880,110 L880,90 L900,90 L900,70 L916,70 L916,50 L930,50 L930,70 L945,70 L945,90 L970,90 L970,110 L1000,110 L1000,130 L1030,130 L1030,110 L1055,110 L1055,90 L1075,90 L1075,70 L1092,70 L1092,55 L1108,55 L1108,40 L1122,40 L1122,20 L1134,20 L1134,0 L1146,0 L1146,20 L1158,20 L1158,40 L1172,40 L1172,55 L1190,55 L1190,75 L1215,75 L1215,90 L1240,90 L1240,110 L1265,110 L1265,130 L1290,130 L1290,150 L1320,150 L1320,160 L1360,160 L1360,175 L1400,175 L1400,185 L1440,185 L1440,220 Z" fill="#111122"/>
          <path d="M0,220 L0,185 L60,185 L60,170 L120,170 L120,185 L180,185 L180,170 L250,170 L250,185 L310,185 L310,165 L380,165 L380,185 L440,185 L440,168 L510,168 L510,185 L570,185 L570,170 L640,170 L640,185 L700,185 L700,170 L760,170 L760,185 L820,185 L820,170 L880,170 L880,185 L940,185 L940,168 L1010,168 L1010,185 L1070,185 L1070,170 L1140,170 L1140,185 L1200,185 L1200,170 L1270,170 L1270,185 L1330,185 L1330,172 L1400,172 L1400,185 L1440,185 L1440,220 Z" fill="#0a0a18"/>
          <rect x="0" y="200" width="1440" height="20" fill="#080812"/>
        </svg>

        {/* Glows in front of buildings */}
        {lights.map(l => <LampGlow key={l.id} lamp={l} def={LAMPS[l.type]} canvasH={canvasH} />)}

        {/* Lamp objects */}
        {lights.map(l => {
          const def = LAMPS[l.type]
          const color = def.kelvin > 0 ? kelvinToHex(def.kelvin) : '#333'
          return (
            <div
              key={l.id}
              title={t('city.remove')}
              onClick={(e) => handleLampClick(e, l.id)}
              className="absolute cursor-pointer"
              style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%, -100%)' }}
            >
              <div className="transition-transform duration-150 hover:scale-105 hover:brightness-110 origin-bottom">
                {LAMP_SVG[l.type](color)}
              </div>
            </div>
          )
        })}

        {/* Atmospheric haze */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, ${LAMPS[selected].glowColor}18 0%, transparent 60%)`, opacity: Math.min(1, lpPercent / 60) }}/>

        {/* Limit warning */}
        {atLimit && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-900/80 text-red-200 text-sm px-4 py-2 rounded-xl border border-red-700 backdrop-blur">
            {t('city.maxReached')} ({MAX_LIGHTS})
          </div>
        )}
      </div>

      {/* ── Bottom panel ── */}
      <div className="flex-shrink-0 bg-[#0d0d1e] border-t border-slate-800">

        {/* LP strip */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-3">
          <span className="text-slate-400 text-xs whitespace-nowrap">{t('city.totalLP')}</span>
          <div className="flex-1 h-2.5 rounded-full bg-slate-900 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${lpPercent}%`, background: LP_BAR_GRADIENT }}/>
          </div>
          <span className="text-white text-sm font-bold whitespace-nowrap">{t('city.bortle')} {bortle}/9</span>
          <span className="text-slate-500 text-xs whitespace-nowrap">{lights.length}/{MAX_LIGHTS}</span>
          {status && <span className="text-xs text-green-400 whitespace-nowrap">{status}</span>}
          <button onClick={toggleMute} title={muted ? t("city.soundOff") : t("city.soundOn")} className="px-2 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:border-slate-500 transition-all flex-shrink-0">{muted ? "🔇" : "🔊"}</button>
          <button onClick={handleReset} className="ml-auto px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-sm hover:border-red-700 hover:text-red-400 transition-all">
            {t('city.reset')}
          </button>
        </div>

        <div className="px-4 pb-1 text-[11px] text-slate-500">
          {t('city.dragHint')}
        </div>

        {/* Lamp selector */}
        <div className="flex gap-2 px-4 pb-3 pt-1 overflow-x-auto no-scrollbar">
          {LAMP_ORDER.map(type => {
            const def   = LAMPS[type]
            const color = def.kelvin > 0 ? kelvinToHex(def.kelvin) : '#555'
            const active = selected === type
            return (
              <button
                key={type}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', type); e.dataTransfer.effectAllowed = 'copy' }}
                onClick={() => setSelected(type)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all flex-shrink-0 ${active ? 'border-blue-400 bg-blue-900/40' : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'}`}
                style={{ width: 140 }}>
                <div style={{ height: 56, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <div style={{ transform: `scale(${Math.min(1, 56 / def.svgH)})`, transformOrigin: 'bottom center', flexShrink: 0 }}>
                    {LAMP_SVG[type](color)}
                  </div>
                </div>
                <span className={`text-xs font-semibold ${active ? 'text-blue-200' : 'text-slate-300'}`}>
                  {t(`city.lights.${type}`)}
                </span>
                <span className="text-[10px] text-slate-500 text-center leading-tight">
                  {t(`city.lightDesc.${type}`)}
                </span>
                {def.heightM > 0 && (
                  <span className="text-[10px] text-slate-600">{t('city.height')}: {def.heightM} m</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
