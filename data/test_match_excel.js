const fs = require('fs');
const path = require('path');

const storeData = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8'));
const excelProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'excel_products.json'), 'utf8'));

console.log('Store products count:', storeData.products.length);
console.log('Excel products count:', excelProducts.length);

function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Map excel by code (e.g. 'P560' -> '560', '560')
const excelByCode = new Map();
const excelByName = new Map();

for (const ep of excelProducts) {
  if (ep.code) {
    const rawCode = ep.code.trim().toUpperCase();
    excelByCode.set(rawCode, ep);
    const numOnly = rawCode.replace(/\D/g, '');
    if (numOnly) {
      excelByCode.set(numOnly, ep);
      excelByCode.set('P' + numOnly, ep);
    }
  }
  const normName = normalize(ep.name);
  if (normName.length >= 5) {
    excelByName.set(normName, ep);
  }
}

let matchedCount = 0;
let priceUpdatedCount = 0;
const updates = [];

for (const p of storeData.products) {
  let matchedExcel = null;
  const pName = p.name || '';
  const pNorm = normalize(pName);

  // 1. Match by Code in title (e.g. "P560", ", 561", "P528", "P556")
  const codeMatch = pName.match(/\b(?:P\s*(\d{1,4})|(\d{3,4}))\b/i);
  if (codeMatch) {
    const foundCodeNum = codeMatch[1] || codeMatch[2];
    if (foundCodeNum && excelByCode.has(foundCodeNum)) {
      matchedExcel = excelByCode.get(foundCodeNum);
    }
  }

  // 2. Match by exact normalized name
  if (!matchedExcel) {
    if (excelByName.has(pNorm)) {
      matchedExcel = excelByName.get(pNorm);
    }
  }

  // 3. Match by partial start / fuzzy match
  if (!matchedExcel && pNorm.length >= 10) {
    for (const [eNorm, ep] of excelByName.entries()) {
      if (pNorm.startsWith(eNorm.substring(0, 20)) || eNorm.startsWith(pNorm.substring(0, 20))) {
        matchedExcel = ep;
        break;
      }
    }
  }

  // 4. Token overlap match (at least 4 matching significant words)
  if (!matchedExcel && pNorm.length >= 10) {
    const pTokens = new Set(pNorm.split(' ').filter(w => w.length >= 4));
    let bestScore = 0;
    let bestEp = null;
    for (const [eNorm, ep] of excelByName.entries()) {
      const eTokens = eNorm.split(' ').filter(w => w.length >= 4);
      let matchWords = 0;
      for (const w of eTokens) {
        if (pTokens.has(w)) matchWords++;
      }
      if (matchWords >= 3 && matchWords > bestScore) {
        bestScore = matchWords;
        bestEp = ep;
      }
    }
    if (bestEp && bestScore >= 3) {
      matchedExcel = bestEp;
    }
  }

  if (matchedExcel) {
    matchedCount++;
    const oldPrice = p.price || 0;
    const newPrice = matchedExcel.price || 0;
    const isPriceMissingOrZero = oldPrice === 0 || !oldPrice;

    updates.push({
      productId: p.id,
      productName: pName,
      excelCode: matchedExcel.code,
      excelName: matchedExcel.name,
      oldPrice,
      newPrice,
      excelCost: matchedExcel.cost,
      wasZero: isPriceMissingOrZero
    });

    if (isPriceMissingOrZero && newPrice > 0) {
      priceUpdatedCount++;
    }
  }
}

console.log(`\nResults:`);
console.log(`Total matched products: ${matchedCount} / ${storeData.products.length}`);
console.log(`Products where price was 0 and now has valid price from Excel: ${priceUpdatedCount}`);

console.log('\nSample matched updates where price was 0:');
updates.filter(u => u.wasZero && u.newPrice > 0).slice(0, 20).forEach(u => {
  console.log(`✓ "${u.productName.substring(0, 40)}" [${u.excelCode}] -> Old: $${u.oldPrice} -> New: $${u.newPrice.toLocaleString()}`);
});

console.log('\nSample other matches (already had price):');
updates.filter(u => !u.wasZero).slice(0, 10).forEach(u => {
  console.log(`• "${u.productName.substring(0, 40)}" [${u.excelCode}] -> Current: $${u.oldPrice.toLocaleString()} vs Excel: $${u.newPrice.toLocaleString()}`);
});
