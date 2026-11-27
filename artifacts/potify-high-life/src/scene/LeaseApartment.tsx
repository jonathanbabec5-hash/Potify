import { useEffect, useMemo } from 'react';
import { DoubleSide, CanvasTexture } from 'three';
import { RoundedBox } from '@react-three/drei';
import { mat } from './materials';
import { printedTexture, SurfaceBlock } from './Surfaces';
import { SolidSurfaces } from './SolidSurfaces';
import { foliage } from './Plants';
import { cropGeometry } from './cropGeometry';
import { PotPlush } from './PotPlush';

type Vec3 = [number,number,number];
function Frame({ at, size, color = '#39453e' }: { at: Vec3; size: Vec3; color?: string }) {
  return <mesh position={at} material={mat(color)} castShadow receiveShadow><boxGeometry args={size}/></mesh>;
}

export function LoftWindows({ apartment }: { apartment: boolean }) {
  return <SolidSurfaces>
    <SurfaceBlock at={[-3.04,0.57,-5.76]} size={[11.45,1.14,0.4]} finish="brick" tile={1.98}/>
    <SurfaceBlock at={[-3.04,3.0,-5.76]} size={[11.45,0.55,0.4]} finish="brick" tile={1.98}/>
    {[-8.59,-5.83,-2.01,0.24,2.53].map(x => <SurfaceBlock key={x} at={[x,1.93,-5.76]}
      size={[0.31,1.88,0.4]} finish="brick" tile={1.98}/>)}
    <SurfaceBlock at={[-3.04,1.15,-5.55]} size={[11.45,0.11,0.61]} finish="cedar"/>
    <Frame at={[-3.04,1.22,-5.75]} size={[11.35,0.09,0.11]}/>
    <Frame at={[-3.04,2.68,-5.75]} size={[11.35,0.09,0.11]}/>
    <Frame at={[-3.04,2.17,-5.76]} size={[11.35,0.047,0.07]}/>
    {Array.from({length:17}, (_,i) => -8.64+i*0.695).map(x => <Frame key={x}
      at={[x,1.94,-5.76]} size={[0.048,1.52,0.08]}/>)}
    {apartment && <>
      <SurfaceBlock at={[-8.69,1.61,-2.9]} size={[0.22,3.22,5.8]} finish="brick" tile={2.1}/>
      <SurfaceBlock at={[-7.4,2.96,-5.51]} size={[2.7,0.22,0.44]} finish="cedar" />
      <SurfaceBlock at={[-3.8,2.96,-5.51]} size={[3.85,0.22,0.44]} finish="cedar" />
      {[-7.6,-3.25,1.0].map(z=><SurfaceBlock key={z} at={[-8.45,2.93,z+2.6]} size={[0.2,0.29,3.7]} finish="cedar"/>)}
    </>}
  </SolidSurfaces>;
}

let lease: CanvasTexture | undefined, fabric: CanvasTexture | undefined, lightPatch: CanvasTexture | undefined;
function leasePaper() {
  return lease ??= printedTexture(768,512,c => {
    c.fillStyle='#e5d4ac'; c.fillRect(0,0,768,512);
    c.strokeStyle='#766549';c.lineWidth=3;c.strokeRect(20,18,728,477);
    c.fillStyle='#343d32';c.font='bold 48px Georgia';c.fillText('CANOPY HOUSE',45,85);
    c.font='22px monospace';c.fillText('RESIDENTIAL LEASE  /  APARTMENT 7B',46,128);
    c.fillRect(45,145,660,3);
    c.font='19px Georgia';c.fillText('One room above the canal. One key to the roof.',45,190);
    for(let i=0;i<8;i++){c.fillStyle=i%3?'#9b9077':'#a89b80';c.fillRect(46,220+i*16,475-(i*37)%115,2);}
    c.strokeStyle='#71816b';c.lineWidth=5;c.beginPath();c.arc(621,322,62,0,Math.PI*2);c.stroke();
    c.font='bold 46px Georgia';c.fillStyle='#62765f';c.fillText('7B',591,339);
    c.fillStyle='#4c5344';c.font='italic 27px Georgia';c.fillText('Resident signature',47,435);
  });
}
function ticking() {
  return fabric ??= printedTexture(256,256,c=>{
    c.fillStyle='#999a81';c.fillRect(0,0,256,256);
    for(let x=0;x<256;x+=32){c.fillStyle='#4d6059';c.fillRect(x,0,8,256);c.fillStyle='#c3b593';c.fillRect(x+11,0,3,256);}
    for(let i=0;i<256;i+=3){c.fillStyle='rgba(43,44,38,.15)';c.fillRect(0,i,256,1);c.fillStyle='rgba(236,224,197,.17)';c.fillRect(i,0,1,256);}
  });
}
function sunPatch() {
  return lightPatch ??= printedTexture(256,384,c=>{
    c.fillStyle='rgba(0,0,0,0)';c.clearRect(0,0,256,384);
    c.shadowColor='rgba(255,218,149,0.8)';c.shadowBlur=7;c.fillStyle='rgb(255,218,149)';
    for(let x=0;x<3;x++)for(let y=0;y<2;y++)c.fillRect(12+x*80,13+y*176,70,159);
  });
}
export function WindowLight({ strength }: { strength: number }) {
  if (strength <= 0) return null;
  return <mesh position={[-4.91,0.024,-2.64]} rotation={[-Math.PI/2,0,-0.36]} renderOrder={1}>
    <planeGeometry args={[2.6,2.75]}/><meshBasicMaterial map={sunPatch()} transparent opacity={strength} depthWrite={false}/>
  </mesh>;
}

