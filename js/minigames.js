// Mini Math Games hub. Currently four operation-table games (Addition, Subtraction,
// Multiplication, Division), each with three modes (tap-the-cell, type-the-answer, and a
// timed speed round), built as its own section separate from the quiz/lesson/curriculum
// flows so more mini games can be added here later.

const ADDTABLE_SIZE = 10;

// Each operation's table uses the same 1-10 x 1-10 grid of headers, but what the *values*
// mean differs. Addition and Multiplication are direct: cell = row op col. Subtraction
// mirrors Addition's fact family by offsetting the row header display (+10) so every result
// stays non-negative and reads as a real subtraction ("13 - 4 = 9") instead of using
// artificial absolute differences. Division mirrors Multiplication's fact family: the grid
// still holds row x col (the dividend), but Level 2 (the only mode that requires genuine
// division rather than table-reading) asks for the dividend divided by the row -- it does
// not reveal the column/quotient as a header, unlike the other three operations, since that
// would just give the answer away.
const ADDTABLE_OPS = {
  addition: {
    icon: "➕", name: "Addition", symbol: "+",
    rowLabel: (r) => String(r), colLabel: (c) => String(c),
    cellValue: (r, c) => r + c,
    findPrompt: (r, c) => `Tap where row ${r} and column ${c} meet!`,
    typePrompt: (r, c) => `${r} + ${c} = ?`,
    speedPrompt: (r, c) => `${r} + ${c} = ?`,
    speedAnswer: (r, c) => r + c,
    choiceRange: [0, 20],
  },
  subtraction: {
    icon: "➖", name: "Subtraction", symbol: "−",
    rowLabel: (r) => String(r + 10), colLabel: (c) => String(c),
    cellValue: (r, c) => (r + 10) - c,
    findPrompt: (r, c) => `Tap where row ${r + 10} and column ${c} meet!`,
    typePrompt: (r, c) => `${r + 10} − ${c} = ?`,
    speedPrompt: (r, c) => `${r + 10} − ${c} = ?`,
    speedAnswer: (r, c) => (r + 10) - c,
    choiceRange: [0, 19],
  },
  multiplication: {
    icon: "✖️", name: "Multiplication", symbol: "×",
    rowLabel: (r) => String(r), colLabel: (c) => String(c),
    cellValue: (r, c) => r * c,
    findPrompt: (r, c) => `Tap where row ${r} and column ${c} meet!`,
    typePrompt: (r, c) => `${r} × ${c} = ?`,
    speedPrompt: (r, c) => `${r} × ${c} = ?`,
    speedAnswer: (r, c) => r * c,
    choiceRange: [1, 100],
  },
  division: {
    icon: "➗", name: "Division", symbol: "÷",
    rowLabel: (r) => String(r), colLabel: (c) => String(c),
    cellValue: (r, c) => r * c,
    findPrompt: (r, c) => `Divisor ${r}, quotient ${c} — tap their dividend!`,
    // Level 2 is special-cased in showAddTableLevel2: only the row (divisor) is revealed,
    // and the prompt states the dividend directly, so typing the quotient is real division.
    typePrompt: (r, c) => `${r * c} ÷ ${r} = ?`,
    speedPrompt: (r, c) => `${r * c} ÷ ${r} = ?`,
    speedAnswer: (r, c) => c,
    choiceRange: [1, 10],
  },
};

