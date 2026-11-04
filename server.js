const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

const SERVER_SECRET = 'mao-store-secret-token-key-2026';

function generateAdminToken(pin) {
  return crypto.createHmac('sha256', SERVER_SECRET).update(String(pin || '1234')).digest('hex');
}

function verifyAdminToken(req) {
  const token = req.headers['x-admin-token'];
  if (!token) return false;
  const data = readStoreData();
  const currentPin = (data.settings && data.settings.adminPin) ? String(data.settings.adminPin) : '1234';
  const expectedToken = generateAdminToken(currentPin);
  return token === expectedToken;
}

// Ensure necessary directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Load or initialize store data
function readStoreData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      let content = fs.readFileSync(DATA_FILE, 'utf-8');
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading store data:', err);
  }
  return {
    settings: {
      storeName: "MAO STORE",
      storeSlogan: "Tu estilo, tu tecnología, tu tienda oficial",
      currencySymbol: "$",
      currencyCode: "COP",
      whatsappNumber: "573001234567",
      adminPin: "1234"
    },
    categories: [
      { id: "cat-ropa", name: "Ropa", icon: "shirt" },
      { id: "cat-calzado", name: "Calzado", icon: "footprints" },
      { id: "cat-tecnologia", name: "Tecnología", icon: "smartphone" },
      { id: "cat-accesorios", name: "Accesorios", icon: "watch" },
      { id: "cat-hogar", name: "Hogar", icon: "home" }
    ],
    products: []
  };
}

function writeStoreData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.ogg': 'video/ogg'
};

// -------------------------------------------------------------
// AUTO-SYNC FOLDERS IN /uploads AS PRODUCTS
// -------------------------------------------------------------
function inferCategory(folderName) {
  const name = folderName.toLowerCase();
  if (name.includes('auricular') || name.includes('audifono') || name.includes('parlante') || name.includes('diadema') || name.includes('soundbar') || name.includes('corneta') || name.includes('altavoz')) {
    return 'Auriculares y parlantes';
  }
  if (name.includes('edredon') || name.includes('saban') || name.includes('cama') || name.includes('almohad') || name.includes('hogar') || name.includes('tapete') || name.includes('luz')) {
    return 'Hogar y Confort';
  }
  if (name.includes('cocina') || name.includes('sarten') || name.includes('licuador') || name.includes('freidor') || name.includes('receta') || name.includes('termo') || name.includes('vaso')) {
    return 'Cocina y Alimentos';
  }
  if (name.includes('carplay') || name.includes('coche') || name.includes('moto') || name.includes('vehicul') || name.includes('llanta') || name.includes('casco')) {
    return 'Vehículos y Accesorios';
  }
  if (name.includes('zapat') || name.includes('tenis') || name.includes('calzad') || name.includes('bota') || name.includes('sneaker') || name.includes('chaqueta') || name.includes('camis') || name.includes('pantalon') || name.includes('ropa') || name.includes('buzo')) {
    return 'Moda y Calzado';
  }
  if (name.includes('reloj') || name.includes('gafas') || name.includes('mochila') || name.includes('bolso') || name.includes('billetera') || name.includes('cartera')) {
    return 'Bolsos y Accesorios';
  }
  if (name.includes('juego') || name.includes('consola') || name.includes('gamer') || name.includes('control') || name.includes('mando') || name.includes('nintendo') || name.includes('ps4') || name.includes('ps5') || name.includes('xbox')) {
    return 'Videojuegos y Entretenimiento';
  }
  return 'Tecnología y Computación';
}

