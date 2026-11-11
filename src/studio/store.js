import { useCallback, useRef, useState } from 'react'
import { makeEntity } from '../engine/index.js'

const LIMIT = 80

/** Project state with undo/redo. `key` merges rapid edits (dragging, sliders) into one undo step. */
export function useProject(initial) {
  const ref = useRef({ project: initial, past: [], future: [], k: null, t: 0 })
  const [, force] = useState(0)

  const set = useCallback((updater, opts = {}) => {
    const cur = ref.current
    const next = typeof updater === 'function' ? updater(cur.project) : updater
    if (next === cur.project) return
    const now = Date.now()
    const merge = opts.silent || (opts.key && cur.k === opts.key && now - cur.t < 800)
    ref.current = {
      project: next,
      past: merge ? cur.past : [...cur.past.slice(-LIMIT), cur.project],
      future: [],
      k: opts.key || null,
      t: now,
    }
    force((n) => n + 1)
  }, [])

  const reset = useCallback((project) => {
    ref.current = { project, past: [], future: [], k: null, t: 0 }
    force((n) => n + 1)
  }, [])

  const undo = useCallback(() => {
    const c = ref.current
    if (!c.past.length) return
    ref.current = { project: c.past[c.past.length - 1], past: c.past.slice(0, -1), future: [c.project, ...c.future], k: null, t: 0 }
    force((n) => n + 1)
  }, [])

  const redo = useCallback(() => {
    const c = ref.current
    if (!c.future.length) return
    ref.current = { project: c.future[0], past: [...c.past, c.project], future: c.future.slice(1), k: null, t: 0 }
    force((n) => n + 1)
  }, [])

  const c = ref.current
  return { project: c.project, set, reset, undo, redo, canUndo: c.past.length > 0, canRedo: c.future.length > 0 }
}

/* ------------------------------------------------ pure project operations */
export const patchObject = (id, patch) => (p) => ({
  ...p, objects: p.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)),
})

export const addObject = (partial) => (p) => ({ ...p, objects: [...p.objects, makeEntity(p.mode, partial)] })

export const removeObject = (id) => (p) => ({ ...p, objects: p.objects.filter((o) => o.id !== id) })

export function duplicateObject(id, newId) {
  return (p) => {
    const o = p.objects.find((x) => x.id === id)
    if (!o) return p
    const off = p.mode === '3d' ? { x: o.x + 1.5, z: (o.z || 0) + 1.5 } : { x: o.x + 30, y: o.y + 30 }
    const copy = { ...o, ...off, id: newId, name: o.name, behaviors: o.behaviors.map((b) => ({ ...b })) }
    return { ...p, objects: [...p.objects, copy] }
  }
}

export const moveInOrder = (id, dir) => (p) => {
  const i = p.objects.findIndex((o) => o.id === id)
  const j = i + dir
  if (i < 0 || j < 0 || j >= p.objects.length) return p
  const objects = p.objects.slice();
  [objects[i], objects[j]] = [objects[j], objects[i]]
  return { ...p, objects }
}

export const addBehavior = (id, behavior) => (p) => patchObject(id, {})({
  ...p,
  objects: p.objects.map((o) => (o.id === id && !o.behaviors.some((b) => b.type === behavior.type) ? { ...o, behaviors: [...o.behaviors, behavior] } : o)),
})

export const patchBehavior = (id, type, patch) => (p) => ({
  ...p,
  objects: p.objects.map((o) => (o.id === id ? { ...o, behaviors: o.behaviors.map((b) => (b.type === type ? { ...b, ...patch } : b)) } : o)),
})

export const removeBehavior = (id, type) => (p) => ({
  ...p,
  objects: p.objects.map((o) => (o.id === id ? { ...o, behaviors: o.behaviors.filter((b) => b.type !== type) } : o)),
})

const KEY = 'gamey.project.v1'
export const loadSaved = () => { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } }
export const saveLocal = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* quota */ } }
