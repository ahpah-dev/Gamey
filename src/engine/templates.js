// Starter games shown in the Studio's welcome screen.
import { behaviorDefaults as B } from './behaviors.js'
import { normalizeProject } from './entities.js'
import { emojiToSprite } from './sprites.js'
import { MODELS } from './models3d.js'

const norm = (p) => normalizeProject({ ...p, objects: p.objects.map(emojiToSprite) })
const bh = (type, over) => ({ ...B(type), ...over })

/* ----- 2D helpers ----- */
const coin2 = (x, y) => ({ type: 'sprite', sprite: 'b:coin', x, y, w: 40, h: 40, name: 'Coin', behaviors: [B('collect'), B('bob')] })
const plat2 = (x, y, w = 160, color = '#55c26b') => ({ type: 'rect', x, y, w, h: 32, color, radius: 12, name: 'Platform', behaviors: [B('solid')] })
const spr = (name, x, y, w, h, extra = {}) => ({ type: 'sprite', sprite: 'b:' + name, x, y, w, h, name: name[0].toUpperCase() + name.slice(1), ...extra })
const box2 = (x, y, w, h, color, extra = {}) => ({ type: 'rect', x, y, w, h, color, radius: 6, name: 'Shape', ...extra })
const wall = (x, y, w, h, color = '#6b5fa8') => box2(x, y, w, h, color, { name: 'Wall', radius: 4, behaviors: [B('solid')] })
const label = (text, x, y, h, color, extra = {}) => ({ type: 'text', text, x, y, h, w: Math.round(text.length * h * 0.62), color, name: 'Label', ...extra })

/* ----- 3D helpers (models at their natural size) ----- */
const mdl = (id, x, y, z, extra = {}) => {
  const m = MODELS[id]
  return { type: 'box', model: 'b:' + id, color: m.color, x, y, z, w: m.size[0], h: m.size[1], d: m.size[2], name: m.name, ...extra }
}
const coin3 = (x, y, z) => mdl('coin', x, y, z, { name: 'Coin', behaviors: [B('collect'), B('bob'), bh('spin', { speed: 5 })] })
const hero3 = (x, y, z, color) => mdl('character', x, y, z, { color, name: 'Hero', behaviors: [B('platformer'), B('camera')], anim: 'b:idle', animMove: 'b:walk', animAir: 'b:jump' })
const pine3 = (x, z) => mdl('pine', x, 1.9, z, { name: 'Tree', anim: 'b:sway' })
const plat3 = (x, y, z, w = 4, d = 4, color = '#e17055') => ({ type: 'box', x, y, z, w, h: 0.8, d, color, name: 'Platform', behaviors: [B('solid')] })
const ground3 = (w = 30, d = 30, color = '#55c26b') => ({ type: 'box', x: 0, y: -0.5, z: 0, w, h: 1, d, color, pattern: true, name: 'Ground', behaviors: [B('solid')] })

