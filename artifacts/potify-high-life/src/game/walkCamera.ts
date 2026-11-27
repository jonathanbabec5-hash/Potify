export const WALK_DEADZONE = .08;
export function angleDelta(to:number, from:number) {
  return Math.atan2(Math.sin(to-from), Math.cos(to-from));
}
export type WalkHeading = { active:boolean; input:number; basis:number; time:number; heading:number; moving:boolean };
export function newWalkHeading():WalkHeading {
  return {active:false,input:0,basis:0,time:0,heading:0,moving:false};
}
// Keep one world-space reference for a held stick/key direction. Using the
// automatically evolving visual yaw here would spiral the walking path.
export function movementBasis(s:WalkHeading,x:number,z:number,yaw:number,manual:boolean) {
  const len=Math.hypot(x,z);
  if(len<=WALK_DEADZONE){s.active=false;s.time=0;s.moving=false;return yaw;}
  const input=Math.atan2(x,-z);
  if(!s.active||manual||Math.abs(angleDelta(input,s.input))>.54){
    s.active=true;s.input=input;s.basis=yaw;s.time=0;
  }
  return s.basis;
}
export function sampleWalking(s:WalkHeading,dx:number,dz:number,dt:number) {
  if(Math.hypot(dx,dz)<.02*dt) {s.moving=false;s.time=0;return;}
  const aim=Math.atan2(dx,-dz);
  if(s.moving && Math.abs(angleDelta(aim,s.heading))>.70) s.time=0;
  s.heading=aim;s.moving=true;s.time+=dt;
}
export function followWalking(s:WalkHeading,yaw:number,dt:number) {
  if(!s.active||!s.moving||s.time<.12) return yaw;
  const delta=angleDelta(s.heading,yaw);
  if(Math.abs(delta)<.014) return yaw;
  const max=1.9*dt;
  return yaw + Math.max(-max,Math.min(max,delta * (1-Math.exp(-dt*4.25))));
}
