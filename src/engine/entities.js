// Project / object model, shape palette and ready-made presets.
import { behaviorDefaults } from './behaviors.js'

let counter = 0
export const uid = () => 'o' + Date.now().toString(36) + (counter++).toString(36) + Math.random().toString(36).slice(2, 5)

export const DEFAULT_CAMERA = { x: 0, y: 3, z: 0, yaw: 25, pitch: 32, dist: 17, fov: 50 }

export const SHAPES = {
  '2d': [
    { type: 'rect', label: 'Block', icon: '🟦', make: () => ({ w: 140, h: 40, color: '#6c5ce7', radius: 10 }) },
    { type: 'circle', label: 'Ball', icon: '🔴', make: () => ({ w: 60, h: 60, color: '#ff7675' }) },
    { type: 'emoji', label: 'Emoji', icon: '😀', make: () => ({ w: 64, h: 64, emoji: '😀' }) },
    { type: 'text', label: 'Text', icon: '🔤', make: () => ({ w: 200, h: 48, text: 'Hello!', color: '#ffffff' }) },
  ],
  '3d': [
    { type: 'box', label: 'Cube', icon: '🧊', make: () => ({ w: 2, h: 2, d: 2, color: '#6c5ce7' }) },
    { type: 'sphere', label: 'Sphere', icon: '🔮', make: () => ({ w: 1.6, h: 1.6, d: 1.6, color: '#ff7675' }) },
    { type: 'cylinder', label: 'Cylinder', icon: '🛢️', make: () => ({ w: 1.6, h: 2, d: 1.6, color: '#fdcb6e' }) },
    { type: 'cone', label: 'Cone', icon: '🔺', make: () => ({ w: 1.8, h: 2, d: 1.8, color: '#00b894' }) },
  ],
}

const B = behaviorDefaults

