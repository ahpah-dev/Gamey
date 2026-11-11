import React, { useMemo, useRef, useState } from 'react'
import { BONE_LABELS, POSE_PROPS, propDefault, resolveModel, modelBones, samplePose } from '../engine/index.js'
import AnimPreview from './AnimPreview.jsx'

const sortKeys = (keys) => [...keys].sort((a, b) => a.t - b.t)
const round = (v, d = 3) => Math.round(v * 10 ** d) / 10 ** d

const CONTROLS = {
  '3d': [
    ['Move', [['x', 'Side to side', -1, 1, 0.01], ['y', 'Up / down', -1, 1, 0.01], ['z', 'Forward / back', -1, 1, 0.01]]],
    ['Turn', [['rx', 'Tip forward', -180, 180, 1], ['ry', 'Spin around', -360, 360, 1], ['rz', 'Tilt sideways', -180, 180, 1]]],
    ['Size', [['sx', 'Width', 0.1, 2, 0.01], ['sy', 'Height', 0.1, 2, 0.01], ['sz', 'Depth', 0.1, 2, 0.01], ['o', 'See-through', 0, 1, 0.01]]],
  ],
  '2d': [
    ['Move', [['x', 'Side to side', -1, 1, 0.01], ['y', 'Up / down', -1, 1, 0.01]]],
    ['Turn', [['rz', 'Turn', -360, 360, 1]]],
    ['Size', [['sx', 'Width', -1.5, 2, 0.01], ['sy', 'Height', -1.5, 2, 0.01], ['o', 'See-through', 0, 1, 0.01]]],
  ],
}

