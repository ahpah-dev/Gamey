// Zero-asset sound effects synthesized with WebAudio.
let ctx = null
let muted = false

export const audio = {
  get muted() { return muted },
  setMuted(m) { muted = !!m },
  _ctx() {
    if (!ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext
      if (AC) ctx = new AC()
    }
    if (ctx && ctx.state === 'suspended') ctx.resume()
    return ctx
  },
  tone(freq, dur = 0.12, type = 'square', vol = 0.06, slide = 0, delay = 0) {
    if (muted) return
    const c = this._ctx()
    if (!c) return
    const t = c.currentTime + delay
    const o = c.createOscillator(), g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(c.destination)
    o.start(t); o.stop(t + dur + 0.02)
  },
  play(name) {
    switch (name) {
      case 'coin': this.tone(880, 0.08, 'square'); this.tone(1320, 0.14, 'square', 0.06, 0, 0.07); break
      case 'jump': this.tone(300, 0.16, 'square', 0.05, 380); break
      case 'hit': this.tone(180, 0.25, 'sawtooth', 0.08, -120); break
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.08, 0, i * 0.12)); break
      case 'lose': [400, 330, 262, 196].forEach((f, i) => this.tone(f, 0.22, 'sawtooth', 0.06, 0, i * 0.14)); break
      case 'pop': this.tone(500, 0.1, 'sine', 0.08, 500); break
      default: break
    }
  },
}
