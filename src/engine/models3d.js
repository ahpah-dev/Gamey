// 3D models: built-in library made of primitives, custom part-based models, and OBJ meshes.
// A model reference is 'b:<name>' (built-in) or 'c:<id>' (project.models[id]).
// Parts live in a unit cube (-0.5..0.5, y up) and get scaled by the object's w/h/d.
// part: { s: 'box'|'sphere'|'cylinder'|'cone', c: '#hex' | null (= object color), x,y,z, w,h,d, rx,ry,rz }
import { normRef } from './sprites.js'

const P = (s, c, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) => ({ s, c, x, y, z, w, h, d, rx, ry, rz })
const mirrorX = (p) => ({ ...p, x: -p.x, rz: -p.rz, ry: -p.ry })

export const MODELS = {
  character: { name: 'Character', icon: '🧍', color: '#a29bfe', size: [1.1, 1.6, 1.1], parts: [
    P('box', null, 0, -0.08, 0, 0.56, 0.5, 0.36), P('box', '#ffdbb0', 0, 0.3, 0, 0.46, 0.36, 0.4), P('box', '#6b4a2b', 0, 0.45, -0.02, 0.5, 0.1, 0.44),
    P('box', '#222', -0.1, 0.32, 0.21, 0.07, 0.09, 0.03), P('box', '#222', 0.1, 0.32, 0.21, 0.07, 0.09, 0.03),
    P('box', '#3d3d78', -0.14, -0.38, 0, 0.2, 0.24, 0.24), P('box', '#3d3d78', 0.14, -0.38, 0, 0.2, 0.24, 0.24),
    P('box', null, -0.4, -0.06, 0, 0.14, 0.4, 0.2), P('box', null, 0.4, -0.06, 0, 0.14, 0.4, 0.2)] },
  robot: { name: 'Robot', icon: '🤖', color: '#74b9ff', size: [1.3, 1.6, 1.1], parts: [
    P('box', null, 0, -0.1, 0, 0.6, 0.46, 0.4), P('box', '#dfe6e9', 0, 0.25, 0, 0.5, 0.32, 0.38),
    P('box', '#00cec9', -0.11, 0.27, 0.2, 0.1, 0.1, 0.03), P('box', '#00cec9', 0.11, 0.27, 0.2, 0.1, 0.1, 0.03),
    P('cylinder', '#636e72', 0, 0.45, 0, 0.04, 0.1, 0.04), P('sphere', '#ff7675', 0, 0.48, 0, 0.1, 0.1, 0.1),
    P('box', '#636e72', -0.4, -0.08, 0, 0.12, 0.4, 0.14), P('box', '#636e72', 0.4, -0.08, 0, 0.12, 0.4, 0.14),
    P('box', '#2d3436', -0.2, -0.4, 0, 0.2, 0.2, 0.4), P('box', '#2d3436', 0.2, -0.4, 0, 0.2, 0.2, 0.4)] },
  tree: { name: 'Round tree', icon: '🌳', color: '#2ecc71', size: [2.4, 3.4, 2.4], parts: [
    P('cylinder', '#8d5a2b', 0, -0.28, 0, 0.18, 0.44, 0.18), P('sphere', null, 0, 0.1, 0, 0.8, 0.7, 0.8),
    P('sphere', null, 0.22, -0.02, 0.05, 0.5, 0.44, 0.5), P('sphere', null, -0.22, 0, -0.05, 0.5, 0.44, 0.5), P('sphere', null, 0, 0.3, 0, 0.5, 0.4, 0.5)] },
  pine: { name: 'Pine tree', icon: '🌲', color: '#27ae60', size: [2.4, 3.8, 2.4], parts: [
    P('cylinder', '#8d5a2b', 0, -0.42, 0, 0.14, 0.16, 0.14), P('cone', null, 0, -0.2, 0, 0.8, 0.36, 0.8), P('cone', null, 0, 0.02, 0, 0.62, 0.34, 0.62),
    P('cone', null, 0, 0.24, 0, 0.44, 0.32, 0.44), P('cone', null, 0, 0.38, 0, 0.26, 0.24, 0.26)] },
  house: { name: 'House', icon: '🏠', color: '#fab1a0', size: [4, 3.4, 3.6], parts: [
    P('box', null, 0, -0.2, 0, 0.8, 0.6, 0.7), P('box', '#e17055', -0.2, 0.2, 0, 0.55, 0.08, 0.8, 0, 0, 35), P('box', '#e17055', 0.2, 0.2, 0, 0.55, 0.08, 0.8, 0, 0, -35),
    P('box', '#8d5a2b', 0, -0.3, 0.36, 0.16, 0.3, 0.03), P('box', '#74b9ff', -0.24, -0.14, 0.36, 0.14, 0.14, 0.03), P('box', '#74b9ff', 0.24, -0.14, 0.36, 0.14, 0.14, 0.03)] },
  car: { name: 'Car', icon: '🚗', color: '#ff7675', size: [3, 1.4, 1.6], parts: [
    P('box', null, 0, -0.2, 0, 0.95, 0.26, 0.5), P('box', '#dfe6e9', -0.05, 0.02, 0, 0.5, 0.22, 0.44),
    P('cylinder', '#2d3436', -0.28, -0.37, 0.26, 0.26, 0.12, 0.26, 90), P('cylinder', '#2d3436', 0.28, -0.37, 0.26, 0.26, 0.12, 0.26, 90),
    P('cylinder', '#2d3436', -0.28, -0.37, -0.26, 0.26, 0.12, 0.26, 90), P('cylinder', '#2d3436', 0.28, -0.37, -0.26, 0.26, 0.12, 0.26, 90),
    P('box', '#ffeaa7', 0.48, -0.2, 0.15, 0.04, 0.08, 0.1), P('box', '#ffeaa7', 0.48, -0.2, -0.15, 0.04, 0.08, 0.1)] },
  rocket: { name: 'Rocket', icon: '🚀', color: '#ff7675', size: [1.4, 3, 1.4], parts: [
    P('cylinder', '#f1f2f6', 0, -0.05, 0, 0.4, 0.6, 0.4), P('cone', null, 0, 0.38, 0, 0.4, 0.25, 0.4), P('sphere', '#74b9ff', 0, 0.08, 0.19, 0.16, 0.16, 0.08),
    P('box', null, 0.24, -0.3, 0, 0.18, 0.3, 0.06, 0, 0, -15), P('box', null, -0.24, -0.3, 0, 0.18, 0.3, 0.06, 0, 0, 15), P('box', null, 0, -0.3, 0.24, 0.06, 0.3, 0.18),
    P('cone', '#ffa502', 0, -0.44, 0, 0.2, 0.14, 0.2, 180)] },
  snowman: { name: 'Snowman', icon: '⛄', color: '#ffffff', size: [1.4, 2.4, 1.4], parts: [
    P('sphere', null, 0, -0.28, 0, 0.5, 0.44, 0.5), P('sphere', null, 0, 0.02, 0, 0.38, 0.34, 0.38), P('sphere', null, 0, 0.26, 0, 0.28, 0.26, 0.28),
    P('cone', '#ff9f43', 0, 0.26, 0.17, 0.06, 0.14, 0.06, 90), P('sphere', '#2d3436', -0.05, 0.3, 0.12, 0.04, 0.04, 0.04), P('sphere', '#2d3436', 0.05, 0.3, 0.12, 0.04, 0.04, 0.04),
    P('cylinder', '#2d3436', 0, 0.42, 0, 0.22, 0.14, 0.22), P('cylinder', '#2d3436', 0, 0.36, 0, 0.34, 0.03, 0.34)] },
  mushroom: { name: 'Mushroom', icon: '🍄', color: '#ff6b6b', size: [1.6, 1.6, 1.6], parts: [
    P('cylinder', '#fff3d6', 0, -0.25, 0, 0.3, 0.5, 0.3), P('sphere', null, 0, 0.05, 0, 0.9, 0.7, 0.9),
    P('sphere', '#fff', 0, 0.38, 0, 0.22, 0.1, 0.22), P('sphere', '#fff', 0.26, 0.2, 0.18, 0.18, 0.12, 0.18), P('sphere', '#fff', -0.24, 0.18, -0.2, 0.18, 0.12, 0.18)] },
  tower: { name: 'Castle tower', icon: '🏰', color: '#b2bec3', size: [2.6, 4.6, 2.6], parts: [
    P('cylinder', null, 0, -0.1, 0, 0.6, 0.8, 0.6), P('cone', '#e17055', 0, 0.35, 0, 0.74, 0.3, 0.74),
    P('box', '#6d4c2f', 0, -0.36, 0.29, 0.16, 0.24, 0.05), P('box', '#2d3436', 0, 0.05, 0.29, 0.1, 0.16, 0.05)] },
  cactus: { name: 'Cactus', icon: '🌵', color: '#2ecc71', size: [1.2, 2.4, 1.2], parts: [
    P('cylinder', null, 0, -0.05, 0, 0.3, 0.9, 0.3), P('cylinder', null, -0.2, -0.08, 0, 0.12, 0.3, 0.12, 0, 0, 90), P('cylinder', null, -0.3, 0.06, 0, 0.12, 0.3, 0.12),
    P('cylinder', null, 0.2, 0.0, 0, 0.12, 0.3, 0.12, 0, 0, 90), P('cylinder', null, 0.3, 0.14, 0, 0.12, 0.3, 0.12), P('sphere', '#fd79a8', 0, 0.42, 0, 0.14, 0.1, 0.14)] },
  coin: { name: 'Coin', icon: '🟡', color: '#fdcb6e', size: [1, 1, 1], parts: [
    P('cylinder', null, 0, 0, 0, 1, 0.14, 1, 90), P('cylinder', '#f9ae2b', 0, 0, 0, 0.7, 0.17, 0.7, 90)] },
  gem: { name: 'Gem', icon: '💎', color: '#74b9ff', size: [0.9, 1.3, 0.9], parts: [
    P('cone', null, 0, 0.2, 0, 0.8, 0.6, 0.8), P('cone', null, 0, -0.2, 0, 0.8, 0.6, 0.8, 180)] },
  heart: { name: 'Heart', icon: '❤️', color: '#ff6b81', size: [1, 1, 0.6], parts: [
    P('sphere', null, -0.2, 0.18, 0, 0.46, 0.46, 0.4), P('sphere', null, 0.2, 0.18, 0, 0.46, 0.46, 0.4), P('cone', null, 0, -0.12, 0, 0.7, 0.7, 0.4, 180)] },
  chest: { name: 'Treasure chest', icon: '🧰', color: '#b9772f', size: [1.6, 1.2, 1.1], parts: [
    P('box', null, 0, -0.25, 0, 0.9, 0.5, 0.6), P('cylinder', '#c8862f', 0, 0, 0, 0.6, 0.9, 0.6, 0, 0, 90), P('box', '#fdcb6e', 0, 0.02, 0.31, 0.14, 0.16, 0.04),
    P('box', '#fdcb6e', -0.3, -0.25, 0, 0.06, 0.52, 0.62), P('box', '#fdcb6e', 0.3, -0.25, 0, 0.06, 0.52, 0.62)] },
  ghost: { name: 'Ghost', icon: '👻', color: '#f1f2f6', size: [1.2, 1.5, 1.2], parts: [
    P('cylinder', null, 0, -0.15, 0, 0.7, 0.6, 0.7), P('sphere', null, 0, 0.15, 0, 0.7, 0.7, 0.7),
    P('sphere', '#2d3436', -0.14, 0.18, 0.3, 0.12, 0.16, 0.08), P('sphere', '#2d3436', 0.14, 0.18, 0.3, 0.12, 0.16, 0.08), P('sphere', '#ff9ff3', 0, 0.02, 0.34, 0.14, 0.08, 0.06)] },
  flag: { name: 'Goal flag', icon: '🏁', color: '#ff7675', size: [1.2, 3, 0.5], parts: [
    P('cylinder', '#b2bec3', -0.3, 0, 0, 0.06, 1, 0.06), P('box', null, 0.02, 0.3, 0, 0.6, 0.32, 0.04), P('cylinder', '#636e72', -0.3, -0.46, 0, 0.3, 0.08, 0.3)] },
  barrel: { name: 'Barrel', icon: '🛢️', color: '#b9772f', size: [1.2, 1.5, 1.2], parts: [
    P('cylinder', null, 0, 0, 0, 0.8, 1, 0.8), P('cylinder', '#636e72', 0, 0.3, 0, 0.84, 0.06, 0.84), P('cylinder', '#636e72', 0, -0.3, 0, 0.84, 0.06, 0.84)] },
  crate: { name: 'Crate', icon: '📦', color: '#c8923e', size: [1.6, 1.6, 1.6], parts: [
    P('box', null, 0, 0, 0, 1, 1, 1), P('box', '#8d5a2b', -0.46, 0, -0.46, 0.1, 1.02, 0.1), P('box', '#8d5a2b', 0.46, 0, -0.46, 0.1, 1.02, 0.1),
    P('box', '#8d5a2b', -0.46, 0, 0.46, 0.1, 1.02, 0.1), P('box', '#8d5a2b', 0.46, 0, 0.46, 0.1, 1.02, 0.1),
    P('box', '#8d5a2b', 0, 0.46, 0, 1.02, 0.1, 1.02), P('box', '#8d5a2b', 0, -0.46, 0, 1.02, 0.1, 1.02)] },
  cat: { name: 'Cat', icon: '🐱', color: '#fdcb6e', size: [1, 1, 1.4], parts: [
    P('sphere', null, 0, -0.22, -0.05, 0.5, 0.5, 0.7), P('sphere', null, 0, 0.1, 0.22, 0.5, 0.45, 0.45),
    P('cone', null, -0.15, 0.4, 0.2, 0.14, 0.2, 0.14), P('cone', null, 0.15, 0.4, 0.2, 0.14, 0.2, 0.14),
    P('sphere', '#2d3436', -0.1, 0.14, 0.43, 0.07, 0.09, 0.05), P('sphere', '#2d3436', 0.1, 0.14, 0.43, 0.07, 0.09, 0.05), P('sphere', '#ff7675', 0, 0.06, 0.46, 0.06, 0.05, 0.05),
    P('box', null, -0.15, -0.42, 0.15, 0.12, 0.16, 0.14), P('box', null, 0.15, -0.42, 0.15, 0.12, 0.16, 0.14), P('box', null, -0.15, -0.42, -0.25, 0.12, 0.16, 0.14), P('box', null, 0.15, -0.42, -0.25, 0.12, 0.16, 0.14),
    P('cylinder', null, 0, -0.08, -0.4, 0.08, 0.4, 0.08, 60)] },
}
export const MODEL_IDS = Object.keys(MODELS)

/** Resolve a model reference -> { parts } | { mesh } | null */
export function resolveModel(ref, models) {
  if (!ref) return null
  const r = normRef(ref)
  if (r.startsWith('b:')) return MODELS[r.slice(2)] || null
  return (models && models[r.slice(2)]) || null
}

export { mirrorX }

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
  const r4 = (n) => Math.round(n * 10000) / 10000
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
