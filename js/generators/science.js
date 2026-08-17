// Science question generators. Grade 1-2 level content (Early Elementary track only, for now),
// matching the "materials / magnets / plants / ourselves" units of China's 义务教育科学课程标准
// (2022 revision) at this stage. Kept purely observational/factual -- no simulated hands-on
// activities, since this is a static multiple-choice quiz app, not a lab.
//
// "My Body & Senses" is scoped deliberately narrow: the five senses, external body parts, and
// general growth facts (height, baby teeth, hair/nails) only -- nothing anatomical or about
// reproduction/puberty.

const SCIENCE_MATERIALS = [
  { label: "🪵 wood", seeThrough: false, floats: true, bendy: false, natural: true },
  { label: "🥄 metal spoon", seeThrough: false, floats: false, bendy: false, natural: false },
  { label: "🧴 plastic bottle", seeThrough: false, floats: true, bendy: true, natural: false },
  { label: "🥛 glass cup", seeThrough: true, floats: false, bendy: false, natural: false },
  { label: "🎈 rubber balloon", seeThrough: false, floats: true, bendy: true, natural: false },
  { label: "📄 paper", seeThrough: false, floats: true, bendy: true, natural: false },
  { label: "🧶 cotton fabric", seeThrough: false, floats: true, bendy: true, natural: true },
  { label: "🪨 stone", seeThrough: false, floats: false, bendy: false, natural: true },
  { label: "🧊 ice", seeThrough: true, floats: true, bendy: false, natural: true },
  { label: "🧽 sponge", seeThrough: false, floats: true, bendy: true, natural: false },
  { label: "🫙 clear jar", seeThrough: true, floats: false, bendy: false, natural: false },
];

const MATERIAL_PROPS = [
  { key: "seeThrough", posPrompt: "Which of these can you see through?", negPrompt: "Which of these can you NOT see through?" },
  { key: "floats", posPrompt: "Which of these floats on water?", negPrompt: "Which of these does NOT float on water -- it sinks?" },
  { key: "bendy", posPrompt: "Which of these bends easily?", negPrompt: "Which of these is hard and does NOT bend easily?" },
  { key: "natural", posPrompt: "Which of these is natural -- it comes from nature?", negPrompt: "Which of these is man-made, not natural?" },
];

function materialsQ(ageIdx, diffIdx) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const propDef = choice(MATERIAL_PROPS);
    const negate = diffIdx >= 2 && Math.random() < 0.5;
    const desired = !negate;
    const matching = SCIENCE_MATERIALS.filter((m) => m[propDef.key] === desired);
    const distractorPool = SCIENCE_MATERIALS.filter((m) => m[propDef.key] !== desired).map((m) => m.label);
    if (matching.length === 0 || distractorPool.length < 3) continue;
    const answerItem = choice(matching);
    const choices = makeChoices(answerItem.label, distractorPool);
    const prompt = negate ? propDef.negPrompt : propDef.posPrompt;
    return { prompt: `${prompt}\n\n` + choices.join("   "), choices, answer: answerItem.label };
  }
  // Extremely unlikely fallback: plain see-through question, always solvable with this bank.
  const choices = makeChoices("🥛 glass cup", SCIENCE_MATERIALS.filter((m) => !m.seeThrough).map((m) => m.label));
  return { prompt: "Which of these can you see through?\n\n" + choices.join("   "), choices, answer: "🥛 glass cup" };
}

const SCIENCE_MAGNETIC_ITEMS = [
  { label: "🧲 iron nail", magnetic: true },
  { label: "📎 paperclip", magnetic: true },
  { label: "🔑 steel key", magnetic: true },
  { label: "🥄 metal spoon", magnetic: true },
  { label: "✂️ scissors", magnetic: true },
  { label: "🧸 teddy bear", magnetic: false },
  { label: "🪵 wood block", magnetic: false },
  { label: "🧴 plastic cup", magnetic: false },
  { label: "📄 paper", magnetic: false },
  { label: "🍎 apple", magnetic: false },
  { label: "🎈 rubber balloon", magnetic: false },
];

