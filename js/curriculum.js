// Port of kids_exercise_app.py's 365-Day Curriculum: get_curriculum_phase,
// daily_curriculum_topics, DailyCurriculumTracker (localStorage instead of a JSON file),
// and the show_daily_curriculum / show_daily_lesson / start_daily_curriculum screens.

function getCurriculumPhase(ageIdx, day) {
  const phases = APP_DATA.CURRICULUM_PHASES[ageIdx];
  let phase = phases[0];
  for (const p of phases) {
    if (p[0] <= day) phase = p;
    else break;
  }
  const [, diffIdx, mathList, readingList, logicList, unitLabel] = phase;
  const mathAvail = mathList !== null ? mathList : APP_DATA.MATH_TOPICS.filter((t) => APP_DATA.MATH_TOPIC_MIN_AGE[t] <= ageIdx);
  const readingAvail = readingList !== null ? readingList : APP_DATA.READING_TOPICS.filter((t) => APP_DATA.READING_TOPIC_MIN_AGE[t] <= ageIdx);
  const logicAvail = logicList !== null ? logicList : APP_DATA.LOGIC_TOPICS.filter((t) => APP_DATA.LOGIC_TOPIC_MIN_AGE[t] <= ageIdx);
  return [diffIdx, mathAvail, readingAvail, logicAvail, unitLabel];
}

function dailyCurriculumTopics(ageIdx, day) {
  const [diffIdx, mathAvail, readingAvail, logicAvail, unitLabel] = getCurriculumPhase(ageIdx, day);
  function pick(avail, n) {
    if (!avail.length) return [];
    n = Math.min(n, avail.length);
    const start = (day * 3) % avail.length;
    const seenLocal = new Set();
    const out = [];
    let i = 0;
    while (out.length < n) {
      const topic = avail[(start + i) % avail.length];
      if (!seenLocal.has(topic)) { seenLocal.add(topic); out.push(topic); }
      i++;
    }
    return out;
  }
  return [diffIdx, pick(mathAvail, 3), pick(readingAvail, 2), pick(logicAvail, 1), unitLabel];
}

const DAILY_STORAGE_KEY = "kidsExerciseGenerator.daily";

class DailyCurriculumTracker {
  constructor() {
    this.profileId = "default";
    this.ageIdx = 1;
    this.currentDay = 1;
    this.completedDays = new Set();
    this.load();
  }

  // "default" keeps the original un-suffixed storage key, so a pre-existing
  // single-player's curriculum progress survives being folded into a profile.
  storageKey() {
    return this.profileId === "default" ? DAILY_STORAGE_KEY : `${DAILY_STORAGE_KEY}.${this.profileId}`;
  }

