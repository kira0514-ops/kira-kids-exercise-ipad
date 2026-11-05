// NYS Grade 3 style math: fractions as numbers (number line, equivalent, compare, models),
// area & perimeter, time, liquid volume & mass, scaled graphs, number patterns, two-step &
// estimation, and matching equations to stories. These are extra Math topics (no new menu
// section); they are registered into MATH_TOPIC_FUNCS / APP_DATA at the bottom of this file.
// Level L (0-3) = intrinsic difficulty: Early tier is one step easier than Upper at the same
// difficulty setting, so a Grade 3 child on Hard sees the hardest test-style items.

function nysLevel(ageIdx, diffIdx) {
  return Math.min(3, diffIdx + (ageIdx >= 2 ? 1 : 0));
}

// ---------- shared helpers ----------
const NYS_UNIT_WORD = { cm: ["centimeter", "centimeters"], m: ["meter", "meters"], in: ["inch", "inches"], ft: ["foot", "feet"] };
const NYS_ITEMS = ["stickers", "marbles", "pencils", "cookies", "crayons", "beads", "cards", "shells"];

// Four distinct choices: the answer, then wrong options (random order), then filler.
function nysPick4(answer, wrongs, filler) {
  const ans = String(answer);
  const out = [ans];
  for (const w of shuffle(wrongs.slice())) {
    const s = String(w);
    if (!out.includes(s) && !/NaN|undefined|Infinity/.test(s)) out.push(s);
    if (out.length >= 4) break;
  }
  let tries = 0;
  while (out.length < 4 && filler && tries++ < 80) {
    const s = String(filler());
    if (!out.includes(s)) out.push(s);
  }
  return shuffle(out);
}

const NYS_SINGULAR = { liters: "liter", grams: "gram", kilograms: "kilogram", meters: "meter", centimeters: "centimeter", inches: "inch", feet: "foot", buckets: "bucket" };
function nysWithUnit(v, suffix) {
  if (v !== 1 || !suffix) return `${v}${suffix}`;
  const one = suffix.replace(/\b(liters|grams|kilograms|meters|centimeters|inches|feet|buckets)\b/, (m) => NYS_SINGULAR[m]);
  return `${v}${one}`;
}
function nysNumChoices(answer, wrongs, suffix = "") {
  const n = Number(answer);
  const ws = wrongs.filter((w) => Number.isFinite(w) && w > 0 && w !== n).map((w) => nysWithUnit(w, suffix));
  const deltas = [1, 2, 3, 5, 10];
  return nysPick4(nysWithUnit(n, suffix), ws, () => nysWithUnit(Math.max(1, n + choice(deltas) * choice([-1, 1])), suffix));
}

const nysFrac = (n, d) => `${n}/${d}`;
function nysSameValue(a, b) {
  const [n1, d1] = a.split("/").map(Number), [n2, d2] = b.split("/").map(Number);
  return n1 * d2 === n2 * d1;
}
// Four fraction strings with distinct VALUES (no equivalent look-alikes of the answer).
function nysFracChoices(answer, wrongs, fillDen) {
  const out = [answer];
  const ok = (w) => /^\d+\/\d+$/.test(w) && !/^0\//.test(w) && !/\/0$/.test(w) && !out.some((o) => nysSameValue(o, w));
  for (const w of shuffle(wrongs.slice())) { if (ok(w)) out.push(w); if (out.length >= 4) break; }
  let tries = 0;
  const d = fillDen || Number(answer.split("/")[1]);
  while (out.length < 4 && tries++ < 80) { const w = nysFrac(randInt(1, d * 2), d); if (ok(w)) out.push(w); }
  return shuffle(out);
}

function nysTime(h, m) { return `${h}:${String(m).padStart(2, "0")}`; }
function nysMinsToHM(total) { const h = ((Math.floor(total / 60) - 1 + 12) % 12) + 1; return nysTime(h, total % 60); }

// ---------- 1. Fractions on a number line ----------
function nysNumberLineQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const dens = [[2, 3, 4], [3, 4, 6], [3, 4, 6, 8], [3, 4, 5, 6, 8]][L];
  const mode = choice([["point"], ["point", "letter"], ["point", "letter", "whole"], ["point", "letter", "whole", "point"]][L]);
  let d = choice(dens);
  let to = (L >= 2 ? Math.random() < 0.45 : L === 0 ? Math.random() < 0.3 : false) ? 2 : 1;

  if (mode === "letter") {
    d = choice(dens.filter((x) => x >= 3));
    if (d * to - 1 < 4) to = 2;
    const ks = [];
    for (let k = 1; k < d * to; k++) ks.push(k);
    const pts = shuffle(ks).slice(0, 4);
    const letters = ["A", "B", "C", "D"].slice(0, pts.length);
    const target = randInt(0, pts.length - 1);
    const k = pts[target];
    const q = {
      prompt: `Which point shows ${nysFrac(k, d)} on the number line?`,
      choices: letters, answer: letters[target], _choicesShuffled: true,
      uid: `nl:letter:${d}:${to}:${pts.join(",")}:${target}`,
      illustration: { type: "number_line", whole: to, parts: d, points: pts.map((kk, i) => ({ k: kk, label: letters[i] })) },
    };
    return q;
  }

  if (mode === "whole") {
    const j = randInt(1, to === 2 ? 2 : 1);
    const k = d * j;
    const answer = nysFrac(k, d);
    const wrongs = [nysFrac(1, d), nysFrac(d, k), nysFrac(k + 1, d), nysFrac(k - 1, d), nysFrac(k, d + 1), nysFrac(j, d)];
    return {
      prompt: `Point P is at the whole number ${j} on the number line. Which fraction is equal to ${j}?`,
      choices: nysFracChoices(answer, wrongs), answer,
      uid: `nl:whole:${d}:${k}:${to}`,
      illustration: { type: "number_line", whole: Math.max(to, j), parts: d, points: [{ k, label: "P" }], hideEndLabels: false },
    };
  }

  // point
  const ks = [];
  for (let k = 1; k < d * to; k++) if (k % d !== 0) ks.push(k);
  const k = choice(ks);
  const answer = nysFrac(k, d);
  const wrongs = [nysFrac(k - 1, d), nysFrac(k + 1, d), nysFrac(k, d + 1), nysFrac(d - k, d), nysFrac(k, Math.max(2, d - 1)), nysFrac(k + 2, d)];
  return {
    prompt: "What fraction does point P show on the number line?",
    choices: nysFracChoices(answer, wrongs), answer,
    uid: `nl:point:${d}:${k}:${to}`,
    illustration: { type: "number_line", whole: to, parts: d, points: [{ k, label: "P" }] },
  };
}

// ---------- 2. Equivalent fractions & whole numbers as fractions ----------
function nysEquivalentQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["model", "model", "whole"], ["model", "missing", "whole"], ["missing", "model", "whole", "notequal"], ["missing", "notequal", "whole", "missing"]][L]);

  if (mode === "model") {
    const a = choice([2, 3, 4]);
    const m = choice(a === 4 ? [2] : [2, 3]);
    const n = randInt(1, a - 1);
    const b = a * m;
    const answer = nysFrac(n * m, b);
    const wrongs = [nysFrac(n, b), nysFrac(n + m, b), nysFrac(n * m, a), nysFrac(n + 1, b), nysFrac(n * m + 1, b), nysFrac(n * m - 1, b)];
    return {
      prompt: `The two bars are the same size. Which fraction is equal to ${nysFrac(n, a)}?`,
      choices: nysFracChoices(answer, wrongs, b), answer,
      uid: `eq:model:${n}:${a}:${b}`,
      illustration: { type: "fraction_bars", bars: [{ parts: a, shaded: n, label: nysFrac(n, a) }, { parts: b, shaded: n * m, label: "?" }] },
    };
  }

  if (mode === "missing") {
    const a = choice(L >= 3 ? [2, 3, 4, 5, 6] : [2, 3, 4, 5]);
    const m = choice(L >= 3 ? [2, 3, 4, 5] : [2, 3, 4]);
    const n = randInt(1, a - 1);
    const unknownTop = Math.random() < 0.65;
    if (unknownTop) {
      const answer = n * m;
      return {
        prompt: `${nysFrac(n, a)} = ? / ${a * m}\n\nWhat number goes in the box?`,
        choices: nysNumChoices(answer, [n + m, n, answer + a, answer - 1, n + a * m - a]), answer: String(answer),
        uid: `eq:top:${n}:${a}:${m}`, illustration: { type: "fraction_bars", bars: [{ parts: a, shaded: n, label: nysFrac(n, a) }, { parts: a * m, shaded: n * m, label: `?/${a * m}` }] },
      };
    }
    const answer = a * m;
    return {
      prompt: `${nysFrac(n, a)} = ${n * m} / ?\n\nWhat number goes in the box?`,
      choices: nysNumChoices(answer, [a + m, a, answer + n, answer - 1, a * m + m]), answer: String(answer),
      uid: `eq:bottom:${n}:${a}:${m}`,
    };
  }

  if (mode === "whole") {
    const W = randInt(2, L >= 2 ? 6 : 4);
    const d = choice([2, 3, 4, 6, 8]);
    if (Math.random() < 0.5) {
      const answer = nysFrac(W * d, d);
      return {
        prompt: `Which fraction is equal to the whole number ${W}?`,
        choices: nysFracChoices(answer, [nysFrac(W, d), nysFrac(d, W * d), nysFrac(W + d, d), nysFrac(W * d, W), nysFrac(1, W)], d), answer,
        uid: `eq:whole:${W}:${d}`,
      };
    }
    const answer = String(W);
    return {
      prompt: `${nysFrac(W * d, d)} is equal to what whole number?`,
      choices: nysNumChoices(W, [d, W * d, W + 1, W - 1, W + d]), answer,
      uid: `eq:wholenum:${W}:${d}`,
    };
  }

  // notequal: three equivalent fractions and one that is not
  const bases = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]];
  const [n, a] = choice(bases);
  const ms = shuffle([2, 3, 4, 5, 6]).slice(0, 3);
  const eqs = ms.map((m) => nysFrac(n * m, a * m));
  const m = choice([2, 3, 4]);
  const foil = choice([nysFrac(n * m + 1, a * m), nysFrac(n * m, a * m + 1), nysFrac(n + m, a + m)]);
  if (nysSameValue(foil, nysFrac(n, a))) return nysEquivalentQ(ageIdx, diffIdx);
  return {
    prompt: `Which fraction is NOT equal to ${nysFrac(n, a)}?`,
    choices: shuffle([...eqs, foil]), answer: foil,
    uid: `eq:not:${n}:${a}:${eqs.join(",")}:${foil}`,
  };
}