/* =============================================================== Sky Jumper */
const skyJumper = {
  name: 'Sky Jumper', mode: '2d', background: ['#5b8def', '#cdeeff'],
  objects: [
    { type: 'rect', x: 350, y: 510, w: 700, h: 60, color: '#55c26b', radius: 14, name: 'Ground', behaviors: [B('solid')] },
    { type: 'rect', x: 1180, y: 510, w: 640, h: 60, color: '#55c26b', radius: 14, name: 'Ground', behaviors: [B('solid')] },
    { type: 'rect', x: 1980, y: 510, w: 640, h: 60, color: '#55c26b', radius: 14, name: 'Ground', behaviors: [B('solid')] },
    plat2(420, 380), plat2(650, 300, 140),
    { ...plat2(1580, 470, 120, '#f7a35c'), behaviors: [B('solid'), bh('patrol', { distance: 2, speed: 3 })], name: 'Moving platform' },
    { type: 'emoji', emoji: '🌳', x: 140, y: 435, w: 90, h: 90, name: 'Tree', anim: 'b:wobble' },
    { type: 'emoji', emoji: '☁️', x: 300, y: 90, w: 110, h: 70, name: 'Cloud', behaviors: [bh('patrol', { speed: 1, distance: 8 })] },
    { type: 'emoji', emoji: '☁️', x: 1100, y: 130, w: 110, h: 70, name: 'Cloud', behaviors: [bh('patrol', { speed: 1, distance: 6 })] },
    { type: 'text', text: 'Arrows to run • Space to jump!', x: 330, y: 190, w: 430, h: 40, color: '#ffffff', name: 'Hint' },
    coin2(250, 430), coin2(420, 320), coin2(650, 240), coin2(780, 380),
    coin2(1000, 430), coin2(1100, 430), coin2(1200, 430), coin2(1580, 400),
    coin2(1800, 430), coin2(1900, 380), coin2(2000, 430),
    { type: 'emoji', emoji: '👾', x: 1000, y: 454, w: 52, h: 52, name: 'Monster', behaviors: [B('hazard'), bh('patrol', { distance: 3 })], anim: 'b:jelly' },
    { type: 'emoji', emoji: '👾', x: 1900, y: 454, w: 52, h: 52, name: 'Monster', behaviors: [B('hazard'), bh('patrol', { distance: 3 })], anim: 'b:jelly' },
    { type: 'emoji', emoji: '🔺', x: 1320, y: 462, w: 44, h: 36, name: 'Spikes', behaviors: [B('hazard')] },
    { type: 'emoji', emoji: '🏁', x: 2220, y: 452, w: 56, h: 56, name: 'Goal', behaviors: [B('goal'), B('bob')] },
    { type: 'emoji', emoji: '🐱', x: 100, y: 440, w: 56, h: 56, name: 'Hero', behaviors: [B('platformer'), B('camera')], anim: 'b:idle', animMove: 'b:waddle', animAir: 'b:hop' },
  ],
}

/* =============================================================== Night Shift */
// A security-office game in the style of "Five Nights at Freddy's": look around with the mouse,
// close the doors, flip through the cameras and watch your power!
const OFFICE = 'office'
const camRooms = [['cam1', 'CAM 1 · SHOW STAGE'], ['cam2', 'CAM 2 · WEST HALL'], ['cam3', 'CAM 3 · KITCHEN'], ['cam4', 'CAM 4 · SUPPLY']]
const camUI = (room, title) => {
  const out = []
  camRooms.forEach(([id], i) => {
    const x = 650 + i * 66, on = id === room
    out.push(box2(x, 500, 56, 38, on ? '#00b894' : '#2d3436', { room, hud: true, radius: 8, name: 'Camera button ' + (i + 1), behaviors: [bh('goto', { room: id })] }))
    out.push(label(String(i + 1), x, 500, 24, '#ffffff', { room, hud: true, name: 'Camera number' }))
  })
  out.push(box2(130, 500, 170, 38, '#d63031', { room, hud: true, radius: 8, name: 'Close monitor button', behaviors: [bh('goto', { room: OFFICE })] }))
  out.push(label('CLOSE', 130, 500, 22, '#ffffff', { room, hud: true, name: 'Close label' }))
  out.push(label(title, 480, 38, 28, '#55efc4', { room, hud: true, name: 'Camera name' }))
  out.push({ type: 'circle', room, x: 880, y: 38, w: 18, h: 18, color: '#ff4757', hud: true, name: 'REC light', anim: 'b:flicker' })
  return out
}
const guard = (id, x, y, room, level, block, route) => spr(id, x, y, 130, 130, { room, name: { bear: 'Freddy', bunny: 'Bonnie', chicken: 'Chica' }[id], behaviors: [bh('stalker', { level, block, route })], anim: 'b:creep' })

