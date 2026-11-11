import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Renderer3D, makeEntity } from '../engine/index.js'
import { DEG, clamp } from '../engine/math.js'
import { NumField, ColorPicker } from './Inspector.jsx'

const SHAPES = [['box', '🧊', 'Cube'], ['sphere', '🔮', 'Ball'], ['cylinder', '🛢️', 'Cylinder'], ['cone', '🔺', 'Cone']]
const NEW_PART = { box: { w: 0.4, h: 0.4, d: 0.4 }, sphere: { w: 0.4, h: 0.4, d: 0.4 }, cylinder: { w: 0.3, h: 0.5, d: 0.3 }, cone: { w: 0.4, h: 0.5, d: 0.4 } }

/** Build a 3D model from simple shapes (parts), with a live 3D preview. */
export default function ModelMaker({ initial, onSave, onClose }) {
  const [name, setName] = useState((initial && initial.name) || 'My model')
  const [color, setColor] = useState((initial && initial.color) || '#a29bfe')
  const [size, setSize] = useState((initial && initial.size) || [1.5, 1.5, 1.5])
  const [parts, setParts] = useState(() => (initial && initial.parts ? initial.parts.map((p) => ({ ...p })) : [{ s: 'box', c: null, x: 0, y: 0, z: 0, w: 0.6, h: 0.6, d: 0.6, rx: 0, ry: 0, rz: 0 }]))
  const [sel, setSel] = useState(0)
  const cv = useRef(null), rend = useRef(null)
  const cam = useRef({ x: 0, y: 0, z: 0, yaw: 35, pitch: 22, dist: 3, fov: 45 })
  const drag = useRef(null)
  const state = useRef({})
  state.current = { parts, color, sel }

  const draw = useCallback(() => {
    const r = rend.current
    if (!r) return
    const { parts: ps, color: col, sel: si } = state.current
    const c = cv.current
    c.width = c.clientWidth || 400; c.height = c.clientHeight || 400
    const part = ps[si]
    r.render({
      entities: [makeEntity('3d', { id: 'pv', type: 'box', x: 0, y: 0, z: 0, w: 1, h: 1, d: 1, model: 'c:pv', color: col })],
      particles: [], camera: cam.current,
      project: { background: ['#dfe6ff', '#f6f3ff'], models: { pv: { parts: ps } } },
      overlay: { wires: part ? [part] : [] },
    })
  }, [])

  useEffect(() => {
    try { rend.current = new Renderer3D(cv.current); rend.current.fixed = true } catch { /* shown below */ }
    draw()
  }, [draw])
  useEffect(() => { draw() }, [parts, color, sel, draw])

  const patch = (i, p) => setParts((ps) => ps.map((x, k) => (k === i ? { ...x, ...p } : x)))
  const add = (s) => { const n = parts.length; setParts((ps) => [...ps, { s, c: null, x: ((n % 3) - 1) * 0.25, y: 0.3, z: n % 2 ? 0.25 : -0.25, rx: 0, ry: 0, rz: 0, ...NEW_PART[s] }]); setSel(n) }
  const dup = () => { const p = parts[sel]; if (!p) return; setParts([...parts, { ...p, x: p.x + 0.1, z: p.z + 0.1 }]); setSel(parts.length) }
  const mirror = () => { const p = parts[sel]; if (!p) return; setParts([...parts, { ...p, x: -p.x, ry: -p.ry, rz: -p.rz }]); setSel(parts.length) }
  const del = () => { if (parts.length <= 1) return; setParts(parts.filter((_, k) => k !== sel)); setSel(Math.max(0, sel - 1)) }

  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY } }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    cam.current = { ...cam.current, yaw: cam.current.yaw - (e.clientX - d.x) * 0.5, pitch: clamp(cam.current.pitch + (e.clientY - d.y) * 0.4, -80, 85) }
    d.x = e.clientX; d.y = e.clientY
    draw()
  }
  useEffect(() => {
    const c = cv.current
    const w = (e) => { e.preventDefault(); cam.current = { ...cam.current, dist: clamp(cam.current.dist * Math.pow(1.1, e.deltaY / 100), 1.2, 10) }; draw() }
    c.addEventListener('wheel', w, { passive: false })
    const ro = new ResizeObserver(() => draw())
    ro.observe(c)
    return () => { c.removeEventListener('wheel', w); ro.disconnect() }
  }, [draw])

  const p = parts[sel]
  const f = (k, step = 0.05, min) => <NumField key={k} label={k.toUpperCase()} value={p[k] || 0} step={step} min={min} onChange={(v) => patch(sel, { [k]: v })} />

  return (
    <div className="modal-back">
      <div className="modal model-modal" role="dialog" aria-label="Model maker">
        <div className="modal-head">
          <h2>🛠️ Model maker</h2>
          <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Model name" />
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="model-body">
          <div className="model-left">
            <h4>Parts</h4>
            <div className="shape-row">{SHAPES.map(([s, i, l]) => <button key={s} onClick={() => add(s)} title={'Add ' + l}><span>{i}</span><small>＋ {l}</small></button>)}</div>
            <ul className="parts">
              {parts.map((x, i) => (
                <li key={i} className={i === sel ? 'on' : ''} onClick={() => setSel(i)}>
                  <span className="dot" style={{ background: x.c || color }} />
                  <span>{(SHAPES.find((s) => s[0] === x.s) || [])[2]} {i + 1}</span>
                </li>
              ))}
            </ul>
            <div className="row">
              <button className="btn small" onClick={dup}>⧉ Copy</button>
              <button className="btn small" onClick={mirror} title="Copy flipped left↔right">🪞 Mirror</button>
              <button className="btn small" disabled={parts.length <= 1} onClick={del}>🗑</button>
            </div>
          </div>
          <div className="model-mid">
            <canvas ref={cv} className="model-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} />
            <div className="viewport-hint static">Drag to turn · Scroll to zoom · the yellow box is the selected part</div>
          </div>
          <div className="model-right">
            {p && (
              <>
                <h4>Selected part</h4>
                <label className="field"><span>Shape</span>
                  <select value={p.s} onChange={(e) => patch(sel, { s: e.target.value })}>{SHAPES.map(([s, , l]) => <option key={s} value={s}>{l}</option>)}</select>
                </label>
                <div className="field-col"><span className="lbl">Color</span>
                  <ColorPicker value={p.c || color} onChange={(c) => patch(sel, { c })} />
                  <label className="check"><input type="checkbox" checked={p.c === null} onChange={(e) => patch(sel, { c: e.target.checked ? null : color })} /> Use the object’s color (can be changed in the game)</label>
                </div>
                <div className="grid3">{f('x')}{f('y')}{f('z')}{f('w', 0.05, 0.01)}{f('h', 0.05, 0.01)}{f('d', 0.05, 0.01)}{f('rx', 5)}{f('ry', 5)}{f('rz', 5)}</div>
                <p className="muted">Keep parts inside the box from −0.5 to 0.5.</p>
              </>
            )}
            <h4>Whole model</h4>
            <div className="field-col"><span className="lbl">Main color</span><ColorPicker value={color} onChange={setColor} /></div>
            <div className="grid3">
              {['Width', 'Height', 'Depth'].map((l, i) => <NumField key={l} label={l} value={size[i]} step={0.1} min={0.1} onChange={(v) => setSize(size.map((s, k) => (k === i ? v : s)))} />)}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave({ name: name.trim() || 'My model', kind: 'parts', color, size, parts })}>💾 Save model</button>
        </div>
      </div>
    </div>
  )
}
