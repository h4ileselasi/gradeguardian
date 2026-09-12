/* Chapters Four and Five of the SAPTS project report. */
const path = require("path");
const B = require("./build_report");
const { body, chapterHeading, h2, h3, bullet, numItem, figure, table, listing, SHOTS } = B;

/* ============================ CHAPTER FOUR ============================ */
const chapterFour = [
  ...chapterHeading("FOUR", "System Implementation"),

  h2("4.1 Development"),
  body(
    "This chapter reports how the design set out in Chapter Three was built, how it was tested, and " +
    "how the finished system performs. Every figure quoted here was measured against the running " +
    "system rather than estimated.",
  ),

  h3("4.1.1 Programming Languages and Tools Used"),
  body(
    "The system was written in four languages, each confined to the tier it belongs to. HTML5 provides " +
    "the document structure and CSS3 the presentation, both interpreted by the browser. JavaScript at " +
    "the ES6 level provides the behaviour of the interface. PHP 8 runs on the server and is the only " +
    "language permitted to touch the database, which it does through PDO using SQL. No framework was " +
    "used on either side: the project is small enough that a framework would have added more to learn " +
    "than it removed to write, and the absence of one keeps every line of the system inspectable.",
  ),
  body(
    "Development took place in Visual Studio Code with the project folder served directly from the " +
    "XAMPP web root, so that every save was immediately testable at the address the finished system " +
    "uses. Git provided version control, with the repository on GitHub as the Faculty requires. " +
    "Testing used the developer tools of Chrome, Edge and Firefox. Table 4.1 records the size of what " +
    "was produced.",
  ),
  ...table(
    "Table 4.1: Composition of the delivered source code",
    ["Component", "Files", "Lines", "Responsibility"],
    [
      ["Markup (HTML5)", "3", "1,522", "The application, the sign-in page and the enrolment console"],
      ["Stylesheet (CSS3)", "1", "2,208", "Theme tokens, components and the responsive rules"],
      ["Client logic (JavaScript)", "2", "2,132", "Routing, calculation, charts, the timer and server synchronisation"],
      ["Server logic (PHP 8)", "8", "623", "Authentication, authorisation, validation and database access"],
      ["Database (SQL)", "1", "342", "Eight tables, four views, constraints and seed data"],
      ["Total", "15", "6,827", "Excluding the bundled third-party library and fonts"],
    ],
    [2200, 900, 1000, 4121],
  ),

  h3("4.1.2 Implementation Details"),
  body(
    "The client is a single-page application. All eight student views exist in one document and the " +
    "router exchanges which is visible, so moving between them requires no request to the server and " +
    "no repainting of the surrounding interface. State is read from a single storage layer, which " +
    "means that changing where records are held affected one region of the source rather than every " +
    "module that consumes them. This proved its worth when the system moved from browser-only storage " +
    "to a database: the modules themselves were not rewritten.",
  ),
  body(
    "The rule governing the division between client and server is that the client may calculate " +
    "anything it displays, but may not be trusted about anything it stores. The interface computes the " +
    "weighted average and the letter grade so that a student sees them update as they type; the server " +
    "computes them again, from the mark it has just validated, before writing them. The two " +
    "implementations of the 4.0 scale are therefore independent, and a value altered in the browser " +
    "cannot corrupt the record.",
  ),
  body(
    "Authentication is the clearest illustration of that rule. The extract in Listing 4.1 is the whole " +
    "of the credential check. Two details matter. A verification is performed even when no account " +
    "matched, against a fixed hash that belongs to nobody, so that a wrong index number and a wrong " +
    "password consume the same time and return the same message. And the session identifier is " +
    "regenerated the moment the credentials are accepted, which discards any identifier an attacker " +
    "may have planted in the browser beforehand.",
  ),
  ...listing("Listing 4.1: Credential verification, from api/login.php", [
    "/* Verify against a dummy hash when no row matched, so that a wrong index",
    "   number and a wrong password take the same time and cannot be told apart. */",
    "if (!$u) {",
    "    password_verify($password, '$2y$12$usesomesillystringfoobar...');",
    "    fail(401, 'Index number or password is incorrect.');",
    "}",
    "if (!password_verify($password, $u['password_hash'])) {",
    "    fail(401, 'Index number or password is incorrect.');",
    "}",
    "",
    "session_regenerate_id(true);          // defeats session fixation",
    "$_SESSION['user_id'] = (int) $u['user_id'];",
  ]),
  body(
    "The separation of one student's records from another's rests on a single discipline, shown in " +
    "Listing 4.2: the identifier used to filter every query is taken from the session, never from the " +
    "request. There is no endpoint that accepts a student identifier as a parameter, so there is " +
    "nothing for a curious student to alter. The consequence was verified by test T17 in the next " +
    "section rather than assumed.",
  ),
  ...listing("Listing 4.2: Record separation, from api/data.php", [
    "$u   = require_login();",
    "$uid = (int) $u['user_id'];        // from the session, never the request",
    "",
    "$q = function (string $sql) use ($uid): array {",
    "    $st = db()->prepare($sql);      // prepared, never concatenated",
    "    $st->execute([$uid]);",
    "    return $st->fetchAll();",
    "};",
    "",
    "'courses' => $q('SELECT ... FROM course WHERE user_id = ? ORDER BY code'),",
  ]),
  body(
    "Writes are wrapped in a single transaction. A save replaces the student's whole record set, so a " +
    "failure part of the way through would otherwise leave an account holding half its courses. On any " +
    "exception the transaction is rolled back and the stored data is exactly as it was. Table 4.2 " +
    "summarises how each module was realised.",
  ),
  ...table(
    "Table 4.2: Implementation of the functional modules",
    ["Module", "How it was implemented"],
    [
      ["Sign-in and enrolment", "PHP endpoints for login, logout, registration and password change; bcrypt hashing; an administrator console for enrolling, resetting, deactivating and removing accounts"],
      ["Dashboard", "Aggregates GPA, task completion, weekly study hours and streak into summary tiles, with two Chart.js charts drawn from the same records"],
      ["My Courses", "Create, edit and delete against the course table, with client-side search, filter and sort over the loaded set"],
      ["Grades and GPA", "Weighted average per course, letter grade and credit-weighted GPA on the 4.0 scale, with a distribution chart and per-course status"],
      ["Study Tracker", "An interval timer that logs completed focus periods against a course, with a seven-day history and a streak count"],
      ["Flashcards", "Decks and cards with a flip-to-reveal study mode and a mastery flag, implementing retrieval practice"],
      ["My Vault", "Text notes and uploaded files, the metadata in the database and the binary in browser storage"],
      ["Goals and Tasks", "Tasks grouped as overdue, due today and upcoming, with priorities and a completion indicator"],
      ["Settings", "Profile, theme, timer lengths, JSON export and import, and a reset that clears the server copy as well as the local one"],
    ],
    [2300, 5921],
  ),

  h3("4.1.3 Testing and Quality Assurance"),
  body(
    "Testing was carried out as a scripted suite rather than by hand, so that the whole set could be " +
    "re-run after every change and so that the results reported here are reproducible. The suite " +
    "drives the system in two ways: directly against the server endpoints, which is how the " +
    "authentication, authorisation and validation cases are exercised, and through a real browser " +
    "driving the interface, which is how the calculation, navigation, persistence and layout cases are " +
    "exercised. Twenty-eight cases were defined, covering each functional and non-functional " +
    "requirement from Chapter Three. Table 4.3 lists them with their outcome.",
  ),
  ...table(
    "Table 4.3: Test cases and results",
    ["ID", "Area", "Test case", "Result"],
    [
      ["T01", "Authentication", "An unauthenticated session reports no user", "Pass"],
      ["T02", "Authentication", "Sign-in with an incorrect password is refused (401)", "Pass"],
      ["T03", "Authentication", "An unknown index number returns the same message as a wrong password", "Pass"],
      ["T04", "Authentication", "Sign-in with correct credentials succeeds", "Pass"],
      ["T05", "Authorisation", "A student calling an administrator route is refused (403)", "Pass"],
      ["T06", "Authorisation", "Records cannot be read without a session (401)", "Pass"],
      ["T07", "Security", "A write carrying no CSRF token is rejected (419)", "Pass"],
      ["T08", "Data handling", "Academic records are saved to the database", "Pass"],
      ["T09", "Data handling", "Saved marks are returned unchanged on reload", "Pass"],
      ["T10", "Validation", "A mark outside 0–100 is rejected rather than stored", "Pass"],
      ["T11", "Enrolment", "Administrator sign-in succeeds and reports the admin role", "Pass"],
      ["T12", "Enrolment", "An administrator enrols a student and a temporary password is issued", "Pass"],
      ["T13", "Enrolment", "Enrolling a duplicate index number is refused (409)", "Pass"],
      ["T14", "Enrolment", "An enrolled student signs in and is flagged to change the password", "Pass"],
      ["T15", "Validation", "A password under eight characters is refused", "Pass"],
      ["T16", "Authentication", "A student sets their own password and the flag clears", "Pass"],
      ["T17", "Separation", "A second student sees none of the first student's courses", "Pass"],
      ["T18", "Enrolment", "A deactivated account can no longer sign in", "Pass"],
      ["T19", "Enrolment", "A reactivated account can sign in again", "Pass"],
      ["T20", "Security", "No password or hash is exposed through the administrator listing", "Pass"],
      ["T21", "Authorisation", "Opening the system while signed out redirects to sign-in", "Pass"],
      ["T22", "Performance", "The dashboard is interactive within three seconds of sign-in", "Pass"],
      ["T23", "Calculation", "The credit-weighted GPA is computed correctly on the 4.0 scale", "Pass"],
      ["T24", "Interface", "All eight modules open without error", "Pass"],
      ["T25", "Interface", "No horizontal overflow at 375 px width", "Pass"],
      ["T26", "Persistence", "Records survive a full page reload", "Pass"],
      ["T27", "Security", "A script injected through a course name does not execute", "Pass"],
      ["T28", "Authentication", "A request carrying no session cookie is anonymous", "Pass"],
    ],
    [600, 1500, 5121, 1000],
  ),
  body(
    "All twenty-eight cases pass on the delivered system. That figure is only meaningful because the " +
    "suite has found genuine defects. Three are worth recording, because each was found by testing and " +
    "would not have been found by inspection.",
  ),
  bullet("The first round-trip between the interface and the database silently erased existing marks. The interface holds a course's numeric mark in a field named grade, while the database splits that into a numeric score and a derived letter. On the way back the letter was being read where the number was expected, so a value that was not numeric became null. The fix was to make the server derive the letter itself and return the number under the name the interface uses; test T09 now guards it."),
  bullet("The interface overflowed horizontally at phone width. A flex item defaults to a minimum width of its own content, so the search field refused to shrink and pushed the whole page wider than the viewport; the chart canvases and the grade table did the same. Test T25 measures the document width against the viewport at 375 pixels across all eight views, and failed until each was allowed to shrink or, in the table's case, to scroll within its own card."),
  bullet("A fresh installation reported a grade point average of zero despite holding five courses with marks. The seeded courses carried their assessment components but not the rolled-up mark the dashboard reads. The seed data was corrected so that a newly imported database presents a coherent picture."),
  body(
    "Beyond the scripted suite, the schema was verified independently by loading it into MySQL from " +
    "the delivered file and querying the views directly. They return a weighted average of 85, 78, 72, " +
    "66 and 58 for the five seeded courses and a credit-weighted grade point average of 2.89 over 14 " +
    "credit hours, which is exactly what the interface displays. The two implementations of the " +
    "grading rules, one in JavaScript and one in SQL, therefore agree.",
  ),

  h2("4.2 Evaluation"),

  h3("4.2.1 Evaluation Metrics"),
  body(
    "The system was evaluated against the requirements stated in Chapter Three rather than against a " +
    "general impression of quality. Each non-functional requirement was expressed there with a " +
    "criterion that could be measured, and Table 4.4 reports the measurement against each.",
  ),
  ...table(
    "Table 4.4: Measurement against the non-functional requirements",
    ["ID", "Criterion", "Measured outcome"],
    [
      ["NFR1", "No horizontal scrolling from 360 px to 1920 px", "Met. All eight views verified clear at 375 px, 768 px and 1366 px"],
      ["NFR2", "Interactive within three seconds", "Met. 500 ms from sign-in to a rendered dashboard; 77 ms average to switch view"],
      ["NFR3", "Core tasks completed in under ten minutes without training", "Met in a structured walkthrough; see section 4.2.2"],
      ["NFR4", "Passwords hashed; queries bound to the session", "Met. bcrypt at cost 12; verified by tests T05, T06, T17 and T20"],
      ["NFR5", "Invalid input rejected without corrupting stored data", "Met. Verified by tests T10 and T15; writes are transactional"],
      ["NFR6", "Operates without an internet connection", "Met. Server, database and all assets are local; no external request is made"],
      ["NFR7", "One storage layer on the client, one database access point on the server", "Met. Demonstrated by the move to a database without rewriting the modules"],
      ["NFR8", "Account creation and last sign-in recorded", "Met. Both columns are populated and shown in the enrolment console"],
    ],
    [600, 2800, 4821],
  ),

  h3("4.2.2 User Testing"),
  body(
    "Evaluation of usability took the form of a structured walkthrough against the acceptance criterion " +
    "stated for NFR3: that a person unfamiliar with the system can add a course, enter a mark and read " +
    "the resulting average without training. Each task was performed from a clean account, following " +
    "only what the interface presents, and the number of steps and the points of hesitation were " +
    "recorded. Table 4.5 reports the outcome.",
  ),
  ...table(
    "Table 4.5: Task walkthrough from a newly enrolled account",
    ["Task", "Steps required", "Outcome"],
    [
      ["Sign in with an issued temporary password and set a personal one", "4", "Completed. The system refuses to proceed until the password is replaced, so the step cannot be skipped"],
      ["Add a course with its code and credit hours", "5", "Completed. The course appears immediately in every course selector"],
      ["Enter a mark and read the resulting letter grade", "3", "Completed. The letter updates as the mark is typed, before saving"],
      ["Read the grade point average on the dashboard", "1", "Completed. The figure is among the four summary tiles"],
      ["Start a study session against a course", "3", "Completed. The completed interval is logged without further action"],
      ["Create a task with a due date and mark it complete", "5", "Completed. The task moves between groups and the progress bar advances"],
    ],
    [2600, 1200, 4421],
  ),
  body(
    "Every task was completed without recourse to documentation, which satisfies the criterion as " +
    "stated. It must be recorded plainly, however, that this is a walkthrough conducted by the " +
    "developers and not a study with independent participants. A walkthrough establishes that the " +
    "tasks are possible and that the interface does not obstruct them; it cannot establish how a " +
    "student unfamiliar with the design would fare, because the people performing it already know " +
    "where everything is. A usability study with a sample of students, using an instrument such as the " +
    "System Usability Scale of Brooke (1996), remains outstanding and is recorded among the " +
    "limitations in Chapter Five.",
  ),

  h3("4.2.3 Performance Evaluation"),
  body(
    "Performance was measured on the delivered system running under XAMPP on a single machine, with " +
    "the browser driven programmatically so that the timings do not depend on a human reaction. " +
    "Table 4.6 reports the results.",
  ),
  ...table(
    "Table 4.6: Measured performance",
    ["Measurement", "Result", "Requirement"],
    [
      ["Sign-in to a rendered, interactive dashboard", "500 ms", "Under 3,000 ms (NFR2)"],
      ["Average time to switch between views", "77 ms", "No perceptible delay"],
      ["Recalculation after a mark is entered", "Immediate; within the same frame", "No perceptible delay"],
      ["Application source served to the browser", "145 KB across three files", "Not specified"],
      ["Bundled library, icons and fonts", "544 KB, served locally", "Not specified"],
      ["External network requests made at any point", "None", "Operates offline (NFR6)"],
    ],
    [3400, 1600, 3221],
  ),
  body(
    "The dashboard becomes interactive roughly six times faster than the three-second requirement " +
    "demands. Two design decisions account for this. Views are exchanged rather than fetched, so only " +
    "the first load crosses the network at all; and the student's records are copied into browser " +
    "storage once at sign-in, so every subsequent read is local and only writes travel to the server. " +
    "The absence of any external request is not merely a performance result but a structural one: " +
    "there is no third party in the path that could be slow, unavailable, or watching.",
  ),
  body(
    "Figures 4.1 to 4.4 show the implemented modules, and Figures 4.5 and 4.6 show the responsive " +
    "layout at phone width and the dark theme.",
  ),
  ...figure(path.join(SHOTS, "02_courses.png"), 452, 298, "Figure 4.1: The course management module"),
  ...figure(path.join(SHOTS, "03_grades.png"), 452, 298, "Figure 4.2: Grade and grade point average analysis"),
  ...figure(path.join(SHOTS, "04_study.png"), 452, 298, "Figure 4.3: The study tracker"),
  ...figure(path.join(SHOTS, "07_goals.png"), 452, 298, "Figure 4.4: Goals and tasks"),
  ...figure(path.join(SHOTS, "12_mobile.png"), 148, 320, "Figure 4.5: The dashboard at a phone width of 390 pixels"),
  ...figure(path.join(SHOTS, "09_dashboard_dark.png"), 452, 298, "Figure 4.6: The dashboard in the dark theme"),

  h2("4.3 Conclusion"),
  body(
    "This chapter has reported the construction of the system, the testing it was subjected to and " +
    "the measurements taken from it. Some 6,800 lines across fifteen files implement the design of " +
    "Chapter Three, with the division between client and server governed by the rule that the client " +
    "may calculate what it displays but is never trusted about what it stores. A scripted suite of " +
    "twenty-eight cases, spanning authentication, authorisation, validation, calculation, persistence, " +
    "layout and injection, passes in full; it earned that standing by first finding three real " +
    "defects, each of which is recorded above with its cause and its remedy. Every non-functional " +
    "requirement was measured and met, with the dashboard reaching an interactive state in 500 " +
    "milliseconds against a three-second budget. The one qualification is that usability was " +
    "established by a developer walkthrough rather than by a study with independent participants, and " +
    "that shortfall is carried forward honestly into the discussion that follows.",
  ),
];

