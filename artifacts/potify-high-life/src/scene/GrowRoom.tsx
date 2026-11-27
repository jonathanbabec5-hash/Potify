import { DoubleSide } from 'three';
import { SurfaceBlock } from './Surfaces';
import { SolidSurfaces } from './SolidSurfaces';
import { mat } from './materials';

type Vec = [number,number,number];
function Rail({ at, size, color = '#4c5b4d', tilt = 0 }: { at:Vec; size:Vec; color?:string; tilt?:number }) {
  return <mesh position={at} rotation-z={tilt} material={mat(color)} castShadow receiveShadow><boxGeometry args={size}/></mesh>;
}
function GrowTray({ x, count }: { x:number; count:number }) {
  return <group position={[x,1.73,-8.13]}>
    <Rail at={[0,0.055,0]} size={[0.48,0.11,0.31]} color="#455651"/>
    <SurfaceBlock at={[0,0.114,0]} size={[0.44,0.013,0.27]} finish="loam" tile={0.38}/>
    <Rail at={[0,0.067,0.169]} size={[0.18,0.029,0.03]} color="#496789"/>
    {Array.from({length:count},(_,i)=>{
      const px=Math.cos(i*2.4)*(0.067+0.013*i),pz=Math.sin(i*2.4)*0.085;
      const h=0.085+(i%3)*0.047, r=0.041+(i%4)*0.007;
      return <group key={i} position={[px,0.118,pz]} rotation-z={Math.sin(i)*0.21}>
        <mesh position-y={h/2} material={mat('#dfcfb1')}><cylinderGeometry args={[0.013,0.021,h,7]}/></mesh>
        <mesh position-y={h} scale-y={0.75} material={mat(i%2?'#a76534':'#c98a4c')}><sphereGeometry args={[r,12,5,0,Math.PI*2,0,Math.PI/2]}/></mesh>
      </group>;
    })}
  </group>;
}
export function GrowRoom({ glazing }: { glazing:boolean }) {
  return <>
    <SolidSurfaces>
      <SurfaceBlock at={[7,0.6,-8.94]} size={[8.0,1.2,0.3]} finish="brick" color="#d6c0a2" tile={1.7}/>
      {[4.48,10.02].map((x,i)=><SurfaceBlock key={x} at={[x,1.88,-8.95]} size={[i?1.8:2.6,1.39,0.31]} finish="brick" color="#d5c2a3" tile={1.7}/>)}
      <SurfaceBlock at={[7.36,1.23,-8.71]} size={[3.5,0.1,0.44]} finish="cedar"/>
      <SurfaceBlock at={[7,2.68,-8.91]} size={[7.98,0.18,0.32]} finish="cedar"/>
      {[5.82,6.41,7.05,7.69,8.32,9.02].map(x=><Rail key={x} at={[x,1.93,-8.81]} size={[0.035,1.4,0.08]}/>)}
      <Rail at={[7.42,2.12,-8.81]} size={[3.26,0.037,0.08]}/>
      <Rail at={[7,3.48,-5.5]} size={[0.11,0.12,6.95]}/>
      {[-8.82,-7.22,-5.52,-3.81,-2.17].map(z=><group key={z}>
        {[-1,1].map(side=><Rail key={side} at={[7+side*1.93,3.11,z]} size={[3.95,0.085,0.085]} tilt={-side*0.201}/>)}
      </group>)}
      {[-8.82,-7.15,-5.48,-3.81,-2.17].map(z=>[3.24,10.76].map(x=><Rail key={x+'/'+z} at={[x,1.6,z]} size={[0.066,2.22,0.066]}/>))}
      {[4.22,6.48].map(x=>[-8.52,-7.94].map(z=><Rail key={x+'/'+z} at={[x,1.45,z]} size={[0.055,2.84,0.055]} color="#8e7351"/>))}
      {[1.68,2.6].map(y=><SurfaceBlock key={y} at={[5.35,y,-8.23]} size={[2.34,0.07,0.65]} finish="cedar"/> )}
      {[4.68,5.23,5.79,6.19].map((x,i)=><GrowTray key={x} x={x} count={2+i*2}/>)}
      <Rail at={[5.35,2.50,-8.19]} size={[1.95,0.084,0.22]} color="#494d43"/>
      <Rail at={[9.95,0.47,-8.24]} size={[0.95,0.89,0.82]} color="#cbc6ad"/>
      <Rail at={[9.95,0.51,-7.815]} size={[0.78,0.52,0.036]} color="#545850"/>
      <Rail at={[9.95,0.52,-7.788]} size={[0.65,0.37,0.018]} color="#313836"/>
      <Rail at={[9.95,0.79,-7.775]} size={[0.69,0.037,0.06]} color="#968e79"/>
      {[9.72,10.15].map(x=>[-8.04,-8.43].map(z=><mesh key={x+'/'+z} position={[x,0.932,z]} rotation-x={Math.PI/2} material={mat('#4a463d')}><torusGeometry args={[0.113,0.019,5,14]}/></mesh>))}
      {[6.66,6.85].map((x,i)=><group key={x} position={[x,1.06,-8.43]}>
        <mesh position-y={0.094} material={mat(i?'#8c7352':'#667a69')}><cylinderGeometry args={[0.066,0.066,0.188,12]}/></mesh>
        <mesh position-y={0.202} material={mat('#5c5b4d')}><cylinderGeometry args={[0.07,0.07,0.023,12]}/></mesh>
      </group>)}
      <Rail at={[6.65,1.05,-8.02]} size={[0.41,0.06,0.28]} color="#706949"/>
      <Rail at={[6.65,1.09,-8.02]} size={[0.37,0.024,0.26]} color="#b7a781"/>
    </SolidSurfaces>
    <mesh position={[5.35,2.449,-8.19]} rotation-x={Math.PI/2}>
      <planeGeometry args={[1.85,0.16]}/><meshBasicMaterial color="#ffdd95" side={DoubleSide}/>
    </mesh>
    {glazing && [-1,1].map(side=><mesh key={side} position={[7+side*1.93,3.12,-5.5]} rotation={[-Math.PI/2,side*0.201,0]}>
      <planeGeometry args={[3.94,6.84]}/><meshLambertMaterial color="#a6c7be" side={DoubleSide} transparent opacity={0.105} depthWrite={false}/>
    </mesh>)}
  </>;
}