const nightShift = {
  name: 'Night Shift', mode: '2d', background: ['#1b1b2f', '#2a2a40'],
  settings: { lives: 1, night: true, survive: 120, win: 'none' },
  rooms: [
    { id: OFFICE, name: 'Office', bg: ['#232338', '#2f3052'], pan: true },
    { id: 'cam1', name: 'Show Stage', bg: ['#150f20', '#241a36'] },
    { id: 'cam2', name: 'West Hall', bg: ['#0d1217', '#1b252e'] },
    { id: 'cam3', name: 'Kitchen', bg: ['#101a19', '#1f3330'] },
    { id: 'cam4', name: 'Supply', bg: ['#14131a', '#26232f'] },
  ],
  objects: [
    // --- cam 1: the show stage ---
    box2(480, 250, 760, 280, '#35264f', { room: 'cam1', name: 'Stage backdrop' }),
    box2(480, 395, 760, 120, '#5b3f2e', { room: 'cam1', name: 'Stage floor' }),
    box2(130, 250, 70, 300, '#a8261f', { room: 'cam1', name: 'Curtain' }), box2(830, 250, 70, 300, '#a8261f', { room: 'cam1', name: 'Curtain' }),
    label('★ HAVE FUN ★', 480, 120, 34, '#fdcb6e', { room: 'cam1', name: 'Banner' }),
    // --- cam 2: the west hall ---
    box2(480, 170, 960, 340, '#1a232b', { room: 'cam2', name: 'Hall wall' }), box2(480, 430, 960, 220, '#26323d', { room: 'cam2', name: 'Hall floor' }),
    box2(150, 160, 120, 150, '#10171d', { room: 'cam2', name: 'Window' }), box2(810, 160, 120, 150, '#10171d', { room: 'cam2', name: 'Window' }),
    spr('bulb', 480, 90, 56, 56, { room: 'cam2', name: 'Hall light', anim: 'b:flicker' }),
    // --- cam 3: the kitchen ---
    box2(480, 170, 960, 340, '#1d2d2b', { room: 'cam3', name: 'Kitchen wall' }), box2(480, 430, 960, 220, '#243b38', { room: 'cam3', name: 'Kitchen floor' }),
    box2(190, 350, 280, 100, '#4a6a68', { room: 'cam3', name: 'Counter' }), box2(770, 350, 280, 100, '#4a6a68', { room: 'cam3', name: 'Counter' }),
    { type: 'circle', room: 'cam3', x: 170, y: 290, w: 60, h: 60, color: '#b2bec3', name: 'Pot' }, { type: 'circle', room: 'cam3', x: 790, y: 290, w: 60, h: 60, color: '#b2bec3', name: 'Pot' },
    // --- cam 4: the supply closet ---
    box2(480, 170, 960, 340, '#211f2b', { room: 'cam4', name: 'Closet wall' }), box2(480, 430, 960, 220, '#2d2a3a', { room: 'cam4', name: 'Closet floor' }),
    spr('crate', 200, 380, 110, 110, { room: 'cam4' }), spr('crate', 330, 400, 90, 90, { room: 'cam4' }), spr('crate', 720, 380, 120, 120, { room: 'cam4' }),
    box2(480, 200, 300, 14, '#6b4a2b', { room: 'cam4', name: 'Shelf' }),
    // --- the office (you are here) ---
    box2(480, 230, 960, 420, '#2f3052', { room: OFFICE, name: 'Back wall' }), box2(480, 475, 960, 130, '#1d1e33', { room: OFFICE, name: 'Floor' }),
    box2(120, 270, 170, 360, '#09090f', { room: OFFICE, name: 'Left doorway' }), box2(840, 270, 170, 360, '#09090f', { room: OFFICE, name: 'Right doorway' }),
    box2(480, 125, 170, 110, '#e9e3c9', { room: OFFICE, name: 'Poster' }), spr('bear', 480, 125, 80, 80, { room: OFFICE, name: 'Poster bear' }),
    // the animatronics (they sneak from screen to screen)
    guard('bear', 480, 270, 'cam1', 4, 1, [{ room: 'cam2', x: 620, y: 340 }, { room: 'cam2', x: 250, y: 360 }, { room: OFFICE, x: 120, y: 280 }]),
    guard('chicken', 600, 285, 'cam1', 3, 1, [{ room: 'cam3', x: 480, y: 330 }, { room: 'cam2', x: 330, y: 345 }, { room: OFFICE, x: 120, y: 280 }]),
    guard('bunny', 360, 285, 'cam1', 3, 3, [{ room: 'cam4', x: 520, y: 350 }, { room: 'cam2', x: 700, y: 345 }, { room: OFFICE, x: 840, y: 280 }]),
    // darkness in the doorways unless the light is on, and the doors themselves
    box2(120, 270, 170, 360, '#000000', { room: OFFICE, opacity: 0.88, name: 'Dark (left)', when: { sw: 2, on: false } }),
    box2(840, 270, 170, 360, '#000000', { room: OFFICE, opacity: 0.88, name: 'Dark (right)', when: { sw: 4, on: false } }),
    box2(120, 270, 170, 360, '#7f8c8d', { room: OFFICE, name: 'Left door (closed)', when: { sw: 1, on: true } }),
    box2(840, 270, 170, 360, '#7f8c8d', { room: OFFICE, name: 'Right door (closed)', when: { sw: 3, on: true } }),
    label('LOCKED', 120, 270, 24, '#2d3436', { room: OFFICE, name: 'Locked', when: { sw: 1, on: true } }),
    label('LOCKED', 840, 270, 24, '#2d3436', { room: OFFICE, name: 'Locked', when: { sw: 3, on: true } }),
    // control panels
    box2(235, 245, 76, 150, '#14152a', { room: OFFICE, name: 'Left panel' }), box2(725, 245, 76, 150, '#14152a', { room: OFFICE, name: 'Right panel' }),
    { type: 'circle', room: OFFICE, x: 235, y: 205, w: 52, h: 52, color: '#d63031', name: 'Left door button', when: { sw: 1, on: false }, behaviors: [bh('toggle', { switch: 1, drain: 5 })] },
    { type: 'circle', room: OFFICE, x: 235, y: 205, w: 52, h: 52, color: '#00b894', name: 'Left door button (on)', when: { sw: 1, on: true }, behaviors: [bh('toggle', { switch: 1, drain: 5 })] },
    { type: 'circle', room: OFFICE, x: 235, y: 285, w: 78, h: 78, color: '#fff3b0', opacity: 0.35, name: 'Left light glow', when: { sw: 2, on: true } },
    spr('bulb', 235, 285, 50, 50, { room: OFFICE, name: 'Left light button', behaviors: [bh('toggle', { switch: 2, drain: 3 })] }),
    { type: 'circle', room: OFFICE, x: 725, y: 205, w: 52, h: 52, color: '#d63031', name: 'Right door button', when: { sw: 3, on: false }, behaviors: [bh('toggle', { switch: 3, drain: 5 })] },
    { type: 'circle', room: OFFICE, x: 725, y: 205, w: 52, h: 52, color: '#00b894', name: 'Right door button (on)', when: { sw: 3, on: true }, behaviors: [bh('toggle', { switch: 3, drain: 5 })] },
    { type: 'circle', room: OFFICE, x: 725, y: 285, w: 78, h: 78, color: '#fff3b0', opacity: 0.35, name: 'Right light glow', when: { sw: 4, on: true } },
    spr('bulb', 725, 285, 50, 50, { room: OFFICE, name: 'Right light button', behaviors: [bh('toggle', { switch: 4, drain: 3 })] }),
    box2(480, 520, 560, 90, '#3a3b5c', { room: OFFICE, name: 'Desk' }),
    // screen buttons
    spr('monitor', 480, 492, 130, 80, { room: OFFICE, hud: true, name: 'Open cameras', behaviors: [bh('goto', { room: 'cam1' })] }),
    label('Look around with the mouse · Click the buttons!', 480, 24, 18, '#dfe6e9', { room: OFFICE, hud: true, name: 'Hint' }),
    ...camRooms.flatMap(([id, title]) => camUI(id, title)),
  ],
}

