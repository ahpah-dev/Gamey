import React, { useMemo, useRef, useState } from 'react'
import { SPRITES, MODELS, SPRITE_GROUPS, MODEL_GROUPS } from '../engine/index.js'
import { modelThumb, spriteThumb } from './lib.js'

/** Modal library: pick a built-in or custom sprite (2D) / model (3D). */
export default function Picker({ mode, project, current, startTab, onPick, onClose, onMake, onRemix, onEdit, onDelete, onImportFile, title }) {
  const is3d = mode === '3d'
  const [tab, setTab] = useState(startTab || (current && current.startsWith('c:') ? 'mine' : 'builtin'))
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('All')
  const groups = is3d ? MODEL_GROUPS : SPRITE_GROUPS
  const fileRef = useRef(null)

  const builtin = useMemo(
    () => Object.entries(is3d ? MODELS : SPRITES).map(([id, m]) => ({ ref: 'b:' + id, name: m.name, color: m.color, builtin: true, group: Object.keys(groups).find((g) => groups[g].includes(id)) })),
    [is3d, groups],
  )
  const mine = Object.entries(is3d ? project.models : project.assets)
    .filter(([, v]) => (is3d ? true : true))
    .map(([id, v]) => ({ ref: 'c:' + id, name: v.name, color: v.color, pixel: v.pixel, kind: v.mesh ? 'mesh' : 'parts', builtin: false }))
  const list = (tab === 'builtin' ? builtin : mine).filter((i) => i.name.toLowerCase().includes(q.toLowerCase())).filter((i) => tab !== 'builtin' || group === 'All' || i.group === group)
  const img = (i) => (is3d ? modelThumb(i.ref, project.models, i.color) : spriteThumb(i.ref, project.assets))

  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal picker-modal" role="dialog" aria-label={title}>
        <div className="modal-head">
          <h2>{title || (is3d ? '🧊 Choose a 3D model' : '🖼️ Choose a sprite')}</h2>
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-tools">
          <div className="tabs">
            <button className={tab === 'builtin' ? 'on' : ''} onClick={() => setTab('builtin')}>⭐ Built-in <em>{builtin.length}</em></button>
            <button className={tab === 'mine' ? 'on' : ''} onClick={() => setTab('mine')}>🎨 My creations <em>{mine.length}</em></button>
          </div>
          <input className="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {tab === 'builtin' && (
          <div className="chips">
            {['All', ...Object.keys(groups)].map((g) => <button key={g} className={'chip' + (group === g ? ' on' : '')} onClick={() => setGroup(g)}>{g}</button>)}
          </div>
        )}
        <div className="lib-grid">
          {tab === 'mine' && (
            <>
              <button className="lib-tile make" onClick={onMake}>
                <span>{is3d ? '🛠️' : '✏️'}</span><b>{is3d ? 'Build a model' : 'Draw a sprite'}</b>
              </button>
              <button className="lib-tile make" onClick={() => fileRef.current.click()}>
                <span>📁</span><b>{is3d ? 'Import .obj file' : 'Import a picture'}</b>
              </button>
              <input ref={fileRef} hidden type="file" accept={is3d ? '.obj' : 'image/*'} onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImportFile(f) }} />
            </>
          )}
          {list.map((i) => (
            <div key={i.ref} className={'lib-tile' + (i.ref === current ? ' on' : '')} onClick={() => onPick(i.ref)} title={i.name}>
              <span className="lib-art"><img src={img(i)} alt="" draggable="false" style={i.pixel ? { imageRendering: 'pixelated' } : undefined} /></span>
              <b>{i.name}</b>
              <span className="lib-actions">
                {i.builtin && <button title="Make your own copy to edit" onClick={(e) => { e.stopPropagation(); onRemix(i) }}>✏️ Remix</button>}
                {!i.builtin && (is3d ? i.kind === 'parts' : i.pixel) && <button title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(i) }}>✏️</button>}
                {!i.builtin && <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(i) }}>🗑</button>}
              </span>
            </div>
          ))}
          {tab === 'mine' && mine.length === 0 && (
            <p className="muted lib-empty">
              {is3d
                ? 'Nothing yet! Build a model from simple shapes, remix a built-in one, or import a .obj file from Blender or other 3D programs.'
                : 'Nothing yet! Draw pixel art, remix a built-in sprite, or import your own PNG, JPG, GIF or SVG picture.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
