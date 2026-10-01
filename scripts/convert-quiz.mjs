// Converts the Flutter quiz bank (assets/data/islamic_questions.json) into
// data/quiz/questions.json: [{ id, questions: [{ q, c, a, e, s }] }] where
// `a` is the index of the correct answer inside `c`. Entries the app would
// skip (QuizQuestion.isValid) are dropped here too.
//
// Usage: node scripts/convert-quiz.mjs [path-to-flutter-repo]
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2] ?? "../../Flutter/noon-islamic-android");
const OUT = path.join(process.cwd(), "data/quiz");

// Same order and ids as the Dart QuizCategory enum.
const CATEGORIES = [
  ["quran", "quranQuestions"],
  ["messenger", "messangerQuestions"],
  ["caliphs", "theRightlyGuidedCaliphs"],
  ["sahaba", "sahabaQuestions"],
  ["prophets", "prophetsQuestions"],
  ["fiqh", "fiqhQuestions"],
  ["aqeedah", "aqeedahQuestions"],
  ["hadith", "hadithQuestions"],
];

const raw = JSON.parse(fs.readFileSync(path.join(SRC, "assets/data/islamic_questions.json"), "utf8"));
const text = (v) => (typeof v === "string" ? v.trim() : "");

let total = 0;
const out = CATEGORIES.map(([id, key]) => {
  const questions = [];
  for (const entry of raw[key] ?? []) {
    const q = text(entry.question);
    const answer = text(entry.answer);
    const c = (entry.choices ?? []).map((x) => String(x).trim());
    if (!q || c.length < 2 || c.filter((x) => x === answer).length !== 1) continue;
    const item = { q, c, a: c.indexOf(answer) };
    if (text(entry.explanation)) item.e = text(entry.explanation);
    if (text(entry.source)) item.s = text(entry.source);
    questions.push(item);
  }
  total += questions.length;
  return { id, questions };
});

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "questions.json"), JSON.stringify(out));
console.log(`quiz: ${total} questions in ${out.length} categories → data/quiz/questions.json`);
