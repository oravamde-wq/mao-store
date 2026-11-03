/**
 * MAO STORE - Main Frontend Application Logic
 */

// Application State
const state = {
  isAdmin: false, // Protected Creator Mode
  settings: {
    storeName: "MAO STORE",
    storeSlogan: "Tu estilo, tu tecnología, tu tienda oficial",
    currencySymbol: "$",
    currencyCode: "COP",
    whatsappNumber: "573001234567",
    adminPin: "1234"
  },
  categories: [],
  products: [],
  cart: [],
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'recent',
  catalogViewMode: localStorage.getItem('mao_catalog_view_mode') || 'grid-auto', // 'list', 'grid-1', 'grid-2', 'grid-auto'
  isServerConnected: false,
  currentView: 'store', // 'store' or 'admin'
  currentAdminTab: 'products',
  selectedImages: [], // Array of up to 10 photos: { data: string, filename: string, isUrl: boolean }
  activeDetailImages: [],
  activeDetailIndex: 0,
  editingProductId: null
};

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('mao_admin_token') || '';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
    ...extra
  };
}

function getAuthUploadHeaders(extra = {}) {
  const token = localStorage.getItem('mao_admin_token') || '';
  return {
    'x-admin-token': token,
    ...extra
  };
}

// Storage Keys for Offline/Fallback Mode
const LOCAL_STORAGE_KEY = 'mao_store_local_data';
const LOCAL_CART_KEY = 'mao_store_cart';

// Default Seed Data (used when offline and localStorage is empty)
const SEED_DATA = {
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
  products: [
    {
      id: "prod-1",
      name: "Zapatillas Deportivas Urban Pro",
      category: "Calzado",
      price: 189900,
      originalPrice: 229900,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      stock: 12,
      featured: true,
      description: "Zapatillas deportivas con amortiguación de aire reactiva, suela de alta tracción y tejido ultra transpirable. Ideales para running, entrenamiento diario o estilo urbano.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-2",
      name: "Chaqueta Cortavientos MAO Sport",
      category: "Ropa",
      price: 145000,
      originalPrice: 175000,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80",
      stock: 8,
      featured: true,
      description: "Chaqueta impermeable ligera con capucha ajustable y bolsillos con cremallera termosellada. Diseño moderno y versátil para cualquier clima.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-3",
      name: "Auriculares Inalámbricos Noise-Cancel ANC",
      category: "Tecnología",
      price: 129000,
      originalPrice: 159000,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      stock: 15,
      featured: true,
      description: "Sonido envolvente con graves profundos y cancelación activa de ruido (ANC). Batería de hasta 35 horas de reproducción continua con carga rápida USB-C.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-4",
      name: "Smartwatch Serie 9 Fitness Tracker",
      category: "Tecnología",
      price: 210000,
      originalPrice: 260000,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      stock: 9,
      featured: false,
      description: "Pantalla AMOLED HD táctil de 1.9 pulgadas. Monitor cardíaco, oxímetro, GPS integrado, resistencia al agua IP68 y más de 50 modos deportivos.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-5",
      name: "Camiseta Oversize Premium Heavy Cotton",
      category: "Ropa",
      price: 49900,
      originalPrice: null,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      stock: 25,
      featured: false,
      description: "Camiseta confeccionada en 100% algodón peinado de 240g de gramaje. Corte oversize holgado y cuello acanalado de alta durabilidad.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-6",
      name: "Gafas de Sol Polarizadas Aviator Dark",
      category: "Accesorios",
      price: 69000,
      originalPrice: 85000,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80",
      stock: 14,
      featured: false,
      description: "Lentes polarizados con protección UV400 completa. Marco metálico ultraligero con almohadillas nasales de silicona antideslizante. Incluye estuche rígido.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-7",
      name: "Mochila Antirrobo Urbana Impermeable",
      category: "Accesorios",
      price: 98000,
      originalPrice: 120000,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
      stock: 10,
      featured: true,
      description: "Compartimento acolchado para laptop de hasta 15.6 pulgadas. Puerto de carga USB externo, cremalleras ocultas antirrobo y material impermeable resistente a rasgaduras.",
      createdAt: new Date().toISOString()
    },
    {
      id: "prod-8",
      name: "Tenis Casual Minimalist White",
      category: "Calzado",
      price: 155000,
      originalPrice: null,
      image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
      stock: 6,
      featured: false,
      description: "Tenis minimalistas en cuero sintético de alta resistencia con suela de caucho vulcanizado cosida. Máxima comodidad para uso diario.",
      createdAt: new Date().toISOString()
    }
  ]
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  loadSavedCart();
  await checkAdminAuth();
  await initStoreData();
  renderApp();
  updateViewModeButtons();
  updateAdminUIState();
  initImageZoomLoupe();
  lucide.createIcons();

  // Soporte de enlace directo para modo desarrolladora/administradora
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('admin') || window.location.hash === '#admin') {
    if (state.isAdmin) {
      switchView('admin');
    } else {
      promptAdminLogin();
    }
  }
});

async function checkAdminAuth() {
  const savedToken = localStorage.getItem('mao_admin_token');
  if (savedToken && window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'x-admin-token': savedToken }
      });
      const data = await res.json();
      if (data && data.authenticated) {
        state.isAdmin = true;
      } else {
        localStorage.removeItem('mao_admin_token');
        state.isAdmin = false;
      }
    } catch (e) {
      console.warn('Could not verify admin token', e);
    }
  } else {
    state.isAdmin = false;
  }
}

// Load Store Data from Backend or LocalStorage
async function initStoreData() {
  try {
    // Check if we are running from http/https server
    if (window.location.protocol.startsWith('http')) {
      const res = await fetch('/api/store', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        state.settings = data.settings || state.settings;
        state.categories = data.categories || [];
        state.products = data.products || [];
        state.isServerConnected = true;
        if (data.isCreator) state.isAdmin = true;
        updateStatusBadge(true);
        return;
      }
    }
  } catch (err) {
    console.warn('Backend server not reachable, falling back to LocalStorage mode.', err);
  }

  // Fallback to LocalStorage
  state.isServerConnected = false;
  updateStatusBadge(false);
  const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      state.settings = parsed.settings || SEED_DATA.settings;
      state.categories = parsed.categories || SEED_DATA.categories;
      state.products = parsed.products || SEED_DATA.products;
    } catch (e) {
      state.settings = SEED_DATA.settings;
      state.categories = SEED_DATA.categories;
      state.products = SEED_DATA.products;
      saveLocalData();
    }
  } else {
    state.settings = SEED_DATA.settings;
    state.categories = SEED_DATA.categories;
    state.products = SEED_DATA.products;
    saveLocalData();
  }
}

function updateStatusBadge(isOnline) {
  const badge = document.getElementById('backendStatusBadge');
  if (!badge) return;
  if (isOnline) {
    badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800';
    badge.innerHTML = '● Servidor Conectado';
  } else {
    badge.className = 'px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800';
    badge.innerHTML = '● Modo Local (Navegador)';
  }
}

function saveLocalData() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
    settings: state.settings,
    categories: state.categories,
    products: state.products
  }));
}

function updateAdminUIState() {
  const creatorNav = document.getElementById('creatorControlsNav');
  const heroUploadBtn = document.getElementById('heroCreatorUploadBtn');
  const manageCatsBtn = document.getElementById('storeManageCategoriesBtn');
  const syncFoldersBtn = document.getElementById('storeSyncFoldersBtn');
  const newProductBtn = document.getElementById('storeNewProductBtn');
  const footerAdminLinkText = document.getElementById('footerAdminLinkText');

  if (state.isAdmin) {
    if (creatorNav) {
      creatorNav.classList.remove('hidden');
      creatorNav.classList.add('flex');
    }
    if (heroUploadBtn) heroUploadBtn.classList.remove('hidden');
    if (manageCatsBtn) {
      manageCatsBtn.classList.remove('hidden');
      manageCatsBtn.classList.add('inline-flex');
    }
    if (syncFoldersBtn) {
      syncFoldersBtn.classList.remove('hidden');
      syncFoldersBtn.classList.add('inline-flex');
    }
    if (newProductBtn) {
      newProductBtn.classList.remove('hidden');
      newProductBtn.classList.add('inline-flex');
    }
    if (footerAdminLinkText) footerAdminLinkText.innerText = 'Panel Creador (Activo)';
  } else {
    if (creatorNav) {
      creatorNav.classList.add('hidden');
      creatorNav.classList.remove('flex');
    }
    if (heroUploadBtn) heroUploadBtn.classList.add('hidden');
    if (manageCatsBtn) {
      manageCatsBtn.classList.add('hidden');
      manageCatsBtn.classList.remove('inline-flex');
    }
    if (syncFoldersBtn) {
      syncFoldersBtn.classList.add('hidden');
      syncFoldersBtn.classList.remove('inline-flex');
    }
    if (newProductBtn) {
      newProductBtn.classList.add('hidden');
      newProductBtn.classList.remove('inline-flex');
    }
    if (footerAdminLinkText) footerAdminLinkText.innerText = 'Acceso Creador';
  }
}

