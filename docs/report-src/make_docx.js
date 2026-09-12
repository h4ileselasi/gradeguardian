/* Assembles the SAPTS project report to the FOCIS manual specification:
   A4, Times New Roman 12pt, 1.5 spacing, margins T/B 2.5cm L 4.0cm R 2.5cm,
   Roman numerals for the front matter and Arabic numerals for the body. */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber,
  NumberFormat, LevelFormat, HeadingLevel,
} = require("docx");

const B = require("./build_report");
const C = require("./chapters");
const C45 = require("./chapters45");
const TOC = require("./toc");
const { FONT, SIZE, LINE } = B;

const MARGIN = { top: 1417, bottom: 1417, left: 2268, right: 1417 }; // 2.5 / 2.5 / 4.0 / 2.5 cm

const pageNumberFooter = () =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { lineRule: "auto", before: 240, line: 240 },
        children: [new TextRun({ font: FONT, size: SIZE, children: [PageNumber.CURRENT] })],
      }),
    ],
  });

const emptyFooter = () => new Footer({ children: [new Paragraph({ children: [] })] });

const baseStyle = {
  run: { font: FONT, size: SIZE, color: "000000" },
  paragraph: { spacing: { lineRule: "auto", line: LINE, after: 0 } },
};

const doc = new Document({
  creator: B.AUTHORS.map(([n]) => n).join(", "),
  title: B.TITLE,
  description: "Final year project report submitted to the Faculty of Computing and Information Systems, GCTU.",
  styles: {
    default: {
      document: baseStyle,
      heading1: { run: { font: FONT, size: SIZE, bold: true, color: "000000" }, paragraph: { spacing: { lineRule: "auto", line: LINE, before: 240, after: 120 } } },
      heading2: { run: { font: FONT, size: SIZE, bold: true, color: "000000" }, paragraph: { spacing: { lineRule: "auto", line: LINE, before: 240, after: 120 } } },
      heading3: { run: { font: FONT, size: SIZE, bold: true, color: "000000" }, paragraph: { spacing: { lineRule: "auto", line: LINE, before: 180, after: 100 } } },
    },
    paragraphStyles: [
      { id: "Normal", name: "Normal", quickFormat: true, run: { font: FONT, size: SIZE, color: "000000" }, paragraph: { spacing: { lineRule: "auto", line: LINE, after: 0 } } },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { lineRule: "auto", line: LINE, after: 60 } }, run: { font: FONT, size: SIZE } },
        }],
      },
      {
        reference: "nums",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 }, spacing: { lineRule: "auto", line: LINE, after: 60 } }, run: { font: FONT, size: SIZE } },
        }],
      },
    ],
  },
  features: { updateFields: true },
  sections: [
    /* 1. Title page — counted as page i but the number is not printed. */
    {
      properties: { page: { margin: MARGIN, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: emptyFooter() },
      children: B.titlePage,
    },
    /* 2. Front matter — lower-case Roman numerals beginning at ii. */
    {
      properties: { page: { margin: MARGIN, pageNumbers: { start: 2, formatType: NumberFormat.LOWER_ROMAN } } },
      footers: { default: pageNumberFooter() },
      children: [
        ...B.declaration,
        ...B.abstract,
        ...TOC.toc,
        ...B.listOfTables,
        ...B.listOfFigures,
        ...B.listOfListings,
        ...B.listOfAbbrev,
        ...B.acknowledgement,
      ],
    },
    /* 3. Body and references — Arabic numerals beginning at 1. */
    {
      properties: { page: { margin: MARGIN, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } } },
      footers: { default: pageNumberFooter() },
      children: [
        ...C.chapterOne, ...C.chapterTwo, ...C.chapterThree,
        ...C45.chapterFour, ...C45.chapterFive,
        ...C.references,
      ],
    },
  ],
});

const out = process.argv[2];
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("wrote", out, (buf.length / 1024).toFixed(0) + " KB");
});
