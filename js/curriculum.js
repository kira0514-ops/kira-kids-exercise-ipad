// Port of kids_exercise_app.py's 365-Day Curriculum: get_curriculum_phase,
// daily_curriculum_topics, DailyCurriculumTracker (localStorage instead of a JSON file),
// and the show_daily_curriculum / show_daily_lesson / start_daily_curriculum screens.

function getCurriculumPhase(ageIdx, day, trackYear = 1) {
  const phases = APP_DATA.CURRICULUM_PHASES[ageIdx];
  let phaseIdx = 0;
  for (let i = 0; i < phases.length; i++) {
    if (phases[i][0] <= day) phaseIdx = i;
    else break;
  }
  const phase = phases[phaseIdx];
  const [startDay, rawDiffIdx, mathList, readingList, logicList, unitLabel] = phase;
  // Ease into a harder phase over its first ~2 weeks instead of jumping straight to the
  // new difficulty on day 1 of the phase, so the ramp feels gradual rather than a sudden step.
  const prevDiffIdx = phaseIdx > 0 ? phases[phaseIdx - 1][1] : rawDiffIdx;
  const daysIntoPhase = day - startDay;
  let diffIdx = (daysIntoPhase < 14 && prevDiffIdx < rawDiffIdx) ? prevDiffIdx : rawDiffIdx;
  // Each age track spans several real-world years (e.g. Preschool covers ages 3-5), so a
  // child cycles through the same 365-day track more than once before the next track is
  // actually age-appropriate. Every repeat lap should feel noticeably harder than the last
  // instead of serving up identical content, so nudge the difficulty up per lap (capped at
  // Extreme) rather than only ever ramping within a single lap.
  diffIdx = Math.min(3, diffIdx + (trackYear - 1));
  const mathAvail = mathList !== null ? mathList : APP_DATA.MATH_TOPICS.filter((t) => APP_DATA.MATH_TOPIC_MIN_AGE[t] <= ageIdx);
  const readingAvail = readingList !== null ? readingList : APP_DATA.READING_TOPICS.filter((t) => APP_DATA.READING_TOPIC_MIN_AGE[t] <= ageIdx);
  const logicAvail = logicList !== null ? logicList : APP_DATA.LOGIC_TOPICS.filter((t) => APP_DATA.LOGIC_TOPIC_MIN_AGE[t] <= ageIdx);
  return [diffIdx, mathAvail, readingAvail, logicAvail, unitLabel];
}

