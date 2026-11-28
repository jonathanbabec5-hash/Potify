import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three';

type UV = [number, number];
const white: UV = [0.984, 0.016];
const P = (x: number, y: number, z: number) => new Vector3(x,y,z);

// All leaves have curved, folded blades. Calyx clusters are solid ring meshes.
// The atlas supplies the fine veins and surface detail at the eye-level camera.
export function cropGeometry(stage: number, strain: string, tired: boolean, distant = false) {
  const xyz: number[] = [], rgb: number[] = [], uv: number[] = [];
  const tone = new Color();
  function tri(a: Vector3,b: Vector3,c: Vector3,tint: string,u=white,v=white,w=white) {
    tone.set(tint);
    for(const p of [a,b,c]) {xyz.push(p.x,p.y,p.z);rgb.push(tone.r,tone.g,tone.b);}
    uv.push(...u,...v,...w);
  }
  function stem(base: Vector3, tip: Vector3, radius: number) {
    for (let j=0;j<4;j++) {
      const a=j*Math.PI/2, b=(j+1)*Math.PI/2;
      tri(P(base.x+radius*Math.cos(a),base.y,base.z+radius*Math.sin(a)),
        P(base.x+radius*Math.cos(b),base.y,base.z+radius*Math.sin(b)),tip,'#79924d');
    }
  }
  const tint = tired ? '#c0a16d' : strain==='moonmint' ? '#c0dbc9' : '#f0e8c6';
  function blade(base: Vector3, angle: number, length: number, width: number, curl: number) {
    const dx=Math.cos(angle),dz=Math.sin(angle);
    function vertex(t: number, side: number) {
      const fold=Math.sin(t*Math.PI);
      const across=side*width;
      return P(base.x+dx*t*length-dz*across,base.y+length*(0.22*fold-curl*t*t)-Math.abs(side)*width*0.29*fold,
        base.z+dz*t*length+dx*across);
    }
    const segments = distant ? 1 : 2;
    for(let j=0;j<segments;j++) {
      const t=j/segments,n=(j+1)/segments;
      for(const side of [-1,1]) {
        const edge=side<0?0.003:0.495, mid=0.249;
        const a=vertex(t,0), b=vertex(t,side), c=vertex(n,side), d=vertex(n,0);
        if (side < 0) {
          tri(a,b,c,tint,[mid,t],[edge,t],[edge,n]);tri(a,c,d,tint,[mid,t],[edge,n],[mid,n]);
        } else {
          tri(a,c,b,tint,[mid,t],[edge,n],[edge,t]);tri(a,d,c,tint,[mid,t],[mid,n],[edge,n]);
        }
      }
    }
  }
  const floral=strain==='moonmint'?'#e7d4f0':strain==='amber'?'#ffe8b8':'#eaf0c8';
  function flower(base: Vector3,r: number,rotation: number) {
    const rings=distant ? [[-0.42,0.26],[0.35,1],[1.6,0.08]] : [[-0.42,0.25],[-0.1,0.81],[0.48,1.0],[1.11,0.54],[1.62,0.08]];
    const sides=distant?4:6;
    function vertex(i: number,k: number) {
      const a=i*2*Math.PI/sides+rotation+k*0.16;
      const [h,radius]=rings[k];
      const wobble=1+0.12*Math.sin(i*3.1+k*1.9);
      return P(base.x+Math.cos(a)*r*radius*wobble,base.y+h*r,base.z+Math.sin(a)*r*radius*wobble);
    }
    const coord=(i:number,k:number):UV=>[0.515+0.45*i/sides,0.12+0.85*k/(rings.length-1)];
    for(let k=0;k<rings.length-1;k++)for(let i=0;i<sides;i++){
      const a=vertex(i,k),b=vertex(i+1,k),c=vertex(i+1,k+1),d=vertex(i,k+1);
      tri(a,c,b,floral,coord(i,k),coord(i+1,k+1),coord(i+1,k));
      tri(a,d,c,floral,coord(i,k),coord(i,k+1),coord(i+1,k+1));
    }
  }
  const upright=strain==='sunhaze', size=[0.15,0.39,0.72,1.02,1.28][stage]*(tired?0.84:1);
  const crown=(upright?0.32:0.42)*(0.33+stage*0.165);
  const shoots=stage<2?1:stage===2||distant?3:5;
  for(let n=0;n<shoots;n++) {
    const a=n*2.4, lateral=n===0?0:crown*(0.58+0.14*(n%3));
    const top=P(Math.cos(a)*lateral,size*(n===0?1:0.54+0.09*(n%3)), Math.sin(a)*lateral);
    const root=P(0,n===0?0:size*0.18,0);
    stem(root,top,stage===0?0.006:n===0?0.018:0.011);
    const pairs=n===0?Math.max(1,stage+1):2;
    for(let j=0;j<pairs;j++){
      const f=(j+0.7)/(pairs+0.6), origin=root.clone().lerp(top,f);
      for(let side=0;side<2;side++){
        const heading=a+j*2.39+side*Math.PI;
        const length=crown*(1.32-0.60*f)*(n===0?1:0.72);
        const palm=P(origin.x+Math.cos(heading)*length*0.28,origin.y+length*0.17,origin.z+Math.sin(heading)*length*0.28);
        stem(origin,palm,stage===0?0.002:0.004);
        const fingers=stage===0 || distant ? 3 : 5;
        for(let i=0;i<fingers;i++){
          const offset=i-(fingers-1)/2,len=length*(1-0.19*Math.abs(offset));
          blade(palm,heading+offset*0.44,len,len*0.117,tired?0.74:0.20+0.18*f);
        }
      }
      if(stage>=3 && f>0.55)flower(origin,stage===4?0.053:0.034,a+j);
    }
    if(stage>=3){
      const radius=(stage===4?0.085:0.047)*(n===0?1.1:0.85);
      flower(top,radius,a);
      for(let k=0;k<(distant?0:1);k++) {
        const h=a+k*2.1;
        flower(P(top.x+Math.cos(h)*radius*0.48,top.y-radius*(0.55+0.26*k),top.z+Math.sin(h)*radius*0.48),radius*0.66,h);
      }
    }
  }
  const g=new BufferGeometry();
  g.setAttribute('position',new Float32BufferAttribute(xyz,3)); g.setAttribute('uv',new Float32BufferAttribute(uv,2));
  g.setAttribute('color',new Float32BufferAttribute(rgb,3));
  const indexed=mergeVertices(g);g.dispose();indexed.computeVertexNormals();indexed.computeBoundingSphere();
  return indexed;
}
