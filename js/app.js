// Screen navigation / app state -- mirrors kids_exercise_app.py's KidsExerciseApp class:
// each showX() function clears the #app root and renders a new screen into it, the same
// "clear_container() + show_X()" pattern used throughout the Tkinter version, to keep the
// two codebases easy to reason about side by side.

const state = {
  theme: "Rainbow",
  ageIdx: 1,
  diffIdx: 1,
  subjects: new Set(["Math"]),
  mathTopics: new Set(["Addition", "Subtraction", "Multiplication", "Division", "Place Value"]),
  readingTopics: new Set(APP_DATA.READING_TOPICS.filter((t) => t !== "Reading Comprehension")),
  logicTopics: new Set(APP_DATA.LOGIC_TOPICS),
  count: 10,
  questions: [],
  currentIndex: 0,
  score: 0,
  missed: [],
  isDailyCurriculum: false,
  flashcardDeck: [],
  flashcardIndex: 0,
};

const SUBJECT_NAMES = ["Math", "Reading / Spelling", "Logic / Puzzles"];
const SUBJECT_ICONS = { Math: "➕", "Reading / Spelling": "📖", "Logic / Puzzles": "🧩" };
const SUBJECT_TOPIC_STATE = {
  Math: () => state.mathTopics,
  "Reading / Spelling": () => state.readingTopics,
  "Logic / Puzzles": () => state.logicTopics,
};
const SUBJECT_TOPIC_LIST = {
  Math: () => APP_DATA.MATH_TOPICS,
  "Reading / Spelling": () => APP_DATA.READING_TOPICS,
  "Logic / Puzzles": () => APP_DATA.LOGIC_TOPICS,
};
const SUBJECT_MIN_AGE = {
  Math: APP_DATA.MATH_TOPIC_MIN_AGE,
  "Reading / Spelling": APP_DATA.READING_TOPIC_MIN_AGE,
  "Logic / Puzzles": APP_DATA.LOGIC_TOPIC_MIN_AGE,
};
const SUBJECT_GENERATOR = {
  Math: (ageIdx, diffIdx, topics) => mathQuestion(ageIdx, diffIdx, topics),
  "Reading / Spelling": (ageIdx, diffIdx, topics) => readingQuestion(ageIdx, diffIdx, topics),
  "Logic / Puzzles": (ageIdx, diffIdx, topics) => logicQuestion(ageIdx, diffIdx, topics),
};

const root = document.getElementById("app");

function availableTopics(subject) {
  const minAge = SUBJECT_MIN_AGE[subject];
  return Array.from(SUBJECT_TOPIC_STATE[subject]()).filter((t) => minAge[t] <= state.ageIdx);
}

function theme() {
  return APP_DATA.THEMES[state.theme];
}

function applyThemeVars() {
  const t = theme();
  const r = document.documentElement.style;
  r.setProperty("--bg", t.bg);
  r.setProperty("--text", t.text);
  r.setProperty("--grad1", t.grad1);
  r.setProperty("--grad2", t.grad2);
  r.setProperty("--font-family", `'${t.font_family}', sans-serif`);
  r.setProperty("--start-bg", t.start_bg);
  r.setProperty("--quit-bg", t.quit_bg);
  r.setProperty("--next-bg", t.next_bg);
  r.setProperty("--playagain-bg", t.playagain_bg);
  r.setProperty("--exit-bg", t.exit_bg);
}

function el(tag, opts = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(opts)) {
    if (k === "text") e.textContent = v;
    else if (k === "class") e.className = v;
    else if (k === "onclick") e.addEventListener("click", v);
    else e.setAttribute(k, v);
  }
  for (const c of children) e.appendChild(c);
  return e;
}

function clearRoot() {
  root.innerHTML = "";
}

function headerBanner(title, subtitle) {
  const t = theme();
  const banner = el("div", { class: "header-banner" });
  banner.style.background = `linear-gradient(135deg, ${t.grad1}, ${t.grad2})`;
  banner.appendChild(el("div", { class: "header-title", text: title }));
  if (subtitle) banner.appendChild(el("div", { class: "header-subtitle", text: subtitle }));
  return banner;
}