function dailyCurriculumTopics(ageIdx, day, trackYear = 1, diffOverride = null) {
  const [autoDiffIdx, mathAvail, readingAvail, logicAvail, unitLabel] = getCurriculumPhase(ageIdx, day, trackYear);
  // A parent-chosen difficulty for this age track overrides the calendar-driven ramp -- the
  // day still determines which topics show up (that's the curriculum's actual sequencing),
  // only how hard each one is gets swapped out.
  const diffIdx = diffOverride !== null ? diffOverride : autoDiffIdx;
  function pick(avail, n) {
    if (!avail.length) return [];
    // Show up to `n` distinct topics from the pool (or the whole pool if it's smaller than
    // `n`) -- previously this additionally halved small pools (e.g. showing only 2 of 4
    // topics), meant to keep consecutive days from looking identical, but it backfired for
    // pools just above `n`: a 4-topic pool with n=3 only ever showed 2 per day, and which
    // 2 landed on a fixed day-based rotation, so specific topics (and specific days, like
    // day 1) could end up never showing a given topic at all. Capping at just the pool size
    // still leaves real day-to-day rotation whenever the pool is bigger than `n`.
    n = Math.min(n, avail.length);
    // day-1 so day 1 always starts at the first-listed (intended starting) topic,
    // instead of a scrambled offset that could open on a later topic out of order.
    const start = (day - 1) % avail.length;
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
  // Logic used to always pick just 1 topic/day (vs. math's 3 and reading's 2), so every one
  // of its ~5 daily question slots was the exact same topic -- the single most repetitive
  // slice of a session. Matches reading's count now.
  return [diffIdx, pick(mathAvail, 3), pick(readingAvail, 2), pick(logicAvail, 2), unitLabel];
}

const DAILY_STORAGE_KEY = "kidsExerciseGenerator.daily";

class DailyCurriculumTracker {
  constructor() {
    this.profileId = "default";
    this.ageIdx = 1;
    this.currentDay = 1;
    this.trackYear = 1;
    this.completedDays = new Set();
    this.diffOverrides = {}; // ageIdx -> diffIdx override; absent means "Auto" (calendar ramp)
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
      this.trackYear = data.track_year ?? 1;
      this.completedDays = new Set(data.completed_days || []);
      this.diffOverrides = data.diff_overrides || {};
    } catch (e) {
      this.ageIdx = 1;
      this.currentDay = 1;
      this.trackYear = 1;
      this.completedDays = new Set();
      this.diffOverrides = {};
    }
  }

  save() {
    try {
      const data = { age_idx: this.ageIdx, current_day: this.currentDay, track_year: this.trackYear,
        completed_days: Array.from(this.completedDays).sort((a, b) => a - b),
        diff_overrides: this.diffOverrides };
      localStorage.setItem(this.storageKey(), JSON.stringify(data));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  setAge(ageIdx) {
    if (ageIdx !== this.ageIdx) {
      this.ageIdx = ageIdx;
      this.currentDay = 1;
      this.trackYear = 1;
      this.completedDays = new Set();
      // diffOverrides is kept -- it's keyed per age track, so switching tracks and back
      // shouldn't lose a level a parent already dialed in for that track.
      this.save();
    }
  }

  // diffIdx null clears the override, falling back to the calendar-driven ramp for this track.
  setDiffOverride(ageIdx, diffIdx) {
    if (diffIdx === null) delete this.diffOverrides[ageIdx];
    else this.diffOverrides[ageIdx] = diffIdx;
    this.save();
  }

  diffOverrideFor(ageIdx) {
    return this.diffOverrides[ageIdx] ?? null;
  }

  completeToday() {
    this.completedDays.add(this.currentDay);
    if (this.currentDay < 365) this.currentDay += 1;
    this.save();
  }

  goToDay(day) {
    this.currentDay = Math.max(1, Math.min(365, day || 1));
    this.save();
  }

  // Same age track, one real-world year later -- restart at day 1 but a notch harder,
  // instead of jumping to a different (age-inappropriate) track or repeating identically.
  restartTrackHarder() {
    this.trackYear += 1;
    this.currentDay = 1;
    this.completedDays = new Set();
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

  root.appendChild(el("p", { class: "note curriculum-intro",
    text: "Difficulty normally ramps up automatically as the days go by -- pick a fixed level here instead if this track feels too easy (or too hard) for your child right now. This only changes how hard each day's questions are, not which topics show up." }));
  const diffOverride = DAILY.diffOverrideFor(DAILY.ageIdx);
  const diffOverrideRow = el("div", { class: "chip-row curriculum-diff-row" });
  diffOverrideRow.appendChild(button("🔄 Auto", () => { DAILY.setDiffOverride(DAILY.ageIdx, null); showDailyCurriculum(); },
    diffOverride === null ? "chip-selected" : "chip"));
  APP_DATA.DIFFICULTIES.forEach((label, i) => {
    diffOverrideRow.appendChild(button(label, () => { DAILY.setDiffOverride(DAILY.ageIdx, i); showDailyCurriculum(); },
      diffOverride === i ? "chip-selected" : "chip"));
  });
  root.appendChild(diffOverrideRow);

  const cardBorder = el("div", { class: "lesson-card-border curriculum-card" });
  const cardInner = el("div", { class: "lesson-card-inner" });

  const day = DAILY.currentDay;
  if (day > 365) {
    const ageIcons = ["🧸", "🎒", "🎓"];
    const trackLabel = APP_DATA.AGE_GROUPS[DAILY.ageIdx];
    const nextAgeIdx = DAILY.ageIdx + 1;
    const hasNextLevel = nextAgeIdx < APP_DATA.AGE_GROUPS.length;
    cardInner.appendChild(el("div", { class: "lesson-section-title", text: "🎉 Curriculum Complete!" }));
    cardInner.appendChild(el("div", { class: "step-text", text:
      `${ageIcons[DAILY.ageIdx]} You finished Year ${DAILY.trackYear} of the ${trackLabel} track! ` +
      `Since this track spans a few real ages, doing it again next year should feel like a step up, ` +
      `not the same thing twice.` }));
    cardInner.appendChild(button(`🔁 Start Year ${DAILY.trackYear + 1} of ${trackLabel} (harder)`,
      () => { DAILY.restartTrackHarder(); showDailyCurriculum(); }, "start"));
    if (hasNextLevel) {
      const nextLabel = APP_DATA.AGE_GROUPS[nextAgeIdx];
      cardInner.appendChild(el("div", { class: "step-text", text:
        "Growing faster than a typical pace? You can move up to the next track early instead:" }));
      cardInner.appendChild(button(`⬆️ Move up to ${ageIcons[nextAgeIdx]} ${nextLabel} now`,
        () => { DAILY.setAge(nextAgeIdx); showDailyCurriculum(); }, "next"));
    } else {
      cardInner.appendChild(el("div", { class: "step-text", text:
        "🏆 This is already the oldest track, so Extreme difficulty is the ceiling — or switch to the " +
        "regular quiz modes from the Menu for more variety." }));
    }
    cardBorder.appendChild(cardInner);
    root.appendChild(cardBorder);
    return;
  }

  cardInner.appendChild(el("div", { class: "curriculum-day-heading", text: `Day ${day} of 365` }));
  cardInner.appendChild(el("div", { class: "note", text: `Year ${DAILY.trackYear} of ${APP_DATA.AGE_GROUPS[DAILY.ageIdx]}` }));

  const jumpRow = el("div", { class: "count-row curriculum-jump-row" });
  const prevBtn = button("◀", () => { DAILY.goToDay(DAILY.currentDay - 1); showDailyCurriculum(); }, "chip");
  prevBtn.disabled = day <= 1;
  jumpRow.appendChild(prevBtn);
  jumpRow.appendChild(el("span", { text: "Jump to day:" }));
  const dayInput = el("input", { type: "number", min: "1", max: "365", class: "count-input curriculum-day-input" });
  dayInput.value = day;
  jumpRow.appendChild(dayInput);
  jumpRow.appendChild(button("Go", () => { DAILY.goToDay(parseInt(dayInput.value, 10)); showDailyCurriculum(); }, "chip"));
  const nextBtn = button("▶", () => { DAILY.goToDay(DAILY.currentDay + 1); showDailyCurriculum(); }, "chip");
  nextBtn.disabled = day >= 365;
  jumpRow.appendChild(nextBtn);
  cardInner.appendChild(jumpRow);

  const progressTrack = el("div", { class: "progress-track curriculum-progress" });
  const progressFill = el("div", { class: "progress-fill" });
  progressFill.style.width = `${(day / 365) * 100}%`;
  progressTrack.appendChild(progressFill);
  cardInner.appendChild(progressTrack);
  cardInner.appendChild(el("div", { class: "note", text: `${DAILY.completedDays.size} days completed so far` }));

  const [diffIdx, mathTopics, readingTopics, logicTopics, unitLabel] =
    dailyCurriculumTopics(DAILY.ageIdx, day, DAILY.trackYear, DAILY.diffOverrideFor(DAILY.ageIdx));

  cardInner.appendChild(el("div", { class: "curriculum-unit-label", text: `📘 ${unitLabel}` }));

  const previewLines = [];
  if (mathTopics.length) previewLines.push("🔢 Math: " + mathTopics.join(", "));
  if (readingTopics.length) previewLines.push("📖 Reading: " + readingTopics.join(", "));
  if (logicTopics.length) previewLines.push("🧩 Logic: " + logicTopics.join(", "));
  previewLines.push(`Difficulty: ${APP_DATA.DIFFICULTIES[diffIdx]}`);
  cardInner.appendChild(el("div", { class: "step-text curriculum-preview", text: previewLines.join("\n") }));

  const lessonTopic = mathTopics[0];
  const lessonEntry = lessonTopic && APP_DATA.LESSONS.Math[lessonTopic];
  const section = lessonEntry && lessonEntry.sections && lessonEntry.sections[0];
  if (section) {
    const lessonBox = el("div", { class: "example-box curriculum-lesson-preview" });
    lessonBox.appendChild(el("div", { class: "lesson-section-title", text: `📖 Today's Lesson: ${section.title}` }));
    // Every Math lesson's first section uses `steps` (a bullet list) except when it doesn't --
    // falling back to `explanation` (a single paragraph) keeps this from crashing the whole
    // curriculum day screen the way it did when a topic's lesson didn't match the convention.
    const previewSteps = section.steps
      ? section.steps.slice(0, 2).map((s) => "• " + s).join("\n")
      : section.explanation || "";
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
  const [diffIdx, mathTopics, readingTopics, logicTopics, unitLabel] =
    dailyCurriculumTopics(DAILY.ageIdx, day, DAILY.trackYear, DAILY.diffOverrideFor(DAILY.ageIdx));
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
  // Daily lessons only show the first (intro-level) section -- later sections in a
  // topic's lesson (e.g. Place Value's "Big Numbers") are written for older tracks and
  // shouldn't show up in a young child's guided daily lesson.
  renderLessonSections(container, subject, topic, DAILY.ageIdx, diffIdx, 1);
  root.appendChild(container);

  const btnRow = el("div", { class: "next-row" });
  btnRow.appendChild(button(`🚀 Start Day ${day} Exercises (${DAILY_CURRICULUM_QUESTION_COUNT} questions)`, startDailyCurriculum, "start"));
  root.appendChild(btnRow);
}

function startDailyCurriculum() {
  const ageIdx = DAILY.ageIdx;
  const day = DAILY.currentDay;
  const [diffIdx, mathTopics, readingTopics, logicTopics] =
    dailyCurriculumTopics(ageIdx, day, DAILY.trackYear, DAILY.diffOverrideFor(ageIdx));
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
        if (!seenPrompts.has(q.prompt) && !RECENT_PROMPTS.has(q.prompt)) break;
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
  RECENT_PROMPTS.addAll(questions.map((q) => q.prompt));

  state.questions = questions;
  state.currentIndex = 0;
  state.score = 0;
  state.missed = [];
  state.isDailyCurriculum = true;
  showQuestion();
}
