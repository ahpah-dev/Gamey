// 2D sprites: a built-in vector library (SVG, drawn on demand) + custom images/pixel art.
// A sprite reference is 'b:<name>' (built-in) or 'c:<id>' (project.assets[id]).
const O = 'stroke="#2d2250" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"'
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`
const eye = (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#2d2250" stroke-width="1.6"/><circle cx="${x + 0.6}" cy="${y + 0.6}" r="${r * 0.5}" fill="#2d2250"/>`

export const SPRITES = {
  hero: { name: 'Hero', svg: svg(`<g ${O}><rect x="20" y="34" width="24" height="18" rx="5" fill="#6c5ce7"/><rect x="21" y="50" width="9" height="10" rx="3" fill="#3d3d78"/><rect x="34" y="50" width="9" height="10" rx="3" fill="#3d3d78"/><rect x="14" y="35" width="8" height="14" rx="4" fill="#ffdbb0"/><rect x="42" y="35" width="8" height="14" rx="4" fill="#ffdbb0"/><circle cx="32" cy="22" r="13" fill="#ffdbb0"/><path d="M19 21 C19 6 45 6 45 21 C40 15 26 15 19 21Z" fill="#e17055"/></g>${eye(27, 24, 2.6)}${eye(37, 24, 2.6)}<path d="M28 29 q4 3 8 0" fill="none" stroke="#2d2250" stroke-width="2" stroke-linecap="round"/>`) },
  cat: { name: 'Cat', svg: svg(`<g ${O}><path d="M14 30 L12 8 L28 18Z M50 30 L52 8 L36 18Z" fill="#f7a35c"/><ellipse cx="32" cy="36" rx="22" ry="20" fill="#f7a35c"/><path d="M22 18 q3 6 0 10 M42 18 q-3 6 0 10 M32 16 v8" fill="none" stroke="#c0762f" stroke-width="2.4"/><path d="M29 40 h6 l-3 3z" fill="#ff7675"/><path d="M32 43 q-4 5 -8 2 M32 43 q4 5 8 2" fill="none"/><path d="M6 36 h12 M6 42 l12 -2 M58 36 h-12 M58 42 l-12 -2" fill="none" stroke-width="1.8"/></g>${eye(23, 33)}${eye(41, 33)}`) },
  slime: { name: 'Slime', svg: svg(`<g ${O}><path d="M6 54 C2 32 16 14 32 14 C48 14 62 32 58 54Z" fill="#55efc4"/></g><path d="M14 32 C16 24 22 20 28 19" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>${eye(23, 36, 4.2)}${eye(41, 36, 4.2)}<path d="M26 46 q6 6 12 0" fill="none" stroke="#2d2250" stroke-width="2.6" stroke-linecap="round"/>`) },
  ghost: { name: 'Ghost', svg: svg(`<g ${O}><path d="M10 58 V28 C10 6 54 6 54 28 V58 L45 51 L38 58 L32 51 L26 58 L19 51Z" fill="#f1f2f6"/></g>${eye(25, 28, 4.2)}${eye(40, 28, 4.2)}<ellipse cx="32" cy="40" rx="4" ry="5" fill="#2d2250"/><circle cx="17" cy="38" r="3.4" fill="#ff9ff3" opacity=".7"/><circle cx="47" cy="38" r="3.4" fill="#ff9ff3" opacity=".7"/>`) },
  robot: { name: 'Robot', svg: svg(`<g ${O}><path d="M32 4 v8" fill="none"/><circle cx="32" cy="5" r="3.5" fill="#ff7675"/><rect x="16" y="46" width="32" height="14" rx="4" fill="#636e72"/><rect x="12" y="12" width="40" height="34" rx="9" fill="#b2bec3"/><rect x="6" y="22" width="6" height="12" rx="3" fill="#636e72"/><rect x="52" y="22" width="6" height="12" rx="3" fill="#636e72"/></g><circle cx="24" cy="28" r="6" fill="#00cec9" stroke="#2d2250" stroke-width="2"/><circle cx="40" cy="28" r="6" fill="#00cec9" stroke="#2d2250" stroke-width="2"/><path d="M23 39 h18" stroke="#2d2250" stroke-width="3" stroke-linecap="round"/>`) },
  rocket: { name: 'Rocket', svg: svg(`<g ${O}><path d="M32 60 l-7 -10 h14z" fill="#ffa502"/><path d="M20 46 L10 58 V40 L22 30Z M44 46 L54 58 V40 L42 30Z" fill="#ff7675"/><path d="M32 2 C46 12 46 34 42 50 H22 C18 34 18 12 32 2Z" fill="#f1f2f6"/><path d="M32 2 C38 7 41 12 42 16 H22 C23 12 26 7 32 2Z" fill="#ff7675"/><circle cx="32" cy="28" r="7" fill="#74b9ff"/></g>`) },
  ufo: { name: 'UFO', svg: svg(`<g ${O}><path d="M20 30 C20 12 44 12 44 30Z" fill="#a8e6ff"/><ellipse cx="32" cy="36" rx="28" ry="11" fill="#b2bec3"/></g><circle cx="16" cy="37" r="3" fill="#fdcb6e"/><circle cx="32" cy="41" r="3" fill="#ff7675"/><circle cx="48" cy="37" r="3" fill="#55efc4"/><path d="M26 22 q6 -6 12 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`) },
  comet: { name: 'Comet', svg: svg(`<path d="M30 34 L60 8 L46 40Z M26 40 L52 36 L30 50Z" fill="#ffa502" opacity=".85"/><g ${O}><circle cx="24" cy="40" r="17" fill="#fab1a0"/></g><circle cx="18" cy="35" r="4" fill="#e17055"/><circle cx="29" cy="46" r="3" fill="#e17055"/><circle cx="30" cy="33" r="2.4" fill="#e17055"/>`) },
  tree: { name: 'Tree', svg: svg(`<g ${O}><rect x="27" y="38" width="10" height="22" rx="2" fill="#8d5a2b"/><circle cx="20" cy="34" r="14" fill="#2ecc71"/><circle cx="44" cy="34" r="14" fill="#2ecc71"/><circle cx="32" cy="20" r="16" fill="#3ddc84"/></g><circle cx="26" cy="16" r="3" fill="#fff" opacity=".35"/>`) },
  pine: { name: 'Pine tree', svg: svg(`<g ${O}><rect x="28" y="48" width="8" height="12" fill="#8d5a2b"/><path d="M32 2 L48 26 H16Z" fill="#27ae60"/><path d="M32 14 L52 40 H12Z" fill="#2ecc71"/><path d="M32 26 L56 52 H8Z" fill="#27ae60"/></g>`) },
  house: { name: 'House', svg: svg(`<g ${O}><rect x="10" y="28" width="44" height="30" fill="#fab1a0"/><path d="M5 31 L32 8 L59 31Z" fill="#e17055"/><rect x="27" y="40" width="11" height="18" rx="2" fill="#8d5a2b"/><rect x="14" y="36" width="10" height="10" fill="#a8e6ff"/><rect x="42" y="36" width="8" height="10" fill="#a8e6ff"/><rect x="42" y="10" width="7" height="12" fill="#b2bec3"/></g>`) },
  cloud: { name: 'Cloud', svg: svg(`<g ${O}><path d="M16 50 C4 50 4 32 16 32 C16 20 36 16 42 28 C56 24 62 44 50 50Z" fill="#ffffff"/></g>`) },
  sun: { name: 'Sun', svg: svg(`<g stroke="#f9ae2b" stroke-width="4" stroke-linecap="round"><path d="M32 3 v8 M32 53 v8 M3 32 h8 M53 32 h8 M11 11 l6 6 M47 47 l6 6 M53 11 l-6 6 M17 47 l-6 6"/></g><g ${O}><circle cx="32" cy="32" r="15" fill="#ffd54f"/></g>${eye(27, 29, 2.2)}${eye(37, 29, 2.2)}<path d="M26 36 q6 5 12 0" fill="none" stroke="#2d2250" stroke-width="2" stroke-linecap="round"/>`) },
  flower: { name: 'Flower', svg: svg(`<g ${O}><path d="M32 30 V60" fill="none" stroke="#27ae60" stroke-width="4"/><path d="M32 50 q-14 -2 -16 -12 q12 0 16 12Z" fill="#2ecc71"/><circle cx="32" cy="12" r="9" fill="#fd79a8"/><circle cx="46" cy="22" r="9" fill="#fd79a8"/><circle cx="42" cy="38" r="9" fill="#fd79a8"/><circle cx="22" cy="38" r="9" fill="#fd79a8"/><circle cx="18" cy="22" r="9" fill="#fd79a8"/><circle cx="32" cy="27" r="8" fill="#fdcb6e"/></g>`) },
  mushroom: { name: 'Mushroom', svg: svg(`<g ${O}><path d="M22 36 h20 v14 q0 8 -10 8 q-10 0 -10 -8Z" fill="#fff3d6"/><path d="M4 38 C4 8 60 8 60 38Z" fill="#ff6b6b"/></g><circle cx="20" cy="26" r="5" fill="#fff"/><circle cx="36" cy="20" r="4" fill="#fff"/><circle cx="48" cy="30" r="4.5" fill="#fff"/>`) },
  heart: { name: 'Heart', svg: svg(`<g ${O}><path d="M32 57 C6 38 4 20 17 12 C25 8 32 14 32 19 C32 14 39 8 47 12 C60 20 58 38 32 57Z" fill="#ff6b81"/></g><path d="M14 22 q2 -6 8 -7" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`) },
  star: { name: 'Star', svg: svg(`<g ${O}><polygon points="32,4 40,24 61,25 45,38 50,59 32,47 14,59 19,38 3,25 24,24" fill="#ffd54f"/></g><path d="M26 22 L32 12" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`) },
  coin: { name: 'Coin', svg: svg(`<g ${O}><circle cx="32" cy="32" r="26" fill="#fdcb6e"/><circle cx="32" cy="32" r="18" fill="#f9ae2b"/></g><polygon points="32,20 35,29 44,29 37,35 40,44 32,38 24,44 27,35 20,29 29,29" fill="#fff3b0" stroke="#2d2250" stroke-width="1.6" stroke-linejoin="round"/>`) },
  gem: { name: 'Gem', svg: svg(`<g ${O}><polygon points="18,8 46,8 60,24 32,58 4,24" fill="#74b9ff"/><polygon points="18,8 26,24 4,24" fill="#a8e6ff"/><polygon points="46,8 38,24 60,24" fill="#5aa7ff"/><polygon points="26,24 38,24 32,58" fill="#4a90f0"/><path d="M26 24 L18 8 M38 24 L46 8 M4 24 H60" fill="none"/></g>`) },
  key: { name: 'Key', svg: svg(`<g ${O}><circle cx="18" cy="32" r="13" fill="#fdcb6e"/><circle cx="18" cy="32" r="5" fill="#fff"/><path d="M30 28 H60 V38 H54 V34 H48 V38 H42 V34 H30Z" fill="#fdcb6e"/></g>`) },
  bomb: { name: 'Bomb', svg: svg(`<g ${O}><circle cx="30" cy="38" r="21" fill="#3d4448"/><path d="M42 20 q8 -8 14 -6" fill="none" stroke="#b9772f" stroke-width="4"/></g><polygon points="56,6 58,12 64,13 59,17 61,23 56,19 51,23 53,17 48,13 54,12" fill="#ffa502"/><path d="M16 32 q2 -8 10 -10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>`) },
  spikes: { name: 'Spikes', svg: svg(`<g ${O}><rect x="2" y="52" width="60" height="8" rx="2" fill="#636e72"/><path d="M4 52 L16 14 L28 52Z M24 52 L34 8 L44 52Z M40 52 L52 16 L62 52Z" fill="#dfe6e9"/></g>`) },
  flag: { name: 'Flag', svg: svg(`<g ${O}><rect x="12" y="4" width="5" height="54" rx="2" fill="#b2bec3"/><path d="M17 8 L56 18 L17 31Z" fill="#ff7675"/><ellipse cx="14.5" cy="58" rx="12" ry="4" fill="#636e72"/></g>`) },
  crate: { name: 'Crate', svg: svg(`<g ${O}><rect x="6" y="6" width="52" height="52" rx="3" fill="#d9a05b"/><rect x="6" y="6" width="52" height="10" fill="#b9772f"/><rect x="6" y="48" width="52" height="10" fill="#b9772f"/><path d="M12 16 L52 48 M52 16 L12 48" fill="none" stroke-width="4"/></g>`) },
  chest: { name: 'Chest', svg: svg(`<g ${O}><path d="M6 30 V22 C6 8 58 8 58 22 V30Z" fill="#c8862f"/><rect x="6" y="30" width="52" height="26" rx="2" fill="#b9772f"/><rect x="26" y="26" width="12" height="14" rx="2" fill="#fdcb6e"/><path d="M6 30 H58" fill="none"/></g><circle cx="32" cy="34" r="2" fill="#2d2250"/>`) },
  fish: { name: 'Fish', svg: svg(`<g ${O}><path d="M48 32 L62 18 V46Z" fill="#ff9f43"/><ellipse cx="28" cy="32" rx="24" ry="16" fill="#ff7675"/><path d="M28 18 L36 8 L40 18Z" fill="#ff9f43"/></g>${eye(15, 28, 3.4)}<path d="M30 22 q6 10 0 20" fill="none" stroke="#2d2250" stroke-width="2" opacity=".5"/>`) },
  bear: { name: 'Animatronic bear', svg: svg(`<g ${O}><rect x="12" y="50" width="40" height="12" rx="5" fill="#8d5a2b"/><circle cx="14" cy="22" r="8" fill="#8d5a2b"/><circle cx="50" cy="22" r="8" fill="#8d5a2b"/><circle cx="32" cy="34" r="20" fill="#9b6a38"/><ellipse cx="32" cy="42" rx="11" ry="8" fill="#e8c9a0"/><rect x="21" y="3" width="22" height="13" rx="2" fill="#2d2250"/><rect x="16" y="14" width="32" height="5" rx="2" fill="#2d2250"/><path d="M26 54 l6 4 l6 -4 v8 l-6 -4 l-6 4z" fill="#8e44ad"/></g><circle cx="14" cy="22" r="3.5" fill="#e8c9a0"/><circle cx="50" cy="22" r="3.5" fill="#e8c9a0"/>${eye(24, 32, 4)}${eye(40, 32, 4)}<ellipse cx="32" cy="39" rx="3.5" ry="2.6" fill="#2d2250"/><path d="M28 45 q4 3 8 0" fill="none" stroke="#2d2250" stroke-width="2" stroke-linecap="round"/>`) },
  bunny: { name: 'Animatronic bunny', svg: svg(`<g ${O}><ellipse cx="22" cy="16" rx="6.5" ry="15" fill="#a29bfe"/><ellipse cx="42" cy="16" rx="6.5" ry="15" fill="#a29bfe"/><rect x="14" y="50" width="36" height="12" rx="5" fill="#8e7cf0"/><circle cx="32" cy="38" r="18" fill="#a29bfe"/><path d="M26 54 l6 4 l6 -4 v8 l-6 -4 l-6 4z" fill="#d63031"/></g><ellipse cx="22" cy="17" rx="2.6" ry="10" fill="#fd79a8"/><ellipse cx="42" cy="17" rx="2.6" ry="10" fill="#fd79a8"/>${eye(25, 36, 4)}${eye(39, 36, 4)}<ellipse cx="32" cy="43" rx="3" ry="2.2" fill="#fd79a8"/><path d="M32 45 v3 M27 47 q5 4 10 0" fill="none" stroke="#2d2250" stroke-width="1.8" stroke-linecap="round"/>`) },
  chicken: { name: 'Animatronic chicken', svg: svg(`<g ${O}><circle cx="32" cy="34" r="22" fill="#fdcb6e"/><path d="M24 14 q2 -9 8 -3 q4 -9 8 3 q-8 5 -16 0z" fill="#ff7675"/><path d="M25 38 L39 38 L32 49Z" fill="#ff9f43"/></g>${eye(23, 30, 4)}${eye(41, 30, 4)}<path d="M16 52 q16 9 32 0 v8 h-32z" fill="#74b9ff" stroke="#2d2250" stroke-width="2.4" stroke-linejoin="round"/>`) },
  door: { name: 'Steel door', svg: svg(`<g ${O}><rect x="12" y="2" width="40" height="60" rx="4" fill="#7f8c8d"/><rect x="18" y="8" width="28" height="22" rx="2" fill="#95a5a6"/><rect x="18" y="34" width="28" height="22" rx="2" fill="#95a5a6"/><circle cx="44" cy="32" r="3.5" fill="#fdcb6e"/></g><circle cx="22" cy="14" r="2" fill="#2d2250"/><circle cx="42" cy="14" r="2" fill="#2d2250"/><circle cx="22" cy="48" r="2" fill="#2d2250"/><circle cx="42" cy="48" r="2" fill="#2d2250"/>`) },
  monitor: { name: 'Monitor', svg: svg(`<g ${O}><rect x="6" y="8" width="52" height="38" rx="5" fill="#2d3436"/><rect x="26" y="46" width="12" height="8" fill="#636e72"/><rect x="16" y="54" width="32" height="6" rx="3" fill="#636e72"/></g><rect x="11" y="13" width="42" height="28" rx="2" fill="#1e272e"/><path d="M14 20 h36 M14 26 h36 M14 32 h36" stroke="#55efc4" stroke-width="1.6" opacity=".6"/><circle cx="46" cy="18" r="2" fill="#ff7675"/>`) },
  camera: { name: 'Camera', svg: svg(`<g ${O}><path d="M10 34 L48 22 L52 40 L14 48Z" fill="#b2bec3"/><rect x="26" y="42" width="8" height="14" fill="#636e72"/><rect x="18" y="54" width="24" height="6" rx="2" fill="#636e72"/></g><ellipse cx="50" cy="31" rx="5" ry="9" fill="#2d2250"/><circle cx="50" cy="31" r="3" fill="#74b9ff"/><circle cx="20" cy="36" r="2" fill="#ff4757"/>`) },
  ship: { name: 'Spaceship', svg: svg(`<g ${O}><path d="M32 60 l-6 -10 h12z" fill="#ffa502"/><path d="M22 44 L6 58 L10 34 L24 24Z M42 44 L58 58 L54 34 L40 24Z" fill="#ff7675"/><path d="M32 2 C42 12 44 32 40 48 H24 C20 32 22 12 32 2Z" fill="#f1f2f6"/><circle cx="32" cy="24" r="6" fill="#74b9ff"/></g>`) },
  alien: { name: 'Alien', svg: svg(`<g ${O}><circle cx="16" cy="5" r="3" fill="#fdcb6e"/><circle cx="48" cy="5" r="3" fill="#fdcb6e"/><path d="M22 14 L16 6 M42 14 L48 6" fill="none"/><ellipse cx="32" cy="34" rx="24" ry="22" fill="#55efc4"/><path d="M16 54 v6 M26 56 v6 M38 56 v6 M48 54 v6" fill="none"/></g><ellipse cx="22" cy="32" rx="6" ry="8" fill="#2d2250"/><ellipse cx="42" cy="32" rx="6" ry="8" fill="#2d2250"/><circle cx="24" cy="29" r="2" fill="#fff"/><circle cx="44" cy="29" r="2" fill="#fff"/><path d="M26 46 q6 4 12 0" fill="none" stroke="#2d2250" stroke-width="2.4" stroke-linecap="round"/>`) },
  asteroid: { name: 'Asteroid', svg: svg(`<g ${O}><path d="M14 12 L34 6 L52 16 L58 36 L46 56 L24 58 L8 44 L6 26Z" fill="#a4afb5"/></g><circle cx="24" cy="24" r="5" fill="#7f8c8d"/><circle cx="42" cy="38" r="7" fill="#7f8c8d"/><circle cx="26" cy="44" r="3.5" fill="#7f8c8d"/><circle cx="42" cy="20" r="3" fill="#7f8c8d"/>`) },
  car: { name: 'Race car', svg: svg(`<g ${O}><rect x="8" y="14" width="9" height="14" rx="3" fill="#2d3436"/><rect x="47" y="14" width="9" height="14" rx="3" fill="#2d3436"/><rect x="8" y="40" width="9" height="14" rx="3" fill="#2d3436"/><rect x="47" y="40" width="9" height="14" rx="3" fill="#2d3436"/><rect x="14" y="4" width="36" height="56" rx="14" fill="#ff6b6b"/></g><rect x="19" y="18" width="26" height="12" rx="4" fill="#a8e6ff" stroke="#2d2250" stroke-width="2"/><rect x="21" y="40" width="22" height="9" rx="3" fill="#a8e6ff" stroke="#2d2250" stroke-width="2"/><circle cx="21" cy="8" r="3" fill="#ffeaa7"/><circle cx="43" cy="8" r="3" fill="#ffeaa7"/><path d="M32 4 v8 M32 50 v8" stroke="#fff" stroke-width="3" opacity=".6"/>`) },
  gate: { name: 'Locked gate', svg: svg(`<g ${O}><path d="M8 62 V28 C8 6 56 6 56 28 V62Z" fill="#8d5a2b"/><path d="M18 62 V30 C18 16 46 16 46 30 V62" fill="#5a3a1a"/></g><path d="M24 62 V24 M32 62 V20 M40 62 V24" stroke="#b2bec3" stroke-width="3"/><rect x="26" y="38" width="12" height="12" rx="2" fill="#fdcb6e" stroke="#2d2250" stroke-width="2"/><circle cx="32" cy="43" r="2" fill="#2d2250"/>`) },
  bat: { name: 'Bat', svg: svg(`<g ${O}><path d="M32 22 C26 8 12 8 2 18 C8 20 8 28 12 32 C16 28 20 30 22 38 C26 34 28 38 32 42 C36 38 38 34 42 38 C44 30 48 28 52 32 C56 28 56 20 62 18 C52 8 38 8 32 22Z" fill="#6c5ce7"/><ellipse cx="32" cy="32" rx="9" ry="12" fill="#4b3fb8"/></g><path d="M25 22 L24 12 L30 20 M39 22 L40 12 L34 20" fill="#4b3fb8" stroke="#2d2250" stroke-width="2"/><circle cx="29" cy="30" r="2.6" fill="#ffeaa7"/><circle cx="35" cy="30" r="2.6" fill="#ffeaa7"/>`) },
  skull: { name: 'Skull', svg: svg(`<g ${O}><path d="M10 28 C10 8 54 8 54 28 C54 36 48 38 46 42 V52 H18 V42 C16 38 10 36 10 28Z" fill="#f1f2f6"/></g><ellipse cx="23" cy="30" rx="6" ry="7" fill="#2d2250"/><ellipse cx="41" cy="30" rx="6" ry="7" fill="#2d2250"/><path d="M32 36 l-3 6 h6z" fill="#2d2250"/><path d="M24 44 v8 M32 44 v8 M40 44 v8" stroke="#2d2250" stroke-width="2.4"/>`) },
  torch: { name: 'Torch', svg: svg(`<g ${O}><rect x="28" y="30" width="8" height="30" rx="3" fill="#8d5a2b"/><path d="M32 4 C44 16 44 28 32 32 C20 28 20 16 32 4Z" fill="#ff9f43"/></g><path d="M32 14 C38 20 38 26 32 28 C26 26 26 20 32 14Z" fill="#ffeaa7"/>`) },
  potion: { name: 'Potion', svg: svg(`<g ${O}><rect x="26" y="4" width="12" height="8" rx="2" fill="#8d5a2b"/><path d="M26 12 H38 V26 C52 32 56 56 32 60 C8 56 12 32 26 26Z" fill="#e0f7ff"/></g><path d="M14 44 C16 56 48 56 50 44 C46 38 18 38 14 44Z" fill="#a29bfe"/><circle cx="26" cy="46" r="3" fill="#fff" opacity=".7"/>`) },
  sword: { name: 'Sword', svg: svg(`<g ${O}><path d="M50 4 L58 6 L56 14 L24 46 L18 40Z" fill="#dfe6e9"/><path d="M14 36 L28 50 L24 54 L10 40Z" fill="#fdcb6e"/><path d="M10 46 L18 54 L8 62 L2 56Z" fill="#8d5a2b"/></g>`) },
  battery: { name: 'Battery', svg: svg(`<g ${O}><rect x="24" y="4" width="16" height="6" rx="2" fill="#b2bec3"/><rect x="14" y="10" width="36" height="50" rx="7" fill="#55efc4"/></g><rect x="20" y="18" width="24" height="10" rx="2" fill="#00b894"/><rect x="20" y="32" width="24" height="10" rx="2" fill="#00b894"/><rect x="20" y="46" width="24" height="8" rx="2" fill="#ffeaa7"/>`) },
  bulb: { name: 'Light bulb', svg: svg(`<g ${O}><path d="M32 4 C48 4 54 24 44 34 C40 38 40 42 40 44 H24 C24 42 24 38 20 34 C10 24 16 4 32 4Z" fill="#ffeaa7"/><rect x="24" y="44" width="16" height="12" rx="3" fill="#b2bec3"/><rect x="27" y="56" width="10" height="5" rx="2" fill="#636e72"/></g><path d="M24 18 q4 -6 10 -6" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".7"/>`) },
}
export const SPRITE_IDS = Object.keys(SPRITES)