function button(text, onclick, variant = "start") {
  return el("button", { class: `btn btn-${variant}`, text, onclick });
}

// Freehand "show your work" pad for harder math questions -- mirrors kids_exercise_app.py's
// _create_scratchpad, ported from a Tkinter canvas to an HTML canvas driven by Pointer Events
// so mouse, touch, and stylus (iPad) all work the same way. onChange(hasInk) fires whenever
// ink appears or the pad is cleared, so the caller can gate the answer choices on it.
function createScratchpad(onChange) {
  const wrap = el("div", { class: "scratchpad-wrap" });
  wrap.appendChild(el("div", { class: "scratchpad-label", text: "✏️ Work it out here:" }));
  const canvas = document.createElement("canvas");
  canvas.className = "scratchpad-canvas";
  canvas.style.touchAction = "none";
  wrap.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let hasInk = false;
  let drawing = false;
  let lastX = 0, lastY = 0;
  let ratio = 1;

  function sizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1A237E";
  }

  function pointFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function start(e) {
    drawing = true;
    [lastX, lastY] = pointFromEvent(e);
  }
  function move(e) {
    if (!drawing) return;
    const [x, y] = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    [lastX, lastY] = [x, y];
    if (!hasInk) { hasInk = true; onChange(true); }
  }
  function end() { drawing = false; }

  canvas.addEventListener("pointerdown", start);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointerleave", end);
  canvas.addEventListener("pointercancel", end);

  requestAnimationFrame(sizeCanvas);

  const clearBtn = button("🧹 Clear", () => {
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    hasInk = false;
    onChange(false);
  }, "exit");
  clearBtn.classList.add("scratchpad-clear-btn");
  wrap.appendChild(clearBtn);

  return wrap;
}

