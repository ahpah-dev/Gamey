import React, { useEffect, useRef, useState } from 'react'
import { BEHAVIORS, BEHAVIOR_GROUPS, behaviorDefaults, resolveModel, modelTemplate } from '../engine/index.js'
import { modelThumb, spriteThumb, animInfo } from './lib.js'

const SWATCHES = ['#ff7675', '#fd79a8', '#fdcb6e', '#f7a35c', '#55efc4', '#00b894', '#74b9ff', '#0984e3', '#a29bfe', '#6c5ce7', '#ffffff', '#b2bec3', '#636e72', '#2d3436', '#c8923e', '#55c26b']
const EMOJIS = ['😀', '😎', '🐱', '🐶', '🦊', '🐸', '🐵', '🐼', '🦄', '🐢', '🐙', '🦖', '🚀', '🛸', '👾', '👻', '🤖', '⭐', '🌟', '💎', '🟡', '❤️', '🍎', '🍌', '🍉', '🍓', '🍩', '🍕', '⚽', '🏀', '🎈', '🎁', '🔑', '🚪', '🏁', '🔺', '💣', '🔥', '⚡', '🌳', '🌵', '🌈', '☁️', '☀️', '🌙', '🏠', '🚗', '✈️']
export const SKIES = {
  Sky: ['#5b8def', '#cdeeff'], Sunset: ['#fd79a8', '#ffeaa7'], Night: ['#0f0c29', '#302b63'], Mint: ['#55efc4', '#dffcf2'],
  Candy: ['#ffb199', '#ff0844'], Ocean: ['#0984e3', '#74b9ff'], Meadow: ['#badc58', '#f6ffd9'], Dusk: ['#6c5ce7', '#fab1a0'],
}

const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d

export function NumField({ label, value, onChange, step = 1, min }) {
  const [text, setText] = useState(String(round(value)))
  const focus = useRef(false)
  useEffect(() => { if (!focus.current) setText(String(round(value))) }, [value])
  const commit = (t) => {
    setText(t)
    const n = parseFloat(t)
    if (Number.isFinite(n)) onChange(min !== undefined ? Math.max(min, n) : n)
  }
  return (
    <label className="num">
      <span>{label}</span>
      <input
        type="number" step={step} value={text}
        onFocus={() => { focus.current = true }} onBlur={() => { focus.current = false; setText(String(round(value))) }}
        onChange={(e) => commit(e.target.value)}
      />
    </label>
  )
}

function Section({ title, icon, children, right }) {
  return (
    <section className="sec">
      <h3><span>{icon}</span> {title} <em>{right}</em></h3>
      {children}
    </section>
  )
}

export function ColorPicker({ value, onChange }) {
  return (
    <div className="swatches">
      {SWATCHES.map((c) => (
        <button key={c} className={'sw' + (c === value ? ' on' : '')} style={{ background: c }} onClick={() => onChange(c)} aria-label={c} />
      ))}
      <label className="sw custom" title="Pick any color" style={{ background: value }}>
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#6c5ce7'} onChange={(e) => onChange(e.target.value)} />
        <span>🎨</span>
      </label>
    </div>
  )
}

