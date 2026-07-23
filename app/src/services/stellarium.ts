const BASE = 'http://localhost:8090/api'

async function runScript(code: string) {
  const res = await fetch(`${BASE}/scripts/direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `code=${encodeURIComponent(code)}`,
  })
  if (!res.ok) throw new Error(`scripts/direct failed: ${res.status}`)
}

// URLSearchParams → browser sets correct Content-Length (no chunked encoding)
async function setProp(id: string, value: string) {
  const res = await fetch(`${BASE}/stelproperty/set`, {
    method: 'POST',
    body: new URLSearchParams({ id, value }),
  })
  if (!res.ok) throw new Error(`stelproperty/set failed: ${res.status}`)
}

export async function isAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/main/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(800),
    })
    return res.ok
  } catch {
    return false
  }
}

export type StellariumState = {
  lat: number
  lon: number
  lightPollution: number
  date?: Date
}

// Reset Stellarium to kiosk intro state:
//   Prague, tonight's local midnight, zenith fish-eye, hidden GUI.
export async function resetToIntro(): Promise<void> {
  const lon = 14.42
  const lat = 50.08
  const FLY = 2
  const utcOffset = lon / 15
  const midnight = new Date()
  midnight.setUTCHours(Math.round(-utcOffset), 0, 0, 0)
  const dateStr = midnight.toISOString().replace(/\.\d{3}Z$/, '')

  // Location + time + fish-eye zoom in one script (commands run in sequence)
  await runScript(
    `core.setObserverLocation(${lon}, ${lat}, 200, ${FLY}, "Prague", "Earth");` +
    `core.setDate("${dateStr}", "utc");` +
    `StelMovementMgr.zoomTo(180, ${FLY});` +
    `core.moveToAltAzi(90, 0, 1);`
  ).catch(console.warn)

  // Wait for fly animation to finish before setting LP / GUI
  await new Promise(r => setTimeout(r, (FLY + 0.5) * 1000))

  // Zero light pollution (Bortle 1)
  const resetLP = 0.0000001
  await setProp('StelSkyDrawer.lightPollutionLuminance', String(resetLP))
  _currentLP = resetLP

  // GUI hiding — Stellarium 0.20+ scripting method
  await runScript('try { core.setGuiVisible(false); } catch(e) {}').catch(console.warn)
}

export async function applyState(state: StellariumState): Promise<void> {
  const date = state.date ?? new Date()
  const utcOffset = state.lon / 15
  const midnight = new Date(date)
  midnight.setUTCHours(0 - utcOffset, 0, 0, 0)
  const dateStr = midnight.toISOString().replace(/\.\d{3}Z$/, '')
  const FLY = 2

  const script =
    `core.setObserverLocation(${state.lon}, ${state.lat}, 0, ${FLY}, "", "Earth");` +
    `core.setDate("${dateStr}", "utc");` +
    `StelMovementMgr.zoomTo(180, 0);`

  await runScript(script)
  // Wait for fly animation before setting LP (mirrors Python: sleep(duration) then fade_lp)
  await new Promise(r => setTimeout(r, (FLY + 0.5) * 1000))
  await setProp('StelSkyDrawer.lightPollutionLuminance', String(state.lightPollution))
  _currentLP = state.lightPollution
}

export async function setLightPollution(value: number): Promise<void> {
  _currentLP = value
  await setProp('StelSkyDrawer.lightPollutionLuminance', String(value))
}

// Smooth log-scale fade from the last applied LP to target.
// Multiple concurrent calls are safe — each new call preempts the previous.
let _currentLP = 0.00001
let _fadeVersion = 0

export async function fadeLightPollution(target: number, durationMs = 700): Promise<void> {
  const myVersion = ++_fadeVersion
  const from = Math.max(1e-6, _currentLP)
  const steps = 12
  const stepMs = durationMs / steps
  const logFrom = Math.log10(from)
  const logTo   = Math.log10(Math.max(1e-6, target))

  for (let i = 1; i <= steps; i++) {
    if (_fadeVersion !== myVersion) return
    const value = Math.pow(10, logFrom + (logTo - logFrom) * (i / steps))
    _currentLP = value
    await setProp('StelSkyDrawer.lightPollutionLuminance', String(value))
    if (i < steps && _fadeVersion === myVersion) {
      await new Promise(resolve => setTimeout(resolve, stepMs))
    }
  }
}

const BORTLE_TO_LP: Record<number, number> = {
  1: 0.00001,
  2: 0.00003,
  3: 0.0001,
  4: 0.0003,
  5: 0.001,
  6: 0.003,
  7: 0.01,
  8: 0.1,
  9: 1.0,
}

export function bortleToLP(bortle: number): number {
  const clamped = Math.max(1, Math.min(9, Math.round(bortle)))
  return BORTLE_TO_LP[clamped]
}

export function lpToBortle(lp: number): number {
  const log = Math.log10(lp)
  const bortle = Math.round(1 + ((log + 5) / 5) * 8)
  return Math.max(1, Math.min(9, bortle))
}
