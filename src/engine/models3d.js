// 3D models: built-in library (rigged parts), custom part-based models, and OBJ meshes.
// A model reference is 'b:<name>' (built-in) or 'c:<id>' (project.models[id]).
// Stored parts live in a unit cube (-0.5..0.5, y up, model faces +z) and get scaled by the object's w/h/d.
// part: { s: 'box'|'sphere'|'cylinder'|'cone', c: '#hex' | null (= object color), x,y,z, w,h,d, rx,ry,rz, g?: bone }
// model: { name, color, size, parts, bones?: { name: [px,py,pz] } }   (bone pivots, unit coordinates)
import { normRef } from './sprites.js'

const r4 = (n) => Math.round(n * 10000) / 10000

// Same permutation the 90-degree turns apply to a part's local axes.
const perm = (v, rx, ry, rz) => {
  if (Math.abs(rx) === 90) return [v[0], v[2], v[1]]
  if (Math.abs(rz) === 90) return [v[1], v[0], v[2]]
  if (Math.abs(ry) === 90) return [v[2], v[1], v[0]]
  return v
}

/** Author a model in real units (metres, y up, facing +z); it is stored as unit-cube parts. */
function model(name, icon, color, size, fn) {
  const [W, H, D] = size
  const parts = [], bones = {}
  const add = (s) => (c, x, y, z, ex, ey, ez, g, rx = 0, ry = 0, rz = 0) => {
    const [w, h, d] = perm([ex / W, ey / H, ez / D], rx, ry, rz)
    parts.push({ s, c, x: r4(x / W), y: r4(y / H), z: r4(z / D), w: r4(w), h: r4(h), d: r4(d), rx, ry, rz, ...(g ? { g } : {}) })
  }
  fn({ box: add('box'), ball: add('sphere'), cyl: add('cylinder'), cone: add('cone'), pivot: (b, x, y, z) => { bones[b] = [r4(x / W), r4(y / H), r4(z / D)] } })
  return { name, icon, color, size, parts, ...(Object.keys(bones).length ? { bones } : {}) }
}

/* -------------------------------------------------------------- people */
function human(name, icon, color, o = {}) {
  const { skin = '#ffdbb0', pants = '#3d3d78', shoes = '#2b2b2b', belt = '#4a3320', hair = '#6b4a2b', hat = '', face = 'normal', hands = null } = o
  return model(name, icon, color, [1, 1.84, 0.7], ({ box, ball, cyl, cone, pivot }) => {
    pivot('head', 0, 0.4, 0); pivot('armL', -0.38, 0.36, 0); pivot('armR', 0.38, 0.36, 0); pivot('legL', -0.13, -0.2, 0); pivot('legR', 0.13, -0.2, 0)
    for (const [s, g] of [[-1, 'legL'], [1, 'legR']]) {
      box(pants, s * 0.13, -0.47, 0, 0.21, 0.54, 0.24, g)
      box(shoes, s * 0.13, -0.84, 0.05, 0.23, 0.16, 0.38, g)
      box(null, s * 0.38, 0.2, 0, 0.15, 0.34, 0.2, s < 0 ? 'armL' : 'armR')
      box(hands || skin, s * 0.38, -0.02, 0, 0.13, 0.12, 0.15, s < 0 ? 'armL' : 'armR')
    }
    box(null, 0, 0.1, 0, 0.58, 0.6, 0.34)
    box(belt, 0, -0.17, 0, 0.6, 0.07, 0.36)
    if (face === 'robot') {
      box(skin, 0, 0.62, 0, 0.46, 0.42, 0.42, 'head')
      box('#00e5e0', -0.1, 0.66, 0.212, 0.11, 0.08, 0.02, 'head'); box('#00e5e0', 0.1, 0.66, 0.212, 0.11, 0.08, 0.02, 'head')
      box('#2d3436', 0, 0.52, 0.212, 0.22, 0.04, 0.02, 'head')
      cyl('#636e72', 0, 0.91, 0, 0.04, 0.12, 0.04, 'head'); ball('#ff7675', 0, 0.99, 0, 0.09, 0.09, 0.09, 'head')
      box('#636e72', -0.25, 0.62, 0, 0.05, 0.14, 0.14, 'head'); box('#636e72', 0.25, 0.62, 0, 0.05, 0.14, 0.14, 'head')
      box('#dfe6e9', 0, 0.12, 0.18, 0.32, 0.3, 0.02); box('#ff7675', -0.08, 0.16, 0.19, 0.07, 0.07, 0.02); box('#55efc4', 0.08, 0.16, 0.19, 0.07, 0.07, 0.02)
    } else if (face === 'alien') {
      ball(skin, 0, 0.64, 0, 0.52, 0.5, 0.46, 'head')
      ball('#111', -0.14, 0.68, 0.19, 0.17, 0.22, 0.1, 'head'); ball('#111', 0.14, 0.68, 0.19, 0.17, 0.22, 0.1, 'head')
      ball('#fff', -0.12, 0.72, 0.24, 0.04, 0.05, 0.02, 'head'); ball('#fff', 0.16, 0.72, 0.24, 0.04, 0.05, 0.02, 'head')
      for (const s of [-1, 1]) { cyl('#2d9a5b', s * 0.12, 0.93, 0, 0.03, 0.2, 0.03, 'head', 0, 0, s * -15); ball('#fdcb6e', s * 0.16, 1.04, 0, 0.09, 0.09, 0.09, 'head') }
      box('#1b6b3c', 0, 0.5, 0.2, 0.1, 0.02, 0.02, 'head')
    } else if (face === 'ninja') {
      box('#1e1e2c', 0, 0.62, 0, 0.46, 0.44, 0.44, 'head')
      box(skin, 0, 0.65, 0.212, 0.38, 0.1, 0.02, 'head')
      box('#fff', -0.09, 0.65, 0.224, 0.07, 0.05, 0.02, 'head'); box('#fff', 0.09, 0.65, 0.224, 0.07, 0.05, 0.02, 'head')
      box('#e74c3c', 0, 0.76, 0, 0.48, 0.07, 0.46, 'head'); box('#e74c3c', 0.1, 0.72, -0.3, 0.07, 0.07, 0.28, 'head', 0, 0, -15)
    } else {
      box(skin, 0, 0.62, 0, 0.44, 0.44, 0.42, 'head')
      if (face === 'bear') {
        box('#e8c9a0', 0, 0.55, 0.24, 0.22, 0.16, 0.1, 'head'); box('#222', 0, 0.6, 0.3, 0.09, 0.05, 0.03, 'head')
        ball(skin, -0.2, 0.86, 0, 0.17, 0.17, 0.12, 'head'); ball(skin, 0.2, 0.86, 0, 0.17, 0.17, 0.12, 'head')
        ball('#fff', -0.1, 0.69, 0.21, 0.1, 0.1, 0.06, 'head'); ball('#fff', 0.1, 0.69, 0.21, 0.1, 0.1, 0.06, 'head')
        ball('#222', -0.1, 0.69, 0.24, 0.05, 0.05, 0.03, 'head'); ball('#222', 0.1, 0.69, 0.24, 0.05, 0.05, 0.03, 'head')
        box('#8e44ad', 0, 0.39, 0.19, 0.22, 0.08, 0.08)
        box('#d63031', 0, 0.5, 0.31, 0.1, 0.025, 0.02, 'head')
      } else {
        const eye = face === 'zombie' ? '#d63031' : '#222'
        box('#fff', -0.1, 0.66, 0.212, 0.09, 0.1, 0.02, 'head'); box('#fff', 0.1, 0.66, 0.212, 0.09, 0.1, 0.02, 'head')
        box(eye, -0.1, 0.66, 0.222, 0.05, 0.07, 0.02, 'head'); box(eye, 0.1, 0.66, 0.222, 0.05, 0.07, 0.02, 'head')
        box('#c0392b', 0, 0.52, 0.212, face === 'zombie' ? 0.16 : 0.1, 0.03, 0.02, 'head')
        if (hat !== 'knight' && hat !== 'astro') {
          box(hair, 0, 0.87, -0.01, 0.47, 0.09, 0.45, 'head'); box(hair, 0, 0.7, -0.2, 0.47, 0.3, 0.06, 'head'); box(hair, 0, 0.81, 0.2, 0.47, 0.07, 0.06, 'head')
        }
      }
    }
    if (hat === 'cap') { box(o.cap || '#e74c3c', 0, 0.9, 0, 0.5, 0.1, 0.48, 'head'); box(o.cap || '#e74c3c', 0, 0.85, 0.3, 0.34, 0.03, 0.2, 'head') }
    if (hat === 'wizard') { cyl('#6c3fc1', 0, 0.88, 0, 0.74, 0.04, 0.74, 'head'); cone('#6c3fc1', 0, 1.1, 0, 0.5, 0.52, 0.5, 'head'); box('#fdcb6e', 0, 0.92, 0, 0.5, 0.06, 0.5, 'head'); ball('#fdcb6e', 0.05, 1.12, 0.24, 0.08, 0.08, 0.04, 'head') }
    if (hat === 'knight') {
      box('#b2bec3', 0, 0.64, 0, 0.5, 0.48, 0.48, 'head'); box('#2d3436', 0, 0.66, 0.245, 0.38, 0.07, 0.02, 'head'); box('#2d3436', 0, 0.55, 0.245, 0.06, 0.12, 0.02, 'head')
      box('#d63031', 0, 0.94, -0.02, 0.07, 0.16, 0.34, 'head'); box('#8e9aa3', 0, 0.9, 0, 0.52, 0.05, 0.5, 'head')
    }
    if (hat === 'astro') {
      ball('#f5f6fa', 0, 0.64, 0, 0.66, 0.66, 0.66, 'head'); box('#273c75', 0, 0.64, 0.24, 0.44, 0.32, 0.16, 'head'); box('#74b9ff', -0.08, 0.7, 0.325, 0.12, 0.08, 0.01, 'head')
      box('#dfe6e9', 0, 0.12, -0.28, 0.4, 0.5, 0.2)
    }
    if (hat === 'pirate') { box('#1e1e2c', 0, 0.9, 0, 0.62, 0.1, 0.5, 'head'); box('#1e1e2c', 0, 0.98, 0, 0.4, 0.1, 0.4, 'head'); box('#fff', 0, 0.9, 0.26, 0.1, 0.07, 0.02, 'head'); box('#111', 0.1, 0.66, 0.225, 0.11, 0.11, 0.02, 'head'); box('#c0392b', 0, 0.4, 0.18, 0.24, 0.05, 0.12) }
    if (hat === 'tophat') { cyl('#1e1e2c', 0, 1.0, 0, 0.3, 0.22, 0.3, 'head'); cyl('#1e1e2c', 0, 0.88, 0, 0.5, 0.03, 0.5, 'head'); cyl('#d63031', 0, 0.92, 0, 0.31, 0.05, 0.31, 'head') }
    if (o.extra) o.extra({ box, ball, cyl, cone })
  })
}

