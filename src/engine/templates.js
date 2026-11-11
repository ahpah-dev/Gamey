// Starter games shown in the Studio's welcome screen.
import { behaviorDefaults as B } from './behaviors.js'
import { normalizeProject } from './entities.js'

const coin2 = (x, y) => ({ type: 'emoji', emoji: '🟡', x, y, w: 40, h: 40, name: 'Coin', behaviors: [B('collect'), B('bob')] })
const coin3 = (x, y, z) => ({ type: 'box', color: '#fdcb6e', x, y, z, w: 0.8, h: 0.8, d: 0.8, rx: 35, rz: 35, name: 'Coin', behaviors: [B('collect'), B('bob'), { ...B('spin'), speed: 5 }] })
const plat2 = (x, y, w = 160, color = '#55c26b') => ({ type: 'rect', x, y, w, h: 32, color, radius: 12, name: 'Platform', behaviors: [B('solid')] })
const plat3 = (x, y, z, w = 4, d = 4, color = '#e17055') => ({ type: 'box', x, y, z, w, h: 0.8, d, color, name: 'Platform', behaviors: [B('solid')] })
const ground3 = (w = 30, d = 30, color = '#55c26b') => ({ type: 'box', x: 0, y: -0.5, z: 0, w, h: 1, d, color, pattern: true, name: 'Ground', behaviors: [B('solid')] })

const skyJumper = {
  name: 'Sky Jumper', mode: '2d', background: ['#5b8def', '#cdeeff'],
  objects: [
    { type: 'rect', x: 350, y: 510, w: 700, h: 60, color: '#55c26b', radius: 14, name: 'Ground', behaviors: [B('solid')] },
    { type: 'rect', x: 1180, y: 510, w: 640, h: 60, color: '#55c26b', radius: 14, name: 'Ground', behaviors: [B('solid')] },
    { type: 'rect', x: 1980, y: 510, w: 640, h: 60, color: '#55c26b', radius: 14, name: 'Ground', behaviors: [B('solid')] },
    plat2(420, 380), plat2(650, 300, 140),
    { ...plat2(1580, 470, 120, '#f7a35c'), behaviors: [B('solid'), { ...B('patrol'), distance: 2, speed: 3 }], name: 'Moving platform' },
    { type: 'emoji', emoji: '🌳', x: 140, y: 435, w: 90, h: 90, name: 'Tree' },
    { type: 'emoji', emoji: '☁️', x: 300, y: 90, w: 110, h: 70, name: 'Cloud', behaviors: [{ ...B('patrol'), speed: 1, distance: 8 }] },
    { type: 'emoji', emoji: '☁️', x: 1100, y: 130, w: 110, h: 70, name: 'Cloud', behaviors: [{ ...B('patrol'), speed: 1, distance: 6 }] },
    { type: 'text', text: 'Arrows to run • Space to jump!', x: 330, y: 190, w: 430, h: 40, color: '#ffffff', name: 'Hint' },
    coin2(250, 430), coin2(420, 320), coin2(650, 240), coin2(780, 380),
    coin2(1000, 430), coin2(1100, 430), coin2(1200, 430), coin2(1580, 400),
    coin2(1800, 430), coin2(1900, 380), coin2(2000, 430),
    { type: 'emoji', emoji: '👾', x: 1000, y: 454, w: 52, h: 52, name: 'Monster', behaviors: [B('hazard'), { ...B('patrol'), distance: 3 }] },
    { type: 'emoji', emoji: '👾', x: 1900, y: 454, w: 52, h: 52, name: 'Monster', behaviors: [B('hazard'), { ...B('patrol'), distance: 3 }] },
    { type: 'emoji', emoji: '🔺', x: 1320, y: 462, w: 44, h: 36, name: 'Spikes', behaviors: [B('hazard')] },
    { type: 'emoji', emoji: '🏁', x: 2220, y: 452, w: 56, h: 56, name: 'Goal', behaviors: [B('goal'), B('bob')] },
    { type: 'emoji', emoji: '🐱', x: 100, y: 440, w: 56, h: 56, name: 'Hero', behaviors: [B('platformer'), B('camera')] },
  ],
}