// ---------- 3. Comparing fractions ----------
function nysCompareQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["sameden", "sameden", "samenum"], ["sameden", "samenum", "samenum"], ["samenum", "half", "equal", "sameden"], ["order", "half", "equal", "samenum", "order"]][L]);
  const cmp = (x, y) => (x > y ? ">" : x < y ? "<" : "=");
  const symChoices = ["<", ">", "="];

  if (mode === "sameden") {
    const d = choice([3, 4, 5, 6, 8]);
    let n1 = randInt(1, d - 1), n2 = randInt(1, d - 1);
    while (n1 === n2) n2 = randInt(1, d - 1);
    return {
      prompt: `Which symbol makes the statement true?\n\n${nysFrac(n1, d)}  ?  ${nysFrac(n2, d)}`,
      choices: symChoices.slice(), answer: cmp(n1, n2), uid: `cmp:den:${n1}:${n2}:${d}`, _choicesShuffled: true,
      illustration: { type: "fraction_bars", bars: [{ parts: d, shaded: n1, label: nysFrac(n1, d) }, { parts: d, shaded: n2, label: nysFrac(n2, d) }] },
    };
  }
  if (mode === "samenum") {
    const dens = shuffle([2, 3, 4, 5, 6, 8]);
    let d1 = dens[0], d2 = dens[1];
    const n = randInt(1, Math.min(d1, d2) - 1);
    return {
      prompt: `Which symbol makes the statement true?\n\n${nysFrac(n, d1)}  ?  ${nysFrac(n, d2)}`,
      choices: symChoices.slice(), answer: cmp(n / d1, n / d2), uid: `cmp:num:${n}:${d1}:${d2}`, _choicesShuffled: true,
      illustration: { type: "fraction_bars", bars: [{ parts: d1, shaded: n, label: nysFrac(n, d1) }, { parts: d2, shaded: n, label: nysFrac(n, d2) }] },
    };
  }
  if (mode === "equal") {
    const [n, a] = choice([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]);
    const m = choice([2, 3, 4]);
    const swap = Math.random() < 0.5;
    const f1 = nysFrac(n, a), f2 = nysFrac(n * m, a * m);
    return {
      prompt: `Which symbol makes the statement true?\n\n${swap ? f2 : f1}  ?  ${swap ? f1 : f2}`,
      choices: symChoices.slice(), answer: "=", uid: `cmp:eq:${n}:${a}:${m}:${swap ? 1 : 0}`, _choicesShuffled: true,
      illustration: { type: "fraction_bars", bars: [{ parts: a, shaded: n, label: f1 }, { parts: a * m, shaded: n * m, label: f2 }] },
    };
  }
  if (mode === "half") {
    const askGreater = Math.random() < 0.5;
    for (let tries = 0; tries < 60; tries++) {
      const d = choice([4, 6, 8, 5, 10]);
      const pool = [];
      for (let n = 1; n < d; n++) pool.push(nysFrac(n, d));
      const set = shuffle(pool).slice(0, 4);
      const good = set.filter((f) => { const v = nysFracVal(f); return askGreater ? v > 0.5 : v < 0.5; });
      if (good.length !== 1) continue;
      if (set.some((f) => nysFracVal(f) === 0.5)) continue;
      return {
        prompt: `Which fraction is ${askGreater ? "greater" : "less"} than 1/2?`,
        choices: set, answer: good[0], uid: `cmp:half:${askGreater ? "g" : "l"}:${set.join(",")}`,
      };
    }
    return nysCompareQ(ageIdx, 0);
  }
  // order: least to greatest, same numerator (or same denominator)
  const sameNum = Math.random() < 0.5;
  const dens = shuffle([2, 3, 4, 5, 6, 8]).slice(0, 3);
  let items, asc;
  if (sameNum) {
    const n = randInt(1, Math.min(...dens) - 1);
    items = dens.map((d) => ({ s: nysFrac(n, d), v: n / d }));
  } else {
    const d = choice([5, 6, 8, 10]);
    const ns = shuffle([1, 2, 3, 4, 5, 6, 7].filter((x) => x < d)).slice(0, 3);
    items = ns.map((n) => ({ s: nysFrac(n, d), v: n / d }));
  }
  asc = items.slice().sort((x, y) => x.v - y.v).map((x) => x.s);
  const answer = asc.join(", ");
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].map((p) => p.map((i) => asc[i]).join(", "));
  return {
    prompt: "Which list shows the fractions in order from least to greatest?",
    choices: nysPick4(answer, perms.filter((p) => p !== answer)), answer, uid: `cmp:order:${answer}`,
  };
}
function nysFracVal(s) { const [n, d] = s.split("/").map(Number); return n / d; }

// ---------- 4. Fraction models (unit fractions, parts of a whole or a set) ----------
function nysFractionModelsQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["unit", "shaded", "unit"], ["unit", "shaded", "set"], ["shaded", "set", "left", "howmany"], ["set", "left", "howmany", "shaded", "unitword"]][L]);

  if (mode === "unit") {
    const N = choice([2, 3, 4, 6, 8]);
    const answer = nysFrac(1, N);
    return {
      prompt: `A shape is cut into ${N} equal parts. What fraction names ONE part?`,
      choices: nysFracChoices(answer, [nysFrac(N, 1), nysFrac(N, N), nysFrac(1, N + 1), nysFrac(N - 1, N), nysFrac(1, Math.max(2, N - 1)), nysFrac(2, N)]), answer,
      uid: `fm:unit:${N}`, illustration: { type: "fraction_bars", bars: [{ parts: N, shaded: 1 }] },
    };
  }
  if (mode === "shaded") {
    const d = choice([3, 4, 5, 6, 8]);
    const n = randInt(1, d - 1);
    const notShaded = L >= 1 && Math.random() < 0.4;
    const num = notShaded ? d - n : n;
    const answer = nysFrac(num, d);
    return {
      prompt: `What fraction of the bar is ${notShaded ? "NOT shaded" : "shaded"}?`,
      choices: nysFracChoices(answer, [nysFrac(notShaded ? n : d - n, d), nysFrac(num, d + 1), nysFrac(num + 1, d), nysFrac(num, d - 1 < 2 ? d + 2 : d - 1), nysFrac(d, num)]), answer,
      uid: `fm:shaded:${d}:${n}:${notShaded ? 1 : 0}`,
      illustration: { type: "fraction_bars", bars: [{ parts: d, shaded: n }] },
    };
  }
  if (mode === "set") {
    const pairs = [["⭐", "🔷"], ["🍎", "🍌"], ["🐶", "🐱"], ["🔴", "🔵"], ["🌼", "🌱"], ["⚽", "🏀"]];
    const [e1, e2] = choice(pairs);
    const total = choice([4, 5, 6, 8, 10]);
    const n1 = randInt(1, total - 1);
    const items = shuffle([...Array(n1).fill(e1), ...Array(total - n1).fill(e2)]);
    const askFirst = Math.random() < 0.5;
    const num = askFirst ? n1 : total - n1;
    const answer = nysFrac(num, total);
    return {
      prompt: `What fraction of the pictures are ${askFirst ? e1 : e2}?`,
      choices: nysFracChoices(answer, [nysFrac(askFirst ? total - n1 : n1, total), nysFrac(num, total + 1), nysFrac(num, askFirst ? total - n1 : n1), nysFrac(num + 1, total), nysFrac(total, num)], total), answer,
      uid: `fm:set:${e1}${e2}:${total}:${n1}:${askFirst ? 1 : 0}`,
      illustration: { type: "emoji_row", items },
    };
  }
  if (mode === "left") {
    const d = choice([4, 5, 6, 8, 10]);
    const n = randInt(1, d - 2);
    const name = choice(NAMES);
    const what = choice(["pizza", "pie", "sandwich", "granola bar"]);
    const answer = nysFrac(d - n, d);
    return {
      prompt: `${name} cuts a ${what} into ${d} equal pieces and eats ${n} of them. What fraction of the ${what} is left?`,
      choices: nysFracChoices(answer, [nysFrac(n, d), nysFrac(d - n, d + 1), nysFrac(d - n, n), nysFrac(n + 1, d), nysFrac(d, d - n)], d), answer,
      uid: `fm:left:${d}:${n}:${what}`,
    };
  }
  if (mode === "howmany") {
    const d = choice([2, 3, 4, 5, 6, 8]);
    const unitName = { 2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 8: "eighths" }[d];
    return {
      prompt: `How many ${unitName} make 1 whole?`,
      choices: nysNumChoices(d, [d + 1, d - 1, 1, d * 2, d + 2]), answer: String(d),
      uid: `fm:howmany:${d}`,
    };
  }
  // unitword: name the fraction word
  const d = choice([2, 3, 4, 6, 8]);
  const word = { 2: "halves", 3: "thirds", 4: "fourths", 6: "sixths", 8: "eighths" };
  const words = Object.values(word);
  return {
    prompt: `A shape is split into ${d} equal parts. What do we call each part?\n(Hint: ${nysFrac(1, d)} of the whole)`,
    choices: nysPick4(`${word[d].replace(/s$/, "")}`, words.filter((w) => w !== word[d]).map((w) => w.replace(/s$/, ""))), answer: word[d].replace(/s$/, ""),
    uid: `fm:word:${d}`,
  };
}