/* -------------------------------------------------------------- animals */
function quad(name, icon, color, o = {}) {
  const { belly = null, ear = 'point', snout = null, nose = '#2d2d2d', tail = 'long', legs = null, size = [0.9, 1.15, 1.5], earColor = null, spots = null } = o
  return model(name, icon, color, size, ({ box, ball, cyl, cone, pivot }) => {
    const gy = -size[1] / 2 // ground
    const lh = 0.32, ly = gy + lh / 2, top = gy + lh
    pivot('head', 0, top + 0.18, 0.4); pivot('tail', 0, top + 0.2, -0.5)
    pivot('legFL', -0.17, top, 0.3); pivot('legFR', 0.17, top, 0.3); pivot('legBL', -0.17, top, -0.3); pivot('legBR', 0.17, top, -0.3)
    for (const [sx, sz, g] of [[-1, 1, 'legFL'], [1, 1, 'legFR'], [-1, -1, 'legBL'], [1, -1, 'legBR']]) box(legs, sx * 0.17, ly, sz * 0.3, 0.15, lh, 0.17, g)
    const by = top + 0.2
    ball(null, 0, by, -0.03, 0.56, 0.5, 1.0)
    if (belly) ball(belly, 0, by - 0.1, 0.05, 0.44, 0.3, 0.7)
    if (spots) { ball(spots, 0.14, by + 0.18, -0.1, 0.22, 0.12, 0.26); ball(spots, -0.12, by + 0.1, -0.3, 0.2, 0.12, 0.22) }
    const hy = by + 0.06
    ball(null, 0, hy, 0.5, 0.46, 0.42, 0.44, 'head')
    ball(snout || belly || null, 0, hy - 0.08, 0.72, 0.24, 0.17, 0.2, 'head')
    if (o.pig) { cyl('#ff9eb5', 0, hy - 0.08, 0.83, 0.2, 0.06, 0.18, 'head', 90); ball('#c2607a', -0.04, hy - 0.08, 0.865, 0.04, 0.04, 0.02, 'head'); ball('#c2607a', 0.04, hy - 0.08, 0.865, 0.04, 0.04, 0.02, 'head') }
    else ball(nose, 0, hy - 0.03, 0.82, 0.08, 0.06, 0.05, 'head')
    box('#fff', -0.1, hy + 0.06, 0.68, 0.08, 0.1, 0.03, 'head'); box('#fff', 0.1, hy + 0.06, 0.68, 0.08, 0.1, 0.03, 'head')
    ball('#222', -0.1, hy + 0.06, 0.7, 0.05, 0.07, 0.03, 'head'); ball('#222', 0.1, hy + 0.06, 0.7, 0.05, 0.07, 0.03, 'head')
    for (const s of [-1, 1]) {
      const ec = earColor
      if (ear === 'point') cone(ec, s * 0.15, hy + 0.27, 0.46, 0.14, 0.2, 0.12, 'head', 0, 0, s * -8)
      if (ear === 'flop') box(ec || '#6b4a2b', s * 0.25, hy + 0.05, 0.46, 0.08, 0.26, 0.16, 'head', 0, 0, s * -10)
      if (ear === 'long') box(ec || null, s * 0.1, hy + 0.5, 0.42, 0.1, 0.55, 0.06, 'head', 0, 0, s * -6)
      if (ear === 'small') cone(ec, s * 0.17, hy + 0.23, 0.44, 0.13, 0.14, 0.1, 'head', 0, 0, s * -22)
    }
    if (tail === 'long') cyl(null, 0, by + 0.12, -0.7, 0.07, 0.5, 0.07, 'tail', -60)
    if (tail === 'puff') ball('#fff', 0, by + 0.1, -0.58, 0.18, 0.18, 0.18, 'tail')
    if (tail === 'curly') cyl('#ff9eb5', 0, by + 0.08, -0.56, 0.06, 0.18, 0.06, 'tail', -40)
    if (tail === 'wag') cyl(null, 0, by + 0.2, -0.6, 0.09, 0.4, 0.09, 'tail', -35)
  })
}