function showMiniGames() {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("🎮 Mini Math Games", "Quick, playful games to practice math skills"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const grid = el("div", { class: "lesson-topic-grid" });
  grid.appendChild(button("🔟 Make 10 to Add", showMakeTenGame, "choice"));
  grid.appendChild(button("➕ Vertical Addition", showVerticalAdditionGame, "choice"));
  grid.appendChild(button("➖ Vertical Subtraction", showVerticalSubtractionGame, "choice"));
  grid.appendChild(button("✖️ Vertical Multiplication", showVerticalMultiplicationGame, "choice"));
  grid.appendChild(button("🔍 Answer Hunt", showNumberGridGame, "choice"));
  for (const opKey of Object.keys(ADDTABLE_OPS)) {
    const op = ADDTABLE_OPS[opKey];
    grid.appendChild(button(`${op.icon} ${op.name} Table`, () => showAdditionTableMenu(opKey), "choice"));
  }
  root.appendChild(grid);
}

// -- Make 10 to Add: work the decompose-to-make-ten strategy out step by step, typing each
// piece in yourself, instead of just picking the final answer from a multiple-choice list.
function makeTenProblem() {
  const a = choice([7, 8, 9]);
  const neededForA = 10 - a;
  const b = randInt(neededForA + 1, 9); // guarantees a + b > 10 regardless of which ends up the anchor
  // Whichever of the two is actually closer to 10 stays whole -- not necessarily `a`, since
  // `b` can land closer (e.g. a=8, b=9 should keep the 9 and split the 8, not the reverse).
  const anchor = (10 - a) <= (10 - b) ? a : b;
  const decompose = anchor === a ? b : a;
  const needed = 10 - anchor;
  const leftover = decompose - needed;
  // Which addend is closer to 10 (and so gets decomposed) shouldn't always land in the same
  // spot in the equation -- e.g. "3 + 9" should split the 3, same as "9 + 3" would.
  const anchorFirst = Math.random() < 0.5;
  return {
    bigger: anchor, smaller: decompose, needed, leftover, sum: a + b,
    first: anchorFirst ? anchor : decompose,
    second: anchorFirst ? decompose : anchor,
  };
}

// Builds the branch-and-two-boxes tree as real (clickable) DOM elements rather than a
// canvas, so each box can be tapped to open a 1-10 number picker instead of typing.
function buildMakeTenTree() {
  const boxSize = 70, gap = 50;
  const width = boxSize * 2 + gap;
  const wrap = el("div", { class: "maketen-tree", style: `width:${width}px; height:130px;` });

  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", "60");
  svg.setAttribute("class", "maketen-branch-svg");
  const apexX = width / 2;
  for (const targetX of [boxSize / 2, width - boxSize / 2]) {
    const line = document.createElementNS(svgNs, "line");
    line.setAttribute("x1", String(apexX)); line.setAttribute("y1", "4");
    line.setAttribute("x2", String(targetX)); line.setAttribute("y2", "58");
    line.setAttribute("stroke", "currentColor"); line.setAttribute("stroke-width", "2.5");
    svg.appendChild(line);
  }
  wrap.appendChild(svg);

  const leftBox = el("button", { class: "maketen-box", style: "left:0;", type: "button" });
  const rightBox = el("button", { class: "maketen-box", style: `left:${boxSize + gap}px;`, type: "button" });
  wrap.appendChild(leftBox);
  wrap.appendChild(rightBox);

  return { wrap, leftBox, rightBox };
}

// Builds one interactive Make-10 exercise (choose-the-number-to-split, decompose boxes,
// scratchpad, final sum) for a single problem `p` ({bigger, smaller, needed, leftover, sum,
// first, second}). Calls onComplete() once fully solved. Shared by the standalone Mini Game
// loop (showMakeTenGame) and by quiz/curriculum questions (app.js's showQuestion), since a
// "Make 10 Addition" question needs this same worked-out UI instead of multiple choice.
function buildMakeTenInteractive(p, onComplete) {
  const wrap = el("div", {});

  // The kid identifies which addend to decompose themselves first -- reminded, if they get
  // it wrong, that the one already close to 10 stays whole and the other one splits.
  const chooseWrap = el("div", { class: "maketen-choose" });
  chooseWrap.appendChild(el("div", { class: "step-text maketen-intro", text: "Which number should we split to make a ten?" }));
  const chooseRow = el("div", { class: "chip-row maketen-choose-row" });
  const chooseFeedback = el("div", { class: "maketen-step-feedback" });
  [p.first, p.second].forEach((val) => {
    const cbtn = button(String(val), () => handleChoose(val), "chip");
    chooseRow.appendChild(cbtn);
  });
  chooseWrap.appendChild(chooseRow);
  chooseWrap.appendChild(chooseFeedback);
  wrap.appendChild(chooseWrap);

  const restWrap = el("div", { class: "maketen-hidden" });
  wrap.appendChild(restWrap);

  restWrap.appendChild(el("div", { class: "step-text maketen-intro", text:
    `Right! ${p.bigger} stays close to 10, so we split ${p.smaller}. Tap a box and pick a number.` }));

  const { wrap: treeWrap, leftBox, rightBox } = buildMakeTenTree();
  const treeOuter = el("div", { class: "illustration-wrap" });
  treeOuter.appendChild(treeWrap);
  restWrap.appendChild(treeOuter);

  const pickerWrap = el("div", { class: "maketen-picker maketen-hidden" });
  const pickerLabel = el("div", { class: "maketen-picker-label" });
  const pickerGrid = el("div", { class: "maketen-picker-grid" });
  const pickerBtns = [];
  for (let n = 1; n <= 10; n++) {
    const pbtn = button(String(n), () => handlePick(n), "chip");
    pickerGrid.appendChild(pbtn);
    pickerBtns.push(pbtn);
  }
  pickerWrap.appendChild(pickerLabel);
  pickerWrap.appendChild(pickerGrid);
  restWrap.appendChild(pickerWrap);

  const scratchpadSlot = el("div", {});
  restWrap.appendChild(scratchpadSlot);

  const step3Row = el("div", { class: "count-row maketen-step maketen-hidden" });
  step3Row.appendChild(el("span", { class: "maketen-step-label", text: "Once both boxes are right: 10 + the leftover = ?" }));
  const step3Input = el("input", { type: "number", class: "count-input maketen-input" });
  const step3CheckBtn = button("✅ Check", null, "next");
  const step3Feedback = el("span", { class: "maketen-step-feedback" });
  step3Row.appendChild(step3Input);
  step3Row.appendChild(step3CheckBtn);
  step3Row.appendChild(step3Feedback);
  restWrap.appendChild(step3Row);

  const doneMsg = el("div", { class: "score-msg maketen-done" });
  restWrap.appendChild(doneMsg);

  function handleChoose(val) {
    if (val === p.smaller) {
      chooseWrap.classList.add("maketen-hidden");
      restWrap.classList.remove("maketen-hidden");
      // Built only once restWrap is actually visible -- creating it while still hidden
      // (display:none) measures its canvas at 0x0 and leaves it permanently unusable.
      scratchpadSlot.appendChild(createScratchpad(() => {}));
    } else {
      chooseFeedback.textContent = `Not quite -- ${p.bigger} is already close to 10, so keep it whole and split ${p.smaller} instead.`;
      chooseFeedback.className = "maketen-step-feedback maketen-step-wrong";
    }
  }

  let activeSide = null; // "left" | "right" | null

  function openPicker(side) {
    activeSide = side;
    pickerLabel.textContent = side === "left"
      ? `How many more does ${p.bigger} need to make 10?`
      : `${p.smaller} − ${p.needed} = what's left over?`;
    pickerWrap.classList.remove("maketen-hidden");
    pickerWrap.scrollIntoView({ block: "nearest" });
  }

  leftBox.addEventListener("click", () => { if (!leftBox.classList.contains("maketen-box-correct")) openPicker("left"); });
  rightBox.addEventListener("click", () => { if (!rightBox.classList.contains("maketen-box-correct")) openPicker("right"); });

  function handlePick(n) {
    if (!activeSide) return;
    const box = activeSide === "left" ? leftBox : rightBox;
    const expected = activeSide === "left" ? p.needed : p.leftover;
    if (n === expected) {
      box.textContent = String(n);
      box.classList.add("maketen-box-correct");
      pickerWrap.classList.add("maketen-hidden");
      activeSide = null;
      if (leftBox.classList.contains("maketen-box-correct") && rightBox.classList.contains("maketen-box-correct")) {
        step3Row.classList.remove("maketen-hidden");
        step3Input.focus();
      }
    } else {
      const wrongBtn = pickerBtns[n - 1];
      wrongBtn.classList.add("choice-wrong");
      setTimeout(() => wrongBtn.classList.remove("choice-wrong"), 400);
    }
  }

  function checkStep3() {
    const val = parseInt(step3Input.value, 10);
    if (val === p.sum) {
      step3Input.disabled = true;
      step3CheckBtn.disabled = true;
      step3Feedback.textContent = `✅ 10 + ${p.leftover} = ${p.sum}`;
      step3Feedback.className = "maketen-step-feedback maketen-step-correct";
      doneMsg.textContent = `🎉 ${p.bigger} + ${p.smaller} = ${p.sum}!`;
      onComplete();
    } else {
      step3Feedback.textContent = "Not quite, try again!";
      step3Feedback.className = "maketen-step-feedback maketen-step-wrong";
      step3Input.value = "";
      step3Input.focus();
    }
  }
  step3CheckBtn.addEventListener("click", checkStep3);
  step3Input.addEventListener("keydown", (e) => { if (e.key === "Enter") checkStep3(); });

  return wrap;
}

function showMakeTenGame() {
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner("🔟 Make 10 to Add"));

  const top = el("div", { class: "quiz-top" });
  const scoreLabel = el("span", { text: "⭐ Solved: 0" });
  top.appendChild(scoreLabel);
  top.appendChild(button("◀ Back", showMiniGames, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card maketen-card" });
  root.appendChild(card);

  let score = 0;

  function nextProblem() {
    const p = makeTenProblem();
    card.innerHTML = "";
    card.appendChild(el("div", { class: "prompt maketen-equation", text: `${p.first} + ${p.second} = ?` }));

    const nextBtn = button("▶ Next Problem", () => { score++; scoreLabel.textContent = `⭐ Solved: ${score}`; nextProblem(); }, "playagain");
    nextBtn.classList.add("maketen-hidden");

    card.appendChild(buildMakeTenInteractive(p, () => nextBtn.classList.remove("maketen-hidden")));
    card.appendChild(nextBtn);
  }

  nextProblem();
}

// -- Vertical Addition: classic stacked "4 / +5 / __" column addition, answered by tapping
// or dragging through a vertical 0-9 strip instead of typing on a keyboard. Two-digit sums
// get a second, smaller box for the tens digit (always 0 or 1 here, since both addends are
// single digits) in addition to the normal ones-digit box.
function digitsOfNum(n) { return String(n).split("").reverse().map(Number); } // ones-first

// Smallest/largest n-digit number, e.g. randOfDigits(3) -> a random 100-999; n=1 is 0-9
// (no leading-digit restriction, since a lone digit has nothing to be non-zero relative to).
function randOfDigits(n) {
  const lo = n <= 1 ? 0 : Math.pow(10, n - 1);
  const hi = Math.pow(10, n) - 1;
  return randInt(lo, hi);
}

// Shared right-to-left column arithmetic with carries chained between columns, used for both
// addition and multiplication. colFn(aDigit, i) computes column i's raw value (before that
// column's incoming carry is added) -- addition needs digitsB[i] (each operand contributes
// its own digit per column) while multiplication needs the *same* single-digit multiplier
// applied to every column of `a`, so the two can't share one "combine these two digits"
// signature. digitsA/digitsB/resultDigits are ones-first (index 0 = ones, index 1 = tens,
// ...). carryIn[i] is what carries INTO column i from column i-1 (0 for the ones column,
// since nothing carries into it).
function verticalColumnProblem(a, b, colFn) {
  const digitsA = digitsOfNum(a), digitsB = digitsOfNum(b);
  const numCols = digitsA.length;
  const resultDigits = [];
  const carryIn = [];
  let carry = 0;
  for (let i = 0; i < numCols; i++) {
    carryIn[i] = carry;
    const colVal = colFn(digitsA[i] || 0, i) + carry;
    resultDigits[i] = colVal % 10;
    carry = Math.floor(colVal / 10);
  }
  if (carry > 0) {
    resultDigits[numCols] = carry; // e.g. 99 + 99 needs a new hundreds digit
    carryIn[numCols] = carry; // carry box straddling the boundary into that new leading digit
  }
  return { a, b, digitsA, digitsB, resultDigits, carryIn };
}

function verticalAdditionProblem(digits) {
  // `digits` sets both addends' digit count (1 = single-digit + single-digit, used for
  // Preschool, where the engine naturally produces just one answer box normally and a second
  // (carry) box only when the sum reaches 10+, matching the classic worksheet). Defaults to 2
  // for callers with no age/difficulty context (the standalone Mini Game); quiz/curriculum
  // callers pass a digit count scaled to age/difficulty -- see vColumnDigits() in math.js.
  const d = digits || 2;
  const a = randOfDigits(d), b = randOfDigits(d);
  const digitsB = digitsOfNum(b);
  return verticalColumnProblem(a, b, (aDigit, i) => aDigit + (digitsB[i] || 0));
}

function verticalMultiplicationProblem(digits, multiplierHi) {
  const a = randOfDigits(digits || 2);
  const b = randInt(2, multiplierHi || 9); // multiplier stays single-digit-ish, applied to every column of a
  return verticalColumnProblem(a, b, (aDigit) => aDigit * b);
}

// A tap-or-drag digit box: tapping it reveals a vertical strip of 0-9; picking a digit is
// either a plain tap on one, or a press-and-drag down (or up) through the strip released on
// the desired number -- either way is just a pointerdown/pointerup pair on the strip.
function buildDragDigitBox(expected, variant, onCorrect) {
  const box = el("button", { class: `vadd-box${variant === "small" ? " vadd-box-small" : ""}`, type: "button", text: "?" });
  const strip = el("div", { class: "vadd-strip vadd-hidden" });
  const digitEls = [];
  for (let n = 0; n <= 9; n++) {
    const d = el("div", { class: "vadd-strip-digit", text: String(n) });
    strip.appendChild(d);
    digitEls.push(d);
  }

  let dragging = false;
  let highlightedIdx = null;
  let locked = false;

  function highlight(idx) {
    highlightedIdx = idx;
    digitEls.forEach((d, i) => d.classList.toggle("vadd-strip-active", i === idx));
  }

  function idxFromPoint(x, y) {
    const target = document.elementFromPoint(x, y);
    return digitEls.indexOf(target);
  }

  function closeStrip() {
    strip.classList.add("vadd-hidden");
    highlight(null);
  }

  function selectDigit(n) {
    if (n === expected) {
      box.textContent = String(n);
      box.classList.add("vadd-box-correct");
      locked = true;
      closeStrip();
      onCorrect();
    } else {
      box.classList.add("choice-wrong");
      setTimeout(() => box.classList.remove("choice-wrong"), 400);
      closeStrip();
    }
  }

  box.addEventListener("click", () => { if (!locked) strip.classList.remove("vadd-hidden"); });

  strip.addEventListener("pointerdown", (e) => {
    dragging = true;
    strip.setPointerCapture(e.pointerId);
    const i = idxFromPoint(e.clientX, e.clientY);
    if (i >= 0) highlight(i);
  });
  strip.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const i = idxFromPoint(e.clientX, e.clientY);
    if (i >= 0) highlight(i);
  });
  strip.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (highlightedIdx != null) selectDigit(highlightedIdx);
  });
  strip.addEventListener("pointercancel", () => { dragging = false; });

  return { box, strip };
}

