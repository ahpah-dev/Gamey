// Share a game as a link: project JSON -> (deflate) -> base64url.
const b64 = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

async function pipe(bytes, stream) {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream))
  return new Uint8Array(await out.arrayBuffer())
}

export async function encodeProject(project) {
  const raw = new TextEncoder().encode(JSON.stringify(project))
  if (typeof CompressionStream !== 'undefined') {
    const z = await pipe(raw, new CompressionStream('deflate-raw'))
    return 'z.' + b64(z)
  }
  return 'j.' + b64(raw)
}

export async function decodeProject(str) {
  const [kind, data] = [str.slice(0, 2), str.slice(2)]
  let bytes = unb64(data)
  if (kind === 'z.') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'))
  return JSON.parse(new TextDecoder().decode(bytes))
}
