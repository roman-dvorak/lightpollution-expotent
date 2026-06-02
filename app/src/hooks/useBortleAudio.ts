import { useEffect, useRef, useState, useCallback } from 'react'

function gains(bortle: number): { nature: number; city: number } {
  const t = Math.max(0, Math.min(1, (bortle - 1) / 8))
  return { nature: 1 - t, city: t }
}

export function useBortleAudio(bortle: number) {
  const ctxRef        = useRef<AudioContext | null>(null)
  const natureGainRef = useRef<GainNode | null>(null)
  const cityGainRef   = useRef<GainNode | null>(null)
  const startedRef    = useRef(false)
  const [muted, setMuted] = useState(false)
  // last applied bortle — used to force re-apply after resume/load
  const lastBortleRef = useRef(bortle)

  const applyGains = useCallback((b: number) => {
    const ng = natureGainRef.current
    const cg = cityGainRef.current
    const ctx = ctxRef.current
    if (!ng || !cg || !ctx) return

    const { nature, city } = gains(b)
    const t = ctx.currentTime + 0.1
    ng.gain.linearRampToValueAtTime(nature, t)
    cg.gain.linearRampToValueAtTime(city, t)
    lastBortleRef.current = b
  }, [])

  // init: create AudioContext on first user interaction
  const ensureStarted = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true

    const ctx = new AudioContext()
    ctxRef.current = ctx

    const ng = ctx.createGain()
    const cg = ctx.createGain()
    ng.gain.value = 0
    cg.gain.value = 0
    ng.connect(ctx.destination)
    cg.connect(ctx.destination)
    natureGainRef.current = ng
    cityGainRef.current   = cg

    // load both files concurrently, start playing when ready
    Promise.all([
      fetch('/audio/nature.mp3').then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)),
      fetch('/audio/city.mp3').then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)),
    ]).then(([natureBuf, cityBuf]) => {
      // nature source
      const ns = ctx.createBufferSource()
      ns.buffer = natureBuf
      ns.loop = true
      ns.connect(ng)
      ns.start()
      // city source
      const cs = ctx.createBufferSource()
      cs.buffer = cityBuf
      cs.loop = true
      cs.connect(cg)
      cs.start()
      // apply current gains after both are playing
      applyGains(lastBortleRef.current)
    }).catch(console.warn)

    // resume if needed
    if (ctx.state === 'suspended') {
      ctx.resume().catch(console.warn)
    }
  }, [applyGains])

  // crossfade: update gains on bortle change
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx || !natureGainRef.current || !cityGainRef.current) return

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => applyGains(bortle)).catch(console.warn)
    } else {
      applyGains(bortle)
    }
  }, [bortle, applyGains])

  // mute handling reacts separately
  useEffect(() => {
    const ng = natureGainRef.current
    const cg = cityGainRef.current
    const ctx = ctxRef.current
    if (!ng || !cg || !ctx) return

    const { nature, city } = gains(lastBortleRef.current)
    const t = ctx.currentTime + 0.1
    if (muted) {
      ng.gain.linearRampToValueAtTime(0, t)
      cg.gain.linearRampToValueAtTime(0, t)
    } else {
      ng.gain.linearRampToValueAtTime(nature, t)
      cg.gain.linearRampToValueAtTime(city, t)
    }
  }, [muted])

  const toggleMute = useCallback(() => {
    ensureStarted()
    setMuted(m => !m)
  }, [ensureStarted])

  return { muted, toggleMute }
}