// Builds one interactive column-arithmetic exercise (carry row, both operands, line, answer
// row) for a single problem `p` ({digitsA, digitsB, resultDigits, carryIn}) with the given
// sign ("+" or "x"). Calls onComplete() once every box is solved. Shared by the standalone
// Mini Game loop and by quiz/curriculum questions -- same reasoning as buildMakeTenInteractive.
function buildVerticalColumnInteractive(p, sign, onComplete) {
  const wrap = el("div", {});

  // Real CSS grid, one column per place value (plus a narrow sign column on the left) --
  // every row (carry, both operands, the line, the answer) shares the exact same column
  // boundaries, so nothing can drift out of alignment the way ad-hoc padding did.
  const totalCols = p.resultDigits.length; // may be one more than either operand's digit count (e.g. 99+99 -> 3)
  const grid = el("div", { class: "vadd-grid" });
  grid.style.gridTemplateColumns = `24px repeat(${totalCols}, 44px)`;
  wrap.appendChild(grid);

  const strips = [];
  let remaining = 0;
  let doneCalled = false;
  function markDone() {
    remaining--;
    if (remaining <= 0 && !doneCalled) { doneCalled = true; onComplete(); }
  }

  function cell(row, col, extraClass) {
    return el("div", { class: `vadd-cell${extraClass ? " " + extraClass : ""}`, style: `grid-row:${row}; grid-column:${col};` });
  }
  // Column `col` (1-indexed, 2..totalCols+1, left to right) holds place value `idx`
  // (0 = ones, 1 = tens, ...) -- the rightmost digit column is always the ones place.
  function placeIndex(col) { return totalCols - (col - 1); }

  // Row 1: carry-in indicators, shown above every column that actually receives a carry
  // from the column addition to its right (never above the ones column -- nothing carries
  // into it). This includes the leading overflow column when the sum reaches a new place
  // value (e.g. a 2-digit + 2-digit sum of 100+) -- same treatment as any other column, so
  // there's a small box between the hundreds and tens place too. Each one straddles the
  // boundary between its column and the one to its right (e.g. between the tens and ones
  // columns for a carry out of the ones column), not centered on either.
  for (let col = 2; col <= totalCols + 1; col++) {
    const idx = placeIndex(col);
    const carryVal = p.carryIn[idx];
    if (carryVal > 0) {
      remaining++;
      const ui = buildDragDigitBox(carryVal, "small", markDone);
      const c = cell(1, col, "vadd-carry-cell");
      c.appendChild(ui.box);
      grid.appendChild(c);
      strips.push(ui.strip);
    } else {
      grid.appendChild(cell(1, col));
    }
  }

  // Rows 2 & 3: the two operands, right-aligned into the same place-value columns, with the
  // sign living in its own sign column so it never shifts the digits themselves.
  grid.appendChild(cell(2, 1));
  const signCell = cell(3, 1, "vadd-sign");
  signCell.textContent = sign;
  grid.appendChild(signCell);
  for (const [row, digits] of [[2, p.digitsA], [3, p.digitsB]]) {
    for (let col = 2; col <= totalCols + 1; col++) {
      const idx = placeIndex(col);
      const c = cell(row, col, "vadd-num");
      if (idx < digits.length) c.textContent = String(digits[idx]);
      grid.appendChild(c);
    }
  }

  // Row 4: the line, spanning every column including the sign column.
  const line = el("div", { class: "vadd-line", style: `grid-row:4; grid-column:1 / ${totalCols + 2};` });
  grid.appendChild(line);

  // Row 5: the answer, one box per place value -- always required, even a "0" digit.
  grid.appendChild(cell(5, 1));
  for (let col = 2; col <= totalCols + 1; col++) {
    const idx = placeIndex(col);
    remaining++;
    const ui = buildDragDigitBox(p.resultDigits[idx], "normal", markDone);
    const c = cell(5, col);
    c.appendChild(ui.box);
    grid.appendChild(c);
    strips.push(ui.strip);
  }

  for (const strip of strips) wrap.appendChild(strip);
  return wrap;
}

