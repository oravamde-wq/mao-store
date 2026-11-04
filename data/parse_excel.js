const fs = require('fs');
const path = require('path');

const sstXml = fs.readFileSync(path.join(__dirname, 'xlsx_extracted/xl/sharedStrings.xml'), 'utf8');
const strings = [];
const siRegex = /<si>(.*?)<\/si>/gs;
let match;
while ((match = siRegex.exec(sstXml)) !== null) {
  const content = match[1];
  const tMatches = content.match(/<t[^>]*>(.*?)<\/t>/gs) || [];
  const text = tMatches.map(t => t.replace(/<t[^>]*>/, '').replace(/<\/t>/, '')).join('');
  strings.push(text);
}
console.log('Total shared strings:', strings.length);

const sheetXml = fs.readFileSync(path.join(__dirname, 'xlsx_extracted/xl/worksheets/sheet2.xml'), 'utf8');

const rows = [];
const rowRegex = /<row r="(\d+)"[^>]*>(.*?)<\/row>/gs;
let rMatch;
while ((rMatch = rowRegex.exec(sheetXml)) !== null) {
  const rowNum = parseInt(rMatch[1]);
  const rowContent = rMatch[2];
  
  const cells = {};
  // match every <c ...> ... </c> or <c .../>
  const cRegex = /<c\b([^>]*)>(?:<v>([^<]*)<\/v>)?(?:<is><t>([^<]*)<\/t><\/is>)?(?:<f[^>]*>.*?<\/f>)?(?:<v>([^<]*)<\/v>)?<\/c>/gs;
  let cMatch;
  while ((cMatch = cRegex.exec(rowContent)) !== null) {
    const attrs = cMatch[1];
    const colMatch = attrs.match(/r="([A-Z]+)\d+"/);
    if (!colMatch) continue;
    const col = colMatch[1];
    
    const isShared = /t="s"/.test(attrs);
    const val = cMatch[2] !== undefined ? cMatch[2] : cMatch[4];
    const inline = cMatch[3];
    
    let cellValue = '';
    if (isShared && val !== undefined) {
      cellValue = strings[parseInt(val)] || '';
    } else if (inline !== undefined) {
      cellValue = inline;
    } else if (val !== undefined) {
      cellValue = val;
    }
    cells[col] = cellValue;
  }
  rows.push({ rowNum, cells });
}

console.log('Total rows parsed:', rows.length);

// Print rows 3 and 4
const r3 = rows.find(r => r.rowNum === 3);
const r4 = rows.find(r => r.rowNum === 4);
console.log('Row 3 headers:', r3 ? r3.cells : 'not found');
console.log('Row 4 sample:', r4 ? r4.cells : 'not found');

fs.writeFileSync(path.join(__dirname, 'sheet2_parsed.json'), JSON.stringify(rows, null, 2), 'utf8');
