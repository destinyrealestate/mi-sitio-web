/* ============================================================
   DESTINY — datos del blog (48 artículos de destiny.mx/blog)
   ============================================================ */
window.DESTINY_BLOG = (function () {
  "use strict";
  const U = "https://destiny.mx/blog/tips-invertir/";
  // [título, slug, año, fechaLabel, mes(0-11), día]  — orden cronológico desc
  const POSTS = [
    ["El premium de marca en Miami: cuánto pagas de más y cuándo lo recuperas", "premium-residencias-marca-miami", 2026, "1 jun 2026", 5, 1],
    ["St. Regis, Cipriani y The Standard: qué marca renta y cuál solo presume", "marcas-miami-renta-vs-prestigio", 2026, "26 may 2026", 4, 26],
    ["Las 3 señales de que el sobreprecio de una marca NO lo recuperas en reventa", "premium-marca-reventa-cuando-no", 2026, "19 may 2026", 4, 19],
    ["Por qué el empresario mexicano inteligente ya movió parte de su patrimonio a Miami (y tú todavía no)", "invertir-en-miami-proteger-patrimonio-2026", 2026, "23 feb 2026", 1, 23],
    ["¿Tu patrimonio está seguro en México? Cómo dolarizar tu legado en Miami con respaldo legal", "invertir-miami-desde-mexico-blindaje-patrimonial", 2026, "7 feb 2026", 1, 7],
    ["Financiamiento inmobiliario en Miami: guía estratégica para inversionistas con capital", "financiamiento-inmobiliario-miami-inversionistas", 2026, "23 ene 2026", 0, 23],
    ["7 claves del título de propiedad en Miami que todo extranjero debe conocer", "titulo-propiedad-miami-extranjeros", 2026, "16 ene 2026", 0, 16],
    ["Invertir en Miami siendo extranjero en 2026 | Guía completa", "invertir-miami-siendo-extranjero", 2026, "9 ene 2026", 0, 9],
    ["Cuándo invertir y cuándo no: lecciones de Tulum, Acapulco, CDMX y Mérida", "mejores-ciudades-invertir-bienes-raices-cuando", 2025, "31 dic 2025", 11, 31],
    ["¿Realmente está por colapsar la economía mexicana? Análisis sin sensacionalismo", "economia-mexicana-analisis-real-inversionistas", 2025, "13 dic 2025", 11, 13],
    ["Invertir en Miami desde México: guía completa con respaldo legal", "invertir-en-miami-desde-mexico-guia-completa", 2025, "10 dic 2025", 11, 10],
    ["¿Qué pasa si no pago la hipoteca en Miami? Guía completa", "que-pasa-si-no-pago-hipoteca-miami", 2025, "8 dic 2025", 11, 8],
    ["Título de propiedad en Estados Unidos: la verdad sobre la seguridad de tu inversión", "titulo-propiedad-estados-unidos-inversionistas-mexicanos", 2025, "6 dic 2025", 11, 6],
    ["¿Pueden quitarte tu propiedad en Estados Unidos? Mitos y realidades", "seguridad-juridica-propiedad-estados-unidos-extranjeros", 2025, "25 nov 2025", 10, 25],
    ["Inversión inmobiliaria en Miami: tips a tomar en cuenta", "inversion-inmobiliaria-miami-tips", 2025, "21 oct 2025", 9, 21],
    ["Real Estate de lujo en Miami 2025: las 7 tendencias que dominan el mercado", "real-estate-de-lujo-en-miami", 2025, "21 oct 2025", 9, 21],
    ["South Beach: la playa favorita de Miami", "south-beach", 2025, "27 jun 2025", 5, 27],
    ["Inversionistas latinoamericanos, ¿qué buscan en Miami?", "inversionistas-latinoamericanos", 2021, "15 nov 2021", 10, 15],
    ["La importancia del asesor inmobiliario", "asesor-inmobiliario", 2021, "4 ago 2021", 7, 4],
    ["¿Cómo disminuir el riesgo financiero?", "como-disminuir-el-riesgo-financiero", 2021, "19 jul 2021", 6, 19],
    ["¿Qué es el ROI inmobiliario y cómo calcularlo?", "roi-inmobilidario", 2021, "10 jul 2021", 6, 10],
    ["Mercado inmobiliario de Estados Unidos", "mercado-inmobiliario-de-estados-unidos", 2021, "6 jul 2021", 6, 6],
    ["Hoteles en Miami: 6 fascinantes opciones", "hoteles-en-miami", 2021, "5 jul 2021", 6, 5],
    ["Consecuencias de la pandemia en el Real Estate", "consecuencias-de-la-pandemia", 2021, "21 jun 2021", 5, 21],
    ["Invertir en propiedades en Miami: ¿por qué?", "invertir-en-propiedades-en-miami", 2021, "18 jun 2021", 5, 18],
    ["Inversiones en línea: ventajas y desventajas", "inversiones-en-linea", 2021, "15 jun 2021", 5, 15],
    ["Bienes raíces en Estados Unidos: 6 motivos", "bienes-raices-en-estados-unidos", 2021, "7 jun 2021", 5, 7],
    ["¿Cómo comprar propiedades en el extranjero?", "como-comprar-propiedades-en-el-extranjero", 2021, "2 jun 2021", 5, 2],
    ["Negocios inmobiliarios en Estados Unidos", "negocios-inmobiliarios-en-estados-unidos", 2021, "31 may 2021", 4, 31],
    ["Compras en Miami: los 6 mejores lugares", "compras-en-miami", 2021, "26 may 2021", 4, 26],
    ["Mejores países para invertir en 2021", "mejores-paises-para-invertir", 2021, "24 may 2021", 4, 24],
    ["¿Miami es seguro? Sus zonas más seguras", "miami-es-seguro", 2021, "21 may 2021", 4, 21],
    ["Invertir en Estados Unidos para obtener la residencia", "invertir-en-estados-unidos-para-obtener-la-residencia", 2021, "20 may 2021", 4, 20],
    ["Proyectos inmobiliarios en Miami", "proyectos-inmobiliarios-en-miami", 2021, "11 may 2021", 4, 11],
    ["Financiamiento en Estados Unidos", "financiamiento-en-estados-unidos", 2021, "6 may 2021", 4, 6],
    ["¿Cómo empezar a invertir en bienes raíces?", "como-empezar-a-invertir-en-bienes-raices", 2021, "3 may 2021", 4, 3],
    ["Invertir en otro país: 5 errores a evitar", "invertir-en-otro-pais", 2021, "28 abr 2021", 3, 28],
    ["Administración de propiedades", "administracion-de-propiedades", 2021, "27 abr 2021", 3, 27],
    ["¿Qué es FIRPTA y cómo afecta mi inversión?", "firpta", 2021, "25 abr 2021", 3, 25],
    ["Rentas en Miami: todo lo que necesitas saber", "rentas-en-miami", 2021, "21 abr 2021", 3, 21],
    ["Restaurantes en Miami que debes conocer", "restaurantes-en-miami", 2021, "19 abr 2021", 3, 19],
    ["Fraudes inmobiliarios: 4 consejos para evitarlos", "fraudes-inmobiliarios", 2021, "13 abr 2021", 3, 13],
    ["Inversionista extranjero en EE.UU.", "inversionista-extranjero", 2021, "7 abr 2021", 3, 7],
    ["La mejor vida nocturna de Miami", "vida-nocturna-de-miami", 2021, "5 abr 2021", 3, 5],
    ["Departamentos en preventa: 6 consejos", "departamentos-en-preventa", 2021, "29 mar 2021", 2, 29],
    ["Tipos de inversiones que debes conocer", "tipos-de-inversiones", 2021, "26 mar 2021", 2, 26],
    ["Cómo abrir una empresa en Estados Unidos", "como-abrir-una-empresa-en-estados-unidos", 2021, "24 mar 2021", 2, 24],
    ["Mejores zonas de Miami para invertir", "zonas-de-miami", 2021, "22 mar 2021", 2, 22],
    ["Visas de inversionista E-2 y EB-5", "visas-de-inversionista", 2021, "16 mar 2021", 2, 16],
    ["Invertir en criptomonedas: ¿vale la pena?", "invertir-en-criptomonedas", 2021, "9 mar 2021", 2, 9],
    ["¿Cómo generar más dinero?", "como-generar-mas-dinero", 2021, "3 mar 2021", 2, 3],
    ["Miami es caro para vivir… ¿o no?", "miami-es-caro-para-vivir", 2021, "27 feb 2021", 1, 27],
  ].map(p => ({ title: p[0], url: "Articulo.html?post=" + p[1], src: U + p[1] + "/", slug: p[1], year: p[2], date: p[3] }));

  return { POSTS };
})();
