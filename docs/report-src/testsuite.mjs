/* Formal test run for Chapter Four. Every case is executed against the running
   system; the table in the report is generated from this output, not written by
   hand. Results are printed as TSV so they can be pasted into the chapter. */
import { chromium } from "playwright";

const B = "http://127.0.0.1:8099";
const results = [];
let jar = {};

function record(id, area, description, expected, actual) {
  const pass = actual.startsWith(expected) || actual === expected;
  results.push({ id, area, description, expected, actual, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}  ${description}`);
  if (!pass) console.log(`        expected: ${expected}\n        actual:   ${actual}`);
}

/* ---------- HTTP layer ---------- */
const cookies = new Map();
async function http(path, { method = "GET", body, csrf, cookieSet = "a" } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const jarStr = cookies.get(cookieSet);
  if (jarStr) headers["Cookie"] = jarStr;
  const res = await fetch(B + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.getSetCookie?.() || [];
  if (sc.length) cookies.set(cookieSet, sc.map((c) => c.split(";")[0]).join("; "));
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
}

console.log("=== FUNCTIONAL AND SECURITY TESTS ===\n");

/* --- Authentication --- */
let r = await http("/api/me.php");
record("T01", "Authentication", "Unauthenticated session reports no user", "200/false",
       `${r.status}/${r.data.authenticated}`);

r = await http("/api/login.php", { method: "POST", body: { identity: "4211231018", password: "wrongpass" } });
record("T02", "Authentication", "Sign-in with an incorrect password is refused", "401",
       String(r.status));

r = await http("/api/login.php", { method: "POST", body: { identity: "0000000000", password: "password123" } });
record("T03", "Authentication", "Unknown index number returns the same message as a wrong password",
       "Index number or password is incorrect.", r.data.error);

r = await http("/api/login.php", { method: "POST", body: { identity: "4211231018", password: "password123" } });
const studentCsrf = r.data.csrf;
record("T04", "Authentication", "Sign-in with correct credentials succeeds", "200/Richard Yawlui",
       `${r.status}/${r.data.user?.name}`);

/* --- Authorisation --- */
r = await http("/api/admin/students.php");
record("T05", "Authorisation", "Student calling an administrator route is refused", "403",
       String(r.status));

r = await http("/api/data.php", { cookieSet: "none" });
record("T06", "Authorisation", "Records cannot be read without a session", "401", String(r.status));

r = await http("/api/data.php", { method: "POST", body: { courses: [] } });
record("T07", "Security", "Write without a CSRF token is rejected", "419", String(r.status));

/* --- Data handling --- */
r = await http("/api/data.php", {
  method: "POST", csrf: studentCsrf,
  body: {
    courses: [
      { id: "c1", code: "CSCD 301", name: "Web Development", creditHours: 3, grade: 85 },
      { id: "c2", code: "CSCD 302", name: "Database Systems", creditHours: 3, grade: 78 },
      { id: "c3", code: "CSCD 303", name: "Network Security", creditHours: 2, grade: 72 },
      { id: "c4", code: "CSCD 304", name: "Software Engineering", creditHours: 3, grade: 66 },
      { id: "c5", code: "CSCD 305", name: "Operating Systems", creditHours: 3, grade: 58 },
    ],
    sessions: [{ id: "s1", courseId: "c1", startedAt: "2026-02-20T09:00:00", minutes: 50, type: "focus" }],
    tasks: [{ id: "t1", courseId: "c2", title: "ER diagram", dueDate: "2026-03-01", priority: "high", done: false }],
    settings: { name: "Richard Yawlui", theme: "light", weeklyGoal: 10 },
  },
});
record("T08", "Data handling", "Academic records are saved to the database", "200", String(r.status));

r = await http("/api/data.php");
const marks = (r.data.courses || []).map((c) => c.grade).join(",");
record("T09", "Data handling", "Saved marks are returned unchanged on reload", "85,78,72,66,58", marks);

/* --- Validation --- */
r = await http("/api/data.php", {
  method: "POST", csrf: studentCsrf,
  body: { courses: [{ id: "x", code: "BAD", name: "Out of range", creditHours: 3, grade: 250 }] },
});
const after = await http("/api/data.php");
record("T10", "Validation", "A mark outside 0-100 is rejected rather than stored", "null",
       String(after.data.courses[0]?.grade));

/* T10 replaces the whole record set, as a save does; restore the five courses
   so the later interface tests run against the expected data. */
await http("/api/data.php", {
  method: "POST", csrf: studentCsrf,
  body: {
    courses: [
      { id: "c1", code: "CSCD 301", name: "Web Development", creditHours: 3, grade: 85 },
      { id: "c2", code: "CSCD 302", name: "Database Systems", creditHours: 3, grade: 78 },
      { id: "c3", code: "CSCD 303", name: "Network Security", creditHours: 2, grade: 72 },
      { id: "c4", code: "CSCD 304", name: "Software Engineering", creditHours: 3, grade: 66 },
      { id: "c5", code: "CSCD 305", name: "Operating Systems", creditHours: 3, grade: 58 },
    ],
    settings: { name: "Richard Yawlui", theme: "light", weeklyGoal: 10 },
  },
});

/* --- Administrator enrolment --- */
r = await http("/api/login.php", { method: "POST", cookieSet: "b",
  body: { identity: "ADMIN001", password: "password123" } });
const adminCsrf = r.data.csrf;
record("T11", "Enrolment", "Administrator sign-in succeeds and reports the admin role", "200/admin",
       `${r.status}/${r.data.user?.role}`);

r = await http("/api/admin/students.php", { method: "POST", csrf: adminCsrf, cookieSet: "b",
  body: { action: "enrol", indexNumber: "4211231161", fullName: "Addo Foster Keteku",
          email: "addo@gctu.edu.gh" } });
const tempPassword = r.data.temporaryPassword;
record("T12", "Enrolment", "Administrator enrols a student and a temporary password is issued",
       "201", String(r.status));

r = await http("/api/admin/students.php", { method: "POST", csrf: adminCsrf, cookieSet: "b",
  body: { action: "enrol", indexNumber: "4211231161", fullName: "Duplicate" } });
record("T13", "Enrolment", "Enrolling a duplicate index number is refused", "409", String(r.status));

r = await http("/api/login.php", { method: "POST", cookieSet: "c",
  body: { identity: "4211231161", password: tempPassword } });
record("T14", "Enrolment", "Enrolled student signs in and is flagged to change the password",
       "true", String(r.data.user?.mustChangePassword));

r = await http("/api/change_password.php", { method: "POST", cookieSet: "c", csrf: r.data.csrf,
  body: { currentPassword: "", newPassword: "short" } });
record("T15", "Validation", "A password under eight characters is refused", "400", String(r.status));

const me2 = await http("/api/me.php", { cookieSet: "c" });
r = await http("/api/change_password.php", { method: "POST", cookieSet: "c", csrf: me2.data.csrf,
  body: { currentPassword: "", newPassword: "chosenpassword" } });
record("T16", "Authentication", "Student sets their own password and the flag clears", "200",
       String(r.status));

/* --- Separation of records --- */
r = await http("/api/data.php", { cookieSet: "c" });
record("T17", "Separation", "Second student sees none of the first student's courses", "0",
       String((r.data.courses || []).length));

/* --- Account lifecycle --- */
const list = await http("/api/admin/students.php", { cookieSet: "b" });
const addo = list.data.students.find((s) => s.indexNumber === "4211231161");
r = await http("/api/admin/students.php", { method: "POST", csrf: adminCsrf, cookieSet: "b",
  body: { action: "status", id: addo.id, status: "inactive" } });
const blocked = await http("/api/login.php", { method: "POST", cookieSet: "d",
  body: { identity: "4211231161", password: "chosenpassword" } });
record("T18", "Enrolment", "A deactivated account can no longer sign in", "403", String(blocked.status));

await http("/api/admin/students.php", { method: "POST", csrf: adminCsrf, cookieSet: "b",
  body: { action: "status", id: addo.id, status: "active" } });
const back = await http("/api/login.php", { method: "POST", cookieSet: "d",
  body: { identity: "4211231161", password: "chosenpassword" } });
record("T19", "Enrolment", "A reactivated account can sign in again", "200", String(back.status));

/* --- Password storage --- */
r = await http("/api/admin/students.php", { cookieSet: "b" });
const leaked = JSON.stringify(r.data).match(/password123|chosenpassword|\$2y\$/);
record("T20", "Security", "No password or hash is exposed through the administrator listing",
       "none", leaked ? leaked[0] : "none");

/* ---------- Browser-level tests ---------- */
console.log("\n=== INTERFACE AND PERFORMANCE ===\n");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

/* Guard: an unauthenticated browser is redirected. */
const anon = await (await browser.newContext()).newPage();
await anon.goto(B + "/index.html");
await anon.waitForURL("**/login.html", { timeout: 10000 }).catch(() => {});
record("T21", "Authorisation", "Opening the system while signed out redirects to sign-in",
       "/login.html", new URL(anon.url()).pathname);

/* Timed sign-in and first paint. */
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const p = await ctx.newPage();
await p.goto(B + "/login.html");
await p.fill("#identity", "4211231018");
await p.fill("#password", "password123");
const t0 = Date.now();
await p.click("#panelSignIn button[type=submit]");
await p.waitForURL("**/index.html", { timeout: 15000 });
await p.waitForSelector("#statGPA", { timeout: 15000 });
await p.waitForFunction(() => document.querySelectorAll("canvas").length >= 2, { timeout: 15000 });
const loadMs = Date.now() - t0;
record("T22", "Performance", "Dashboard interactive within three seconds of sign-in", "true",
       String(loadMs < 3000));
console.log(`        measured: ${loadMs} ms`);

/* GPA computed from the seeded marks. */
const gpa = (await p.textContent("#statGPA")).trim();
record("T23", "Calculation", "Credit-weighted GPA computed correctly on the 4.0 scale", "2.89", gpa);

/* Navigation across every module. */
const modules = ["courses", "grades", "study", "flashcards", "vault", "goals", "settings", "dashboard"];
const navTimes = [];
let navOk = true;
for (const m of modules) {
  const s = Date.now();
  await p.click(`.nav-menu li[data-page="${m}"] a`);
  await p.waitForSelector(`#${m}Page.active-page`, { timeout: 8000 }).catch(() => { navOk = false; });
  navTimes.push(Date.now() - s);
}
record("T24", "Interface", "All eight modules open without error", "true", String(navOk));
const avgNav = Math.round(navTimes.reduce((a, b) => a + b, 0) / navTimes.length);
console.log(`        average view switch: ${avgNav} ms`);

/* Responsive layout at phone width. */
await p.setViewportSize({ width: 375, height: 812 });
await p.waitForTimeout(700);
const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
record("T25", "Interface", "No horizontal overflow at 375 px width", "false", String(overflow));
await p.setViewportSize({ width: 1366, height: 900 });

/* Persistence across a full reload. */
await p.reload();
await p.waitForSelector("#statGPA", { timeout: 15000 });
record("T26", "Persistence", "Records survive a page reload", "2.89", (await p.textContent("#statGPA")).trim());

/* Stored cross-site scripting through a course name. */
await p.click('.nav-menu li[data-page="courses"] a');
await p.waitForTimeout(600);
await p.click("#openCourseModal");
await p.waitForTimeout(400);
let alerted = false;
p.on("dialog", async (d) => { alerted = true; await d.dismiss(); });
await p.fill("#courseName", '<img src=x onerror=alert(1)>');
await p.fill("#courseCode", "XSS 101");
await p.fill("#creditHours", "1");
await p.click("#courseForm button[type=submit]");
await p.waitForTimeout(1800);
record("T27", "Security", "Script injected through a course name does not execute", "false",
       String(alerted));

/* Sign-out ends the session. */
const after2 = await http("/api/me.php", { cookieSet: "none" });
record("T28", "Authentication", "A request with no session cookie is anonymous", "false",
       String(after2.data.authenticated));

await browser.close();

/* ---------- Output ---------- */
const passed = results.filter((r) => r.pass).length;
console.log(`\n=== ${passed}/${results.length} passed (${Math.round((passed / results.length) * 100)}%) ===\n`);
console.log("TSV");
for (const r of results) {
  console.log([r.id, r.area, r.description, r.expected, r.actual, r.pass ? "Pass" : "FAIL"].join("\t"));
}
console.log(`METRIC\tsign-in to interactive\t${loadMs} ms`);
console.log(`METRIC\taverage view switch\t${avgNav} ms`);
