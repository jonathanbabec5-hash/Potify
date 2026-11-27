import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { BufferAttribute, Group, InstancedMesh, SkinnedMesh, Matrix4, Mesh, MeshStandardMaterial } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Use only around rigid parts with the same lifetime. Animated joints, textured
// signs, glass and emissive lamps keep their own rendering paths.
export function SolidSurfaces({ children, revision = '' }: { children: ReactNode; revision?: string }) {
  const group = useRef<Group>(null);
  useLayoutEffect(() => {
    const root = group.current!;
    root.updateWorldMatrix(true, true);
    const inverse = new Matrix4().copy(root.matrixWorld).invert();
    const sets = new Map<string, Mesh[]>();
    root.traverseVisible(object => {
      if (!(object instanceof Mesh) || object instanceof InstancedMesh || object instanceof SkinnedMesh) return;
      const m = object.material;
      if (!(m instanceof MeshStandardMaterial) || !m.flatShading || m.map || m.transparent ||
          m.vertexColors || m.emissive.getHex() !== 0 || !object.geometry.attributes.normal) return;
      const key = [m.roughness, m.metalness, m.side, object.castShadow, object.receiveShadow].join('/');
      const set = sets.get(key) ?? [];
      set.push(object);
      sets.set(key, set);
    });
    const packed: Mesh[] = [], hidden: Mesh[] = [];
    for (const parts of sets.values()) {
      if (parts.length < 2) continue;
      const pieces = parts.map(part => {
        const source = part.geometry;
        const g = source.index ? source.toNonIndexed() : source.clone();
        g.applyMatrix4(new Matrix4().multiplyMatrices(inverse, part.matrixWorld));
        for (const name of Object.keys(g.attributes)) {
          if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
        }
        const color = (part.material as MeshStandardMaterial).color;
        const rgb = new Float32Array(g.attributes.position.count * 3);
        for (let i = 0; i < rgb.length; i += 3) color.toArray(rgb, i);
        g.setAttribute('color', new BufferAttribute(rgb, 3));
        return g;
      });
      const geometry = mergeGeometries(pieces);
      pieces.forEach(piece => piece.dispose());
      if (!geometry) continue;
      const material = (parts[0].material as MeshStandardMaterial).clone();
      material.color.setHex(0xffffff);
      material.vertexColors = true;
      const mesh = new Mesh(geometry, material);
      mesh.castShadow = parts[0].castShadow;
      mesh.receiveShadow = parts[0].receiveShadow;
      root.add(mesh);
      packed.push(mesh);
      for (const part of parts) { part.visible = false; hidden.push(part); }
    }
    return () => {
      for (const part of hidden) part.visible = true;
      for (const mesh of packed) {
        root.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as MeshStandardMaterial).dispose();
      }
    };
  }, [revision]);
  return <group ref={group}>{children}</group>;
}
