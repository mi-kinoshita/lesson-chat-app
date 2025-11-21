export const JOURNAL_PROMPTS: string[] = [
"What was the most memorable event?",
  "What are you grateful for?",
  "What new thing did you learn?",
  "What do you want to improve tomorrow?",
  "Did you show kindness to anyone? How?",
  "What small victory did you achieve?",
  "What made you smile?",
  "If you could rewind time, what would you change about it?",
  "What was your biggest challenge and how did you overcome it?",
  "What's the strongest emotion you're feeling right now, and why?",
  "Describe a moment that stands out.",
  "What's a lesson you'll carry forward?",
  "Reflect on a recent conversation.",
  "What are your hopes for the future?",
  "What did you create or accomplish?",
];

export const getRandomJournalPrompt = (): string => {
  const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length);
  return JOURNAL_PROMPTS[randomIndex];
};