// Project / object model, shape palette and ready-made presets.
import { behaviorDefaults } from './behaviors.js'
import { emojiToSprite } from './sprites.js'
import { MODELS } from './models3d.js'

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
const bh = (type, over) => ({ ...B(type), ...over })

// 2D helpers
const sp = (name, w, h, extra = {}) => ({ type: 'sprite', sprite: 'b:' + name, w, h, ...extra })
// 3D helper: a built-in model at its natural size
const mdl = (id, extra = {}) => {
  const m = MODELS[id]
  return { type: 'box', model: 'b:' + id, color: m.color, w: m.size[0], h: m.size[1], d: m.size[2], name: m.name, ...extra }
}

export const PRESET_CATS = { '2d': ['Heroes', 'Enemies', 'Items', 'World', 'Scenes'], '3d': ['Heroes', 'Enemies', 'Items', 'World', 'Friends'] }

/** Ready-made characters and items: shape + behaviors + animations already set up. */
export const PRESETS = {
  '2d': [
    { cat: 'Heroes', label: 'Hero (run & jump)', icon: '🐱', make: () => sp('cat', 56, 56, { name: 'Hero', behaviors: [B('platformer'), B('camera')], anim: 'b:idle', animMove: 'b:waddle', animAir: 'b:hop' }) },
    { cat: 'Heroes', label: 'Hero (top-down)', icon: '🦊', make: () => sp('hero', 56, 56, { name: 'Explorer', behaviors: [B('move'), B('camera')], anim: 'b:idle', animMove: 'b:waddle' }) },
    { cat: 'Heroes', label: 'Gunner (run, jump, shoot)', icon: '🔫', make: () => sp('robot', 56, 56, { name: 'Gunner', behaviors: [B('platformer'), B('shoot'), B('camera')], anim: 'b:idle', animMove: 'b:waddle', animAir: 'b:hop' }) },
    { cat: 'Heroes', label: 'Spaceship (shoots)', icon: '🚀', make: () => sp('ship', 56, 56, { name: 'Spaceship', behaviors: [bh('move', { speed: 6 }), bh('shoot', { aim: 'up' })], anim: 'b:float' }) },
    { cat: 'Heroes', label: 'Race car', icon: '🏎️', make: () => sp('car', 34, 56, { name: 'Race car', behaviors: [B('drive'), B('camera')] }) },
    { cat: 'Enemies', label: 'Monster (patrols)', icon: '👾', make: () => sp('slime', 52, 52, { name: 'Monster', behaviors: [B('hazard'), B('patrol')], anim: 'b:jelly' }) },
    { cat: 'Enemies', label: 'Chaser', icon: '👻', make: () => sp('ghost', 52, 52, { name: 'Ghost', behaviors: [B('hazard'), bh('follow', { speed: 2 })], anim: 'b:float' }) },
    { cat: 'Enemies', label: 'Bat', icon: '🦇', make: () => sp('bat', 56, 44, { name: 'Bat', behaviors: [B('hazard'), B('bounce')], anim: 'b:float' }) },
    { cat: 'Enemies', label: 'Alien (shoot it!)', icon: '👽', make: () => sp('alien', 52, 52, { name: 'Alien', behaviors: [B('hazard'), B('health'), bh('drift', { speed: 3 })], anim: 'b:wobble' }) },
    { cat: 'Enemies', label: 'Alien spawner', icon: '🏭', make: () => sp('alien', 52, 52, { name: 'Alien spawner', y: 40, behaviors: [bh('spawner', { rate: 5, spread: 10 }), B('hazard'), B('health'), bh('drift', { speed: 3 })], anim: 'b:wobble' }) },
    { cat: 'Enemies', label: 'Asteroid', icon: '☄️', make: () => sp('asteroid', 60, 60, { name: 'Asteroid', behaviors: [B('hazard'), bh('health', { hits: 2 }), bh('drift', { speed: 3 }), bh('spin', { speed: 2 })] }) },
    { cat: 'Enemies', label: 'Skull', icon: '💀', make: () => sp('skull', 48, 48, { name: 'Skull', behaviors: [B('hazard'), bh('follow', { speed: 2, range: 5 })], anim: 'b:shake' }) },
    { cat: 'Enemies', label: 'Spikes', icon: '🔺', make: () => sp('spikes', 48, 36, { name: 'Spikes', behaviors: [B('hazard')] }) },
    { cat: 'Items', label: 'Coin', icon: '🟡', make: () => sp('coin', 40, 40, { name: 'Coin', behaviors: [B('collect'), B('bob')] }) },
    { cat: 'Items', label: 'Star', icon: '⭐', make: () => sp('star', 44, 44, { name: 'Star', behaviors: [bh('collect', { points: 50 }), B('spin')] }) },
    { cat: 'Items', label: 'Gem', icon: '💎', make: () => sp('gem', 40, 40, { name: 'Gem', behaviors: [bh('collect', { points: 30 })], anim: 'b:pulse' }) },
    { cat: 'Items', label: 'Key', icon: '🔑', make: () => sp('key', 44, 44, { name: 'Key', behaviors: [B('collect'), B('bob')] }) },
    { cat: 'Items', label: 'Goal flag', icon: '🏁', make: () => sp('flag', 56, 56, { name: 'Goal', behaviors: [B('goal'), B('bob')] }) },
    { cat: 'Items', label: 'Click target', icon: '🎯', make: () => ({ type: 'emoji', emoji: '🎯', w: 64, h: 64, name: 'Target', behaviors: [B('clicker'), B('bob')], animClick: 'b:popin' }) },
    { cat: 'World', label: 'Platform', icon: '🟩', make: () => ({ type: 'rect', w: 200, h: 32, color: '#55c26b', radius: 12, name: 'Platform', behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Moving platform', icon: '🟧', make: () => ({ type: 'rect', w: 140, h: 28, color: '#f7a35c', radius: 12, name: 'Moving platform', behaviors: [B('solid'), bh('patrol', { speed: 3 })] }) },
    { cat: 'World', label: 'Wall', icon: '🧱', make: () => ({ type: 'rect', w: 40, h: 160, color: '#636e72', radius: 6, name: 'Wall', behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Locked gate', icon: '🔒', make: () => sp('gate', 64, 80, { name: 'Gate', behaviors: [B('gate')] }) },
    { cat: 'World', label: 'Crate', icon: '📦', make: () => sp('crate', 56, 56, { name: 'Crate', behaviors: [B('solid'), B('gravity')] }) },
    { cat: 'World', label: 'Bouncy ball', icon: '⚽', make: () => ({ type: 'emoji', emoji: '⚽', w: 48, h: 48, name: 'Ball', behaviors: [B('bounce'), B('spin')] }) },
    { cat: 'World', label: 'Tree', icon: '🌳', make: () => sp('tree', 90, 90, { name: 'Tree', anim: 'b:wobble' }) },
    { cat: 'World', label: 'Cloud', icon: '☁️', make: () => sp('cloud', 110, 70, { name: 'Cloud', behaviors: [bh('patrol', { speed: 1, distance: 8 })] }) },
    { cat: 'Scenes', label: 'Camera button', icon: '📺', make: () => sp('monitor', 70, 56, { name: 'Camera button', hud: true, behaviors: [B('goto')] }) },
    { cat: 'Scenes', label: 'Door button', icon: '🔴', make: () => ({ type: 'circle', w: 54, h: 54, color: '#d63031', name: 'Door button', behaviors: [bh('toggle', { switch: 1, drain: 5 })] }) },
    { cat: 'Scenes', label: 'Light button', icon: '💡', make: () => sp('bulb', 50, 50, { name: 'Light button', behaviors: [bh('toggle', { switch: 2, drain: 3 })] }) },
    { cat: 'Scenes', label: 'Door (when switch 1 ON)', icon: '🚪', make: () => ({ type: 'rect', w: 110, h: 300, color: '#7f8c8d', radius: 6, name: 'Closed door', when: { sw: 1, on: true } }) },
    { cat: 'Scenes', label: 'Sneaky animatronic', icon: '🐻', make: () => sp('bear', 120, 120, { name: 'Animatronic', behaviors: [B('stalker')], anim: 'b:creep' }) },
    { cat: 'Scenes', label: 'Screen label', icon: '🔤', make: () => ({ type: 'text', text: 'CAM 1', w: 140, h: 40, color: '#55efc4', name: 'Label', hud: true }) },
  ],
  '3d': [
    { cat: 'Heroes', label: 'Hero (run & jump)', icon: '🧍', make: () => mdl('character', { name: 'Hero', color: '#a29bfe', behaviors: [B('platformer'), B('camera')], anim: 'b:idle', animMove: 'b:walk', animAir: 'b:jump' }) },
    { cat: 'Heroes', label: 'Explorer (walks)', icon: '🧙', make: () => mdl('wizard', { name: 'Explorer', behaviors: [B('move'), B('camera')], anim: 'b:idle', animMove: 'b:walk' }) },
    { cat: 'Heroes', label: 'Knight (run & jump)', icon: '🛡️', make: () => mdl('knight', { behaviors: [B('platformer'), B('camera')], anim: 'b:idle', animMove: 'b:run', animAir: 'b:jump' }) },
    { cat: 'Heroes', label: 'Astronaut (walks)', icon: '🧑‍🚀', make: () => mdl('astronaut', { behaviors: [B('move'), B('camera')], anim: 'b:idle', animMove: 'b:walk' }) },
    { cat: 'Heroes', label: 'Dog (run & jump)', icon: '🐶', make: () => mdl('dog', { name: 'Dog hero', behaviors: [B('platformer'), B('camera')], anim: 'b:wag', animMove: 'b:run', animAir: 'b:jump' }) },
    { cat: 'Heroes', label: 'Car (drives)', icon: '🚗', make: () => mdl('car', { behaviors: [bh('move', { speed: 7 }), B('camera')], animMove: 'b:drive' }) },
    { cat: 'Enemies', label: 'Zombie (patrols)', icon: '🧟', make: () => mdl('zombie', { behaviors: [B('hazard'), B('patrol')], anim: 'b:zombie', animMove: 'b:zombie' }) },
    { cat: 'Enemies', label: 'Robot (patrols)', icon: '🤖', make: () => mdl('robot', { color: '#ff7675', behaviors: [B('hazard'), B('patrol')], anim: 'b:idle', animMove: 'b:walk' }) },
    { cat: 'Enemies', label: 'Ghost (chases)', icon: '👻', make: () => mdl('ghost', { behaviors: [B('hazard'), bh('follow', { speed: 2 })], anim: 'b:float' }) },
    { cat: 'Enemies', label: 'Dragon', icon: '🐲', make: () => mdl('dragon', { behaviors: [B('hazard'), bh('patrol', { distance: 5 })], anim: 'b:fly', animMove: 'b:fly' }) },
    { cat: 'Enemies', label: 'Bat (chases)', icon: '🦇', y: 2, make: () => mdl('bat', { y: 2, behaviors: [B('hazard'), bh('follow', { speed: 2, range: 6 })], anim: 'b:fly' }) },
    { cat: 'Enemies', label: 'Slime (patrols)', icon: '🟢', make: () => mdl('slime', { behaviors: [B('hazard'), B('patrol')], anim: 'b:squish' }) },
    { cat: 'Enemies', label: 'Spikes', icon: '🔺', make: () => ({ type: 'cone', color: '#d63031', w: 1.2, h: 1.2, d: 1.2, name: 'Spikes', behaviors: [B('hazard')] }) },
    { cat: 'Items', label: 'Coin', icon: '🟡', make: () => mdl('coin', { y: 1.1, behaviors: [B('collect'), B('bob'), bh('spin', { speed: 5 })] }) },
    { cat: 'Items', label: 'Gem', icon: '💎', make: () => mdl('gem', { y: 1.3, behaviors: [bh('collect', { points: 50 }), B('spin'), B('bob')] }) },
    { cat: 'Items', label: 'Star', icon: '⭐', make: () => mdl('star', { y: 1.3, behaviors: [bh('collect', { points: 50 }), B('bob')], anim: 'b:twirl' }) },
    { cat: 'Items', label: 'Heart', icon: '❤️', make: () => mdl('heart', { y: 1.2, behaviors: [B('collect'), B('bob')], anim: 'b:pulse' }) },
    { cat: 'Items', label: 'Key', icon: '🔑', make: () => mdl('key', { y: 1.2, behaviors: [B('collect'), B('bob'), B('spin')] }) },
    { cat: 'Items', label: 'Potion', icon: '🧪', make: () => mdl('potion', { y: 1.2, behaviors: [B('collect'), B('bob')], anim: 'b:wobble' }) },
    { cat: 'Items', label: 'Crown', icon: '👑', make: () => mdl('crown', { y: 1.3, behaviors: [bh('collect', { points: 100 }), B('spin'), B('bob')] }) },
    { cat: 'Items', label: 'Goal flag', icon: '🏁', make: () => mdl('flag', { color: '#00e676', name: 'Goal', behaviors: [B('goal')], anim: 'b:sway' }) },
    { cat: 'Items', label: 'Treasure chest (click)', icon: '🧰', make: () => mdl('chest', { behaviors: [bh('clicker', { points: 50 })], animClick: 'b:open' }) },
    { cat: 'World', label: 'Ground', icon: '🟩', make: () => ({ type: 'box', color: '#55c26b', w: 30, h: 1, d: 30, y: -0.5, pattern: true, name: 'Ground', behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Platform', icon: '🟫', make: () => ({ type: 'box', color: '#e17055', w: 4, h: 0.8, d: 4, name: 'Platform', behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Moving platform', icon: '🟧', make: () => ({ type: 'box', color: '#f7a35c', w: 3.5, h: 0.8, d: 3.5, name: 'Moving platform', behaviors: [B('solid'), bh('patrol', { speed: 3 })] }) },
    { cat: 'World', label: 'Wall', icon: '🧱', make: () => ({ type: 'box', color: '#b2bec3', w: 6, h: 3, d: 1, name: 'Wall', behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Crate', icon: '📦', make: () => mdl('crate', { behaviors: [B('solid'), B('gravity')] }) },
    { cat: 'World', label: 'Barrel', icon: '🛢️', make: () => mdl('barrel', { behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Pine tree', icon: '🌲', make: () => mdl('pine', { name: 'Tree', anim: 'b:sway' }) },
    { cat: 'World', label: 'Round tree', icon: '🌳', make: () => mdl('tree', { anim: 'b:sway' }) },
    { cat: 'World', label: 'House', icon: '🏠', make: () => mdl('house', { behaviors: [B('solid')] }) },
    { cat: 'World', label: 'Door (click)', icon: '🚪', make: () => mdl('door', { behaviors: [bh('clicker', { points: 5 })], animClick: 'b:open' }) },
    { cat: 'World', label: 'Bouncy ball', icon: '⚽', make: () => ({ type: 'sphere', color: '#ffffff', w: 1.4, h: 1.4, d: 1.4, name: 'Ball', behaviors: [B('bounce')] }) },
    { cat: 'World', label: 'Click target', icon: '🎯', make: () => ({ type: 'sphere', color: '#ff7675', w: 1.5, h: 1.5, d: 1.5, name: 'Target', behaviors: [B('clicker'), B('bob')], animClick: 'b:squish' }) },
    { cat: 'Friends', label: 'Cat', icon: '🐱', make: () => mdl('cat', { anim: 'b:idle' }) },
    { cat: 'Friends', label: 'Dog', icon: '🐶', make: () => mdl('dog', { anim: 'b:wag' }) },
    { cat: 'Friends', label: 'Bunny', icon: '🐰', make: () => mdl('bunny', { anim: 'b:hop' }) },
    { cat: 'Friends', label: 'Penguin', icon: '🐧', make: () => mdl('penguin', { anim: 'b:idle', animMove: 'b:walk', behaviors: [bh('patrol', { distance: 3, speed: 2 })] }) },
    { cat: 'Friends', label: 'Duck', icon: '🦆', make: () => mdl('duck', { anim: 'b:idle' }) },
    { cat: 'Friends', label: 'Pig', icon: '🐷', make: () => mdl('pig', { anim: 'b:idle' }) },
    { cat: 'Friends', label: 'Dancer', icon: '💃', make: () => mdl('alien', { name: 'Dancer', anim: 'b:dance' }) },
    { cat: 'Friends', label: 'Animatronic bear', icon: '🐻', make: () => mdl('bearbot', { anim: 'b:look' }) },
  ],
}

PRESETS['2d'] = PRESETS['2d'].map((p) => ({ ...p, make: () => emojiToSprite(p.make()) }))

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
    settings: { lives: 3, win: 'auto', sound: true, night: false, survive: 0, ...(p && p.settings) },
    assets: (p && p.assets) || {},
    models: (p && p.models) || {},
    anims: (p && p.anims) || {},
    rooms: mode === '2d' && p && Array.isArray(p.rooms) ? p.rooms.map((r) => ({ id: r.id, name: r.name || 'Screen', bg: r.bg || null, pan: !!r.pan })) : [],
    objects: ((p && p.objects) || []).map((o) => makeEntity(mode, o)),
  }
  return out
}
