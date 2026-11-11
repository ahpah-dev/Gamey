// Tiny math helpers (column-major 4x4 matrices, like WebGL expects).
export const DEG = Math.PI / 180
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
export const rand = (a = 0, b = 1) => a + Math.random() * (b - a)

export const mat4 = {
  multiply(a, b) {
    const o = new Float32Array(16)
    for (let c = 0; c < 4; c++)
      for (let r = 0; r < 4; r++) {
        let s = 0
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
        o[c * 4 + r] = s
      }
    return o
  },
  perspective(fov, aspect, near, far) {
    const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far)
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0])
  },
  lookAt(eye, target, up = [0, 1, 0]) {
    let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2]
    let l = Math.hypot(zx, zy, zz) || 1
    zx /= l; zy /= l; zz /= l
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx
    l = Math.hypot(xx, xy, xz) || 1
    xx /= l; xy /= l; xz /= l
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1,
    ])
  },
  // Translate * RotY * RotX * RotZ * Scale  (angles in degrees)
  compose(px, py, pz, rx, ry, rz, sx, sy, sz) {
    const cx = Math.cos(rx * DEG), snx = Math.sin(rx * DEG)
    const cy = Math.cos(ry * DEG), sny = Math.sin(ry * DEG)
    const cz = Math.cos(rz * DEG), snz = Math.sin(rz * DEG)
    const r00 = cy * cz + sny * snx * snz, r01 = -cy * snz + sny * snx * cz, r02 = sny * cx
    const r10 = cx * snz, r11 = cx * cz, r12 = -snx
    const r20 = -sny * cz + cy * snx * snz, r21 = sny * snz + cy * snx * cz, r22 = cy * cx
    return new Float32Array([
      r00 * sx, r10 * sx, r20 * sx, 0,
      r01 * sy, r11 * sy, r21 * sy, 0,
      r02 * sz, r12 * sz, r22 * sz, 0,
      px, py, pz, 1,
    ])
  },
  invert(m) {
    const o = new Float32Array(16)
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7]
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15]
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10
    const b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30
    const b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32
    let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
    if (!d) return o
    d = 1 / d
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * d
    o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * d
    o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * d
    o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * d
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * d
    o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * d
    o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * d
    o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * d
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * d
    o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * d
    o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * d
    o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * d
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * d
    o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * d
    o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * d
    o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * d
    return o
  },
}

export function hexToRgb(hex) {
  let h = (hex || '#ffffff').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16) || 0
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

/** Orbit camera ({x,y,z} target, yaw/pitch degrees, dist) -> eye position. */
export function orbitEye(cam) {
  const cp = Math.cos(cam.pitch * DEG)
  return [
    cam.x + cam.dist * Math.sin(cam.yaw * DEG) * cp,
    cam.y + cam.dist * Math.sin(cam.pitch * DEG),
    cam.z + cam.dist * Math.cos(cam.yaw * DEG) * cp,
  ]
}