// -- Setup / main menu ------------------------------------------------------
function showSetup() {
  applyThemeVars();
  clearRoot();
  const t = theme();

  root.appendChild(headerBanner(t.banner_title, t.banner_subtitle));

  const profileBar = el("div", { class: "quiz-top" });
  const activeProfile = PROFILES.active();
  profileBar.appendChild(el("span", { text: `👤 Playing as: ${activeProfile ? activeProfile.name : "Player"}` }));
  profileBar.appendChild(button("Switch Player", showProfilePicker, "quit"));
  root.appendChild(profileBar);

  const layout = el("div", { class: "setup-layout" });

  // -- left column: theme / age / difficulty / topics --
  const left = el("div", { class: "col" });

  left.appendChild(el("h3", { text: "🎨 Choose a Theme:" }));
  const themeRow = el("div", { class: "chip-row" });
  for (const name of Object.keys(APP_DATA.THEMES)) {
    const icon = { Rainbow: "🌈", "Matchbox Cars": "🏎️", Minecraft: "⛏️" }[name] || "";
    const chip = button(`${icon}  ${name}`, () => { state.theme = name; PROFILES.updateActive({ theme: name }); showSetup(); },
      name === state.theme ? "chip-selected" : "chip");
    themeRow.appendChild(chip);
  }
  left.appendChild(themeRow);

  left.appendChild(el("h3", { text: "📚 Choose Subjects:" }));
  const subjRow = el("div", { class: "chip-row" });
  for (const subject of SUBJECT_NAMES) {
    const cb = el("input", { type: "checkbox" });
    cb.checked = state.subjects.has(subject);
    cb.addEventListener("change", () => {
      if (cb.checked) state.subjects.add(subject); else state.subjects.delete(subject);
      showSetup();
    });
    const label = el("label", { class: "topic-chip" });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(` ${SUBJECT_ICONS[subject]} ${subject}`));
    subjRow.appendChild(label);
  }
  left.appendChild(subjRow);

  for (const subject of SUBJECT_NAMES) {
    if (!state.subjects.has(subject)) continue;
    const topicSet = SUBJECT_TOPIC_STATE[subject]();
    const heading = el("h3", { text: `${SUBJECT_ICONS[subject]} ${subject} Topics:` });
    const clearAllBtn = button("Clear All", () => { topicSet.clear(); showSetup(); }, "chip");
    clearAllBtn.classList.add("clear-all-btn");
    heading.appendChild(clearAllBtn);
    left.appendChild(heading);
    const topicsGrid = el("div", { class: "topics-grid" });
    const minAge = SUBJECT_MIN_AGE[subject];
    for (const topic of SUBJECT_TOPIC_LIST[subject]()) {
      const available = minAge[topic] <= state.ageIdx;
      const label = el("label", { class: available ? "topic-chip" : "topic-chip topic-disabled" });
      const cb = el("input", { type: "checkbox" });
      cb.checked = available && topicSet.has(topic);
      cb.disabled = !available;
      cb.addEventListener("change", () => {
        if (cb.checked) topicSet.add(topic); else topicSet.delete(topic);
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + topic));
      topicsGrid.appendChild(label);
    }
    left.appendChild(topicsGrid);
  }

  left.appendChild(el("h3", { text: "🎂 Age Group:" }));
  const ageRow = el("div", { class: "chip-row" });
  APP_DATA.AGE_GROUPS.forEach((label, i) => {
    const icon = ["🧸", "🎒", "🎓"][i];
    ageRow.appendChild(button(`${icon} ${label}`, () => { state.ageIdx = i; PROFILES.updateActive({ ageIdx: i }); showSetup(); },
      i === state.ageIdx ? "chip-selected" : "chip"));
  });
  left.appendChild(ageRow);

  left.appendChild(el("h3", { text: "⭐ Difficulty:" }));
  const diffRow = el("div", { class: "chip-row" });
  APP_DATA.DIFFICULTIES.forEach((label, i) => {
    diffRow.appendChild(button(label, () => { state.diffIdx = i; showSetup(); },
      i === state.diffIdx ? "chip-selected" : "chip"));
  });
  left.appendChild(diffRow);

  const countRow = el("div", { class: "count-row" });
  countRow.appendChild(el("span", { text: "🔢 Number of Questions: " }));
  const countInput = el("input", { type: "number", min: "5", max: "30", class: "count-input" });
  countInput.value = state.count;
  countInput.addEventListener("change", () => {
    state.count = Math.max(5, Math.min(30, parseInt(countInput.value, 10) || 10));
  });
  countRow.appendChild(countInput);
  left.appendChild(countRow);

  const errorLabel = el("div", { class: "error-label", id: "setup-error" });
  left.appendChild(errorLabel);

  // -- right column: play actions --
  const right = el("div", { class: "col" });
  right.appendChild(el("h3", { text: "🎮 Play" }));
  right.appendChild(button("🚀 Start!", startQuiz, "start"));
  right.appendChild(el("div", { style: "height:14px" }));
  right.appendChild(button("📚 Learn a Topic", showLessonPicker, "next"));
  right.appendChild(el("div", { style: "height:10px" }));
  right.appendChild(button("📆 365-Day Curriculum", showDailyCurriculum, "next"));
  right.appendChild(el("div", { style: "height:10px" }));
  right.appendChild(button("📇 Phonics Flashcards", startPhonicsFlashcards, "next"));
  right.appendChild(el("div", { style: "height:10px" }));
  right.appendChild(button("🎮 Mini Math Games", showMiniGames, "next"));
  const note = el("p", { class: "note",
    text: "Every feature is fully working: Math, Reading, Logic, Lessons, the 365-Day " +
      "Curriculum, Phonics Flashcards, and Mini Math Games (word difficulty matches the age group above)." });
  right.appendChild(note);

  layout.appendChild(left);
  layout.appendChild(right);
  root.appendChild(layout);
}

