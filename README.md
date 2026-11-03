# 🛍️ MAO STORE - Tienda Web & Catálogo por Categorías

¡Bienvenido a **MAO STORE**! Un sitio web moderno, rápido y completo de comercio electrónico diseñado para que puedas subir fotos de tus productos, organizar tu catálogo por categorías y recibir pedidos directos a través de WhatsApp.

---

## 🚀 ¿Cómo Iniciar la Tienda?

Tienes dos opciones súper sencillas:

### Opción 1: Iniciar con Servidor Completo (Recomendado)
Haz doble clic sobre el archivo:
👉 **`iniciar_tienda.bat`**

Esto iniciará el servidor web local y abrirá automáticamente tu navegador en:
**`http://localhost:3000`**

*En este modo, las imágenes que subas desde tu computadora se guardan en la carpeta `/uploads` y todos los productos se guardan en la base de datos `data/store.json`.*

### Opción 2: Modo Directo en Navegador
Haz doble clic sobre:
👉 **`abrir_directo.bat`** o abre directamente `public/index.html` en Chrome, Edge o tu navegador preferido. Todo funcionará guardándose en la memoria local de tu navegador.

---

## ✨ Características Principales

1. **Subida de Imágenes y Productos:**
   - Sube fotos directamente desde los archivos de tu computador (arrastrar y soltar o explorador de archivos).
   - Opcionalmente puedes pegar la URL de una foto en internet.
   - Vista previa instantánea antes de publicar.
   - Datos completos del producto: Nombre, Categoría, Precio de venta, Precio anterior (para mostrar descuento), Stock disponible, Descripción detallada y casilla para "Destacar".

2. **Visualización y Filtro por Categorías:**
   - Botones rápidos tipo "pills" para cambiar de categoría con un clic (`Todas`, `Ropa`, `Calzado`, `Tecnología`, `Accesorios`, etc.).
   - Contador dinámico de cuántos productos hay en cada categoría.
   - Creación de nuevas categorías personalizadas desde el panel.

3. **Buscador en Tiempo Real y Ordenamiento:**
   - Filtra productos instantáneamente mientras escribes en la barra de búsqueda.
   - Ordena por: *Más recientes*, *Menor precio*, *Mayor precio*, *Nombre (A-Z)*.

4. **Ventas y Pedidos por WhatsApp:**
   - **Botón "Comprar por WhatsApp" en cada producto:** Abre un mensaje prediseñado preguntando por ese artículo específico.
   - **Carrito de Compras Completo:** Los clientes pueden añadir múltiples productos, definir cantidades, escribir su nombre y dirección, y enviar el pedido consolidado en un solo mensaje de WhatsApp.

5. **Panel de Administración (Admin):**
   - Acceso con un clic en el botón **"Panel Admin"** del encabezado.
   - Pestaña **Productos**: tabla de inventario con opción de editar, eliminar y cambiar stock.
   - Pestaña **Categorías**: crear y eliminar categorías.
   - Pestaña **Configuración**: cambiar el nombre de la tienda, slogan, símbolo de moneda y el número de WhatsApp receptor.

---

## 📁 Estructura del Proyecto

```text
mao-store/
├── data/
│   └── store.json          # Base de datos JSON de productos y categorías
├── public/
│   ├── css/
│   │   └── styles.css      # Estilos personalizados y animaciones
│   ├── js/
│   │   └── app.js          # Lógica interactiva, filtros, carrito y CRUD
│   └── index.html          # Interfaz principal (Tienda + Panel Admin)
├── uploads/                # Carpeta donde se guardan las fotos subidas
├── server.js               # Servidor Node.js ligero sin dependencias externas
├── iniciar_tienda.bat      # Lanzador con 1 clic (Servidor + Navegador)
├── abrir_directo.bat       # Lanzador directo sin servidor
└── README.md
```

---

## ⚙️ Configurar tu número de WhatsApp

1. Abre la tienda y haz clic en **"Panel Admin"** arriba a la derecha.
2. Ve a la pestaña **"Configuración Tienda"**.
3. En el campo **Número de WhatsApp**, introduce tu número con el código de país (ejemplo: `573001234567` para Colombia).
4. Haz clic en **"Guardar Configuración"**.
