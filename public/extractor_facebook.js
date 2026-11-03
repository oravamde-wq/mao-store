/**
 * =====================================================================
 * MAO STORE - EXTRACTOR AUTOMÁTICO PARA FACEBOOK MARKETPLACE
 * =====================================================================
 * Este script se ejecuta en la consola de tu navegador en:
 * https://www.facebook.com/marketplace/you/selling
 * 
 * Extrae:
 * 1. Título completo de cada publicación
 * 2. Precio real en pesos (COP)
 * 3. Descripción detallada
 * 4. Todas las fotografías en alta resolución
 * 
 * Y las envía a Mao Store (http://localhost:3000/api/facebook/import),
 * donde se guardan automáticamente en carpetas locales en uploads/
 * y se cargan al catálogo oficial.
 */

(async function () {
  // Evitar duplicados si ya está inyectado
  const existing = document.getElementById('mao-store-extractor-widget');
  if (existing) existing.remove();

  // 1. Crear el contenedor flotante visual en la página de Facebook
  const widget = document.createElement('div');
  widget.id = 'mao-store-extractor-widget';
  widget.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    max-height: 85vh;
    background: #0f172a;
    color: #f8fafc;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    z-index: 2147483647;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: maoSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes maoSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #mao-store-extractor-widget * { box-sizing: border-box; }
    #mao-store-extractor-widget ::-webkit-scrollbar { width: 6px; }
    #mao-store-extractor-widget ::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
    .mao-btn {
      width: 100%;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 14px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .mao-btn-primary {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }
    .mao-btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
    .mao-btn-success {
      background: #10b981;
      color: white;
    }
    .mao-btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      font-size: 12px;
      padding: 8px 12px;
    }
    .mao-btn-secondary:hover { background: #334155; color: white; }
  `;
  document.head.appendChild(styleTag);

  widget.innerHTML = `
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="background: white; border-radius: 10px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          🛍️
        </div>
        <div>
          <div style="font-weight: 800; font-size: 15px; letter-spacing: -0.3px;">MAO STORE</div>
          <div style="font-size: 11px; opacity: 0.85;">Extractor Oficial de Marketplace</div>
        </div>
      </div>
      <button id="mao-close-btn" style="background: rgba(255,255,255,0.15); border: none; color: white; border-radius: 8px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;">✕</button>
    </div>

    <div style="padding: 16px; display: flex; flex-direction: column; gap: 14px;">
      <div style="background: #1e293b; border-radius: 12px; padding: 12px; border: 1px solid #334155; font-size: 12px; line-height: 1.5; color: #94a3b8;">
        Este asistente extraerá todos los productos publicados en tu cuenta con sus <strong>títulos</strong>, <strong>precios reales</strong>, <strong>descripciones</strong> y <strong>carpetas de fotos</strong> para Mao Store.
      </div>

      <div id="mao-status-box" style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: #cbd5e1;">
        <span id="mao-status-text">Listo para escanear</span>
        <span id="mao-count-badge" style="background: #334155; color: #38bdf8; padding: 2px 8px; border-radius: 999px; font-size: 11px;">0 productos</span>
      </div>

      <!-- Barra de progreso -->
      <div style="width: 100%; height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; border: 1px solid #334155;">
        <div id="mao-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366f1, #10b981); transition: width 0.3s;"></div>
      </div>

      <!-- Registro en vivo -->
      <div id="mao-log-container" style="background: #020617; border-radius: 12px; padding: 10px; height: 130px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #64748b; border: 1px solid #1e293b; display: flex; flex-direction: column; gap: 4px;">
        <div>[Listo] Esperando inicio de escaneo...</div>
      </div>

      <!-- Botón Principal -->
      <button id="mao-start-btn" class="mao-btn mao-btn-primary">
        <span>🚀 Iniciar Extracción y Carga a Mao Store</span>
      </button>

      <!-- Botones de Acción Secundarios (Ocultos al inicio) -->
      <div id="mao-secondary-actions" style="display: none; gap: 8px;">
        <a href="http://localhost:3000" target="_blank" class="mao-btn mao-btn-success" style="flex: 1; text-decoration: none;">
          🌐 Ver en Mao Store
        </a>
        <button id="mao-copy-json-btn" class="mao-btn mao-btn-secondary" style="flex: 1;">
          📋 Copiar JSON
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  const startBtn = document.getElementById('mao-start-btn');
  const closeBtn = document.getElementById('mao-close-btn');
  const statusText = document.getElementById('mao-status-text');
  const countBadge = document.getElementById('mao-count-badge');
  const progressBar = document.getElementById('mao-progress-bar');
  const logContainer = document.getElementById('mao-log-container');
  const secondaryActions = document.getElementById('mao-secondary-actions');
  const copyJsonBtn = document.getElementById('mao-copy-json-btn');

  let extractedProducts = [];

  function addLog(msg, color = '#94a3b8') {
    const item = document.createElement('div');
    item.style.color = color;
    item.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContainer.appendChild(item);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  closeBtn.onclick = () => widget.remove();

  // Helper para decodificar texto con caracteres de escape Unicode
  function decodeUnicode(str) {
    if (!str) return '';
    try {
      return JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
    } catch (e) {
      return str
        .replace(/\\u0026/g, '&')
        .replace(/\\u003C/g, '<')
        .replace(/\\u003E/g, '>')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .replace(/\\"/g, '"');
    }
  }

  // Helper para normalizar el precio a número entero
  function parsePrice(raw) {
    if (typeof raw === 'number') return raw;
    if (!raw) return 0;
    let s = String(raw).replace(/COP|[\$\s]/gi, '').trim();
    if (s.includes('.') && !s.includes(',')) s = s.replace(/\./g, '');
    else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '');
    else if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  // 2. Proceso Principal de Extracción
  startBtn.onclick = async () => {
    startBtn.disabled = true;
    startBtn.style.opacity = '0.6';
    startBtn.textContent = '⏳ Escaneando publicaciones...';
    statusText.textContent = 'Desplazando página para cargar inventario...';
    addLog('Iniciando escaneo automático...', '#38bdf8');

    try {
      // Paso A: Auto-scroll suave para activar el renderizado de publicaciones de Facebook
      const scrollSteps = 4;
      for (let s = 1; s <= scrollSteps; s++) {
        window.scrollTo(0, document.body.scrollHeight * (s / scrollSteps));
        addLog(`Cargando sección ${s}/${scrollSteps}...`);
        await new Promise(r => setTimeout(r, 900));
      }
      window.scrollTo(0, 0);

      // Paso B: Encontrar todos los enlaces de publicaciones
      const itemLinks = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"], a[href*="/item/"]'));
      const itemsMap = new Map();

      for (const link of itemLinks) {
        const href = link.getAttribute('href') || '';
        const match = href.match(/\/marketplace\/item\/(\d+)/) || href.match(/\/item\/(\d+)/);
        if (match && match[1]) {
          const id = match[1];
          if (!itemsMap.has(id)) {
            // Intentar leer título y precio visible en la tarjeta
            const container = link.closest('div[role="article"]') || link.closest('div[tabindex="0"]') || link.parentElement?.parentElement || link;
            const fullCardText = container.innerText || '';
            const img = container.querySelector('img[src*="fbcdn"]')?.src || '';

            itemsMap.set(id, {
              id,
              cardText: fullCardText,
              initialImage: img,
              url: `/marketplace/item/${id}/`
            });
          }
        }
      }

      const itemsList = Array.from(itemsMap.values());
      const totalItems = itemsList.length;

      if (totalItems === 0) {
        addLog('⚠️ No se detectaron productos en esta vista.', '#f87171');
        addLog('Asegúrate de estar en https://www.facebook.com/marketplace/you/selling', '#facc15');
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.textContent = 'Reintentar Escaneo';
        return;
      }

      countBadge.textContent = `${totalItems} encontrados`;
      addLog(`¡Se detectaron ${totalItems} publicaciones! Extrayendo detalles completos...`, '#34d399');

      extractedProducts = [];

      // Paso C: Procesar cada producto con su ficha técnica detallada
      for (let i = 0; i < totalItems; i++) {
        const item = itemsList[i];
        const progressPct = Math.round(((i + 1) / totalItems) * 100);
        progressBar.style.width = `${progressPct}%`;
        statusText.textContent = `Procesando ${i + 1} de ${totalItems}...`;

        addLog(`[${i + 1}/${totalItems}] Obteniendo datos de ID ${item.id}...`);

        let title = '';
        let price = 0;
        let description = '';
        let images = [];
        let category = 'General';

        try {
          // Petición interna autenticada a la publicación
          const itemRes = await fetch(item.url);
          const html = await itemRes.text();

          // 1. Extraer con Schema JSON-LD si existe
          const ldMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
          if (ldMatches) {
            for (const m of ldMatches) {
              try {
                const cleanJson = m.replace(/<script[^>]*>|<\/script>/gi, '');
                const data = JSON.parse(cleanJson);
                if (data.name) title = decodeUnicode(data.name);
                if (data.description) description = decodeUnicode(data.description);
                if (data.offers && data.offers.price) price = parsePrice(data.offers.price);
                if (data.image) {
                  const imgs = Array.isArray(data.image) ? data.image : [data.image];
                  imgs.forEach(img => { if (img && typeof img === 'string') images.push(img); });
                }
              } catch (e) {}
            }
          }

          // 2. Extraer Título (Regex en Comet Relay Payload o Meta)
          if (!title) {
            const titleMatch = html.match(/"marketplace_listing_title":"([^"]+)"/) ||
                               html.match(/"listing_title":"([^"]+)"/) ||
                               html.match(/<meta property="og:title" content="([^"]+)"/i);
            if (titleMatch) title = decodeUnicode(titleMatch[1]);
          }

          // 3. Extraer Descripción
          if (!description) {
            const descMatch = html.match(/"redacted_description":\{"text":"([^"]+)"\}/) ||
                              html.match(/"listing_description":"([^"]+)"/) ||
                              html.match(/<meta property="og:description" content="([^"]+)"/i);
            if (descMatch) description = decodeUnicode(descMatch[1]);
          }

          // 4. Extraer Precio
          if (!price) {
            const priceMatch = html.match(/"formatted_amount":"([^"]+)"/) ||
                               html.match(/"listing_price":\{"formatted_amount":"([^"]+)"/) ||
                               html.match(/"amount":"(\d+)"/);
            if (priceMatch) price = parsePrice(priceMatch[1]);
          }

          // 5. Extraer Fotografías en Alta Resolución
          const cdnMatches = html.match(/https:\/\/[a-z0-9\.\-_]+fbcdn\.net\/[^\s"',\\]+/gi) || [];
          for (const rawUrl of cdnMatches) {
            const cleanUrl = rawUrl.replace(/\\/g, '');
            // Filtrar iconos miniatura y mantener fotos de catálogo
            if (
              !cleanUrl.includes('p50x50') &&
              !cleanUrl.includes('s100x100') &&
              !cleanUrl.includes('profile') &&
              !cleanUrl.includes('rsrc.php') &&
              (cleanUrl.includes('/v/') || cleanUrl.includes('_nc_cat'))
            ) {
              if (!images.includes(cleanUrl)) {
                images.push(cleanUrl);
              }
            }
          }
        } catch (fetchErr) {
          addLog(`Aviso al cargar detalle de ${item.id}, usando datos de tarjeta...`, '#f59e0b');
        }

        // Fallbacks desde la tarjeta visible si falta información
        if (!title) {
          const lines = item.cardText.split('\n').map(l => l.trim()).filter(Boolean);
          title = lines.find(l => l.length > 5 && !l.includes('$') && !l.includes('COP') && !l.includes('Activo') && !l.includes('Vendido')) || `Producto FB ${item.id}`;
        }
        if (!price) {
          const priceLine = item.cardText.match(/\$\s*[\d\.,]+/);
          if (priceLine) price = parsePrice(priceLine[0]);
        }
        if (images.length === 0 && item.initialImage) {
          images.push(item.initialImage);
        }

        const productObj = {
          id: 'prod-fb-' + item.id,
          title: title.trim(),
          price: price,
          description: description.trim(),
          category: category,
          images: images.slice(0, 10)
        };

        extractedProducts.push(productObj);
        addLog(`✓ Extraído: "${productObj.title.substring(0, 30)}..." ($${productObj.price.toLocaleString()}) con ${productObj.images.length} fotos`, '#a5b4fc');

        // Paso D: Sincronizar en tiempo real con el servidor local Mao Store
        try {
          const syncRes = await fetch('http://localhost:3000/api/facebook/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: [productObj] })
          });
          if (syncRes.ok) {
            addLog(`📁 Guardado en carpeta local uploads/${productObj.title.substring(0, 25)}/`, '#34d399');
          }
        } catch (netErr) {
          // Si el servidor local no está encendido, guardamos en memoria para descarga
          addLog(`(Nota: Servidor Mao Store no respondió en localhost:3000, los datos se conservan en memoria)`, '#f59e0b');
        }

        // Breve pausa para no saturar
        await new Promise(r => setTimeout(r, 300));
      }

      // Finalización
      progressBar.style.width = '100%';
      statusText.textContent = '¡Completado con éxito!';
      startBtn.style.display = 'none';
      secondaryActions.style.display = 'flex';

      addLog(`🎉 ¡ÉXITO! Se extrajeron y cargaron ${extractedProducts.length} productos a Mao Store.`, '#10b981');

      // Botón copiar JSON
      copyJsonBtn.onclick = () => {
        navigator.clipboard.writeText(JSON.stringify({ products: extractedProducts }, null, 2));
        copyJsonBtn.textContent = '✓ ¡Copiado!';
        setTimeout(() => copyJsonBtn.textContent = '📋 Copiar JSON', 2000);
      };

    } catch (err) {
      addLog(`❌ Error durante la extracción: ${err.message}`, '#f87171');
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      startBtn.textContent = 'Reintentar';
    }
  };
})();
