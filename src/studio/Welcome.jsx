import React from 'react'
import { TEMPLATES } from '../engine/index.js'

export function Logo({ size = 40 }) {
  return (
    <span className="logo" style={{ '--s': size + 'px' }}>
      <span className="logo-mark">G</span>
      <span className="logo-word">Gamey</span>
    </span>
  )
}

export default function Welcome({ onPick, onOpen, onContinue, savedName }) {
  return (
    <div className="welcome">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <div className="welcome-inner">
        <Logo size={54} />
        <h1>Make your own <span className="grad">2D & 3D games</span></h1>
        <p className="lead">No coding needed. Drag things around, give them powers, press play. Free and open source — for kids, teens and grown-ups.</p>
        <div className="steps">
          <div><b>1</b><span>➕ Add things</span></div>
          <div><b>2</b><span>✨ Give them powers</span></div>
          <div><b>3</b><span>▶️ Press Play!</span></div>
        </div>
        <h2>Pick a game to start with</h2>
        <div className="cards">
          {TEMPLATES.map((t) => (
            <button key={t.id} className="card" onClick={() => onPick(t)} style={{ '--a': t.color[0], '--b': t.color[1] }}>
              <span className="card-art"><span>{t.icon}</span></span>
              <span className="card-body"><strong>{t.title}</strong><em>{t.tag}</em><small>{t.desc}</small></span>
            </button>
          ))}
        </div>
        <div className="welcome-actions">
          {savedName && <button className="btn primary" onClick={onContinue}>↩ Continue “{savedName}”</button>}
          <button className="btn" onClick={onOpen}>📂 Open a saved game</button>
        </div>
        <footer>Gamey is free & public domain (Unlicense) · Made with React</footer>
      </div>
    </div>
  )
}
