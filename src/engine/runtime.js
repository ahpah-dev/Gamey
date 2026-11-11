// The Gamey runtime: fixed-step game loop, physics, behaviors, rules, camera.
import { behaviorDefaults } from './behaviors.js'
import { Input } from './input.js'
import { audio } from './audio.js'
import { normalizeProject } from './entities.js'
import { clamp, rand, DEG } from './math.js'
import { createRenderer } from './renderer.js'

const STEP = 1 / 60
const EPS = 1e-4

// Friendly 1-10 slider values -> real units
const UNITS = {
  '2d': { speed: 52, jump: 150, g: 1900, maxFall: 1400, dist: 40, pspeed: 40, sight: 90, bob: 6, pv: 220, arena: 0 },
  '3d': { speed: 1.2, jump: 2.3, g: -32, maxFall: 40, dist: 1, pspeed: 0.8, sight: 2.5, bob: 0.12, pv: 4.5, arena: 14 },
}

function overlap(a, b, k, is3d) {
  if (Math.abs(a.x - b.x) >= ((a.w + b.w) / 2) * k - EPS) return false
  if (Math.abs(a.y - b.y) >= ((a.h + b.h) / 2) * k - EPS) return false
  if (is3d && Math.abs(a.z - b.z) >= ((a.d + b.d) / 2) * k - EPS) return false
  return true
}