// ==========================================
// RENDER VIEWS
// ==========================================
function renderApp() {
  // Update Store Name & Logo
  const navStoreName = document.getElementById('navStoreName');
  if (navStoreName) {
    navStoreName.innerHTML = `<span>${state.settings.storeName || 'MAO STORE'}</span>`;
  }
  
  const navCustomLogo = document.getElementById('navCustomLogo');
  const navDefaultIcon = document.getElementById('navDefaultIcon');
  if (navCustomLogo && navDefaultIcon) {
    if (state.settings.logoUrl) {
      navCustomLogo.src = state.settings.logoUrl;
      navCustomLogo.classList.remove('hidden');
      navDefaultIcon.classList.add('hidden');
    } else {
      navCustomLogo.classList.add('hidden');
      navDefaultIcon.classList.remove('hidden');
    }
  }

  // Update Hero Banner (Franja Superior detrás de Bienvenido)
  const heroSection = document.getElementById('heroBannerSection');
  const heroTitle = document.getElementById('heroTitle');
  const heroSlogan = document.getElementById('heroSlogan');
  const heroBadge = document.getElementById('heroBadge');

  if (heroTitle) {
    heroTitle.innerHTML = state.settings.bannerTitle 
      ? state.settings.bannerTitle 
      : `Bienvenido a <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-indigo-200 to-white">${state.settings.storeName || 'MAO STORE'}</span>`;
  }
  if (heroSlogan) {
    heroSlogan.innerText = state.settings.bannerText || state.settings.storeSlogan || 'Explora nuestra selección exclusiva de productos de la mejor calidad. Filtra por categorías, sube nuevos artículos y haz tus pedidos al instante.';
  }
  if (heroBadge) {
    heroBadge.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5"></i> ${state.settings.bannerBadge || 'Catálogo Completo 2026'}`;
  }
  // Update Hero Banner Background (Video or Image)
  const heroVideo = document.getElementById('heroBgVideo');
  const heroVideoSource = document.getElementById('heroBgVideoSource');
  if (state.settings.bannerBgVideo && state.settings.bannerBgVideo.trim()) {
    const videoUrl = state.settings.bannerBgVideo.trim();
    if (heroVideo) {
      // Ensure all mobile autoplay requirements are programmatically set:
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.playsInline = true;
      heroVideo.loop = true;
      heroVideo.setAttribute('muted', '');
      heroVideo.setAttribute('playsinline', '');
      heroVideo.setAttribute('webkit-playsinline', '');

      // Set src directly on video element for 100% browser compatibility
      if (heroVideo.src !== videoUrl && !heroVideo.src.endsWith(videoUrl)) {
        heroVideo.src = videoUrl;
        if (heroVideoSource) heroVideoSource.src = videoUrl;
        heroVideo.load();
      }
      heroVideo.classList.remove('hidden');

      // Attempt immediate play
      const tryPlay = () => {
        heroVideo.play().catch(() => {
          // Retry on first user tap/scroll/touch
          const onFirstInteraction = () => {
            heroVideo.play().catch(() => {});
            document.removeEventListener('touchstart', onFirstInteraction);
            document.removeEventListener('click', onFirstInteraction);
            document.removeEventListener('scroll', onFirstInteraction);
          };
          document.addEventListener('touchstart', onFirstInteraction, { once: true, passive: true });
          document.addEventListener('click', onFirstInteraction, { once: true, passive: true });
          document.addEventListener('scroll', onFirstInteraction, { once: true, passive: true });
        });
      };
      tryPlay();

      // Fallback if video fails to load (e.g. file missing or 404)
      heroVideo.onerror = () => {
        console.warn('Hero video failed to load, falling back to background image.');
        heroVideo.classList.add('hidden');
        if (heroSection && state.settings.bannerBgImage) {
          heroSection.style.backgroundImage = `url('${state.settings.bannerBgImage}')`;
        }
      };
    }
    if (heroSection) heroSection.style.backgroundImage = '';
  } else {
    if (heroVideo) {
      heroVideo.pause();
      heroVideo.src = '';
      heroVideo.classList.add('hidden');
    }
    if (heroSection) {
      if (state.settings.bannerBgImage) {
        heroSection.style.backgroundImage = `url('${state.settings.bannerBgImage}')`;
      } else {
        heroSection.style.backgroundImage = '';
      }
    }
  }

  // Update Slogan in nav
  const navSlogan = document.getElementById('navSlogan');
  if (navSlogan) navSlogan.innerText = state.settings.storeSlogan || 'Tienda Oficial';
  
  // Render Categories
  renderCategoryChips();
  populateCategorySelects();
  
  // Render Products Grid in Store
  renderProductsGrid();

  // Render Admin Tables if active
  renderAdminProducts();
  renderAdminCategories();
  populateSettingsForm();

  // Update Cart Badge
  updateCartBadge();

  // Update Creator Visibility
  updateAdminUIState();

  // Refresh icons
  lucide.createIcons();
}

// Format Currency
function formatMoney(amount) {
  const sym = state.settings.currencySymbol || '$';
  if (!amount || Number(amount) <= 0) {
    return `${sym} 0 (Por definir)`;
  }
  return `${sym} ${Number(amount).toLocaleString('es-CO')}`;
}

