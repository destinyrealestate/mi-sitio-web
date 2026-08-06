/* ============================================================
   DESTINY — atribución de origen
   ============================================================
   Se carga en el <head> ANTES de cualquier otra etiqueta, en TODAS las
   páginas. Guarda el origen del visitante en cookies de primer nivel con
   dominio .destiny.mx, para que sobreviva:
     - la navegación entre destiny.mx y blog.destiny.mx
     - visitas posteriores directas (90 días)
     - el envío del formulario nativo (assets/forms.js)

   Regla clave: solo escribe si el parámetro VIENE en la URL. Una visita
   directa posterior nunca borra el gclid original.

   wbraid y gbraid son los identificadores que Google usa cuando el
   navegador bloquea cookies de terceros (Safari / iOS). Sin ellos se
   pierde la atribución de la mayoría del tráfico móvil.

   ------------------------------------------------------------
   PRIMER CONTACTO Y ÚLTIMO CONTACTO (2026-08-05)
   ------------------------------------------------------------
   Antes solo había un juego de cookies planas, una por clave, que se
   sobrescribía en cada visita con campaña. Eso responde "¿de dónde vino
   la última vez?" pero no "¿qué lo trajo la primera vez?", que es la
   pregunta cara: el anuncio que descubre al inversionista casi nunca es
   el mismo que cierra la conversión tres semanas después.

   Ahora hay tres capas:

     1. Cookies planas por clave — se conservan tal cual. Son el ÚLTIMO
        valor conocido de cada parámetro y es lo que sigue leyendo
        DestinyAttr.get('gclid'). No se rompió nada de lo que ya existía.
     2. dst_ft — el primer contacto, en JSON. Se escribe UNA vez y no se
        vuelve a tocar nunca.
     3. dst_lt — el último contacto, en JSON. Se reescribe cada vez que
        llega un visitante con campaña nueva.

   Los 90 días de vigencia empatan con la ventana de conversión de Google
   Ads: guardar más tiempo produce atribuciones que Ads ya no acepta.

   ------------------------------------------------------------
   API pública — window.DestinyAttr
   ------------------------------------------------------------
     .get('gclid')   -> string. El último valor conocido.
     .set(k, v)      -> escribe una clave.
     .all()          -> objeto con todas las claves planas.
     .filled()       -> igual, pero solo las que tienen valor.
     .params()       -> query string.
     .payload()      -> el objeto COMPLETO para mandar al webhook,
                        con first_touch y last_touch dentro.
     .firstTouch()   -> objeto del primer contacto (o null).
     .lastTouch()    -> objeto del último contacto (o null).
     .desarrollo()   -> data-desarrollo del body.
   ============================================================ */
