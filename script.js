/* ============================================================
   GradeGuardian v2.0 — Application Logic
   100% local-first: localStorage for structured data,
   IndexedDB for uploaded files. No server, no account needed.
   ============================================================ */

"use strict";

/* ==================== STORAGE LAYER ==================== */
const KEYS = {
  courses: "gg_courses",
  tasks: "gg_tasks",
  sessions: "gg_sessions",
  vault: "gg_vault",
  decks: "gg_decks",
  cards: "gg_cards",
  settings: "gg_settings",
  seeded: "gg_seeded",
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const getCourses = () => load(KEYS.courses, []);
const getTasks = () => load(KEYS.tasks, []);
const getSessions = () => load(KEYS.sessions, []);
const getVault = () => load(KEYS.vault, []);
const getDecks = () => load(KEYS.decks, []);
const getCards = () => load(KEYS.cards, []);

const DEFAULT_SETTINGS = {
  name: "Student",
  email: "",
  theme: "light",
  weeklyGoal: 10,
  focusLen: 25,
  breakLen: 5,
};

function getSettings() {
  return { ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) };
}

/* ---------- IndexedDB: binary file storage for the Vault ---------- */
let idb = null;

function openFileDB() {
  return new Promise((resolve, reject) => {
    if (idb) return resolve(idb);
    const req = indexedDB.open("gradeguardian", 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains("files")) {
        req.result.createObjectStore("files", { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      idb = req.result;
      resolve(idb);
    };
    req.onerror = () => reject(req.error);
  });
}

async function putFile(id, blob) {
  const db = await openFileDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put({ id, blob });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getFile(id) {
  const db = await openFileDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("files").objectStore("files").get(id);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFile(id) {
  const db = await openFileDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/* ==================== UTILITIES ==================== */
const $ = (id) => document.getElementById(id);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const todayStr = () => localDateStr(new Date());

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function dueLabel(dateStr) {
  if (!dateStr) return "No due date";
  const today = new Date(todayStr());
  const due = new Date(dateStr);
  const diff = Math.round((due - today) / 86400000);
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  if (diff === -1) return "1 day overdue";
  if (diff < 0) return `${-diff} days overdue`;
  return `Due ${fmtDate(dateStr)}`;
}

function showToast(msg, type = "success") {
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-exclamation",
    info: "fa-circle-info",
  };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(msg)}</span>`;
  $("toastContainer").appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 350);
  }, 2600);
}

/* Generic confirm dialog (replaces window.confirm) */
let confirmCallback = null;

function confirmAction(title, message, onConfirm) {
  $("confirmTitle").textContent = title;
  $("confirmMessage").textContent = message;
  confirmCallback = onConfirm;
  openModal("confirmModal");
}

function openModal(id) {
  $(id).hidden = false;
}

function closeModalById(id) {
  $(id).hidden = true;
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay").forEach((m) => (m.hidden = true));
}

/* ==================== GRADING SCALE (Ghana 4.0) ==================== */
const GRADE_SCALE = [
  { min: 80, letter: "A", points: 4.0 },
  { min: 75, letter: "B+", points: 3.5 },
  { min: 70, letter: "B", points: 3.0 },
  { min: 65, letter: "C+", points: 2.5 },
  { min: 60, letter: "C", points: 2.0 },
  { min: 55, letter: "D+", points: 1.5 },
  { min: 50, letter: "D", points: 1.0 },
  { min: 0, letter: "F", points: 0.0 },
];

function gradeInfo(score) {
  const s = Number(score) || 0;
  return GRADE_SCALE.find((g) => s >= g.min) || GRADE_SCALE[GRADE_SCALE.length - 1];
}

const letterFor = (score) => gradeInfo(score).letter;
const pointsFor = (score) => gradeInfo(score).points;

function letterClass(letter) {
  return letter.toLowerCase().replace("+", "-plus");
}

function statusFor(score) {
  if (score >= 75) return { label: "Excellent", cls: "excellent" };
  if (score >= 65) return { label: "Good", cls: "good" };
  if (score >= 50) return { label: "Average", cls: "average" };
  return { label: "At Risk", cls: "at-risk" };
}

function calculateGPA() {
  const courses = getCourses();
  if (!courses.length) return "0.00";
  let pts = 0;
  let credits = 0;
  courses.forEach((c) => {
    const ch = Number(c.creditHours) || 3;
    pts += pointsFor(c.grade) * ch;
    credits += ch;
  });
  return credits ? (pts / credits).toFixed(2) : "0.00";
}

/* ==================== MIGRATION & DEMO DATA ==================== */
function migrateV1() {
  if (localStorage.getItem(KEYS.courses)) return false; // already on v2
  const oldCourses = load("courses", null);
  if (!oldCourses) return false;

  save(KEYS.courses, oldCourses);
  save(KEYS.tasks, load("tasks", []));
  save(KEYS.sessions, load("studySessions", []));
  const settings = getSettings();
  const oldName = localStorage.getItem("profileName");
  if (oldName) settings.name = oldName;
  if (localStorage.getItem("darkMode") === "true") settings.theme = "dark";
  save(KEYS.settings, settings);
  save(KEYS.seeded, true);

  ["courses", "tasks", "studySessions", "vaultItems", "firebaseConfig", "profileName", "darkMode"].forEach(
    (k) => localStorage.removeItem(k),
  );
  console.log("GradeGuardian: migrated v1 data to v2 format.");
  return true;
}

function seedDemoData() {
  const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  };
  const dayISO = (offset, h = 12) => {
    const d = day(offset);
    d.setHours(h, 0, 0, 0);
    return d.toISOString();
  };
  const dayStr = (offset) => localDateStr(day(offset));

  const courses = [
    { id: "c1", name: "Web Development", code: "CSCD 301", creditHours: 3, instructor: "Dr. Mensah", semester: "Semester 1", grade: 85 },
    { id: "c2", name: "Database Systems", code: "CSCD 302", creditHours: 3, instructor: "Prof. Asare", semester: "Semester 1", grade: 78 },
    { id: "c3", name: "Network Security", code: "CSCD 303", creditHours: 2, instructor: "Dr. Owusu", semester: "Semester 1", grade: 72 },
    { id: "c4", name: "Software Engineering", code: "CSCD 304", creditHours: 3, instructor: "Dr. Boateng", semester: "Semester 1", grade: 66 },
    { id: "c5", name: "Operating Systems", code: "CSCD 305", creditHours: 3, instructor: "Prof. Adjei", semester: "Semester 1", grade: 58 },
  ];

  const tasks = [
    { id: "t1", title: "Submit Database ER diagram", course: "Database Systems", dueDate: dayStr(-1), priority: "high", completed: false },
    { id: "t2", title: "Read Operating Systems Chapter 4", course: "Operating Systems", dueDate: dayStr(0), priority: "medium", completed: false },
    { id: "t3", title: "Group project meeting — sprint review", course: "Software Engineering", dueDate: dayStr(2), priority: "medium", completed: false },
    { id: "t4", title: "Web Dev assignment 3 (responsive layout)", course: "Web Development", dueDate: dayStr(5), priority: "high", completed: false },
    { id: "t5", title: "Revise SQL joins for quiz", course: "Database Systems", dueDate: dayStr(-2), priority: "low", completed: true },
  ];

  const sessions = [
    { id: "s1", courseId: "c1", courseName: "Web Development", minutes: 45, date: dayISO(-6) },
    { id: "s2", courseId: "c2", courseName: "Database Systems", minutes: 60, date: dayISO(-5) },
    { id: "s3", courseId: "c3", courseName: "Network Security", minutes: 30, date: dayISO(-4, 10) },
    { id: "s4", courseId: "c1", courseName: "Web Development", minutes: 25, date: dayISO(-4, 16) },
    { id: "s5", courseId: "c4", courseName: "Software Engineering", minutes: 50, date: dayISO(-3) },
    { id: "s6", courseId: "c2", courseName: "Database Systems", minutes: 40, date: dayISO(-2) },
    { id: "s7", courseId: "c5", courseName: "Operating Systems", minutes: 70, date: dayISO(-1) },
    { id: "s8", courseId: "c2", courseName: "Database Systems", minutes: 35, date: dayISO(0, 9) },
  ];

  const decks = [
    { id: "d1", name: "SQL Basics", course: "Database Systems", desc: "Core SQL commands, keys and joins", createdAt: dayISO(-5) },
    { id: "d2", name: "Networking Acronyms", course: "Network Security", desc: "Common protocol abbreviations", createdAt: dayISO(-3) },
  ];

  const cards = [
    { id: "fc1", deckId: "d1", front: "Which SQL statement retrieves data from a table?", back: "SELECT — e.g. SELECT * FROM students;", streak: 2 },
    { id: "fc2", deckId: "d1", front: "What is a PRIMARY KEY?", back: "A column (or set of columns) that uniquely identifies each row in a table.", streak: 2 },
    { id: "fc3", deckId: "d1", front: "Difference between INNER JOIN and LEFT JOIN?", back: "INNER JOIN returns only matching rows; LEFT JOIN returns all rows from the left table plus matches.", streak: 1 },
    { id: "fc4", deckId: "d1", front: "What problem does normalization solve?", back: "Data redundancy and update anomalies, by organising data into well-structured tables.", streak: 0 },
    { id: "fc5", deckId: "d1", front: "WHERE vs HAVING?", back: "WHERE filters rows before grouping; HAVING filters groups after GROUP BY.", streak: 3 },
    { id: "fc6", deckId: "d1", front: "What does GROUP BY do?", back: "Groups rows sharing a value so aggregate functions (COUNT, SUM, AVG) can be applied per group.", streak: 0 },
    { id: "fc7", deckId: "d2", front: "What does HTTPS stand for?", back: "HyperText Transfer Protocol Secure.", streak: 2 },
    { id: "fc8", deckId: "d2", front: "What does DNS do?", back: "Domain Name System — translates domain names into IP addresses.", streak: 1 },
    { id: "fc9", deckId: "d2", front: "What is a VPN?", back: "Virtual Private Network — an encrypted tunnel between your device and a remote network.", streak: 0 },
    { id: "fc10", deckId: "d2", front: "TCP vs UDP?", back: "TCP is reliable and connection-oriented; UDP is faster but connectionless with no delivery guarantee.", streak: 0 },
  ];

  const vault = [
    {
      id: "v1", kind: "text", title: "Normalization Summary (1NF → 3NF)", type: "note", course: "Database Systems",
      tags: ["normalization", "revision"],
      content: "1NF: atomic values, no repeating groups.\n2NF: 1NF + no partial dependency on a composite key.\n3NF: 2NF + no transitive dependencies.\n\nRule of thumb: every non-key attribute must depend on the key, the whole key, and nothing but the key.",
      createdAt: dayISO(-4), fileSize: 0,
    },
    {
      id: "v2", kind: "text", title: "2025 Mid-Semester Past Question — Q3", type: "exam", course: "Network Security",
      tags: ["past-question", "midsem"],
      content: "Q3 (a) Explain the difference between symmetric and asymmetric encryption. [6 marks]\n(b) Describe how a man-in-the-middle attack works and one way TLS prevents it. [8 marks]\n(c) Why should passwords be hashed with a salt? [6 marks]",
      createdAt: dayISO(-2), fileSize: 0,
    },
    {
      id: "v3", kind: "text", title: "HTTP Status Codes Cheat Sheet", type: "note", course: "Web Development",
      tags: ["http", "cheatsheet"],
      content: "200 OK — success\n201 Created — resource created\n301 Moved Permanently\n304 Not Modified (cache)\n400 Bad Request\n401 Unauthorized\n403 Forbidden\n404 Not Found\n500 Internal Server Error",
      createdAt: dayISO(-1), fileSize: 0,
    },
  ];

  save(KEYS.courses, courses);
  save(KEYS.tasks, tasks);
  save(KEYS.sessions, sessions);
  save(KEYS.decks, decks);
  save(KEYS.cards, cards);
  save(KEYS.vault, vault);
  const settings = getSettings();
  if (settings.name === "Student") settings.name = "Richard Yawlui";
  save(KEYS.settings, settings);
  save(KEYS.seeded, true);
}

/* ==================== THEME ==================== */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = $("themeToggle").querySelector("i");
  icon.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  const sel = $("themeSelect");
  if (sel) sel.value = theme;
  // Charts must be rebuilt to pick up the new palette
  renderPage(currentPage);
}

function toggleTheme() {
  const settings = getSettings();
  settings.theme = settings.theme === "dark" ? "light" : "dark";
  save(KEYS.settings, settings);
  applyTheme(settings.theme);
}

/* ==================== NAVIGATION (hash router) ==================== */
const PAGES = ["dashboard", "courses", "grades", "study", "flashcards", "vault", "goals", "settings"];
let currentPage = "dashboard";

function navigateTo(page) {
  if (!PAGES.includes(page)) page = "dashboard";
  currentPage = page;
  if (location.hash !== "#" + page) {
    history.replaceState(null, "", "#" + page);
  }
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active-page"));
  $(page + "Page").classList.add("active-page");
  document.querySelectorAll(".nav-menu li").forEach((li) => {
    li.classList.toggle("active", li.dataset.page === page);
  });
  renderPage(page);
}

function renderPage(page) {
  populateCourseSelects();
  switch (page) {
    case "dashboard": renderDashboard(); break;
    case "courses": renderCourses(); break;
    case "grades": renderGrades(); break;
    case "study": renderStudy(); break;
    case "flashcards": renderFlashcards(); break;
    case "vault": renderVault(); break;
    case "goals": renderTasksPage(); break;
    case "settings": renderSettings(); break;
  }
  updateNotifications();
}

/* Re-render whatever the user is looking at after any data change */
function refresh() {
  renderPage(currentPage);
}

/* ==================== CHARTS ==================== */
const charts = {};

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function baseChartOpts() {
  const grid = cssVar("--border");
  const ticks = cssVar("--text-muted");
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: cssVar("--text-soft"), font: { family: "Poppins" } } } },
    scales: {
      x: { grid: { color: grid }, ticks: { color: ticks, font: { family: "Poppins", size: 11 } } },
      y: { grid: { color: grid }, ticks: { color: ticks, font: { family: "Poppins", size: 11 } } },
    },
  };
}

function drawChart(id, config) {
  const canvas = $(id);
  if (!canvas) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(canvas.getContext("2d"), config);
}

function drawGradesBar() {
  const courses = getCourses();
  const opts = baseChartOpts();
  opts.scales.y.beginAtZero = true;
  opts.scales.y.max = 100;
  opts.plugins.legend.display = false;
  drawChart("gradesChart", {
    type: "bar",
    data: {
      labels: courses.map((c) => c.code || c.name.slice(0, 12)),
      datasets: [{
        data: courses.map((c) => Number(c.grade) || 0),
        backgroundColor: cssVar("--primary"),
        borderRadius: 8,
        maxBarThickness: 46,
      }],
    },
    options: opts,
  });
}

function studyLast7Days() {
  const sessions = getSessions();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(localDateStr(d));
  }
  const hours = days.map(
    (day) =>
      sessions
        .filter((s) => s.date && localDateStr(new Date(s.date)) === day)
        .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0) / 60,
  );
  return { days, hours };
}

function drawStudyLine(canvasId) {
  const { days, hours } = studyLast7Days();
  const opts = baseChartOpts();
  opts.scales.y.beginAtZero = true;
  opts.plugins.legend.display = false;
  const primary = cssVar("--primary");
  drawChart(canvasId, {
    type: "line",
    data: {
      labels: days.map((d) => new Date(d).toLocaleDateString(undefined, { weekday: "short" })),
      datasets: [{
        data: hours.map((h) => Math.round(h * 100) / 100),
        borderColor: primary,
        backgroundColor: primary + "22",
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: primary,
      }],
    },
    options: opts,
  });
}

const LETTER_COLORS = {
  A: "#00b894", "B+": "#00cec9", B: "#0ea5e9", "C+": "#f59e0b",
  C: "#e67e22", "D+": "#e17055", D: "#d63031", F: "#b71540",
};

function drawGradesDoughnut() {
  const counts = {};
  getCourses().forEach((c) => {
    const l = letterFor(c.grade);
    counts[l] = (counts[l] || 0) + 1;
  });
  const labels = Object.keys(counts);
  drawChart("gradesFullChart", {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: labels.map((l) => counts[l]),
        backgroundColor: labels.map((l) => LETTER_COLORS[l]),
        borderColor: cssVar("--surface"),
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      plugins: {
        legend: {
          position: "right",
          labels: { color: cssVar("--text-soft"), font: { family: "Poppins" }, padding: 14 },
        },
      },
    },
  });
}

/* ==================== DASHBOARD ==================== */
function studyStreak() {
  const days = new Set(getSessions().map((s) => localDateStr(new Date(s.date))));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(localDateStr(cursor))) cursor.setDate(cursor.getDate() - 1); // allow "yesterday" streaks
  while (days.has(localDateStr(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function hoursThisWeek() {
  const cutoff = Date.now() - 7 * 86400000;
  return getSessions()
    .filter((s) => new Date(s.date).getTime() >= cutoff)
    .reduce((sum, s) => sum + (Number(s.minutes) || 0), 0) / 60;
}

function renderDashboard() {
  const settings = getSettings();
  $("welcomeName").textContent = settings.name.split(" ")[0];
  $("todayDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const tasks = getTasks();
  const done = tasks.filter((t) => t.completed).length;
  $("statCourses").textContent = getCourses().length;
  $("statGPA").textContent = calculateGPA();
  $("statTasks").textContent = `${done}/${tasks.length}`;
  const wk = hoursThisWeek();
  $("statStudyWeek").textContent = `${wk.toFixed(1)}h`;
  $("statStreak").textContent = `${studyStreak()}-day streak`;

  drawGradesBar();
  drawStudyLine("studyChart");

  // Recent courses
  const rc = $("recentCoursesList");
  const courses = getCourses().slice(0, 4);
  rc.innerHTML = courses.length
    ? courses.map((c) => {
        const letter = letterFor(c.grade);
        return `<div class="course-item">
            <div class="course-info"><h4>${escapeHtml(c.name)}</h4><p>${escapeHtml(c.code || "")}</p></div>
            <div class="course-grade"><span class="grade-badge small ${letterClass(letter)}">${letter}</span></div>
          </div>`;
      }).join("")
    : `<div class="empty-state"><i class="fas fa-book-open"></i><p>No courses yet.</p><button class="btn-add" onclick="navigateTo('courses')">Add your first course</button></div>`;

  // Upcoming tasks (pending, sorted by due date)
  const pending = getTasks()
    .filter((t) => !t.completed)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
    .slice(0, 4);
  $("recentTasksList").innerHTML = pending.length
    ? pending.map(taskItemHTML).join("")
    : `<div class="empty-state"><i class="fas fa-mug-hot"></i><p>No pending tasks. Enjoy the calm!</p></div>`;
}

/* ==================== COURSES ==================== */
function populateCourseSelects() {
  const courses = getCourses();
  const opts = courses.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("");
  const byId = courses.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

  const map = [
    ["taskCourse", '<option value="">General</option>' + opts],
    ["deckCourse", '<option value="">General</option>' + opts],
    ["vaultDocCourse", '<option value="">General</option>' + opts],
    ["vaultCourseFilter", '<option value="all">All Courses</option>' + opts],
    ["studyCourseSelect", '<option value="">— Select course to log against —</option>' + byId],
  ];
  map.forEach(([id, html]) => {
    const el = $(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = html;
    if (prev && [...el.options].some((o) => o.value === prev)) el.value = prev;
  });
}

function renderCourses() {
  const container = $("coursesList");
  const term = ($("courseSearchInput").value || "").toLowerCase();
  const filter = $("courseFilter").value;
  const sort = $("courseSort").value;

  let list = getCourses().filter((c) => {
    const matches =
      c.name.toLowerCase().includes(term) || (c.code || "").toLowerCase().includes(term);
    const g = Number(c.grade) || 0;
    if (filter === "high") return matches && g >= 70;
    if (filter === "medium") return matches && g >= 50 && g < 70;
    if (filter === "low") return matches && g < 50;
    return matches;
  });

  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "grade-desc") list.sort((a, b) => (b.grade || 0) - (a.grade || 0));
  if (sort === "grade-asc") list.sort((a, b) => (a.grade || 0) - (b.grade || 0));

  container.innerHTML = list.length
    ? list.map((c) => {
        const g = Number(c.grade) || 0;
        const letter = letterFor(g);
        return `<div class="course-item">
          <div class="course-info">
            <h4>${escapeHtml(c.name)}</h4>
            <p>${escapeHtml(c.code || "No code")} · ${escapeHtml(c.instructor || "TBA")} · ${c.creditHours || 3} credit hrs</p>
          </div>
          <div class="course-grade">
            <span class="grade-badge ${letterClass(letter)}">${letter}</span>
            <div class="progress-bar"><div class="progress" style="width:${Math.min(g, 100)}%"></div></div>
            <span class="stat-label">${g}%</span>
          </div>
          <div class="course-actions">
            <button class="btn-icon edit" title="Edit" onclick="editCourse('${c.id}')"><i class="fas fa-pen"></i></button>
            <button class="btn-icon delete" title="Delete" onclick="askDeleteCourse('${c.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty-state"><i class="fas fa-book-open"></i><p>No courses found.</p><button class="btn-add" onclick="openCourseModalNew()">Add Course</button></div>`;

  // Stats strip
  const all = getCourses();
  const total = all.length;
  const avg = total ? all.reduce((s, c) => s + (Number(c.grade) || 0), 0) / total : 0;
  const credits = all.reduce((s, c) => s + (Number(c.creditHours) || 3), 0);
  const strong = all.filter((c) => (c.grade || 0) >= 70).length;
  const mid = all.filter((c) => (c.grade || 0) >= 50 && (c.grade || 0) < 70).length;
  const risk = all.filter((c) => (c.grade || 0) < 50).length;
  $("courseStats").innerHTML = `
    <div class="stat-item"><div class="stat-label">Total Courses</div><div class="stat-value">${total}</div></div>
    <div class="stat-item"><div class="stat-label">Average Score</div><div class="stat-value ${avg >= 70 ? "high" : avg >= 50 ? "medium" : "low"}">${avg.toFixed(1)}%</div></div>
    <div class="stat-item"><div class="stat-label">Credit Hours</div><div class="stat-value">${credits}</div></div>
    <div class="stat-item"><div class="stat-label">Strong / Avg / Risk</div><div class="stat-value"><span class="high">${strong}</span> / <span class="medium">${mid}</span> / <span class="low">${risk}</span></div></div>`;
}

function buildSemesterOptions(selected) {
  const now = new Date();
  const startYear = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [startYear, startYear + 1];
  let html = "";
  years.forEach((y) => {
    ["Semester 1", "Semester 2"].forEach((s) => {
      const label = `${s} · ${y}/${y + 1}`;
      html += `<option ${selected === label ? "selected" : ""}>${label}</option>`;
    });
  });
  html += `<option ${selected === "Summer" ? "selected" : ""}>Summer</option>`;
  // Preserve any custom/legacy value
  if (selected && !html.includes(`>${escapeHtml(selected)}<`)) {
    html = `<option selected>${escapeHtml(selected)}</option>` + html;
  }
  $("semester").innerHTML = html;
}

function openCourseModalNew() {
  $("courseForm").reset();
  $("courseId").value = "";
  $("creditHours").value = 3;
  $("modalTitle").textContent = "Add New Course";
  buildSemesterOptions("");
  updateGradePreview("");
  openModal("courseModal");
}

function editCourse(id) {
  const c = getCourses().find((x) => x.id === id);
  if (!c) return;
  $("courseId").value = c.id;
  $("courseName").value = c.name;
  $("courseCode").value = c.code || "";
  $("creditHours").value = c.creditHours || 3;
  $("instructor").value = c.instructor || "";
  buildSemesterOptions(c.semester || "");
  $("currentGrade").value = c.grade ?? "";
  updateGradePreview(c.grade);
  $("modalTitle").textContent = "Edit Course";
  openModal("courseModal");
}

function askDeleteCourse(id) {
  const c = getCourses().find((x) => x.id === id);
  if (!c) return;
  confirmAction("Delete Course", `Delete "${c.name}"? Its study logs will be kept.`, () => {
    save(KEYS.courses, getCourses().filter((x) => x.id !== id));
    showToast("Course deleted");
    refresh();
  });
}

function updateGradePreview(score) {
  const preview = $("gradePreview");
  if (score === "" || score === null || score === undefined || isNaN(Number(score))) {
    preview.textContent = "–";
    preview.className = "grade-preview";
    return;
  }
  const letter = letterFor(score);
  preview.textContent = letter;
  preview.className = `grade-preview ${letterClass(letter)}`;
}

/* ==================== GRADES PAGE ==================== */
function renderGrades() {
  const courses = getCourses();
  const gpa = calculateGPA();
  const avg = courses.length
    ? courses.reduce((s, c) => s + (Number(c.grade) || 0), 0) / courses.length
    : 0;
  const sorted = [...courses].sort((a, b) => (b.grade || 0) - (a.grade || 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  $("gradeStatsRow").innerHTML = `
    <div class="stat-card"><div class="stat-icon gold"><i class="fas fa-star"></i></div>
      <div class="stat-details"><h3>${gpa}</h3><p>Cumulative GPA (4.0)</p></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-percent"></i></div>
      <div class="stat-details"><h3>${avg.toFixed(1)}%</h3><p>Average Score</p></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-arrow-trend-up"></i></div>
      <div class="stat-details"><h3>${best ? escapeHtml(best.code || best.name) : "—"}</h3><p>Best Course${best ? ` (${best.grade}%)` : ""}</p></div></div>
    <div class="stat-card"><div class="stat-icon pink"><i class="fas fa-triangle-exclamation"></i></div>
      <div class="stat-details"><h3>${worst ? escapeHtml(worst.code || worst.name) : "—"}</h3><p>Needs Focus${worst ? ` (${worst.grade}%)` : ""}</p></div></div>`;

  drawGradesDoughnut();

  $("gradeTableBody").innerHTML = courses.length
    ? courses.map((c) => {
        const g = Number(c.grade) || 0;
        const letter = letterFor(g);
        const st = statusFor(g);
        return `<tr>
          <td><strong>${escapeHtml(c.name)}</strong><br><span class="stat-label">${escapeHtml(c.code || "")}</span></td>
          <td>${g}%</td>
          <td><span class="grade-badge small ${letterClass(letter)}">${letter}</span></td>
          <td>${pointsFor(g).toFixed(1)}</td>
          <td><span class="status-badge ${st.cls}">${st.label}</span></td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-chart-line"></i><p>Add courses with scores to see your analysis.</p></div></td></tr>`;
}

/* ==================== STUDY TRACKER & TIMER ==================== */
const timer = {
  mode: "focus", // focus | break
  running: false,
  remainingMs: 25 * 60 * 1000,
  elapsedFocusMs: 0, // unlogged focus time
  lastTick: null,
  intervalId: null,
};

function timerDuration(mode) {
  const s = getSettings();
  return (mode === "focus" ? s.focusLen : s.breakLen) * 60 * 1000;
}

function timerToggle() {
  if (timer.running) {
    // Pause
    timerTick(); // absorb time up to this instant
    clearInterval(timer.intervalId);
    timer.running = false;
  } else {
    timer.running = true;
    timer.lastTick = Date.now();
    timer.intervalId = setInterval(timerTick, 500);
  }
  updateTimerUI();
}

function timerTick() {
  if (!timer.running) return;
  const now = Date.now();
  const delta = now - timer.lastTick;
  timer.lastTick = now;
  timer.remainingMs -= delta;
  if (timer.mode === "focus") timer.elapsedFocusMs += delta;

  if (timer.remainingMs <= 0) {
    clearInterval(timer.intervalId);
    timer.running = false;
    if (timer.mode === "focus") {
      autoLogFocus();
      timer.mode = "break";
      showToast("Focus session complete — take a break! ☕", "info");
    } else {
      timer.mode = "focus";
      showToast("Break over — back to work! 💪", "info");
    }
    timer.remainingMs = timerDuration(timer.mode);
  }
  updateTimerUI();
}

function timerReset() {
  clearInterval(timer.intervalId);
  timer.running = false;
  timer.remainingMs = timerDuration(timer.mode);
  updateTimerUI();
}

function timerSkip() {
  clearInterval(timer.intervalId);
  timer.running = false;
  timer.mode = timer.mode === "focus" ? "break" : "focus";
  timer.remainingMs = timerDuration(timer.mode);
  updateTimerUI();
}

function fmtMs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateTimerUI() {
  const t = fmtMs(timer.remainingMs);
  const modeLabel = timer.mode === "focus" ? "Focus" : "Break";
  const chipCls = "timer-mode-chip" + (timer.mode === "break" ? " break" : "");

  [["studyTimerDisplay", "timerModeLabel", "studyTimerToggle"], ["dashTimerDisplay", "dashTimerMode", "dashTimerToggle"]].forEach(
    ([dispId, modeId, toggleId]) => {
      const disp = $(dispId);
      if (disp) disp.textContent = t;
      const mode = $(modeId);
      if (mode) {
        mode.textContent = modeLabel;
        mode.className = chipCls;
      }
      const btn = $(toggleId);
      if (btn) {
        btn.innerHTML = timer.running
          ? '<i class="fas fa-pause"></i> Pause'
          : '<i class="fas fa-play"></i> Start';
      }
    },
  );

  const mins = Math.floor(timer.elapsedFocusMs / 60000);
  const info = $("elapsedInfo");
  if (info) {
    info.textContent = mins >= 1
      ? `Unlogged focus time: ${mins} minute${mins === 1 ? "" : "s"}.`
      : "No unlogged focus time yet.";
  }
}

function autoLogFocus() {
  const mins = Math.floor(timer.elapsedFocusMs / 60000);
  const courseId = $("studyCourseSelect").value;
  if (mins >= 1 && courseId) {
    addSession(courseId, mins);
    timer.elapsedFocusMs = 0;
  } else if (mins >= 1) {
    showToast("Select a course, then press “Log Elapsed Time” to save this session.", "info");
  }
}

function logElapsedManually() {
  const courseId = $("studyCourseSelect").value;
  if (!courseId) {
    showToast("Select a course first", "error");
    return;
  }
  const mins = Math.floor(timer.elapsedFocusMs / 60000);
  if (mins < 1) {
    showToast("Study for at least one minute before logging", "error");
    return;
  }
  addSession(courseId, mins);
  timer.elapsedFocusMs = 0;
  updateTimerUI();
}

function addSession(courseId, minutes) {
  const course = getCourses().find((c) => c.id === courseId);
  const sessions = getSessions();
  sessions.push({
    id: uid(),
    courseId,
    courseName: course ? course.name : "General",
    minutes,
    date: new Date().toISOString(),
  });
  save(KEYS.sessions, sessions);
  showToast(`Logged ${minutes} min for ${course ? course.name : "General"} 🎉`);
  refresh();
}

function deleteSession(id) {
  save(KEYS.sessions, getSessions().filter((s) => s.id !== id));
  showToast("Session removed");
  refresh();
}

function renderStudy() {
  drawStudyLine("studyHistoryChart");

  const sessions = getSessions();
  const totalH = sessions.reduce((s, x) => s + (Number(x.minutes) || 0), 0) / 60;
  $("statStudyTotal").textContent = totalH.toFixed(1);
  $("statStudyWeek2").textContent = hoursThisWeek().toFixed(1);
  $("statStreakBig").textContent = studyStreak();

  const recent = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  $("sessionsList").innerHTML = recent.length
    ? recent.map((s) => `
        <div class="session-item">
          <i class="fas fa-book"></i>
          <span class="s-course">${escapeHtml(s.courseName)}</span>
          <span class="s-mins">${s.minutes} min</span>
          <span class="s-date">${fmtDate(s.date)}</span>
          <button class="btn-icon delete" title="Remove" onclick="deleteSession('${s.id}')"><i class="fas fa-xmark"></i></button>
        </div>`).join("")
    : `<div class="empty-state"><i class="fas fa-stopwatch"></i><p>No study sessions logged yet. Start the timer!</p></div>`;

  updateTimerUI();
}

/* ==================== FLASHCARDS ==================== */
let currentDeckId = null;
let studySession = null;

function renderFlashcards() {
  if (currentDeckId && getDecks().some((d) => d.id === currentDeckId)) {
    renderDeckDetail();
  } else {
    currentDeckId = null;
    $("decksView").hidden = false;
    $("deckDetailView").hidden = true;
    renderDeckGrid();
  }
}

function renderDeckGrid() {
  const decks = getDecks();
  const cards = getCards();
  $("deckGrid").innerHTML = decks.length
    ? decks.map((d) => {
        const dc = cards.filter((c) => c.deckId === d.id);
        const mastered = dc.filter((c) => (c.streak || 0) >= 2).length;
        const pct = dc.length ? Math.round((mastered / dc.length) * 100) : 0;
        return `<div class="deck-card" onclick="openDeck('${d.id}')">
          <div class="deck-card-top">
            <div>
              <h4>${escapeHtml(d.name)}</h4>
              <span class="deck-course">${escapeHtml(d.course || "General")}</span>
            </div>
            <div class="course-actions">
              <button class="btn-icon edit" onclick="event.stopPropagation();editDeck('${d.id}')" title="Edit"><i class="fas fa-pen"></i></button>
              <button class="btn-icon delete" onclick="event.stopPropagation();askDeleteDeck('${d.id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <p>${escapeHtml(d.desc || "")}</p>
          <div class="deck-mastery">
            <span>${dc.length} cards</span>
            <div class="progress-bar"><div class="progress" style="width:${pct}%"></div></div>
            <span>${pct}% mastered</span>
          </div>
        </div>`;
      }).join("")
    : `<div class="empty-state"><i class="fas fa-layer-group"></i><p>No decks yet. Create one and start revising with active recall!</p><button class="btn-add" onclick="openDeckModalNew()">Create a deck</button></div>`;
}

function openDeck(id) {
  currentDeckId = id;
  exitStudyMode(false);
  renderDeckDetail();
}

function renderDeckDetail() {
  const deck = getDecks().find((d) => d.id === currentDeckId);
  if (!deck) return renderFlashcards();
  $("decksView").hidden = true;
  $("deckDetailView").hidden = false;

  const cards = getCards().filter((c) => c.deckId === deck.id);
  const mastered = cards.filter((c) => (c.streak || 0) >= 2).length;
  $("deckTitle").textContent = deck.name;
  $("deckMeta").textContent = `${deck.course || "General"} · ${cards.length} cards · ${mastered} mastered`;

  $("cardsList").innerHTML = cards.length
    ? cards.map((c) => `
        <div class="card-row">
          <span class="c-front">${escapeHtml(c.front)}</span>
          <span class="c-back">${escapeHtml(c.back)}</span>
          <span class="${(c.streak || 0) >= 2 ? "c-mastered" : "c-learning"}">${(c.streak || 0) >= 2 ? "Mastered" : "Learning"}</span>
          <button class="btn-icon edit" onclick="editCard('${c.id}')" title="Edit"><i class="fas fa-pen"></i></button>
          <button class="btn-icon delete" onclick="askDeleteCard('${c.id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`).join("")
    : `<div class="empty-state"><i class="fas fa-layer-group"></i><p>This deck has no cards yet.</p><button class="btn-add" onclick="openCardModalNew()">Add the first card</button></div>`;
}

function openDeckModalNew() {
  $("deckForm").reset();
  $("deckId").value = "";
  $("deckModalTitle").textContent = "New Deck";
  populateCourseSelects();
  openModal("deckModal");
}

function editDeck(id) {
  const d = getDecks().find((x) => x.id === id);
  if (!d) return;
  populateCourseSelects();
  $("deckId").value = d.id;
  $("deckName").value = d.name;
  $("deckCourse").value = d.course || "";
  $("deckDesc").value = d.desc || "";
  $("deckModalTitle").textContent = "Edit Deck";
  openModal("deckModal");
}

function askDeleteDeck(id) {
  const d = getDecks().find((x) => x.id === id);
  if (!d) return;
  confirmAction("Delete Deck", `Delete "${d.name}" and all its cards?`, () => {
    save(KEYS.decks, getDecks().filter((x) => x.id !== id));
    save(KEYS.cards, getCards().filter((c) => c.deckId !== id));
    if (currentDeckId === id) currentDeckId = null;
    showToast("Deck deleted");
    refresh();
  });
}

function openCardModalNew() {
  $("cardForm").reset();
  $("cardId").value = "";
  $("cardModalTitle").textContent = "Add Card";
  openModal("cardModal");
}

function editCard(id) {
  const c = getCards().find((x) => x.id === id);
  if (!c) return;
  $("cardId").value = c.id;
  $("cardFront").value = c.front;
  $("cardBack").value = c.back;
  $("cardModalTitle").textContent = "Edit Card";
  openModal("cardModal");
}

function askDeleteCard(id) {
  confirmAction("Delete Card", "Delete this flashcard?", () => {
    save(KEYS.cards, getCards().filter((c) => c.id !== id));
    showToast("Card deleted");
    refresh();
  });
}

/* ---------- Study mode ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startStudyMode() {
  const cards = getCards().filter((c) => c.deckId === currentDeckId);
  if (!cards.length) {
    showToast("Add some cards to this deck first", "error");
    return;
  }
  // Unmastered cards first, then mastered — both shuffled
  const queue = [
    ...shuffle(cards.filter((c) => (c.streak || 0) < 2)),
    ...shuffle(cards.filter((c) => (c.streak || 0) >= 2)),
  ];
  studySession = { queue, idx: 0, known: 0 };
  $("cardsListWrap").hidden = true;
  $("studyView").hidden = false;
  document.querySelector(".study-controls").style.display = "flex";
  $("flashcard").style.display = "";
  document.querySelector(".flip-hint").style.display = "";
  showStudyCard();
}

function showStudyCard() {
  const s = studySession;
  const card = s.queue[s.idx];
  const fc = $("flashcard");
  fc.classList.remove("flipped");
  // Delay text swap so the answer isn't visible mid-flip
  setTimeout(() => {
    $("cardFrontFace").textContent = card.front;
    $("cardBackFace").textContent = card.back;
  }, 60);
  $("studyProgressText").textContent = `${s.idx + 1} / ${s.queue.length}`;
  $("studyProgressFill").style.width = `${(s.idx / s.queue.length) * 100}%`;
}

function answerCard(known) {
  const s = studySession;
  if (!s) return;
  const card = s.queue[s.idx];
  const all = getCards();
  const target = all.find((c) => c.id === card.id);
  if (target) {
    target.streak = known ? (target.streak || 0) + 1 : 0;
    save(KEYS.cards, all);
  }
  if (known) s.known++;
  s.idx++;
  if (s.idx >= s.queue.length) {
    finishStudyMode();
  } else {
    showStudyCard();
  }
}

function finishStudyMode() {
  const s = studySession;
  const pct = Math.round((s.known / s.queue.length) * 100);
  $("studyProgressFill").style.width = "100%";
  $("studyProgressText").textContent = "Done!";
  $("flashcard").classList.remove("flipped");
  setTimeout(() => {
    $("cardFrontFace").innerHTML = `🎉 Session complete!<br><br>You knew <strong>${s.known} / ${s.queue.length}</strong> (${pct}%).<br><span style="font-size:14px;opacity:.85">Cards you missed will appear first next time.</span>`;
  }, 60);
  document.querySelector(".study-controls").style.display = "none";
  studySession = null;
}

function exitStudyMode(rerender = true) {
  studySession = null;
  $("studyView").hidden = true;
  $("cardsListWrap").hidden = false;
  if (rerender) renderDeckDetail();
}

/* ==================== VAULT ==================== */
function renderVault() {
  const items = getVault();
  const courseF = $("vaultCourseFilter").value || "all";
  const typeF = $("vaultTypeFilter").value || "all";
  const term = ($("vaultSearch").value || "").toLowerCase();

  const filtered = items.filter((it) => {
    if (courseF !== "all" && it.course !== courseF) return false;
    if (typeF !== "all" && it.type !== typeF) return false;
    if (term) {
      const hay = (it.title + " " + (it.tags || []).join(" ")).toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });

  $("totalNotes").textContent = items.length;
  const bytes = items.reduce((s, it) => s + (it.fileSize || (it.content ? it.content.length : 0)), 0);
  $("totalStorage").textContent = (bytes / (1024 * 1024)).toFixed(2);

  const icons = { text: "fa-note-sticky", image: "fa-image", pdf: "fa-file-pdf" };
  $("vaultGrid").innerHTML = filtered.length
    ? filtered
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((it) => {
          let icon = icons.text;
          if (it.kind === "file") icon = (it.fileType || "").includes("pdf") ? icons.pdf : icons.image;
          return `<div class="vault-card" onclick="openVaultItem('${it.id}')">
            <div class="vault-card-icon"><i class="fas ${icon}"></i></div>
            <div class="vault-card-info">
              <h4>${escapeHtml(it.title)}</h4>
              <p>${escapeHtml(it.course || "General")}${(it.tags || []).length ? " · " + escapeHtml(it.tags.join(", ")) : ""}</p>
              <span class="vault-date">${fmtDate(it.createdAt)}</span>
            </div>
            <span class="vault-card-badge ${it.type}">${it.type === "exam" ? "past q" : it.type}</span>
          </div>`;
        }).join("")
    : `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-folder-open"></i><p>Nothing here yet. Write a note or upload a document!</p></div>`;
}

function openNoteModalNew() {
  $("vaultItemId").value = "";
  $("vaultModalTitle").textContent = "New Note";
  $("vaultDocTitle").value = "";
  $("vaultDocType").value = "note";
  populateCourseSelects();
  $("vaultDocCourse").value = "";
  $("vaultDocTags").value = "";
  $("vaultDocContent").value = "";
  $("vaultContentGroup").hidden = false;
  $("vaultPreview").hidden = true;
  $("downloadFileBtn").hidden = true;
  $("deleteVaultItemBtn").hidden = true;
  openModal("vaultModal");
}

async function openVaultItem(id) {
  const it = getVault().find((x) => x.id === id);
  if (!it) return;
  $("vaultItemId").value = it.id;
  $("vaultModalTitle").textContent = it.kind === "file" ? "Document Details" : "Edit Note";
  $("vaultDocTitle").value = it.title;
  $("vaultDocType").value = it.type || "note";
  populateCourseSelects();
  $("vaultDocCourse").value = it.course || "";
  $("vaultDocTags").value = (it.tags || []).join(", ");
  $("deleteVaultItemBtn").hidden = false;

  if (it.kind === "file") {
    $("vaultContentGroup").hidden = true;
    $("downloadFileBtn").hidden = false;
    const preview = $("vaultPreview");
    preview.hidden = false;
    preview.innerHTML = `<span class="file-chip"><i class="fas fa-spinner fa-spin"></i> Loading preview…</span>`;
    try {
      const blob = await getFile(it.id);
      if (!blob) {
        preview.innerHTML = `<span class="file-chip"><i class="fas fa-file-circle-question"></i> File data not found on this device (backups only include note text).</span>`;
        $("downloadFileBtn").hidden = true;
      } else if ((it.fileType || "").startsWith("image/")) {
        preview.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="preview">`;
      } else {
        preview.innerHTML = `<span class="file-chip"><i class="fas fa-file-pdf"></i> ${escapeHtml(it.fileName || "document.pdf")} · ${((it.fileSize || 0) / 1024).toFixed(0)} KB</span>`;
      }
    } catch {
      preview.innerHTML = `<span class="file-chip"><i class="fas fa-triangle-exclamation"></i> Could not load preview.</span>`;
    }
  } else {
    $("vaultContentGroup").hidden = false;
    $("vaultDocContent").value = it.content || "";
    $("vaultPreview").hidden = true;
    $("downloadFileBtn").hidden = true;
  }
  openModal("vaultModal");
}

function saveVaultItem() {
  const id = $("vaultItemId").value;
  const title = $("vaultDocTitle").value.trim();
  if (!title) {
    showToast("Give it a title", "error");
    return;
  }
  const meta = {
    title,
    type: $("vaultDocType").value,
    course: $("vaultDocCourse").value,
    tags: $("vaultDocTags").value.split(",").map((t) => t.trim()).filter(Boolean),
  };
  const items = getVault();
  if (id) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    Object.assign(it, meta);
    if (it.kind === "text") it.content = $("vaultDocContent").value;
  } else {
    items.push({
      id: uid(),
      kind: "text",
      content: $("vaultDocContent").value,
      createdAt: new Date().toISOString(),
      fileSize: 0,
      ...meta,
    });
  }
  save(KEYS.vault, items);
  closeModalById("vaultModal");
  showToast(id ? "Saved changes" : "Note created");
  refresh();
}

function deleteVaultItemFlow() {
  const id = $("vaultItemId").value;
  const it = getVault().find((x) => x.id === id);
  if (!it) return;
  closeModalById("vaultModal");
  confirmAction("Delete Item", `Delete "${it.title}"? This cannot be undone.`, async () => {
    save(KEYS.vault, getVault().filter((x) => x.id !== id));
    if (it.kind === "file") {
      try { await deleteFile(id); } catch { /* file may not exist */ }
    }
    showToast("Item deleted");
    refresh();
  });
}

async function downloadVaultFile() {
  const id = $("vaultItemId").value;
  const it = getVault().find((x) => x.id === id);
  if (!it) return;
  const blob = await getFile(id);
  if (!blob) {
    showToast("File data not available", "error");
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = it.fileName || it.title;
  a.click();
  URL.revokeObjectURL(a.href);
}

const MAX_FILE_MB = 10;

async function importFiles(fileList) {
  const files = Array.from(fileList);
  let added = 0;
  for (const file of files) {
    const isValid = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isValid) {
      showToast(`"${file.name}" skipped — only images and PDFs are supported`, "error");
      continue;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      showToast(`"${file.name}" skipped — larger than ${MAX_FILE_MB} MB`, "error");
      continue;
    }
    const id = uid();
    try {
      await putFile(id, file);
    } catch (e) {
      console.error("IndexedDB write failed:", e);
      showToast(`Could not store "${file.name}"`, "error");
      continue;
    }
    const courseF = $("vaultCourseFilter").value;
    const items = getVault();
    items.push({
      id,
      kind: "file",
      title: file.name.replace(/\.[^.]+$/, ""),
      type: "note",
      course: courseF && courseF !== "all" ? courseF : "",
      tags: [],
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
    });
    save(KEYS.vault, items);
    added++;
  }
  if (added) {
    showToast(`${added} file${added === 1 ? "" : "s"} added to your vault`);
    refresh();
  }
}

/* ==================== TASKS ==================== */
function taskItemHTML(t) {
  const overdue = t.dueDate && !t.completed && t.dueDate < todayStr();
  return `<div class="task-item ${t.completed ? "completed" : ""}">
    <input type="checkbox" ${t.completed ? "checked" : ""} onchange="toggleTask('${t.id}')">
    <label>
      <span class="task-title">${escapeHtml(t.title)}</span>
      <span class="task-date ${overdue ? "overdue" : ""}">${dueLabel(t.dueDate)}${t.course ? " · " + escapeHtml(t.course) : ""}</span>
    </label>
    <span class="task-priority ${t.priority}">${t.priority}</span>
    <button class="btn-icon edit" onclick="editTask('${t.id}')" title="Edit"><i class="fas fa-pen"></i></button>
    <button class="btn-icon delete" onclick="askDeleteTask('${t.id}')" title="Delete"><i class="fas fa-trash"></i></button>
  </div>`;
}

function renderTasksPage() {
  const tasks = getTasks();
  const container = $("allTasksList");
  const today = todayStr();

  const done = tasks.filter((t) => t.completed).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  $("taskProgressFill").style.width = pct + "%";
  $("taskProgressText").textContent = `${pct}% complete (${done}/${tasks.length})`;

  if (!tasks.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-list-check"></i><p>No tasks yet. Click "Add Task" to plan your work!</p></div>`;
    return;
  }

  const pending = tasks.filter((t) => !t.completed);
  const groups = [
    ["Overdue", pending.filter((t) => t.dueDate && t.dueDate < today), "overdue"],
    ["Due Today", pending.filter((t) => t.dueDate === today), ""],
    ["Upcoming", pending.filter((t) => t.dueDate && t.dueDate > today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)), ""],
    ["No Due Date", pending.filter((t) => !t.dueDate), ""],
    ["Completed", tasks.filter((t) => t.completed), ""],
  ];

  container.innerHTML = groups
    .filter(([, list]) => list.length)
    .map(([label, list, cls]) =>
      `<div class="task-group-title ${cls}">${label} (${list.length})</div>` +
      list.map(taskItemHTML).join(""))
    .join("");
}

function openTaskModalNew() {
  $("taskForm").reset();
  $("taskId").value = "";
  $("taskModalTitle").textContent = "Add Task";
  populateCourseSelects();
  openModal("taskModal");
}

function editTask(id) {
  const t = getTasks().find((x) => x.id === id);
  if (!t) return;
  populateCourseSelects();
  $("taskId").value = t.id;
  $("taskTitle").value = t.title;
  $("taskCourse").value = t.course || "";
  $("taskDueDate").value = t.dueDate || "";
  $("taskPriority").value = t.priority || "medium";
  $("taskModalTitle").textContent = "Edit Task";
  openModal("taskModal");
}

function toggleTask(id) {
  const tasks = getTasks();
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  save(KEYS.tasks, tasks);
  if (t.completed) showToast("Task completed — nice work! ✅");
  refresh();
}

function askDeleteTask(id) {
  const t = getTasks().find((x) => x.id === id);
  if (!t) return;
  confirmAction("Delete Task", `Delete "${t.title}"?`, () => {
    save(KEYS.tasks, getTasks().filter((x) => x.id !== id));
    showToast("Task deleted");
    refresh();
  });
}

/* ==================== NOTIFICATIONS & SEARCH ==================== */
function updateNotifications() {
  const tasks = getTasks().filter((t) => !t.completed);
  const today = todayStr();
  const overdue = tasks.filter((t) => t.dueDate && t.dueDate < today);
  const dueToday = tasks.filter((t) => t.dueDate === today);
  const count = overdue.length + dueToday.length;

  const badge = $("notifBadge");
  badge.hidden = count === 0;
  badge.textContent = count;

  let html = `<div class="notif-head">Notifications</div>`;
  overdue.forEach((t) => {
    html += `<div class="notif-item overdue"><i class="fas fa-circle-exclamation"></i><span><strong>${escapeHtml(t.title)}</strong><br>${dueLabel(t.dueDate)}</span></div>`;
  });
  dueToday.forEach((t) => {
    html += `<div class="notif-item today"><i class="fas fa-clock"></i><span><strong>${escapeHtml(t.title)}</strong><br>Due today</span></div>`;
  });
  const streak = studyStreak();
  if (streak >= 2) {
    html += `<div class="notif-item info"><i class="fas fa-fire"></i><span>You're on a <strong>${streak}-day</strong> study streak. Keep it going!</span></div>`;
  }
  if (!count && streak < 2) {
    html += `<div class="notif-item info"><i class="fas fa-circle-check"></i><span>All caught up — nothing urgent.</span></div>`;
  }
  $("notifDropdown").innerHTML = html;
}

function runGlobalSearch(term) {
  const box = $("searchResults");
  const q = term.trim().toLowerCase();
  if (q.length < 2) {
    box.classList.remove("open");
    box.innerHTML = "";
    return;
  }
  const results = [];
  getCourses().forEach((c) => {
    if ((c.name + " " + (c.code || "")).toLowerCase().includes(q))
      results.push({ icon: "fa-book", label: `${c.name} (${c.code || ""})`, kind: "Course", page: "courses" });
  });
  getTasks().forEach((t) => {
    if (t.title.toLowerCase().includes(q))
      results.push({ icon: "fa-list-check", label: t.title, kind: "Task", page: "goals" });
  });
  getVault().forEach((v) => {
    if ((v.title + " " + (v.tags || []).join(" ")).toLowerCase().includes(q))
      results.push({ icon: "fa-folder-open", label: v.title, kind: "Vault", page: "vault" });
  });
  getDecks().forEach((d) => {
    if (d.name.toLowerCase().includes(q))
      results.push({ icon: "fa-layer-group", label: d.name, kind: "Deck", page: "flashcards" });
  });

  box.innerHTML = results.length
    ? results.slice(0, 8).map((r, i) =>
        `<div class="search-result-item" data-page="${r.page}">
          <i class="fas ${r.icon}"></i><span>${escapeHtml(r.label)}</span><span class="sr-kind">${r.kind}</span>
        </div>`).join("")
    : `<div class="search-result-item"><i class="fas fa-magnifying-glass"></i><span>No results for "${escapeHtml(term)}"</span></div>`;
  box.classList.add("open");
}

/* ==================== SETTINGS ==================== */
function renderSettings() {
  const s = getSettings();
  $("settingsName").value = s.name;
  $("settingsEmail").value = s.email;
  $("weeklyGoalInput").value = s.weeklyGoal;
  $("focusLenInput").value = s.focusLen;
  $("breakLenInput").value = s.breakLen;
  $("themeSelect").value = s.theme;
}

function applyProfileToUI() {
  const s = getSettings();
  $("userName").textContent = s.name;
  $("userEmail").textContent = s.email || "Local account";
  $("welcomeName").textContent = s.name.split(" ")[0];
  const initials = s.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  $("profileAvatar").textContent = initials || "S";
}

function exportData() {
  const data = {
    app: "gradeguardian",
    version: 2,
    exportedAt: new Date().toISOString(),
    courses: getCourses(),
    tasks: getTasks(),
    sessions: getSessions(),
    vault: getVault(),
    decks: getDecks(),
    cards: getCards(),
    settings: getSettings(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gradeguardian-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast("Backup exported ✓");
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== "gradeguardian") throw new Error("Not a GradeGuardian backup");
      confirmAction(
        "Import Backup",
        "This will replace your current data with the backup. Continue?",
        () => {
          save(KEYS.courses, data.courses || []);
          save(KEYS.tasks, data.tasks || []);
          save(KEYS.sessions, data.sessions || []);
          save(KEYS.vault, data.vault || []);
          save(KEYS.decks, data.decks || []);
          save(KEYS.cards, data.cards || []);
          save(KEYS.settings, { ...DEFAULT_SETTINGS, ...(data.settings || {}) });
          save(KEYS.seeded, true);
          showToast("Backup imported — reloading…");
          setTimeout(() => location.reload(), 800);
        },
      );
    } catch (e) {
      showToast("Invalid backup file: " + e.message, "error");
    }
  };
  reader.readAsText(file);
}

/* ==================== EVENT WIRING ==================== */
function setupEventListeners() {
  /* --- Navigation --- */
  document.querySelectorAll(".nav-menu li").forEach((li) => {
    li.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(li.dataset.page);
    });
  });
  window.addEventListener("hashchange", () => navigateTo(location.hash.slice(1)));

  /* --- Theme --- */
  $("themeToggle").addEventListener("click", toggleTheme);

  /* --- Generic modal close buttons + overlay clicks + Esc --- */
  document.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", () => closeModalById(btn.dataset.close));
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.hidden = true;
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
      $("searchResults").classList.remove("open");
      $("notifDropdown").classList.remove("open");
    }
    // Space flips the card during study mode
    if (e.key === " " && studySession && !$("studyView").hidden && e.target === document.body) {
      e.preventDefault();
      $("flashcard").classList.toggle("flipped");
    }
  });

  /* --- Confirm modal --- */
  $("confirmOkBtn").addEventListener("click", () => {
    closeModalById("confirmModal");
    if (confirmCallback) {
      const cb = confirmCallback;
      confirmCallback = null;
      cb();
    }
  });

  /* --- Courses --- */
  $("openCourseModal").addEventListener("click", openCourseModalNew);
  $("courseForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const grade = parseFloat($("currentGrade").value);
    const data = {
      name: $("courseName").value.trim(),
      code: $("courseCode").value.trim(),
      creditHours: Math.min(6, Math.max(1, parseInt($("creditHours").value) || 3)),
      instructor: $("instructor").value.trim(),
      semester: $("semester").value,
      grade: isNaN(grade) ? 0 : Math.min(100, Math.max(0, grade)),
    };
    const id = $("courseId").value;
    const courses = getCourses();
    if (id) {
      const idx = courses.findIndex((c) => c.id === id);
      if (idx !== -1) courses[idx] = { ...courses[idx], ...data };
      showToast("Course updated");
    } else {
      courses.push({ id: uid(), ...data });
      showToast("Course added");
    }
    save(KEYS.courses, courses);
    closeModalById("courseModal");
    refresh();
  });
  $("currentGrade").addEventListener("input", (e) => updateGradePreview(e.target.value));
  $("courseSearchInput").addEventListener("input", renderCourses);
  $("courseFilter").addEventListener("change", renderCourses);
  $("courseSort").addEventListener("change", renderCourses);

  /* --- Tasks --- */
  $("addTaskBtn").addEventListener("click", openTaskModalNew);
  $("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      title: $("taskTitle").value.trim(),
      course: $("taskCourse").value,
      dueDate: $("taskDueDate").value,
      priority: $("taskPriority").value,
    };
    const id = $("taskId").value;
    const tasks = getTasks();
    if (id) {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx !== -1) tasks[idx] = { ...tasks[idx], ...data };
      showToast("Task updated");
    } else {
      tasks.push({ id: uid(), completed: false, ...data });
      showToast("Task added");
    }
    save(KEYS.tasks, tasks);
    closeModalById("taskModal");
    refresh();
  });

  /* --- Timer --- */
  $("studyTimerToggle").addEventListener("click", timerToggle);
  $("dashTimerToggle").addEventListener("click", timerToggle);
  $("studyTimerReset").addEventListener("click", timerReset);
  $("dashTimerReset").addEventListener("click", timerReset);
  $("timerSkip").addEventListener("click", timerSkip);
  $("logStudyBtn").addEventListener("click", logElapsedManually);

  /* --- Flashcards --- */
  $("addDeckBtn").addEventListener("click", openDeckModalNew);
  $("deckForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: $("deckName").value.trim(),
      course: $("deckCourse").value,
      desc: $("deckDesc").value.trim(),
    };
    const id = $("deckId").value;
    const decks = getDecks();
    if (id) {
      const idx = decks.findIndex((d) => d.id === id);
      if (idx !== -1) decks[idx] = { ...decks[idx], ...data };
      showToast("Deck updated");
    } else {
      decks.push({ id: uid(), createdAt: new Date().toISOString(), ...data });
      showToast("Deck created");
    }
    save(KEYS.decks, decks);
    closeModalById("deckModal");
    refresh();
  });
  $("backToDecks").addEventListener("click", () => {
    currentDeckId = null;
    exitStudyMode(false);
    renderFlashcards();
  });
  $("addCardBtn").addEventListener("click", openCardModalNew);
  $("cardForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = { front: $("cardFront").value.trim(), back: $("cardBack").value.trim() };
    const id = $("cardId").value;
    const cards = getCards();
    if (id) {
      const idx = cards.findIndex((c) => c.id === id);
      if (idx !== -1) cards[idx] = { ...cards[idx], ...data };
      showToast("Card updated");
    } else {
      cards.push({ id: uid(), deckId: currentDeckId, streak: 0, ...data });
      showToast("Card added");
    }
    save(KEYS.cards, cards);
    closeModalById("cardModal");
    refresh();
  });
  $("studyModeBtn").addEventListener("click", startStudyMode);
  $("exitStudy").addEventListener("click", () => exitStudyMode());
  $("flashcard").addEventListener("click", () => $("flashcard").classList.toggle("flipped"));
  $("knowBtn").addEventListener("click", () => answerCard(true));
  $("dontKnowBtn").addEventListener("click", () => answerCard(false));

  /* --- Vault --- */
  $("addNoteBtn").addEventListener("click", openNoteModalNew);
  $("saveVaultItemBtn").addEventListener("click", saveVaultItem);
  $("deleteVaultItemBtn").addEventListener("click", deleteVaultItemFlow);
  $("downloadFileBtn").addEventListener("click", downloadVaultFile);
  $("vaultCourseFilter").addEventListener("change", renderVault);
  $("vaultTypeFilter").addEventListener("change", renderVault);
  $("vaultSearch").addEventListener("input", renderVault);

  const uploadArea = $("uploadArea");
  const fileInput = $("fileInput");
  $("browseBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  uploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    importFiles(e.target.files);
    fileInput.value = "";
  });
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("dragging");
  });
  uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragging"));
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("dragging");
    importFiles(e.dataTransfer.files);
  });

  /* --- Search --- */
  const searchInput = $("globalSearch");
  searchInput.addEventListener("input", (e) => runGlobalSearch(e.target.value));
  $("searchResults").addEventListener("click", (e) => {
    const item = e.target.closest(".search-result-item");
    if (item && item.dataset.page) {
      navigateTo(item.dataset.page);
      $("searchResults").classList.remove("open");
      searchInput.value = "";
    }
  });

  /* --- Notifications --- */
  $("notificationBell").addEventListener("click", (e) => {
    e.stopPropagation();
    updateNotifications();
    $("notifDropdown").classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".header-icons")) $("notifDropdown").classList.remove("open");
    if (!e.target.closest(".search-bar")) $("searchResults").classList.remove("open");
  });

  /* --- Settings --- */
  $("saveProfileBtn").addEventListener("click", () => {
    const s = getSettings();
    s.name = $("settingsName").value.trim() || "Student";
    s.email = $("settingsEmail").value.trim();
    save(KEYS.settings, s);
    applyProfileToUI();
    showToast("Profile saved");
  });
  $("savePrefsBtn").addEventListener("click", () => {
    const s = getSettings();
    s.weeklyGoal = Math.max(1, parseInt($("weeklyGoalInput").value) || 10);
    s.focusLen = Math.min(120, Math.max(5, parseInt($("focusLenInput").value) || 25));
    s.breakLen = Math.min(60, Math.max(1, parseInt($("breakLenInput").value) || 5));
    s.theme = $("themeSelect").value;
    save(KEYS.settings, s);
    if (!timer.running) timer.remainingMs = timerDuration(timer.mode);
    applyTheme(s.theme);
    updateTimerUI();
    showToast("Preferences saved");
  });
  $("exportDataBtn").addEventListener("click", exportData);
  $("importDataBtn").addEventListener("click", () => $("importFileInput").click());
  $("importFileInput").addEventListener("change", (e) => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = "";
  });
  $("demoDataBtn").addEventListener("click", () => {
    confirmAction("Load Demo Data", "This replaces current data with sample data. Continue?", () => {
      seedDemoData();
      showToast("Demo data loaded — reloading…");
      setTimeout(() => location.reload(), 700);
    });
  });
  $("clearDataBtn").addEventListener("click", () => {
    confirmAction("Reset All Data", "This permanently deletes ALL your local data. Continue?", async () => {
      localStorage.clear();
      try {
        const db = await openFileDB();
        db.transaction("files", "readwrite").objectStore("files").clear();
      } catch { /* ignore */ }
      showToast("All data cleared — reloading…");
      setTimeout(() => location.reload(), 700);
    });
  });
}

