/* ============================================================
   DESTINY — capa de eventos
   ============================================================
   Todo por delegación de eventos en document. Cero onclick en el HTML.

   Cada evento se emite por TRES vías, según lo que esté disponible:
     1. window.dataLayer  — es lo que consumirá GTM cuando exista el contenedor.
     2. gtag('event', …)  — para que los eventos ya funcionen HOY con el GA4
                            directo que está instalado, sin esperar a GTM.
     3. fbq('track'/'trackCustom', …) — Pixel de Meta.

   Cuando se instale GTM y se retiren gtag y fbq del código, este archivo
   sigue funcionando sin cambios: las vías 2 y 3 simplemente no existen y
   se omiten.

   Eventos: generate_lead, click_whatsapp, click_telefono, file_download,
            view_project, scroll_90, engaged_60s.
   Todos llevan los datos de atribución de DestinyAttr.
   ============================================================ */
(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];

  var ATTR = window.DestinyAttr;
  var META_MAP = { generate_lead: 'Lead', click_whatsapp: 'Contact', click_telefono: 'Contact' };

  function desarrollo() {
    return (document.body && document.body.getAttribute('data-desarrollo')) || 'home';
  }

  function push(name, params) {
    var payload = Object.assign({ event: name, desarrollo: desarrollo() },
                                ATTR ? ATTR.filled() : {},
                                params || {});
    window.dataLayer.push(payload);

    // GA4 directo (mientras no exista GTM)
    if (typeof window.gtag === 'function') {
      var ga = Object.assign({}, payload);
      delete ga.event;
      try { window.gtag('event', name, ga); } catch (e) {}
    }

    // Pixel de Meta
    if (typeof window.fbq === 'function') {
      try {
        if (META_MAP[name]) window.fbq('track', META_MAP[name], { content_name: payload.desarrollo });
        else window.fbq('trackCustom', name, { content_name: payload.desarrollo });
      } catch (e) {}
    }

    if (window.DESTINY_DEBUG) console.log('[destiny]', name, payload);
  }

  window.destinyTrack = push;

  /* ---------- 1. Clics delegados ---------- */
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) {
      push('click_whatsapp', { link_url: href, link_text: (a.textContent || '').trim().slice(0, 80) });
      return;
    }
    if (/^tel:/i.test(href)) {
      push('click_telefono', { phone: href.replace(/^tel:/i, '') });
      return;
    }
    if (/^mailto:/i.test(href)) {
      push('click_email', { email_to: href.replace(/^mailto:/i, '') });
      return;
    }
    var file = href.match(/\/([^\/?#]+\.(?:pdf|xlsx|xls|zip|docx|csv))(?:[?#]|$)/i);
    if (file) {
      push('file_download', { file_name: decodeURIComponent(file[1]), file_extension: file[1].split('.').pop().toLowerCase(), link_url: href });
    }
  }, true);

  /* ---------- 2. Eventos de carga de página ---------- */
  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    var body = document.body;
    var pageType = body.getAttribute('data-page-type') || '';
    var qp = new URLSearchParams(location.search);

    // view_project — landing de proyecto
    if (pageType === 'proyecto') {
      push('view_project', {
        project_slug: desarrollo(),
        project_name: (document.getElementById('pName') || {}).textContent || ''
      });
    }

    // generate_lead — cualquier página de gracias
    if (pageType === 'gracias') {
      var formType = body.getAttribute('data-form-type') || qp.get('form_type') || 'sesion';

      // El desarrollo viaja en ?d= desde la página que originó el envío. Sin esto,
      // toda conversión se atribuiría a "home" y no se podría saber qué proyecto
      // la generó.
      var d = (qp.get('d') || '').trim();
      if (d) body.setAttribute('data-desarrollo', d);

      // Conversiones mejoradas para clientes potenciales: si Zoho devuelve el
      // correo (o el teléfono) en la URL de redirección, se expone en el
      // dataLayer en un campo dedicado. GTM lo lee desde ahí; nunca se envía
      // a ninguna otra parte desde el navegador.
      var lead = {};
      var email = (qp.get('email') || qp.get('Email') || '').trim().toLowerCase();
      var phone = (qp.get('phone') || qp.get('tel') || '').replace(/[^\d+]/g, '');
      if (email && email.indexOf('@') > 0) lead.user_email = email;
      if (phone.length >= 8) lead.user_phone = phone;

      push('generate_lead', Object.assign({
        form_type: formType,
        currency: 'USD',
        value: 0,
        contexto: qp.get('ctx') || ''
      }, lead));
    }
  });

  /* ---------- 3. Micro-conversiones ---------- */
  var scrolled90 = false;
  window.addEventListener('scroll', function () {
    if (scrolled90) return;
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight);
    if (max <= 0) return;
    if ((h.scrollTop || document.body.scrollTop) / max >= 0.9) {
      scrolled90 = true;
      push('scroll_90', { percent_scrolled: 90 });
    }
  }, { passive: true });

  var engaged = false, active = 0, last = Date.now();
  function tick() {
    if (engaged || document.hidden) { last = Date.now(); return; }
    var now = Date.now();
    active += (now - last);
    last = now;
    if (active >= 60000) {
      engaged = true;
      push('engaged_60s', { engagement_time_msec: active });
    }
  }
  setInterval(tick, 5000);
  document.addEventListener('visibilitychange', function () { last = Date.now(); });
})();
