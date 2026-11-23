/**
 * One shared slot for the gloss the learner is looking at.
 *
 * Every paragraph used to print its own hint and its own answer underneath, so the
 * lesson was a wall of repeated instructions. The slot is read once, in the bar that
 * sits at the top of the lesson, and every word writes into it.
 */
export interface ActiveGloss {
  term: string;
  translation: string | null;
  kind: string | null;
  note?: string | null;
  busy: boolean;
}

type Listener = () => void;

let current: ActiveGloss | null = null;
const listeners = new Set<Listener>();

export function setActiveGloss(next: ActiveGloss | null) {
  current = next;
  for (const listener of listeners) listener();
}

export function subscribeGloss(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGlossSnapshot(): ActiveGloss | null {
  return current;
}

export function getGlossServerSnapshot(): ActiveGloss | null {
  return null;
}