// Shared standalone-game loop for column arithmetic where the carry flows left (addition,
// multiplication by a single digit) -- both produce the same problem shape and render
// identically; only the header, sign, and generator differ.
function showVerticalColumnGame({ headerTitle, sign, genFn }) {
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner(headerTitle));

  const top = el("div", { class: "quiz-top" });
  const scoreLabel = el("span", { text: "⭐ Solved: 0" });
  top.appendChild(scoreLabel);
  top.appendChild(button("◀ Back", showMiniGames, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card vadd-card" });
  root.appendChild(card);

  let score = 0;

  function nextProblem() {
    const p = genFn();
    card.innerHTML = "";
    card.appendChild(el("div", { class: "step-text maketen-intro", text: "Tap a box, then tap or drag to a number to fill it in." }));

    const nextBtn = button("▶ Next Problem", () => { score++; scoreLabel.textContent = `⭐ Solved: ${score}`; nextProblem(); }, "playagain");
    nextBtn.classList.add("maketen-hidden");

    card.appendChild(buildVerticalColumnInteractive(p, sign, () => nextBtn.classList.remove("maketen-hidden")));
    card.appendChild(nextBtn);
  }

  nextProblem();
}

function showVerticalAdditionGame() {
  showVerticalColumnGame({ headerTitle: "➕ Vertical Addition", sign: "+", genFn: verticalAdditionProblem });
}

function showVerticalMultiplicationGame() {
  showVerticalColumnGame({ headerTitle: "✖️ Vertical Multiplication", sign: "×", genFn: verticalMultiplicationProblem });
}

// Subtraction borrows rather than carries: instead of overflow flowing INTO a new column to
// the left, a column that can't subtract cleanly reduces the column to its LEFT by 1 (and
// adds 10 to itself). digitsA/digitsB/resultDigits are ones-first; borrowIn[i] = 1 if column
// i's own top digit had to be reduced by 1 to lend to the column on its right.
function verticalSubtractionProblem(digits) {
  const d = digits || 2;
  let a = randOfDigits(d), b = randOfDigits(d);
  if (a < b) [a, b] = [b, a]; // keep it to non-negative results, appropriate for this level
  const digitsA = digitsOfNum(a), digitsB = digitsOfNum(b);
  const numCols = digitsA.length; // a >= b, so a never has fewer digits than b
  const resultDigits = [];
  const borrowIn = [];
  let borrow = 0;
  for (let i = 0; i < numCols; i++) {
    borrowIn[i] = borrow;
    let topVal = (digitsA[i] || 0) - borrow;
    const botVal = digitsB[i] || 0;
    if (topVal < botVal) { topVal += 10; borrow = 1; } else { borrow = 0; }
    resultDigits[i] = topVal - botVal;
  }
  return { a, b, digitsA, digitsB, resultDigits, borrowIn };
}

// Builds one interactive subtraction exercise for a single problem `p` ({digitsA, digitsB,
// resultDigits, borrowIn}). Calls onComplete() once every box is solved. Mirrors
// buildVerticalColumnInteractive but with borrow (not carry) semantics -- see
// verticalSubtractionProblem for why the indicator box is centered, not straddled.
function buildVerticalSubtractionInteractive(p, onComplete) {
  const wrap = el("div", {});
  const totalCols = p.digitsA.length; // subtraction never needs an extra overflow column
  const grid = el("div", { class: "vadd-grid" });
  grid.style.gridTemplateColumns = `24px repeat(${totalCols}, 44px)`;
  wrap.appendChild(grid);

  const strips = [];
  let remaining = 0;
  let doneCalled = false;
  function markDone() {
    remaining--;
    if (remaining <= 0 && !doneCalled) { doneCalled = true; onComplete(); }
  }

  function cell(row, col, extraClass) {
    return el("div", { class: `vadd-cell${extraClass ? " " + extraClass : ""}`, style: `grid-row:${row}; grid-column:${col};` });
  }
  function placeIndex(col) { return totalCols - (col - 1); }

  // Row 1: borrow indicators, directly above the column whose OWN top digit had to be
  // reduced by 1 (unlike addition's carry, which straddles into a different column, this
  // modifies a digit that's already there, so it's centered, not shifted).
  for (let col = 2; col <= totalCols + 1; col++) {
    const idx = placeIndex(col);
    if (p.borrowIn[idx] === 1) {
      remaining++;
      const reduced = p.digitsA[idx] - 1;
      const ui = buildDragDigitBox(reduced, "small", markDone);
      const c = cell(1, col);
      c.appendChild(ui.box);
      grid.appendChild(c);
      strips.push(ui.strip);
    } else {
      grid.appendChild(cell(1, col));
    }
  }

  // Rows 2 & 3: minuend then subtrahend, right-aligned, "-" in its own sign column.
  grid.appendChild(cell(2, 1));
  const signCell = cell(3, 1, "vadd-sign");
  signCell.textContent = "-";
  grid.appendChild(signCell);
  for (const [row, digits] of [[2, p.digitsA], [3, p.digitsB]]) {
    for (let col = 2; col <= totalCols + 1; col++) {
      const idx = placeIndex(col);
      const c = cell(row, col, "vadd-num");
      if (idx < digits.length) c.textContent = String(digits[idx]);
      grid.appendChild(c);
    }
  }

  // Row 4: the line.
  const line = el("div", { class: "vadd-line", style: `grid-row:4; grid-column:1 / ${totalCols + 2};` });
  grid.appendChild(line);

  // Row 5: the answer, one box per place value.
  grid.appendChild(cell(5, 1));
  for (let col = 2; col <= totalCols + 1; col++) {
    const idx = placeIndex(col);
    remaining++;
    const ui = buildDragDigitBox(p.resultDigits[idx], "normal", markDone);
    const c = cell(5, col);
    c.appendChild(ui.box);
    grid.appendChild(c);
    strips.push(ui.strip);
  }

  for (const strip of strips) wrap.appendChild(strip);
  return wrap;
}

function showVerticalSubtractionGame() {
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner("➖ Vertical Subtraction"));

  const top = el("div", { class: "quiz-top" });
  const scoreLabel = el("span", { text: "⭐ Solved: 0" });
  top.appendChild(scoreLabel);
  top.appendChild(button("◀ Back", showMiniGames, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card vadd-card" });
  root.appendChild(card);

  let score = 0;

  function nextProblem() {
    const p = verticalSubtractionProblem();
    card.innerHTML = "";
    card.appendChild(el("div", { class: "step-text maketen-intro", text: "Tap a box, then tap or drag to a number to fill it in." }));

    const nextBtn = button("▶ Next Problem", () => { score++; scoreLabel.textContent = `⭐ Solved: ${score}`; nextProblem(); }, "playagain");
    nextBtn.classList.add("maketen-hidden");

    card.appendChild(buildVerticalSubtractionInteractive(p, () => nextBtn.classList.remove("maketen-hidden")));
    card.appendChild(nextBtn);
  }

  nextProblem();
}

function showAdditionTableMenu(opKey) {
  const op = ADDTABLE_OPS[opKey];
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner(`${op.icon} ${op.name} Table`));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", showMiniGames, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card" });
  const desc = opKey === "division"
    ? "Level 1: you're given the dividend and the divisor row — tap the matching cell in that row.\n" +
      "Level 2: same, but type in the quotient yourself instead of tapping.\n" +
      "Speed Round: answer as many as you can before time runs out!"
    : "Level 1: the full table is shown — tap the cell where the highlighted row and column meet.\n" +
      "Level 2: the table is blank — type in the answer yourself.\n" +
      "Speed Round: answer as many as you can before time runs out!";
  card.appendChild(el("div", { class: "step-text", text: desc }));
  root.appendChild(card);

  const col = el("div", { class: "addtable-menu-col" });
  col.appendChild(button("1️⃣ Level 1: Find the Cell", () => showAddTableLevel1(opKey), "start"));
  col.appendChild(button("2️⃣ Level 2: Type the Answer", () => showAddTableLevel2(opKey), "start"));
  col.appendChild(button("⏱️ Speed Round", () => showAddTableSpeedRound(opKey), "start"));
  root.appendChild(col);
}