/** Ready-made characters and items: shape + behaviors already set up. */
export const PRESETS = {
  '2d': [
    { label: 'Hero (run & jump)', icon: '🐱', make: () => ({ type: 'emoji', emoji: '🐱', w: 56, h: 56, name: 'Hero', behaviors: [B('platformer'), B('camera')] }) },
    { label: 'Hero (top-down)', icon: '🦊', make: () => ({ type: 'emoji', emoji: '🦊', w: 56, h: 56, name: 'Explorer', behaviors: [B('move'), B('camera')] }) },
    { label: 'Platform', icon: '🟩', make: () => ({ type: 'rect', w: 200, h: 32, color: '#55c26b', radius: 12, name: 'Platform', behaviors: [B('solid')] }) },
    { label: 'Moving platform', icon: '🟧', make: () => ({ type: 'rect', w: 140, h: 28, color: '#f7a35c', radius: 12, name: 'Moving platform', behaviors: [B('solid'), { ...B('patrol'), speed: 3 }] }) },
    { label: 'Coin', icon: '🟡', make: () => ({ type: 'emoji', emoji: '🟡', w: 40, h: 40, name: 'Coin', behaviors: [B('collect'), B('bob')] }) },
    { label: 'Star', icon: '⭐', make: () => ({ type: 'emoji', emoji: '⭐', w: 44, h: 44, name: 'Star', behaviors: [{ ...B('collect'), points: 50 }, B('spin')] }) },
    { label: 'Monster', icon: '👾', make: () => ({ type: 'emoji', emoji: '👾', w: 52, h: 52, name: 'Monster', behaviors: [B('hazard'), B('patrol')] }) },
    { label: 'Chaser', icon: '👻', make: () => ({ type: 'emoji', emoji: '👻', w: 52, h: 52, name: 'Ghost', behaviors: [B('hazard'), { ...B('follow'), speed: 2 }] }) },
    { label: 'Spikes', icon: '🔺', make: () => ({ type: 'emoji', emoji: '🔺', w: 44, h: 36, name: 'Spikes', behaviors: [B('hazard')] }) },
    { label: 'Goal flag', icon: '🏁', make: () => ({ type: 'emoji', emoji: '🏁', w: 56, h: 56, name: 'Goal', behaviors: [B('goal'), B('bob')] }) },
    { label: 'Bouncy ball', icon: '⚽', make: () => ({ type: 'emoji', emoji: '⚽', w: 48, h: 48, name: 'Ball', behaviors: [B('bounce'), B('spin')] }) },
    { label: 'Crate', icon: '📦', make: () => ({ type: 'emoji', emoji: '📦', w: 56, h: 56, name: 'Crate', behaviors: [B('solid'), B('gravity')] }) },
    { label: 'Click target', icon: '🎯', make: () => ({ type: 'emoji', emoji: '🎯', w: 64, h: 64, name: 'Target', behaviors: [B('clicker'), B('bob')] }) },
    { label: 'Tree', icon: '🌳', make: () => ({ type: 'emoji', emoji: '🌳', w: 90, h: 90, name: 'Tree' }) },
    { label: 'Cloud', icon: '☁️', make: () => ({ type: 'emoji', emoji: '☁️', w: 110, h: 70, name: 'Cloud', behaviors: [{ ...B('patrol'), speed: 1, distance: 8 }] }) },
  ],
  '3d': [
    { label: 'Hero (run & jump)', icon: '🟣', make: () => ({ type: 'sphere', color: '#a29bfe', w: 1.4, h: 1.4, d: 1.4, name: 'Hero', behaviors: [B('platformer'), B('camera')] }) },
    { label: 'Hero (walk)', icon: '🟢', make: () => ({ type: 'sphere', color: '#55efc4', w: 1.4, h: 1.4, d: 1.4, name: 'Walker', behaviors: [B('move'), B('camera')] }) },
    { label: 'Ground', icon: '🟩', make: () => ({ type: 'box', color: '#55c26b', w: 30, h: 1, d: 30, y: -0.5, pattern: true, name: 'Ground', behaviors: [B('solid')] }) },
    { label: 'Platform', icon: '🟫', make: () => ({ type: 'box', color: '#e17055', w: 4, h: 0.8, d: 4, name: 'Platform', behaviors: [B('solid')] }) },
    { label: 'Moving platform', icon: '🟧', make: () => ({ type: 'box', color: '#f7a35c', w: 3.5, h: 0.8, d: 3.5, name: 'Moving platform', behaviors: [B('solid'), { ...B('patrol'), speed: 3 }] }) },
    { label: 'Wall', icon: '🧱', make: () => ({ type: 'box', color: '#b2bec3', w: 6, h: 3, d: 1, name: 'Wall', behaviors: [B('solid')] }) },
    { label: 'Coin', icon: '🟡', make: () => ({ type: 'box', color: '#fdcb6e', w: 0.8, h: 0.8, d: 0.8, rx: 35, rz: 35, name: 'Coin', behaviors: [B('collect'), B('bob'), { ...B('spin'), speed: 5 }] }) },
    { label: 'Star gem', icon: '💎', make: () => ({ type: 'cone', color: '#74b9ff', w: 0.9, h: 1.3, d: 0.9, name: 'Gem', behaviors: [{ ...B('collect'), points: 50 }, B('spin'), B('bob')] }) },
    { label: 'Monster', icon: '👾', make: () => ({ type: 'sphere', color: '#ff7675', w: 1.5, h: 1.5, d: 1.5, name: 'Monster', behaviors: [B('hazard'), B('patrol')] }) },
    { label: 'Chaser', icon: '👻', make: () => ({ type: 'sphere', color: '#dfe6e9', w: 1.4, h: 1.4, d: 1.4, name: 'Ghost', behaviors: [B('hazard'), { ...B('follow'), speed: 2 }] }) },
    { label: 'Spikes', icon: '🔺', make: () => ({ type: 'cone', color: '#d63031', w: 1.2, h: 1.2, d: 1.2, name: 'Spikes', behaviors: [B('hazard')] }) },
    { label: 'Goal pillar', icon: '🏁', make: () => ({ type: 'cylinder', color: '#00e676', w: 1.6, h: 3, d: 1.6, name: 'Goal', behaviors: [B('goal'), B('spin')] }) },
    { label: 'Bouncy ball', icon: '⚽', make: () => ({ type: 'sphere', color: '#ffffff', w: 1.4, h: 1.4, d: 1.4, name: 'Ball', behaviors: [B('bounce')] }) },
    { label: 'Crate', icon: '📦', make: () => ({ type: 'box', color: '#c8923e', w: 1.6, h: 1.6, d: 1.6, name: 'Crate', behaviors: [B('solid'), B('gravity')] }) },
    { label: 'Click target', icon: '🎯', make: () => ({ type: 'sphere', color: '#ff7675', w: 1.5, h: 1.5, d: 1.5, name: 'Target', behaviors: [B('clicker'), B('bob')] }) },
    { label: 'Tree', icon: '🌲', make: () => ({ type: 'cone', color: '#2ecc71', w: 2.4, h: 4, d: 2.4, name: 'Tree' }) },
  ],
}

export function makeEntity(mode, partial = {}) {
  const base = mode === '3d'
    ? { x: 0, y: 1, z: 0, rx: 0, ry: 0, rz: 0, w: 2, h: 2, d: 2 }
    : { x: 480, y: 270, z: 0, rx: 0, ry: 0, rz: 0, w: 100, h: 100, d: 1 }
  return { id: uid(), name: 'Object', type: mode === '3d' ? 'box' : 'rect', color: '#6c5ce7', opacity: 1, visible: true, behaviors: [], ...base, ...partial }
}

export function makeProject(mode = '2d', name = 'My Game') {
  return normalizeProject({ name, mode, objects: [] })
}

/** Fill in any missing fields so imported / shared / old projects always run. */
export function normalizeProject(p) {
  const mode = p && p.mode === '3d' ? '3d' : '2d'
  const out = {
    v: 1,
    name: (p && p.name) || 'My Game',
    mode,
    background: (p && p.background) || (mode === '3d' ? ['#7ec8ff', '#e6f6ff'] : ['#5b8def', '#bfe3ff']),
    world: { w: 960, h: 540, ...(p && p.world) },
    camera: { ...DEFAULT_CAMERA, ...(p && p.camera) },
    settings: { lives: 3, win: 'auto', sound: true, ...(p && p.settings) },
    objects: ((p && p.objects) || []).map((o) => makeEntity(mode, o)),
  }
  return out
}
