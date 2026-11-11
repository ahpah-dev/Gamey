# Gamey 🎮

**A tiny, friendly 2D + 3D game engine and visual studio, built with React.**
Kids can make a game in minutes with no code. Teens and adults can drop the same engine into any React app.

- **No coding needed** — drag things around, give them *powers* (move, jump, shoot, collect, spin, patrol…), press **Play**.
- **Every kind of game** — platformers, top-down adventures, space shooters, racing, clickers, 3D parkour, and even **security-camera survival games** in the style of *Five Nights at Freddy's*.
- **2D and 3D** — Canvas 2D for 2D, a hand-written WebGL renderer for 3D (lighting, blob shadows, picking).
- **Lightweight** — the whole engine, with every sprite, model, animation and starter game, is **~46 kB gzipped** with **zero dependencies** (React is a peer dependency). No Three.js, no physics library, no asset files: sounds are synthesized, art is drawn by the engine.
- **Detailed, rigged 3D models** — 52 built-in models (heroes, knights, wizards, animals, a dragon, vehicles, trees, houses, treasure…) with moving parts, plus 45 vector sprites for 2D.
- **Animations** — 33 premade 3D animations (walk, run, jump, wave, dance, fly, swim, open a chest…) and 17 for 2D. Play them while standing, moving, jumping or when clicked. **Make your own** in the keyframe Animation maker.
- **Templates for custom 3D models** — pick a template (🧍 Person, 🐾 Animal, 🐦 Bird, 🚗 Car, ⚙️ Machine) and the Model maker starts you from the matching built-in shape (a real person, cat, duck, car or plane) instead of a plain cube; its parts already have the standard names, so animations stay **in sync** — your creations walk, drive and fly just like the built-in ones.
- **Make your own art** — pixel-art **Sprite maker**, 3D **Model maker** (with moving parts you can animate), plus import of **PNG/JPG/GIF/SVG** pictures and **.obj** models.
- **Share instantly** — one click copies a link that anyone can play. Games also save as small `.gamey.json` files.
- **Touch friendly** — on-screen D-pad, jump and fire buttons appear automatically on tablets and phones.
- **Public domain** — [Unlicense](LICENSE). Do anything you like with it.

## Try it

```bash
git clone https://github.com/ahpah-dev/Gamey.git
cd Gamey
npm install
npm run dev
```

Open the URL Vite prints and pick a starter game and press **▶ Play**:

| Starter | Style | Shows off |
| --- | --- | --- |
| Sky Jumper | 2D platformer | run, jump, coins, moving platforms |
| **Night Shift** | 2D survival horror | camera screens, doors, lights, power meter, jump-scares |
| Space Blaster | 2D shooter | shooting, spawners, enemies with health |
| Dungeon Dash | 2D top-down adventure | keys, locked gates, chasers |
| Neon Racer | 2D racing | steering a car around a track |
| Pet Parade | 3D animations | click animated friends to make them dance |
| Coin Rush, Tower Climb | 3D | exploring and parkour |
| Space Dodge, Fruit Pop | 2D | arcade and clicker |

### Studio cheat sheet

| Do this | How |
| --- | --- |
| Add something | Click a tile on the left (pick a category: Heroes, Enemies, Items, World…) |
| Move / resize | Drag it (2D: drag corners to resize) |
| 3D: move, lift, look around | Drag object · Shift+drag to lift · drag empty space to orbit · right-drag to pan · scroll to zoom |
| Give it powers | Select it → **＋ Add a power** on the right |
| Animate it | Select it → **Animation** → pick *Standing / Moving / In the air / When clicked* |
| Make an animation | In the animation picker: **My animations → Make an animation**, or **Remix** a built-in one |
| Rig your own model | Model maker → pick a **Template** (Person, Animal, Bird, Car…) and you get that built-in shape to edit, already rigged (**🧩 Start from the built-in…** loads it again, **🪄 Fit my parts** rigs parts you built yourself) → **Try an animation** to watch it walk/drive/fly |
| Play / stop | **▶ Play** button, <kbd>P</kbd> / <kbd>Esc</kbd> |
| Undo / redo | <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> |
| Duplicate / delete | <kbd>Ctrl</kbd>+<kbd>D</kbd> / <kbd>Del</kbd> |
| Share | **🔗 Share** copies a play link |

