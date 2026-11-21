/**
 * Synthesizes the listening clips the seed references.
 *
 * Nothing here calls an external service: `say` speaks the sentence locally and
 * ffmpeg encodes a compact MP3 into `public/audio`. Existing non-empty files are
 * skipped, so re-running is cheap.
 *
 * macOS only, and that is stated in the README rather than discovered later.
 * Pass `--force` to re-synthesize everything.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LISTENING_CLIPS } from "./audio-manifest";

const OUTPUT_DIR = join(process.cwd(), "public", "audio");
const SEED_FILE = join(process.cwd(), "prisma", "seed.ts");
const FORCE = process.argv.includes("--force");
const VOICES = ["Samantha", "Karen", "Alex", "Daniel"];

function availableVoice(): string | undefined {
  try {
    const list = execFileSync("say", ["-v", "?"], { encoding: "utf8" });
    return VOICES.find((voice) => new RegExp(`^${voice}\\s`, "m").test(list));
  } catch {
    return undefined;
  }
}

function seedReferencedClips(): string[] {
  const source = readFileSync(SEED_FILE, "utf8");
  const matches = source.match(/\/audio\/[A-Za-z0-9_-]+\.mp3/g) ?? [];
  return [...new Set(matches.map((match) => match.replace("/audio/", "")))];
}

const referenced = seedReferencedClips();
const manifestFiles = new Set(LISTENING_CLIPS.map((clip) => clip.file));
const missingFromManifest = referenced.filter((file) => !manifestFiles.has(file));
if (missingFromManifest.length > 0) {
  console.error(`seed references clips with no spoken text: ${missingFromManifest.join(", ")}`);
  process.exit(1);
}

const voice = availableVoice();
mkdirSync(OUTPUT_DIR, { recursive: true });

let created = 0;
let skipped = 0;

for (const clip of LISTENING_CLIPS) {
  const target = join(OUTPUT_DIR, clip.file);
  if (!FORCE && existsSync(target) && statSync(target).size > 0) {
    skipped += 1;
    continue;
  }

  const raw = join(tmpdir(), `hisin-${clip.file}.aiff`);
  rmSync(raw, { force: true });

  // A deliberately slow rate reads better for listening practice.
  execFileSync("say", [
    ...(voice ? ["-v", voice] : []),
    "-r",
    "155",
    "-o",
    raw,
    clip.text,
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    raw,
    "-codec:a",
    "libmp3lame",
    "-qscale:a",
    "4",
    "-ar",
    "44100",
    target,
  ]);
  rmSync(raw, { force: true });

  const size = statSync(target).size;
  if (size === 0) {
    console.error(`empty audio produced for ${clip.file}`);
    process.exit(1);
  }
  console.log(`${clip.file} (${Math.round(size / 1024)} KB)`);
  created += 1;
}

console.log(
  JSON.stringify({ voice: voice ?? "system default", created, skipped, total: LISTENING_CLIPS.length }),
);
