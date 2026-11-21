/**
 * The listening clips the seeded questions depend on.
 *
 * One source of truth for the audio: the seed references these paths, the
 * generation script speaks these sentences, and a drift check fails loudly if
 * the seed grows a clip that nobody can synthesize.
 */
export interface ListeningClip {
  /** File name inside public/audio. */
  file: string;
  /** What the learner must actually hear. */
  text: string;
}

export const LISTENING_CLIPS: ListeningClip[] = [
  { file: "appointment-a1.mp3", text: "The patient has an appointment at 3 P M." },
  { file: "medicine-a1.mp3", text: "Take this medicine twice a day." },
  { file: "telemedicine-a2.mp3", text: "We offer telemedicine consultations on Fridays." },
  { file: "startup-a2.mp3", text: "The startup raised Series A funding last month." },
  { file: "meeting-b1.mp3", text: "Let's circle back to the compliance issue next week." },
  { file: "hipaa-b1.mp3", text: "HIPAA requires encryption for patient data." },
  {
    file: "burnrate-b2.mp3",
    text: "Our burn rate is fifty thousand dollars a month, giving us eighteen months of runway.",
  },
  { file: "fhir-b2.mp3", text: "We need FHIR APIs for interoperability with EHR systems." },
  {
    file: "duediligence-c1.mp3",
    text: "Due diligence revealed three material risks in the term sheet.",
  },
  {
    file: "indemnification-c1.mp3",
    text: "The indemnification clause covers third-party I P claims.",
  },
  {
    file: "rwe-c2.mp3",
    text: "Real-world evidence from post-market surveillance supports label expansion.",
  },
  {
    file: "fda-c2.mp3",
    text: "Had the F D A approved the biomarker, the trial design would have changed.",
  },
];