// Builds the 11x11 header+grid DOM shared by Level 1 and Level 2. `showValues` pre-fills
// every data cell with its value (Level 1); otherwise cells start blank (Level 2). `tappable`
// adds pointer styling/cursor to data cells (Level 1 only -- Level 2 answers via typing).
function buildAddTableGrid(op, showValues, tappable) {
  const grid = el("div", { class: "addtable-grid" });
  grid.appendChild(el("div", { class: "addtable-cell addtable-corner", text: op.symbol }));

  const colHeaderEls = {};
  for (let c = 1; c <= ADDTABLE_SIZE; c++) {
    const headerCell = el("div", { class: "addtable-cell addtable-header addtable-header-col", text: op.colLabel(c) });
    grid.appendChild(headerCell);
    colHeaderEls[c] = headerCell;
  }

  const rowHeaderEls = {};
  const cellEls = {};
  for (let r = 1; r <= ADDTABLE_SIZE; r++) {
    const rowHeader = el("div", { class: "addtable-cell addtable-header addtable-header-row", text: op.rowLabel(r) });
    grid.appendChild(rowHeader);
    rowHeaderEls[r] = rowHeader;
    for (let c = 1; c <= ADDTABLE_SIZE; c++) {
      const val = op.cellValue(r, c);
      const cellClass = "addtable-cell addtable-data" + (tappable ? " addtable-data-tappable" : "");
      const cell = el("div", { class: cellClass, text: showValues ? String(val) : "" });
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);
      grid.appendChild(cell);
      cellEls[`${r}-${c}`] = cell;
    }
  }
  return { grid, cellEls, rowHeaderEls, colHeaderEls };
}

