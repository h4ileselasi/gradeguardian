/* Table of contents: entry list, and the paragraphs that render it with dot leaders.
   Page numbers are supplied by the two-pass build in run_build.sh. */
const fs = require("fs");
const path = require("path");
const {
  Paragraph, TextRun, AlignmentType, TabStopType, LeaderType, Tab, HeadingLevel,
} = require("docx");
const B = require("./build_report");
const { FONT, SIZE, TEXT_W, run } = B;

/* text = what appears in the contents; key = the string to find in the rendered PDF;
   where = "front" or "body"; level = indentation depth. */
const E = (text, key, where, level) => ({ text, key: key || text, where, level });

const ENTRIES = [
  E("Declaration", "DECLARATION", "front", 0),
  E("Abstract", "ABSTRACT", "front", 0),
  E("Table of Contents", "TABLE OF CONTENTS", "front", 0),
  E("List of Tables", "LIST OF TABLES", "front", 0),
  E("List of Figures", "LIST OF FIGURES", "front", 0),
  E("List of Listings", "LIST OF LISTINGS", "front", 0),
  E("List of Abbreviations", "LIST OF ABBREVIATIONS", "front", 0),
  E("Acknowledgement", "ACKNOWLEDGEMENT", "front", 0),

  E("CHAPTER ONE: INTRODUCTION", "CHAPTER ONE", "body", 0),
  E("1.1 Background to Study", null, "body", 1),
  E("1.2 Statement of the Problem", null, "body", 1),
  E("1.3 Aim and Objectives", null, "body", 1),
  E("1.4 Significance of the Study", null, "body", 1),
  E("1.5 Scope of the Study", null, "body", 1),
  E("1.6 Organization of the Study", null, "body", 1),
  E("1.7 Conclusion", null, "body", 1),

  E("CHAPTER TWO: LITERATURE REVIEW", "CHAPTER TWO", "body", 0),
  E("2.1 Overview of Relevant Literature", null, "body", 1),
  E("2.1.1 Student Information Systems", null, "body", 2),
  E("2.1.2 Academic Performance Tracking", null, "body", 2),
  E("2.2 Theoretical Framework", null, "body", 1),
  E("2.3 Previous Studies and Related Works", null, "body", 1),
  E("2.3.1 MyStudyLife", null, "body", 2),
  E("2.3.2 Todoist and general productivity tools", null, "body", 2),
  E("2.3.3 Grade calculator applications", null, "body", 2),
  E("2.3.4 Institutional learning management and student information systems", "2.3.4 Institutional learning management", "body", 2),
  E("2.3.5 Learning analytics dashboards", null, "body", 2),
  E("2.4 Summary of Literature Review", null, "body", 1),
  E("2.5 Conclusion", null, "body", 1),

  E("CHAPTER THREE: SYSTEM SPECIFICATION AND DESIGN", "CHAPTER THREE", "body", 0),
  E("3.1 Methodology", null, "body", 1),
  E("3.1.1 Research Design", null, "body", 2),
  E("3.1.2 Data Collection Methods", null, "body", 2),
  E("3.1.3 System Development Model", null, "body", 2),
  E("3.1.4 Tools and Technologies", null, "body", 2),
  E("3.2 System Specification", null, "body", 1),
  E("3.2.1 Analysis of Requirements", null, "body", 2),
  E("3.2.2 Stakeholder Analysis", null, "body", 2),
  E("3.2.3 Functional Requirements", null, "body", 2),
  E("3.2.4 Non-functional Requirements", null, "body", 2),
  E("3.2.5 Use Cases", null, "body", 2),
  E("3.3 System Design", null, "body", 1),
  E("3.3.1 Architectural Design", null, "body", 2),
  E("3.3.2 Database Design", null, "body", 2),
  E("3.3.3 User Interface Design", null, "body", 2),
  E("3.3.4 Security Considerations", null, "body", 2),
  E("3.4 Conclusion", null, "body", 1),

  E("CHAPTER FOUR: SYSTEM IMPLEMENTATION", "CHAPTER FOUR", "body", 0),
  E("4.1 Development", null, "body", 1),
  E("4.1.1 Programming Languages and Tools Used", null, "body", 2),
  E("4.1.2 Implementation Details", null, "body", 2),
  E("4.1.3 Testing and Quality Assurance", null, "body", 2),
  E("4.2 Evaluation", null, "body", 1),
  E("4.2.1 Evaluation Metrics", null, "body", 2),
  E("4.2.2 User Testing", null, "body", 2),
  E("4.2.3 Performance Evaluation", null, "body", 2),
  E("4.3 Conclusion", null, "body", 1),

  E("CHAPTER FIVE: CONCLUSION AND RECOMMENDATIONS", "CHAPTER FIVE", "body", 0),
  E("5.1 Discussion", null, "body", 1),
  E("5.1.1 Comparison with Existing Systems", null, "body", 2),
  E("5.1.2 Challenges Faced", null, "body", 2),
  E("5.1.3 Lessons Learned", null, "body", 2),
  E("5.1.4 Contributions to the Field", null, "body", 2),
  E("5.1.5 Limitations and Future Work", null, "body", 2),
  E("5.2 Conclusion", null, "body", 1),

  E("References", "REFERENCES", "body", 0),
];

const PAGES_FILE = path.join(__dirname, "toc_pages.json");
const pages = fs.existsSync(PAGES_FILE) ? JSON.parse(fs.readFileSync(PAGES_FILE, "utf8")) : {};

const entryParagraph = (e) => {
  const indent = e.level * 340;
  return new Paragraph({
    spacing: { lineRule: "auto", line: 240, after: 100 },
    indent: { left: indent, right: 0 },
    tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W - 40, leader: LeaderType.DOT }],
    children: [
      run(e.text, { bold: e.level === 0 }),
      new TextRun({ font: FONT, size: SIZE, bold: e.level === 0, children: [new Tab()] }),
      run(pages[e.text] === undefined ? "—" : String(pages[e.text]), { bold: e.level === 0 }),
    ],
  });
};

const toc = [
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { lineRule: "auto", line: 360, after: 240 },
    children: [run("TABLE OF CONTENTS", { bold: true })],
  }),
  ...ENTRIES.map(entryParagraph),
];

module.exports = { ENTRIES, toc };
