import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { claimSlot, releaseSlot, resetSlots, runningJob } from "./queue";

beforeEach(() => {
  resetSlots();
});

test("the first claim owns the only slot", () => {
  assert.equal(claimSlot("job-a"), true);
  assert.equal(runningJob()?.jobId, "job-a");
});

test("a second claim is refused while a generation runs", () => {
  claimSlot("job-a");

  assert.equal(claimSlot("job-b"), false);
  assert.equal(runningJob()?.jobId, "job-a");
});

test("a non owner cannot release the slot", () => {
  claimSlot("job-a");
  releaseSlot("job-b");

  assert.equal(runningJob()?.jobId, "job-a");
});

test("the owner releases the slot and the next claim succeeds", () => {
  claimSlot("job-a");
  releaseSlot("job-a");

  assert.equal(runningJob(), null);
  assert.equal(claimSlot("job-b"), true);
});

test("releasing twice is harmless", () => {
  claimSlot("job-a");
  releaseSlot("job-a");
  releaseSlot("job-a");

  assert.equal(runningJob(), null);
});