function clearAddTableHighlight(rowHeaderEls, colHeaderEls) {
  Object.values(rowHeaderEls).forEach((e) => e.classList.remove("addtable-highlight"));
  Object.values(colHeaderEls).forEach((e) => e.classList.remove("addtable-highlight"));
}

function shuffledAddTableTargets() {
  const targets = [];
  for (let r = 1; r <= ADDTABLE_SIZE; r++) {
    for (let c = 1; c <= ADDTABLE_SIZE; c++) targets.push([r, c]);
  }
  return shuffle(targets);
}

// -- Level 1: tap the intersecting cell in a fully-filled table --------------------------
function showAddTableLevel1(opKey) {
  const op = ADDTABLE_OPS[opKey];
  const isDivision = opKey === "division";
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner(`${op.icon} Find the Cell`));
  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", () => showAdditionTableMenu(opKey), "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card addtable-card" });
  const promptEl = el("div", { class: "prompt" });
  const scoreEl = el("div", { class: "note" });
  card.appendChild(promptEl);
  card.appendChild(scoreEl);

  const { grid, cellEls, rowHeaderEls, colHeaderEls } = buildAddTableGrid(op, true, true);
  card.appendChild(grid);
  root.appendChild(card);

  const remaining = shuffledAddTableTargets();
  const total = remaining.length;
  let target = null;
  let score = 0;

  function nextTarget() {
    clearAddTableHighlight(rowHeaderEls, colHeaderEls);
    if (remaining.length === 0) {
      promptEl.textContent = "🎉 You found every cell!";
      scoreEl.textContent = `Final score: ${score} / ${total}`;
      return;
    }
    target = remaining[remaining.length - 1];
    const [r, c] = target;
    rowHeaderEls[r].classList.add("addtable-highlight");
    // Division only reveals the divisor (row) -- highlighting the quotient (column) too
    // would make this an identical task to Multiplication's "tap where they meet". Instead
    // the prompt states the dividend directly and the kid searches the row for that value,
    // which is a genuinely different (and genuinely division) task.
    if (!isDivision) colHeaderEls[c].classList.add("addtable-highlight");
    promptEl.textContent = isDivision ? op.typePrompt(r, c) : op.findPrompt(r, c);
    scoreEl.textContent = `Found: ${score} / ${total}`;
  }

  Object.values(cellEls).forEach((cell) => {
    cell.addEventListener("click", () => {
      if (!target || cell.classList.contains("addtable-data-solved")) return;
      const r = Number(cell.dataset.row), c = Number(cell.dataset.col);
      if (r === target[0] && c === target[1]) {
        cell.classList.add("addtable-data-solved");
        remaining.pop();
        score++;
        nextTarget();
      } else {
        cell.classList.add("addtable-wrong-flash");
        setTimeout(() => cell.classList.remove("addtable-wrong-flash"), 400);
      }
    });
  });

  nextTarget();
}

