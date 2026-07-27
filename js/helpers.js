// Small randomization/choice-building helpers -- JS equivalents of the Python helpers
// every question generator in kids_exercise_app.py relies on (random.randint, random.choice,
// random.shuffle, numeric_choices, make_choices, decimal_choices, resolve_extreme).

function randInt(min, max) {
  // inclusive on both ends, matching Python's random.randint(a, b)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max) {
  // matches Python's random.uniform(a, b)
  return Math.random() * (max - min) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function sample(arr, n) {
  const copy = arr.slice();
  shuffle(copy);
  return copy.slice(0, n);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function round1(x) {
  return Math.round(x * 10) / 10;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function fractionToString(num, den) {
  // Reduce num/den to lowest terms and render it as a mixed number when improper.
  const g = gcd(num, den) || 1;
  const n = num / g, d = den / g;
  if (d === 1) return `${n}`;
  if (n > d) {
    const whole = Math.floor(n / d);
    const rem = n % d;
    return rem === 0 ? `${whole}` : `${whole} ${rem}/${d}`;
  }
  return `${n}/${d}`;
}

function numericChoices(answer, low = 0, high = 999, count = 4) {
  const choices = new Set([answer]);
  let tries = 0;
  const deltas = [-5, -3, -2, -1, 1, 2, 3, 5];
  while (choices.size < count && tries < 100) {
    tries++;
    const cand = answer + choice(deltas);
    if (cand >= low && cand <= high) choices.add(cand);
  }
  return shuffle(Array.from(choices));
}

function decimalChoices(answer, count = 4) {
  const choices = new Set([round1(answer)]);
  let tries = 0;
  const deltas = [-1.0, -0.5, -0.2, -0.1, 0.1, 0.2, 0.5, 1.0];
  while (choices.size < count && tries < 100) {
    tries++;
    const cand = round1(answer + choice(deltas));
    if (cand >= 0) choices.add(cand);
  }
  return shuffle(Array.from(choices));
}

function makeChoices(answer, pool) {
  // Build a 4-item choice list containing `answer` plus distractors from pool.
  const options = new Set([answer]);
  const candidates = shuffle(pool.filter((p) => p !== answer));
  for (const c of candidates) {
    if (options.size >= 4) break;
    options.add(c);
  }
  return shuffle(Array.from(options));
}

function resolveExtreme(ageIdx, diffIdx) {
  // Extreme (diffIdx 3) means content from one grade above the chosen age, at Hard
  // difficulty. At the top age tier there's no higher grade to borrow from, so diffIdx
  // stays 3 and individual generators apply their own beyond-Hard variant instead.
  if (diffIdx === 3 && ageIdx < 2) return [ageIdx + 1, 2];
  return [ageIdx, diffIdx];
}

function fmtMoney(cents) {
  return cents;
}
