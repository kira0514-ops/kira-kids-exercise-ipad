// Written math ("Show Your Work"): NYS-style constructed-response math. The child types a final
// answer, then either shows her work (number sentences) or explains how she knows, and the app
// auto-grades 0-2 like the short-response rubric (2 = every required part is right, 1 = one part).
// It is a Math topic ("Show Your Work"), not a new menu section; answers are logged to the
// Parent Report's Written Answers tab (kind: "math") for the parent to grade.

// ---------- matching helpers ----------
function wmNorm(s) {
  return String(s).toLowerCase()
    .replace(/[×✕✖*]/g, "x").replace(/\btimes\b/g, "x")
    .replace(/[−–—]/g, "-").replace(/÷/g, "/").replace(/\bdivided by\b/g, "/")
    .replace(/(\d),(?=\d{3})/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s*([x+\-\/=<>])\s*/g, "$1")
    .trim();
}
// Whole numbers must match as whole numbers ("43" must not match "143"); anything else is a substring.
function wmHas(textNorm, opt) {
  const o = wmNorm(opt);
  if (!o) return false;
  if (/^\d+$/.test(o)) return new RegExp(`(^|[^0-9.])${o}($|[^0-9])`).test(textNorm);
  return textNorm.includes(o);
}
function wmYesNo(text, wantYes) {
  const t = String(text).toLowerCase();
  const yes = /\b(yes|correct|right|true|agree)\b/.test(t) && !/\b(not correct|incorrect|isn't|is not|wrong|false|disagree)\b/.test(t);
  const no = /\b(no|not|incorrect|wrong|false|isn't|disagree)\b/.test(t) && !/\byes\b/.test(t);
  return wantYes ? yes : no;
}

function gradeMath(item, answerText, workText, explainText) {
  const a = wmNorm(answerText), w = wmNorm(workText), e = wmNorm(explainText);
  const answerOk = item.yesNo != null ? wmYesNo(answerText, item.yesNo) : (item.answerAny || []).some((o) => wmHas(a, o));
  const needWork = item.needs.includes("work"), needExplain = item.needs.includes("explain");
  const groupsHit = (groups, t) => groups.filter((g) => g.any.some((o) => wmHas(t, o))).length;
  const workOk = !needWork || groupsHit(item.workGroups, w) >= (item.workNeed || item.workGroups.length);
  const explainWords = String(explainText).trim().split(/\s+/).filter(Boolean).length;
  const explainOk = !needExplain || (explainWords >= 4 && groupsHit(item.explainGroups, e) >= (item.explainNeed || 1));
  const parts = [answerOk];
  if (needWork) parts.push(workOk);
  if (needExplain) parts.push(explainOk);
  const passed = parts.filter(Boolean).length;
  const score = passed === parts.length ? 2 : passed >= 1 ? 1 : 0;
  return { score, answerOk, workOk, explainOk, needWork, needExplain };
}

// ---------- item families ----------
function wmWithChart(item, chart) { item.chart = chart; return item; }

function wmTwoStep(L) {
  const pool = NYS_STORIES_BUILTIN.concat(NYS_STORIES_EXTRA).filter((st) => L >= 2 || st.form !== "add_div");
  const f = nysFillStory(choice(pool), L);
  return {
    key: `two:${f.text}`, needs: ["answer", "work"],
    question: `${f.text}\n\nShow your work.`,
    answerAny: [String(f.ans)],
    workGroups: f.groups.map((any) => ({ any })),
    model: `${f.steps.join(". ")}. The answer is ${f.ans}.`,
  };
}
function wmComposite(L) {
  const l1 = randInt(3, 9), w1 = randInt(2, 6), l2 = randInt(2, 7), w2 = randInt(2, 5);
  const a1 = l1 * w1, a2 = l2 * w2;
  const unit = choice(["feet", "meters", "inches"]);
  const what = choice(["rug", "garden", "patio", "poster"]);
  return {
    key: `comp:${l1}x${w1}+${l2}x${w2}:${unit}:${what}`, needs: ["answer", "work"],
    question: `A ${what} is made of two rectangles. One rectangle is ${l1} ${unit} long and ${w1} ${unit} wide. The other is ${l2} ${unit} long and ${w2} ${unit} wide. What is the total area of the ${what}?\n\nShow your work.`,
    answerAny: [String(a1 + a2)],
    workGroups: [{ any: [`${l1}x${w1}`, `${w1}x${l1}`, String(a1)] }, { any: [`${l2}x${w2}`, `${w2}x${l2}`, String(a2)] }],
    model: `${l1} × ${w1} = ${a1}. ${l2} × ${w2} = ${a2}. ${a1} + ${a2} = ${a1 + a2} square ${unit}.`,
  };
}
function wmPerimeter(L) {
  const l = randInt(5, 15), w = randInt(3, l - 1), P = 2 * (l + w);
  const unit = choice(["cm", "m", "inches", "feet"]);
  return {
    key: `per:${P}:${l}:${unit}`, needs: ["answer", "work"],
    question: `The perimeter of a rectangle is ${P} ${unit}. The length is ${l} ${unit}. What is the width?\n\nShow your work.`,
    answerAny: [String(w)],
    workGroups: [{ any: [String(2 * l), String(P / 2), `${P}-${2 * l}`, `${l}+${l}`, String(P - 2 * l)] }],
    model: `Two lengths: ${l} + ${l} = ${2 * l}. ${P} − ${2 * l} = ${P - 2 * l}. That is two widths, so ${P - 2 * l} ÷ 2 = ${w} ${unit}.`,
  };
}
function wmElapsed(L) {
  const h = randInt(1, 10), m = choice([20, 25, 30, 35, 40, 45, 50]);
  const toHour = 60 - m;
  const rest = choice([10, 15, 20, 25, 30, 35, 40]);
  const dur = toHour + rest;
  const act = choice(NYS_TIME_ACTIVITIES);
  const t1 = nysTime(h, m), t2 = nysTime(h + 1, rest);
  return {
    key: `el:${t1}:${t2}:${act}`, needs: ["answer", "work"],
    question: `${act} starts at ${t1} and ends at ${t2}. How many minutes does it last?\n\nShow how you found your answer.`,
    answerAny: [String(dur)],
    workGroups: [{ any: [String(toHour), `${h + 1}:00`] }, { any: [String(rest)] }],
    model: `From ${t1} to ${h + 1}:00 is ${toHour} minutes. From ${h + 1}:00 to ${t2} is ${rest} minutes. ${toHour} + ${rest} = ${dur} minutes.`,
  };
}
function wmCompareFractions(L) {
  const kind = choice(["samenum", "sameden", "equal"]);
  const name = choice(NAMES);
  if (kind === "samenum") {
    const ds = shuffle([2, 3, 4, 5, 6, 8]).slice(0, 2).sort((x, y) => x - y);
    const n = randInt(1, ds[0] - 1);
    const claimTrue = Math.random() < 0.5;
    const first = claimTrue ? ds[0] : ds[1], second = claimTrue ? ds[1] : ds[0];
    return {
      key: `cf:num:${n}:${first}:${second}`, needs: ["answer", "explain"], yesNo: claimTrue,
      question: `${name} says ${n}/${first} is greater than ${n}/${second}. Is ${name} correct? Explain how you know.`,
      explainGroups: [{ any: ["smaller denominator", "bigger pieces", "larger pieces", "bigger parts", "larger parts", "fewer pieces", "fewer parts", "pieces are bigger", "parts are bigger", "pieces are larger", "parts are larger", "cut into fewer", "cut into more", "more pieces", "more parts", "smaller pieces", "smaller parts", "bigger denominator", "larger denominator", "same numerator", "same top"] }],
      model: claimTrue
        ? `Yes. Both fractions have ${n} parts, but 1/${ds[0]} is a bigger piece than 1/${ds[1]} because a whole cut into fewer parts has bigger parts. So ${n}/${ds[0]} > ${n}/${ds[1]}.`
        : `No. Both fractions have ${n} parts, but a whole cut into ${ds[1]} parts has smaller pieces than a whole cut into ${ds[0]} parts. So ${n}/${ds[0]} is greater than ${n}/${ds[1]}.`,
    };
  }
  if (kind === "sameden") {
    const d = choice([5, 6, 8, 10, 12]);
    let a = randInt(1, d - 1), b = randInt(1, d - 1);
    while (a === b) b = randInt(1, d - 1);
    const big = Math.max(a, b), small = Math.min(a, b);
    return {
      key: `cf:den:${a}:${b}:${d}`, needs: ["answer", "explain"], answerAny: [`${big}/${d}`],
      question: `Which fraction is greater, ${a}/${d} or ${b}/${d}? Explain how you know.`,
      explainGroups: [{ any: ["same denominator", "same size parts", "same size pieces", "same number of parts", "same bottom", "more parts", "more pieces", "bigger numerator", "larger numerator", "greater numerator", "bigger top", "larger top", `${big} is more`, `${big} is bigger`, `${big} is greater`, `${big} is larger`, `${big}>${small}`, `${big} parts`] }],
      model: `${big}/${d} is greater. Both fractions have the same denominator, so the parts are the same size. ${big} parts is more than ${small} parts.`,
    };
  }
  const [n, a] = choice([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]);
  const m = choice([2, 3, 4]);
  return {
    key: `cf:eq:${n}:${a}:${m}`, needs: ["answer", "explain"], yesNo: true,
    question: `${name} says ${n}/${a} and ${n * m}/${a * m} are equal. Is ${name} correct? Explain how you know.`,
    explainGroups: [{ any: ["same amount", "same size", "same part", "same space", "equivalent", "equal parts", "they are equal", `x${m}`, `${m} times`, `times ${m}`, `multiply`, `divide`, "same as", "cover the same", "same fraction", "same point"] }],
    model: `Yes. If you multiply the top and the bottom of ${n}/${a} by ${m}, you get ${n * m}/${a * m}. They name the same amount, so they are equivalent.`,
  };
}
function wmGraph(L) {
  const [theme0, allCats, noun] = choice(NYS_GRAPH_SETS.filter((s) => s[2] === "students"));
  const cats = shuffle(allCats.slice()).slice(0, 3);
  const step = choice([2, 5, 10]);
  const ks = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 3);
  const vals = ks.map((k) => k * step);
  const [i, j] = vals[0] > vals[1] ? [0, 1] : [1, 0];
  const diff = vals[i] - vals[j];
  const item = {
    key: `gr:${cats.join(",")}:${vals.join(",")}`, needs: ["answer", "work"],
    question: `Use the picture graph about ${theme0}. Each star stands for ${step} ${noun}.\nHow many more ${noun} chose ${cats[i]} than ${cats[j]}? Show your work.`,
    answerAny: [String(diff)],
    workGroups: [{ any: [`${vals[i]}-${vals[j]}`, `${ks[i]}-${ks[j]}`, `${ks[i]}x${step}-${ks[j]}x${step}`, `${ks[i] - ks[j]}x${step}`, `${ks[i] - ks[j]}`] }],
    model: `${cats[i]} has ${ks[i]} stars × ${step} = ${vals[i]}. ${cats[j]} has ${ks[j]} stars × ${step} = ${vals[j]}. ${vals[i]} − ${vals[j]} = ${diff} more ${noun}.`,
  };
  return wmWithChart(item, { kind: "pictograph", categories: cats, values: vals, unit: step });
}

function nysShowWorkQ(ageIdx, diffIdx) {
  const L = nysLevel(ageIdx, diffIdx);
  const fams = [[wmTwoStep, wmElapsed, wmCompareFractions], [wmTwoStep, wmElapsed, wmCompareFractions, wmComposite],
    [wmTwoStep, wmElapsed, wmCompareFractions, wmComposite, wmPerimeter, wmGraph], [wmComposite, wmPerimeter, wmCompareFractions, wmGraph, wmTwoStep, wmElapsed]][L];
  const item = choice(fams)(L);
  return { prompt: item.question, choices: [], answer: item.model, interactive: "written_math", mathItem: item, uid: `wm:${item.key}` };
}

// ---------- UI ----------
function showWrittenMathQuestion(q) {
  const item = q.mathItem;
  const card = el("div", { class: "card" });
  const say = button("🔊 Read Aloud", () => speak(String(item.question)), "next");
  say.classList.add("read-aloud-btn");
  card.appendChild(say);
  card.appendChild(el("div", { class: "prompt", text: item.question }));
  if (item.chart) {
    const wrap = el("div", { class: "illustration-wrap" });
    wrap.appendChild(drawChart(item.chart, theme()));
    card.appendChild(wrap);
  }
  root.appendChild(card);

  const qcard = el("div", { class: "card" });
  root.appendChild(qcard);
  const fields = [];
  const mkField = (rows) => {
    const f = rows === 1 ? el("input", { class: "written-input", type: "text" }) : el("textarea", { class: "written-input", rows: String(rows) });
    f.addEventListener("focus", () => { lastField = f; });
    fields.push(f);
    return f;
  };
  let lastField = null;
  qcard.appendChild(el("div", { class: "written-step", text: "1️⃣ Write your answer (include the unit, if there is one):" }));
  const answer = mkField(1);
  qcard.appendChild(answer);
  let work = null, explain = null;
  if (item.needs.includes("work")) {
    qcard.appendChild(el("div", { class: "written-step", text: "2️⃣ Show your work: write the number sentences you used." }));
    work = mkField(3);
    qcard.appendChild(work);
  }
  if (item.needs.includes("explain")) {
    qcard.appendChild(el("div", { class: "written-step", text: "2️⃣ Explain how you know. Use words and numbers." }));
    explain = mkField(3);
    qcard.appendChild(explain);
  }
  const symRow = el("div", { class: "chip-row" });
  for (const sym of ["×", "÷", "+", "−", "=", "/"]) {
    symRow.appendChild(button(sym, () => {
      const f = lastField || work || explain || answer;
      const pos = f.selectionStart != null ? f.selectionStart : f.value.length;
      f.value = f.value.slice(0, pos) + sym + f.value.slice(f.selectionEnd != null ? f.selectionEnd : pos);
      f.focus();
      try { f.setSelectionRange(pos + 1, pos + 1); } catch (e) { /* ignore */ }
    }, "chip"));
  }
  qcard.appendChild(symRow);
  qcard.appendChild(el("div", { class: "note", text: "✏️ You can type or write with your Apple Pencil." }));

  const result = el("div", { class: "written-result" });
  const nextRow = el("div", { class: "next-row" });
  const nextBtn = button(state.currentIndex + 1 < state.questions.length ? "Next ▶" : "See Results ▶", nextQuestion, "next");
  nextBtn.disabled = true;
  nextRow.appendChild(nextBtn);

  const check = button("✅ Check My Answer", () => {
    const r = gradeMath(item, answer.value, work ? work.value : "", explain ? explain.value : "");
    check.disabled = true;
    fields.forEach((f) => { f.readOnly = true; });
    result.innerHTML = "";
    result.appendChild(el("div", { class: `written-score written-score-${r.score}`, text: `Score: ${r.score} / 2 ${["🙂 Keep trying", "👍 Almost there", "🌟 Excellent"][r.score]}` }));
    const line = (ok, good, bad) => result.appendChild(el("div", { class: ok ? "written-ok" : "written-miss", text: (ok ? "✅ " : "💡 ") + (ok ? good : bad) }));
    line(r.answerOk, "Your answer is right.", "Check your answer again. Look at the model below.");
    if (r.needWork) line(r.workOk, "Your work shows the steps.", "Show each step with a number sentence, like 6 × 8 = 48.");
    if (r.needExplain) line(r.explainOk, "Your explanation gives a good reason.", "Explain WHY with math words, like 'same denominator' or 'bigger pieces'.");
    result.appendChild(el("div", { class: "written-model-label", text: "📖 A strong answer:" }));
    result.appendChild(el("div", { class: "written-model", text: item.model }));
    if (r.score === 2) state.score += 1; else state.missed.push(q);
    ACTIVITY.record(q, r.score === 2, Date.now() - state.questionShownAt, answer.value.trim());
    ACTIVITY.recordWritten({
      kind: "math", needs: item.needs, subject: "Math", topic: "Show Your Work", question: item.question, passage: "",
      answer: answer.value.trim(), cited: work ? work.value.trim() : "", explain: explain ? explain.value.trim() : "",
      model: item.model, checks: { answer: r.answerOk, cite: r.workOk, explain: r.explainOk }, auto: r.score,
    });
    RECENT_PROMPTS.markAnswered(q);
    nextBtn.disabled = false;
  }, "start");
  qcard.appendChild(check);
  qcard.appendChild(result);
  root.appendChild(nextRow);
}

// ---------- registration ----------
MATH_TOPIC_FUNCS["Show Your Work"] = nysShowWorkQ;
if (!APP_DATA.MATH_TOPICS.includes("Show Your Work")) APP_DATA.MATH_TOPICS.push("Show Your Work");
APP_DATA.MATH_TOPIC_MIN_AGE["Show Your Work"] = 1;
if (!APP_DATA.LESSONS.Math["Show Your Work"]) {
  APP_DATA.LESSONS.Math["Show Your Work"] = { sections: [{
    title: "Show Your Work and Explain",
    formula: "Answer + work (or reason) = full credit",
    steps: ["On the test, some questions ask you to write your answer, not pick one. You can get 2 points, 1 point or 0.",
      "Write a number sentence for each step: 6 × 8 = 48, then 48 − 5 = 43.",
      "Write the unit with your answer: 43 pencils, 24 square feet, 45 minutes.",
      "When it says Explain, give a reason with math words: same denominator, bigger pieces, the same amount.",
      "Check that your answer answers the question that was asked."],
  }] };
}