export function LeaseApartment() {
  const sprig = useMemo(()=>cropGeometry(2,'moonmint',false),[]);
  useEffect(() => () => sprig.dispose(), [sprig]);
  return <>
    <SolidSurfaces>
      <SurfaceBlock at={[-3.86,0.96,-4.86]} size={[3.82,0.13,1.18]} finish="cedar" tile={1.4}/>
      {[-5.52,-2.24].map(x=>[-5.27,-4.44].map(z=><Frame key={x+'/'+z} at={[x,0.46,z]} size={[0.075,0.9,0.075]}/>))}
      <Frame at={[-3.88,0.77,-4.36]} size={[3.61,0.13,0.07]} color="#4a5e4b"/>
      <SurfaceBlock at={[-2.67,0.72,-4.88]} size={[0.93,0.33,0.88]} finish="cedar" color="#c8b79a"/>
      <Frame at={[-2.67,0.72,-4.418]} size={[0.26,0.036,0.05]} color="#95764d"/>
      <SurfaceBlock at={[-7.12,0.43,-4.77]} size={[2.42,0.25,1.53]} finish="cedar"/>
      <SurfaceBlock at={[-8.26,0.82,-4.77]} size={[0.11,1.18,1.64]} finish="cedar"/>
      <SurfaceBlock at={[-4.43,1.036,-4.61]} size={[0.79,0.018,0.53]} angle={-0.09} finish="cedar" color="#6d6555"/>
      <mesh position={[-5.24,1.069,-4.91]} material={mat('#545348')}><cylinderGeometry args={[0.16,0.19,0.08,20]}/></mesh>
      <mesh position={[-5.24,1.35,-4.91]} material={mat('#b99a62',0.5)}><cylinderGeometry args={[0.018,0.028,0.55,10]}/></mesh>
      <Frame at={[-5.15,1.625,-4.91]} size={[0.22,0.025,0.026]} color="#ba9c64"/>
      <mesh position={[-5.04,1.54,-4.91]}><sphereGeometry args={[0.165,38,22,0,Math.PI*2,0,Math.PI*0.51]}/><meshStandardMaterial color="#255741" roughness={.32} metalness={.17}/></mesh>
    <mesh position={[-5.04,1.539,-4.91]} rotation-x={-Math.PI/2}><torusGeometry args={[.163,.006,8,38]}/><meshStandardMaterial color="#aa9362" roughness={.38} metalness={.53}/></mesh>
      <mesh position={[-3.68,1.18,-5.05]} material={mat('#9e6647')}><cylinderGeometry args={[0.16,0.115,0.3,16]}/></mesh>
      <mesh position={[-3.68,1.32,-5.05]} material={mat('#ba8052')}><cylinderGeometry args={[0.178,0.173,0.067,16]}/></mesh>
      <mesh position={[-3.68,1.358,-5.05]} material={mat('#443a2e')}><cylinderGeometry args={[0.151,0.151,0.009,18]}/></mesh>
      <Frame at={[-3.05,1.045,-5.11]} size={[0.42,0.043,0.25]} color="#535f50"/>
      <Frame at={[-3.07,1.084,-5.115]} size={[0.39,0.032,0.255]} color="#bba581"/>
      <Frame at={[-3.08,1.11,-5.12]} size={[0.4,0.031,0.26]} color="#735744"/>
    </SolidSurfaces>
    <RoundedBox args={[2.29,0.27,1.49]} radius={0.10} smoothness={2} position={[-7.12,0.68,-4.77]}><meshStandardMaterial map={ticking()} roughness={1}/></RoundedBox>
    <RoundedBox args={[0.53,0.16,1.07]} radius={0.07} smoothness={2} position={[-7.94,0.865,-4.79]} rotation-y={-0.06} material={mat('#dcccae')}/>
    <PotPlush />
    <mesh rotation-x={-Math.PI/2} rotation-z={-0.09} position={[-4.43,1.049,-4.61]}><planeGeometry args={[0.73,0.49]}/><meshLambertMaterial map={leasePaper()}/></mesh>
    <mesh rotation-x={Math.PI/2} position={[-5.04,1.534,-4.91]}><circleGeometry args={[0.143,20]}/><meshBasicMaterial color="#ffdb93" side={DoubleSide}/></mesh>
    <mesh geometry={sprig} position={[-3.68,1.358,-5.05]} scale={0.76} material={foliage}/>
  </>;
}