// ---------- 5. Area ----------
function nysAreaQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["count", "count", "rect"], ["count", "rect", "rect", "unknown"], ["rect", "unknown", "lshape", "tworects", "same"], ["lshape", "unknown", "same", "tworects", "lshape", "compare"]][L]);
  const unit = choice(["cm", "m", "in", "ft"]);
  const [sing, plur] = NYS_UNIT_WORD[unit];
  const sq = `square ${plur}`;

  if (mode === "count") {
    const r = randInt(2, L ? 5 : 4), c = randInt(3, L ? 8 : 6);
    const area = r * c;
    return {
      prompt: `Each small square is 1 square ${sing}. What is the area of the rectangle?`,
      choices: nysNumChoices(area, [2 * (r + c), r + c, area + r, area - c, area + c], ` ${sq}`), answer: nysWithUnit(area, ` ${sq}`),
      uid: `area:count:${r}x${c}:${unit}`, illustration: { type: "area_grid", rows: r, cols: c },
    };
  }
  if (mode === "rect") {
    const l = randInt(3, L < 2 ? 9 : 12), w = randInt(2, L < 2 ? 6 : 9);
    const area = l * w;
    return {
      prompt: `A rectangle is ${l} ${plur} long and ${w} ${plur} wide. What is its area?`,
      choices: nysNumChoices(area, [2 * (l + w), l + w, area + l, area - w, area + w], ` ${sq}`), answer: nysWithUnit(area, ` ${sq}`),
      uid: `area:rect:${l}x${w}:${unit}`, illustration: { type: "rect_dims", length: l, width: w, unit },
    };
  }
  if (mode === "unknown") {
    const l = randInt(3, 9), w = randInt(2, 8);
    const area = l * w;
    const askW = Math.random() < 0.5;
    const known = askW ? l : w, ans = askW ? w : l;
    return {
      prompt: `The area of a rectangle is ${area} ${sq}. The ${askW ? "length" : "width"} is ${known} ${plur}. What is the ${askW ? "width" : "length"}?`,
      choices: nysNumChoices(ans, [area - known, area + known, known, Math.floor(area / 2), ans + 1], ` ${plur}`), answer: nysWithUnit(ans, ` ${plur}`),
      uid: `area:unknown:${area}:${known}:${unit}`, illustration: { type: "rect_dims", length: askW ? l : "?", width: askW ? "?" : w, unit, labelsOnly: true, real: [l, w] },
    };
  }
  if (mode === "lshape") {
    const A = randInt(6, 11), B = randInt(5, 9);
    const a = randInt(2, A - 3), b = randInt(2, B - 2);
    const area = A * B - a * b;
    return {
      prompt: `What is the area of the shape? All corners are square corners.`,
      choices: nysNumChoices(area, [A * B, A * B + a * b, A * B - a - b, (A - a) * b, area + A], ` ${sq}`), answer: nysWithUnit(area, ` ${sq}`),
      uid: `area:l:${A}:${B}:${a}:${b}:${unit}`, illustration: { type: "l_shape", A, B, a, b, unit },
    };
  }
  if (mode === "tworects") {
    const l1 = randInt(3, 9), w1 = randInt(2, 6), l2 = randInt(3, 9), w2 = randInt(2, 6);
    const askTotal = Math.random() < 0.5;
    const a1 = l1 * w1, a2 = l2 * w2;
    if (!askTotal && a1 === a2) return nysAreaQ(ageIdx, diffIdx);
    const [nameA, nameB] = [choice(["Mia", "Noah", "Ava"]), choice(["Leo", "Zoe", "Sam"])];
    if (askTotal) {
      const ans = a1 + a2;
      return {
        prompt: `A school garden has two rectangular beds. One bed is ${l1} ${plur} by ${w1} ${plur}. The other bed is ${l2} ${plur} by ${w2} ${plur}. What is the total area of the two beds?`,
        choices: nysNumChoices(ans, [Math.abs(a1 - a2), (l1 + l2) * (w1 + w2), 2 * (l1 + w1 + l2 + w2), ans + 10, ans - 6], ` ${sq}`), answer: nysWithUnit(ans, ` ${sq}`),
        uid: `area:two:${l1}x${w1}+${l2}x${w2}:${unit}`,
      };
    }
    const diff = Math.abs(a1 - a2);
    return {
      prompt: `${nameA}'s rug is ${l1} ${plur} by ${w1} ${plur}. ${nameB}'s rug is ${l2} ${plur} by ${w2} ${plur}. How many more square ${plur} does the bigger rug cover than the smaller rug?`,
      choices: nysNumChoices(diff, [a1 + a2, Math.abs(l1 - l2) * Math.abs(w1 - w2), diff + 4, Math.max(1, diff - 3), Math.abs(l1 + w1 - l2 - w2)], ` ${sq}`), answer: nysWithUnit(diff, ` ${sq}`),
      uid: `area:diff:${l1}x${w1}-${l2}x${w2}:${unit}`,
    };
  }
  if (mode === "same") {
    const N = choice([12, 16, 18, 20, 24, 30, 36]);
    const pairs = [];
    for (let x = 2; x <= N / 2; x++) if (N % x === 0 && x <= N / x) pairs.push([x, N / x]);
    if (pairs.length < 2) return nysAreaQ(ageIdx, diffIdx);
    const sh = shuffle(pairs.slice());
    const [bl, bw] = sh[0], [al, aw] = sh[1];
    const label = (x, y) => `${nysWithUnit(x, " " + plur)} by ${nysWithUnit(y, " " + plur)}`;
    const wrongs = [label(bl + 1, bw), label(al, aw + 2), label(bl + 2, bw + 1), label(al + 1, aw - 1 || 1), label(bl, bw + 3)].filter((w) => {
      const m = w.match(/(\d+) \D+ by (\d+)/); return Number(m[1]) * Number(m[2]) !== N;
    });
    return {
      prompt: `Which rectangle has the same area as a rectangle that is ${bl} ${plur} by ${bw} ${plur}?`,
      choices: nysPick4(label(al, aw), wrongs), answer: label(al, aw), uid: `area:same:${N}:${bl}x${bw}:${al}x${aw}:${unit}`,
    };
  }
  // compare: which has the greater area
  const l1 = randInt(3, 9), w1 = randInt(2, 8), l2 = randInt(3, 9), w2 = randInt(2, 8);
  if (l1 * w1 === l2 * w2) return nysAreaQ(ageIdx, diffIdx);
  const A = `Rectangle A: ${l1} ${plur} by ${w1} ${plur}`, B = `Rectangle B: ${l2} ${plur} by ${w2} ${plur}`;
  const per1 = 2 * (l1 + w1), per2 = 2 * (l2 + w2);
  if ((l1 * w1 > l2 * w2) === (per1 > per2)) return nysAreaQ(ageIdx, diffIdx); // want area and perimeter to disagree
  return {
    prompt: `${A}\n${B}\n\nWhich rectangle has the greater area?`,
    choices: ["Rectangle A", "Rectangle B", "They have the same area"], answer: l1 * w1 > l2 * w2 ? "Rectangle A" : "Rectangle B",
    uid: `area:cmp:${l1}x${w1}:${l2}x${w2}:${unit}`, _choicesShuffled: true,
  };
}

// ---------- 6. Perimeter ----------
function nysPerimeterQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["rect", "poly", "rect"], ["rect", "poly", "poly", "missingrect"], ["poly", "missingpoly", "missingrect", "word"], ["missingpoly", "missingrect", "samep", "word", "poly"]][L]);
  const unit = choice(["cm", "m", "in", "ft"]);
  const [, plur] = NYS_UNIT_WORD[unit];

  if (mode === "rect") {
    const l = randInt(3, 12), w = randInt(2, 9);
    const p = 2 * (l + w);
    return {
      prompt: `A rectangle is ${l} ${plur} long and ${w} ${plur} wide. What is its perimeter?`,
      choices: nysNumChoices(p, [l * w, l + w, p + 2, p - 2, l + w + l], ` ${plur}`), answer: nysWithUnit(p, ` ${plur}`),
      uid: `per:rect:${l}x${w}:${unit}`, illustration: { type: "rect_dims", length: l, width: w, unit },
    };
  }
  if (mode === "poly") {
    const n = choice(L >= 2 ? [3, 4, 5] : [3, 4]);
    const sides = [];
    for (let i = 0; i < n; i++) sides.push(randInt(2, 11));
    const p = sides.reduce((x, y) => x + y, 0);
    return {
      prompt: "What is the perimeter of the shape?",
      choices: nysNumChoices(p, [p + sides[0], p - sides[1], Math.max(...sides) * n, p + 2, p - 1], ` ${plur}`), answer: nysWithUnit(p, ` ${plur}`),
      uid: `per:poly:${sides.join(",")}:${unit}`, illustration: { type: "poly_sides", labels: sides.map((s) => `${s} ${unit}`) },
    };
  }
  if (mode === "missingpoly") {
    const n = choice([3, 4]);
    const sides = [];
    for (let i = 0; i < n; i++) sides.push(randInt(3, 12));
    const p = sides.reduce((x, y) => x + y, 0);
    const missing = sides[n - 1];
    const known = sides.slice(0, n - 1);
    const labels = known.map((s) => `${s} ${unit}`).concat(["?"]);
    return {
      prompt: `The perimeter of the shape is ${p} ${plur}. What is the length of the missing side (marked with a question mark)?`,
      choices: nysNumChoices(missing, [p - known[0], p, known.reduce((x, y) => x + y, 0), missing + 1, missing - 1], ` ${plur}`), answer: nysWithUnit(missing, ` ${plur}`),
      uid: `per:missing:${known.join(",")}:${p}:${unit}`, illustration: { type: "poly_sides", labels },
    };
  }
  if (mode === "missingrect") {
    const l = randInt(4, 14), w = randInt(2, l - 1);
    const p = 2 * (l + w);
    return {
      prompt: `The perimeter of a rectangle is ${p} ${plur}. The length is ${l} ${plur}. What is the width?`,
      choices: nysNumChoices(w, [p - l, p / 2, p - 2 * l, l - w, w + 2], ` ${plur}`), answer: nysWithUnit(w, ` ${plur}`),
      uid: `per:missrect:${p}:${l}:${unit}`,
    };
  }
  if (mode === "word") {
    const l = randInt(5, 15), w = randInt(3, 10);
    const p = 2 * (l + w);
    const what = choice([["fence", "a rectangular dog pen"], ["ribbon", "a rectangular picture frame"], ["rope", "a rectangular play area"]]);
    return {
      prompt: `${choice(NAMES)} wants to put ${what[0]} around ${what[1]} that is ${l} ${plur} long and ${w} ${plur} wide. How many ${plur} of ${what[0]} are needed?`,
      choices: nysNumChoices(p, [l * w, l + w, p + l, p - w, 2 * l + w], ` ${plur}`), answer: nysWithUnit(p, ` ${plur}`),
      uid: `per:word:${l}x${w}:${what[0]}:${unit}`,
    };
  }
  // samep: which rectangle has a given perimeter
  const half = randInt(8, 15);
  const l = randInt(Math.ceil(half / 2) + 1, half - 2), w = half - l;
  const P = 2 * half;
  const label = (x, y) => `${nysWithUnit(x, " " + plur)} by ${nysWithUnit(y, " " + plur)}`;
  const wrongs = [label(l + 1, w + 2), label(l + 2, w), label(w + 3, w + 1), label(l, w + 3), label(l - 1, w - 1 > 0 ? w - 1 : 1)].filter((s) => {
    const m = s.match(/(\d+) \D+ by (\d+)/); return Number(m[1]) + Number(m[2]) !== half;
  });
  return {
    prompt: `Which rectangle has a perimeter of ${P} ${plur}?`,
    choices: nysPick4(label(l, w), wrongs), answer: label(l, w), uid: `per:same:${P}:${l}x${w}:${unit}`,
  };
}

