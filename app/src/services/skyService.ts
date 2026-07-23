import * as stellarium from './stellarium'

export type SkyMode = 'stellarium' | 'fallback'

export type SkyState = {
  lat: number
  lon: number
  lightPollution: number
  date?: Date
}

let detectedMode: SkyMode | null = null

export async function detectSkyMode(): Promise<SkyMode> {
  if (detectedMode) return detectedMode
  const available = await stellarium.isAvailable()
  detectedMode = available ? 'stellarium' : 'fallback'
  return detectedMode
}

export function resetSkyMode() {
  detectedMode = null
}

export async function resetToIntro(): Promise<void> {
  const mode = await detectSkyMode()
  if (mode === 'stellarium') {
    return stellarium.resetToIntro()
  }
}

export async function applyState(state: SkyState): Promise<void> {
  const mode = await detectSkyMode()
  if (mode === 'stellarium') {
    return stellarium.applyState(state)
  }
}

export async function setLightPollution(value: number): Promise<void> {
  const mode = await detectSkyMode()
  if (mode === 'stellarium') {
    return stellarium.setLightPollution(value)
  }
}

export async function fadeLightPollution(target: number, durationMs = 700): Promise<void> {
  const mode = await detectSkyMode()
  if (mode === 'stellarium') {
    return stellarium.fadeLightPollution(target, durationMs)
  }
}

export { bortleToLP, lpToBortle } from './stellarium'