/* ============================================================ Space Blaster */
const stars = Array.from({ length: 22 }, (_, i) => ({ type: 'circle', color: '#ffffff', x: 30 + ((i * 197) % 900), y: 20 + ((i * 131) % 500), w: 3 + (i % 3) * 2, h: 3 + (i % 3) * 2, opacity: 0.6, name: 'Twinkle', anim: 'b:flicker' }))
const spaceBlaster = {
  name: 'Space Blaster', mode: '2d', background: ['#0b0820', '#2b2468'],
  settings: { lives: 3, survive: 60, win: 'none' },
  objects: [
    ...stars,
    ...[wall(480, -12, 1000, 24, '#ffffff'), wall(480, 552, 1000, 24, '#ffffff'), wall(-12, 270, 24, 600, '#ffffff'), wall(972, 270, 24, 600, '#ffffff')].map((w) => ({ ...w, opacity: 0.12, name: 'Edge' })),
    label('Arrows move • X, Space or click to shoot!', 480, 500, 22, '#ffeaa7', { name: 'Hint' }),
    spr('alien', 200, -40, 52, 52, { name: 'Alien spawner', behaviors: [bh('spawner', { rate: 4, spread: 7, max: 8 }), B('hazard'), B('health'), bh('drift', { speed: 3 })], anim: 'b:wobble' }),
    spr('alien', 760, -40, 52, 52, { name: 'Alien spawner', behaviors: [bh('spawner', { rate: 4, spread: 7, max: 8 }), B('hazard'), B('health'), bh('drift', { speed: 3 })], anim: 'b:wobble' }),
    spr('asteroid', 480, -60, 64, 64, { name: 'Asteroid spawner', behaviors: [bh('spawner', { rate: 3, spread: 10, max: 6 }), B('hazard'), bh('health', { hits: 2, points: 20 }), bh('drift', { speed: 2 }), bh('spin', { speed: 2 })] }),
    spr('star', 330, -40, 40, 40, { name: 'Star spawner', behaviors: [bh('spawner', { rate: 2, spread: 10, max: 4 }), bh('collect', { points: 25 }), bh('drift', { speed: 3 }), B('spin')] }),
    spr('ship', 480, 450, 56, 56, { name: 'Spaceship', behaviors: [bh('move', { speed: 6 }), bh('shoot', { rate: 6, speed: 8, aim: 'up' })], anim: 'b:float' }),
  ],
}