// Trigger Manual Folder Sync from uploads/
async function triggerFolderSync() {
  if (!state.isAdmin) {
    promptAdminLogin();
    return;
  }

  if (!state.isServerConnected) {
    Swal.fire({
      icon: 'info',
      title: 'Modo Servidor Requerido',
      text: 'Asegúrate de tener el servidor iniciado con iniciar_tienda.bat para escanear las carpetas de tu PC.'
    });
    return;
  }

  Swal.fire({
    title: 'Sincronizando carpetas...',
    text: 'Escaneando carpetas de fotos en uploads para importar productos.',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const res = await fetch('/api/sync-folders', { 
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      state.products = data.products || state.products;
      state.categories = data.categories || state.categories;

      Swal.fire({
        icon: 'success',
        title: '¡Carpetas Sincronizadas!',
        html: `
          <div class="text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
            <div class="font-bold text-slate-800 text-sm mb-1">Resultados de la importación:</div>
            <div>✨ <b>${data.added}</b> nuevo(s) producto(s) agregados.</div>
            <div>🔄 <b>${data.updated}</b> producto(s) actualizados con fotos.</div>
            <div>📦 <b>${data.total}</b> productos totales listos en tu tienda.</div>
          </div>
          <p class="text-xs text-slate-500 mt-3">Puedes pulsar en "Editar Producto" sobre cualquiera de ellos para asignarle su precio final de venta.</p>
        `,
        confirmButtonText: 'Ver Productos'
      });

      renderApp();
    } else {
      Swal.fire('Error', data.error || 'No se pudieron sincronizar las carpetas.', 'error');
    }
  } catch (err) {
    console.error('Error in triggerFolderSync:', err);
    Swal.fire('Error', 'No se pudo conectar con el servidor local.', 'error');
  }
}

// ------------------------------------------
// CATEGORY CHIPS RENDERING
// ------------------------------------------
function renderCategoryChips() {
  const container = document.getElementById('categoryChipsContainer');
  if (!container) return;

  const totalCount = state.products.length;
  const isAllActive = state.currentCategory === 'all';

  let html = `
    <button 
      onclick="filterByCategory('all')"
      class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
        isAllActive 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
      }"
    >
      <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
      <span>Todas</span>
      <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isAllActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">
        ${totalCount}
      </span>
    </button>
  `;

  state.categories.forEach(cat => {
    const count = state.products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
    const isActive = state.currentCategory.toLowerCase() === cat.name.toLowerCase();

    html += `
      <button 
        onclick="filterByCategory('${cat.name}')"
        class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
          isActive 
            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20' 
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        }"
      >
        <i data-lucide="${cat.icon || 'tag'}" class="w-3.5 h-3.5"></i>
        <span>${cat.name}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}">
          ${count}
        </span>
      </button>
    `;
  });

  container.innerHTML = html;
  lucide.createIcons();
}

function filterByCategory(catName) {
  state.currentCategory = catName;
  const title = document.getElementById('activeCategoryTitle');
  if (title) {
    title.innerText = catName === 'all' ? 'Todos los Productos' : `Categoría: ${catName}`;
  }
  renderCategoryChips();
  renderProductsGrid();
}

function populateCategorySelects() {
  const select = document.getElementById('formProductCategory');
  if (!select) return;

  select.innerHTML = state.categories.map(cat => 
    `<option value="${cat.name}">${cat.name}</option>`
  ).join('');
}

// ------------------------------------------
// CATALOG VIEW SWITCHER (LIST / 1 COL / 2 COLS / 4 COLS)
// ------------------------------------------
function setCatalogViewMode(mode) {
  const validModes = ['list', 'grid-1', 'grid-2', 'grid-auto'];
  if (!validModes.includes(mode)) mode = 'grid-auto';
  state.catalogViewMode = mode;
  try {
    localStorage.setItem('mao_catalog_view_mode', mode);
  } catch (e) {}
  updateViewModeButtons();
  renderProductsGrid();
}

function updateViewModeButtons() {
  const currentMode = state.catalogViewMode || 'grid-auto';
  const modes = ['list', 'grid-1', 'grid-2', 'grid-auto'];
  modes.forEach(m => {
    const btn = document.getElementById(`viewBtn-${m}`);
    if (btn) {
      if (currentMode === m) {
        btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-white text-brand-600 shadow-sm border border-slate-200/90";
      } else {
        btn.className = "px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all text-slate-600 hover:text-slate-900 hover:bg-white/60";
      }
    }
  });

  const select = document.getElementById('catalogViewSelect');
  if (select && select.value !== currentMode) {
    select.value = currentMode;
  }
}

// ------------------------------------------
// PRODUCTS GRID (STOREFRONT)
// ------------------------------------------
function renderProductsGrid() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyState');
  const countText = document.getElementById('productsCountText');
  if (!grid) return;

  // Filter
  let filtered = state.products.filter(p => {
    const matchCategory = state.currentCategory === 'all' || 
      p.category.toLowerCase() === state.currentCategory.toLowerCase();
    
    const query = state.searchQuery.toLowerCase().trim();
    const matchSearch = !query || 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query)) ||
      p.category.toLowerCase().includes(query);

    return matchCategory && matchSearch;
  });

  // Sort
  if (state.sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // recent by default
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  // Count text
  countText.innerText = `Mostrando ${filtered.length} de ${state.products.length} productos`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Determinar clases del contenedor según el modo elegido
  const viewMode = state.catalogViewMode || 'grid-auto';
  if (viewMode === 'list') {
    grid.className = "flex flex-col gap-4 w-full";
  } else if (viewMode === 'grid-1') {
    grid.className = "grid grid-cols-1 max-w-xl mx-auto gap-6 w-full";
  } else if (viewMode === 'grid-2') {
    grid.className = "grid grid-cols-2 gap-3 sm:gap-6 w-full";
  } else {
    // grid-auto (estándar 3-4 columnas)
    grid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full";
  }

  grid.innerHTML = filtered.map(prod => {
    const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;
    const discountPercent = hasDiscount 
      ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) 
      : 0;

    const isOutOfStock = Number(prod.stock) <= 0;
    const displayImage = (prod.images && prod.images.length > 0) ? prod.images[0] : prod.image;
    const totalPhotos = (prod.images && prod.images.length > 0) ? prod.images.length : (prod.image ? 1 : 0);

    // ==========================================
    // MODO 1: LISTA DE DETALLES HORIZONTAL
    // ==========================================
    if (viewMode === 'list') {
      return `
        <div class="product-card group bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row overflow-hidden">
          
          <!-- Imagen & Badges -->
          <div class="relative w-full md:w-64 h-56 md:h-auto flex-shrink-0 bg-slate-100 overflow-hidden cursor-pointer" onclick="openProductDetail('${prod.id}')">
            <img 
              src="${displayImage}" 
              alt="${prod.name}" 
              class="product-card-img w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'"
            >
            <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
              <span class="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-slate-100">
                ${prod.category}
              </span>
              ${hasDiscount ? `
                <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-rose-500 text-white shadow-sm">
                  -${discountPercent}% OFF
                </span>
              ` : ''}
              ${prod.featured ? `
                <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-amber-500 text-white shadow-sm">
                  ⭐ Destacado
                </span>
              ` : ''}
              ${totalPhotos > 1 ? `
                <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-slate-900/80 text-white shadow-sm flex items-center gap-1 backdrop-blur-sm">
                  <i data-lucide="images" class="w-3 h-3 text-brand-300"></i> ${totalPhotos} fotos
                </span>
              ` : ''}
            </div>
            <div class="absolute bottom-3 left-3">
              ${isOutOfStock ? `
                <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-600 text-white shadow">
                  Agotado
                </span>
              ` : `
                <span class="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-slate-900/75 text-white backdrop-blur-sm">
                  Stock: ${prod.stock}
                </span>
              `}
            </div>
            <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span class="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ver Fotos
              </span>
            </div>
          </div>

          <!-- Centro: Descripción e Información Detallada -->
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1.5">
                <span class="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md">${prod.category}</span>
                ${prod.stock > 0 && prod.stock <= 3 ? `
                  <span class="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">¡Últimas unidades!</span>
                ` : ''}
              </div>
              <h4 class="font-extrabold text-slate-900 text-base sm:text-lg leading-snug hover:text-brand-600 transition-colors cursor-pointer" onclick="openProductDetail('${prod.id}')">
                ${prod.name}
              </h4>
              <p class="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3 sm:line-clamp-4">
                ${prod.description || 'Producto seleccionado de alta calidad con garantía oficial en MAO STORE.'}
              </p>
            </div>
            
            <div class="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span class="flex items-center gap-1"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i> Garantía MAO</span>
              <span class="flex items-center gap-1"><i data-lucide="truck" class="w-3.5 h-3.5 text-brand-600"></i> Envío Nacional</span>
              <span class="flex items-center gap-1"><i data-lucide="camera" class="w-3.5 h-3.5 text-indigo-600"></i> ${totalPhotos} fotos HD</span>
            </div>
          </div>

          <!-- Derecha: Precio y Botones de Compra -->
          <div class="p-4 sm:p-5 md:w-64 flex-shrink-0 md:border-l border-slate-100 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Precio</span>
              <div class="flex items-baseline gap-2 mt-0.5">
                <span class="text-2xl font-black text-slate-900">${formatMoney(prod.price)}</span>
                ${hasDiscount ? `<span class="text-xs font-medium text-slate-400 line-through">${formatMoney(prod.originalPrice)}</span>` : ''}
              </div>
              ${hasDiscount ? `
                <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md">
                  Ahorras ${formatMoney(prod.originalPrice - prod.price)}
                </span>
              ` : ''}
            </div>

            <div class="flex flex-col gap-2 mt-4">
              <button 
                onclick="addToCart('${prod.id}')"
                ${isOutOfStock ? 'disabled' : ''}
                class="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Agregar al carrito"
              >
                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                <span>${isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}</span>
              </button>

              <button 
                onclick="buyProductWhatsAppDirect('${prod.id}')"
                class="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                title="Comprar directo por WhatsApp"
              >
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                <span>Pedir por WhatsApp</span>
              </button>

              ${state.isAdmin ? `
                <button 
                  type="button" 
                  onclick="event.stopPropagation(); editProduct('${prod.id}')"
                  class="w-full py-1.5 px-2.5 rounded-xl bg-slate-200/80 hover:bg-brand-600 hover:text-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                  <span>Editar</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // ==========================================
    // MODO 2: TARJETAS EN 2 COLUMNAS (COMPACTAS)
    // ==========================================
    if (viewMode === 'grid-2') {
      return `
        <div class="product-card group bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500/30 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
          
          <!-- Imagen Cuadrada con Badges Compactos -->
          <div class="relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer" onclick="openProductDetail('${prod.id}')">
            <img 
              src="${displayImage}" 
              alt="${prod.name}" 
              class="product-card-img w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'"
            >
            <div class="absolute top-2 left-2 flex flex-col gap-1 items-start">
              <span class="px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-md bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-slate-100">
                ${prod.category}
              </span>
              ${hasDiscount ? `
                <span class="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-rose-500 text-white shadow-sm">
                  -${discountPercent}%
                </span>
              ` : ''}
              ${totalPhotos > 1 ? `
                <span class="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-slate-900/80 text-white shadow-sm flex items-center gap-0.5 backdrop-blur-sm">
                  <i data-lucide="images" class="w-2.5 h-2.5 text-brand-300"></i> ${totalPhotos}
                </span>
              ` : ''}
            </div>
            <div class="absolute bottom-2 left-2">
              ${isOutOfStock ? `
                <span class="px-2 py-0.5 text-[9px] font-bold rounded-md bg-rose-600 text-white shadow">
                  Agotado
                </span>
              ` : `
                <span class="px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-slate-900/75 text-white backdrop-blur-sm">
                  Stock: ${prod.stock}
                </span>
              `}
            </div>
          </div>

          <!-- Cuerpo Compacto -->
          <div class="p-3 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              <h4 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer" onclick="openProductDetail('${prod.id}')">
                ${prod.name}
              </h4>
            </div>

            <div class="mt-2.5 pt-2 border-t border-slate-100">
              <div class="flex items-baseline gap-1.5 mb-2">
                <span class="text-sm sm:text-base font-black text-slate-900">${formatMoney(prod.price)}</span>
                ${hasDiscount ? `<span class="text-[10px] text-slate-400 line-through">${formatMoney(prod.originalPrice)}</span>` : ''}
              </div>

              <div class="flex items-center gap-1.5">
                <button 
                  onclick="addToCart('${prod.id}')"
                  ${isOutOfStock ? 'disabled' : ''}
                  class="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-sm"
                  title="Añadir al Carrito"
                >
                  <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                  <span class="text-[11px] sm:text-xs">${isOutOfStock ? 'Agotado' : 'Añadir'}</span>
                </button>
                <button 
                  onclick="buyProductWhatsAppDirect('${prod.id}')"
                  class="p-1.5 sm:px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm"
                  title="Pedir por WhatsApp"
                >
                  <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                </button>
              </div>

              ${state.isAdmin ? `
                <button 
                  type="button" 
                  onclick="event.stopPropagation(); editProduct('${prod.id}')"
                  class="w-full mt-1.5 py-1 px-2 rounded-lg bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                >
                  <i data-lucide="edit-3" class="w-3 h-3"></i>
                  <span>Editar</span>
                </button>
              ` : ''}
            </div>
          </div>

        </div>
      `;
    }

    // ==========================================
    // MODO 3 / 4: TARJETAS EN 1 COLUMNA O CUADRÍCULA ESTÁNDAR
    // ==========================================
    return `
      <div class="product-card group bg-white rounded-2xl border border-slate-200/90 hover:border-brand-500/30 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
        
        <!-- Image & Badges Container -->
        <div class="relative w-full aspect-square bg-slate-100 overflow-hidden cursor-pointer" onclick="openProductDetail('${prod.id}')">
          <img 
            src="${displayImage}" 
            alt="${prod.name}" 
            class="product-card-img w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'"
          >

          <!-- Top Badges -->
          <div class="absolute top-3 left-3 flex flex-col gap-1 items-start">
            <span class="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-slate-100">
              ${prod.category}
            </span>
            ${hasDiscount ? `
              <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-rose-500 text-white shadow-sm">
                -${discountPercent}% OFF
              </span>
            ` : ''}
            ${prod.featured ? `
              <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-amber-500 text-white shadow-sm flex items-center gap-1">
                ⭐ Destacado
              </span>
            ` : ''}
            ${totalPhotos > 1 ? `
              <span class="px-2 py-0.5 text-[10px] font-black rounded-lg bg-slate-900/80 text-white shadow-sm flex items-center gap-1 backdrop-blur-sm">
                <i data-lucide="images" class="w-3 h-3 text-brand-300"></i> ${totalPhotos} fotos
              </span>
            ` : ''}
          </div>

          <!-- Stock Indicator Badge -->
          <div class="absolute bottom-3 left-3">
            ${isOutOfStock ? `
              <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-600 text-white shadow">
                Agotado
              </span>
            ` : `
              <span class="px-2 py-0.5 text-[10px] font-semibold rounded-lg bg-slate-900/75 text-white backdrop-blur-sm">
                Stock: ${prod.stock}
              </span>
            `}
          </div>

          <!-- Quick Preview Button (Appears on Hover) -->
          <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span class="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ver Detalle
            </span>
          </div>
        </div>

        <!-- Card Body -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-brand-600 transition-colors cursor-pointer" onclick="openProductDetail('${prod.id}')">
              ${prod.name}
            </h4>
            
            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              ${prod.description || 'Sin descripción adicional.'}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100">
            <!-- Price Display -->
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-lg font-black text-slate-900">
                ${formatMoney(prod.price)}
              </span>
              ${hasDiscount ? `
                <span class="text-xs font-medium text-slate-400 line-through">
                  ${formatMoney(prod.originalPrice)}
                </span>
              ` : ''}
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2 mb-2">
              <button 
                onclick="addToCart('${prod.id}')"
                ${isOutOfStock ? 'disabled' : ''}
                class="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Agregar al carrito"
              >
                <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                <span>${isOutOfStock ? 'Agotado' : 'Añadir'}</span>
              </button>

              <button 
                onclick="buyProductWhatsAppDirect('${prod.id}')"
                class="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                title="Comprar directo por WhatsApp"
              >
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                <span>Comprar</span>
              </button>
            </div>

            <!-- Quick Edit Button directly on card (Only visible in Creator Mode) -->
            ${state.isAdmin ? `
              <button 
                type="button" 
                onclick="event.stopPropagation(); editProduct('${prod.id}')"
                class="w-full py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200/80 shadow-sm"
                title="Editar este producto"
              >
                <i data-lucide="edit-3" class="w-3.5 h-3.5 pointer-events-none"></i>
                <span>Editar Producto</span>
              </button>
            ` : ''}
          </div>

        </div>

      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// ------------------------------------------
// SEARCH & SORT CONTROLS
// ------------------------------------------
function handleSearch(query) {
  state.searchQuery = query;
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn) {
    if (query.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  // Keep both search inputs in sync
  const desktopInput = document.getElementById('searchInput');
  const mobileInput = document.getElementById('searchInputMobile');
  if (desktopInput && desktopInput.value !== query) desktopInput.value = query;
  if (mobileInput && mobileInput.value !== query) mobileInput.value = query;

  renderProductsGrid();
}

function clearSearch() {
  state.searchQuery = '';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchInputMobile').value = '';
  document.getElementById('clearSearchBtn').classList.add('hidden');
  renderProductsGrid();
}

function handleSort(sortVal) {
  state.sortBy = sortVal;
  renderProductsGrid();
}

function resetFilters() {
  state.currentCategory = 'all';
  state.searchQuery = '';
  state.sortBy = 'recent';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchInputMobile').value = '';
  document.getElementById('sortBySelect').value = 'recent';
  renderCategoryChips();
  renderProductsGrid();
}

// ==========================================
// VIEW SWITCHING (STORE <-> ADMIN)
// ==========================================
function switchView(viewName) {
  if (viewName === 'admin' && !state.isAdmin) {
    promptAdminLogin();
    return;
  }

  state.currentView = viewName;
  const storeView = document.getElementById('storeView');
  const adminView = document.getElementById('adminView');
  const adminToggleText = document.getElementById('adminToggleText');

  if (viewName === 'admin') {
    storeView.classList.add('hidden');
    adminView.classList.remove('hidden');
    if (adminToggleText) adminToggleText.innerText = 'Ver Tienda';
    renderAdminProducts();
    renderAdminCategories();
  } else {
    storeView.classList.remove('hidden');
    adminView.classList.add('hidden');
    if (adminToggleText) adminToggleText.innerText = 'Panel Creador';
    renderCategoryChips();
    renderProductsGrid();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

function toggleAdminView() {
  if (!state.isAdmin) {
    promptAdminLogin();
    return;
  }
  if (state.currentView === 'store') {
    switchView('admin');
  } else {
    switchView('store');
  }
}

async function handleAdminAccessClick() {
  if (state.isAdmin) {
    switchView('admin');
  } else {
    promptAdminLogin();
  }
}

async function promptAdminLogin() {
  const { value: pin } = await Swal.fire({
    title: 'Acceso Exclusivo de Creador',
    html: `
      <div class="text-left text-xs text-slate-600 space-y-2 mb-3">
        <p>Esta tienda está en modo <b>Solo Lectura</b> para los clientes en Internet.</p>
        <p>Como creador de <b>MAO STORE</b>, ingresa tu PIN de Administrador para editar productos, precios, fotos y categorías:</p>
      </div>
    `,
    input: 'password',
    inputPlaceholder: 'Ingresa tu PIN (por defecto: 1234)',
    inputAttributes: {
      autocapitalize: 'off',
      autocorrect: 'off'
    },
    showCancelButton: true,
    confirmButtonText: 'Desbloquear Modo Creador',
    cancelButtonText: 'Volver a la Tienda',
    confirmButtonColor: '#4f46e5',
    footer: '<span class="text-xs text-slate-400">PIN maestro inicial: <b>1234</b> (puedes cambiarlo en Configuración)</span>'
  });

  if (!pin) return;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin.trim() })
    });
    const data = await res.json();

    if (res.ok && data.success && data.token) {
      localStorage.setItem('mao_admin_token', data.token);
      state.isAdmin = true;
      updateAdminUIState();
      renderApp();
      switchView('admin');

      Swal.fire({
        icon: 'success',
        title: '¡Modo Creador Desbloqueado!',
        text: 'Ya puedes editar productos, sincronizar fotos, modificar categorías y personalizar tu tienda.',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'PIN Incorrecto',
        text: data.error || 'El PIN ingresado no es válido.',
        confirmButtonColor: '#4f46e5'
      });
    }
  } catch (err) {
    console.error('Error in promptAdminLogin:', err);
    Swal.fire('Error', 'No se pudo conectar con el servidor para validar el PIN.', 'error');
  }
}

function logoutAdmin() {
  Swal.fire({
    title: '¿Cerrar Modo Creador?',
    text: 'Regresarás a la vista normal de cliente (solo lectura y compras).',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, volver a modo cliente',
    cancelButtonText: 'Continuar editando',
    confirmButtonColor: '#4f46e5'
  }).then(result => {
    if (result.isConfirmed) {
      localStorage.removeItem('mao_admin_token');
      state.isAdmin = false;
      updateAdminUIState();
      switchView('store');
      renderApp();

      Swal.fire({
        icon: 'info',
        title: 'Modo Cliente Activado',
        text: 'Ahora estás viendo la página exactamente como la ven tus clientes.',
        timer: 2000,
        showConfirmButton: false
      });
    }
  });
}

function switchAdminTab(tabName) {
  state.currentAdminTab = tabName;
  
  const tabs = ['products', 'categories', 'settings', 'facebook'];
  tabs.forEach(t => {
    const content = document.getElementById(`adminTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (!content || !btn) return;
    
    if (t === tabName) {
      content.classList.remove('hidden');
      btn.classList.add('active', 'text-brand-600', 'border-brand-600');
      btn.classList.remove('text-slate-500', 'border-transparent');
    } else {
      content.classList.add('hidden');
      btn.classList.remove('active', 'text-brand-600', 'border-brand-600');
      btn.classList.add('text-slate-500', 'border-transparent');
    }
  });

  lucide.createIcons();
}