function startQuiz() {
  const errorLabel = document.getElementById("setup-error");
  const chosenSubjects = SUBJECT_NAMES.filter((s) => state.subjects.has(s));
  if (chosenSubjects.length === 0) {
    errorLabel.textContent = "⚠ Please choose at least one subject.";
    return;
  }
  for (const subject of chosenSubjects) {
    if (availableTopics(subject).length === 0) {
      errorLabel.textContent = `⚠ Please choose at least one ${subject} topic.`;
      return;
    }
  }

  const questions = [];
  const seenPrompts = new Set();
  for (let i = 0; i < state.count; i++) {
    const subject = choice(chosenSubjects);
    const topics = availableTopics(subject);
    let q = null;
    for (let attempt = 0; attempt < 25; attempt++) {
      q = SUBJECT_GENERATOR[subject](state.ageIdx, state.diffIdx, topics);
      if (!seenPrompts.has(q.prompt) && !RECENT_PROMPTS.has(q.prompt)) break;
    }
    seenPrompts.add(q.prompt);
    q.subject = subject;
    q.diffIdx = state.diffIdx;
    q.ageIdx = state.ageIdx;
    questions.push(q);
  }
  RECENT_PROMPTS.addAll(questions.map((q) => q.prompt));
  state.questions = questions;
  state.currentIndex = 0;
  state.score = 0;
  state.missed = [];
  showQuestion();
}

// -- Quiz -------------------------------------------------------------------
function showQuestion() {
  applyThemeVars();
  clearRoot();
  const t = theme();
  const q = state.questions[state.currentIndex];

  root.appendChild(headerBanner(t.quiz_title));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(el("span", { text: `Question ${state.currentIndex + 1} of ${state.questions.length}` }));
  top.appendChild(el("span", { text: `⭐ Score: ${state.score}` }));
  top.appendChild(button("🚪 Quit", showSetup, "quit"));
  root.appendChild(top);

  const progress = el("div", { class: "progress-track" });
  const bar = el("div", { class: "progress-fill" });
  bar.style.width = `${((state.currentIndex + 1) / state.questions.length) * 100}%`;
  progress.appendChild(bar);
  root.appendChild(progress);

  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "prompt", text: String(q.prompt) }));
  const readAloudBtn = button("🔊 Read Aloud", () => speak(String(q.speak || q.prompt)), "next");
  readAloudBtn.classList.add("read-aloud-btn");
  card.appendChild(readAloudBtn);

  const feedback = el("div", { class: "feedback", id: "quiz-feedback" });
  const nextRow = el("div", { class: "next-row" });
  const nextBtn = button(state.currentIndex + 1 < state.questions.length ? "Next ▶" : "See Results ▶",
    nextQuestion, "next");
  nextBtn.disabled = true;
  nextBtn.id = "quiz-next-btn";
  nextRow.appendChild(nextBtn);

  const INTERACTIVE_TYPES = ["make_ten", "vertical_column", "vertical_subtract", "spell_word", "sentence_builder", "number_grid"];
  if (INTERACTIVE_TYPES.includes(q.interactive)) {
    // Worked-out box exercise instead of multiple choice -- it can only ever be "finished"
    // once actually solved correctly, so completion always counts as correct.
    const onSolved = () => {
      state.score += 1;
      feedback.textContent = "Correct! ✅";
      feedback.className = "feedback feedback-correct";
      nextBtn.disabled = false;
    };
    const interactive = q.interactive === "make_ten" ? buildMakeTenInteractive(q, onSolved)
      : q.interactive === "vertical_column" ? buildVerticalColumnInteractive(q, q.sign, onSolved)
      : q.interactive === "vertical_subtract" ? buildVerticalSubtractionInteractive(q, onSolved)
      : q.interactive === "spell_word" ? buildSpellWordInteractive(q.word, q.emoji, onSolved)
      : q.interactive === "sentence_builder" ? buildSentenceBuilderInteractive(q.words, onSolved)
      : buildNumberGridInteractive(q.grid, q.answer, onSolved);
    card.appendChild(interactive);
    root.appendChild(card);
  } else {
    const visual = drawQVisual(q, t);
    if (visual) {
      const wrap = el("div", { class: "illustration-wrap" });
      wrap.appendChild(visual);
      card.appendChild(wrap);
    }

    const requiresScratchpad = q.subject === "Math" &&
      ((q.diffIdx ?? state.diffIdx) >= 2 || (q.ageIdx ?? state.ageIdx) === 0);
    if (requiresScratchpad) {
      card.appendChild(createScratchpad((hasInk) => {
        buttons.forEach((b) => { b.disabled = !hasInk; });
      }));
    }
    root.appendChild(card);

    const choicesGrid = el("div", { class: "choices-grid" });
    const choiceStrs = q.choices.map(String);
    const buttons = [];
    choiceStrs.forEach((cs, i) => {
      const btn = button(cs, null, "choice");
      btn.disabled = requiresScratchpad;
      btn.addEventListener("click", () => onChoice(cs, btn, buttons, q));
      buttons.push(btn);
      choicesGrid.appendChild(btn);
    });
    root.appendChild(choicesGrid);
  }

  root.appendChild(feedback);
  root.appendChild(nextRow);
}

