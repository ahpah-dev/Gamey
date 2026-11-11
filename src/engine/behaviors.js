// Behavior catalog ("Powers"). Pure data: the Studio builds its UI from this and the
// runtime reads the defaults. Every slider is a friendly 1-10 scale (kids!), the
// runtime converts to real units.
const speed = (def = 5) => ({ label: 'Speed', min: 1, max: 10, step: 1, default: def })
const points = { label: 'Points', min: 1, max: 100, step: 1, default: 10 }
const slider = (label, min, max, def) => ({ label, min, max, step: 1, default: def })
const switchNo = { label: 'Switch', type: 'select', num: true, default: 1, options: [1, 2, 3, 4, 5, 6].map((n) => [n, 'Switch ' + n]) }

export const BEHAVIORS = {
  move: {
    label: 'Walk with keys', icon: '🎮', color: '#6c5ce7', group: 'Player',
    desc: 'Move around with the arrow keys or W A S D.',
    params: { speed: speed(5) },
  },
  platformer: {
    label: 'Run & jump', icon: '🦘', color: '#6c5ce7', group: 'Player',
    desc: 'Arrow keys to run, Space to jump. Gravity pulls you down!',
    params: { speed: speed(5), jump: { label: 'Jump power', min: 1, max: 10, step: 1, default: 5 } },
  },
  drive: {
    label: 'Drive a vehicle', icon: '🏎️', color: '#6c5ce7', group: 'Player', only: '2d',
    desc: 'Up = go, Down = brake, Left / Right = steer. Face the picture upwards.',
    params: { speed: speed(6), turn: slider('Steering', 1, 10, 5) },
  },
  shoot: {
    label: 'Shoot!', icon: '🔫', color: '#6c5ce7', group: 'Player', only: '2d',
    desc: 'Press X (or click / tap) to fire. Space works too if you do not jump.',
    params: {
      rate: slider('Fire rate', 1, 10, 5), speed: speed(7),
      aim: { label: 'Aims', type: 'select', default: 'move', options: [['move', 'The way I walk'], ['up', 'Straight up']] },
      shot: { label: 'Ammo', type: 'select', default: 'laser', options: [['laser', '⚡ Laser'], ['fire', '🔥 Fireball'], ['star', '⭐ Star'], ['ball', '⚪ Ball']] },
    },
  },
  camera: {
    label: 'Camera follows me', icon: '🎥', color: '#6c5ce7', group: 'Player',
    desc: 'The camera follows this object around.', params: {},
  },
  solid: {
    label: 'Solid', icon: '🧱', color: '#00b894', group: 'World',
    desc: 'Players can stand on it and bump into it.', params: {},
  },
  gravity: {
    label: 'Falls down', icon: '🍎', color: '#00b894', group: 'World',
    desc: 'Gravity pulls this object down until it lands.', params: {},
  },
  gate: {
    label: 'Locked door', icon: '🔒', color: '#00b894', group: 'World',
    desc: 'Blocks the way until you have collected enough things.', params: { need: slider('Needs', 1, 20, 3) },
  },
  spawner: {
    label: 'Spawner', icon: '🏭', color: '#00b894', group: 'World', only: '2d',
    desc: 'Makes copies of this object again and again (then hides itself). Give it “Fly in a direction”!',
    params: { rate: slider('How often', 1, 10, 4), spread: slider('Spread', 0, 10, 6), life: slider('Lives (sec)', 0, 20, 8), max: slider('Most at once', 1, 30, 10) },
  },
  collect: {
    label: 'Collectible', icon: '🟡', color: '#fdcb6e', group: 'Rules',
    desc: 'Disappears when the player touches it and gives points.', params: { points },
  },
  hazard: {
    label: 'Ouch! (danger)', icon: '💥', color: '#ff7675', group: 'Rules',
    desc: 'Touching it costs the player a life.', params: {},
  },
  goal: {
    label: 'Goal (win!)', icon: '🏁', color: '#00b894', group: 'Rules',
    desc: 'Touch it to win the game.', params: {},
  },
  health: {
    label: 'Can be shot', icon: '🎯', color: '#ff7675', group: 'Rules', only: '2d',
    desc: 'Takes a few hits from your bullets, then pops and gives points.',
    params: { hits: slider('Hits to beat', 1, 10, 3), points },
  },
  clicker: {
    label: 'Click me!', icon: '👆', color: '#fdcb6e', group: 'Rules',
    desc: 'Click or tap it to earn points.', params: { points },
  },
  spin: {
    label: 'Spin', icon: '🌀', color: '#0984e3', group: 'Motion',
    desc: 'Turns round and round.', params: { speed: speed(4) },
  },
  bob: {
    label: 'Float up & down', icon: '🎈', color: '#0984e3', group: 'Motion',
    desc: 'Gently bobs up and down.',
    params: { height: { label: 'Height', min: 1, max: 10, step: 1, default: 4 }, speed: speed(4) },
  },
  patrol: {
    label: 'Patrol', icon: '↔️', color: '#0984e3', group: 'Motion',
    desc: 'Walks back and forth along a line.',
    params: {
      distance: { label: 'Distance', min: 1, max: 10, step: 1, default: 4 },
      speed: speed(3),
      axis: { label: 'Direction', type: 'select', default: 'x', options: [['x', 'Left ↔ right'], ['y', 'Up ↕ down'], ['z', 'Front ↔ back', '3d']] },
    },
  },
  bounce: {
    label: 'Bounce around', icon: '🏀', color: '#0984e3', group: 'Motion',
    desc: 'Flies around and bounces off walls.', params: { speed: speed(4) },
  },
  drift: {
    label: 'Fly in a direction', icon: '💨', color: '#0984e3', group: 'Motion',
    desc: 'Moves in a straight line. Perfect for falling things and bullets.',
    params: { speed: speed(4), dir: { label: 'Direction', type: 'select', default: 'down', options: [['down', 'Down ⬇'], ['up', 'Up ⬆'], ['left', 'Left ⬅'], ['right', 'Right ➡']] } },
  },
  follow: {
    label: 'Chase the player', icon: '🏃', color: '#e17055', group: 'Motion',
    desc: 'Runs after the player when they get close.',
    params: { speed: speed(3), range: { label: 'Sees you from', min: 1, max: 10, step: 1, default: 10 } },
  },
  toggle: {
    label: 'Switch (click me)', icon: '🔘', color: '#e17055', group: 'Scenes',
    desc: 'Click to turn a switch ON or OFF. Other things can show up or hide when it changes.',
    params: { switch: switchNo, drain: slider('Power use', 0, 10, 4) },
  },
  goto: {
    label: 'Go to screen', icon: '📺', color: '#e17055', group: 'Scenes', only: '2d',
    desc: 'Click to jump to another screen — like flipping to a security camera.', params: { room: { label: 'Screen', type: 'room', default: '' } },
  },
  stalker: {
    label: 'Sneaks up on you', icon: '😈', color: '#e17055', group: 'Scenes', only: '2d',
    desc: 'Moves from screen to screen toward you. Block it with a switch or it jump-scares you!',
    params: {
      level: slider('Sneakiness', 1, 10, 4),
      block: { label: 'Stopped by', type: 'select', num: true, default: 1, options: [[0, 'Nothing'], ...[1, 2, 3, 4, 5, 6].map((n) => [n, 'Switch ' + n + ' ON'])] },
      route: { label: 'Stops', type: 'route', default: [] },
    },
  },
}

export const BEHAVIOR_GROUPS = ['Player', 'World', 'Rules', 'Motion', 'Scenes']

export function behaviorDefaults(type) {
  const out = { type }
  const schema = BEHAVIORS[type]
  if (schema) for (const [k, p] of Object.entries(schema.params)) out[k] = Array.isArray(p.default) ? p.default.map((x) => ({ ...x })) : p.default
  return out
}
