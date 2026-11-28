import { LeaseApartment, LoftWindows, WindowLight } from './LeaseApartment';
import { apartmentDaylight } from './apartmentLighting';
import { SurfaceBlock } from './Surfaces';
import { SolidSurfaces } from './SolidSurfaces';
import { useRef } from 'react';
import { DoubleSide, LatheGeometry, Quaternion, Vector2, Vector3 } from 'three';
import { useTexture } from '@react-three/drei';
import housePrint from '../../../../docs/marketing/assets/2026-11-08-potify-city-concept.jpg';
import { useG, useUI } from '@/game/runtime';
import { PEOPLE, NEIGHBORS, STOREY, STAIR_START, TURN, floorName, houseDate, childStage } from '@/game/house';
import { residentX } from '@/game/house';
import { hasFourthMugSupper, type MugChoice } from '@/game/fourthMug';
import { hasLandingBoard } from '@/game/notices';
import { personFloor } from '@/game/towerWorld';
import { mat, signTex, windowMat } from './materials';
import { Character } from './Character';
import { CanalSkyline } from './CanalSkyline';

function Box({
  at,
  size,
  color,
}: {
  at: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={at} material={mat(color)} receiveShadow castShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}
function Sign({
  text,
  x,
  y,
  z,
  w = 3,
  h = 0.45,
}: {
  text: string;
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
}) {
  return (
    <mesh position={[x, y, z]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial side={DoubleSide} map={signTex(text, '#344339', '#f6db9b', 384, 80)} />
    </mesh>
  );
}
function CampaignPrint() {
  const print = useTexture(housePrint);
  return <group position={[-8.54,1.85,-3.65]} rotation-y={Math.PI/2}>
    <SurfaceBlock at={[0,0,0]} size={[1.46,0.98,0.06]} finish="cedar" />
    <mesh position-z={0.035}><planeGeometry args={[1.35,0.875]}/><meshLambertMaterial map={print}/></mesh>
  </group>;
}
type RailPoint = [number, number, number];
const railCrown = '#473628';
const railMetal = '#344942';

function RailBeam({ from, to, size, color }: {
  from: RailPoint;
  to: RailPoint;
  size: [number, number];
  color: string;
}) {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction.normalize());
  return (
    <mesh position={start.lerp(end, 0.5)} quaternion={quaternion} material={mat(color)} castShadow receiveShadow>
      <boxGeometry args={[...size, length + 0.035]} />
    </mesh>
  );
}

// Finished oak grips sit on iron posts. Keep all pieces at the edges of the
// existing treads, with the midpoint crossover and both hall entrances open.
function StairRails() {
  const half = STOREY / 2;
  const guard = 0.91;
  const sides: [number, number][] = [[2.85, 5.34], [5.71, 8.23]];
  return <>
    {sides.map(([outer, inner], i) => [outer, inner].map(x => {
      const hall = i === 0 ? STOREY : 0;
      return <group key={x}>
        <RailBeam from={[x, hall + guard, STAIR_START]} to={[x, half + guard, TURN]} size={[0.114, 0.105]} color={railCrown} />
        <RailBeam from={[x, hall + 0.29, STAIR_START]} to={[x, half + 0.29, TURN]} size={[0.042, 0.045]} color={railMetal} />
        {Array.from({ length: 10 }, (_, n) => {
          const t = n / 9;
          const z = STAIR_START + (TURN - STAIR_START) * t;
          const y = hall + (half - hall) * t;
          const newel = n === 0 || n === 9;
          const width = newel ? 0.102 : 0.043;
          return <group key={n}>
            <Box at={[x, y + 0.39, z]} size={[width, 0.94, width]} color={railMetal} />
            {newel && <Box at={[x, y + guard, z]} size={[0.145, 0.12, 0.145]} color={railCrown} />}
          </group>;
        })}
      </group>;
    }))}
    {([[2.85, TURN, 2.85, -5.87], [8.23, TURN, 8.23, -5.87], [2.85, -5.87, 8.23, -5.87]] as const).map(([x, z, ex, ez], i) => (
      <group key={i}>
        <RailBeam from={[x, half + guard, z]} to={[ex, half + guard, ez]} size={[0.114, 0.105]} color={railCrown} />
        <RailBeam from={[x, half + 0.29, z]} to={[ex, half + 0.29, ez]} size={[0.042, 0.045]} color={railMetal} />
        {Array.from({ length: i === 2 ? 11 : 5 }, (_, n) => {
          const t = (n + 1) / (i === 2 ? 12 : 5);
          return <Box key={n} at={[x + (ex - x) * t, half + 0.43, z + (ez - z) * t]} size={[0.05, 0.89, 0.05]} color={railMetal} />;
        })}
      </group>
    ))}
  </>;
}

function Stairwell() {
  const run = STAIR_START - TURN,
    steps = 10,
    half = STOREY / 2;
  return (
    <SolidSurfaces>
      {[false, true].map((left) => (
        <group key={String(left)}>
          {Array.from({ length: steps }, (_, i) => {
            const height = left ? STOREY - (half * (i + 0.5)) / steps : (half * (i + 0.5)) / steps;
            return (
              <Box
                key={i}
                at={[left ? 4.1 : 6.95, height - 0.095, STAIR_START - ((i + 0.5) * run) / steps]}
                size={[2.62, 0.19, run / steps + 0.02]}
                color={i === 0 || i === 9 ? '#ac9569' : '#877c6c'}
              />
            );
          })}
        </group>
      ))}
      <StairRails />
      <Box at={[5.52, half - 0.12, -4.82]} size={[5.9, 0.24, 2.37]} color="#918675" />
      <Box at={[4.1, STOREY - 0.12, 1.55]} size={[2.65, 0.24, 1.1]} color="#827767" />
    </SolidSurfaces>
  );
}
function Doors({ floor }: { floor: number }) {
  return (
    <>
      {[-6.7, -3.6, -0.6].map((x, i) => (
        <group key={x} position={[x, 0, -5.4]}>
          <Box at={[0, 1.2, 0]} size={[1.65, 2.4, 0.18]} color={['#76674e', '#586e62', '#786456'][i]} />
          <Sign text={floor + String.fromCharCode(65 + i)} x={0} y={1.8} z={0.105} w={0.7} h={0.34} />
          <Box at={[0.56, 1.03, 0.18]} size={[0.24, 0.06, 0.1]} color="#d1b47c" />
        </group>
      ))}
    </>
  );
}

const mugProfile = [
  new Vector2(0, 0.006), new Vector2(0.098, 0.006), new Vector2(0.127, 0.055),
  new Vector2(0.135, 0.214), new Vector2(0.13, 0.228), new Vector2(0.115, 0.228),
  new Vector2(0.11, 0.2), new Vector2(0.096, 0.043), new Vector2(0, 0.043),
];
const plateProfile = [
  new Vector2(0, 0.003), new Vector2(0.14, 0.003), new Vector2(0.24, 0.03),
  new Vector2(0.24, 0.048), new Vector2(0.215, 0.049), new Vector2(0.145, 0.022), new Vector2(0, 0.022),
];

function chipMugRim(geometry: LatheGeometry) {
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const height = mugProfile[i % mugProfile.length].y;
    if (height < 0.2) continue;
    const angle = Math.atan2(positions.getX(i), positions.getZ(i));
    const depth = Math.max(0, 1 - Math.abs(angle - Math.PI / 5) / 0.48);
    positions.setY(i, height - 0.056 * depth);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

function KitchenMug({ color, chipped = false }: { color: string; chipped?: boolean }) {
  return <group scale={chipped ? 1.25 : 1}>
    <mesh material={mat(color)} castShadow receiveShadow>
      <latheGeometry args={[mugProfile, 20]} onUpdate={chipped ? chipMugRim : undefined} />
    </mesh>
    <mesh position={[0.146, 0.122, 0]} scale={[0.85, 1.06, 1]} material={mat(color)} castShadow receiveShadow>
      <torusGeometry args={[0.079, 0.022, 5, 12]} />
    </mesh>
  </group>;
}

function SupperTable({ afterSupper, later }: { afterSupper: boolean; later?: MugChoice }) {
  const blueOnTable = afterSupper && later !== 'tea';
  return <group name="KitchenSupperTable" position={[-6.38, 0, 2.68]}>
    <SolidSurfaces revision={String(blueOnTable)}>
      <SurfaceBlock at={[0, 0.79, 0]} size={[3.24, 0.12, 1.3]} finish="cedar" tile={1.5} />
      {[-1.14, 1.14].map(x => <group key={x}>
        <Box at={[x, 0.41, 0]} size={[0.18, 0.65, 0.34]} color="#786446" />
        <Box at={[x, 0.09, 0]} size={[0.25, 0.12, 0.96]} color="#786446" />
      </group>)}
      <Box at={[0, 0.25, 0]} size={[2.5, 0.12, 0.1]} color="#715b40" />
      <Box at={[0, 0.856, 0]} size={[3.19, 0.012, 0.29]} color="#ae986b" />
      <group name="SpareKitchenChair" position={[1.05, 0, 0.44]}>
        <Box at={[0, 0.44, 0]} size={[0.52, 0.07, 0.43]} color="#647567" />
        {[-0.2, 0.2].map(x => <group key={x}>
          <Box at={[x, 0.22, -0.16]} size={[0.055, 0.44, 0.055]} color="#6d604b" />
          <Box at={[x, 0.48, 0.19]} size={[0.055, 0.96, 0.055]} color="#6d604b" />
        </group>)}
        <Box at={[0, 0.91, 0.19]} size={[0.47, 0.12, 0.056]} color="#687b6a" />
      </group>
      {([
        [-1.03, -0.29, '#a36b4d'], [0.40, -0.29, '#7b8467'], [-0.84, 0.3, '#d6bb8e'],
      ] as const).map(([x, z, glaze]) => <group key={x} position={[x, 0.855, z]}>
        <mesh material={mat('#dfd2b1')} castShadow receiveShadow><latheGeometry args={[plateProfile, 20]} /></mesh>
        <group position={[0.41, 0.007, 0]} rotation-y={z < 0 ? -0.4 : 0.6}><KitchenMug color={glaze} /></group>
      </group>)}
      {blueOnTable && <group name="ChippedBlueMug" position={[1.18, 0.852, 0.3]}>
        <KitchenMug color="#4b84ab" chipped />
      </group>}
    </SolidSurfaces>
  </group>;
}

function SupperCounter({ later }: { later?: MugChoice }) {
  return <SolidSurfaces revision={later ?? ''}>
    <group position={[-2.12, 1.02, -4.48]}>
      <mesh position-y={0.16} material={mat('#829388')} castShadow receiveShadow>
        <cylinderGeometry args={[0.166, 0.156, 0.32, 12]} />
      </mesh>
      <mesh position-y={0.33} material={mat('#baa882')} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.033, 12]} />
      </mesh>
      {later === 'please' && <group position={[0.2, 0.12, 0.02]} rotation={[-0.23, -0.25, -0.25]}>
        <Box at={[0, 0, 0]} size={[0.25, 0.22, 0.026]} color="#e6c88b" />
        <Box at={[0, 0.07, 0.017]} size={[0.22, 0.026, 0.015]} color="#b9945f" />
        <Box at={[0, 0.046, 0.028]} size={[0.34, 0.014, 0.016]} color="#826146" />
      </group>}
    </group>
    <Box at={[-2.34, 2.05, -5.44]} size={[0.14, 0.14, 0.11]} color="#786348" />
    <Box at={[-2.34, 2.05, -5.28]} size={[0.046, 0.046, 0.29]} color="#a18e65" />
    {later === 'tea' && <>
      <group position={[-2.48, 1.885, -5.22]} rotation-z={0.2}><KitchenMug color="#4b84ab" chipped /></group>
      <group position={[-1.52, 1.025, -4.48]}>
        <KitchenMug color="#bcae83" />
        <mesh position-y={0.256} rotation-x={Math.PI} scale={0.74} material={mat('#e2d9bf')} castShadow receiveShadow>
          <latheGeometry args={[plateProfile, 20]} />
        </mesh>
      </group>
    </>}
  </SolidSurfaces>;
}

