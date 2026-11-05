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
  // En localhost (computador local del dueño), tiene acceso directo de creador
  const ip = getClientIp(req);
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || (req.headers.host && req.headers.host.includes('localhost'))) {
    return true;
  }
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
// HELPERS FOR PRODUCT FOLDERS & TEXT FILES (producto.txt)
// -------------------------------------------------------------
function sanitizeFolderName(name) {
  return (name || 'producto')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 65)
    .replace(/[.,\s_\-]+$/, '')
    .trim();
}

function parseProductTxt(txtPath) {
  if (!fs.existsSync(txtPath)) return null;
  try {
    const content = fs.readFileSync(txtPath, 'utf8');
    const result = {};

    const codeMatch = content.match(/ITEM\s*\((?:CODIGO|C[ÓO]DIGO)\)\s*:\s*([^\r\n]+)/i);
    if (codeMatch && codeMatch[1].trim() && codeMatch[1].trim() !== 'N/A') {
      result.code = codeMatch[1].trim();
    }

    const titleMatch = content.match(/TITULO\s*:\s*([^\r\n]+)/i);
    if (titleMatch && titleMatch[1].trim()) {
      result.name = titleMatch[1].trim();
    }

    const priceMatch = content.match(/PRECIO_VENTA\s*:\s*([^\r\n]+)/i);
    if (priceMatch) {
      const num = parseInt(priceMatch[1].replace(/[^\d]/g, ''), 10);
      if (!isNaN(num) && num > 0) result.price = num;
    }

    const stockMatch = content.match(/STOCK\s*:\s*([^\r\n]+)/i);
    if (stockMatch) {
      const num = parseInt(stockMatch[1].replace(/[^\d]/g, ''), 10);
      if (!isNaN(num)) result.stock = num;
    }

    const catMatch = content.match(/CATEGORIA\s*:\s*([^\r\n]+)/i);
    if (catMatch && catMatch[1].trim()) {
      result.category = catMatch[1].trim();
    }

    const descMatch = content.match(/DESCRIPCION:\s*\r?\n([\s\S]*?)(?=\r?\n(?:PRECIO_VENTA|STOCK|CATEGORIA|ESTADO|ENLACE|PUNTOS|===)|$)/i);
    if (descMatch && descMatch[1].trim()) {
      result.description = descMatch[1].trim();
    }

    return result;
  } catch (e) {
    return null;
  }
}