// ==========================================
// ADMIN: PRODUCT MANAGEMENT (CRUD)
// ==========================================
function renderAdminProducts(filterTerm = '') {
  const tbody = document.getElementById('adminProductsTableBody');
  const totalVal = document.getElementById('adminTotalProductsVal');
  const countBadge = document.getElementById('adminProductsCount');
  if (!tbody) return;

  totalVal.innerText = state.products.length;
  countBadge.innerText = state.products.length;

  let list = state.products;
  if (filterTerm) {
    const term = filterTerm.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-xs text-slate-400">
          No hay productos que coincidan con la búsqueda.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(prod => {
    const photoCount = (prod.images && prod.images.length > 0) ? prod.images.length : (prod.image ? 1 : 0);
    const mainImg = (prod.images && prod.images.length > 0) ? prod.images[0] : prod.image;

    return `
    <tr class="hover:bg-slate-50/80 transition-colors">
      <!-- Product info -->
      <td class="py-3 px-4">
        <div class="flex items-center gap-3">
          <div class="relative flex-shrink-0">
            <img src="${mainImg}" alt="" class="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'">
            ${photoCount > 1 ? `
              <span class="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-bold px-1 rounded shadow">
                ${photoCount}
              </span>
            ` : ''}
          </div>
          <div>
            <div class="font-bold text-slate-900 leading-tight">${prod.name}</div>
            <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
              <span>${photoCount} foto(s)</span>
              ${prod.featured ? '<span>• ⭐ Destacado</span>' : ''}
            </div>
          </div>
        </div>
      </td>

      <!-- Category -->
      <td class="py-3 px-4">
        <span class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700">
          ${prod.category}
        </span>
      </td>

      <!-- Price -->
      <td class="py-3 px-4 font-bold text-slate-900 text-xs">
        ${formatMoney(prod.price)}
      </td>

      <!-- Stock -->
      <td class="py-3 px-4 text-xs font-semibold ${prod.stock > 0 ? 'text-slate-700' : 'text-rose-600'}">
        ${prod.stock} unidades
      </td>

      <!-- Status -->
      <td class="py-3 px-4">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
          prod.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }">
          <span class="w-1.5 h-1.5 rounded-full ${prod.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
          ${prod.stock > 0 ? 'Disponible' : 'Agotado'}
        </span>
      </td>

      <!-- Actions -->
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-2">
          <button 
            type="button"
            onclick="editProduct('${prod.id}')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-brand-600 hover:text-white text-brand-700 font-bold text-xs transition-all border border-indigo-200/80 shadow-sm"
            title="Editar producto"
          >
            <i data-lucide="edit-3" class="w-3.5 h-3.5 pointer-events-none"></i>
            <span>Editar</span>
          </button>
          <button 
            type="button"
            onclick="deleteProduct('${prod.id}')"
            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar producto"
          >
            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  lucide.createIcons();
}

// Open Product Modal for Create or Edit
function openProductModal(productId = null) {
  if (!state.isAdmin) {
    promptAdminLogin();
    return;
  }

  // Close detail modal if open
  closeProductDetailModal();

  state.editingProductId = productId ? String(productId) : null;
  const modal = document.getElementById('productModal');
  const modalTitle = document.getElementById('productModalTitle');
  const form = document.getElementById('productForm');

  populateCategorySelects();
  state.selectedImages = [];

  if (productId) {
    const prod = state.products.find(p => String(p.id) === String(productId));
    if (!prod) {
      console.warn('Producto no encontrado con ID:', productId);
      Swal.fire('Error', 'No se encontró el producto a editar.', 'error');
      return;
    }

    modalTitle.innerText = 'Editar Producto';
    document.getElementById('formProductId').value = prod.id;
    document.getElementById('formProductName').value = prod.name || '';
    
    // Ensure category option exists in select
    const catSelect = document.getElementById('formProductCategory');
    if (prod.category && !Array.from(catSelect.options).some(o => o.value.toLowerCase() === prod.category.toLowerCase())) {
      const opt = document.createElement('option');
      opt.value = prod.category;
      opt.innerText = prod.category;
      catSelect.appendChild(opt);
    }
    catSelect.value = prod.category;

    document.getElementById('formProductPrice').value = (prod.price !== undefined && prod.price !== null) ? prod.price : '';
    document.getElementById('formProductOriginalPrice').value = prod.originalPrice || '';
    document.getElementById('formProductStock').value = (prod.stock !== undefined && prod.stock !== null) ? prod.stock : '10';
    document.getElementById('formProductDescription').value = prod.description || '';
    document.getElementById('formProductFeatured').checked = Boolean(prod.featured);
    
    // Load existing photos (up to 10)
    const existingImages = (Array.isArray(prod.images) && prod.images.length > 0) ? prod.images : (prod.image ? [prod.image] : []);
    state.selectedImages = existingImages.slice(0, 10).map((img, idx) => ({
      data: img,
      filename: `foto_${idx + 1}.jpg`,
      isUrl: true
    }));
  } else {
    modalTitle.innerText = 'Subir Nuevo Producto';
    form.reset();
    document.getElementById('formProductId').value = '';
    document.getElementById('formProductStock').value = '10';
  }

  renderModalImagesGallery();
  modal.classList.remove('hidden');
  modal.scrollTop = 0;
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  state.selectedImages = [];
  state.editingProductId = null;
  const fileInput = document.getElementById('productImageInput');
  const urlInput = document.getElementById('productImageUrlInput');
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
}

// Render the 10-slots photo gallery in the modal
function renderModalImagesGallery() {
  const container = document.getElementById('imagesGalleryContainer');
  const prompt = document.getElementById('imageUploadPrompt');
  const badge = document.getElementById('photoCountBadge');
  if (!container || !prompt) return;

  const count = state.selectedImages.length;
  badge.innerText = `${count} / 10 fotos`;
  if (count >= 10) {
    badge.className = 'text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700';
    prompt.classList.add('hidden');
  } else {
    badge.className = 'text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700';
    prompt.classList.remove('hidden');
  }

  if (count === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = state.selectedImages.map((img, idx) => {
    const isPrimary = idx === 0;
    return `
      <div class="relative group aspect-square rounded-xl overflow-hidden border-2 ${isPrimary ? 'border-brand-500 shadow-md ring-2 ring-brand-500/20' : 'border-slate-200'} bg-slate-100 flex flex-col justify-between">
        <img src="${img.data}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">

        <!-- Top Badges / Delete -->
        <div class="absolute top-1 left-1 right-1 flex items-center justify-between pointer-events-none">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-black ${isPrimary ? 'bg-brand-600 text-white' : 'bg-slate-900/70 text-white'} shadow">
            ${isPrimary ? 'Portada' : `#${idx + 1}`}
          </span>
          <button 
            type="button" 
            onclick="removeModalImage(${idx})" 
            class="pointer-events-auto w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow transition-transform hover:scale-110"
            title="Quitar esta foto"
          >
            ✕
          </button>
        </div>

        <!-- Action bar at bottom: make cover -->
        ${!isPrimary ? `
          <button 
            type="button" 
            onclick="setPrimaryModalImage(${idx})"
            class="absolute bottom-1 left-1 right-1 py-1 px-1 bg-slate-900/80 hover:bg-brand-600 text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-all text-center shadow"
          >
            Hacer Portada
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Handle Multiple Images Selected from PC
function handleMultipleImagesSelected(input) {
  if (!input.files || input.files.length === 0) return;

  const currentCount = state.selectedImages.length;
  const remaining = 10 - currentCount;

  if (remaining <= 0) {
    Swal.fire('Límite alcanzado', 'Ya has seleccionado el máximo de 10 fotos permitidas por producto.', 'warning');
    input.value = '';
    return;
  }

  const filesToRead = Array.from(input.files).slice(0, remaining);
  if (input.files.length > remaining) {
    Swal.fire('Aviso', `Solo se agregaron ${remaining} fotos para no superar el límite de 10 por producto.`, 'info');
  }

  let loaded = 0;
  filesToRead.forEach(file => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      state.selectedImages.push({
        data: e.target.result,
        filename: file.name,
        isUrl: false
      });
      loaded++;
      if (loaded === filesToRead.length) {
        renderModalImagesGallery();
      }
    };
    reader.readAsDataURL(file);
  });

  input.value = '';
}

// Add an image from internet URL
function addImageByUrl() {
  const input = document.getElementById('productImageUrlInput');
  if (!input) return;
  const url = input.value.trim();

  if (!url) {
    Swal.fire('Enlace vacío', 'Por favor ingresa la URL de la imagen.', 'info');
    return;
  }

  if (state.selectedImages.length >= 10) {
    Swal.fire('Límite alcanzado', 'Ya tienes el máximo de 10 fotos por producto.', 'warning');
    return;
  }

  state.selectedImages.push({
    data: url,
    filename: 'url_image_' + Date.now() + '.jpg',
    isUrl: true
  });

  input.value = '';
  renderModalImagesGallery();
}

function removeModalImage(index) {
  state.selectedImages.splice(index, 1);
  renderModalImagesGallery();
}

function setPrimaryModalImage(index) {
  if (index <= 0 || index >= state.selectedImages.length) return;
  const item = state.selectedImages.splice(index, 1)[0];
  state.selectedImages.unshift(item);
  renderModalImagesGallery();
}

// Submit Product Form (Create or Update with up to 10 photos)
async function handleProductSubmit(e) {
  e.preventDefault();

  if (state.selectedImages.length === 0) {
    Swal.fire('Falta la imagen', 'Debes agregar al menos 1 foto del producto (puedes subir hasta 10 fotos).', 'warning');
    return;
  }

  const id = document.getElementById('formProductId').value;
  const name = document.getElementById('formProductName').value.trim();
  const category = document.getElementById('formProductCategory').value;
  const price = Number(document.getElementById('formProductPrice').value);
  const originalPriceVal = document.getElementById('formProductOriginalPrice').value;
  const originalPrice = originalPriceVal ? Number(originalPriceVal) : null;
  const stock = Number(document.getElementById('formProductStock').value);
  const description = document.getElementById('formProductDescription').value.trim();
  const featured = document.getElementById('formProductFeatured').checked;

  // Show Loading indicator
  const btnSave = document.getElementById('btnSaveProduct');
  const originalText = btnSave.innerHTML;
  btnSave.innerHTML = `<span class="inline-block animate-spin mr-1">↻</span> Guardando ${state.selectedImages.length} foto(s)...`;
  btnSave.disabled = true;

  try {
    const finalImageUrls = [];

    // Process each image (upload local base64 images to server if online)
    for (let i = 0; i < state.selectedImages.length; i++) {
      const imgItem = state.selectedImages[i];

      if (imgItem.isUrl || imgItem.data.startsWith('http') || imgItem.data.startsWith('/uploads/')) {
        finalImageUrls.push(imgItem.data);
      } else if (state.isServerConnected) {
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              filename: imgItem.filename || `foto_${i + 1}.jpg`,
              data: imgItem.data
            })
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalImageUrls.push(uploadData.url);
          } else {
            finalImageUrls.push(imgItem.data);
          }
        } catch (err) {
          console.warn('Failed to upload image to server, using base64 fallback', err);
          finalImageUrls.push(imgItem.data);
        }
      } else {
        finalImageUrls.push(imgItem.data);
      }
    }

    const payload = {
      name,
      category,
      price,
      originalPrice,
      image: finalImageUrls[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      images: finalImageUrls, // Up to 10 photos
      stock,
      description,
      featured
    };

    if (id) {
      // UPDATE
      if (state.isServerConnected) {
        const res = await fetch(`/api/products/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        const index = state.products.findIndex(p => p.id === id);
        if (index !== -1) state.products[index] = data.product;
      } else {
        const index = state.products.findIndex(p => p.id === id);
        if (index !== -1) {
          state.products[index] = { ...state.products[index], ...payload, updatedAt: new Date().toISOString() };
          saveLocalData();
        }
      }
      Swal.fire({
        icon: 'success',
        title: '¡Producto Actualizado!',
        text: `"${name}" se guardó con ${finalImageUrls.length} foto(s).`,
        timer: 1800,
        showConfirmButton: false
      });
    } else {
      // CREATE
      if (state.isServerConnected) {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        state.products.unshift(data.product);
      } else {
        const newProduct = {
          id: 'prod-' + Date.now(),
          ...payload,
          createdAt: new Date().toISOString()
        };
        state.products.unshift(newProduct);
        saveLocalData();
      }

      Swal.fire({
        icon: 'success',
        title: '¡Producto Publicado!',
        text: `"${name}" publicado con ${finalImageUrls.length} foto(s).`,
        timer: 2000,
        showConfirmButton: false
      });
    }

    closeProductModal();
    renderApp();

  } catch (error) {
    console.error('Error saving product:', error);
    Swal.fire('Error', 'No se pudo guardar el producto. Inténtalo nuevamente.', 'error');
  } finally {
    btnSave.innerHTML = originalText;
    btnSave.disabled = false;
  }
}

function editProduct(productId) {
  openProductModal(productId);
}

// Delete Product
async function deleteProduct(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const result = await Swal.fire({
    title: '¿Eliminar producto?',
    text: `¿Estás seguro de que deseas eliminar "${prod.name}"? Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    if (state.isServerConnected) {
      try {
        await fetch(`/api/products/${productId}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (e) {
        console.error('Error deleting from server:', e);
      }
    }

    state.products = state.products.filter(p => p.id !== productId);
    if (!state.isServerConnected) saveLocalData();

    Swal.fire({
      icon: 'success',
      title: 'Eliminado',
      text: 'El producto fue retirado de la tienda.',
      timer: 1500,
      showConfirmButton: false
    });

    renderApp();
  }
}

// ==========================================
// ADMIN: CATEGORIES MANAGEMENT
// ==========================================
function renderAdminCategories() {
  const list = document.getElementById('adminCategoriesList');
  const countBadge = document.getElementById('adminCategoriesCount');
  if (!list) return;

  countBadge.innerText = state.categories.length;

  list.innerHTML = state.categories.map(cat => {
    const count = state.products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
    return `
      <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
            <i data-lucide="${cat.icon || 'tag'}" class="w-4 h-4"></i>
          </div>
          <div>
            <span class="font-bold text-slate-800 text-sm">${cat.name}</span>
            <span class="block text-[11px] text-slate-400">${count} productos</span>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button 
            type="button"
            onclick="openEditCategoryModal('${cat.name}', '${cat.icon || 'tag'}')" 
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-brand-600 hover:text-white text-brand-700 font-bold text-xs transition-colors border border-indigo-200 shadow-sm"
            title="Editar nombre de categoría"
          >
            <i data-lucide="edit-3" class="w-3.5 h-3.5 pointer-events-none"></i>
            <span>Editar</span>
          </button>
          <button 
            type="button"
            onclick="deleteCategory('${cat.name}')" 
            class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Eliminar categoría"
          >
            <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// Edit Existing Category (Renames Category and Updates All Associated Products)
async function openEditCategoryModal(oldName, oldIcon) {
  const { value: newName } = await Swal.fire({
    title: 'Editar Categoría',
    input: 'text',
    inputValue: oldName,
    inputLabel: 'Nombre de la categoría:',
    inputPlaceholder: 'Ingresa el nuevo nombre...',
    showCancelButton: true,
    confirmButtonText: 'Guardar Cambios',
    cancelButtonText: 'Cancelar',
    inputValidator: (val) => {
      if (!val || !val.trim()) {
        return 'El nombre de la categoría no puede estar vacío';
      }
      if (val.trim().toLowerCase() !== oldName.toLowerCase() && state.categories.some(c => c.name.toLowerCase() === val.trim().toLowerCase())) {
        return 'Ya existe otra categoría con ese nombre';
      }
    }
  });

  if (newName && newName.trim() && newName.trim() !== oldName) {
    const trimmedNew = newName.trim();
    
    if (state.isServerConnected) {
      try {
        const res = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: trimmedNew, icon: oldIcon })
        });
        const resData = await res.json();
        console.log('Category renamed on server:', resData);
      } catch (err) {
        console.error('Error updating category on server:', err);
      }
    }

    // Update in local memory
    const cat = state.categories.find(c => c.name.toLowerCase() === oldName.toLowerCase());
    if (cat) cat.name = trimmedNew;

    // Update all products belonging to this category
    let countUpdated = 0;
    state.products.forEach(p => {
      if (p.category.toLowerCase() === oldName.toLowerCase()) {
        p.category = trimmedNew;
        countUpdated++;
      }
    });

    if (state.currentCategory.toLowerCase() === oldName.toLowerCase()) {
      state.currentCategory = trimmedNew;
    }

    if (!state.isServerConnected) saveLocalData();

    Swal.fire({
      icon: 'success',
      title: '¡Categoría Actualizada!',
      text: `Se cambió a "${trimmedNew}" y se actualizaron ${countUpdated} producto(s) en esta categoría.`,
      timer: 2000,
      showConfirmButton: false
    });

    renderApp();
  }
}

async function handleCreateCategory(e) {
  e.preventDefault();
  const input = document.getElementById('newCategoryName');
  const catName = input.value.trim();

  if (!catName) return;

  if (state.categories.some(c => c.name.toLowerCase() === catName.toLowerCase())) {
    Swal.fire('Categoría duplicada', 'Ya existe una categoría con ese nombre.', 'warning');
    return;
  }

  const newCat = {
    id: 'cat-' + Date.now(),
    name: catName,
    icon: 'tag'
  };

  if (state.isServerConnected) {
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newCat)
      });
    } catch (err) {
      console.error('Failed to create category on server', err);
    }
  }

  state.categories.push(newCat);
  if (!state.isServerConnected) saveLocalData();

  input.value = '';
  Swal.fire({
    icon: 'success',
    title: 'Categoría Creada',
    text: `"${catName}" está lista para usarse.`,
    timer: 1500,
    showConfirmButton: false
  });

  renderApp();
}

async function promptQuickAddCategory() {
  const { value: catName } = await Swal.fire({
    title: 'Nueva Categoría',
    input: 'text',
    inputLabel: 'Nombre de la categoría',
    inputPlaceholder: 'Ej. Joyería, Tecnología, Deportes...',
    showCancelButton: true,
    confirmButtonText: 'Crear',
    cancelButtonText: 'Cancelar'
  });

  if (catName && catName.trim()) {
    const trimmed = catName.trim();
    if (!state.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      const newCat = { id: 'cat-' + Date.now(), name: trimmed, icon: 'tag' };
      state.categories.push(newCat);

      if (state.isServerConnected) {
        fetch('/api/categories', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(newCat)
        }).catch(console.error);
      } else {
        saveLocalData();
      }

      renderApp();
      document.getElementById('formProductCategory').value = trimmed;
    }
  }
}

async function deleteCategory(catName) {
  if (!state.isAdmin) {
    promptAdminLogin();
    return;
  }

  const count = state.products.filter(p => p.category.toLowerCase() === catName.toLowerCase()).length;
  
  const result = await Swal.fire({
    title: `¿Eliminar "${catName}"?`,
    text: count > 0 ? `Hay ${count} productos en esta categoría.` : 'La categoría se borrará permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    if (state.isServerConnected) {
      try {
        await fetch(`/api/categories/${encodeURIComponent(catName)}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.error(err);
      }
    }
    state.categories = state.categories.filter(c => c.name.toLowerCase() !== catName.toLowerCase());
    if (!state.isServerConnected) saveLocalData();
    renderApp();
  }
}

