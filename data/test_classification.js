const fs = require('fs');
const path = require('path');

const store = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8'));

function classifyProduct(title, desc) {
  const text = `${title} ${desc || ''}`.toLowerCase();

  // 1. Audio y Videojuegos
  if (/gamer|ps5|ps4|xbox|switch|juegos|teclado mec[aá]nico|mouse gamer|auricular|headset|headphone|earphone|parlante|altavoz|soundbar|barra de sonido|subwoofer|karaoke|micr[oó]fono|bengoo|nubwo|kinglucky|jbl|soulion|oraimo|senzer/.test(text)) {
    return 'Audio y Videojuegos';
  }

  // 2. Vehículos y Motos
  if (/carplay|dash cam|coche|carro|moto\b|motocicleta|veh[ií]culo|bater[ií]as de carro|cargador y recuperador|inflador|compresor.*150 psi|compresor de aire|soporte.*motocicleta|soporte.*espejo.*carro|renault|apache|xr 190|aceite bajaj|impermeable.*colombiano|pijama calibre/.test(text)) {
    return 'Vehículos y Accesorios';
  }

  // 3. Belleza y Cuidado Personal
  if (/minoxidil|vitamina e|vitamina c|antioxidante|cuidado.*piel|anti acn[eé]|parche anti|ácido|salicilico|hilau|contorno de ojos|afeitad|rasurad|cortadora de barba|masaje muscular|pistola de masaje|cotsoco|irrigador bucal|limpieza dental|limpiador|jabon|c[uú]rcuma|k[oó]jico|humificador|difusor/.test(text)) {
    return 'Belleza y Cuidado Personal';
  }

  // 4. Bolsos y Accesorios de Moda
  if (/bolso|cartera|mochila|billetera|tote|satchel|reloj|watch|pulsera|joya|cadena|dije|gafas|lentes/.test(text)) {
    return 'Bolsos y Accesorios';
  }

  // 5. Calzado
  if (/zapato|calzado|tenis|sneaker|bota|botas|sandalia|v[eé]lez/.test(text)) {
    return 'Calzado';
  }

  // 6. Moda y Ropa
  if (/camisa|camiseta|pantalon|pantalón|chaqueta|abrigo|blusa|falda|ropa|buzo|pijama|vestido/.test(text)) {
    return 'Moda y Ropa';
  }

  // 7. Hogar y Cocina
  if (/edred[oó]n|s[aá]bana|cama|almohada|cobija|manta|toalla|ducha|estantes para ducha|organizador.*fregadero|soporte de esponja|ventilador|levoit|mezcladora|procesador de alimentos|pulidora|botell[oó]n de agua|extractor.*agua|vaso stanley|quencher|termo|botella.*agua|bombilla|alexa inteligente a19|foco|luz led solar|luces solares|almohadilla t[eé]rmica/.test(text)) {
    return 'Hogar y Cocina';
  }

  // 8. Deportes y Fitness
  if (/gimnasio|fitness|flexiones|mancuerna|ejercicio|yoga|deporte/.test(text)) {
    return 'Deportes y Fitness';
  }

  // 9. Juguetes y Coleccionables
  if (/terrifier|funko|jenga|juguete|fidget|peluche|infantil|niños|piscina inflable|biling[uü]e libro/.test(text)) {
    return 'Juguetes y Coleccionables';
  }

  // 10. Plataformas Streaming
  if (/spotify|sp0t1f|netflix|disney|prime video|streaming|cuenta/.test(text)) {
    return 'Plataformas Streaming';
  }

  // 11. Tecnología y Computación (general tech, devices, tablets, monitors, cameras, etc.)
  if (/tablet|android|proyector|goodee|monitor|fhd|pantalla|c[aá]mara|camara|wifi|cloarks|blurams|gncc|tr[ií]pode|gimbal|estabilizador|ugreen|adaptador|hub usb|usb c|cargador|power bank|bater[ií]a port[aá]til|cable de carga|impresora|etiquetadora|trackball|mouse|teclado/.test(text)) {
    return 'Tecnología y Computación';
  }

  // Default fallback if really nothing matches
  return 'Tecnología y Computación';
}

const distribution = {};
const sampleReclassifications = [];

for (const p of store.products) {
  const oldCat = p.category;
  const newCat = classifyProduct(p.name, p.description);
  distribution[newCat] = (distribution[newCat] || 0) + 1;

  if (oldCat === 'General' || oldCat !== newCat) {
    sampleReclassifications.push({
      name: p.name.substring(0, 45),
      from: oldCat,
      to: newCat
    });
  }
}

console.log('--- NEW CATEGORY DISTRIBUTION ---');
console.table(distribution);

console.log(`\nTotal products reclassified: ${sampleReclassifications.length} / ${store.products.length}`);
console.log('\nSample reclassifications:');
sampleReclassifications.slice(0, 25).forEach((r, i) => {
  console.log(`${i + 1}. "${r.name}" -> [${r.from}] ===> [${r.to}]`);
});
