const fs = require('fs');
const sheetXml = fs.readFileSync('G:/Mi unidad/3. MAO STORE/mao-store/data/xlsx_extracted/xl/worksheets/sheet2.xml', 'utf8');
const row3Match = sheetXml.match(/<row r="3"[^>]*>(.*?)<\/row>/s);
if (row3Match) {
  console.log(row3Match[0].substring(0, 600));
}
