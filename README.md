# 🎓 GradeGuardian v2.0

An **offline-first academic companion** that helps students track courses, grades,
study habits and revision — built with plain HTML5, CSS3 and vanilla JavaScript.

## Running it

No installation, no server, no account. Just open `index.html` in any modern
browser (Chrome, Edge, Firefox). All data is stored locally on your device
(localStorage + IndexedDB). Internet is **not** required — fonts, icons and the
chart library are bundled in `vendor/`.

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
school project/
├── index.html        # Single-page application markup
├── style.css         # Theme system (CSS variables) + all component styles
├── script.js         # Application logic (storage, router, charts, timer…)
├── vendor/           # Bundled Chart.js, Font Awesome, Poppins fonts (offline)
├── docs/             # Project report, defense slides, screenshots
└── backup_original/  # The previous (v1) version of the app, kept for reference
```

## Notes

- First launch seeds friendly demo data; use **Settings → Reset All Data** to start clean.
- Backups (Settings → Export) contain all structured data; uploaded binary files
  stay in the browser's IndexedDB and are not included in the JSON file.
- v1 data (from the old Firebase version) is migrated automatically on first run.
