# 🎓 Student Academic Progress Tracking System (SAPTS)

A **web-based student academic progress tracking system** that helps students
track courses, grades, study habits and revision — built with plain HTML5, CSS3
and vanilla JavaScript, and hosted locally on the **XAMPP** Apache server.

Ghana Communication Technology University (GCTU) — Faculty of Computing and
Information Systems.

## Running it on XAMPP

1. Install **XAMPP** (<https://www.apachefriends.org>).
2. Copy this whole project folder into the XAMPP web root:
   - Windows — `C:\xampp\htdocs\sapts`
   - macOS — `/Applications/XAMPP/htdocs/sapts`
   - Linux — `/opt/lampp/htdocs/sapts`
3. Open the **XAMPP Control Panel** and press **Start** next to **Apache**.
   (MySQL is optional — the application stores its data in the browser. Start it
   only if you want to load the relational schema described below.)
4. Visit <http://localhost/sapts/> in Chrome, Edge or Firefox.

The application is entirely client-side, so Apache only has to serve the files.
No internet connection is needed at any point — fonts, icons and the chart
library are bundled in `vendor/`. See [`docs/XAMPP_SETUP.md`](docs/XAMPP_SETUP.md)
for a step-by-step guide with troubleshooting.

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

## Project structure

```
sapts/
├── index.html        # Single-page application markup
├── style.css         # Theme system (CSS variables) + all component styles
├── script.js         # Application logic (storage, router, charts, timer…)
├── .htaccess         # Apache configuration used by XAMPP
├── database/         # MySQL schema expressing the same data model in SQL
├── vendor/           # Bundled Chart.js, Font Awesome, Poppins fonts (offline)
├── docs/             # Project report, defense slides, screenshots, XAMPP guide
└── backup_original/  # The previous version of the app, kept for reference
```

## Architecture

Three-tier, entirely on the client:

| Tier | Technology |
| --- | --- |
| Presentation | HTML5, CSS3 (responsive layout with Grid/Flexbox) |
| Application logic | Vanilla JavaScript (ES6+), Chart.js for visualisation |
| Data | Web Storage API (structured records) + IndexedDB (uploaded files) |

Apache, provided by XAMPP, acts as the local web server that delivers these
files to the browser.

### The relational schema

`database/sapts_schema.sql` expresses the same data model in SQL: eight tables
with primary keys, foreign keys and check constraints, plus four views that
reproduce the weighted average, letter grade, GPA and study-hour calculations
the application performs in JavaScript. Import it through phpMyAdmin (start
MySQL in XAMPP first) or with `mysql -u root -p < database/sapts_schema.sql`.
The application does not read from it — it documents the design formally and is
the migration path to a shared, multi-user deployment. See
[`docs/XAMPP_SETUP.md`](docs/XAMPP_SETUP.md) section 6.

## Notes

- First launch seeds demo data; use **Settings → Reset All Data** to start clean.
- Backups (Settings → Export) contain all structured data; uploaded binary files
  stay in the browser's IndexedDB and are not included in the JSON file.
- Data saved by earlier versions of the application is migrated automatically on
  first run.
