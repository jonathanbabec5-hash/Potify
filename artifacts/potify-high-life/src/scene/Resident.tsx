import { type HeadLook, type HairStyle } from '@/game/appearance';
import sweepUrl from '@/assets/resident/sweep.glb?url';
import coilUrl from '@/assets/resident/coils.glb?url';
import tailUrl from '@/assets/resident/tail.glb?url';
import { Suspense, use, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { createPortal, useFrame, useLoader } from '@react-three/fiber';
import { Bone, BufferAttribute, BufferGeometry, Color, DataTexture, Group, LinearFilter, MathUtils, Mesh, MeshStandardMaterial, SkinnedMesh } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import residentUrl from '@/assets/resident/resident.glb?url';

type Indices = Map<string, BufferAttribute>;
const indexSets = new WeakMap<GLTF, Promise<Indices>>();
const distanceGeometry = new WeakMap<BufferGeometry, BufferGeometry>();

function handheldIndices(asset: GLTF) {
  let promise = indexSets.get(asset);
  if (!promise) {
    const lookup = asset.parser.json.extras.handheldIndices as Record<string, number>;
    promise = Promise.all(Object.entries(lookup).map(async ([material, id]) =>
      [material, await asset.parser.getDependency('accessor', id) as BufferAttribute] as const
    )).then(entries => new Map(entries));
    indexSets.set(asset, promise);
  }
  return promise;
}

function simplified(source: BufferGeometry, indices: BufferAttribute) {
  let geometry = distanceGeometry.get(source);
  if (!geometry) {
    geometry = new BufferGeometry();
    for (const [name, attribute] of Object.entries(source.attributes)) geometry.setAttribute(name, attribute);
    geometry.morphAttributes = source.morphAttributes;
    geometry.morphTargetsRelative = source.morphTargetsRelative;
    geometry.setIndex(indices);
    distanceGeometry.set(source, geometry);
  }
  return geometry;
}

const contact = new Uint8Array(32 * 32 * 4);
for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
  const offset = 4 * (32 * y + x);
  const distance = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
  contact.fill(255, offset, offset + 3);
  contact[offset + 3] = 255 * Math.max(0, 1 - distance) ** 1.3;
}
const contactMap = new DataTexture(contact, 32, 32);
contactMap.magFilter = contactMap.minFilter = LinearFilter;
contactMap.needsUpdate = true;

function dress(template: Group, indices: Indices | null) {
  const model = clone(template);
  const bones: Record<string, Bone> = {};
  const dyes = new Map<string, MeshStandardMaterial>();
  let palette: SkinnedMesh['skeleton'] | undefined;
  model.traverse(node => {
    if (node instanceof Bone) bones[node.name] = node;
    if (!(node instanceof SkinnedMesh)) return;
    // Every garment is bound to the same joints and inverse bind matrices in this GLB.
    palette ??= node.skeleton;
    node.skeleton = palette;
    node.frustumCulled = false;
    node.castShadow = !indices;
    const original = node.material as MeshStandardMaterial;
    const reduced = indices?.get(original.name);
    if (reduced) node.geometry = simplified(node.geometry, reduced);
    if (original.name === 'Skin' || original.name === 'Shirt') {
      const material = original.clone();
      dyes.set(original.name, material);
      node.material = material;
    }
  });
  const originalHair = model.getObjectByName('HairMesh') as SkinnedMesh;
  const originalCap = model.getObjectByName('WatchCapMesh') as SkinnedMesh;
  return { model, bones, dyes, originalHair, originalCap };
}

const hairUrls: Record<HairStyle, string> = { sweep: sweepUrl, coils: coilUrl, tail: tailUrl };

