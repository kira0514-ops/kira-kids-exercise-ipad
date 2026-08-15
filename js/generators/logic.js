// Port of kids_exercise_app.py's logic question generators.

function patternsQ(ageIdx, diffIdx) {
  const [, cat] = SEEN.pickUnseen("categories_patterns", Object.entries(APP_DATA.CATEGORIES), (kv) => kv[0]);
  if (diffIdx >= 3 && cat.length >= 4) {
    const [a, b, c, d] = sample(cat, 4);
    const seq = [a, b, c, d, a, b, c];
    return { prompt: "What comes next?\n\n" + seq.join(" ") + " ?", choices: makeChoices(d, cat), answer: d };
  }
  if (diffIdx >= 2) {
    const [a, b, c] = sample(cat, 3);
    const seq = [a, b, c, a, b];
    return { prompt: "What comes next?\n\n" + seq.join(" ") + " ?", choices: makeChoices(c, cat), answer: c };
  }
  const [a, b] = sample(cat, 2);
  const seq = [a, b, a, b];
  return { prompt: "What comes next?\n\n" + seq.join(" ") + " ?", choices: makeChoices(a, cat), answer: a };
}

function oddOneOutQ(ageIdx, diffIdx) {
  if (ageIdx === 0 || diffIdx < 2) {
    let catNames;
    for (let i = 0; i < 15; i++) {
      catNames = sample(Object.keys(APP_DATA.CATEGORIES), 2);
      const setA = new Set(APP_DATA.CATEGORIES[catNames[0]]);
      const hasOverlap = APP_DATA.CATEGORIES[catNames[1]].some((x) => setA.has(x));
      if (!hasOverlap) break;
    }
    const mainItems = sample(APP_DATA.CATEGORIES[catNames[0]], 3);
    const oddItem = choice(APP_DATA.CATEGORIES[catNames[1]]);
    const items = shuffle(mainItems.concat([oddItem]));
    return { prompt: "Which one does not belong?\n\n" + items.join("   "), choices: items, answer: oddItem };
  }

  const base = randInt(3, 9);
  const multiples = sample([2, 3, 4, 5, 6, 7, 8, 9], 3);
  const nums = multiples.map((m) => base * m);
  let odd = base * randInt(2, 9);
  while (nums.includes(odd)) odd = base * randInt(2, 9);
  odd += choice([1, -1, 2, -2]);
  const items = shuffle(nums.concat([odd]));
  return { prompt: `Which number is NOT a multiple of ${base}?\n\n` + items.join("   "), choices: items, answer: odd };
}

function numberSequencesQ(ageIdx, diffIdx) {
  if (ageIdx === 0) {
    const step = diffIdx < 2 ? randInt(1, 2) : randInt(1, 3);
    const start = randInt(1, 5);
    const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    const answer = start + step * 4;
    return { prompt: "What comes next?\n\n" + seq.join(", ") + ", ?", choices: numericChoices(answer, 0, 30), answer };
  }
  if (ageIdx === 1) {
    const stepRange = [[1, 3], [2, 6], [5, 10], [10, 20]][diffIdx];
    const step = randInt(...stepRange);
    const start = randInt(1, 10);
    const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    const answer = start + step * 4;
    return { prompt: "What comes next?\n\n" + seq.join(", ") + ", ?", choices: numericChoices(answer, 0, 300), answer };
  }
  if (diffIdx >= 2 && Math.random() < 0.4) {
    const start = randInt(1, 5);
    const seq = Array.from({ length: 4 }, (_, i) => start * 2 ** i);
    const answer = start * 2 ** 4;
    return { prompt: "What comes next?\n\n" + seq.join(", ") + ", ?", choices: numericChoices(answer, 0, answer * 2), answer };
  }
  const stepRange = [[3, 6], [6, 9], [8, 15], [15, 30]][diffIdx];
  const step = randInt(...stepRange);
  const start = randInt(2, 20);
  const seq = Array.from({ length: 4 }, (_, i) => start + step * i);
  const answer = start + step * 4;
  return { prompt: "What comes next?\n\n" + seq.join(", ") + ", ?", choices: numericChoices(answer, 0, 800), answer };
}

