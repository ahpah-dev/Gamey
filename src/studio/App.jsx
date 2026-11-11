import React, { useCallback, useEffect, useRef, useState } from 'react'
import { GameCanvas, makeProject, normalizeProject, uid, encodeProject, decodeProject, SPRITES, MODELS, ANIMS, spriteSource, processImageFile, parseOBJ } from '../engine/index.js'
import { useProject, patchObject, addObject, removeObject, duplicateObject, moveInOrder, addBehavior, patchBehavior, removeBehavior, loadSaved, saveLocal } from './store.js'
import Viewport from './Viewport.jsx'
import Inspector from './Inspector.jsx'
import Palette from './Palette.jsx'
import Welcome, { Logo } from './Welcome.jsx'
import Picker from './Picker.jsx'
import PixelEditor from './PixelEditor.jsx'
import ModelMaker from './ModelMaker.jsx'
import AnimPicker from './AnimPicker.jsx'
import AnimMaker from './AnimMaker.jsx'
import { entityForRef } from './lib.js'

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
  const [picker, setPicker] = useState(null) // { purpose: 'add'|'assign', id?, tab? }
  const [editor, setEditor] = useState(null) // { kind: 'pixel'|'model', purpose, assetId?, init }
  const [room, setRoom] = useState('')
  const curRoom = project.rooms.some((r) => r.id === room) ? room : (project.rooms[0] ? project.rooms[0].id : '')
  const [animPick, setAnimPick] = useState(null) // { id, slot, tab? }
  const [animEd, setAnimEd] = useState(null) // { ctx, assetId?, init }
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
    setRoom(np.rooms[0] ? np.rooms[0].id : '')
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
    if (p.mode === '2d' && p.rooms.length && e.room === undefined) e.room = curRoom
    if (e.x === undefined) e.x = x
    if (e.y === undefined) e.y = y
    if (p.mode === '3d' && e.z === undefined) e.z = z
    hist.set(addObject(e))
    setSelected(id)
    setDrawer(null)
  }

  const selectObj = (id) => {
    setSelected(id); setDrawer(null)
    const o = id && hist.project.objects.find((x) => x.id === id)
    if (o && o.room && hist.project.rooms.some((r) => r.id === o.room)) setRoom(o.room)
  }
  const addRoom = () => {
    const id = 'r' + Date.now().toString(36)
    hist.set((p) => ({ ...p, rooms: [...p.rooms, { id, name: 'Screen ' + (p.rooms.length + 1), bg: null, pan: false }] }))
    setRoom(id)
  }
  const renameRoom = (id) => {
    const r = hist.project.rooms.find((x) => x.id === id)
    const name = r && prompt('Name this screen:', r.name)
    if (name && name.trim()) hist.set((p) => ({ ...p, rooms: p.rooms.map((x) => (x.id === id ? { ...x, name: name.trim() } : x)) }))
  }
  const deleteRoom = (id) => {
    const n = hist.project.objects.filter((o) => o.room === id).length
    if (!confirm(`Delete this screen${n ? ` and its ${n} object${n > 1 ? 's' : ''}` : ''}?`)) return
    hist.set((p) => ({ ...p, rooms: p.rooms.filter((r) => r.id !== id), objects: p.objects.filter((o) => o.room !== id) }))
    setSelected(null)
    setRoom((hist.project.rooms.find((r) => r.id !== id) || {}).id || '')
  }
  const remove = (id) => { hist.set(removeObject(id)); if (selectedId === id) setSelected(null) }
  const duplicate = (id) => { const nid = uid(); hist.set(duplicateObject(id, nid)); setSelected(nid) }
  const behavior = (op, id, type, data) => {
    if (op === 'add') hist.set(addBehavior(id, data))
    else if (op === 'patch') hist.set(patchBehavior(id, type, data), { key: 'b' + id + type + Object.keys(data)[0] })
    else hist.set(removeBehavior(id, type))
  }
  const toggleVisible = (id) => hist.set((p) => ({ ...p, objects: p.objects.map((o) => (o.id === id ? { ...o, visible: o.visible === false } : o)) }))

  /* ---------- animations ---------- */
  const putAnim = (id, data) => hist.set((p) => ({ ...p, anims: { ...p.anims, [id]: data } }))
  const pickAnim = (ref) => { const a = animPick; setAnimPick(null); if (a) onPatch(a.id, { [a.slot]: ref || null }) }
  const makeAnim = () => setAnimEd({ ctx: animPick, init: null })
  const remixAnim = (item) => { const a = ANIMS[hist.project.mode][item.ref.slice(2)]; setAnimEd({ ctx: animPick, init: { name: a.name + ' remix', dur: a.dur, loop: a.loop, ease: a.ease, keys: a.keys } }) }
  const editAnim = (item) => setAnimEd({ ctx: animPick, assetId: item.ref.slice(2), init: hist.project.anims[item.ref.slice(2)] })
  const deleteAnim = (item) => {
    if (!confirm(`Delete “${item.name}”? Things using it will stand still.`)) return
    hist.set((p) => { const m = { ...p.anims }; delete m[item.ref.slice(2)]; return { ...p, anims: m } })
  }
  const saveAnim = (data) => {
    const ed = animEd
    setAnimEd(null)
    if (ed.assetId) { putAnim(ed.assetId, data); setAnimPick({ ...ed.ctx, tab: 'mine' }); return }
    const id = uid()
    putAnim(id, data)
    if (ed.ctx && ed.ctx.id) onPatch(ed.ctx.id, { [ed.ctx.slot]: 'c:' + id })
    setAnimPick(null)
    say('Saved “' + data.name + '” 🎬')
  }

  /* ---------- sprites & models ---------- */
  const is3d = project.mode === '3d'
  const key = is3d ? 'models' : 'assets'
  const putAsset = (id, data) => hist.set((p) => ({ ...p, [key]: { ...p[key], [id]: data } }))
  const afterCreate = (id, data, purpose) => {
    putAsset(id, data)
    const ref = 'c:' + id
    if (purpose && purpose.purpose === 'assign' && purpose.id) onPatch(purpose.id, is3d ? { model: ref } : { sprite: ref, type: 'sprite' })
    else if (purpose) {
      const p2 = { ...hist.project, [key]: { ...hist.project[key], [id]: data } }
      add(entityForRef(p2.mode, ref, p2))
    }
  }
  const pickRef = (ref) => {
    const purpose = picker
    setPicker(null)
    if (purpose && purpose.purpose === 'assign' && purpose.id) onPatch(purpose.id, is3d ? { model: ref } : { sprite: ref, type: 'sprite' })
    else add(entityForRef(project.mode, ref, project))
  }
  const makeNew = () => setEditor({ kind: is3d ? 'model' : 'pixel', purpose: picker, init: null })
  const remix = (item) => {
    const id = item.ref.slice(2)
    if (is3d) { const m = MODELS[id]; setEditor({ kind: 'model', purpose: picker, init: { name: m.name + ' remix', color: m.color, size: m.size, parts: m.parts, bones: m.bones } }) }
    else setEditor({ kind: 'pixel', purpose: picker, init: { name: SPRITES[id].name + ' remix', src: spriteSource(item.ref).src, n: 32 } })
  }
  const editAsset = (item) => {
    const id = item.ref.slice(2)
    const a = project[key][id]
    if (is3d) setEditor({ kind: 'model', assetId: id, init: a })
    else setEditor({ kind: 'pixel', assetId: id, init: { name: a.name, src: a.data, n: a.w } })
  }
  const deleteAsset = (item) => {
    if (!confirm(`Delete “${item.name}”? Things using it will look empty.`)) return
    hist.set((p) => { const m = { ...p[key] }; delete m[item.ref.slice(2)]; return { ...p, [key]: m } })
  }
  const importFile = async (f) => {
    try {
      const name = f.name.replace(/\.[^.]+$/, '').slice(0, 30) || 'Imported'
      const id = uid()
      if (is3d) afterCreate(id, { name, kind: 'mesh', color: '#a29bfe', mesh: (({ pos, nor }) => ({ pos, nor }))(parseOBJ(await f.text())) }, picker)
      else { const { data, w, h } = await processImageFile(f); afterCreate(id, { name, data, w, h, pixel: false }, picker) }
      setPicker(null)
      say('Imported “' + name + '” ✨')
    } catch (e) { say(e.message || 'Could not import that file 😢') }
  }
  const saveEditor = (data) => {
    const ed = editor
    setEditor(null)
    if (ed.assetId) { putAsset(ed.assetId, data); setPicker({ purpose: null, tab: 'mine' }); return }
    afterCreate(uid(), data, ed.purpose)
    setPicker(null)
    say('Saved “' + data.name + '” 🎉')
  }

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
  const animCtx = animPick || (animEd && animEd.ctx)
  const animTarget = animCtx ? project.objects.find((o) => o.id === animCtx.id) || null : null

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
            mode={project.mode} project={project} objects={project.objects} selectedId={selectedId}
            onBrowse={(tab) => setPicker({ purpose: 'add', tab })} onAddRef={(ref) => add(entityForRef(project.mode, ref, project))}
            room={curRoom} onAdd={add} onSelect={selectObj} onToggle={toggleVisible}
            onMove={(id, d) => hist.set(moveInOrder(id, d))} onDelete={remove}
          />
        </aside>
        <section className="center">
          {!playing && project.mode === '2d' && project.rooms.length > 0 && (
            <div className="roombar">
              {project.rooms.map((r) => (
                <button key={r.id} className={'room-tab' + (r.id === curRoom ? ' on' : '')} onClick={() => setRoom(r.id)} onDoubleClick={() => renameRoom(r.id)} title="Double-click to rename">📺 {r.name}</button>
              ))}
              <button className="room-tab add" onClick={addRoom} title="Add a screen">＋</button>
              <button className="room-tab" onClick={() => renameRoom(curRoom)} title="Rename this screen">✎</button>
              <button className="room-tab" onClick={() => deleteRoom(curRoom)} title="Delete this screen">🗑</button>
            </div>
          )}
          {playing ? (
            <div className="stage" ref={stageRef}>
              <GameCanvas project={project} />
              <button className="fs-btn" onClick={fullscreen} title="Full screen">⛶</button>
              <div className="stage-hint">{project.mode === '3d' ? 'Arrows / WASD move · Space jumps · Drag to look around' : project.rooms.length ? 'Mouse looks around · Click buttons' : 'Arrows / WASD move · Space jumps · X shoots'} · Esc to stop</div>
            </div>
          ) : (
            <Viewport
              project={project} selectedId={selectedId} onSelect={selectObj} onPatch={onPatch} onCamera={onCamera}
              resetSignal={resetSignal} cam2Ref={cam2} room={curRoom}
            />
          )}
        </section>
        <aside className="right">
          <Inspector
            project={project} obj={selected} onPatch={onPatch} onBehavior={behavior} onChange={onChange}
            onPickAsset={() => selected && setPicker({ purpose: 'assign', id: selected.id })}
            onPickAnim={(slot) => selected && setAnimPick({ id: selected.id, slot })}
            onDuplicate={() => selected && duplicate(selected.id)} onDelete={() => selected && remove(selected.id)}
            onResetCamera={() => hist.set((p) => ({ ...p, camera: { ...makeProject('3d').camera } }))}
          />
        </aside>
        {drawer && <div className="scrim" onClick={() => setDrawer(null)} />}
      </main>
      {picker && !editor && (
        <Picker
          mode={project.mode} project={project} current={picker.id && (project.objects.find((o) => o.id === picker.id) || {})[is3d ? 'model' : 'sprite']}
          startTab={picker.tab} onClose={() => setPicker(null)} onPick={pickRef}
          onMake={makeNew} onRemix={remix} onEdit={editAsset} onDelete={deleteAsset} onImportFile={importFile}
        />
      )}
      {animPick && !animEd && (
        <AnimPicker
          mode={project.mode} project={project} obj={animTarget} slot={animPick.slot} current={animTarget && animTarget[animPick.slot]} startTab={animPick.tab}
          onClose={() => setAnimPick(null)} onPick={pickAnim} onMake={makeAnim} onRemix={remixAnim} onEdit={editAnim} onDelete={deleteAnim}
        />
      )}
      {animEd && <AnimMaker mode={project.mode} project={project} obj={animTarget} initial={animEd.init} onClose={() => setAnimEd(null)} onSave={saveAnim} />}
      {editor && editor.kind === 'pixel' && <PixelEditor initial={editor.init} onClose={() => setEditor(null)} onSave={saveEditor} />}
      {editor && editor.kind === 'model' && <ModelMaker initial={editor.init} onClose={() => setEditor(null)} onSave={saveEditor} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
