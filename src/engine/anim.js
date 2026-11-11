// Animations: keyframed poses on named bones. "root" is the whole object.
// anim = { name, dur (seconds), loop, ease, keys: [{ t: 0..1, pose: { bone: { x,y,z, rx,ry,rz, sx,sy,sz, o } } }] }
//   x/y/z  move, as a fraction of the object's size   rx/ry/rz  turn, degrees
//   sx/sy/sz  size multipliers (1 = normal)           o  opacity multiplier (1 = normal)
// A reference is 'b:<name>' (built-in, per mode) or 'c:<id>' (project.anims[id]).
import { clamp } from './math.js'
import { normRef } from './sprites.js'

export const POSE_PROPS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'sx', 'sy', 'sz', 'o']
export const propDefault = (p) => (p === 'sx' || p === 'sy' || p === 'sz' || p === 'o' ? 1 : 0)

const val = (b, p) => (b && b[p] !== undefined ? b[p] : propDefault(p))

/** Blend two poses (either may be null). */
export function lerpPose(a, b, k) {
  if (!a && !b) return null
  a = a || {}; b = b || {}
  const out = {}
  const bones = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const bone of bones) {
    const pa = a[bone], pb = b[bone], o = (out[bone] = {})
    for (const p of POSE_PROPS) {
      if ((pa && pa[p] !== undefined) || (pb && pb[p] !== undefined)) {
        const x = val(pa, p)
        o[p] = x + (val(pb, p) - x) * k
      }
    }
  }
  return out
}

const clonePose = (p) => lerpPose(p, p, 0)

/** The pose of an animation at `time` seconds. */
export function samplePose(anim, time) {
  const keys = anim && anim.keys
  if (!keys || !keys.length) return null
  const n = keys.length
  if (n === 1) return clonePose(keys[0].pose)
  const loop = anim.loop !== false
  let u = time / (anim.dur || 1)
  u = loop ? u - Math.floor(u) : clamp(u, 0, 1)
  let a, b, k
  if (u <= keys[0].t) {
    if (!loop) return clonePose(keys[0].pose)
    a = keys[n - 1]; b = keys[0]
    k = (u + 1 - a.t) / Math.max(1e-6, 1 - a.t + b.t)
  } else {
    let i = 0
    while (i + 1 < n && keys[i + 1].t <= u) i++
    a = keys[i]
    if (i === n - 1) {
      if (!loop) return clonePose(a.pose)
      b = keys[0]
      k = (u - a.t) / Math.max(1e-6, 1 - a.t + b.t)
    } else { b = keys[i + 1]; k = (u - a.t) / Math.max(1e-6, b.t - a.t) }
  }
  if (anim.ease !== false) k = (1 - Math.cos(Math.PI * k)) / 2
  return lerpPose(a.pose, b.pose, k)
}

/** Move an entity's animation state forward and store its current pose in e.pose. */
export function stepAnim(e, wanted, dt, resolve) {
  let s = e.an
  if (!s) s = e.an = { ref: wanted, t: 0, prev: null, pt: 0, k: 1 }
  if (wanted !== s.ref) { s.prev = s.ref; s.pt = s.t; s.ref = wanted; s.t = 0; s.k = 0 }
  s.t += dt * (e.animSpeed || 1)
  if (s.k < 1) s.k = Math.min(1, s.k + dt / 0.15)
  const a = wanted ? resolve(wanted) : null
  let pose = a ? samplePose(a, s.t) : null
  if (s.k < 1 && s.prev) {
    const pa = resolve(s.prev)
    pose = lerpPose(pa ? samplePose(pa, s.pt) : null, pose, s.k)
  }
  e.pose = pose
}

/** Bone names an animation moves (everything it sets poses on). */
export function animBones(anim) {
  const set = new Set()
  for (const k of (anim && anim.keys) || []) for (const b in k.pose) set.add(b)
  return [...set]
}