function writeProductTxt(folderPath, product) {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const txtPath = path.join(folderPath, 'producto.txt');
    const imgsCount = Array.isArray(product.images) ? product.images.length : (product.image ? 1 : 0);
    const txtContent = `============================================================
INFORMACION DEL PRODUCTO - MAO STORE
============================================================
ITEM (CODIGO): ${product.code || 'N/A'}
TITULO: ${product.name || 'Sin título'}
DESCRIPCION:
${product.description || `Producto: ${product.name}`}

PRECIO_VENTA: ${product.price || 0}
STOCK: ${product.stock !== undefined ? product.stock : 1}
CATEGORIA: ${product.category || 'Tecnología y Computación'}
ESTADO: ${Number(product.stock) <= 0 ? 'AGOTADO' : 'DISPONIBLE'}

PUNTOS IMPORTANTES / CARACTERISTICAS:
• Codigo ITEM de inventario: ${product.code || 'N/A'}
• Titulo del producto: ${product.name || 'Sin título'}
• Precio oficial de venta: $ ${(product.price || 0).toLocaleString('es-CO')} COP
• Categoria: ${product.category || 'Tecnología y Computación'}
• Estado de stock: ${Number(product.stock) <= 0 ? 'Agotado (0 unidades)' : `Disponible (${product.stock} unidades)`}
• Archivos multimedia: ${imgsCount} foto(s) detectada(s) en esta carpeta
============================================================
`;
    fs.writeFileSync(txtPath, txtContent, 'utf8');
  } catch (e) {
    console.error('Error al guardar producto.txt:', e.message);
  }
}

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
  if (!fs.existsSync(UPLOADS_DIR)) return { added: 0, updated: 0, totalProducts: 0 };

  const data = readStoreData();
  let added = 0;
  let updated = 0;

  const entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    const folderPath = path.join(UPLOADS_DIR, folderName);

    // Leer fotos de la carpeta
    let files = [];
    try {
      files = fs.readdirSync(folderPath);
    } catch (e) {
      continue;
    }

    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4'];
    const imageFiles = files
      .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    // Leer producto.txt de la carpeta si existe
    const txtPath = path.join(folderPath, 'producto.txt');
    const txtData = parseProductTxt(txtPath);

    // Si no hay imágenes ni producto.txt, ignorar
    if (imageFiles.length === 0 && !txtData) continue;

    const imagesList = imageFiles.map(file => {
      return `/uploads/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`;
    });
    const primaryImage = imagesList[0] || '';

    // Buscar si ya existe el producto en data.products
    const existingIndex = data.products.findIndex(p => {
      if (p.folder && p.folder.toLowerCase() === folderName.toLowerCase()) return true;
      if (p.folderSource && p.folderSource.toLowerCase() === folderName.toLowerCase()) return true;
      if (txtData && txtData.code && p.code && p.code.toUpperCase() === txtData.code.toUpperCase()) return true;
      const cleanP = (p.name || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
      const cleanF = folderName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, '').toLowerCase();
      if (cleanP === cleanF) return true;
      if (cleanP.length >= 10 && cleanF.length >= 10 && (cleanP.startsWith(cleanF.substring(0, 10)) || cleanF.startsWith(cleanP.substring(0, 10)))) return true;
      return false;
    });

    if (existingIndex !== -1) {
      const current = data.products[existingIndex];
      let changed = false;

      // Sincronizar carpeta
      if (current.folder !== folderName) {
        current.folder = folderName;
        changed = true;
      }

      // Sincronizar imágenes detectadas en la carpeta
      if (imagesList.length > 0 && JSON.stringify(current.images) !== JSON.stringify(imagesList)) {
        current.images = imagesList;
        current.image = primaryImage;
        changed = true;
      }

      // Sincronizar datos desde producto.txt si fue editado
      if (txtData) {
        if (txtData.code && current.code !== txtData.code) { current.code = txtData.code; changed = true; }
        if (txtData.name && current.name !== txtData.name) { current.name = txtData.name; changed = true; }
        if (txtData.price !== undefined && current.price !== txtData.price) { current.price = txtData.price; changed = true; }
        if (txtData.stock !== undefined && current.stock !== txtData.stock) { current.stock = txtData.stock; changed = true; }
        if (txtData.description && current.description !== txtData.description) { current.description = txtData.description; changed = true; }
        if (txtData.category && current.category !== txtData.category) { current.category = txtData.category; changed = true; }
      }

      if (changed) {
        data.products[existingIndex] = current;
        updated++;
      }
    } else {
      // Producto nuevo creado desde carpeta
      const catName = (txtData && txtData.category) ? txtData.category : inferCategory(folderName);
      
      if (!data.categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
        data.categories.push({
          id: 'cat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          name: catName,
          icon: 'tag'
        });
      }

      const newProd = {
        id: 'prod-folder-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        code: (txtData && txtData.code) ? txtData.code : '',
        name: (txtData && txtData.name) ? txtData.name : folderName,
        category: catName,
        price: (txtData && txtData.price) ? txtData.price : 0,
        originalPrice: null,
        image: primaryImage,
        images: imagesList,
        stock: (txtData && txtData.stock !== undefined) ? txtData.stock : 5,
        featured: false,
        description: (txtData && txtData.description) ? txtData.description : `Producto: ${folderName}`,
        createdAt: new Date().toISOString(),
        folder: folderName,
        folderSource: folderName
      };

      data.products.unshift(newProd);
      writeProductTxt(folderPath, newProd);
      added++;
    }
  }

  if (added > 0 || updated > 0) {
    writeStoreData(data);
    console.log(`[Auto-Sync] Sincronización de carpetas: ${added} nuevo(s), ${updated} actualizado(s).`);
  }

  return { added, updated, totalProducts: data.products.length };
}

