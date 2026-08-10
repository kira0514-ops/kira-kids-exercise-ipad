// Mini Math Games hub. Currently just the Addition Table game (three modes: tap-the-cell,
// type-the-answer, and a timed speed round), built as its own section separate from the
// quiz/lesson/curriculum flows so more mini games can be added here later.

const ADDTABLE_SIZE = 10;

function showMiniGames() {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("🎮 Mini Math Games", "Quick, playful games to practice math skills"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const grid = el("div", { class: "lesson-topic-grid" });
  grid.appendChild(button("➕ Addition Table", showAdditionTableMenu, "choice"));
  root.appendChild(grid);
}

function showAdditionTableMenu() {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("➕ Addition Table"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", showMiniGames, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card" });
  card.appendChild(el("div", { class: "step-text", text:
    "Level 1: the full table is shown — tap the cell where the highlighted row and column meet.\n" +
    "Level 2: the table is blank — type in the sum yourself.\n" +
    "Speed Round: answer as many as you can before time runs out!" }));
  root.appendChild(card);

  const col = el("div", { class: "addtable-menu-col" });
  col.appendChild(button("1️⃣ Level 1: Find the Cell", showAddTableLevel1, "start"));
  col.appendChild(button("2️⃣ Level 2: Type the Answer", showAddTableLevel2, "start"));
  col.appendChild(button("⏱️ Speed Round", showAddTableSpeedRound, "start"));
  root.appendChild(col);
}

// Builds the 11x11 header+grid DOM shared by Level 1 and Level 2. `showValues` pre-fills
// every data cell with its sum (Level 1); otherwise cells start blank (Level 2). `tappable`
// adds pointer styling/cursor to data cells (Level 1 only -- Level 2 answers via typing).
function buildAddTableGrid(showValues, tappable) {
  const grid = el("div", { class: "addtable-grid" });
  grid.appendChild(el("div", { class: "addtable-cell addtable-corner", text: "+" }));

  const colHeaderEls = {};
  for (let c = 1; c <= ADDTABLE_SIZE; c++) {
    const headerCell = el("div", { class: "addtable-cell addtable-header", text: String(c) });
    grid.appendChild(headerCell);
    colHeaderEls[c] = headerCell;
  }

  const rowHeaderEls = {};
  const cellEls = {};
  for (let r = 1; r <= ADDTABLE_SIZE; r++) {
    const rowHeader = el("div", { class: "addtable-cell addtable-header", text: String(r) });
    grid.appendChild(rowHeader);
    rowHeaderEls[r] = rowHeader;
    for (let c = 1; c <= ADDTABLE_SIZE; c++) {
      const val = r + c;
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
function showAddTableLevel1() {
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner("➕ Find the Cell"));
  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", showAdditionTableMenu, "next"));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const card = el("div", { class: "card addtable-card" });
  const promptEl = el("div", { class: "prompt" });
  const scoreEl = el("div", { class: "note" });
  card.appendChild(promptEl);
  card.appendChild(scoreEl);

  const { grid, cellEls, rowHeaderEls, colHeaderEls } = buildAddTableGrid(true, true);
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
    colHeaderEls[c].classList.add("addtable-highlight");
    promptEl.textContent = `Tap where row ${r} and column ${c} meet!`;
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

// -- Level 2: blank table, type the sum ---------------------------------------------------
function showAddTableLevel2() {
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner("➕ Type the Answer"));
  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("◀ Back", showAdditionTableMenu, "next"));
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

  const { grid, cellEls, rowHeaderEls, colHeaderEls } = buildAddTableGrid(false, false);
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
    colHeaderEls[c].classList.add("addtable-highlight");
    promptEl.textContent = `${r} + ${c} = ?`;
    scoreEl.textContent = `Filled: ${score} / ${total}`;
    answerInput.focus();
  }

  function submit() {
    if (!target) return;
    const val = parseInt(answerInput.value, 10);
    const [r, c] = target;
    if (val === r + c) {
      const cell = cellEls[`${r}-${c}`];
      cell.textContent = String(val);
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
function showAddTableSpeedRound() {
  applyThemeVars();
  clearRoot();

  root.appendChild(headerBanner("⏱️ Addition Speed Round"));

  const top = el("div", { class: "quiz-top" });
  const timerLabel = el("span", { text: "⏱️ 60s" });
  const scoreLabel = el("span", { text: "⭐ Score: 0" });
  top.appendChild(timerLabel);
  top.appendChild(scoreLabel);
  top.appendChild(button("🚪 Quit", () => { stopTimer(); showAdditionTableMenu(); }, "quit"));
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
    btnRow.appendChild(button("🔄 Play Again", showAddTableSpeedRound, "playagain"));
    btnRow.appendChild(button("◀ Back", showAdditionTableMenu, "next"));
    root.appendChild(btnRow);
  }

  function nextProblem() {
    acceptingInput = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    const r = randInt(1, ADDTABLE_SIZE), c = randInt(1, ADDTABLE_SIZE);
    const answer = r + c;
    promptEl.textContent = `${r} + ${c} = ?`;
    const choices = numericChoices(answer, 2, ADDTABLE_SIZE * 2);
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
