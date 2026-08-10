/* ============================================================
   DESTINY — datos del blog (64 artículos)
   ============================================================ */
window.DESTINY_BLOG = (function () {
  "use strict";
  const U = "https://blog.destiny.mx/blog/tips-invertir/";
  // [título, slug, año, fechaLabel, mes(0-11), día, enBlog?]
  //   — orden cronológico desc
  //   — enBlog=1: el artículo vive en blog.destiny.mx y la tarjeta enlaza directo allá.
  //     Los que no lo llevan se leen con Articulo.html, que necesita su archivo
  //     en articles/<slug>.html; sin ese archivo la página dice "se está preparando".
  const ROWS = [
    ["Del TCO a las llaves: la letra chica de la entrega", "tco-a-las-llaves-entrega-preconstruccion", 2026, "14 ago 2026", 7, 14, 1],
    ["1428 Brickell: qué te dice el crédito de $565M de JPMorgan", "1428-brickell-credito-jpmorgan", 2026, "12 ago 2026", 7, 12, 1],
    ["Crédito para extranjero en Miami: cómo financiar sin historial en EE.UU.", "credito-extranjero-miami-2026", 2026, "10 ago 2026", 7, 10, 1],
    ["Los costos de cierre en preconstrucción que no vienen en el price list", "costos-de-cierre-preconstruccion-price-list", 2026, "7 ago 2026", 7, 7, 1],
    ["Frida Kahlo Wynwood Residences: qué compras cuando compras una marca", "frida-kahlo-wynwood-residences-analisis", 2026, "5 ago 2026", 7, 5, 1],
    ["FIRPTA: por qué te retienen el 15% al vender en Estados Unidos", "firpta-retencion-15-por-ciento-vender-propiedad-estados-unidos", 2026, "3 ago 2026", 7, 3, 1],
    ["Developer fee y capital contribution: la letra chica de tu preconstrucción", "costos-de-cierre-preconstruccion-miami", 2026, "31 jul 2026", 6, 31, 1],
    ["Bentley Residences: qué estás comprando de verdad en Sunny Isles", "bentley-residences-miami", 2026, "29 jul 2026", 6, 29, 1],
    ["Dos números de junio que no deberían poder existir juntos", "mercado-inmobiliario-miami-2026", 2026, "27 jul 2026", 6, 27, 1],
    ["El condo barato que sale caro: la letra chica del HOA", "condo-barato-letra-chica-hoa-miami", 2026, "24 jul 2026", 6, 24, 1],
    ["Se acabó el Mundial: lo que el discurso de venta esperaba que no notaras", "se-acabo-el-mundial-discurso-de-venta-miami", 2026, "22 jul 2026", 6, 22, 1],
    ["Miami no es un mercado. Son dos, y te están promediando", "miami-no-es-un-mercado-son-dos", 2026, "21 jul 2026", 6, 21, 1],
    ["El premium de marca en Miami: cuánto pagas de más y cuándo lo recuperas", "premium-residencias-marca-miami", 2026, "1 jun 2026", 5, 1],
    ["St. Regis, Cipriani y The Standard: qué marca renta y cuál solo presume", "marcas-miami-renta-vs-prestigio", 2026, "26 may 2026", 4, 26],
    ["Las 3 señales de que el sobreprecio de una marca NO lo recuperas en reventa", "premium-marca-reventa-cuando-no", 2026, "19 may 2026", 4, 19],
    ["Por qué el empresario mexicano inteligente ya movió parte de su patrimonio a Miami (y tú todavía no)", "invertir-en-miami-proteger-patrimonio-2026", 2026, "23 feb 2026", 1, 23, 1],
    ["¿Tu patrimonio está seguro en México? Cómo dolarizar tu legado en Miami con respaldo legal", "invertir-miami-desde-mexico-blindaje-patrimonial", 2026, "7 feb 2026", 1, 7, 1],
    ["Financiamiento inmobiliario en Miami: guía estratégica para inversionistas con capital", "financiamiento-inmobiliario-miami-inversionistas", 2026, "23 ene 2026", 0, 23, 1],
    ["7 claves del título de propiedad en Miami que todo extranjero debe conocer", "titulo-propiedad-miami-extranjeros", 2026, "16 ene 2026", 0, 16, 1],
    ["Invertir en Miami siendo extranjero en 2026 | Guía completa", "invertir-miami-siendo-extranjero", 2026, "9 ene 2026", 0, 9, 1],
    ["Cuándo invertir y cuándo no: lecciones de Tulum, Acapulco, CDMX y Mérida", "mejores-ciudades-invertir-bienes-raices-cuando", 2025, "31 dic 2025", 11, 31, 1],
    ["¿Realmente está por colapsar la economía mexicana? Análisis sin sensacionalismo", "economia-mexicana-analisis-real-inversionistas", 2025, "13 dic 2025", 11, 13, 1],
    ["Invertir en Miami desde México: guía completa con respaldo legal", "invertir-en-miami-desde-mexico-guia-completa", 2025, "10 dic 2025", 11, 10, 1],
    ["¿Qué pasa si no pago la hipoteca en Miami? Guía completa", "que-pasa-si-no-pago-hipoteca-miami", 2025, "8 dic 2025", 11, 8, 1],
    ["Título de propiedad en Estados Unidos: la verdad sobre la seguridad de tu inversión", "titulo-propiedad-estados-unidos-inversionistas-mexicanos", 2025, "6 dic 2025", 11, 6, 1],
    ["¿Pueden quitarte tu propiedad en Estados Unidos? Mitos y realidades", "seguridad-juridica-propiedad-estados-unidos-extranjeros", 2025, "25 nov 2025", 10, 25, 1],
    ["Inversión inmobiliaria en Miami: tips a tomar en cuenta", "inversion-inmobiliaria-miami-tips", 2025, "21 oct 2025", 9, 21, 1],
    ["Real Estate de lujo en Miami 2025: las 7 tendencias que dominan el mercado", "real-estate-de-lujo-en-miami", 2025, "21 oct 2025", 9, 21, 1],
    ["South Beach: la playa favorita de Miami", "south-beach", 2025, "27 jun 2025", 5, 27, 1],
    ["Inversionistas latinoamericanos, ¿qué buscan en Miami?", "inversionistas-latinoamericanos", 2021, "15 nov 2021", 10, 15, 1],
    ["La importancia del asesor inmobiliario", "asesor-inmobiliario", 2021, "4 ago 2021", 7, 4, 1],
    ["¿Cómo disminuir el riesgo financiero?", "como-disminuir-el-riesgo-financiero", 2021, "19 jul 2021", 6, 19, 1],
    ["¿Qué es el ROI inmobiliario y cómo calcularlo?", "roi-inmobilidario", 2021, "10 jul 2021", 6, 10, 1],
    ["Mercado inmobiliario de Estados Unidos", "mercado-inmobiliario-de-estados-unidos", 2021, "6 jul 2021", 6, 6, 1],
    ["Hoteles en Miami: 6 fascinantes opciones", "hoteles-en-miami", 2021, "5 jul 2021", 6, 5, 1],
    ["Consecuencias de la pandemia en el Real Estate", "consecuencias-de-la-pandemia", 2021, "21 jun 2021", 5, 21, 1],
    ["Invertir en propiedades en Miami: ¿por qué?", "invertir-en-propiedades-en-miami", 2021, "18 jun 2021", 5, 18, 1],
    ["Inversiones en línea: ventajas y desventajas", "inversiones-en-linea", 2021, "15 jun 2021", 5, 15, 1],
    ["Bienes raíces en Estados Unidos: 6 motivos", "bienes-raices-en-estados-unidos", 2021, "7 jun 2021", 5, 7, 1],
    ["¿Cómo comprar propiedades en el extranjero?", "como-comprar-propiedades-en-el-extranjero", 2021, "2 jun 2021", 5, 2, 1],
    ["Negocios inmobiliarios en Estados Unidos", "negocios-inmobiliarios-en-estados-unidos", 2021, "31 may 2021", 4, 31, 1],
    ["Compras en Miami: los 6 mejores lugares", "compras-en-miami", 2021, "26 may 2021", 4, 26, 1],
    ["Mejores países para invertir en 2021", "mejores-paises-para-invertir", 2021, "24 may 2021", 4, 24, 1],
    ["¿Miami es seguro? Sus zonas más seguras", "miami-es-seguro", 2021, "21 may 2021", 4, 21, 1],
    ["Invertir en Estados Unidos para obtener la residencia", "invertir-en-estados-unidos-para-obtener-la-residencia", 2021, "20 may 2021", 4, 20, 1],
    ["Proyectos inmobiliarios en Miami", "proyectos-inmobiliarios-en-miami", 2021, "11 may 2021", 4, 11, 1],
    ["Financiamiento en Estados Unidos", "financiamiento-en-estados-unidos", 2021, "6 may 2021", 4, 6, 1],
    ["¿Cómo empezar a invertir en bienes raíces?", "como-empezar-a-invertir-en-bienes-raices", 2021, "3 may 2021", 4, 3, 1],
    ["Invertir en otro país: 5 errores a evitar", "invertir-en-otro-pais", 2021, "28 abr 2021", 3, 28, 1],
    ["Administración de propiedades", "administracion-de-propiedades", 2021, "27 abr 2021", 3, 27, 1],
    ["¿Qué es FIRPTA y cómo afecta mi inversión?", "firpta", 2021, "25 abr 2021", 3, 25, 1],
    ["Rentas en Miami: todo lo que necesitas saber", "rentas-en-miami", 2021, "21 abr 2021", 3, 21, 1],
    ["Restaurantes en Miami que debes conocer", "restaurantes-en-miami", 2021, "19 abr 2021", 3, 19, 1],
    ["Fraudes inmobiliarios: 4 consejos para evitarlos", "fraudes-inmobiliarios", 2021, "13 abr 2021", 3, 13, 1],
    ["Inversionista extranjero en EE.UU.", "inversionista-extranjero", 2021, "7 abr 2021", 3, 7, 1],
    ["La mejor vida nocturna de Miami", "vida-nocturna-de-miami", 2021, "5 abr 2021", 3, 5, 1],
    ["Departamentos en preventa: 6 consejos", "departamentos-en-preventa", 2021, "29 mar 2021", 2, 29, 1],
    ["Tipos de inversiones que debes conocer", "tipos-de-inversiones", 2021, "26 mar 2021", 2, 26, 1],
    ["Cómo abrir una empresa en Estados Unidos", "como-abrir-una-empresa-en-estados-unidos", 2021, "24 mar 2021", 2, 24, 1],
    ["Mejores zonas de Miami para invertir", "zonas-de-miami", 2021, "22 mar 2021", 2, 22, 1],
    ["Visas de inversionista E-2 y EB-5", "visas-de-inversionista", 2021, "16 mar 2021", 2, 16, 1],
    ["Invertir en criptomonedas: ¿vale la pena?", "invertir-en-criptomonedas", 2021, "9 mar 2021", 2, 9, 1],
    ["¿Cómo generar más dinero?", "como-generar-mas-dinero", 2021, "3 mar 2021", 2, 3, 1],
    ["Miami es caro para vivir… ¿o no?", "miami-es-caro-para-vivir", 2021, "27 feb 2021", 1, 27, 1],
  ];

  // Portadas de cada artículo, por slug. El home NO consulta el API de
  // WordPress, así que las imágenes se congelan aquí: las genera
  // scripts/blog-imgs.py, que las va a buscar al blog y resuelve con el banco
  // local las de los artículos que no tienen imagen destacada asignada.
  //
  //   python3 scripts/blog-imgs.py
  //
  // NO editar a mano el bloque de abajo: se reescribe completo. Si quieres
  // fijar la portada de un artículo, ponla en OVERRIDES dentro del script.
  const IMGS = { /* AUTO:INICIO */
    "tco-a-las-llaves-entrega-preconstruccion": "assets/img/hero-living.jpg",
    "1428-brickell-credito-jpmorgan": "assets/img/1428/ext.jpg",
    "credito-extranjero-miami-2026": "assets/img/hero-bluehour.jpg",
    "costos-de-cierre-preconstruccion-price-list": "assets/img/midtownpark/exterior.jpg",
    "frida-kahlo-wynwood-residences-analisis": "assets/img/frida/hero.jpg",
    "firpta-retencion-15-por-ciento-vender-propiedad-estados-unidos": "https://blog.destiny.mx/wp-content/uploads/2026/08/firpta-retencion-venta-propiedad-miami-800x560.jpg",
    "costos-de-cierre-preconstruccion-miami": "https://blog.destiny.mx/wp-content/uploads/2026/07/costos-de-cierre-preconstruccion-miami-800x560.jpg",
    "bentley-residences-miami": "https://blog.destiny.mx/wp-content/uploads/2026/07/bentley-residences-miami-800x560.jpg",
    "mercado-inmobiliario-miami-2026": "https://blog.destiny.mx/wp-content/uploads/2026/07/mercado-inmobiliario-miami-2026-800x560.jpg",
    "condo-barato-letra-chica-hoa-miami": "https://blog.destiny.mx/wp-content/uploads/2026/07/condo-barato-letra-chica-hoa-miami-800x560.jpg",
    "se-acabo-el-mundial-discurso-de-venta-miami": "https://blog.destiny.mx/wp-content/uploads/2026/07/se-acabo-el-mundial-discurso-de-venta-miami-800x560.jpg",
    "miami-no-es-un-mercado-son-dos": "https://blog.destiny.mx/wp-content/uploads/2026/07/miami-no-es-un-mercado-son-dos-800x560.jpg",
    "premium-residencias-marca-miami": "assets/img/mandarin/hero.jpg",
    "marcas-miami-renta-vs-prestigio": "assets/img/stregis-brickell/hero.jpg",
    "premium-marca-reventa-cuando-no": "assets/img/cipriani/hero.jpg",
    "invertir-en-miami-proteger-patrimonio-2026": "assets/img/hero-miami.jpg",
    "invertir-miami-desde-mexico-blindaje-patrimonial": "assets/img/hero-bahia.jpg",
    "financiamiento-inmobiliario-miami-inversionistas": "assets/img/hero-dusk.jpg",
    "titulo-propiedad-miami-extranjeros": "assets/img/onepark/hero.jpg",
    "invertir-miami-siendo-extranjero": "assets/img/blog-skyline.jpg",
    "mejores-ciudades-invertir-bienes-raices-cuando": "assets/img/hero-turquesa.jpg",
    "economia-mexicana-analisis-real-inversionistas": "assets/img/hero-bluehour.jpg",
    "invertir-en-miami-desde-mexico-guia-completa": "assets/img/blog-skyline2.jpg",
    "que-pasa-si-no-pago-hipoteca-miami": "assets/img/viceroy/exterior.jpg",
    "titulo-propiedad-estados-unidos-inversionistas-mexicanos": "assets/img/rivage/dusk.jpg",
    "seguridad-juridica-propiedad-estados-unidos-extranjeros": "assets/img/stregis-brickell/entrance.jpg",
    "inversion-inmobiliaria-miami-tips": "assets/img/hero-pool.jpg",
    "real-estate-de-lujo-en-miami": "https://blog.destiny.mx/wp-content/uploads/2026/04/casa-bella-18-800x560.webp",
    "south-beach": "assets/img/faena/beach.jpg",
    "fraudes-inmobiliarios": "https://blog.destiny.mx/wp-content/uploads/2026/05/pagani17-1-800x560.webp",
    "vida-nocturna-de-miami": "https://blog.destiny.mx/wp-content/uploads/2026/05/St-Regis-Sunny-Isles-4-800x560.webp",
    "departamentos-en-preventa": "https://blog.destiny.mx/wp-content/uploads/2026/05/SRRSIB-9-800x560.webp",
    "tipos-de-inversiones": "https://blog.destiny.mx/wp-content/uploads/2026/05/turnberry_shortFilm_Opt-1_1.mp4",
    "como-abrir-una-empresa-en-estados-unidos": "https://blog.destiny.mx/wp-content/uploads/2026/05/onepark-interiores-1-800x560.webp",
    "zonas-de-miami": "https://blog.destiny.mx/wp-content/uploads/2026/05/onepark-interiores-13-800x560.webp",
    "visas-de-inversionista": "https://blog.destiny.mx/wp-content/uploads/2026/05/1428-brickell-20-800x560.webp",
  /* AUTO:FIN */ };

  // Respaldo para el archivo de 2021, que se quedó sin portada cuando la
  // migración dejó huérfanos sus adjuntos. Rota por posición para que no salgan
  // veinte tarjetas con la misma foto.
  const IMG_POOL = [
    "assets/img/blog-skyline2.jpg",
    "assets/img/hero-bluehour.jpg",
    "assets/img/hero-bahia.jpg",
    "assets/img/blog-skyline.jpg",
    "assets/img/hero-dusk.jpg"
  ];

  const POSTS = ROWS
    // Las entradas programadas se listan aquí desde ya, pero sólo aparecen el día
    // que el blog las publica (9:00). Así no hay que volver a tocar este archivo.
    .filter(p => new Date(p[2], p[4], p[5], 9, 0, 0) <= new Date())
    .map((p, i) => ({
      title: p[0],
      url: p[6] ? U + p[1] + "/" : "Articulo.html?post=" + p[1],
      src: U + p[1] + "/",
      slug: p[1],
      year: p[2],
      date: p[3],
      img: IMGS[p[1]] || IMG_POOL[i % IMG_POOL.length]
    }));

  return { POSTS };
})();
