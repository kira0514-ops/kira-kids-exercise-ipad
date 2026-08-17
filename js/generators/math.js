// Port of kids_exercise_app.py's math question generators (Addition through Equations).
// Each function returns {prompt, choices, answer, illustration?} exactly like its Python
// counterpart. Keep this in sync by hand whenever the Python generators change algorithm --
// pure data changes (word banks etc.) instead flow through tools/extract_data.py -> data.js.

// Widened from the original 5 (apple, star, cat, car, balloon) -- with only 5 to choose from,
// Counting Tap's object type repeated constantly even though the count itself was already
// random each time, which read as "the same exercise" rather than a fresh one.
const COUNT_EMOJIS = [
  "\u{1F34E}", "⭐", "\u{1F431}", "\u{1F697}", "\u{1F388}",
  "\u{1F34C}", "\u{1F436}", "\u{1F338}", "\u{1F381}", "\u{1F98B}",
  "\u{1F41F}", "\u{1F36D}", "\u{1F9F8}", "\u{1F30D}", "\u{1F335}",
];
const NAMES = ["Mia", "Liam", "Ava", "Noah", "Zoe", "Ben", "Ivy", "Sam", "Leo", "Nina"];
const ITEMS = ["apples", "stickers", "marbles", "balloons", "cookies", "pencils", "toy cars", "books", "coins", "crayons"];
const ITEM_EMOJI = {
  apples: "\u{1F34E}", stickers: "⭐", marbles: "\u{1F535}", balloons: "\u{1F388}",
  cookies: "\u{1F36A}", pencils: "✏️", "toy cars": "\u{1F697}", books: "\u{1F4DA}",
  coins: "\u{1FA99}", crayons: "\u{1F58D}️",
};
const SHAPE_EMOJI = {
  triangle: "\u{1F53A}", square: "\u{1F7E6}", circle: "⚫",
  star: "⭐", heart: "❤️", diamond: "\u{1F536}",
};
const SHAPE_SIDES = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, octagon: 8 };
const ANGLE_TYPES = [["90", "right"], ["45", "acute"], ["135", "obtuse"]];
const PYTHAGOREAN_TRIPLES = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17],
  [7, 24, 25], [10, 24, 26], [20, 21, 29], [12, 16, 20], [9, 40, 41],
];
// keys are "func|deg" since JS object keys can't be tuples
const SPECIAL_TRIG_VALUES = {
  "sin|30": 0.5, "cos|30": 0.87, "tan|30": 0.58,
  "sin|45": 0.71, "cos|45": 0.71, "tan|45": 1.0,
  "sin|60": 0.87, "cos|60": 0.5, "tan|60": 1.73,
};
const COINS = { penny: 1, nickel: 5, dime: 10, quarter: 25 };

function preschoolCompareFallback() {
  const emoji = choice(COUNT_EMOJIS);
  let a = randInt(1, 6), b = randInt(1, 6);
  while (b === a) b = randInt(1, 6);
  const prompt = `Which has more?\n\nA: ${emoji.repeat(a)}\nB: ${emoji.repeat(b)}`;
  return { prompt, choices: ["A", "B"], answer: a > b ? "A" : "B" };
}

function getAddOperands(ageIdx, diffIdx) {
  if (ageIdx === 0) {
    const maxtotal = [8, 12, 20][diffIdx];
    const a = randInt(1, Math.max(1, Math.floor(maxtotal / 2)));
    const b = randInt(1, Math.max(1, maxtotal - a));
    return [a, b];
  }
  if (ageIdx === 1) {
    const maxsum = [20, 100, 999][diffIdx];
    const a = randInt(0, maxsum);
    const b = randInt(0, maxsum - a);
    return [a, b];
  }
  const ranges = [[50, 300], [100, 999], [1000, 9999], [10000, 99999]];
  const [lo, hi] = ranges[diffIdx];
  return [randInt(lo, hi), randInt(lo, hi)];
}

function getSubOperands(ageIdx, diffIdx) {
  let [a, b] = getAddOperands(ageIdx, diffIdx);
  if (b > a) [a, b] = [b, a];
  return [a, b];
}

function getMulOperands(ageIdx, diffIdx) {
  if (ageIdx === 2 && diffIdx >= 2) {
    const [bigLo, bigHi] = diffIdx === 2 ? [10, 99] : [100, 999];
    const [smallLo, smallHi] = diffIdx === 2 ? [2, 9] : [2, 12];
    return [randInt(bigLo, bigHi), randInt(smallLo, smallHi)];
  }
  const ranges = {
    0: [[1, 3], [1, 5], [1, 7]],
    1: [[2, 7], [2, 9], [2, 12]],
    2: [[2, 9], [2, 12]],
  };
  const [lo, hi] = ranges[ageIdx][diffIdx];
  return [randInt(lo, hi), randInt(lo, hi)];
}

function getDivOperands(ageIdx, diffIdx) {
  if (ageIdx === 2 && diffIdx >= 2) {
    const b = diffIdx === 2 ? randInt(2, 9) : randInt(2, 12);
    const answer = randInt(10, 99);
    return [b * answer, b, answer];
  }
  const [b, answer] = getMulOperands(ageIdx, diffIdx);
  return [b * answer, b, answer];
}

function additionQ(ageIdx, diffIdx) {
  const [a, b] = getAddOperands(ageIdx, diffIdx);
  const answer = a + b;
  let prompt;
  if (ageIdx === 0) {
    const emoji = choice(COUNT_EMOJIS);
    prompt = `${emoji.repeat(a)} + ${emoji.repeat(b)} = ?`;
  } else {
    prompt = `${a} + ${b} = ?`;
  }
  const choices = numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 5);
  const result = { prompt, choices, answer };
  if (ageIdx > 0 && a <= 20 && b <= 20) result.illustration = { type: "dots_add", a, b };
  return result;
}

function make10AdditionQ(ageIdx, diffIdx) {
  // "Make 10" strategy: pick an addend close to ten, borrow just enough from the other
  // addend to complete it, then add whatever's left over -- mirrors the classic
  // decompose-to-make-ten worksheet method instead of counting on from either number.
  // Renders as the interactive decompose-boxes exercise (see buildMakeTenInteractive in
  // minigames.js), not multiple choice -- `choices` stays only as a fallback for older
  // call sites (e.g. lesson "Try it yourself" snippets) that expect it.
  const biggerPool = diffIdx === 0 ? [8, 9] : [7, 8, 9];
  const a = choice(biggerPool);
  const neededForA = 10 - a;
  const b = randInt(neededForA + 1, 9); // guarantees a + b > 10 regardless of which ends up the anchor
  // Whichever of the two is actually closer to 10 stays whole -- not necessarily `a`, since
  // `b` can land closer (e.g. a=8, b=9 should keep the 9 and split the 8, not the reverse).
  const bigger = (10 - a) <= (10 - b) ? a : b;
  const smaller = bigger === a ? b : a;
  const neededToTen = 10 - bigger;
  const leftover = smaller - neededToTen;
  const sum = a + b;
  // Which addend is closer to 10 (and so gets decomposed) shouldn't always be shown second --
  // e.g. "3 + 9" should still be about splitting the 3, same as "9 + 3" would be.
  const anchorFirst = Math.random() < 0.5;
  const first = anchorFirst ? bigger : smaller;
  const second = anchorFirst ? smaller : bigger;
  const prompt = `${first} + ${second} = ?`;
  const choices = numericChoices(sum, 0, 20);
  return {
    prompt, choices, answer: sum,
    illustration: { type: "make_ten", bigger, smaller },
    interactive: "make_ten", bigger, smaller, needed: neededToTen, leftover, sum, first, second,
  };
}

// These three wrap the standalone Mini Game generators/renderers (minigames.js) so the exact
// same interactive column-arithmetic exercise (drag-to-pick digit boxes, carry/borrow
// indicators) shows up in regular quizzes and the 365-Day Curriculum too, not just the Mini
// Games hub. Safe to call minigames.js functions here even though that script loads after
// this one -- these generators only ever run later, at quiz-build time, by which point every
// script has already loaded. `choices` stays only as a fallback for older call sites (e.g.
// lesson "Try it yourself" snippets) that expect plain multiple choice.
// Each operand's digit count, scaled by age/difficulty -- shared by all 3 vertical-arithmetic
// operations, which now follow the same single x single -> multi x single -> multi x multi ->
// bigger multi x multi progression (the way multiplication is traditionally taught: single-digit
// facts first, then a multi-digit number times a single digit, then genuine long multiplication
// with partial products). Replaces the old scheme where both operands always grew in lockstep
// by the same amount (Early Elementary's table was [2, 2, 3] -- Easy and Medium were both
// 2-digit + 2-digit, i.e. identical difficulty) and never reached a multi-digit second operand
// at all, so long multiplication never actually came up regardless of difficulty.
const V_ARITH_TIERS = {
  1: [{ a: 1, b: 1 }, { a: 2, b: 1 }, { a: 2, b: 2 }, { a: 3, b: 2 }],
  2: [{ a: 1, b: 1 }, { a: 3, b: 1 }, { a: 3, b: 2 }, { a: 4, b: 3 }],
};
function vArithTier(ageIdx, diffIdx) {
  const tiers = V_ARITH_TIERS[ageIdx] || V_ARITH_TIERS[1];
  return tiers[Math.min(diffIdx, tiers.length - 1)];
}

function verticalAdditionQ(ageIdx, diffIdx) {
  const { a: da, b: db } = vArithTier(ageIdx, diffIdx);
  const p = verticalAdditionProblem(da, db);
  const answer = p.a + p.b;
  return {
    prompt: `${p.a} + ${p.b} = ?`, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 5), answer,
    interactive: "vertical_column", sign: "+", ...p,
  };
}

