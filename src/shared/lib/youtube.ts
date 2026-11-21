/**
 * Deep links into a video at the exact second a line is spoken.
 *
 * The listening module used to offer only a synthesised clip. A link that opens
 * the real talk where the phrase happens is what a learner actually needs, and it
 * is one URL: `?t=83`.
 */
export function youtubeDeepLink(videoId: string, startSeconds = 0): string {
  const clean = videoId.trim();
  if (!clean) return "";
  const seconds = Math.max(0, Math.trunc(startSeconds));
  return `https://www.youtube.com/watch?v=${encodeURIComponent(clean)}&t=${seconds}s`;
}

/** "1:23" for a button label, so the learner knows where it opens. */
export function formatTimestamp(totalSeconds: number): string {
  const seconds = Math.max(0, Math.trunc(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}:${`${minutes % 60}`.padStart(2, "0")}:${`${rest}`.padStart(2, "0")}`;
  }
  return `${minutes}:${`${rest}`.padStart(2, "0")}`;
}