function Room({ floor, archive }: { floor: number; archive: boolean }) {
  const firstProject = useG(s => s.projects[0]);
  const albums = useG((s) => Object.keys(s.life.festivals).length);
  const family = useG((s) => s.life);
  const day = useG((s) => s.day);
  const laterMugChoice = family.fourthMug && day > family.fourthMug.day ? family.fourthMug.choice : undefined;
  const still = useRef(0);
  if (floor === 7)
    return (
      <>
        <LeaseApartment />
        <CampaignPrint />
        {Array.from({ length: Math.min(4, albums) }, (_, i) => (
          <Box
            key={i}
            at={[-4.8 + i * 0.5, 1.56, -5.45]}
            size={[0.36, 0.38, 0.07]}
            color={['#90aa75', '#d1ac69', '#ba7654', '#9eb4bd'][i]}
          />
        ))}
        <Box at={[-7.6, 0.6, 0.6]} size={[0.9, 1.2, 0.66]} color="#685340" />
        <Box at={[-7.6, 1.32, 0.6]} size={[0.68, 0.3, 0.45]} color="#9f845b" />
        {family.partner && <Box at={[-2.9, 1.15, -4.75]} size={[0.2, 0.28, 0.2]} color="#739195" />}
        {family.child && (
          <group
            position={[-3, 0, 0.45]}
            scale={
              childStage(day, family.child.arrival) === 'Little one'
                ? 0.45
                : childStage(day, family.child.arrival) === 'Grown up'
                  ? 1
                  : 0.72
            }
          >
            <Character variant="player" shirt="#7d8fa1" hair="#574332" skin="#bd9176" speed={still} />
          </group>
        )}
      </>
    );
  if (floor === 4)
    return (
      <>
        <SupperTable afterSupper={hasFourthMugSupper(family.festivals)} later={laterMugChoice} />
        <SupperCounter later={laterMugChoice} />
        <Box at={[-4.5, 0.51, -4.86]} size={[7.6, 1.02, 1.25]} color="#9d8f72" />
        {[-7.2, -6, -4.8, -3.6, -2.4].map((x, i) => (
          <mesh key={x} position={[x, 1.2, -4.85]} material={mat(i % 2 ? '#a76740' : '#617763')}>
            <cylinderGeometry args={[0.35, 0.26, 0.35, 12]} />
          </mesh>
        ))}
        {firstProject === 'glasshouse' && (
          <group name="MossKitchenTransom" position={[-6.95, 2.06, -5.35]}>
            <Box at={[0, 0, 0]} size={[1.43, .94, .10]} color="#715238" />
            <Box at={[0, 0, .065]} size={[1.27, .78, .055]} color="#82aa8a" />
            <Box at={[.33, 0, .10]} size={[.045, .80, .045]} color="#bfa37b" />
          </group>
        )}
        <Sign text="SUPPER CLUB" x={-4.3} y={2.28} z={-5.47} />
      </>
    );
  if (floor === 12)
    return (
      <>
        <Box at={[-5.3, 1.3, -3]} size={[0.21, 2.6, 5]} color="#77634d" />
        <Box at={[-7.95, 0.67, -0.45]} size={[1.3, 1.34, 0.18]} color="#80684e" />
        {!archive && <Box at={[-6.25, 1.02, -0.45]} size={[2.1, 2.04, 0.17]} color="#657365" />}
        <Box at={[-4.3, 0.58, -4.73]} size={[8, 1.16, 1.05]} color="#7a573f" />
        {[-6.8, -2.1].map((x) => (
          <group key={x}>
            <Box at={[x, 1.28, -4.68]} size={[1.4, 0.17, 0.84]} color="#393c3d" />
            <mesh position={[x, 1.39, -4.68]} material={mat('#26292a')}>
              <cylinderGeometry args={[0.36, 0.36, 0.035, 20]} />
            </mesh>
          </group>
        ))}
        <Sign text="CANAL   FM" x={-2.5} y={2.25} z={-5.47} />
      </>
    );
  if (floor === 18 || floor === 1)
    return (
      <>
        <Box at={[-4.4, 0.64, -4.75]} size={[7.5, 1.28, 1.12]} color={floor === 1 ? '#976d4e' : '#717a6d'} />
        {Array.from({ length: 12 }, (_, i) => (
          <Box
            key={i}
            at={[-7.2 + (i % 6) * 1.05, 1.55 + Math.floor(i / 6) * 0.47, -5.27]}
            size={[0.86, 0.38, 0.42]}
            color={i % 3 === 0 ? '#a18a60' : '#746b54'}
          />
        ))}
        <Sign
          text={floor === 1 ? 'CANOPY HOUSE   /   NIGHT DESK' : 'CANAL WORKS   /   ARCHIVE'}
          x={-4}
          y={2.55}
          z={-5.47}
          w={5}
        />
      </>
    );
  if (floor === 21)
    return (
      <>
        <Box at={[-4.55, 0.5, -4.8]} size={[7.6, 1, 1.3]} color={family.commons ? '#9c7951' : '#776f61'} />
        <Sign
          text={
            family.commons === 'seeds'
              ? 'SEED EXCHANGE'
              : family.commons === 'tapes'
                ? 'TAPE LIBRARY'
                : 'RESIDENTS’ MEETING'
          }
          x={-4.4}
          y={2.13}
          z={-5.28}
          w={4.3}
        />
        {family.commons === 'seeds' &&
          [-7, -6.35, -5.7, -4.6, -3.95, -3.3, -2.65].map((x) => (
            <Box key={x} at={[x, 1.22, -4.7]} size={[0.35, 0.45, 0.1]} color="#dfc389" />
          ))}
        {family.commons === 'tapes' &&
          [-6, -4.5, -3].map((x) => (
            <group key={x}>
              <Box at={[x, 1.42, -4.75]} size={[1.1, 0.83, 0.36]} color="#474b47" />
              <mesh position={[x, 1.46, -4.545]} rotation-x={Math.PI / 2} material={mat('#aaa083')}>
                <cylinderGeometry args={[0.28, 0.28, 0.05, 14]} />
              </mesh>
            </group>
          ))}
      </>
    );
  if (floor === 24)
    return (
      <>
        <Box at={[-4.6, 0.37, -4.75]} size={[7.6, 0.74, 1.35]} color="#7b6245" />
        {[-7.5, -6.3, -5.1, -3.9, -2.7, -1.6].map((x, i) => (
          <group key={x}>
            <Box at={[x, 0.99, -4.75]} size={[0.09, 0.65, 0.1]} color="#607447" />
            <mesh position={[x, 1.43, -4.75]} material={mat(i % 2 ? '#739466' : '#54765c')}>
              <icosahedronGeometry args={[0.58, 0]} />
            </mesh>
          </group>
        ))}
        <Sign text="WEST   /   SKY GARDEN" x={-4.2} y={2.6} z={-5.47} w={4.3} />
      </>
    );
  return <Doors floor={floor} />;
}