// ---------- 7. Time ----------
// Noun phrases usable as "{act} starts at ... / ended at ... / lasts N minutes" (packs can add more).
const NYS_TIME_ACTIVITIES = ["Soccer practice", "A movie", "Art class", "A piano lesson", "The school play", "A baking class", "A show", "The class", "A bike ride", "A science test", "The game", "Lunch", "Dance class", "The assembly", "A walk", "The field trip", "Band practice"];
function nysTimeQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["read5", "elapsed", "read5"], ["read5", "elapsed", "endtime", "elapsed"], ["read1", "elapsed", "endtime", "starttime"], ["read1", "elapsed", "endtime", "starttime", "elapsed"]][L]);
  const am = () => choice(["AM", "PM"]);

  if (mode === "read5" || mode === "read1") {
    const h = randInt(1, 12);
    const m = mode === "read5" ? choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) : randInt(1, 59);
    const answer = nysTime(h, m);
    const wrongs = [nysTime(h, (m + 5) % 60), nysTime(h, (m + 55) % 60), nysTime(h, (m + 10) % 60), nysTime((h % 12) + 1, m), nysTime(((h + 10) % 12) + 1, m)];
    if (m % 5 === 0 && m !== 0 && h * 5 !== m) wrongs.push(nysTime(Math.max(1, m / 5), h * 5 >= 60 ? 0 : h * 5));
    return {
      prompt: "What time does the clock show?",
      choices: nysPick4(answer, wrongs.filter((w) => w !== answer)), answer, uid: `time:read:${h}:${m}`,
      illustration: { type: "clock", hour: h, minute: m },
    };
  }
  if (mode === "elapsed") {
    const sameHour = L === 0;
    const startH = randInt(1, 11), startM = choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45]);
    let dur;
    if (sameHour) dur = choice([5, 10, 15, 20, 25, 30]);
    else if (L === 1) dur = choice([15, 20, 25, 30, 35, 40, 45]);
    else dur = choice([35, 40, 45, 50, 55, 65, 70, 75, 80, 85, 95, 100, 105, 110]);
    const start = startH * 60 + startM, end = start + dur;
    if (sameHour && startM + dur >= 60) return nysTimeQ(ageIdx, diffIdx);
    const ap = am();
    const t1 = nysTime(startH, startM), t2 = nysMinsToHM(end);
    const fmt = (d) => d < 60 ? `${d} minutes` : (d % 60 === 0 ? `${d / 60} hour${d / 60 > 1 ? "s" : ""}` : `${Math.floor(d / 60)} hour${Math.floor(d / 60) > 1 ? "s" : ""} ${d % 60} minutes`);
    const wrongs = [fmt(dur + 5), fmt(dur + 10), fmt(Math.max(5, dur - 5)), fmt(Math.max(5, dur - 10)), fmt(dur + 60), fmt(dur > 60 ? dur - 60 : dur + 20)];
    const act = choice(NYS_TIME_ACTIVITIES);
    return {
      prompt: `${act} starts at ${t1} ${ap} and ends at ${t2} ${ap}. How long does it last?`,
      choices: nysPick4(fmt(dur), wrongs.filter((w) => w !== fmt(dur))), answer: fmt(dur),
      uid: `time:elapsed:${t1}:${t2}:${ap}:${act}`,
    };
  }
  if (mode === "endtime") {
    const startH = randInt(1, 11), startM = choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const dur = L >= 3 ? choice([25, 35, 45, 55, 65, 75, 85, 95]) : choice([10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const start = startH * 60 + startM;
    const answer = nysMinsToHM(start + dur);
    const noCarry = startM + dur >= 60 ? nysTime(startH, startM + dur - 60) : nysTime(startH, (startM + 10) % 60);
    const wrongs = [noCarry, nysMinsToHM(start + dur + 10), nysMinsToHM(start + dur - 10), nysMinsToHM(start + dur + 60), nysMinsToHM(start + dur - 5), nysMinsToHM(start + dur + 5)];
    const t1 = nysTime(startH, startM);
    const ap = am();
    const act = choice(NYS_TIME_ACTIVITIES);
    return {
      prompt: `${act} starts at ${t1} ${ap} and lasts ${dur} minutes. What time does it end?`,
      choices: nysPick4(answer, wrongs.filter((w) => w !== answer)), answer, uid: `time:end:${t1}:${dur}:${ap}:${act}`,
    };
  }
  // starttime
  const endH = randInt(2, 12), endM = choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
  const dur = choice([20, 25, 30, 35, 40, 45, 50, 55, 65, 70, 75]);
  const end = endH * 60 + endM;
  const answer = nysMinsToHM(end - dur);
  const wrongs = [nysMinsToHM(end + dur), nysMinsToHM(end - dur + 10), nysMinsToHM(end - dur - 10), nysMinsToHM(end - dur + 60), nysMinsToHM(end - dur - 5), nysMinsToHM(end - dur + 5)];
  const t2 = nysTime(endH, endM);
  const ap = am();
  const act = choice(NYS_TIME_ACTIVITIES);
  return {
    prompt: `${act} ended at ${t2} ${ap}. It lasted ${dur} minutes. What time did it start?`,
    choices: nysPick4(answer, wrongs.filter((w) => w !== answer)), answer, uid: `time:start:${t2}:${dur}:${ap}:${act}`,
  };
}

// ---------- 8. Liquid volume & mass ----------
const NYS_MASS_ITEMS = [
  ["a paper clip", 1, "grams"], ["a pencil", 10, "grams"], ["an apple", 150, "grams"], ["a slice of bread", 25, "grams"],
  ["a strawberry", 20, "grams"], ["a crayon", 5, "grams"],
  ["a watermelon", 5, "kilograms"], ["a bag of potatoes", 2, "kilograms"], ["a cat", 4, "kilograms"], ["a bowling ball", 6, "kilograms"],
  ["a third grader", 30, "kilograms"], ["a bicycle", 12, "kilograms"], ["a medium dog", 20, "kilograms"], ["a bag of dog food", 10, "kilograms"],
];
const NYS_LIQUID_ITEMS = [
  ["a bathtub", 150], ["a fish tank", 40], ["a bucket", 10], ["a juice jug", 2], ["a kiddie pool", 400], ["a car's gas tank", 50],
  ["a large bottle of water", 2], ["a big pot of soup", 6], ["a watering can", 8], ["a sink", 20],
];
function nysVolumeMassQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["unit", "estimate", "reading"], ["unit", "estimate", "reading", "word"], ["estimate", "reading", "word", "word"], ["word", "word", "reading", "estimate", "two"]][L]);

  if (mode === "unit") {
    const kind = choice(["mass", "mass", "liquid"]);
    if (kind === "liquid") {
      const [item] = choice(NYS_LIQUID_ITEMS);
      return {
        prompt: `Which unit is best for measuring the amount of water ${item} holds?`,
        choices: nysPick4("liters", ["grams", "kilograms", "meters"]), answer: "liters", uid: `vm:unit:${item}`,
      };
    }
    const [item, , unit] = choice(NYS_MASS_ITEMS);
    return {
      prompt: `Which unit is best for measuring the mass of ${item}?`,
      choices: nysPick4(unit, ["grams", "kilograms", "liters", "meters"].filter((u) => u !== unit)), answer: unit, uid: `vm:unit:${item}`,
    };
  }
  if (mode === "estimate") {
    if (Math.random() < 0.65) {
      const [item, val, unit] = choice(NYS_MASS_ITEMS);
      const other = unit === "grams" ? "kilograms" : "grams";
      const answer = nysWithUnit(val, ` ${unit}`);
      const wrongs = [nysWithUnit(val, ` ${other}`), nysWithUnit(val * 10, ` ${unit}`), nysWithUnit(val * 100, ` ${unit}`), val >= 10 ? nysWithUnit(val / 10, ` ${unit}`) : nysWithUnit(val * 1000, ` ${unit}`)];
      return { prompt: `Which is the best estimate of the mass of ${item}?`, choices: nysPick4(answer, wrongs.filter((w) => w !== answer)), answer, uid: `vm:est:${item}` };
    }
    const [item, val] = choice(NYS_LIQUID_ITEMS);
    const answer = nysWithUnit(val, " liters");
    const wrongs = [nysWithUnit(val * 10, " liters"), nysWithUnit(val * 100, " liters"), val >= 10 ? nysWithUnit(val / 10, " liters") : nysWithUnit(val * 1000, " liters"), nysWithUnit(val * 5, " liters")];
    return { prompt: `Which is the best estimate of the amount of water ${item} can hold?`, choices: nysPick4(answer, wrongs.filter((w) => w !== answer)), answer, uid: `vm:est:${item}` };
  }
  if (mode === "reading") {
    const step = choice(L === 0 ? [1, 2] : L === 1 ? [2, 5] : [2, 5, 10]);
    const ticks = randInt(5, 10);
    const max = step * ticks;
    const half = L >= 2 && step % 2 === 0;
    let level = step * randInt(1, ticks - 1);
    if (half && Math.random() < 0.5) level += step / 2;
    if (level >= max) level = max - step;
    const wrongs = [level + step, level - step, level + 1, level - 1, level + step / 2, max];
    return {
      prompt: "How many liters of water are in the container?",
      choices: nysNumChoices(level, wrongs, " liters"), answer: nysWithUnit(level, " liters"),
      uid: `vm:read:${step}:${max}:${level}`, illustration: { type: "beaker", max, step, level, unit: "L" },
    };
  }
  if (mode === "word") {
    const name = choice(NAMES);
    const kinds = [
      () => { const a = randInt(12, 40), b = randInt(3, a - 4); return { t: `A tank holds ${a} liters of water. ${name} pours out ${b} liters. How many liters are left?`, ans: a - b, s: " liters", w: [a + b, b, a - b + 2, a - b - 2] }; },
      () => { const a = randInt(3, 9), b = randInt(2, 8); return { t: `${name} fills ${a} buckets. Each bucket holds ${b} liters. How many liters of water is that in all?`, ans: a * b, s: " liters", w: [a + b, a * b + b, a * b - a, a * b + 3] }; },
      () => { const b = randInt(3, 8), a = b * randInt(3, 9); return { t: `A ${a}-kilogram sack of rice is shared equally into ${b} bags. How many kilograms are in each bag?`, ans: a / b, s: " kilograms", w: [a - b, a * b, a / b + 2, a / b - 1] }; },
      () => { const a = randInt(150, 480), b = randInt(100, 320); return { t: `A pear has a mass of ${a} grams. An orange has a mass of ${b} grams. What is the total mass of the pear and the orange?`, ans: a + b, s: " grams", w: [a - b, a + b + 10, a + b - 10, a * 2] }; },
      () => { const a = randInt(20, 90), b = randInt(5, 18); return { t: `A box has a mass of ${a} kilograms. ${name} takes out a toy that has a mass of ${b} kilograms. What is the mass of the box now?`, ans: a - b, s: " kilograms", w: [a + b, b, a - b + 1, a - b - 5] }; },
      () => { const a = randInt(3, 8), b = randInt(2, 9); return { t: `Each of ${a} bags of flour has a mass of ${b} kilograms. What is the mass of all the bags together?`, ans: a * b, s: " kilograms", w: [a + b, a * b + a, a * b - b, a * b + 2] }; },
    ];
    const k = choice(kinds)();
    return { prompt: k.t, choices: nysNumChoices(k.ans, k.w, k.s), answer: nysWithUnit(k.ans, k.s), uid: `vm:word:${k.t}` };
  }
  // two-step
  const name = choice(NAMES);
  const kinds = [
    () => { const a = randInt(3, 6), b = randInt(3, 8), c = randInt(2, a * b - 4); return { t: `${name} fills ${a} jugs with ${b} liters each. Then ${name} uses ${c} liters to water plants. How many liters are left?`, ans: a * b - c, s: " liters", w: [a * b + c, a + b - c, a * b - c + 2, a * b] }; },
    () => { const per = randInt(2, 6), n = randInt(3, 7), extra = randInt(2, 9); return { t: `${name} buys ${n} bags of apples that each have a mass of ${per} kilograms. ${name} also buys ${extra} kilograms of pears. What is the total mass of the fruit?`, ans: n * per + extra, s: " kilograms", w: [n + per + extra, n * per, n * (per + extra), n * per + extra + 2] }; },
    () => { const b = randInt(3, 6), q = randInt(4, 9), extra = randInt(2, 10); return { t: `A fish tank holds ${b * q + extra} liters. ${name} fills it using a ${b}-liter bucket until only ${extra} liters are left to add. How many full buckets did ${name} use?`, ans: q, s: " buckets", w: [q + 1, q - 1, b * q, q + extra] }; },
  ];
  const k = choice(kinds)();
  return { prompt: k.t, choices: nysNumChoices(k.ans, k.w, k.s), answer: nysWithUnit(k.ans, k.s), uid: `vm:two:${k.t}` };
}