function Ponytail({ geometry, material, speed, handheld }: {
  geometry: BufferGeometry; material: MeshStandardMaterial; speed: RefObject<number>; handheld: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  const phase = useRef(0), movement = useRef(0);
  useFrame(({ clock }, delta) => {
    const weights = mesh.current?.morphTargetInfluences;
    if (!weights) return;
    const dt = Math.min(delta, .066);
    movement.current = MathUtils.damp(movement.current, Math.min(1, speed.current / 4.4), 7, dt);
    phase.current += dt * (speed.current > 5 ? 10.4 : 7.8) * movement.current;
    weights[0] = Math.sin(phase.current - .55) * .80 * movement.current + .045 * Math.sin(clock.elapsedTime * 1.2);
    weights[1] = movement.current * (.35 + .25 * Math.cos(2 * phase.current));
  });
  return <mesh ref={mesh} args={[geometry, material]} castShadow={!handheld} dispose={null} />;
}

function HairPiece({ look, head, originalHair, originalCap, speed, handheld }: {
  look: HeadLook; head: Bone; originalHair: Mesh; originalCap: Mesh; speed: RefObject<number>; handheld: boolean;
}) {
  const asset = useLoader(GLTFLoader, hairUrls[look.hairStyle]);
  const variant = look.wearsCap ? 'Tucked' : 'Loose';
  const part = asset.scene.getObjectByName(variant) as Mesh<BufferGeometry, MeshStandardMaterial>;
  const indices = handheld ? use(handheldIndices(asset)).get(variant) : undefined;
  const geometry = indices ? simplified(part.geometry, indices) : part.geometry;
  useLayoutEffect(() => {
    originalHair.visible = false;
    originalCap.visible = look.wearsCap;
    return () => { originalHair.visible = true; originalCap.visible = true; };
  }, [originalHair, originalCap, look.wearsCap]);
  return createPortal(look.hairStyle === 'tail'
    ? <Ponytail geometry={geometry} material={part.material} speed={speed} handheld={handheld} />
    : <mesh geometry={geometry} material={part.material} castShadow={!handheld} dispose={null} />, head);
}

const baseSkin = new Color('#edc2a7');
const white = new Color(1, 1, 1);

export function Resident({ shirt, skin, speed, look, handheld = false }: {
  shirt: string; skin: string; look: HeadLook; speed: RefObject<number>; handheld?: boolean;
}) {
  const asset = useLoader(GLTFLoader, residentUrl);
  const indices = handheld ? use(handheldIndices(asset)) : null;
  const { model, bones, dyes, originalHair, originalCap } = useMemo(() => dress(asset.scene, indices), [asset.scene, indices]);
  const elapsed = useRef(0);
  const stride = useRef(0);
  useLayoutEffect(() => {
    dyes.get('Shirt')?.color.set(shirt);
    const color = dyes.get('Skin')?.color;
    if (color) {
      color.set(skin);
      color.r /= baseSkin.r; color.g /= baseSkin.g; color.b /= baseSkin.b;
      color.lerp(white, .06);
    }
  }, [dyes, shirt, skin]);
  useEffect(() => () => {
    dyes.forEach(material => material.dispose());
    const skeletons = new Set<SkinnedMesh['skeleton']>();
    model.traverse(node => { if (node instanceof SkinnedMesh) skeletons.add(node.skeleton); });
    skeletons.forEach(skeleton => skeleton.dispose());
  }, [model, dyes]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, .066);
    elapsed.current += dt;
    const t = elapsed.current, pace = speed.current;
    const amount = MathUtils.clamp(pace / 4.4, 0, 1);
    stride.current += dt * (pace > 5 ? 10.4 : 7.8) * amount;
    const phase = stride.current, swing = Math.sin(phase), breath = Math.sin(t * 1.7);
    const blink = Math.max(0, 1 - Math.abs((t % 4.67) - 3.7) / .105);
    model.position.y = .012 * (1 - Math.cos(phase * 2)) * amount;
    bones.root.rotation.set(0, .075 * swing * amount, Math.sin(t * .68) * .012 * (1 - amount));
    bones.spine03.rotation.set(.013 * breath + .04 * amount, -.065 * swing * amount, 0);
    bones.neck01.rotation.set(-.026 + .009 * breath, Math.sin(t * .52) * .043, .015);
    bones.head.rotation.set(.013 * Math.sin(t * .72), .018 * Math.sin(t * .81), -.012);
    for (const side of ['L', 'R']) {
      const sign = side === 'L' ? 1 : -1, step = swing * sign;
      const hip = -.53 * step * amount;
      bones['upperleg01_' + side].rotation.set(hip, 0, -.115 * sign);
      bones['lowerleg01_' + side].rotation.x = .035 + .76 * Math.max(0, -step) * amount;
      bones['foot_' + side].rotation.set(-.028 - hip * .37 - .26 * Math.max(0, -step) * amount, 0, .10 * sign);
      bones['upperarm01_' + side].rotation.set(.09 + step * .42 * amount, .07 * sign, -(.53 + .015 * breath) * sign);
      bones['lowerarm01_' + side].rotation.set(.36 - .13 * step * amount, 0, -.14 * sign);
      bones['wrist_' + side].rotation.set(-.10, .12 * sign, .11 * sign);
      bones['orbicularis03_' + side].rotation.x = .034 + .546 * blink;
      bones['orbicularis04_' + side].rotation.x = -.20 * blink;
      bones['eye_' + side].rotation.y = .033 * Math.sin(t * .78 + .3);
    }
  });
  return <>
    {handheld && <mesh position-y={.013} rotation-x={-Math.PI/2}>
      <planeGeometry args={[.72,.46]} />
      <meshBasicMaterial map={contactMap} color="#342c23" transparent opacity={.36} depthWrite={false} />
    </mesh>}
    <primitive object={model} dispose={null} />
    {!(look.hairStyle === 'sweep' && look.wearsCap) && <Suspense fallback={null}>
      <HairPiece look={look} head={bones.head} originalHair={originalHair} originalCap={originalCap} speed={speed} handheld={handheld} />
    </Suspense>}
  </>;
}
