# Gamey 🎮

**A tiny, friendly 2D + 3D game engine and visual studio, built with React.**
Kids can make a game in minutes with no code. Teens and adults can drop the same engine into any React app.

- **No coding needed** — drag things around, give them *powers* (move, jump, collect, spin, patrol…), press **Play**.
- **2D and 3D** — Canvas 2D for 2D, a hand-written WebGL renderer for 3D (lighting, blob shadows, picking).
- **Lightweight** — the whole engine is **~26 kB gzipped** with **zero dependencies** (React is a peer dependency). No Three.js, no physics library, no asset files: sounds are synthesized, art is shapes and emoji.
- **Detailed art, built in** — 26 vector sprites for 2D and 20 multi-part 3D models (character, robot, house, car, rocket, tree…), all drawn by the engine, no files to download.
- **Make your own** — a pixel-art **Sprite maker**, a 3D **Model maker** (build from shapes, or remix any built-in), plus import of your own **PNG/JPG/GIF/SVG** pictures and **.obj** 3D models. Everything is saved inside the game file and share link.
- **Share instantly** — one click copies a link that anyone can play. Games also save as small `.gamey.json` files.
- **Touch friendly** — on-screen D-pad and jump button appear automatically on tablets and phones.
- **Public domain** — [Unlicense](LICENSE). Do anything you like with it.

## Try it

```bash
git clone https://github.com/ahpah-dev/Gamey.git
cd Gamey
npm install
npm run dev
```

Open the URL Vite prints, pick a starter game (Sky Jumper, Coin Rush 3D, Tower Climb 3D, Space Dodge, Fruit Pop) and press **▶ Play**.

### Studio cheat sheet

| Do this | How |
| --- | --- |
| Add something | Click a tile on the left |
| Move / resize | Drag it (2D: drag corners to resize) |
| 3D: move, lift, look around | Drag object · Shift+drag to lift · drag empty space to orbit · right-drag to pan · scroll to zoom |
| Give it powers | Select it → **＋ Add a power** on the right |
| Play / stop | **▶ Play** button, <kbd>P</kbd> / <kbd>Esc</kbd> |
| Undo / redo | <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> |
| Duplicate / delete | <kbd>Ctrl</kbd>+<kbd>D</kbd> / <kbd>Del</kbd> |
| Nudge | Arrow keys (<kbd>Shift</kbd> = bigger steps) |
| Share | **🔗 Share** copies a play link |

In a game: **arrows / WASD** move, **Space** jumps, click or tap things with the *Click me!* power. In 3D, drag to look around.

## Use Gamey as a library

```bash
npm install gamey react react-dom   # (once published; or copy src/engine)
```

### Declarative JSX

```jsx
import { Game, Rect, Emoji } from 'gamey'

export default function MyGame() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Game mode="2d" background={['#5b8def', '#cdeeff']} lives={3}>
        <Rect x={480} y={510} w={960} h={60} color="#55c26b" solid />
        <Rect x={500} y={380} w={160} h={32} color="#55c26b" solid />
        <Emoji emoji="🟡" x={500} y={320} w={40} h={40} collect bob />
        <Emoji emoji="👾" x={700} y={454} w={52} h={52} hazard patrol={{ distance: 3 }} />
        <Emoji emoji="🏁" x={900} y={452} w={56} h={56} goal />
        <Emoji emoji="🐱" x={80} y={440} w={56} h={56} platformer camera />
      </Game>
    </div>
  )
}
```

2D art: `<Sprite sprite="slime" x={300} y={440} w={52} h={52} hazard />` (built-in names: hero, cat, slime, ghost, robot, rocket, ufo, comet, tree, pine, house, cloud, sun, flower, mushroom, heart, star, coin, gem, key, bomb, spikes, flag, crate, chest, fish) or `sprite="c:myId"` with `assets` on `<Game>`. In 3D any shape can wear a model: `<Box model="robot" … />` (character, robot, tree, pine, house, car, rocket, snowman, mushroom, tower, cactus, coin, gem, heart, chest, ghost, flag, barrel, crate, cat).

3D uses `<Box> <Sphere> <Cylinder> <Cone>` with `x y z w h d` (and `rx ry rz` rotation in degrees). See [`src/examples/demo.jsx`](src/examples/demo.jsx).

Powers are plain props: `solid`, `platformer`, `move`, `camera`, `gravity`, `collect`, `hazard`, `goal`, `clicker`, `spin`, `bob`, `patrol`, `bounce`, `follow`. Pass `true` for defaults or an object to tune: `patrol={{ axis: 'z', distance: 5, speed: 4 }}`.

### Play a saved project

```jsx
import { GameCanvas, TEMPLATES } from 'gamey'

<GameCanvas project={TEMPLATES[0].project} onEvent={(e) => console.log(e)} /* 'win' | 'lose' */ />
```

### Low level

```js
import { Runtime } from 'gamey'
const game = new Runtime(canvas, project, { onState: (s) => console.log(s.score) })
game.start()      // game.pause(), game.restart(), game.destroy()
```

## Powers

| Power | What it does |
| --- | --- |
| 🎮 Walk with keys | Arrow keys / WASD (camera-relative in 3D) |
| 🦘 Run & jump | Run, jump with Space, gravity, coyote time, moving-platform carry |
| 🎥 Camera follows me | Smooth follow camera |
| 🧱 Solid / 🍎 Falls down | Collision and gravity |
| 🟡 Collectible / 💥 Ouch! / 🏁 Goal | Score, lose a life, win |
| 👆 Click me! | Click or tap for points |
| 🌀 Spin · 🎈 Float · ↔️ Patrol · 🏀 Bounce · 🏃 Chase | Motion |

Win rule (project setting): reach a **Goal**, or collect every collectible when there is no goal. Lives, score and a win/lose screen come built in.

## Project format

A project is plain JSON — easy to save, diff and generate:

```json
{
  "name": "My Game", "mode": "2d", "background": ["#5b8def", "#cdeeff"],
  "settings": { "lives": 3, "win": "auto", "sound": true },
  "objects": [
    { "id": "a1", "type": "emoji", "emoji": "🐱", "x": 100, "y": 440, "w": 56, "h": 56,
      "behaviors": [{ "type": "platformer", "speed": 5, "jump": 5 }, { "type": "camera" }] }
  ]
}
```

2D types: `rect circle emoji sprite text` (y points down). 3D types: `box sphere cylinder cone` (y points up). Every power slider is a friendly 1–10 scale.

Custom art lives in the project: `assets` (2D sprites as PNG data URLs) and `models` (3D: `{ name, parts: [{ s, c, x,y,z, w,h,d, rx,ry,rz }] }` or an imported `mesh`). Objects point at them with `sprite: "c:<id>"` / `model: "c:<id>"` (built-ins use `b:<name>`).

## Project layout

```
src/engine/   the engine (publishable library)
  runtime.js    fixed-step loop, physics, powers, rules, camera
  render2d.js   Canvas 2D renderer          render3d.js  WebGL renderer
  behaviors.js  power catalog               entities.js  project model + presets
  react.jsx     <GameCanvas>, <Game>, <Rect>, <Box> …
src/studio/   the visual editor (the app you get from `npm run dev`)
```

Scripts: `npm run dev` · `npm run build` (Studio → `dist/`, host anywhere static) · `npm run build:lib` (engine → `dist-lib/`).

## License

[The Unlicense](LICENSE) — public domain. No attribution required.