const MAGNET_FACT_QS = [
  { prompt: "A magnet has two ends. What are they called?", choices: ["North and South poles", "Top and Bottom", "Left and Right", "Front and Back"], answer: "North and South poles", minDiff: 1 },
  { prompt: "What happens when you put the SAME poles of two magnets together (like North and North)?", choices: ["They push apart (repel)", "They stick together (attract)", "Nothing happens", "They both disappear"], answer: "They push apart (repel)", minDiff: 1 },
  { prompt: "What happens when you put OPPOSITE poles of two magnets together (North and South)?", choices: ["They stick together (attract)", "They push apart (repel)", "Nothing happens", "They spin around"], answer: "They stick together (attract)", minDiff: 1 },
  { prompt: "Which everyday tool uses a magnet to always point North?", choices: ["A compass", "A ruler", "A thermometer", "A clock"], answer: "A compass", minDiff: 2 },
];

function magnetsQ(ageIdx, diffIdx) {
  const factPool = MAGNET_FACT_QS.filter((q) => diffIdx >= q.minDiff);
  if (factPool.length && Math.random() < 0.35) {
    const q = SEEN.pickUnseen("science_magnet_facts", factPool, (f) => f.prompt);
    return { prompt: q.prompt, choices: q.choices.slice(), answer: q.answer };
  }
  const negate = diffIdx >= 1 && Math.random() < 0.5;
  const desired = !negate;
  const matching = SCIENCE_MAGNETIC_ITEMS.filter((m) => m.magnetic === desired);
  const distractorPool = SCIENCE_MAGNETIC_ITEMS.filter((m) => m.magnetic !== desired).map((m) => m.label);
  const answerItem = choice(matching);
  const choices = makeChoices(answerItem.label, distractorPool);
  const prompt = negate ? "Which of these would a magnet NOT pick up?" : "Which of these would a magnet pick up?";
  return { prompt: `${prompt}\n\n` + choices.join("   "), choices, answer: answerItem.label };
}

const PLANT_FACT_QS = [
  { prompt: "Which part of a plant grows underground and takes in water?", choices: ["Roots", "Leaves", "Flower", "Stem"], answer: "Roots", minDiff: 0 },
  { prompt: "Which part of a plant is green and uses sunlight to make food for the plant?", choices: ["Leaves", "Roots", "Seed", "Stem"], answer: "Leaves", minDiff: 0 },
  { prompt: "Which part of a plant holds up the leaves and carries water up from the roots?", choices: ["Stem", "Root", "Petal", "Seed"], answer: "Stem", minDiff: 0 },
  { prompt: "What can grow into a brand new plant?", choices: ["A seed", "A rock", "A leaf", "A shoe"], answer: "A seed", minDiff: 0 },
  { prompt: "What are the colorful parts of a plant that attract bees and butterflies?", choices: ["Flowers", "Roots", "Stem", "Bark"], answer: "Flowers", minDiff: 0 },
  { prompt: "Is a plant a living thing?", choices: ["Yes -- it grows, needs water, and can make new plants", "No, it's not living", "Only flowers are living", "Only trees are living"], answer: "Yes -- it grows, needs water, and can make new plants", minDiff: 0 },
  { prompt: "What does a plant need to grow well?", choices: ["Sunlight, water, and air", "Only darkness", "Only sand", "Loud music"], answer: "Sunlight, water, and air", minDiff: 0 },
  { prompt: "What happens first after you plant a seed and water it?", choices: ["It sprouts -- a tiny plant pokes out", "It turns into a flower right away", "It turns into a tree overnight", "Nothing ever happens"], answer: "It sprouts -- a tiny plant pokes out", minDiff: 0 },
  { prompt: "What comes right after a seed sprouts?", choices: ["A small seedling with tiny leaves", "A fully grown tree", "Flowers bloom immediately", "The seed disappears completely"], answer: "A small seedling with tiny leaves", minDiff: 2 },
  { prompt: "Why do plants need sunlight?", choices: ["To make their own food", "To stay cool", "To make noise", "To change color only"], answer: "To make their own food", minDiff: 2 },
];

