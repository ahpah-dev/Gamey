// Behavior catalog ("Powers"). Pure data: the Studio builds its UI from this and the
// runtime reads the defaults. Every slider is a friendly 1-10 scale (kids!), the
// runtime converts to real units.
const speed = (def = 5) => ({ label: 'Speed', min: 1, max: 10, step: 1, default: def })
const points = { label: 'Points', min: 1, max: 100, step: 1, default: 10 }

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
  follow: {
    label: 'Chase the player', icon: '🏃', color: '#e17055', group: 'Motion',
    desc: 'Runs after the player when they get close.',
    params: { speed: speed(3), range: { label: 'Sees you from', min: 1, max: 10, step: 1, default: 10 } },
  },
}

export const BEHAVIOR_GROUPS = ['Player', 'World', 'Rules', 'Motion']

export function behaviorDefaults(type) {
  const out = { type }
  const schema = BEHAVIORS[type]
  if (schema) for (const [k, p] of Object.entries(schema.params)) out[k] = p.default
  return out
}
