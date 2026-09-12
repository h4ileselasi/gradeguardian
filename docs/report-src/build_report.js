/* Builds the SAPTS final-year project report (cover page, front matter, Chapters 1-3)
   to the FOCIS Final Year Undergraduate Projects Manual specification. */
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, ImageRun,
  Footer, PageNumber, NumberFormat, TableOfContents, LevelFormat, convertMillimetersToTwip,
  PositionalTab, PositionalTabAlignment, PositionalTabLeader, VerticalAlign,
} = require("docx");

const DIAG = path.join(__dirname, "diagrams");
const SHOTS = "/home/user/gradeguardian/docs/screenshots";
const FONT = "Times New Roman";
const SIZE = 24;          // 12pt
const LINE = 360;         // 1.5 line spacing
const INDENT = 720;       // 0.5" first-line indent
const TEXT_W = 8221;      // A4 width (11906) minus left 2268 and right 1417

/* ---------------- helpers ---------------- */
const run = (text, o = {}) => new TextRun({ text, font: FONT, size: o.size || SIZE, bold: o.bold, italics: o.italics, allCaps: o.allCaps });

const body = (text, o = {}) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { lineRule: "auto", line: LINE, after: o.after === undefined ? 0 : o.after },
    indent: { firstLine: o.noIndent ? 0 : INDENT },
    children: [run(text)],
  });

const chapterHeading = (number, title) => [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { lineRule: "auto", line: LINE, after: 120 },
    children: [run(`CHAPTER ${number}`, { bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { lineRule: "auto", line: LINE, after: 240 },
    children: [run(title.toUpperCase(), { bold: true })],
  }),
];

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { lineRule: "auto", line: LINE, before: 240, after: 120 },
    children: [run(text, { bold: true })],
  });

const h3 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { lineRule: "auto", line: LINE, before: 180, after: 100 },
    children: [run(text, { bold: true })],
  });

const frontHeading = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { lineRule: "auto", line: LINE, after: 240 },
    children: [run(text.toUpperCase(), { bold: true })],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { lineRule: "auto", line: LINE, after: 0 },
    children: [run(text)],
  });

const numItem = (text, ref = "nums") =>
  new Paragraph({
    numbering: { reference: ref, level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { lineRule: "auto", line: LINE, after: 0 },
    children: [run(text)],
  });

const centered = (text, o = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { lineRule: "auto", line: o.line || LINE, before: o.before || 0, after: o.after === undefined ? 0 : o.after },
    children: [run(text, o)],
  });

const blank = (n = 1) =>
  Array.from({ length: n }, () => new Paragraph({ spacing: { lineRule: "auto", line: LINE }, children: [run("")] }));

const caption = (text, o = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { lineRule: "auto", line: 240, before: o.before || 0, after: o.after === undefined ? 200 : o.after },
    children: [run(text, { size: 22, italics: true })],
  });

const figure = (file, width, height, captionText) => {
  const buf = fs.readFileSync(file);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { lineRule: "auto", line: 240, before: 160, after: 80 },
      children: [new ImageRun({ data: buf, type: "png", transformation: { width, height } })],
    }),
    caption(captionText),
  ];
};

/* Table with dual widths, per the docx-js requirement. */
const table = (captionText, headers, rows, widths) => {
  const cell = (text, o = {}) =>
    new TableCell({
      width: { size: o.w, type: WidthType.DXA },
      shading: o.head ? { type: ShadingType.CLEAR, fill: "E8E8E8" } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 60, bottom: 60, left: 90, right: 90 },
      children: [
        new Paragraph({
          alignment: o.head ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { lineRule: "auto", line: 240, after: 0 },
          children: [run(text, { bold: o.head, size: 22 })],
        }),
      ],
    });
  return [
    caption(captionText, { after: 80 }),
    new Table({
      columnWidths: widths,
      width: { size: TEXT_W, type: WidthType.DXA },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map((t, i) => cell(t, { head: true, w: widths[i] })),
        }),
        ...rows.map((r) => new TableRow({ children: r.map((t, i) => cell(t, { w: widths[i] })) })),
      ],
    }),
    new Paragraph({ spacing: { after: 200 }, children: [run("")] }),
  ];
};

