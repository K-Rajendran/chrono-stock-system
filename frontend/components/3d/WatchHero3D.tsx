'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshReflectorMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Procedural watch geometry — no external 3D asset needed.
 * When a real GLB/GLTF model is available, replace this with:
 *   const { scene } = useGLTF('/models/watch.glb');
 *   return <primitive object={scene} />;
 */
function WatchMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.08;
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = -state.clock.getElapsedTime() * 2;
    }
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: '#B8933A',
    metalness: 0.95,
    roughness: 0.15,
    envMapIntensity: 1.5,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: '#0a0a0a',
    metalness: 0.4,
    roughness: 0.5,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#88BBFF',
    transmission: 0.95,
    thickness: 0.05,
    roughness: 0,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
  });

  return (
    <group ref={groupRef}>
      {/* Case */}
      <mesh castShadow material={goldMat}>
        <cylinderGeometry args={[1.1, 1.1, 0.28, 64]} />
      </mesh>
      {/* Bezel ring */}
      <mesh position={[0, 0.15, 0]} material={goldMat}>
        <torusGeometry args={[1.1, 0.06, 16, 64]} />
      </mesh>
      {/* Dial face (dark) */}
      <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]} material={darkMat}>
        <circleGeometry args={[1.0, 64]} />
      </mesh>
      {/* Sapphire glass */}
      <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} material={glassMat}>
        <circleGeometry args={[1.0, 64]} />
      </mesh>
      {/* Hour hand */}
      <mesh ref={innerRef} position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.05, 0.5, 0.02]} />
        <meshStandardMaterial color="#B8933A" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Minute hand */}
      <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <boxGeometry args={[0.03, 0.75, 0.02]} />
        <meshStandardMaterial color="#D4AF6B" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 0.8;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * r, 0.2, Math.cos(angle) * r]}
            rotation={[0, angle, 0]}
            material={goldMat}
          >
            <boxGeometry args={[0.04, 0.03, i % 3 === 0 ? 0.12 : 0.06]} />
          </mesh>
        );
      })}
      {/* Crown */}
      <mesh position={[1.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={goldMat}>
        <cylinderGeometry args={[0.07, 0.09, 0.25, 16]} />
      </mesh>
      {/* Strap top */}
      <mesh position={[0, -0.02, -1.4]} material={darkMat}>
        <boxGeometry args={[0.7, 0.18, 1.2]} />
      </mesh>
      {/* Strap bottom */}
      <mesh position={[0, -0.02, 1.4]} material={darkMat}>
        <boxGeometry args={[0.7, 0.18, 1.2]} />
      </mesh>
    </group>
  );
}

export default function WatchHero3D() {
  return (
    <Canvas
      camera={{ position: [0, 2, 5], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
      aria-label="Interactive 3D watch display"
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} color="#fff5e6" castShadow />
      <pointLight position={[-4, 2, -4]} intensity={0.6} color="#B8933A" />
      <pointLight position={[4, -2, 4]} intensity={0.3} color="#4488FF" />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <WatchMesh />
      </Float>

      <Environment preset="city" />
    </Canvas>
  );
}
