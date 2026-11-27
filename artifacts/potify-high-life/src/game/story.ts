export type Resident = 'mira' | 'moss' | 'jun';
export type SideTask = 'latch' | 'signal' | 'ledger';
export type StoryItem = 'lease' | SideTask;
export type StoryPage = StoryItem | 'filed';
type Lead = 'moss' | 'jun';
type TaskStage = 'available' | 'accepted' | 'found' | 'complete';

export interface StoryProgress {
  leaseRead: boolean;
  lead: Lead | null;
  filed: boolean;
  tasks: Record<SideTask, TaskStage>;
}

const residentTasks: Record<Resident, SideTask> = { mira: 'ledger', moss: 'latch', jun: 'signal' };
const leadTasks: Record<Lead, SideTask> = { moss: 'latch', jun: 'signal' };

export const SIDE_TASKS = {
  latch: {
    title: 'A Roof That Holds',
    resident: 'Moss',
    offer: 'Does your greenhouse rattle when the wind comes off the canal? Check the brass pin on the right side of the door. Leave it where it is. I just need to know what’s stamped on it.',
    objective: 'Inspect the brass latch beside the rooftop greenhouse door.',
    reply: 'Canal Works, 7B. Well, I’ll be. They used to number the beds, same as the roofs. Whoever built your greenhouse saved that pin for a reason.',
    reward: '1 soil bag',
  },
  signal: {
    title: 'Five Minutes of Static',
    resident: 'Jun',
    offer: 'I lent a record to the last caretaker of 7B. Never saw it again. If the radio log’s still by the set, see what they played before the signal cut out.',
    objective: 'Read the broadcast log beside the radio in Home 7B.',
    reply: 'Two knocks. That was my teacher’s way of checking the other end could still hear. She told me there was a second station. I thought she meant across town.',
    reward: '3 virtual simSOL',
  },
  ledger: {
    title: 'The Extra Crate',
    resident: 'Mira',
    offer: 'I’ve got an empty crate outside Green Exchange with two addresses. Before I send it back up the wrong stairs, could you check the tag?',
    objective: 'Read the delivery tag on the crate outside Green Exchange.',
    reply: 'Oh. Both addresses are right. My mother used to split one delivery between your roof and the canal beds. Funny. I remember carrying it. I don’t remember when we stopped.',
    reward: '1 Moonmint seed',
  },
} as const;

export const STORY_PAGES: Record<StoryPage, { title: string; text: readonly string[] }> = {
  lease: {
    title: 'Lease for Roof 7B',
    text: [
      'The inventory lists six beds, a glasshouse, and one key. The space for the outgoing caretaker’s name is blank.',
      'Someone wrote under the signature line: “Start where they stopped. Keep the soil.”',
    ],
  },
  latch: {
    title: 'The Brass Pin',
    text: [
      'One end is polished from years of being pulled out by hand. It has an extra notch, filed deep enough for a gloved thumb.',
      'The other end is stamped “CANAL WORKS · 7B.” The pin looks older than the greenhouse.',
    ],
  },
  signal: {
    title: 'Low Tide Broadcast Log',
    text: [
      'Most pages are song titles and reminders to bring the needle back upstairs. Someone wrote “never play the B-side wet” three nights in a row.',
      'On the last page: “4:19. Two knocks on the line. Kept the channel open until the beds went dark.”',
    ],
  },
  ledger: {
    title: 'A Tag with Two Addresses',
    text: [
      'The card says “Roof 7B / Canal Beds.” There’s a check beside each address, both made with a carpenter’s pencil.',
      'On the back, under a faded return stamp: “Same soil. Half upstairs.”',
    ],
  },
  filed: {
    title: 'A Missing Season',
    text: [
      'Mira sets your first sale receipt beside a photograph. There’s a greenhouse on the roof and a line of beds beside the canal. A narrow stair connects the two.',
      'The date on the back falls in a gap in the town ledger. One page ends in winter. The next opens a year later, with the canal beds gone.',
      'In the margin is the same hand as the lease: “When they ask what grew here, start with what’s still underfoot.”',
    ],
  },
};

export const FILED_NOTES: Record<Lead, string> = {
  moss: 'Moss says the extra notch was for opening the sluice gates with gloves on. Someone moved the pin up to 7B after the gates were bricked in.',
  jun: 'Jun recognizes the shape on the far wall. It’s the aerial from the old log. Those two knocks came from under the stairs, a few floors below 7B.',
};

export function freshStory(): StoryProgress {
  return { leaseRead: false, lead: null, filed: false, tasks: { latch: 'available', signal: 'available', ledger: 'available' } };
}

export function validateStory(value: unknown, sold: boolean): value is StoryProgress {
  if (!value || typeof value !== 'object') return false;
  const story = value as Partial<StoryProgress>;
  if (typeof story.leaseRead !== 'boolean' || typeof story.filed !== 'boolean' ||
      (story.lead !== null && story.lead !== 'moss' && story.lead !== 'jun') ||
      !story.tasks || typeof story.tasks !== 'object' || Array.isArray(story.tasks)) return false;
  const progress = story.tasks;
  const stages = ['available', 'accepted', 'found', 'complete'];
  const tasks = Object.keys(SIDE_TASKS) as SideTask[];
  if (!tasks.every(id => stages.includes(progress[id]))) return false;
  if (!story.leaseRead && (story.lead || story.filed ||
      tasks.some(id => progress[id] === 'accepted' || progress[id] === 'complete'))) return false;
  return !story.filed || (sold && story.lead !== null && progress[leadTasks[story.lead]] === 'complete');
}