// Preschool-appropriate version: single-digit + single-digit (still real column addition --
// just one answer box normally, a second only when the sum reaches 10+), always, regardless
// of age/difficulty passed in. Deliberately its own topic rather than a branch inside
// verticalAdditionQ keyed on ageIdx=== 0: resolveExtreme() rewrites (Preschool, Extreme) to
// (Early Elementary, Hard) *before* any topic generator runs, so by the time this function
// would see ageIdx it can no longer tell "Preschool bumped up" apart from "genuinely Early
// Elementary" -- the two look identical. Keying on the topic itself sidesteps that entirely.
function verticalAdditionSingleDigitQ(ageIdx, diffIdx) {
  const p = verticalAdditionProblem(1);
  const answer = p.a + p.b;
  return {
    prompt: `${p.a} + ${p.b} = ?`, choices: numericChoices(answer, 0, 20), answer,
    interactive: "vertical_column", sign: "+", ...p,
  };
}

function verticalSubtractionQ(ageIdx, diffIdx) {
  const { a: da, b: db } = vArithTier(ageIdx, diffIdx);
  const p = verticalSubtractionProblem(da, db);
  const answer = p.a - p.b;
  return {
    prompt: `${p.a} - ${p.b} = ?`, choices: numericChoices(answer, 0, p.a), answer,
    interactive: "vertical_subtract", ...p,
  };
}

function verticalMultiplicationQ(ageIdx, diffIdx) {
  const { a: da, b: db } = vArithTier(ageIdx, diffIdx);
  // b >= 2 digits (Hard/Extreme) needs the full partial-products long-multiplication engine --
  // a single scalar multiplier can't represent multiplying by a genuinely multi-digit number.
  if (db >= 2) {
    const p = longMultiplicationProblem(da, db);
    const answer = p.answer;
    return {
      prompt: `${p.a} × ${p.b} = ?`, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 5), answer,
      interactive: "long_multiply", ...p,
    };
  }
  const p = verticalMultiplicationProblem(da, 9);
  const answer = p.a * p.b;
  return {
    prompt: `${p.a} × ${p.b} = ?`, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 5), answer,
    interactive: "vertical_column", sign: "×", ...p,
  };
}

function subtractionQ(ageIdx, diffIdx) {
  const [a, b] = getSubOperands(ageIdx, diffIdx);
  const answer = a - b;
  const prompt = `${a} - ${b} = ?`;
  const choices = numericChoices(answer, 0, Math.max(15, a) + 5);
  const result = { prompt, choices, answer };
  if (a <= 20) result.illustration = { type: "dots_sub", a, b };
  return result;
}

function multiplicationQ(ageIdx, diffIdx) {
  const [a, b] = getMulOperands(ageIdx, diffIdx);
  const answer = a * b;
  const prompt = `${a} × ${b} = ?`;
  const choices = numericChoices(answer, 0, answer + 20);
  const result = { prompt, choices, answer };
  if (a <= 12 && b <= 12) result.illustration = { type: "array", a, b };
  return result;
}

function divisionQ(ageIdx, diffIdx) {
  const [a, b, answer] = getDivOperands(ageIdx, diffIdx);
  const prompt = `${a} ÷ ${b} = ?`;
  const choices = numericChoices(answer, 0, Math.max(20, answer + 10));
  const result = { prompt, choices, answer };
  if (a <= 40 && b <= 10) result.illustration = { type: "grouping", total: a, groups: b };
  return result;
}

function fractionsQ(ageIdx, diffIdx) {
  if (ageIdx === 0) return preschoolCompareFallback();

  if (diffIdx === 3) {
    const d1 = choice([2, 3, 4, 5, 6]), d2 = choice([2, 3, 4, 5, 6]);
    const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
    const denom = d1 * d2;
    const answer = fractionToString(n1 * n2, denom);
    const prompt = `${n1}/${d1} × ${n2}/${d2} = ?`;
    const pool = []; for (let k = 1; k < denom; k++) pool.push(fractionToString(k, denom));
    return { prompt, choices: makeChoices(answer, pool), answer,
      illustration: { type: "fraction_pies", fractions: [[n1, d1], [n2, d2]] } };
  }

  if (diffIdx === 0) {
    const denom = choice([3, 4, 5]);
    let n1 = randInt(1, denom - 1), n2 = randInt(1, denom - 1);
    while (n1 === n2) n2 = randInt(1, denom - 1);
    const answer = `${Math.max(n1, n2)}/${denom}`;
    const prompt = `Which is bigger: ${n1}/${denom} or ${n2}/${denom}?`;
    return { prompt, choices: [`${n1}/${denom}`, `${n2}/${denom}`], answer,
      illustration: { type: "fraction_pies", fractions: [[n1, denom], [n2, denom]] } };
  }

  if (diffIdx === 1 || ageIdx === 1) {
    const denom = choice([4, 5, 6, 8, 10]);
    const op = choice(["+", "-"]);
    let n1, n2, answerVal;
    if (op === "+") {
      n1 = randInt(1, denom - 1);
      n2 = randInt(1, denom - n1);
      answerVal = n1 + n2;
    } else {
      n1 = randInt(1, denom - 1);
      n2 = randInt(0, n1);
      answerVal = n1 - n2;
    }
    const answer = `${answerVal}/${denom}`;
    const prompt = `${n1}/${denom} ${op} ${n2}/${denom} = ?`;
    const pool = []; for (let k = 0; k <= denom; k++) pool.push(`${k}/${denom}`);
    return { prompt, choices: makeChoices(answer, pool), answer,
      illustration: { type: "fraction_pies", fractions: [[n1, denom], [n2, denom]] } };
  }

  const pairs = [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8], [3, 9]];
  const [d1, d2] = choice(pairs);
  const n1 = randInt(1, d1 - 1), n2 = randInt(1, d2 - 1);
  const totalNum = n1 * Math.floor(d2 / d1) + n2;
  const answer = fractionToString(totalNum, d2);
  const prompt = `${n1}/${d1} + ${n2}/${d2} = ?`;
  const pool = []; for (let k = 1; k < 2 * d2; k++) pool.push(fractionToString(k, d2));
  return { prompt, choices: makeChoices(answer, pool), answer,
    illustration: { type: "fraction_pies", fractions: [[n1, d1], [n2, d2]] } };
}

const ADD_TEMPLATES = [
  "{name} has {a} {item}. {name} finds {b} more {item}. How many {item} does {name} have now?",
  "There are {a} {item} in a basket. Someone adds {b} more. How many {item} are in the basket now?",
  "{name} collected {a} {item} on Monday and {b} more {item} on Tuesday. How many {item} did {name} collect in total?",
  "Because {name} loves {item}, {name} started with {a} of them and then earned {b} more as a reward. How many {item} does {name} have now?",
  "\"I already have {a} {item},\" said {name}, \"and I just found {b} more!\" How many {item} does {name} have now?",
  "{name}, who keeps a careful count of every {item}, had {a} of them before a friend gave {name} {b} additional {item}. How many {item} does {name} have in total?",
  "After picking up {a} {item} at the store, {name} received {b} more {item} as a gift. How many {item} does {name} have altogether?",
  "A shelf holds {a} {item}. Once {b} more {item} are placed on the shelf, how many {item} are there in total?",
  "{name} started the day with {a} {item}, and by the time the sun set, {name} had gathered {b} more. How many {item} does {name} have now?",
  "First {name} had {a} {item}; then, without counting twice, {name} added {b} more {item} to the pile. How many {item} are in the pile now?",
];
const SUB_TEMPLATES = [
  "{name} has {a} {item}. {name} gives away {b} {item}. How many {item} does {name} have left?",
  "There are {a} {item} on the table. {b} {item} are removed. How many {item} are left?",
  "{name} had {a} {item} and lost {b} of them at the park. How many {item} does {name} have left?",
  "Even though {name} started with {a} {item}, {name} ended up giving {b} of them to a neighbor. How many {item} does {name} have left?",
  "\"I had {a} {item} this morning,\" {name} explained, \"but {b} of them went missing.\" How many {item} does {name} have left?",
  "Out of the {a} {item} that {name} once owned, {b} were donated to a school. How many {item} does {name} have left?",
  "Before the trip, {name} packed {a} {item}; along the way, {b} of them were left behind. How many {item} does {name} still have?",
  "A box that once held {a} {item} now has {b} fewer, since {name} handed them out. How many {item} remain in the box?",
  "{name}, who had been saving up {a} {item}, decided to spend {b} of them on a gift. How many {item} does {name} have left?",
  "Of the {a} {item} {name} started with, {b} were used up by lunchtime. How many {item} are left?",
];
const MUL_TEMPLATES = [
  "There are {a} bags with {b} {item} in each. How many {item} are there in total?",
  "{name} buys {a} boxes of {item}, with {b} {item} in each box. How many {item} does {name} buy in total?",
  "Because each of the {a} shelves holds exactly {b} {item}, how many {item} are there altogether?",
  "\"Every basket has {b} {item},\" said {name}, \"and I have {a} baskets.\" How many {item} does {name} have in total?",
  "{name}, who arranges {item} in neat rows, made {a} rows of {b} {item} each. How many {item} did {name} arrange in total?",
  "If {a} friends each bring {b} {item} to the party, how many {item} will there be in total?",
  "A crate is packed with {a} layers, and each layer holds {b} {item}. How many {item} are in the crate?",
];
const DIV_TEMPLATES = [
  "{name} has {a} {item} and wants to share them equally among {b} friends. How many {item} does each friend get?",
  "There are {a} {item} packed equally into {b} boxes. How many {item} are in each box?",
  "Since {name} wants every one of the {b} tables to look the same, {name} spreads {a} {item} evenly across them. How many {item} end up on each table?",
  "\"I need to split these {a} {item} evenly among {b} bags,\" said {name}. How many {item} go in each bag?",
  "{name}, who never leaves anyone out, divided {a} {item} equally among {b} classmates. How many {item} did each classmate receive?",
  "After sorting {a} {item} into {b} equal groups, how many {item} are in each group?",
];
const TWO_STEP_ADD_SUB_TEMPLATES = [
  "{name} has {a} {item}. {name} buys {b} more {item}, then gives {c} {item} to a friend. How many {item} does {name} have now?",
  "There are {a} {item} in a jar. {b} more {item} are added, then {c} {item} are taken out. How many {item} are left in the jar?",
  "Because {name} started with only {a} {item}, {name} bought {b} more at the store; later that day, {c} of them were given away. How many {item} does {name} have now?",
  "\"I had {a} {item},\" {name} recalled, \"then I found {b} more, but {c} of them broke.\" How many {item} does {name} have now?",
  "First {a} {item} sat on the shelf; after {b} more were stacked on top, {c} were taken down for a project. How many {item} remain on the shelf?",
];
const TWO_STEP_MUL_ADD_TEMPLATES = [
  "There are {a} bags with {b} {item} in each. {name} then finds {c} more {item}. How many {item} are there in total?",
  "{name} buys {a} boxes of {item}, {b} {item} per box, and gets {c} extra {item} for free. How many {item} does {name} have in total?",
  "Since each of the {a} shelves holds {b} {item}, and {name} later adds {c} more {item} on top, how many {item} are there now?",
  "\"Every crate has {b} {item}, and I have {a} crates,\" said {name}, \"plus {c} loose ones I found.\" How many {item} does {name} have in total?",
];
const TWO_STEP_MUL_SUB_TEMPLATES = [
  "{name} has {a} bags with {b} {item} in each, but {c} {item} get lost along the way. How many {item} does {name} have left?",
  "Although each of the {a} boxes was packed with {b} {item}, {c} of them were damaged during the move. How many {item} are still usable?",
  "{name} arranged {a} rows of {b} {item}, then accidentally knocked over {c} of them. How many {item} are still standing?",
];

