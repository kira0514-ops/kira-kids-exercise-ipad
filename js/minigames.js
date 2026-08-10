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
  for (const opKey of Object.keys(ADDTABLE_OPS)) {
    const op = ADDTABLE_OPS[opKey];
    grid.appendChild(button(`${op.icon} ${op.name} Table`, () => showAdditionTableMenu(opKey), "choice"));
  }
  root.appendChild(grid);
}

// -- Make 10 to Add: work the decompose-to-make-ten strategy out step by step, typing each
// piece in yourself, instead of just picking the final answer from a multiple-choice list.
function makeTenProblem() {
  const bigger = choice([7, 8, 9]);
  const needed = 10 - bigger;
  const smaller = randInt(needed + 1, 9); // +1 so there's always a real leftover to solve for
  // Which addend is closer to 10 (and so gets decomposed) shouldn't always land in the same
  // spot in the equation -- e.g. "3 + 9" should split the 3, same as "9 + 3" would.
  const anchorFirst = Math.random() < 0.5;
  return {
    bigger, smaller, needed, leftover: smaller - needed, sum: bigger + smaller,
    first: anchorFirst ? bigger : smaller,
    second: anchorFirst ? smaller : bigger,
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
  let p;

  function stepRow(labelText) {
    const row = el("div", { class: "count-row maketen-step" });
    row.appendChild(el("span", { class: "maketen-step-label", text: labelText }));
    const input = el("input", { type: "number", class: "count-input maketen-input" });
    const checkBtn = button("✅ Check", null, "next");
    const feedback = el("span", { class: "maketen-step-feedback" });
    row.appendChild(input);
    row.appendChild(checkBtn);
    row.appendChild(feedback);
    return { row, input, checkBtn, feedback };
  }

  function nextProblem() {
    p = makeTenProblem();
    card.innerHTML = "";

    card.appendChild(el("div", { class: "prompt maketen-equation", text: `${p.first} + ${p.second} = ?` }));

    // The kid identifies which addend to decompose themselves first -- reminded, if they
    // get it wrong, that the one already close to 10 stays whole and the other one splits.
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
    card.appendChild(chooseWrap);

    const restWrap = el("div", { class: "maketen-hidden" });
    card.appendChild(restWrap);

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

    restWrap.appendChild(createScratchpad(() => {}));

    const step3 = stepRow(`Once both boxes are right: 10 + the leftover = ?`);
    step3.row.classList.add("maketen-hidden");
    restWrap.appendChild(step3.row);

    const doneMsg = el("div", { class: "score-msg maketen-done" });
    restWrap.appendChild(doneMsg);
    const nextBtn = button("▶ Next Problem", () => { score++; scoreLabel.textContent = `⭐ Solved: ${score}`; nextProblem(); }, "playagain");
    nextBtn.classList.add("maketen-hidden");
    restWrap.appendChild(nextBtn);

    function handleChoose(val) {
      if (val === p.smaller) {
        chooseWrap.classList.add("maketen-hidden");
        restWrap.classList.remove("maketen-hidden");
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
          step3.row.classList.remove("maketen-hidden");
          step3.input.focus();
        }
      } else {
        const wrongBtn = pickerBtns[n - 1];
        wrongBtn.classList.add("choice-wrong");
        setTimeout(() => wrongBtn.classList.remove("choice-wrong"), 400);
      }
    }

    function checkStep3() {
      const val = parseInt(step3.input.value, 10);
      if (val === p.sum) {
        step3.input.disabled = true;
        step3.checkBtn.disabled = true;
        step3.feedback.textContent = `✅ 10 + ${p.leftover} = ${p.sum}`;
        step3.feedback.className = "maketen-step-feedback maketen-step-correct";
        doneMsg.textContent = `🎉 ${p.bigger} + ${p.smaller} = ${p.sum}!`;
        nextBtn.classList.remove("maketen-hidden");
      } else {
        step3.feedback.textContent = "Not quite, try again!";
        step3.feedback.className = "maketen-step-feedback maketen-step-wrong";
        step3.input.value = "";
        step3.input.focus();
      }
    }
    step3.checkBtn.addEventListener("click", checkStep3);
    step3.input.addEventListener("keydown", (e) => { if (e.key === "Enter") checkStep3(); });
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
