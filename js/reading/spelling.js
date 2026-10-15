// Merges the bigger spelling vocabulary (spelling_words_*.js) into the word lists used by
// Spell the Word, Unscramble, Missing Letter, First Letter and Word Length (see wordPool()).
// "upper" from both files lands in UPPER_WORDS; every word appears in only one list.
(function mergeSpellingWords() {
  const lists = { preschool: "PRESCHOOL_WORDS", early: "EARLY_WORDS", upper: "UPPER_WORDS", upper_hard: "UPPER_HARD_WORDS" };
  const used = new Set(Object.values(lists).flatMap((k) => APP_DATA[k]));
  for (const extra of SPELLING_WORDS_EXTRA) {
    for (const [tier, words] of Object.entries(extra)) {
      const target = APP_DATA[lists[tier]];
      if (!target) continue;
      for (const w of words) {
        if (!/^[a-z]+$/.test(w) || used.has(w)) continue;
        target.push(w);
        used.add(w);
      }
    }
  }
})();
