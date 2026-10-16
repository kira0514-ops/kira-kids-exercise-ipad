// Story Time: read one 5-paragraph story, then answer its 6-7 questions with the story kept
// on screen. Stories live in stories_g2.js ... stories_g7.js (STORY_BANK); each age +
// difficulty maps to a grade-level tier. Early and Upper Elementary only.

const STORY_TIERS = {
  1: ["G2", "G3", "G4", "G5"], // Early Elementary: Easy, Medium, Hard, Extreme
  2: ["G4", "G5", "G6", "G7"], // Upper Elementary
};
const STORY_TIER_INFO = {
  G2: "Grade 2 · about 300 words", G3: "Grade 3 · about 400 words", G4: "Grade 4 · about 480 words",
  G5: "Grade 5 · about 570 words", G6: "Grade 6 · about 690 words", G7: "Grade 7 · about 780 words",
};

const storyState = { story: null, index: 0, score: 0, answered: false, order: [] };

function storyDiffIdx() {
  const p = PROFILES.active();
  return p && p.storyDiffIdx != null ? p.storyDiffIdx : Math.min(state.diffIdx, 3);
}

function storyTier(ageIdx, diffIdx) {
  const tiers = STORY_TIERS[ageIdx];
  return tiers ? tiers[Math.min(diffIdx, 3)] : null;
}

function showStoryTimeSetup() {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("📚 Story Time", "Read a 5-paragraph story, then answer questions about it"));
  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("🏠 Main Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card" });
  if (!STORY_TIERS[state.ageIdx]) {
    card.appendChild(el("div", { class: "step-text",
      text: "Story Time starts at Early Elementary. Switch the age group on the main screen to try it." }));
    root.appendChild(card);
    return;
  }
  card.appendChild(el("div", { class: "note", text: APP_DATA.AGE_GROUPS[state.ageIdx] }));
  card.appendChild(el("h3", { text: "⭐ Difficulty:" }));
  const row = el("div", { class: "chip-row" });
  const current = storyDiffIdx();
  APP_DATA.DIFFICULTIES.forEach((label, i) => {
    const tier = storyTier(state.ageIdx, i);
    row.appendChild(button(`${label} (${STORY_TIER_INFO[tier].split(" · ")[0]})`, () => {
      PROFILES.updateActive({ storyDiffIdx: i });
      showStoryTimeSetup();
    }, i === current ? "chip-selected" : "chip"));
  });
  card.appendChild(row);
  const tier = storyTier(state.ageIdx, current);
  const count = STORY_BANK.filter((s) => s.tier === tier).length;
  card.appendChild(el("div", { class: "note",
    text: `${STORY_TIER_INFO[tier]} · ${count} stories at this level. Harder levels use longer stories, ` +
      "richer words, trickier grammar, and stories told out of order with clues to notice." }));
  card.appendChild(el("div", { style: "height:12px" }));
  const start = button("🚀 Start a Story", startStoryTime, "start");
  if (!count) start.disabled = true;
  card.appendChild(start);
  root.appendChild(card);
}

function startStoryTime() {
  const tier = storyTier(state.ageIdx, storyDiffIdx());
  const pool = STORY_BANK.filter((s) => s.tier === tier);
  if (!pool.length) return;
  const story = SEEN.pickUnseen(`story_time_${tier}`, pool, (s) => s.id);
  storyState.story = story;
  storyState.index = 0;
  storyState.score = 0;
  storyState.missed = [];
  storyState.order = story.questions.map((q) => ({ ...q, choices: shuffle(q.choices.slice()) }));
  showStoryQuestion();
}

