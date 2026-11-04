const fs = require('fs');
const path = require('path');

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'sheet2_parsed.json'), 'utf8'));

console.log('Finding rows with content...');
const nonEmpties = rows.filter(r => Object.keys(r.cells).length >= 2);
console.log('Rows with 2+ cells:', nonEmpties.length);

for (const r of nonEmpties) {
  const line = Object.entries(r.cells).map(([k, v]) => `${k}:${v}`).join(' | ');
  if (line.toLowerCase().includes('precio') || line.toLowerCase().includes('nombre') || line.toLowerCase().includes('producto') || line.toLowerCase().includes('costo')) {
    console.log(`[R${r.rowNum}] ${line}`);
  }
}
