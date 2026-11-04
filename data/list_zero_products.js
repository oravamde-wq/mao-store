const fs = require('fs');
const path = require('path');

const store = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8'));
const excelProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'excel_products.json'), 'utf8'));

const zeroProducts = store.products.filter(p => !p.price || p.price === 0);
console.log('Total zero-price products in store:', zeroProducts.length);

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log('\n--- ZERO PRICE PRODUCTS LIST ---');
zeroProducts.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.id}] "${p.name}" (folder: "${p.folderSource}")`);
});