// ---------- 9. Scaled picture & bar graphs ----------
const NYS_GRAPH_SETS = [
  ["favorite fruits", ["Apples", "Bananas", "Grapes", "Oranges", "Pears"], "students"],
  ["pets", ["Dogs", "Cats", "Fish", "Birds", "Rabbits"], "students"],
  ["favorite sports", ["Soccer", "Tennis", "Swimming", "Baseball", "Hockey"], "students"],
  ["books read", ["Mia", "Noah", "Ava", "Leo", "Zoe"], "books"],
  ["lunch choices", ["Pizza", "Pasta", "Salad", "Tacos", "Soup"], "students"],
  ["stickers collected", ["Ben", "Ivy", "Sam", "Nina", "Liam"], "stickers"],
  ["favorite colors", ["Red", "Blue", "Green", "Purple", "Yellow"], "votes"],
  ["trees planted", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "trees"],
  ["visitors to the library", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "visitors"],
];
function nysGraphsQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const [theme0, allCats, noun] = choice(NYS_GRAPH_SETS);
  const n = L === 0 ? 3 : 4;
  const cats = shuffle(allCats.slice()).slice(0, n);
  const kindPick = choice(["picture", "bar"]);
  const step = kindPick === "picture" ? choice(L === 0 ? [2, 5] : [2, 5, 10]) : choice(L === 0 ? [2] : L === 1 ? [2, 5] : [2, 5, 10]);
  const mult = kindPick === "bar" && L >= 2 && (step === 2 ? true : step === 10) ? step / 2 : step;
  const maxK = 8;
  let ks = cats.map(() => randInt(1, maxK));
  let vals = ks.map((k) => k * mult);
  if (kindPick === "picture") vals = ks.map((k) => k * step);
  // distinct values so "most"/"fewest" are unambiguous
  const uniq = new Set(vals);
  if (uniq.size < vals.length) return nysGraphsQ(ageIdx, diffIdx);
  const chart = kindPick === "picture"
    ? { kind: "pictograph", categories: cats, values: vals, unit: step }
    : { kind: "scaled_bar", categories: cats, values: vals, step, title: theme0 };
  const gname = kindPick === "picture" ? "picture graph" : "bar graph";
  const intro = kindPick === "picture" ? `Use the picture graph about ${theme0}. Each ⭐ stands for ${step} ${noun}.` : `Use the bar graph about ${theme0}.`;
  const idx = shuffle([0, 1, 2, 3].slice(0, n));
  const [i, j, k3] = idx;
  const total = vals.reduce((x, y) => x + y, 0);
  const modes = L === 0 ? ["read", "more", "most"] : L === 1 ? ["read", "more", "fewer", "total2", "most"] : L === 2 ? ["more", "total", "total2", "extra", "fewest"] : ["extra", "twostep", "more", "total", "twostep"];
  const mode = choice(modes);
  const sfx = "";
  let prompt, ans, w, answer;
  if (mode === "read") { prompt = `${intro}\nHow many ${noun} are shown for ${cats[i]}?`; ans = vals[i]; w = [vals[i] + step, vals[i] - step, vals[i] / step, vals[i] + 1]; }
  else if (mode === "more") { const hi = vals[i] > vals[j] ? i : j, lo = hi === i ? j : i; prompt = `${intro}\nHow many more ${noun} are shown for ${cats[hi]} than for ${cats[lo]}?`; ans = vals[hi] - vals[lo]; w = [vals[hi] + vals[lo], vals[hi], (vals[hi] - vals[lo]) / step, ans + step]; }
  else if (mode === "fewer") { const hi = vals[i] > vals[j] ? i : j, lo = hi === i ? j : i; prompt = `${intro}\nHow many fewer ${noun} are shown for ${cats[lo]} than for ${cats[hi]}?`; ans = vals[hi] - vals[lo]; w = [vals[hi] + vals[lo], vals[lo], ans + step, Math.max(1, ans - step)]; }
  else if (mode === "total2") { prompt = `${intro}\nHow many ${noun} are shown for ${cats[i]} and ${cats[j]} together?`; ans = vals[i] + vals[j]; w = [Math.abs(vals[i] - vals[j]), ans + step, ans - step, vals[i]]; }
  else if (mode === "total") { prompt = `${intro}\nHow many ${noun} are shown in all?`; ans = total; w = [total - vals[0], total + step, total - step, vals.reduce((x, y) => Math.max(x, y), 0)]; }
  else if (mode === "most") { const mx = vals.indexOf(Math.max(...vals)); prompt = `${intro}\nWhich one shows the greatest number of ${noun}?`; return { prompt, choices: shuffle(cats.slice()), answer: cats[mx], uid: `gr:${kindPick}:most:${cats.join(",")}:${vals.join(",")}`, chart }; }
  else if (mode === "fewest") { const mn = vals.indexOf(Math.min(...vals)); prompt = `${intro}\nWhich one shows the least number of ${noun}?`; return { prompt, choices: shuffle(cats.slice()), answer: cats[mn], uid: `gr:${kindPick}:fewest:${cats.join(",")}:${vals.join(",")}`, chart }; }
  else if (mode === "extra") { const add = choice([step, step * 2, 5, 10]); prompt = `${intro}\n${add} more ${noun} are added for ${cats[i]}. How many ${noun} are shown for ${cats[i]} now?`; ans = vals[i] + add; w = [vals[i], vals[i] - add > 0 ? vals[i] - add : vals[i] + 2 * add, add, ans + step]; }
  else { // twostep
    const hi = vals[i] + vals[j];
    if (hi <= vals[k3]) return nysGraphsQ(ageIdx, diffIdx);
    prompt = `${intro}\nHow many more ${noun} are shown for ${cats[i]} and ${cats[j]} together than for ${cats[k3]}?`; ans = hi - vals[k3]; w = [hi, hi + vals[k3], ans + step, Math.abs(vals[i] - vals[j])];
  }
  const out = { prompt, choices: nysNumChoices(ans, w), answer: String(ans), uid: `gr:${kindPick}:${mode}:${cats.join(",")}:${vals.join(",")}:${i}${j}`, chart };
  return out;
}

