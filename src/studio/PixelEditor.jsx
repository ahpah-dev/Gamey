import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'

const PALETTE = ['#2d2250', '#636e72', '#b2bec3', '#ffffff', '#ff6b6b', '#e17055', '#f7a35c', '#fdcb6e', '#ffd54f', '#55efc4', '#00b894', '#27ae60', '#74b9ff', '#0984e3', '#a29bfe', '#6c5ce7', '#fd79a8', '#e84393', '#8d5a2b', '#ffdbb0', '#c8923e', '#00cec9', '#d63031', '#1e1646']
const VIEW = 384
const GRID_SIZES = [16, 24, 32, 48]
const SMOOTH_SIZES = [256, 384, 512]
const isTyping = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)

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
// Little-endian RGBA packed as one number (matches ImageData bytes).
function packHex(hex) {
  const v = parseInt(hex.slice(1), 16)
  return ((255 << 24) | ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255)) >>> 0
}

/** Load a picture (or stored sprite) into a canvas at its natural size. */
function loadCanvas(src) {
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => {
      const c = document.createElement('canvas')
      c.width = im.naturalWidth
      c.height = im.naturalHeight
      c.getContext('2d').drawImage(im, 0, 0)
      resolve(c)
    }
    im.onerror = reject
    im.src = src
  })
}

/** Fit any canvas into an n×n pixel grid (keeps proportions, centred). */
function sampleGrid(src, n) {
  const c = document.createElement('canvas')
  c.width = c.height = n
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = true
  const k = n / Math.max(src.width, src.height)
  const dw = src.width * k, dh = src.height * k
  ctx.drawImage(src, (n - dw) / 2, (n - dh) / 2, dw, dh)
  const d = ctx.getImageData(0, 0, n, n).data
  const arr = []
  for (let i = 0; i < n * n; i++) arr.push(d[i * 4 + 3] < 100 ? null : hexOf(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]))
  return arr
}

function gridCanvas(arr, m) {
  const c = document.createElement('canvas')
  c.width = c.height = m
  const ctx = c.getContext('2d')
  arr.forEach((col, i) => { if (col) { ctx.fillStyle = col; ctx.fillRect(i % m, Math.floor(i / m), 1, 1) } })
  return c
}

/** Smooth canvas size for a source: at least 256, at most 512 on the long side. */
function fitDims(src) {
  if (!src) return { w: 256, h: 256 }
  const long = Math.max(src.width, src.height)
  const k = Math.min(512, Math.max(256, long)) / long
  return { w: Math.max(1, Math.round(src.width * k)), h: Math.max(1, Math.round(src.height * k)) }
}

const PIXEL_KEYS = { b: 'pencil', e: 'eraser', g: 'fill', i: 'pick' }
const PIXEL_HINT = {
  pencil: 'Click or drag to paint.',
  eraser: 'Click or drag to erase.',
  fill: 'Click an area to fill everything of that color.',
  pick: 'Click a pixel to copy its color.',
}

