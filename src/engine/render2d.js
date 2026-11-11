// Lightweight Canvas 2D renderer.
import { DEG } from './math.js'
import { spriteSource, getSpriteImage } from './sprites.js'

const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'
const cache = new Map()

function rgb(hex) {
  let c = cache.get(hex)
  if (c) return c
  let h = (hex || '#ffffff').replace('#', '')
  if (h.length === 3) h = h.split('').map((x) => x + x).join('')
  const n = parseInt(h, 16) || 0
  c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  cache.set(hex, c)
  return c
}
const shade = (hex, k) => {
  const [r, g, b] = rgb(hex)
  const f = (v) => Math.round(Math.max(0, Math.min(255, k > 0 ? v + (255 - v) * k : v * (1 + k))))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}

export class Renderer2D {
  constructor(canvas) {
    this.mode = '2d'
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.cw = 1; this.ch = 1; this.dpr = 1
    this.scale = 1
    this.camera = { x: 0, y: 0, zoom: 1 }
    this.world = { w: 960, h: 540 }
  }

  _fit() {
    const c = this.canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = c.clientWidth || 1, h = c.clientHeight || 1
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr)
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph }
    this.cw = w; this.ch = h; this.dpr = dpr
  }

  _setView(camera, world) {
    this.camera = camera
    this.world = world
    this.scale = Math.min(this.cw / world.w, this.ch / world.h) * (camera.zoom || 1)
  }

  /** screen (css px) -> world */
  toWorld(px, py, camera = this.camera) {
    return { x: (px - this.cw / 2) / this.scale + camera.x, y: (py - this.ch / 2) / this.scale + camera.y }
  }
  toScreen(wx, wy) {
    return { x: (wx - this.camera.x) * this.scale + this.cw / 2, y: (wy - this.camera.y) * this.scale + this.ch / 2 }
  }

  pick(px, py, ents, camera) {
    const p = this.toWorld(px, py, camera)
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i]
      if (Math.abs(p.x - e.x) <= e.w / 2 && Math.abs(p.y - e.y) <= e.h / 2) return e
    }
    return null
  }

  render({ entities, particles = [], camera, project, overlay = null }) {
    this._fit()
    const { ctx, dpr, cw, ch } = this
    this._setView(camera, project.world)
    this.assets = project.assets
    const s = this.scale
    // background
    const bg = project.background
    const g = ctx.createLinearGradient(0, 0, 0, ch * dpr)
    g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1])
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, cw * dpr, ch * dpr)
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (cw / 2 - camera.x * s), dpr * (ch / 2 - camera.y * s))

    if (overlay && overlay.grid) this._grid(camera)
    if (overlay && overlay.frame) {
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,.7)'
      ctx.lineWidth = 2 / s
      ctx.setLineDash([10 / s, 8 / s])
      ctx.strokeRect(0, 0, project.world.w, project.world.h)
      ctx.restore()
    }

    for (const e of entities) if (e.visible !== false) this._entity(e)

    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6))
      ctx.fillStyle = p.color
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, 6.2832); ctx.fill()
    }
    ctx.globalAlpha = 1

    if (overlay && overlay.selectedId) {
      const e = entities.find((o) => o.id === overlay.selectedId)
      if (e) this._selection(e)
    }
  }

  _grid(cam) {
    const { ctx, cw, ch, scale: s } = this
    const x0 = cam.x - cw / 2 / s, x1 = cam.x + cw / 2 / s
    const y0 = cam.y - ch / 2 / s, y1 = cam.y + ch / 2 / s
    const step = 40
    ctx.lineWidth = 1 / s
    for (let x = Math.floor(x0 / step) * step; x <= x1; x += step) {
      ctx.strokeStyle = x % 200 === 0 ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.12)'
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke()
    }
    for (let y = Math.floor(y0 / step) * step; y <= y1; y += step) {
      ctx.strokeStyle = y % 200 === 0 ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.12)'
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
    }
  }

  _selection(e) {
    const { ctx, scale: s } = this
    ctx.save()
    ctx.translate(e.x, e.y)
    ctx.strokeStyle = '#ffd54f'
    ctx.lineWidth = 2.5 / s
    ctx.setLineDash([8 / s, 5 / s])
    ctx.strokeRect(-e.w / 2, -e.h / 2, e.w, e.h)
    ctx.setLineDash([])
    const hs = 11 / s
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#6c5ce7'
    ctx.lineWidth = 2.5 / s
    for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath()
      ctx.roundRect(cx * e.w / 2 - hs / 2, cy * e.h / 2 - hs / 2, hs, hs, 3 / s)
      ctx.fill(); ctx.stroke()
    }
    ctx.restore()
  }

  _entity(e) {
    const { ctx } = this
    const f = 1 + (e.pulse || 0) * 0.3
    const w = e.w * f, h = e.h * f
    ctx.save()
    ctx.translate(e.x, e.y)
    if (e.rz) ctx.rotate(e.rz * DEG)
    if (e.flip && e.type !== 'text') ctx.scale(-1, 1)
    ctx.globalAlpha = (e.opacity ?? 1) * (e.alpha ?? 1)
    switch (e.type) {
      case 'rect': {
        const r = Math.min(e.radius ?? 8, w / 2, h / 2)
        ctx.fillStyle = shade(e.color, -0.32)
        ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2 + Math.min(5, h * 0.18), w, h, r); ctx.fill()
        const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
        g.addColorStop(0, shade(e.color, 0.22)); g.addColorStop(1, e.color)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fill()
        break
      }
      case 'circle': {
        const r = w / 2
        ctx.fillStyle = shade(e.color, -0.3)
        ctx.beginPath(); ctx.arc(0, Math.min(4, r * 0.1), r, 0, 6.2832); ctx.fill()
        const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r)
        g.addColorStop(0, shade(e.color, 0.5)); g.addColorStop(1, e.color)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill()
        break
      }
      case 'sprite': {
        const sp = spriteSource(e.sprite, this.assets)
        const im = sp && getSpriteImage(sp.src)
        if (im && im.complete && im.naturalWidth) {
          ctx.imageSmoothingEnabled = !sp.pixel
          ctx.drawImage(im, -w / 2, -h / 2, w, h)
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([6, 4]); ctx.lineWidth = 2
          ctx.strokeRect(-w / 2, -h / 2, w, h)
        }
        break
      }
      case 'emoji':
        ctx.font = `${Math.round(h * 0.82)}px ${EMOJI_FONT}`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(e.emoji || '😀', 0, h * 0.04)
        break
      case 'text':
        ctx.font = `800 ${Math.round(h * 0.8)}px system-ui,"Segoe UI",sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.lineJoin = 'round'
        ctx.lineWidth = Math.max(3, h * 0.12)
        ctx.strokeStyle = 'rgba(0,0,0,.35)'
        ctx.strokeText(e.text || '', 0, 0)
        ctx.fillStyle = e.color
        ctx.fillText(e.text || '', 0, 0)
        break
      default: break
    }
    ctx.restore()
  }

  destroy() { /* nothing to release */ }
}
