// Re-points the 365-day Curriculum's math at NYS Grade 3 skills. The tracks in data.js came from
// the desktop app's general syllabus (Grade 1-6), which put decimals, percentages, ratio and
// trigonometry in the Upper track and Grade 1-2 sums in the Early track. For a child preparing
// for the Grade 3 state tests, those phases now serve the Grade 3 test topics instead.
//   Upper Elementary (age 2): days 1-225 (phases 1-5). Later phases keep the original Grade 4-6 path.
//   Early Elementary (age 1): days 71-270 (phases 3-6). Days 1-70 keep the Grade 1-2 foundations.
// The list is ordered so day 1 opens on multiplication, fractions and two-step problems; the
// curriculum rotates through it (3 math topics a day), so each test topic returns about weekly.

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

(function repointCurriculum() {
  const phases = APP_DATA.CURRICULUM_PHASES;
  const apply = (ageIdx, firstPhase, lastPhase) => {
    const list = phases[ageIdx];
    if (!list) return;
    for (let i = firstPhase; i <= lastPhase && i < list.length; i++) {
      const ph = list[i];
      if (ph[2] === null) continue; // "all topics" review phases already include the new topics
      // rotate the starting topic per phase so consecutive phases don't open on the same lesson
      const rot = ((i - firstPhase) * 5) % G3_MATH_TOPICS.length;
      ph[2] = G3_MATH_TOPICS.slice(rot).concat(G3_MATH_TOPICS.slice(0, rot));
      ph[6] = G3_PHASE_LABELS[Math.min(i - firstPhase, G3_PHASE_LABELS.length - 1)];
    }
  };
  apply(2, 0, 4); // Upper Elementary, days 1-225
  apply(1, 2, 5); // Early Elementary, days 71-270
})();