/* A short extract of real source, set in a monospaced face inside a light rule. */
const listing = (captionText, lines) => [
  caption(captionText, { after: 60 }),
  new Table({
    columnWidths: [TEXT_W],
    width: { size: TEXT_W, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: TEXT_W, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: "F4F4F4" },
            margins: { top: 90, bottom: 90, left: 140, right: 100 },
            children: lines.map(
              (l) =>
                new Paragraph({
                  spacing: { lineRule: "auto", line: 240, after: 0 },
                  children: [
                    new TextRun({ text: l || " ", font: "Courier New", size: 17 }),
                  ],
                }),
            ),
          }),
        ],
      }),
    ],
  }),
  new Paragraph({ spacing: { after: 200 }, children: [run("")] }),
];

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER,
  insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

/* Borderless two-column layout table (label left, value right). */
const layoutTable = (rows, widths, opts = {}) =>
  new Table({
    columnWidths: widths,
    width: { size: TEXT_W, type: WidthType.DXA },
    borders: NO_BORDERS,
    rows: rows.map((cells) =>
      new TableRow({
        children: cells.map((children, i) =>
          new TableCell({
            width: { size: widths[i], type: WidthType.DXA },
            borders: NO_BORDERS,
            margins: { top: 20, bottom: 20, left: 0, right: 60 },
            children: [
              new Paragraph({
                spacing: { lineRule: "auto", line: opts.line || LINE, after: 0 },
                children: Array.isArray(children) ? children : [run(children)],
              }),
            ],
          }),
        ),
      }),
    ),
  });

/* ---------------- content ---------------- */
const TITLE = "STUDENT ACADEMIC PROGRESS TRACKING SYSTEM";
const AUTHORS = [
  ["Richard Yawlui", "4211231018"],
  ["Addo Foster Keteku", "4211231161"],
];
const SUPERVISOR = "MR. FRANK BOATENG";
const DEPARTMENT = "DEPARTMENT OF INFORMATION TECHNOLOGY";
const DEGREE = "BSc. Information Technology";
const DATE = "FEBRUARY, 2026";

/* ===== TITLE PAGE ===== */
/* The manual asks for the university crest on the title page. Drop the file at
   docs/gctu_logo.png and it is placed automatically on the next build. */
const LOGO = "/home/user/gradeguardian/docs/gctu_logo.png";
const logoBlock = fs.existsSync(LOGO)
  ? [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { lineRule: "auto", line: 240, after: 160 },
        children: [
          new ImageRun({
            data: fs.readFileSync(LOGO),
            type: "png",
            transformation: { width: 110, height: 110 },
          }),
        ],
      }),
    ]
  : [];

const titlePage = [
  centered("GHANA COMMUNICATION TECHNOLOGY UNIVERSITY (GCTU)", { bold: true, size: 32 }),
  ...logoBlock,
  ...blank(logoBlock.length ? 0 : 2),
  centered("FACULTY OF COMPUTING AND INFORMATION SYSTEMS (FOCIS)", { bold: true, size: 30 }),
  centered(DEPARTMENT, { bold: true, size: 30 }),
  ...blank(1),
  centered("TITLE:", { bold: true, size: 30 }),
  centered(TITLE, { bold: true, size: 30 }),
  ...blank(1),
  centered("A Project Work Submitted in Partial Fulfillment of the Requirements For"),
  centered(DEGREE),
  ...blank(1),
  centered("BY:", { bold: true }),
  ...AUTHORS.map(([n, id]) => centered(`${n} (${id})`)),
  ...blank(1),
  centered("SUPERVISOR:", { bold: true }),
  centered(SUPERVISOR),
  ...blank(2),
  centered(DATE, { bold: true }),
];

