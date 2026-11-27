import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BackSide, Color, Mesh, MeshBasicMaterial, MirroredRepeatWrapping, SRGBColorSpace, TextureLoader } from 'three';
import { game } from '@/game/store';
import panorama from '../assets/surfaces/canal-sky.webp';

let skyMap: ReturnType<TextureLoader['load']> | undefined;
export function DistantSky() {
  const ref = useRef<Mesh>(null), material = useRef<MeshBasicMaterial>(null);
  const night = useMemo(() => new Color('#3a4767'), []);
  const day = useMemo(() => new Color('#fff6ec'), []);
  const map = useMemo(() => {
    if (skyMap) return skyMap;
    const texture = new TextureLoader().load(panorama);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = MirroredRepeatWrapping;
    texture.repeat.set(2, 1.8); texture.offset.set(0.26, -0.67);
    skyMap = texture;
    return texture;
  }, []);
  useFrame(({ camera }) => {
    if (!ref.current || !material.current) return;
    ref.current.position.copy(camera.position);
    const phase = (game.getState().minute - 360) * Math.PI / 720;
    const light = Math.min(1, Math.max(0, (Math.sin(phase) + 0.12) * 2.3));
    material.current.color.copy(night).lerp(day, light);
  });
  return <mesh ref={ref} renderOrder={-100} frustumCulled={false}>
    <sphereGeometry args={[168,48,24]}/><meshBasicMaterial ref={material} map={map} side={BackSide} depthWrite={false} fog={false} toneMapped={false}/>
  </mesh>;
}