/** Pixel art: a chunky grid, one color per square. */
const PixelPad = forwardRef(function PixelPad({ source, n: n0, onInk, onSize, onSaveRequest }, ref) {
  const [n, setN] = useState(n0)
  const [px, setPx] = useState(() => (source ? sampleGrid(source, n0) : Array(n0 * n0).fill(null)))
  const [color, setColor] = useState('#6c5ce7')
  const [tool, setTool] = useState('pencil')
  const [mirror, setMirror] = useState(false)
  const [undo, setUndo] = useState([])
  const [redo, setRedo] = useState([])
  const [hover, setHover] = useState(null)
  const cv = useRef(null), prev = useRef(null)
  const down = useRef(false)
  const pxRef = useRef(px)
  const last = useRef(null)
  pxRef.current = px

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
    const p = prev.current
    if (p) {
      const pc = p.getContext('2d')
      pc.clearRect(0, 0, p.width, p.height)
      pc.imageSmoothingEnabled = false
      pc.drawImage(gridCanvas(px, n), 0, 0, p.width, p.height)
    }
  }, [px, n, mirror, hover])
  useEffect(() => { draw() }, [draw])
  useEffect(() => { onInk && onInk(px.some(Boolean)) }, [px]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onSize && onSize(n) }, [n]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const resize = (m) => {
    if (m === n) return
    if (!px.some(Boolean) || confirm('Changing the grid size clears your drawing. Continue?')) { setN(m); setPx(Array(m * m).fill(null)); setUndo([]); setRedo([]) }
  }

  useImperativeHandle(ref, () => ({
    exportCanvas: () => gridCanvas(px, n),
    save: () => ({ data: gridCanvas(px, n).toDataURL('image/png'), w: n, h: n, pixel: true }),
  }))

  // Keyboard: B/E/G/I tools, M mirror, Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) undo/redo, Ctrl+S save.
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const k = e.key.toLowerCase()
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redoOnce(); else undoOnce() }
      else if (mod && k === 'y') { e.preventDefault(); redoOnce() }
      else if (mod && k === 's') { e.preventDefault(); onSaveRequest && onSaveRequest() }
      else if (mod) return
      else if (PIXEL_KEYS[k]) setTool(PIXEL_KEYS[k])
      else if (k === 'm') setMirror((m) => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="pixel-body">
      <div className="pixel-side">
        <div className="toolbar">
          {[['pencil', '✏️', 'Draw'], ['eraser', '🧽', 'Erase'], ['fill', '🪣', 'Fill'], ['pick', '💧', 'Pick color']].map(([t, i, l]) => (
            <button key={t} className={tool === t ? 'on' : ''} onClick={() => setTool(t)} title={l}><span>{i}</span><small>{l}</small></button>
          ))}
        </div>
        <p className="muted tool-hint">{PIXEL_HINT[tool]}</p>
        <label className="check"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror (draw both sides) 🪞</label>
        <div className="palette-colors">
          {PALETTE.map((c) => <button key={c} className={'sw' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => { setColor(c); if (tool === 'eraser' || tool === 'pick') setTool('pencil') }} aria-label={c} />)}
          <label className="sw custom" style={{ background: color }}><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><span>🎨</span></label>
        </div>
        <div className="size-row">Grid:{GRID_SIZES.map((m) => <button key={m} className={'chip' + (m === n ? ' on' : '')} onClick={() => resize(m)}>{m}</button>)}</div>
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
  )
})