/* ===== DECLARATION ===== */
const declaration = [
  frontHeading("Declaration"),
  body(
    `This project is presented as part of the requirements for ${DEGREE} awarded by Ghana ` +
    "Communication Technology University. We hereby declare that this project is entirely the result " +
    "of our own hard work, research, and enquiries. We are confident that this project work is not " +
    "copied from any other person. All sources of information have however been acknowledged with due respect.",
    { noIndent: true },
  ),
  ...blank(1),
  ...AUTHORS.flatMap(([n, id]) => [
    layoutTable(
      [
        [[run("AUTHOR: ", { bold: true }), run(n)], "SIGNATURE ...................................."],
        [[run("STUDENT ID: ", { bold: true }), run(id)], "DATE: ……………………………."],
      ],
      [4500, 3721],
    ),
    ...blank(1),
  ]),
  layoutTable(
    [
      [[run("SUPERVISOR: ", { bold: true }), run(SUPERVISOR)], "SIGNATURE ...................................."],
      ["", "DATE: ……………………………."],
    ],
    [4500, 3721],
  ),
  ...blank(1),
  layoutTable(
    [
      [[run("HOD: ", { bold: true }), run("…………………………")], "SIGNATURE ...................................."],
      ["", "DATE: ……………………………."],
    ],
    [4500, 3721],
  ),
];

/* ===== ABSTRACT ===== */
const abstract = [
  frontHeading("Abstract"),
  body(
    "University students monitor their academic progress through a scattered collection of notebooks, " +
    "calculator applications and calendar reminders, none of which communicate with one another. The " +
    "result is a fragmented record that makes it difficult to establish a current academic standing, to " +
    "observe performance trends, or to relate study effort to examination outcomes. This project designed " +
    "and developed a Student Academic Progress Tracking System: a web-based application that consolidates " +
    "course management, assessment recording, weighted grade and grade point average computation, study " +
    "session logging, revision through flashcards, document storage and goal tracking into a single " +
    "interface. Requirements were established through a review of the literature on self-regulated " +
    "learning, interviews with students and lecturers, and an examination of existing tracking tools; the " +
    "system was then built using the Waterfall model, with HTML5, CSS3 and JavaScript on the client and " +
    "PHP on the server, and is hosted locally on the Apache and MySQL services supplied with XAMPP. Each " +
    "student signs in to an account created by an administrator; passwords are stored only as bcrypt " +
    "hashes, every database query is filtered by the account held in the session, and no student can " +
    "reach another student's records. Functional, usability, security and performance " +
    "testing confirmed that grade calculations are accurate, that records persist across sessions and " +
    "devices, that the access controls hold, and that the interface loads and responds well within the " +
    "three-second target on both desktop and mobile displays. The system demonstrates that a " +
    "purpose-built, zero-cost academic tracker, deployable by a department on a single machine, can give " +
    "students the integrated overview that general-purpose productivity tools do not provide.",
    { noIndent: true },
  ),
  ...blank(1),
  body("Keywords: academic progress tracking, self-regulated learning, grade point average, data visualisation, relational database, authentication, XAMPP.", { noIndent: true }),
];

/* ===== TABLE OF CONTENTS ===== */
const toc = [
  frontHeading("Table of Contents"),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
];

/* ===== LIST OF TABLES / FIGURES / ABBREVIATIONS ===== */
const listEntry = (label, text) =>
  new Paragraph({
    spacing: { lineRule: "auto", line: 240, after: 120 },
    children: [run(`${label}  `), run(text)],
  });

const listOfTables = [
  frontHeading("List of Tables"),
  listEntry("Table 3.1", "Stakeholder analysis"),
  listEntry("Table 3.2", "Functional requirements of the system"),
  listEntry("Table 3.3", "Non-functional requirements of the system"),
  listEntry("Table 3.4", "Summary of the principal use cases"),
  listEntry("Table 3.5", "Database tables and their principal columns"),
  listEntry("Table 3.6", "Development tools and technologies"),
  listEntry("Table 4.1", "Composition of the delivered source code"),
  listEntry("Table 4.2", "Implementation of the functional modules"),
  listEntry("Table 4.3", "Test cases and results"),
  listEntry("Table 4.4", "Measurement against the non-functional requirements"),
  listEntry("Table 4.5", "Task walkthrough from a newly enrolled account"),
  listEntry("Table 4.6", "Measured performance"),
  listEntry("Table 5.1", "The delivered system against the solutions reviewed in Chapter Two"),
];

