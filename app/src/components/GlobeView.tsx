import { useRef, useCallback, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Globe from 'react-globe.gl'
import { applyState } from '../services/skyService'

// ─── Zone palette ────────────────────────────────────────────────────────────
// Exact RGB values extracted from world2024_low3.png (Falchi LP atlas, 15 zones)
// Each zone maps to a Bortle class and Stellarium LP luminance value.

const ZONE_PALETTE = [
  { rgb: [  0,  0,  0] as [number,number,number], zone: '0',  bortle: 1, lp: 0.00001 },
  { rgb: [ 34, 34, 34] as [number,number,number], zone: '1a', bortle: 1, lp: 0.00001 },
  { rgb: [ 66, 66, 66] as [number,number,number], zone: '1b', bortle: 2, lp: 0.00003 },
  { rgb: [ 20, 47,114] as [number,number,number], zone: '2a', bortle: 2, lp: 0.00003 },
  { rgb: [ 33, 84,216] as [number,number,number], zone: '2b', bortle: 3, lp: 0.0001  },
  { rgb: [ 15, 87, 20] as [number,number,number], zone: '3a', bortle: 3, lp: 0.0001  },
  { rgb: [ 31,161, 42] as [number,number,number], zone: '3b', bortle: 4, lp: 0.0003  },
  { rgb: [110,100, 30] as [number,number,number], zone: '4a', bortle: 4, lp: 0.0003  },
  { rgb: [184,166, 37] as [number,number,number], zone: '4b', bortle: 5, lp: 0.001   },
  { rgb: [191,100, 30] as [number,number,number], zone: '5a', bortle: 5, lp: 0.001   },
  { rgb: [253,150, 80] as [number,number,number], zone: '5b', bortle: 6, lp: 0.003   },
  { rgb: [251, 90, 73] as [number,number,number], zone: '6a', bortle: 7, lp: 0.01    },
  { rgb: [251,153,138] as [number,number,number], zone: '6b', bortle: 8, lp: 0.1     },
  { rgb: [160,160,160] as [number,number,number], zone: '7a', bortle: 8, lp: 0.1     },
  { rgb: [242,242,242] as [number,number,number], zone: '7b', bortle: 9, lp: 1.0     },
] as const

type ZoneEntry = typeof ZONE_PALETTE[number]

function nearestZone(r: number, g: number, b: number): ZoneEntry {
  let best: ZoneEntry = ZONE_PALETTE[0]
  let bestDist = Infinity
  for (const entry of ZONE_PALETTE) {
    const [er, eg, eb] = entry.rgb
    const dist = (r - er) ** 2 + (g - eg) ** 2 + (b - eb) ** 2
    if (dist < bestDist) { bestDist = dist; best = entry }
  }
  return best
}

const BORTLE_COLORS = [
  '#000033', '#001a4d', '#003066', '#1a4d80',
  '#336699', '#4d7f99', '#7a9e7e', '#c4a35a', '#d4812c',
]

// ─── Component ───────────────────────────────────────────────────────────────

type Selection = { lat: number; lon: number; zone: ZoneEntry }

export default function GlobeView() {
  const { t } = useTranslation()
  const globeRef  = useRef<any>(null)
  const lookupRef = useRef<HTMLCanvasElement | null>(null)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [status,    setStatus]    = useState<string | null>(null)
  const [size,      setSize]      = useState({ w: 800, h: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0]?.contentRect ?? {}
      if (width && height) setSize({ w: width, h: height })
    })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  // Auto-rotate
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true
      globeRef.current.controls().autoRotateSpeed = 0.4
    }
  }, [])

  // Load LP map into an offscreen canvas for pixel lookup (downscaled to 1440×720)
  useEffect(() => {
    const img = new Image()
    img.src = '/lp_map.png'
    img.onload = () => {
      const W = 1440, H = 720
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      canvas.getContext('2d')!.drawImage(img, 0, 0, W, H)
      lookupRef.current = canvas
    }
  }, [])

  // Map coverage: 65°S to 75°N, 180°W to 180°E (total lat span = 140°)
  const LAT_TOP = 75, LAT_BOT = -65

  const lookupZone = useCallback((lat: number, lon: number): ZoneEntry => {
    const canvas = lookupRef.current
    if (!canvas) return ZONE_PALETTE[0]
    // Outside coverage → treat as pristine dark sky
    if (lat > LAT_TOP || lat < LAT_BOT) return ZONE_PALETTE[0]
    const x = Math.min(canvas.width  - 1, Math.max(0, Math.floor((lon + 180) / 360 * canvas.width)))
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * canvas.height)))
    const [r, g, b] = canvas.getContext('2d')!.getImageData(x, y, 1, 1).data
    return nearestZone(r, g, b)
  }, [])

  const handleGlobeClick = useCallback((coords: { lat: number; lng: number }) => {
    const { lat, lng: lon } = coords
    const zone = lookupZone(lat, lon)
    setSelection({ lat, lon, zone })
    if (globeRef.current) globeRef.current.controls().autoRotate = false

    setStatus(t('stel.sending'))
    applyState({ lat, lon, lightPollution: zone.lp })
      .then(() => { setStatus(t('stel.ok')); setTimeout(() => setStatus(null), 2000) })
      .catch(() => { setStatus(t('stel.error')); setTimeout(() => setStatus(null), 3000) })
  }, [t, lookupZone])

  const bortle      = selection?.zone.bortle ?? null
  const bortleColor = bortle ? BORTLE_COLORS[bortle - 1] : null
  const lpPercent   = bortle ? ((bortle - 1) / 8) * 100 : 0

  return (
    <div ref={containerRef} className="relative overflow-hidden" style={{ height: 'calc(100vh - 53px)', background: '#0a0a14' }}>

      <Globe
        ref={globeRef}
        width={size.w}
        height={size.h}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="#0a0a14"
        onGlobeClick={handleGlobeClick}
        pointsData={selection ? [selection] : []}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lon}
        pointColor={() => '#60a5fa'}
        pointRadius={0.8}
        pointAltitude={0.015}
        atmosphereColor="#334466"
        atmosphereAltitude={0.15}
      />

      {/* Title */}
      <div className="absolute top-5 left-6 pointer-events-none select-none">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">{t('globe.title')}</h1>
        <p className="text-slate-400 text-sm drop-shadow">{t('globe.subtitle')}</p>
      </div>

      {/* Info panel */}
      <div className="absolute top-4 right-4 w-64 flex flex-col gap-3">
        {selection ? (
          <div className="rounded-2xl p-4 border border-slate-600 flex flex-col gap-3"
               style={{ background: 'rgba(13,13,30,0.88)', backdropFilter: 'blur(12px)' }}>
            <div className="flex flex-col gap-1.5">
              <InfoRow label={t('globe.lat')} value={`${selection.lat.toFixed(2)}°`} />
              <InfoRow label={t('globe.lon')} value={`${selection.lon.toFixed(2)}°`} />
              <div className="border-t border-slate-700 my-1" />
              <InfoRow label={t('globe.zone')} value={`Zone ${selection.zone.zone}`} />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{t('globe.bortleIndex')}</span>
                <span className="text-lg font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: `${bortleColor}55`, color: '#fff' }}>
                  {bortle} / 9
                </span>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${lpPercent}%`, background: 'linear-gradient(to right, #000033, #336699, #c4a35a, #d4812c)' }}/>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 border border-slate-700 text-slate-500 text-center text-sm"
               style={{ background: 'rgba(13,13,30,0.75)', backdropFilter: 'blur(10px)' }}>
            {t('globe.clickHint')}
          </div>
        )}
      </div>

      {status && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white px-5 py-2.5 rounded-xl shadow-xl text-sm border border-slate-600">
          {status}
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  )
}
