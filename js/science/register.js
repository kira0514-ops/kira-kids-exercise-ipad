// Registers SCIENCE_UNITS (see units.js) with the rest of the app. Runs after the unit data files
// and before app.js / curriculum use, so every topic list below already includes the new units.
const SCIENCE_CATEGORY_LABELS = {
  life: "🌱 Life Science",
  physical: "🧲 Physical Science",
  earth: "🌍 Earth & Space Science",
};
// The original four Early Elementary topics, for grouping in the topic picker.
const SCIENCE_TOPIC_CATEGORY = {
  Plants: "life", "My Body & Senses": "life", Materials: "physical", Magnets: "physical",
};

// Questions at or below the child's difficulty; once every one of those has been seen, widen to
// the next level up (then all) so the child gets new questions before anything repeats.
function sciDiffPool(qs, diffIdx, poolKey) {
  const seen = SEEN.seen[poolKey] || new Set();
  for (let d = diffIdx; d <= 2; d++) {
    const pool = qs.filter((q) => q.minDiff <= d);
    if (pool.length && pool.some((q) => !seen.has(q.prompt))) return pool;
  }
  return qs.filter((q) => q.minDiff <= diffIdx).length ? qs.filter((q) => q.minDiff <= diffIdx) : qs;
}

(function registerScienceUnits() {
  // Extra questions for the original four topics (early_extra.js), appended to their banks.
  if (typeof SCIENCE_EXTRA_QS !== "undefined") {
    const banks = { Magnets: MAGNET_FACT_QS, Plants: PLANT_FACT_QS, "My Body & Senses": BODY_SENSES_QS };
    for (const [topic, qs] of Object.entries(SCIENCE_EXTRA_QS)) {
      const bank = banks[topic];
      if (!bank) continue;
      const have = new Set(bank.map((q) => q.prompt));
      for (const q of qs) if (!have.has(q.prompt)) bank.push(q);
    }
  }

  const gradeRank = (g) => (g === "K" ? 0 : parseInt(String(g).replace(/\D/g, ""), 10) || 0);

  for (const unit of SCIENCE_UNITS) {
    const { topic, age } = unit;
    if (APP_DATA.SCIENCE_TOPICS.includes(topic)) continue;
    APP_DATA.SCIENCE_TOPICS.push(topic);
    APP_DATA.SCIENCE_TOPIC_MIN_AGE[topic] = age;
    APP_DATA.SCIENCE_TOPIC_MAX_AGE[topic] = age;
    SCIENCE_TOPIC_CATEGORY[topic] = unit.category;

    APP_DATA.LESSONS.Science[topic] = {
      sections: [{ title: unit.lesson.title, explanation: unit.lesson.explanation,
        practice: { age, diff: 0, n: 2 } }],
    };

    SCIENCE_TOPIC_FUNCS[topic] = (ageIdx, diffIdx) => {
      const poolKey = `science_unit_${topic}`;
      const q = SEEN.pickUnseen(poolKey, sciDiffPool(unit.qs, diffIdx, poolKey), (f) => f.prompt);
      return { prompt: q.prompt, choices: shuffle(q.choices.slice()), answer: q.answer,
        illustration: sciFactPhoto(q.prompt) };
    };
  }

  // 365-day curriculum: introduce each age's science topics in grade order across the year's
  // phases, keeping the previous phase's topics in rotation for review; the last phase reviews all.
  for (const [ageKey, phases] of Object.entries(APP_DATA.CURRICULUM_PHASES)) {
    const age = Number(ageKey);
    const topics = APP_DATA.SCIENCE_TOPICS
      .filter((t) => topicAgeOk(t, age, APP_DATA.SCIENCE_TOPIC_MIN_AGE, APP_DATA.SCIENCE_TOPIC_MAX_AGE))
      .map((t, i) => {
        const unit = SCIENCE_UNITS.find((u) => u.topic === t);
        return [t, unit ? gradeRank(unit.grade) : 1, i];
      })
      .sort((a, b) => a[1] - b[1] || a[2] - b[2])
      .map((x) => x[0]);
    if (!topics.length) continue;
    const learnPhases = Math.max(1, phases.length - 1);
    const chunks = Array.from({ length: learnPhases }, (_, i) =>
      topics.slice(Math.floor((i * topics.length) / learnPhases), Math.floor(((i + 1) * topics.length) / learnPhases)));
    phases.forEach((phase, i) => {
      phase[5] = i < learnPhases ? [...new Set([...(chunks[i - 1] || []), ...chunks[i]])] : topics.slice();
    });
  }
})();
