// Science units covering the full school science curriculum per age track (plus one grade
// ahead). The data files that follow (preschool.js, early.js, upper.js) push topic objects into
// SCIENCE_UNITS; register.js then adds them to APP_DATA and SCIENCE_TOPIC_FUNCS so they behave
// exactly like the built-in Science topics (topic picker, lessons, 365-day curriculum).
//
// Topic object: { topic, age, grade, category: "life"|"physical"|"earth",
//   lesson: { title, explanation, scene }, qs: [{ prompt, choices, answer, minDiff, scene }] }
// "scene" fields describe the explanation picture; they are only used to write Gemini prompts.
const SCIENCE_UNITS = [];