function openCategoryModal() {
  if (!state.isAdmin) {
    promptAdminLogin();
    return;
  }
  switchView('admin');
  switchAdminTab('categories');
}

// ==========================================
// ADMIN: STORE SETTINGS
// ==========================================
function populateSettingsForm() {
  const nameInput = document.getElementById('settingStoreName');
  const sloganInput = document.getElementById('settingStoreSlogan');
  const waInput = document.getElementById('settingWhatsapp');
  const currInput = document.getElementById('settingCurrency');

  if (nameInput) nameInput.value = state.settings.storeName || '';
  if (sloganInput) sloganInput.value = state.settings.storeSlogan || '';
  if (waInput) waInput.value = state.settings.whatsappNumber || '';
  if (currInput) currInput.value = state.settings.currencySymbol || '$';

  // Logo Preview
  const logoPreview = document.getElementById('settingLogoPreview');
  const logoPlaceholder = document.getElementById('settingLogoPlaceholder');
  const btnRemoveLogo = document.getElementById('btnRemoveLogo');
  const logoUrlInput = document.getElementById('settingLogoUrl');

  if (state.settings.logoUrl) {
    if (logoPreview) { logoPreview.src = state.settings.logoUrl; logoPreview.classList.remove('hidden'); }
    if (logoPlaceholder) logoPlaceholder.classList.add('hidden');
    if (btnRemoveLogo) btnRemoveLogo.classList.remove('hidden');
    if (logoUrlInput) logoUrlInput.value = state.settings.logoUrl;
  } else {
    if (logoPreview) { logoPreview.src = ''; logoPreview.classList.add('hidden'); }
    if (logoPlaceholder) logoPlaceholder.classList.remove('hidden');
    if (btnRemoveLogo) btnRemoveLogo.classList.add('hidden');
    if (logoUrlInput) logoUrlInput.value = '';
  }

  // Hero Banner Settings
  const bannerTitleInput = document.getElementById('settingBannerTitle');
  const bannerTextInput = document.getElementById('settingBannerText');
  const bannerBadgeInput = document.getElementById('settingBannerBadge');
  const bannerBgUrlInput = document.getElementById('settingBannerBgUrl');
  const bannerPreviewContainer = document.getElementById('settingBannerPreviewContainer');
  const btnRemoveBannerBg = document.getElementById('btnRemoveBannerBg');

  if (bannerTitleInput) bannerTitleInput.value = state.settings.bannerTitle || 'Bienvenido a MAO STORE';
  if (bannerTextInput) bannerTextInput.value = state.settings.bannerText || state.settings.storeSlogan || '';
  if (bannerBadgeInput) bannerBadgeInput.value = state.settings.bannerBadge || 'Catálogo Completo 2026';
  
  // Hero Banner Video Preview
  const bannerVideoContainer = document.getElementById('settingBannerVideoContainer');
  const bannerVideoPreview = document.getElementById('settingBannerVideoPreview');
  const bannerVideoPreviewSource = document.getElementById('settingBannerVideoPreviewSource');
  const bannerVideoUrlInput = document.getElementById('settingBannerBgVideoUrl');
  const btnRemoveBannerVideo = document.getElementById('btnRemoveBannerVideo');

  if (state.settings.bannerBgVideo) {
    if (bannerVideoContainer && bannerVideoPreview) {
      bannerVideoPreview.muted = true;
      bannerVideoPreview.defaultMuted = true;
      bannerVideoPreview.playsInline = true;
      bannerVideoPreview.loop = true;
      if (bannerVideoPreview.src !== state.settings.bannerBgVideo && !bannerVideoPreview.src.endsWith(state.settings.bannerBgVideo)) {
        bannerVideoPreview.src = state.settings.bannerBgVideo;
        bannerVideoPreview.load();
      }
      bannerVideoContainer.classList.remove('hidden');
      bannerVideoPreview.play().catch(() => {});
    }
    if (btnRemoveBannerVideo) btnRemoveBannerVideo.classList.remove('hidden');
    if (bannerVideoUrlInput) bannerVideoUrlInput.value = state.settings.bannerBgVideo;
  } else {
    if (bannerVideoContainer && bannerVideoPreview) {
      bannerVideoPreview.pause();
      bannerVideoPreview.src = '';
      bannerVideoContainer.classList.add('hidden');
    }
    if (btnRemoveBannerVideo) btnRemoveBannerVideo.classList.add('hidden');
    if (bannerVideoUrlInput) bannerVideoUrlInput.value = '';
  }

  // Hero Banner Background Image
  if (state.settings.bannerBgImage) {
    if (bannerPreviewContainer) {
      bannerPreviewContainer.style.backgroundImage = `url('${state.settings.bannerBgImage}')`;
      bannerPreviewContainer.classList.remove('hidden');
    }
    if (btnRemoveBannerBg) btnRemoveBannerBg.classList.remove('hidden');
    if (bannerBgUrlInput) bannerBgUrlInput.value = state.settings.bannerBgImage;
  } else {
    if (bannerPreviewContainer) {
      bannerPreviewContainer.style.backgroundImage = '';
      bannerPreviewContainer.classList.add('hidden');
    }
    if (btnRemoveBannerBg) btnRemoveBannerBg.classList.add('hidden');
    if (bannerBgUrlInput) bannerBgUrlInput.value = '';
  }

  // Security Admin PIN
  const pinInput = document.getElementById('settingAdminPin');
  if (pinInput) {
    pinInput.value = state.settings.adminPin || '1234';
  }
}