// ---------- 10. Number patterns ----------
const NYS_TRUE_STATEMENTS = [
  "The sum of two even numbers is always even.",
  "The sum of two odd numbers is always even.",
  "An even number times any whole number is always even.",
  "Every multiple of 5 ends in 0 or 5.",
  "Every multiple of 10 ends in 0.",
  "The product of any number and 0 is 0.",
  "When you add 0 to a number, the number does not change.",
  "The sum of an even number and an odd number is always odd.",
  "Every multiple of 2 is an even number.",
  "Doubling an even number gives an even number.",
  "In the 9s facts, the digits of each product add up to 9 (like 18: 1 + 8 = 9).",
  "Every number in the 4s multiplication facts is double a number in the 2s facts.",
  "Multiplying any number by 1 gives the same number.",
];
const NYS_FALSE_STATEMENTS = [
  "The sum of two odd numbers is always odd.",
  "The sum of two even numbers is always odd.",
  "An odd number times an odd number is always even.",
  "Every multiple of 5 ends in 5.",
  "Every multiple of 10 ends in 5.",
  "The product of any number and 0 is that number.",
  "Every multiple of 3 is an even number.",
  "The sum of an even number and an odd number is always even.",
  "Every even number is a multiple of 4.",
  "Every multiple of 6 is odd.",
  "Every number in the 2s facts is odd.",
  "When you multiply a number by 1, the product is 1.",
  "Multiples of 4 always end in 4.",
];
function nysPatternsQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["next", "rule", "next"], ["next", "rule", "missing", "statement"], ["rule", "missing", "statement", "table", "multiply"], ["table", "statement", "missing", "multiply", "oddout"]][L]);

  if (mode === "next" || mode === "rule" || mode === "missing") {
    const step = choice(L === 0 ? [2, 3, 5, 10] : L === 1 ? [3, 4, 5, 6, 10] : [6, 7, 8, 9, 12, 15, 25]);
    const dir = L >= 2 && Math.random() < 0.3 ? -1 : 1;
    const len = 5;
    const start = dir > 0 ? randInt(1, 30) : step * 5 + randInt(5, 40);
    const seq = []; for (let i = 0; i < len; i++) seq.push(start + dir * step * i);
    if (seq.some((x) => x < 0)) return nysPatternsQ(ageIdx, diffIdx);
    const ruleTxt = (s, d) => `${d > 0 ? "Add" : "Subtract"} ${s}`;
    if (mode === "next") {
      const shown = seq.slice(0, 4), ans = seq[4];
      return { prompt: `Look at the pattern.\n\n${shown.join(", ")}, ___\n\nWhat number comes next?`, choices: nysNumChoices(ans, [ans + dir * 1, ans - dir * step, ans + dir * (step + 1), ans + dir * (step * 2)]), answer: String(ans), uid: `pat:next:${seq.join(",")}` };
    }
    if (mode === "rule") {
      const answer = ruleTxt(step, dir);
      const wrongs = [ruleTxt(step + 1, dir), ruleTxt(step - 1, dir), ruleTxt(step, -dir), ruleTxt(step * 2, dir), `Multiply by ${step}`];
      return { prompt: `What is the rule for this pattern?\n\n${seq.slice(0, 5).join(", ")}`, choices: nysPick4(answer, wrongs.filter((w) => w !== answer && !/ 0$/.test(w))), answer, uid: `pat:rule:${seq.join(",")}` };
    }
    const hole = randInt(1, 3);
    const shown = seq.map((x, i) => (i === hole ? "___" : x));
    const ans = seq[hole];
    return { prompt: `Find the missing number in the pattern.\n\n${shown.join(", ")}`, choices: nysNumChoices(ans, [ans + 1, ans - 1, ans + step, ans - step]), answer: String(ans), uid: `pat:miss:${seq.join(",")}:${hole}` };
  }
  if (mode === "statement") {
    const t = choice(NYS_TRUE_STATEMENTS);
    const fs = shuffle(NYS_FALSE_STATEMENTS.slice()).slice(0, 3);
    return { prompt: "Which statement is true?", choices: shuffle([t, ...fs]), answer: t, uid: `pat:stmt:${t}:${fs.join("|")}` };
  }
  if (mode === "table") {
    const k = choice(L >= 3 ? [3, 4, 5, 6, 7, 8, 9] : [2, 3, 4, 5, 6]);
    const add = L >= 3 && Math.random() < 0.5 ? randInt(1, 5) : 0;
    const ins = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 3).sort((x, y) => x - y);
    const out = ins.map((x) => x * k + add);
    const test = randInt(8, 12);
    const ans = test * k + add;
    const ruleTxt = add ? `Multiply by ${k}, then add ${add}` : `Multiply by ${k}`;
    return {
      prompt: `A rule changes each Input number to an Output number.\n\nInput:  ${ins.join(",  ")}\nOutput: ${out.join(",  ")}\n\nUsing the same rule, what is the Output when the Input is ${test}?`,
      choices: nysNumChoices(ans, [test + k + add, test * k, ans + k, ans - k, test + (out[0] - ins[0])]), answer: String(ans), uid: `pat:table:${k}:${add}:${ins.join(",")}:${test}`,
    };
  }
  if (mode === "multiply") {
    const base = choice([2, 3, 4, 5, 6]);
    const seq = [base, base * 2, base * 4, base * 8];
    return { prompt: `Look at the pattern.\n\n${seq.join(", ")}, ___\n\nWhat number comes next?`, choices: nysNumChoices(base * 16, [base * 12, base * 10, base * 8 + base, base * 8 + 8]), answer: String(base * 16), uid: `pat:dbl:${base}` };
  }
  // oddout
  const step = choice([4, 6, 7, 8, 9]);
  const start = step * randInt(1, 4);
  const seq = []; for (let i = 0; i < 6; i++) seq.push(start + step * i);
  const bad = randInt(1, 4);
  const wrong = seq[bad] + choice([1, 2, 3, -1, -2]);
  const shown = seq.slice(); shown[bad] = wrong;
  const answer = String(wrong);
  const pool = shown.filter((_, i) => i !== bad).map(String);
  return { prompt: `The numbers follow a pattern, but one number does not belong.\n\n${shown.join(", ")}\n\nWhich number does not belong?`, choices: nysPick4(answer, pool), answer, uid: `pat:odd:${shown.join(",")}` };
}

// Two-step story templates. Placeholders: {name} {item} plus the numbers each form needs:
//   mul_sub {g}{p}{s}: g groups of p, then s taken away     (g*p - s)
//   mul_add {g}{p}{e}: g groups of p, then e more            (g*p + e)
//   div_add {t}{b}{e}: share t equally among b, then e more  (t/b + e)
//   add_div {a}{b}{c}: a and b more together, split into c   ((a+b)/c)
// NYS_STORIES_EXTRA is filled from content packs (math_banks.two_step_stories, see content_merge.js).
const NYS_STORIES_BUILTIN = [
  { form: "mul_sub", text: "{name} has {g} bags with {p} {item} in each bag. {name} gives away {s} {item}. How many {item} does {name} have left?" },
  { form: "mul_add", text: "{name} buys {g} packs of {p} {item}. Then {name} finds {e} more {item}. How many {item} does {name} have now?" },
  { form: "div_add", text: "{name} shares {t} {item} equally among {b} friends. Then {name} gives each friend {e} more. How many {item} does each friend have now?" },
  { form: "add_div", text: "{name} has {a} {item} and buys {b} more. Then {name} puts all of them equally into {c} boxes. How many {item} are in each box?" },
];
const NYS_STORIES_EXTRA = [];
function nysStoryText(text, vars) { return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)); }
// Returns { text, ans, w (wrong answers), steps (model lines), groups (acceptable work strings per step) }.
function nysFillStory(st, L, name, item) {
  name = name || choice(NAMES); item = item || choice(NYS_ITEMS);
  const big = L >= 2;
  if (st.form === "mul_sub") {
    const g = randInt(2, big ? 9 : 6), p = randInt(2, big ? 9 : 7), total = g * p, s = randInt(1, Math.min(total - 1, big ? 30 : 12));
    return { text: nysStoryText(st.text, { name, item, g, p, s }), ans: total - s, w: [total + s, g + p - s, total, total - s + 2],
      steps: [`${g} × ${p} = ${total}`, `${total} − ${s} = ${total - s}`], groups: [[`${g}x${p}`, `${p}x${g}`, String(total)], [`${total}-${s}`]] };
  }
  if (st.form === "mul_add") {
    const g = randInt(2, big ? 9 : 6), p = randInt(2, big ? 9 : 7), e = randInt(2, 12), total = g * p;
    return { text: nysStoryText(st.text, { name, item, g, p, e }), ans: total + e, w: [g + p + e, total, g * (p + e), total + e + 2],
      steps: [`${g} × ${p} = ${total}`, `${total} + ${e} = ${total + e}`], groups: [[`${g}x${p}`, `${p}x${g}`, String(total)], [`${total}+${e}`]] };
  }
  if (st.form === "div_add") {
    const b = randInt(2, 6), q = randInt(2, 8), e = randInt(1, 9), t = b * q;
    return { text: nysStoryText(st.text, { name, item, t, b, e }), ans: q + e, w: [t + e, q, q * e, q + e + 1],
      steps: [`${t} ÷ ${b} = ${q}`, `${q} + ${e} = ${q + e}`], groups: [[`${t}/${b}`, String(q)], [`${q}+${e}`]] };
  }
  // add_div
  const c = randInt(2, 6), q = randInt(3, 9), a = randInt(2, c * q - 2), b = c * q - a;
  return { text: nysStoryText(st.text, { name, item, a, b, c }), ans: q, w: [a + b, q + 1, c, q - 1, a],
    steps: [`${a} + ${b} = ${a + b}`, `${a + b} ÷ ${c} = ${q}`], groups: [[`${a}+${b}`, String(a + b)], [`${a + b}/${c}`]] };
}