function onChoice(chosenStr, clickedBtn, buttons, q) {
  const answerStr = String(q.answer);
  const isCorrect = chosenStr === answerStr;
  for (const b of buttons) b.disabled = true;
  clickedBtn.classList.add(isCorrect ? "choice-correct" : "choice-wrong");
  if (!isCorrect) {
    buttons.forEach((b, i) => {
      if (String(q.choices[i]) === answerStr) b.classList.add("choice-correct");
    });
    state.missed.push(q);
  } else {
    state.score += 1;
  }
  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = isCorrect ? "Correct! ✅" : `Not quite — the answer is ${answerStr}.`;
  feedback.className = "feedback " + (isCorrect ? "feedback-correct" : "feedback-wrong");
  document.getElementById("quiz-next-btn").disabled = false;
}

function nextQuestion() {
  state.currentIndex += 1;
  if (state.currentIndex >= state.questions.length) showResults();
  else showQuestion();
}

// -- Results ------------------------------------------------------------
function showResults() {
  applyThemeVars();
  clearRoot();
  const t = theme();
  const total = state.questions.length;
  const pct = total ? Math.round((100 * state.score) / total) : 0;
  const icons = t.result_icons;
  let title, msg;
  if (pct === 100) { title = `${icons[0]} Amazing Job!`; msg = "Perfect score! You're a superstar!"; }
  else if (pct >= 80) { title = `${icons[1]} Great Job!`; msg = "Great work — you really know your stuff!"; }
  else if (pct >= 50) { title = `${icons[2]} Good Effort!`; msg = "Nice try — keep practicing and you'll improve!"; }
  else { title = `${icons[3]} Keep Practicing!`; msg = "Practice makes perfect — try again!"; }

  const wasDailyCurriculum = state.isDailyCurriculum;
  const completedDay = DAILY.currentDay;
  if (wasDailyCurriculum) {
    DAILY.completeToday();
    state.isDailyCurriculum = false;
  }

  root.appendChild(headerBanner(title));

  const card = el("div", { class: "card" });
  if (wasDailyCurriculum) {
    card.appendChild(el("div", { class: "lesson-section-title", text: `📆 Day ${completedDay} of the 365-Day Curriculum complete!` }));
  }
  card.appendChild(el("div", { class: "score-line", text: `${state.score} / ${total} correct (${pct}%)` }));
  card.appendChild(el("div", { class: "score-msg", text: msg }));
  root.appendChild(card);

  if (state.missed.length) {
    root.appendChild(el("h3", { text: "📝 Review these:" }));
    const review = el("div", { class: "review-list" });
    for (const q of state.missed) {
      review.appendChild(el("div", { class: "review-item",
        text: `${String(q.prompt).replace(/\n/g, " ")}  → ${q.answer}` }));
    }
    root.appendChild(review);
  }

  const btnRow = el("div", { class: "next-row" });
  if (wasDailyCurriculum) {
    btnRow.appendChild(button("📆 Back to Curriculum", showDailyCurriculum, "playagain"));
  } else {
    btnRow.appendChild(button("🔄 Play Again", showSetup, "playagain"));
  }
  root.appendChild(btnRow);
}

// -- boot --------------------------------------------------------------
if (PROFILES.active()) {
  enterProfile(PROFILES.activeId);
} else {
  showProfilePicker();
}
