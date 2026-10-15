// Parent report: a per-profile activity log kept only in this device's localStorage (never
// sent anywhere), plus the report screen. Records every answered quiz question (subject,
// topic, right/wrong, time spent) and the date each 365-Day Curriculum day was completed.

const ACTIVITY_STORAGE_KEY = "kidsExerciseGenerator.activity";
const ACTIVITY_KEEP_DAYS = 400;
const ACTIVITY_MAX_MS = 3 * 60 * 1000; // cap time per question so a walk-away doesn't count
const ACTIVITY_MAX_MISSED = 300;      // most recent wrong answers kept for the report

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

class ActivityLog {
  constructor() {
    this.profileId = "default";
    this.data = { days: {}, topics: {}, curriculum: {}, missed: [] };
    this.load();
  }

  storageKey(profileId = this.profileId) {
    return profileId === "default" ? ACTIVITY_STORAGE_KEY : `${ACTIVITY_STORAGE_KEY}.${profileId}`;
  }

  setProfile(profileId) {
    this.profileId = profileId || "default";
    this.load();
  }

  static read(key) {
    try {
      const d = JSON.parse(localStorage.getItem(key) || "{}");
      return { days: d.days || {}, topics: d.topics || {}, curriculum: d.curriculum || {}, missed: d.missed || [] };
    } catch (e) {
      return { days: {}, topics: {}, curriculum: {}, missed: [] };
    }
  }

  load() {
    this.data = ActivityLog.read(this.storageKey());
  }

  save() {
    try {
      const cutoff = localDateKey(new Date(Date.now() - ACTIVITY_KEEP_DAYS * 86400000));
      for (const k of Object.keys(this.data.days)) if (k < cutoff) delete this.data.days[k];
      localStorage.setItem(this.storageKey(), JSON.stringify(this.data));
    } catch (e) {
      // a failed save should never crash the app
    }
  }

  // One answered quiz question. `chosen` is the child's answer (kept for wrong answers).
  record(q, correct, ms, chosen) {
    const day = localDateKey();
    const d = this.data.days[day] || (this.data.days[day] = { n: 0, c: 0, ms: 0, subj: {} });
    const hit = correct ? 1 : 0;
    d.n += 1; d.c += hit; d.ms += Math.max(0, Math.min(ms || 0, ACTIVITY_MAX_MS));
    const subject = q.subject || "Other";
    const s = d.subj[subject] || (d.subj[subject] = [0, 0]);
    s[0] += 1; s[1] += hit;
    const key = `${subject}|${q.topic || "Mixed"}`;
    const t = this.data.topics[key] || (this.data.topics[key] = [0, 0, day]);
    t[0] += 1; t[1] += hit; t[2] = day;
    if (!correct) {
      this.data.missed.push({ at: Date.now(), subject, topic: q.topic || "Mixed",
        prompt: String(q.prompt).slice(0, 2500), chosen: String(chosen ?? ""), answer: String(q.answer) });
      if (this.data.missed.length > ACTIVITY_MAX_MISSED) this.data.missed.splice(0, this.data.missed.length - ACTIVITY_MAX_MISSED);
    }
    this.save();
  }

  recordCurriculumDay(dayNum) {
    const day = localDateKey();
    const list = this.data.curriculum[day] || (this.data.curriculum[day] = []);
    if (!list.includes(dayNum)) list.push(dayNum);
    this.save();
  }
}

const ACTIVITY = new ActivityLog();

