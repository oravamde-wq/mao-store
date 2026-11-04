const fs = require('fs');
const path = require('path');

const store = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8'));
const excelProducts = JSON.parse(fs.readFileSync(path.join(__dirname, 'excel_products.json'), 'utf8'));

const zeroProducts = store.products.filter(p => !p.price || p.price === 0);

function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

console.log('--- FINDING MATCHES FOR THE 21 ZERO-PRICE PRODUCTS ---');

for (const p of zeroProducts) {
  const pName = p.name || '';
  const pNorm = normalize(pName);

  // Check code in name (e.g. 561, 560, P556, 542, P537, 563, 564, 565, 562, P528)
  const codeM = pName.match(/(?:P\s*(\d{1,4})|,\s*(\d{3,4})|\b(\d{3})\b)/i);
  let byCode = null;
  if (codeM) {
    const cNum = codeM[1] || codeM[2] || codeM[3];
    byCode = excelProducts.find(ep => ep.code === 'P' + cNum || ep.code === cNum);
  }

  // Name matches
  const nameMatches = [];
  for (const ep of excelProducts) {
    const eNorm = normalize(ep.name);
    // Exact or startsWith
    if (eNorm === pNorm || (pNorm.length >= 10 && eNorm.startsWith(pNorm.substring(0, 25))) || (eNorm.length >= 10 && pNorm.startsWith(eNorm.substring(0, 25)))) {
      nameMatches.push({ ep, score: 100, reason: 'prefix/exact' });
      continue;
    }
    // Keyword match
    const pWords = pNorm.split(' ').filter(w => w.length >= 4);
    const eWords = new Set(eNorm.split(' ').filter(w => w.length >= 4));
    let common = 0;
    for (const w of pWords) {
      if (eWords.has(w)) common++;
    }
    if (common >= 3) {
      nameMatches.push({ ep, score: common, reason: 'keywords' });
    }
  }

  nameMatches.sort((a, b) => b.score - a.score);

  console.log(`\nPRODUCT: "${pName}"`);
  if (byCode) {
    console.log(`  -> BY CODE [${byCode.code}]: "${byCode.name}" | Price: $${byCode.price.toLocaleString()} | Cost: $${byCode.cost.toLocaleString()}`);
  }
  if (nameMatches.length > 0) {
    const top = nameMatches.slice(0, 3);
    top.forEach(m => {
      console.log(`  -> BY NAME (${m.reason}, score ${m.score}) [${m.ep.code}]: "${m.ep.name.substring(0, 60)}" | Price: $${m.ep.price.toLocaleString()}`);
    });
  }
}