// ---------- 11. Two-step problems & estimation ----------
function nysTwoStepQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = L === 0 ? "two" : choice(["two", "two", "estimate", "estimate2"].slice(0, L === 1 ? 3 : 4));
  const name = choice(NAMES), item = choice(NYS_ITEMS);

  if (mode === "two") {
    const pool = NYS_STORIES_BUILTIN.concat(NYS_STORIES_EXTRA).filter((st) => L >= 2 || st.form !== "add_div");
    const f = nysFillStory(choice(pool), L, name, item);
    return { prompt: f.text, choices: nysNumChoices(f.ans, f.w), answer: String(f.ans), uid: `ts:two:${f.text}` };
  }
  if (mode === "estimate") {
    const place = L >= 3 ? 100 : 10;
    const lo = place === 100 ? 120 : 14, hi = place === 100 ? 880 : 96;
    const a = randInt(lo, hi), b = randInt(lo, hi);
    const op = Math.random() < 0.6 ? "+" : "-";
    const x = Math.max(a, b), y = Math.min(a, b);
    const r = (v) => Math.round(v / place) * place;
    const est = op === "+" ? r(a) + r(b) : r(x) - r(y);
    if (est <= 0) return nysTwoStepQ(ageIdx, diffIdx);
    const where = choice(["library", "school store", "farm stand", "pet shop"]);
    const prompt = op === "+"
      ? `A ${where} sold ${a} items on Saturday and ${b} items on Sunday. Round each number to the nearest ${place}. About how many items were sold in all?`
      : `A ${where} had ${x} items. It sold ${y} of them. Round each number to the nearest ${place}. About how many items are left?`;
    const wrongs = [est + place, est - place, est + 2 * place, Math.max(place, est - 2 * place), op === "+" ? Math.abs(r(a) - r(b)) : r(x) + r(y)];
    return { prompt, choices: nysNumChoices(est, wrongs.filter((v) => v % place === 0)), answer: String(est), uid: `ts:est:${op}:${a}:${b}:${place}` };
  }
  // estimate2: three numbers, two steps, rounding
  const place = L >= 3 ? 100 : 10;
  const base = place === 100 ? randInt(300, 900) : randInt(40, 95);
  const s1 = place === 100 ? randInt(110, 290) : randInt(11, 29);
  const s2 = place === 100 ? randInt(110, 290) : randInt(11, 29);
  const r = (v) => Math.round(v / place) * place;
  const est = r(base) - r(s1) - r(s2);
  if (est <= 0) return nysTwoStepQ(ageIdx, diffIdx);
  const prompt = `A store has ${base} ${item}. It sells ${s1} ${item} in the morning and ${s2} ${item} in the afternoon. Round each number to the nearest ${place}. About how many ${item} are left?`;
  const wrongs = [est + place, est - place, r(base) + r(s1) - r(s2), Math.max(place, est + 2 * place), r(base) - r(s1)];
  return { prompt, choices: nysNumChoices(est, wrongs.filter((v) => v % place === 0)), answer: String(est), uid: `ts:est2:${base}:${s1}:${s2}:${place}:${item}` };
}

// ---------- 12. Equation match (meaning of x and ÷, unknowns, properties) ----------
function nysEquationMatchQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const mode = choice([["groups", "story", "unknown"], ["groups", "story", "unknown", "story"], ["story", "unknown", "twostep", "prop"], ["twostep", "prop", "story", "unknown", "twostep"]][L]);
  const name = choice(NAMES), item = choice(NYS_ITEMS);

  if (mode === "groups") {
    const a = randInt(2, 9), b = randInt(2, 9);
    const answer = `${a} × ${b}`;
    return {
      prompt: `Which expression shows ${a} groups of ${b}?`,
      choices: nysPick4(answer, [`${a} + ${b}`, `${a} - ${b}`, `${a} ÷ ${b}`, `${b} ÷ ${a}`, `${a} × ${b + 1}`].filter((w) => w !== answer)), answer, uid: `em:groups:${a}:${b}`,
    };
  }
  if (mode === "story") {
    const kinds = [
      () => { const g = randInt(3, 9), p = randInt(2, 9); return { t: `There are ${g} boxes. Each box has ${p} ${item}. The number of ${item} in all is n.`, ans: `${g} × ${p} = n`, w: [`${g} + ${p} = n`, `${g} ÷ ${p} = n`, `${g} - ${p} = n`, `${p} ÷ ${g} = n`] }; },
      () => { const g = randInt(3, 9), p = randInt(2, 9); return { t: `${name} shares ${g * p} ${item} equally among ${g} friends. Each friend gets n ${item}.`, ans: `${g * p} ÷ ${g} = n`, w: [`${g * p} × ${g} = n`, `${g * p} - ${g} = n`, `${g} ÷ ${g * p} = n`, `${g * p} + ${g} = n`] }; },
      () => { const a = randInt(12, 40), b = randInt(3, 11); return { t: `${name} has ${a} ${item} and gets ${b} more. The total is n ${item}.`, ans: `${a} + ${b} = n`, w: [`${a} - ${b} = n`, `${a} × ${b} = n`, `${a} ÷ ${b} = n`, `${b} - ${a} = n`] }; },
      () => { const a = randInt(15, 50), b = randInt(3, 14); return { t: `${name} has ${a} ${item} and gives away ${b}. There are n ${item} left.`, ans: `${a} - ${b} = n`, w: [`${a} + ${b} = n`, `${b} - ${a} = n`, `${a} × ${b} = n`, `${a} ÷ ${b} = n`] }; },
      () => { const g = randInt(3, 8), p = randInt(3, 8); return { t: `${name} puts ${g * p} ${item} into bags with ${p} ${item} in each bag. The number of bags is n.`, ans: `${g * p} ÷ ${p} = n`, w: [`${g * p} × ${p} = n`, `${g * p} - ${p} = n`, `${p} ÷ ${g * p} = n`, `${g * p} + ${p} = n`] }; },
    ];
    const k = choice(kinds)();
    return { prompt: `Which equation matches the story?\n\n${k.t}`, choices: nysPick4(k.ans, k.w), answer: k.ans, uid: `em:story:${k.t}` };
  }
  if (mode === "unknown") {
    const a = randInt(2, 9), b = randInt(2, 9), p = a * b;
    const form = choice(["fac", "div", "div2"]);
    if (form === "fac") return { prompt: `What number makes the equation true?\n\n${a} × ? = ${p}`, choices: nysNumChoices(b, [p - a, p + a, a + b, b + 1, b - 1]), answer: String(b), uid: `em:fac:${a}:${b}` };
    if (form === "div") return { prompt: `What number makes the equation true?\n\n${p} ÷ ? = ${a}`, choices: nysNumChoices(b, [p - a, p, a, b + 1, b - 1]), answer: String(b), uid: `em:div:${p}:${a}` };
    return { prompt: `What number makes the equation true?\n\n? ÷ ${a} = ${b}`, choices: nysNumChoices(p, [a + b, p + a, b, p - a, p + 1]), answer: String(p), uid: `em:div2:${a}:${b}` };
  }
  if (mode === "twostep") {
    const kinds = [
      () => { const g = randInt(2, 6), p = randInt(3, 9), e = randInt(2, 9); return { t: `${name} buys ${g} packs of ${item} with ${p} in each pack and ${e} more ${item}. The total is n ${item}.`, ans: `${g} × ${p} + ${e} = n`, w: [`${g} + ${p} + ${e} = n`, `${g} × (${p} + ${e}) = n`, `${g} × ${p} - ${e} = n`, `${g} × ${p} × ${e} = n`] }; },
      () => { const g = randInt(2, 6), p = randInt(3, 9), s = randInt(2, 9); return { t: `${name} has ${g} bags with ${p} ${item} in each bag, then gives away ${s} ${item}. ${name} has n ${item} left.`, ans: `${g} × ${p} - ${s} = n`, w: [`${g} × ${p} + ${s} = n`, `${g} × (${p} - ${s}) = n`, `${g} + ${p} - ${s} = n`, `${g} - ${p} × ${s} = n`] }; },
      () => { const b = randInt(2, 6), q = randInt(2, 8), e = randInt(2, 9); return { t: `${name} shares ${b * q} ${item} equally among ${b} friends and then gets ${e} more ${item}. ${name} then has n ${item}.`, ans: `${b * q} ÷ ${b} + ${e} = n`, w: [`${b * q} ÷ (${b} + ${e}) = n`, `${b * q} - ${b} + ${e} = n`, `${b * q} × ${b} + ${e} = n`, `${b * q} ÷ ${b} - ${e} = n`] }; },
    ];
    const k = choice(kinds)();
    return { prompt: `Which equation can be used to find n?\n\n${k.t}`, choices: nysPick4(k.ans, k.w), answer: k.ans, uid: `em:two:${k.t}` };
  }
  // property: distributive / commutative
  const form = choice(["dist", "dist", "comm"]);
  if (form === "comm") {
    const a = randInt(3, 9), b = randInt(3, 9);
    return { prompt: `${a} × ${b} = ${a * b}\n\nWhich fact must also be true?`, choices: nysPick4(`${b} × ${a} = ${a * b}`, [`${b} × ${a} = ${a * b + a}`, `${a} ÷ ${b} = ${a * b}`, `${a * b} × ${a} = ${b}`].filter(Boolean)), answer: `${b} × ${a} = ${a * b}`, uid: `em:comm:${a}:${b}` };
  }
  const a = randInt(3, 9), b = randInt(6, 9), p = randInt(2, b - 2), q = b - p;
  const answer = `(${a} × ${p}) + (${a} × ${q})`;
  return {
    prompt: `Which expression is equal to ${a} × ${b}?`,
    choices: nysPick4(answer, [`(${a} × ${p}) + ${q}`, `(${a} + ${p}) × ${q}`, `(${a} × ${p}) × (${a} × ${q})`, `${a} × ${p} + ${q} × ${a} + ${a}`].filter((w) => w !== answer)), answer,
    uid: `em:dist:${a}:${b}:${p}`,
  };
}