function ParamControl({ k, spec, value, onChange, is3d, project, obj }) {
  if (spec.type === 'select') {
    return (
      <label className="param">
        <span>{spec.label}</span>
        <select value={value} onChange={(e) => onChange(spec.num ? Number(e.target.value) : e.target.value)}>
          {spec.options.filter((o) => !o[2] || (o[2] === '3d') === is3d || is3d).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
    )
  }
  if (spec.type === 'room') {
    const rooms = project.rooms || []
    return (
      <label className="param">
        <span>{spec.label}</span>
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{rooms.length ? 'Pick a screen…' : 'Add screens first'}</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </label>
    )
  }
  if (spec.type === 'route') {
    const rooms = project.rooms || [], list = value || []
    const set = (i, patch) => onChange(list.map((r, j) => (j === i ? { ...r, ...patch } : r)))
    return (
      <div className="route">
        <span className="lbl">{spec.label} <small>(it starts where you put it, then visits these)</small></span>
        {list.map((r, i) => (
          <div key={i} className="route-row">
            <b>{i + 1}</b>
            <select value={r.room} onChange={(e) => set(i, { room: e.target.value })}>
              <option value="">Screen…</option>
              {rooms.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <NumField label="X" value={r.x ?? obj.x} step={10} onChange={(v) => set(i, { x: v })} />
            <NumField label="Y" value={r.y ?? obj.y} step={10} onChange={(v) => set(i, { y: v })} />
            <button className="x" title="Remove stop" onClick={() => onChange(list.filter((_, j) => j !== i))}>✕</button>
          </div>
        ))}
        <button className="btn small" disabled={!rooms.length} onClick={() => onChange([...list, { room: rooms[0] ? rooms[0].id : '', x: obj.x, y: obj.y }])}>＋ Add a stop</button>
        {!rooms.length && <small className="muted">Add screens to your game first (click the empty scene, then “Screens”).</small>}
        {list.length > 0 && <small className="muted">The last stop is where it attacks from.</small>}
      </div>
    )
  }
  return (
    <label className="param">
      <span>{spec.label}</span>
      <input type="range" min={spec.min} max={spec.max} step={spec.step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <b>{value}</b>
    </label>
  )
}

function PowerCard({ b, is3d, onChange, onRemove, project, obj }) {
  const schema = BEHAVIORS[b.type]
  if (!schema) return null
  return (
    <div className="power" style={{ '--c': schema.color }}>
      <div className="power-head">
        <span className="power-icon">{schema.icon}</span>
        <div><strong>{schema.label}</strong><small>{schema.desc}</small></div>
        <button className="x" title="Remove power" onClick={onRemove}>✕</button>
      </div>
      {Object.entries(schema.params).map(([k, spec]) => (
        <ParamControl key={k} k={k} spec={spec} is3d={is3d} project={project} obj={obj} value={b[k] ?? spec.default} onChange={(v) => onChange(k, v)} />
      ))}
    </div>
  )
}

function PowerPicker({ existing, onPick, onClose, mode }) {
  return (
    <div className="picker">
      <div className="picker-head"><strong>Choose a power ✨</strong><button className="x" onClick={onClose}>✕</button></div>
      {BEHAVIOR_GROUPS.filter((g) => Object.values(BEHAVIORS).some((s) => s.group === g && (!s.only || s.only === mode))).map((g) => (
        <div key={g}>
          <h4>{g}</h4>
          <div className="picker-grid">
            {Object.entries(BEHAVIORS).filter(([, s]) => s.group === g && (!s.only || s.only === mode)).map(([type, s]) => {
              const has = existing.includes(type)
              return (
                <button key={type} disabled={has} style={{ '--c': s.color }} onClick={() => onPick(type)} title={s.desc}>
                  <span>{s.icon}</span><b>{s.label}</b><small>{s.desc}</small>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function RoomSettings({ project, onChange }) {
  const rooms = project.rooms || []
  const setRooms = (fn, key) => onChange((p) => ({ ...p, rooms: fn(p.rooms || []) }), { key })
  const patch = (id, ch, key) => setRooms((rs) => rs.map((r) => (r.id === id ? { ...r, ...ch } : r)), key)
  const addFirst = () => onChange((p) => {
    const id = 'r' + Date.now().toString(36)
    return { ...p, rooms: [{ id, name: 'Screen 1', bg: null, pan: false }], objects: p.objects.map((o) => (o.room ? o : { ...o, room: id })) }
  })
  return (
    <Section title="Screens" icon="📺" right={rooms.length || ''}>
      <p className="muted">Screens are separate views of your game — like rooms or security cameras. Buttons can jump between them.</p>
      {rooms.map((r, i) => (
        <div key={r.id} className="room-card">
          <input className="wide" value={r.name} onChange={(e) => patch(r.id, { name: e.target.value }, 'rn' + r.id)} aria-label="Screen name" />
          <label className="check"><input type="checkbox" checked={!!r.pan} onChange={(e) => patch(r.id, { pan: e.target.checked })} /> Look around with the mouse</label>
          <div className="skies small">
            <button title="Game sky" className={!r.bg ? 'on' : ''} style={{ background: `linear-gradient(${project.background[0]},${project.background[1]})` }} onClick={() => patch(r.id, { bg: null })} />
            {Object.entries(SKIES).map(([n, c]) => <button key={n} title={n} className={r.bg && r.bg[0] === c[0] ? 'on' : ''} style={{ background: `linear-gradient(${c[0]},${c[1]})` }} onClick={() => patch(r.id, { bg: c })} />)}
          </div>
          {i > 0 && <button className="btn small" onClick={() => setRooms((rs) => { const a = rs.slice(); [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })}>◀ Move earlier</button>}
        </div>
      ))}
      <button className="btn" onClick={rooms.length ? () => setRooms((rs) => [...rs, { id: 'r' + Date.now().toString(36), name: 'Screen ' + (rs.length + 1), bg: null, pan: false }]) : addFirst}>＋ {rooms.length ? 'Add a screen' : 'Use screens in this game'}</button>
      {rooms.length > 0 && <p className="muted">The first screen is where the game starts. Use the tabs above the scene to switch between them.</p>}
    </Section>
  )
}

export function GameSettings({ project, onChange, onResetCamera }) {
  const set = (patch) => onChange((p) => ({ ...p, ...patch }), { key: 'game' })
  const setSettings = (patch) => onChange((p) => ({ ...p, settings: { ...p.settings, ...patch } }), { key: 'game' })
  return (
    <div className="inspector-body">
      <div className="empty-hint">👆 Click something in the scene to edit it — or change your whole game here.</div>
      <Section title="Game" icon="🎮">
        <label className="field"><span>Name</span><input value={project.name} onChange={(e) => set({ name: e.target.value })} /></label>
        <label className="field"><span>Lives</span>
          <input type="range" min="0" max="9" value={project.settings.lives} onChange={(e) => setSettings({ lives: Number(e.target.value) })} />
          <b>{project.settings.lives || '∞'}</b>
        </label>
        <label className="field"><span>You win when…</span>
          <select value={project.settings.win} onChange={(e) => setSettings({ win: e.target.value })}>
            <option value="auto">Reach the goal / get all coins</option>
            <option value="none">Never (just play!)</option>
          </select>
        </label>
        <label className="field"><span>Win by surviving</span>
          <input type="range" min="0" max="300" step="10" value={project.settings.survive || 0} onChange={(e) => setSettings({ survive: Number(e.target.value) })} />
          <b>{project.settings.survive ? project.settings.survive + 's' : 'off'}</b>
        </label>
        {project.mode === '2d' && (
          <label className="check pad0" title="Shows a clock (12 AM to 6 AM) and a power meter. Switches use power!">
            <input type="checkbox" checked={!!project.settings.night} onChange={(e) => setSettings({ night: e.target.checked, ...(e.target.checked && !project.settings.survive ? { survive: 120 } : {}) })} /> 🌙 Night mode (clock + power)
          </label>
        )}
        <label className="check pad0"><input type="checkbox" checked={project.settings.sound !== false} onChange={(e) => setSettings({ sound: e.target.checked })} /> Sound effects</label>
      </Section>
      {project.mode === '2d' && <RoomSettings project={project} onChange={onChange} />}
      <Section title="Sky" icon="🌈">
        <div className="skies">
          {Object.entries(SKIES).map(([n, c]) => (
            <button key={n} title={n} className={project.background[0] === c[0] && project.background[1] === c[1] ? 'on' : ''}
              style={{ background: `linear-gradient(${c[0]},${c[1]})` }} onClick={() => set({ background: c })} />
          ))}
        </div>
      </Section>
      {project.mode === '3d' && (
        <Section title="Camera" icon="🎥">
          <label className="field"><span>Zoom</span>
            <input type="range" min="6" max="40" value={project.camera.dist} onChange={(e) => onChange((p) => ({ ...p, camera: { ...p.camera, dist: Number(e.target.value) } }), { key: 'cam' })} />
          </label>
          <p className="muted">Orbit the scene to choose how the game camera looks. Give a character the “Camera follows me” power to chase it.</p>
          <button className="btn small" onClick={onResetCamera}>Reset camera angle</button>
        </Section>
      )}
    </div>
  )
}

export default function Inspector({ project, obj, onPatch, onBehavior, onChange, onDuplicate, onDelete, onResetCamera, onPickAsset, onPickAnim }) {
  const [picking, setPicking] = useState(false)
  useEffect(() => setPicking(false), [obj && obj.id])
  if (!obj) return <GameSettings project={project} onChange={onChange} onResetCamera={onResetCamera} />
  const is3d = project.mode === '3d'
  const tmpl = is3d && obj.model ? modelTemplate(resolveModel(obj.model, project.models)) : null
  const p = (patch, key) => onPatch(obj.id, patch, key || 'insp' + obj.id + Object.keys(patch)[0])
  const unit = is3d ? 0.5 : 10
  const hasColor = obj.type !== 'emoji' && obj.type !== 'sprite'
  return (
    <div className="inspector-body">
      <div className="obj-head">
        <input className="name" value={obj.name} onChange={(e) => p({ name: e.target.value })} />
        <button className="icon-btn" title="Duplicate (Ctrl+D)" onClick={onDuplicate}>⧉</button>
        <button className="icon-btn danger" title="Delete (Del)" onClick={onDelete}>🗑</button>
      </div>

      {obj.type === 'text' && (
        <Section title="Words" icon="🔤">
          <input className="wide" value={obj.text} onChange={(e) => p({ text: e.target.value, w: Math.round(e.target.value.length * obj.h * 0.62) })} />
        </Section>
      )}
      {obj.type === 'emoji' && (
        <Section title="Picture" icon="😀">
          <div className="emojis">{EMOJIS.map((e) => <button key={e} className={e === obj.emoji ? 'on' : ''} onClick={() => p({ emoji: e })}>{e}</button>)}</div>
          <input className="wide" placeholder="…or type any emoji" value={obj.emoji} onChange={(e) => p({ emoji: Array.from(e.target.value).slice(-2).join('') || obj.emoji })} />
        </Section>
      )}
      {obj.type === 'sprite' && (
        <Section title="Sprite" icon="🖼️">
          <div className="asset-row">
            <span className="asset-thumb"><img src={spriteThumb(obj.sprite, project.assets)} alt="" /></span>
            <button className="btn" onClick={onPickAsset}>Change sprite…</button>
          </div>
          <label className="check pad"><input type="checkbox" checked={!!obj.flip} onChange={(e) => p({ flip: e.target.checked })} /> Face left (flip)</label>
        </Section>
      )}
      {is3d && (
        <Section title="Model" icon="🧊">
          <div className="asset-row">
            <span className="asset-thumb">{obj.model ? <img src={modelThumb(obj.model, project.models, obj.color)} alt="" /> : <span className="plain">{{ sphere: '🔮', cylinder: '🛢️', cone: '🔺' }[obj.type] || '🧊'}</span>}</span>
            <div className="asset-btns">
              <button className="btn" onClick={onPickAsset}>{obj.model ? 'Change model…' : 'Use a model…'}</button>
              {obj.model && <button className="btn small" onClick={() => p({ model: null })}>Plain shape</button>}
            </div>
          </div>
        </Section>
      )}
      {hasColor && <Section title="Color" icon="🎨"><ColorPicker value={obj.color} onChange={(c) => p({ color: c }, 'color' + obj.id)} /></Section>}
      {is3d && obj.type === 'box' && !obj.model && (
        <label className="check pad"><input type="checkbox" checked={!!obj.pattern} onChange={(e) => p({ pattern: e.target.checked })} /> Checkered pattern</label>
      )}

      <Section title="Size & place" icon="📐">
        <div className="grid3">
          <NumField label="X" value={obj.x} step={unit} onChange={(v) => p({ x: v })} />
          <NumField label="Y" value={obj.y} step={unit} onChange={(v) => p({ y: v })} />
          {is3d ? <NumField label="Z" value={obj.z} step={unit} onChange={(v) => p({ z: v })} /> : <NumField label="Turn°" value={obj.rz || 0} step={5} onChange={(v) => p({ rz: v })} />}
          <NumField label="Width" value={obj.w} step={unit} min={0.1} onChange={(v) => p({ w: v })} />
          <NumField label="Height" value={obj.h} step={unit} min={0.1} onChange={(v) => p({ h: v })} />
          {is3d && <NumField label="Depth" value={obj.d} step={unit} min={0.1} onChange={(v) => p({ d: v })} />}
          {is3d && <NumField label="Tilt X°" value={obj.rx || 0} step={5} onChange={(v) => p({ rx: v })} />}
          {is3d && <NumField label="Turn Y°" value={obj.ry || 0} step={5} onChange={(v) => p({ ry: v })} />}
          {is3d && <NumField label="Tilt Z°" value={obj.rz || 0} step={5} onChange={(v) => p({ rz: v })} />}
        </div>
      </Section>

      <Section title="Animation" icon="🎬">
        {tmpl && (
          <button className="btn small" title="Give it the animations that go with its template" onClick={() => p({ anim: tmpl.anim.anim || null, animMove: tmpl.anim.animMove || null, animAir: tmpl.anim.animAir || null, animClick: tmpl.anim.animClick || null })}>
            ✨ Sync with the {tmpl.icon} {tmpl.name} template
          </button>
        )}
        {[['anim', 'Standing'], ['animMove', 'Moving'], ['animAir', 'In the air'], ['animClick', 'When clicked']].map(([slot, label]) => {
          const info = animInfo(obj[slot], project)
          return (
            <div key={slot} className="anim-row">
              <span>{label}</span>
              <button className="btn small anim-btn" onClick={() => onPickAnim(slot)}><i>{info.icon}</i> {info.name}</button>
              {obj[slot] && <button className="x" title="No animation" onClick={() => p({ [slot]: null })}>✕</button>}
            </div>
          )
        })}
        {(obj.anim || obj.animMove || obj.animAir || obj.animClick) && (
          <label className="param"><span>Speed</span><input type="range" min="0.25" max="3" step="0.25" value={obj.animSpeed || 1} onChange={(e) => p({ animSpeed: Number(e.target.value) })} /><b>{obj.animSpeed || 1}×</b></label>
        )}
        <p className="muted">Animations play on their own in the game. Try a “Moving” one for walking!{tmpl && ` Models with the ${tmpl.name} template all share the same moving parts, so animations stay in sync across them.`}</p>
      </Section>

      <Section title="Screens & switches" icon="🔀">
        {project.mode === '2d' && project.rooms.length > 0 && (
          <label className="field"><span>Shown on</span>
            <select value={obj.room || ''} onChange={(e) => p({ room: e.target.value })}>
              <option value="">Every screen</option>
              {project.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </label>
        )}
        <label className="field"><span>Show only when</span>
          <select value={obj.when ? obj.when.sw + (obj.when.on === false ? 'off' : 'on') : ''} onChange={(e) => { const v = e.target.value; p({ when: v ? { sw: Number(v[0]), on: v.slice(1) === 'on' } : null }) }}>
            <option value="">Always</option>
            {[1, 2, 3, 4, 5, 6].flatMap((n) => [<option key={n + 'on'} value={n + 'on'}>Switch {n} is ON</option>, <option key={n + 'off'} value={n + 'off'}>Switch {n} is OFF</option>])}
          </select>
        </label>
        {project.mode === '2d' && <label className="check"><input type="checkbox" checked={!!obj.hud} onChange={(e) => p({ hud: e.target.checked })} /> Stick to the screen (buttons, labels)</label>}
      </Section>

      <Section title="Powers" icon="✨" right={`${obj.behaviors.length}`}>
        {obj.behaviors.length === 0 && <p className="muted">No powers yet. Powers make things move, jump, score points and more!</p>}
        {obj.behaviors.map((b) => (
          <PowerCard key={b.type} b={b} is3d={is3d} project={project} obj={obj}
            onChange={(k, v) => onBehavior('patch', obj.id, b.type, { [k]: v })}
            onRemove={() => onBehavior('remove', obj.id, b.type)} />
        ))}
        <button className="btn add-power" onClick={() => setPicking(true)}>＋ Add a power</button>
      </Section>
      {picking && (
        <PowerPicker mode={project.mode} existing={obj.behaviors.map((b) => b.type)} onClose={() => setPicking(false)}
          onPick={(type) => { onBehavior('add', obj.id, type, behaviorDefaults(type)); setPicking(false) }} />
      )}
    </div>
  )
}
