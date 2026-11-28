import { useEffect, useMemo } from 'react';
import { BoxGeometry, CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three';
import cedar from '../assets/surfaces/cedar.webp';
import brick from '../assets/surfaces/brick.webp';
import concrete from '../assets/surfaces/concrete.webp';
import loam from '../assets/surfaces/loam.webp';

const urls = { cedar, brick, concrete, loam };
type Finish = keyof typeof urls;
const materials = new Map<string, MeshStandardMaterial>();
const textures = new TextureLoader();
const maps = new Map<Finish, ReturnType<TextureLoader['load']>>();
export function surface(kind: Finish, color = '#ffffff') {
  const key = kind + color;
  let material = materials.get(key);
  if (material) return material;
  let map = maps.get(kind);
  if (!map) {
    map = textures.load(urls[kind]);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.colorSpace = SRGBColorSpace;
    map.anisotropy = 4;
    maps.set(kind, map);
  }
  material = new MeshStandardMaterial({ color, map, roughness: 0.93, flatShading: true });
  material.userData.batchSurface = true;
  materials.set(key, material);
  return material;
}

type Vec3 = [number, number, number];
export function SurfaceBlock({ at, size, finish, color, tile = 1.7, angle = 0 }: {
  at: Vec3; size: Vec3; finish: Finish; color?: string; tile?: number; angle?: number;
}) {
  const [w,h,d] = size;
  const geometry = useMemo(() => {
    const geo = new BoxGeometry(w,h,d);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const face = Math.floor(i / 4);
      const width = face < 2 ? d : w;
      const height = face >= 2 && face < 4 ? d : h;
      uv.setXY(i, uv.getX(i) * width / tile, uv.getY(i) * height / tile);
    }
    return geo;
  }, [w,h,d,tile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh position={at} rotation-y={angle} castShadow receiveShadow>
    <primitive object={geometry} attach="geometry" />
    <primitive object={surface(finish, color)} attach="material" />
  </mesh>;
}

export function printedTexture(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  paint(canvas.getContext('2d')!);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  map.anisotropy = 4;
  return map;
}
