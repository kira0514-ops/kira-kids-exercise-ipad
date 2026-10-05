// localStorage port of SeenTracker (kids_exercise_app.py). Not exercised by Math yet
// (none of the 15 math generators use pick_unseen), but wired up now since Reading's
// generators need it in phase 3.

const SEEN_STORAGE_KEY = "kidsExerciseGenerator.seen";

class SeenTracker {
  constructor() {
    this.profileId = "default";
    this.seen = {};
    this.load();
  }

  // "default" keeps the original un-suffixed storage key, so a pre-existing
  // single-player's seen-question memory survives being folded into a profile.
  storageKey() {
    return this.profileId === "default" ? SEEN_STORAGE_KEY : `${SEEN_STORAGE_KEY}.${this.profileId}`;
  }

  setProfile(profileId) {
    this.profileId = profileId || "default";
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      const data = raw ? JSON.parse(raw) : {};
      this.seen = {};
      for (const k in data) this.seen[k] = new Set(data[k]);
    } catch (e) {
      this.seen = {};
    }
  }

  save() {
    try {
      const data = {};
      for (const k in this.seen) data[k] = Array.from(this.seen[k]).sort();
      localStorage.setItem(this.storageKey(), JSON.stringify(data));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  pickUnseen(poolKey, items, idFn = String) {
    const ids = items.map(idFn);
    let seenIds = this.seen[poolKey] || new Set();
    let unseenIdx = ids.map((id, i) => [id, i]).filter(([id]) => !seenIds.has(id)).map(([, i]) => i);
    if (unseenIdx.length === 0) {
      seenIds = new Set();
      unseenIdx = ids.map((_, i) => i);
    }
    const choiceI = choice(unseenIdx);
    seenIds.add(ids[choiceI]);
    this.seen[poolKey] = seenIds;
    this.save();
    return items[choiceI];
  }
}

const SEEN = new SeenTracker();

// Cross-session memory for exact-prompt repeats (math, equations, etc. draw numbers from
// a numeric range rather than a small curated pool, so SeenTracker's pick-from-a-list model
// doesn't fit -- this just remembers the last N prompt strings shown and lets callers avoid
// re-rolling one of them, evicting the oldest once the cap is hit so an exhausted pool still
// cycles instead of locking up.
const RECENT_PROMPTS_STORAGE_KEY = "kidsExerciseGenerator.recentPrompts";
const RECENT_PROMPTS_CAP = 300;

// A question the player has actually answered is kept out of every quiz for a week. It's
// remembered by its exact prompt AND by q.contentKey (the passage / story it came from), so
// the same long passage with a different question, or the same story with a different name,
// counts as a repeat too. Only the last 7 days are kept.
const ANSWERED_STORAGE_KEY = "kidsExerciseGenerator.answeredWeek";
const ANSWERED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ANSWERED_CAP = 5000;

class RecentPromptsTracker {
  constructor() {
    this.profileId = "default";
    this.order = [];
    this.set = new Set();
    this.answered = {};
    this.load();
  }

  storageKey() {
    return this.profileId === "default" ? RECENT_PROMPTS_STORAGE_KEY : `${RECENT_PROMPTS_STORAGE_KEY}.${this.profileId}`;
  }

  answeredStorageKey() {
    return this.profileId === "default" ? ANSWERED_STORAGE_KEY : `${ANSWERED_STORAGE_KEY}.${this.profileId}`;
  }

  setProfile(profileId) {
    this.profileId = profileId || "default";
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey());
      this.order = raw ? JSON.parse(raw) : [];
      this.set = new Set(this.order);
    } catch (e) {
      this.order = [];
      this.set = new Set();
    }
    try {
      const raw = localStorage.getItem(this.answeredStorageKey());
      const data = raw ? JSON.parse(raw) : {};
      const cutoff = Date.now() - ANSWERED_WINDOW_MS;
      this.answered = {};
      for (const k in data) if (data[k] > cutoff) this.answered[k] = data[k];
    } catch (e) {
      this.answered = {};
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.order));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  saveAnswered() {
    try {
      localStorage.setItem(this.answeredStorageKey(), JSON.stringify(this.answered));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  static keysFor(q) {
    const keys = [`p:${passageKey(q.prompt)}`];
    if (q.contentKey) keys.push(`c:${q.contentKey}`);
    return keys;
  }

  markAnswered(q, now = Date.now()) {
    for (const key of RecentPromptsTracker.keysFor(q)) this.answered[key] = now;
    const cutoff = now - ANSWERED_WINDOW_MS;
    let keys = Object.keys(this.answered);
    for (const k of keys) if (this.answered[k] <= cutoff) delete this.answered[k];
    keys = Object.keys(this.answered);
    if (keys.length > ANSWERED_CAP) {
      keys.sort((a, b) => this.answered[a] - this.answered[b]);
      for (const k of keys.slice(0, keys.length - ANSWERED_CAP)) delete this.answered[k];
    }
    this.saveAnswered();
  }

  // Ms since this exact prompt was answered within the week (Infinity if it wasn't).
  exactStaleness(q, now = Date.now()) {
    const t = this.answered[`p:${passageKey(q.prompt)}`];
    return t && t > now - ANSWERED_WINDOW_MS ? now - t : Infinity;
  }

  // How long since this question (or its passage/story) was last answered or shown:
  // Infinity = fresh. Bigger is better when every candidate has been used.
  staleness(q, now = Date.now()) {
    const cutoff = now - ANSWERED_WINDOW_MS;
    let last = 0;
    for (const key of RecentPromptsTracker.keysFor(q)) {
      const t = this.answered[key];
      if (t && t > cutoff && t > last) last = t;
    }
    if (last) return now - last;
    if (this.set.has(q.prompt)) return 60 * 60 * 1000;
    return Infinity;
  }

  has(prompt) {
    return this.set.has(prompt);
  }

  addAll(prompts) {
    for (const prompt of prompts) {
      if (this.set.has(prompt)) continue;
      this.order.push(prompt);
      this.set.add(prompt);
    }
    while (this.order.length > RECENT_PROMPTS_CAP) {
      const removed = this.order.shift();
      this.set.delete(removed);
    }
    this.save();
  }
}

const RECENT_PROMPTS = new RecentPromptsTracker();

// Draw a question that isn't already in this quiz and hasn't been answered or shown lately.
// If every attempt collides (a small pool), take the one used longest ago instead of a
// random repeat -- so it's "try not to", never a hang.
function generateFresh(genFn, seen, maxAttempts = 25) {
  let best = null, bestScore = -2;
  for (let i = 0; i < maxAttempts; i++) {
    const q = genFn();
    const ck = q.contentKey ? `c:${q.contentKey}` : null;
    let score;
    if (seen.has(q.prompt)) score = -1;          // identical question already in this quiz
    else if (ck && seen.has(ck)) score = -0.5;   // same passage/story already in this quiz
    else if (RECENT_PROMPTS.exactStaleness(q) !== Infinity) score = RECENT_PROMPTS.exactStaleness(q) / 1e15; // identical to one answered this week: last resort
    else score = RECENT_PROMPTS.staleness(q);
    if (score > bestScore) { best = q; bestScore = score; }
    if (score === Infinity) break;
  }
  seen.add(best.prompt);
  if (best.contentKey) seen.add(`c:${best.contentKey}`);
  return best;
}
