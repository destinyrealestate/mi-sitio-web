/* ============================================================
   DESTINY — etiquetas de medición. UN SOLO LUGAR.
   ============================================================
   Antes, el ID de GA4 y el del Pixel de Meta estaban copiados a mano en
   16 archivos HTML. Cambiar uno significaba editar los 16 y olvidar dos.
   Ahora los IDs viven aquí y nada más aquí.

   ORDEN de carga en el <head> de cada página:
     1. assets/consent.js      (declara el modo de consentimiento)
     2. assets/attribution.js  (guarda gclid / UTM)
     3. assets/tags.js         (este archivo)

   ------------------------------------------------------------
   GTM: MODO CONVIVENCIA
   ------------------------------------------------------------
   GTM carga en paralelo con GA4 y el Pixel, que siguen disparándose
   desde este código. Se eligió así para no dejar el sitio sin medición
   ni un solo día mientras se construye el contenedor.

   REGLA QUE NO SE PUEDE ROMPER: mientras GTM_ADMINISTRA_ETIQUETAS sea
   false, NO crear dentro de GTM ninguna etiqueta de GA4, del Pixel de
   Meta ni la etiqueta base de Google Ads (AW-). Si se crean, cada visita
   y cada evento se contarían DOS veces. GTM es aquí el contenedor para lo
   que NO sale por código (remarketing de LinkedIn, etc.).

   Google Ads sí puede usar GTM para las CONVERSIONES (cada una necesita
   su etiqueta de conversión con su rótulo), porque la etiqueta base ya
   está puesta aquí y GTM la reutiliza en lugar de duplicarla.

   Para migrar de verdad a GTM el día que se quiera:
     1. Crear en GTM la etiqueta de configuración de GA4, la del Pixel y
        los activadores de los 7 eventos personalizados.
     2. Publicar el contenedor.
     3. Recién entonces poner GTM_ADMINISTRA_ETIQUETAS en true. GA4 y el
        Pixel dejan de salir por código y pasan a salir por GTM.
   El orden importa: al revés queda un hueco sin datos.

   CONTENTSQUARE se queda siempre en código: requiere carga temprana.
   ============================================================ */
(function () {
  "use strict";

  var GTM_ID = "GTM-KW8TPGGG";
  var GA4_ID = "G-J8KK325F2B";
  var META_PIXEL_ID = "27857783360524172";
  var CONTENTSQUARE_ID = "7dccdd22cb616";
  var GOOGLE_ADS_ID = "AW-18368975159";  // instalado 2026-08-03

  // false = convivencia: GA4 y Pixel salen por código, GTM va aparte.
  // true  = GA4 y Pixel se administran desde la interfaz de GTM.
  var GTM_ADMINISTRA_ETIQUETAS = false;

  var porCodigo = !(GTM_ID && GTM_ADMINISTRA_ETIQUETAS);

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }

  function script(src, attrs) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    (document.head || document.documentElement).appendChild(s);
    return s;
  }

  /* ---------- Google Tag Manager ---------- */
  if (GTM_ID) {
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    script("https://www.googletagmanager.com/gtm.js?id=" + GTM_ID);
    // El <noscript> del contenedor se omite a propósito: sin JavaScript no hay
    // nada que medir en este sitio (todo el contenido de proyecto se pinta por JS).
  }

  /* ---------- GA4 ---------- */
  if (GA4_ID && porCodigo) {
    script("https://www.googletagmanager.com/gtag/js?id=" + GA4_ID);
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
  }

  /* ---------- Etiqueta de Google Ads ---------- */
  // Si Ads se administra desde GTM, poner GOOGLE_ADS_ID en "" y crear allá la
  // etiqueta junto con el enlazador de conversiones.
  if (GOOGLE_ADS_ID && porCodigo) {
    if (!GA4_ID) script("https://www.googletagmanager.com/gtag/js?id=" + GOOGLE_ADS_ID);
    window.gtag("config", GOOGLE_ADS_ID, { allow_enhanced_conversions: true });
  }

  /* ---------- Pixel de Meta ----------
     META NO LEE EL CONSENT MODE DE GOOGLE. Google Ads y GA4 respetan solos
     lo que declara consent.js; el Pixel no se entera de nada y seguiría
     mandando el PageView de un visitante que pulsó "Rechazar". Por eso
     lleva su propia guarda, aquí y en tracking.js para los eventos.

     Se comprueba el estado, no se bloquea la carga del script: si el
     visitante acepta después, fbq ya está listo y el siguiente evento sale
     sin recargar la página. */
  function metaDenegado() {
    try {
      return !!(window.DESTINY_CONSENT && window.DESTINY_CONSENT.state === "denied");
    } catch (e) { return false; }
  }

  if (META_PIXEL_ID && porCodigo) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    if (!metaDenegado()) window.fbq("track", "PageView");
  }

  /* ---------- Contentsquare ---------- */
  // Se queda en código: necesita cargar temprano para capturar la sesión completa.
  if (CONTENTSQUARE_ID) {
    script("https://t.contentsquare.net/uxa/" + CONTENTSQUARE_ID + ".js");
  }

  window.DestinyTags = {
    GTM_ID: GTM_ID,
    GA4_ID: GA4_ID,
    META_PIXEL_ID: META_PIXEL_ID,
    GOOGLE_ADS_ID: GOOGLE_ADS_ID,
    modo: GTM_ID ? (GTM_ADMINISTRA_ETIQUETAS ? "gtm" : "convivencia") : "solo-codigo"
  };
})();
