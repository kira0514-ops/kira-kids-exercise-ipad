// Port of kids_exercise_app.py's reading question generators.

const VOWELS = ["a", "e", "i", "o", "u"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function wordPool(ageIdx, diffIdx) {
  if (ageIdx === 0) return diffIdx < 2 ? APP_DATA.PRESCHOOL_WORDS : APP_DATA.EARLY_WORDS;
  if (ageIdx === 1) return diffIdx < 2 ? APP_DATA.EARLY_WORDS : APP_DATA.UPPER_WORDS;
  return diffIdx < 2 ? APP_DATA.UPPER_WORDS : APP_DATA.UPPER_HARD_WORDS;
}

// Mirrors wordPool()'s exact branching, as a stable label instead of the array itself -- lets
// every wordPool-based topic below track "seen" words per underlying list (not per age/diff
// combo, several of which share the same list) via SEEN.pickUnseen.
function wordPoolKey(ageIdx, diffIdx) {
  if (ageIdx === 0) return diffIdx < 2 ? "preschool" : "early";
  if (ageIdx === 1) return diffIdx < 2 ? "early" : "upper";
  return diffIdx < 2 ? "upper" : "upper_hard";
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
  // Previously a plain choice() with no repeat-avoidance at all (unlike Synonyms/Antonyms,
  // which already used SEEN.pickUnseen at this same ~60-word pool size) -- a kid playing many
  // rounds a day could hit the same word repeatedly with no tracking to prevent it.
  const word = SEEN.pickUnseen(`first_letter_${wordPoolKey(ageIdx, diffIdx)}`, wordPool(ageIdx, diffIdx), (w) => w);
  const answer = word[0];
  return { prompt: `What letter does '${word}' start with?`, choices: makeChoices(answer, LETTERS), answer };
}

function wordLengthQ(ageIdx, diffIdx) {
  const word = SEEN.pickUnseen(`word_length_${wordPoolKey(ageIdx, diffIdx)}`, wordPool(ageIdx, diffIdx), (w) => w);
  const answer = word.length;
  return { prompt: `How many letters are in '${word}'?`, choices: numericChoices(answer, 1, 12), answer };
}

function unscrambleQ(ageIdx, diffIdx) {
  const pool = wordPool(ageIdx, diffIdx);
  const word = SEEN.pickUnseen(`unscramble_${wordPoolKey(ageIdx, diffIdx)}`, pool, (w) => w);
  let scrambled = word;
  while (scrambled === word) {
    scrambled = shuffle(word.split("")).join("");
  }
  return { prompt: `Unscramble the word: ${scrambled}`, choices: makeChoices(word, pool), answer: word };
}

function missingLetterQ(ageIdx, diffIdx) {
  const pool = wordPool(ageIdx, diffIdx);
  const word = SEEN.pickUnseen(`missing_letter_${wordPoolKey(ageIdx, diffIdx)}`, pool, (w) => w);
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
  const word = SEEN.pickUnseen(`spell_word_${wordPoolKey(ageIdx, diffIdx)}`, pool, (w) => w);
  return {
    prompt: "🔊 Tap \"Read Aloud\" to hear the word, then spell it!",
    speak: word,
    choices: makeChoices(word, pool), answer: word,
    interactive: "spell_word", word, emoji: APP_DATA.WORD_EMOJI[word] || null,
  };
}

// Sentence Builder: procedural generation ------------------------------------------------
// A fixed hand-written list, no matter how large, still runs out for a kid doing dozens of
// rounds a day -- one family reported ~40 rounds/day exhausting a 75-per-age list within a
// single sitting. Instead of growing that list further, most sentences are now composed from
// templates + word banks at generation time: thousands of distinct, grammatically valid
// combinations per age/difficulty tier instead of a few dozen. Each template's word banks are
// deliberately uniform in tense/grammatical role (e.g. every Age 2 clause is simple past) so
// ANY cross-combination stays grammatically correct even when the resulting causal logic is a
// little arbitrary ("Because the test was difficult, most students passed with good grades.")
// -- that's fine here since the exercise is about word ORDER, not factual plausibility.
// The curated APP_DATA.SENTENCE_BUILDER_SENTENCES list is still mixed in some of the time,
// for narrative variety templates alone can't produce.

const SB0_SUBJECTS = [
  "The dog", "The cat", "The bird", "The frog", "The pig", "The cow", "The duck", "The bear",
  "The fox", "The fish", "The bee", "The ant", "The mouse", "The rabbit", "The turtle",
  "The horse", "The sheep", "The goat", "The chick", "The owl", "The snail", "The seal",
  "The bat", "The lamb", "The kitten", "The puppy", "The baby", "The bug", "My dog", "My cat",
];
const SB0_CAN_VERBS = [
  "run", "jump", "hop", "swim", "fly", "sing", "hide", "sleep", "crawl", "walk", "dig",
  "climb", "spin", "dance", "wave", "clap", "stomp", "giggle", "wiggle", "tiptoe",
];
const SB0_ADJECTIVES = [
  "big", "small", "red", "blue", "green", "soft", "tiny", "happy", "fast", "fluffy", "funny",
  "loud", "quiet", "warm", "cold", "bright", "silly", "brave", "sleepy", "hungry",
];
const SB0_NOUNS_PLURAL = ["dogs", "cats", "apples", "cookies", "stars", "toys", "books", "games", "flowers", "balloons"];
const SB0_NOUNS_SINGULAR = ["ball", "hat", "kite", "cake", "book", "toy", "bike", "cup", "star", "car", "drum", "sock", "doll", "frog", "bug"];
const SB0_PEOPLE = ["Tom", "Ben", "Mia", "Sam", "Mom", "Dad", "She", "He"];
const SB0_WE_VERB_PHRASES = [
  "play games", "eat lunch", "read books", "wash hands", "brush teeth", "fly kites",
  "build blocks", "sing songs", "draw pictures", "ride bikes",
];

function sbAge0EasyPool() {
  const out = [];
  for (const subj of SB0_SUBJECTS) for (const v of SB0_CAN_VERBS) out.push(`${subj} can ${v}.`);
  for (const subj of SB0_SUBJECTS) for (const adj of SB0_ADJECTIVES) out.push(`${subj} is ${adj}.`);
  for (const n of SB0_NOUNS_PLURAL) out.push(`I like ${n}.`);
  for (const n of SB0_NOUNS_SINGULAR) out.push(`I see a ${n}.`);
  for (const p of SB0_PEOPLE) for (const n of SB0_NOUNS_SINGULAR) out.push(`${p} has a ${n}.`);
  for (const vp of SB0_WE_VERB_PHRASES) out.push(`We ${vp}.`);
  return out;
}

function sbAge0HardPool() {
  const out = [];
  for (const subj of SB0_SUBJECTS) {
    for (const v1 of SB0_CAN_VERBS) {
      for (const v2 of SB0_CAN_VERBS) {
        if (v1 !== v2) out.push(`${subj} can ${v1} and ${v2}.`);
      }
    }
  }
  return out;
}

const SB1_SUBJECTS = [
  "The dog", "The cat", "The girl", "The boy", "My sister", "My brother", "The teacher",
  "The children", "The bird", "The puppy", "Our neighbor", "The farmer", "The artist",
  "The coach", "The baker", "Grandma", "Grandpa", "The librarian", "The nurse", "The mechanic",
  "The firefighter", "The postman", "The chef", "The gardener", "My friend",
];
const SB1_VERB_PHRASES = [
  "ran fast", "played happily", "jumped high", "sang a song", "read a book", "painted a picture",
  "built a tower", "found a treasure", "planted a seed", "baked a cake", "fixed the bike",
  "watched the game", "cleaned the room", "wrote a letter", "caught the ball", "fed the ducks",
  "climbed the tree", "solved the puzzle", "practiced piano", "walked the dog", "cooked dinner",
  "picked flowers", "flew a kite", "told a story", "waved goodbye",
];
const SB1_PLACE_TIME = [
  "across the park", "in the garden", "at school today", "before dinner", "during recess",
  "near the lake", "under the tree", "after the rain", "every morning", "at the party",
  "all afternoon", "before it got dark", "on the weekend", "in the kitchen", "at the zoo",
  "by the window", "after lunch", "in the morning", "near the pond", "at the beach",
];

function sbAge1EasyPool() {
  const out = [];
  for (const subj of SB1_SUBJECTS) for (const vp of SB1_VERB_PHRASES) out.push(`${subj} ${vp}.`);
  return out;
}

function sbAge1HardPool() {
  const out = [];
  for (const subj of SB1_SUBJECTS) for (const vp of SB1_VERB_PHRASES) for (const pt of SB1_PLACE_TIME) out.push(`${subj} ${vp} ${pt}.`);
  return out;
}

// Kept to connectors + clause banks that are all simple-past, so any cross-combination stays
// tense-consistent ("Unless"/"Whenever" want present/habitual clauses and were dropped for
// that reason, not because they're grammatically invalid in general).
const SB2_CONNECTORS = ["Although", "Because", "Since", "While", "Before", "After", "As", "Even though"];
const SB2_CLAUSE_A = [
  "it was raining", "she studied hard", "the power went out", "the crowd was large",
  "the bridge was closed", "he practiced every day", "the museum was closed",
  "the internet was down", "the test was difficult", "the harvest was poor",
  "the debate continued", "the trail was muddy", "the storm arrived",
  "the coach explained the strategy", "the sun set", "the students listened carefully",
  "the team practiced hard", "the results were announced", "the flight was delayed",
  "the rain finally stopped", "the roads were icy", "the crowd cheered loudly",
  "the teacher called on her", "the fire alarm rang", "the ship reached the harbor",
];
const SB2_MAIN_CLAUSES = [
  "the children played outside happily", "she passed the difficult test",
  "we finished the project by hand", "the students stayed focused on their work",
  "he finally went outside to play", "the sailors quickly secured their boats",
  "we had to take a longer route", "the players listened carefully",
  "extra security was called in", "prices at the market increased",
  "the audience listened with great interest", "most students passed with good grades",
  "the hikers reached the summit", "the meeting was postponed",
  "the game continued as planned", "everyone cheered loudly",
  "the class went on a field trip", "the coach called a timeout",
  "the crowd grew silent", "the plan succeeded in the end",
  "the pilot announced a delay", "the family stayed inside all day",
  "the scientists recorded their findings", "the workers finished the project early",
  "the singer performed one more song",
];

function sbAge2Pool() {
  const out = [];
  for (const conn of SB2_CONNECTORS) for (const ca of SB2_CLAUSE_A) for (const mc of SB2_MAIN_CLAUSES) {
    out.push(`${conn} ${ca}, ${mc}.`);
  }
  return out;
}

// Each pool is a pure function of static word banks, so it's computed once and cached instead
// of rebuilt on every question (age0 hard alone is ~11k combinations).
const SB_POOL_CACHE = {};
function sbPool(ageIdx, diffIdx) {
  if (ageIdx === 0) {
    const key = diffIdx >= 2 ? "0_hard" : "0_easy";
    return SB_POOL_CACHE[key] || (SB_POOL_CACHE[key] = diffIdx >= 2 ? sbAge0HardPool() : sbAge0EasyPool());
  }
  if (ageIdx === 1) {
    const key = diffIdx >= 2 ? "1_hard" : "1_easy";
    return SB_POOL_CACHE[key] || (SB_POOL_CACHE[key] = diffIdx >= 2 ? sbAge1HardPool() : sbAge1EasyPool());
  }
  return SB_POOL_CACHE["2_all"] || (SB_POOL_CACHE["2_all"] = sbAge2Pool());
}

// SEEN.pickUnseen persists its full exhaustion history to localStorage on every call (sorts
// and re-serializes the whole seen-set each time), which is fine for the curated lists it was
// designed for (dozens of items) but far too much I/O once the seen-set itself grows into the
// thousands, as it would here. A pool this large doesn't need persisted exhaustion-tracking
// anyway -- true random draws already collide rarely at this scale -- so this just keeps a
// small in-memory (non-persisted) recent-use set per pool to avoid back-to-back repeats.
const SB_GEN_RECENT = {};
function pickFromGenPool(poolKey, pool) {
  const recent = SB_GEN_RECENT[poolKey] || (SB_GEN_RECENT[poolKey] = new Set());
  let sentence;
  for (let tries = 0; tries < 10; tries++) {
    sentence = choice(pool);
    if (!recent.has(sentence)) break;
  }
  recent.add(sentence);
  if (recent.size > 60) recent.clear();
  return sentence;
}

// Hear a whole sentence, then tap its words (shuffled) into the answer area in order. Mostly
// draws from the procedural pool above; occasionally (15%) pulls a hand-written sentence from
// the curated list instead, using the same short/long tier split as before.
function sentenceBuilderQ(ageIdx, diffIdx) {
  const curatedPool = APP_DATA.SENTENCE_BUILDER_SENTENCES[ageIdx];
  let sentence;
  if (Math.random() < 0.15) {
    const byLength = curatedPool.slice().sort((a, b) => a.split(" ").length - b.split(" ").length);
    const half = Math.floor(byLength.length / 2);
    const tier = diffIdx >= 2 && half ? byLength.slice(half) : half ? byLength.slice(0, half) : byLength;
    sentence = SEEN.pickUnseen(`sentence_builder_${ageIdx}`, tier, (s) => s);
  } else {
    const genPoolKey = `sentence_builder_gen_${ageIdx}_${diffIdx >= 2 ? "hard" : "easy"}`;
    sentence = pickFromGenPool(genPoolKey, sbPool(ageIdx, diffIdx));
  }
  return {
    prompt: "🔊 Tap \"Read Aloud\" to hear the sentence, then build it in order!",
    speak: sentence,
    choices: makeChoices(sentence, curatedPool), answer: sentence,
    interactive: "sentence_builder", words: sentence.split(" "), sentence,
  };
}

const TENSE_REGULAR_VERBS = [
  ["walk", "walked"], ["jump", "jumped"], ["play", "played"], ["talk", "talked"],
  ["climb", "climbed"], ["cook", "cooked"], ["clean", "cleaned"], ["paint", "painted"],
  ["dance", "danced"], ["bake", "baked"], ["help", "helped"], ["wash", "washed"],
  ["watch", "watched"], ["listen", "listened"], ["look", "looked"], ["open", "opened"],
  ["close", "closed"], ["kick", "kicked"], ["pull", "pulled"], ["push", "pushed"],
  ["pack", "packed"], ["call", "called"], ["fill", "filled"], ["fix", "fixed"],
  ["laugh", "laughed"], ["smile", "smiled"], ["wave", "waved"], ["arrive", "arrived"],
];
const TENSE_IRREGULAR_VERBS = [
  ["go", "went"], ["run", "ran"], ["eat", "ate"], ["see", "saw"], ["make", "made"],
  ["come", "came"], ["give", "gave"], ["take", "took"], ["have", "had"], ["say", "said"],
  ["get", "got"], ["find", "found"], ["think", "thought"], ["know", "knew"], ["write", "wrote"],
  ["sit", "sat"], ["stand", "stood"], ["sing", "sang"], ["swim", "swam"], ["fly", "flew"],
  ["drink", "drank"], ["fall", "fell"], ["grow", "grew"], ["throw", "threw"], ["buy", "bought"],
  ["bring", "brought"], ["catch", "caught"], ["draw", "drew"], ["ride", "rode"], ["begin", "began"],
];
const TENSE_SENTENCES = [
  ["She walks to school every day.", "Present"],
  ["They will build a sandcastle.", "Future"],
  ["He played soccer yesterday.", "Past"],
  ["We eat dinner at six.", "Present"],
  ["I will visit my grandma tomorrow.", "Future"],
  ["The dog barked all night.", "Past"],
  ["She sings in the choir.", "Present"],
  ["They will travel to the beach next week.", "Future"],
  ["We watched a movie last night.", "Past"],
  ["He reads a book every evening.", "Present"],
  ["I will finish my homework soon.", "Future"],
  ["The children played in the park.", "Past"],
  ["My mom cooks dinner every night.", "Present"],
  ["We will celebrate her birthday next month.", "Future"],
  ["The bird flew away.", "Past"],
  ["He drinks milk every morning.", "Present"],
  ["They will clean the house on Saturday.", "Future"],
  ["She found a shiny coin.", "Past"],
  ["I write in my journal every day.", "Present"],
  ["We will plant flowers in the spring.", "Future"],
];

// Easy: regular -ed verbs. Medium: irregular past forms, with the "just add -ed" mistake
// (e.g. "goed") deliberately included as a distractor since it's the single most common way
// kids actually get an irregular verb wrong. Hard: fill in the correct past-tense form inside
// a sentence, mixing regular and irregular verbs. Extreme: identify a whole sentence's tense.
function verbTensesQ(ageIdx, diffIdx) {
  if (diffIdx === 0) {
    const [base, past] = choice(TENSE_REGULAR_VERBS);
    const distractors = [`${base}ing`, `${base}s`, `${base}eded`];
    return { prompt: `What is the past tense of '${base}'?`, choices: makeChoices(past, distractors), answer: past };
  }
  if (diffIdx === 1) {
    const [base, past] = choice(TENSE_IRREGULAR_VERBS);
    const wrongRegular = `${base}ed`;
    const otherPasts = TENSE_IRREGULAR_VERBS.filter(([b]) => b !== base).map(([, p]) => p);
    return { prompt: `What is the past tense of '${base}'?`, choices: makeChoices(past, [wrongRegular, ...otherPasts]), answer: past };
  }
  if (diffIdx === 2) {
    const pool = Math.random() < 0.5 ? TENSE_IRREGULAR_VERBS : TENSE_REGULAR_VERBS;
    const [base, past] = choice(pool);
    const subject = choice(["I", "she", "he", "we", "they"]); // lowercase except "I" -- always follows "Yesterday, " here, never sentence-initial
    const otherPasts = pool.filter(([b]) => b !== base).map(([, p]) => p);
    return { prompt: `Yesterday, ${subject} ___ (${base}).\n\nFill in the blank with the correct past-tense form.`,
      choices: makeChoices(past, otherPasts), answer: past };
  }
  const [sentence, tense] = SEEN.pickUnseen("verb_tenses_sentences", TENSE_SENTENCES, (s) => s[0]);
  return { prompt: `Which tense is this sentence in?\n\n"${sentence}"`, choices: ["Past", "Present", "Future"], answer: tense };
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
  "Verb Tenses": verbTensesQ,
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
