import React, { useMemo, useState } from 'react'
import { ANIMS, resolveAnim, resolveModel, modelBones, modelTemplate, animBones, animFit } from '../engine/index.js'
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

  // Animations are synced to the model's moving parts (its template): mark the ones that fit.
  const model = is3d && obj ? resolveModel(obj.model, project.models) : null
  const rig = is3d ? modelBones(model) : []
  const hasRig = rig.length > 1
  const tmpl = modelTemplate(model)
  const decorate = (arr) => arr.map((i) => {
    const a = resolveAnim(i.ref, project.anims, mode)
    const used = is3d ? animBones(a).filter((b) => b !== 'root').length : 0
    return { ...i, rigLike: used > 0, synced: used > 0 && animFit(a, rig) >= 0.5 }
  })
  const effFilter = filter === 'fit' && !hasRig ? 'all' : filter
  const list = decorate(tab === 'builtin' ? builtin : mine)
    .filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
    .filter((i) => {
      if (effFilter === 'all') return true
      if (effFilter === 'fit') return i.synced
      if (effFilter === 'rig') return i.rigLike
      if (effFilter === 'plain') return !i.rigLike
      return true
    })
  const item = decorate([...builtin, ...mine]).find((i) => i.ref === sel)
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
            {is3d && (
              <div className="chips">
                {[['all', 'All'], ...(hasRig ? [['fit', '✓ Fits my model']] : []), ['rig', 'Moves parts'], ['plain', 'Whole thing only']].map(([k, l]) => <button key={k} className={'chip' + (effFilter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>)}
              </div>
            )}
            <div className="lib-grid anim-grid">
              {tab === 'mine' && <button className="lib-tile make" onClick={onMake}><span>🎞️</span><b>Make an animation</b></button>}
              <div className={'lib-tile anim-tile' + (!sel ? ' on' : '')} onClick={() => setSel('')} onDoubleClick={() => onPick('')}>
                <span className="anim-icon">🚫</span><b>None</b>
              </div>
              {list.map((i) => (
                <div key={i.ref} className={'lib-tile anim-tile' + (i.ref === sel ? ' on' : '')} onClick={() => setSel(i.ref)} onDoubleClick={() => onPick(i.ref)} title={i.desc}>
                  <span className="anim-icon">{i.icon}</span>
                  {i.synced && <span className="fit-mark" title="Moves your model’s parts">✓</span>}
                  <b>{i.name}</b>
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
              {is3d && item && item.synced && <small className="tip">{tmpl ? `Synced to your ${tmpl.name} template — its parts move together.` : 'Moves this model’s parts.'}</small>}
              {is3d && item && item.rigLike && !item.synced && hasRig && <small className="tip">This model has no parts on the pieces this animation moves, so only the whole object will change.</small>}
              {is3d && item && !hasRig && model && model.parts && <small className="tip">This model has no moving parts yet — open it in the Model maker, pick its Template (Person, Car…) and press 🪄 Fit my parts.</small>}
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
