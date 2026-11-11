// Gamey as a plain React library: describe a game in JSX. No Studio needed.
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Game, Box, Sphere, Cylinder, Cone } from '../engine/index.js'

function Demo() {
  const coins = [[-4, 8], [0, 8], [4, 8], [6, -2], [-6, -4]]
  return (
    <Game mode="3d" name="JSX demo" background={['#7ec8ff', '#e6f6ff']} lives={3}>
      <Box x={0} y={-0.5} z={0} w={30} h={1} d={30} color="#55c26b" pattern solid />
      <Box x={5} y={0.4} z={-4} w={4} h={0.8} d={4} color="#e17055" solid />
      <Cone x={-9} y={2} z={2} w={2.4} h={4} d={2.4} color="#2ecc71" />
      {coins.map(([x, z]) => (
        <Box key={x + ',' + z} x={x} y={1.1} z={z} w={0.8} h={0.8} d={0.8} rx={35} rz={35} color="#fdcb6e" collect bob spin={{ speed: 5 }} />
      ))}
      <Sphere x={8} y={0.75} z={4} w={1.5} h={1.5} d={1.5} color="#ff7675" hazard patrol={{ axis: 'z', distance: 4 }} />
      <Cylinder x={0} y={1.5} z={-10} w={1.6} h={3} d={1.6} color="#00e676" goal spin />
      <Sphere x={0} y={1} z={10} w={1.4} h={1.4} d={1.4} color="#a29bfe" platformer camera />
    </Game>
  )
}

createRoot(document.getElementById('root')).render(<Demo />)
