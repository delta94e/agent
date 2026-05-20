'use client';

import { OrbitControls } from '@react-three/drei';

export function SceneEnvironment() {
  return (
    <>
      {/* Ambient light — subtle base illumination */}
      <ambientLight color="#1a1a2e" intensity={0.5} />

      {/* Main directional light */}
      <directionalLight position={[10, 10, 5]} intensity={0.3} color="#e2e8f0" />

      {/* Accent point lights */}
      <pointLight position={[0, 5, 5]} intensity={0.6} color="#00f5ff" distance={30} />
      <pointLight position={[-5, -5, 5]} intensity={0.3} color="#8b5cf6" distance={25} />
      <pointLight position={[5, -5, 5]} intensity={0.2} color="#ff006e" distance={20} />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
        enablePan
        panSpeed={0.5}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
      />
    </>
  );
}
