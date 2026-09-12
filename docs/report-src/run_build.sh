#!/bin/bash
set -e
SP="$(cd "$(dirname "$0")" && pwd)"
cd "$SP"
OUT="$SP/SAPTS_Project_Report_Ch1-3"
# Pass 1: placeholder page numbers, to measure the real layout.
rm -f toc_pages.json
node make_docx.js "$OUT.docx" >/dev/null
soffice --headless -env:UserInstallation=file:///tmp/lo_sapts --convert-to pdf --outdir "$SP" "$OUT.docx" >/dev/null 2>&1
node extract_pages.js "$OUT.pdf"
# Pass 2: rebuild with the measured page numbers.
node make_docx.js "$OUT.docx"
soffice --headless -env:UserInstallation=file:///tmp/lo_sapts --convert-to pdf --outdir "$SP" "$OUT.docx" >/dev/null 2>&1
# Pass 3: confirm pagination did not shift.
node extract_pages.js "$OUT.pdf"
pdfinfo "$OUT.pdf" | grep -i pages
