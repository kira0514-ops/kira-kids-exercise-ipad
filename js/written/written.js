// Written answers: 3-step short responses (answer in a sentence -> tap the proof -> explain),
// auto-graded 0-2 like the NYS short-response rubric, from data in early_*.js / upper_*.js /
// stories_*.js (WRITTEN_QS: [{ key, items: [writtenQuestion] }], key = passageKey(text) or
// "story:<id>"). Answers are logged for the Parent Report's Written Answers tab.

const WRITTEN_BY_KEY = new Map();
for (const entry of WRITTEN_QS) WRITTEN_BY_KEY.set(entry.key, entry.items || []);
const WRITTEN_SHARE = 0.25; // share of Reading Comprehension questions that become written

function writtenItemsFor(key) {
  return WRITTEN_BY_KEY.get(key) || [];
}

// Split text into sentences at . ! ? (keeping a closing quote with its sentence).
function splitSentences(text) {
  const out = [];
  // Titles like "Mr." must not end a sentence: protect their periods while splitting.
  const TITLE = /\b(Mr|Mrs|Ms|Dr|St|Jr|Sr|Mt|vs)\./g;
  for (const para of String(text).split(/\n\n+/)) {
    const safe = para.replace(TITLE, "$1\u0001");
    const parts = safe.match(/[^.!?]+(?:[.!?]+["”’']?|$)/g) || [];
    const sents = parts.map((s) => s.replace(/\u0001/g, ".").trim()).filter(Boolean);
    out.push(sents);
  }
  return out; // array of paragraphs, each an array of sentences
}

const normText = (s) => String(s).toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();

function editDistanceAtMost1(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

// A group matches if the text contains any of its strings; single words of 5+ letters also
// match with one typo (a Grade 2 spelling slip shouldn't cost the point).
// A match string that starts with a space (" own") must start a word, so it can't hit "down".
function groupMatches(text, group) {
  const t = " " + normText(text).replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ") + " ";
  const words = t.match(/[a-z']+/g) || [];
  return (group.any || []).some((raw) => {
    const m = String(raw).toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").replace(/\s+$/, "");
    if (!m.trim()) return false;
    // Count a hit only if it isn't negated just before ("not happy" shouldn't match "happy"),
    // unless the match string is itself negative ("didn't eat").
    const negWord = /(^| )(not|never|no|isn't|wasn't|didn't|don't|doesn't|aren't|weren't|can't|won't)( (very|really|so|too|that|even|feel|feeling|felt))? $/;
    for (let i = t.indexOf(m); i !== -1; i = t.indexOf(m, i + 1)) {
      if (/\b(not|never|no|n't)\b/.test(m) || !negWord.test(t.slice(Math.max(0, i - 24), i + (m.startsWith(" ") ? 1 : 0)))) return true;
    }
    if (m.length >= 5 && /^[a-z]+$/.test(m)) {
      const NEG = /^(not|never|no|isn't|wasn't|didn't|don't|doesn't|aren't|weren't|can't|won't)$/;
      const SOFT = /^(very|really|so|too|that|even|feel|feeling|felt)$/;
      return words.some((w, k) => w.length >= m.length - 1 && editDistanceAtMost1(w.slice(0, m.length), m) &&
        !NEG.test(words[k - 1] || "") && !(NEG.test(words[k - 2] || "") && SOFT.test(words[k - 1] || "")));
    }
    return false;
  });
}

function gradeWritten(item, answer, cited, explain) {
  const body = normText(answer).startsWith(normText(item.starter)) ? answer.slice(item.starter.length) : answer;
  const groups = item.keyGroups || [];
  const hit = groups.filter((g) => groupMatches(body, g));
  const missing = groups.filter((g) => !groupMatches(body, g));
  const answerOk = hit.length >= (item.need || groups.length) && body.trim().split(/\s+/).length >= 2;
  const citeOk = !!cited && (item.evidence || []).some((e) => normText(e) === normText(cited));
  const explainWords = explain.trim().split(/\s+/).filter(Boolean).length;
  const explainOk = explainWords >= 4 &&
    ((item.explainGroups || []).some((g) => groupMatches(explain, g)) || groups.some((g) => groupMatches(explain, g)));
  const score = answerOk && citeOk && explainOk ? 2 : (answerOk || (citeOk && explainOk)) ? 1 : 0;
  return { score, answerOk, citeOk, explainOk, missing: missing.map((g) => g.hint).filter(Boolean) };
}

// Renders the 3 steps into `container`. `sentenceHost` is where tappable sentences go (the
// passage area); `onDone(result, record)` fires once after Check.
function buildWrittenQuestion(container, { item, text, sentenceHost, onDone }) {
  let cited = null;
  const picked = [];
  const paras = splitSentences(text);
  sentenceHost.innerHTML = "";
  sentenceHost.classList.add("written-passage");
  for (const sents of paras) {
    const p = el("p", { class: "written-para" });
    for (const s of sents) {
      const span = el("span", { class: "written-sent", text: s + " " });
      span.addEventListener("click", () => {
        if (checked) return;
        picked.forEach((x) => x.classList.remove("written-sent-picked"));
        span.classList.add("written-sent-picked");
        picked.push(span);
        cited = s;
        citeBox.textContent = `“${s}”`;
        citeBox.classList.add("written-cite-filled");
      });
      p.appendChild(span);
    }
    sentenceHost.appendChild(p);
  }

  container.appendChild(el("div", { class: "prompt", text: item.question }));
  container.appendChild(el("div", { class: "written-step", text: "1️⃣ Answer the question in a full sentence:" }));
  const answer = el("textarea", { class: "written-input", rows: "2" });
  answer.value = item.starter + " ";
  container.appendChild(answer);
  container.appendChild(el("div", { class: "written-step", text: "2️⃣ Tap the sentence in the story that proves your answer:" }));
  const citeBox = el("div", { class: "written-cite", text: "(tap a sentence above)" });
  container.appendChild(citeBox);
  container.appendChild(el("div", { class: "written-step", text: "3️⃣ Explain how that sentence proves it:" }));
  const explain = el("textarea", { class: "written-input", rows: "2" });
  explain.value = "This shows that ";
  container.appendChild(explain);
  container.appendChild(el("div", { class: "note", text: "✏️ You can type or write with your Apple Pencil." }));

  const result = el("div", { class: "written-result" });
  let checked = false;
  const check = button("✅ Check My Answer", () => {
    const exText = explain.value.replace(/^this shows that\s*/i, "");
    const r = gradeWritten(item, answer.value, cited, exText);
    checked = true;
    check.disabled = true;
    answer.readOnly = true;
    explain.readOnly = true;
    result.innerHTML = "";
    result.appendChild(el("div", { class: `written-score written-score-${r.score}`, text: `Score: ${r.score} / 2 ${["🙂 Keep trying", "👍 Almost there", "🌟 Excellent"][r.score]}` }));
    const line = (ok, good, bad) => result.appendChild(el("div", { class: ok ? "written-ok" : "written-miss", text: (ok ? "✅ " : "💡 ") + (ok ? good : bad) }));
    line(r.answerOk, "Your answer has the right idea.",
      r.missing.length ? `Your answer needs: ${r.missing.join("; ")}.` : "Answer with a full sentence that explains why.");
    line(r.citeOk, "You picked a sentence that proves it.",
      cited ? "That sentence doesn't prove your answer best. Look for another one." : "Tap a sentence from the story to prove your answer.");
    line(r.explainOk, "Your explanation connects the proof to your answer.",
      "Explain how the sentence shows your answer is true.");
    result.appendChild(el("div", { class: "written-model-label", text: "📖 A strong answer:" }));
    result.appendChild(el("div", { class: "written-model", text: item.model }));
    if (!r.citeOk && item.evidence && item.evidence[0]) {
      result.appendChild(el("div", { class: "note", text: `Good proof sentence: “${item.evidence[0]}”` }));
    }
    onDone(r, { question: item.question, answer: answer.value.trim(), cited: cited || "", explain: explain.value.trim(),
      model: item.model, checks: { answer: r.answerOk, cite: r.citeOk, explain: r.explainOk } });
  }, "start");
  container.appendChild(check);
  container.appendChild(result);
}

// Written question inside the regular quiz flow (showQuestion hands off here).
function showWrittenQuizQuestion(q) {
  const card = el("div", { class: "card" });
  const passage = el("div", { class: "written-passage-box" });
  const say = button("🔊 Read Aloud", () => speak(q.passageText), "next");
  say.classList.add("read-aloud-btn");
  card.appendChild(say);
  card.appendChild(passage);
  root.appendChild(card);
  const qcard = el("div", { class: "card" });
  root.appendChild(qcard);
  const nextRow = el("div", { class: "next-row" });
  const nextBtn = button(state.currentIndex + 1 < state.questions.length ? "Next ▶" : "See Results ▶", nextQuestion, "next");
  nextBtn.disabled = true;
  nextRow.appendChild(nextBtn);
  buildWrittenQuestion(qcard, {
    item: q.written, text: q.passageText, sentenceHost: passage,
    onDone: (r, rec) => {
      if (r.score === 2) state.score += 1; else state.missed.push(q);
      ACTIVITY.record(q, r.score === 2, Date.now() - state.questionShownAt, rec.answer);
      ACTIVITY.recordWritten({ ...rec, subject: q.subject || "Reading / Spelling", topic: q.topic || "Reading Comprehension",
        passage: q.passageText, auto: r.score });
      RECENT_PROMPTS.markAnswered(q);
      nextBtn.disabled = false;
    },
  });
  root.appendChild(nextRow);
}
