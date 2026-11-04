import * as THREE from 'three';

const cache = new Map<string, THREE.MeshStandardMaterial>();
export function mat(color: string, rough = 0.85): THREE.MeshStandardMaterial {
  const k = color + rough;
  let m = cache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, flatShading: true });
    cache.set(k, m);
  }
  return m;
}

export const windowMat = new THREE.MeshStandardMaterial({ color: '#ffe6b0', emissive: '#ffb04f', emissiveIntensity: 0, flatShading: true });
export const lampMat = new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#ffc46b', emissiveIntensity: 0 });
export const glassMat = new THREE.MeshStandardMaterial({ color: '#bfeff0', transparent: true, opacity: 0.28, roughness: 0.1, depthWrite: false });

const texCache = new Map<string, THREE.CanvasTexture>();
export function signTex(text: string, bg: string, fg: string, w = 512, h = 128): THREE.CanvasTexture {
  const k = text + bg + fg;
  const hit = texCache.get(k);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 28); g.fill();
  g.lineWidth = 8; g.strokeStyle = '#13293a'; g.stroke();
  g.fillStyle = fg;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let size = h * 0.5;
  g.font = `900 ${size}px "Lilita One", "Nunito", sans-serif`;
  while (g.measureText(text).width > w - 50 && size > 12) { size -= 2; g.font = `900 ${size}px "Lilita One", "Nunito", sans-serif`; }
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(k, t);
  return t;
}

export function tileTex(a: string, b: string, n = 8, rep = 6): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const s = 256 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = (i + j) % 2 ? a : b;
    g.fillRect(i * s, j * s, s, s);
    g.strokeStyle = 'rgba(19,41,58,.12)'; g.lineWidth = 3; g.strokeRect(i * s, j * s, s, s);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
