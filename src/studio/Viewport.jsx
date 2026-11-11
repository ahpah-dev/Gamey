import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRenderer } from '../engine/index.js'
import { DEG, clamp } from '../engine/math.js'

const snapTo = (v, step, off) => (off ? v : Math.round(v / step) * step)

export default function Viewport({ project, selectedId, onSelect, onPatch, onCamera, resetSignal, cam2Ref }) {
  const canvasRef = useRef(null)
  const rRef = useRef(null)
  const P = useRef(project)
  const sel = useRef(selectedId)
  const cam2 = cam2Ref
  const drag = useRef(null)
  const [grid, setGrid] = useState(true)
  const gridRef = useRef(true)
  const [err, setErr] = useState(null)
  P.current = project
  sel.current = selectedId
  gridRef.current = grid
  const is3d = project.mode === '3d'

  const draw = useCallback(() => {
    const r = rRef.current
    if (!r) return
    const p = P.current
    r.render({
      entities: p.objects, particles: [], project: p,
      camera: p.mode === '3d' ? p.camera : cam2.current,
      overlay: { grid: gridRef.current, frame: p.mode === '2d', selectedId: sel.current },
    })
  }, [])

  // renderer lifecycle (one per mode; the canvas is re-keyed by mode)
  useEffect(() => {
    setErr(null)
    try { rRef.current = createRenderer(canvasRef.current, project.mode) } catch (e) { setErr(e.message); return undefined }
    const ro = new ResizeObserver(() => draw())
    ro.observe(canvasRef.current)
    draw()
    return () => { ro.disconnect(); rRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.mode])

  useEffect(() => { draw() }, [project, selectedId, grid, draw])

  useEffect(() => {
    cam2.current = { x: project.world.w / 2, y: project.world.h / 2, zoom: 0.82 }
    draw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal])

  const local = (ev) => {
    const b = canvasRef.current.getBoundingClientRect()
    return [ev.clientX - b.left, ev.clientY - b.top]
  }

  const onDown = (ev) => {
    const c = canvasRef.current, r = rRef.current
    if (!r) return
    c.setPointerCapture(ev.pointerId)
    const [px, py] = local(ev)
    const p = P.current
    const objs = p.objects.filter((o) => o.visible !== false)
    const panBtn = ev.button === 1 || ev.button === 2
    if (p.mode === '2d') {
      const w = r.toWorld(px, py, cam2.current)
      const cur = p.objects.find((o) => o.id === sel.current)
      if (cur && !panBtn) {
        const hs = 16 / r.scale
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          if (Math.abs(w.x - (cur.x + (cx * cur.w) / 2)) < hs && Math.abs(w.y - (cur.y + (cy * cur.h) / 2)) < hs) {
            drag.current = { kind: 'resize', id: cur.id }
            return
          }
        }
      }
      const hit = panBtn ? null : r.pick(px, py, objs, cam2.current)
      if (hit) {
        onSelect(hit.id)
        drag.current = { kind: 'move', id: hit.id, ox: w.x - hit.x, oy: w.y - hit.y }
      } else {
        if (!panBtn) onSelect(null)
        drag.current = { kind: 'pan', lx: px, ly: py }
      }
    } else {
      const hit = panBtn ? null : r.pick(px, py, objs)
      if (hit) {
        onSelect(hit.id)
        if (ev.shiftKey) drag.current = { kind: 'lift', id: hit.id, y0: hit.y, py }
        else {
          const g = r.toWorld(px, py, p.camera, hit.y)
          drag.current = g ? { kind: 'move3', id: hit.id, ox: g.x - hit.x, oz: g.z - (hit.z || 0), y: hit.y } : null
        }
      } else {
        if (!panBtn) onSelect(null)
        drag.current = { kind: panBtn ? 'pan3' : 'orbit', lx: px, ly: py }
      }
    }
  }

  const onMove = (ev) => {
    const d = drag.current, r = rRef.current
    if (!d || !r) return
    const [px, py] = local(ev)
    const p = P.current
    const free = ev.altKey
    if (d.kind === 'pan') {
      cam2.current = { ...cam2.current, x: cam2.current.x - (px - d.lx) / r.scale, y: cam2.current.y - (py - d.ly) / r.scale }
      d.lx = px; d.ly = py
      draw()
    } else if (d.kind === 'move') {
      const w = r.toWorld(px, py, cam2.current)
      onPatch(d.id, { x: snapTo(w.x - d.ox, 10, free), y: snapTo(w.y - d.oy, 10, free) }, 'drag' + d.id)
    } else if (d.kind === 'resize') {
      const o = p.objects.find((x) => x.id === d.id)
      if (!o) return
      const w = r.toWorld(px, py, cam2.current)
      let nw = Math.max(10, snapTo(2 * Math.abs(w.x - o.x), 10, free))
      let nh = Math.max(10, snapTo(2 * Math.abs(w.y - o.y), 10, free))
      if (o.type === 'circle' || o.type === 'emoji') nw = nh = Math.max(nw, nh)
      if (o.type === 'text') { nh = Math.max(16, nh); nw = Math.round((o.text || '').length * nh * 0.62) }
      onPatch(d.id, { w: nw, h: nh }, 'size' + d.id)
    } else if (d.kind === 'move3') {
      const g = r.toWorld(px, py, p.camera, d.y)
      if (g) onPatch(d.id, { x: snapTo(g.x - d.ox, 0.5, free), z: snapTo(g.z - d.oz, 0.5, free) }, 'drag' + d.id)
    } else if (d.kind === 'lift') {
      const cam = p.camera
      const wpp = (2 * cam.dist * Math.tan((cam.fov * DEG) / 2)) / r.ch
      onPatch(d.id, { y: snapTo(d.y0 - (py - d.py) * wpp, 0.25, free) }, 'lift' + d.id)
    } else if (d.kind === 'orbit') {
      const cam = p.camera
      onCamera({ ...cam, yaw: cam.yaw - (px - d.lx) * 0.4, pitch: clamp(cam.pitch + (py - d.ly) * 0.3, 3, 89) })
      d.lx = px; d.ly = py
    } else if (d.kind === 'pan3') {
      const cam = p.camera
      const wpp = (2 * cam.dist * Math.tan((cam.fov * DEG) / 2)) / r.ch
      const yaw = cam.yaw * DEG
      const dx = (px - d.lx) * wpp, dy = (py - d.ly) * wpp
      onCamera({ ...cam, x: cam.x - Math.cos(yaw) * dx + -Math.sin(yaw) * dy, z: cam.z + Math.sin(yaw) * dx + -Math.cos(yaw) * dy })
      d.lx = px; d.ly = py
    }
  }

  const onUp = () => { drag.current = null }

  const wheel = useCallback((ev) => {
    ev.preventDefault()
    const r = rRef.current
    if (!r) return
    const p = P.current
    const k = Math.pow(1.1, -ev.deltaY / 100)
    if (p.mode === '3d') {
      const cam = p.camera
      onCamera({ ...cam, dist: clamp(cam.dist / k, 3, 90) })
    } else {
      const b = canvasRef.current.getBoundingClientRect()
      const px = ev.clientX - b.left, py = ev.clientY - b.top
      const c = cam2.current
      const base = Math.min(r.cw / p.world.w, r.ch / p.world.h)
      const s0 = base * c.zoom
      const zoom = clamp(c.zoom * k, 0.15, 5)
      const s1 = base * zoom
      cam2.current = { zoom, x: c.x + (px - r.cw / 2) / s0 - (px - r.cw / 2) / s1, y: c.y + (py - r.ch / 2) / s0 - (py - r.ch / 2) / s1 }
      draw()
    }
  }, [draw, onCamera])

  useEffect(() => {
    const c = canvasRef.current
    c.addEventListener('wheel', wheel, { passive: false })
    return () => c.removeEventListener('wheel', wheel)
  }, [wheel, project.mode])

  const zoomBtn = (k) => wheel({ preventDefault() {}, deltaY: -k * 100, clientX: canvasRef.current.getBoundingClientRect().left + canvasRef.current.clientWidth / 2, clientY: canvasRef.current.getBoundingClientRect().top + canvasRef.current.clientHeight / 2 })

  const resetView = () => {
    if (is3d) { const o = project.objects.find((x) => x.id === selectedId); onCamera({ ...project.camera, x: o ? o.x : 0, y: o ? o.y : 1, z: o ? o.z : 0 }) }
    else { cam2.current = { x: project.world.w / 2, y: project.world.h / 2, zoom: 0.82 }; draw() }
  }

  return (
    <div className="viewport">
      <canvas
        key={project.mode} ref={canvasRef} className="viewport-canvas"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      {err && <div className="viewport-error">😢 {err}</div>}
      <div className="viewport-tools">
        <button className={grid ? 'on' : ''} title="Show grid" onClick={() => setGrid(!grid)}>▦</button>
        <button title="Zoom in" onClick={() => zoomBtn(1)}>＋</button>
        <button title="Zoom out" onClick={() => zoomBtn(-1)}>－</button>
        <button title={is3d ? 'Focus on selected' : 'Reset view'} onClick={resetView}>🎯</button>
      </div>
      <div className="viewport-hint">
        {is3d ? 'Drag an object to move it · Shift+drag to lift · Drag empty space to look around · Right-drag to pan · Scroll to zoom'
          : 'Drag objects to move · Drag the corners to resize · Drag empty space to pan · Scroll to zoom'}
      </div>
    </div>
  )
}