/**
 * How well an animation syncs with a rig, 0..1.
 * Shared animations (walk, run, jump…) swing the parts of several kinds of model at
 * once (human legs *and* animal legs), so this compares the two sets both ways: an
 * animation fits when its smaller side is fully covered — a person only needs the
 * human bones of "walk", an animal only the animal ones. Animations that move the
 * whole object ("root" only) always fit, and a model with no moving parts never does.
 */
export function animFit(anim, bones) {
  const used = animBones(anim).filter((b) => b !== 'root')
  if (!used.length) return 1
  const have = new Set((bones || []).filter((b) => b && b !== 'root'))
  if (!have.size) return 0
  const hit = used.filter((b) => have.has(b)).length
  if (!hit) return 0
  return hit / Math.min(used.length, have.size)
}

/* ------------------------------------------------------------ authoring helpers */
// wave(dur, { bone: { prop: [amplitude, phase(0..1), cycles, offset] } })
function wave(dur, spec, extra = {}) {
  const N = 16, keys = []
  for (let i = 0; i < N; i++) {
    const t = i / N, pose = {}
    for (const bone in spec) {
      pose[bone] = {}
      for (const p in spec[bone]) {
        const [amp, ph = 0, fr = 1, off = propDefault(p)] = spec[bone][p]
        pose[bone][p] = Math.round((off + amp * Math.sin(2 * Math.PI * (fr * t + ph))) * 1000) / 1000
      }
    }
    keys.push({ t, pose })
  }
  return { dur, loop: true, ease: false, keys, ...extra }
}
// kf(dur, [[t, { bone: {...} }], ...])
const kf = (dur, list, extra = {}) => ({ dur, loop: true, keys: list.map(([t, pose]) => ({ t, pose })), ...extra })
const ramp = (dur, bones, prop, to, extra = {}) =>
  kf(dur, [0, 0.25, 0.5, 0.75, 1].map((t) => [t, Object.fromEntries(bones.map((b) => [b, { [prop]: to * t }]))]), { ease: false, ...extra })

const def = (icon, name, desc, anim, rig = false) => ({ icon, name, desc, rig, ...anim })