function analogiesQ(ageIdx, diffIdx) {
  const [a, b, c, d] = SEEN.pickUnseen("analogies", APP_DATA.ANALOGY_PAIRS, (t) => `${t[0]}-${t[2]}`);
  const pool = APP_DATA.ANALOGY_PAIRS.filter((t) => t[3] !== d).map((t) => t[3]);
  return { prompt: `'${a}' is to '${b}' as '${c}' is to ___?`, choices: makeChoices(d, pool), answer: d };
}

function pictographValues(nCats, maxVal) {
  const unit = maxVal <= 8 ? 1 : maxVal <= 16 ? 2 : maxVal <= 40 ? 5 : 10;
  let values;
  do {
    values = Array.from({ length: nCats }, () => unit * randInt(1, 8));
  } while (new Set(values).size !== values.length);
  return [values, unit];
}

function linePlotQuestion(ageIdx, diffIdx) {
  const maxRange = ageIdx <= 1 ? 4 : 6;
  let nPoints = { 0: 9, 1: 13 }[ageIdx] ?? 17;
  if (diffIdx === 3) nPoints += 4;
  const points = Array.from({ length: nPoints }, () => randInt(0, maxRange));
  const counts = {};
  for (let v = 0; v <= maxRange; v++) counts[v] = points.filter((p) => p === v).length;

  const kindPool = ageIdx === 0 ? ["read_value", "most_common"] : ["read_value", "most_common", "total_count"];
  const kind = choice(kindPool);
  let answer, prompt, choices;
  if (kind === "read_value") {
    const target = randInt(0, maxRange);
    answer = counts[target];
    prompt = `How many times does ${target} appear on the line plot?`;
    choices = numericChoices(answer, 0, nPoints);
  } else if (kind === "most_common") {
    answer = Object.keys(counts).reduce((best, k) => (counts[k] > counts[best] ? k : best));
    answer = parseInt(answer, 10);
    prompt = "Which number appears most often on the line plot?";
    choices = numericChoices(answer, 0, maxRange);
  } else {
    answer = nPoints;
    prompt = "How many dots are shown in total on the line plot?";
    choices = numericChoices(answer, 0, nPoints + 10);
  }
  return { prompt, choices, answer, chart: { kind: "line_plot", points, max_range: maxRange } };
}

function vennQuestion(ageIdx, diffIdx) {
  const [labelA, labelB] = SEEN.pickUnseen("venn_pairs", APP_DATA.VENN_TOPIC_PAIRS, (p) => p[0]);
  let maxVal = { 0: 8, 1: 12, 2: 20 }[ageIdx];
  if (diffIdx === 3) maxVal = Math.floor(maxVal * 1.5);
  const onlyA = randInt(1, maxVal), onlyB = randInt(1, maxVal), both = randInt(1, Math.max(1, Math.floor(maxVal / 2)));
  const total = onlyA + onlyB + both;

  const kindPool = ageIdx === 0 ? ["only_a", "only_b", "both"]
    : ["only_a", "only_b", "both", "total_a", "total_b", "total"];
  const kind = choice(kindPool);
  let answer, prompt;
  if (kind === "only_a") { answer = onlyA; prompt = `How many students ${labelA} but NOT ${labelB}?`; }
  else if (kind === "only_b") { answer = onlyB; prompt = `How many students ${labelB} but NOT ${labelA}?`; }
  else if (kind === "both") { answer = both; prompt = `How many students ${labelA} AND ${labelB}?`; }
  else if (kind === "total_a") { answer = onlyA + both; prompt = `How many students ${labelA} in total?`; }
  else if (kind === "total_b") { answer = onlyB + both; prompt = `How many students ${labelB} in total?`; }
  else { answer = total; prompt = "How many students were surveyed in total?"; }
  return { prompt, choices: numericChoices(answer, 0, total + 10), answer,
    chart: { kind: "venn", label_a: labelA, label_b: labelB, only_a: onlyA, only_b: onlyB, both } };
}

