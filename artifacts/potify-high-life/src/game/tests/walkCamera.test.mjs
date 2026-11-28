import assert from 'node:assert/strict';
import test from 'node:test';
import {movementBasis,newWalkHeading,sampleWalking,followWalking,angleDelta} from '../walkCamera.ts';

test('walk pans toward accepted travel with stable world-space steering',()=>{
 const s=newWalkHeading(); let yaw=0;
 for(let i=0;i<110;i++){
  assert.equal(movementBasis(s,1,0,yaw,false),0);
  sampleWalking(s,.08,0,1/60); yaw=followWalking(s,yaw,1/60);
 }
 assert.ok(yaw>1.48 && yaw<=Math.PI/2);
});
test('blocked movement does not drag the camera away and manual aim relatches',()=>{
 const s=newWalkHeading(); movementBasis(s,1,0,0,false);sampleWalking(s,.3,0,.16);
 assert.ok(followWalking(s,0,.02)>0);
 sampleWalking(s,0,0,.02);assert.equal(followWalking(s,0,.02),0);
 assert.equal(movementBasis(s,1,0,.8,true),.8);
 assert.equal(movementBasis(s,0,0,1.2,false),1.2);
 assert.equal(movementBasis(s,1,0,1.2,false),1.2);
});
test('shortest turn crosses the angle seam',()=>{
 const s=newWalkHeading();const yaw=Math.PI-.05;
 movementBasis(s,0,-1,yaw,false);
 sampleWalking(s,-.035,1,.2);
 assert.ok(angleDelta(s.heading,yaw)>0);
 assert.ok(followWalking(s,yaw,.03)>yaw);
});
