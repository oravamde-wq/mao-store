const fs = require('fs');
const path = require('path');

const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'sheet2_parsed.json'), 'utf8'));

const excelProducts = [];

for (const r of rows) {
  const code = (r.cells.C || '').trim();
  const name = (r.cells.D || '').trim();
  const priceVal = (r.cells.J || '').trim();
  const costVal = (r.cells.I || '').trim();

  // Filter out headers or non-product rows
  if (!name || name.toLowerCase() === 'nombre' || code.toLowerCase() === 'imagen') continue;

  const price = Math.round(parseFloat(priceVal) || 0);
  const cost = Math.round(parseFloat(costVal) || 0);

  if (name.length > 2 && (price > 0 || cost > 0 || code.startsWith('P') || /^\d+$/.test(code))) {
    excelProducts.push({
      row: r.rowNum,
      code,
      name,
      price,
      cost,
      rawPrice: priceVal,
      rawRow: r.cells
    });
  }
}

console.log('Total extracted Excel products:', excelProducts.length);
console.log('Sample Excel products (first 15):');
excelProducts.slice(0, 15).forEach(p => {
  console.log(`[R${p.row}] Code: "${p.code}" | Name: "${p.name}" | Price: $${p.price.toLocaleString()} | Cost: $${p.cost.toLocaleString()}`);
});

console.log('\nSample Excel products (last 15):');
excelProducts.slice(-15).forEach(p => {
  console.log(`[R${p.row}] Code: "${p.code}" | Name: "${p.name}" | Price: $${p.price.toLocaleString()} | Cost: $${p.cost.toLocaleString()}`);
});

fs.writeFileSync(path.join(__dirname, 'excel_products.json'), JSON.stringify(excelProducts, null, 2), 'utf8');