function fmt(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
}

function twoStepWordProblem(ageIdx, diffIdx, name, itemDisplay) {
  const kind = choice(["add_sub", "mul_add", "mul_sub"]);
  let a, b, c, answer, template;
  if (kind === "add_sub") {
    [a, b] = getAddOperands(ageIdx, diffIdx);
    const total = a + b;
    c = total >= 1 ? randInt(1, total) : 0;
    answer = total - c;
    template = choice(TWO_STEP_ADD_SUB_TEMPLATES);
  } else if (kind === "mul_add") {
    [a, b] = getMulOperands(ageIdx, diffIdx);
    c = randInt(1, 15);
    answer = a * b + c;
    template = choice(TWO_STEP_MUL_ADD_TEMPLATES);
  } else {
    [a, b] = getMulOperands(ageIdx, diffIdx);
    const product = a * b;
    c = product >= 1 ? randInt(1, product) : 0;
    answer = product - c;
    template = choice(TWO_STEP_MUL_SUB_TEMPLATES);
  }
  const prompt = fmt(template, { name, item: itemDisplay, a, b, c });
  const choices = numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 10);
  return { prompt, choices, answer };
}

function wordProblemQ(ageIdx, diffIdx) {
  const name = choice(NAMES);
  const item = choice(ITEMS);
  const itemDisplay = `${ITEM_EMOJI[item] || ""} ${item}`.trim();

  if (diffIdx >= 2 && ageIdx >= 1) {
    const chance = diffIdx === 2 ? 0.5 : 0.75;
    if (Math.random() < chance) return twoStepWordProblem(ageIdx, diffIdx, name, itemDisplay);
  }

  const op = choice(["+", "-", "×", "÷"]);
  let a, b, answer, template;
  if (op === "+") {
    [a, b] = getAddOperands(ageIdx, diffIdx); answer = a + b; template = choice(ADD_TEMPLATES);
  } else if (op === "-") {
    [a, b] = getSubOperands(ageIdx, diffIdx); answer = a - b; template = choice(SUB_TEMPLATES);
  } else if (op === "×") {
    [a, b] = getMulOperands(ageIdx, diffIdx); answer = a * b; template = choice(MUL_TEMPLATES);
  } else {
    [a, b, answer] = getDivOperands(ageIdx, diffIdx); template = choice(DIV_TEMPLATES);
  }
  const prompt = fmt(template, { name, item: itemDisplay, a, b });
  const choices = numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 5);
  return { prompt, choices, answer };
}

function placeValueQ(ageIdx, diffIdx) {
  if (ageIdx === 0) {
    const nums = sample(Array.from({ length: 10 }, (_, i) => i + 1), 2);
    const [a, b] = nums;
    return { prompt: `Which number is bigger: ${a} or ${b}?`, choices: [a, b], answer: Math.max(a, b) };
  }
  const digitCounts = { 1: [2, 3, 4], 2: [4, 5, 7, 9] }[ageIdx];
  const ndigits = digitCounts[diffIdx];
  const num = randInt(10 ** (ndigits - 1), 10 ** ndigits - 1);
  const placeNames = ["ones", "tens", "hundreds", "thousands", "ten-thousands", "hundred-thousands",
    "millions", "ten-millions", "hundred-millions"];
  const pos = randInt(0, ndigits - 1);
  const digit = Math.floor(num / 10 ** pos) % 10;
  const prompt = `What digit is in the ${placeNames[pos]} place of ${num}?`;
  const choices = makeChoices(digit, Array.from({ length: 10 }, (_, i) => i));
  return { prompt, choices, answer: digit,
    illustration: { type: "place_value_digits", num, highlight_pos: pos } };
}

function decimalsQ(ageIdx, diffIdx) {
  if (ageIdx === 0) return preschoolCompareFallback();

  if (diffIdx === 3) {
    const d1 = round1(randFloat(0.2, 12.0)), d2 = round1(randFloat(0.2, 12.0));
    const answer = round1(d1 * d2);
    return { prompt: `${d1} × ${d2} = ?`, choices: decimalChoices(answer), answer,
      illustration: { type: "decimal_bars", values: [d1, d2] } };
  }

  if (ageIdx === 1 && diffIdx === 2) {
    let d1 = round1(randFloat(0.1, 9.9)), d2 = round1(randFloat(0.1, 9.9));
    const op = choice(["+", "-"]);
    if (op === "-" && d2 > d1) [d1, d2] = [d2, d1];
    const answer = op === "+" ? round1(d1 + d2) : round1(d1 - d2);
    return { prompt: `${d1} ${op} ${d2} = ?`, choices: decimalChoices(answer), answer,
      illustration: { type: "decimal_bars", values: [d1, d2] } };
  }

  if (diffIdx === 0 || ageIdx === 1) {
    let d1 = round1(randFloat(0.1, 9.9)), d2 = round1(randFloat(0.1, 9.9));
    while (d1 === d2) d2 = round1(randFloat(0.1, 9.9));
    const answer = Math.max(d1, d2);
    return { prompt: `Which is bigger: ${d1} or ${d2}?`, choices: [d1, d2], answer,
      illustration: { type: "decimal_bars", values: [d1, d2] } };
  }

  if (ageIdx === 2 && diffIdx === 2) {
    let dividend, divisor, quotient;
    if (Math.random() < 0.5) {
      quotient = round1(randFloat(1.0, 9.9));
      divisor = randInt(2, 9);
      dividend = round1(quotient * divisor);
    } else {
      quotient = randInt(2, 20);
      divisor = round1(randFloat(0.2, 0.9));
      dividend = round1(quotient * divisor);
    }
    const answer = quotient;
    return { prompt: `${dividend} ÷ ${divisor} = ?`, choices: decimalChoices(answer), answer,
      illustration: { type: "decimal_bars", values: [dividend, divisor] } };
  }

  let d1 = round1(randFloat(0.1, 20.0)), d2 = round1(randFloat(0.1, 20.0));
  const op = choice(["+", "-"]);
  if (op === "-" && d2 > d1) [d1, d2] = [d2, d1];
  const answer = op === "+" ? round1(d1 + d2) : round1(d1 - d2);
  return { prompt: `${d1} ${op} ${d2} = ?`, choices: decimalChoices(answer), answer,
    illustration: { type: "decimal_bars", values: [d1, d2] } };
}

function percentagesQ(ageIdx, diffIdx) {
  if (ageIdx === 0) return preschoolCompareFallback();

  if (diffIdx === 3) {
    const pct = choice([10, 20, 25, 50, 75]);
    let base, part;
    if (pct === 75) {
      const k = randInt(1, 10); base = 4 * k; part = 3 * k;
    } else {
      const mult = { 10: 10, 20: 5, 25: 4, 50: 2 }[pct];
      part = randInt(1, 20); base = part * mult;
    }
    const prompt = `${part} is what percent of ${base}?`;
    return { prompt, choices: numericChoices(pct, 0, 100), answer: pct,
      illustration: { type: "percent_bar", part, whole: base } };
  }

  const pctPool = { 0: [10, 50], 1: [10, 20, 25, 50], 2: [10, 20, 25, 50, 75] }[diffIdx];
  const pct = choice(pctPool);
  let base, answer;
  if (pct === 75) {
    const k = randInt(1, 10); base = 4 * k; answer = 3 * k;
  } else {
    const mult = { 10: 10, 20: 5, 25: 4, 50: 2 }[pct];
    answer = randInt(1, 20); base = answer * mult;
  }
  const prompt = `What is ${pct}% of ${base}?`;
  return { prompt, choices: numericChoices(answer, 0, answer + 20), answer,
    illustration: { type: "percent_grid", pct } };
}