/* ============================================================= Dungeon Dash */
const dungeon = {
  name: 'Dungeon Dash', mode: '2d', background: ['#2d2250', '#1c1738'],
  settings: { lives: 3 },
  objects: [
    box2(480, 270, 960, 540, '#3d3566', { name: 'Floor', radius: 0 }),
    wall(480, 15, 960, 30), wall(480, 525, 960, 30), wall(15, 270, 30, 540), wall(945, 270, 30, 540),
    wall(300, 180, 22, 300), wall(520, 360, 22, 300), wall(700, 127, 22, 195), wall(700, 413, 22, 195),
    spr('gate', 700, 270, 54, 90, { name: 'Locked gate', behaviors: [bh('gate', { need: 4 })] }),
    spr('torch', 300, 345, 40, 50, { name: 'Torch', anim: 'b:flicker' }), spr('torch', 520, 195, 40, 50, { name: 'Torch', anim: 'b:flicker' }), spr('torch', 700, 330, 40, 50, { name: 'Torch', anim: 'b:flicker' }),
    label('Collect 4 things to open the gate!', 480, 62, 24, '#ffeaa7', { name: 'Hint' }),
    spr('key', 150, 100, 42, 42, { name: 'Key', behaviors: [B('collect'), B('bob')] }), spr('key', 400, 450, 42, 42, { name: 'Key', behaviors: [B('collect'), B('bob')] }),
    spr('coin', 410, 110, 36, 36, { name: 'Coin', behaviors: [B('collect'), B('bob')] }), spr('gem', 610, 460, 38, 38, { name: 'Gem', behaviors: [bh('collect', { points: 30 })], anim: 'b:pulse' }),
    spr('coin', 610, 110, 36, 36, { name: 'Coin', behaviors: [B('collect'), B('bob')] }),
    spr('skull', 400, 290, 46, 46, { name: 'Skull', behaviors: [B('hazard'), bh('follow', { speed: 1, range: 4 })], anim: 'b:shake' }),
    spr('bat', 610, 300, 54, 42, { name: 'Bat', behaviors: [B('hazard'), bh('bounce', { speed: 3 })], anim: 'b:float' }),
    spr('spikes', 150, 300, 46, 34, { name: 'Spikes', behaviors: [B('hazard')] }),
    spr('chest', 840, 270, 60, 60, { name: 'Treasure!', behaviors: [B('goal'), B('bob')] }),
    spr('hero', 90, 270, 52, 52, { name: 'Hero', behaviors: [B('move')], anim: 'b:idle', animMove: 'b:waddle' }),
  ],
}

/* ============================================================== Neon Racer */
const racer = {
  name: 'Neon Racer', mode: '2d', background: ['#1b1f3b', '#3a2a6b'],
  settings: { lives: 3 },
  objects: [
    wall(480, 8, 960, 16, '#00cec9'), wall(480, 532, 960, 16, '#00cec9'), wall(8, 270, 16, 540, '#00cec9'), wall(952, 270, 16, 540, '#00cec9'),
    box2(480, 270, 560, 220, '#1f8f6f', { name: 'Grass island', radius: 40, behaviors: [B('solid')] }),
    label('↑ go · ← → steer · ↓ brake', 480, 270, 28, '#ffffff', { name: 'Hint' }),
    ...[[110, 300], [110, 150], [300, 80], [480, 80], [660, 80], [850, 150], [850, 300], [850, 430], [660, 460], [480, 460], [300, 460]].map(([x, y]) => spr('star', x, y, 36, 36, { name: 'Star', behaviors: [B('collect'), B('spin')] })),
    spr('bomb', 480, 85, 40, 40, { name: 'Oil drum', behaviors: [B('hazard')] }), spr('bomb', 850, 360, 40, 40, { name: 'Oil drum', behaviors: [B('hazard')] }), spr('bomb', 300, 470, 40, 40, { name: 'Oil drum', behaviors: [B('hazard')] }),
    spr('car', 110, 440, 34, 56, { name: 'Race car', behaviors: [bh('drive', { speed: 6 })] }),
  ],
}

