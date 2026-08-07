// Port of kids_exercise_app.py's lesson viewer: _render_lesson_sections, show_lesson,
// show_lesson_picker, _generate_for_section, _render_practice_question.

const TOPIC_FUNCS_BY_SUBJECT = {
  Math: () => MATH_TOPIC_FUNCS,
  "Reading / Spelling": () => READING_TOPIC_FUNCS,
  "Logic / Puzzles": () => LOGIC_TOPIC_FUNCS,
};

function matchesPredicateRule(q, rule) {
  if (!rule) return true;
  const prompt = String(q.prompt || "");
  if (rule.type === "count_at_least") {
    const count = prompt.split(rule.char).length - 1;
    return count >= rule.min;
  }
  if (rule.type === "contains") return prompt.includes(rule.text);
  if (rule.type === "contains_lower") return prompt.toLowerCase().includes(rule.text);
  if (rule.type === "not_contains_lower") return !prompt.toLowerCase().includes(rule.text);
  if (rule.type === "chart_kind_in") return rule.kinds.includes((q.chart || {}).kind);
  return true;
}

function generateForSection(subject, topic, spec, learnerAgeIdx, learnerDiffIdx) {
  const fn = TOPIC_FUNCS_BY_SUBJECT[subject]()[topic];
  // Practice questions always match the learner's own age/difficulty, not the lesson's
  // hardcoded spec -- otherwise e.g. a Kindergartner reading a Place Value lesson would
  // get Upper Elementary-level practice questions baked into that section.
  const ageIdx = learnerAgeIdx != null ? learnerAgeIdx : spec.age;
  const diffIdx = learnerDiffIdx != null ? learnerDiffIdx : spec.diff;
  const rule = spec.predicate_rule || null;
  const tries = spec.tries || 20;
  const n = spec.n || 2;
  const results = [];
  const seenPrompts = new Set();
  for (let i = 0; i < n; i++) {
    let cand = null;
    for (let attempt = 0; attempt < tries; attempt++) {
      cand = fn(ageIdx, diffIdx);
      if (seenPrompts.has(String(cand.prompt))) continue;
      if (!rule || matchesPredicateRule(cand, rule)) break;
    }
    seenPrompts.add(String(cand.prompt));
    results.push(cand);
  }
  return results;
}

function renderPracticeQuestion(parent, q) {
  const t = theme();
  const box = el("div", { class: "practice-box" });
  box.appendChild(el("div", { class: "practice-prompt", text: String(q.prompt) }));
  const visual = drawQVisual(q, t);
  if (visual) {
    const wrap = el("div", { class: "illustration-wrap" });
    wrap.appendChild(visual);
    box.appendChild(wrap);
  }
  const btnRow = el("div", { class: "practice-choices" });
  const feedback = el("div", { class: "feedback" });
  const answerStr = String(q.answer);
  const choiceStrs = q.choices.map(String);
  const buttons = [];
  choiceStrs.forEach((cs) => {
    const btn = button(cs, null, "choice");
    btn.addEventListener("click", () => {
      const isCorrect = cs === answerStr;
      for (const b of buttons) b.disabled = true;
      btn.classList.add(isCorrect ? "choice-correct" : "choice-wrong");
      if (!isCorrect) {
        buttons.forEach((b, i) => { if (choiceStrs[i] === answerStr) b.classList.add("choice-correct"); });
      }
      feedback.textContent = isCorrect ? "Correct! ✅" : `Not quite — the answer is ${answerStr}.`;
      feedback.className = "feedback " + (isCorrect ? "feedback-correct" : "feedback-wrong");
    });
    buttons.push(btn);
    btnRow.appendChild(btn);
  });
  box.appendChild(btnRow);
  box.appendChild(feedback);
  parent.appendChild(box);
}

function lessonSectionSpeakText(section) {
  const parts = [];
  if (section.title) parts.push(section.title);
  if (section.formula) {
    const lines = Array.isArray(section.formula) ? section.formula : [section.formula];
    parts.push(...lines);
  }
  if (section.steps) parts.push(...section.steps);
  else if (section.explanation) parts.push(section.explanation);
  for (const ex of section.examples || []) parts.push(ex.text);
  return parts.join(". ");
}

