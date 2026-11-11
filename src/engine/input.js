// Keyboard + touch input. Kid-friendly: arrows and WASD both work, Space/Up/W jump.
const MAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  fire: ['KeyX', 'KeyZ', 'KeyJ', 'Enter'],
}

export class Input {
  constructor() {
    this.keys = new Set()
    this.virtual = new Set()
    this.attached = false
    this._down = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault()
      this.keys.add(e.code)
    }
    this._up = (e) => this.keys.delete(e.code)
    this._blur = () => { this.keys.clear(); this.virtual.clear() }
  }
  attach() {
    if (this.attached || typeof window === 'undefined') return
    window.addEventListener('keydown', this._down)
    window.addEventListener('keyup', this._up)
    window.addEventListener('blur', this._blur)
    this.attached = true
  }
  detach() {
    if (!this.attached) return
    window.removeEventListener('keydown', this._down)
    window.removeEventListener('keyup', this._up)
    window.removeEventListener('blur', this._blur)
    this.keys.clear(); this.virtual.clear()
    this.attached = false
  }
  setVirtual(name, on) { if (on) this.virtual.add(name); else this.virtual.delete(name) }
  isDown(name) {
    if (this.virtual.has(name)) return true
    const codes = MAP[name] || [name]
    for (const c of codes) if (this.keys.has(c)) return true
    return false
  }
  /** -1..1 axes */
  axis() {
    return {
      x: (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0),
      y: (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0),
    }
  }
}
