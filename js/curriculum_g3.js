// Re-points the 365-day Curriculum's math at the NYS Grade 3 skills. The tracks in data.js came
// from the desktop app's general syllabus (Grade 1-6): decimals, percentages, ratio and
// trigonometry sat in the Upper track, and the Early track drifted into Grade 4 previews.
//
//   Upper Elementary (age 2, a Grade 3 child): days 1-225 serve the Grade 3 test topics.
//     Later phases keep the original Grade 4-6 path.
//   Early Elementary (age 1, e.g. a 2nd grader): keeps its Grade 1-2 foundations and EASES IN the
//     Grade 3 topics: Grade-2-friendly ones (time, fraction models, graphs, patterns, area by
//     counting squares) from day 71, the full Grade 3 set only from day 171. Off-target Grade 4+
//     topics (decimals, ratio, negative numbers, averages, factors) are dropped from days 71-270.
//
// Each list keeps the original topics first, so day-1 rotation order is unchanged.

const G3_MATH_TOPICS = [
  "Multiplication", "Fraction Number Line", "Two-Step & Estimation", "Time", "Division", "Fraction Models",
  "Area", "Equation Match", "Place Value", "Equivalent Fractions", "Perimeter", "Number Patterns",
  "Vertical Multiplication", "Compare Fractions", "Liquid Volume & Mass", "Graphs", "Rounding & Estimation",
  "Show Your Work", "Vertical Subtraction", "Word Problems", "Vertical Addition",
];
const G3_PHASE_LABELS = [
  "Grade 3 test prep: multiplication, fractions on a number line, time & two-step problems",
  "Grade 3 test prep: equivalent fractions, area & perimeter",
  "Grade 3 test prep: measurement, graphs & number patterns",
  "Grade 3 test prep: matching equations, estimating & showing your work",
  "Grade 3 test prep: mixed practice of every test topic",
  "Grade 3 test prep: test-style review",
];
const G2_EASE_IN_TOPICS = ["Time", "Fraction Models", "Graphs", "Number Patterns", "Area"];
const G3_PREVIEW_TOPICS = ["Fraction Number Line", "Equivalent Fractions", "Compare Fractions", "Perimeter",
  "Liquid Volume & Mass", "Two-Step & Estimation", "Equation Match", "Show Your Work"];
const G4_OFF_TARGET = ["Decimals", "Ratio & Proportion", "Negative Numbers", "Average", "Factors & Multiples", "Percentages", "Trigonometry", "Equations"];

(function repointCurriculum() {
  const phases = APP_DATA.CURRICULUM_PHASES;

  // Upper Elementary: replace days 1-225 with the Grade 3 test topics.
  const upper = phases[2] || [];
  for (let i = 0; i <= 4 && i < upper.length; i++) {
    const ph = upper[i];
    if (ph[2] === null) continue;
    const rot = (i * 5) % G3_MATH_TOPICS.length; // rotate the opener per phase
    ph[2] = G3_MATH_TOPICS.slice(rot).concat(G3_MATH_TOPICS.slice(0, rot));
    ph[6] = G3_PHASE_LABELS[Math.min(i, G3_PHASE_LABELS.length - 1)];
  }

  // Early Elementary: ease the new topics in on top of the existing Grade 1-2 lists.
  const early = phases[1] || [];
  const addTopics = { 2: G2_EASE_IN_TOPICS.slice(0, 3), 3: G2_EASE_IN_TOPICS, 4: G2_EASE_IN_TOPICS.concat(G3_PREVIEW_TOPICS), 5: G2_EASE_IN_TOPICS.concat(G3_PREVIEW_TOPICS) };
  for (const [idx, extra] of Object.entries(addTopics)) {
    const ph = early[idx];
    if (!ph || ph[2] === null) continue;
    const kept = ph[2].filter((t) => !G4_OFF_TARGET.includes(t));
    ph[2] = kept.concat(extra.filter((t) => !kept.includes(t)));
  }
})();
