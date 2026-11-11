// Tiny WebGL 3D renderer: primitives, hemisphere + sun lighting, blob shadows.
// ~300 lines, zero dependencies.
import { mat4, hexToRgb, orbitEye, DEG } from './math.js'

const VS = `
attribute vec3 aPos; attribute vec3 aNor;
uniform mat4 uVP; uniform mat4 uM; uniform mat3 uN;
varying vec3 vN; varying vec3 vW;
void main(){ vec4 w = uM * vec4(aPos,1.0); vW = w.xyz; vN = normalize(uN * aNor); gl_Position = uVP * w; }`

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN; varying vec3 vW;
uniform vec3 uColor; uniform vec3 uSky; uniform vec3 uGround; uniform vec3 uEye; uniform vec3 uLight;
uniform float uAlpha; uniform float uUnlit; uniform float uPattern;
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  float d = max(dot(n, -uLight), 0.0);
  vec3 amb = mix(uGround, uSky, n.y * 0.5 + 0.5);
  vec3 h = normalize(v - uLight);
  float spec = pow(max(dot(n, h), 0.0), 40.0) * 0.22;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.14;
  vec3 base = uColor;
  if (uPattern > 0.5) {
    float c = mod(floor(vW.x * 0.5) + floor(vW.z * 0.5), 2.0);
    base *= 1.0 - 0.09 * c;
  }
  vec3 lit = base * (amb * 0.62 + d * 0.78) + spec + rim * uSky;
  vec3 col = mix(lit, uColor, uUnlit);
  gl_FragColor = vec4(col * uAlpha, uAlpha);
}`

function build(gl, verts, idx) {
  const vbo = gl.createBuffer(), ibo = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW)
  return { vbo, ibo, count: idx.length }
}

function boxMesh() {
  const v = [], i = []
  const faces = [
    [[0, 0, 1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
    [[0, 0, -1], [1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]],
    [[1, 0, 0], [1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]],
    [[-1, 0, 0], [-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]],
    [[0, 1, 0], [-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]],
    [[0, -1, 0], [-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]],
  ]
  faces.forEach((f, k) => {
    for (let j = 1; j <= 4; j++) v.push(f[j][0] * 0.5, f[j][1] * 0.5, f[j][2] * 0.5, ...f[0])
    const o = k * 4
    i.push(o, o + 1, o + 2, o, o + 2, o + 3)
  })
  return [v, i]
}

function sphereMesh(lat = 14, lon = 26) {
  const v = [], i = []
  for (let a = 0; a <= lat; a++) {
    const th = (a * Math.PI) / lat
    for (let b = 0; b <= lon; b++) {
      const ph = (b * 2 * Math.PI) / lon
      const nx = Math.sin(th) * Math.cos(ph), ny = Math.cos(th), nz = Math.sin(th) * Math.sin(ph)
      v.push(nx * 0.5, ny * 0.5, nz * 0.5, nx, ny, nz)
    }
  }
  for (let a = 0; a < lat; a++)
    for (let b = 0; b < lon; b++) {
      const p = a * (lon + 1) + b, q = p + lon + 1
      i.push(p, q, p + 1, q, q + 1, p + 1)
    }
  return [v, i]
}

function cylinderMesh(seg = 28) {
  const v = [], i = []
  for (let j = 0; j <= seg; j++) {
    const t = (j / seg) * 2 * Math.PI, x = Math.cos(t), z = Math.sin(t)
    v.push(x * 0.5, 0.5, z * 0.5, x, 0, z, x * 0.5, -0.5, z * 0.5, x, 0, z)
  }
  for (let j = 0; j < seg; j++) { const a = j * 2; i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
  for (const y of [0.5, -0.5]) {
    const c = v.length / 6
    v.push(0, y, 0, 0, Math.sign(y), 0)
    for (let j = 0; j <= seg; j++) { const t = (j / seg) * 2 * Math.PI; v.push(Math.cos(t) * 0.5, y, Math.sin(t) * 0.5, 0, Math.sign(y), 0) }
    for (let j = 0; j < seg; j++) i.push(c, c + 1 + j, c + 2 + j)
  }
  return [v, i]
}

function coneMesh(seg = 28) {
  const v = [], i = []
  for (let j = 0; j <= seg; j++) {
    const t = (j / seg) * 2 * Math.PI, x = Math.cos(t), z = Math.sin(t)
    const l = Math.hypot(x, 0.5, z)
    v.push(0, 0.5, 0, x / l, 0.5 / l, z / l, x * 0.5, -0.5, z * 0.5, x / l, 0.5 / l, z / l)
  }
  for (let j = 0; j < seg; j++) { const a = j * 2; i.push(a, a + 1, a + 3) }
  const c = v.length / 6
  v.push(0, -0.5, 0, 0, -1, 0)
  for (let j = 0; j <= seg; j++) { const t = (j / seg) * 2 * Math.PI; v.push(Math.cos(t) * 0.5, -0.5, Math.sin(t) * 0.5, 0, -1, 0) }
  for (let j = 0; j < seg; j++) i.push(c, c + 1 + j, c + 2 + j)
  return [v, i]
}

function discMesh(seg = 24) {
  const v = [0, 0, 0, 0, 1, 0], i = []
  for (let j = 0; j <= seg; j++) { const t = (j / seg) * 2 * Math.PI; v.push(Math.cos(t) * 0.5, 0, Math.sin(t) * 0.5, 0, 1, 0) }
  for (let j = 0; j < seg; j++) i.push(0, 1 + j, 2 + j)
  return [v, i]
}

function wireMesh() {
  const v = []
  for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) v.push(x, y, z, 0, 1, 0)
  const i = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7]
  return [v, i]
}

const hasB = (e, t) => (e.b ? !!e.b[t] : (e.behaviors || []).some((b) => b.type === t))

export class Renderer3D {
  constructor(canvas) {
    this.mode = '3d'
    this.canvas = canvas
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: true })
    if (!gl) throw new Error('WebGL is not supported in this browser.')
    this.gl = gl
    const sh = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src); gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
    gl.useProgram(prog)
    this.prog = prog
    this.loc = {}
    for (const n of ['uVP', 'uM', 'uN', 'uColor', 'uSky', 'uGround', 'uEye', 'uLight', 'uAlpha', 'uUnlit', 'uPattern']) this.loc[n] = gl.getUniformLocation(prog, n)
    this.aPos = gl.getAttribLocation(prog, 'aPos')
    this.aNor = gl.getAttribLocation(prog, 'aNor')
    this.meshes = {
      box: build(gl, ...boxMesh()),
      sphere: build(gl, ...sphereMesh()),
      cylinder: build(gl, ...cylinderMesh()),
      cone: build(gl, ...coneMesh()),
      disc: build(gl, ...discMesh()),
      wire: build(gl, ...wireMesh()),
    }
    const gv = []
    for (let k = -40; k <= 40; k++) gv.push(k, 0, -40, 0, 1, 0, k, 0, 40, 0, 1, 0, -40, 0, k, 0, 1, 0, 40, 0, k, 0, 1, 0)
    this.gridVbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gv), gl.STATIC_DRAW)
    this.gridCount = gv.length / 6
    this.vp = null; this.inv = null; this.eye = [0, 0, 0]
    this.cw = 1; this.ch = 1
    this._bg = ''
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    gl.clearColor(0, 0, 0, 0)
    this.light = (() => { const l = Math.hypot(-0.5, -1, -0.35); return [-0.5 / l, -1 / l, -0.35 / l] })()
  }

  _fit() {
    const c = this.canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = c.clientWidth || 1, h = c.clientHeight || 1
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr)
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph }
    this.cw = w; this.ch = h
  }

  _bind(mesh) {
    const gl = this.gl
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vbo)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.ibo)
    gl.enableVertexAttribArray(this.aPos); gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 24, 0)
    gl.enableVertexAttribArray(this.aNor); gl.vertexAttribPointer(this.aNor, 3, gl.FLOAT, false, 24, 12)
  }

  _draw(meshName, M, color, alpha = 1, unlit = 0, pattern = 0, mode = this.gl.TRIANGLES) {
    const gl = this.gl, L = this.loc, mesh = this.meshes[meshName]
    this._bind(mesh)
    const N = new Float32Array(9)
    for (let c = 0; c < 3; c++) {
      const x = M[c * 4], y = M[c * 4 + 1], z = M[c * 4 + 2]
      const l2 = x * x + y * y + z * z || 1
      N[c * 3] = x / l2; N[c * 3 + 1] = y / l2; N[c * 3 + 2] = z / l2
    }
    gl.uniformMatrix4fv(L.uM, false, M)
    gl.uniformMatrix3fv(L.uN, false, N)
    gl.uniform3fv(L.uColor, color)
    gl.uniform1f(L.uAlpha, alpha)
    gl.uniform1f(L.uUnlit, unlit)
    gl.uniform1f(L.uPattern, pattern)
    gl.drawElements(mode, mesh.count, gl.UNSIGNED_SHORT, 0)
  }

  render({ entities, particles = [], camera, project, overlay = null }) {
    this._fit()
    const gl = this.gl, L = this.loc
    const bg = project.background
    const css = `linear-gradient(${bg[0]}, ${bg[1]})`
    if (css !== this._bg) { this.canvas.style.background = css; this._bg = css }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.depthMask(true)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const eye = orbitEye(camera)
    this.eye = eye
    const proj = mat4.perspective((camera.fov || 50) * DEG, this.cw / this.ch, 0.1, 300)
    const view = mat4.lookAt(eye, [camera.x, camera.y, camera.z])
    this.vp = mat4.multiply(proj, view)
    this.inv = mat4.invert(this.vp)
    gl.uniformMatrix4fv(L.uVP, false, this.vp)
    gl.uniform3fv(L.uEye, eye)
    gl.uniform3fv(L.uLight, this.light)
    gl.uniform3fv(L.uSky, hexToRgb(bg[0]).map((c) => c * 0.6 + 0.4))
    gl.uniform3fv(L.uGround, [0.5, 0.45, 0.4])

    if (overlay && overlay.grid) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.gridVbo)
      gl.enableVertexAttribArray(this.aPos); gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 24, 0)
      gl.enableVertexAttribArray(this.aNor); gl.vertexAttribPointer(this.aNor, 3, gl.FLOAT, false, 24, 12)
      gl.uniformMatrix4fv(L.uM, false, mat4.compose(0, 0.001, 0, 0, 0, 0, 1, 1, 1))
      gl.uniformMatrix3fv(L.uN, false, new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]))
      gl.uniform3fv(L.uColor, [1, 1, 1]); gl.uniform1f(L.uAlpha, 0.22); gl.uniform1f(L.uUnlit, 1); gl.uniform1f(L.uPattern, 0)
      gl.drawArrays(gl.LINES, 0, this.gridCount)
    }

    for (const e of entities) {
      if (e.visible === false) continue
      const f = 1 + (e.pulse || 0) * 0.3
      const M = mat4.compose(e.x, e.y, e.z, e.rx || 0, e.ry || 0, e.rz || 0, e.w * f, e.h * f, e.d * f)
      const a = (e.opacity ?? 1) * (e.alpha ?? 1)
      this._draw(this.meshes[e.type] ? e.type : 'box', M, hexToRgb(e.color), a, 0, e.pattern ? 1 : 0)
    }

    // blob shadows (drawn on the nearest solid below each object)
    gl.depthMask(false)
    const solids = entities.filter((e) => hasB(e, 'solid'))
    for (const e of entities) {
      if (e.visible === false || hasB(e, 'solid') || e.h > 4) continue
      let top = -Infinity
      for (const s of solids) {
        if (Math.abs(s.x - e.x) > s.w / 2 || Math.abs(s.z - e.z) > s.d / 2) continue
        const t = s.y + s.h / 2
        if (t <= e.y - e.h / 2 + 0.3 && t > top) top = t
      }
      if (top === -Infinity) continue
      const height = Math.max(0, e.y - e.h / 2 - top)
      const k = Math.max(0.35, 1 - height / 10)
      const sz = Math.max(e.w, e.d) * 1.05 * k
      this._draw('disc', mat4.compose(e.x, top + 0.02, e.z, 0, 0, 0, sz, 1, sz), [0, 0, 0], 0.3 * k * (e.alpha ?? 1), 1)
    }

    for (const p of particles) {
      const s = p.size * Math.min(1, p.life * 2)
      this._draw('box', mat4.compose(p.x, p.y, p.z, 0, 0, 0, s, s, s), hexToRgb(p.color), Math.min(1, p.life * 2), 1)
    }
    gl.depthMask(true)

    if (overlay && overlay.selectedId) {
      const e = entities.find((o) => o.id === overlay.selectedId)
      if (e) {
        gl.disable(gl.DEPTH_TEST)
        const M = mat4.compose(e.x, e.y, e.z, e.rx || 0, e.ry || 0, e.rz || 0, e.w * 1.04, e.h * 1.04, e.d * 1.04)
        this._draw('wire', M, [1, 0.84, 0.31], 1, 1, 0, gl.LINES)
        gl.enable(gl.DEPTH_TEST)
      }
    }
  }

  _ray(px, py) {
    if (!this.inv) return null
    const nx = (px / this.cw) * 2 - 1, ny = 1 - (py / this.ch) * 2
    const un = (z) => {
      const m = this.inv
      const x = m[0] * nx + m[4] * ny + m[8] * z + m[12], y = m[1] * nx + m[5] * ny + m[9] * z + m[13]
      const zz = m[2] * nx + m[6] * ny + m[10] * z + m[14], w = m[3] * nx + m[7] * ny + m[11] * z + m[15]
      return [x / w, y / w, zz / w]
    }
    const a = un(-1), b = un(1)
    const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const l = Math.hypot(...d)
    return { o: a, d: d.map((v) => v / l) }
  }

  pick(px, py, ents) {
    const r = this._ray(px, py)
    if (!r) return null
    let best = null, bt = Infinity
    for (const e of ents) {
      let t0 = 0, t1 = Infinity, ok = true
      const c = [e.x, e.y, e.z], hs = [e.w / 2, e.h / 2, e.d / 2]
      for (let k = 0; k < 3 && ok; k++) {
        if (Math.abs(r.d[k]) < 1e-8) { if (r.o[k] < c[k] - hs[k] || r.o[k] > c[k] + hs[k]) ok = false; continue }
        let ta = (c[k] - hs[k] - r.o[k]) / r.d[k], tb = (c[k] + hs[k] - r.o[k]) / r.d[k]
        if (ta > tb) [ta, tb] = [tb, ta]
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb)
        if (t0 > t1) ok = false
      }
      if (ok && t0 < bt) { bt = t0; best = e }
    }
    return best
  }

  /** Intersect the pointer ray with the horizontal plane y = planeY. */
  toWorld(px, py, camera, planeY = 0) {
    const r = this._ray(px, py)
    if (!r || Math.abs(r.d[1]) < 1e-6) return null
    const t = (planeY - r.o[1]) / r.d[1]
    if (t < 0) return null
    return { x: r.o[0] + r.d[0] * t, z: r.o[2] + r.d[2] * t }
  }

  destroy() { /* GPU resources are released when the canvas is garbage collected */ }
}