/* ============================================================ Pet Parade 3D */
const petList = [
  ['cat', 'b:wag', 'b:twirl'], ['dog', 'b:wag', 'b:hop'], ['bunny', 'b:hop', 'b:flip'], ['penguin', 'b:idle', 'b:twirl'],
  ['knight', 'b:wave', 'b:cheer'], ['wizard', 'b:wave', 'b:dance'], ['dragon', 'b:fly', 'b:twirl'], ['ninja', 'b:look', 'b:flip'],
  ['robot', 'b:dance', 'b:cheer'], ['pig', 'b:idle', 'b:hop'], ['duck', 'b:idle', 'b:twirl'], ['alien', 'b:dance', 'b:cheer'],
]
const parade = {
  name: 'Pet Parade 3D', mode: '3d', background: ['#a8e6ff', '#fff3d6'],
  settings: { win: 'none', lives: 0 },
  camera: { x: 0, y: 1, z: 0, yaw: 20, pitch: 30, dist: 16, fov: 50 },
  objects: [
    ground3(34, 34, '#7bd88f'),
    ...petList.map(([id, idle, click], i) => {
      const a = (i / petList.length) * Math.PI * 2, x = Math.sin(a) * 7, z = Math.cos(a) * 7
      const m = MODELS[id]
      return mdl(id, Math.round(x * 10) / 10, m.size[1] / 2, Math.round(z * 10) / 10, {
        ry: Math.round((Math.atan2(-x, -z) * 180) / Math.PI), anim: idle, animClick: click, behaviors: [bh('clicker', { points: 10 })],
      })
    }),
    pine3(-13, -12), pine3(13, -11), pine3(-13, 12), mdl('tree', 13, 1.7, 12, { anim: 'b:sway', name: 'Tree' }),
    mdl('house', 0, 1.4, -14, { name: 'House', behaviors: [B('solid')] }),
    mdl('present', -3, 0.6, 3, { name: 'Present', behaviors: [bh('collect', { points: 25 }), B('bob')] }), mdl('present', 3, 0.6, 3, { name: 'Present', behaviors: [bh('collect', { points: 25 }), B('bob')] }),
    mdl('star', 0, 1.4, -4, { name: 'Star', behaviors: [bh('collect', { points: 50 }), B('bob')], anim: 'b:twirl' }),
    hero3(0, 0.95, 3, '#fd79a8'),
  ],
}

/* ============================================================== Coin Rush 3D */
const coinRush = {
  name: 'Coin Rush 3D', mode: '3d', background: ['#7ec8ff', '#e6f6ff'],
  camera: { x: 0, y: 1, z: 6, yaw: 20, pitch: 30, dist: 15, fov: 50 },
  objects: [
    ground3(),
    plat3(-6, 0.4, -2), plat3(-8, 1.6, -7, 3.5, 3.5, '#a29bfe'), plat3(5, 0.4, -6, 4, 4, '#74b9ff'),
    { type: 'box', x: 0, y: 1.5, z: -4, w: 7, h: 3, d: 1, color: '#b2bec3', name: 'Wall', behaviors: [B('solid')] },
    pine3(-10, 8), pine3(11, 3), mdl('palm', 11, 1.9, -12, { name: 'Palm', anim: 'b:sway' }),
    mdl('rock', -12, 0.65, -4, { name: 'Rock' }),
    coin3(-4, 1.1, 8), coin3(0, 1.1, 8), coin3(4, 1.1, 8), coin3(-6, 2.2, -2), coin3(-8, 3.4, -7),
    coin3(5, 2.2, -6), coin3(10, 1.1, -10), coin3(-11, 1.1, -11), coin3(11, 1.1, 10), coin3(0, 1.1, 0),
    coin3(-12, 1.1, 0), coin3(7, 1.1, -1),
    mdl('zombie', 8, 0.92, 6, { name: 'Zombie', behaviors: [B('hazard'), bh('patrol', { distance: 4, axis: 'z' })], anim: 'b:zombie', animMove: 'b:zombie' }),
    mdl('ghost', -9, 0.8, -10, { name: 'Ghost', behaviors: [B('hazard'), bh('follow', { speed: 1, range: 6 })], anim: 'b:float' }),
    hero3(0, 1, 11, '#a29bfe'),
  ],
}