/** Smooth drawing: a free brush with soft, round strokes (pen pressure counts). */
const SmoothPad = forwardRef(function SmoothPad({ source, onInk, onSaveRequest }, ref) {
  const [dims, setDims] = useState(() => fitDims(source))
  const [color, setColor] = useState('#6c5ce7')
  const [tool, setTool] = useState('brush')
  const [mirror, setMirror] = useState(false)
  const [size, setSize] = useState(8)
  const [undo, setUndo] = useState([])
  const [redo, setRedo] = useState([])
  const [hasInk, setHasInk] = useState(false)
  const cv = useRef(null)
  const stroke = useRef(null)
  const pending = useRef(null)
  const W = dims.w, H = dims.h
  const k = VIEW / Math.max(W, H)

  // First paint: the source picture (upscaled crisply if it was pixel art).
  useEffect(() => {
    if (!source) return
    const ctx = cv.current.getContext('2d')
    ctx.imageSmoothingEnabled = source.width < W
    ctx.drawImage(source, 0, 0, W, H)
    const px = ctx.getImageData(0, 0, W, H).data
    let any = false
    for (let i = 3; i < px.length && !any; i += 4) if (px[i] > 0) any = true
    setHasInk(any)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Changing the canvas size clears the canvas element; redraw the scaled copy after React resizes it.
  useLayoutEffect(() => {
    if (!pending.current || !cv.current) return
    const ctx = cv.current.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(pending.current, 0, 0, W, H)
    pending.current = null
  }, [W, H])
  useEffect(() => { onInk && onInk(hasInk) }, [hasInk]) // eslint-disable-line react-hooks/exhaustive-deps

  const ctx2d = () => cv.current.getContext('2d', { willReadFrequently: true })
  const pt = (e) => {
    const r = cv.current.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }
  }
  const base = () => (size * Math.max(W, H)) / 256
  const pressureOf = (e) => (e.pointerType === 'pen' && e.pressure > 0 ? 0.3 + e.pressure * 0.7 : 1)
  const mirrored = (p) => ({ x: W - p.x, y: p.y })

  const pushUndo = () => {
    setUndo((u) => [...u.slice(-20), ctx2d().getImageData(0, 0, W, H)])
    setRedo([])
    setHasInk(true)
  }
  const setupStroke = (ctx) => {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = color
    ctx.fillStyle = color
  }
  const dot = (ctx, p, lw) => { ctx.beginPath(); ctx.arc(p.x, p.y, lw / 2, 0, Math.PI * 2); ctx.fill() }
  // One quadratic segment through the midpoints: keeps fast mouse movement smooth.
  const seg = (ctx, s, p, lw) => {
    const mid = { x: (s.prev.x + p.x) / 2, y: (s.prev.y + p.y) / 2 }
    ctx.lineWidth = lw
    ctx.beginPath()
    ctx.moveTo(s.last.x, s.last.y)
    ctx.quadraticCurveTo(s.prev.x, s.prev.y, mid.x, mid.y)
    ctx.stroke()
    s.last = mid
    s.prev = p
  }

  const floodAt = (seeds, hex) => {
    const ctx = ctx2d()
    const img = ctx.getImageData(0, 0, W, H)
    const d = new Uint32Array(img.data.buffer)
    const fill = packHex(hex)
    for (const [sx, sy] of seeds) {
      const start = sy * W + sx
      const target = d[start]
      if (target === fill) continue
      const stack = [start]
      while (stack.length) {
        const i = stack.pop()
        if (d[i] !== target) continue
        d[i] = fill
        const x = i % W, y = (i - x) / W
        if (x > 0) stack.push(i - 1)
        if (x < W - 1) stack.push(i + 1)
        if (y > 0) stack.push(i - W)
        if (y < H - 1) stack.push(i + W)
      }
    }
    ctx.putImageData(img, 0, 0)
  }

  const onDown = (e) => {
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* synthetic pointer */ }
    const p = pt(e)
    const x = Math.min(W - 1, Math.max(0, Math.floor(p.x))), y = Math.min(H - 1, Math.max(0, Math.floor(p.y)))
    if (tool === 'pick') {
      const d = ctx2d().getImageData(x, y, 1, 1).data
      if (d[3] > 0) { setColor(hexOf(d[0], d[1], d[2])); setTool('brush') }
      return
    }
    pushUndo()
    if (tool === 'fill') {
      const seeds = [[x, y]]
      if (mirror) seeds.push([W - 1 - x, y])
      floodAt(seeds, color)
      return
    }
    const ctx = ctx2d()
    setupStroke(ctx)
    const lw = base() * pressureOf(e)
    const s = { last: p, prev: p }
    const sm = mirror ? { last: mirrored(p), prev: mirrored(p) } : null
    dot(ctx, p, lw)
    if (sm) dot(ctx, sm.prev, lw)
    stroke.current = { s, sm }
  }
  const onMove = (e) => {
    const st = stroke.current
    if (!st) return
    const ctx = ctx2d()
    setupStroke(ctx)
    const p = pt(e)
    const lw = base() * pressureOf(e)
    seg(ctx, st.s, p, lw)
    if (st.sm) seg(ctx, st.sm, mirrored(p), lw)
  }
  const onUp = () => {
    const st = stroke.current
    if (!st) return
    const ctx = ctx2d()
    setupStroke(ctx)
    ctx.lineWidth = base()
    ctx.beginPath(); ctx.moveTo(st.s.last.x, st.s.last.y); ctx.lineTo(st.s.prev.x, st.s.prev.y); ctx.stroke()
    if (st.sm) { ctx.beginPath(); ctx.moveTo(st.sm.last.x, st.sm.last.y); ctx.lineTo(st.sm.prev.x, st.sm.prev.y); ctx.stroke() }
    ctx.globalCompositeOperation = 'source-over'
    stroke.current = null
  }

  const undoOnce = () => {
    if (!undo.length) return
    const ctx = ctx2d()
    setRedo((r) => [...r, ctx.getImageData(0, 0, W, H)])
    ctx.putImageData(undo[undo.length - 1], 0, 0)
    setUndo(undo.slice(0, -1))
  }
  const redoOnce = () => {
    if (!redo.length) return
    const ctx = ctx2d()
    setUndo((u) => [...u, ctx.getImageData(0, 0, W, H)])
    ctx.putImageData(redo[redo.length - 1], 0, 0)
    setRedo(redo.slice(0, -1))
  }
  const clear = () => {
    pushUndo()
    ctx2d().clearRect(0, 0, W, H)
    setHasInk(false)
  }
  // Change the long side (256 / 384 / 512), keeping the picture's proportions.
  const resize = (long) => {
    const kk = long / Math.max(W, H)
    const nw = Math.max(1, Math.round(W * kk)), nh = Math.max(1, Math.round(H * kk))
    if (nw === W && nh === H) return
    const copy = document.createElement('canvas')
    copy.width = W; copy.height = H
    copy.getContext('2d').drawImage(cv.current, 0, 0)
    pending.current = copy
    setUndo([]); setRedo([])
    setDims({ w: nw, h: nh })
  }

  useImperativeHandle(ref, () => ({
    exportCanvas: () => cv.current,
    save: () => ({ data: cv.current.toDataURL('image/png'), w: W, h: H, pixel: false }),
  }))

  // Keyboard: B brush, E eraser, G fill, I pick, M mirror, Ctrl+Z / Ctrl+Shift+Z (or Ctrl+Y) undo/redo, Ctrl+S save.
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e.target)) return
      const mod = e.ctrlKey || e.metaKey
      const kk = e.key.toLowerCase()
      if (mod && kk === 'z') { e.preventDefault(); if (e.shiftKey) redoOnce(); else undoOnce() }
      else if (mod && kk === 'y') { e.preventDefault(); redoOnce() }
      else if (mod && kk === 's') { e.preventDefault(); onSaveRequest && onSaveRequest() }
      else if (mod) return
      else if (kk === 'b') setTool('brush')
      else if (kk === 'e') setTool('eraser')
      else if (kk === 'g') setTool('fill')
      else if (kk === 'i') setTool('pick')
      else if (kk === 'm') setMirror((m) => !m)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const SMOOTH_HINT = {
    brush: 'Drag to draw soft, smooth lines. A pen’s pressure makes lines thicker or thinner.',
    eraser: 'Drag to erase.',
    fill: 'Click an area to fill the connected region of that color.',
    pick: 'Click the picture to copy its color.',
  }
  return (
    <div className="pixel-body">
      <div className="pixel-side">
        <div className="toolbar">
          {[['brush', '🖌️', 'Brush'], ['eraser', '🧽', 'Erase'], ['fill', '🪣', 'Fill'], ['pick', '💧', 'Pick color']].map(([t, i, l]) => (
            <button key={t} className={tool === t ? 'on' : ''} onClick={() => setTool(t)} title={l}><span>{i}</span><small>{l}</small></button>
          ))}
        </div>
        <p className="muted tool-hint">{SMOOTH_HINT[tool]}</p>
        <label className="field-col brush-size"><span className="lbl">Brush size</span>
          <div className="brush-row">
            <input type="range" min="1" max="40" value={size} onChange={(e) => setSize(+e.target.value)} aria-label="Brush size" />
            <span className="brush-dot" style={{ width: Math.min(28, 4 + size * 0.6), height: Math.min(28, 4 + size * 0.6), background: tool === 'eraser' ? '#fff' : color }} />
          </div>
        </label>
        <label className="check"><input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror (draw both sides) 🪞</label>
        <div className="palette-colors">
          {PALETTE.map((c) => <button key={c} className={'sw' + (c === color ? ' on' : '')} style={{ background: c }} onClick={() => { setColor(c); if (tool === 'eraser' || tool === 'pick') setTool('brush') }} aria-label={c} />)}
          <label className="sw custom" style={{ background: color }}><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><span>🎨</span></label>
        </div>
        <div className="size-row">Canvas:{SMOOTH_SIZES.map((m) => <button key={m} className={'chip' + (m === Math.max(W, H) ? ' on' : '')} onClick={() => resize(m)}>{m}</button>)}</div>
        <div className="row">
          <button className="btn small" title="Undo (Ctrl+Z)" disabled={!undo.length} onClick={undoOnce}>↶ Undo</button>
          <button className="btn small" title="Redo (Ctrl+Shift+Z)" disabled={!redo.length} onClick={redoOnce}>↷ Redo</button>
        </div>
        <div className="row">
          <button className="btn small" disabled={!hasInk} onClick={clear}>🗑 Clear</button>
        </div>
        <p className="muted keys-hint">B brush · E erase · G fill · I pick · M mirror · Ctrl+Z undo · Ctrl+S save</p>
      </div>
      <canvas
        ref={cv} width={W} height={H} className="smooth-canvas"
        style={{ width: W * k, height: H * k }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      />
    </div>
  )
})

