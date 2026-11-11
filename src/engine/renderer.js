import { Renderer2D } from './render2d.js'
import { Renderer3D } from './render3d.js'

export function createRenderer(canvas, mode) {
  return mode === '3d' ? new Renderer3D(canvas) : new Renderer2D(canvas)
}
