// Studio helpers for sprites & models: thumbnails, default sizes, adding from the library.
import { Renderer3D, MODELS, resolveModel, makeEntity, SPRITES, spriteSource, ANIMS } from '../engine/index.js'

let canvas = null, rend = null
const cache = new Map()

const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return h }

export function modelKey(m) {
  if (!m) return ''
  return m.parts ? 'p' + hash(JSON.stringify(m.parts)) : 'm' + m.mesh.pos.length + ':' + hash(m.mesh.pos.slice(0, 300).join())
}

export function modelSize(m) {
  if (!m) return [1.5, 1.5, 1.5]
  if (m.mesh) return [2, 2, 2]
  return m.size || [1.5, 1.5, 1.5]
}

/** PNG data-URL of a model (rendered once with an off-screen WebGL canvas, then cached). */
export function modelThumb(ref, models, color, px = 128) {
  const m = resolveModel(ref, models)
  if (!m) return ''
  const col = color || m.color || '#a29bfe'
  const key = ref + '|' + col + '|' + modelKey(m)
  if (cache.has(key)) return cache.get(key)
  try {
    if (!rend) {
      canvas = document.createElement('canvas')
      canvas.width = canvas.height = px
      rend = new Renderer3D(canvas)
      rend.fixed = true
    }
    const sz = modelSize(m), k = 1.7 / Math.max(...sz)
    const c = ref.startsWith('c:') ? 'c:t' : ref
    rend.render({
      entities: [makeEntity('3d', { id: 't', type: 'box', x: 0, y: 0, z: 0, w: sz[0] * k, h: sz[1] * k, d: sz[2] * k, model: c, color: col })],
      particles: [], camera: { x: 0, y: 0, z: 0, yaw: 32, pitch: 20, dist: 3.9, fov: 40 },
      project: { background: ['#fff', '#fff'], models: { ...models, t: m } },
    })
    const url = canvas.toDataURL('image/png')
    cache.set(key, url)
    return url
  } catch {
    return ''
  }
}

export const spriteThumb = (ref, assets) => { const s = spriteSource(ref, assets); return s ? s.src : '' }

/** Partial entity for dropping a library item into the scene. */
export function entityForRef(mode, ref, project) {
  if (mode === '2d') {
    const builtin = ref.startsWith('b:')
    const a = !builtin && project.assets[ref.slice(2)]
    const name = builtin ? (SPRITES[ref.slice(2)] || {}).name : a && a.name
    let w = 64, h = 64
    if (a && a.w && a.h) { h = 64; w = Math.max(16, Math.round((64 * a.w) / a.h)) }
    return { type: 'sprite', sprite: ref, w, h, name: name || 'Sprite' }
  }
  const m = resolveModel(ref, project.models)
  const [w, h, d] = modelSize(m)
  const rigged = !!(m && m.parts && m.parts.some((p) => p.g))
  const anim = rigged ? (m.bones && m.bones.root ? 'b:sway' : 'b:idle') : undefined
  return { type: 'box', model: ref, w, h, d, color: (m && m.color) || '#a29bfe', name: (m && m.name) || 'Model', ...(anim ? { anim } : {}) }
}

export const builtinModels = () => Object.entries(MODELS).map(([id, m]) => ({ id: 'b:' + id, name: m.name, color: m.color }))

/** { icon, name } for an animation reference (for buttons). */
export function animInfo(ref, project) {
  if (!ref) return { icon: '🚫', name: 'None' }
  if (ref.startsWith('c:')) { const a = project.anims[ref.slice(2)]; return a ? { icon: '🎞️', name: a.name } : { icon: '❓', name: 'Missing' } }
  const a = ANIMS[project.mode][ref.slice(2)]
  return a ? { icon: a.icon, name: a.name } : { icon: '❓', name: 'Missing' }
}