/* ============================================================ Tower Climb 3D */
const towerClimb = {
  name: 'Tower Climb 3D', mode: '3d', background: ['#fd79a8', '#ffeaa7'],
  camera: { x: 0, y: 1, z: 0, yaw: 35, pitch: 28, dist: 15, fov: 50 },
  objects: [
    { ...ground3(10, 10, '#74b9ff'), name: 'Start' },
    plat3(4.5, 0.4, -4, 3.5, 3.5), plat3(0, 1.4, -9, 3.5, 3.5, '#a29bfe'),
    { ...plat3(-6, 2.4, -9, 3.5, 3.5, '#f7a35c'), name: 'Moving platform', behaviors: [B('solid'), bh('patrol', { distance: 2, speed: 3, axis: 'x' })] },
    plat3(-11, 3.4, -5, 3.5, 3.5, '#55c26b'), plat3(-9, 4.6, 1, 3.5, 3.5, '#e17055'),
    { ...plat3(-3, 5.6, 3, 3.5, 3.5, '#f7a35c'), name: 'Moving platform', behaviors: [B('solid'), bh('patrol', { distance: 2, speed: 3, axis: 'z' })] },
    plat3(4, 6.6, 3, 5, 5, '#fdcb6e'),
    { type: 'cone', color: '#d63031', x: 4.5, y: 1.2, z: -4, w: 1.2, h: 1.2, d: 1.2, name: 'Spikes', behaviors: [B('hazard')] },
    mdl('robot', -9, 5.9, 1, { color: '#ff7675', name: 'Robot', behaviors: [B('hazard'), bh('patrol', { distance: 1, speed: 2 })], anim: 'b:idle', animMove: 'b:walk' }),
    mdl('bat', 0, 4, -9, { name: 'Bat', behaviors: [B('hazard'), bh('patrol', { distance: 3, speed: 2, axis: 'z' })], anim: 'b:fly' }),
    coin3(4.5, 2, -4), coin3(0, 3, -9), coin3(-11, 5, -5), coin3(-9, 6.2, 1), coin3(4, 8.2, 3),
    mdl('flag', 5.5, 8.5, 4, { color: '#00e676', name: 'Goal', behaviors: [B('goal')], anim: 'b:sway' }),
    hero3(0, 1, 0, '#55efc4'),
  ],
}

/* ================================================================ Space Dodge */
const spaceDodge = {
  name: 'Space Dodge', mode: '2d', background: ['#0f0c29', '#302b63'],
  objects: [
    ...Array.from({ length: 14 }, (_, i) => ({ type: 'circle', color: '#ffffff', x: 40 + ((i * 197) % 900), y: 30 + ((i * 131) % 490), w: 4 + (i % 3) * 2, h: 4 + (i % 3) * 2, opacity: 0.7, name: 'Twinkle' })),
    { type: 'text', text: 'Grab all the stars!', x: 480, y: 50, w: 400, h: 44, color: '#ffeaa7', name: 'Hint' },
    ...[[120, 120], [840, 110], [480, 150], [200, 420], [760, 430], [480, 460], [100, 280], [860, 280]].map(([x, y]) => ({
      type: 'emoji', emoji: '⭐', x, y, w: 44, h: 44, name: 'Star', behaviors: [B('collect'), B('spin')],
    })),
    { type: 'emoji', emoji: '☄️', x: 300, y: 200, w: 64, h: 64, name: 'Comet', behaviors: [B('hazard'), bh('bounce', { speed: 4 })] },
    { type: 'emoji', emoji: '☄️', x: 650, y: 330, w: 64, h: 64, name: 'Comet', behaviors: [B('hazard'), bh('bounce', { speed: 5 })] },
    { type: 'emoji', emoji: '🛸', x: 800, y: 480, w: 60, h: 60, name: 'UFO', behaviors: [B('hazard'), bh('follow', { speed: 1, range: 10 })], anim: 'b:float' },
    { type: 'emoji', emoji: '🚀', x: 480, y: 290, w: 56, h: 56, name: 'Rocket', behaviors: [bh('move', { speed: 6 })] },
  ],
}

