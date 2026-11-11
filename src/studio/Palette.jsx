import React from 'react'
import { SHAPES, PRESETS } from '../engine/index.js'

export default function Palette({ mode, objects, selectedId, onAdd, onSelect, onToggle, onMove, onDelete }) {
  const typeIcon = (o) => (o.type === 'emoji' ? o.emoji : o.type === 'text' ? '🔤' : null)
  return (
    <div className="palette">
      <div className="pane">
        <h3 className="pane-title">➕ Add to your game</h3>
        <h4>Characters & items</h4>
        <div className="tiles">
          {PRESETS[mode].map((p) => (
            <button key={p.label} className="tile" title={p.label} onClick={() => onAdd(p.make())}>
              <span className="tile-icon">{p.icon}</span><small>{p.label}</small>
            </button>
          ))}
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
          {objects.map((o, i) => (
            <li key={o.id} className={o.id === selectedId ? 'on' : ''} onClick={() => onSelect(o.id)}>
              <span className="dot" style={{ background: typeIcon(o) ? 'transparent' : o.color }}>{typeIcon(o)}</span>
              <span className="oname">{o.name}</span>
              <span className="row-actions">
                <button title="Show / hide" onClick={(e) => { e.stopPropagation(); onToggle(o.id) }}>{o.visible === false ? '🙈' : '👁'}</button>
                <button title="Move up" disabled={i === objects.length - 1} onClick={(e) => { e.stopPropagation(); onMove(o.id, 1) }}>▲</button>
                <button title="Move down" disabled={i === 0} onClick={(e) => { e.stopPropagation(); onMove(o.id, -1) }}>▼</button>
                <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(o.id) }}>🗑</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