function flowchartQuestion(ageIdx, diffIdx) {
  const seq = SEEN.pickUnseen("flowcharts", APP_DATA.FLOWCHART_SEQUENCES, (s) => s[0]);
  const n = seq.length;
  const kindPool = ageIdx === 0 ? ["next", "first_last"] : ["next", "before", "position", "first_last"];
  const kind = choice(kindPool);
  let prompt, answer;
  if (kind === "next") {
    const i = randInt(0, n - 2);
    prompt = `In this flow chart, what comes right after '${seq[i]}'?`; answer = seq[i + 1];
  } else if (kind === "before") {
    const i = randInt(1, n - 1);
    prompt = `In this flow chart, what comes right before '${seq[i]}'?`; answer = seq[i - 1];
  } else if (kind === "position") {
    const i = randInt(0, n - 1);
    prompt = `In this flow chart, which step is number ${i + 1}?`; answer = seq[i];
  } else {
    if (choice([true, false])) { prompt = "In this flow chart, what is the FIRST step?"; answer = seq[0]; }
    else { prompt = "In this flow chart, what is the LAST step?"; answer = seq[n - 1]; }
  }
  return { prompt, choices: makeChoices(answer, seq), answer, chart: { kind: "flowchart", steps: seq } };
}

function chartReadingQ(ageIdx, diffIdx) {
  const kindPool = ageIdx === 0 ? ["bar", "pictograph", "tally"]
    : ageIdx === 1 ? ["bar", "pictograph", "tally", "line_plot", "venn", "flowchart"]
    : ["bar", "pictograph", "tally", "line_plot", "venn", "flowchart", "pie", "line_graph"];
  const chartKind = choice(kindPool);
  if (chartKind === "line_plot") return linePlotQuestion(ageIdx, diffIdx);
  if (chartKind === "venn") return vennQuestion(ageIdx, diffIdx);
  if (chartKind === "flowchart") return flowchartQuestion(ageIdx, diffIdx);

  const categories = SEEN.pickUnseen("chart_sets", APP_DATA.CHART_CATEGORY_SETS, (c) => c[0]);
  const nCats = diffIdx < 3 ? { 0: 3, 1: 4, 2: 4 }[ageIdx] : 5;
  const cats = categories.slice(0, nCats);
  let maxVal = { 0: 10, 1: 20, 2: 40 }[ageIdx];
  if (diffIdx === 3) maxVal = Math.floor(maxVal * 1.5);
  if (chartKind === "tally") maxVal = Math.min(maxVal, 20);

  let unit = 1, values;
  if (chartKind === "pictograph") {
    [values, unit] = pictographValues(cats.length, maxVal);
  } else {
    do {
      values = cats.map(() => randInt(1, maxVal));
    } while (new Set(values).size !== values.length);
  }

  const qKindPool = ageIdx === 0 ? ["read_value", "most", "least"] : ["read_value", "most", "least", "difference", "total"];
  const qKind = choice(qKindPool);
  const chartWord = { bar: "bars", pictograph: "picture graph", tally: "tally chart",
    pie: "pie chart", line_graph: "line graph" }[chartKind];

  let answer, prompt, choices;
  if (qKind === "read_value") {
    const idx = randInt(0, cats.length - 1);
    answer = values[idx];
    prompt = `How many ${cats[idx]} are there?`;
    // Pictograph values can scale up to unit*8, which may exceed maxVal -- bound choices
    // off the actual answer too, so delta candidates always have room above it.
    choices = numericChoices(answer, 0, Math.max(maxVal, answer) + 10);
  } else if (qKind === "most") {
    const idx = values.indexOf(Math.max(...values));
    answer = cats[idx];
    prompt = "Which one has the most?";
    choices = cats.slice();
  } else if (qKind === "least") {
    const idx = values.indexOf(Math.min(...values));
    answer = cats[idx];
    prompt = "Which one has the least?";
    choices = cats.slice();
  } else if (qKind === "difference") {
    const [i, j] = sample(Array.from({ length: cats.length }, (_, k) => k), 2);
    const [bigger, smaller] = values[i] > values[j] ? [i, j] : [j, i];
    answer = values[bigger] - values[smaller];
    prompt = `How many more ${cats[bigger]} are there than ${cats[smaller]}?`;
    choices = numericChoices(answer, 0, Math.max(maxVal, answer) + 10);
  } else {
    answer = values.reduce((a, b) => a + b, 0);
    prompt = `What is the total of all the ${chartWord}?`;
    choices = numericChoices(answer, 0, answer + maxVal);
  }

  return { prompt, choices, answer, chart: { kind: chartKind, categories: cats, values, unit } };
}