// Initial sync on startup (Desactivado para evitar productos duplicados con precio 0)
// Los productos deben administrarse desde store.json o sincronizarse manualmente por el creador.
// syncUploadFolders();

// -------------------------------------------------------------
// RATE LIMITING & SECURITY DEFENSES
// -------------------------------------------------------------
const failedLoginAttempts = new Map(); // ip -> { count: number, blockedUntil: number }
const ipRequestCounts = new Map(); // ip -> { count: number, resetAt: number }

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

function checkRateLimit(req, pathname) {
  // 1. Excluir completamente archivos estáticos (imágenes, CSS, JS, fuentes, video)
  if (pathname && !pathname.startsWith('/api/')) return true;

  // 2. Excluir tráfico local en localhost
  const ip = getClientIp(req);
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.includes('localhost')) {
    return true;
  }

  // 3. Excluir al creador / administrador autenticado (nunca bloquear edición de productos)
  if (verifyAdminToken(req)) {
    return true;
  }

  // 4. Rate limit solo para llamadas anónimas a la API pública
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minuto
  const maxRequests = 600; // 600 peticiones API por minuto

  let record = ipRequestCounts.get(ip);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + limitWindow };
    ipRequestCounts.set(ip, record);
    return true;
  }
  record.count++;
  if (record.count > maxRequests) {
    return false;
  }
  return true;
}