// -- Level 2: blank table, type the answer -------------------------------------------------
function showAddTableLevel2(opKey) {
  const op = ADDTABLE_OPS[opKey];
  const isDivision = opKey === "division";
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner(`${op.icon} Type the Answer`));
  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", () => showAdditionTableMenu(opKey), "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card addtable-card" });
  const promptEl = el("div", { class: "prompt" });
  const scoreEl = el("div", { class: "note" });
  card.appendChild(promptEl);
  card.appendChild(scoreEl);

  const inputRow = el("div", { class: "count-row addtable-input-row" });
  const answerInput = el("input", { type: "number", class: "count-input addtable-answer-input" });
  const checkBtn = button("✅ Check", null, "start");
  inputRow.appendChild(answerInput);
  inputRow.appendChild(checkBtn);
  card.appendChild(inputRow);

  const feedbackEl = el("div", { class: "feedback" });
  card.appendChild(feedbackEl);

  const { grid, cellEls, rowHeaderEls, colHeaderEls } = buildAddTableGrid(op, false, false);
  card.appendChild(grid);
  root.appendChild(card);

  const remaining = shuffledAddTableTargets();
  const total = remaining.length;
  let target = null;
  let score = 0;

  function nextTarget() {
    clearAddTableHighlight(rowHeaderEls, colHeaderEls);
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    answerInput.value = "";
    if (remaining.length === 0) {
      promptEl.textContent = "🎉 You filled the whole table!";
      scoreEl.textContent = `Final score: ${score} / ${total}`;
      answerInput.disabled = true;
      checkBtn.disabled = true;
      return;
    }
    target = remaining[remaining.length - 1];
    const [r, c] = target;
    rowHeaderEls[r].classList.add("addtable-highlight");
    // Division only reveals the divisor (row) -- highlighting the quotient (column) too
    // would hand the kid the answer, since typePrompt's dividend already comes from r*c.
    if (!isDivision) colHeaderEls[c].classList.add("addtable-highlight");
    promptEl.textContent = op.typePrompt(r, c);
    scoreEl.textContent = `Filled: ${score} / ${total}`;
    answerInput.focus();
  }

  function submit() {
    if (!target) return;
    const val = parseInt(answerInput.value, 10);
    const [r, c] = target;
    const expected = isDivision ? c : op.cellValue(r, c);
    if (val === expected) {
      const cell = cellEls[`${r}-${c}`];
      cell.textContent = isDivision ? String(op.cellValue(r, c)) : String(val);
      cell.classList.add("addtable-data-solved");
      feedbackEl.textContent = "Correct! ✅";
      feedbackEl.className = "feedback feedback-correct";
      remaining.pop();
      score++;
      setTimeout(nextTarget, 500);
    } else {
      feedbackEl.textContent = "Not quite, try again!";
      feedbackEl.className = "feedback feedback-wrong";
      answerInput.value = "";
      answerInput.focus();
    }
  }

  checkBtn.addEventListener("click", submit);
  answerInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });

  nextTarget();
}

// -- Speed Round: multiple-choice against a countdown timer -------------------------------
function showAddTableSpeedRound(opKey) {
  const op = ADDTABLE_OPS[opKey];
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner(`⏱️ ${op.name} Speed Round`));

  const top = el("div", { class: "quiz-top" });
  const timerLabel = el("span", { text: "⏱️ 60s" });
  const scoreLabel = el("span", { text: "⭐ Score: 0" });
  top.appendChild(timerLabel);
  top.appendChild(scoreLabel);
  top.appendChild(button("🚪 Quit", () => { stopTimer(); showAdditionTableMenu(opKey); }, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card" });
  const promptEl = el("div", { class: "prompt" });
  card.appendChild(promptEl);
  root.appendChild(card);

  const choicesGrid = el("div", { class: "choices-grid" });
  root.appendChild(choicesGrid);

  const feedbackEl = el("div", { class: "feedback" });
  root.appendChild(feedbackEl);

  let score = 0;
  let timeLeft = 60;
  let timerId = null;
  let acceptingInput = true;

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function endRound() {
    stopTimer();
    clearRoot();
    root.appendChild(headerBanner("⏱️ Time's Up!"));
    const resultCard = el("div", { class: "card" });
    resultCard.appendChild(el("div", { class: "score-line", text: `Final Score: ${score}` }));
    resultCard.appendChild(el("div", { class: "score-msg", text:
      score >= 20 ? "Amazing speed! 🌟" : score >= 10 ? "Great job! 🎉" : "Nice try — play again to beat it!" }));
    root.appendChild(resultCard);
    const btnRow = el("div", { class: "next-row" });
    btnRow.appendChild(button("🔄 Play Again", () => showAddTableSpeedRound(opKey), "playagain"));
    btnRow.appendChild(button("◀ Back", () => showAdditionTableMenu(opKey), "next"));
    root.appendChild(btnRow);
  }

  function nextProblem() {
    acceptingInput = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    const r = randInt(1, ADDTABLE_SIZE), c = randInt(1, ADDTABLE_SIZE);
    const answer = op.speedAnswer(r, c);
    promptEl.textContent = op.speedPrompt(r, c);
    const [lo, hi] = op.choiceRange;
    const choices = numericChoices(answer, lo, hi);
    choicesGrid.innerHTML = "";
    choices.forEach((val) => {
      const btn = button(String(val), null, "choice");
      btn.addEventListener("click", () => {
        if (!acceptingInput || !timerId) return;
        acceptingInput = false;
        if (val === answer) {
          btn.classList.add("choice-correct");
          score++;
          scoreLabel.textContent = `⭐ Score: ${score}`;
        } else {
          btn.classList.add("choice-wrong");
        }
        setTimeout(nextProblem, 500);
      });
      choicesGrid.appendChild(btn);
    });
  }

  timerId = setInterval(() => {
    timeLeft--;
    timerLabel.textContent = `⏱️ ${timeLeft}s`;
    if (timeLeft <= 0) endRound();
  }, 1000);

  nextProblem();
}

// -- Answer Hunt: a persistent 5x5 grid of 25 numbers, where every number is the answer to
// one of this round's 25 formulas -- not decoys. One formula is shown at a time; solve it and
// tap its answer anywhere in the grid, and the next formula appears, targeting a different
// still-unfound number. The round keeps generating formulas until every one of the 25 numbers
// has been tapped out. Standalone Mini Game only, with its own 3-level difficulty (independent
// of the app's global age/difficulty system, since this isn't wired into the quiz/curriculum).
const NUMBER_GRID_SIZE = 5;
const NUMBER_GRID_LEVELS = {
  easy: { label: "🟢 Easy", ops: ["+", "-"], addMax: 20 },
  medium: { label: "🟡 Medium", ops: ["+", "-", "×"], addMax: 50, mulMax: 10 },
  hard: { label: "🔴 Hard", ops: ["+", "-", "×", "÷"], addMax: 100, mulMax: 12 },
};

function numberGridFormula(levelKey) {
  const level = NUMBER_GRID_LEVELS[levelKey];
  const op = choice(level.ops);
  let text, answer;
  if (op === "+") {
    const a = randInt(1, level.addMax), b = randInt(1, level.addMax);
    answer = a + b; text = `${a} + ${b}`;
  } else if (op === "-") {
    let a = randInt(1, level.addMax), b = randInt(1, level.addMax);
    if (a < b) [a, b] = [b, a];
    answer = a - b; text = `${a} - ${b}`;
  } else if (op === "×") {
    const a = randInt(2, level.mulMax), b = randInt(2, level.mulMax);
    answer = a * b; text = `${a} × ${b}`;
  } else {
    const divisor = randInt(2, level.mulMax), quotient = randInt(2, level.mulMax);
    answer = quotient; text = `${divisor * quotient} ÷ ${divisor}`;
  }
  return { prompt: `${text} = ?`, speak: `${text.replace("×", "times").replace("÷", "divided by")} equals what?`, answer };
}

// Pre-generates a full round's worth of formulas (one per grid cell) with guaranteed-unique
// answers, so every grid number corresponds to exactly one formula and there's never an
// ambiguous "which one did they mean" tap. Capped retries plus a guaranteed-terminating
// fallback (never actually reachable at these ranges, but keeps this from ever hanging even if
// a level's range were narrowed too far to fit 25 unique answers in the future).
function numberGridRound(levelKey) {
  const size = NUMBER_GRID_SIZE * NUMBER_GRID_SIZE;
  const formulas = [];
  const seenAnswers = new Set();
  let tries = 0;
  while (formulas.length < size && tries < 3000) {
    tries++;
    const f = numberGridFormula(levelKey);
    if (seenAnswers.has(f.answer)) continue;
    seenAnswers.add(f.answer);
    formulas.push(f);
  }
  let nudge = 0;
  while (formulas.length < size) {
    let answer = 1000 + nudge++;
    while (seenAnswers.has(answer)) answer++;
    seenAnswers.add(answer);
    formulas.push({ prompt: `${answer} = ?`, speak: String(answer), answer });
  }
  return shuffle(formulas);
}

function showNumberGridGame() {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("🔍 Answer Hunt", "Solve each formula, then tap its answer in the grid"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", showMiniGames, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "step-text", text:
    "Every number in the 5x5 grid is the answer to one of 25 formulas. Clear the whole board!" }));
  const levelRow = el("div", { class: "chip-row" });
  for (const key of ["easy", "medium", "hard"]) {
    levelRow.appendChild(button(NUMBER_GRID_LEVELS[key].label, () => startNumberGridRound(key), "start"));
  }
  card.appendChild(levelRow);
  root.appendChild(card);
}