function checkTruthAssignment(statements, specialIdx, specialIsTruthteller) {
  const n = statements.length;
  for (let i = 0; i < n; i++) {
    const [target, claim] = statements[i];
    const targetIsTruthful = target === specialIdx ? specialIsTruthteller : !specialIsTruthteller;
    const statedValue = claim === "truth" ? targetIsTruthful : !targetIsTruthful;
    const speakerIsTruthful = i === specialIdx ? specialIsTruthteller : !specialIsTruthteller;
    if (statedValue !== speakerIsTruthful) return false;
  }
  return true;
}

function generateTruthPuzzle(n, specialIsTruthteller, tries = 300) {
  for (let t = 0; t < tries; t++) {
    const statements = Array.from({ length: n }, (_, i) => {
      const others = Array.from({ length: n }, (_, j) => j).filter((j) => j !== i);
      return [choice(others), choice(["truth", "lie"])];
    });
    const valid = Array.from({ length: n }, (_, s) => s).filter((s) => checkTruthAssignment(statements, s, specialIsTruthteller));
    if (valid.length === 1) return [statements, valid[0]];
  }
  return null;
}

function whosRightQ(ageIdx, diffIdx) {
  const n = diffIdx < 2 ? 3 : 4;
  const specialIsTruthteller = diffIdx % 2 === 0;
  const people = sample(APP_DATA.TRUTH_PUZZLE_NAMES, n);
  let result = null;
  while (result === null) result = generateTruthPuzzle(n, specialIsTruthteller);
  const [statements, special] = result;

  const lines = [];
  for (let i = 0; i < n; i++) {
    const [target, claim] = statements[i];
    const phraseBank = claim === "truth" ? APP_DATA.TRUTH_TELLER_PHRASES : APP_DATA.LIAR_PHRASES;
    const clause = choice(phraseBank).replace("{target}", people[target]);
    lines.push(`${people[i]} says: "${clause}"`);
  }
  const story = lines.join("\n");

  let setup, question;
  if (specialIsTruthteller) {
    setup = `Exactly one of these friends is telling the truth, and the other ${n - 1} are lying.`;
    question = "Who is telling the truth?";
  } else {
    setup = `Exactly one of these friends is lying, and the other ${n - 1} are telling the truth.`;
    question = "Who is lying?";
  }
  const prompt = `${setup}\n\n${story}\n\n${question}`;
  const answer = people[special];
  return { prompt, choices: people.slice(), answer };
}

// Interactive counterpart to Patterns: instead of picking the next item from 4 choices, the
// sequence is shown with an open blank slot at the end, and the kid taps candidate tiles
// (shuffled, from the same category as the sequence) into the blank -- same "build the answer
// yourself" spirit as the vertical arithmetic / Spell the Word / Sentence Builder exercises.
// Reuses patternsQ's exact difficulty-scaled sequence shapes (AB, ABC, ABCD units) so the two
// topics stay consistent, just presented differently.
function patternBuilderQ(ageIdx, diffIdx) {
  const [, cat] = SEEN.pickUnseen("categories_patterns_interactive", Object.entries(APP_DATA.CATEGORIES), (kv) => kv[0]);
  let seq, answer;
  if (diffIdx >= 3 && cat.length >= 4) {
    const [a, b, c, d] = sample(cat, 4);
    seq = [a, b, c, d, a, b, c]; answer = d;
  } else if (diffIdx >= 2) {
    const [a, b, c] = sample(cat, 3);
    seq = [a, b, c, a, b]; answer = c;
  } else {
    const [a, b] = sample(cat, 2);
    seq = [a, b, a, b]; answer = a;
  }
  const bank = makeChoices(answer, cat);
  return {
    prompt: "What comes next in the pattern?", speak: "What comes next in the pattern?",
    choices: bank, answer,
    interactive: "pattern_fill", sequence: seq, bank,
  };
}