function geometryQ(ageIdx, diffIdx) {
  if (ageIdx === 0) {
    const entries = Object.entries(SHAPE_EMOJI);
    const [name, emoji] = choice(entries);
    const prompt = `What shape is this?\n\n${emoji}`;
    return { prompt, choices: makeChoices(name, entries.map((e) => e[0])), answer: name };
  }

  if (ageIdx === 1 || diffIdx === 0) {
    const entries = Object.entries(SHAPE_SIDES);
    const [name, sides] = choice(entries);
    const prompt = `How many sides does a ${name} have?`;
    return { prompt, choices: numericChoices(sides, 3, 10), answer: sides,
      illustration: { type: "polygon_shape", sides } };
  }

  if (diffIdx === 3) {
    const kind = choice(["triangle_area", "big_rect", "circle"]);
    if (kind === "triangle_area") {
      const base = randInt(4, 20);
      const height = randInt(2, 10) * 2;
      const answer = Math.floor(base * height / 2);
      return { prompt: `A triangle has a base of ${base} in and a height of ${height} in. What is its area (in square inches)?`,
        choices: numericChoices(answer, 0, answer + 30), answer,
        illustration: { type: "triangle", base, height } };
    } else if (kind === "big_rect") {
      const length = randInt(15, 40), width = randInt(15, 40);
      const answer = length * width;
      return { prompt: `A rectangle is ${length} in by ${width} in. What is its area (in square inches)?`,
        choices: numericChoices(answer, 0, answer + 150), answer,
        illustration: { type: "rectangle", length, width } };
    } else {
      const radius = randInt(3, 20);
      let prompt, answer;
      if (Math.random() < 0.5) {
        answer = round1(2 * 3.14 * radius);
        prompt = `A circle has a radius of ${radius} in. Using π ≈ 3.14, what is its circumference (in inches)?`;
      } else {
        answer = round1(3.14 * radius * radius);
        prompt = `A circle has a radius of ${radius} in. Using π ≈ 3.14, what is its area (in square inches)?`;
      }
      return { prompt, choices: decimalChoices(answer), answer,
        illustration: { type: "circle_measure", radius } };
    }
  }

  if (diffIdx === 2 && Math.random() < 0.35) {
    const [deg, answer] = choice(ANGLE_TYPES);
    const prompt = `A ${deg}° angle is called a(n) ___ angle.`;
    return { prompt, choices: makeChoices(answer, ["right", "acute", "obtuse", "straight"]), answer,
      illustration: { type: "angle", degrees: parseInt(deg, 10) } };
  }

  const length = randInt(5, 50), width = randInt(5, 50);
  if (choice(["area", "perimeter"]) === "area") {
    const answer = length * width;
    return { prompt: `A rectangle is ${length} in by ${width} in. What is its area (in square inches)?`,
      choices: numericChoices(answer, 0, answer + 30), answer,
      illustration: { type: "rectangle", length, width } };
  }
  const answer = 2 * (length + width);
  return { prompt: `A rectangle is ${length} in by ${width} in. What is its perimeter (in inches)?`,
    choices: numericChoices(answer, 0, answer + 30), answer,
    illustration: { type: "rectangle", length, width } };
}

function pythagoreanQ(scaleUp = false) {
  let [a, b, c] = choice(PYTHAGOREAN_TRIPLES);
  if (scaleUp) {
    const k = randInt(2, 3);
    a *= k; b *= k; c *= k;
  }
  let prompt, answer;
  if (Math.random() < 0.6) {
    prompt = `A right triangle has legs of ${a} in and ${b} in. What is the length of its hypotenuse (in inches)?`;
    answer = c;
  } else {
    prompt = `A right triangle has a hypotenuse of ${c} in and one leg of ${a} in. What is the length of the other leg (in inches)?`;
    answer = b;
  }
  return { prompt, choices: numericChoices(answer, 1, answer + 30), answer,
    illustration: { type: "triangle", base: a, height: b } };
}

function trigRatioQ(asDecimal) {
  const [adjacent, opposite, hyp] = choice(PYTHAGOREAN_TRIPLES);
  const func = choice(["sin", "cos", "tan"]);
  let num, den;
  if (func === "sin") { num = opposite; den = hyp; }
  else if (func === "cos") { num = adjacent; den = hyp; }
  else { num = opposite; den = adjacent; }
  let prompt = `In this right triangle, theta is marked at the bottom-right corner. What is ${func}(theta)?`;
  let choices, answer;
  if (asDecimal) {
    answer = round2(num / den);
    const set = new Set([answer]);
    let tries = 0;
    const deltas = [-0.2, -0.1, -0.05, 0.05, 0.1, 0.2];
    while (set.size < 4 && tries < 100) {
      tries++;
      const cand = round2(answer + choice(deltas));
      // tan(theta) can exceed 2.0 for some PYTHAGOREAN_TRIPLES (e.g. 40/9 ≈ 4.44 for the
      // 9-40-41 triple) -- cap at 5.0, not 2.0, so those cases still fill out 4 choices.
      if (cand >= 0 && cand <= 5.0) set.add(cand);
    }
    choices = shuffle(Array.from(set));
    prompt += " (as a decimal, rounded to 2 places)";
  } else {
    const g = gcd(num, den);
    const n = num / g, d = den / g;
    answer = `${n}/${d}`;
    const pool = [];
    for (let k = 1; k < 2 * d; k++) if (k !== n) pool.push(`${k}/${d}`);
    for (let k = 1; k < 2 * d; k++) if (k !== d) pool.push(`${n}/${k}`);
    choices = makeChoices(answer, pool);
    prompt += " (as a fraction)";
  }
  return { prompt, choices, answer,
    illustration: { type: "right_triangle_trig", adjacent, opposite, hypotenuse: hyp } };
}

function trigonometryQ(ageIdx, diffIdx) {
  if (ageIdx === 1) {
    if (diffIdx === 0 || diffIdx === 1) {
      const letters = sample(["A", "B", "C", "D", "E", "F"], 3);
      const [rightLabel, bLabel, cLabel] = letters;
      const illustration = { type: "right_triangle_labeled", right: rightLabel, b: bLabel, c: cLabel };
      if (diffIdx === 0) {
        const prompt = "Look at the triangle. Which corner has the right angle (the square mark)?";
        return { prompt, choices: makeChoices(rightLabel, letters), answer: rightLabel, illustration };
      }
      const prompt = "Look at the triangle. Which side is the hypotenuse (the side across from the right angle)?";
      const hypAnswer = `Side ${bLabel}${cLabel}`;
      const otherChoices = [`Side ${rightLabel}${bLabel}`, `Side ${rightLabel}${cLabel}`, hypAnswer];
      return { prompt, choices: otherChoices, answer: hypAnswer, illustration };
    }
    return pythagoreanQ(false);
  }

  if (diffIdx === 0) return pythagoreanQ(choice([true, false]));
  if (diffIdx === 1) return trigRatioQ(false);
  if (diffIdx === 2) return trigRatioQ(true);

  const entries = Object.entries(SPECIAL_TRIG_VALUES);
  const [key, answer] = choice(entries);
  const [func, deg] = key.split("|");
  const prompt = `What is ${func}(${deg}°)?`;
  return { prompt, choices: makeChoices(answer, entries.map((e) => e[1])), answer };
}

function measurementQ(ageIdx, diffIdx) {
  const kind = choice(["money", "time"]);
  if (kind === "money") {
    const nTypes = ageIdx === 0 ? 2 : [2, 2, 3, 4][diffIdx];
    const maxCount = diffIdx === 3 ? 4 : 3;
    const coinTypes = sample(Object.keys(COINS), nTypes);
    const counts = {};
    for (const c of coinTypes) counts[c] = randInt(1, maxCount);
    let total = 0;
    for (const c of coinTypes) total += COINS[c] * counts[c];
    const parts = coinTypes.map((c) => `${counts[c]} ${c}${counts[c] > 1 ? "s" : ""}`);
    const prompt = "How many cents is " + parts.join(" + ") + "?";
    return { prompt, choices: numericChoices(total, 0, total + 50), answer: total,
      illustration: { type: "coins", counts } };
  }

  const startH = randInt(1, 12);
  const startM = ageIdx > 0 ? choice([0, 15, 30, 45]) : 0;
  const addH = randInt(1, [2, 4, 6, 10][diffIdx]);
  const addM = diffIdx === 3 ? choice([0, 15, 30, 45]) : 0;
  const totalMinutes = startH * 60 + startM + addH * 60 + addM;
  let endH = Math.floor(totalMinutes / 60) % 12;
  endH = endH === 0 ? 12 : endH;
  const endM = totalMinutes % 60;
  const hourWord = addH === 1 ? "hour" : "hours";
  const prompt = addM
    ? `It is ${startH}:${String(startM).padStart(2, "0")}. What time will it be in ${addH} ${hourWord} and ${addM} minutes?`
    : `It is ${startH}:${String(startM).padStart(2, "0")}. What time will it be in ${addH} ${hourWord}?`;
  const answer = `${endH}:${String(endM).padStart(2, "0")}`;
  const set = new Set([answer]);
  while (set.size < 4) {
    const dh = ((endH + choice([-2, -1, 1, 2]) - 1 + 1200) % 12) + 1;
    set.add(`${dh}:${String(endM).padStart(2, "0")}`);
  }
  return { prompt, choices: shuffle(Array.from(set)), answer,
    illustration: { type: "clock", hour: startH, minute: startM } };
}