// -- Report screen -------------------------------------------------------------------
const pctText = (c, n) => (n ? `${Math.round((100 * c) / n)}%` : "—");
const minutesText = (ms) => {
  const m = Math.round(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

function reportStat(label, value) {
  const box = el("div", { class: "report-stat" });
  box.appendChild(el("div", { class: "report-stat-value", text: value }));
  box.appendChild(el("div", { class: "report-stat-label", text: label }));
  return box;
}

function reportBar(fraction, cls = "") {
  const track = el("div", { class: "report-bar" });
  const fill = el("div", { class: `report-bar-fill ${cls}` });
  fill.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
  track.appendChild(fill);
  return track;
}

function accuracyClass(c, n) {
  if (!n) return "";
  const p = c / n;
  return p >= 0.8 ? "report-good" : p >= 0.6 ? "report-ok" : "report-weak";
}

function showParentReport(profileId, tab = "overview", subjectFilter = "All") {
  applyThemeVars();
  clearRoot();
  const profiles = PROFILES.profiles.length ? PROFILES.profiles : [{ id: "default", name: "Player" }];
  const pid = profileId || PROFILES.activeId || profiles[0].id;
  const who = profiles.find((p) => p.id === pid) || profiles[0];
  const data = pid === ACTIVITY.profileId ? ACTIVITY.data : ActivityLog.read(ACTIVITY.storageKey(pid));
  const daily = pid === DAILY.profileId ? DAILY : (() => {
    const t = new DailyCurriculumTracker(); t.setProfile(pid); return t;
  })();

  root.appendChild(headerBanner("📊 Parent Report", `Saved only on this device · ${who.name}`));

  const top = el("div", { class: "quiz-top" });
  top.appendChild(button("🏠 Main Menu", showSetup, "quit"));
  root.appendChild(top);

  if (profiles.length > 1) {
    const row = el("div", { class: "chip-row" });
    for (const p of profiles) {
      row.appendChild(button(p.name, () => showParentReport(p.id, tab), p.id === who.id ? "chip-selected" : "chip"));
    }
    root.appendChild(row);
  }

  const tabs = el("div", { class: "chip-row report-tabs" });
  tabs.appendChild(button("📈 Overview", () => showParentReport(who.id, "overview"),
    tab === "overview" ? "chip-selected" : "chip"));
  tabs.appendChild(button(`❌ Missed Questions (${data.missed.length})`, () => showParentReport(who.id, "missed"),
    tab === "missed" ? "chip-selected" : "chip"));
  root.appendChild(tabs);

  if (tab === "missed") {
    showMissedQuestions(who.id, data, subjectFilter);
    return;
  }

  // Summary: last 7 days
  const today = new Date();
  const dayKeys = (count) => Array.from({ length: count }, (_, i) =>
    localDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)));
  const week = dayKeys(7).map((k) => data.days[k]).filter(Boolean);
  const wn = week.reduce((a, d) => a + d.n, 0);
  const wc = week.reduce((a, d) => a + d.c, 0);
  const wms = week.reduce((a, d) => a + d.ms, 0);
  const summary = el("div", { class: "card" });
  summary.appendChild(el("div", { class: "lesson-section-title", text: "This week (last 7 days)" }));
  const stats = el("div", { class: "report-stats" });
  stats.appendChild(reportStat("days practiced", `${week.length} / 7`));
  stats.appendChild(reportStat("questions", String(wn)));
  stats.appendChild(reportStat("correct", pctText(wc, wn)));
  stats.appendChild(reportStat("time spent", minutesText(wms)));
  summary.appendChild(stats);
  root.appendChild(summary);

  // 365-Day Curriculum
  const cur = el("div", { class: "card" });
  cur.appendChild(el("div", { class: "lesson-section-title", text: "📆 365-Day Curriculum" }));
  cur.appendChild(el("div", { class: "step-text",
    text: `${APP_DATA.AGE_GROUPS[daily.ageIdx]} track · on Day ${daily.currentDay} · ${daily.completedDays.size} of 365 days completed` }));
  cur.appendChild(reportBar(daily.completedDays.size / 365));
  const curDates = Object.keys(data.curriculum).sort().reverse();
  const last14 = dayKeys(14);
  const curRow = el("div", { class: "report-calendar" });
  for (const k of last14.slice().reverse()) {
    const done = (data.curriculum[k] || []).length;
    const cell = el("div", { class: `report-cal-cell ${done ? "report-cal-done" : ""}`,
      text: `${Number(k.slice(8))}` });
    cell.title = done ? `Completed Day ${data.curriculum[k].join(", ")}` : "No curriculum day completed";
    curRow.appendChild(cell);
  }
  cur.appendChild(el("div", { class: "note", text: "Last 14 days (green = a curriculum day was completed):" }));
  cur.appendChild(curRow);
  if (curDates.length) {
    const lines = curDates.slice(0, 7).map((k) => `${k}: Day ${data.curriculum[k].join(", Day ")}`);
    cur.appendChild(el("div", { class: "note", text: "Recent: " + lines.join(" · ") }));
  }
  root.appendChild(cur);

  // Daily activity: last 14 days
  const act = el("div", { class: "card" });
  act.appendChild(el("div", { class: "lesson-section-title", text: "🗓️ Daily activity (last 14 days)" }));
  const maxN = Math.max(1, ...last14.map((k) => (data.days[k] || { n: 0 }).n));
  for (const k of last14) {
    const d = data.days[k];
    const row = el("div", { class: "report-row" });
    const date = new Date(`${k}T12:00:00`);
    row.appendChild(el("span", { class: "report-row-label",
      text: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) }));
    row.appendChild(reportBar(d ? d.n / maxN : 0, d ? accuracyClass(d.c, d.n) : ""));
    row.appendChild(el("span", { class: "report-row-value",
      text: d ? `${d.n} q · ${pctText(d.c, d.n)} · ${minutesText(d.ms)}` : "—" }));
    act.appendChild(row);
  }
  root.appendChild(act);

  // Accuracy by subject and topic (all time)
  const acc = el("div", { class: "card" });
  acc.appendChild(el("div", { class: "lesson-section-title", text: "🎯 Accuracy by subject & topic (all time)" }));
  const bySubject = {};
  for (const [key, [n, c, last]] of Object.entries(data.topics)) {
    const [subject, topic] = key.split("|");
    (bySubject[subject] || (bySubject[subject] = [])).push({ topic, n, c, last });
  }
  const subjects = SUBJECT_NAMES.filter((s) => bySubject[s]).concat(Object.keys(bySubject).filter((s) => !SUBJECT_NAMES.includes(s)));
  if (!subjects.length) acc.appendChild(el("div", { class: "note", text: "No questions answered yet." }));
  const weak = [];
  for (const subject of subjects) {
    const rows = bySubject[subject].sort((a, b) => a.c / a.n - b.c / b.n);
    const n = rows.reduce((a, r) => a + r.n, 0), c = rows.reduce((a, r) => a + r.c, 0);
    acc.appendChild(el("h3", { class: "report-subject", text: `${SUBJECT_ICONS[subject] || ""} ${subject} — ${pctText(c, n)} (${n} answered)` }));
    for (const r of rows) {
      const row = el("div", { class: "report-row" });
      row.appendChild(el("span", { class: "report-row-label", text: r.topic }));
      row.appendChild(reportBar(r.c / r.n, accuracyClass(r.c, r.n)));
      row.appendChild(el("span", { class: "report-row-value", text: `${pctText(r.c, r.n)} of ${r.n}` }));
      acc.appendChild(row);
      if (r.n >= 5 && r.c / r.n < 0.6) weak.push(`${r.topic} (${subject})`);
    }
  }
  if (weak.length) {
    acc.insertBefore(el("div", { class: "report-weak-note", text: `Needs practice: ${weak.join(", ")}` }), acc.children[1]);
  }
  root.appendChild(acc);

  root.appendChild(el("div", { class: "note",
    text: "This report is stored only in this device's browser. It is not uploaded anywhere, and clearing the browser's website data will erase it." }));
}