function requireAdmin(req, res) {
  if (verifyAdminToken(req)) return true;
  sendJson(res, 401, { 
    error: 'No autorizado. Debes iniciar sesión con tu PIN de creador (0809) para realizar esta acción.' 
  });
  return false;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytesReceived = 0;
    const MAX_SIZE = 35 * 1024 * 1024; // 35MB máximo para fotos/video

    req.on('data', chunk => {
      bytesReceived += chunk.length;
      if (bytesReceived > MAX_SIZE) {
        req.destroy();
        return reject(new Error('El tamaño de la petición excede el límite permitido de seguridad (35MB)'));
      }
      body += chunk;
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
    'Access-Control-Allow-Private-Network': 'true',
    // OWASP Security Headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Rate limiting para llamadas API (excluyendo estáticos, localhost y creador autenticado)
  if (!checkRateLimit(req, pathname)) {
    return sendJson(res, 429, { 
      error: 'Demasiadas solicitudes por minuto. Por seguridad, por favor espera un momento.' 
    });
  }

  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-admin-token, authorization',
      'Access-Control-Allow-Private-Network': 'true',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });
    return res.end();
  }

  // -------------------------------------------------------------
  // API ROUTES
  // -------------------------------------------------------------

  // POST /api/admin/login - Authenticate Creator PIN con protección contra fuerza bruta
  if (pathname === '/api/admin/login' && req.method === 'POST') {
    try {
      const ip = getClientIp(req);
      const now = Date.now();
      const attempts = failedLoginAttempts.get(ip) || { count: 0, blockedUntil: 0 };

      // Comprobar si la IP está bloqueada por demasiados intentos fallidos
      if (attempts.blockedUntil && now < attempts.blockedUntil) {
        const remainingMins = Math.ceil((attempts.blockedUntil - now) / 60000);
        return sendJson(res, 429, { 
          error: `Acceso bloqueado por seguridad tras varios intentos fallidos. Intenta nuevamente en ${remainingMins} minuto(s).` 
        });
      }

      const payload = await parseBody(req);
      const data = readStoreData();
      const currentPin = String((data.settings && data.settings.adminPin) || '1234');
      const inputPin = String(payload.pin || payload.password || '').trim();

      if (inputPin === currentPin) {
        // Éxito: restablecer contador de fallos
        failedLoginAttempts.delete(ip);
        const token = generateAdminToken(currentPin);
        return sendJson(res, 200, {
          success: true,
          token: token,
          message: 'Autenticación exitosa como Creador'
        });
      } else {
        // Fallo: incrementar intentos y bloquear si llega a 5
        attempts.count = (attempts.count || 0) + 1;
        if (attempts.count >= 5) {
          attempts.blockedUntil = now + (15 * 60 * 1000); // 15 minutos de bloqueo
          failedLoginAttempts.set(ip, attempts);
          return sendJson(res, 429, { 
            error: 'Has superado el límite de 5 intentos fallidos. Por seguridad, el acceso ha sido bloqueado por 15 minutos.' 
          });
        }
        failedLoginAttempts.set(ip, attempts);
        const remaining = 5 - attempts.count;
        return sendJson(res, 401, {
          success: false,
          error: `PIN de creador incorrecto. Te quedan ${remaining} intento(s) antes del bloqueo temporal.`
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
  if (pathname.startsWith('/api/') && isMutation && pathname !== '/api/admin/login') {
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
      
      const productName = payload.name || 'Producto sin nombre';
      const folderName = payload.folder || sanitizeFolderName(productName);
      const productDir = path.join(UPLOADS_DIR, folderName);
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      // Support array of images (up to 10), saving any base64 directly to the product folder
      let rawImages = [];
      if (Array.isArray(payload.images) && payload.images.length > 0) {
        rawImages = payload.images.slice(0, 10);
      } else if (payload.image) {
        rawImages = [payload.image];
      }

      const imagesList = rawImages.map((img, idx) => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          return saveBase64Image(img, `foto_${String(idx + 1).padStart(2, '0')}.jpg`, folderName);
        }
        return img;
      });

      const newProduct = {
        id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        code: (payload.code || '').trim().toUpperCase(),
        name: productName,
        category: payload.category || 'Tecnología y Computación',
        price: Number(payload.price) || 0,
        originalPrice: payload.originalPrice ? Number(payload.originalPrice) : null,
        image: imagesList[0] || '',
        images: imagesList,
        stock: payload.stock !== undefined ? Number(payload.stock) : 5,
        featured: Boolean(payload.featured),
        description: payload.description || `Producto: ${productName}`,
        folder: folderName,
        folderSource: folderName,
        createdAt: new Date().toISOString()
      };

      // Guardar archivo producto.txt dentro de la carpeta del producto
      writeProductTxt(productDir, newProduct);

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

      const prodName = payload.name !== undefined ? payload.name : data.products[index].name;
      const folderName = payload.folder || data.products[index].folder || sanitizeFolderName(prodName);
      const productDir = path.join(UPLOADS_DIR, folderName);
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      let rawImages = data.products[index].images || [data.products[index].image];
      if (Array.isArray(payload.images)) {
        rawImages = payload.images.slice(0, 10);
      } else if (payload.image) {
        rawImages = [payload.image];
      }

      // Guardar cualquier imagen base64 dentro de la carpeta exclusiva del producto
      const updatedImages = rawImages.map((img, idx) => {
        if (typeof img === 'string' && img.startsWith('data:')) {
          return saveBase64Image(img, `foto_${String(idx + 1).padStart(2, '0')}.jpg`, folderName);
        }
        return img;
      });

      data.products[index] = {
        ...data.products[index],
        code: payload.code !== undefined ? String(payload.code).trim().toUpperCase() : (data.products[index].code || ''),
        name: prodName,
        category: payload.category !== undefined ? payload.category : data.products[index].category,
        price: payload.price !== undefined ? Number(payload.price) : data.products[index].price,
        originalPrice: payload.originalPrice !== undefined ? (payload.originalPrice ? Number(payload.originalPrice) : null) : data.products[index].originalPrice,
        image: updatedImages[0] || payload.image || data.products[index].image,
        images: updatedImages,
        stock: payload.stock !== undefined ? Number(payload.stock) : data.products[index].stock,
        featured: payload.featured !== undefined ? Boolean(payload.featured) : data.products[index].featured,
        description: payload.description !== undefined ? payload.description : data.products[index].description,
        folder: folderName,
        folderSource: folderName,
        updatedAt: new Date().toISOString()
      };

      // Actualizar producto.txt dentro de la carpeta
      writeProductTxt(productDir, data.products[index]);

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
  function saveBase64Image(data, filename, folderName = '') {
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

    let targetDir = UPLOADS_DIR;
    let publicUrl = `/uploads/${savedFilename}`;

    if (folderName && typeof folderName === 'string') {
      const cleanFolder = folderName.replace(/[<>:"/\\|?*]/g, '').trim();
      if (cleanFolder) {
        targetDir = path.join(UPLOADS_DIR, cleanFolder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        publicUrl = `/uploads/${encodeURIComponent(cleanFolder)}/${savedFilename}`;
      }
    }

    const filePath = path.join(targetDir, savedFilename);
    fs.writeFileSync(filePath, buffer);
    return publicUrl;
  }

  // POST /api/upload - Handle Single Image Upload
  if (pathname === '/api/upload' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const { filename, data, folder, productId } = payload;

      if (!data) {
        return sendJson(res, 400, { error: 'No se recibió imagen para guardar' });
      }

      let targetFolder = folder || '';
      if (!targetFolder && productId) {
        const store = readStoreData();
        const found = store.products.find(p => p.id === productId);
        if (found && found.folder) targetFolder = found.folder;
      }

      const publicUrl = saveBase64Image(data, filename, targetFolder);
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
      const { folder, productId } = payload;

      let targetFolder = folder || '';
      if (!targetFolder && productId) {
        const store = readStoreData();
        const found = store.products.find(p => p.id === productId);
        if (found && found.folder) targetFolder = found.folder;
      }

      if (items.length === 0) {
        return sendJson(res, 400, { error: 'No se recibieron imágenes' });
      }

      const savedUrls = items.map((item, idx) => {
        if (typeof item === 'string') {
          // If it's already an external URL or uploaded path, keep it
          if (item.startsWith('http') || item.startsWith('/uploads/')) return item;
          return saveBase64Image(item, `image_${idx}.jpg`, targetFolder);
        } else if (item && item.data) {
          return saveBase64Image(item.data, item.filename || `image_${idx}.jpg`, targetFolder);
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

  // POST /api/sync-google-sheets - Fetch live Google Sheets and sync all product data & txt files
  if (pathname === '/api/sync-google-sheets' && req.method === 'POST') {
    try {
      const gsheetUrl = 'https://docs.google.com/spreadsheets/d/1elmMKkIfhdNnoIqicXx8OfCO8fhOfBhN/gviz/tq?tqx=out:csv&gid=1345510566';
      
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
      
      // Parse CSV into rows accurately
      const rows = [];
      let row = [];
      let inQuotes = false;
      let field = '';
      for (let i = 0; i < rawCSV.length; i++) {
        const c = rawCSV[i];
        const next = rawCSV[i + 1];
        if (c === '"') {
          if (inQuotes && next === '"') { field += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          row.push(field.trim());
          field = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
          if (c === '\r' && next === '\n') i++;
          row.push(field.trim());
          if (row.length > 1 || row[0] !== '') rows.push(row);
          row = [];
          field = '';
        } else {
          field += c;
        }
      }
      if (field || row.length > 0) { row.push(field.trim()); rows.push(row); }

      // Map rows from Sheet
      const sheetItems = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const itemCode = (r[2] || '').trim().toUpperCase();
        const itemName = (r[3] || '').trim();
        const itemDesc = (r[4] || '').trim();
        const amazonLink = (r[5] || '').trim();
        const fbLink = (r[6] || '').trim();
        const itemPriceRaw = (r[10] || '').trim();
        const itemSoldRaw = (r[11] || '').trim();

        const cleanPrice = parseInt(itemPriceRaw.replace(/[^0-9]/g, ''), 10) || 0;

        if (itemCode || itemName) {
          sheetItems.push({
            code: itemCode,
            name: itemName,
            description: itemDesc,
            amazonLink: amazonLink.startsWith('http') ? amazonLink : '',
            fbLink: fbLink.startsWith('http') ? fbLink : '',
            price: cleanPrice,
            sold: itemSoldRaw === '1',
            normName: (itemName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
          });
        }
      }

      const data = readStoreData();
      let updatedCount = 0;
      let matchedCount = 0;
      let soldOutCount = 0;
      let txtUpdatedCount = 0;

      for (const prod of data.products) {
        let sheetMatch = null;

        // Match por código
        if (prod.code) {
          sheetMatch = sheetItems.find(s => s.code === prod.code.toUpperCase());
        }

        // Match por nombre si no se encontró por código
        if (!sheetMatch && prod.name) {
          const pNorm = (prod.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          sheetMatch = sheetItems.find(s => s.normName && (s.normName.includes(pNorm.substring(0, 20)) || pNorm.includes(s.normName.substring(0, 20))));
        }

        if (sheetMatch) {
          matchedCount++;
          let changed = false;

          if (sheetMatch.code && prod.code !== sheetMatch.code) {
            prod.code = sheetMatch.code;
            changed = true;
          }

          if (sheetMatch.price > 0 && prod.price !== sheetMatch.price) {
            prod.price = sheetMatch.price;
            changed = true;
          }

          if (sheetMatch.description && (!prod.description || prod.description.startsWith('Producto:'))) {
            prod.description = sheetMatch.description;
            changed = true;
          }

          if (sheetMatch.sold && prod.stock > 0) {
            prod.stock = 0;
            changed = true;
          }

          if (Number(prod.stock) <= 0) {
            soldOutCount++;
          }

          if (changed) {
            prod.updatedAt = new Date().toISOString();
            updatedCount++;
          }
        }

        // Asegurar que cada producto tenga su carpeta y archivo producto.txt actualizado
        const folderName = prod.folder || sanitizeFolderName(prod.name);
        prod.folder = folderName;
        const folderPath = path.join(UPLOADS_DIR, folderName);

        // Detectar imágenes locales de la carpeta
        if (fs.existsSync(folderPath)) {
          const files = fs.readdirSync(folderPath);
          const imgFiles = files
            .filter(f => /\.(jpe?g|png|webp|mp4)$/i.test(f))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

          if (imgFiles.length > 0) {
            const newUrls = imgFiles.map(f => `/uploads/${encodeURIComponent(folderName)}/${encodeURIComponent(f)}`);
            prod.images = newUrls;
            prod.image = newUrls[0];
          }

          writeProductTxt(folderPath, prod);
          txtUpdatedCount++;
        }
      }

      writeStoreData(data);

      return sendJson(res, 200, {
        success: true,
        updatedCount,
        matchedCount,
        soldOutCount,
        txtUpdatedCount,
        totalProducts: data.products.length,
        totalSheetItems: sheetItems.length
      });
    } catch (err) {
      console.error('Error syncing Google Sheet data:', err);
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
      // Never fallback to index.html for uploads or api routes or files with extensions
      if (!pathname.startsWith('/uploads/') && !pathname.startsWith('/api/') && !path.extname(pathname)) {
        const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(fallbackIndex)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          return fs.createReadStream(fallbackIndex).pipe(res);
        }
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
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
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