/** Friendly groups for the sprite picker. */
export const SPRITE_GROUPS = {
  Characters: ['hero', 'cat', 'robot', 'bear', 'bunny', 'chicken', 'alien', 'ship', 'car'],
  Monsters: ['slime', 'ghost', 'bat', 'skull', 'ufo', 'comet', 'asteroid', 'bomb', 'spikes'],
  Nature: ['tree', 'pine', 'flower', 'mushroom', 'cloud', 'sun', 'fish', 'torch'],
  Things: ['house', 'door', 'gate', 'crate', 'chest', 'monitor', 'camera', 'bulb', 'battery', 'flag', 'sword', 'potion'],
  Treasure: ['coin', 'gem', 'star', 'heart', 'key', 'rocket'],
}

/** Old emoji presets -> detailed sprites (also fixes emoji fonts that are missing on some systems). */
const EMOJI_TO_SPRITE = { '🐱': 'cat', '🦊': 'hero', '🌳': 'tree', '☁️': 'cloud', '👾': 'slime', '👻': 'ghost', '🔺': 'spikes', '🏁': 'flag', '🟡': 'coin', '⭐': 'star', '📦': 'crate', '🛸': 'ufo', '☄️': 'comet', '🚀': 'rocket', '🚪': 'door', '🔑': 'key', '💣': 'bomb', '🏠': 'house', '🌸': 'flower', '☀️': 'sun', '🍄': 'mushroom', '💎': 'gem', '❤️': 'heart', '🐟': 'fish', '🦇': 'bat', '💀': 'skull', '🔋': 'battery', '💡': 'bulb', '🐻': 'bear', '🐰': 'bunny', '🐔': 'chicken', '👽': 'alien' }
export function emojiToSprite(o) {
  if (o && o.type === 'emoji' && EMOJI_TO_SPRITE[o.emoji]) {
    const { emoji, ...rest } = o
    return { ...rest, type: 'sprite', sprite: 'b:' + EMOJI_TO_SPRITE[o.emoji] }
  }
  return o
}