function missingNumberQ(ageIdx, diffIdx) {
  const op = choice(["+", "-", "×"]);
  let a, b, total, symbol;
  if (op === "+") { [a, b] = getAddOperands(ageIdx, diffIdx); total = a + b; symbol = "+"; }
  else if (op === "-") { [a, b] = getSubOperands(ageIdx, diffIdx); total = a - b; symbol = "-"; }
  else { [a, b] = getMulOperands(ageIdx, diffIdx); total = a * b; symbol = "×"; }

  let prompt, answer;
  if (choice([true, false])) { prompt = `? ${symbol} ${b} = ${total}`; answer = a; }
  else { prompt = `${a} ${symbol} ? = ${total}`; answer = b; }
  return { prompt, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 10), answer };
}

function mixedOperationsQ(ageIdx, diffIdx) {
  if (diffIdx >= 2 && Math.random() < 0.5) {
    const [a, b] = getMulOperands(ageIdx, diffIdx);
    const [dividend, divisor, quotient] = getDivOperands(ageIdx, diffIdx);
    const product = a * b;
    let prompt, answer;
    if (choice([true, false]) && product >= quotient) {
      answer = product - quotient;
      prompt = `(${a} × ${b}) - (${dividend} ÷ ${divisor}) = ?`;
    } else {
      answer = product + quotient;
      prompt = `(${a} × ${b}) + (${dividend} ÷ ${divisor}) = ?`;
    }
    return { prompt, choices: numericChoices(answer, 0, answer + Math.max(15, Math.floor(answer / 2)) + 10), answer };
  }

  const kind = choice(["add_mul", "sub_mul", "add_div", "sub_div"]);
  let a, b, c, answer, prompt;
  if (kind === "add_mul") {
    [b, c] = getMulOperands(ageIdx, diffIdx);
    a = getAddOperands(ageIdx, diffIdx)[0];
    answer = a + b * c;
    prompt = `${a} + ${b} × ${c} = ?`;
  } else if (kind === "sub_mul") {
    [b, c] = getMulOperands(ageIdx, diffIdx);
    const product = b * c;
    a = product + getAddOperands(ageIdx, diffIdx)[0];
    answer = a - product;
    prompt = `${a} - ${b} × ${c} = ?`;
  } else if (kind === "add_div") {
    const [dividend, divisor, quotient] = getDivOperands(ageIdx, diffIdx);
    a = getAddOperands(ageIdx, diffIdx)[0];
    answer = a + quotient;
    prompt = `${a} + ${dividend} ÷ ${divisor} = ?`;
  } else {
    const [dividend, divisor, quotient] = getDivOperands(ageIdx, diffIdx);
    a = quotient + getAddOperands(ageIdx, diffIdx)[0];
    answer = a - quotient;
    prompt = `${a} - ${dividend} ÷ ${divisor} = ?`;
  }
  return { prompt, choices: numericChoices(answer, 0, answer + Math.max(15, Math.floor(answer / 2)) + 10), answer };
}

const ADD_EQ_TEMPLATES = [
  "{name} had some {item}. Then {name} found {b} more {item_b}, ending up with {c} {item_c} in total. Let x be how many {item} {name} started with. Solve: x + {b} = {c}",
  "A jar had some {item} in it. After {b} more {item_b} {was_were_b} added, the jar had {c} {item_c}. If x is the number of {item} that were in the jar at first, solve: x + {b} = {c}",
  "{name} was given {b} {item_b} as a gift, bringing the total to {c} {item_c}. Let x be how many {item} {name} had before the gift. Solve: x + {b} = {c}",
];
const SUB_EQ_TEMPLATES = [
  "{name} had some {item}. After giving away {b} {item_b}, {name} had {c} {item_c} left. Let x be how many {item} {name} started with. Solve: x - {b} = {c}",
  "A box had some {item}. {b} {item_b} {was_were_b} taken out, leaving {c} {item_c} in the box. If x is the number of {item} that were in the box at first, solve: x - {b} = {c}",
];
const MUL_EQ_TEMPLATES = [
  "{name} has {b} equal bags of {item}, with x {item} in each bag, for a total of {c} {item_c}. Solve: {b}x = {c}",
  "There are {b} boxes, each holding x {item}, and together they hold {c} {item_c}. Solve: {b}x = {c}",
];
const AX_PLUS_B_EQ_TEMPLATES = [
  "{name} buys {a} bags of {item}, with x {item} in each bag, then finds {b} more loose {item_b}. In total {name} now has {c} {item_c}. Solve: {a}x + {b} = {c}",
  "Each of {name}'s {a} shelves holds x {item}, and {name} adds {b} more {item_b} on top of that. There are now {c} {item_c} in total. Solve: {a}x + {b} = {c}",
];
const AX_MINUS_B_EQ_TEMPLATES = [
  "{name} had {a} bags of {item} with x {item} in each bag, but {b} {item_b} {was_were_b} lost along the way, leaving {c} {item_c}. Solve: {a}x - {b} = {c}",
  "There were {a} boxes with x {item} in each box. After {b} {item_b} {was_were_b} removed, {c} {item_c} remained. Solve: {a}x - {b} = {c}",
];

// ITEMS are all regular plurals (apples, pencils, toy cars, ...), so singularizing for a
// count of exactly 1 is just dropping the trailing 's' -- avoids "leaving 1 pencils".
function pluralizeItem(item, count) {
  return count === 1 ? item.slice(0, -1) : item;
}

function equationWordProblem(kind, name, item, vars) {
  const templates = { add: ADD_EQ_TEMPLATES, sub: SUB_EQ_TEMPLATES, mul: MUL_EQ_TEMPLATES,
    ax_plus_b: AX_PLUS_B_EQ_TEMPLATES, ax_minus_b: AX_MINUS_B_EQ_TEMPLATES }[kind];
  const item_b = "b" in vars ? pluralizeItem(item, vars.b) : item;
  const item_c = "c" in vars ? pluralizeItem(item, vars.c) : item;
  const was_were_b = vars.b === 1 ? "was" : "were";
  return fmt(choice(templates), { name, item, item_b, item_c, was_were_b, ...vars });
}

// Builds the {terms, op, total} shape drawEquationStory (JS) / _draw_equation_story (Python)
// render: a row of '?' boxes for the unknown next to the item's own emoji for the known
// quantity, tying the picture to the word problem instead of an abstract algebra balance
// scale. Returns null (no illustration) when a term has too many units to render as
// individual boxes/icons -- the question still works fine as text-only in that case.
function equationStoryIllustration(kind, item, vars) {
  if (kind === "add") {
    const { b, c } = vars;
    if (b > 20) return null;
    return { type: "equation_story", item, terms: [{ unknown: 1 }, { known: b }], op: "+", total: c };
  }
  if (kind === "sub") {
    const { b, c } = vars;
    if (b > 20) return null;
    return { type: "equation_story", item, terms: [{ unknown: 1 }, { known: b, removed: true }], op: "-", total: c };
  }
  if (kind === "mul") {
    const { b, c } = vars;
    if (b > 12) return null;
    return { type: "equation_story", item, terms: [{ unknown: b }], op: null, total: c };
  }
  if (kind === "ax_plus_b") {
    const { a, b, c } = vars;
    if (a > 12 || b > 20) return null;
    return { type: "equation_story", item, terms: [{ unknown: a }, { known: b }], op: "+", total: c };
  }
  if (kind === "ax_minus_b") {
    const { a, b, c } = vars;
    if (a > 12 || b > 20) return null;
    return { type: "equation_story", item, terms: [{ unknown: a }, { known: b, removed: true }], op: "-", total: c };
  }
  return null;
}

// Always frames one-step/two-step equations as a word problem about a real item (a kid
// finding/sharing/losing stickers, cookies, etc), with an illustration to match, rather
// than showing the bare algebra -- extreme (variable on both sides) has no natural
// word-problem phrasing, so it stays abstract text with no illustration.
function equationsQ(ageIdx, diffIdx) {
  const name = choice(NAMES), item = choice(ITEMS);

  if (ageIdx === 1) {
    let x, b, c, kind;
    if (diffIdx === 0) {
      kind = "add";
      x = randInt(1, 15); b = randInt(1, 15); c = x + b;
    } else if (diffIdx === 1) {
      if (choice([true, false])) {
        kind = "sub";
        b = randInt(1, 15); x = b + randInt(1, 15); c = x - b;
      } else {
        kind = "mul";
        x = randInt(2, 10); b = randInt(2, 9); c = x * b;
      }
    } else {
      kind = choice(["add", "sub", "mul"]);
      if (kind === "add") { x = randInt(1, 60); b = randInt(1, 60); c = x + b; }
      else if (kind === "sub") { b = randInt(1, 50); x = b + randInt(1, 50); c = x - b; }
      else { x = randInt(2, 12); b = randInt(2, 12); c = x * b; }
    }
    const prompt = equationWordProblem(kind, name, item, { b, c });
    const answer = x;
    const choices = numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 10);
    const illustration = equationStoryIllustration(kind, item, { b, c });
    const result = { prompt, choices, answer };
    if (illustration) result.illustration = illustration;
    return result;
  }

  // ageIdx === 2
  let answer, prompt, illustration, c;
  if (diffIdx === 0) {
    const kind = choice(["add", "sub", "mul"]);
    let x, b;
    if (kind === "add") { x = randInt(1, 100); b = randInt(1, 100); c = x + b; }
    else if (kind === "sub") { b = randInt(1, 80); x = b + randInt(1, 80); c = x - b; }
    else { x = randInt(2, 20); b = randInt(2, 12); c = x * b; }
    prompt = equationWordProblem(kind, name, item, { b, c });
    answer = x;
    illustration = equationStoryIllustration(kind, item, { b, c });
  } else if (diffIdx === 1 || diffIdx === 2) {
    const a = randInt(2, 9);
    const bMax = diffIdx === 1 ? 20 : 30;
    const x = diffIdx === 1 ? randInt(2, 15) : randInt(2, 20);
    const kind = choice(["ax_plus_b", "ax_minus_b"]);
    // b must stay below a*x so c = a*x - b can't go negative/zero (a "leaving -1 books"
    // word problem, or a divide-by-nothing-left story with no items).
    const b = kind === "ax_plus_b" ? randInt(1, bMax) : randInt(1, Math.min(bMax, a * x - 1));
    c = kind === "ax_plus_b" ? a * x + b : a * x - b;
    prompt = equationWordProblem(kind, name, item, { a, b, c });
    answer = x;
    illustration = equationStoryIllustration(kind, item, { a, b, c });
  } else {
    // extreme: variable on both sides (genuine grade 7 stretch) -- no natural
    // word-problem phrasing for comparing two expressions, so no illustration either.
    const x = randInt(2, 15), a = randInt(2, 9), d = randInt(1, a - 1), b = randInt(1, 20);
    c = (a - d) * x + b;
    prompt = `${a}x + ${b} = ${d}x + ${c}. What is x?`;
    answer = x;
    illustration = null;
  }
  const choices = numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 15);
  const result = { prompt, choices, answer };
  if (illustration) result.illustration = illustration;
  return result;
}

