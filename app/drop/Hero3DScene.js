'use client'

// Client-only Three.js scene for the drop hero. Loaded via next/dynamic (ssr:false)
// from DropHero.js — never import this file directly from a server component.
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PresentationControls, MeshReflectorMaterial, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const PALETTE = { black: '#0a0a0a', green: '#0f3d2e', teal: '#1f8a83', cream: '#f3ead7' }

function faceTexture(label, bg, fg, sub) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  g.fillStyle = bg; g.fillRect(0, 0, 512, 512)
  g.strokeStyle = fg; g.globalAlpha = 0.35; g.lineWidth = 6; g.strokeRect(28, 28, 456, 456); g.globalAlpha = 1
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'
  const size = label.length <= 2 ? 260 : label.length <= 5 ? 120 : 92
  g.font = `700 ${size}px Georgia, 'Times New Roman', serif`
  g.fillText(label, 256, sub ? 230 : 256)
  if (sub) { g.font = '600 34px Helvetica, Arial, sans-serif'; g.globalAlpha = 0.75; g.fillText(sub, 256, 400) }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function DropCube({ piecesPerStyle, mobile }) {
  const baseY = mobile ? 1.9 : 1.15
  const ref = useRef()
  const mats = useMemo(() => {
    const faces = [
      ['VIBIN', PALETTE.black, PALETTE.cream, 'APPAREL'],
      ['DROP 01', PALETTE.green, PALETTE.cream, 'THE FOUNDATION'],
      [String(piecesPerStyle || 50), PALETTE.cream, PALETTE.black, 'NUMBERED PIECES'],
      ['JAX', PALETTE.teal, PALETTE.black, 'JACKSONVILLE'],
      ['SS26', PALETTE.black, PALETTE.teal, null],
      ['№', PALETTE.green, PALETTE.cream, 'AUTHENTICITY TAG'],
    ]
    return faces.map(([l, bg, fg, sub]) => new THREE.MeshStandardMaterial({ map: faceTexture(l, bg, fg, sub), metalness: 0.35, roughness: 0.35 }))
  }, [piecesPerStyle])
  useFrame((state, dt) => {
    if (!ref.current) return
    ref.current.rotation.y += dt * 0.25
    ref.current.position.y = baseY + Math.sin(state.clock.elapsedTime * 1.2) * 0.08
  })
  return (
    <RoundedBox ref={ref} args={mobile ? [1.3, 1.3, 1.3] : [1.4, 1.4, 1.4]} radius={0.08} smoothness={3} position={[mobile ? 0 : 1.9, baseY, 0]} rotation={[0.35, 0.6, 0]} material={mats} castShadow />
  )
}

function Sky() {
  // Gradient sky dome in brand palette (deep green -> teal -> cream horizon glow)
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color('#06140f') }, mid: { value: new THREE.Color(PALETTE.green) }, glow: { value: new THREE.Color('#e9c99a') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 glow; varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(mid, top, smoothstep(0.05, 0.6, h)); c = mix(c, glow, smoothstep(0.18, 0.0, abs(h-0.02))*0.85); gl_FragColor = vec4(c,1.0); }',
  }), [])
  return <mesh material={mat} scale={60}><sphereGeometry args={[1, 32, 16]} /></mesh>
}

export default function Hero3DScene({ piecesPerStyle, mobile }) {
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      camera={{ position: [0, 1.6, mobile ? 7.5 : 6.4], fov: mobile ? 50 : 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <Sky />
      <ambientLight intensity={0.9} />
      <directionalLight position={[-4, 3, -6]} intensity={2.2} color="#ffd9a8" />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color={PALETTE.cream} />
      <pointLight position={[0, 0.3, 2]} intensity={2.5} color={PALETTE.teal} />
      <PresentationControls global={false} cursor snap={false} speed={1.6} zoom={1} rotation={[0, 0, 0]} polar={[-0.6, 0.6]} azimuth={[-Infinity, Infinity]}>
        <DropCube piecesPerStyle={piecesPerStyle} mobile={mobile} />
      </PresentationControls>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={mobile ? 256 : 512} blur={[300, 80]} mixBlur={1} mixStrength={2.2}
          roughness={0.85} depthScale={0.6} minDepthThreshold={0.4} maxDepthThreshold={1.4}
          color="#0b2a26" metalness={0.6} mirror={0.6}
        />
      </mesh>
      <fog attach="fog" args={['#0c2620', 8, 30]} />
    </Canvas>
  )
}
