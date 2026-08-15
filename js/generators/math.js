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
// How many digits each operand of a vertical-arithmetic problem gets, scaled by age/difficulty
// the same way the regular (non-column) generators scale via getAddOperands/getMulOperands --
// Early Elementary progresses 2 -> 2 -> 3 digits across Easy/Medium/Hard (Extreme bumps up to
// Upper Elementary via resolveExtreme, so index 3 is never actually read for ageIdx 1), Upper
// Elementary progresses 2 -> 3 -> 3 -> 4 across Easy/Medium/Hard/Extreme.
const VCOL_DIGIT_TIERS = { 1: [2, 2, 3], 2: [2, 3, 3, 4] };
function vColumnDigits(ageIdx, diffIdx) {
  const tiers = VCOL_DIGIT_TIERS[ageIdx] || VCOL_DIGIT_TIERS[1];
  return tiers[Math.min(diffIdx, tiers.length - 1)];
}

function verticalAdditionQ(ageIdx, diffIdx) {
  const p = verticalAdditionProblem(vColumnDigits(ageIdx, diffIdx));
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
  const p = verticalSubtractionProblem(vColumnDigits(ageIdx, diffIdx));
  const answer = p.a - p.b;
  return {
    prompt: `${p.a} - ${p.b} = ?`, choices: numericChoices(answer, 0, p.a), answer,
    interactive: "vertical_subtract", ...p,
  };
}

function verticalMultiplicationQ(ageIdx, diffIdx) {
  // Capped at 10, not just "a bit bigger": with 9 as the largest single digit, a multiplier
  // of 11+ can push a column's carry to 10+ (e.g. 9x11 chained -> carry stabilizes at 10),
  // which the carry box can't represent since it's a single 0-9 digit picker, same as every
  // other box in this exercise -- that would render an unsolvable question.
  const multiplierHi = diffIdx >= 2 ? 10 : 9;
  const p = verticalMultiplicationProblem(vColumnDigits(ageIdx, diffIdx), multiplierHi);
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
  "{name} had some {item}. Then {name} found {b} more {item}, ending up with {c} {item} in total. Let x be how many {item} {name} started with. Solve: x + {b} = {c}",
  "A jar had some {item} in it. After {b} more {item} were added, the jar had {c} {item}. If x is the number of {item} that were in the jar at first, solve: x + {b} = {c}",
  "{name} was given {b} {item} as a gift, bringing the total to {c} {item}. Let x be how many {item} {name} had before the gift. Solve: x + {b} = {c}",
];
const SUB_EQ_TEMPLATES = [
  "{name} had some {item}. After giving away {b} {item}, {name} had {c} {item} left. Let x be how many {item} {name} started with. Solve: x - {b} = {c}",
  "A box had some {item}. {b} {item} were taken out, leaving {c} {item} in the box. If x is the number of {item} that were in the box at first, solve: x - {b} = {c}",
];
const MUL_EQ_TEMPLATES = [
  "{name} has {b} equal bags of {item}, with x {item} in each bag, for a total of {c} {item}. Solve: {b}x = {c}",
  "There are {b} boxes, each holding x {item}, and together they hold {c} {item}. Solve: {b}x = {c}",
];
const AX_PLUS_B_EQ_TEMPLATES = [
  "{name} buys {a} bags of {item}, with x {item} in each bag, then finds {b} more loose {item}. In total {name} now has {c} {item}. Solve: {a}x + {b} = {c}",
  "Each of {name}'s {a} shelves holds x {item}, and {name} adds {b} more {item} on top of that. There are now {c} {item} in total. Solve: {a}x + {b} = {c}",
];
const AX_MINUS_B_EQ_TEMPLATES = [
  "{name} had {a} bags of {item} with x {item} in each bag, but {b} {item} were lost along the way, leaving {c} {item}. Solve: {a}x - {b} = {c}",
  "There were {a} boxes with x {item} in each box. After {b} {item} were removed, {c} {item} remained. Solve: {a}x - {b} = {c}",
];

function equationWordProblem(kind, vars) {
  const name = choice(NAMES), item = choice(ITEMS);
  const templates = { add: ADD_EQ_TEMPLATES, sub: SUB_EQ_TEMPLATES, mul: MUL_EQ_TEMPLATES,
    axPlusB: AX_PLUS_B_EQ_TEMPLATES, axMinusB: AX_MINUS_B_EQ_TEMPLATES }[kind];
  return fmt(choice(templates), { name, item, ...vars });
}