// -- Preschool-only counting/quantity-sense exercises ------------------------------------
// Both ignore ageIdx entirely (same reasoning as verticalAdditionSingleDigitQ): they're only
// ever reached via an explicit Preschool curriculum phase list, which bypasses MIN_AGE
// filtering, so ageIdx could arrive as anything resolveExtreme rewrote it to. Scaling only off
// diffIdx keeps them safe regardless.

// Tap each scattered object to count it (one-to-one correspondence -- the actual foundational
// preschool skill, not yet touched by anything else in the app, which jumps straight to
// already-formed-numeral arithmetic). Once every object has been tapped, a bank of nearby
// numbers unlocks for the kid to tap the total.
function countingTapQ(ageIdx, diffIdx) {
  const [lo, hi] = diffIdx >= 2 ? [5, 10] : [1, 5];
  const n = randInt(lo, hi);
  const emoji = choice(COUNT_EMOJIS);
  return {
    prompt: "Tap each one to count, then tap the number!", speak: "Count them, then tap the number",
    choices: numericChoices(n, 0, 10), answer: n,
    interactive: "counting_tap", count: n, emoji,
  };
}

// Classic ten-frame manipulative: tap cells to fill them (tap again to unfill, so a misclick
// isn't a dead end) until the filled count matches the target -- validates the moment it does,
// however the kid got there, since "how many cells are filled" is the whole task.
function tenFrameFillQ(ageIdx, diffIdx) {
  const [lo, hi] = diffIdx >= 2 ? [5, 10] : [1, 5];
  const n = randInt(lo, hi);
  return {
    prompt: `Fill the ten-frame with ${n}!`, speak: `Fill the ten frame with ${n}`,
    choices: numericChoices(n, 0, 10), answer: n,
    interactive: "ten_frame", target: n,
  };
}

// Objects stay tappable throughout (no "counted" lockout) so a kid who loses count can just
// recount by re-tapping -- the running counter always reflects how many are currently marked,
// same forgiving spirit as the ten-frame's tap-to-toggle. The number bank only responds once
// every object has been marked, enforcing "count first, then answer" without silently eating
// early taps (it's visibly dimmed via CSS until then).
function buildCountingTapInteractive(count, emoji, choices, onComplete) {
  const wrap = el("div", { class: "counting-wrap" });

  const objectsRow = el("div", { class: "counting-objects" });
  wrap.appendChild(objectsRow);
  const counterEl = el("div", { class: "counting-counter", text: `Counted: 0 / ${count}` });
  wrap.appendChild(counterEl);
  const numberRow = el("div", { class: "counting-number-bank" });
  wrap.appendChild(numberRow);

  let tapped = 0;
  let done = false;

  for (let i = 0; i < count; i++) {
    const obj = el("button", { class: "counting-object", type: "button", text: emoji });
    obj.addEventListener("click", () => {
      if (done) return;
      const wasCounted = obj.classList.contains("counting-object-counted");
      obj.classList.toggle("counting-object-counted");
      tapped += wasCounted ? -1 : 1;
      counterEl.textContent = `Counted: ${tapped} / ${count}`;
      numberRow.classList.toggle("counting-number-bank-active", tapped === count);
    });
    objectsRow.appendChild(obj);
  }

  choices.forEach((num) => {
    const tile = el("button", { class: "counting-number-tile", type: "button", text: String(num) });
    tile.addEventListener("click", () => {
      if (done || tapped !== count) return;
      if (num === count) {
        done = true;
        tile.classList.add("counting-number-correct");
        onComplete();
      } else {
        tile.classList.add("counting-number-wrong");
        setTimeout(() => tile.classList.remove("counting-number-wrong"), 400);
      }
    });
    numberRow.appendChild(tile);
  });

  return wrap;
}

function buildTenFrameInteractive(target, onComplete) {
  const wrap = el("div", { class: "tenframe-wrap" });
  const grid = el("div", { class: "tenframe-grid" });
  wrap.appendChild(grid);
  const counterEl = el("div", { class: "tenframe-counter", text: `Filled: 0 / ${target}` });
  wrap.appendChild(counterEl);

  let filled = 0;
  let done = false;

  for (let i = 0; i < 10; i++) {
    const cell = el("button", { class: "tenframe-cell", type: "button" });
    cell.addEventListener("click", () => {
      if (done) return;
      const isFilled = cell.classList.contains("tenframe-cell-filled");
      cell.classList.toggle("tenframe-cell-filled");
      filled += isFilled ? -1 : 1;
      counterEl.textContent = `Filled: ${filled} / ${target}`;
    });
    grid.appendChild(cell);
  }

  // Reaching the target count no longer auto-completes the exercise -- filling boxes is just
  // arranging the answer, not committing to it, so the kid explicitly submits when ready
  // (matching how every choice-based question already works: pick, then it's final).
  const feedbackEl = el("div", { class: "feedback" });
  wrap.appendChild(feedbackEl);
  const submitBtn = button("✅ Submit", () => {
    if (done) return;
    if (filled === target) {
      done = true;
      grid.classList.add("tenframe-grid-correct");
      submitBtn.disabled = true;
      onComplete();
    } else {
      feedbackEl.textContent = "Not quite -- try again!";
      feedbackEl.className = "feedback feedback-wrong";
      setTimeout(() => { feedbackEl.textContent = ""; feedbackEl.className = "feedback"; }, 1200);
    }
  }, "start");
  wrap.appendChild(submitBtn);

  return wrap;
}

// -- Elementary-level interactive exercises -----------------------------------------------

// Shade segments of a bar to show a target fraction -- makes the fraction concrete instead of
// abstract numerator/denominator symbols. Same explicit-Submit pattern as Ten-Frame Fill:
// shading is arranging an answer, not committing to one, so reaching the right count doesn't
// auto-finish the exercise.
function fractionBarQ(ageIdx, diffIdx) {
  const [lo, hi] = diffIdx >= 2 ? [4, 10] : [3, 6];
  const denominator = randInt(lo, hi);
  const numerator = randInt(1, denominator - 1);
  return {
    prompt: `Shade the bar to show ${numerator}/${denominator}`, speak: `Shade ${numerator} out of ${denominator}`,
    choices: numericChoices(numerator, 0, denominator), answer: numerator,
    interactive: "fraction_bar", numerator, denominator,
  };
}

function buildFractionBarInteractive(numerator, denominator, onComplete) {
  const wrap = el("div", { class: "fracbar-wrap" });
  const bar = el("div", { class: "fracbar-bar" });
  wrap.appendChild(bar);
  const counterEl = el("div", { class: "fracbar-counter", text: `Shaded: 0 / ${denominator}` });
  wrap.appendChild(counterEl);

  let shaded = 0;
  let done = false;

  for (let i = 0; i < denominator; i++) {
    const seg = el("button", { class: "fracbar-segment", type: "button" });
    seg.style.width = `${100 / denominator}%`;
    seg.addEventListener("click", () => {
      if (done) return;
      const isShaded = seg.classList.contains("fracbar-segment-shaded");
      seg.classList.toggle("fracbar-segment-shaded");
      shaded += isShaded ? -1 : 1;
      counterEl.textContent = `Shaded: ${shaded} / ${denominator}`;
    });
    bar.appendChild(seg);
  }

  const feedbackEl = el("div", { class: "feedback" });
  wrap.appendChild(feedbackEl);
  const submitBtn = button("✅ Submit", () => {
    if (done) return;
    if (shaded === numerator) {
      done = true;
      bar.classList.add("fracbar-bar-correct");
      submitBtn.disabled = true;
      onComplete();
    } else {
      feedbackEl.textContent = "Not quite -- try again!";
      feedbackEl.className = "feedback feedback-wrong";
      setTimeout(() => { feedbackEl.textContent = ""; feedbackEl.className = "feedback"; }, 1200);
    }
  }, "start");
  wrap.appendChild(submitBtn);

  return wrap;
}

// -- Concrete, non-algorithm ways to teach division --------------------------------------
// Both are exact division only (dividend = divisor x quotient, no remainder) -- these are
// about building the concept of what division IS before adding remainder complexity on top.