// Tapping the right bank tile fills the blank and finishes the exercise (same "only ever
// finishes once actually solved" rule as every other interactive exercise); a wrong tap just
// flashes and stays tappable, since there's only one blank -- no partial-progress state to
// reset the way the multi-slot spelling/sentence exercises need.
function buildPatternFillInteractive(sequence, bank, answer, onComplete) {
  const wrap = el("div", { class: "pattern-wrap" });

  const seqRow = el("div", { class: "pattern-sequence" });
  sequence.forEach((item) => seqRow.appendChild(el("div", { class: "pattern-tile", text: item })));
  const blankTile = el("div", { class: "pattern-tile pattern-tile-blank", text: "?" });
  seqRow.appendChild(blankTile);
  wrap.appendChild(seqRow);

  const bankRow = el("div", { class: "pattern-bank" });
  wrap.appendChild(bankRow);

  let done = false;
  bank.forEach((item) => {
    const tile = el("button", { class: "pattern-choice-tile", type: "button", text: item });
    tile.addEventListener("click", () => {
      if (done) return;
      if (item === answer) {
        done = true;
        blankTile.textContent = item;
        blankTile.classList.add("pattern-tile-correct");
        tile.classList.add("pattern-choice-correct");
        onComplete();
      } else {
        tile.classList.add("pattern-choice-wrong");
        setTimeout(() => tile.classList.remove("pattern-choice-wrong"), 400);
      }
    });
    bankRow.appendChild(tile);
  });

  return wrap;
}

// Interactive counterpart to Number Sequences: same "show 4, tap the 5th" idea as Pattern
// Builder, just with numbers instead of pictures -- reuses buildPatternFillInteractive
// directly since the mechanic (a row of tiles, one open blank, a tappable bank) doesn't care
// whether the tile content is an emoji or a number. Duplicates numberSequencesQ's sequence
// shapes on purpose rather than sharing code with it, so a change to one can't silently break
// the other's already-verified behavior.
function numberSequenceSolverQ(ageIdx, diffIdx) {
  let seq, answer;
  if (ageIdx === 0) {
    const step = diffIdx < 2 ? randInt(1, 2) : randInt(1, 3);
    const start = randInt(1, 5);
    seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    answer = start + step * 4;
  } else if (ageIdx === 1) {
    const stepRange = [[1, 3], [2, 6], [5, 10], [10, 20]][diffIdx];
    const step = randInt(...stepRange);
    const start = randInt(1, 10);
    seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    answer = start + step * 4;
  } else if (diffIdx >= 2 && Math.random() < 0.4) {
    const start = randInt(1, 5);
    seq = Array.from({ length: 4 }, (_, i) => start * 2 ** i);
    answer = start * 2 ** 4;
  } else {
    const stepRange = [[3, 6], [6, 9], [8, 15], [15, 30]][diffIdx];
    const step = randInt(...stepRange);
    const start = randInt(2, 20);
    seq = Array.from({ length: 4 }, (_, i) => start + step * i);
    answer = start + step * 4;
  }
  const bank = numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 5);
  return {
    prompt: "What comes next in the sequence?", speak: `${seq.join(", ")}, what comes next?`,
    choices: bank, answer,
    interactive: "number_sequence", sequence: seq, bank,
  };
}

const LOGIC_TOPIC_FUNCS = {
  Patterns: patternsQ,
  "Pattern Builder": patternBuilderQ,
  "Odd One Out": oddOneOutQ,
  "Number Sequences": numberSequencesQ,
  "Number Sequence Solver": numberSequenceSolverQ,
  Analogies: analogiesQ,
  "Chart Reading": chartReadingQ,
  "Who's Right?": whosRightQ,
};

function logicQuestion(ageIdx, diffIdx, topics) {
  [ageIdx, diffIdx] = resolveExtreme(ageIdx, diffIdx);
  const pool = topics && topics.length ? topics : APP_DATA.LOGIC_TOPICS;
  const topic = choice(pool);
  return LOGIC_TOPIC_FUNCS[topic](ageIdx, diffIdx);
}