  setProfile(profileId) {
    this.profileId = profileId || "default";
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      const data = raw ? JSON.parse(raw) : {};
      this.ageIdx = data.age_idx ?? 1;
      this.currentDay = data.current_day ?? 1;
      this.completedDays = new Set(data.completed_days || []);
    } catch (e) {
      this.ageIdx = 1;
      this.currentDay = 1;
      this.completedDays = new Set();
    }
  }

  save() {
    try {
      const data = { age_idx: this.ageIdx, current_day: this.currentDay, completed_days: Array.from(this.completedDays).sort((a, b) => a - b) };
      localStorage.setItem(this.storageKey(), JSON.stringify(data));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  setAge(ageIdx) {
    if (ageIdx !== this.ageIdx) {
      this.ageIdx = ageIdx;
      this.currentDay = 1;
      this.completedDays = new Set();
      this.save();
    }
  }

  completeToday() {
    this.completedDays.add(this.currentDay);
    if (this.currentDay < 365) this.currentDay += 1;
    this.save();
  }
}

const DAILY = new DailyCurriculumTracker();
const DAILY_CURRICULUM_QUESTION_COUNT = 30;

function showDailyCurriculum() {
  applyThemeVars();
  clearRoot();
  const t = theme();

  root.appendChild(headerBanner("📆 365-Day Curriculum"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(el("span", { text: "" }));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  root.appendChild(el("p", { class: "note curriculum-intro",
    text: "Pick an age track — each has its own 365-day plan and its own progress, paced like a school year." }));

  const ageRow = el("div", { class: "chip-row curriculum-age-row" });
  APP_DATA.AGE_GROUPS.forEach((label, i) => {
    const icon = ["🧸", "🎒", "🎓"][i];
    ageRow.appendChild(button(`${icon} ${label}`, () => { DAILY.setAge(i); showDailyCurriculum(); },
      i === DAILY.ageIdx ? "chip-selected" : "chip"));
  });
  root.appendChild(ageRow);

  const cardBorder = el("div", { class: "lesson-card-border curriculum-card" });
  const cardInner = el("div", { class: "lesson-card-inner" });

  const day = DAILY.currentDay;
  if (day > 365) {
    cardInner.appendChild(el("div", { class: "lesson-section-title", text: "🎉 Curriculum Complete!" }));
    cardInner.appendChild(el("div", { class: "step-text", text:
      "You finished all 365 days for this age track. Pick another age track above, or keep " +
      "practicing with the regular quiz modes from the Menu." }));
    cardBorder.appendChild(cardInner);
    root.appendChild(cardBorder);
    return;
  }

  cardInner.appendChild(el("div", { class: "curriculum-day-heading", text: `Day ${day} of 365` }));

  const progressTrack = el("div", { class: "progress-track curriculum-progress" });
  const progressFill = el("div", { class: "progress-fill" });
  progressFill.style.width = `${(day / 365) * 100}%`;
  progressTrack.appendChild(progressFill);
  cardInner.appendChild(progressTrack);
  cardInner.appendChild(el("div", { class: "note", text: `${DAILY.completedDays.size} days completed so far` }));

  const [diffIdx, mathTopics, readingTopics, logicTopics, unitLabel] = dailyCurriculumTopics(DAILY.ageIdx, day);

  cardInner.appendChild(el("div", { class: "curriculum-unit-label", text: `📘 ${unitLabel}` }));

  const previewLines = [];
  if (mathTopics.length) previewLines.push("🔢 Math: " + mathTopics.join(", "));
  if (readingTopics.length) previewLines.push("📖 Reading: " + readingTopics.join(", "));
  if (logicTopics.length) previewLines.push("🧩 Logic: " + logicTopics.join(", "));
  previewLines.push(`Difficulty: ${APP_DATA.DIFFICULTIES[diffIdx]}`);
  cardInner.appendChild(el("div", { class: "step-text curriculum-preview", text: previewLines.join("\n") }));

  const lessonTopic = mathTopics[0];
  if (lessonTopic && APP_DATA.LESSONS.Math[lessonTopic]) {
    const section = APP_DATA.LESSONS.Math[lessonTopic].sections[0];
    const lessonBox = el("div", { class: "example-box curriculum-lesson-preview" });
    lessonBox.appendChild(el("div", { class: "lesson-section-title", text: `📖 Today's Lesson: ${section.title}` }));
    const previewSteps = section.steps.slice(0, 2).map((s) => "• " + s).join("\n");
    lessonBox.appendChild(el("div", { class: "example-text", text: previewSteps }));
    cardInner.appendChild(lessonBox);
  }

  cardInner.appendChild(button(`🚀 Start Day ${day}`, showDailyLesson, "start"));

  cardBorder.appendChild(cardInner);
  root.appendChild(cardBorder);
}

function showDailyLesson() {
  applyThemeVars();
  clearRoot();
  const t = theme();

  const day = DAILY.currentDay;
  const [diffIdx, mathTopics, readingTopics, logicTopics, unitLabel] = dailyCurriculumTopics(DAILY.ageIdx, day);
  let subject, topic;
  if (mathTopics.length) { subject = "Math"; topic = mathTopics[0]; }
  else if (readingTopics.length) { subject = "Reading / Spelling"; topic = readingTopics[0]; }
  else { subject = "Logic / Puzzles"; topic = logicTopics[0]; }

  root.appendChild(headerBanner(`📖 Day ${day}: ${topic}`));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", showDailyCurriculum, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  root.appendChild(el("div", { class: "curriculum-unit-label curriculum-unit-label-standalone", text: `📘 ${unitLabel}` }));

  const container = el("div", { class: "lesson-container" });
  renderLessonSections(container, subject, topic);
  root.appendChild(container);

  const btnRow = el("div", { class: "next-row" });
  btnRow.appendChild(button(`🚀 Start Day ${day} Exercises (${DAILY_CURRICULUM_QUESTION_COUNT} questions)`, startDailyCurriculum, "start"));
  root.appendChild(btnRow);
}

function startDailyCurriculum() {
  const ageIdx = DAILY.ageIdx;
  const day = DAILY.currentDay;
  const [diffIdx, mathTopics, readingTopics, logicTopics] = dailyCurriculumTopics(ageIdx, day);
  const topicSlots = [
    ...mathTopics.map((t) => ["Math", t, mathQuestion]),
    ...readingTopics.map((t) => ["Reading / Spelling", t, readingQuestion]),
    ...logicTopics.map((t) => ["Logic / Puzzles", t, logicQuestion]),
  ];
  const perTopic = Math.ceil(DAILY_CURRICULUM_QUESTION_COUNT / topicSlots.length);

  let questions = [];
  for (const [subject, topic, genFn] of topicSlots) {
    const seenPrompts = new Set();
    for (let i = 0; i < perTopic; i++) {
      let q = null;
      for (let attempt = 0; attempt < 25; attempt++) {
        q = genFn(ageIdx, diffIdx, [topic]);
        if (!seenPrompts.has(q.prompt)) break;
      }
      seenPrompts.add(q.prompt);
      q.subject = subject;
      q.diffIdx = diffIdx;
      q.ageIdx = ageIdx;
      questions.push(q);
    }
  }
  shuffle(questions);
  questions = questions.slice(0, DAILY_CURRICULUM_QUESTION_COUNT);

  state.questions = questions;
  state.currentIndex = 0;
  state.score = 0;
  state.missed = [];
  state.isDailyCurriculum = true;
  showQuestion();
}
