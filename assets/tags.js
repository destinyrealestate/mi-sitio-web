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
   CUANDO EXISTA EL CONTENEDOR DE GTM
   ------------------------------------------------------------
   Este es el único archivo que hay que tocar:
     1. Pon el ID en GTM_ID.
     2. Pon GA4_ID y META_PIXEL_ID en "" — sus etiquetas pasan a
        administrarse desde la interfaz de GTM.
     3. Deja CONTENTSQUARE_ID como está: requiere carga temprana.
   No hay que editar ni un HTML.
   ============================================================ */
(function () {
  "use strict";

  var GTM_ID = "";                       // ej. "GTM-XXXXXXX" — pendiente de crear el contenedor
  var GA4_ID = "G-J8KK325F2B";
  var META_PIXEL_ID = "27857783360524172";
  var CONTENTSQUARE_ID = "7dccdd22cb616";
  var GOOGLE_ADS_ID = "";                // ej. "AW-XXXXXXXXX" — pendiente de crear la cuenta

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

  /* ---------- GA4 directo (mientras no exista GTM) ---------- */
  if (GA4_ID && !GTM_ID) {
    script("https://www.googletagmanager.com/gtag/js?id=" + GA4_ID);
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID);
  }

  /* ---------- Etiqueta de Google Ads ---------- */
  // El enlazador de conversiones se configura desde GTM. Esta rama solo existe
  // para el caso de que se quiera medir Ads sin GTM.
  if (GOOGLE_ADS_ID && !GTM_ID) {
    if (!GA4_ID) script("https://www.googletagmanager.com/gtag/js?id=" + GOOGLE_ADS_ID);
    window.gtag("config", GOOGLE_ADS_ID, { allow_enhanced_conversions: true });
  }

  /* ---------- Pixel de Meta ---------- */
  if (META_PIXEL_ID && !GTM_ID) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* ---------- Contentsquare ---------- */
  // Se queda en código: necesita cargar temprano para capturar la sesión completa.
  if (CONTENTSQUARE_ID) {
    script("https://t.contentsquare.net/uxa/" + CONTENTSQUARE_ID + ".js");
  }

  window.DestinyTags = { GTM_ID: GTM_ID, GA4_ID: GA4_ID, META_PIXEL_ID: META_PIXEL_ID, GOOGLE_ADS_ID: GOOGLE_ADS_ID };
})();
