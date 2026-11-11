import React, { useState } from 'react'
import { SHAPES, PRESETS, PRESET_CATS, SPRITES, MODELS } from '../engine/index.js'
import { modelThumb, spriteThumb } from './lib.js'

const CAT_ICON = { Heroes: '🦸', Enemies: '👾', Items: '💎', World: '🌍', Scenes: '📺', Friends: '🐾' }

export default function Palette({ mode, project, objects, selectedId, onAdd, onSelect, onToggle, onMove, onDelete, onBrowse, onAddRef, room }) {
  const is3d = mode === '3d'
  const [cat, setCat] = useState('Heroes')
  const quick = Object.entries(is3d ? MODELS : SPRITES).slice(0, 8).map(([id, m]) => ({ ref: 'b:' + id, name: m.name, color: m.color }))
  const mineCount = Object.keys(is3d ? project.models : project.assets).length
  const typeIcon = (o) => (o.type === 'emoji' ? o.emoji : o.type === 'text' ? '🔤' : null)
  const rooms = project.rooms || []
  const roomName = (id) => (rooms.find((r) => r.id === id) || {}).name
  return (
    <div className="palette">
      <div className="pane">
        <h3 className="pane-title">➕ Add to your game</h3>
        <h4>Characters & items</h4>
        <div className="chips cats">
          {PRESET_CATS[mode].map((c) => <button key={c} className={'chip' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{CAT_ICON[c]} {c}</button>)}
        </div>
        <div className="tiles">
          {PRESETS[mode].filter((p) => p.cat === cat).map((p) => (
            <button key={p.label} className="tile" title={p.label} onClick={() => onAdd(p.make())}>
              <span className="tile-icon">{p.icon}</span><small>{p.label}</small>
            </button>
          ))}
        </div>
        <h4>{is3d ? '3D models' : 'Sprites'}</h4>
        <div className="tiles">
          {quick.map((i) => (
            <button key={i.ref} className="tile" title={i.name} onClick={() => onAddRef(i.ref)}>
              <img className="tile-img" src={is3d ? modelThumb(i.ref, project.models, i.color) : spriteThumb(i.ref, project.assets)} alt="" /><small>{i.name}</small>
            </button>
          ))}
          <button className="tile wide-tile" onClick={() => onBrowse('builtin')}><span className="tile-icon">🔎</span><small>Browse all</small></button>
          <button className="tile wide-tile accent" onClick={() => onBrowse('mine')}><span className="tile-icon">🎨</span><small>My creations{mineCount ? ` (${mineCount})` : ''}</small></button>
        </div>
        <h4>Shapes</h4>
        <div className="tiles">
          {SHAPES[mode].map((s) => (
            <button key={s.label} className="tile" title={s.label} onClick={() => onAdd({ type: s.type, name: s.label, ...s.make() })}>
              <span className="tile-icon">{s.icon}</span><small>{s.label}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="pane objects">
        <h3 className="pane-title">📋 Objects <em>{objects.length}</em></h3>
        {objects.length === 0 && <p className="muted pad">Nothing here yet. Click a tile above to add something!</p>}
        <ul>
          {objects.map((o, i) => {
            const other = rooms.length > 0 && o.room && o.room !== room
            return (
              <li key={o.id} className={(o.id === selectedId ? 'on' : '') + (other ? ' other' : '')} onClick={() => onSelect(o.id)}>
                <span className="dot" style={{ background: typeIcon(o) || o.type === 'sprite' || o.model ? 'transparent' : o.color }}>
                  {o.type === 'sprite' ? <img src={spriteThumb(o.sprite, project.assets)} alt="" /> : o.model ? <img src={modelThumb(o.model, project.models, o.color)} alt="" /> : typeIcon(o)}
                </span>
                <span className="oname">{o.name}{rooms.length > 0 && o.room && <small className="room-tag">{roomName(o.room)}</small>}</span>
                <span className="row-actions">
                  <button title="Show / hide" onClick={(e) => { e.stopPropagation(); onToggle(o.id) }}>{o.visible === false ? '🙈' : '👁'}</button>
                  <button title="Move up" disabled={i === objects.length - 1} onClick={(e) => { e.stopPropagation(); onMove(o.id, 1) }}>▲</button>
                  <button title="Move down" disabled={i === 0} onClick={(e) => { e.stopPropagation(); onMove(o.id, -1) }}>▼</button>
                  <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(o.id) }}>🗑</button>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