// Phase 1: tap each scattered object to deal it out round-robin into `divisor` group bins
// (exactly how "share these equally" works by hand -- one to you, one to you, one to you,
// repeat), so placement is always correct by construction and the kid's job is just watching
// the groups even out as they tap. Phase 2: write the equation from what just happened --
// three blanks (dividend, divisor, quotient) with a shared number bank, filled in order left
// to right like Sentence Builder, so getting the STRUCTURE of the equation right (which number
// is the total, which is the group count) is as much the point as the arithmetic.
// Equal Groups Sorter needs its OWN tier table, not a shared one with Division Hops --
// every combination is constructed so divisor*quotient never exceeds 24 (an earlier version
// tried to force-fit Division Hops' bigger ranges by clamping quotient's upper bound after the
// fact, which broke silently whenever a tier's minimum quotient already exceeded the capped
// max: randInt(lo, hi) with lo > hi just returns lo unclamped, so "Extreme" could still ask
// for 30-45 objects). Progression here comes mainly from a wider divisor range (more groups to
// track) since quotient has to stay small at every tier for the object count to fit on screen.
const EQUAL_GROUPS_TIERS = {
  1: [ // Early Elementary
    { divisor: [2, 3], quotient: [2, 4] }, // Easy, max 12
    { divisor: [2, 4], quotient: [3, 5] }, // Medium, max 20
    { divisor: [3, 5], quotient: [3, 4] }, // Hard, max 20
    { divisor: [3, 6], quotient: [3, 4] }, // Extreme, max 24
  ],
  2: [ // Upper Elementary
    { divisor: [2, 4], quotient: [3, 4] }, // Easy, max 16
    { divisor: [3, 5], quotient: [3, 4] }, // Medium, max 20
    { divisor: [3, 6], quotient: [3, 4] }, // Hard, max 24
    { divisor: [4, 6], quotient: [3, 4] }, // Extreme, max 24
  ],
};
function equalGroupsTier(ageIdx, diffIdx) {
  const tiers = EQUAL_GROUPS_TIERS[ageIdx] || EQUAL_GROUPS_TIERS[1];
  return tiers[Math.min(diffIdx, tiers.length - 1)];
}

function equalGroupsQ(ageIdx, diffIdx) {
  const tier = equalGroupsTier(ageIdx, diffIdx);
  const divisor = randInt(tier.divisor[0], tier.divisor[1]);
  const quotient = randInt(tier.quotient[0], tier.quotient[1]);
  const dividend = divisor * quotient;
  const emoji = choice(COUNT_EMOJIS);
  return {
    prompt: `Share ${dividend} ${emoji} equally into ${divisor} groups!`, speak: `Share ${dividend} into ${divisor} equal groups`,
    choices: numericChoices(quotient, 0, dividend), answer: quotient,
    interactive: "equal_groups", dividend, divisor, quotient, emoji,
  };
}

function buildEqualGroupsInteractive(dividend, divisor, quotient, emoji, onComplete) {
  const wrap = el("div", { class: "eqgroups-wrap" });
  const poolRow = el("div", { class: "eqgroups-pool" });
  wrap.appendChild(poolRow);
  const binsRow = el("div", { class: "eqgroups-bins" });
  wrap.appendChild(binsRow);

  const bins = [];
  for (let i = 0; i < divisor; i++) {
    const bin = el("div", { class: "eqgroups-bin" });
    bin.appendChild(el("div", { class: "eqgroups-bin-label", text: `Group ${i + 1}` }));
    const binItems = el("div", { class: "eqgroups-bin-items" });
    bin.appendChild(binItems);
    binsRow.appendChild(bin);
    bins.push(binItems);
  }

  let nextBin = 0;
  let placed = 0;
  for (let i = 0; i < dividend; i++) {
    const obj = el("button", { class: "eqgroups-object", type: "button", text: emoji });
    obj.addEventListener("click", () => {
      if (obj.disabled) return;
      obj.disabled = true;
      obj.classList.add("eqgroups-object-placed");
      bins[nextBin].appendChild(el("span", { class: "eqgroups-bin-dot", text: emoji }));
      nextBin = (nextBin + 1) % divisor;
      placed++;
      if (placed === dividend) setTimeout(showEquationPhase, 500);
    });
    poolRow.appendChild(obj);
  }

  function showEquationPhase() {
    // Keep the sorted groups on screen instead of wiping them -- the whole point of writing
    // the equation right after sorting is connecting the symbols back to what they just built,
    // which doesn't work if the groups vanish the moment the equation appears. Only the (now
    // empty) object pool goes away, since there's nothing left in it to look at.
    poolRow.remove();
    wrap.appendChild(el("div", { class: "eqgroups-recap", text: `${divisor} groups of ${quotient} each! Now write the equation:` }));

    const eqRow = el("div", { class: "eqgroups-equation" });
    wrap.appendChild(eqRow);
    const blanks = [el("div", { class: "eqgroups-blank" }), el("div", { class: "eqgroups-blank" }), el("div", { class: "eqgroups-blank" })];
    eqRow.appendChild(blanks[0]);
    eqRow.appendChild(el("div", { class: "eqgroups-op", text: "÷" }));
    eqRow.appendChild(blanks[1]);
    eqRow.appendChild(el("div", { class: "eqgroups-op", text: "=" }));
    eqRow.appendChild(blanks[2]);
    const correctSeq = [dividend, divisor, quotient];

    const bankRow = el("div", { class: "eqgroups-bank" });
    wrap.appendChild(bankRow);

    // The 3 correct values go in as their own tiles even when two of them happen to be equal
    // (e.g. 9 / 3 = 3 needs a "3" tile for the divisor slot AND a separate "3" tile for the
    // quotient slot) -- deduping via a Set here would silently make the equation unsolvable
    // whenever divisor === quotient, since only one "3" tile would exist for two slots that
    // both need it.
    const bankNums = [dividend, divisor, quotient];
    const usedValues = new Set(bankNums);
    let guard = 0;
    while (bankNums.length < 5 && guard++ < 100) {
      const candidate = randInt(1, dividend + 5);
      if (usedValues.has(candidate)) continue;
      usedValues.add(candidate);
      bankNums.push(candidate);
    }
    const tiles = shuffle(bankNums).map((value, id) => ({ value, id }));
    let placedIds = [];
    let done = false;

    function render() {
      blanks.forEach((b, i) => {
        const id = placedIds[i];
        if (id != null) {
          b.textContent = String(tiles.find((t) => t.id === id).value);
          b.classList.add("eqgroups-blank-filled");
        } else {
          b.textContent = "";
          b.classList.remove("eqgroups-blank-filled");
        }
      });
      bankRow.innerHTML = "";
      tiles.forEach((t) => {
        if (placedIds.includes(t.id)) return;
        const tile = el("button", { class: "eqgroups-tile", type: "button", text: String(t.value) });
        tile.addEventListener("click", () => {
          if (done || placedIds.length >= 3) return;
          placedIds.push(t.id);
          render();
          if (placedIds.length === 3) checkComplete();
        });
        bankRow.appendChild(tile);
      });
    }

    // Tapping the most recently placed blank undoes just that one -- backspace, not a full
    // reset, since a slip on the 3rd number shouldn't cost the first two.
    blanks.forEach((b, i) => {
      b.addEventListener("click", () => {
        if (done || i !== placedIds.length - 1) return;
        placedIds.pop();
        render();
      });
    });

    function checkComplete() {
      const chosen = placedIds.map((id) => tiles.find((t) => t.id === id).value);
      if (chosen[0] === correctSeq[0] && chosen[1] === correctSeq[1] && chosen[2] === correctSeq[2]) {
        done = true;
        blanks.forEach((b) => b.classList.add("eqgroups-blank-correct"));
        onComplete();
      } else {
        blanks.forEach((b) => b.classList.add("eqgroups-blank-wrong"));
        setTimeout(() => {
          blanks.forEach((b) => b.classList.remove("eqgroups-blank-wrong"));
          placedIds = [];
          render();
        }, 900);
      }
    }

    render();
  }

  return wrap;
}

// Multiplication's mirror of Equal Groups Sorter -- literally the same underlying model
// ("N groups of M"), just asking for the product instead of the per-group count. Reuses
// equalGroupsTier()'s ranges (the visual cap -- max ~24 tappable objects -- applies here just
// as much) and every .eqgroups-* CSS class, so it looks and behaves as one consistent family
// of exercise rather than a reskinned duplicate.
function groupsMultiplyQ(ageIdx, diffIdx) {
  const tier = equalGroupsTier(ageIdx, diffIdx);
  const groups = randInt(tier.divisor[0], tier.divisor[1]);
  const perGroup = randInt(tier.quotient[0], tier.quotient[1]);
  const product = groups * perGroup;
  const emoji = choice(COUNT_EMOJIS);
  return {
    prompt: `Build ${groups} groups of ${perGroup} ${emoji} each!`, speak: `Build ${groups} groups of ${perGroup}`,
    choices: numericChoices(product, 0, product + Math.max(10, Math.floor(product / 2)) + 5), answer: product,
    interactive: "groups_multiply", groups, perGroup, product, emoji,
  };
}