/* ================================================================== Fruit Pop */
const bounceParty = {
  name: 'Fruit Pop', mode: '2d', background: ['#ffb199', '#ff0844'],
  settings: { win: 'none' },
  objects: [
    { type: 'text', text: 'Click the fruit!', x: 480, y: 60, w: 420, h: 56, color: '#ffffff', name: 'Title' },
    ...['🍎', '🍌', '🍇', '🍉', '🍓', '🍍', '🥝', '🍒'].map((emoji, i) => ({
      type: 'emoji', emoji, x: 120 + i * 100, y: 140 + (i % 3) * 110, w: 70, h: 70, name: 'Fruit',
      behaviors: [bh('clicker', { points: 5 }), bh('bounce', { speed: 3 + (i % 4) }), B('spin')], animClick: 'b:squish',
    })),
    { type: 'emoji', emoji: '⭐', x: 480, y: 300, w: 60, h: 60, name: 'Golden star', behaviors: [bh('clicker', { points: 25 }), bh('bounce', { speed: 7 }), bh('spin', { speed: 8 })], animClick: 'b:tada' },
  ],
}

export const TEMPLATES = [
  { id: 'sky-jumper', icon: '🐱', title: 'Sky Jumper', tag: '2D · Platformer', desc: 'Run, jump and grab coins!', color: ['#5b8def', '#9fd8ff'], project: norm(skyJumper) },
  { id: 'night-shift', icon: '🐻', title: 'Night Shift', tag: '2D · Survival horror', desc: 'Watch the cameras, close the doors, survive till 6 AM.', color: ['#1b1b2f', '#6c3fc1'], project: norm(nightShift) },
  { id: 'space-blaster', icon: '🚀', title: 'Space Blaster', tag: '2D · Shooter', desc: 'Blast aliens and asteroids for 60 seconds.', color: ['#0b0820', '#6c5ce7'], project: norm(spaceBlaster) },
  { id: 'dungeon-dash', icon: '🗝️', title: 'Dungeon Dash', tag: '2D · Top-down adventure', desc: 'Collect keys, open the gate, find the treasure.', color: ['#2d2250', '#a29bfe'], project: norm(dungeon) },
  { id: 'neon-racer', icon: '🏎️', title: 'Neon Racer', tag: '2D · Racing', desc: 'Steer your car and grab every star.', color: ['#1b1f3b', '#00cec9'], project: norm(racer) },
  { id: 'pet-parade', icon: '🐧', title: 'Pet Parade', tag: '3D · Animations', desc: 'Click the animated friends to make them dance!', color: ['#a8e6ff', '#55efc4'], project: norm(parade) },
  { id: 'coin-rush', icon: '🟣', title: 'Coin Rush', tag: '3D · Collect', desc: 'Explore a 3D world for gems.', color: ['#7ec8ff', '#74b9ff'], project: norm(coinRush) },
  { id: 'tower-climb', icon: '🗼', title: 'Tower Climb', tag: '3D · Parkour', desc: 'Hop up to the green goal.', color: ['#fd79a8', '#fdcb6e'], project: norm(towerClimb) },
  { id: 'space-dodge', icon: '🛸', title: 'Space Dodge', tag: '2D · Arcade', desc: 'Dodge comets, grab stars.', color: ['#302b63', '#6c5ce7'], project: norm(spaceDodge) },
  { id: 'fruit-pop', icon: '🍎', title: 'Fruit Pop', tag: '2D · Clicker', desc: 'Click the bouncing fruit!', color: ['#ff9a8b', '#ff0844'], project: norm(bounceParty) },
  { id: 'blank-2d', icon: '🟦', title: 'Blank 2D', tag: '2D · Empty', desc: 'Start from scratch.', color: ['#636e72', '#b2bec3'], project: norm({ name: 'My 2D Game', mode: '2d', objects: [] }) },
  { id: 'blank-3d', icon: '🧊', title: 'Blank 3D', tag: '3D · Empty', desc: 'Start from scratch.', color: ['#636e72', '#b2bec3'], project: norm({ name: 'My 3D Game', mode: '3d', objects: [ground3()] }) },
]
