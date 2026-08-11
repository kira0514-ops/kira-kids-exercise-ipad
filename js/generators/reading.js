// Port of kids_exercise_app.py's reading question generators.

const VOWELS = ["a", "e", "i", "o", "u"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function wordPool(ageIdx, diffIdx) {
  if (ageIdx === 0) return diffIdx < 2 ? APP_DATA.PRESCHOOL_WORDS : APP_DATA.EARLY_WORDS;
  if (ageIdx === 1) return diffIdx < 2 ? APP_DATA.EARLY_WORDS : APP_DATA.UPPER_WORDS;
  return diffIdx < 2 ? APP_DATA.UPPER_WORDS : APP_DATA.UPPER_HARD_WORDS;
}

function rhymeQuestion(diffIdx = 0) {
  const pool = diffIdx >= 2 ? APP_DATA.RHYME_SETS_HARD : APP_DATA.RHYME_SETS;
  const poolKey = diffIdx >= 2 ? "rhyme_hard" : "rhyme_easy";
  const group = SEEN.pickUnseen(poolKey, pool, (g) => g[0]);
  const target = group[0];
  const correct = choice(group.slice(1));
  const otherFirsts = pool.filter((g) => g !== group).map((g) => g[0]);
  const choices = makeChoices(correct, otherFirsts.concat(APP_DATA.PRESCHOOL_WORDS));
  return { prompt: `Which word rhymes with '${target}'?`, choices, answer: correct };
}

function firstLetterQ(ageIdx, diffIdx) {
  if (ageIdx === 0 && diffIdx === 2 && Math.random() < 0.3) {
    const letter = choice(LETTERS.slice(0, -1));
    const answer = LETTERS[LETTERS.indexOf(letter) + 1];
    return { prompt: `What letter comes after '${letter}' in the alphabet?`,
      choices: makeChoices(answer, LETTERS), answer };
  }
  const word = choice(wordPool(ageIdx, diffIdx));
  const answer = word[0];
  return { prompt: `What letter does '${word}' start with?`, choices: makeChoices(answer, LETTERS), answer };
}

function wordLengthQ(ageIdx, diffIdx) {
  const word = choice(wordPool(ageIdx, diffIdx));
  const answer = word.length;
  return { prompt: `How many letters are in '${word}'?`, choices: numericChoices(answer, 1, 12), answer };
}

function unscrambleQ(ageIdx, diffIdx) {
  const pool = wordPool(ageIdx, diffIdx);
  const word = choice(pool);
  let scrambled = word;
  while (scrambled === word) {
    scrambled = shuffle(word.split("")).join("");
  }
  return { prompt: `Unscramble the word: ${scrambled}`, choices: makeChoices(word, pool), answer: word };
}

function missingLetterQ(ageIdx, diffIdx) {
  const pool = wordPool(ageIdx, diffIdx);
  const word = choice(pool);
  const pos = randInt(0, word.length - 1);
  const answer = word[pos];
  const blanked = word.slice(0, pos) + "_" + word.slice(pos + 1);
  const letterPool = VOWELS.includes(answer) ? VOWELS : LETTERS;
  return { prompt: `Fill in the missing letter: ${blanked}`, choices: makeChoices(answer, letterPool), answer,
    speak: `Fill in the missing letter: ${word}` };
}

function synonymQ(ageIdx, diffIdx) {
  const pool = diffIdx >= 2 ? APP_DATA.SYNONYMS_HARD : APP_DATA.SYNONYMS;
  const poolKey = diffIdx >= 2 ? "synonyms_hard" : "synonyms_easy";
  const [word, answer] = SEEN.pickUnseen(poolKey, Object.entries(pool), (kv) => kv[0]);
  return { prompt: `Which word means the same as '${word}'?`,
    choices: makeChoices(answer, Object.values(pool)), answer };
}

function antonymQ(ageIdx, diffIdx) {
  const pool = diffIdx >= 2 ? APP_DATA.ANTONYMS_HARD : APP_DATA.ANTONYMS;
  const poolKey = diffIdx >= 2 ? "antonyms_hard" : "antonyms_easy";
  const [word, answer] = SEEN.pickUnseen(poolKey, Object.entries(pool), (kv) => kv[0]);
  return { prompt: `Which word means the opposite of '${word}'?`,
    choices: makeChoices(answer, Object.values(pool)), answer };
}

function extractSceneWords(text, maxWords = 3) {
  const tokens = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const seen = new Set();
  const cartoonHits = [], emojiHits = [];
  for (const tok of tokens) {
    if (seen.has(tok)) continue;
    if (APP_DATA.WORD_CARTOON[tok]) { cartoonHits.push(tok); seen.add(tok); }
    else if (APP_DATA.WORD_EMOJI[tok]) { emojiHits.push(tok); seen.add(tok); }
  }
  const picks = cartoonHits.concat(emojiHits).slice(0, maxWords);
  return picks.map((w) => [w, APP_DATA.WORD_EMOJI[w] || "❓"]);
}

function readingComprehensionQ(ageIdx, diffIdx) {
  const passages = APP_DATA.READING_PASSAGES[ageIdx];
  const byLength = passages.slice().sort((a, b) => a.text.length - b.text.length);
  const half = Math.floor(byLength.length / 2);
  const pool = diffIdx >= 2 && half ? byLength.slice(half) : half ? byLength.slice(0, half) : byLength;
  const poolKey = `reading_passages_${ageIdx}`;
  const passage = SEEN.pickUnseen(poolKey, pool, (p) => p.text.slice(0, 40));

  const questions = passage.questions;
  let q;
  if (diffIdx >= 2) {
    const harder = questions.filter((qq) => qq.question.toLowerCase().includes("means") ||
      qq.question.toLowerCase().includes("why"));
    q = harder.length && Math.random() < 0.6 ? choice(harder) : choice(questions);
  } else {
    q = choice(questions);
  }

  const prompt = passage.text + "\n\n" + q.question;
  const choices = shuffle(q.choices.slice());
  const result = { prompt, choices, answer: q.answer };
  const sceneWords = extractSceneWords(passage.text);
  if (sceneWords.length) result.illustration = { type: "scene", words: sceneWords };
  return result;
}

function phonicsStartSoundQ() {
  const [letter, words] = SEEN.pickUnseen("phonics_groups", Object.entries(APP_DATA.PHONICS_START_SOUND_GROUPS), (kv) => kv[0]);
  const [target, correct] = sample(words, 2);
  const otherWords = [];
  for (const [l2, ws] of Object.entries(APP_DATA.PHONICS_START_SOUND_GROUPS)) {
    if (l2 !== letter) otherWords.push(...ws);
  }
  const choices = makeChoices(correct, otherWords);
  return { prompt: `Which word starts with the same sound as '${target}'?`, choices, answer: correct,
    illustration: { type: "word_cards", words: [[target, APP_DATA.WORD_EMOJI[target] || "❓"]] } };
}

function phonicsLetterToWordQ() {
  const [letter, words] = SEEN.pickUnseen("phonics_groups", Object.entries(APP_DATA.PHONICS_START_SOUND_GROUPS), (kv) => kv[0]);
  const correct = choice(words);
  const otherWords = [];
  for (const [l2, ws] of Object.entries(APP_DATA.PHONICS_START_SOUND_GROUPS)) {
    if (l2 !== letter) otherWords.push(...ws);
  }
  return { prompt: `Which word starts with the letter '${letter.toUpperCase()}'?`,
    choices: makeChoices(correct, otherWords), answer: correct };
}

function phonicsVowelSoundQ() {
  const word = choice(APP_DATA.PHONICS_CVC_WORDS);
  const vowel = word.split("").find((c) => VOWELS.includes(c));
  return { prompt: `What vowel sound do you hear in the middle of '${word}'?`,
    choices: makeChoices(vowel, VOWELS), answer: vowel,
    illustration: { type: "word_cards", words: [[word, APP_DATA.WORD_EMOJI[word] || "❓"]] } };
}

function phonicsBlendQ(diffIdx = 0) {
  const pool = diffIdx >= 2 ? APP_DATA.PHONICS_BLEND_WORDS : APP_DATA.PHONICS_CVC_WORDS;
  const word = choice(pool);
  const sounds = word.split("").join(" - ");
  return { prompt: `Blend these sounds together. What word do they make?\n\n${sounds}`,
    choices: makeChoices(word, pool), answer: word };
}

function phonicsQ(ageIdx, diffIdx) {
  const kinds = ["start_sound", "letter_to_word", "vowel_sound"];
  if (ageIdx >= 1 || diffIdx >= 1) kinds.push("blend");
  const kind = choice(kinds);
  if (kind === "start_sound") return phonicsStartSoundQ();
  if (kind === "letter_to_word") return phonicsLetterToWordQ();
  if (kind === "vowel_sound") return phonicsVowelSoundQ();
  return phonicsBlendQ(diffIdx);
}

// Interactive counterpart to Unscramble: instead of picking the correctly-spelled word from
// four options, the kid hears the word (Read Aloud) and/or sees its picture, then taps letter
// tiles from a shuffled bank into blank boxes to actually spell it out -- same "build the
// answer yourself" spirit as the vertical arithmetic exercises, just for words instead of
// digits. Rendered by buildSpellWordInteractive() further down.
function spellWordQ(ageIdx, diffIdx) {
  const pool = wordPool(ageIdx, diffIdx);
  const word = choice(pool);
  return {
    prompt: "🔊 Tap \"Read Aloud\" to hear the word, then spell it!",
    speak: word,
    choices: makeChoices(word, pool), answer: word,
    interactive: "spell_word", word, emoji: APP_DATA.WORD_EMOJI[word] || null,
  };
}

// Sentence-level counterpart to Spell the Word: hear a whole sentence, then tap its words
// (shuffled) into the answer area in order. Split into a short/long tier by word count within
// each age's pool, same pattern readingComprehensionQ uses for its passages.
function sentenceBuilderQ(ageIdx, diffIdx) {
  const pool = APP_DATA.SENTENCE_BUILDER_SENTENCES[ageIdx];
  const byLength = pool.slice().sort((a, b) => a.split(" ").length - b.split(" ").length);
  const half = Math.floor(byLength.length / 2);
  const tier = diffIdx >= 2 && half ? byLength.slice(half) : half ? byLength.slice(0, half) : byLength;
  const poolKey = `sentence_builder_${ageIdx}`;
  const sentence = SEEN.pickUnseen(poolKey, tier, (s) => s);
  return {
    prompt: "🔊 Tap \"Read Aloud\" to hear the sentence, then build it in order!",
    speak: sentence,
    choices: makeChoices(sentence, pool), answer: sentence,
    interactive: "sentence_builder", words: sentence.split(" "), sentence,
  };
}

const READING_TOPIC_FUNCS = {
  Phonics: phonicsQ,
  "First Letter": firstLetterQ,
  "Word Length": wordLengthQ,
  Rhyming: (ageIdx, diffIdx) => rhymeQuestion(diffIdx),
  Unscramble: unscrambleQ,
  "Missing Letter": missingLetterQ,
  Synonyms: synonymQ,
  Antonyms: antonymQ,
  "Reading Comprehension": readingComprehensionQ,
  "Spell the Word": spellWordQ,
  "Sentence Builder": sentenceBuilderQ,
};

// Tap-in-order letter tiles from a shuffled bank into blank boxes to spell `word`. No drag
// needed (unlike the vertical-arithmetic digit boxes) -- each tile is used exactly once, so a
// plain tap is unambiguous. Validated only once every blank is filled, since a word's letters
// can repeat (e.g. "letter") and there's no single unambiguous "next correct tile" to highlight
// mid-word. Reuses the vadd-box visual language (white/bordered boxes, green "correct" state)
// so it reads as the same family of exercise as the math ones.
function buildSpellWordInteractive(word, emoji, onComplete) {
  const wrap = el("div", { class: "spell-wrap" });

  if (emoji) wrap.appendChild(el("div", { class: "spell-hint", text: emoji }));

  const blanksRow = el("div", { class: "spell-blanks" });
  const blanks = word.split("").map(() => {
    const b = el("div", { class: "spell-blank" });
    blanksRow.appendChild(b);
    return b;
  });
  wrap.appendChild(blanksRow);

  const bankRow = el("div", { class: "spell-bank" });
  wrap.appendChild(bankRow);

  // Guaranteed not already in the correct order (for words with more than one distinct
  // arrangement), so the puzzle never starts pre-solved.
  let letters;
  do { letters = shuffle(word.split("")); } while (letters.join("") === word && new Set(word).size > 1);

  let filled = [];
  let done = false;

  function reset() {
    filled = [];
    blanks.forEach((b) => { b.textContent = ""; b.classList.remove("spell-blank-filled"); });
    tiles.forEach((t) => { t.disabled = false; t.classList.remove("spell-tile-used"); });
  }

  function checkComplete() {
    if (filled.join("") === word) {
      done = true;
      blanks.forEach((b) => b.classList.add("spell-blank-correct"));
      onComplete();
    } else {
      blanks.forEach((b) => b.classList.add("spell-blank-wrong"));
      setTimeout(() => { blanks.forEach((b) => b.classList.remove("spell-blank-wrong")); reset(); }, 600);
    }
  }

  const tiles = letters.map((ch) => {
    const tile = el("button", { class: "spell-tile", type: "button", text: ch });
    tile.addEventListener("click", () => {
      if (done || tile.disabled) return;
      tile.disabled = true;
      tile.classList.add("spell-tile-used");
      const idx = filled.length;
      filled.push(ch);
      blanks[idx].textContent = ch;
      blanks[idx].classList.add("spell-blank-filled");
      if (filled.length === word.length) checkComplete();
    });
    bankRow.appendChild(tile);
    return tile;
  });

  return wrap;
}

// Word-level counterpart to buildSpellWordInteractive: tap shuffled word tiles into an answer
// area to rebuild a sentence in order. Unlike single-letter spelling, a sentence has enough
// tiles (5-14 words) that a single wrong tap shouldn't force starting over, so tapping a tile
// already placed sends it back to the bank instead -- full reset only happens if every tile
// gets placed and the result still isn't the target sentence. Re-renders both the answer area
// and the bank from scratch on every change instead of moving DOM nodes by hand, which keeps
// the (word, position) bookkeeping simple even when a sentence repeats the same word twice.
function buildSentenceBuilderInteractive(words, onComplete) {
  const wrap = el("div", { class: "sentence-wrap" });
  const answerArea = el("div", { class: "sentence-answer" });
  const bankRow = el("div", { class: "sentence-bank" });
  wrap.appendChild(answerArea);
  wrap.appendChild(bankRow);

  let shuffled;
  do { shuffled = shuffle(words.slice()); } while (shuffled.join(" ") === words.join(" ") && new Set(words).size > 1);

  const tiles = shuffled.map((word, id) => ({ word, id }));
  let placedIds = [];
  let done = false;

  function makeTileEl(t, placed) {
    const tile = el("button", { class: `sentence-tile${placed ? " sentence-tile-placed" : ""}`, type: "button", text: t.word });
    tile.addEventListener("click", () => {
      if (done) return;
      placedIds = placed ? placedIds.filter((id) => id !== t.id) : placedIds.concat(t.id);
      render();
      if (placedIds.length === tiles.length) checkComplete();
    });
    return tile;
  }

  function render() {
    answerArea.innerHTML = "";
    if (!placedIds.length) {
      answerArea.appendChild(el("span", { class: "sentence-placeholder", text: "Tap the words below, in order..." }));
    }
    for (const id of placedIds) answerArea.appendChild(makeTileEl(tiles.find((t) => t.id === id), true));
    bankRow.innerHTML = "";
    for (const t of tiles) {
      if (!placedIds.includes(t.id)) bankRow.appendChild(makeTileEl(t, false));
    }
  }

  function checkComplete() {
    const current = placedIds.map((id) => tiles.find((t) => t.id === id).word).join(" ");
    if (current === words.join(" ")) {
      done = true;
      answerArea.classList.add("sentence-answer-correct");
      onComplete();
    } else {
      answerArea.classList.add("sentence-answer-wrong");
      setTimeout(() => {
        answerArea.classList.remove("sentence-answer-wrong");
        placedIds = [];
        render();
      }, 700);
    }
  }

  render();
  return wrap;
}

function readingQuestion(ageIdx, diffIdx, topics) {
  [ageIdx, diffIdx] = resolveExtreme(ageIdx, diffIdx);
  const pool = topics && topics.length ? topics : ["Unscramble", "Missing Letter"];
  const topic = choice(pool);
  return READING_TOPIC_FUNCS[topic](ageIdx, diffIdx);
}