/** Pose-to-pose animation editor: pick a part, set poses, add them along the timeline. */
export default function AnimMaker({ mode, project, obj, initial, onSave, onClose }) {
  const is3d = mode === '3d'
  const [name, setName] = useState((initial && initial.name) || 'My animation')
  const [dur, setDur] = useState((initial && initial.dur) || 1)
  const [loop, setLoop] = useState(initial ? initial.loop !== false : true)
  const [ease, setEase] = useState(initial ? initial.ease !== false : true)
  const [keys, setKeys] = useState(() => (initial && initial.keys ? sortKeys(initial.keys.map((k) => ({ t: k.t, pose: JSON.parse(JSON.stringify(k.pose)) }))) : [{ t: 0, pose: {} }, { t: 0.5, pose: {} }]))
  const [sel, setSel] = useState(0)
  const [bone, setBone] = useState('root')
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const head = useRef(null)
  const track = useRef(null)

  const model = is3d && obj ? resolveModel(obj.model, project.models) : null
  const bones = useMemo(() => (is3d ? modelBones(model) : ['root']), [is3d, model])
  const anim = useMemo(() => ({ dur, loop, ease, keys }), [dur, loop, ease, keys])
  const cur = keys[Math.min(sel, keys.length - 1)]
  const pv = (cur.pose[bone] || {})

  const setProp = (p, v) => {
    setPlaying(false)
    setTime(cur.t * dur)
    setKeys((ks) => ks.map((k, i) => {
      if (i !== sel) return k
      const pose = { ...k.pose, [bone]: { ...(k.pose[bone] || {}), [p]: v } }
      return { ...k, pose }
    }))
  }
  const resetProp = (p) => setKeys((ks) => ks.map((k, i) => {
    if (i !== sel || !k.pose[bone]) return k
    const b = { ...k.pose[bone] }
    delete b[p]
    const pose = { ...k.pose }
    if (Object.keys(b).length) pose[bone] = b; else delete pose[bone]
    return { ...k, pose }
  }))
  const resetBone = () => setKeys((ks) => ks.map((k, i) => { if (i !== sel) return k; const pose = { ...k.pose }; delete pose[bone]; return { ...k, pose } }))

  const selectKey = (i) => { setSel(i); setPlaying(false); setTime(keys[i].t * dur) }
  const addKey = () => {
    const t = clampT(time / dur)
    const near = keys.findIndex((k) => Math.abs(k.t - t) < 0.015)
    if (near >= 0) { selectKey(near); return }
    const pose = samplePose(anim, t) || {}
    const next = sortKeys([...keys, { t: round(t), pose }])
    setKeys(next)
    setSel(next.findIndex((k) => k.t === round(t)))
    setPlaying(false)
  }
  const delKey = () => {
    if (keys.length <= 1) return
    const next = keys.filter((_, i) => i !== sel)
    setKeys(next); setSel(Math.max(0, sel - 1)); setTime(next[Math.max(0, sel - 1)].t * dur)
  }
  const setKeyTime = (sec) => {
    const t = clampT(sec / dur)
    const moved = keys.map((k, i) => (i === sel ? { ...k, t: round(t) } : k))
    const target = moved[sel]
    const next = sortKeys(moved)
    setKeys(next); setSel(next.indexOf(target)); setPlaying(false); setTime(t * dur)
  }
  const clampT = (t) => Math.max(0, Math.min(1, t))
  const onTrack = (e) => {
    const r = track.current.getBoundingClientRect()
    const t = clampT((e.clientX - r.left) / r.width)
    const near = keys.findIndex((k) => Math.abs(k.t - t) < 0.025)
    if (near >= 0) selectKey(near)
    else { setPlaying(false); setTime(t * dur) }
  }
  const frame = (t) => { if (head.current) head.current.style.left = (t / dur) * 100 + '%' }
  const shownTime = playing ? null : time

  const save = () => onSave({ name: name.trim() || 'My animation', dur: round(dur, 2), loop, ease, keys: sortKeys(keys) })

  return (
    <div className="modal-back">
      <div className="modal am-modal" role="dialog" aria-label="Animation maker">
        <div className="modal-head">
          <h2>🎞️ Animation maker</h2>
          <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Animation name" />
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="am-body">
          <div className="am-left">
            <h4>Part to move</h4>
            <ul className="parts">
              {bones.map((b) => (
                <li key={b} className={b === bone ? 'on' : ''} onClick={() => setBone(b)}>
                  <span className="dot" style={{ background: cur.pose[b] ? '#6c5ce7' : '#dfe6e9' }} />
                  <span>{BONE_LABELS[b] || b}</span>
                </li>
              ))}
            </ul>
            {is3d && bones.length === 1 && <p className="muted">This model has no moving parts, so animations move the whole thing. Give parts a “Moves with” name in the Model maker to animate them!</p>}
          </div>
          <div className="am-mid">
            <AnimPreview mode={mode} project={project} obj={obj} anim={anim} playing={playing} time={shownTime ?? 0} onFrame={frame} />
            <div className="am-transport">
              <button className="btn primary" onClick={() => { setPlaying(!playing) }}>{playing ? '⏸ Pause' : '▶ Play'}</button>
              <button className="btn" onClick={addKey} title="Save the current moment as a pose you can edit">＋ Add pose here</button>
              <button className="btn" disabled={keys.length <= 1} onClick={delKey}>🗑 Delete pose</button>
            </div>
            <div className="timeline" ref={track} onPointerDown={onTrack}>
              {keys.map((k, i) => <button key={i} className={'key' + (i === sel ? ' on' : '')} style={{ left: k.t * 100 + '%' }} onPointerDown={(e) => { e.stopPropagation(); selectKey(i) }} title={`Pose ${i + 1}`}>◆</button>)}
              <span ref={head} className="playhead" style={{ left: ((shownTime ?? 0) / dur) * 100 + '%' }} />
            </div>
            <p className="muted am-hint">Click a ◆ pose, pick a part, and change the sliders. Add more poses along the timeline — Gamey blends between them.</p>
          </div>
          <div className="am-right">
            <h4>{BONE_LABELS[bone] || bone} · pose {sel + 1} of {keys.length}</h4>
            {CONTROLS[mode].map(([title, props]) => (
              <div key={title} className="am-group">
                <b>{title}</b>
                {props.map(([p, label, min, max, step]) => {
                  const v = pv[p] !== undefined ? pv[p] : propDefault(p)
                  return (
                    <label key={p} className={'am-slider' + (pv[p] !== undefined ? ' set' : '')}>
                      <span>{label}</span>
                      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => setProp(p, Number(e.target.value))} onDoubleClick={() => resetProp(p)} />
                      <em>{round(v, 2)}</em>
                    </label>
                  )
                })}
              </div>
            ))}
            <button className="btn small" onClick={resetBone}>↺ Reset this part in this pose</button>
            <h4>Whole animation</h4>
            <label className="am-slider"><span>Pose time (s)</span><input type="range" min="0" max={dur} step="0.05" value={cur.t * dur} onChange={(e) => setKeyTime(Number(e.target.value))} /><em>{round(cur.t * dur, 2)}</em></label>
            <label className="am-slider"><span>Length (s)</span><input type="range" min="0.2" max="4" step="0.1" value={dur} onChange={(e) => setDur(Number(e.target.value))} /><em>{round(dur, 1)}</em></label>
            <label className="check"><input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Repeat forever</label>
            <label className="check"><input type="checkbox" checked={ease} onChange={(e) => setEase(e.target.checked)} /> Smooth movement</label>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>💾 Save animation</button>
        </div>
      </div>
    </div>
  )
}

export { POSE_PROPS }