function plantsQ(ageIdx, diffIdx) {
  const pool = PLANT_FACT_QS.filter((q) => diffIdx >= q.minDiff);
  const q = SEEN.pickUnseen("science_plants", pool, (f) => f.prompt);
  return { prompt: q.prompt, choices: q.choices.slice(), answer: q.answer };
}

const BODY_SENSES_QS = [
  { prompt: "Which body part do you use to SEE a rainbow?", choices: ["Eyes", "Ears", "Nose", "Tongue"], answer: "Eyes", minDiff: 0 },
  { prompt: "Which body part do you use to HEAR music?", choices: ["Ears", "Eyes", "Nose", "Tongue"], answer: "Ears", minDiff: 0 },
  { prompt: "Which body part do you use to SMELL a flower?", choices: ["Nose", "Eyes", "Ears", "Tongue"], answer: "Nose", minDiff: 0 },
  { prompt: "Which body part do you use to TASTE ice cream?", choices: ["Tongue", "Eyes", "Ears", "Nose"], answer: "Tongue", minDiff: 0 },
  { prompt: "Which body part do you use to FEEL if water is hot or cold?", choices: ["Skin", "Eyes", "Ears", "Tongue"], answer: "Skin", minDiff: 0 },
  { prompt: "How many senses do most people have?", choices: ["Five", "Two", "Ten", "Three"], answer: "Five", minDiff: 0 },
  { prompt: "Which body part do you use to kick a ball?", choices: ["Feet", "Hands", "Ears", "Nose"], answer: "Feet", minDiff: 0 },
  { prompt: "Which body part do you use to hold a pencil and write?", choices: ["Hands", "Feet", "Ears", "Nose"], answer: "Hands", minDiff: 0 },
  { prompt: "What usually happens to your baby teeth as you grow?", choices: ["They fall out and new adult teeth grow in", "They turn a different color", "They grow bigger forever", "Nothing happens to them"], answer: "They fall out and new adult teeth grow in", minDiff: 1 },
  { prompt: "As children grow older, what usually happens to their height?", choices: ["They get taller", "They get shorter", "They stay exactly the same forever", "They shrink"], answer: "They get taller", minDiff: 0 },
  { prompt: "Which of these keeps growing your whole life and needs regular cutting?", choices: ["Hair and nails", "Your eyes", "Your teeth", "Your ears"], answer: "Hair and nails", minDiff: 1 },
  { prompt: "What helps your body grow strong and healthy?", choices: ["Eating healthy food, sleeping enough, and exercise", "Skipping meals", "Staying up all night", "Never going outside"], answer: "Eating healthy food, sleeping enough, and exercise", minDiff: 2 },
];

function bodySensesQ(ageIdx, diffIdx) {
  const pool = BODY_SENSES_QS.filter((q) => diffIdx >= q.minDiff);
  const q = SEEN.pickUnseen("science_body_senses", pool, (f) => f.prompt);
  return { prompt: q.prompt, choices: q.choices.slice(), answer: q.answer };
}

const SCIENCE_TOPIC_FUNCS = {
  Plants: plantsQ,
  Materials: materialsQ,
  Magnets: magnetsQ,
  "My Body & Senses": bodySensesQ,
};

function scienceQuestion(ageIdx, diffIdx, topics) {
  [ageIdx, diffIdx] = resolveExtreme(ageIdx, diffIdx);
  const pool = topics && topics.length ? topics : APP_DATA.SCIENCE_TOPICS;
  const topic = choice(pool);
  return SCIENCE_TOPIC_FUNCS[topic](ageIdx, diffIdx);
}