// Logo helper handlers
async function handleLogoFileSelected(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      if (state.isServerConnected) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ filename: 'logo_' + file.name, data: base64 })
          });
          const d = await res.json();
          state.settings.logoUrl = d.url;
        } catch (err) {
          state.settings.logoUrl = base64;
        }
      } else {
        state.settings.logoUrl = base64;
      }
      populateSettingsForm();
    };
    reader.readAsDataURL(file);
  }
}

function handleLogoUrlInput(url) {
  state.settings.logoUrl = url.trim();
  populateSettingsForm();
}

function removeSettingLogo() {
  state.settings.logoUrl = '';
  populateSettingsForm();
}

// Hero banner background helper handlers
async function handleBannerBgFileSelected(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      if (state.isServerConnected) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ filename: 'banner_' + file.name, data: base64 })
          });
          const d = await res.json();
          state.settings.bannerBgImage = d.url;
        } catch (err) {
          state.settings.bannerBgImage = base64;
        }
      } else {
        state.settings.bannerBgImage = base64;
      }
      populateSettingsForm();
    };
    reader.readAsDataURL(file);
  }
}

// Video Background Handlers
async function handleBannerVideoFileSelected(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Check size limit (limit to 50MB for smooth playback and cloud hosting)
    if (file.size > 50 * 1024 * 1024) {
      Swal.fire('Video muy pesado', 'Por favor selecciona un video menor a 50MB para que tu tienda cargue rápido.', 'warning');
      return;
    }

    Swal.fire({
      title: 'Cargando video...',
      text: 'Procesando el video para la franja dinámica.',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      if (state.isServerConnected) {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ filename: 'video_' + file.name, data: base64 })
          });
          const d = await res.json();
          state.settings.bannerBgVideo = d.url;
        } catch (err) {
          state.settings.bannerBgVideo = base64;
        }
      } else {
        state.settings.bannerBgVideo = base64;
      }

      Swal.close();
      populateSettingsForm();
      renderApp();
      Swal.fire({
        icon: 'success',
        title: '¡Video de Portada Cargado!',
        text: 'Presiona "Guardar Configuración" para confirmar los cambios.',
        timer: 2000,
        showConfirmButton: false
      });
    };
    reader.readAsDataURL(file);
  }
}

function handleBannerVideoUrlInput(url) {
  state.settings.bannerBgVideo = url.trim();
  const bannerVideoContainer = document.getElementById('settingBannerVideoContainer');
  const bannerVideoPreview = document.getElementById('settingBannerVideoPreview');
  const btnRemoveBannerVideo = document.getElementById('btnRemoveBannerVideo');

  if (url.trim()) {
    if (bannerVideoContainer && bannerVideoPreview) {
      bannerVideoPreview.muted = true;
      bannerVideoPreview.defaultMuted = true;
      bannerVideoPreview.playsInline = true;
      bannerVideoPreview.src = url.trim();
      bannerVideoPreview.load();
      bannerVideoContainer.classList.remove('hidden');
      bannerVideoPreview.play().catch(() => {});
    }
    if (btnRemoveBannerVideo) btnRemoveBannerVideo.classList.remove('hidden');
  } else {
    removeSettingBannerVideo();
  }
  renderApp();
}

function removeSettingBannerVideo() {
  state.settings.bannerBgVideo = '';
  populateSettingsForm();
  renderApp();
}

function useSampleBannerVideo() {
  // High quality sample commerce/tech background video from Mixkit
  const sampleUrl = 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-man-wearing-a-smart-watch-41133-large.mp4';
  state.settings.bannerBgVideo = sampleUrl;
  populateSettingsForm();
  renderApp();
  Swal.fire({
    icon: 'success',
    title: '¡Video Demo Aplicado!',
    text: 'Mira la franja superior en tu tienda para ver cómo cobra vida. Si te gusta, haz clic en "Guardar Configuración".',
    timer: 2500,
    showConfirmButton: false
  });
}

function handleBannerBgUrlInput(url) {
  state.settings.bannerBgImage = url.trim();
  populateSettingsForm();
}

function removeSettingBannerBg() {
  state.settings.bannerBgImage = '';
  populateSettingsForm();
}

async function handleSaveSettings(e) {
  e.preventDefault();

  state.settings.storeName = document.getElementById('settingStoreName').value.trim();
  state.settings.storeSlogan = document.getElementById('settingStoreSlogan').value.trim();
  state.settings.whatsappNumber = document.getElementById('settingWhatsapp').value.trim().replace(/\D/g, '');
  state.settings.currencySymbol = document.getElementById('settingCurrency').value.trim();
  state.settings.bannerTitle = document.getElementById('settingBannerTitle').value.trim();
  state.settings.bannerText = document.getElementById('settingBannerText').value.trim();
  state.settings.bannerBadge = document.getElementById('settingBannerBadge').value.trim();

  const videoUrlInput = document.getElementById('settingBannerBgVideoUrl');
  if (videoUrlInput) {
    state.settings.bannerBgVideo = videoUrlInput.value.trim();
  }

  const bgImgUrlInput = document.getElementById('settingBannerBgUrl');
  if (bgImgUrlInput) {
    state.settings.bannerBgImage = bgImgUrlInput.value.trim();
  }

  const pinInput = document.getElementById('settingAdminPin');
  if (pinInput && pinInput.value.trim()) {
    state.settings.adminPin = pinInput.value.trim();
  }

  if (state.isServerConnected) {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(state.settings)
      });
      const data = await res.json();
      if (data && data.token) {
        localStorage.setItem('mao_admin_token', data.token);
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    saveLocalData();
  }

  Swal.fire({
    icon: 'success',
    title: 'Configuración Guardada',
    text: 'Los cambios de logo, franja, PIN y datos de MAO STORE fueron aplicados con éxito.',
    timer: 1800,
    showConfirmButton: false
  });

  renderApp();
}