function startNumberGridRound(levelKey) {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("🔍 Answer Hunt", NUMBER_GRID_LEVELS[levelKey].label));

  const size = NUMBER_GRID_SIZE * NUMBER_GRID_SIZE;
  const top = el("div", { class: "quiz-top" });
  const scoreLabel = el("span", { text: `⭐ Found: 0 / ${size}` });
  top.appendChild(scoreLabel);
  top.appendChild(button("◀ Back", showNumberGridGame, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card" });
  root.appendChild(card);

  const formulas = numberGridRound(levelKey);
  let formulaIdx = 0;
  let found = 0;

  const promptEl = el("div", { class: "prompt" });
  const readAloudBtn = button("🔊 Read Aloud", () => speak(formulas[formulaIdx].speak), "next");
  readAloudBtn.classList.add("read-aloud-btn");
  const introEl = el("div", { class: "step-text maketen-intro", text: "Work out the answer, then tap it in the grid!" });
  const gridEl = el("div", { class: "numgrid-grid" });

  card.appendChild(promptEl);
  card.appendChild(readAloudBtn);
  card.appendChild(introEl);
  card.appendChild(gridEl);

  function renderFormula() {
    promptEl.textContent = formulas[formulaIdx].prompt;
  }

  function showRoundComplete() {
    card.innerHTML = "";
    card.appendChild(el("div", { class: "lesson-section-title", text: "🎉 Board Cleared!" }));
    card.appendChild(el("div", { class: "score-msg", text: `You found all ${size} answers!` }));
    const btnRow = el("div", { class: "next-row" });
    btnRow.appendChild(button("🔄 Play Again", () => startNumberGridRound(levelKey), "playagain"));
    btnRow.appendChild(button("◀ Back", showNumberGridGame, "next"));
    card.appendChild(btnRow);
  }

  // A wrong tap is only wrong for the CURRENT formula -- that same number may legitimately be
  // a later formula's answer (every one of the 25 numbers belongs to some formula this round),
  // so wrong taps just flash and stay tappable rather than getting disabled.
  formulas.forEach((f) => {
    const cell = el("button", { class: "numgrid-cell", type: "button", text: String(f.answer) });
    cell.addEventListener("click", () => {
      if (cell.disabled) return;
      if (f.answer === formulas[formulaIdx].answer) {
        cell.disabled = true;
        cell.classList.add("numgrid-cell-correct");
        found++;
        scoreLabel.textContent = `⭐ Found: ${found} / ${size}`;
        formulaIdx++;
        if (found >= size) showRoundComplete();
        else renderFormula();
      } else {
        cell.classList.add("numgrid-cell-wrong");
        setTimeout(() => cell.classList.remove("numgrid-cell-wrong"), 400);
      }
    });
    gridEl.appendChild(cell);
  });

  renderFormula();
}
