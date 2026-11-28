import { CAMPAIGN_SKIN, type HeadLook } from '@/game/appearance';
import { use, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Bone, BufferAttribute, BufferGeometry, Color, DataTexture, Group, LinearFilter, MathUtils, MeshLambertMaterial, MeshStandardMaterial, SkinnedMesh } from 'three';
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

const hairNodes = { sweep: 'Swept', coils: 'Coils', tail: 'Tail' } as const;
const defaultComplexion = new Color(CAMPAIGN_SKIN);

function fitResident(template: Group, indices: Indices | null) {
  const model = clone(template);
  const bones: Record<string, Bone> = {};
  const pieces: Record<string, SkinnedMesh> = {};
  const dyes: Record<string, MeshStandardMaterial | MeshLambertMaterial> = {};
  const fittedMaterials = new Map<MeshStandardMaterial, MeshStandardMaterial | MeshLambertMaterial>();
  let sharedSkeleton: SkinnedMesh['skeleton'] | undefined;
  model.traverse(node => {
    if (node instanceof Bone) bones[node.name] = node;
    if (!(node instanceof SkinnedMesh)) return;
    sharedSkeleton ??= node.skeleton;
    node.skeleton = sharedSkeleton;
    node.castShadow = !indices;
    node.frustumCulled = false;
    pieces[node.name] = node;
    const lod = indices?.get(node.name);
    if (lod) node.geometry = simplified(node.geometry, lod);
    const source = node.material as MeshStandardMaterial;
    let material = fittedMaterials.get(source);
    if (!material) {
      // The distant model uses its baked vertex shadows and the scene's vertex lights.
      material = indices ? new MeshLambertMaterial({
        color: source.color, map: source.map, vertexColors: true, side: source.side,
      }) : source.clone();
      fittedMaterials.set(source, material);
    }
    node.material = material;
    if (node.name === 'Skin' || node.name === 'Shirt') dyes[node.name] = material;
  });
  return { model, bones, pieces, dyes, fittedMaterials, sharedSkeleton };
}

export function Resident({ shirt, skin, speed, look, handheld = false }: {
  shirt: string; skin: string; look: HeadLook; speed: RefObject<number>; handheld?: boolean;
}) {
  const asset = useLoader(GLTFLoader, residentUrl);
  const indices = handheld ? use(handheldIndices(asset)) : null;
  const { model, bones, pieces, dyes, fittedMaterials, sharedSkeleton } = useMemo(() => fitResident(asset.scene, indices), [asset.scene, indices]);
  const elapsed = useRef(0), stride = useRef(0), motion = useRef(0);
  useLayoutEffect(() => {
    dyes.Shirt.color.set(shirt);
    const tint = dyes.Skin.color.set(skin);
    tint.r /= defaultComplexion.r;
    tint.g /= defaultComplexion.g;
    tint.b /= defaultComplexion.b;
    for (const [style, name] of Object.entries(hairNodes)) pieces[name].visible = style === look.hairStyle;
    pieces.Cap.visible = look.wearsCap;
  }, [dyes, pieces, shirt, skin, look.hairStyle, look.wearsCap]);
  useEffect(() => () => {
    for (const material of fittedMaterials.values()) material.dispose();
    sharedSkeleton?.dispose();
  }, [fittedMaterials, sharedSkeleton]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, .066);
    const amount = motion.current = MathUtils.damp(motion.current, Math.min(1, speed.current / 4.4), 12, dt);
    const t = elapsed.current += dt;
    const phase = stride.current += dt * (speed.current > 5 ? 10.4 : 7.8) * amount;
    const swing = Math.sin(phase), breath = Math.sin(t * 1.6);
    const blink = Math.max(0, 1 - Math.abs((t % 4.67) - 3.7) / .11);
    bones.hips.position.y = .72 + .016 * (1 - Math.cos(phase * 2)) * amount;
    bones.hips.rotation.set(0, .075 * swing * amount, .012 * Math.sin(t * .68) * (1 - amount));
    bones.chest.rotation.set(.010 * breath + .045 * amount, -.11 * swing * amount, 0);
    bones.neck.rotation.set(-.035 + .009 * breath, .052 * Math.sin(t * .51), .018);
    bones.head.rotation.set(.009 * Math.sin(t * .81), .029 * Math.sin(t * .76), -.020);
    bones.tie.rotation.set(.13 * Math.cos(2 * phase) * amount, 0, .19 * Math.sin(phase - .5) * amount);
    for (const side of ['L', 'R']) {
      const sign = side === 'L' ? 1 : -1;
      const step = sign * swing, bend = Math.max(0, -step) * amount;
      bones['thigh' + side].rotation.set(-.57 * step * amount, 0, .014 * sign);
      bones['shin' + side].rotation.x = .02 + .70 * bend;
      bones['boot' + side].rotation.x = .18 * step * amount - .22 * bend - .02;
      bones['upperArm' + side].rotation.set(.04 + .48 * step * amount, .07 * sign, (.025 + .012 * breath) * sign);
      bones['forearm' + side].rotation.set(-.10 - .22 * (1 - step) * amount, .08 * sign, 0);
      bones['hand' + side].rotation.z = -.045 * sign;
      bones['eye' + side].scale.y = 1 - .975 * blink;
    }
  });
  return <>
    {handheld && <mesh position-y={.013} rotation-x={-Math.PI/2}>
      <planeGeometry args={[.72,.46]} />
      <meshBasicMaterial map={contactMap} color="#342c23" transparent opacity={.36} depthWrite={false} />
    </mesh>}
    <primitive object={model} dispose={null} />
  </>;
}
