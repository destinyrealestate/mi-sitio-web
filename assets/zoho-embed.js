/* ============================================================
   DESTINY — puente de atribución hacia los formularios de Zoho
   ============================================================
   Los formularios se quedan en Zoho. Este archivo NO programa formularios:
   solo pasa el origen del visitante al iframe por parámetros de URL, para
   que el lead llegue a Zoho CRM con su gclid, su UTM y su desarrollo.

   Hace dos cosas:

   1) Enriquece los iframes de Zoho que YA existen en el HTML
      (iframe.zf-embed). No los reescribe: solo agrega los parámetros al src
      antes de que carguen, más un estado de carga y la altura automática.

   2) Monta los iframes de los contenedores nuevos:
        <div class="zoho-form"
             data-form-base="https://forms.zohopublic.com/.../formperma/XXXX"
             data-form-type="sesion"
             data-min-height="740"></div>

   ------------------------------------------------------------
   IMPORTANTE — paso pendiente en el panel de Zoho
   ------------------------------------------------------------
   Los nombres de los parámetros de abajo tienen que coincidir EXACTAMENTE
   con el "nombre de enlace" (link name) de campos ocultos creados dentro de
   cada formulario de Zoho. Mientras esos campos no existan, Zoho recibe los
   parámetros y los descarta: la atribución llega al formulario y muere ahí.

   Campos ocultos a crear en cada formulario, con estos nombres de enlace.
   Son 16 — los 10 de KEYS y los 3 de EXTRA en attribution.js, más los 3 que
   agrega este archivo (desarrollo, page_url, form_type):
     gclid, wbraid, gbraid, fbclid, msclkid,
     utm_source, utm_medium, utm_campaign, utm_term, utm_content,
     landing_page, referrer, first_seen,
     desarrollo, form_type, page_url

   Si Zoho asigna otro nombre de enlace (p. ej. "SingleLine3"), mapéalo aquí
   en FIELD_MAP y no en cada página.

   Y falta un tramo más: el CRM es HubSpot, no Zoho CRM. Los valores viajan
   por webhook a Make y de ahí al módulo upsertAContact. Ver MEDICION.md.
   ============================================================ */
(function () {
  "use strict";

  /* Traducción nombre interno -> nombre de enlace en Zoho.
     Solo hay que tocar este objeto si Zoho no permite el nombre limpio. */
  var FIELD_MAP = {
    // gclid: 'SingleLine1',
  };

  var MIN_HEIGHT = { sesion: 740, newsletter: 500, scorecard: 620, club: 700, dossier: 740 };

  function attr() {
    return window.DestinyAttr ? window.DestinyAttr.filled() : {};
  }

  function payload(formType) {
    var o = attr();
    o.desarrollo = (document.body && document.body.getAttribute('data-desarrollo')) || 'home';
    o.page_url = location.href.split('#')[0];
    if (formType) o.form_type = formType;
    return o;
  }

  function qs(obj) {
    return Object.keys(obj).filter(function (k) { return obj[k] !== '' && obj[k] != null; })
      .map(function (k) {
        return encodeURIComponent(FIELD_MAP[k] || k) + '=' + encodeURIComponent(obj[k]);
      }).join('&');
  }

  /* Zoho publica la altura real del formulario por postMessage con el formato
     "formperma|alto". Requiere el parámetro zf_rszfm=1 en el src. Sin él el
     iframe nunca se auto-ajusta y queda un hueco vacío. */
  var resizing = [];
  function autoHeight(ifr) {
    resizing.push(ifr);
  }
  window.addEventListener('message', function (ev) {
    var d = ev && ev.data;
    if (!d || typeof d !== 'string' || d.indexOf('|') < 0) return;
    var parts = d.split('|');
    if (parts.length < 2) return;
    var h = parseInt(parts[1], 10);
    if (!(h > 0)) return;
    resizing.forEach(function (ifr) {
      if (ifr && ifr.src && ifr.src.indexOf(parts[0]) >= 0) ifr.style.height = (h + 15) + 'px';
    });
  }, false);

  function withParams(src, formType) {
    var extra = qs(payload(formType));
    var out = src;
    if (out.indexOf('zf_rszfm=') < 0) out += (out.indexOf('?') < 0 ? '?' : '&') + 'zf_rszfm=1';
    if (extra) out += '&' + extra;
    return out;
  }

  /* Estado de carga: velo sobre el iframe hasta que dispara load. */
  function loader(host, ifr) {
    var veil = document.createElement('div');
    veil.className = 'zf-loading';
    veil.setAttribute('aria-live', 'polite');
    veil.textContent = 'Cargando el formulario…';
    veil.style.cssText = 'font:500 13px/1.4 "Outfit",system-ui,sans-serif;letter-spacing:.04em;' +
      'opacity:.62;padding:14px 0;text-align:center;';
    host.insertBefore(veil, ifr);
    ifr.style.opacity = '0';
    ifr.style.transition = 'opacity .35s ease';
    function done() {
      ifr.style.opacity = '1';
      if (veil.parentNode) veil.remove();
    }
    ifr.addEventListener('load', done, { once: true });
    setTimeout(done, 8000); // red mala: nunca dejar el velo pegado
  }

  function run() {
    /* --- 1. Iframes de Zoho ya presentes en el HTML --- */
    document.querySelectorAll('iframe.zf-embed').forEach(function (ifr) {
      var src = ifr.getAttribute('src') || '';
      if (src.indexOf('zohopublic.com') < 0) return;
      if (ifr.dataset.attrDone) return;
      ifr.dataset.attrDone = '1';

      var formType = ifr.getAttribute('data-form-type') ||
        (/NEWSLETTER/i.test(src) ? 'newsletter' : 'sesion');

      ifr.setAttribute('src', withParams(src, formType));
      if (!ifr.getAttribute('loading')) ifr.setAttribute('loading', 'lazy');
      autoHeight(ifr);
      loader(ifr.parentNode, ifr);
    });

    /* --- 2. Contenedores declarativos de las páginas nuevas --- */
    document.querySelectorAll('.zoho-form[data-form-base]').forEach(function (el) {
      if (el.dataset.mounted) return;
      el.dataset.mounted = '1';

      var formType = el.dataset.formType || 'sesion';
      var min = parseInt(el.dataset.minHeight || MIN_HEIGHT[formType] || 700, 10);

      var ifr = document.createElement('iframe');
      ifr.className = 'zf-embed';
      ifr.src = withParams(el.dataset.formBase, formType);
      ifr.title = el.dataset.formTitle || 'Formulario de contacto — Destiny Real Estate';
      ifr.loading = 'lazy';
      ifr.style.cssText = 'width:100%;border:0;display:block;background:transparent;height:' + min + 'px;';
      // Sin scroll interno: la altura la dicta Zoho por postMessage.
      ifr.setAttribute('scrolling', 'no');

      el.appendChild(ifr);
      autoHeight(ifr);
      loader(el, ifr);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  // Las páginas de propiedad montan su formulario por JS después del DOM.
  window.DestinyZoho = { refresh: run };
})();
