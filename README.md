# 🎓 Student Academic Progress Tracking System (SAPTS)

A **web-based student academic progress tracking system** that helps students
track courses, grades, study habits and revision. Built with HTML5, CSS3 and
vanilla JavaScript on the client, PHP and MySQL on the server, and hosted locally
on **XAMPP**. Each student signs in to their own account; an administrator
enrols them.

Ghana Communication Technology University (GCTU) — Faculty of Computing and
Information Systems.

## Running it on XAMPP

1. Install **XAMPP** (<https://www.apachefriends.org>).
2. Copy this whole project folder into the XAMPP web root:
   - Windows — `C:\xampp\htdocs\sapts`
   - macOS — `/Applications/XAMPP/htdocs/sapts`
   - Linux — `/opt/lampp/htdocs/sapts`
3. Open the **XAMPP Control Panel** and press **Start** next to **Apache** and
   next to **MySQL**. Both are required.
4. Import the database: open <http://localhost/phpmyadmin> → **Import** →
   `database/sapts_schema.sql` → **Go**.
5. Visit <http://localhost/sapts/> in Chrome, Edge or Firefox and sign in.

### Accounts created by the schema

| Role | Index number | Password |
| --- | --- | --- |
| Administrator | `ADMIN001` | `password123` |
| Student | `4211231018` | `password123` |

Change both immediately after the first sign-in — they are published here and in
the SQL file, so they are not secret.

No internet connection is needed at any point — fonts, icons and the chart
library are bundled in `vendor/`, and the server is the same machine. See
[`docs/XAMPP_SETUP.md`](docs/XAMPP_SETUP.md) for a step-by-step guide with
troubleshooting and the enrolment walkthrough.

## Features

| Module | What it does |
| --- | --- |
| **Dashboard** | GPA, task completion, weekly study hours + streak, charts, quick Pomodoro timer |
| **My Courses** | Add/edit/delete courses with search, filter and sort |
| **Grades & GPA** | 4.0-scale GPA (Ghanaian university grading), letter distribution chart, per-course status |
| **Study Tracker** | Pomodoro focus/break timer that auto-logs completed focus time, 7-day history, streaks |
| **Flashcards** | Decks + cards with flip-to-reveal study mode and mastery tracking (active recall) |
| **My Vault** | Write text notes or store images/PDFs (past questions) privately in IndexedDB |
| **Goals & Tasks** | Tasks grouped by Overdue / Due Today / Upcoming, priorities, progress bar |
| **Settings** | Profile, theme (light/dark), timer lengths, JSON backup export/import, demo data |
| **Enrolment console** | Administrators enrol students, issue and reset temporary passwords, deactivate or remove accounts |

## Project structure

```
sapts/
├── index.html        # The application (requires a signed-in user)
├── login.html        # Sign in, self-enrolment, first-password change
├── admin.html        # Administrator enrolment console
├── style.css         # Theme system (CSS variables) + all component styles
├── script.js         # Application logic (router, charts, timer, server sync)
├── auth.js           # Session handling and the page guard
├── api/              # PHP endpoints: login, logout, register, data, admin
├── database/         # MySQL schema, views and seed data
├── .htaccess         # Apache configuration used by XAMPP
├── vendor/           # Bundled Chart.js, Font Awesome, Poppins fonts (offline)
├── docs/             # Project report, defence deck, screenshots, XAMPP guide
│   └── report-src/   # Sources the report and its test suite are built from
└── backup_original/  # The previous version of the app, kept for reference
```

## Architecture

Three-tier, entirely on the client:

| Tier | Technology |
| --- | --- |
| Presentation | HTML5, CSS3 (responsive layout with Grid/Flexbox), in the browser |
| Application logic | JavaScript (ES6+) in the browser; PHP 8 on the server for authentication and persistence |
| Data | MySQL — eight tables with primary keys, foreign keys and check constraints |

Local storage is kept as a working cache: a student's rows are copied into it at
sign-in so the interface stays responsive, and every change is written back to
MySQL. The database is the authoritative copy.

### Security

- Passwords are stored as bcrypt hashes (`password_hash`, cost 12) and never in
  readable form.
- Sessions use an HttpOnly, SameSite=Lax cookie; the identifier is regenerated on
  sign-in and on password change.
- Every write carries a CSRF token.
- Every query is filtered by the `user_id` held in the session, never by one sent
  in the request, so no student can read or alter another's records.
- Administrator routes are behind a role check that returns 403 to students.

## Notes

- A newly enrolled student starts with an empty system; **Settings → Load Demo
  Data** fills it with sample records for demonstration.
- Backups (Settings → Export) contain all structured data; uploaded binary files
  stay in the browser's IndexedDB and are not included in the JSON file.
- A student signing in with an administrator-issued temporary password must
  choose their own before reaching the system.
- The interface is verified free of horizontal overflow at 375 px, 768 px and
  1366 px across all eight views.

## Testing

`docs/report-src/testsuite.mjs` runs 28 cases against a live installation —
authentication, authorisation, CSRF, validation, record separation, GPA
calculation, persistence, responsive layout and stored cross-site scripting. It
drives both the PHP endpoints directly and the interface through a real browser,
and prints a pass/fail table. Start Apache and MySQL, then:

```
node docs/report-src/testsuite.mjs
```

## Documentation

| Document | What it is |
| --- | --- |
| `docs/SAPTS_Project_Report.pdf` | The full project report, Chapters 1–5, to the FOCIS manual |
| `docs/SAPTS_Defence_Presentation.pptx` | The defence deck, on the faculty template |
| `docs/XAMPP_SETUP.md` | Installation, enrolment and troubleshooting |
| `docs/faculty/` | The faculty's own manual and presentation template |