export const MODELS = {
  character: human('Hero', '🧍', '#a29bfe', { hat: 'cap', cap: '#e17055', hair: '#6b4a2b' }),
  knight: human('Knight', '🛡️', '#95a5a6', { hat: 'knight', pants: '#7f8c8d', shoes: '#4b4b4b', hands: '#b2bec3' }),
  wizard: human('Wizard', '🧙', '#8e5be8', { hat: 'wizard', pants: '#4b2c82', hair: '#ecf0f1', shoes: '#4a3320', extra: ({ box, ball }) => { box('#8d5a2b', 0.46, -0.02, 0.1, 0.05, 1.3, 0.05); ball('#74b9ff', 0.46, 0.7, 0.1, 0.14, 0.14, 0.14) } }),
  ninja: human('Ninja', '🥷', '#2d3436', { face: 'ninja', pants: '#2d3436', hands: '#1e1e2c', shoes: '#111', belt: '#e74c3c' }),
  pirate: human('Pirate', '🏴‍☠️', '#c0392b', { hat: 'pirate', pants: '#2c3e50', hair: '#2d2d2d', shoes: '#4a3320', belt: '#d4a017' }),
  astronaut: human('Astronaut', '🧑‍🚀', '#ecf0f1', { hat: 'astro', pants: '#dfe6e9', shoes: '#b2bec3', hands: '#e17055' }),
  zombie: human('Zombie', '🧟', '#7f8c8d', { face: 'zombie', skin: '#8fbf6a', pants: '#5b5f6b', hair: '#4a4a3a', hands: '#8fbf6a', shoes: '#3a3a3a' }),
  alien: human('Alien', '👽', '#55efc4', { face: 'alien', skin: '#3ddc84', pants: '#6c5ce7', hands: '#3ddc84', shoes: '#4834d4', belt: '#fdcb6e' }),
  robot: human('Robot', '🤖', '#74b9ff', { face: 'robot', skin: '#dfe6e9', pants: '#636e72', shoes: '#2d3436', hands: '#636e72', belt: '#2d3436' }),
  bearbot: human('Animatronic bear', '🐻', '#8d5a2b', { face: 'bear', skin: '#8d5a2b', pants: '#8d5a2b', shoes: '#6b4423', hands: '#8d5a2b', hat: 'tophat', belt: '#222' }),

  cat: quad('Cat', '🐱', '#f7a35c', { ear: 'point', belly: '#fff3d6', tail: 'long', nose: '#ff7675', size: [0.9, 1.15, 1.5] }),
  dog: quad('Dog', '🐶', '#c8923e', { ear: 'flop', belly: '#f6e3c3', snout: '#f6e3c3', tail: 'wag', size: [0.9, 1.15, 1.5], spots: '#8d5a2b' }),
  bunny: quad('Bunny', '🐰', '#f1f2f6', { ear: 'long', belly: '#ffffff', tail: 'puff', nose: '#ff9eb5', earColor: '#ffc9d9', size: [0.9, 1.5, 1.4] }),
  pig: quad('Pig', '🐷', '#ff9eb5', { ear: 'small', tail: 'curly', pig: true, size: [1, 1.1, 1.5], earColor: '#ff7f9f' }),

  duck: model('Duck', '🦆', '#fdcb6e', [1.1, 1.1, 1.2], ({ box, ball, cone, pivot }) => {
    pivot('head', 0, 0.2, 0.2); pivot('wingL', -0.3, 0.05, 0); pivot('wingR', 0.3, 0.05, 0); pivot('legL', -0.12, -0.3, 0); pivot('legR', 0.12, -0.3, 0); pivot('tail', 0, 0, -0.4)
    ball(null, 0, -0.08, -0.05, 0.62, 0.55, 0.8); cone(null, 0, 0.02, -0.42, 0.2, 0.22, 0.2, 'tail', 0, 0, 0); box(null, 0, 0.0, -0.45, 0.2, 0.14, 0.2, 'tail', -50)
    ball(null, 0, 0.36, 0.2, 0.4, 0.4, 0.4, 'head'); box('#ff9f43', 0, 0.3, 0.44, 0.22, 0.07, 0.2, 'head'); box('#222', -0.09, 0.42, 0.37, 0.05, 0.07, 0.04, 'head'); box('#222', 0.09, 0.42, 0.37, 0.05, 0.07, 0.04, 'head')
    for (const s of [-1, 1]) {
      box('#f4b942', s * 0.34, -0.06, -0.05, 0.08, 0.3, 0.5, s < 0 ? 'wingL' : 'wingR', 0, 0, s * 8)
      box('#ff9f43', s * 0.12, -0.42, 0.04, 0.05, 0.28, 0.05, s < 0 ? 'legL' : 'legR'); box('#ff9f43', s * 0.12, -0.54, 0.1, 0.18, 0.04, 0.24, s < 0 ? 'legL' : 'legR')
    }
  }),
  penguin: model('Penguin', '🐧', '#2d3436', [0.9, 1.3, 0.8], ({ box, ball, cone, pivot }) => {
    pivot('head', 0, 0.35, 0); pivot('armL', -0.3, 0.25, 0); pivot('armR', 0.3, 0.25, 0); pivot('legL', -0.14, -0.5, 0); pivot('legR', 0.14, -0.5, 0)
    ball(null, 0, -0.05, 0, 0.62, 0.9, 0.52); ball('#ffffff', 0, -0.1, 0.1, 0.44, 0.7, 0.4)
    ball(null, 0, 0.4, 0, 0.46, 0.44, 0.44, 'head'); box('#ff9f43', 0, 0.35, 0.25, 0.16, 0.07, 0.14, 'head'); box('#fff', -0.1, 0.44, 0.19, 0.09, 0.1, 0.03, 'head'); box('#fff', 0.1, 0.44, 0.19, 0.09, 0.1, 0.03, 'head')
    ball('#111', -0.1, 0.44, 0.21, 0.05, 0.06, 0.03, 'head'); ball('#111', 0.1, 0.44, 0.21, 0.05, 0.06, 0.03, 'head')
    for (const s of [-1, 1]) { box(null, s * 0.35, 0.05, 0, 0.1, 0.5, 0.26, s < 0 ? 'armL' : 'armR', 0, 0, s * -8); box('#ff9f43', s * 0.14, -0.58, 0.07, 0.2, 0.08, 0.3, s < 0 ? 'legL' : 'legR') }
  }),
  fish: model('Fish', '🐟', '#ff7675', [0.7, 0.9, 1.6], ({ box, ball, cone, pivot }) => {
    pivot('tail', 0, 0, -0.45)
    ball(null, 0, 0, 0.05, 0.5, 0.7, 1.0); ball('#ffe3e3', 0, -0.1, 0.1, 0.4, 0.4, 0.8)
    box('#ff9f43', 0, 0, -0.62, 0.05, 0.6, 0.35, 'tail'); box('#ff9f43', 0, 0.38, 0, 0.05, 0.26, 0.4, '', 0, 0, 0)
    box('#ff9f43', -0.26, -0.1, 0.1, 0.18, 0.04, 0.24, '', 0, 0, 20); box('#ff9f43', 0.26, -0.1, 0.1, 0.18, 0.04, 0.24, '', 0, 0, -20)
    ball('#fff', -0.2, 0.08, 0.45, 0.1, 0.12, 0.06); ball('#fff', 0.2, 0.08, 0.45, 0.1, 0.12, 0.06); ball('#111', -0.2, 0.08, 0.48, 0.05, 0.07, 0.04); ball('#111', 0.2, 0.08, 0.48, 0.05, 0.07, 0.04)
  }),
  dragon: model('Dragon', '🐲', '#2ecc71', [1.9, 1.5, 2.4], ({ box, ball, cone, cyl, pivot }) => {
    pivot('head', 0, 0.35, 0.65); pivot('wingL', -0.3, 0.45, -0.1); pivot('wingR', 0.3, 0.45, -0.1); pivot('tail', 0, 0.1, -0.75)
    pivot('legFL', -0.3, -0.3, 0.4); pivot('legFR', 0.3, -0.3, 0.4); pivot('legBL', -0.3, -0.3, -0.4); pivot('legBR', 0.3, -0.3, -0.4)
    for (const [sx, sz, g] of [[-1, 1, 'legFL'], [1, 1, 'legFR'], [-1, -1, 'legBL'], [1, -1, 'legBR']]) box('#27ae60', sx * 0.3, -0.5, sz * 0.4, 0.22, 0.4, 0.26, g)
    ball(null, 0, 0.05, -0.05, 0.8, 0.7, 1.3); ball('#f9e79f', 0, -0.05, 0.05, 0.6, 0.45, 1.0)
    box(null, 0, 0.35, 0.5, 0.36, 0.4, 0.4, '', -20)
    ball(null, 0, 0.62, 0.8, 0.5, 0.42, 0.5, 'head'); ball(null, 0, 0.55, 1.05, 0.3, 0.22, 0.34, 'head'); ball('#145a32', -0.06, 0.58, 1.21, 0.05, 0.04, 0.03, 'head'); ball('#145a32', 0.06, 0.58, 1.21, 0.05, 0.04, 0.03, 'head')
    ball('#fff', -0.15, 0.7, 0.98, 0.1, 0.12, 0.05, 'head'); ball('#fff', 0.15, 0.7, 0.98, 0.1, 0.12, 0.05, 'head'); ball('#c0392b', -0.15, 0.7, 1.0, 0.05, 0.08, 0.04, 'head'); ball('#c0392b', 0.15, 0.7, 1.0, 0.05, 0.08, 0.04, 'head')
    cone('#f9e79f', -0.16, 0.95, 0.72, 0.1, 0.26, 0.1, 'head', 20, 0, 10); cone('#f9e79f', 0.16, 0.95, 0.72, 0.1, 0.26, 0.1, 'head', 20, 0, -10)
    for (let i = 0; i < 4; i++) cone('#f1c40f', 0, 0.42 - i * 0.02 - (i > 1 ? 0.05 : 0), 0.28 - i * 0.3, 0.14, 0.2, 0.14)
    for (const s of [-1, 1]) {
      const g = s < 0 ? 'wingL' : 'wingR'
      box('#27ae60', s * 0.6, 0.55, -0.1, 0.9, 0.05, 0.1, g, 0, 0, s * 12); box('#f39c12', s * 0.64, 0.45, -0.18, 0.84, 0.03, 0.62, g, 0, 0, s * 8)
    }
    cone(null, 0, 0.0, -1.1, 0.4, 0.4, 0.55, 'tail', -90); cone('#f1c40f', 0, 0.02, -1.38, 0.24, 0.24, 0.24, 'tail', -90)
  }),
  bat: model('Bat', '🦇', '#6c5ce7', [1.7, 0.8, 0.8], ({ box, ball, cone, pivot }) => {
    pivot('wingL', -0.12, 0.05, 0); pivot('wingR', 0.12, 0.05, 0)
    ball(null, 0, 0, 0, 0.3, 0.4, 0.3); ball(null, 0, 0.22, 0.05, 0.28, 0.26, 0.26)
    cone(null, -0.09, 0.4, 0.04, 0.09, 0.14, 0.06); cone(null, 0.09, 0.4, 0.04, 0.09, 0.14, 0.06)
    ball('#ffeaa7', -0.06, 0.24, 0.17, 0.06, 0.06, 0.03); ball('#ffeaa7', 0.06, 0.24, 0.17, 0.06, 0.06, 0.03)
    for (const s of [-1, 1]) { const g = s < 0 ? 'wingL' : 'wingR'; box('#4b3fb8', s * 0.5, 0.06, 0, 0.74, 0.03, 0.4, g, 0, 0, s * 6); box('#4b3fb8', s * 0.82, -0.02, 0.02, 0.22, 0.03, 0.26, g, 0, 0, s * -10) }
  }),

  slime: model('Slime', '🟢', '#55efc4', [1.2, 1, 1.2], ({ ball }) => {
    ball(null, 0, -0.1, 0, 1.1, 0.8, 1.1); ball(null, 0, 0.2, 0, 0.7, 0.5, 0.7); ball('#ffffff', -0.2, 0.3, 0.2, 0.18, 0.1, 0.1)
    ball('#fff', -0.2, 0.0, 0.46, 0.2, 0.24, 0.1); ball('#fff', 0.2, 0.0, 0.46, 0.2, 0.24, 0.1); ball('#222', -0.2, -0.02, 0.5, 0.1, 0.13, 0.06); ball('#222', 0.2, -0.02, 0.5, 0.1, 0.13, 0.06); ball('#1a6b50', 0, -0.2, 0.52, 0.22, 0.06, 0.04)
  }),
  ghost: model('Ghost', '👻', '#f1f2f6', [1.2, 1.6, 1], ({ box, ball, cyl, pivot }) => {
    pivot('armL', -0.45, 0.0, 0); pivot('armR', 0.45, 0.0, 0)
    cyl(null, 0, -0.1, 0, 0.8, 0.9, 0.7); ball(null, 0, 0.3, 0, 0.8, 0.8, 0.7)
    for (let i = 0; i < 5; i++) ball(null, -0.32 + i * 0.16, -0.58, i % 2 ? 0.14 : -0.1, 0.22, 0.3, 0.3)
    for (const s of [-1, 1]) { box(null, s * 0.5, -0.1, 0.05, 0.28, 0.14, 0.18, s < 0 ? 'armL' : 'armR', 0, 0, s * 20) }
    ball('#2d3436', -0.16, 0.34, 0.32, 0.14, 0.2, 0.08); ball('#2d3436', 0.16, 0.34, 0.32, 0.14, 0.2, 0.08); ball('#2d3436', 0, 0.1, 0.34, 0.12, 0.16, 0.06)
    ball('#ff9ff3', -0.3, 0.2, 0.3, 0.12, 0.07, 0.04); ball('#ff9ff3', 0.3, 0.2, 0.3, 0.12, 0.07, 0.04)
  }),
  ufo: model('UFO', '🛸', '#b2bec3', [2.2, 1.0, 2.2], ({ ball, cyl, cone }) => {
    cyl(null, 0, -0.1, 0, 2.0, 0.2, 2.0); cyl('#8e9aa3', 0, -0.22, 0, 1.4, 0.18, 1.4); cyl('#636e72', 0, -0.36, 0, 0.7, 0.14, 0.7)
    ball('#a8e6ff', 0, 0.12, 0, 1.0, 0.7, 1.0); ball('#55efc4', 0, 0.15, 0, 0.3, 0.3, 0.3)
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ball(i % 2 ? '#fdcb6e' : '#ff7675', Math.sin(a) * 0.86, -0.1, Math.cos(a) * 0.86, 0.14, 0.12, 0.14) }
  }),
  snowman: model('Snowman', '⛄', '#ffffff', [1.4, 2.4, 1.4], ({ box, ball, cyl, cone, pivot }) => {
    pivot('armL', -0.38, 0.1, 0); pivot('armR', 0.38, 0.1, 0)
    ball(null, 0, -0.75, 0, 1.0, 0.9, 1.0); ball(null, 0, 0.0, 0, 0.78, 0.7, 0.78); ball(null, 0, 0.62, 0, 0.56, 0.52, 0.56)
    cone('#ff9f43', 0, 0.62, 0.38, 0.1, 0.1, 0.3, '', 90); ball('#2d3436', -0.1, 0.72, 0.24, 0.07, 0.07, 0.05); ball('#2d3436', 0.1, 0.72, 0.24, 0.07, 0.07, 0.05)
    for (let i = 0; i < 3; i++) ball('#2d3436', 0, 0.12 - i * 0.18, 0.37, 0.07, 0.07, 0.05)
    cyl('#2d3436', 0, 1.0, 0, 0.4, 0.28, 0.4); cyl('#2d3436', 0, 0.88, 0, 0.66, 0.05, 0.66); cyl('#d63031', 0, 0.93, 0, 0.41, 0.07, 0.41); box('#d63031', 0, 0.38, 0.25, 0.6, 0.1, 0.1)
    for (const s of [-1, 1]) { box('#8d5a2b', s * 0.62, 0.15, 0, 0.7, 0.05, 0.05, s < 0 ? 'armL' : 'armR', 0, 0, s * 25) }
  }),

  car: model('Car', '🚗', '#ff6b6b', [1.6, 1.1, 3.2], ({ box, cyl, pivot }) => {
    for (const [n, x, z] of [['wheelFL', -0.72, 0.95], ['wheelFR', 0.72, 0.95], ['wheelBL', -0.72, -0.95], ['wheelBR', 0.72, -0.95]]) {
      pivot(n, x, -0.3, z)
      cyl('#2d3436', x, -0.3, z, 0.3, 0.5, 0.5, n, 0, 0, 90); cyl('#b2bec3', x + Math.sign(x) * 0.02, -0.3, z, 0.34, 0.26, 0.26, n, 0, 0, 90); box('#636e72', x + Math.sign(x) * 0.17, -0.3, z, 0.02, 0.06, 0.42, n)
    }
    box(null, 0, -0.1, 0, 1.4, 0.4, 3.0); box(null, 0, 0.12, 0.8, 1.3, 0.12, 1.1); box('#a8e6ff', 0, 0.3, -0.15, 1.2, 0.4, 1.4); box(null, 0, 0.52, -0.15, 1.1, 0.06, 1.2)
    box('#ffeaa7', -0.5, -0.04, 1.51, 0.28, 0.14, 0.04); box('#ffeaa7', 0.5, -0.04, 1.51, 0.28, 0.14, 0.04); box('#d63031', -0.5, -0.04, -1.51, 0.28, 0.14, 0.04); box('#d63031', 0.5, -0.04, -1.51, 0.28, 0.14, 0.04)
    box('#2d3436', 0, -0.3, 1.52, 1.0, 0.12, 0.06)
  }),
  rocket: model('Rocket', '🚀', '#ff7675', [1.4, 3, 1.4], ({ box, ball, cyl, cone, pivot }) => {
    pivot('flame', 0, -1.0, 0)
    cyl('#f1f2f6', 0, -0.1, 0, 0.8, 1.7, 0.8); cone(null, 0, 1.0, 0, 0.8, 0.9, 0.8); cyl(null, 0, 0.2, 0, 0.82, 0.12, 0.82); cyl('#b2bec3', 0, -0.95, 0, 0.5, 0.2, 0.5)
    ball('#74b9ff', 0, 0.35, 0.36, 0.34, 0.34, 0.14); ball('#fff', -0.04, 0.4, 0.43, 0.08, 0.08, 0.02)
    for (const [x, z, ry] of [[0.46, 0, 0], [-0.46, 0, 0], [0, 0.46, 90], [0, -0.46, 90]]) box(null, x, -0.7, z, ry ? 0.08 : 0.16, 0.7, ry ? 0.16 : 0.08, '', 0, 0, 0)
    cone('#ffa502', 0, -1.2, 0, 0.5, 0.6, 0.5, 'flame', 180); cone('#fff3b0', 0, -1.12, 0, 0.26, 0.4, 0.26, 'flame', 180)
  }),
  plane: model('Plane', '✈️', '#e74c3c', [3, 1.1, 2.6], ({ box, ball, cyl, cone, pivot }) => {
    pivot('prop', 0, 0.0, 1.1)
    cyl(null, 0, 0, 0, 0.5, 0.5, 2.0, '', 90); cone('#f1f2f6', 0, 0, 1.2, 0.5, 0.5, 0.4, '', 90); ball('#74b9ff', 0, 0.22, 0.2, 0.36, 0.26, 0.6)
    box('#f1f2f6', 0, 0.02, 0.1, 3.0, 0.06, 0.6); box(null, 0, 0.18, -1.0, 0.06, 0.4, 0.4); box('#f1f2f6', 0, 0.02, -0.95, 1.0, 0.05, 0.3)
    box('#2d3436', -1.4, 0.02, 0.1, 0.06, 0.1, 0.5); box('#2d3436', 1.4, 0.02, 0.1, 0.06, 0.1, 0.5)
    box('#636e72', 0, 0, 1.0, 0.06, 0.06, 0.06, 'prop'); box('#2d3436', 0, 0, 1.4, 1.2, 0.07, 0.04, 'prop'); box('#2d3436', 0, 0, 1.4, 0.07, 1.2, 0.04, 'prop')
    box('#2d3436', -0.25, -0.35, 0.4, 0.06, 0.4, 0.06); box('#2d3436', 0.25, -0.35, 0.4, 0.06, 0.4, 0.06); cyl('#2d3436', -0.25, -0.55, 0.4, 0.1, 0.26, 0.26, '', 0, 0, 90); cyl('#2d3436', 0.25, -0.55, 0.4, 0.1, 0.26, 0.26, '', 0, 0, 90)
  }),

  tree: model('Round tree', '🌳', '#2ecc71', [2.4, 3.4, 2.4], ({ ball, cyl, pivot }) => {
    pivot('root', 0, -1.7, 0)
    cyl('#8d5a2b', 0, -1.0, 0, 0.5, 1.4, 0.5); cyl('#7a4e24', 0, -1.65, 0, 0.7, 0.2, 0.7)
    ball(null, 0, 0.4, 0, 2.0, 1.6, 2.0); ball(null, 0.55, -0.1, 0.15, 1.2, 1.0, 1.2); ball(null, -0.55, -0.05, -0.15, 1.2, 1.0, 1.2); ball('#4eea92', 0, 1.0, 0.1, 1.2, 0.9, 1.2); ball('#ff7675', 0.7, 0.5, 0.6, 0.18, 0.18, 0.18); ball('#ff7675', -0.5, 0.8, 0.7, 0.18, 0.18, 0.18)
  }),
  pine: model('Pine tree', '🌲', '#27ae60', [2.2, 3.8, 2.2], ({ cyl, cone, pivot }) => {
    pivot('root', 0, -1.9, 0)
    cyl('#8d5a2b', 0, -1.6, 0, 0.36, 0.6, 0.36); cone(null, 0, -0.8, 0, 2.0, 1.2, 2.0); cone('#2ecc71', 0, -0.1, 0, 1.6, 1.2, 1.6); cone(null, 0, 0.6, 0, 1.2, 1.1, 1.2); cone('#2ecc71', 0, 1.3, 0, 0.8, 0.9, 0.8); cone('#fff', 0, 1.75, 0, 0.3, 0.3, 0.3)
  }),
  palm: model('Palm tree', '🌴', '#2ecc71', [2.6, 3.8, 2.6], ({ box, ball, cyl, cone, pivot }) => {
    pivot('root', 0, -1.9, 0)
    cyl('#c8923e', 0, -1.1, 0, 0.4, 1.6, 0.4); cyl('#c8923e', 0.1, 0.3, 0, 0.32, 1.4, 0.32, '', 0, 0, -6)
    for (let i = 0; i < 6; i++) { const a = i * 60; box(null, Math.sin(a * Math.PI / 180) * 0.7 + 0.2, 1.15, Math.cos(a * Math.PI / 180) * 0.7, 0.3, 0.06, 1.2, '', 0, a, 0) }
    ball('#8d5a2b', 0.2, 1.0, 0.1, 0.24, 0.24, 0.24); ball('#8d5a2b', 0.0, 1.0, -0.1, 0.24, 0.24, 0.24)
  }),
  cactus: model('Cactus', '🌵', '#2ecc71', [1.2, 2.4, 1.2], ({ ball, cyl }) => {
    cyl(null, 0, -0.1, 0, 0.6, 2.0, 0.6); ball(null, 0, 0.9, 0, 0.6, 0.4, 0.6)
    cyl(null, -0.45, 0.0, 0, 0.3, 0.6, 0.3, '', 0, 0, 0); cyl(null, -0.3, -0.25, 0, 0.5, 0.28, 0.28, '', 0, 0, 90)
    cyl(null, 0.45, 0.35, 0, 0.3, 0.7, 0.3); cyl(null, 0.3, 0.05, 0, 0.5, 0.28, 0.28, '', 0, 0, 90)
    ball('#fd79a8', 0, 1.12, 0, 0.26, 0.2, 0.26)
  }),
  flower: model('Flower', '🌸', '#fd79a8', [1, 1.6, 1], ({ ball, cyl }) => {
    cyl('#27ae60', 0, -0.2, 0, 0.1, 1.1, 0.1); cyl('#2ecc71', 0.2, -0.5, 0, 0.4, 0.06, 0.2, '', 0, 0, 25)
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ball(null, Math.sin(a) * 0.3, 0.45, Math.cos(a) * 0.3, 0.34, 0.14, 0.34) }
    ball('#fdcb6e', 0, 0.5, 0, 0.3, 0.2, 0.3)
  }),
  mushroom: model('Mushroom', '🍄', '#ff6b6b', [1.6, 1.6, 1.6], ({ ball, cyl }) => {
    cyl('#fff3d6', 0, -0.4, 0, 0.5, 0.8, 0.5); cyl('#e8d9b0', 0, -0.6, 0, 0.6, 0.12, 0.6); ball(null, 0, 0.1, 0, 1.4, 1.0, 1.4)
    ball('#fff', 0, 0.58, 0, 0.36, 0.14, 0.36); ball('#fff', 0.42, 0.3, 0.3, 0.28, 0.14, 0.28); ball('#fff', -0.4, 0.28, -0.34, 0.28, 0.14, 0.28); ball('#fff', 0.1, 0.28, -0.58, 0.22, 0.12, 0.22); ball('#fff', -0.3, 0.3, 0.52, 0.2, 0.12, 0.2)
  }),
  rock: model('Rock', '🪨', '#95a5a6', [1.8, 1.3, 1.6], ({ ball }) => {
    ball(null, 0, -0.1, 0, 1.6, 1.0, 1.4); ball('#a5b1b2', 0.3, 0.2, 0.1, 0.9, 0.7, 0.8); ball('#7f8c8d', -0.5, -0.3, 0.3, 0.7, 0.5, 0.6); ball('#2ecc71', 0.05, 0.5, 0.0, 0.5, 0.12, 0.4)
  }),

  house: model('House', '🏠', '#fab1a0', [3, 2.8, 2.4], ({ box }) => {
    box(null, 0, -0.5, 0, 2.4, 1.5, 2.0); box('#e8bcae', 0, -1.2, 0, 2.5, 0.1, 2.1)
    box('#e17055', -0.7, 0.8, 0, 1.75, 0.14, 2.3, '', 0, 0, 38); box('#e17055', 0.7, 0.8, 0, 1.75, 0.14, 2.3, '', 0, 0, -38); box('#c0603f', 0, 1.33, 0, 0.14, 0.1, 2.3)
    box('#8d5a2b', 0, -0.78, 1.01, 0.5, 0.9, 0.04); box('#fdcb6e', 0.14, -0.78, 1.04, 0.06, 0.06, 0.03); box('#6d4c2f', 0, -0.3, 1.02, 0.62, 0.06, 0.06)
    for (const s of [-1, 1]) { box('#6d4c2f', s * 0.8, -0.35, 1.01, 0.5, 0.5, 0.03); box('#a8e6ff', s * 0.8, -0.35, 1.02, 0.4, 0.4, 0.03); box('#6d4c2f', s * 0.8, -0.35, 1.03, 0.04, 0.4, 0.03); box('#6d4c2f', s * 0.8, -0.35, 1.03, 0.4, 0.04, 0.03) }
    box('#b2bec3', 0.85, 1.05, -0.4, 0.3, 0.7, 0.3); box('#636e72', 0.85, 1.4, -0.4, 0.38, 0.06, 0.38)
  }),
  tower: model('Castle tower', '🏰', '#b2bec3', [2.6, 4.6, 2.6], ({ box, cyl, cone, ball }) => {
    cyl(null, 0, -0.6, 0, 2.0, 3.0, 2.0); cyl('#a4afb5', 0, 0.95, 0, 2.3, 0.3, 2.3)
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; box(null, Math.sin(a) * 1.05, 1.25, Math.cos(a) * 1.05, 0.32, 0.3, 0.32) }
    cone('#e17055', 0, 1.65, 0, 1.7, 1.2, 1.7); cone('#d63031', 0, 2.1, 0, 0.2, 0.3, 0.2)
    box('#6d4c2f', 0, -1.65, 1.0, 0.6, 0.9, 0.1); box('#2d3436', 0, 0.2, 0.98, 0.3, 0.6, 0.1); box('#2d3436', 0, -0.6, 0.98, 0.2, 0.5, 0.1)
  }),
  lamp: model('Street lamp', '🏮', '#2d3436', [0.8, 3, 0.8], ({ box, ball, cyl }) => {
    cyl(null, 0, -1.4, 0, 0.5, 0.2, 0.5); cyl(null, 0, -0.1, 0, 0.14, 2.6, 0.14); box(null, 0, 1.15, 0, 0.45, 0.1, 0.45); box('#ffeaa7', 0, 1.0, 0, 0.32, 0.3, 0.32); box(null, 0, 0.82, 0, 0.4, 0.06, 0.4); ball('#fff3b0', 0, 1.0, 0, 0.2, 0.2, 0.2)
  }),
  sign: model('Signpost', '🪧', '#c8923e', [1.6, 2.2, 0.4], ({ box }) => {
    box('#8d5a2b', 0, -0.2, 0, 0.14, 1.8, 0.14); box(null, 0, 0.5, 0.05, 1.4, 0.6, 0.1); box('#e8c88a', 0, 0.5, 0.11, 1.2, 0.4, 0.02); box('#8d5a2b', -0.45, 0.5, 0.13, 0.3, 0.05, 0.02); box('#8d5a2b', 0.1, 0.5, 0.13, 0.5, 0.05, 0.02)
  }),
  fence: model('Fence', '🚧', '#c8923e', [3, 1.2, 0.3], ({ box }) => {
    for (let i = 0; i < 5; i++) { box(null, -1.2 + i * 0.6, 0, 0, 0.3, 1.1, 0.12); box('#e0a85e', -1.2 + i * 0.6, 0.6, 0, 0.18, 0.1, 0.12) }
    box('#a77634', 0, 0.2, 0.08, 3.0, 0.14, 0.08); box('#a77634', 0, -0.25, 0.08, 3.0, 0.14, 0.08)
  }),
  barrel: model('Barrel', '🛢️', '#b9772f', [1.2, 1.5, 1.2], ({ cyl, ball }) => {
    cyl(null, 0, 0, 0, 1.0, 1.4, 1.0); ball(null, 0, 0, 0, 1.2, 1.1, 1.2); cyl('#636e72', 0, 0.45, 0, 1.05, 0.08, 1.05); cyl('#636e72', 0, -0.45, 0, 1.05, 0.08, 1.05); cyl('#8d5a2b', 0, 0.7, 0, 0.9, 0.04, 0.9)
  }),
  crate: model('Crate', '📦', '#c8923e', [1.6, 1.6, 1.6], ({ box }) => {
    box(null, 0, 0, 0, 1.5, 1.5, 1.5)
    for (const [x, z] of [[-0.72, -0.72], [0.72, -0.72], [-0.72, 0.72], [0.72, 0.72]]) box('#8d5a2b', x, 0, z, 0.16, 1.6, 0.16)
    box('#8d5a2b', 0, 0.72, 0, 1.6, 0.16, 1.6); box('#8d5a2b', 0, -0.72, 0, 1.6, 0.16, 1.6); box('#8d5a2b', 0, 0, 0.77, 1.4, 0.14, 0.04, '', 0, 0, 34); box('#8d5a2b', 0, 0, 0.77, 1.4, 0.14, 0.04, '', 0, 0, -34)
  }),
  chest: model('Treasure chest', '🧰', '#b9772f', [1.5, 1.2, 1.1], ({ box, cyl, pivot }) => {
    pivot('lid', 0, 0.05, -0.5)
    box(null, 0, -0.22, 0, 1.4, 0.56, 1.0); box('#fdcb6e', -0.45, -0.22, 0, 0.1, 0.58, 1.02); box('#fdcb6e', 0.45, -0.22, 0, 0.1, 0.58, 1.02)
    cyl('#c8862f', 0, 0.06, 0, 1.4, 1.0, 1.0, 'lid', 0, 0, 90); cyl('#fdcb6e', -0.45, 0.06, 0, 0.1, 1.04, 1.04, 'lid', 0, 0, 90); cyl('#fdcb6e', 0.45, 0.06, 0, 0.1, 1.04, 1.04, 'lid', 0, 0, 90)
    box('#fdcb6e', 0, 0.02, 0.51, 0.2, 0.26, 0.05, 'lid'); box('#2d3436', 0, 0.0, 0.54, 0.05, 0.1, 0.02, 'lid')
  }),
  door: model('Door', '🚪', '#8d5a2b', [1.3, 2.3, 0.3], ({ box, ball, pivot }) => {
    pivot('door', -0.5, 0, 0)
    box('#5a3a1a', -0.56, 0, 0, 0.14, 2.3, 0.3); box('#5a3a1a', 0.56, 0, 0, 0.14, 2.3, 0.3); box('#5a3a1a', 0, 1.1, 0, 1.3, 0.14, 0.3)
    box(null, 0, -0.05, 0, 0.98, 2.1, 0.1, 'door'); box('#7a4e24', 0, 0.45, 0.06, 0.7, 0.7, 0.03, 'door'); box('#7a4e24', 0, -0.55, 0.06, 0.7, 0.7, 0.03, 'door'); ball('#fdcb6e', 0.38, -0.05, 0.1, 0.12, 0.12, 0.1, 'door')
  }),

  coin: model('Coin', '🟡', '#fdcb6e', [1, 1, 0.5], ({ cyl }) => {
    cyl(null, 0, 0, 0, 1, 1, 0.14, '', 90); cyl('#f9ae2b', 0, 0, 0.01, 0.72, 0.72, 0.17, '', 90); cyl('#fff3b0', 0, 0, 0.02, 0.2, 0.2, 0.2, '', 90)
  }),
  gem: model('Gem', '💎', '#74b9ff', [0.9, 1.3, 0.9], ({ cone }) => {
    cone(null, 0, 0.22, 0, 0.8, 0.56, 0.8); cone('#a8e6ff', 0, 0.3, 0, 0.5, 0.36, 0.5); cone(null, 0, -0.2, 0, 0.8, 0.8, 0.8, '', 180)
  }),
  heart: model('Heart', '❤️', '#ff6b81', [1, 1, 0.5], ({ ball, cone }) => {
    ball(null, -0.22, 0.2, 0, 0.5, 0.5, 0.4); ball(null, 0.22, 0.2, 0, 0.5, 0.5, 0.4); cone(null, 0, -0.14, 0, 0.74, 0.7, 0.4, '', 180); ball('#fff', -0.28, 0.32, 0.18, 0.12, 0.08, 0.05)
  }),
  star: model('Star', '⭐', '#fdcb6e', [1.1, 1.1, 0.4], ({ cone, ball }) => {
    ball(null, 0, 0, 0, 0.6, 0.6, 0.36)
    for (let i = 0; i < 5; i++) { const a = i * 72; cone(i % 2 ? '#f9ae2b' : null, Math.sin(a * Math.PI / 180) * 0.3, Math.cos(a * Math.PI / 180) * 0.3, 0, 0.3, 0.46, 0.3, '', 0, 0, -a) }
  }),
  key: model('Key', '🔑', '#fdcb6e', [1.2, 0.6, 0.5], ({ box, cyl }) => {
    cyl(null, -0.38, 0, 0, 0.4, 0.4, 0.12, '', 90); cyl('#f9e79f', -0.38, 0, 0.01, 0.16, 0.16, 0.16, '', 90)
    box(null, 0.05, 0, 0, 0.7, 0.1, 0.1); box(null, 0.4, -0.12, 0, 0.1, 0.16, 0.1); box(null, 0.24, -0.1, 0, 0.1, 0.12, 0.1)
  }),
  potion: model('Potion', '🧪', '#a29bfe', [0.9, 1.3, 0.9], ({ ball, cyl }) => {
    ball('#e0f7ff', 0, -0.2, 0, 0.8, 0.7, 0.8); ball(null, 0, -0.28, 0, 0.66, 0.5, 0.66); cyl('#e0f7ff', 0, 0.2, 0, 0.26, 0.4, 0.26); cyl('#8d5a2b', 0, 0.48, 0, 0.3, 0.14, 0.3); ball('#fff', -0.18, -0.12, 0.28, 0.1, 0.14, 0.06)
  }),
  sword: model('Sword', '🗡️', '#dfe6e9', [0.5, 1.8, 0.2], ({ box, cone, ball }) => {
    box(null, 0, 0.2, 0, 0.18, 1.1, 0.06); cone(null, 0, 0.84, 0, 0.18, 0.2, 0.06); box('#fdcb6e', 0, -0.4, 0, 0.5, 0.08, 0.12); box('#8d5a2b', 0, -0.62, 0, 0.1, 0.34, 0.1); ball('#fdcb6e', 0, -0.82, 0, 0.14, 0.14, 0.14); box('#fff', 0, 0.2, 0.04, 0.03, 1.0, 0.02)
  }),
  crown: model('Crown', '👑', '#fdcb6e', [1.1, 0.8, 1.1], ({ box, cyl, ball }) => {
    cyl(null, 0, -0.15, 0, 1.0, 0.36, 1.0); cyl('#f9ae2b', 0, -0.3, 0, 1.04, 0.06, 1.04)
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; box(null, Math.sin(a) * 0.4, 0.15, Math.cos(a) * 0.4, 0.16, 0.34, 0.16); ball(i % 2 ? '#ff7675' : '#74b9ff', Math.sin(a) * 0.4, 0.36, Math.cos(a) * 0.4, 0.14, 0.14, 0.14) }
    ball('#d63031', 0, -0.12, 0.5, 0.14, 0.14, 0.06)
  }),
  flag: model('Goal flag', '🏁', '#ff7675', [1.4, 3, 0.5], ({ box, cyl, ball }) => {
    cyl('#b2bec3', -0.4, 0, 0, 0.08, 2.6, 0.08); ball('#fdcb6e', -0.4, 1.34, 0, 0.16, 0.16, 0.16); cyl('#636e72', -0.4, -1.4, 0, 0.5, 0.14, 0.5)
    box(null, 0.1, 0.95, 0, 0.9, 0.55, 0.05); box('#fff', 0.1, 0.95, 0.03, 0.3, 0.2, 0.03)
  }),
  present: model('Present', '🎁', '#e84393', [1.2, 1.2, 1.2], ({ box }) => {
    box(null, 0, -0.1, 0, 1.1, 0.9, 1.1); box('#fdcb6e', 0, -0.1, 0, 1.12, 0.92, 0.2); box('#fdcb6e', 0, -0.1, 0, 0.2, 0.92, 1.12); box(null, 0, 0.45, 0, 1.2, 0.2, 1.2); box('#fdcb6e', 0, 0.45, 0, 0.2, 0.22, 1.22)
    box('#fdcb6e', -0.22, 0.65, 0, 0.3, 0.16, 0.1, '', 0, 0, 20); box('#fdcb6e', 0.22, 0.65, 0, 0.3, 0.16, 0.1, '', 0, 0, -20)
  }),
}
export const MODEL_IDS = Object.keys(MODELS)