// ==========================================
// PRODUCT DETAIL MODAL (CLIENT VIEW) & CAROUSEL
// ==========================================
function openProductDetail(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const modal = document.getElementById('productDetailModal');
  const name = document.getElementById('detailModalName');
  const cat = document.getElementById('detailModalCategory');
  const price = document.getElementById('detailModalPrice');
  const origPrice = document.getElementById('detailModalOriginalPrice');
  const desc = document.getElementById('detailModalDescription');
  const stockBadge = document.getElementById('detailModalStockBadge');
  const addCartBtn = document.getElementById('detailModalAddToCartBtn');
  const buyWaBtn = document.getElementById('detailModalBuyWhatsAppBtn');
  const editBtn = document.getElementById('detailModalEditProductBtn');

  name.innerText = prod.name;
  cat.innerText = prod.category;
  price.innerText = formatMoney(prod.price);
  desc.innerText = prod.description || 'Sin detalles adicionales.';

  if (prod.originalPrice && prod.originalPrice > prod.price) {
    origPrice.innerText = formatMoney(prod.originalPrice);
    origPrice.classList.remove('hidden');
  } else {
    origPrice.classList.add('hidden');
  }

  if (Number(prod.stock) > 0) {
    stockBadge.innerText = `En Stock (${prod.stock} disp.)`;
    stockBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700';
    addCartBtn.disabled = false;
    addCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    stockBadge.innerText = 'Agotado';
    stockBadge.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700';
    addCartBtn.disabled = true;
    addCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  // Load all images for this product (up to 10)
  const allImages = (Array.isArray(prod.images) && prod.images.length > 0) 
    ? prod.images 
    : (prod.image ? [prod.image] : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']);

  state.activeDetailImages = allImages;
  state.activeDetailIndex = 0;
  renderDetailGallery();

  addCartBtn.onclick = () => {
    addToCart(prod.id);
    closeProductDetailModal();
  };

  buyWaBtn.onclick = () => {
    buyProductWhatsAppDirect(prod.id);
  };

  if (editBtn) {
    if (state.isAdmin) {
      editBtn.classList.remove('hidden');
      editBtn.onclick = () => {
        closeProductDetailModal();
        editProduct(prod.id);
      };
    } else {
      editBtn.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
  modal.scrollTop = 0;
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

function renderDetailGallery() {
  const img = document.getElementById('detailModalImage');
  const prevBtn = document.getElementById('detailPrevImageBtn');
  const nextBtn = document.getElementById('detailNextImageBtn');
  const counter = document.getElementById('detailPhotoCounter');
  const thumbnails = document.getElementById('detailThumbnailsStrip');
  const loupe = document.getElementById('imageZoomLoupe');
  if (loupe) loupe.classList.add('hidden');

  const total = state.activeDetailImages.length;
  const currentSrc = state.activeDetailImages[state.activeDetailIndex] || '';

  img.src = currentSrc;

  if (total > 1) {
    prevBtn.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    counter.classList.remove('hidden');
    counter.innerText = `${state.activeDetailIndex + 1} / ${total}`;

    // Render thumbnail row
    thumbnails.classList.remove('hidden');
    thumbnails.innerHTML = state.activeDetailImages.map((src, idx) => `
      <div 
        onclick="switchDetailImage(${idx})"
        class="gallery-thumb w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 bg-white ${
          idx === state.activeDetailIndex ? 'active border-brand-600' : 'border-slate-200 opacity-60 hover:opacity-100'
        }"
      >
        <img src="${src}" alt="" class="w-full h-full object-cover">
      </div>
    `).join('');
  } else {
    prevBtn.classList.add('hidden');
    nextBtn.classList.add('hidden');
    counter.classList.add('hidden');
    thumbnails.classList.add('hidden');
    thumbnails.innerHTML = '';
  }

  lucide.createIcons();
}

function switchDetailImage(index) {
  if (index >= 0 && index < state.activeDetailImages.length) {
    state.activeDetailIndex = index;
    renderDetailGallery();
  }
}

function prevDetailImage() {
  const total = state.activeDetailImages.length;
  if (total <= 1) return;
  state.activeDetailIndex = (state.activeDetailIndex - 1 + total) % total;
  renderDetailGallery();
}

function nextDetailImage() {
  const total = state.activeDetailImages.length;
  if (total <= 1) return;
  state.activeDetailIndex = (state.activeDetailIndex + 1) % total;
  renderDetailGallery();
}

function closeProductDetailModal() {
  document.getElementById('productDetailModal').classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
  const loupe = document.getElementById('imageZoomLoupe');
  if (loupe) loupe.classList.add('hidden');
  closeFullscreenLightbox();
}

function handleImageContainerClick(e) {
  // Si se hizo clic en las flechas prev/next del carrusel, no abrir pantalla completa
  if (e.target.closest('#detailPrevImageBtn') || e.target.closest('#detailNextImageBtn')) {
    return;
  }
  openFullscreenLightbox();
}

// ==========================================
// FULLSCREEN IMAGE LIGHTBOX (VISOR PANTALLA COMPLETA)
// ==========================================
let lightboxTouchStartX = 0;
let lightboxTouchEndX = 0;

function openFullscreenLightbox() {
  const lightbox = document.getElementById('fullscreenImageLightbox');
  if (!lightbox) return;

  const loupe = document.getElementById('imageZoomLoupe');
  if (loupe) loupe.classList.add('hidden');

  const prodNameEl = document.getElementById('detailModalName');
  const lightboxProdName = document.getElementById('lightboxProductName');
  if (lightboxProdName && prodNameEl) {
    lightboxProdName.innerText = prodNameEl.innerText;
  }

  lightbox.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  renderLightboxView();
  lucide.createIcons();

  // Soporte de deslizamiento táctil en celular (Swipe)
  if (!lightbox.dataset.swipeInitialized) {
    lightbox.dataset.swipeInitialized = 'true';
    lightbox.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        lightboxTouchStartX = e.touches[0].clientX;
      }
    }, { passive: true });

    lightbox.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        lightboxTouchEndX = e.changedTouches[0].clientX;
        handleLightboxSwipe();
      }
    }, { passive: true });
  }
}

function handleLightboxSwipe() {
  const diff = lightboxTouchStartX - lightboxTouchEndX;
  if (Math.abs(diff) > 40) {
    if (diff > 0) {
      nextLightboxImage(); // Deslizar izquierda -> siguiente foto
    } else {
      prevLightboxImage(); // Deslizar derecha -> foto anterior
    }
  }
}

function renderLightboxView() {
  const img = document.getElementById('lightboxMainImage');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  const counter = document.getElementById('lightboxPhotoCounter');
  const thumbnails = document.getElementById('lightboxThumbnailsStrip');

  const images = state.activeDetailImages || [];
  const total = images.length;
  const currentSrc = images[state.activeDetailIndex] || '';

  if (img) img.src = currentSrc;
  if (counter) counter.innerText = `${state.activeDetailIndex + 1} / ${total || 1}`;

  if (total > 1) {
    if (prevBtn) prevBtn.classList.remove('hidden');
    if (nextBtn) nextBtn.classList.remove('hidden');
    if (counter) counter.classList.remove('hidden');

    if (thumbnails) {
      thumbnails.classList.remove('hidden');
      thumbnails.innerHTML = images.map((src, idx) => `
        <div 
          onclick="switchLightboxImage(${idx})"
          class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 cursor-pointer flex-shrink-0 bg-black/50 transition-all ${
            idx === state.activeDetailIndex 
              ? 'border-brand-500 ring-2 ring-brand-400 scale-105 opacity-100 shadow-lg' 
              : 'border-white/20 opacity-50 hover:opacity-100'
          }"
        >
          <img src="${src}" alt="" class="w-full h-full object-cover">
        </div>
      `).join('');
    }
  } else {
    if (prevBtn) prevBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');
    if (thumbnails) thumbnails.innerHTML = '';
  }
}

function switchLightboxImage(idx) {
  if (idx >= 0 && idx < state.activeDetailImages.length) {
    state.activeDetailIndex = idx;
    renderLightboxView();
    renderDetailGallery(); // Sincroniza la tarjeta en segundo plano
  }
}

function prevLightboxImage() {
  const total = state.activeDetailImages.length;
  if (total <= 1) return;
  state.activeDetailIndex = (state.activeDetailIndex - 1 + total) % total;
  renderLightboxView();
  renderDetailGallery();
}

function nextLightboxImage() {
  const total = state.activeDetailImages.length;
  if (total <= 1) return;
  state.activeDetailIndex = (state.activeDetailIndex + 1) % total;
  renderLightboxView();
  renderDetailGallery();
}

function closeFullscreenLightbox() {
  const lightbox = document.getElementById('fullscreenImageLightbox');
  if (lightbox) lightbox.classList.add('hidden');
  renderDetailGallery(); // Refresca la foto activa en la tarjeta
  lucide.createIcons();
}

// Navegación por teclado (Flechas para fotos, Escape para cerrar)
document.addEventListener('keydown', (e) => {
  const lightbox = document.getElementById('fullscreenImageLightbox');
  const isLightboxOpen = lightbox && !lightbox.classList.contains('hidden');

  if (isLightboxOpen) {
    if (e.key === 'Escape') closeFullscreenLightbox();
    else if (e.key === 'ArrowLeft') prevLightboxImage();
    else if (e.key === 'ArrowRight') nextLightboxImage();
    return;
  }

  if (e.key === 'Escape') {
    closeProductDetailModal();
    if (typeof closeCartModal === 'function') closeCartModal();
    if (typeof closeProductModal === 'function') closeProductModal();
  }
});

