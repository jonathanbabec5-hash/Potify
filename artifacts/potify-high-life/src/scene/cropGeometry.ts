import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three';

// Fold each narrow leaflet along its midrib. Open gaps between leaflets stay
// readable on a phone without transparent quads or an object per leaf.
export function cropGeometry(stage: number, strain: string, tired: boolean) {
  const vertices: number[] = [], colors: number[] = [];
  const col = new Color();
  const triangle = (a: Vector3, b: Vector3, c: Vector3, tint: string) => {
    col.set(tint);
    for (const v of [a, b, c]) { vertices.push(v.x, v.y, v.z); colors.push(col.r, col.g, col.b); }
  };
  const point = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const leaf = tired ? '#9f9550' : strain === 'moonmint' ? '#4d8068' : '#54793d';
  const light = tired ? '#ba9e5e' : '#809950';
  const stem = '#71834a';
  const flower = strain === 'amber' ? '#b5a05d' : strain === 'moonmint' ? '#9c8ca3' : '#8ba566';
  const tiers = [1, 2, 3, 4, 5][stage];
  const height = [0.17, 0.38, 0.68, 1.04, 1.27][stage] * (tired ? 0.86 : 1);
  const upright = strain === 'sunhaze';
  const width = (upright ? 0.32 : 0.42) * (0.34 + stage * 0.165);
  // Tapered three-sided shoots and little faceted flower clusters share one mesh.
  function shoot(base: Vector3, tip: Vector3, radius: number, tint: string) {
    for (let j = 0; j < 3; j++) {
      const a = j * Math.PI * 2 / 3, b = (j + 1) * Math.PI * 2 / 3;
      triangle(point(base.x + radius * Math.cos(a), base.y, base.z + radius * Math.sin(a)),
        point(base.x + radius * Math.cos(b), base.y, base.z + radius * Math.sin(b)), tip, tint);
    }
  }
  function bud(center: Vector3, size: number) {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5, b = (i + 1) * Math.PI * 2 / 5;
      const rim = (t: number) => point(center.x + size * Math.cos(t), center.y, center.z + size * Math.sin(t));
      triangle(rim(a), rim(b), point(center.x, center.y + 2.4 * size, center.z), i % 2 ? flower : light);
      triangle(rim(b), rim(a), point(center.x, center.y - 1.1 * size, center.z), leaf);
    }
  }
  shoot(point(0,0,0), point(0,height,0), stage ? 0.018 : 0.008, stem);
  for (let row = 0; row < tiers; row++) {
    const f = (row + 0.5) / tiers, y = height * (0.15 + 0.74 * f);
    const radius = width * (1 - 0.55 * f);
    const branches = stage < 2 ? 2 : 3;
    for (let k = 0; k < branches; k++) {
      const a = row * 2.4 + k * Math.PI * 2 / branches;
      const center = point(Math.cos(a)*radius*0.43, y + radius*0.2, Math.sin(a)*radius*0.43);
      shoot(point(0, y - height * 0.09, 0), center, 0.009, stem);
      const fingers = stage === 0 ? 3 : 5;
      for (let i = 0; i < fingers; i++) {
        const spread = i - (fingers - 1) / 2, angle = a + spread * 0.46;
        const len = radius * (1.4 - Math.abs(spread) * 0.22);
        const dx = Math.cos(angle), dz = Math.sin(angle);
        const w = len * (stage === 0 ? 0.20 : 0.086);
        const mid = point(center.x + dx*len*0.47, center.y + len*0.09, center.z + dz*len*0.47);
        const left = point(mid.x-dz*w,mid.y-w*0.6,mid.z+dx*w);
        const right = point(mid.x+dz*w,mid.y-w*0.6,mid.z-dx*w);
        const tip = point(center.x+dx*len,center.y-len*(tired?0.84:0.25),center.z+dz*len);
        triangle(center,left,mid,leaf); triangle(left,tip,mid,leaf);
        triangle(center,mid,right,light); triangle(mid,tip,right,leaf);
      }
      if (stage > 2 && row > 0) bud(center, stage === 4 ? 0.057 : 0.033);
    }
  }
  if (stage >= 3) bud(point(0,height,0), stage === 4 ? 0.079 : 0.046);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}
