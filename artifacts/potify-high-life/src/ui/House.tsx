import { useState } from 'react';
import { game } from '@/game/store';
import { closeModal, openModal, toast, useG, useUI, type Modal } from '@/game/runtime';
import { teleport } from '@/game/interact';
import { RECORD_TITLE, restartRecord, sfx } from '@/game/audio';
import {
  NEIGHBORS,
  FRIEND_SCENES,
  FESTIVALS,
  FLOOR_NAMES,
  PASTIMES,
  PEOPLE,
  TOP_FLOOR,
  childStage,
  favorite,
  floorName,
  houseDate,
  type Neighbor,
  type Pastime,
} from '@/game/house';
import { MUG_SCENE, fourthMugRecollection, type MugChoice } from '@/game/fourthMug';
import { landingNotice, townNotices } from '@/game/notices';
import { Sheet } from './common';

type Room = Extract<Modal, { type: 'house' }>['room'];
const button = 'chunk bg-butter px-4 py-3 text-left';
function Notices({ town, floor }: { town: boolean; floor: number }) {
  const notices = useG(s => town ? townNotices(s) : [landingNotice(floor, s)]);
  return (
    <div className="grid gap-3">
      {notices.map(note => note && (
        <article key={note.title} className="border-l-4 border-jade bg-[#f6ebd1] px-4 py-3 text-[#342f25]">
          <h3 className="font-display text-xl leading-tight">{note.title}</h3>
          <p className="my-2 leading-relaxed">{note.body}</p>
          <p className="text-sm font-bold text-[#49563b]">— {note.signed}</p>
        </article>
      ))}
      {town && <button className={button} onClick={() => openModal({ type: 'map' })}>Open neighborhood map</button>}
    </div>
  );
}

function Lift() {
  const current = useUI((s) => s.floor);
  const go = (floor: number) => {
    closeModal();
    if (floor === 0) teleport('town', 80, 13.1, Math.PI);
    else if (floor > TOP_FLOOR) teleport('roof', 7.2, 9.9, -Math.PI / 2);
    else teleport('tower', 0.75, 2.9, Math.PI, floor);
  };
  return (
    <>
      <p className="mb-3">
        The right-hand flight goes up. Turn left at the window and follow the second flight back to the hall.
        To ride, choose a stop below.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(FLOOR_NAMES).map(([n, label]) => (
          <button
            key={n}
            className={button}
            disabled={current === +n}
            data-testid={'ride-' + n}
            onClick={() => go(+n)}
          >
            {n} · {label}
          </button>
        ))}
        <button className={button} data-testid="ride-roof" onClick={() => go(25)}>
          R · Rooftop beds
        </button>
        <button className={button} data-testid="ride-street" onClick={() => go(0)}>
          G · Canopy Quarter
        </button>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer py-2 font-bold">Residential landings</summary>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 24 }, (_, i) => i + 1)
            .filter((i) => !FLOOR_NAMES[i])
            .map((i) => (
              <button key={i} className={button} disabled={i === current} onClick={() => go(i)}>
                {i}
              </button>
            ))}
        </div>
      </details>
    </>
  );
}