/** Friendly groups for the model picker. */
export const MODEL_GROUPS = {
  People: ['character', 'knight', 'wizard', 'ninja', 'pirate', 'astronaut', 'zombie', 'alien', 'robot', 'bearbot'],
  Animals: ['cat', 'dog', 'bunny', 'pig', 'duck', 'penguin', 'fish', 'dragon', 'bat'],
  Monsters: ['slime', 'ghost', 'ufo', 'snowman'],
  Vehicles: ['car', 'rocket', 'plane'],
  Nature: ['tree', 'pine', 'palm', 'cactus', 'flower', 'mushroom', 'rock'],
  Places: ['house', 'tower', 'lamp', 'sign', 'fence', 'barrel', 'crate', 'chest', 'door'],
  Items: ['coin', 'gem', 'heart', 'star', 'key', 'potion', 'sword', 'crown', 'flag', 'present'],
}

/* --------------------------------------------------------- templates */
// A template gives a custom model a standard set of moving-part names ("bones"),
// like "Person" or "Car". Premade animations swing those same names, so any
// model built on a template plays them in sync — walk, drive, fly and friends.
// anim values are object slots (anim = standing, animMove = moving, …).
export const MODEL_TEMPLATES = {
  person: {
    icon: '🧍', name: 'Person', desc: 'A head, two arms and two legs — walks, jumps, waves and dances.', rig: true,
    bones: ['head', 'armL', 'armR', 'legL', 'legR'],
    anim: { anim: 'b:idle', animMove: 'b:walk', animAir: 'b:jump', animClick: 'b:wave' },
  },
  animal: {
    icon: '🐾', name: 'Animal', desc: 'A head, a tail and four legs — walks, hops and wags.',
    bones: ['head', 'tail', 'legFL', 'legFR', 'legBL', 'legBR'], rig: true,
    anim: { anim: 'b:idle', animMove: 'b:walk', animAir: 'b:hop', animClick: 'b:wag' },
  },
  bird: {
    icon: '🐦', name: 'Bird', desc: 'A head, wings, tail and legs — flies, flaps and twirls.',
    bones: ['head', 'wingL', 'wingR', 'tail', 'legL', 'legR'], rig: true,
    anim: { anim: 'b:idle', animMove: 'b:fly', animAir: 'b:fly', animClick: 'b:twirl' },
  },
  car: {
    icon: '🚗', name: 'Car', desc: 'Four wheels that roll — drives, bounces and spins out.',
    bones: ['wheelFL', 'wheelFR', 'wheelBL', 'wheelBR'], rig: true,
    anim: { animMove: 'b:drive', animClick: 'b:spin' },
  },
  machine: {
    icon: '⚙️', name: 'Machine', desc: 'A propeller, flame, lid, door or hover ring — spins, burns and opens.',
    bones: ['prop', 'flame', 'lid', 'door', 'ring'],
    anim: { anim: 'b:hover', animMove: 'b:propeller', animClick: 'b:open' },
  },
}
export const MODEL_TEMPLATE_IDS = Object.keys(MODEL_TEMPLATES)

