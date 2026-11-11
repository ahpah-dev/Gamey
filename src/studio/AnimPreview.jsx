import React, { useEffect, useRef } from 'react'
import { createRenderer, onSpritesLoaded, samplePose } from '../engine/index.js'
import { clamp } from '../engine/math.js'

const FALLBACK = {
  '3d': { type: 'box', model: 'b:character', color: '#a29bfe', w: 0.95, h: 1.84, d: 0.7 },
  '2d': { type: 'sprite', sprite: 'b:hero', w: 64, h: 64 },
}

/**
 * Live preview of an object playing an animation.
 *  - `playing`: loops by itself (calls onFrame(t) every frame)
 *  - otherwise it shows the pose at `time` seconds
 * Drag to turn a 3D preview.
 */
export default function AnimPreview({ mode, project, obj, anim, playing = true, time = 0, onFrame, className }) {
  const cv = useRef(null)
  const st = useRef({})
  const cam = useRef({ yaw: 28, pitch: 14 })
  const drag = useRef(null)
  st.current = { project, obj, anim, playing, time, onFrame }

  useEffect(() => {
    let r
    try { r = createRenderer(cv.current, mode) } catch { return undefined }
    let raf = 0, tt = 0, last = performance.now()
    const draw = (now) => {
      raf = requestAnimationFrame(draw)
      const s = st.current
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      let t = s.time || 0
      const d = (s.anim && s.anim.dur) || 1
      if (s.playing) { tt += dt; t = s.anim && s.anim.loop === false ? tt % (d + 0.7) : tt }
      if (s.onFrame && s.playing) s.onFrame(s.anim && s.anim.loop === false ? Math.min(t, d) : t % d)
      const pose = s.anim ? samplePose(s.anim, t) : null
      const o = s.obj || FALLBACK[mode]
      if (mode === '3d') {
        const k = 1.9 / Math.max(o.w || 1, o.h || 1, o.d || 1)
        const e = { ...o, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, w: (o.w || 1) * k, h: (o.h || 1) * k, d: (o.d || 1) * k, pose, visible: true, opacity: 1, alpha: 1, pulse: 0, behaviors: [], pattern: false }
        r.render({
          entities: [e], particles: [], camera: { x: 0, y: 0, z: 0, yaw: cam.current.yaw, pitch: cam.current.pitch, dist: 4.6, fov: 40 },
          project: { ...s.project, background: ['#e9eeff', '#ffffff'] },
        })
      } else {
        const k = 190 / Math.max(o.w || 1, o.h || 1)
        const e = { ...o, x: 200, y: 150, w: (o.w || 1) * k, h: (o.h || 1) * k, rz: 0, pose, visible: true, opacity: 1, alpha: 1, pulse: 0, behaviors: [], flip: false }
        r.render({ entities: [e], particles: [], camera: { x: 200, y: 150, zoom: 1 }, project: { ...s.project, world: { w: 400, h: 300 }, background: ['#e9eeff', '#ffffff'] } })
      }
    }
    raf = requestAnimationFrame(draw)
    const off = onSpritesLoaded(() => {})
    return () => { cancelAnimationFrame(raf); off() }
  }, [mode])

  const down = (e) => { if (mode !== '3d') return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY } }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    cam.current = { yaw: cam.current.yaw - (e.clientX - d.x) * 0.6, pitch: clamp(cam.current.pitch + (e.clientY - d.y) * 0.4, -20, 70) }
    d.x = e.clientX; d.y = e.clientY
  }
  return <canvas ref={cv} className={className || 'anim-canvas'} onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} />
}