In a game: **arrows / WASD** move, **Space** jumps, **X** (or click / tap) shoots, click or tap things with the *Click me!* power. In 3D, drag to look around.

## Animations

Animations are **keyframed poses**. Every object has a *whole thing* part (`root`); rigged 3D models also have named parts like `head`, `armL`, `armR`, `legL`, `legR`, `tail`, `wingL`, `wingR`, `lid`, `door`. Each pose can move, turn, resize or fade each part, and Gamey blends between poses.

```js
{ name: 'Wave', dur: 1.2, loop: true, ease: true,
  keys: [ { t: 0,   pose: { armR: { rz: 120 } } },
          { t: 0.5, pose: { armR: { rz: 160 } } } ] }
```

Objects pick animations with four slots: `anim` (standing), `animMove` (while moving), `animAir` (while jumping/falling) and `animClick` (plays once when clicked), e.g. `anim: 'b:idle', animMove: 'b:walk'`. Built-ins are `b:<name>`; your own live in `project.anims` and are `c:<id>`. Animations that move parts a model does not have are simply ignored, so *Walk* works on people **and** animals, and whole-thing animations (bounce, spin, wobble, pulse…) work on everything — even a plain cube or a sprite.

## Game types

| Want to make… | Use these powers |
| --- | --- |
| Platformer | *Run & jump*, *Solid*, *Collectible*, *Goal*, *Ouch!* |
| Top-down adventure | *Walk with keys*, *Solid* walls, *Locked door*, *Chase the player* |
| Shooter | *Shoot!*, *Can be shot*, *Spawner*, *Fly in a direction* |
| Racing | *Drive a vehicle*, *Solid* walls, *Collectible* checkpoints |
| Clicker | *Click me!*, *Bounce around* |
| Security-camera horror | *Screens*, *Switch*, *Go to screen*, *Sneaks up on you*, Night mode |

### Making a "Night Shift"-style game

1. Click the empty scene and press **＋ Use screens in this game** under *Screens*. Add more screens (an office, camera views…). Turn on **Look around with the mouse** for the office.
2. Put things on each screen. Tick **Stick to the screen** for buttons and labels that should not move.
3. Give a button **Go to screen** to jump between views, or **Switch (click me)** to turn something on and off. Make other objects appear with **Show only when Switch N is ON** (a closed door!).
4. Add a character with **Sneaks up on you**: set its sneakiness, which switch stops it, and the **Stops** it walks through (the last stop is where it attacks).
5. Tick **🌙 Night mode** for a 12 AM → 6 AM clock and a power meter — switches use power, and when it runs out the doors open!

## Use Gamey as a library

```bash
npm install gamey react react-dom   # (once published; or copy src/engine)
```

### Declarative JSX

```jsx
import { Game, Rect, Sprite, Box } from 'gamey'

export default function MyGame() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Game mode="2d" background={['#5b8def', '#cdeeff']} lives={3}>
        <Rect x={480} y={510} w={960} h={60} color="#55c26b" solid />
        <Rect x={500} y={380} w={160} h={32} color="#55c26b" solid />
        <Sprite sprite="coin" x={500} y={320} w={40} h={40} collect bob />
        <Sprite sprite="slime" x={700} y={454} w={52} h={52} hazard patrol={{ distance: 3 }} anim="jelly" />
        <Sprite sprite="flag" x={900} y={452} w={56} h={56} goal />
        <Sprite sprite="cat" x={80} y={440} w={56} h={56} platformer camera anim="idle" animMove="waddle" />
      </Game>
    </div>
  )
}
```

3D: `<Box model="knight" x={0} y={1} z={0} w={1} h={1.85} d={0.7} platformer camera anim="idle" animMove="run" animAir="jump" />` — any shape can wear a model, and `<Box> <Sphere> <Cylinder> <Cone>` take `x y z w h d` (and `rx ry rz` rotation in degrees). See [`src/examples/demo.jsx`](src/examples/demo.jsx).

