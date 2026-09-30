// Merges the reading-comprehension upgrade into APP_DATA.READING_PASSAGES (runs after
// content_merge.js, so content-pack passages are included):
//  - READING_QEXTRA (qextra_*.js): per passage (keyed by passageKey of its text) a level for
//    each existing question plus new inference / word-meaning / main-idea questions.
//  - READING_LONG (long_*.js): longer multi-paragraph passages for the Hard tier.
// Question levels: 0 = literal recall, 1 = inference / sequence / cause / feelings,
// 2 = word meaning, main idea, author's purpose, prediction.

function guessQuestionLevel(question) {
  const s = question.toLowerCase();
  if (/\bmeans?\b|mostly about|main idea|author|most nearly|best supported/.test(s)) return 2;
  if (/\bwhy\b|feel|happened (after|before|next|first)|will probably|infer/.test(s)) return 1;
  return 0;
}

(function mergeReadingUpgrade() {
  const byKey = new Map();
  for (const bank of Object.values(APP_DATA.READING_PASSAGES)) {
    for (const p of bank) byKey.set(passageKey(p.text), p);
  }
  for (const entry of READING_QEXTRA) {
    const p = byKey.get(entry.key);
    if (!p) continue;
    (entry.levels || []).forEach((lv, i) => { if (p.questions[i]) p.questions[i].level = lv; });
    const have = new Set(p.questions.map((q) => q.question));
    for (const q of entry.add || []) if (!have.has(q.question)) p.questions.push(q);
  }
  // Questions whose answer the passage doesn't actually give.
  const DROP = { "457e38c8": ["Why is the sun's effect on tides smaller?"] };
  for (const [key, qs] of Object.entries(DROP)) {
    const p = byKey.get(key);
    if (p) p.questions = p.questions.filter((q) => !qs.includes(q.question));
  }
  for (const lp of READING_LONG) {
    const bank = APP_DATA.READING_PASSAGES[String(lp.age)];
    if (!bank || byKey.has(passageKey(lp.text))) continue;
    const p = { text: lp.text, long: true, questions: lp.questions.map((q) => ({ ...q })) };
    bank.push(p);
    byKey.set(passageKey(p.text), p);
  }
  for (const bank of Object.values(APP_DATA.READING_PASSAGES)) {
    for (const p of bank) for (const q of p.questions) if (q.level == null) q.level = guessQuestionLevel(q.question);
  }
})();