function equationsQ(ageIdx, diffIdx) {
  if (ageIdx === 1) {
    let x, b, c, prompt, left, answer;
    if (diffIdx === 0) {
      x = randInt(1, 15); b = randInt(1, 15); c = x + b;
      left = `x + ${b}`;
      if (Math.random() < 0.5) { prompt = equationWordProblem("add", { b, c }); }
      else if (choice([true, false])) { prompt = `x + ${b} = ${c}. What is x?`; }
      else { prompt = `${b} + x = ${c}. What is x?`; left = `${b} + x`; }
    } else if (diffIdx === 1) {
      if (choice([true, false])) {
        b = randInt(1, 15); x = b + randInt(1, 15); c = x - b;
        left = `x - ${b}`;
        prompt = Math.random() < 0.5 ? equationWordProblem("sub", { b, c }) : `x - ${b} = ${c}. What is x?`;
      } else {
        x = randInt(2, 10); b = randInt(2, 9); c = x * b;
        left = `${b} × x`;
        prompt = Math.random() < 0.5 ? equationWordProblem("mul", { b, c }) : `${b} × x = ${c}. What is x?`;
      }
    } else {
      const op = choice(["add", "sub", "mul"]);
      if (op === "add") {
        x = randInt(1, 60); b = randInt(1, 60); c = x + b;
        left = `x + ${b}`;
        prompt = Math.random() < 0.5 ? equationWordProblem("add", { b, c }) : `x + ${b} = ${c}. What is x?`;
      } else if (op === "sub") {
        b = randInt(1, 50); x = b + randInt(1, 50); c = x - b;
        left = `x - ${b}`;
        prompt = Math.random() < 0.5 ? equationWordProblem("sub", { b, c }) : `x - ${b} = ${c}. What is x?`;
      } else {
        x = randInt(2, 12); b = randInt(2, 12); c = x * b;
        left = `${b} × x`;
        prompt = Math.random() < 0.5 ? equationWordProblem("mul", { b, c }) : `${b} × x = ${c}. What is x?`;
      }
    }
    answer = x;
    return { prompt, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 10), answer,
      illustration: { type: "equation_balance", left, right: String(c) } };
  }

  // ageIdx === 2
  let answer, prompt, left, c;
  if (diffIdx === 0) {
    const op = choice(["add", "sub", "mul"]);
    let x, b;
    if (op === "add") {
      x = randInt(1, 100); b = randInt(1, 100); c = x + b;
      left = `x + ${b}`;
      prompt = Math.random() < 0.5 ? equationWordProblem("add", { b, c }) : `x + ${b} = ${c}. What is x?`;
    } else if (op === "sub") {
      b = randInt(1, 80); x = b + randInt(1, 80); c = x - b;
      left = `x - ${b}`;
      prompt = Math.random() < 0.5 ? equationWordProblem("sub", { b, c }) : `x - ${b} = ${c}. What is x?`;
    } else {
      x = randInt(2, 20); b = randInt(2, 12); c = x * b;
      left = `${b} × x`;
      prompt = Math.random() < 0.5 ? equationWordProblem("mul", { b, c }) : `${b} × x = ${c}. What is x?`;
    }
    answer = x;
  } else if (diffIdx === 1) {
    const a = randInt(2, 9), x = randInt(2, 15), b = randInt(1, 20);
    if (choice([true, false])) {
      c = a * x + b; left = `${a}x + ${b}`;
      prompt = Math.random() < 0.5 ? equationWordProblem("axPlusB", { a, b, c }) : `${a}x + ${b} = ${c}. What is x?`;
    } else {
      c = a * x - b; left = `${a}x - ${b}`;
      prompt = Math.random() < 0.5 ? equationWordProblem("axMinusB", { a, b, c }) : `${a}x - ${b} = ${c}. What is x?`;
    }
    answer = x;
  } else if (diffIdx === 2) {
    const a = randInt(2, 9), x = randInt(2, 20), b = randInt(1, 30);
    if (choice([true, false])) {
      c = a * x + b; left = `${a}x + ${b}`;
      prompt = `A number multiplied by ${a}, then plus ${b}, equals ${c}. What is the number?`;
    } else {
      c = a * x - b; left = `${a}x - ${b}`;
      prompt = `A number multiplied by ${a}, then minus ${b}, equals ${c}. What is the number?`;
    }
    answer = x;
  } else {
    const x = randInt(2, 15), a = randInt(2, 9), d = randInt(1, a - 1), b = randInt(1, 20);
    c = (a - d) * x + b;
    prompt = `${a}x + ${b} = ${d}x + ${c}. What is x?`;
    left = `${a}x + ${b}`;
    answer = x;
    return { prompt, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 15), answer,
      illustration: { type: "equation_balance", left, right: `${d}x + ${c}` } };
  }
  return { prompt, choices: numericChoices(answer, 0, answer + Math.max(10, Math.floor(answer / 2)) + 15), answer,
    illustration: { type: "equation_balance", left, right: String(c) } };
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
  "Vertical Multiplication": verticalMultiplicationQ,
  Division: divisionQ,
  "Mixed Operations": mixedOperationsQ,
  "Place Value": placeValueQ,
  Fractions: fractionsQ,
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