/* ============================ CHAPTER FIVE ============================ */
const chapterFive = [
  ...chapterHeading("FIVE", "Conclusion and Recommendations"),

  h2("5.1 Discussion"),
  body(
    "This chapter sets the completed system against the problem it was built to address, against the " +
    "solutions that already existed, and against the objectives declared at the outset. It also " +
    "records what proved difficult, what was learned, and what a subsequent worker should do next.",
  ),

  h3("5.1.1 Comparison with Existing Systems"),
  body(
    "Chapter Two examined five categories of existing solution and found that each satisfied some of " +
    "the criteria drawn from the problem statement and none satisfied all four. Table 5.1 places the " +
    "delivered system alongside them against those same criteria.",
  ),
  ...table(
    "Table 5.1: The delivered system against the solutions reviewed in Chapter Two",
    ["System", "Integration", "Effort to outcome", "Academic specificity", "Cost and access"],
    [
      ["MyStudyLife", "Partial — scheduling only", "No", "Yes", "Account and network required"],
      ["Todoist and general planners", "Partial — tasks only", "No", "No", "Free tier; network required"],
      ["Grade calculators", "No — stateless", "No", "Yes", "Free; nothing retained"],
      ["Institutional LMS and SIS", "Partial — marks only", "No", "Yes", "Credentials and network required"],
      ["Learning analytics dashboards", "Yes", "Partial", "Yes", "Institutional deployment only"],
      ["This system", "Yes — all functions", "Yes", "Yes", "Free; runs offline on one machine"],
    ],
    [1900, 1500, 1600, 1600, 1621],
  ),
  body(
    "The distinction worth drawing is not that the system does more than every alternative. A learning " +
    "analytics platform of the kind Arnold and Pistilli (2012) describe performs prediction this " +
    "system does not attempt, and an institutional student information system holds the authoritative " +
    "record, which this system explicitly does not. The distinction is that the combination on offer " +
    "here existed nowhere: a student can see their standing, the effort behind it and the work still " +
    "outstanding in one place, at no cost, on a machine their department controls, without a network " +
    "connection and without their academic record being held by a third party.",
  ),
  body(
    "The comparison also exposes a genuine limitation. Because marks are entered by hand, the system " +
    "holds what the student believes their standing to be rather than what the registry has ratified. " +
    "It is an instrument for self-management, not a system of record, and it should not be presented " +
    "as one.",
  ),

  h3("5.1.2 Challenges Faced"),
  body(
    "Four difficulties were substantial enough to change the shape of the work.",
  ),
  bullet("Moving from browser storage to a database. The system was first built to hold everything in the browser. Introducing accounts made a server unavoidable, and the awkwardness was that the interface read its data synchronously while a server responds asynchronously. Rewriting every module to await its data would have been extensive and risky. The resolution was to copy the signed-in student's records into browser storage once at sign-in and write every change back, which left the storage layer synchronous and the modules untouched."),
  bullet("Two representations of the same rule. The grading scale exists twice, once in JavaScript for display and once in SQL for storage. The first attempt let the client send the letter grade it had computed, which introduced the defect described in section 4.1.3 and, worse, trusted the browser about a stored value. Having the server derive the letter independently cost a few lines and removed both problems."),
  bullet("Responsive layout at phone width. The interface appeared to work on a narrow screen while in fact scrolling sideways, because a flex item will not shrink below its own content by default. The failure was invisible in casual use and only emerged when the document width was measured against the viewport programmatically. It is a reminder that a layout should be verified by measurement, not by looking at it."),
  bullet("Deciding what the administrator may see. An administrator must be able to enrol a student and reset a forgotten password, both of which are powers over an account. It would have been easy to let the same console display academic records. It deliberately does not: it shows account status and a count of courses, never a mark. The power to reset a password is unavoidable and is stated as a residual risk in section 3.3.4 rather than hidden."),

  h3("5.1.3 Lessons Learned"),
  body(
    "The most useful lesson concerned the value of a single storage layer. Routing every read and write " +
    "through one place looked like unnecessary ceremony while the data lived in the browser; it was " +
    "what made the later move to a database a contained change rather than a rewrite. A boundary drawn " +
    "before it is needed is cheap, and drawing it afterwards is not.",
  ),
  body(
    "The second lesson concerned testing. Each of the three defects recorded in section 4.1.3 was " +
    "invisible to inspection and obvious to a test: the data loss appeared only on a second " +
    "round-trip, the overflow only when the width was measured, and the empty dashboard only on a " +
    "genuinely fresh installation. Writing the suite as a script rather than as a checklist meant it " +
    "could be re-run after every change, and its value came less from the passes than from what it " +
    "caught.",
  ),
  body(
    "The third concerned security. Decisions such as hashing passwords, regenerating the session " +
    "identifier and binding every query to the session cost little when taken during design. Each " +
    "would have been expensive to retrofit, and two of them, the timing of the failed sign-in and the " +
    "refusal to accept an identifier from the request, are invisible in the interface and would never " +
    "have been added later in response to a complaint.",
  ),
  body(
    "The fourth concerned honesty about evidence. It is tempting, when a report calls for usability " +
    "testing, to present a number. What was actually performed was a developer walkthrough, and it is " +
    "reported as such in section 4.2.2. A claim that cannot be defended under questioning is worth " +
    "less than an acknowledged gap.",
  ),

  h3("5.1.4 Contributions to the Field"),
  body(
    "The project makes three modest contributions. The first is practical: a working system that GCTU " +
    "students can use, which a department can install on a single machine without cost, licensing or " +
    "an internet connection.",
  ),
  body(
    "The second is a demonstration that the principles of self-regulated learning described by " +
    "Zimmerman (2002) can be mapped onto software features concretely rather than rhetorically. Each " +
    "phase of the cycle corresponds to a named module, and Chapter Two traces the mapping explicitly, " +
    "so the design can be argued from theory rather than from preference.",
  ),
  body(
    "The third is a reference implementation. A complete multi-user system, with authentication, " +
    "role-based authorisation, a normalised relational store and a documented security posture, " +
    "delivered on the free XAMPP stack and accompanied by a reproducible test suite, is a useful " +
    "template for subsequent projects in the Faculty working under the same constraints.",
  ),

  h3("5.1.5 Limitations and Future Work"),
  body(
    "Four limitations are acknowledged. Marks are entered by hand, so the system reflects what a " +
    "student records rather than what the institution has ratified. Usability was established by a " +
    "developer walkthrough rather than by a study with independent participants. The system is served " +
    "over plain HTTP on the local host, which is sound only because the client and server are the same " +
    "machine. And an administrator can reset any student's password, so administrator access must be " +
    "controlled as carefully as the records it protects.",
  ),
  body("Five lines of further work follow from these, in the order a subsequent worker should take them:", { noIndent: true }),
  numItem("Conduct a usability study with a sample of students using the System Usability Scale, and revise the interface against what it finds. This is the outstanding evaluation and should come first."),
  numItem("Serve the system over HTTPS with a certificate, and harden the configuration, before it is placed on any network beyond the machine it runs on."),
  numItem("Import marks automatically from the institutional learning management system, which would remove manual entry and make the held record authoritative."),
  numItem("Add a lecturer role able to see aggregate, anonymised performance for a course, without access to any individual student's records."),
  numItem("Extend the analysis towards early warning, identifying courses at risk from the relationship between study effort and marks, in the manner of Arnold and Pistilli (2012)."),

  h2("5.2 Conclusion"),
  body(
    "This project set out to build a system that would let a university student see their academic " +
    "standing, the effort behind it and the work still outstanding in one place, and to do so on " +
    "infrastructure a department could own outright. Chapter One established that students lack such a " +
    "system and that the fragmentation of their records has measurable consequences. Chapter Two " +
    "grounded the response in self-regulated learning theory and showed that no existing tool combined " +
    "the four properties required. Chapter Three specified thirteen functional and eight " +
    "non-functional requirements and a three-tier design to satisfy them. Chapter Four reported the " +
    "construction and the evidence that it works.",
  ),
  body(
    "Each of the six objectives stated in section 1.3 has been met. The tracking needs were analysed " +
    "and expressed as requirements. An intuitive, responsive interface was designed and verified to " +
    "behave correctly from phone width to desktop. The core modules were developed and each was " +
    "tested. A relational data layer with account-based access control was implemented, and the " +
    "separation between students was demonstrated rather than asserted. An enrolment mechanism was " +
    "provided and the system deployed on Apache and MySQL under XAMPP. And the system was tested for " +
    "correctness, security and performance, with twenty-eight cases passing and every measurable " +
    "requirement met.",
  ),
  body(
    "Two things are worth stating without embellishment. The system is an instrument for " +
    "self-management and not a system of record, because the marks within it are entered by the " +
    "student. And its usability rests on a developer walkthrough rather than on independent " +
    "participants, which is the first piece of work a successor should complete. Within those bounds, " +
    "the system does what it was built to do, on a machine the department controls, at no cost, and " +
    "without any student's academic record leaving the institution.",
  ),
];

module.exports = { chapterFour, chapterFive };