(function () {
  "use strict";

  /* ttclid (TikTok) y li_fat_id (LinkedIn) todavía no se usan: se capturan
     desde ya para que el día que se encienda uno de esos canales exista
     histórico en lugar de arrancar de cero. */
  var CLICK_IDS = ['gclid', 'wbraid', 'gbraid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id'];
  var UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  var KEYS = CLICK_IDS.concat(UTMS);
  var EXTRA = ['landing_page', 'referrer', 'first_seen'];

  var MAX_AGE = 7776000;      // 90 días — ventana de conversión de Google Ads
  var FT = 'dst_ft';          // primer contacto
  var LT = 'dst_lt';          // último contacto

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

  /* Los objetos de contacto van en JSON dentro de una sola cookie. Una
     cookie por clave y por contacto serían 24 cookies para lo mismo, y
     los navegadores empiezan a descartar cookies alrededor de las 50. */
  function setJSON(k, obj) {
    try {
      var s = JSON.stringify(obj);
      if (s.length > 3500) return;   // margen bajo el límite de 4 KB por cookie
      document.cookie = k + '=' + encodeURIComponent(s) +
        ';max-age=' + MAX_AGE + ';path=/' + DOMAIN + ';SameSite=Lax' + SECURE;
    } catch (e) {}
  }

  function getJSON(k) {
    var raw = get(k);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  var p;
  try { p = new URLSearchParams(location.search); } catch (e) { p = null; }

  function param(k) { return p ? (p.get(k) || '') : ''; }

  /* ---------- 1. Cookies planas (compatibilidad) ---------- */
  if (p) {
    KEYS.forEach(function (k) {
      var v = param(k);
      if (v) set(k, v);
    });
    // gad_source llega en algunos formatos de anuncio sin utm_source
    if (param('gad_source') && !get('utm_source')) set('utm_source', 'google');
  }

  // Primera página vista y referente: se escriben UNA sola vez por visitante.
  if (!get('landing_page')) {
    set('landing_page', location.pathname + (location.search || ''));
    set('referrer', document.referrer || 'direct');
    set('first_seen', new Date().toISOString().slice(0, 10));
  }

  /* ---------- 2. Primer y último contacto ---------- */

  function referenteExterno() {
    var r = document.referrer || '';
    if (!r) return '';
    try {
      var h = new URL(r).hostname;
      // El blog es la misma casa: pasar de destiny.mx a blog.destiny.mx no
      // es un contacto nuevo, es la misma visita cambiando de subdominio.
      if (/(^|\.)destiny\.mx$/.test(h)) return '';
      return r;
    } catch (e) { return r; }
  }

  /* Un "contacto" es una llegada que trae origen identificable. Se
     clasifica en tres, y el orden importa: si hay click ID manda `paid`
     aunque también venga un referente. */
  function contactoActual() {
    var o = { ts: new Date().toISOString(), landing_page: location.pathname + (location.search || '') };
    var tienePago = false, tieneUtm = false;

    CLICK_IDS.forEach(function (k) {
      var v = param(k);
      if (v) { o[k] = v; tienePago = true; }
    });
    UTMS.forEach(function (k) {
      var v = param(k);
      if (v) { o[k] = v; tieneUtm = true; }
    });

    var ref = referenteExterno();
    if (ref) o.referrer = ref;

    if (tienePago) o.tipo = 'paid';
    else if (tieneUtm) o.tipo = 'campaign';
    else if (ref) o.tipo = 'referral';
    else o.tipo = 'direct';

    return o;
  }

  var actual = contactoActual();
  var esContacto = actual.tipo !== 'direct';

  /* El primer contacto se escribe aunque sea directo: si no, un visitante
     que llega orgánico y convierte tres semanas después no tendría origen
     inicial de ningún tipo. Pero solo se escribe si NO existe ya. */
  if (!getJSON(FT)) setJSON(FT, actual);

  /* El último contacto solo se reescribe cuando hay origen real. Una
     visita directa posterior NO borra la campaña que trajo al visitante:
     es la misma regla que ya protegía a las cookies planas. */
  if (esContacto || !getJSON(LT)) setJSON(LT, actual);

  /* ---------- 3. API pública ---------- */

  function all() {
    var o = {};
    KEYS.concat(EXTRA).forEach(function (k) { o[k] = get(k); });
    return o;
  }

  window.DestinyAttr = {
    KEYS: KEYS.concat(EXTRA),
    CLICK_IDS: CLICK_IDS,
    get: get,
    set: set,
    all: all,

    /* Solo las claves con valor. */
    filled: function () {
      var o = {}, a = all();
      Object.keys(a).forEach(function (k) { if (a[k]) o[k] = a[k]; });
      return o;
    },

    params: function () {
      var a = this.filled();
      return Object.keys(a).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(a[k]);
      }).join('&');
    },

    firstTouch: function () { return getJSON(FT); },
    lastTouch: function () { return getJSON(LT); },

    /* El objeto completo, listo para el webhook de Make. Lo consume
       assets/forms.js. Las claves planas van arriba para que el escenario
       de Make pueda leer `atribucion.gclid` sin entrar a los objetos de
       contacto; first_touch y last_touch son el detalle. */
    payload: function () {
      var o = all();
      o.first_touch = getJSON(FT);
      o.last_touch = getJSON(LT);
      return o;
    },

    /* Identificador del desarrollo de la página actual. */
    desarrollo: function () {
      return (document.body && document.body.getAttribute('data-desarrollo')) || '';
    }
  };
})();
