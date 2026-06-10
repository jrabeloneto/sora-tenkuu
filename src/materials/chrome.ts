// materials/chrome.ts — shared material singletons (brief §5: reuse everything)
import * as THREE from 'three'

const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

/* Liquid chrome — env map does the work */
export const chromeMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  metalness: 1,
  roughness: 0.07,
  envMapIntensity: 1.7,
})

/* Steel — slightly brushed, for pedestals/bezels */
export const steelMat = new THREE.MeshStandardMaterial({
  color: '#B8C6D9',
  metalness: 1,
  roughness: 0.28,
  envMapIntensity: 1.2,
})

/* Translucent blue plastic / crystal glass (flip-phone, city towers).
   Mobile fallback: no transmission pass, plain transparent glass. */
export const blueGlassMat = new THREE.MeshPhysicalMaterial({
  color: '#bfe0ff',
  metalness: 0,
  roughness: 0.16,
  transmission: COARSE ? 0 : 0.95,
  thickness: 2.2,
  ior: 1.4,
  attenuationColor: new THREE.Color('#7fb8ff'),
  attenuationDistance: 3.5,
  transparent: true,
  opacity: COARSE ? 0.45 : 1,
  envMapIntensity: 1.4,
})

/* Deep-blue dark plastic (Nokia body, CRT shells) */
export const darkShellMat = new THREE.MeshStandardMaterial({
  color: '#0d1f4d',
  metalness: 0.35,
  roughness: 0.45,
  envMapIntensity: 0.9,
})