export function Tower() {
  const floor = useUI((s) => s.floor);
  const life = useG((s) => s.life);
  const minute = useG((s) => Math.floor(s.minute / 30) * 30);
  const day = useG((s) => s.day);
  const date = houseDate(day);
  const still = useRef(0);
  const lastBloom = Object.entries(life.festivals)
    .filter(([key]) => Number(key) % 4 === 0)
    .at(-1)?.[1];
  return (
    <>
      <group scale={[1.4, 2.15, 1.4]}>
        <CanalSkyline />
      </group>
      <group position-y={(floor - 1) * STOREY}>
        <Box at={[-3.04, -0.13, -0.15]} size={[11.38, 0.26, 11.58]} color="#988978" />
        <Box at={[5.55, -0.14, 3.42]} size={[5.9, 0.28, 4.84]} color="#8e8374" />
        <SurfaceBlock at={[-3.04,-0.024,-0.15]} size={[11.38,0.065,11.58]} finish="cedar" color="#c9bda7" tile={2.4}/>
        {floor === 7 && <WindowLight strength={apartmentDaylight(minute)}/>}
        {hasLandingBoard(floor) && (
          <group position={[-5.15, floor === 1 ? 1.8 : 1.7, floor === 1 ? -4.53 : -5.32]}>
            <Box at={[0, 0, 0]} size={[1.12, 0.86, 0.09]} color="#9b794e" />
            <Sign text="HOUSE NOTES" x={0} y={0.27} z={0.055} w={1.07} h={0.22} />
            {[-0.23, 0.2].map((x, i) => <group key={x} rotation-z={i ? -0.05 : 0.04}>
              <Box at={[x, -0.07, 0.06]} size={[0.33, 0.39, 0.015]} color={i ? '#e5ca93' : '#f6e8ca'} />
              <Box at={[x, 0.09, 0.08]} size={[0.045, 0.045, 0.02]} color="#596d4a" />
            </group>)}
          </group>
        )}
        <LoftWindows apartment={floor === 7}/>
        <Box at={[-8.66, 0.49, -0.1]} size={[0.19, 0.98, 11.55]} color="#82765e" />
        {[-5.65, -2.9, -0.15, 2.6, 5.35].map((z) => (
          <Box key={z} at={[-8.64, 1.81, z]} size={[0.12, 2.5, 0.1]} color="#52655b" />
        ))}
        <Box at={[-8.64, 2.83, -0.15]} size={[0.12, 0.1, 11.54]} color="#52655b" />
        <Box at={[0.75, 1.4, 1.6]} size={[1.9, 2.8, 0.32]} color="#4b5d53" />
        {[-0.43, 0.43].map((x) => (
          <Box key={x} at={[0.75 + x, 1.16, 1.8]} size={[0.82, 2.28, 0.09]} color="#8c9486" />
        ))}
        <Sign text={'LIFT   /   ' + floor} x={0.75} y={2.56} z={1.79} w={1.5} h={0.3} />
        <Sign
          text={String(floor).padStart(2, '0') + '   /   ' + floorName(floor).toUpperCase()}
          x={-0.6}
          y={2.69}
          z={-5.46}
          w={3.2}
        />
        <Box at={[2.64, 0.53, -2.44]} size={[0.18, 1.07, 6.92]} color="#86765b" />
        <mesh position={[7, 0.025, 1.85]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.6, 0.6]} />
          <meshBasicMaterial map={signTex('UP  ↑', '#4f6252', '#f3d694')} />
        </mesh>
        {floor > 1 && (
          <mesh position={[4.1, 0.025, 1.95]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[1.7, 0.6]} />
            <meshBasicMaterial map={signTex('DOWN  ↑', '#4f6252', '#f3d694')} />
          </mesh>
        )}
        <Stairwell />
        {floor > 1 && (
          <group position-y={-STOREY}>
            <Stairwell />
          </group>
        )}
        {floor === 24 &&
          lastBloom !== undefined &&
          [-6, -4.5, -3, -1.5].map((x) => (
            <mesh key={x} position={[x, 1.88, -4.75]} material={mat(lastBloom === 1 ? '#b46449' : '#e5d8a4')}>
              <icosahedronGeometry args={[0.2, 0]} />
            </mesh>
          ))}
        <Room floor={floor} archive={life.archiveOpen} />
        {floor === 1 || floor === 24 ? (
          <group position={[-6, 0, 5.25]}>
            <Box at={[-1.25, 1.28, 0]} size={[0.15, 2.56, 0.22]} color="#536252" />
            <Box at={[1.25, 1.28, 0]} size={[0.15, 2.56, 0.22]} color="#536252" />
            <Sign
              text={floor === 1 ? 'TO THE STREET' : 'ROOF GARDEN'}
              x={0}
              y={2.57}
              z={0}
              w={2.65}
              h={0.4}
            />
          </group>
        ) : null}
        {NEIGHBORS.filter((id) => personFloor(id, { day, minute, life }) === floor).map((id) => (
          <group key={id} position={[residentX(id), 0, -1.35]}>
            <Character
              variant={id === 'tessa' ? 'mira' : id === 'jax' ? 'moss' : 'jun'}
              {...PEOPLE[id]}
              speed={still}
            />
          </group>
        ))}
        {floor === date.festival.floor && (
          <group position={[-2, 0, 1.2]}>
            <Box at={[0, 0.54, 0]} size={[0.95, 1.08, 0.35]} color="#896d4a" />
            <Sign text={date.festival.title.toUpperCase()} x={0} y={1.12} z={0.19} w={1.6} h={0.44} />
            {date.active &&
              [-0.9, -0.3, 0.3, 0.9].map((x) => (
                <mesh key={x} position={[x, 1.92 + Math.abs(x) * 0.2, 0]} material={mat(date.festival.color)}>
                  <octahedronGeometry args={[0.19]} />
                </mesh>
              ))}
          </group>
        )}
        {[3.2, 5.7, 8.2].map((x) => (
          <mesh key={x} position={[x, 2, -5.85]} material={windowMat}>
            <boxGeometry args={[0.075, 3.5, 0.1]} />
          </mesh>
        ))}
      </group>
    </>
  );
}