Built-in sprites: hero, cat, slime, ghost, robot, rocket, ufo, comet, tree, pine, house, cloud, sun, flower, mushroom, heart, star, coin, gem, key, bomb, spikes, flag, crate, chest, fish, bear, bunny, chicken, door, monitor, camera, ship, alien, asteroid, car, gate, bat, skull, torch, potion, sword, battery, bulb. Built-in models: character, knight, wizard, ninja, pirate, astronaut, zombie, alien, robot, bearbot, cat, dog, bunny, pig, duck, penguin, fish, dragon, bat, slime, ghost, ufo, snowman, car, rocket, plane, tree, pine, palm, cactus, flower, mushroom, rock, house, tower, lamp, sign, fence, barrel, crate, chest, door, coin, gem, heart, star, key, potion, sword, crown, flag, present. Use `sprite="c:myId"` / `model="c:myId"` with the `assets` / `models` props for your own.

Powers are plain props: `solid`, `platformer`, `move`, `drive`, `shoot`, `camera`, `gravity`, `gate`, `spawner`, `collect`, `hazard`, `goal`, `health`, `clicker`, `spin`, `bob`, `patrol`, `bounce`, `follow`, `drift`, `toggle`, `goto`, `stalker`. Pass `true` for defaults or an object to tune: `patrol={{ axis: 'z', distance: 5, speed: 4 }}`. `<Game>` also takes `night`, `survive`, `anims` and `rooms`.

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
| 🏎️ Drive a vehicle | Up = go, Left / Right = steer (2D) |
| 🔫 Shoot! | X, Space or click fires bullets (2D) |
| 🎥 Camera follows me | Smooth follow camera |
| 🧱 Solid / 🍎 Falls down | Collision and gravity |
| 🔒 Locked door | Blocks the way until enough things are collected |
| 🏭 Spawner | Makes copies of an object again and again (2D) |
| 🟡 Collectible / 💥 Ouch! / 🏁 Goal | Score, lose a life, win |
| 🎯 Can be shot | Takes a few hits, then pops for points |
| 👆 Click me! | Click or tap for points |
| 🌀 Spin · 🎈 Float · ↔️ Patrol · 🏀 Bounce · 🏃 Chase · 💨 Fly in a direction | Motion |
| 🔘 Switch · 📺 Go to screen · 😈 Sneaks up on you | Screens, switches and scares |

Win rules (project settings): reach a **Goal**, collect every collectible when there is no goal, or **survive** for a number of seconds. Lives, score and a win/lose screen come built in.

## Project format

A project is plain JSON — easy to save, diff and generate:

```json
{
  "name": "My Game", "mode": "2d", "background": ["#5b8def", "#cdeeff"],
  "settings": { "lives": 3, "win": "auto", "sound": true, "night": false, "survive": 0 },
  "objects": [
    { "id": "a1", "type": "sprite", "sprite": "b:cat", "x": 100, "y": 440, "w": 56, "h": 56,
      "anim": "b:idle", "animMove": "b:waddle",
      "behaviors": [{ "type": "platformer", "speed": 5, "jump": 5 }, { "type": "camera" }] }
  ]
}
```

2D types: `rect circle emoji sprite text` (y points down). 3D types: `box sphere cylinder cone` (y points up). Every power slider is a friendly 1–10 scale. Extra object fields: `anim animMove animAir animClick animSpeed`, `room` (which screen), `hud` (stick to the screen) and `when: { sw: 1, on: true }` (show only when switch 1 is on).

Custom content lives in the project: `assets` (2D sprites as PNG data URLs), `models` (3D: `{ name, parts: [{ s, c, x,y,z, w,h,d, rx,ry,rz, g }], bones: { name: [x,y,z] } }` or an imported `mesh`), `anims` (see above) and `rooms` (`[{ id, name, bg, pan }]`). Objects point at them with `sprite: "c:<id>"` / `model: "c:<id>"` / `anim: "c:<id>"` (built-ins use `b:<name>`).

## Project layout

```
src/engine/   the engine (publishable library)
  runtime.js    fixed-step loop, physics, powers, rules, camera, screens
  anim.js       keyframe animation + premade animations
  render2d.js   Canvas 2D renderer          render3d.js  WebGL renderer
  models3d.js   rigged 3D models            sprites.js   2D sprites
  behaviors.js  power catalog               entities.js  project model + presets
  react.jsx     <GameCanvas>, <Game>, <Rect>, <Box> …
src/studio/   the visual editor (the app you get from `npm run dev`)
```

Scripts: `npm run dev` · `npm run build` (Studio → `dist/`, host anywhere static) · `npm run build:lib` (engine → `dist-lib/`).

## License

[The Unlicense](LICENSE) — public domain. No attribution required.
