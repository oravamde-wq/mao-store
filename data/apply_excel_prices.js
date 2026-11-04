const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'store.json');
const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
const excelProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'excel_products.json'), 'utf8'));

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Build Excel lookup maps
const byCode = new Map();
const byName = new Map();

for (const ep of excelProducts) {
  if (ep.code) {
    const code = ep.code.trim().toUpperCase();
    byCode.set(code, ep);
    const num = code.replace(/\D/g, '');
    if (num) {
      byCode.set(num, ep);
      byCode.set('P' + num, ep);
    }
  }
  const norm = normalize(ep.name);
  if (norm.length >= 5) {
    byName.set(norm, ep);
  }
}

// Fallback known prices from Facebook Marketplace for items where Excel has $0
const fbPriceFallbacks = {
  '560': 500000,
  'P560': 500000,
  '561': 252000,
  'P561': 252000,
  'CARPLAY': 252000,
  'GOODEE': 500000,
  '303': 120000,
  'P303': 120000,
  'BATTERY CHARGER': 120000
};

let updatedCount = 0;
const results = [];

for (const p of store.products) {
  const currentPrice = p.price || 0;
  // If price is missing or 0, we need to populate it from Excel
  if (currentPrice === 0) {
    const pName = p.name || '';
    const pNorm = normalize(pName);
    let matched = null;
    let matchType = '';

    // 1. By code in product name (e.g. "P537", ", 561", "542")
    const codeM = pName.match(/(?:P\s*(\d{1,4})|,\s*(\d{3,4})|\b(\d{3})\b)/i);
    if (codeM) {
      const cNum = codeM[1] || codeM[2] || codeM[3];
      if (cNum && byCode.has(cNum)) {
        matched = byCode.get(cNum);
        matchType = `Code [${matched.code}]`;
      }
    }

    // 2. Exact or prefix match with Excel name
    if (!matched) {
      for (const [eNorm, ep] of byName.entries()) {
        if (eNorm === pNorm || (pNorm.length >= 12 && eNorm.startsWith(pNorm.substring(0, 25))) || (eNorm.length >= 12 && pNorm.startsWith(eNorm.substring(0, 25)))) {
          matched = ep;
          matchType = `Name Match [${matched.code}]`;
          break;
        }
      }
    }

    // 3. Keyword / semantic match
    if (!matched) {
      const pWords = pNorm.split(' ').filter(w => w.length >= 4);
      let bestScore = 0;
      let bestEp = null;
      for (const [eNorm, ep] of byName.entries()) {
        const eWords = new Set(eNorm.split(' ').filter(w => w.length >= 4));
        let common = 0;
        for (const w of pWords) {
          if (eWords.has(w)) common++;
        }
        if (common >= 3 && common > bestScore) {
          bestScore = common;
          bestEp = ep;
        }
      }
      if (bestEp) {
        matched = bestEp;
        matchType = `Keywords (${bestScore} words) [${matched.code}]`;
      }
    }

    // Check price
    let finalPrice = matched ? matched.price : 0;
    if (finalPrice === 0) {
      // Check fallback
      for (const [fbKey, fbVal] of Object.entries(fbPriceFallbacks)) {
        if (pNorm.includes(fbKey.toLowerCase()) || (matched && matched.code.includes(fbKey))) {
          finalPrice = fbVal;
          matchType += ' (FB Fallback)';
          break;
        }
      }
    }

    if (finalPrice > 0) {
      p.price = finalPrice;
      if (matched && matched.cost > 0 && !p.originalPrice) {
        // keep cost or no strikethrough
      }
      updatedCount++;
      results.push({
        id: p.id,
        name: pName,
        matchType,
        excelName: matched ? matched.name : 'Fallback',
        assignedPrice: finalPrice
      });
    } else {
      results.push({
        id: p.id,
        name: pName,
        matchType: 'NOT FOUND / ZERO',
        excelName: matched ? matched.name : 'None',
        assignedPrice: 0
      });
    }
  }
}

console.log(`Updated prices for ${updatedCount} products.\n`);
results.forEach((r, i) => {
  console.log(`${i + 1}. "${r.name.substring(0, 40)}" -> ${r.matchType} -> $${r.assignedPrice.toLocaleString()}`);
});

// Save to store.json
fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
console.log('\nstore.json updated successfully!');

const totalZeroNow = store.products.filter(p => !p.price || p.price === 0).length;
console.log(`Remaining zero-price products: ${totalZeroNow} / ${store.products.length}`);