/** The template a model uses (picked in the Model maker), or null. */
export function modelTemplate(m) {
  return (m && m.tmpl && MODEL_TEMPLATES[m.tmpl]) || null
}

/** Best-matching template for a set of bone names (used to pre-pick one when remixing). */
export function templateForBones(names) {
  const set = new Set((names || []).filter((b) => b && b !== 'root'))
  if (!set.size) return ''
  let best = '', bestScore = 0
  for (const id of MODEL_TEMPLATE_IDS) {
    const bones = MODEL_TEMPLATES[id].bones
    let hit = 0
    for (const b of set) if (bones.includes(b)) hit++
    const score = hit / (bones.length + (set.size - hit))
    if (score > bestScore) { bestScore = score; best = id }
  }
  return bestScore >= 0.5 ? best : ''
}

// Position rules for "Fit my parts": each part (unit cube) joins the bone whose
// zone its centre falls in. Parts that could go either way are left alone.
const RIG_RULES = {
  person: (p) => (p.y > 0.18 ? 'head' : p.x < -0.26 ? 'armL' : p.x > 0.26 ? 'armR' : p.y < -0.16 ? (p.x < 0 ? 'legL' : 'legR') : undefined),
  animal: (p) => (p.z > 0.28 ? 'head' : p.z < -0.28 ? 'tail' : p.y < -0.15 ? (p.x < 0 ? (p.z >= 0 ? 'legFL' : 'legBL') : p.z >= 0 ? 'legFR' : 'legBR') : undefined),
  bird: (p) => (p.y > 0.14 ? 'head' : p.x < -0.22 ? 'wingL' : p.x > 0.22 ? 'wingR' : p.z < -0.24 ? 'tail' : p.y < -0.2 ? (p.x < 0 ? 'legL' : 'legR') : undefined),
  car: (p) => (p.y < -0.1 && Math.abs(p.x) > 0.25 ? (p.x < 0 ? (p.z >= 0 ? 'wheelFL' : 'wheelBL') : p.z >= 0 ? 'wheelFR' : 'wheelBR') : undefined),
}