/* ==================== BOOT ==================== */
document.addEventListener("DOMContentLoaded", () => {
  migrateV1();
  if (!load(KEYS.seeded, false)) seedDemoData();

  // Theme (URL ?theme=… override is handy for demos)
  const settings = getSettings();
  const urlTheme = new URLSearchParams(location.search).get("theme");
  if (urlTheme === "dark" || urlTheme === "light") {
    settings.theme = urlTheme;
    save(KEYS.settings, settings);
  }
  document.documentElement.setAttribute("data-theme", settings.theme);
  const icon = $("themeToggle").querySelector("i");
  icon.className = settings.theme === "dark" ? "fas fa-sun" : "fas fa-moon";

  timer.remainingMs = timerDuration("focus");

  setupEventListeners();
  applyProfileToUI();

  const start = location.hash.slice(1);
  navigateTo(PAGES.includes(start) ? start : "dashboard");
  updateTimerUI();
});

/* Expose functions used by inline handlers */
Object.assign(window, {
  navigateTo, editCourse, askDeleteCourse, openCourseModalNew,
  editTask, askDeleteTask, toggleTask,
  openDeck, editDeck, askDeleteDeck, openDeckModalNew, openCardModalNew, editCard, askDeleteCard,
  openVaultItem, deleteSession,
});