function storyPanel(story) {
  const panel = el("div", { class: "card story-panel" });
  const head = el("div", { class: "story-head" });
  head.appendChild(el("div", { class: "lesson-section-title", text: `📖 ${story.title}` }));
  const readAll = button("🔊 Read All", () => speak(story.paragraphs.join(" ")), "next");
  readAll.classList.add("read-aloud-btn");
  head.appendChild(readAll);
  panel.appendChild(head);
  story.paragraphs.forEach((p, i) => {
    const row = el("div", { class: "story-para" });
    row.appendChild(el("span", { class: "story-para-num", text: String(i + 1) }));
    row.appendChild(el("span", { class: "story-para-text", text: p }));
    const say = button("🔊", () => speak(p), "chip");
    say.classList.add("story-para-say");
    row.appendChild(say);
    panel.appendChild(row);
  });
  return panel;
}

function showStoryQuestion() {
  applyThemeVars();
  clearRoot();
  const { story, index, order } = storyState;
  const q = order[index];
  root.appendChild(headerBanner("📚 Story Time", `Question ${index + 1} of ${order.length}`));
  const top = el("div", { class: "quiz-top" });
  top.appendChild(el("span", { text: `⭐ ${storyState.score} correct` }));
  top.appendChild(button("🚪 Quit", showStoryTimeSetup, "quit"));
  root.appendChild(top);

  const layout = el("div", { class: "story-layout" });
  layout.appendChild(storyPanel(story));

  const qcard = el("div", { class: "card story-question" });
  qcard.appendChild(el("div", { class: "prompt", text: q.question }));
  const grid = el("div", { class: "choices-grid story-choices" });
  const feedback = el("div", { class: "feedback" });
  const next = button(index + 1 < order.length ? "Next ▶" : "See Results ▶", () => {
    storyState.index += 1;
    if (storyState.index >= order.length) showStoryResults();
    else showStoryQuestion();
  }, "next");
  next.disabled = true;
  const shownAt = Date.now();
  const buttons = q.choices.map((c) => {
    const b = button(c, () => {
      const correct = c === q.answer;
      buttons.forEach((x) => { x.disabled = true; if (x.textContent === q.answer) x.classList.add("choice-correct"); });
      if (!correct) b.classList.add("choice-wrong");
      if (correct) storyState.score += 1; else storyState.missed.push(q);
      feedback.textContent = (correct ? "Correct! ✅ " : `Not quite — the answer is “${q.answer}”. `) + (q.explain || "");
      feedback.className = "feedback " + (correct ? "feedback-correct" : "feedback-wrong");
      ACTIVITY.record({ subject: "Reading / Spelling", topic: "Story Time",
        prompt: `${story.title}\n\n${story.paragraphs.join("\n\n")}\n\n${q.question}`, answer: q.answer },
        correct, Date.now() - shownAt, c);
      next.disabled = false;
    }, "choice");
    grid.appendChild(b);
    return b;
  });
  qcard.appendChild(grid);
  qcard.appendChild(feedback);
  qcard.appendChild(el("div", { class: "next-row" }, [next]));
  layout.appendChild(qcard);
  root.appendChild(layout);
}

function showStoryResults() {
  applyThemeVars();
  clearRoot();
  const { story, score, order, missed } = storyState;
  const pct = Math.round((100 * score) / order.length);
  const title = pct === 100 ? "🌟 Perfect Reading!" : pct >= 70 ? "🎉 Great Reading!" : "📖 Good Effort!";
  root.appendChild(headerBanner(title, `“${story.title}”`));
  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "score-line", text: `${score} / ${order.length} correct (${pct}%)` }));
  if (missed.length) {
    card.appendChild(el("h3", { text: "📝 Look back at these:" }));
    for (const q of missed) {
      const item = el("div", { class: "review-item" });
      item.appendChild(el("div", { class: "report-missed-q", text: q.question }));
      item.appendChild(el("div", { class: "report-missed-right", text: `✓ ${q.answer}` }));
      if (q.explain) item.appendChild(el("div", { class: "note", text: q.explain }));
      card.appendChild(item);
    }
  }
  root.appendChild(card);
  const row = el("div", { class: "next-row" });
  row.appendChild(button("📚 Another Story", startStoryTime, "playagain"));
  row.appendChild(button("🏠 Main Menu", showSetup, "quit"));
  root.appendChild(row);
}