/** Assign parts to a template's bones by where they sit. Returns new parts (safe to undo by hand). */
export function autoRig(tmpl, parts) {
  const rule = RIG_RULES[tmpl]
  if (!rule) return parts.map((p) => ({ ...p }))
  return parts.map((p) => {
    const g = rule(p)
    const q = { ...p }
    if (g) q.g = g; else delete q.g
    return q
  })
}

/** Resolve a model reference -> { parts } | { mesh } | null */
export function resolveModel(ref, models) {
  if (!ref) return null
  const r = normRef(ref)
  if (r.startsWith('b:')) return MODELS[r.slice(2)] || null
  return (models && models[r.slice(2)]) || null
}

/** Bones a model has (always includes 'root'). */
export function modelBones(m) {
  const set = new Set(['root'])
  if (m && m.parts) for (const p of m.parts) if (p.g) set.add(p.g)
  return [...set]
}

/** Default pivot (unit coords) for a bone, from the parts that belong to it. */
export function autoPivot(bone, parts) {
  const ps = parts.filter((p) => p.g === bone)
  if (!ps.length) return [0, 0, 0]
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ps) {
    x0 = Math.min(x0, p.x - p.w / 2); x1 = Math.max(x1, p.x + p.w / 2)
    y0 = Math.min(y0, p.y - p.h / 2); y1 = Math.max(y1, p.y + p.h / 2)
    z0 = Math.min(z0, p.z - p.d / 2); z1 = Math.max(z1, p.z + p.d / 2)
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2
  let pv
  if (/^(arm|leg)/.test(bone)) pv = [cx, y1, cz]
  else if (bone === 'head') pv = [cx, y0, cz]
  else if (/^wing/.test(bone)) pv = [cx < 0 ? x1 : x0, cy, cz]
  else if (bone === 'tail') pv = [cx, cy, z1]
  else if (bone === 'lid') pv = [cx, y0, z0]
  else if (bone === 'door') pv = [x0, cy, cz]
  else pv = [cx, cy, cz]
  return pv.map(r4)
}

