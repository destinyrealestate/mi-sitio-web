/* ============================================================
   DESTINY — atribución de origen (gclid / wbraid / gbraid / UTM)
   ============================================================
   Se carga en el <head> ANTES de cualquier otra etiqueta, en TODAS
   las páginas. Guarda el origen del visitante en cookies de primer
   nivel con dominio .destiny.mx, para que sobreviva:
     - la navegación entre destiny.mx y blog.destiny.mx
     - visitas posteriores directas (90 días)
     - el salto al iframe del formulario de Zoho

   Regla clave: solo escribe si el parámetro VIENE en la URL. Una
   visita directa posterior nunca borra el gclid original.

   wbraid y gbraid son los identificadores que Google usa cuando el
   navegador bloquea cookies de terceros (Safari / iOS). Sin ellos se
   pierde la atribución de la mayoría del tráfico móvil.

   API pública:
     DestinyAttr.get('gclid')  -> string
     DestinyAttr.all()         -> objeto con todas las claves
     DestinyAttr.params()      -> query string listo para el iframe
   ============================================================ */
(function () {
  "use strict";

  var KEYS = ['gclid', 'wbraid', 'gbraid', 'fbclid', 'msclkid',
              'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var EXTRA = ['landing_page', 'referrer', 'first_seen'];
  var MAX_AGE = 7776000; // 90 días

  // El dominio con punto inicial cubre destiny.mx y blog.destiny.mx.
  // En localhost o en file:// no se puede fijar dominio: se omite.
  var host = location.hostname || '';
  var DOMAIN = /(^|\.)destiny\.mx$/.test(host) ? ';domain=.destiny.mx' : '';
  var SECURE = location.protocol === 'https:' ? ';Secure' : '';

  function set(k, v) {
    if (v === null || v === undefined || v === '') return;
    document.cookie = k + '=' + encodeURIComponent(String(v).slice(0, 300)) +
      ';max-age=' + MAX_AGE + ';path=/' + DOMAIN + ';SameSite=Lax' + SECURE;
  }

  function get(k) {
    var m = document.cookie.match('(^|;\\s*)' + k + '=([^;]*)');
    return m ? decodeURIComponent(m[2]) : '';
  }

  var p;
  try { p = new URLSearchParams(location.search); } catch (e) { p = null; }

  if (p) {
    KEYS.forEach(function (k) {
      var v = p.get(k);
      if (v) set(k, v);
    });
    // gclid puede llegar también como gclsrc/wbraid en algunos formatos de anuncio
    if (p.get('gad_source') && !get('utm_source')) set('utm_source', 'google');
  }

  // Primera página vista y referente: se escriben UNA sola vez por visitante.
  if (!get('landing_page')) {
    set('landing_page', location.pathname + (location.search || ''));
    set('referrer', document.referrer || 'direct');
    set('first_seen', new Date().toISOString().slice(0, 10));
  }

  window.DestinyAttr = {
    KEYS: KEYS.concat(EXTRA),
    get: get,
    set: set,
    all: function () {
      var o = {};
      KEYS.concat(EXTRA).forEach(function (k) { o[k] = get(k); });
      return o;
    },
    /* Solo las claves con valor, ya codificadas. Sirve tanto para el
       src del iframe de Zoho como para el dataLayer. */
    filled: function () {
      var o = {}, a = this.all();
      Object.keys(a).forEach(function (k) { if (a[k]) o[k] = a[k]; });
      return o;
    },
    params: function () {
      var a = this.filled();
      return Object.keys(a).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(a[k]);
      }).join('&');
    },
    /* Identificador del desarrollo de la página actual (data-desarrollo del body). */
    desarrollo: function () {
      return (document.body && document.body.getAttribute('data-desarrollo')) || '';
    }
  };
})();