// ==========================================
// INTERACTIVE IMAGE ZOOM LOUPE (MAGNIFYING GLASS)
// ==========================================
function initImageZoomLoupe() {
  const container = document.getElementById('detailImageContainer');
  const img = document.getElementById('detailModalImage');
  const loupe = document.getElementById('imageZoomLoupe');
  if (!container || !img || !loupe) return;

  const ZOOM_LEVEL = 2.4; // Factor de aumento 2.4x

  function updateLoupe(clientX, clientY, isTouch = false) {
    if (!img.src || img.naturalWidth === 0) return;

    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Comprobar si el cursor o dedo está sobre la imagen visible
    if (
      clientX < imgRect.left || clientX > imgRect.right ||
      clientY < imgRect.top || clientY > imgRect.bottom
    ) {
      loupe.classList.add('hidden');
      return;
    }

    loupe.classList.remove('hidden');

    const loupeWidth = loupe.offsetWidth || 150;
    const loupeHeight = loupe.offsetHeight || 150;

    // Coordenadas relativas a la imagen real
    const imgX = clientX - imgRect.left;
    const imgY = clientY - imgRect.top;

    // Coordenadas relativas al contenedor
    const containerX = clientX - containerRect.left;
    const containerY = clientY - containerRect.top;

    // Posición centrada en el cursor
    let loupeLeft = containerX - (loupeWidth / 2);
    let loupeTop = containerY - (loupeHeight / 2);

    // En celular (pantalla táctil), elevar la lupa 25px por encima del dedo para que el pulgar no la tape
    if (isTouch) {
      loupeTop = containerY - loupeHeight - 25;
      if (loupeTop < 5) {
        loupeTop = containerY + 25; // Si está muy arriba, colocarla abajo del dedo
      }
    }

    // Mantener la lupa dentro de los bordes del recuadro
    loupeLeft = Math.max(0, Math.min(containerRect.width - loupeWidth, loupeLeft));
    loupeTop = Math.max(0, Math.min(containerRect.height - loupeHeight, loupeTop));

    loupe.style.left = `${loupeLeft}px`;
    loupe.style.top = `${loupeTop}px`;

    // Configurar imagen de fondo con zoom nítido
    loupe.style.backgroundImage = `url("${img.src}")`;
    loupe.style.backgroundSize = `${imgRect.width * ZOOM_LEVEL}px ${imgRect.height * ZOOM_LEVEL}px`;

    const bgX = (imgX * ZOOM_LEVEL) - (loupeWidth / 2);
    const bgY = (imgY * ZOOM_LEVEL) - (loupeHeight / 2);

    loupe.style.backgroundPosition = `-${bgX}px -${bgY}px`;
  }

  function hideLoupe() {
    loupe.classList.add('hidden');
  }

  // Eventos de ratón (Computadora)
  container.addEventListener('mousemove', (e) => {
    updateLoupe(e.clientX, e.clientY, false);
  });
  container.addEventListener('mouseleave', hideLoupe);

  // Eventos táctiles (Celular)
  container.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length === 1) {
      updateLoupe(e.touches[0].clientX, e.touches[0].clientY, true);
    }
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches.length === 1) {
      if (e.cancelable) e.preventDefault();
      updateLoupe(e.touches[0].clientX, e.touches[0].clientY, true);
    }
  }, { passive: false });

  container.addEventListener('touchend', hideLoupe);
  container.addEventListener('touchcancel', hideLoupe);
}

// ==========================================
// SHOPPING CART & WHATSAPP CHECKOUT
// ==========================================
function loadSavedCart() {
  const saved = localStorage.getItem(LOCAL_CART_KEY);
  if (saved) {
    try {
      state.cart = JSON.parse(saved);
    } catch (e) {
      state.cart = [];
    }
  }
}

function saveCart() {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(state.cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById('cartCountBadge');
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (badge) {
    badge.innerText = totalItems;
    if (totalItems > 0) {
      badge.classList.remove('bg-brand-500');
      badge.classList.add('bg-emerald-500');
    } else {
      badge.classList.remove('bg-emerald-500');
      badge.classList.add('bg-brand-500');
    }
  }
}

function addToCart(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  if (Number(prod.stock) <= 0) {
    Swal.fire('Producto Agotado', 'Lo sentimos, este producto no tiene unidades disponibles.', 'info');
    return;
  }

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    if (existing.quantity >= prod.stock) {
      Swal.fire('Límite de Stock', `No puedes agregar más de ${prod.stock} unidades de este producto.`, 'warning');
      return;
    }
    existing.quantity += 1;
  } else {
    state.cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      image: prod.image,
      category: prod.category,
      quantity: 1
    });
  }

  saveCart();

  // Toast Notification
  const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  });
  Toast.fire({
    icon: 'success',
    title: `Agregado: ${prod.name}`
  });
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  renderCartItems();
  modal.classList.remove('hidden');
  modal.scrollTop = 0;
  document.body.classList.add('overflow-hidden');
  lucide.createIcons();
}

function closeCartModal() {
  document.getElementById('cartModal').classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  const emptyState = document.getElementById('cartEmptyState');
  const footer = document.getElementById('cartFooter');
  const totalVal = document.getElementById('cartTotalVal');
  const countText = document.getElementById('cartItemsCountText');

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  countText.innerText = totalItems;

  if (state.cart.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    footer.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  footer.classList.remove('hidden');

  let totalMoney = 0;

  list.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    totalMoney += itemTotal;

    return `
      <div class="py-3 flex items-center justify-between gap-3">
        <img src="${item.image}" alt="" class="w-14 h-14 rounded-xl object-cover border border-slate-200 bg-slate-100 flex-shrink-0">
        <div class="flex-1 min-w-0">
          <h5 class="text-xs font-bold text-slate-800 truncate">${item.name}</h5>
          <span class="text-[11px] text-slate-400 font-semibold">${formatMoney(item.price)} c/u</span>
          
          <div class="flex items-center gap-2 mt-1.5">
            <button onclick="updateCartItemQuantity('${item.id}', -1)" class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">-</button>
            <span class="text-xs font-bold text-slate-800 px-1">${item.quantity}</span>
            <button onclick="updateCartItemQuantity('${item.id}', 1)" class="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">+</button>
          </div>
        </div>

        <div class="text-right flex flex-col items-end">
          <span class="text-xs font-black text-slate-900">${formatMoney(itemTotal)}</span>
          <button onclick="removeCartItem('${item.id}')" class="text-slate-400 hover:text-rose-500 mt-2 p-1" title="Eliminar">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  totalVal.innerText = formatMoney(totalMoney);
  lucide.createIcons();
}

function updateCartItemQuantity(productId, change) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  const prod = state.products.find(p => p.id === productId);
  const maxStock = prod ? prod.stock : 999;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeCartItem(productId);
    return;
  }

  if (item.quantity > maxStock) {
    Swal.fire('Límite de Stock', `Solo hay ${maxStock} unidades disponibles.`, 'info');
    item.quantity = maxStock;
  }

  saveCart();
  renderCartItems();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCart();
  renderCartItems();
}

function clearCart() {
  state.cart = [];
  saveCart();
  renderCartItems();
}

// Direct Buy of Single Product via WhatsApp
function buyProductWhatsAppDirect(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  const wa = state.settings.whatsappNumber || '573001234567';
  const priceFormatted = formatMoney(prod.price);
  const message = `¡Hola *${state.settings.storeName}*! 👋%0A%0AEstoy interesado en comprar el siguiente producto de su tienda:%0A%0A🛍️ *${prod.name}*%0A📁 Categoría: ${prod.category}%0A💵 Precio: ${priceFormatted}%0A%0A¿Tienen disponibilidad para envío inmediato? ¡Muchas gracias!`;

  window.open(`https://wa.me/${wa}?text=${message}`, '_blank');
}

// Checkout Entire Cart via WhatsApp
function checkoutViaWhatsApp() {
  if (state.cart.length === 0) return;

  const customerName = document.getElementById('checkoutCustomerName').value.trim();
  const customerAddress = document.getElementById('checkoutCustomerAddress').value.trim();
  const wa = state.settings.whatsappNumber || '573001234567';

  let itemsSummary = '';
  let grandTotal = 0;

  state.cart.forEach((item, index) => {
    const sub = item.price * item.quantity;
    grandTotal += sub;
    itemsSummary += `${index + 1}. *${item.name}* x${item.quantity} = ${formatMoney(sub)}%0A`;
  });

  const message = `¡Hola *${state.settings.storeName}*! 👋 Deseo realizar el siguiente pedido:%0A%0A📦 *PRODUCTOS:*%0A${itemsSummary}%0A💰 *TOTAL A PAGAR:* ${formatMoney(grandTotal)}%0A%0A👤 *CLIENTE:* ${customerName || 'No especificado'}%0A📍 *DIRECCIÓN / CIUDAD:* ${customerAddress || 'Por acordar'}%0A%0A¿Me confirman los métodos de pago disponibles para proceder? ¡Gracias!`;

  window.open(`https://wa.me/${wa}?text=${message}`, '_blank');
}

function contactWhatsAppDirect() {
  const wa = state.settings.whatsappNumber || '573001234567';
  const msg = `¡Hola *${state.settings.storeName}*! Quisiera información sobre sus productos.`;
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==========================================
// FACEBOOK MARKETPLACE IMPORT HELPERS
// ==========================================
async function copyFacebookExtractorScript() {
  try {
    const res = await fetch('/extractor_facebook.js');
    if (!res.ok) throw new Error('No se pudo cargar el script del servidor');
    const scriptCode = await res.text();
    await navigator.clipboard.writeText(scriptCode);
    
    Swal.fire({
      icon: 'success',
      title: '¡Script Copiado con Éxito!',
      html: `
        <div class="text-left text-xs space-y-2 text-slate-600">
          <p><strong>Pasos para ejecutarlo en Facebook:</strong></p>
          <ol class="list-decimal pl-4 space-y-1">
            <li>Abre tu pestaña de <a href="https://www.facebook.com/marketplace/you/selling" target="_blank" class="text-blue-600 font-bold underline">Facebook Marketplace - Tus Publicaciones</a>.</li>
            <li>Presiona <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border">F12</kbd> (o clic derecho &gt; <em>Inspeccionar</em>) y ve a la pestaña <strong>Consola (Console)</strong>.</li>
            <li>Pega el código copiado (<kbd class="px-1.5 py-0.5 bg-slate-100 rounded border">Ctrl + V</kbd>) y presiona <kbd class="px-1.5 py-0.5 bg-slate-100 rounded border">Enter</kbd>.</li>
          </ol>
          <p class="pt-2 text-emerald-600 font-semibold">¡Aparecerá una ventana flotante de Mao Store que descargará las fotos en carpetas y cargará todo automáticamente!</p>
        </div>
      `,
      confirmButtonText: 'Entendido, ir a Facebook',
      confirmButtonColor: '#4f46e5',
      showCancelButton: true,
      cancelButtonText: 'Cerrar'
    }).then((result) => {
      if (result.isConfirmed) {
        window.open('https://www.facebook.com/marketplace/you/selling', '_blank');
      }
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error al copiar',
      text: err.message
    });
  }
}

async function handleManualFacebookImport() {
  const input = document.getElementById('manualFbJsonInput');
  const raw = (input ? input.value : '').trim();
  if (!raw) {
    return Swal.fire({
      icon: 'warning',
      title: 'Campo vacío',
      text: 'Por favor pega la información JSON de los productos a importar.'
    });
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return Swal.fire({
      icon: 'error',
      title: 'Formato inválido',
      text: 'El texto ingresado no es un JSON válido. Asegúrate de copiar el JSON completo generado por el extractor.'
    });
  }

  Swal.fire({
    title: 'Importando productos...',
    text: 'Descargando fotos y creando carpetas locales para cada producto.',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch('/api/facebook/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Error en el servidor al importar');

    await fetchStoreData();
    renderProducts();
    renderAdminProducts();
    renderCategories();

    Swal.fire({
      icon: 'success',
      title: '¡Importación Exitosa!',
      html: `
        <div class="text-sm text-slate-600 space-y-1">
          <p><strong>Nuevos productos creados:</strong> ${result.importedCount || 0}</p>
          <p><strong>Productos actualizados:</strong> ${result.updatedCount || 0}</p>
          <p><strong>Total en inventario:</strong> ${result.totalProducts || state.products.length}</p>
          <p class="text-xs text-slate-500 pt-2">Las imágenes fueron descargadas y organizadas en sus respectivas carpetas dentro de <code>uploads/</code>.</p>
        </div>
      `,
      confirmButtonText: 'Ver Productos',
      confirmButtonColor: '#4f46e5'
    }).then(() => {
      switchAdminTab('products');
    });

    if (input) input.value = '';
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Error de importación',
      text: err.message
    });
  }
}