/** The sprite maker: pick Pixel art or Smooth drawing, and switch between them without losing the drawing. */
export default function PixelEditor({ initial, onSave, onClose }) {
  const [mode, setMode] = useState(initial && initial.mode === 'smooth' ? 'smooth' : 'pixel')
  const [name, setName] = useState((initial && initial.name) || 'My sprite')
  const [src, setSrc] = useState(null)
  const [ready, setReady] = useState(!(initial && initial.src))
  const [ink, setInk] = useState(false)
  const [gridN, setGridN] = useState((initial && initial.n) || 32)
  const padRef = useRef(null)

  // Load the picture being edited (or remixed) once.
  useEffect(() => {
    if (!initial || !initial.src) return
    let alive = true
    loadCanvas(initial.src)
      .then((c) => { if (alive) { setSrc(c); setReady(true) } })
      .catch(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchMode = (next) => {
    if (next === mode || !padRef.current) return
    setSrc(padRef.current.exportCanvas())
    setMode(next)
  }
  const save = () => {
    if (!ink || !padRef.current) return
    onSave({ name: name.trim() || 'My sprite', ...padRef.current.save() })
  }

  return (
    <div className="modal-back">
      <div className="modal pixel-modal" role="dialog" aria-label="Sprite maker">
        <div className="modal-head">
          <h2>✏️ Sprite maker</h2>
          <input className="name-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Sprite name" />
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mode-row" role="tablist" aria-label="Drawing style">
          <button role="tab" aria-selected={mode === 'pixel'} className={mode === 'pixel' ? 'on' : ''} onClick={() => switchMode('pixel')}>🟦 Pixel art</button>
          <button role="tab" aria-selected={mode === 'smooth'} className={mode === 'smooth' ? 'on' : ''} onClick={() => switchMode('smooth')}>🖌️ Smooth drawing</button>
        </div>
        {!ready && <p className="muted lib-empty">Loading your picture…</p>}
        {ready && mode === 'pixel' && (
          <PixelPad key="pixel" ref={padRef} source={src} n={src ? gridN : (initial && initial.n) || 32} onInk={setInk} onSize={setGridN} onSaveRequest={save} />
        )}
        {ready && mode === 'smooth' && (
          <SmoothPad key="smooth" ref={padRef} source={src} onInk={setInk} onSaveRequest={save} />
        )}
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!ink || !ready} onClick={save}>💾 Save “{name.trim() || 'My sprite'}”</button>
        </div>
      </div>
    </div>
  )
}
