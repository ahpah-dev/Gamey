import React, { useMemo, useState } from 'react'
import { ANIMS, resolveAnim } from '../engine/index.js'
import AnimPreview from './AnimPreview.jsx'

const SLOT_TITLE = { anim: 'Standing still', animMove: 'When moving', animAir: 'In the air', animClick: 'When clicked' }

/** Modal library of animations with a live preview on the object you are editing. */
export default function AnimPicker({ mode, project, obj, slot, current, startTab, onPick, onClose, onMake, onRemix, onEdit, onDelete }) {
  const is3d = mode === '3d'
  const [tab, setTab] = useState(startTab || (current && current.startsWith('c:') ? 'mine' : 'builtin'))
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sel, setSel] = useState(current || '')

  const builtin = useMemo(
    () => Object.entries(ANIMS[mode]).map(([id, a]) => ({ ref: 'b:' + id, name: a.name, icon: a.icon, desc: a.desc, rig: a.rig, builtin: true })),
    [mode],
  )
  const mine = Object.entries(project.anims).map(([id, a]) => ({ ref: 'c:' + id, name: a.name, icon: '🎞️', desc: `${(a.keys || []).length} poses · ${a.dur}s`, builtin: false }))
  const list = (tab === 'builtin' ? builtin : mine)
    .filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
    .filter((i) => filter === 'all' || tab !== 'builtin' || (filter === 'rig' ? i.rig : !i.rig))
  const item = [...builtin, ...mine].find((i) => i.ref === sel)
  const anim = resolveAnim(sel, project.anims, mode)

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal anim-modal" role="dialog" aria-label="Choose an animation">
        <div className="modal-head">
          <h2>🎬 Animation · {SLOT_TITLE[slot] || 'Choose'}</h2>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="anim-body">
          <div className="anim-left">
            <div className="modal-tools">
              <div className="tabs">
                <button className={tab === 'builtin' ? 'on' : ''} onClick={() => setTab('builtin')}>⭐ Built-in <em>{builtin.length}</em></button>
                <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>🎨 My animations <em>{mine.length}</em></button>
              </div>
              <input className="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {tab === 'builtin' && is3d && (
              <div className="chips">
                {[['all', 'All'], ['any', 'Anything'], ['rig', 'Characters & more']].map(([k, l]) => <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>)}
              </div>
            )}
            <div className="lib-grid anim-grid">
              {tab === 'mine' && <button className="lib-tile make" onClick={onMake}><span>🎞️</span><b>Make an animation</b></button>}
              <div className={'lib-tile anim-tile' + (!sel ? ' on' : '')} onClick={() => setSel('')} onDoubleClick={() => onPick('')}>
                <span className="anim-icon">🚫</span><b>None</b>
              </div>
              {list.map((i) => (
                <div key={i.ref} className={'lib-tile anim-tile' + (i.ref === sel ? ' on' : '')} onClick={() => setSel(i.ref)} onDoubleClick={() => onPick(i.ref)} title={i.desc}>
                  <span className="anim-icon">{i.icon}</span><b>{i.name}</b>
                </div>
              ))}
              {tab === 'mine' && mine.length === 0 && <p className="muted lib-empty">Nothing yet! Make your own animation, or press Remix on a built-in one to change it.</p>}
            </div>
          </div>
          <div className="anim-right">
            <AnimPreview mode={mode} project={project} obj={obj} anim={anim} playing />
            <div className="anim-info">
              <strong>{item ? item.name : 'No animation'}</strong>
              <small>{item ? item.desc : 'The object stays still.'}</small>
              {is3d && item && item.builtin && item.rig && <small className="tip">Moves the parts of people & animals. Things without those parts just wiggle as a whole.</small>}
            </div>
            <div className="anim-actions">
              <button className="btn primary" onClick={() => onPick(sel)}>✔ Use this</button>
              {item && item.builtin && <button className="btn" onClick={() => onRemix(item)} title="Make your own copy to change">✏️ Remix</button>}
              {item && !item.builtin && <button className="btn" onClick={() => onEdit(item)}>✏️ Edit</button>}
              {item && !item.builtin && <button className="btn" onClick={() => onDelete(item)}>🗑</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