/* --------------------------------------------------------------- OBJ import */
/** Parse a Wavefront .obj into a flat-shaded mesh normalised to a unit cube. */
export function parseOBJ(text, maxTris = 21000) {
  const v = [], tris = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (line.startsWith('v ')) {
      const p = line.split(/\s+/).slice(1, 4).map(Number)
      if (p.length === 3 && p.every(Number.isFinite)) v.push(p)
    } else if (line.startsWith('f ')) {
      const idx = line.split(/\s+/).slice(1).map((t) => {
        const n = parseInt(t.split('/')[0], 10)
        return n < 0 ? v.length + n : n - 1
      })
      for (let i = 1; i + 1 < idx.length; i++) tris.push(idx[0], idx[i], idx[i + 1])
    }
  }
  if (!v.length || !tris.length) throw new Error('No 3D shapes found in that file.')
  if (tris.length / 3 > maxTris) throw new Error(`That model has ${Math.round(tris.length / 3)} triangles. Please use one with fewer than ${maxTris}.`)
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
  for (const p of v) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]) }
  const ext = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  const big = Math.max(...ext) || 1
  const pos = [], nor = []
  for (let t = 0; t < tris.length; t += 3) {
    const pts = [tris[t], tris[t + 1], tris[t + 2]].map((i) => {
      const p = v[i]
      if (!p) throw new Error('This .obj file has a broken face.')
      return [(p[0] - (min[0] + max[0]) / 2) / big, (p[1] - (min[1] + max[1]) / 2) / big, (p[2] - (min[2] + max[2]) / 2) / big]
    })
    const a = pts[0], b = pts[1], c = pts[2]
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2]
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx
    const l = Math.hypot(nx, ny, nz) || 1
    nx /= l; ny /= l; nz /= l
    for (const p of pts) { pos.push(r4(p[0]), r4(p[1]), r4(p[2])); nor.push(r4(nx), r4(ny), r4(nz)) }
  }
  const s = 2 / big // so that the longest side is 2 world units by default
  return { pos, nor, size: [r4(ext[0] * s), r4(ext[1] * s), r4(ext[2] * s)] }
}
