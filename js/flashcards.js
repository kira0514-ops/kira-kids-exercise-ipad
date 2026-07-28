// Port of kids_exercise_app.py's Phonics Flashcards: start_phonics_flashcards,
// show_flashcard, _draw_flashcard_illustration, _speak, next/prev_flashcard.
// Uses the age-tiered FLASHCARD_DECKS_BY_AGE data (already filtered so Preschool
// doesn't see words too advanced for kindergarten -- see WORD_CARTOON/toons.js for
// the cartoon templates it draws when one exists for a word).

function drawFlashcardIllustration(emoji, word, theme) {
  const size = 220;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d");
  const cx = size / 2, cy = size / 2;
  const rOuter = 95, rInner = 78;
  const palette = theme.choice_palette;
  ctx.beginPath(); ctx.arc(cx, cy, rOuter, 0, Math.PI * 2); ctx.fillStyle = palette[0]; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fillStyle = "white"; ctx.fill();
  ctx.strokeStyle = palette[1]; ctx.lineWidth = 4; ctx.stroke();
  ctx.font = "16px 'Segoe UI Emoji', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.fillText("✨", cx + sx * (rOuter + 12), cy + sy * (rOuter + 12));
  }
  if (!(word && drawWordCartoon(ctx, cx, cy, rInner * 2, word))) {
    ctx.font = "78px 'Segoe UI Emoji', sans-serif";
    ctx.fillText(emoji, cx, cy);
  }
  return c;
}

let ttsVoice = null;

function pickTtsVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // Prefer a local (non-network) English voice so playback doesn't depend on a
  // network round-trip -- those tend to vary in loudness the most.
  return voices.find((v) => v.lang && v.lang.startsWith("en") && v.localService)
    || voices.find((v) => v.lang && v.lang.startsWith("en"))
    || voices[0];
}

if ("speechSynthesis" in window) {
  ttsVoice = pickTtsVoice();
  window.speechSynthesis.onvoiceschanged = () => { ttsVoice = pickTtsVoice(); };
}

const SPEECH_OP_WORDS = { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" };

function mathSpeakText(text) {
  // TTS engines read a bare "6 - 4" as a range ("6 to 4"), not subtraction, so spell
  // out arithmetic operators and "=" as words before handing text to speechSynthesis.
  let out = String(text).replace(/([\dxX])\s*([+\-×÷])\s*(?=[\dxX])/g,
    (m, left, op) => `${left} ${SPEECH_OP_WORDS[op]} `);
  out = out.replace(/=\s*\?/g, " equals what").replace(/=/g, " equals ");
  return out;
}

function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(mathSpeakText(text));
    // Pin volume/rate/pitch and always use the same cached voice so every word
    // sounds equally loud and clear, instead of whatever voice happens to be
    // selected by default for that particular utterance.
    utterance.volume = 1;
    utterance.rate = 0.85;
    utterance.pitch = 1;
    if (ttsVoice) utterance.voice = ttsVoice;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    // speaking is a nicety, never let it crash the app
  }
}

function startPhonicsFlashcards() {
  state.flashcardDeck = shuffle(APP_DATA.FLASHCARD_DECKS_BY_AGE[state.ageIdx].slice());
  state.flashcardIndex = 0;
  showFlashcard();
}

function showFlashcard() {
  applyThemeVars();
  clearRoot();
  const t = theme();
  root.appendChild(headerBanner("📇 Phonics Flashcards"));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(el("span", { text: `Card ${state.flashcardIndex + 1} of ${state.flashcardDeck.length}` }));
  top.appendChild(button("🏠 Menu", showSetup, "quit"));
  root.appendChild(top);

  const [word, emoji] = state.flashcardDeck[state.flashcardIndex];

  const card = el("div", { class: "card flashcard-card" });
  const illusWrap = el("div", { class: "illustration-wrap" });
  illusWrap.appendChild(drawFlashcardIllustration(emoji, word, t));
  card.appendChild(illusWrap);

  const wordFrame = el("div", { class: "flashcard-word" });
  wordFrame.appendChild(el("span", { class: "flashcard-word-first", text: word[0].toUpperCase() }));
  wordFrame.appendChild(el("span", { class: "flashcard-word-rest", text: word.slice(1).toUpperCase() }));
  card.appendChild(wordFrame);

  card.appendChild(el("div", { class: "flashcard-sounds", text: word.split("").join(" - ") }));
  card.appendChild(button("🔊 Say it", () => speak(word), "start"));
  root.appendChild(card);

  const nav = el("div", { class: "next-row" });
  nav.appendChild(button("◀ Previous", prevFlashcard, "next"));
  nav.appendChild(button("Next ▶", nextFlashcard, "start"));
  root.appendChild(nav);
}

function nextFlashcard() {
  state.flashcardIndex = (state.flashcardIndex + 1) % state.flashcardDeck.length;
  showFlashcard();
}

function prevFlashcard() {
  state.flashcardIndex = (state.flashcardIndex - 1 + state.flashcardDeck.length) % state.flashcardDeck.length;
  showFlashcard();
}
