// React bindings: <GameCanvas project={...}/> plays a project; <Game> + <Rect>/<Box>/…
// let you describe a game declaratively in JSX.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Runtime } from './runtime.js'
import { audio } from './audio.js'
import { BEHAVIORS, behaviorDefaults } from './behaviors.js'
import { normalizeProject } from './entities.js'

const pill = {
  background: 'rgba(20,16,50,.55)', backdropFilter: 'blur(8px)', color: '#fff', borderRadius: 999,
  padding: '6px 14px', fontWeight: 800, fontSize: 18, display: 'flex', gap: 6, alignItems: 'center',
  boxShadow: '0 4px 14px rgba(0,0,0,.25)', userSelect: 'none',
}

function PadButton({ rt, names, children, style }) {
  const set = (on) => names.forEach((n) => rt.current && rt.current.input.setVirtual(n, on))
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); set(true) }}
      onPointerUp={() => set(false)} onPointerCancel={() => set(false)} onContextMenu={(e) => e.preventDefault()}
      style={{
        width: 62, height: 62, borderRadius: 20, border: '2px solid rgba(255,255,255,.7)', background: 'rgba(20,16,50,.45)',
        color: '#fff', fontSize: 26, fontWeight: 900, touchAction: 'none', backdropFilter: 'blur(6px)', ...style,
      }}
    >{children}</button>
  )
}

/** Plays a Gamey project. Fills its parent. */
export function GameCanvas({ project, hud = true, touch = 'auto', onState, onEvent, onReady, className, style }) {
  const canvasRef = useRef(null)
  const rtRef = useRef(null)
  const cb = useRef({})
  cb.current = { onState, onEvent, onReady }
  const [st, setSt] = useState(null)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState(null)
  const data = useMemo(() => normalizeProject(project), [project])
  const key = useMemo(() => JSON.stringify(data), [data])
  const showTouch = touch === 'on' || (touch === 'auto' && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches)

  useEffect(() => {
    setError(null)
    let rt
    try {
      rt = new Runtime(canvasRef.current, data, {
        onState: (s) => { setSt(s); cb.current.onState && cb.current.onState(s) },
        onEvent: (n) => cb.current.onEvent && cb.current.onEvent(n),
      })
    } catch (e) { setError(e.message || String(e)); return undefined }
    rtRef.current = rt
    rt.start()
    cb.current.onReady && cb.current.onReady(rt)
    return () => { rt.destroy(); rtRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const restart = () => rtRef.current && rtRef.current.restart()
  const lives = data.settings.lives

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <canvas key={data.mode} ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      {error && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', background: '#2d2250', padding: 24, textAlign: 'center' }}>😢 {error}</div>}
      {hud && st && (
        <>
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={pill}>⭐ {st.score}</div>
            {st.total > 0 && <div style={pill}>🟡 {st.collected}/{st.total}</div>}
          </div>
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
            {lives > 0 && <div style={pill}>{Array.from({ length: Math.min(lives, 8) }, (_, i) => (i < st.lives ? '❤️' : '🖤')).join('')}</div>}
            <button style={{ ...pill, border: 0, cursor: 'pointer' }} title="Sound" onClick={() => { audio.setMuted(!muted); setMuted(!muted) }}>{muted ? '🔇' : '🔊'}</button>
          </div>
          {st.status !== 'playing' && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(20,16,50,.45)', backdropFilter: 'blur(3px)' }}>
              <div style={{ background: '#fff', borderRadius: 28, padding: '28px 40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.4)', animation: 'gameyPop .35s cubic-bezier(.2,1.6,.4,1)' }}>
                <div style={{ fontSize: 64 }}>{st.status === 'won' ? '🎉' : '💔'}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#2d2250' }}>{st.status === 'won' ? 'You win!' : 'Game over'}</div>
                <div style={{ fontSize: 18, color: '#6c5ce7', fontWeight: 800, margin: '6px 0 16px' }}>Score: {st.score}</div>
                <button onClick={restart} style={{ background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', color: '#fff', border: 0, padding: '12px 28px', borderRadius: 999, fontSize: 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 0 #4b3fb8' }}>▶ Play again</button>
              </div>
            </div>
          )}
          <style>{'@keyframes gameyPop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}'}</style>
        </>
      )}
      {showTouch && hud && (
        <>
          <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'grid', gridTemplateColumns: 'repeat(3,62px)', gridTemplateRows: 'repeat(2,62px)', gap: 6 }}>
            <span /><PadButton rt={rtRef} names={['up']}>▲</PadButton><span />
            <PadButton rt={rtRef} names={['left']}>◀</PadButton>
            <PadButton rt={rtRef} names={['down']}>▼</PadButton>
            <PadButton rt={rtRef} names={['right']}>▶</PadButton>
          </div>
          <div style={{ position: 'absolute', right: 18, bottom: 22 }}>
            <PadButton rt={rtRef} names={['jump', 'Space']} style={{ width: 84, height: 84, borderRadius: 42, fontSize: 16 }}>JUMP</PadButton>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ declarative */
const mk = (type) => {
  const C = () => null
  C.displayName = type[0].toUpperCase() + type.slice(1)
  C.gameyType = type
  return C
}
export const Rect = mk('rect')
export const Circle = mk('circle')
export const Emoji = mk('emoji')
export const Label = mk('text')
export const Box = mk('box')
export const Sphere = mk('sphere')
export const Cylinder = mk('cylinder')
export const Cone = mk('cone')

function collect(children, out) {
  React.Children.forEach(children, (c) => {
    if (!React.isValidElement(c)) return
    if (c.type === React.Fragment) { collect(c.props.children, out); return }
    const type = c.type && c.type.gameyType
    if (!type) return
    const { behaviors = [], children: _c, rotation, ...rest } = c.props
    const list = behaviors.map((b) => (typeof b === 'string' ? behaviorDefaults(b) : { ...behaviorDefaults(b.type), ...b }))
    for (const name of Object.keys(BEHAVIORS)) {
      const v = rest[name]
      if (v) { list.push({ ...behaviorDefaults(name), ...(typeof v === 'object' ? v : {}) }); delete rest[name] }
      else delete rest[name]
    }
    out.push({ type, ...rest, ...(rotation !== undefined ? { rz: rotation } : {}), behaviors: list })
  })
  return out
}

/**
 * <Game mode="2d" background={['#5b8def','#cdeeff']}>
 *   <Rect x={400} y={500} w={800} h={60} color="#55c26b" solid />
 *   <Emoji emoji="🐱" x={100} y={440} w={56} h={56} platformer camera />
 * </Game>
 */
export function Game({ mode = '2d', name, background, world, camera, lives, win, sound, children, ...canvasProps }) {
  const project = useMemo(() => {
    const settings = {}
    if (lives !== undefined) settings.lives = lives
    if (win !== undefined) settings.win = win
    if (sound !== undefined) settings.sound = sound
    return normalizeProject({ name, mode, background, world, camera, settings, objects: collect(children, []) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, name, JSON.stringify([background, world, camera, lives, win, sound]), JSON.stringify(collect(children, []))])
  return <GameCanvas project={project} {...canvasProps} />
}
export const Game2D = (props) => <Game {...props} mode="2d" />
export const Game3D = (props) => <Game {...props} mode="3d" />
