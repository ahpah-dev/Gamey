// The Gamey runtime: fixed-step game loop, physics, behaviors, rules, camera.
import { behaviorDefaults } from './behaviors.js'
import { Input } from './input.js'
import { audio } from './audio.js'
import { normalizeProject } from './entities.js'
import { clamp, rand, DEG } from './math.js'
import { createRenderer } from './renderer.js'
import { resolveAnim, stepAnim } from './anim.js'

const STEP = 1 / 60
const EPS = 1e-4

// Friendly 1-10 slider values -> real units
const UNITS = {
  '2d': { speed: 52, jump: 150, g: 1900, maxFall: 1400, dist: 40, pspeed: 40, sight: 90, bob: 6, pv: 220, arena: 0, drift: 45, shot: 75, spread: 40 },
  '3d': { speed: 1.2, jump: 2.3, g: -32, maxFall: 40, dist: 1, pspeed: 0.8, sight: 2.5, bob: 0.12, pv: 4.5, arena: 14, drift: 0.9, shot: 1, spread: 1 },
}
const CLOCK = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM']
const SHOTS = {
  laser: { type: 'rect', w: 28, h: 7, color: '#ff5f6d', radius: 4 },
  fire: { type: 'circle', w: 20, h: 20, color: '#ff9f43' },
  star: { type: 'sprite', sprite: 'b:star', w: 24, h: 24, color: '#ffd54f' },
  ball: { type: 'circle', w: 14, h: 14, color: '#ffffff' },
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
    this._ptr = null
    this._bindPointer()
    audio.setMuted(this.project.settings.sound === false)
    this.reset()
  }

  /* ----------------------------------------------------------- lifecycle */
  reset() {
    const p = this.project
    this.rooms = p.rooms || []
    this.ents = p.objects.map((o, i) => this._spawn(o, i))
    this.particles = []
    this.bullets = []
    this.time = 0
    this.sw = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false }
    this.room = this.rooms.length ? this.rooms[0].id : ''
    this.power = 100
    this.blackout = false
    this.scare = null
    this.mouse = { x: 0.5 }
    this._snap = true
    this._projCache = null
    this._hudKey = ''
    this.live = this.ents.filter((e) => this._act(e))
    const S = p.settings
    this.state = {
      score: 0, lives: S.lives, status: 'playing',
      collected: 0, total: this.ents.filter((e) => (e.b.collect || e.b.health) && !e.inert).length,
      night: !!S.night, survive: S.survive || 0, power: 100, clock: CLOCK[0], left: S.survive || 0, blackout: false,
      room: this.rooms.length ? this.rooms[0].name : '', hasShoot: this.ents.some((e) => e.b.shoot), hasJump: this.ents.some((e) => e.b.platformer), hasMove: this.ents.some((e) => e.isPlayer), icon: this.ents.some((e) => e.b.collect && !e.inert) ? '🟡' : '🎯',
    }
    this.hasGoal = this.ents.some((e) => e.b.goal)
    this.hasSpawner = this.ents.some((e) => e.b.spawner)
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
    e.inert = !!e.b.spawner
    e.isPlayer = !!(e.b.move || e.b.platformer || (e.b.drive && this.project.mode === '2d'))
    e.px = e.x; e.py = e.y; e.pz = e.z
    e.hp = e.b.health ? e.b.health.hits : 0
    e.aim = { x: e.flip ? -1 : 1, y: e.b.platformer ? 0 : -1 }
    e.cool = 0; e.spd = 0; e.age = 0
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
    if (this.scare) {
      this.scare.t += dt
      if (this.scare.t > 1.5) { const sc = this.scare; this.scare = null; this._attackDone(sc.e) }
      return
    }
    this.time += dt
    if (this._night()) return
    if (this.ents.length > 240) this.ents = this.ents.filter((e) => e.alive || !e.spawned)
    const ents = this.ents
    this._spawners(dt)
    this.live = ents.filter((e) => this._act(e))
    const live = this.live
    for (const e of live) { e.px = e.x; e.py = e.y; e.pz = e.z }
    for (const e of live) this._mover(e, dt)
    for (const e of live) if (e.alive && e.b.gate && s.collected >= e.b.gate.need) this._openGate(e)
    const solids = live.filter((e) => e.alive && (e.b.solid || e.b.gate))
    for (const e of live) if (e.alive && (e.isPlayer || e.b.gravity)) this._body(e, dt, solids)
    for (const e of live) if (e.alive && e.b.shoot) this._shoot(e, dt)
    this._bulletsStep(dt, solids)
    for (const e of ents) {
      if (!e.alive) continue
      if (e.pulse > 0) e.pulse = Math.max(0, e.pulse - dt * 4)
      if (e.invuln > 0) { e.invuln -= dt; e.alpha = Math.floor(this.time * 14) % 2 ? 0.35 : 1; if (e.invuln <= 0) e.alpha = 1 }
    }
    for (const p of live) if (p.alive && p.isPlayer) this._triggers(p)
    this._stalkers(dt)
    if (s.status === 'playing' && this.project.settings.win === 'auto' && !this.hasGoal && !this.hasSpawner && s.total > 0 && s.collected >= s.total) this._win()
    this._animate(dt)
    this._followCamera(dt)
  }

  /* ----------------------------------------------------- rooms & conditions */
  _inRoom(e) { return !this.rooms.length || !e.room || e.room === this.room }
  _whenOk(e) { const w = e.when; return !w || !w.sw || !!this.sw[w.sw] === (w.on !== false) }
  _act(e) { return e.alive && !e.inert && this._inRoom(e) && this._whenOk(e) }
  _show(e) { return this._act(e) && e.visible !== false }

  _setRoom(id) {
    if (!id || id === this.room || !this.rooms.some((r) => r.id === id)) return
    this.room = id
    this._snap = true
    this.state.room = this.rooms.find((r) => r.id === id).name
    this._emit()
  }

  /** hud objects stay put on screen: convert them into the current camera's world space */
  _viewOf(e) {
    if (!e.hud || this.is3d) return e
    const c = this.camera, z = c.zoom || 1, W = this.project.world
    return { ...e, x: c.x + (e.x - W.w / 2) / z, y: c.y + (e.y - W.h / 2) / z, w: e.w / z, h: e.h / z, _src: e }
  }

  /* --------------------------------------------------------- night & power */
  _night() {
    const S = this.project.settings, st = this.state
    const dur = S.survive || 0
    if (S.night && !this.blackout) {
      const used = {}
      for (const e of this.ents) if (e.alive && e.b.toggle) used[e.b.toggle.switch] = Math.max(used[e.b.toggle.switch] || 0, e.b.toggle.drain)
      let use = 0.12
      for (const n in used) if (this.sw[n]) use += used[n] * 0.1
      if (this.rooms.length && this.room !== this.rooms[0].id) use += 0.35
      this.power = Math.max(0, this.power - use * STEP)
      if (this.power <= 0) {
        this.blackout = true
        for (const n in this.sw) this.sw[n] = false
        audio.play('power')
      }
    }
    const left = dur ? Math.max(0, Math.ceil(dur - this.time)) : 0
    const clock = CLOCK[dur ? Math.min(6, Math.floor((this.time / dur) * 6)) : 0]
    const power = Math.ceil(this.power), key = [left, clock, power, this.blackout].join()
    if (key !== this._hudKey) {
      this._hudKey = key
      st.left = left; st.clock = clock; st.power = power; st.blackout = this.blackout
      this._emit()
    }
    if (dur && this.time >= dur) { if (S.night) audio.play('bell'); this._win(); return true }
    return false
  }

  /* -------------------------------------------------------------- stalkers */
  _stalkers(dt) {
    for (const e of this.ents) {
      if (!e.alive || !e.b.stalker) continue
      const b = e.b.stalker
      if (!e.path) {
        const here = { room: e.room || (this.rooms[0] && this.rooms[0].id) || '', x: e.x0, y: e.y0 }
        e.path = [here, ...(b.route || []).map((r) => ({ room: r.room, x: r.x ?? e.x0, y: r.y ?? e.y0 }))]
        e.st = { i: 0, t: rand(3, 7), wait: 0 }
        e.room = here.room
      }
      const last = e.path.length - 1
      if (last < 1) continue
      const lvl = b.level * (this.blackout ? 1.8 : 1)
      if (e.st.i < last) {
        e.st.t -= dt
        if (e.st.t <= 0) {
          e.st.t = Math.max(2.2, 11 - lvl * 0.75) + rand(0, 3)
          if (Math.random() < 0.3 + lvl * 0.07) this._stalkTo(e, e.st.i + 1, lvl)
        }
      } else {
        e.st.wait -= dt
        if (e.st.wait <= 0) {
          if (b.block && this.sw[b.block]) {
            audio.play('knock')
            this._stalkTo(e, Math.random() < 0.5 ? 0 : Math.max(0, last - 2), lvl)
            e.st.t = 5 + rand(0, 4)
          } else this._jumpscare(e)
        }
      }
    }
  }

  _stalkTo(e, i, lvl) {
    const last = e.path.length - 1, p = e.path[i]
    e.st.i = i; e.room = p.room; e.x = p.x; e.y = p.y
    if (i === last) { e.st.wait = Math.max(2.4, 6.5 - lvl * 0.35); audio.play('knock') } else if (i === last - 1) audio.play('step')
  }

  _jumpscare(e) {
    this.scare = { t: 0, e }
    audio.play('scare')
  }

  _attackDone() {
    const s = this.state
    s.lives--
    if (s.lives <= 0) {
      s.lives = 0; s.status = 'lost'
      audio.play('lose')
      this.opts.onEvent?.('lose')
    } else {
      for (const x of this.ents) if (x.b.stalker && x.path) { x.st.i = 0; x.st.t = 6 + rand(0, 3); x.room = x.path[0].room; x.x = x.path[0].x; x.y = x.path[0].y }
      for (const n in this.sw) this.sw[n] = false
    }
    this._emit()
  }

  /* -------------------------------------------------- spawners & bullets */
  _spawners(dt) {
    for (const t of this.ents) {
      if (!t.alive || !t.b.spawner || !this._inRoom(t)) continue
      const b = t.b.spawner
      t.spT = (t.spT ?? 0.6) - dt
      if (t.spT > 0) continue
      t.spT = (3.4 - b.rate * 0.3) * (0.7 + Math.random() * 0.6)
      let n = 0
      for (const e of this.ents) if (e.spawnOf === t.id && e.alive) n++
      if (n >= b.max) continue
      const src = this.project.objects.find((o) => o.id === t.id) || t
      const sp = b.spread * this.U.spread
      const clone = this._spawn({
        ...src, id: t.id + '~' + Math.random().toString(36).slice(2, 6), x: t.x + rand(-sp, sp), y: t.y, z: this.is3d ? t.z + rand(-sp, sp) : 0,
        behaviors: (src.behaviors || []).filter((x) => x.type !== 'spawner'),
      }, this.ents.length)
      clone.spawnOf = t.id; clone.spawned = true; clone.life = b.life; clone.room = t.room
      this.ents.push(clone)
    }
  }

  _openGate(e) {
    e.alive = false
    this.burst(e.x, e.y, e.z, e.color || '#fdcb6e', 18)
    audio.play('door')
  }

  _shoot(e, dt) {
    const b = e.b.shoot
    e.cool = Math.max(0, e.cool - dt)
    if (this.is3d) return
    const inp = this.input, ptr = this._ptr
    const key = inp.isDown('fire') || (!e.b.platformer && inp.isDown('Space'))
    const mouse = ptr && ptr.down && ptr.fire
    if (!(key || mouse) || e.cool > 0) return
    let ax = e.aim.x, ay = e.aim.y
    if (b.aim === 'up') { ax = 0; ay = -1 }
    if (mouse && !key) {
      const w = this.renderer.toWorld(ptr.px, ptr.py, this.camera)
      const dx = w.x - e.x, dy = w.y - e.y, l = Math.hypot(dx, dy) || 1
      ax = dx / l; ay = dy / l
    }
    e.cool = 0.62 - b.rate * 0.055
    const look = SHOTS[b.shot] || SHOTS.laser, sp = b.speed * this.U.shot
    this.bullets.push({
      ...look, id: 'bullet', visible: true, opacity: 1, rz: Math.atan2(ay, ax) / DEG, x: e.x + ax * (e.w / 2 + 6), y: e.y + ay * (e.h / 2 + 6), z: 0,
      vx: ax * sp, vy: ay * sp, life: 2.2, owner: e, room: e.room,
    })
    audio.play('shoot')
  }

  _bulletsStep(dt, solids) {
    const bs = this.bullets, W = this.project.world
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i]
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt
      let dead = b.life <= 0 || b.x < -300 || b.y < -300 || b.x > W.w + 3000 || b.y > W.h + 600
      if (!dead) for (const s of solids) if (s !== b.owner && !s.b.health && overlap(b, s, 1, false)) { dead = true; break }
      if (!dead) {
        for (const e of this.live) {
          if (!e.alive || !e.b.health || e === b.owner || !overlap(b, e, 1, false)) continue
          dead = true
          e.hp--; e.pulse = 1
          this.burst(b.x, b.y, 0, e.color || '#ffd54f', 5, 0.5)
          if (e.hp <= 0) {
            e.alive = false
            this.state.score += e.b.health.points
            if (!e.spawned) this.state.collected++
            this.burst(e.x, e.y, 0, e.color || '#ff7675', 16)
            audio.play('boom')
            this._emit()
          } else audio.play('pop')
          break
        }
      }
      if (dead) bs.splice(i, 1)
    }
  }

  /* ------------------------------------------------------------ animation */
  _animate(dt) {
    const mode = this.project.mode, anims = this.project.anims, is3d = this.is3d
    const resolve = (r) => resolveAnim(r, anims, mode)
    for (const e of this.live) {
      if (!(e.anim || e.animMove || e.animAir || e.shot)) continue
      let want = e.anim || null
      const dx = e.x - e.px, dz = is3d ? e.z - e.pz : e.b.platformer || e.b.gravity ? 0 : e.y - e.py
      if (e.animMove && Math.hypot(dx, dz) > (is3d ? 0.004 : 0.35)) want = e.animMove
      if (e.animAir && e.b.platformer && !e.grounded) want = e.animAir
      if (e.shot) {
        const a = resolve(e.shot.ref)
        e.shot.t += dt * (e.animSpeed || 1)
        if (!a || e.shot.t >= (a.dur || 1)) e.shot = null
        else want = e.shot.ref
      }
      stepAnim(e, want, dt, resolve)
    }
  }

  /* -------------------------------------------------------------- motion */
  _mover(e, dt) {
    const b = e.b, U = this.U, is3d = this.is3d
    const px = e.x, py = e.y, pz = e.z
    if (e.life > 0) { e.age += dt; if (e.age > e.life) { e.alive = false; return } }
    if (e.spawned && !is3d) {
      const W = this.project.world
      if (e.x < -400 || e.x > W.w + 400 || e.y < -400 || e.y > W.h + 400) { e.alive = false; return }
    }
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
    if (b.drift) {
      const sp = b.drift.speed * U.drift * dt, d = b.drift.dir
      if (d === 'left') e.x -= sp
      else if (d === 'right') e.x += sp
      else if (d === 'up') { if (is3d) e.z -= sp; else e.y -= sp }
      else if (is3d) e.z += sp
      else e.y += sp
    }
    if (b.bounce) this._bounce(e, dt)
    if (b.follow) {
      const t = this.live.find((o) => o.alive && o.isPlayer)
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
    if (!e.isPlayer) {
      if (is3d) { if (e.model && !b.spin && (e.dx || e.dz)) this._face(e, e.dx, e.dz, dt) }
      else if (Math.abs(e.dx) > 0.01 && (e.type === 'sprite' || e.type === 'emoji') && !b.drift) e.flip = e.dx < 0
    }
  }

  _face(e, dx, dz, dt) {
    const target = Math.atan2(dx, dz) / DEG
    const diff = ((target - e.ry + 540) % 360) - 180
    e.ry += diff * Math.min(1, dt * 12)
  }

  _bounce(e, dt) {
    const is3d = this.is3d, W = this.project.world
    const solids = this.live.filter((o) => o !== e && o.alive && o.b.solid)
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
    if (b.drive && !is3d) {
      const a = inp.axis(), maxv = b.drive.speed * U.speed * 0.75, acc = maxv * 1.8
      if (a.y < 0) e.spd += acc * dt
      else if (a.y > 0) e.spd -= acc * 1.6 * dt
      else e.spd -= Math.sign(e.spd) * Math.min(Math.abs(e.spd), acc * 0.7 * dt)
      e.spd = clamp(e.spd, -maxv * 0.4, maxv)
      const grip = Math.min(1, Math.abs(e.spd) / (maxv * 0.35)) * Math.sign(e.spd)
      e.rz = (e.rz || 0) + a.x * b.drive.turn * 24 * grip * dt
      const h = e.rz * DEG
      e.vx = Math.sin(h) * e.spd; e.vy = -Math.cos(h) * e.spd
    } else if (pb) {
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
    if (e.isPlayer) {
      if (!is3d) {
        if (!b.drive) {
          if (e.vx) e.flip = e.vx < 0
          const l = Math.hypot(e.vx, b.platformer ? 0 : e.vy)
          if (l > 1) e.aim = { x: e.vx / l, y: b.platformer ? 0 : e.vy / l }
          else if (b.platformer) e.aim = { x: e.flip ? -1 : 1, y: 0 }
        } else e.aim = { x: Math.sin(e.rz * DEG), y: -Math.cos(e.rz * DEG) }
      } else if (e.model && (e.vx || e.vz)) this._face(e, e.vx, e.vz, dt)
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
    const sx = e.vx, sy = e.vy
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
    if (b.drive && !is3d && (e.vx !== sx || e.vy !== sy)) e.spd *= 0.45
    if (e.isPlayer && (is3d ? e.y < this.fallLimit : e.y > this.fallLimit)) this._hurt(e)
  }

  _triggers(p) {
    const is3d = this.is3d
    for (const e of this.live) {
      if (!e.alive || e === p) continue
      const t = e.b
      if (!(t.collect || t.hazard || t.goal)) continue
      if (!overlap(p, e, 0.8, is3d)) continue
      if (t.collect) {
        e.alive = false
        this.state.score += t.collect.points
        if (!e.spawned) this.state.collected++
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
    p.spd = 0
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
    const f = this.live.find((e) => e.alive && e.b.camera)
    return f || null
  }

  _roomDef() { return this.rooms.find((r) => r.id === this.room) || null }

  _snapCamera() {
    const f = this._cameraTarget()
    if (!f) return
    if (this.is3d) { this.camera.x = f.x; this.camera.y = f.y + 1; this.camera.z = f.z }
    else { this.camera.x = f.x; this.camera.y = f.y - 40 }
  }

  _followCamera(dt) {
    const c = this.camera
    if (!this.is3d) {
      const W = this.project.world, room = this._roomDef()
      if (room && room.pan) {
        // "look around" rooms: the mouse slides a zoomed-in view left and right
        const z = 1.35, vw = W.w / z
        const m = clamp((this.mouse.x - 0.5) * 1.7 + 0.5, 0, 1)
        const tx = vw / 2 + (W.w - vw) * m, ty = W.h / 2
        const k = this._snap ? 1 : 1 - Math.exp(-dt * 6)
        c.zoom += (z - c.zoom) * k; c.x += (tx - c.x) * k; c.y += (ty - c.y) * k
        this._snap = false
        return
      }
      if (this.rooms.length && !this._cameraTarget()) {
        const k = this._snap ? 1 : 1 - Math.exp(-dt * 8)
        c.zoom += (1 - c.zoom) * k; c.x += (W.w / 2 - c.x) * k; c.y += (W.h / 2 - c.y) * k
        this._snap = false
        return
      }
    }
    const f = this._cameraTarget()
    if (!f) return
    const k = 1 - Math.exp(-dt * 6)
    if (this.is3d) { c.x += (f.x - c.x) * k; c.y += (f.y + 1 - c.y) * k; c.z += (f.z - c.z) * k }
    else { c.x += (f.x - c.x) * k; c.y += (f.y - 40 - c.y) * k }
  }

  /* ------------------------------------------------------------- render */
  _roomProject() {
    const room = this._roomDef()
    if (!room || !room.bg) return this.project
    if (!this._projCache || this._projCache.room !== room) this._projCache = { room, proj: { ...this.project, background: room.bg } }
    return this._projCache.proj
  }

  draw() {
    const W = this.project.world
    let cam = this.camera
    const ents = []
    if (this.scare) {
      const sc = this.scare, src = sc.e, t = sc.t
      cam = { x: W.w / 2, y: W.h / 2, zoom: 1 }
      const k = ((W.h * 1.5) / (src.h || 1)) * (1 + t * 0.25)
      const sh = 18 * (1 - Math.min(1, t / 1.5))
      ents.push({ type: 'rect', x: W.w / 2, y: W.h / 2, w: W.w * 3, h: W.h * 3, color: Math.floor(t * 18) % 2 ? '#3a0000' : '#000000', opacity: 1, radius: 0, visible: true })
      ents.push({ ...src, x: W.w / 2 + rand(-sh, sh), y: W.h / 2 + W.h * 0.12 + rand(-sh, sh), w: src.w * k, h: src.h * k, flip: false, rz: 0, alpha: 1, opacity: 1, visible: true })
      this.renderer.render({ entities: ents, particles: [], camera: cam, project: this._roomProject(), time: this.time })
      return
    }
    const huds = []
    for (const e of this.ents) {
      if (!this._show(e)) continue
      if (e.hud && !this.is3d) huds.push(this._viewOf(e)); else ents.push(e)
    }
    for (const b of this.bullets) ents.push(b)
    if (this.blackout && !this.is3d) ents.push({ type: 'rect', x: cam.x, y: cam.y, w: W.w * 4, h: W.h * 4, color: '#000000', opacity: 0.8, radius: 0, visible: true })
    for (const h of huds) ents.push(h)
    this.renderer.render({ entities: ents, particles: this.particles, camera: cam, project: this._roomProject(), time: this.time })
  }

  _emit() {
    if (this.opts.onState) this.opts.onState({ ...this.state })
  }

  /* ------------------------------------------------------------ pointer */
  _pickList() {
    const list = []
    for (const e of this.ents) if (this._show(e)) list.push(this._viewOf(e))
    return list
  }

  _bindPointer() {
    const c = this.canvas
    this._pd = (ev) => {
      const r = c.getBoundingClientRect()
      const px = ev.clientX - r.left, py = ev.clientY - r.top
      this._drag = { x: ev.clientX, y: ev.clientY, lx: ev.clientX, ly: ev.clientY, moved: false }
      // hold to shoot, unless the pointer is on a button-like object
      let fire = true
      if (!this.is3d) {
        const hit = this.renderer.pick(px, py, this._pickList(), this.camera)
        const t = hit && (hit._src || hit)
        if (t && (t.b.clicker || t.b.toggle || t.b.goto)) fire = false
      }
      this._ptr = { px, py, down: true, fire }
      try { c.setPointerCapture(ev.pointerId) } catch (_) { /* ignore */ }
    }
    this._pm = (ev) => {
      const r = c.getBoundingClientRect()
      this.mouse.x = clamp((ev.clientX - r.left) / (r.width || 1), 0, 1)
      if (this._ptr) { this._ptr.px = ev.clientX - r.left; this._ptr.py = ev.clientY - r.top }
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
      if (this._ptr) this._ptr.down = false
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
    if (this.scare) return
    const hit = this.renderer.pick(px, py, this._pickList(), this.camera)
    const e = hit && (hit._src || hit)
    if (!e) return
    if (e.animClick) e.shot = { ref: e.animClick, t: 0 }
    if (e.b.clicker) {
      this.state.score += e.b.clicker.points
      e.pulse = 1
      this.burst(e.x, e.y, e.z, e.color || '#fdcb6e', 10)
      audio.play('pop')
      this._emit()
    }
    if (e.b.toggle && !this.blackout) {
      const n = e.b.toggle.switch
      this.sw[n] = !this.sw[n]
      e.pulse = 0.6
      audio.play(e.b.toggle.drain >= 3 ? 'door' : 'click')
    }
    if (e.b.goto) { e.pulse = 0.5; audio.play('click'); this._setRoom(e.b.goto.room) }
  }
}
