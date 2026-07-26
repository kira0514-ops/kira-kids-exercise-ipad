// Multi-child profiles: lets siblings share one iPad/app without mixing up seen-question
// memory or 365-day curriculum progress. Each profile also remembers its own last-used
// theme and age group. Mirrors kids_exercise_app.py's ProfileManager + show_profile_picker.

const PROFILES_STORAGE_KEY = "kidsExerciseGenerator.profiles";

function sanitizeProfileId(name) {
  const base = String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return base.slice(0, 40) || "player";
}

class ProfileManager {
  constructor() {
    this.profiles = [];
    this.activeId = null;
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      this.profiles = data.profiles || [];
      this.activeId = data.activeId || null;
    } catch (e) {
      this.profiles = [];
      this.activeId = null;
    }
  }

  save() {
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify({ profiles: this.profiles, activeId: this.activeId }));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  active() {
    return this.profiles.find((p) => p.id === this.activeId) || null;
  }

  create(name) {
    // The very first profile ever created (no profiles.json-equivalent has ever been
    // saved) gets id "default" so it inherits any pre-existing single-player seen/daily
    // progress instead of starting that kid over from zero.
    const isFirstEver = this.profiles.length === 0 && localStorage.getItem(PROFILES_STORAGE_KEY) === null;
    let id;
    if (isFirstEver) {
      id = "default";
    } else {
      const baseId = sanitizeProfileId(name);
      id = baseId;
      let suffix = 1;
      while (this.profiles.some((p) => p.id === id)) { id = `${baseId}_${++suffix}`; }
    }
    const profile = { id, name: name.trim() || "Player", theme: "Rainbow", ageIdx: 1 };
    this.profiles.push(profile);
    this.activeId = id;
    this.save();
    return profile;
  }

  select(id) {
    this.activeId = id;
    this.save();
  }

  remove(id) {
    this.profiles = this.profiles.filter((p) => p.id !== id);
    if (this.activeId === id) this.activeId = null;
    this.save();
  }

  updateActive(fields) {
    const p = this.active();
    if (p) {
      Object.assign(p, fields);
      this.save();
    }
  }
}

const PROFILES = new ProfileManager();

function enterProfile(id) {
  PROFILES.select(id);
  const p = PROFILES.active();
  state.theme = p.theme || "Rainbow";
  state.ageIdx = p.ageIdx != null ? p.ageIdx : 1;
  SEEN.setProfile(id);
  DAILY.setProfile(id);
  showSetup();
}

function showProfilePicker() {
  applyThemeVars();
  clearRoot();
  root.appendChild(headerBanner("👋 Who's Playing?", "Pick your name, or add a new player"));

  const listWrap = el("div", { class: "profile-list" });
  for (const p of PROFILES.profiles) {
    const row = el("div", { class: "profile-row" });
    row.appendChild(button(`🧒 ${p.name}`, () => enterProfile(p.id), "choice"));
    const del = button("🗑", () => {
      if (confirm(`Remove ${p.name}'s profile and progress? This can't be undone.`)) {
        PROFILES.remove(p.id);
        showProfilePicker();
      }
    }, "quit");
    del.classList.add("profile-delete-btn");
    row.appendChild(del);
    listWrap.appendChild(row);
  }
  if (!PROFILES.profiles.length) {
    listWrap.appendChild(el("p", { class: "note", text: "No players yet — add one below to get started!" }));
  }
  root.appendChild(listWrap);

  const addRow = el("div", { class: "count-row profile-add-row" });
  const nameInput = el("input", { type: "text", placeholder: "Type a name...", class: "count-input profile-name-input" });
  addRow.appendChild(nameInput);
  const addProfile = () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const p = PROFILES.create(name);
    enterProfile(p.id);
  };
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addProfile(); });
  addRow.appendChild(button("➕ Add Player", addProfile, "start"));
  root.appendChild(addRow);
}
