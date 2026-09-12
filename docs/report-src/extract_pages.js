/* Reads the rendered PDF, locates each contents entry, and writes toc_pages.json
   mapping entry text -> the page number as printed in that section's own numbering. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { ENTRIES } = require("./toc");

const pdf = process.argv[2];
const raw = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const pageText = raw.split("\f").map((t) => t.replace(/\s+/g, " ").trim());

const ROMAN = ["", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii", "xiv", "xv"];

/* The contents page repeats every heading, so anchor on ACKNOWLEDGEMENT — which appears
   in upper case only on its own page, the last of the front matter — and search past it. */
const ackIdx = pageText.findIndex((t) => t.includes("ACKNOWLEDGEMENT"));
if (ackIdx === -1) throw new Error("could not locate the acknowledgement page");
const bodyIdx = pageText.findIndex((t, i) => i > ackIdx && t.includes("CHAPTER ONE"));
if (bodyIdx === -1) throw new Error("could not locate CHAPTER ONE");
const bodyStart = bodyIdx + 1;

const out = {};
const missing = [];
for (const e of ENTRIES) {
  // Front-matter entries are found before the body; body entries only from bodyStart on,
  // so the contents page itself never matches a body heading.
  const from = e.where === "body" ? ackIdx + 1 : 0;
  let idx = -1;
  for (let i = from; i < pageText.length; i++) {
    if (pageText[i].includes(e.key)) { idx = i; break; }
  }
  if (idx === -1) { missing.push(e.key); continue; }
  const physical = idx + 1;
  out[e.text] = e.where === "body" ? String(physical - bodyStart + 1) : ROMAN[physical];
}

fs.writeFileSync(path.join(__dirname, "toc_pages.json"), JSON.stringify(out, null, 2));
console.log(`body starts at physical page ${bodyStart}; resolved ${Object.keys(out).length}/${ENTRIES.length} entries`);
if (missing.length) console.log("NOT FOUND:", missing.join(" | "));