// ---------- drawers ----------
function drawNumberLine(illus, theme) {
  const W = 560, H = 120, padL = 44, padR = 44, y0 = 72;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const parts = illus.parts, whole = illus.whole || 1, total = whole * parts;
  const x = (k) => padL + ((W - padL - padR) * k) / total;
  ctx.strokeStyle = theme.text; ctx.fillStyle = theme.text; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(padL - 14, y0); ctx.lineTo(W - padR + 14, y0); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  for (let k = 0; k <= total; k++) {
    const isWhole = k % parts === 0;
    ctx.beginPath(); ctx.moveTo(x(k), y0 - (isWhole ? 14 : 8)); ctx.lineTo(x(k), y0 + (isWhole ? 14 : 8)); ctx.stroke();
    if (isWhole) { ctx.font = "bold 17px 'Segoe UI'"; ctx.fillText(String(k / parts), x(k), y0 + 36); }
    else if (illus.tickLabels) { ctx.font = "11px 'Segoe UI'"; ctx.fillText(`${k}/${parts}`, x(k), y0 + 30); }
  }
  for (const p of illus.points || []) {
    ctx.beginPath(); ctx.arc(x(p.k), y0, 8, 0, Math.PI * 2);
    ctx.fillStyle = theme.choice_palette[0]; ctx.fill(); ctx.strokeStyle = theme.text; ctx.stroke();
    ctx.fillStyle = theme.text; ctx.font = "bold 18px 'Segoe UI'"; ctx.fillText(p.label, x(p.k), y0 - 22);
  }
  return c;
}

function drawFractionBars(illus, theme) {
  const bars = illus.bars;
  const W = 440, barH = 36, gap = 26, padX = 70, top = 8;
  const H = top + bars.length * (barH + gap);
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  bars.forEach((b, i) => {
    const y = top + i * (barH + gap) + 6;
    const bw = W - padX - 20, pw = bw / b.parts;
    for (let p = 0; p < b.parts; p++) {
      ctx.fillStyle = p < b.shaded ? theme.choice_palette[i % theme.choice_palette.length] : "white";
      ctx.fillRect(padX + p * pw, y, pw, barH);
      ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.strokeRect(padX + p * pw, y, pw, barH);
    }
    if (b.label) {
      ctx.fillStyle = theme.text; ctx.font = "bold 13px 'Segoe UI'"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.fillText(b.label, padX - 8, y + barH / 2);
    }
  });
  return c;
}

function drawEmojiRow(illus, theme) {
  const items = illus.items, perRow = Math.min(items.length, 5), cell = 44;
  const rows = Math.ceil(items.length / perRow);
  const c = makeCanvas(perRow * cell + 20, rows * cell + 14);
  const ctx = c.getContext("2d");
  ctx.font = "28px 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  items.forEach((e, i) => ctx.fillText(e, 10 + (i % perRow) * cell + cell / 2, 7 + Math.floor(i / perRow) * cell + cell / 2));
  return c;
}

function drawAreaGrid(illus, theme) {
  const { rows, cols } = illus, cell = 34;
  const c = makeCanvas(cols * cell + 24, rows * cell + 24);
  const ctx = c.getContext("2d");
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    ctx.fillStyle = theme.choice_palette[2]; ctx.fillRect(12 + k * cell, 12 + r * cell, cell, cell);
    ctx.strokeStyle = theme.text; ctx.lineWidth = 1.5; ctx.strokeRect(12 + k * cell, 12 + r * cell, cell, cell);
  }
  return c;
}

function drawRectDims(illus, theme) {
  const real = illus.real || [illus.length, illus.width];
  const maxDim = 190, scale = maxDim / Math.max(real[0], real[1]);
  const wPx = real[0] * scale, hPx = real[1] * scale, pad = 46;
  const c = makeCanvas(wPx + pad * 2, hPx + pad * 2);
  const ctx = c.getContext("2d");
  ctx.fillStyle = theme.choice_palette[2]; ctx.fillRect(pad, pad, wPx, hPx);
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.strokeRect(pad, pad, wPx, hPx);
  ctx.fillStyle = theme.text; ctx.font = "bold 13px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const lab = (v) => (v === "?" ? "?" : `${v} ${illus.unit}`);
  ctx.fillText(lab(illus.length), pad + wPx / 2, pad + hPx + 24);
  ctx.save(); ctx.translate(pad - 24, pad + hPx / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(lab(illus.width), 0, 0); ctx.restore();
  return c;
}

function drawLShape(illus, theme) {
  const { A, B, a, b, unit } = illus;
  const maxDim = 210, scale = maxDim / Math.max(A, B);
  const s = (v) => v * scale, pad = 50;
  const c = makeCanvas(s(A) + pad * 2, s(B) + pad * 2);
  const ctx = c.getContext("2d");
  const X = pad, Y = pad;
  ctx.beginPath();
  ctx.moveTo(X, Y); ctx.lineTo(X + s(A - a), Y); ctx.lineTo(X + s(A - a), Y + s(b)); ctx.lineTo(X + s(A), Y + s(b));
  ctx.lineTo(X + s(A), Y + s(B)); ctx.lineTo(X, Y + s(B)); ctx.closePath();
  ctx.fillStyle = theme.choice_palette[2]; ctx.fill(); ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = theme.text; ctx.font = "bold 12px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  const t = (v) => `${v} ${unit}`;
  ctx.fillText(t(A - a), X + s(A - a) / 2, Y - 8);
  ctx.fillText(t(A), X + s(A) / 2, Y + s(B) + 22);
  ctx.fillText(t(a), X + s(A - a) + s(a) / 2, Y + s(b) - 8);
  ctx.save(); ctx.translate(X - 22, Y + s(B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(t(B), 0, 0); ctx.restore();
  ctx.textAlign = "left";
  ctx.fillText(t(b), X + s(A - a) + 6, Y + s(b) / 2 + 4);
  ctx.fillText(t(B - b), X + s(A) + 8, Y + s(b) + s(B - b) / 2 + 4);
  return c;
}

function drawPolySides(illus, theme) {
  const labels = illus.labels, n = labels.length;
  const W = 300, H = 210, cx = W / 2, cy = H / 2 + 4;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const shapes = {
    3: [[150, 30], [250, 175], [50, 175]],
    4: [[60, 45], [245, 45], [265, 170], [40, 170]],
    5: [[150, 22], [260, 100], [220, 180], [80, 180], [40, 100]],
  };
  const pts = shapes[n] || shapes[4];
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.fillStyle = theme.choice_palette[3]; ctx.fill(); ctx.strokeStyle = theme.text; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = theme.text; ctx.font = "bold 13px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % n];
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    let dx = mx - cx, dy = my - cy; const len = Math.hypot(dx, dy) || 1;
    ctx.fillText(labels[i], mx + (dx / len) * 22, my + (dy / len) * 16);
  }
  return c;
}

function drawBeaker(illus, theme) {
  const { max, step, level, unit } = illus;
  const W = 190, H = 250, x0 = 70, w = 70, top = 20, bot = 220;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const y = (v) => bot - ((bot - top) * v) / max;
  ctx.fillStyle = "#7ec8f0"; ctx.fillRect(x0, y(level), w, bot - y(level));
  ctx.strokeStyle = theme.text; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, top); ctx.lineTo(x0, bot); ctx.lineTo(x0 + w, bot); ctx.lineTo(x0 + w, top); ctx.stroke();
  ctx.lineWidth = 2; ctx.fillStyle = theme.text; ctx.font = "bold 12px 'Segoe UI'"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  for (let v = 0; v <= max; v += step) {
    ctx.beginPath(); ctx.moveTo(x0 + w, y(v)); ctx.lineTo(x0 + w + 12, y(v)); ctx.stroke();
    ctx.fillText(String(v), x0 + w + 18, y(v));
  }
  ctx.textAlign = "right"; ctx.fillText(unit, x0 - 8, top + 4);
  return c;
}

function drawScaledBar(chart, theme) {
  const { categories, values, step, title } = chart;
  const W = 520, H = 260, left = 56, bot = 205, top = 34, right = 14;
  const c = makeCanvas(W, H);
  const ctx = c.getContext("2d");
  const max = Math.ceil(Math.max(...values) / step) * step;
  const y = (v) => bot - ((bot - top) * v) / max;
  ctx.fillStyle = theme.text; ctx.font = "bold 13px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  if (title) ctx.fillText(title.charAt(0).toUpperCase() + title.slice(1), W / 2, 18);
  ctx.font = "11px 'Segoe UI'"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
  for (let v = 0; v <= max; v += step) {
    ctx.strokeStyle = v === 0 ? theme.text : "#cfcfcf"; ctx.lineWidth = v === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(left, y(v)); ctx.lineTo(W - right, y(v)); ctx.stroke();
    ctx.fillStyle = theme.text; ctx.fillText(String(v), left - 8, y(v));
  }
  ctx.strokeStyle = theme.text; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke();
  const slot = (W - left - right) / categories.length, bw = slot * 0.5;
  categories.forEach((cat, i) => {
    const x = left + i * slot + (slot - bw) / 2;
    ctx.fillStyle = theme.choice_palette[i % theme.choice_palette.length]; ctx.fillRect(x, y(values[i]), bw, bot - y(values[i]));
    ctx.strokeStyle = theme.text; ctx.lineWidth = 1.5; ctx.strokeRect(x, y(values[i]), bw, bot - y(values[i]));
    ctx.fillStyle = theme.text; ctx.font = "bold 11px 'Segoe UI'"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(String(cat), x + bw / 2, bot + 20);
  });
  return c;
}

Object.assign(ILLUSTRATION_DRAWERS, {
  number_line: drawNumberLine, fraction_bars: drawFractionBars, emoji_row: drawEmojiRow, area_grid: drawAreaGrid,
  rect_dims: drawRectDims, l_shape: drawLShape, poly_sides: drawPolySides, beaker: drawBeaker,
});
CHART_DRAWERS.scaled_bar = drawScaledBar;

// ---------- registration ----------
const NYS_MATH_TOPICS = {
  "Fraction Number Line": nysNumberLineQ,
  "Equivalent Fractions": nysEquivalentQ,
  "Compare Fractions": nysCompareQ,
  "Fraction Models": nysFractionModelsQ,
  Area: nysAreaQ,
  Perimeter: nysPerimeterQ,
  Time: nysTimeQ,
  "Liquid Volume & Mass": nysVolumeMassQ,
  Graphs: nysGraphsQ,
  "Number Patterns": nysPatternsQ,
  "Two-Step & Estimation": nysTwoStepQ,
  "Equation Match": nysEquationMatchQ,
};
for (const [topic, fn] of Object.entries(NYS_MATH_TOPICS)) {
  MATH_TOPIC_FUNCS[topic] = fn;
  if (!APP_DATA.MATH_TOPICS.includes(topic)) APP_DATA.MATH_TOPICS.push(topic);
  APP_DATA.MATH_TOPIC_MIN_AGE[topic] = 1;
}