/** 'slime' -> 'b:slime' */
export const normRef = (r) => (r && !/^[bc]:/.test(r) ? 'b:' + r : r)

/** Resolve a sprite reference to { src, pixel } (or null). */
export function spriteSource(ref, assets) {
  if (!ref) return null
  const r = normRef(ref)
  if (r.startsWith('b:')) {
    const s = SPRITES[r.slice(2)]
    return s ? { src: 'data:image/svg+xml;utf8,' + encodeURIComponent(s.svg), pixel: false } : null
  }
  const a = assets && assets[r.slice(2)]
  return a ? { src: a.data, pixel: !!a.pixel } : null
}

/* ---- image cache with redraw notification ---- */
const imgs = new Map()
const listeners = new Set()
export function getSpriteImage(src) {
  let im = imgs.get(src)
  if (!im) {
    im = new Image()
    im.onload = () => listeners.forEach((f) => f())
    im.src = src
    imgs.set(src, im)
  }
  return im
}
export function onSpritesLoaded(fn) { listeners.add(fn); return () => listeners.delete(fn) }

/** Read an uploaded image file, scale it down (max 256px) and return { data, w, h } as PNG. */
export function processImageFile(file, max = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth || max, im.naturalHeight || max))
      const w = Math.max(1, Math.round((im.naturalWidth || max) * k)), h = Math.max(1, Math.round((im.naturalHeight || max) * k))
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(im, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve({ data: c.toDataURL('image/png'), w, h })
    }
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not a picture I can read.')) }
    im.src = url
  })
}