export const ANIMS = {
  '3d': {
    idle: def('🫁', 'Breathe', 'Gently breathes. Characters also sway a little.', wave(2.6, { root: { sy: [0.02, 0, 1, 1], y: [0.008, 0, 1, 0] }, armL: { rz: [4, 0, 1] }, armR: { rz: [-4, 0, 1] }, head: { rx: [2.5, 0.25, 1] }, tail: { ry: [14, 0, 1] } })),
    bounce: def('🏀', 'Bounce', 'Squashes and springs up and down.', kf(0.8, [[0, { root: { y: 0, sy: 0.86, sx: 1.12, sz: 1.12 } }], [0.5, { root: { y: 0.22, sy: 1.1, sx: 0.94, sz: 0.94 } }], [1, { root: { y: 0, sy: 0.86, sx: 1.12, sz: 1.12 } }]])),
    hop: def('🐸', 'Hop', 'A big jump, then a rest.', kf(1.1, [[0, { root: { y: 0 } }], [0.2, { root: { y: -0.06, sy: 0.9, sx: 1.08, sz: 1.08 } }], [0.45, { root: { y: 0.5, sy: 1.08 } }], [0.7, { root: { y: 0, sy: 0.9, sx: 1.08, sz: 1.08 } }], [0.85, { root: { y: 0 } }], [1, { root: { y: 0 } }]])),
    spin: def('🌀', 'Spin', 'Turns round and round.', ramp(2, ['root'], 'ry', 360)),
    twirl: def('💫', 'Twirl', 'Spins while hopping.', kf(1.2, [0, 0.25, 0.5, 0.75, 1].map((t) => [t, { root: { ry: 360 * t, y: Math.sin(t * Math.PI) * 0.12 } }]), { ease: false })),
    flip: def('🤸', 'Flip', 'A front flip, over and over.', kf(1.1, [0, 0.25, 0.5, 0.75, 1].map((t) => [t, { root: { rx: 360 * t, y: Math.sin(t * Math.PI) * 0.3 } }]), { ease: false })),
    wobble: def('🍮', 'Wobble', 'Wobbles side to side like jelly.', wave(1, { root: { rz: [8, 0, 1], sy: [0.04, 0.25, 2, 1], sx: [0.04, 0.75, 2, 1] } })),
    float: def('🎈', 'Float', 'Drifts up and down, turning slowly.', wave(3.2, { root: { y: [0.08, 0, 1], ry: [15, 0.25, 1], rz: [3, 0.5, 1] } })),
    pulse: def('💓', 'Pulse', 'Grows and shrinks like a heartbeat.', wave(0.9, { root: { sx: [0.08, 0, 1, 1], sy: [0.08, 0, 1, 1], sz: [0.08, 0, 1, 1] } })),
    shake: def('📳', 'Shake', 'Shivers and shakes!', wave(0.22, { root: { x: [0.03, 0, 1], rz: [2, 0.25, 1] } })),
    swing: def('🎢', 'Swing', 'Swings like a pendulum.', wave(1.8, { root: { rz: [25, 0, 1] } })),
    squish: def('🧽', 'Squish', 'Squashes flat and pops back.', kf(0.9, [[0, { root: { sy: 1, sx: 1, sz: 1, y: 0 } }], [0.5, { root: { sy: 0.72, sx: 1.18, sz: 1.18, y: -0.14 } }], [1, { root: { sy: 1, sx: 1, sz: 1, y: 0 } }]])),
    popin: def('✨', 'Pop in', 'Pops into view (plays once).', kf(0.5, [[0, { root: { sx: 0.01, sy: 0.01, sz: 0.01 } }], [0.6, { root: { sx: 1.2, sy: 1.2, sz: 1.2 } }], [1, { root: { sx: 1, sy: 1, sz: 1 } }]], { loop: false })),
    flicker: def('💡', 'Flicker', 'Flickers like a bad light.', kf(1.4, [[0, { root: { o: 1 } }], [0.1, { root: { o: 0.2 } }], [0.2, { root: { o: 1 } }], [0.55, { root: { o: 1 } }], [0.62, { root: { o: 0.35 } }], [0.7, { root: { o: 1 } }], [1, { root: { o: 1 } }]], { ease: false })),
    sway: def('🌴', 'Sway', 'Sways in the wind (great for trees).', wave(3.4, { root: { rz: [4, 0, 1], rx: [2, 0.25, 1] } })),

    walk: def('🚶', 'Walk', 'Swings arms and legs. Works on people and animals.', wave(0.8, {
      legL: { rx: [35] }, legR: { rx: [35, 0.5] }, armL: { rx: [28, 0.5] }, armR: { rx: [28] },
      legFL: { rx: [30] }, legBR: { rx: [30] }, legFR: { rx: [30, 0.5] }, legBL: { rx: [30, 0.5] },
      root: { y: [0.012, 0, 2] }, head: { rz: [2.5, 0, 1] }, tail: { ry: [18, 0.25, 2] },
    }), true),
    run: def('🏃', 'Run', 'Fast running with a forward lean.', wave(0.52, {
      legL: { rx: [58] }, legR: { rx: [58, 0.5] }, armL: { rx: [62, 0.5] }, armR: { rx: [62] },
      legFL: { rx: [50] }, legBR: { rx: [50] }, legFR: { rx: [50, 0.5] }, legBL: { rx: [50, 0.5] },
      root: { y: [0.03, 0, 2], rx: [0, 0, 1, 12] }, tail: { ry: [20, 0.25, 2] },
    }), true),
    jump: def('🦘', 'Jump', 'Arms up, legs tucked. Use it for “in the air”.', wave(0.6, {
      armL: { rz: [8, 0, 1, -140] }, armR: { rz: [8, 0.5, 1, 140] }, legL: { rx: [0, 0, 1, 25] }, legR: { rx: [0, 0, 1, -20] },
      legFL: { rx: [0, 0, 1, -30] }, legFR: { rx: [0, 0, 1, -30] }, legBL: { rx: [0, 0, 1, 30] }, legBR: { rx: [0, 0, 1, 30] },
      root: { sy: [0.02, 0, 1, 1.04] },
    }), true),
    wave: def('👋', 'Wave', 'Waves hello with one arm.', wave(1.2, { armR: { rz: [22, 0, 3, 140] }, head: { rz: [5, 0, 1] }, root: { sy: [0.015, 0, 1, 1] } }), true),
    cheer: def('🎉', 'Cheer', 'Arms up and jumping for joy.', wave(0.6, { armL: { rz: [14, 0, 1, -150] }, armR: { rz: [14, 0.5, 1, 150] }, root: { y: [0.06, 0, 1, 0.06] }, legL: { rx: [10, 0, 1] }, legR: { rx: [10, 0.5, 1] } }), true),
    dance: def('💃', 'Dance', 'Wiggles, sways and waves both arms.', wave(1.2, {
      root: { y: [0.04, 0, 2], ry: [20, 0, 1] }, armL: { rz: [50, 0, 1, -90] }, armR: { rz: [50, 0.5, 1, 90] },
      legL: { rx: [22, 0, 2] }, legR: { rx: [22, 0.25, 2] }, body: { rz: [6, 0, 2] }, head: { rz: [9, 0.25, 2] }, tail: { ry: [30, 0, 2] },
    }), true),
    punch: def('🥊', 'Punch', 'Throws a punch with the right arm.', kf(0.6, [[0, { armR: { rx: 0 }, root: { ry: 0 } }], [0.25, { armR: { rx: -100 }, root: { ry: -14 } }], [0.5, { armR: { rx: 0 }, root: { ry: 0 } }], [1, { armR: { rx: 0 }, root: { ry: 0 } }]]), true),
    look: def('👀', 'Look around', 'Turns the head left and right.', kf(4, [[0, { head: { ry: 0 } }], [0.25, { head: { ry: 38 } }], [0.5, { head: { ry: 0 } }], [0.75, { head: { ry: -38 } }], [1, { head: { ry: 0 } }]]), true),
    zombie: def('🧟', 'Zombie shuffle', 'Arms out front, slow shuffle.', wave(1.3, {
      armL: { rx: [6, 0, 1, -85] }, armR: { rx: [6, 0.5, 1, -85] }, legL: { rx: [20] }, legR: { rx: [20, 0.5] }, root: { rz: [4, 0, 1] }, head: { rz: [8, 0.25, 1] },
    }), true),
    fly: def('🐦', 'Fly', 'Flaps wings and bobs through the air.', wave(0.5, { wingL: { rz: [-38] }, wingR: { rz: [38] }, root: { y: [0.05, 0.25, 1], rx: [0, 0, 1, 6] }, tail: { ry: [12, 0, 1] } }), true),
    swim: def('🐟', 'Swim', 'Wiggles the tail to swim.', wave(0.9, { tail: { ry: [28, 0, 1] }, body: { ry: [7, 0.25, 1] }, root: { ry: [5, 0, 1], y: [0.02, 0.5, 1] } }), true),
    wag: def('🐕', 'Tail wag', 'Wags the tail happily.', wave(0.4, { tail: { ry: [36] }, root: { sy: [0.01, 0, 2, 1] } }), true),
    hover: def('🛸', 'Hover', 'Hovers in place and tilts.', wave(2.2, { root: { y: [0.05, 0, 1], rz: [3, 0.25, 1], rx: [3, 0, 1] }, ring: { ry: [0, 0, 1] } }), true),
    drive: def('🚗', 'Drive', 'Wheels roll and the body bounces.', { ...kf(0.3, [0, 0.25, 0.5, 0.75, 1].map((t) => [t, { wheelFL: { rx: 360 * t }, wheelFR: { rx: 360 * t }, wheelBL: { rx: 360 * t }, wheelBR: { rx: 360 * t }, root: { y: [0, 0.008, 0, 0.008, 0][Math.round(t * 4)] } }]), { ease: false }) }, true),
    thrust: def('🔥', 'Rocket thrust', 'Flame flickers and the rocket rumbles.', wave(0.18, { flame: { sy: [0.35, 0, 1, 1.2], sx: [0.12, 0.25, 1, 1] }, root: { x: [0.008, 0, 1], rz: [1.2, 0.25, 1] } }), true),
    propeller: def('✈️', 'Propeller', 'Spins the propeller and rocks the wings.', { ...ramp(0.16, ['prop'], 'rz', 360), keys: [0, 0.25, 0.5, 0.75, 1].map((t) => ({ t, pose: { prop: { rz: 360 * t }, root: { rz: Math.sin(t * Math.PI * 2) * 3 } } })) }, true),
    open: def('📦', 'Open', 'Opens a chest lid or a door (plays once).', kf(0.9, [[0, { lid: { rx: 0 }, door: { ry: 0 } }], [0.6, { lid: { rx: -112 }, door: { ry: -100 } }], [0.8, { lid: { rx: -104 }, door: { ry: -95 } }], [1, { lid: { rx: -108 }, door: { ry: -98 } }]], { loop: false }), true),
    close: def('🚪', 'Close', 'Closes a chest lid or a door (plays once).', kf(0.6, [[0, { lid: { rx: -108 }, door: { ry: -98 } }], [1, { lid: { rx: 0 }, door: { ry: 0 } }]], { loop: false }), true),
  },
  '2d': {
    idle: def('🫁', 'Breathe', 'Gently breathes in and out.', wave(2.4, { root: { sy: [0.03, 0, 1, 1], y: [-0.012, 0, 1, 0] } })),
    bounce: def('🏀', 'Bounce', 'Squashes and springs up and down.', kf(0.8, [[0, { root: { y: 0.06, sy: 0.84, sx: 1.12 } }], [0.5, { root: { y: -0.3, sy: 1.1, sx: 0.94 } }], [1, { root: { y: 0.06, sy: 0.84, sx: 1.12 } }]])),
    hop: def('🐸', 'Hop', 'A big jump, then a rest.', kf(1.1, [[0, { root: { y: 0 } }], [0.2, { root: { y: 0.06, sy: 0.88, sx: 1.1 } }], [0.45, { root: { y: -0.6, sy: 1.1 } }], [0.7, { root: { y: 0.06, sy: 0.88, sx: 1.1 } }], [0.85, { root: { y: 0 } }], [1, { root: { y: 0 } }]])),
    spin: def('🌀', 'Spin', 'Turns round and round.', ramp(1.6, ['root'], 'rz', 360)),
    wobble: def('🍮', 'Wobble', 'Wobbles side to side.', wave(1, { root: { rz: [9, 0, 1] } })),
    waddle: def('🐧', 'Waddle', 'Rocks side to side while hopping. Great for walking!', wave(0.5, { root: { rz: [9, 0, 1], y: [-0.04, 0, 2, -0.04] } })),
    float: def('🎈', 'Float', 'Drifts up and down.', wave(3, { root: { y: [0.07, 0, 1], rz: [3, 0.25, 1] } })),
    pulse: def('💓', 'Pulse', 'Grows and shrinks like a heartbeat.', wave(0.9, { root: { sx: [0.09, 0, 1, 1], sy: [0.09, 0, 1, 1] } })),
    jelly: def('🍮', 'Jelly', 'Stretches tall, then wide.', wave(0.7, { root: { sx: [0.12, 0, 1, 1], sy: [0.12, 0.5, 1, 1] } })),
    shake: def('📳', 'Shake', 'Shivers and shakes!', wave(0.22, { root: { x: [0.04, 0, 1], rz: [2, 0.25, 1] } })),
    swing: def('🎢', 'Swing', 'Swings like a pendulum.', wave(1.8, { root: { rz: [25, 0, 1] } })),
    flip: def('🤸', 'Flip', 'Flips over sideways.', kf(1, [[0, { root: { sx: 1 } }], [0.25, { root: { sx: 0.02 } }], [0.5, { root: { sx: -1 } }], [0.75, { root: { sx: 0.02 } }], [1, { root: { sx: 1 } }]], { ease: true })),
    squish: def('🧽', 'Squish', 'Squashes flat and pops back.', kf(0.9, [[0, { root: { sy: 1, sx: 1, y: 0 } }], [0.5, { root: { sy: 0.7, sx: 1.2, y: 0.15 } }], [1, { root: { sy: 1, sx: 1, y: 0 } }]])),
    popin: def('✨', 'Pop in', 'Pops into view (plays once).', kf(0.5, [[0, { root: { sx: 0.01, sy: 0.01 } }], [0.6, { root: { sx: 1.2, sy: 1.2 } }], [1, { root: { sx: 1, sy: 1 } }]], { loop: false })),
    tada: def('🎊', 'Ta-da!', 'A happy little celebration.', wave(0.8, { root: { rz: [12, 0, 2], sx: [0.1, 0, 2, 1.08], sy: [0.1, 0, 2, 1.08] } })),
    flicker: def('💡', 'Flicker', 'Flickers like a bad light.', kf(1.4, [[0, { root: { o: 1 } }], [0.1, { root: { o: 0.15 } }], [0.2, { root: { o: 1 } }], [0.55, { root: { o: 1 } }], [0.62, { root: { o: 0.3 } }], [0.7, { root: { o: 1 } }], [1, { root: { o: 1 } }]], { ease: false })),
    creep: def('😱', 'Creep', 'Slowly leans and twitches. Spooky!', kf(3, [[0, { root: { rz: 0, x: 0 } }], [0.5, { root: { rz: -4, x: -0.02 } }], [0.56, { root: { rz: 5, x: 0.03 } }], [0.62, { root: { rz: -4, x: -0.02 } }], [0.7, { root: { rz: 0, x: 0 } }], [1, { root: { rz: 0, x: 0 } }]])),
  },
}

export const ANIM_IDS = { '2d': Object.keys(ANIMS['2d']), '3d': Object.keys(ANIMS['3d']) }

/** Friendly names for bones in the animation maker. */
export const BONE_LABELS = {
  root: 'Whole thing', body: 'Body', head: 'Head', armL: 'Left arm', armR: 'Right arm', legL: 'Left leg', legR: 'Right leg',
  legFL: 'Front-left leg', legFR: 'Front-right leg', legBL: 'Back-left leg', legBR: 'Back-right leg', tail: 'Tail',
  wingL: 'Left wing', wingR: 'Right wing', wheelFL: 'Front-left wheel', wheelFR: 'Front-right wheel', wheelBL: 'Back-left wheel',
  wheelBR: 'Back-right wheel', prop: 'Propeller', flame: 'Flame', lid: 'Lid', door: 'Door', ring: 'Ring', ear: 'Ears', jaw: 'Jaw',
}

/** Look up an animation. Returns null when missing. */
export function resolveAnim(ref, anims, mode) {
  if (!ref) return null
  const r = normRef(ref)
  if (r.startsWith('b:')) return (ANIMS[mode] || ANIMS['2d'])[r.slice(2)] || null
  return (anims && anims[r.slice(2)]) || null
}
