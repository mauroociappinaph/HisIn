/**
 * Single-flight guard for generation.
 *
 * Every generation spawns an agent process that holds the machine for tens of
 * seconds, so the app allows exactly one at a time per Node process. This is
 * process-local state on purpose: it protects the resource it can actually see,
 * and it is honest about not being a distributed queue.
 */

export interface RunningJob {
  jobId: string;
  startedAt: number;
}

let running: RunningJob | null = null;

export function runningJob(): RunningJob | null {
  return running;
}

/** Claims the only slot. Returns false when another generation owns it. */
export function claimSlot(jobId: string): boolean {
  if (running) return false;
  running = { jobId, startedAt: Date.now() };
  return true;
}

/** Releases the slot only if the caller still owns it. */
export function releaseSlot(jobId: string): void {
  if (running?.jobId === jobId) running = null;
}

/** Test helper: clears the slot so cases stay independent. */
export function resetSlots(): void {
  running = null;
}