export class Runtime {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} project  a Gamey project (see entities.js)
   * @param {{onState?:(s:object)=>void, onEvent?:(name:string)=>void}} opts
   */
  constructor(canvas, project, opts = {}) {
    this.canvas = canvas
    this.opts = opts
    this.input = new Input()
    this.raf = 0
    this.paused = false
    this.project = normalizeProject(project)
    this.is3d = this.project.mode === '3d'
    this.U = UNITS[this.project.mode]
    this.renderer = createRenderer(canvas, this.project.mode)
    this._drag = null
    this._bindPointer()
    audio.setMuted(this.project.settings.sound === false)
    this.reset()
  }

  /* ----------------------------------------------------------- lifecycle */
  reset() {
    const p = this.project
    this.ents = p.objects.map((o, i) => this._spawn(o, i))
    this.particles = []
    this.time = 0
    const collectibles = this.ents.filter((e) => e.b.collect)
    this.state = {
      score: 0, lives: p.settings.lives, status: 'playing',
      collected: 0, total: collectibles.length,
    }
    this.hasGoal = this.ents.some((e) => e.b.goal)
    let bottom = -Infinity, top = Infinity
    for (const e of this.ents) { bottom = Math.max(bottom, e.y + e.h / 2); top = Math.min(top, e.y - e.h / 2) }
    this.fallLimit = this.is3d ? top - 18 : bottom + 700
    if (!isFinite(this.fallLimit)) this.fallLimit = this.is3d ? -40 : 2000
    this.camera = this.is3d ? { ...p.camera } : { x: p.world.w / 2, y: p.world.h / 2, zoom: 1 }
    this._snapCamera()
    this._emit()
  }

  start() {
    if (this.raf) return
    this.input.attach()
    let last = performance.now(), acc = 0
    const tick = (t) => {
      this.raf = requestAnimationFrame(tick)
      let dt = (t - last) / 1000
      last = t
      if (dt > 0.1) dt = 0.1
      if (!this.paused) {
        acc += dt
        while (acc >= STEP) { this.step(STEP); acc -= STEP }
      }
      this.draw()
    }
    this.raf = requestAnimationFrame(tick)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.input.detach()
  }

  restart() { this.reset(); this.paused = false }
  pause(v = true) { this.paused = v }

  destroy() {
    this.stop()
    this._unbindPointer()
    this.renderer.destroy()
  }

  /* -------------------------------------------------------------- spawn */
  _spawn(o, idx) {
    const e = { ...o }
    e.b = {}
    for (const b of o.behaviors || []) e.b[b.type] = { ...behaviorDefaults(b.type), ...b }
    e.alive = true
    e.vx = e.vy = e.vz = 0
    e.dx = e.dy = e.dz = 0
    e.x0 = e.x; e.y0 = e.y; e.z0 = e.z || 0
    e.z = e.z || 0
    e.grounded = false; e.groundedOn = null
    e.coyote = 0; e.invuln = 0; e.pulse = 0; e.alpha = 1
    e.isPlayer = !!(e.b.move || e.b.platformer)
    if (e.b.bounce) {
      const a = (35 + ((idx * 53) % 80)) * DEG
      const sp = e.b.bounce.speed * this.U.speed * 0.8
      e.vx = Math.cos(a) * sp
      if (this.is3d) e.vz = Math.sin(a) * sp
      else e.vy = Math.sin(a) * sp
    }
    return e
  }

  /* --------------------------------------------------------------- step */
  step(dt) {
    this._updateParticles(dt)
    const s = this.state
    if (s.status !== 'playing') return
    this.time += dt
    const ents = this.ents
    for (const e of ents) if (e.alive) this._mover(e, dt)
    const solids = ents.filter((e) => e.alive && e.b.solid)
    for (const e of ents) if (e.alive && (e.isPlayer || e.b.gravity)) this._body(e, dt, solids)
    for (const e of ents) {
      if (!e.alive) continue
      if (e.pulse > 0) e.pulse = Math.max(0, e.pulse - dt * 4)
      if (e.invuln > 0) { e.invuln -= dt; e.alpha = Math.floor(this.time * 14) % 2 ? 0.35 : 1; if (e.invuln <= 0) e.alpha = 1 }
    }
    for (const p of ents) if (p.alive && p.isPlayer) this._triggers(p)
    if (s.status === 'playing' && this.project.settings.win === 'auto' && !this.hasGoal && s.total > 0 && s.collected >= s.total) this._win()
    this._followCamera(dt)
  }

  _mover(e, dt) {
    const b = e.b, U = this.U, is3d = this.is3d
    const px = e.x, py = e.y, pz = e.z
    if (b.spin) {
      const d = b.spin.speed * 30 * dt
      if (is3d) e.ry += d; else e.rz += d
    }
    if (b.patrol) {
      let ax = b.patrol.axis
      if (!is3d && ax === 'z') ax = 'x'
      const D = b.patrol.distance * U.dist
      if (e.pt === undefined) e.pt = D
      e.pt += b.patrol.speed * U.pspeed * dt
      const p = e.pt % (4 * D)
      e[ax] = e[ax + '0'] + (p < 2 * D ? p - D : 3 * D - p)
    }
    if (b.bob) {
      e.y = e.y0 + Math.sin(this.time * b.bob.speed * 0.8) * b.bob.height * U.bob * (is3d ? 1 : -1)
    }
    if (b.bounce) this._bounce(e, dt)
    if (b.follow) {
      const t = this.ents.find((o) => o.alive && o.isPlayer)
      if (t) {
        const dx = t.x - e.x, dz = is3d ? t.z - e.z : t.y - e.y
        const d = Math.hypot(dx, dz)
        const range = b.follow.range >= 10 ? Infinity : b.follow.range * U.sight
        if (d < range && d > 1e-3) {
          const sp = b.follow.speed * U.pspeed * dt
          e.x += (dx / d) * Math.min(sp, d)
          if (is3d) e.z += (dz / d) * Math.min(sp, d); else e.y += (dz / d) * Math.min(sp, d)
        }
      }
    }
    e.dx = e.x - px; e.dy = e.y - py; e.dz = e.z - pz
  }

  _bounce(e, dt) {
    const is3d = this.is3d, W = this.project.world
    const solids = this.ents.filter((o) => o !== e && o.alive && o.b.solid)
    const hitSolid = () => solids.some((s) => overlap(e, s, 1, is3d))
    const axes = is3d ? ['x', 'z'] : ['x', 'y']
    for (const ax of axes) {
      const v = 'v' + ax, size = ax === 'x' ? 'w' : ax === 'y' ? 'h' : 'd'
      const step = e[v] * dt
      e[ax] += step
      if (hitSolid()) { e[ax] -= step; e[v] *= -1; continue }
      const half = e[size] / 2
      const lo = is3d ? -this.U.arena : 0
      const hi = is3d ? this.U.arena : ax === 'x' ? W.w : W.h
      if (e[ax] - half < lo) { e[ax] = lo + half; e[v] = Math.abs(e[v]) }
      else if (e[ax] + half > hi) { e[ax] = hi - half; e[v] = -Math.abs(e[v]) }
    }
  }

  _body(e, dt, solids) {
    const U = this.U, is3d = this.is3d, b = e.b, inp = this.input
    const sg = Math.sign(U.g)
    const pb = b.platformer || b.move
    if (pb) {
      const sp = pb.speed * U.speed
      const a = inp.axis()
      if (!is3d) {
        e.vx = a.x * sp
        if (b.move && !b.platformer) e.vy = a.y * sp
      } else {
        const yaw = this.camera.yaw * DEG
        let mx = Math.cos(yaw) * a.x + -Math.sin(yaw) * -a.y
        let mz = -Math.sin(yaw) * a.x + -Math.cos(yaw) * -a.y
        const l = Math.hypot(mx, mz)
        if (l > 1) { mx /= l; mz /= l }
        e.vx = mx * sp; e.vz = mz * sp
        if (b.move && !b.platformer) e.vy = 0
      }
    }
    const hasG = b.platformer || b.gravity
    if (hasG) e.vy = clamp(e.vy + U.g * dt, -U.maxFall, U.maxFall)
    if (b.platformer) {
      e.coyote = e.grounded ? 0.1 : e.coyote - dt
      const down = inp.isDown(is3d ? 'Space' : 'jump')
      if (down && !e.jumpHeld && e.coyote > 0) {
        e.vy = -sg * b.platformer.jump * U.jump
        e.coyote = 0; e.grounded = false
        audio.play('jump')
      }
      if (!down && e.vy * sg < 0) e.vy *= Math.max(0, 1 - 9 * dt)
      e.jumpHeld = down
    }
    const g = e.groundedOn
    if (g && g.alive) { e.x += g.dx; e.y += g.dy; e.z += g.dz }
    e.grounded = false; e.groundedOn = null
    const axes = is3d ? ['x', 'z', 'y'] : ['x', 'y']
    for (const ax of axes) {
      const vk = 'v' + ax, v = e[vk]
      if (!v) continue
      e[ax] += v * dt
      const size = ax === 'x' ? 'w' : ax === 'y' ? 'h' : 'd'
      for (const s of solids) {
        if (s === e || !overlap(e, s, 1, is3d)) continue
        const half = (e[size] + s[size]) / 2
        e[ax] = v > 0 ? s[ax] - half : s[ax] + half
        if (ax === 'y' && hasG && v * sg > 0) { e.grounded = true; e.groundedOn = s }
        e[vk] = 0
      }
    }
    if (e.isPlayer && (is3d ? e.y < this.fallLimit : e.y > this.fallLimit)) this._hurt(e)
  }

  _triggers(p) {
    const is3d = this.is3d
    for (const e of this.ents) {
      if (!e.alive || e === p) continue
      const t = e.b
      if (!(t.collect || t.hazard || t.goal)) continue
      if (!overlap(p, e, 0.8, is3d)) continue
      if (t.collect) {
        e.alive = false
        this.state.score += t.collect.points
        this.state.collected++
        this.burst(e.x, e.y, e.z, e.color || '#fdcb6e', 14)
        audio.play('coin')
        this._emit()
      }
      if (t.hazard && p.invuln <= 0 && this.state.status === 'playing') this._hurt(p)
      if (t.goal && this.state.status === 'playing') this._win()
    }
  }

  _hurt(p) {
    const s = this.state
    s.lives--
    this.burst(p.x, p.y, p.z, '#ff7675', 20)
    audio.play('hit')
    p.x = p.x0; p.y = p.y0; p.z = p.z0
    p.vx = p.vy = p.vz = 0
    p.groundedOn = null
    p.invuln = 1.6
    if (s.lives <= 0) {
      s.lives = 0; s.status = 'lost'
      audio.play('lose')
      this.opts.onEvent?.('lose')
    }
    this._emit()
  }

  _win() {
    const s = this.state
    s.status = 'won'
    const p = this.ents.find((e) => e.isPlayer) || this.ents[0]
    if (p) for (const c of ['#ff7675', '#fdcb6e', '#55efc4', '#74b9ff', '#a29bfe']) this.burst(p.x, p.y, p.z, c, 16, 1.6)
    audio.play('win')
    this.opts.onEvent?.('win')
    this._emit()
  }

  /* ------------------------------------------------------------ effects */
  burst(x, y, z, color, n = 12, power = 1) {
    const U = this.U, is3d = this.is3d
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y, z,
        vx: rand(-1, 1) * U.pv * power,
        vy: (is3d ? rand(0.2, 1.4) : rand(-1.4, 0.2)) * U.pv * power,
        vz: is3d ? rand(-1, 1) * U.pv * power : 0,
        life: rand(0.5, 1), max: 1, color,
        size: is3d ? rand(0.08, 0.2) : rand(4, 9),
      })
    }
  }

  _updateParticles(dt) {
    const g = this.is3d ? -9 : 700
    const ps = this.particles
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i]
      p.life -= dt
      if (p.life <= 0) { ps.splice(i, 1); continue }
      p.vy += g * dt
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt
    }
  }

  /* ------------------------------------------------------------- camera */
  _cameraTarget() {
    const f = this.ents.find((e) => e.alive && e.b.camera)
    return f || null
  }

  _snapCamera() {
    const f = this._cameraTarget()
    if (!f) return
    if (this.is3d) { this.camera.x = f.x; this.camera.y = f.y + 1; this.camera.z = f.z }
    else { this.camera.x = f.x; this.camera.y = f.y - 40 }
  }

  _followCamera(dt) {
    const f = this._cameraTarget()
    if (!f) return
    const k = 1 - Math.exp(-dt * 6), c = this.camera
    if (this.is3d) { c.x += (f.x - c.x) * k; c.y += (f.y + 1 - c.y) * k; c.z += (f.z - c.z) * k }
    else { c.x += (f.x - c.x) * k; c.y += (f.y - 40 - c.y) * k }
  }

  /* ------------------------------------------------------------- render */
  draw() {
    const visible = this.ents.filter((e) => e.alive && e.visible !== false)
    this.renderer.render({ entities: visible, particles: this.particles, camera: this.camera, project: this.project, time: this.time })
  }

  _emit() {
    if (this.opts.onState) this.opts.onState({ ...this.state })
  }

  /* ------------------------------------------------------------ pointer */
  _bindPointer() {
    const c = this.canvas
    this._pd = (ev) => { this._drag = { x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, moved: false }; try { c.setPointerCapture(ev.pointerId) } catch (_) { /* ignore */ } }
    this._pm = (ev) => {
      const d = this._drag
      if (!d) return
      if (!d.moved && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 5) d.moved = true
      if (d.moved && this.is3d) {
        this.camera.yaw -= (ev.clientX - d.lx) * 0.4
        this.camera.pitch = clamp(this.camera.pitch + (ev.clientY - d.ly) * 0.3, 5, 85)
      }
      d.lx = ev.clientX; d.ly = ev.clientY
    }
    this._pu = (ev) => {
      const d = this._drag
      this._drag = null
      if (!d || d.moved || this.state.status !== 'playing') return
      const r = c.getBoundingClientRect()
      this._click(ev.clientX - r.left, ev.clientY - r.top)
    }
    c.addEventListener('pointerdown', this._pd)
    c.addEventListener('pointermove', this._pm)
    c.addEventListener('pointerup', this._pu)
    c.addEventListener('pointercancel', this._pu)
  }

  _unbindPointer() {
    const c = this.canvas
    c.removeEventListener('pointerdown', this._pd)
    c.removeEventListener('pointermove', this._pm)
    c.removeEventListener('pointerup', this._pu)
    c.removeEventListener('pointercancel', this._pu)
  }

  _click(px, py) {
    const e = this.renderer.pick(px, py, this.ents.filter((o) => o.alive && o.visible !== false), this.camera)
    if (e && e.b.clicker) {
      this.state.score += e.b.clicker.points
      e.pulse = 1
      this.burst(e.x, e.y, e.z, e.color || '#fdcb6e', 10)
      audio.play('pop')
      this._emit()
    }
  }
}