// Deliberately NOT a mirror of Equal Groups Sorter's pool-then-deal mechanic: that pool starts
// with exactly `dividend` objects, which is fine there since the dividend is the GIVEN part of
// a division problem, not the answer. Here `product` is the answer -- pre-rendering a pool of
// exactly that many objects would let a kid just count the pool and skip the multiplication
// entirely. Instead each bin gets its own "add" button and independently builds up to
// `perGroup`, so the total is never visible as a count until the recap reveals it.
function buildGroupsMultiplyInteractive(groups, perGroup, product, emoji, onComplete) {
  const wrap = el("div", { class: "eqgroups-wrap" });
  const binsRow = el("div", { class: "eqgroups-bins" });
  wrap.appendChild(binsRow);

  const binCounts = [];
  let groupsFilled = 0;
  for (let i = 0; i < groups; i++) {
    const bin = el("div", { class: "eqgroups-bin" });
    bin.appendChild(el("div", { class: "eqgroups-bin-label", text: `Group ${i + 1}` }));
    const binItems = el("div", { class: "eqgroups-bin-items" });
    bin.appendChild(binItems);
    const addBtn = el("button", { class: "eqgroups-add-btn", type: "button", text: `+ ${emoji}` });
    bin.appendChild(addBtn);
    binsRow.appendChild(bin);
    binCounts.push(0);

    addBtn.addEventListener("click", () => {
      if (binCounts[i] >= perGroup) return;
      binItems.appendChild(el("span", { class: "eqgroups-bin-dot", text: emoji }));
      binCounts[i]++;
      if (binCounts[i] === perGroup) {
        addBtn.disabled = true;
        addBtn.classList.add("eqgroups-add-btn-done");
        groupsFilled++;
        if (groupsFilled === groups) setTimeout(showEquationPhase, 500);
      }
    });
  }

  function showEquationPhase() {
    wrap.appendChild(el("div", { class: "eqgroups-recap", text: `${groups} groups of ${perGroup} is ${product}! Now write the equation:` }));

    const eqRow = el("div", { class: "eqgroups-equation" });
    wrap.appendChild(eqRow);
    const blanks = [el("div", { class: "eqgroups-blank" }), el("div", { class: "eqgroups-blank" }), el("div", { class: "eqgroups-blank" })];
    eqRow.appendChild(blanks[0]);
    eqRow.appendChild(el("div", { class: "eqgroups-op", text: "×" }));
    eqRow.appendChild(blanks[1]);
    eqRow.appendChild(el("div", { class: "eqgroups-op", text: "=" }));
    eqRow.appendChild(blanks[2]);
    const correctSeq = [groups, perGroup, product];

    const bankRow = el("div", { class: "eqgroups-bank" });
    wrap.appendChild(bankRow);

    // Same duplicate-value fix as Equal Groups Sorter: the 3 correct values go in as their own
    // tiles even when two coincide (e.g. 3 groups of 3 needs two separate "3" tiles).
    const bankNums = [groups, perGroup, product];
    const usedValues = new Set(bankNums);
    let guard = 0;
    while (bankNums.length < 5 && guard++ < 100) {
      const candidate = randInt(1, product + 5);
      if (usedValues.has(candidate)) continue;
      usedValues.add(candidate);
      bankNums.push(candidate);
    }
    const tiles = shuffle(bankNums).map((value, id) => ({ value, id }));
    let placedIds = [];
    let done = false;

    function render() {
      blanks.forEach((b, i) => {
        const id = placedIds[i];
        if (id != null) {
          b.textContent = String(tiles.find((t) => t.id === id).value);
          b.classList.add("eqgroups-blank-filled");
        } else {
          b.textContent = "";
          b.classList.remove("eqgroups-blank-filled");
        }
      });
      bankRow.innerHTML = "";
      tiles.forEach((t) => {
        if (placedIds.includes(t.id)) return;
        const tile = el("button", { class: "eqgroups-tile", type: "button", text: String(t.value) });
        tile.addEventListener("click", () => {
          if (done || placedIds.length >= 3) return;
          placedIds.push(t.id);
          render();
          if (placedIds.length === 3) checkComplete();
        });
        bankRow.appendChild(tile);
      });
    }

    // Tapping the most recently placed blank undoes just that one -- backspace, not a full
    // reset, same as Equal Groups Sorter.
    blanks.forEach((b, i) => {
      b.addEventListener("click", () => {
        if (done || i !== placedIds.length - 1) return;
        placedIds.pop();
        render();
      });
    });

    function checkComplete() {
      const chosen = placedIds.map((id) => tiles.find((t) => t.id === id).value);
      if (chosen[0] === correctSeq[0] && chosen[1] === correctSeq[1] && chosen[2] === correctSeq[2]) {
        done = true;
        blanks.forEach((b) => b.classList.add("eqgroups-blank-correct"));
        onComplete();
      } else {
        blanks.forEach((b) => b.classList.add("eqgroups-blank-wrong"));
        setTimeout(() => {
          blanks.forEach((b) => b.classList.remove("eqgroups-blank-wrong"));
          placedIds = [];
          render();
        }, 900);
      }
    }

    render();
  }

  return wrap;
}

// Division Hops has no rendering constraint (it's just numbers, not individually-tappable
// objects), so its own tier table can scale further than Equal Groups Sorter's -- capped only
// by keeping the hop count from becoming tedious tapping (max 12 at Extreme).
const DIVISION_HOPS_TIERS = {
  1: [ // Early Elementary
    { divisor: [2, 3], quotient: [2, 4] }, // Easy
    { divisor: [2, 4], quotient: [3, 5] }, // Medium
    { divisor: [3, 5], quotient: [4, 6] }, // Hard
    { divisor: [3, 6], quotient: [5, 8] }, // Extreme
  ],
  2: [ // Upper Elementary
    { divisor: [2, 4], quotient: [3, 6] }, // Easy
    { divisor: [3, 6], quotient: [4, 8] }, // Medium
    { divisor: [4, 7], quotient: [5, 9] }, // Hard
    { divisor: [4, 9], quotient: [6, 12] }, // Extreme
  ],
};
function divisionHopsTier(ageIdx, diffIdx) {
  const tiers = DIVISION_HOPS_TIERS[ageIdx] || DIVISION_HOPS_TIERS[1];
  return tiers[Math.min(diffIdx, tiers.length - 1)];
}

// Start at the dividend, tap "subtract" to take away the divisor each time, counting hops
// until nothing's left -- "how many times can I take this away" is usually the most intuitive
// entry point into division, no groups/sharing metaphor or column algorithm required. Once the
// pile hits exactly 0, the kid confirms the hop count as the answer from a small bank (so
// counting the hops and connecting that count to "the answer" are both required, not just
// tapping subtract mindlessly).
function repeatedSubtractionQ(ageIdx, diffIdx) {
  const tier = divisionHopsTier(ageIdx, diffIdx);
  const divisor = randInt(tier.divisor[0], tier.divisor[1]);
  const quotient = randInt(tier.quotient[0], tier.quotient[1]);
  const dividend = divisor * quotient;
  return {
    prompt: `${dividend} ÷ ${divisor} = ? Keep subtracting ${divisor} until you reach 0!`, speak: `${dividend} divided by ${divisor}`,
    choices: numericChoices(quotient, 0, dividend), answer: quotient,
    interactive: "repeated_subtraction", dividend, divisor, quotient,
  };
}

function buildRepeatedSubtractionInteractive(dividend, divisor, quotient, bank, onComplete) {
  const wrap = el("div", { class: "repsub-wrap" });
  const remainingEl = el("div", { class: "repsub-remaining", text: String(dividend) });
  wrap.appendChild(remainingEl);
  const hopCounterEl = el("div", { class: "repsub-hopcount", text: "Hops: 0" });
  wrap.appendChild(hopCounterEl);

  let remaining = dividend;
  let hops = 0;

  const subtractBtn = button(`➖ Subtract ${divisor}`, () => {
    if (remaining <= 0) return;
    remaining -= divisor;
    hops++;
    remainingEl.textContent = String(remaining);
    hopCounterEl.textContent = `Hops: ${hops}`;
    if (remaining === 0) {
      subtractBtn.disabled = true;
      showAnswerPhase();
    }
  }, "start");
  wrap.appendChild(subtractBtn);

  const answerPhaseEl = el("div", { class: "repsub-answer-phase" });
  wrap.appendChild(answerPhaseEl);

  function showAnswerPhase() {
    answerPhaseEl.appendChild(el("div", { class: "repsub-prompt", text: `You hopped back ${hops} times! So ${dividend} ÷ ${divisor} = ?` }));
    const bankRow = el("div", { class: "repsub-bank" });
    let done = false;
    bank.forEach((num) => {
      const tile = el("button", { class: "repsub-tile", type: "button", text: String(num) });
      tile.addEventListener("click", () => {
        if (done) return;
        if (num === quotient) {
          done = true;
          tile.classList.add("repsub-tile-correct");
          onComplete();
        } else {
          tile.classList.add("repsub-tile-wrong");
          setTimeout(() => tile.classList.remove("repsub-tile-wrong"), 400);
        }
      });
      bankRow.appendChild(tile);
    });
    answerPhaseEl.appendChild(bankRow);
  }

  return wrap;
}

const MATH_TOPIC_FUNCS = {
  Addition: additionQ,
  "Counting Tap": countingTapQ,
  "Ten-Frame Fill": tenFrameFillQ,
  "Make 10 Addition": make10AdditionQ,
  "Vertical Addition": verticalAdditionQ,
  "Vertical Addition (Single Digit)": verticalAdditionSingleDigitQ,
  Subtraction: subtractionQ,
  "Vertical Subtraction": verticalSubtractionQ,
  Multiplication: multiplicationQ,
  "Groups Multiplier": groupsMultiplyQ,
  "Vertical Multiplication": verticalMultiplicationQ,
  Division: divisionQ,
  "Equal Groups Sorter": equalGroupsQ,
  "Division Hops": repeatedSubtractionQ,
  "Mixed Operations": mixedOperationsQ,
  "Place Value": placeValueQ,
  Fractions: fractionsQ,
  "Fraction Bar Builder": fractionBarQ,
  Decimals: decimalsQ,
  Percentages: percentagesQ,
  Geometry: geometryQ,
  Measurement: measurementQ,
  "Missing Number": missingNumberQ,
  "Word Problems": wordProblemQ,
  Trigonometry: trigonometryQ,
  Equations: equationsQ,
};

function mathQuestion(ageIdx, diffIdx, topics) {
  [ageIdx, diffIdx] = resolveExtreme(ageIdx, diffIdx);
  const pool = topics && topics.length ? topics : ["Addition", "Subtraction"];
  const topic = choice(pool);
  return MATH_TOPIC_FUNCS[topic](ageIdx, diffIdx);
}
