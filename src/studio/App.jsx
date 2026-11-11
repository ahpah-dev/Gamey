import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GameCanvas, makeProject, normalizeProject, uid, encodeProject, decodeProject } from '../engine/index.js'
import { useProject, patchObject, addObject, removeObject, duplicateObject, moveInOrder, addBehavior, patchBehavior, removeBehavior, loadSaved, saveLocal } from './store.js'
import Viewport from './Viewport.jsx'
import Inspector from './Inspector.jsx'
import Palette from './Palette.jsx'
import Welcome, { Logo } from './Welcome.jsx'

const isTyping = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
const clone = (o) => JSON.parse(JSON.stringify(o))

export default function App() {
  const hist = useProject(makeProject())
  const { project } = hist
  const [view, setView] = useState('welcome') // welcome | studio | shared
  const [shared, setShared] = useState(null)
  const [selectedId, setSelected] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [toast, setToast] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [resetSignal, setResetSignal] = useState(0)
  const [saved] = useState(() => loadSaved())
  const cam2 = useRef({ x: 480, y: 270, zoom: 0.82 })
  const fileRef = useRef(null)
  const stageRef = useRef(null)

  const say = useCallback((msg) => { setToast(msg); clearTimeout(say.t); say.t = setTimeout(() => setToast(null), 2600) }, [])

  /* ---------- load shared link / saved game ---------- */
  useEffect(() => {
    const m = /[#&]play=([^&]+)/.exec(location.hash)
    if (!m) return
    decodeProject(m[1]).then((p) => { setShared(normalizeProject(p)); setView('shared') }).catch(() => say('That game link looks broken 😢'))
  }, [say])

  // autosave
  useEffect(() => {
    if (view !== 'studio') return undefined
    const t = setTimeout(() => saveLocal(project), 500)
    return () => clearTimeout(t)
  }, [project, view])

  const openProject = useCallback((p) => {
    const np = normalizeProject(clone(p))
    hist.reset(np)
    cam2.current = { x: np.world.w / 2, y: np.world.h / 2, zoom: 0.82 }
    setResetSignal((n) => n + 1)
    setSelected(null); setPlaying(false); setView('studio'); setDrawer(null)
    history.replaceState(null, '', location.pathname)
  }, [hist])

  /* ---------- editing ops ---------- */
  const onPatch = useCallback((id, patch, key) => hist.set(patchObject(id, patch), { key }), [hist])
  const onCamera = useCallback((camera) => hist.set((p) => ({ ...p, camera }), { silent: true }), [hist])
  const onChange = useCallback((fn, opts) => hist.set(fn, opts), [hist])

  const add = (partial) => {
    const p = hist.project
    const id = uid()
    let x, y, z
    const n = p.objects.length % 6
    if (p.mode === '3d') {
      const big = (partial.w || 2) >= 20
      x = big ? 0 : Math.round(p.camera.x * 2) / 2 + n * 0.5
      z = big ? 0 : Math.round(p.camera.z * 2) / 2 + n * 0.5
      y = partial.y ?? (partial.h ?? 2) / 2
    } else {
      x = Math.round(cam2.current.x / 10) * 10 + n * 20
      y = Math.round(cam2.current.y / 10) * 10 + n * 20
    }
    const e = { ...partial, id }
    if (e.x === undefined) e.x = x
    if (e.y === undefined) e.y = y
    if (p.mode === '3d' && e.z === undefined) e.z = z
    hist.set(addObject(e))
    setSelected(id)
    setDrawer(null)
  }

  const remove = (id) => { hist.set(removeObject(id)); if (selectedId === id) setSelected(null) }
  const duplicate = (id) => { const nid = uid(); hist.set(duplicateObject(id, nid)); setSelected(nid) }
  const behavior = (op, id, type, data) => {
    if (op === 'add') hist.set(addBehavior(id, data))
    else if (op === 'patch') hist.set(patchBehavior(id, type, data), { key: 'b' + id + type + Object.keys(data)[0] })
    else hist.set(removeBehavior(id, type))
  }
  const toggleVisible = (id) => hist.set((p) => ({ ...p, objects: p.objects.map((o) => (o.id === id ? { ...o, visible: o.visible === false } : o)) }))

  /* ---------- shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'studio') return
      if (e.key === 'Escape') { if (playing) setPlaying(false); else setSelected(null); return }
      if (playing || isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const sel = hist.project.objects.find((o) => o.id === selectedId)
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? hist.redo() : hist.undo() }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); hist.redo() }
      else if (mod && e.key.toLowerCase() === 'd' && sel) { e.preventDefault(); duplicate(sel.id) }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) { e.preventDefault(); remove(sel.id) }
      else if (e.key.toLowerCase() === 'p' && !mod) setPlaying(true)
      else if (sel && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = (hist.project.mode === '3d' ? 0.5 : 10) * (e.shiftKey ? 4 : 1)
        const patch = {}
        if (e.key === 'ArrowLeft') patch.x = sel.x - step
        if (e.key === 'ArrowRight') patch.x = sel.x + step
        if (e.key === 'ArrowUp') { if (hist.project.mode === '3d') patch.z = sel.z - step; else patch.y = sel.y - step }
        if (e.key === 'ArrowDown') { if (hist.project.mode === '3d') patch.z = sel.z + step; else patch.y = sel.y + step }
        onPatch(sel.id, patch, 'nudge' + sel.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /* ---------- files & sharing ---------- */
  const download = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = (project.name || 'my-game').replace(/[^\w-]+/g, '-').toLowerCase() + '.gamey.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    say('Game saved to your downloads 💾')
  }
  const onFile = (e) => {
    const f = e.target.files[0]
    e.target.value = ''
    if (!f) return
    f.text().then((t) => { openProject(JSON.parse(t)); say('Game opened 📂') }).catch(() => say("Hmm, that file isn't a Gamey game 😢"))
  }
  const share = async () => {
    const code = await encodeProject(project)
    const url = `${location.origin}${location.pathname}#play=${code}`
    try { await navigator.clipboard.writeText(url); say('Link copied! Send it to a friend 🔗') } catch { prompt('Copy this link:', url) }
  }
  const fullscreen = () => { const el = stageRef.current; if (el && el.requestFullscreen) el.requestFullscreen() }

  /* ---------- views ---------- */
  if (view === 'shared' && shared) {
    return (
      <div className="shared">
        <GameCanvas project={shared} />
        <div className="shared-bar">
          <Logo size={26} /><span>{shared.name}</span>
          <button className="btn small" onClick={() => { openProject(shared) }}>✏️ Edit this game</button>
        </div>
      </div>
    )
  }

  const fileInput = <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} />

  if (view === 'welcome') {
    return (
      <>
        <Welcome
          savedName={saved && saved.name}
          onPick={(t) => openProject(t.project)}
          onContinue={() => openProject(saved)}
          onOpen={() => fileRef.current.click()}
        />
        {fileInput}
        {toast && <div className="toast">{toast}</div>}
      </>
    )
  }

  const selected = project.objects.find((o) => o.id === selectedId) || null

  return (
    <div className="studio">
      <header className="bar">
        <button className="icon-btn only-narrow" onClick={() => setDrawer(drawer === 'left' ? null : 'left')} title="Add & objects">➕</button>
        <button className="brand" onClick={() => { if (confirm('Go back to the start screen? Your game is saved automatically.')) setView('welcome') }} title="Start screen"><Logo size={30} /></button>
        <input className="game-name" value={project.name} onChange={(e) => hist.set((p) => ({ ...p, name: e.target.value }), { key: 'name' })} aria-label="Game name" />
        <span className={'badge m' + project.mode}>{project.mode.toUpperCase()}</span>
        <div className="spacer" />
        <div className="group">
          <button className="icon-btn" disabled={!hist.canUndo} onClick={hist.undo} title="Undo (Ctrl+Z)">↶</button>
          <button className="icon-btn" disabled={!hist.canRedo} onClick={hist.redo} title="Redo (Ctrl+Y)">↷</button>
        </div>
        <div className="group hide-narrow">
          <button className="btn" onClick={() => fileRef.current.click()} title="Open a saved game">📂 Open</button>
          <button className="btn" onClick={download} title="Download your game">💾 Save</button>
          <button className="btn" onClick={share} title="Copy a link anyone can play">🔗 Share</button>
        </div>
        <button className={'btn play' + (playing ? ' stop' : '')} onClick={() => setPlaying(!playing)}>{playing ? '⏹ Stop' : '▶ Play'}</button>
        <button className="icon-btn only-narrow" onClick={() => setDrawer(drawer === 'right' ? null : 'right')} title="Properties">⚙️</button>
      </header>
      {fileInput}

      <main className={'work' + (drawer ? ' drawer-' + drawer : '')}>
        <aside className="left">
          <Palette
            mode={project.mode} objects={project.objects} selectedId={selectedId}
            onAdd={add} onSelect={(id) => { setSelected(id); setDrawer(null) }} onToggle={toggleVisible}
            onMove={(id, d) => hist.set(moveInOrder(id, d))} onDelete={remove}
          />
        </aside>
        <section className="center">
          {playing ? (
            <div className="stage" ref={stageRef}>
              <GameCanvas project={project} />
              <button className="fs-btn" onClick={fullscreen} title="Full screen">⛶</button>
              <div className="stage-hint">{project.mode === '3d' ? 'Arrows / WASD move · Space jumps · Drag to look around' : 'Arrows / WASD move · Space jumps'} · Esc to stop</div>
            </div>
          ) : (
            <Viewport
              project={project} selectedId={selectedId} onSelect={setSelected} onPatch={onPatch} onCamera={onCamera}
              resetSignal={resetSignal} cam2Ref={cam2}
            />
          )}
        </section>
        <aside className="right">
          <Inspector
            project={project} obj={selected} onPatch={onPatch} onBehavior={behavior} onChange={onChange}
            onDuplicate={() => selected && duplicate(selected.id)} onDelete={() => selected && remove(selected.id)}
            onResetCamera={() => hist.set((p) => ({ ...p, camera: { ...makeProject('3d').camera } }))}
          />
        </aside>
        {drawer && <div className="scrim" onClick={() => setDrawer(null)} />}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