export function readStory(story: StoryProgress, item: StoryItem): StoryProgress {
  if (item === 'lease') return story.leaseRead ? story : { ...story, leaseRead: true };
  if (story.tasks[item] === 'available' || story.tasks[item] === 'accepted') {
    return { ...story, tasks: { ...story.tasks, [item]: 'found' } };
  }
  return story;
}

const canFile = (story: StoryProgress, sold: boolean) =>
  sold && !story.filed && story.lead !== null && story.tasks[leadTasks[story.lead]] === 'complete';

export type ChoiceId = 'ask-moss' | 'ask-jun' | 'file-lease' | `accept-${SideTask}` | `return-${SideTask}`;
type Choice =
  | { id: ChoiceId; label: string; kind: 'lead'; lead: Lead }
  | { id: ChoiceId; label: string; kind: 'accept' | 'return'; task: SideTask }
  | { id: ChoiceId; label: string; kind: 'file' };

export function storyChoices(story: StoryProgress, resident: Resident, sold: boolean): Choice[] {
  if (!story.leaseRead) return [];
  const choices: Choice[] = [];
  const task = residentTasks[resident];
  if (resident === 'mira' && !story.lead) choices.push(
    { id: 'ask-moss', label: 'Ask Moss about the greenhouse', kind: 'lead', lead: 'moss' },
    { id: 'ask-jun', label: 'Ask Jun about the last caretaker', kind: 'lead', lead: 'jun' },
  );
  if (resident === 'mira' && canFile(story, sold)) {
    choices.push({ id: 'file-lease', label: 'File the lease with your first receipt', kind: 'file' });
  }
  if (story.tasks[task] === 'available') {
    choices.push({ id: `accept-${task}`, label: `Take the job · ${SIDE_TASKS[task].title}`, kind: 'accept', task });
  }
  if (story.tasks[task] === 'found') {
    choices.push({ id: `return-${task}`, label: `Share what you found · ${SIDE_TASKS[task].title}`, kind: 'return', task });
  }
  return choices;
}

export function storyLine(story: StoryProgress, resident: Resident, sold: boolean): string | undefined {
  if (!story.leaseRead) {
    return resident === 'mira' ? 'Hey. You must be 7B. I left your lease on the table inside. Read the little line at the bottom before you sign anything.' : undefined;
  }
  if (resident === 'mira') {
    if (!story.lead) return 'I know that handwriting. Moss worked on the greenhouse. Jun used to hear the last caretaker on the radio. Who do you want to start with?';
    if (canFile(story, sold)) return 'You kept your first receipt? Good. Set it here with the lease. I found a photo I think you should see.';
  }
  const task = SIDE_TASKS[residentTasks[resident]];
  const stage = story.tasks[residentTasks[resident]];
  if (stage === 'available') return task.offer;
  if (stage === 'accepted') return task.objective;
  if (stage === 'found') return resident === 'moss' ? 'Did you get a look at that old pin?' :
    resident === 'jun' ? 'Did the log say what they played that night?' : 'You found the old delivery tag? Let me see.';
  return resident === 'mira' && story.filed ? 'The photo’s in your field notes. Look at the bend in the canal, behind the greenhouse.' : undefined;
}

interface StoryChange {
  story: StoryProgress;
  message: string;
  reply: string;
  reward?: SideTask;
}

export function chooseStory(story: StoryProgress, resident: Resident, id: ChoiceId, sold: boolean): StoryChange | null {
  const choice = storyChoices(story, resident, sold).find(item => item.id === id);
  if (!choice) return null;
  if (choice.kind === 'lead') return {
    story: { ...story, lead: choice.lead },
    message: 'Lead added to your field notes.',
    reply: choice.lead === 'moss' ? 'Try Rootworks in the morning. If he’s stepped out, check the neighborhood map.' :
      'Try Low Tide first. Jun’s usually there until the afternoon.',
  };
  if (choice.kind === 'file') return {
    story: { ...story, filed: true },
    message: 'A Missing Season added to your field notes.',
    reply: 'There. Your name’s on the roof now. Take the photo. I want someone to remember that those stairs went somewhere.',
  };
  const task = SIDE_TASKS[choice.task];
  if (choice.kind === 'accept') return {
    story: { ...story, tasks: { ...story.tasks, [choice.task]: 'accepted' } },
    message: task.title + ' added to your field notes.',
    reply: task.offer,
  };
  return {
    story: { ...story, tasks: { ...story.tasks, [choice.task]: 'complete' } },
    reward: choice.task,
    message: `${task.title} complete · ${task.reward}`,
    reply: task.reply,
  };
}

export function storyObjective(story: StoryProgress, sold: boolean): string {
  if (!story.leaseRead) return 'Read the lease inside Home 7B on the rooftop.';
  if (!story.lead) return 'Show the lease to Mira and choose who to ask first.';
  if (story.filed) return 'Read A Missing Season in your field notes.';
  const id = leadTasks[story.lead];
  const task = SIDE_TASKS[id];
  const stage = story.tasks[id];
  if (stage === 'available') return `Ask ${task.resident} about ${task.title}.`;
  if (stage === 'accepted') return task.objective;
  if (stage === 'found') return `Take the clue back to ${task.resident}.`;
  return sold ? 'Take your clue and first sale receipt to Mira.' : 'Sell your first harvest at Green Exchange.';
}
