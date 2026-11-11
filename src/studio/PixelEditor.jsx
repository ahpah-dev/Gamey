import React, { useCallback, useEffect, useRef, useState } from 'react'

const PALETTE = ['#2d2250', '#636e72', '#b2bec3', '#ffffff', '#ff6b6b', '#e17055', '#f7a35c', '#fdcb6e', '#ffd54f', '#55efc4', '#00b894', '#27ae60', '#74b9ff', '#0984e3', '#a29bfe', '#6c5ce7', '#fd79a8', '#e84393', '#8d5a2b', '#ffdbb0', '#c8923e', '#00cec9', '#d63031', '#1e1646']
const VIEW = 384

function line([x0, y0], [x1, y1]) {
  const pts = []
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    pts.push([x0, y0])
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 >= dy) { err += dy; x0 += sx }
    if (e2 <= dx) { err += dx; y0 += sy }
  }
  return pts
}

function hexOf(r, g, b) { return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('') }
const isTyping = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
const HINT = {
  pencil: 'Click or drag to paint.',
  eraser: 'Click or drag to erase.',
  fill: 'Click an area to fill everything of that color.',
  pick: 'Click a pixel to copy its color.',
}
const KEYS = { b: 'pencil', e: 'eraser', g: 'fill', i: 'pick' }