const listOfFigures = [
  frontHeading("List of Figures"),
  listEntry("Figure 3.1", "The Waterfall model as applied to the project"),
  listEntry("Figure 3.2", "Use case diagram of the system"),
  listEntry("Figure 3.3", "Three-tier architectural design across client and server"),
  listEntry("Figure 3.4", "Entity relationship diagram"),
  listEntry("Figure 3.5", "The dashboard as implemented"),
  listEntry("Figure 3.6", "The sign-in page"),
  listEntry("Figure 3.7", "The administrator enrolment console"),
  listEntry("Figure 4.1", "The course management module"),
  listEntry("Figure 4.2", "Grade and grade point average analysis"),
  listEntry("Figure 4.3", "The study tracker"),
  listEntry("Figure 4.4", "Goals and tasks"),
  listEntry("Figure 4.5", "The dashboard at a phone width of 390 pixels"),
  listEntry("Figure 4.6", "The dashboard in the dark theme"),
];

const ABBREV = [
  ["API", "Application Programming Interface"],
  ["CSRF", "Cross-Site Request Forgery"],
  ["CSS", "Cascading Style Sheets"],
  ["DOM", "Document Object Model"],
  ["ERD", "Entity Relationship Diagram"],
  ["FOCIS", "Faculty of Computing and Information Systems"],
  ["GCTU", "Ghana Communication Technology University"],
  ["GPA", "Grade Point Average"],
  ["HTML", "HyperText Markup Language"],
  ["HTTP", "HyperText Transfer Protocol"],
  ["JSON", "JavaScript Object Notation"],
  ["LMS", "Learning Management System"],
  ["PDO", "PHP Data Objects"],
  ["PHP", "PHP: Hypertext Preprocessor"],
  ["SAPTS", "Student Academic Progress Tracking System"],
  ["SIS", "Student Information System"],
  ["SQL", "Structured Query Language"],
  ["SRL", "Self-Regulated Learning"],
  ["SUS", "System Usability Scale"],
  ["UI", "User Interface"],
  ["TLS", "Transport Layer Security"],
  ["UML", "Unified Modeling Language"],
  ["XAMPP", "Cross-platform (X), Apache, MariaDB, PHP and Perl"],
];

const listOfListings = [
  frontHeading("List of Listings"),
  listEntry("Listing 4.1", "Credential verification, from api/login.php"),
  listEntry("Listing 4.2", "Record separation, from api/data.php"),
];

const listOfAbbrev = [
  frontHeading("List of Abbreviations"),
  layoutTable(
    ABBREV.map(([a, f]) => [[run(a, { bold: true })], f]),
    [1600, 6621],
    { line: 240 },
  ),
];

const acknowledgement = [
  frontHeading("Acknowledgement"),
  body(
    "We wish to express our sincere gratitude to the individuals whose contributions made this project " +
    "possible. First and foremost, we thank the Almighty God for the wisdom, health and strength granted " +
    "to us throughout this work.",
  ),
  body(
    `We are deeply grateful to our project supervisor, ${SUPERVISOR}, for his expert guidance, his ` +
    "patience in reading successive drafts, and the constructive criticism that shaped both the system " +
    "and this report. His insistence on rigour improved this work considerably.",
  ),
  body(
    "Our appreciation extends to the Head and to the faculty members of the Faculty of Computing and " +
    "Information Systems, Ghana Communication Technology University, for the academic foundation and the " +
    "resources that made the project feasible.",
  ),
  body(
    "We also thank the students and lecturers who gave their time to the interviews and to the usability " +
    "sessions; their candid feedback exposed problems we would otherwise have missed. Finally, we " +
    "acknowledge our families for their unwavering support, encouragement and patience throughout our " +
    "academic journey.",
  ),
];

module.exports = {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber,
  NumberFormat, LevelFormat, convertMillimetersToTwip,
  run, body, chapterHeading, h2, h3, frontHeading, bullet, numItem, centered, blank,
  caption, figure, table, listEntry, layoutTable, listing,
  FONT, SIZE, LINE, INDENT, TEXT_W, DIAG, SHOTS, TITLE, AUTHORS, SUPERVISOR, DEGREE, DATE,
  titlePage, declaration, abstract, toc, listOfTables, listOfFigures, listOfListings, listOfAbbrev, acknowledgement,
};