function renderLessonSections(container, subject, topic, learnerAgeIdx, learnerDiffIdx, sectionLimit) {
  const lesson = APP_DATA.LESSONS[subject][topic];
  let sections = lesson.sections;
  if (!sections) {
    const examples = lesson.examples || [{ text: lesson.example, illustration: lesson.illustration }];
    sections = [{ title: null, explanation: lesson.explanation, examples }];
  }
  if (sectionLimit) sections = sections.slice(0, sectionLimit);

  sections.forEach((section, secI) => {
    const cardBorder = el("div", { class: "lesson-card-border" });
    const cardInner = el("div", { class: "lesson-card-inner" });

    if (section.title) cardInner.appendChild(el("div", { class: "lesson-section-title", text: `${secI + 1}. ${section.title}` }));

    const speakBtn = button("🔊 Read Aloud", () => speak(lessonSectionSpeakText(section)), "next");
    speakBtn.classList.add("read-aloud-btn");
    cardInner.appendChild(speakBtn);

    if (section.formula) {
      const formulaLines = Array.isArray(section.formula) ? section.formula : [section.formula];
      const box = el("div", { class: "formula-box" });
      for (const line of formulaLines) box.appendChild(el("div", { class: "formula-line", text: line }));
      cardInner.appendChild(box);
    }

    if (section.steps) {
      const stepsFrame = el("div", { class: "steps-frame" });
      for (const step of section.steps) {
        const row = el("div", { class: "step-row" });
        row.appendChild(el("span", { class: "step-bullet", text: "•" }));
        row.appendChild(el("span", { class: "step-text", text: step }));
        stepsFrame.appendChild(row);
      }
      cardInner.appendChild(stepsFrame);
    } else if (section.explanation) {
      cardInner.appendChild(el("div", { class: "step-text", text: section.explanation }));
    }

    if (section.illustration) {
      const canvas = drawIllustration(section.illustration, theme());
      if (canvas) {
        const wrap = el("div", { class: "illustration-wrap" });
        wrap.appendChild(canvas);
        cardInner.appendChild(wrap);
      }
    }

    for (const ex of section.examples || []) {
      const exampleBox = el("div", { class: "example-box" });
      exampleBox.appendChild(el("div", { class: "example-text", text: "💡 " + ex.text }));
      cardInner.appendChild(exampleBox);
      if (ex.illustration) {
        const canvas = drawIllustration(ex.illustration, theme());
        if (canvas) {
          const wrap = el("div", { class: "illustration-wrap" });
          wrap.appendChild(canvas);
          cardInner.appendChild(wrap);
        }
      }
    }

    if (section.practice) {
      cardInner.appendChild(el("div", { class: "lesson-section-title", text: "✏️ Try it yourself:" }));
      for (const q of generateForSection(subject, topic, section.practice, learnerAgeIdx, learnerDiffIdx)) {
        renderPracticeQuestion(cardInner, q);
      }
    }

    cardBorder.appendChild(cardInner);
    container.appendChild(cardBorder);
  });
}

function showLessonPicker() {
  applyThemeVars();
  clearRoot();
  const t = theme();
  root.appendChild(headerBanner("📚 Learn a Topic", "Pick a topic to read a short lesson"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("🏠 Main Menu", showSetup, "quit"));
  root.appendChild(top);

  const subjects = [
    ["Math", APP_DATA.MATH_TOPICS, APP_DATA.MATH_TOPIC_MIN_AGE, "🔢"],
    ["Reading / Spelling", APP_DATA.READING_TOPICS, APP_DATA.READING_TOPIC_MIN_AGE, "📖"],
    ["Logic / Puzzles", APP_DATA.LOGIC_TOPICS, APP_DATA.LOGIC_TOPIC_MIN_AGE, "🧩"],
  ];
  for (const [subject, topics, minAge, icon] of subjects) {
    const available = topics.filter((tp) => minAge[tp] <= state.ageIdx);
    root.appendChild(el("h3", { class: "lesson-subject-heading", text: `${icon} ${subject}` }));
    const grid = el("div", { class: "lesson-topic-grid" });
    for (const topic of available) {
      grid.appendChild(button(topic, () => showLesson(subject, topic), "choice"));
    }
    root.appendChild(grid);
  }
}

function showLesson(subject, topic) {
  applyThemeVars();
  clearRoot();
  const t = theme();
  root.appendChild(headerBanner(`📚 ${topic}`));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back to Topics", showLessonPicker, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const container = el("div", { class: "lesson-container" });
  renderLessonSections(container, subject, topic, state.ageIdx, state.diffIdx);
  root.appendChild(container);

  const btnRow = el("div", { class: "next-row" });
  btnRow.appendChild(button("▶ Practice More (Full Quiz)", () => startTopicPractice(subject, topic), "start"));
  root.appendChild(btnRow);
}

function startTopicPractice(subject, topic) {
  state.subjects = new Set([subject]);
  if (subject === "Math") state.mathTopics = new Set([topic]);
  else if (subject === "Reading / Spelling") state.readingTopics = new Set([topic]);
  else state.logicTopics = new Set([topic]);
  startQuiz();
}
