// The tidy-up prompt (pure, for tests): fixes what speech-to-text misheard in a spoken job description, using the
// business's own words and the price book as the vocabulary. It must never add, remove or reword the job.

export const TIDY_MAX_CHARS = 8000;

export const TIDY_SYSTEM = `You fix speech-to-text mistakes in a job description an Australian tradie has just said out loud.

Change only:
- words the recogniser misheard. Recognisers turn trade words into everyday words that sound alike, so when a word or phrase sounds like a vocabulary term and makes little sense on a building job, replace it with that term. For example: "mirror bow" is merbau, "age four" is H4, "colour bond" is Colorbond, "villa board" is Villaboard, "nog ins" is noggins, "lap and cat" is lap and cap
- numbers and measurements into digits with units, e.g. "four by three metres" to "4 × 3 m", "six hundred mil" to "600 mm", "one point eight" to "1.8"
- punctuation and capital letters, so it reads as normal sentences

Never add details, remove details, reorder, summarise or reword anything else. Keep Australian spelling. If nothing needs fixing, return the text unchanged.

Reply with the corrected text only: no quotes, no notes, no preamble.`;

export function tidyPrompt(heard: string, vocabulary: string[]): string {
  return `Vocabulary this business uses:\n${vocabulary.join(", ")}\n\nWhat the recogniser heard:\n${heard.trim()}`;
}

/** Strips wrapping a model sometimes adds anyway (quotes, a "Corrected text:" label). */
export function cleanTidyReply(reply: string): string {
  return reply
    .trim()
    .replace(/^(corrected( text)?|fixed( text)?)\s*:\s*/i, "")
    .replace(/^["“']([\s\S]*)["”']$/, "$1")
    .trim();
}
