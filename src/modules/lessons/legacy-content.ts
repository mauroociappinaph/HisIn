/**
 * Authored section content for lessons that were generated as prose.
 *
 * They live in the database with their own ids, so the seed cannot own them
 * (it would create a second row with the same title). Keying them by natural
 * key lets `db:normalize-lessons` rewrite the existing row in place, and lets a
 * test hold them to the same canonical structure as the seeded ones.
 *
 * Key format: `<module>|<level>|<title>`.
 */
export const AUTHORED_LESSON_CONTENT: Record<string, string> = {
  "business-english|B2|Reported Speech in Team Meetings": [
    "Goal: Report what the CTO or a client said without changing their meaning.",
    "Learn: backshift the tense (present becomes past), said that / reported that, and adjusted time references.",
    'Examples: "The CTO said they needed faster API responses." / "She stated she would finish by Friday."',
    "Practice: Take one line from your last meeting notes and report it two ways: said that, reported that.",
    'Common mistake: Reporting "We need it today" as "They said they need it today" keeps the present and loses the shift. Backshift first, then check whether the fact is still current.',
  ].join("\n\n"),

  "business-english|C1|Mastering Regulatory Submissions": [
    "Goal: Write a submission sentence a reviewer reads as evidence, not as an opinion.",
    "Learn: proactive, aligns with, the evidence substantiates, clinical endpoints.",
    'Examples: "The preliminary data substantiates the device\'s efficacy across all cohorts." / "Our monitoring protocol is proactive rather than reactive."',
    'Practice: Replace every "we think" in one paragraph of your submission with what the data shows.',
    'Common mistake: "We think our device is safe" reads as opinion and weakens the file. State what the evidence substantiates, and keep the terminology of the target regulatory body.',
  ].join("\n\n"),

  "business-english|C1|Writing High-Impact Board Papers": [
    "Goal: Give a board the decision, the reason and the downside on one page.",
    "Learn: strategic imperative, fiscal prudence, mitigate downside risk, and the propose / rationale / expected outcomes structure.",
    'Examples: "We propose this acquisition to solidify market share and mitigate long-term downside risk." / "Fiscal prudence means we fund the pilot from existing runway."',
    "Practice: Rewrite your last recommendation as three sentences: proposal, rationale, expected outcome.",
    "Common mistake: A paper that lists activity instead of a decision. Lead with the strategic imperative, not with the project history.",
  ].join("\n\n"),

  "business-english|C2|Mastering Strategic Hedging in Negotiations": [
    "Goal: Hold your position without conceding, while leaving room to move.",
    "Learn: tentative framing (we are currently inclined to), modals (may, could, would) and conditions (provided the indemnity clauses remain aligned).",
    'Examples: "It is our initial assessment that your proposal may necessitate further alignment with our compliance benchmarks." / "One could envisage a recalibration of the valuation, assuming the clinical data yields the projected efficacy."',
    'Practice: Rewrite your last hard "no" as a condition that keeps the deal alive.',
    "Common mistake: Hedging every sentence until nothing is claimed. One hedge per point is leverage; five make the position unreadable.",
  ].join("\n\n"),

  "contracts|C1|Conditionals in Legal Drafting": [
    "Goal: Read and write conditions that survive a dispute.",
    "Learn: formal inversion with should (\"Should the party fail to comply\"), provided that as a condition precedent, and precision instead of a casual if.",
    'Examples: "Should the party fail to comply, the licence terminates." / "Fees shall be paid, provided that the service is delivered."',
    'Practice: Find one "if" in a contract you signed and rewrite it with "should" or "provided that".',
    'Common mistake: "provided that" introduces a condition, not a reassurance; and a bare "if" in a binding instrument reads as drafting done in a hurry.',
  ].join("\n\n"),

  "contracts|C1|Effective Due Diligence Memos": [
    "Goal: Tell an investor what a finding materially impacts and what it is contingent on.",
    "Learn: materially impacts, contingent on, mitigation strategies, duly registered and under prosecution.",
    'Examples: "The patent viability is contingent on the completion of the longitudinal study." / "A missing ISO audit materially impacts the closing timeline."',
    "Practice: Take one open finding in your data room and write its impact, its dependency and one mitigation.",
    'Common mistake: Reporting a risk with no dependency and no mitigation. A memo that says "IP unclear" is rewritten by the investor as "IP worthless".',
  ].join("\n\n"),

  "contracts|C2|Regulatory Argumentation for Healthtech Compliance": [
    "Goal: Argue a regulatory position a reviewer can verify.",
    "Learn: framing compliance as quality assurance, technical qualifiers, and linking specifications to healthcare mandates.",
    'Examples: "The proposed integration protocols proactively mitigate systemic risk rather than merely fulfilling statutory reporting." / "Given the inherent latency in the diagnostic algorithm, the current safety threshold is statistically robust."',
    "Practice: Take one claim in your file and attach the specification and the mandate it satisfies.",
    'Common mistake: Arguing effort instead of evidence ("we did a lot of testing"). Name the protocol, the threshold and the mandate.',
  ].join("\n\n"),

  "grammar|A2|Past Simple: Regular Verbs": [
    "Goal: Talk about finished work with -ed verbs and did.",
    "Learn: regular past forms (finished, helped, called), and questions and negatives with did and didn't.",
    'Examples: "I finished the contract yesterday." / "The team helped with the presentation."',
    "Practice: Write three sentences about last week with finished, helped and called.",
    'Common mistake: "I didn\'t finished" - after didn\'t the verb stays in the base form: "I didn\'t finish".',
  ].join("\n\n"),

  "grammar|A2|Present Simple vs. Continuous": [
    "Goal: Separate routines from what is happening right now.",
    "Learn: present simple for habits and facts, present continuous (am/is/are + -ing) for actions in progress.",
    'Examples: "He works in healthtech." / "He is working on a new project."',
    "Practice: Describe your morning routine in present simple, then say what you are doing at this moment.",
    'Common mistake: Dropping the auxiliary: "He working on it" is not English. The continuous needs am, is or are.',
  ].join("\n\n"),

  "grammar|A2|Using Much and Many": [
    "Goal: Ask and answer quantity questions correctly in a business context.",
    "Learn: many with countable nouns (meetings, clients, entrepreneurs), much with uncountable nouns (time, money, paperwork).",
    'Examples: "How many meetings do we have?" / "How much time do we have?"',
    "Practice: Write four questions about your week, two with many and two with much.",
    'Common mistake: "How much meetings" and "too many paperwork". Count the noun first, then choose the word.',
  ].join("\n\n"),

  "grammar|B2|Effective Status Reporting Patterns": [
    "Goal: Deliver a status update that reads as progress, context and next step.",
    "Learn: present perfect for overall progress, past simple for the dated detail, and reported speech for stakeholder input.",
    'Examples: "I have reviewed the draft; the client said they preferred a different timeline." / "The team reported that they hit their targets."',
    "Practice: Write your weekly update in three sentences, using each of those structures once.",
    'Common mistake: Mixing both tenses about one event ("I have reviewed it last night"). Progress goes in present perfect, the dated detail in past simple.',
  ].join("\n\n"),

  "grammar|B2|Present Perfect vs. Past Simple in Status Updates": [
    "Goal: Say whether a result is relevant now or whether the action is closed.",
    "Learn: present perfect (have + participle) for current relevance, past simple for a finished and dated action, and the markers that decide it.",
    'Examples: "I have completed the audit - the results are ready." / "I completed the audit at 5 PM."',
    'Practice: Rewrite five lines from your last update, choosing the tense by asking whether the date matters.',
    'Common mistake: "We have updated the system this week" is fine while the week is open; "we have launched the pilot yesterday" is not, because yesterday is closed.',
  ].join("\n\n"),

  "grammar|C1|Advanced Participle Clauses": [
    "Goal: Compress two ideas into one precise sentence.",
    "Learn: present participles for simultaneous action or reason, past participles for passive description, and subject agreement between clause and main clause.",
    'Examples: "Seeking new funding, the founders presented their roadmap." / "Built on proprietary AI, the platform ensures privacy."',
    "Practice: Merge two sentences from your last email into one participle clause, then check the subject.",
    'Common mistake: A dangling participle: "Built on proprietary AI, we ensure privacy" says the team was built on AI. The clause subject must be the main clause subject.',
  ].join("\n\n"),

  "grammar|C1|Passive Reporting Verbs in Business": [
    "Goal: Report consensus or a legal viewpoint without naming who believes it.",
    "Learn: it is + passive verb + that; subject + passive verb + to infinitive.",
    'Examples: "It is widely considered that the merger will optimize logistics." / "The startup is believed to have disrupted the telehealth sector."',
    "Practice: Rewrite two opinions from a report in passive reporting form.",
    "Common mistake: Using passive reporting to hide a responsibility you hold. It fits market consensus and legal viewpoints, not your own promises.",
  ].join("\n\n"),

  "grammar|C2|Emphasis and Focus: Cleft Sentences and Inversion": [
    "Goal: Put the important element where the reader cannot miss it.",
    "Learn: cleft sentences (what we require is), it is ... that, and negative-adverb inversion (never have we, rarely does a contract).",
    'Examples: "What we require is a robust compliance framework." / "Rarely does a contract offer such favourable exit clauses."',
    "Practice: Take one recommendation and rewrite it with a cleft and with inversion, then keep the stronger version.",
    'Common mistake: Inversion without the auxiliary: "Never we encountered such complexity". The auxiliary goes before the subject.',
  ].join("\n\n"),

  "grammar|C2|Mastering Hedging in Professional Correspondence": [
    "Goal: Qualify a claim so it stays defensible without sounding unsure.",
    "Learn: modals (may, might, could), verbs of appearance (seems, suggests) and adverbs (arguably, tentatively).",
    'Examples: "This strategy might face challenges." / "It is suggested that the current market shift may necessitate a pivot."',
    "Practice: Rewrite three assertions from a report so each states its confidence honestly.",
    'Common mistake: Stacking hedges ("it might possibly perhaps") cancels the claim. One qualifier per proposition.',
  ].join("\n\n"),

  "grammar|C2|Nominalisation for Conciseness in Business": [
    "Goal: Write dense executive prose without losing the agent.",
    "Learn: turning verbs into nouns (decide to decision, implement to implementation), and when that helps or hides responsibility.",
    'Examples: "The decision to invest was finalized." / "The identification of systemic risks is our priority."',
    "Practice: Nominalise two sentences from your last summary, then check that nobody's responsibility disappeared.",
    'Common mistake: Nominalising to avoid saying who does what. "The identification of risks is a priority" means nothing until you name who identifies them.',
  ].join("\n\n"),

  "vocabulary|C2|High-Register Lexicon for Healthtech Negotiations": [
    "Goal: Replace vague verbs with precise ones when the stakes are contractual.",
    "Learn: remediate and rectify, preclude, leverage, mitigate.",
    'Examples: "We seek to rectify the data silos to ensure interoperability." / "The prevailing regulatory environment precludes a decentralized approach to patient data."',
    "Practice: Replace five common verbs in one of your documents with the precise alternative.",
    'Common mistake: High register for its own sake: you do not remediate a coffee machine. If the plain verb is accurate, keep the plain verb.',
  ].join("\n\n"),
};

/** Authored content for one stored lesson, if any. */
export function authoredLessonContent(module: string, level: string, title: string): string | undefined {
  return AUTHORED_LESSON_CONTENT[`${module}|${level}|${title}`];
}