const coinRush = {
  name: 'Coin Rush 3D', mode: '3d', background: ['#7ec8ff', '#e6f6ff'],
  camera: { x: 0, y: 1, z: 6, yaw: 20, pitch: 30, dist: 15, fov: 50 },
  objects: [
    ground3(),
    plat3(-6, 0.4, -2), plat3(-8, 1.6, -7, 3.5, 3.5, '#a29bfe'), plat3(5, 0.4, -6, 4, 4, '#74b9ff'),
    { type: 'box', x: 0, y: 1.5, z: -4, w: 7, h: 3, d: 1, color: '#b2bec3', name: 'Wall', behaviors: [B('solid')] },
    { type: 'cone', x: -10, y: 2, z: 8, w: 2.4, h: 4, d: 2.4, color: '#2ecc71', name: 'Tree' },
    { type: 'cone', x: 11, y: 2, z: 3, w: 2.4, h: 4, d: 2.4, color: '#27ae60', name: 'Tree' },
    coin3(-4, 1.1, 8), coin3(0, 1.1, 8), coin3(4, 1.1, 8), coin3(-6, 2.2, -2), coin3(-8, 3.4, -7),
    coin3(5, 2.2, -6), coin3(10, 1.1, -10), coin3(-11, 1.1, -11), coin3(11, 1.1, 10), coin3(0, 1.1, 0),
    coin3(-12, 1.1, 0), coin3(7, 1.1, -1),
    { type: 'sphere', color: '#ff7675', x: 8, y: 0.75, z: 6, w: 1.5, h: 1.5, d: 1.5, name: 'Monster', behaviors: [B('hazard'), { ...B('patrol'), distance: 4, axis: 'z' }] },
    { type: 'sphere', color: '#dfe6e9', x: -9, y: 0.7, z: -10, w: 1.4, h: 1.4, d: 1.4, name: 'Ghost', behaviors: [B('hazard'), { ...B('follow'), speed: 1, range: 6 }] },
    { type: 'sphere', color: '#a29bfe', x: 0, y: 1, z: 11, w: 1.4, h: 1.4, d: 1.4, name: 'Hero', behaviors: [B('platformer'), B('camera')] },
  ],
}

const bounceParty = {
  name: 'Fruit Pop', mode: '2d', background: ['#ffb199', '#ff0844'],
  settings: { win: 'none' },
  objects: [
    { type: 'text', text: 'Click the fruit!', x: 480, y: 60, w: 420, h: 56, color: '#ffffff', name: 'Title' },
    ...['🍎', '🍌', '🍇', '🍉', '🍓', '🍍', '🥝', '🍒'].map((emoji, i) => ({
      type: 'emoji', emoji, x: 120 + i * 100, y: 140 + (i % 3) * 110, w: 70, h: 70, name: 'Fruit',
      behaviors: [{ ...B('clicker'), points: 5 }, { ...B('bounce'), speed: 3 + (i % 4) }, B('spin')],
    })),
    { type: 'emoji', emoji: '⭐', x: 480, y: 300, w: 60, h: 60, name: 'Golden star', behaviors: [{ ...B('clicker'), points: 25 }, { ...B('bounce'), speed: 7 }, { ...B('spin'), speed: 8 }] },
  ],
}

const spaceDodge = {
  name: 'Space Dodge', mode: '2d', background: ['#0f0c29', '#302b63'],
  objects: [
    ...Array.from({ length: 14 }, (_, i) => ({ type: 'circle', color: '#ffffff', x: 40 + ((i * 197) % 900), y: 30 + ((i * 131) % 490), w: 4 + (i % 3) * 2, h: 4 + (i % 3) * 2, opacity: 0.7, name: 'Twinkle' })),
    { type: 'text', text: 'Grab all the stars!', x: 480, y: 50, w: 400, h: 44, color: '#ffeaa7', name: 'Hint' },
    ...[[120, 120], [840, 110], [480, 150], [200, 420], [760, 430], [480, 460], [100, 280], [860, 280]].map(([x, y]) => ({
      type: 'emoji', emoji: '⭐', x, y, w: 44, h: 44, name: 'Star', behaviors: [B('collect'), B('spin')],
    })),
    { type: 'emoji', emoji: '☄️', x: 300, y: 200, w: 64, h: 64, name: 'Comet', behaviors: [B('hazard'), { ...B('bounce'), speed: 4 }] },
    { type: 'emoji', emoji: '☄️', x: 650, y: 330, w: 64, h: 64, name: 'Comet', behaviors: [B('hazard'), { ...B('bounce'), speed: 5 }] },
    { type: 'emoji', emoji: '🛸', x: 800, y: 480, w: 60, h: 60, name: 'UFO', behaviors: [B('hazard'), { ...B('follow'), speed: 1, range: 10 }] },
    { type: 'emoji', emoji: '🚀', x: 480, y: 290, w: 56, h: 56, name: 'Rocket', behaviors: [{ ...B('move'), speed: 6 }] },
  ],
}