function syncUploadFolders() {
  if (!fs.existsSync(UPLOADS_DIR)) return { added: 0, updated: 0 };

  const data = readStoreData();
  let added = 0;
  let updated = 0;

  const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    const folderPath = path.join(UPLOADS_DIR, folderName);

    // Read image files inside folder
    let files = [];
    try {
      files = fs.readdirSync(folderPath);
    } catch (e) {
      continue;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
    const imageFiles = files
      .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (imageFiles.length === 0) continue;

    // Up to 10 photos
    const imagesList = imageFiles.slice(0, 10).map(file => {
      return `/uploads/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`;
    });

    const primaryImage = imagesList[0];

    // Check if product exists already by folderSource or matching exact/partial name
    const existingIndex = data.products.findIndex(p => {
      if (p.folderSource && p.folderSource.toLowerCase() === folderName.toLowerCase()) return true;
      const cleanP = (p.name || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
      const cleanF = folderName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
      if (cleanP === cleanF) return true;
      if (cleanP.length >= 10 && cleanF.length >= 10 && (cleanP.startsWith(cleanF.substring(0, 10)) || cleanF.startsWith(cleanP.substring(0, 10)))) return true;
      return false;
    });

    if (existingIndex !== -1) {
      const current = data.products[existingIndex];
      const imagesChanged = JSON.stringify(current.images) !== JSON.stringify(imagesList);

      if (imagesChanged) {
        data.products[existingIndex].images = imagesList;
        data.products[existingIndex].image = primaryImage;
        data.products[existingIndex].folderSource = folderName;
        updated++;
      }
    } else {
      const catName = inferCategory(folderName);
      
      // Auto-add category if missing
      if (!data.categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
        data.categories.push({
          id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          name: catName,
          icon: catName === 'Hogar' ? 'home' : (catName === 'Tecnología' ? 'smartphone' : 'tag')
        });
      }

      const newProd = {
        id: 'prod-folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: folderName,
        category: catName,
        price: 0,
        originalPrice: null,
        image: primaryImage,
        images: imagesList,
        stock: 5,
        featured: false,
        description: `Producto: ${folderName}.\nCargado automáticamente con ${imagesList.length} foto(s) desde la carpeta uploads.`,
        createdAt: new Date().toISOString(),
        folderSource: folderName
      };

      data.products.unshift(newProd);
      added++;
    }
  }

  if (added > 0 || updated > 0) {
    writeStoreData(data);
    console.log(`[Auto-Sync] Carpetas en uploads procesadas: ${added} nuevo(s), ${updated} actualizado(s).`);
  }

  return { added, updated, totalProducts: data.products.length };
}

// Initial sync on startup (Desactivado para evitar productos duplicados con precio 0)
// Los productos deben administrarse desde store.json o sincronizarse manualmente por el creador.
// syncUploadFolders();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protection against oversized payloads (limit 50MB for up to 10 high-res photos)
      if (body.length > 50 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-token, authorization',
    'Access-Control-Allow-Private-Network': 'true'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token, authorization',
      'Access-Control-Allow-Private-Network': 'true'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // POST /api/admin/login - Authenticate Creator PIN
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const data = readStoreData();
      const currentPin = String((data.settings && data.settings.adminPin) || '1234');
      const inputPin = String(payload.pin || payload.password || '').trim();

      if (inputPin === currentPin) {
        const token = generateAdminToken(currentPin);
        return sendJson(res, 200, {
          success: true,
          token: token,
          message: 'Autenticación exitosa como Creador'
        });
      } else {
        return sendJson(res, 401, {
          success: false,
          error: 'PIN de creador incorrecto'
        });
      }
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // GET /api/admin/verify - Verify Token
  if (pathname === '/api/admin/verify' && req.method === 'GET') {
    const isAuthed = verifyAdminToken(req);
    return sendJson(res, 200, {
      authenticated: isAuthed
    });
  }

  // SECURITY GUARD: Protect all API mutation endpoints (POST, PUT, DELETE)
  const isMutation = (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE');
  if (pathname.startsWith('/api/') && isMutation && pathname !== '/api/facebook/import') {
    if (!verifyAdminToken(req)) {
      req.resume();
      return sendJson(res, 403, {
        error: 'Acceso denegado: solo el creador/administrador de la tienda tiene permisos para modificar o subir contenido.'
      });
    }
  }

  // GET /api/store - Get full store state (settings, categories, products)
  if (pathname === '/api/store' && req.method === 'GET') {
    const data = readStoreData();
    const isAuthed = verifyAdminToken(req);
    const safeData = {
      ...data,
      settings: { ...data.settings },
      isCreator: isAuthed
    };
    if (!isAuthed) {
      delete safeData.settings.adminPin;
    }
    return sendJson(res, 200, safeData);
  }

  // GET /api/products
  if (pathname === '/api/products' && req.method === 'GET') {
    const data = readStoreData();
    return sendJson(res, 200, data.products || []);
  }

  // POST /api/sync-folders - Manually Trigger Folder Sync
  if (pathname === '/api/sync-folders' && req.method === 'POST') {
    const result = syncUploadFolders();
    const data = readStoreData();
    return sendJson(res, 200, {
      success: true,
      added: result.added,
      updated: result.updated,
      total: data.products.length,
      products: data.products,
      categories: data.categories
    });
  }

  // POST /api/products - Create a new product
  if (pathname === '/api/products' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const data = readStoreData();
      
      // Support array of images (up to 10)
      let imagesList = [];
      if (Array.isArray(payload.images) && payload.images.length > 0) {
        imagesList = payload.images.slice(0, 10);
      } else if (payload.image) {
        imagesList = [payload.image];
      } else {
        imagesList = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'];
      }

      const newProduct = {
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        code: (payload.code || '').trim().toUpperCase(),
        name: payload.name || 'Producto sin nombre',
        category: payload.category || 'Tecnología y Computación',
        price: Number(payload.price) || 0,
        originalPrice: payload.originalPrice ? Number(payload.originalPrice) : null,
        image: imagesList[0], // primary image
        images: imagesList,   // full list (up to 10 photos)
        stock: Number(payload.stock) !== undefined ? Number(payload.stock) : 10,
        featured: Boolean(payload.featured),
        description: payload.description || '',
        createdAt: new Date().toISOString()
      };

      data.products.unshift(newProduct);

      // Auto-add category if it does not exist
      if (newProduct.category && !data.categories.some(c => c.name.toLowerCase() === newProduct.category.toLowerCase())) {
        data.categories.push({
          id: 'cat-' + Date.now(),
          name: newProduct.category,
          icon: 'tag'
        });
      }

      writeStoreData(data);
      return sendJson(res, 201, { success: true, product: newProduct });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // PUT /api/products/:id - Update product
  if (pathname.startsWith('/api/products/') && req.method === 'PUT') {
    try {
      const id = pathname.replace('/api/products/', '');
      const payload = await parseBody(req);
      const data = readStoreData();
      const index = data.products.findIndex(p => p.id === id);

      if (index === -1) {
        return sendJson(res, 404, { error: 'Producto no encontrado' });
      }

      let updatedImages = data.products[index].images || [data.products[index].image];
      if (Array.isArray(payload.images)) {
        updatedImages = payload.images.slice(0, 10);
      } else if (payload.image) {
        updatedImages = [payload.image];
      }

      data.products[index] = {
        ...data.products[index],
        code: payload.code !== undefined ? String(payload.code).trim().toUpperCase() : (data.products[index].code || ''),
        name: payload.name !== undefined ? payload.name : data.products[index].name,
        category: payload.category !== undefined ? payload.category : data.products[index].category,
        price: payload.price !== undefined ? Number(payload.price) : data.products[index].price,
        originalPrice: payload.originalPrice !== undefined ? (payload.originalPrice ? Number(payload.originalPrice) : null) : data.products[index].originalPrice,
        image: updatedImages[0] || payload.image || data.products[index].image,
        images: updatedImages,
        stock: payload.stock !== undefined ? Number(payload.stock) : data.products[index].stock,
        featured: payload.featured !== undefined ? Boolean(payload.featured) : data.products[index].featured,
        description: payload.description !== undefined ? payload.description : data.products[index].description,
        updatedAt: new Date().toISOString()
      };

      writeStoreData(data);
      return sendJson(res, 200, { success: true, product: data.products[index] });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // DELETE /api/products/:id - Remove product
  if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
    const id = pathname.replace('/api/products/', '');
    const data = readStoreData();
    const prevCount = data.products.length;
    data.products = data.products.filter(p => p.id !== id);

    if (data.products.length === prevCount) {
      return sendJson(res, 404, { error: 'Producto no encontrado' });
    }

    writeStoreData(data);
    return sendJson(res, 200, { success: true, message: 'Producto eliminado exitosamente' });
  }

  // POST /api/categories - Add Category
  if (pathname === '/api/categories' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const catName = (payload.name || '').trim();
      if (!catName) {
        return sendJson(res, 400, { error: 'El nombre de la categoría es obligatorio' });
      }

      const data = readStoreData();
      if (data.categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
        return sendJson(res, 400, { error: 'La categoría ya existe' });
      }

      const newCategory = {
        id: 'cat-' + Date.now(),
        name: catName,
        icon: payload.icon || 'tag'
      };

      data.categories.push(newCategory);
      writeStoreData(data);
      return sendJson(res, 201, { success: true, category: newCategory });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // PUT /api/categories/:name - Update / Rename Category & its Products
  if (pathname.startsWith('/api/categories/') && req.method === 'PUT') {
    try {
      const oldName = decodeURIComponent(pathname.replace('/api/categories/', '')).toLowerCase();
      const payload = await parseBody(req);
      const newName = (payload.name || '').trim();
      const newIcon = payload.icon || 'tag';

      if (!newName) {
        return sendJson(res, 400, { error: 'El nuevo nombre de la categoría es obligatorio' });
      }

      const data = readStoreData();
      const catIndex = data.categories.findIndex(c => c.name.toLowerCase() === oldName);
      if (catIndex === -1) {
        return sendJson(res, 404, { error: 'Categoría no encontrada' });
      }

      // Check if new name is already taken by another category
      const duplicate = data.categories.find((c, idx) => idx !== catIndex && c.name.toLowerCase() === newName.toLowerCase());
      if (duplicate) {
        return sendJson(res, 400, { error: 'Ya existe otra categoría con ese nombre' });
      }

      const actualOldName = data.categories[catIndex].name;
      data.categories[catIndex].name = newName;
      if (newIcon) data.categories[catIndex].icon = newIcon;

      // Update all products that had the old category
      let updatedProductsCount = 0;
      data.products.forEach(prod => {
        if (prod.category.toLowerCase() === actualOldName.toLowerCase()) {
          prod.category = newName;
          updatedProductsCount++;
        }
      });

      writeStoreData(data);
      return sendJson(res, 200, { 
        success: true, 
        category: data.categories[catIndex],
        updatedProductsCount 
      });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // DELETE /api/categories/:name - Remove Category
  if (pathname.startsWith('/api/categories/') && req.method === 'DELETE') {
    const catName = decodeURIComponent(pathname.replace('/api/categories/', '')).toLowerCase();
    const data = readStoreData();
    data.categories = data.categories.filter(c => c.name.toLowerCase() !== catName);
    writeStoreData(data);
    return sendJson(res, 200, { success: true, message: 'Categoría eliminada' });
  }

  // PUT /api/settings - Update Store Settings
  if (pathname === '/api/settings' && req.method === 'PUT') {
    try {
      const payload = await parseBody(req);
      const data = readStoreData();
      if (payload.adminPin !== undefined && String(payload.adminPin).trim()) {
        data.settings.adminPin = String(payload.adminPin).trim();
      }
      data.settings = { ...data.settings, ...payload };
      writeStoreData(data);
      const updatedToken = generateAdminToken(data.settings.adminPin);
      return sendJson(res, 200, { success: true, settings: data.settings, token: updatedToken });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // Helper to save a single base64 image or video
  function saveBase64Image(data, filename) {
    const commaIndex = data.indexOf(',');
    let buffer;
    let ext = '.jpg';

    if (data.startsWith('data:') && commaIndex !== -1) {
      const header = data.substring(0, commaIndex).toLowerCase();
      const base64Data = data.substring(commaIndex + 1);
      buffer = Buffer.from(base64Data, 'base64');

      if (header.includes('video/mp4')) ext = '.mp4';
      else if (header.includes('video/webm')) ext = '.webm';
      else if (header.includes('video/quicktime')) ext = '.mov';
      else if (header.includes('video/ogg')) ext = '.ogg';
      else if (header.includes('image/png')) ext = '.png';
      else if (header.includes('image/webp')) ext = '.webp';
      else if (header.includes('image/gif')) ext = '.gif';
      else if (header.includes('image/svg')) ext = '.svg';
      else ext = '.jpg';
    } else {
      buffer = Buffer.from(data, 'base64');
      if (filename && path.extname(filename)) {
        ext = path.extname(filename);
      }
    }

    const safeBaseName = (filename ? path.basename(filename, path.extname(filename)) : 'media')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 30);

    const savedFilename = `mao_${Date.now()}_${Math.random().toString(36).substring(2, 6)}_${safeBaseName}${ext}`;
    const filePath = path.join(UPLOADS_DIR, savedFilename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/${savedFilename}`;
  }

  // POST /api/upload - Handle Single Image Upload
  if (pathname === '/api/upload' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const { filename, data } = payload;

      if (!data) {
        return sendJson(res, 400, { error: 'No se recibió imagen para guardar' });
      }

      const publicUrl = saveBase64Image(data, filename);
      return sendJson(res, 200, { success: true, url: publicUrl });
    } catch (err) {
      console.error('Error saving uploaded image:', err);
      return sendJson(res, 500, { error: 'Error al guardar la imagen en el servidor' });
    }
  }

  // POST /api/upload-batch - Handle Multiple Images Upload (up to 10)
  if (pathname === '/api/upload-batch' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const items = Array.isArray(payload.images) ? payload.images.slice(0, 10) : [];

      if (items.length === 0) {
        return sendJson(res, 400, { error: 'No se recibieron imágenes' });
      }

      const savedUrls = items.map((item, idx) => {
        if (typeof item === 'string') {
          // If it's already an external URL or uploaded path, keep it
          if (item.startsWith('http') || item.startsWith('/uploads/')) return item;
          return saveBase64Image(item, `image_${idx}.jpg`);
        } else if (item && item.data) {
          return saveBase64Image(item.data, item.filename || `image_${idx}.jpg`);
        }
        return null;
      }).filter(Boolean);

      return sendJson(res, 200, { success: true, urls: savedUrls });
    } catch (err) {
      console.error('Error in batch upload:', err);
      return sendJson(res, 500, { error: 'Error al procesar las fotos' });
    }
  }

  // Helper to download an external image directly into a local file
  function downloadImageToFile(url, destFilePath) {
    return new Promise((resolve, reject) => {
      if (!url) return reject(new Error('No URL provided'));

      // If data URL (Base64)
      if (url.startsWith('data:image/')) {
        const matches = url.match(/^data:image\/[a-zA-Z0-9.+]+;base64,(.+)$/);
        if (matches) {
          try {
            fs.writeFileSync(destFilePath, Buffer.from(matches[1], 'base64'));
            return resolve(destFilePath);
          } catch (e) {
            return reject(e);
          }
        }
      }

      const client = url.startsWith('https:') ? https : http;
      const requestOptions = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://www.facebook.com/'
        }
      };

      const req = client.get(url, requestOptions, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadImageToFile(res.headers.location, destFilePath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} when downloading image`));
        }
        const fileStream = fs.createWriteStream(destFilePath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(destFilePath);
        });
        fileStream.on('error', (err) => {
          try { if (fs.existsSync(destFilePath)) fs.unlinkSync(destFilePath); } catch (e) {}
          reject(err);
        });
      });

      req.setTimeout(25000, () => {
        req.destroy();
        reject(new Error('Timeout downloading image'));
      });

      req.on('error', (err) => {
        try { if (fs.existsSync(destFilePath)) fs.unlinkSync(destFilePath); } catch (e) {}
        reject(err);
      });
    });
  }

  // POST /api/facebook/import - Import scraped products from Facebook Marketplace
  if (pathname === '/api/facebook/import' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const items = Array.isArray(payload.products) ? payload.products : (payload.title ? [payload] : []);

      if (items.length === 0) {
        return sendJson(res, 400, { error: 'No se recibieron productos para importar' });
      }

      const data = readStoreData();
      let importedCount = 0;
      let updatedCount = 0;
      const processedResults = [];

      for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
        const item = items[itemIdx];
        try {
          const title = (item.title || item.name || 'Producto Marketplace').trim();
          if (!title) continue;

          // Clean folder name for Windows filesystems (remove characters like \ / : * ? " < > | and trailing spaces/dots)
          let cleanFolderName = title
            .replace(/[\/\\:*?"<>|\r\n\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 50)
            .trim()
            .replace(/[\.\s]+$/, '');

          if (!cleanFolderName || cleanFolderName.length < 2) {
            cleanFolderName = 'producto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
          }

          let folderPath = path.join(UPLOADS_DIR, cleanFolderName);
          try {
            if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath, { recursive: true });
            }
          } catch (mkErr) {
            console.warn(`[FB Import] Error creando carpeta "${cleanFolderName}": ${mkErr.message}. Usando alternativa segura.`);
            cleanFolderName = 'prod_' + Date.now() + '_' + itemIdx;
            folderPath = path.join(UPLOADS_DIR, cleanFolderName);
            if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath, { recursive: true });
            }
          }

          const rawImages = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
          const downloadedImages = [];

          for (let i = 0; i < Math.min(rawImages.length, 12); i++) {
            const imgUrl = rawImages[i];
            if (!imgUrl || typeof imgUrl !== 'string') continue;

            // If image is already an internal path
            if (imgUrl.startsWith('/uploads/')) {
              downloadedImages.push(imgUrl);
              continue;
            }

            let fileExt = '.jpg';
            if (imgUrl.toLowerCase().includes('.png')) fileExt = '.png';
            else if (imgUrl.toLowerCase().includes('.webp')) fileExt = '.webp';

            const fileName = `foto_${String(i + 1).padStart(2, '0')}${fileExt}`;
            const destFilePath = path.join(folderPath, fileName);

            // Always download full-resolution image (overwrites any previous cropped thumbnail)
            try {
              await downloadImageToFile(imgUrl, destFilePath);
            } catch (dlErr) {
              console.warn(`[FB Import] Could not download image ${i + 1} for "${title}":`, dlErr.message);
            }

            if (fs.existsSync(destFilePath) && fs.statSync(destFilePath).size > 0) {
              const publicUrl = `/uploads/${encodeURIComponent(cleanFolderName)}/${encodeURIComponent(fileName)}`;
              downloadedImages.push(publicUrl);
            }
          }

          // Fallback default image if none downloaded
          if (downloadedImages.length === 0) {
            // Check if there are existing images in that folder on disk
            try {
              const existingFiles = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
              if (existingFiles.length > 0) {
                for (const ef of existingFiles) {
                  downloadedImages.push(`/uploads/${encodeURIComponent(cleanFolderName)}/${encodeURIComponent(ef)}`);
                }
              }
            } catch (e) {}
          }

          if (downloadedImages.length === 0) {
            downloadedImages.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800');
          }

          // Clean price
          let numericPrice = 0;
          if (typeof item.price === 'number') {
            numericPrice = item.price;
          } else if (item.price) {
            let str = String(item.price).replace(/COP|[\$\s]/gi, '').trim();
            if (str.includes('.') && !str.includes(',')) str = str.replace(/\./g, '');
            else if (str.includes(',') && !str.includes('.')) str = str.replace(/,/g, '');
            else if (str.includes('.') && str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
            numericPrice = parseFloat(str) || 0;
          }

          // Category
          const catName = (item.category && item.category !== 'General') ? item.category.trim() : inferCategory(cleanFolderName);
          if (!data.categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
            data.categories.push({
              id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
              name: catName,
              icon: catName === 'Hogar' ? 'home' : (catName === 'Tecnología' ? 'smartphone' : 'tag')
            });
          }

          // Check if product exists already (by ID, folderSource, or full/partial name match)
          const existingIdx = data.products.findIndex(p => {
            if (item.id && p.id === item.id) return true;
            if (p.folderSource && p.folderSource.toLowerCase() === cleanFolderName.toLowerCase()) return true;
            const pName = (p.name || '').trim().toLowerCase();
            const tName = title.trim().toLowerCase();
            if (pName === tName) return true;
            if (pName.length >= 15 && tName.length >= 15 && (pName.startsWith(tName) || tName.startsWith(pName))) return true;
            return false;
          });

          if (existingIdx !== -1) {
            const curr = data.products[existingIdx];
            const hasNewPhotos = downloadedImages.length > 0 && !downloadedImages[0].includes('unsplash');
            data.products[existingIdx] = {
              ...curr,
              name: title,
              price: numericPrice > 0 ? numericPrice : curr.price,
              originalPrice: item.originalPrice ? Number(item.originalPrice) : curr.originalPrice,
              description: (item.description && item.description.length > 5) ? item.description : curr.description,
              category: catName,
              image: hasNewPhotos ? downloadedImages[0] : (curr.image || downloadedImages[0]),
              images: hasNewPhotos ? downloadedImages : (curr.images && curr.images.length > 0 ? curr.images : downloadedImages),
              folderSource: cleanFolderName,
              updatedAt: new Date().toISOString()
            };
            updatedCount++;
            processedResults.push({ id: curr.id, title, action: 'updated', folder: cleanFolderName, photos: (hasNewPhotos ? downloadedImages.length : (curr.images ? curr.images.length : 1)) });
          } else {
            const newId = 'prod-fb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
            const newProduct = {
              id: newId,
              name: title,
              category: catName,
              price: numericPrice,
              originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
              image: downloadedImages[0],
              images: downloadedImages,
              stock: 5,
              featured: true,
              description: item.description || `Producto: ${title}.\nImportado desde Facebook Marketplace.`,
              createdAt: new Date().toISOString(),
              folderSource: cleanFolderName
            };
            data.products.unshift(newProduct);
            importedCount++;
            processedResults.push({ id: newId, title, action: 'created', folder: cleanFolderName, photos: downloadedImages.length });
          }
        } catch (itemErr) {
          console.warn(`[FB Import] Error en publicación #${itemIdx + 1}:`, itemErr.message);
        }
      }

      writeStoreData(data);
      console.log(`[FB Import] Exitoso: ${importedCount} creados, ${updatedCount} actualizados en carpetas.`);

      return sendJson(res, 200, {
        success: true,
        importedCount,
        updatedCount,
        totalProducts: data.products.length,
        results: processedResults
      });
    } catch (err) {
      console.error('Error in Facebook import:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/sync-google-sheets - Fetch live Google Sheets and sync all product prices
  if (pathname === '/api/sync-google-sheets' && req.method === 'POST') {
    try {
      const gsheetUrl = 'https://docs.google.com/spreadsheets/d/1elmMKkIfhdNnoIqicXx8OfCO8fhOfBhN/gviz/tq?tqx=out:csv&sheet=IMPORTACIONES';
      
      const fetchCSV = (url) => {
        return new Promise((resolve, reject) => {
          https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              return resolve(fetchCSV(res.headers.location));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          }).on('error', reject);
        });
      };

      const rawCSV = await fetchCSV(gsheetUrl);
      
      // Parse CSV into rows
      const lines = rawCSV.split(/\r?\n/).filter(line => line.trim().length > 0);
      const rows = [];
      for (const line of lines) {
        const row = [];
        let insideQuote = false;
        let entry = '';
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (insideQuote && line[i + 1] === '"') {
              entry += '"';
              i++;
            } else {
              insideQuote = !insideQuote;
            }
          } else if (char === ',' && !insideQuote) {
            row.push(entry.trim());
            entry = '';
          } else {
            entry += char;
          }
        }
        row.push(entry.trim());
        rows.push(row);
      }

      const codeStats = new Map();
      const nameStats = new Map();
      const allSheetItems = [];

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const code = (r[2] || '').trim().toUpperCase();
        const name = (r[3] || '').trim();
        const rawPrice = (r[9] || '').replace(/[^\d]/g, '');
        const price = parseInt(rawPrice, 10);
        const isSold = (r[10] || '').trim() === '1';

        if (code) {
          if (!codeStats.has(code)) {
            codeStats.set(code, { code, names: new Set(), totalBought: 0, totalSold: 0, price: 0 });
          }
          const cs = codeStats.get(code);
          if (name) cs.names.add(name);
          cs.totalBought += 1;
          if (isSold) cs.totalSold += 1;
          if (!isNaN(price) && price >= 5000) cs.price = price;
        }

        if (name) {
          const nameKey = name.toLowerCase();
          if (!nameStats.has(nameKey)) {
            nameStats.set(nameKey, { name, codes: new Set(), totalBought: 0, totalSold: 0, price: 0 });
          }
          const ns = nameStats.get(nameKey);
          if (code) ns.codes.add(code);
          ns.totalBought += 1;
          if (isSold) ns.totalSold += 1;
          if (!isNaN(price) && price >= 5000) ns.price = price;
        }

        if (code || name) {
          allSheetItems.push({ code, name, price, isSold });
        }
      }

      const data = readStoreData();
      let updatedCount = 0;
      let matchedCount = 0;
      let soldOutCount = 0;
      const updatedDetails = [];

      for (const prod of data.products) {
        const title = prod.name;
        let matchedItem = null;
        let code = null;

        // 1. Explicit P-Code e.g. P560, P-371, P528
        const pMatch = title.match(/\bP\s*[-_]?\s*(\d{1,4})\b/i);
        if (pMatch) {
          code = 'P' + pMatch[1];
          matchedItem = codeStats.get(code);
        }

        // 2. Trailing code at end of title e.g. ", 561" or "- 491"
        if (!matchedItem) {
          const endMatch = title.match(/(?:,\s*|-\s*|\.\s*|\s+)(\d{2,4})\s*$/);
          if (endMatch) {
            code = 'P' + endMatch[1];
            matchedItem = codeStats.get(code);
          }
        }

        // 3. Name lookup fallback
        if (!matchedItem) {
          matchedItem = nameStats.get(title.toLowerCase().trim());
          if (matchedItem && matchedItem.codes.size > 0) {
            code = Array.from(matchedItem.codes)[0];
          }
        }

        // 4. Fuzzy keyword match
        if (!matchedItem) {
          const pWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
          let bestMatch = null;
          let bestScore = 0;

          for (const item of allSheetItems) {
            if (!item.name) continue;
            const itemLower = item.name.toLowerCase();
            let matchCount = 0;
            for (const w of pWords) {
              if (itemLower.includes(w)) matchCount++;
            }
            if (matchCount > bestScore && matchCount >= 3) {
              bestScore = matchCount;
              bestMatch = item;
            }
          }

          if (bestMatch && bestMatch.code) {
            code = bestMatch.code;
            matchedItem = codeStats.get(code);
          }
        }

        if (code) {
          prod.code = code;
        }

        if (matchedItem) {
          matchedCount++;
          let hasChanged = false;
          const oldPrice = prod.price;
          const oldStock = prod.stock;

          if (matchedItem.price >= 5000 && prod.price !== matchedItem.price) {
            prod.price = matchedItem.price;
            hasChanged = true;
          }

          const availableStock = matchedItem.totalBought - matchedItem.totalSold;
          const newStock = availableStock <= 0 ? 0 : availableStock;
          if (prod.stock !== newStock) {
            prod.stock = newStock;
            hasChanged = true;
          }

          if (newStock === 0) soldOutCount++;

          if (hasChanged) {
            prod.updatedAt = new Date().toISOString();
            updatedCount++;
            updatedDetails.push({
              id: prod.id,
              name: prod.name,
              code: prod.code || '',
              oldPrice,
              newPrice: prod.price,
              stock: prod.stock
            });
          }
        }
      }

      writeStoreData(data);

      return sendJson(res, 200, {
        success: true,
        updatedCount,
        matchedCount,
        soldOutCount,
        totalProducts: data.products.length,
        totalSheetRows: rows.length,
        details: updatedDetails
      });
    } catch (err) {
      console.error('Error syncing Google Sheet prices:', err);
      return sendJson(res, 500, { error: err.message });
    }
  }

  // POST /api/sync-to-render - Push local catalog and changes directly to Render
  if (pathname === '/api/sync-to-render' && req.method === 'POST') {
    if (!verifyAdminToken(req)) {
      return sendJson(res, 403, { error: 'Acceso denegado: debes ser creador/administrador para sincronizar con Render.' });
    }
    const { execFile } = require('child_process');
    const nodeExe = path.join(__dirname, 'node.exe');
    const scriptPath = path.join(__dirname, 'sincronizar_con_render.js');
    const runner = fs.existsSync(nodeExe) ? nodeExe : 'node';

    execFile(runner, [scriptPath], { timeout: 240000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('Error in sync-to-render:', err, stderr);
        return sendJson(res, 500, { error: 'Error durante la sincronización: ' + (err.message || stderr) });
      }
      return sendJson(res, 200, {
        success: true,
        message: '¡Tienda sincronizada exitosamente con Render!',
        output: stdout
      });
    });
    return;
  }

  // -------------------------------------------------------------
  // STATIC FILES (Uploads, Public folder)
  // -------------------------------------------------------------
  let filePath;
  if (pathname.startsWith('/uploads/')) {
    const relativePath = decodeURIComponent(pathname.replace(/^\/uploads\/?/, ''));
    filePath = path.join(UPLOADS_DIR, relativePath);
  } else {
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    filePath = path.join(PUBLIC_DIR, relativePath);
  }

  // Security check to avoid directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(PUBLIC_DIR) && !normalizedPath.startsWith(UPLOADS_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acceso denegado');
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If client-side route, fallback to index.html
      const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
      if (fs.existsSync(fallbackIndex)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return fs.createReadStream(fallbackIndex).pipe(res);
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Archivo no encontrado');
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // HTTP 206 Partial Content (Range) support for video streaming
    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm' || ext === '.mov' || ext === '.ogg')) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(normalizedPath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      return file.pipe(res);
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(normalizedPath).pipe(res);
  });
});

server.on('error', err => {
  console.error('SERVER ERROR:', err);
});
process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', reason => {
  console.error('UNHANDLED REJECTION:', reason);
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛍️  MAO STORE SERVER EN EJECUCIÓN`);
  console.log(`📍  Accede localmente en: http://localhost:${PORT}`);
  console.log(`💾  Base de datos: ${DATA_FILE}`);
  console.log(`📁  Carpeta de imágenes: ${UPLOADS_DIR}`);
  console.log(`=======================================================`);
});
