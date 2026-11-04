const fs = require('fs');
const path = require('path');

const store = JSON.parse(fs.readFileSync(path.join(__dirname, 'store.json'), 'utf8'));

function classifyProduct(title, desc) {
  const text = `${title} ${desc || ''}`.toLowerCase();

  // 1. Plataformas y Cuentas Streaming
  if (/spotify|sp0t1f|netflix|disney|prime video|youtube|streaming|sin anuncios|pantallas 2026/.test(text)) {
    return 'Plataformas Streaming';
  }

  // 2. Calzado
  if (/zapato|calzado|tenis|sneaker|bota|botas|sandalia|v[eé]lez/.test(text)) {
    return 'Calzado';
  }

  // 3. Moda y Ropa
  if (/camisa|camiseta|pantalon|pantalón|chaqueta|abrigo|blusa|falda|ropa|buzo|pijama.*colombian|vestido/.test(text)) {
    return 'Moda y Ropa';
  }

  // 4. Bolsos y Accesorios
  if (/bolso|cartera|mochila|billetera|tote|satchel|reloj|watch|pulsera|joya|cadena|dije|gafas|lentes/.test(text)) {
    return 'Bolsos y Accesorios';
  }

  // 5. Deportes y Fitness
  if (/gimnasio|fitness|flexiones|mancuerna|ejercicio|yoga|deporte/.test(text)) {
    return 'Deportes y Fitness';
  }

  // 6. Belleza y Cuidado Personal
  if (/minoxidil|vitamina e|vitamina c|cuidado.*piel|anti acn[eé]|parche anti|ácido|salicilico|hilau|contorno de ojos|afeitar|afeitadora|rasurad|cortadora de barba|corte de pelo|depilad|masaje muscular|pistola de masaje|cotsoco|masajeador|irrigador bucal|limpieza dental|limpiador|jabon|c[uú]rcuma|k[oó]jico|humificador|difusor/.test(text)) {
    return 'Belleza y Cuidado Personal';
  }

  // 7. Vehículos y Accesorios
  if (/carplay|dash cam|coche|carro\b|moto\b|motos\b|motocicleta|veh[ií]culo|bater[ií]as de carro|cargador.*bater[ií]a|trickle charger|inflador|compresor.*psi|soporte.*motocicleta|soporte.*espejo.*carro|renault|apache|xr 190|aceite bajaj|impermeable.*colombiano/.test(text)) {
    return 'Vehículos y Accesorios';
  }

  // 8. Audio y Sonido
  if (/auricular|headset|headphone|earphone|parlante|altavoz|altavoces|soundbar|barra de sonido|subwoofer|karaoke|micr[oó]fono|jbl|soulion|oraimo|senzer|bengoo|nubwo|kinglucky/.test(text)) {
    return 'Audio y Videojuegos';
  }

  // 9. Juguetes y Coleccionables
  if (/terrifier|funko|jenga|juguete|fidget|peluche|infantil|niños|piscina inflable|biling[uü]e libro|stitch taza/.test(text)) {
    return 'Juguetes y Coleccionables';
  }

  // 10. Hogar y Cocina
  if (/edred[oó]n|s[aá]bana|cama|almohada|cobija|manta|toalla|ducha|estantes para ducha|organizador.*fregadero|soporte de esponja|ventilador|levoit|mezcladora|procesador de alimentos|pulidora|botell[oó]n de agua|extractor.*agua|dispensador de agua|vaso stanley|quencher|termo|botella.*agua|bombilla|alexa inteligente a19|foco|luz led solar|luces solares|almohadilla t[eé]rmica/.test(text)) {
    return 'Hogar y Cocina';
  }

  // 11. Tecnología y Computación (monitors, laptops, tablets, chargers, cables, cams, etc.)
  return 'Tecnología y Computación';
}

const distribution = {};
for (const p of store.products) {
  const cat = classifyProduct(p.name, p.description);
  distribution[cat] = (distribution[cat] || 0) + 1;
}

console.log('--- FINAL REFINED CATEGORY DISTRIBUTION ---');
console.table(distribution);
