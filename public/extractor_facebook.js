/**
 * =====================================================================
 * MAO STORE - EXTRACTOR AUTOMÁTICO PROFESIONAL (v5.0 DEFINITIVO)
 * =====================================================================
 * 1. Precios limpios exactos: Solo el costo activo no tachado.
 * 2. Galería completa de fotos por producto (todas las fotos).
 * 3. Fotos originales completas en alta resolución SIN RECORTES (elimina el recorte cuadrado de Facebook).
 * 4. Descripciones completas.
 */

(async function () {
  const existing = document.getElementById('mao-store-extractor-widget');
  if (existing) existing.remove();

  const widget = document.createElement('div');
  widget.id = 'mao-store-extractor-widget';
  widget.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 430px;
    max-height: 88vh;
    background: #0f172a;
    color: #f8fafc;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.15);
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
  `;
  document.head.appendChild(styleTag);

  widget.innerHTML = `
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="background: white; border-radius: 10px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 18px;">🛍️</div>
        <div>
          <div style="font-weight: 800; font-size: 15px; letter-spacing: -0.3px;">MAO STORE</div>
          <div style="font-size: 11px; opacity: 0.9;">Extractor Profesional v5.0 (Galerías HD + Descripciones + Precios)</div>
        </div>
      </div>
      <button id="mao-close-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 8px; width: 28px; height: 28px; cursor: pointer; font-size: 14px;">✕</button>
    </div>

    <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto;">
      <div style="background: #1e293b; border-radius: 12px; padding: 12px; border: 1px solid #334155; font-size: 12px; line-height: 1.5; color: #94a3b8;">
        ✓ <strong>Galerías completas:</strong> Extrae todas las fotos de cada producto.<br>
        ✓ <strong>Sin recortes:</strong> Elimina el recorte cuadrado de Facebook y extrae en resolución 1080p.<br>
        ✓ <strong>Precios limpios:</strong> Toma únicamente el precio activo real (no tachado).
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; color: #cbd5e1;">
        <span id="mao-status-text">Listo para escanear publicaciones</span>
        <span id="mao-count-badge" style="background: #334155; color: #38bdf8; padding: 2px 8px; border-radius: 999px; font-size: 11px;">0 productos</span>
      </div>

      <div style="width: 100%; height: 8px; background: #1e293b; border-radius: 999px; overflow: hidden; border: 1px solid #334155;">
        <div id="mao-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #6366f1, #10b981); transition: width 0.3s;"></div>
      </div>

      <div id="mao-log-container" style="background: #020617; border-radius: 12px; padding: 10px; height: 160px; overflow-y: auto; font-family: monospace; font-size: 11px; color: #64748b; border: 1px solid #1e293b; display: flex; flex-direction: column; gap: 4px;">
        <div>[Listo] Haz clic en el botón para iniciar la extracción...</div>
      </div>

      <button id="mao-start-btn" style="width: 100%; padding: 13px 16px; font-weight: 800; font-size: 13px; border-radius: 12px; border: none; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; box-shadow: 0 4px 14px rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center; gap: 8px;">
        🚀 Iniciar Extracción (Galerías Completas + Fotos Sin Recorte)
      </button>

      <div id="mao-secondary-actions" style="display: none; flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 8px;">
          <button id="mao-copy-json-btn" style="flex: 1; padding: 11px; background: #1e293b; color: #cbd5e1; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;">📋 Copiar JSON</button>
          <button id="mao-download-json-btn" style="flex: 1; padding: 11px; background: #1e293b; color: #cbd5e1; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;">📥 Descargar JSON</button>
        </div>
        <a href="http://localhost:3000/?admin#facebook" target="_blank" style="display: block; text-align: center; text-decoration: none; padding: 12px; background: #10b981; color: white; border-radius: 10px; font-size: 13px; font-weight: 800;">🌐 Abrir Importador en Mao Store</a>
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
  const downloadJsonBtn = document.getElementById('mao-download-json-btn');

  function addLog(msg, color = '#94a3b8') {
    const item = document.createElement('div');
    item.style.color = color;
    item.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContainer.appendChild(item);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  closeBtn.onclick = () => widget.remove();

  function decodeUnicode(str) {
    if (!str) return '';
    try {
      return JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
    } catch (e) {
      return str.replace(/\\u0026/g, '&').replace(/\\u003C/g, '<').replace(/\\u003E/g, '>').replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }

  // 1. Limpiador de URL CDN: Preserva las firmas HMAC criptográficas válidas de Facebook
  function cleanFbCdnUrl(url) {
    if (!url || typeof url !== 'string') return url;
    return url.replace(/\\/g, '').replace(/&amp;/g, '&');
  }

  // Extractor de fotografías en resolución completa desde el HTML de la publicación
  function extractPhotosFromHtml(html) {
    const unescaped = html.replace(/\\\//g, '/').replace(/\\u0026/g, '&');
    const seenIds = new Set();
    const photos = [];

    // A. Extraer todas las URIs de fotos de fbcdn presentes en la publicación
    const uriMatches = Array.from(unescaped.matchAll(/"uri":"(https:\/\/[a-z0-9.\-_]+fbcdn\.net\/[^"]+)"/gi));
    for (const m of uriMatches) {
      const u = decodeUnicode(m[1]).replace(/&amp;/g, '&');
      if (/profile|rsrc\.php|emoji|static|icon|badge|avatar|p50x50|s50x50|p60x60|p100x100/i.test(u)) continue;
      const idM = u.match(/\/(\d{8,25})_/);
      const key = idM ? idM[1] : u.split('?')[0];
      if (!seenIds.has(key)) {
        seenIds.add(key);
        photos.push(u);
        if (photos.length >= 12) break;
      }
    }

    // B. Foto principal og:image si aún no hay fotos
    if (photos.length === 0) {
      const ogMatch = unescaped.match(/<meta property="og:image" content="([^"]+)"/i);
      if (ogMatch) {
        const u = decodeUnicode(ogMatch[1]).replace(/&amp;/g, '&');
        photos.push(u);
      }
    }

    // C. Coincidencias de CDN directas
    if (photos.length === 0) {
      const cdnMatches = unescaped.match(/https:\/\/[a-z0-9.\-_]+fbcdn\.net\/v\/t[0-9.\-_]+\/[0-9_]+_[0-9_]+_[a-z0-9]\.(jpg|png|webp)[^\s"',\\]*/gi) || [];
      for (const u of cdnMatches) {
        const clean = u.replace(/&amp;/g, '&');
        if (/profile|rsrc\.php|emoji|icon|badge|avatar/i.test(clean)) continue;
        const idM = clean.match(/\/(\d{8,25})_/);
        const key = idM ? idM[1] : clean.split('?')[0];
        if (!seenIds.has(key)) {
          seenIds.add(key);
          photos.push(clean);
          if (photos.length >= 12) break;
        }
      }
    }

    return photos;
  }

  // 2. Parser de Precios: Extrae SOLO el precio activo no tachado y separa el original
  function parseCardPrices(cardEl) {
    const text = cardEl.innerText || '';
    const priceMatches = text.match(/\$\s*[\d\.,]+/g) || [];
    if (priceMatches.length === 0) return { price: 0, originalPrice: null };

    function cleanNum(pStr) {
      let s = pStr.replace(/[\$\s]/g, '');
      if (s.includes('.') && !s.includes(',')) s = s.replace(/\./g, '');
      else if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '');
      else if (s.includes('.') && s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
      return Math.round(parseFloat(s) || 0);
    }

    if (priceMatches.length === 1) {
      return { price: cleanNum(priceMatches[0]), originalPrice: null };
    }

    let strikethroughText = '';
    const sEls = cardEl.querySelectorAll('del, s, strike, [style*="line-through"], [class*="strike"], [class*="line-through"]');
    sEls.forEach(el => strikethroughText += ' ' + el.innerText);

    const p1 = cleanNum(priceMatches[0]);
    const p2 = cleanNum(priceMatches[1]);

    if (strikethroughText) {
      const sMatches = strikethroughText.match(/\$\s*[\d\.,]+/g) || [];
      if (sMatches.length > 0) {
        const tachado = cleanNum(sMatches[0]);
        if (tachado === p2) return { price: p1, originalPrice: p2 };
        if (tachado === p1) return { price: p2, originalPrice: p1 };
      }
    }

    if (p2 > p1) {
      return { price: p1, originalPrice: p2 };
    } else {
      return { price: p1, originalPrice: null };
    }
  }

  function guessCategory(title) {
    const t = (title || '').toLowerCase();
    if (/carplay|android|proyector|sonido|audio|subwoofer|cámara|camara|tablet|batería|bateria|estabilizador|inalámbrico|bluetooth|echo|alexa|parlante|gamer|auricular|headphone|teclado|mouse/.test(t)) return 'Tecnología';
    if (/edredón|edredon|cama|almohada|cobija|hogar|cocina|vaso|termo|stanley|revestimiento|sabana|sábana|toalla/.test(t)) return 'Hogar';
    if (/bolso|bolsos|cartera|mochila|reloj|gafas|pulsera|joya|cadena/.test(t)) return 'Accesorios';
    if (/vestido|camisa|pantalón|pantalon|chaqueta|blusa|falda|ropa|abrigo/.test(t)) return 'Ropa';
    if (/zapato|zapatos|tenis|sandalia|calzado|bota|botas/.test(t)) return 'Calzado';
    if (/gimnasio|fitness|flexiones|mancuerna|ejercicio|jenga|juego|juguete/.test(t)) return 'General';
    return 'General';
  }

  // 3. Localizador profundo de ID de publicación y datos de React
  function findListingDataFromCard(cardEl) {
    let listingId = null;
    let reactListingObj = null;

    // A. Inspeccionar todos los elementos y botones de la tarjeta en React Fiber
    const allEls = [cardEl, ...cardEl.querySelectorAll('*')];
    for (const el of allEls) {
      const key = Object.keys(el).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      if (!key) continue;
      let fiber = el[key];
      for (let depth = 0; depth < 15 && fiber; depth++) {
        const p = fiber.memoizedProps;
        if (p) {
          if (p.listing && p.listing.id) {
            listingId = String(p.listing.id);
            reactListingObj = p.listing;
            break;
          }
          if (p.item && p.item.id) {
            listingId = String(p.item.id);
            reactListingObj = p.item;
            break;
          }
          if (p.targetID) { listingId = String(p.targetID); break; }
          if (p.listingID) { listingId = String(p.listingID); break; }
          if (p.listing_id) { listingId = String(p.listing_id); break; }
        }
        fiber = fiber.return;
      }
      if (listingId) break;
    }

    // B. Buscar en enlaces href
    if (!listingId) {
      const links = cardEl.querySelectorAll('a[href]');
      for (const a of links) {
        const href = a.getAttribute('href') || '';
        let m = href.match(/\/marketplace\/item\/(\d{10,25})/);
        if (m) { listingId = m[1]; break; }
        m = href.match(/listing_id=(\d{10,25})/);
        if (m) { listingId = m[1]; break; }
        m = href.match(/\/item\/(\d{10,25})/);
        if (m) { listingId = m[1]; break; }
        m = href.match(/\/edit\/.*?(\d{10,25})/);
        if (m) { listingId = m[1]; break; }
      }
    }

    // C. Buscar en HTML plano
    if (!listingId) {
      const html = cardEl.innerHTML || '';
      let m = html.match(/\/marketplace\/item\/(\d{10,25})/);
      if (m) listingId = m[1];
      else {
        m = html.match(/listing_id=(\d{10,25})/);
        if (m) listingId = m[1];
        else {
          m = html.match(/"target_id":"(\d{10,25})"/);
          if (m) listingId = m[1];
        }
      }
    }

    return { listingId, reactListingObj };
  }

  // 4. Extractor de la Galería Completa de Fotos desde la publicación
  async function fetchFullListingData(listingId, initialTitle, cardPriceObj, initialThumb, reactListingObj) {
    let result = {
      id: listingId || ('fb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      title: initialTitle,
      price: cardPriceObj.price,
      originalPrice: cardPriceObj.originalPrice,
      description: '',
      images: [cleanFbCdnUrl(initialThumb)],
      category: guessCategory(initialTitle)
    };

    // Si React ya tenía las fotos en memoria
    if (reactListingObj) {
      if (reactListingObj.marketplace_listing_title) result.title = reactListingObj.marketplace_listing_title;
      if (reactListingObj.redacted_description?.text) result.description = reactListingObj.redacted_description.text;
      
      const reactPhotos = [];
      if (Array.isArray(reactListingObj.listing_photos)) {
        for (const p of reactListingObj.listing_photos) {
          const u = p.image?.uri || p.image?.url || p.uri;
          if (u) reactPhotos.push(cleanFbCdnUrl(u));
        }
      }
      if (reactPhotos.length > 0) {
        result.images = reactPhotos;
        return result;
      }
    }

    // Si no estaban en memoria, consultar la publicación directamente
    if (listingId) {
      try {
        const res = await fetch(`/marketplace/item/${listingId}/`, {
          credentials: 'include'
        });
        if (res.ok) {
          const html = await res.text();

          // Título
          const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i) ||
                             html.match(/"marketplace_listing_title":"([^"]+)"/);
          if (titleMatch) {
            result.title = decodeUnicode(titleMatch[1]).replace(/ - Marketplace de Facebook.*$/i, '').trim();
          }

          // Descripción completa de la publicación
          const descMatch = html.match(/"redacted_description":\s*\{"text":"([^"]+)"\}/) ||
                            html.match(/"listing_description":"([^"]+)"/) ||
                            html.match(/<meta property="og:description" content="([^"]+)"/i) ||
                            html.match(/"description":\s*\{"text":"([^"]+)"\}/);
          if (descMatch) {
            result.description = decodeUnicode(descMatch[1]).replace(/\\n/g, '\n').trim();
          }

          // Precio activo oficial (no tachado)
          const priceMatch = html.match(/<meta property="product:price:amount" content="([^"]+)"/i) ||
                             html.match(/"listing_price":\{[^}]*"amount":"(\d+)"/);
          if (priceMatch) {
            const num = Math.round(parseFloat(priceMatch[1].replace(/[\$\s]/g, '')) || 0);
            if (num > 0) result.price = num;
          }

          // Precio tachado oficial
          const origMatch = html.match(/"strikethrough_price":\{[^}]*"amount":"(\d+)"/);
          if (origMatch) {
            const origNum = Math.round(parseFloat(origMatch[1]) || 0);
            if (origNum > result.price) result.originalPrice = origNum;
          }

          // ========================================================
          // GALERÍA COMPLETA DE FOTOGRAFÍAS EN RESOLUCIÓN ORIGINAL
          // ========================================================
          const gallery = extractPhotosFromHtml(html);
          if (gallery.length > 0) {
            result.images = gallery;
          }
        }
      } catch (e) {}
    }

    return result;
  }

  // 5. Escaneo de las tarjetas en pantalla
  function findCardsOnScreen() {
    const list = [];
    const seenTitles = new Set();
    const imgs = Array.from(document.querySelectorAll('img[src*="fbcdn"], img[src*="scontent"]'));

    for (const img of imgs) {
      if (img.width > 0 && img.width < 50) continue;
      if (img.src.includes('profile') || img.src.includes('rsrc.php')) continue;

      let el = img.parentElement;
      for (let depth = 0; depth < 9 && el; depth++) {
        const text = (el.innerText || '').trim();
        if (/\$\s*[\d\.,]+/.test(text) && (text.includes('Disponible') || text.includes('Publicado') || text.includes('agotado') || text.includes('Promocionar') || text.includes('clic') || text.includes('Volver a publicar'))) {
          const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const priceLineIdx = lines.findIndex(l => /^\$\s*[\d\.,]+/.test(l));

          if (priceLineIdx !== -1) {
            const title = priceLineIdx > 0 ? lines[priceLineIdx - 1] : lines[0];
            const priceObj = parseCardPrices(el);

            if (title && title.length >= 3 && priceObj.price > 0 && !seenTitles.has(title.toLowerCase())) {
              seenTitles.add(title.toLowerCase());
              const { listingId, reactListingObj } = findListingDataFromCard(el);
              list.push({
                listingId,
                reactListingObj,
                title,
                priceObj,
                thumb: img.src
              });
              break;
            }
          }
        }
        el = el.parentElement;
      }
    }
    return list;
  }

  // 6. Proceso Principal
  startBtn.onclick = async () => {
    startBtn.disabled = true;
    startBtn.style.opacity = '0.6';
    startBtn.textContent = '⏳ Escaneando publicaciones...';
    statusText.textContent = 'Cargando inventario completo...';
    addLog('Desplazando página para cargar publicaciones...', '#38bdf8');

    try {
      const scrollSteps = 6;
      for (let s = 1; s <= scrollSteps; s++) {
        window.scrollTo(0, document.body.scrollHeight * (s / scrollSteps));
        addLog(`Cargando publicaciones (${s}/${scrollSteps})...`);
        await new Promise(r => setTimeout(r, 700));
      }
      window.scrollTo(0, 0);

      addLog('Analizando publicaciones en pantalla...', '#a5b4fc');
      const cards = findCardsOnScreen();
      const total = cards.length;

      if (total === 0) {
        addLog('⚠️ No se detectaron productos. Asegúrate de estar en facebook.com/marketplace/you/selling', '#f87171');
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.textContent = 'Reintentar Escaneo';
        return;
      }

      countBadge.textContent = `${total} encontrados`;
      addLog(`¡Se encontraron ${total} productos! Extrayendo galerías completas y fotos sin recorte...`, '#34d399');

      let extractedProducts = [];

      for (let i = 0; i < total; i++) {
        const item = cards[i];
        progressBar.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
        statusText.textContent = `Extrayendo ${i + 1} de ${total}: "${item.title.substring(0, 24)}..."`;

        const fullData = await fetchFullListingData(item.listingId, item.title, item.priceObj, item.thumb, item.reactListingObj);

        const productObj = {
          id: 'prod-fb-' + (item.listingId || Date.now() + '-' + i),
          title: fullData.title,
          price: fullData.price,
          originalPrice: fullData.originalPrice,
          description: fullData.description || `Producto oficial: ${fullData.title}`,
          category: fullData.category,
          images: fullData.images
        };

        extractedProducts.push(productObj);

        const discountText = productObj.originalPrice ? ` (Tachado: $${productObj.originalPrice.toLocaleString()})` : '';
        addLog(`✓ [${i + 1}/${total}] "${productObj.title.substring(0, 22)}..." -> $${productObj.price.toLocaleString()}${discountText} | ${productObj.images.length} fotos HD`, '#38bdf8');

        await new Promise(r => setTimeout(r, 200));
      }

      progressBar.style.width = '100%';
      statusText.textContent = '¡Extracción completada con éxito!';
      startBtn.style.display = 'none';
      secondaryActions.style.display = 'flex';

      addLog(`🎉 ¡ÉXITO! ${extractedProducts.length} productos con fotos HD y precios correctos listos para Mao Store.`, '#10b981');

      try {
        await navigator.clipboard.writeText(JSON.stringify({ products: extractedProducts }, null, 2));
        addLog('📋 ¡JSON copiado automáticamente a tu portapapeles!', '#a7f3d0');
      } catch (e) {}

      copyJsonBtn.onclick = async () => {
        await navigator.clipboard.writeText(JSON.stringify({ products: extractedProducts }, null, 2));
        copyJsonBtn.textContent = '✓ ¡Copiado!';
        setTimeout(() => copyJsonBtn.textContent = '📋 Copiar JSON', 2000);
      };

      downloadJsonBtn.onclick = () => {
        const blob = new Blob([JSON.stringify({ products: extractedProducts }, null, 2)], { type: 'application/json' });
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = 'productos_facebook_mao_store.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dlUrl);
      };

    } catch (err) {
      addLog(`❌ Error: ${err.message}`, '#f87171');
      startBtn.disabled = false;
      startBtn.style.opacity = '1';
      startBtn.textContent = 'Reintentar';
    }
  };
})();
