const https = require('https');
const fs = require('fs');
const path = require('path');

const localData = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8'));

function req(path, method, body, token) {
  return new Promise((res, rej) => {
    const pl = body ? JSON.stringify(body) : null;
    const headers = { 'x-admin-token': token };
    if (pl) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(pl);
    }
    const r = https.request({
      hostname: 'mao-store.onrender.com',
      port: 443,
      path,
      method,
      headers
    }, response => {
      let d = '';
      response.on('data', c => d += c);
      response.on('end', () => res({ status: response.statusCode, data: d }));
    });
    r.on('error', rej);
    if (pl) r.write(pl);
    r.end();
  });
}

async function run() {
  console.log('Logging in to Render...');
  const loginRes = await req('/api/admin/login', 'POST', { pin: '0809' }, '');
  const token = JSON.parse(loginRes.data).token;
  console.log('Authenticated successfully.\n');

  // 1. Delete General category on Render
  console.log('1. Deleting General category on Render...');
  const delGen = await req('/api/categories/General', 'DELETE', null, token);
  console.log('   Delete General status:', delGen.status);

  // 2. Sync all new categories to Render
  console.log('\n2. Syncing new categories to Render...');
  for (const cat of localData.categories) {
    const addCat = await req('/api/categories', 'POST', { name: cat.name, icon: cat.icon }, token);
    console.log(`   + Category "${cat.name}": status ${addCat.status}`);
  }

  // 3. Sync category for each product on Render
  console.log('\n3. Fetching Render products to update categories...');
  const storeRes = await req('/api/store', 'GET', null, token);
  const renderData = JSON.parse(storeRes.data);
  console.log(`   Render currently has ${renderData.products.length} products.\n`);

  let updatedCount = 0;
  for (const p of renderData.products) {
    const localProd = localData.products.find(lp => lp.name.trim().toLowerCase() === p.name.trim().toLowerCase());
    if (localProd && p.category !== localProd.category) {
      const up = await req(`/api/products/${p.id}`, 'PUT', { category: localProd.category }, token);
      if (up.status === 200) {
        updatedCount++;
        process.stdout.write('.');
      }
    }
  }
  console.log(`\n\n🎉 Done! Updated category for ${updatedCount} products on Render.`);
}

run().catch(console.error);