/** Draw pixel art: pencil, eraser, fill, color picker, mirror mode, undo/redo. */
export default function PixelEditor({ initial, onSave, onClose }) {
  const [n, setN] = useState(initial && initial.n ? initial.n : 32)
  const [px, setPx] = useState(() => Array(n * n).fill(null))
  const [color, setColor] = useState('#6c5ce7')
  const [tool, setTool] = useState('pencil')
  const [mirror, setMirror] = useState(false)
  const [name, setName] = useState((initial && initial.name) || 'My sprite')
  const [undo, setUndo] = useState([])
  const [redo, setRedo] = useState([])
  const [hover, setHover] = useState(null)
  const cv = useRef(null), prev = useRef(null)
  const down = useRef(false)
  const pxRef = useRef(px)
  const last = useRef(null)
  pxRef.current = px

  // load an existing image / built-in SVG into the grid
  useEffect(() => {
    if (!initial || !initial.src) return
    const im = new Image()
    im.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = n
      const ctx = c.getContext('2d', { willReadFrequently: true })
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(im, 0, 0, n, n)
      const d = ctx.getImageData(0, 0, n, n).data
      const arr = []
      for (let i = 0; i < n * n; i++) arr.push(d[i * 4 + 3] < 100 ? null : hexOf(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]))
      setPx(arr)
    }
    im.src = initial.src
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const draw = useCallback(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')
    const s = VIEW / n
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#e9e5ff' : '#f7f5ff'
      ctx.fillRect(x * s, y * s, s, s)
      const col = px[y * n + x]
      if (col) { ctx.fillStyle = col; ctx.fillRect(x * s, y * s, s, s) }
    }
    ctx.strokeStyle = 'rgba(80,60,160,.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i <= n; i++) { ctx.moveTo(i * s, 0); ctx.lineTo(i * s, VIEW); ctx.moveTo(0, i * s); ctx.lineTo(VIEW, i * s) }
    ctx.stroke()
    if (mirror) { ctx.strokeStyle = 'rgba(232,67,147,.6)'; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(VIEW / 2, 0); ctx.lineTo(VIEW / 2, VIEW); ctx.stroke(); ctx.setLineDash([]) }
    if (hover) { ctx.strokeStyle = '#6c5ce7'; ctx.lineWidth = 2; ctx.strokeRect(hover[0] * s + 1, hover[1] * s + 1, s - 2, s - 2) }
    // small true-size preview
    const p = prev.current
    if (p) {
      const pc = p.getContext('2d')
      pc.clearRect(0, 0, p.width, p.height)
      pc.imageSmoothingEnabled = false
      const t = document.createElement('canvas')
      t.width = t.height = n
      const tc = t.getContext('2d')
      px.forEach((col, i) => { if (col) { tc.fillStyle = col; tc.fillRect(i % n, Math.floor(i / n), 1, 1) } })
      pc.drawImage(t, 0, 0, p.width, p.height)
    }
  }, [px, n, mirror, hover])
  useEffect(() => { draw() }, [draw])

  const cell = (ev) => {
    const r = cv.current.getBoundingClientRect()
    return [Math.min(n - 1, Math.max(0, Math.floor(((ev.clientX - r.left) / r.width) * n))), Math.min(n - 1, Math.max(0, Math.floor(((ev.clientY - r.top) / r.height) * n)))]
  }

  const paint = (arr, x, y, col) => {
    arr[y * n + x] = col
    if (mirror) arr[y * n + (n - 1 - x)] = col
  }

  const flood = (arr, x, y, col) => {
    const target = arr[y * n + x]
    if (target === col) return
    const stack = [[x, y]]
    while (stack.length) {
      const [cx, cy] = stack.pop()
      if (cx < 0 || cy < 0 || cx >= n || cy >= n || arr[cy * n + cx] !== target) continue
      arr[cy * n + cx] = col
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1])
    }
  }

  const act = (ev, first) => {
    const [x, y] = cell(ev)
    if (tool === 'pick') {
      const c = px[y * n + x]
      if (c) { setColor(c); setTool('pencil') }
      return
    }
    const cur = pxRef.current
    const arr = cur.slice()
    if (first) { setUndo((u) => [...u.slice(-30), cur]); setRedo([]) }
    if (tool === 'fill') { flood(arr, x, y, color); if (mirror) flood(arr, n - 1 - x, y, color) }
    else {
      const pts = !first && last.current ? line(last.current, [x, y]) : [[x, y]]
      for (const [lx, ly] of pts) paint(arr, lx, ly, tool === 'eraser' ? null : color)
    }
    last.current = [x, y]
    pxRef.current = arr
    setPx(arr)
  }

  const resize = (m) => {
    if (!px.some(Boolean) || confirm('Changing the grid size clears your drawing. Continue?')) { setN(m); setPx(Array(m * m).fill(null)); setUndo([]); setRedo([]) }
  }

  const save = () => {
    if (!px.some(Boolean)) return
    const c = document.createElement('canvas')
    c.width = c.height = n
    const ctx = c.getContext('2d')
    px.forEach((col, i) => { if (col) { ctx.fillStyle = col; ctx.fillRect(i % n, Math.floor(i / n), 1, 1) } })
    onSave({ name: name.trim() || 'My sprite', data: c.toDataURL('image/png'), w: n, h: n, pixel: true })
  }

  const undoOnce = () => {
    if (!undo.length) return
    setRedo((r) => [...r, px])
    setPx(undo[undo.length - 1])
    setUndo(undo.slice(0, -1))
  }
  const redoOnce = () => {
    if (!redo.length) return
    setUndo((u) => [...u, px])
    setPx(redo[redo.length - 1])
    setRedo(redo.slice(0, -1))
  }

  // Keyboard: B/E/G/I tools, M mirror, Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) undo/redo, Ctrl+S save.
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redoOnce(); else undoOnce() }
      else if (mod && k === 'y') { e.preventDefault(); redoOnce() }
      else if (mod && k === 's') { e.preventDefault(); save() }
      else if (mod) return
      else if (KEYS[k]) setTool(KEYS[k])
      else if (k === 'm') setMirror((m) => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="modal-back">
      <div className="modal pixel-modal" role="dialog" aria-label="Sprite maker">
        <div className="modal-head">
          <h2>✏️ Sprite maker</h2>
          <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Sprite name" />
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="pixel-body">
          <div className="pixel-side">
            <div className="toolbar">
              {[['pencil', '✏️', 'Draw'], ['eraser', '🧽', 'Erase'], ['fill', '🪣', 'Fill'], ['pick', '💧', 'Pick color']].map(([t, i, l]) => (
                <button key={t} className={tool === t ? 'on' : ''} onClick={() => setTool(t)} title={l}><span>{i}</span><small>{l}</small></button>
              ))}
            </div>
            <p className="muted tool-hint">{HINT[tool]}</p>
            <label className="check"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror (draw both sides) 🪞</label>
            <div className="palette-colors">
              {PALETTE.map((c) => <button key={c} className={'sw' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => { setColor(c); if (tool === 'eraser' || tool === 'pick') setTool('pencil') }} aria-label={c} />)}
              <label className="sw custom" style={{ background: color }}><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><span>🎨</span></label>
            </div>
            <div className="size-row">Grid:{[16, 24, 32, 48].map((m) => <button key={m} className={'chip' + (m === n ? ' on' : '')} onClick={() => resize(m)}>{m}</button>)}</div>
            <div className="preview-row"><canvas ref={prev} width="64" height="64" className="preview-box" /><span className="muted">Real size</span></div>
            <div className="row">
              <button className="btn small" title="Undo (Ctrl+Z)" disabled={!undo.length} onClick={undoOnce}>↶ Undo</button>
              <button className="btn small" title="Redo (Ctrl+Shift+Z)" disabled={!redo.length} onClick={redoOnce}>↷ Redo</button>
            </div>
            <div className="row">
              <button className="btn small" disabled={!px.some(Boolean)} onClick={() => { setUndo([...undo, px]); setRedo([]); setPx(Array(n * n).fill(null)) }}>🗑 Clear</button>
            </div>
            <p className="muted keys-hint">B draw · E erase · G fill · I pick · M mirror · Ctrl+Z undo · Ctrl+S save</p>
          </div>
          <canvas
            ref={cv} width={VIEW} height={VIEW} className="pixel-canvas"
            onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* synthetic pointer */ } down.current = true; act(e, true) }}
            onPointerMove={(e) => {
              const [hx, hy] = cell(e)
              if (!hover || hover[0] !== hx || hover[1] !== hy) setHover([hx, hy])
              if (down.current && tool !== 'fill' && tool !== 'pick') act(e, false)
            }}
            onPointerLeave={() => setHover(null)}
            onPointerUp={() => { down.current = false; last.current = null }} onPointerCancel={() => { down.current = false; last.current = null }}
          />
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!px.some(Boolean)} onClick={save}>💾 Save “{name.trim() || 'My sprite'}”</button>
        </div>
      </div>
    </div>
  )
}
