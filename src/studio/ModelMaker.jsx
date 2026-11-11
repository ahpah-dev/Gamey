import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Renderer3D, makeEntity, ANIMS, samplePose, autoPivot, autoRig, animFit, BONE_LABELS, MODEL_TEMPLATES, MODEL_TEMPLATE_IDS, templateForBones, templateStarter, canAutoRig } from '../engine/index.js'
import { DEG, clamp } from '../engine/math.js'
import { NumField, ColorPicker } from './Inspector.jsx'

const SHAPES = [['box', '🧊', 'Cube'], ['sphere', '🔮', 'Ball'], ['cylinder', '🛢️', 'Cylinder'], ['cone', '🔺', 'Cone']]
const NEW_PART = { box: { w: 0.4, h: 0.4, d: 0.4 }, sphere: { w: 0.4, h: 0.4, d: 0.4 }, cylinder: { w: 0.3, h: 0.5, d: 0.3 }, cone: { w: 0.4, h: 0.5, d: 0.4 } }
const DEFAULT_PART = { s: 'box', c: null, x: 0, y: 0, z: 0, w: 0.6, h: 0.6, d: 0.6, rx: 0, ry: 0, rz: 0 }

/** Build a 3D model from simple shapes (parts), with a live 3D preview. */
export default function ModelMaker({ initial, onSave, onClose }) {
  const [name, setName] = useState((initial && initial.name) || 'My model')
  const [color, setColor] = useState((initial && initial.color) || '#a29bfe')
  const [size, setSize] = useState((initial && initial.size) || [1.5, 1.5, 1.5])
  const [parts, setParts] = useState(() => (initial && initial.parts ? initial.parts.map((p) => ({ ...p })) : [{ ...DEFAULT_PART }]))
  const [sel, setSel] = useState(0)
  const [custom, setCustom] = useState((initial && initial.bones) || {})
  const [tmpl, setTmpl] = useState(() => (initial && initial.tmpl) || (initial && initial.parts ? templateForBones(initial.parts.map((q) => q.g)) : ''))
  const [rigNote, setRigNote] = useState('')
  const [tryId, setTryId] = useState('')
  const poseRef = useRef(null)
  const cv = useRef(null), rend = useRef(null)
  const cam = useRef({ x: 0, y: 0, z: 0, yaw: 35, pitch: 22, dist: 3, fov: 45 })
  const drag = useRef(null)
  const state = useRef({})
  const boneNames = useMemo(() => [...new Set(parts.map((p) => p.g).filter(Boolean))], [parts])
  const pivots = useMemo(() => {
    const o = {}
    for (const b of boneNames) o[b] = custom[b] || autoPivot(b, parts)
    if (custom.root) o.root = custom.root
    return o
  }, [parts, custom, boneNames])
  state.current = { parts, color, sel, pivots }

  const tmplObj = MODEL_TEMPLATES[tmpl] || null
  const starter = tmpl ? templateStarter(tmpl) : null
  const riggable = canAutoRig(tmpl)
  // Animations that sync with this model: the ones that move the parts it actually has.
  const tryList = useMemo(() => {
    const all = Object.entries(ANIMS['3d'])
    return {
      tagged: boneNames.length > 0,
      fit: all.filter(([, a]) => animFit(a, boneNames) >= 0.5),
      rest: all.filter(([, a]) => animFit(a, boneNames) < 0.5),
    }
  }, [boneNames])

  const moveAnim = (id) => {
    const move = MODEL_TEMPLATES[id].anim.animMove
    const a = move ? ANIMS['3d'][move.slice(2)] : null
    return a ? `“${a.name}”` : 'an animation'
  }
  // Replace the parts with the template's built-in shape (a person, a car…), ready to edit.
  const useStarter = (id) => {
    const st = templateStarter(id)
    if (!st) return
    setParts(st.parts)
    setSize(st.size)
    setCustom(st.bones)
    setSel(0)
    setTmpl(id)
    if (name === 'My model') setName(st.name)
    const move = MODEL_TEMPLATES[id].anim.animMove
    setTryId(move ? move.slice(2) : '')
    setRigNote(`🧩 Started you from the built-in ${st.name} — change any part, and watch it play ${moveAnim(id)}.`)
  }
  // "Fit my parts": give my own parts the template's bone names by where they sit.
  const fitParts = (id) => {
    if (!canAutoRig(id)) return
    const rigged = autoRig(id, parts)
    setParts(rigged)
    const n = rigged.filter((q) => q.g).length
    setRigNote(n
      ? `🪄 ${n} part${n === 1 ? '' : 's'} will move with the model — try ${moveAnim(id)} below.`
      : 'No part is in a limb spot yet — spread the parts apart (head high, legs low) and press again, or use the starter shape below.')
  }
  // Still the default cube, or an unedited built-in starter (of any template): safe to swap for another template's shape.
  const isStock = (ps) => {
    if (ps.length === 1 && !ps[0].g && JSON.stringify(ps[0]) === JSON.stringify(DEFAULT_PART)) return true
    const json = JSON.stringify(ps)
    return MODEL_TEMPLATE_IDS.some((id) => { const st = templateStarter(id); return !!st && JSON.stringify(st.parts) === json })
  }
  const pickTemplate = (id) => {
    const next = tmpl === id ? '' : id
    setTmpl(next)
    setRigNote('')
    if (!next) return
    if (isStock(parts)) useStarter(next)
    else if (!parts.some((q) => q.g)) fitParts(next)
  }

  const draw = useCallback(() => {
    const r = rend.current
    if (!r) return
    const { parts: ps, color: col, sel: si, pivots: pv } = state.current
    const c = cv.current
    c.width = c.clientWidth || 400; c.height = c.clientHeight || 400
    const part = ps[si]
    r.render({
      entities: [{ ...makeEntity('3d', { id: 'pv', type: 'box', x: 0, y: 0, z: 0, w: 1, h: 1, d: 1, model: 'c:pv', color: col }), pose: poseRef.current }],
      particles: [], camera: cam.current,
      project: { background: ['#dfe6ff', '#f6f3ff'], models: { pv: { parts: ps, bones: pv } } },
      overlay: { wires: part && !poseRef.current ? [part, ...(part.g && pv[part.g] ? [{ x: pv[part.g][0], y: pv[part.g][1], z: pv[part.g][2], w: 0.05, h: 0.05, d: 0.05 }] : [])] : [] },
    })
  }, [])

  useEffect(() => {
    try { rend.current = new Renderer3D(cv.current); rend.current.fixed = true } catch { /* shown below */ }
    draw()
  }, [draw])
  useEffect(() => { draw() }, [parts, color, sel, pivots, draw])
  useEffect(() => {
    if (!tryId) { poseRef.current = null; draw(); return undefined }
    const a = ANIMS['3d'][tryId]
    let raf = 0
    const t0 = performance.now()
    const loop = (now) => { raf = requestAnimationFrame(loop); poseRef.current = samplePose(a, (now - t0) / 1000); draw() }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tryId, draw])

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
            <label className="try-anim">🎬 Try an animation
              <select value={tryId} onChange={(e) => setTryId(e.target.value)}>
                <option value="">Still</option>
                {tryList.tagged ? (
                  <>
                    <optgroup label={tmplObj ? `✓ Syncs with ${tmplObj.name}` : '✓ Syncs with your parts'}>
                      {tryList.fit.map(([id, a]) => <option key={id} value={id}>{a.icon} {a.name}</option>)}
                    </optgroup>
                    <optgroup label="Other animations">
                      {tryList.rest.map(([id, a]) => <option key={id} value={id}>{a.icon} {a.name}</option>)}
                    </optgroup>
                  </>
                ) : Object.entries(ANIMS['3d']).map(([id, a]) => <option key={id} value={id}>{a.icon} {a.name}</option>)}
              </select>
            </label>
          </div>
          <div className="model-right">
            {p && (
              <>
                <h4>Selected part</h4>
                <label className="field"><span>Shape</span>
                  <select value={p.s} onChange={(e) => patch(sel, { s: e.target.value })}>{SHAPES.map(([s, , l]) => <option key={s} value={s}>{l}</option>)}</select>
                </label>
                <label className="field"><span>Moves with</span>
                  <select value={p.g || ''} onChange={(e) => {
                    let v = e.target.value
                    if (v === '__new') { v = (prompt('Name this moving part (one word, like antenna):') || '').trim().replace(/\s+/g, ''); if (!v) return }
                    patch(sel, { g: v || undefined })
                  }}>
                    <option value="">Nothing (stays put)</option>
                    {tmplObj && <optgroup label={`${tmplObj.icon} ${tmplObj.name} parts`}>{tmplObj.bones.map((b) => <option key={b} value={b}>{BONE_LABELS[b] || b}</option>)}</optgroup>}
                    <optgroup label={tmplObj ? 'Other names' : 'Moving parts'}>
                      {[...new Set([...Object.keys(BONE_LABELS).filter((b) => b !== 'root' && !(tmplObj && tmplObj.bones.includes(b))), ...boneNames.filter((b) => !(tmplObj && tmplObj.bones.includes(b))), ...(p.g && !(tmplObj && tmplObj.bones.includes(p.g)) ? [p.g] : [])])].map((b) => <option key={b} value={b}>{BONE_LABELS[b] || b}</option>)}
                    </optgroup>
                    <option value="__new">＋ New name…</option>
                  </select>
                </label>
                {p.g && pivots[p.g] && (
                  <div className="field-col"><span className="lbl">Turns around this point</span>
                    <div className="grid3">
                      {['X', 'Y', 'Z'].map((l, i) => <NumField key={l} label={l} value={pivots[p.g][i]} step={0.05} onChange={(v) => setCustom({ ...custom, [p.g]: pivots[p.g].map((n, k) => (k === i ? v : n)) })} />)}
                    </div>
                    <button className="btn small" onClick={() => { const c = { ...custom }; delete c[p.g]; setCustom(c) }}>Auto pivot</button>
                  </div>
                )}
                <div className="field-col"><span className="lbl">Color</span>
                  <ColorPicker value={p.c || color} onChange={(c) => patch(sel, { c })} />
                  <label className="check"><input type="checkbox" checked={p.c === null} onChange={(e) => patch(sel, { c: e.target.checked ? null : color })} /> Use the object’s color (can be changed in the game)</label>
                </div>
                <div className="grid3">{f('x')}{f('y')}{f('z')}{f('w', 0.05, 0.01)}{f('h', 0.05, 0.01)}{f('d', 0.05, 0.01)}{f('rx', 5)}{f('ry', 5)}{f('rz', 5)}</div>
                <p className="muted">Keep parts inside the box from −0.5 to 0.5.</p>
              </>
            )}
            <h4>Template</h4>
            <div className="tmpl-row">
              {MODEL_TEMPLATE_IDS.map((id) => {
                const t = MODEL_TEMPLATES[id]
                return <button key={id} className={'tmpl' + (tmpl === id ? ' on' : '')} title={t.desc} onClick={() => pickTemplate(id)}><span>{t.icon}</span><small>{t.name}</small></button>
              })}
            </div>
            <p className="muted">
              {tmplObj
                ? `${tmplObj.desc} Animations are synced to these parts, so walk, drive & co. work on your model.${starter ? ` Picking it starts you from the built-in ${starter.name}.` : ''}`
                : 'Pick what your model is like — you start from the built-in shape, and animations (walk, drive, fly…) sync to its moving parts.'}
            </p>
            {tmplObj && (
              <div className="row">
                {starter && <button className="btn small" title={`Replace the parts with the built-in ${starter.name}`} onClick={() => useStarter(tmpl)}>🧩 Start from the built-in {starter.name}</button>}
                {riggable && <button className="btn small" title="Assign each part to the nearest template part" onClick={() => fitParts(tmpl)}>🪄 Fit my parts</button>}
              </div>
            )}
            {rigNote && <p className="muted">{rigNote}</p>}
            <h4>Whole model</h4>
            <div className="field-col"><span className="lbl">Main color</span><ColorPicker value={color} onChange={setColor} /></div>
            <div className="grid3">
              {['Width', 'Height', 'Depth'].map((l, i) => <NumField key={l} label={l} value={size[i]} step={0.1} min={0.1} onChange={(v) => setSize(size.map((s, k) => (k === i ? v : s)))} />)}
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={() => onSave({ name: name.trim() || 'My model', kind: 'parts', color, size, parts: parts.map((q) => { const r = { ...q }; if (!r.g) delete r.g; return r }), ...(Object.keys(pivots).length ? { bones: pivots } : {}), ...(tmpl ? { tmpl } : {}) })}>💾 Save model</button>
        </div>
      </div>
    </div>
  )
}