// "Missed Questions" tab: the most recent wrong answers, newest first, with what the child
// picked and the correct answer. Reading passages are folded away under "Show passage".
function showMissedQuestions(pid, data, subjectFilter) {
  const missed = data.missed.slice().reverse();
  const subjects = SUBJECT_NAMES.filter((s) => missed.some((m) => m.subject === s));

  if (!missed.length) {
    root.appendChild(el("div", { class: "card note", text: "No wrong answers recorded yet. 🎉" }));
    return;
  }
  if (subjects.length > 1) {
    const row = el("div", { class: "chip-row" });
    for (const s of ["All", ...subjects]) {
      row.appendChild(button(s === "All" ? "All subjects" : `${SUBJECT_ICONS[s] || ""} ${s}`,
        () => showParentReport(pid, "missed", s), s === subjectFilter ? "chip-selected" : "chip"));
    }
    root.appendChild(row);
  }

  const shown = missed.filter((m) => subjectFilter === "All" || m.subject === subjectFilter);
  let lastDay = null;
  const list = el("div", { class: "card" });
  for (const m of shown) {
    const when = new Date(m.at);
    const day = when.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
    if (day !== lastDay) {
      list.appendChild(el("div", { class: "lesson-section-title report-missed-day", text: day }));
      lastDay = day;
    }
    const item = el("div", { class: "report-missed" });
    item.appendChild(el("div", { class: "report-missed-meta",
      text: `${SUBJECT_ICONS[m.subject] || ""} ${m.subject} · ${m.topic} · ${when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` }));
    const parts = m.prompt.split("\n\n");
    const question = parts.pop();  // whatever is left in `parts` is the passage, if any
    if (parts.length) {
      const details = el("details", { class: "report-missed-passage" });
      details.appendChild(el("summary", { text: "Show passage" }));
      details.appendChild(el("div", { class: "step-text", text: parts.join("\n\n") }));
      item.appendChild(details);
    }
    item.appendChild(el("div", { class: "report-missed-q", text: question }));
    item.appendChild(el("div", { class: "report-missed-wrong", text: `✗ Their answer: ${m.chosen || "—"}` }));
    item.appendChild(el("div", { class: "report-missed-right", text: `✓ Correct answer: ${m.answer}` }));
    list.appendChild(item);
  }
  root.appendChild(list);
  root.appendChild(el("div", { class: "note",
    text: `Showing the ${ACTIVITY_MAX_MISSED} most recent wrong answers. Stored only on this device.` }));
}