export function NeighborVisit({ id, line }: { id: Neighbor; line: string }) {
  const life = useG((s) => s.life),
    [confirm, setConfirm] = useState(false);
  const person = PEOPLE[id],
    visits = life.visits[id];
  const scene = FRIEND_SCENES[id],
    memory = life.moments[id];
  return (
    <Sheet title={person.name} kicker={person.role} accent="bg-jade" test="modal-neighbor">
      <blockquote className="font-display text-xl leading-relaxed">
        {life.partner === id ? person.together : line}
      </blockquote>
      <p className="text-sm mt-3">
        {visits} {visits === 1 ? 'day' : 'days'} spent together ·{' '}
        {life.partner === id ? 'Your partner' : visits >= 3 ? 'Trusted friend' : 'Getting acquainted'}
      </p>
      {id === 'jax' && visits >= 3 && !life.archiveOpen && (
        <p className="mt-2">Jax slips you the archive key. The cabinet is on 18.</p>
      )}
      {visits >= 3 && (
        <section className="mt-4 border-t border-ink/20 pt-3">
          <h3 className="font-display text-xl">{scene.title}</h3>
          <p className="mt-2">{memory === undefined ? scene.detail : scene.replies[memory]}</p>
          {memory === undefined && (
            <div className="grid gap-2 mt-3">
              {scene.answers.map((answer, i) => (
                <button
                  key={answer}
                  className={button}
                  data-testid={'moment-' + i}
                  onClick={() => {
                    if (game.shareMoment(id, i as 0 | 1)) sfx.talk();
                  }}
                >
                  {answer}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      {!life.partner && memory !== undefined && visits >= 5 && (
        <div className="mt-4">
          {confirm && (
            <p className="mb-2">
              Ask {person.name.split(' ')[0]} to become your partner and move into 7B. You can also keep this
              friendship as it is.
            </p>
          )}
          <button
            className={button}
            data-testid="invite-partner"
            onClick={() => {
              if (!confirm) {
                setConfirm(true);
                return;
              }
              if (game.invitePartner(id)) {
                sfx.talk();
                toast('Two names on the door of 7B.');
              }
            }}
          >
            {confirm ? 'Invite them to share your life' : 'Talk about a future together'}
          </button>
          {confirm && (
            <button className="ml-3 underline" onClick={() => setConfirm(false)}>
              Keep talking as friends
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

const familyOutings: Record<Pastime, string[]> = {
  Music: [
    'Hum over the kettle',
    'Tap rhythms on the window',
    'Make a kitchen recording',
    'Trade a favorite record',
  ],
  Cooking: [
    'Sing while supper simmers',
    'Mix the pancake batter',
    'Cook for the landing',
    'Plan the Friday supper',
  ],
  Making: ['Hang a paper mobile', 'Fold a paper boat', 'Build a little radio', 'Fix the lamp together'],
};
function Album() {
  const life = useG((s) => s.life),
    day = useG((s) => s.day),
    [name, setName] = useState('');
  const c = life.child,
    stage = c ? childStage(day, c.arrival) : null;
  const stageIndex = ['Little one', 'Curious kid', 'School years', 'Teen years'].indexOf(stage ?? '');
  const stamps = Object.entries(life.festivals).reverse();
  return (
    <>
      <h3 className="font-display text-xl">Home, year {houseDate(day).year}</h3>
      <p className="mt-2">
        {life.partner
          ? PEOPLE[life.partner].name + ' shares 7B with you and comes home after six.'
          : 'There’s room for another mug. Spend time with a neighbor on five different days to talk about sharing a life here.'}
      </p>
      {life.partner && day > life.partneredDay && (day - life.partneredDay) % 40 === 0 && (
        <p className="mt-2 font-display">Two mugs, one more year together. Today is your anniversary.</p>
      )}
      {life.partner &&
        !c &&
        (day >= life.partneredDay + 40 ? (
          <div className="mt-4">
            <label className="block font-bold" htmlFor="family-name">
              Welcome a child into your household
            </label>
            <p className="text-sm my-2">Choose a name together, or leave this page for another year.</p>
            <input
              className="border rounded p-2 w-full"
              id="family-name"
              value={name}
              maxLength={24}
              placeholder="Child’s name"
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className={button + ' mt-2'}
              disabled={!name.trim()}
              onClick={() => {
                if (game.welcomeChild(name)) toast('A new page in the family album.');
              }}
            >
              Welcome them home
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm">
            After one full year together, you can decide whether to grow your family.
          </p>
        ))}
      {c && (
        <section className="mt-4">
          <h4 className="font-display text-xl">
            {c.name} · {stage}
          </h4>
          {stage === 'Grown up' ? (
            <p>
              {c.name} has taken a place of their own. Their favorite page in the album is about{' '}
              {favorite(c.interests).toLowerCase()}.{' '}
              {favorite(c.interests) === 'Cooking'
                ? 'They host the Friday supper now.'
                : favorite(c.interests) === 'Making'
                  ? 'They keep a drawer of tools at the repair bench.'
                  : 'Their first record is dedicated to Apartment 7B.'}
            </p>
          ) : (
            <>
              <p className="my-2">What will you spend time on together today?</p>
              <div className="grid gap-2">
                {PASTIMES.map((p) => (
                  <button
                    key={p}
                    disabled={c.lastDay === day}
                    className={button}
                    onClick={() => {
                      if (game.familyTime(p)) toast('Today is in the album.');
                    }}
                  >
                    {familyOutings[p][stageIndex]} · {c.interests[p]}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}
      {Object.keys(life.moments).length > 0 && (
        <>
          <h4 className="mt-5 font-display text-lg">People in this house</h4>
          {Object.entries(life.moments).map(([id, v]) => (
            <p key={id} className="my-2 text-sm">
              <b>{PEOPLE[id as Neighbor].name}</b> · {FRIEND_SCENES[id as Neighbor].replies[v]}
            </p>
          ))}
        </>
      )}
      <h4 className="mt-5 font-display text-lg">House gatherings</h4>
      {stamps.length === 0 ? (
        <p className="text-sm">Your first festival keepsake belongs here.</p>
      ) : (
        <ul className="list-disc pl-5">
          {stamps.map(([k, v]) => (
            <li key={k}>
              Year {Math.floor(+k / 4) + 1} · {FESTIVALS[+k % 4].memories[v]}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function PlayRecord() {
  const muted = useG(s => s.settings.muted);
  return <button className={button + ' mt-3'} onClick={() => {
    game.setSettings({ music: true, muted: false });
    restartRecord();
  }}>{muted ? 'Unmute and play' : 'Play'} {RECORD_TITLE}</button>;
}

function Commons() {
  const life = useG((s) => s.life),
    day = useG((s) => s.day);
  const qualified =
    day >= 41 && Object.keys(life.festivals).length >= 2 && NEIGHBORS.some((id) => life.visits[id] >= 3);
  if (!life.commons)
    return (
      <>
        <h3 className="font-display text-xl">A room of our own</h3>
        <p className="my-3">
          A pencilled note from the tenants’ meeting says the room belongs to whoever will open it in the
          morning. In year two, a caretaker with two festival keepsakes and one three-day friendship can
          decide its future.
        </p>
        <p className="text-sm mb-2">The choice becomes part of the building.</p>
        <div className="grid gap-2">
          {(['seeds', 'tapes'] as const).map((use) => (
            <button
              key={use}
              disabled={!qualified}
              className={button}
              data-testid={'commons-' + use}
              onClick={() => {
                if (game.restoreCommons(use)) sfx.upgrade();
              }}
            >
              {use === 'seeds' ? 'Found a seasonal seed exchange' : 'Found a neighborhood tape library'}
            </button>
          ))}
        </div>
      </>
    );
  if (life.commons === 'tapes')
    return (
      <>
        <p className="mb-3">
          Jun has filed the Grow Room recording under POTIFY. The sleeve is soft at the corners from passing between apartments.
        </p>
        <PlayRecord />
      </>
    );
  return (
    <>
      <p>
        A drawer of hand-labelled packets has replaced the empty lockers. Each season a neighbor sets one
        aside for your roof.
      </p>
      <button
        className={button + ' mt-3'}
        disabled={life.seedSeason === Math.floor((day - 1) / 10)}
        onClick={() => {
          if (game.takeCommonsSeed()) toast('Seasonal packet added to your bag.');
        }}
      >
        {life.seedSeason === Math.floor((day - 1) / 10)
          ? 'Next packet arrives next season'
          : 'Collect a seasonal seed packet'}
      </button>
    </>
  );
}

function FourthMug() {
  const memory = useG(s => s.life.fourthMug);
  const day = useG(s => s.day);
  const kitchen = useG(s => MUG_SCENE.project[s.projects[0] ?? 'none']);
  const packetClue = useG(s => s.packetFold?.response?.clue);
  const recollection = useG(s => fourthMugRecollection(s.life.festivals));
  if (!recollection.length) return null;
  const observation = <p className="mb-3 leading-relaxed">{kitchen}</p>;
  const paragraphs = recollection.map(line => <p key={line} className="mb-3 leading-relaxed">{line}</p>);
  if (memory) {
    return (
      <>
        <p className="mb-3 leading-relaxed" role="status" data-testid="mug-memory">
          {day === memory.day ? MUG_SCENE.replies[memory.choice] : MUG_SCENE.later[memory.choice]}
        </p>
        {observation}
        {day > memory.day && (
          <p className="mb-3 leading-relaxed" data-testid="mug-sugar-tin">
            {MUG_SCENE.sugarTin[packetClue ?? 'invitation']}
          </p>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer py-3 font-bold">Remember that supper</summary>
          {paragraphs}
          <p className="font-bold">{MUG_SCENE.choices[memory.choice]}</p>
          {day !== memory.day && <p className="mt-2 leading-relaxed">{MUG_SCENE.replies[memory.choice]}</p>}
        </details>
      </>
    );
  }
  return (
    <>
      {observation}
      {paragraphs}
      <div className="grid gap-2 mt-4">
        {(Object.keys(MUG_SCENE.choices) as MugChoice[]).map(choice => (
          <button
            key={choice}
            type="button"
            className={button}
            data-testid={'mug-' + choice}
            onClick={() => game.rememberFourthMug(choice)}
          >
            {MUG_SCENE.choices[choice]}
          </button>
        ))}
      </div>
    </>
  );
}

function Festival() {
  const day = useG((s) => s.day),
    life = useG((s) => s.life);
  const date = houseDate(day),
    stamp = life.festivals[date.key];
  return (
    <>
      <p className="font-display text-lg">{date.festival.detail}</p>
      <p className="mt-3 text-sm">
        {date.season} 4–6 · Level {date.festival.floor} · Year {date.year}
      </p>
      {stamp !== undefined ? (
        <p className="mt-4">{date.festival.memories[stamp]} A keepsake is on your shelf in 7B.</p>
      ) : date.active ? (
        <div className="grid gap-2 mt-4">
          {date.festival.choices.map((choice, i) => (
            <button
              className={button}
              key={choice}
              data-testid={'festival-' + i}
              onClick={() => {
                if (game.celebrate(i as 0 | 1)) {
                  sfx.talk();
                }
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3">
          {date.date < 4
            ? 'The neighbors are still setting up. Come back on the fourth.'
            : 'The gathering has ended for this year.'}
        </p>
      )}
    </>
  );
}
export function TowerDirectory() {
  const floor = useUI((s) => s.floor);
  return (
    <p className="mb-3 bg-muted rounded-xl p-3 text-sm">
      You’re on {floor} · {floorName(floor)}. Lobby 1 · Kitchen 4 · Home 7 · Listening room 12 · Archive 18 ·
      Commons 21 · Sky garden 24 · Rooftop above 24.
    </p>
  );
}
export function HousePanel({ room }: { room: Room }) {
  const floor = useUI((s) => s.floor),
    day = useG((s) => s.day),
    life = useG((s) => s.life);
  const names = {
    lift: 'Passenger lift',
    album: 'Household album',
    'fourth-mug': MUG_SCENE.title,
    festival: houseDate(day).festival.title,
    archive: 'The biscuit-tin archive',
    record: 'Canal FM tape booth',
    commons: 'Residents’ commons',
    doors: 'Landing notices',
    'town-board': 'Community board',
  };
  return (
    <Sheet
      title={names[room]}
      kicker={room === 'town-board' ? 'Canopy Quarter · Market square' : 'Canopy House · Floor ' + floor}
      test={'modal-house-' + room}
      accent="bg-jade"
    >
      {room === 'commons' ? (
        <Commons />
      ) : room === 'lift' ? (
        <Lift />
      ) : room === 'album' ? (
        <Album />
      ) : room === 'fourth-mug' ? (
        <FourthMug />
      ) : room === 'festival' ? (
        <Festival />
      ) : room === 'doors' || room === 'town-board' ? (
        <Notices town={room === 'town-board'} floor={floor} />
      ) : room === 'record' ? (
        <>
          <p>
            Jun marked this copy “7B” before sending it up from Low Tide. Jax has it cued at the start of the Grow Room recording.
          </p>
          <PlayRecord />
        </>
      ) : (
        <>
          <p>
            {life.archiveOpen
              ? 'Behind the old roof plan sits a tape-booth pass stamped TWELVE. You can walk into the studio now.'
              : life.visits.jax >= 3
                ? 'The small brass key fits. Someone kept a Moonmint packet tucked in the plan.'
                : 'The cabinet has a fresh lock. Get to know Jax on three different days. He works here until six and spends his evenings on twelve.'}
          </p>
          {!life.archiveOpen && life.visits.jax >= 3 && (
            <button
              className={button + ' mt-3'}
              onClick={() => {
                if (game.openArchive()) toast('Moonmint seed and a studio pass received.');
              }}
            >
              Turn the archive key
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
