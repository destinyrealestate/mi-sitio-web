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
   false, NO crear dentro de GTM ninguna etiqueta de GA4 ni del Pixel de
   Meta. Si se crean, cada visita y cada evento se contarían DOS veces.

   GOOGLE ADS ES LA EXCEPCIÓN, y desde el 2026-08-11 vive ENTERO en GTM:
   la etiqueta base AW- y las de conversión. Este archivo ya no configura
   nada de Ads. Pasó lo que la regla de arriba advertía: durante una semana
   la etiqueta base estuvo en los dos lados a la vez.

   Para migrar de verdad a GTM el día que se quiera:
     1. Crear en GTM la etiqueta de configuración de GA4, la del Pixel y
        los activadores de los 7 eventos personalizados.
     2. Publicar el contenedor.
     3. Recién entonces poner GTM_ADMINISTRA_ETIQUETAS en true. GA4 y el
        Pixel dejan de salir por código y pasan a salir por GTM.
   El orden importa: al revés queda un hueco sin datos.

   CONTENTSQUARE se queda siempre en código: requiere carga temprana.
   EL PIXEL DE OPENAI también, y por otro motivo: no hay plantilla oficial
   en GTM, así que migrarlo allá significaría meterlo como HTML
   personalizado y perder la guarda de consentimiento que tiene aquí.
   ============================================================ */
(function () {
  "use strict";

  var GTM_ID = "GTM-KW8TPGGG";
  var GA4_ID = "G-J8KK325F2B";
  var META_PIXEL_ID = "27857783360524172";
  var CONTENTSQUARE_ID = "7dccdd22cb616";
  // Solo informativo: desde el 2026-08-11 la etiqueta base de Ads la carga
  // GTM, no este archivo. Ver el bloque "Etiqueta de Google Ads" más abajo.
  var GOOGLE_ADS_ID = "AW-18368975159";  // instalado 2026-08-03
  var OPENAI_PIXEL_ID = "LZf9xnoYjgDpBLbXzJm8Ck";  // ChatGPT Ads, instalado 2026-08-10

  // false = convivencia: GA4 y Pixel salen por código, GTM va aparte.
  // true  = GA4 y Pixel se administran desde la interfaz de GTM.
  var GTM_ADMINISTRA_ETIQUETAS = false;

  var porCodigo = !(GTM_ID && GTM_ADMINISTRA_ETIQUETAS);

  // Mismo criterio que tracking.js: en local no se ensucian los informes.
  var DEV = (function () {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "" || h === "::1" ||
           /\.local$/.test(h) || location.protocol === "file:";
  })();

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

  /* ---------- Etiqueta de Google Ads: LA CARGA GTM, NO ESTE ARCHIVO ----------
     Aquí vivía un `gtag("config", GOOGLE_ADS_ID, …)`. Se quitó el 2026-08-11
     porque el contenedor (versión 3) trae su propia Etiqueta de Google
     AW-18368975159 disparándose en la inicialización: la etiqueta base
     estaba cargando DOS veces en cada página.

     No duplicaba conversiones —esas son eventos aparte—, pero sí las
     señales de remarketing y la vista de página de Ads.

     El ID se conserva en la constante de arriba porque lo leen tracking.js
     y diagnostico.html. Que exista NO significa que se configure aquí.
     Para volver a disparar Ads por código hay que restaurar este bloque
     antes de poner CONVERSIONES_POR_CODIGO en true; está explicado en la
     cabecera de tracking.js. */

  /* ---------- Pixel de Meta ----------
     META NO LEE EL CONSENT MODE DE GOOGLE. Google Ads y GA4 respetan solos
     lo que declara consent.js; el Pixel no se entera de nada y seguiría
     mandando el PageView de un visitante que pulsó "Rechazar". Por eso
     lleva su propia guarda, aquí y en tracking.js para los eventos.

     Se comprueba el estado, no se bloquea la carga del script: si el
     visitante acepta después, fbq ya está listo y el siguiente evento sale
     sin recargar la página. */
  // La usan el Pixel de Meta y el de OpenAI: ninguno de los dos lee el
  // Consent Mode de Google, así que la decisión hay que consultarla a mano.
  function consentimientoDenegado() {
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
    if (!consentimientoDenegado()) window.fbq("track", "PageView");
  }

  /* ---------- Pixel de OpenAI (ChatGPT Ads) ----------
     Va SIEMPRE por código, nunca por GTM: no existe una plantilla oficial
     en GTM, así que `porCodigo` no aplica aquí.

     Tres diferencias con Meta que conviene tener presentes:

     1. El consentimiento tiene API propia y se declara ANTES del init, no
        después. El SDK asume "concedido" si nadie dice lo contrario, así
        que el visitante que rechazó necesita este oaiq("consent", false)
        antes de que se inicialice nada. consent.js vuelve a llamarlo
        cuando el visitante cambia de opinión sin recargar la página.

     2. La vista de página NO es automática. A diferencia de fbq, aquí el
        init no mide nada por su cuenta: page_viewed se manda a mano.

     3. page_viewed usa la forma "contents"; los eventos de conversión usan
        "customer_action" y salen desde tracking.js, no desde aquí. */
  if (OPENAI_PIXEL_ID) {
    (function (w, d, s, u) {
      if (w.oaiq) return;
      var q = function () { q.q.push(arguments); };
      q.q = [];
      w.oaiq = q;
      var j = d.createElement(s); j.async = true; j.src = u;
      var f = d.getElementsByTagName(s)[0];
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "https://bzrcdn.openai.com/sdk/oaiq.min.js");

    window.oaiq("consent", !consentimientoDenegado());
    // debug:true escupe la actividad del SDK a la consola. El snippet que da
    // OpenAI lo trae encendido; en producción solo es ruido para el visitante,
    // así que se limita a desarrollo. Para encenderlo en el sitio publicado:
    // window.DESTINY_DEBUG = true en la consola y recargar — no basta con
    // ponerlo después, porque esto se lee una sola vez en el arranque.
    window.oaiq("init", { pixelId: OPENAI_PIXEL_ID, debug: DEV || !!window.DESTINY_DEBUG });
    window.oaiq("measure", "page_viewed", { type: "contents" });
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
    ADS_POR_GTM: true,            // la etiqueta base no sale de este archivo
    OPENAI_PIXEL_ID: OPENAI_PIXEL_ID,
    modo: GTM_ID ? (GTM_ADMINISTRA_ETIQUETAS ? "gtm" : "convivencia") : "solo-codigo"
  };
})();