const towerClimb = {
  name: 'Tower Climb 3D', mode: '3d', background: ['#fd79a8', '#ffeaa7'],
  camera: { x: 0, y: 1, z: 0, yaw: 35, pitch: 28, dist: 15, fov: 50 },
  objects: [
    { ...ground3(10, 10, '#74b9ff'), name: 'Start' },
    plat3(4.5, 0.4, -4, 3.5, 3.5), plat3(0, 1.4, -9, 3.5, 3.5, '#a29bfe'),
    { ...plat3(-6, 2.4, -9, 3.5, 3.5, '#f7a35c'), name: 'Moving platform', behaviors: [B('solid'), { ...B('patrol'), distance: 2, speed: 3, axis: 'x' }] },
    plat3(-11, 3.4, -5, 3.5, 3.5, '#55c26b'), plat3(-9, 4.6, 1, 3.5, 3.5, '#e17055'),
    { ...plat3(-3, 5.6, 3, 3.5, 3.5, '#f7a35c'), name: 'Moving platform', behaviors: [B('solid'), { ...B('patrol'), distance: 2, speed: 3, axis: 'z' }] },
    plat3(4, 6.6, 3, 5, 5, '#fdcb6e'),
    { type: 'cone', color: '#d63031', x: 4.5, y: 1.2, z: -4, w: 1.2, h: 1.2, d: 1.2, name: 'Spikes', behaviors: [B('hazard')] },
    { type: 'sphere', color: '#ff7675', x: -9, y: 5.6, z: 1, w: 1.3, h: 1.3, d: 1.3, name: 'Monster', behaviors: [B('hazard'), { ...B('patrol'), distance: 1, speed: 2 }] },
    coin3(4.5, 2, -4), coin3(0, 3, -9), coin3(-11, 5, -5), coin3(-9, 6.2, 1), coin3(4, 8.2, 3),
    { type: 'cylinder', color: '#00e676', x: 5.5, y: 8.5, z: 4, w: 1.6, h: 3, d: 1.6, name: 'Goal', behaviors: [B('goal'), B('spin')] },
    { type: 'sphere', color: '#55efc4', x: 0, y: 1, z: 0, w: 1.4, h: 1.4, d: 1.4, name: 'Hero', behaviors: [B('platformer'), B('camera')] },
  ],
}

export const TEMPLATES = [
  { id: 'sky-jumper', icon: '🐱', title: 'Sky Jumper', tag: '2D · Platformer', desc: 'Run, jump and grab coins!', color: ['#5b8def', '#9fd8ff'], project: normalizeProject(skyJumper) },
  { id: 'coin-rush', icon: '🟣', title: 'Coin Rush', tag: '3D · Collect', desc: 'Explore a 3D world for gems.', color: ['#7ec8ff', '#74b9ff'], project: normalizeProject(coinRush) },
  { id: 'tower-climb', icon: '🗼', title: 'Tower Climb', tag: '3D · Parkour', desc: 'Hop up to the green goal.', color: ['#fd79a8', '#fdcb6e'], project: normalizeProject(towerClimb) },
  { id: 'space-dodge', icon: '🚀', title: 'Space Dodge', tag: '2D · Arcade', desc: 'Dodge comets, grab stars.', color: ['#302b63', '#6c5ce7'], project: normalizeProject(spaceDodge) },
  { id: 'fruit-pop', icon: '🍎', title: 'Fruit Pop', tag: '2D · Clicker', desc: 'Click the bouncing fruit!', color: ['#ff9a8b', '#ff0844'], project: normalizeProject(bounceParty) },
  { id: 'blank-2d', icon: '🟦', title: 'Blank 2D', tag: '2D · Empty', desc: 'Start from scratch.', color: ['#636e72', '#b2bec3'], project: normalizeProject({ name: 'My 2D Game', mode: '2d', objects: [] }) },
  { id: 'blank-3d', icon: '🧊', title: 'Blank 3D', tag: '3D · Empty', desc: 'Start from scratch.', color: ['#636e72', '#b2bec3'], project: normalizeProject({ name: 'My 3D Game', mode: '3d', objects: [ground3()] }) },
]
