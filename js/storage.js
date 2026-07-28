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

class RecentPromptsTracker {
  constructor() {
    this.profileId = "default";
    this.order = [];
    this.set = new Set();
    this.load();
  }

  storageKey() {
    return this.profileId === "default" ? RECENT_PROMPTS_STORAGE_KEY : `${RECENT_PROMPTS_STORAGE_KEY}.${this.profileId}`;
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
  }

  save() {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this.order));
    } catch (e) {
      // a failed save should never crash the app
    }
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
