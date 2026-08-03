/* ============================================================
   DESTINY — consentimiento (Google Consent Mode v2) + banner
   ============================================================
   ORDEN OBLIGATORIO: este archivo va en el <head> ANTES del gtag de
   GA4, del Pixel de Meta y de cualquier contenedor de GTM. Si se carga
   después, el modo de consentimiento no aplica y Google lo ignora.

   Enfoque: modo de consentimiento, NO bloqueo de scripts. Las etiquetas
   cargan siempre; lo que cambia es si pueden escribir cookies y enviar
   identificadores. Así no se pierde el modelado de conversiones.

   - Fuera del EEE/Reino Unido (México incluido): consentimiento otorgado
     por defecto, con opción visible de rechazar.
   - EEE/Reino Unido/Suiza: denegado por defecto hasta que el visitante
     acepte, como exige la política de consentimiento de la UE de Google.

   La elección se guarda en localStorage y se respeta en visitas siguientes.

   REAPERTURA: el aviso de privacidad promete un enlace de preferencias.
   Lo expone window.DESTINY_CONSENT.open(). Cualquier <a id="cookiePrefs">
   o [data-cookie-prefs] del sitio queda conectado solo, sin JS en el HTML.
   ============================================================ */
(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var STORE = 'destiny_consent_v1';
  var EEA = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE',
             'IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE',
             'GB','CH'];

  var DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };
  var GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };

  function read() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  function write(v) {
    try { localStorage.setItem(STORE, v); } catch (e) {}
  }

  var saved = read(); // 'granted' | 'denied' | null

  // --- 1. Defaults. Siempre se declaran antes de las etiquetas. ---
  gtag('consent', 'default', Object.assign({}, DENIED, { region: EEA, wait_for_update: 500 }));
  gtag('consent', 'default', Object.assign({}, GRANTED));
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', true);

  // --- 2. Si el visitante ya decidió, se aplica de inmediato. ---
  if (saved === 'denied') gtag('consent', 'update', DENIED);
  if (saved === 'granted') gtag('consent', 'update', GRANTED);

  function apply(choice) {
    saved = choice;
    write(choice);
    gtag('consent', 'update', choice === 'granted' ? GRANTED : DENIED);
    window.dataLayer.push({ event: 'consent_update', consent_state: choice });
  }

  // --- 3. Banner. ---
  var CSS = '' +
    '#dstCookie{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:0 auto;' +
      'background:rgba(16,25,35,.97);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:16px;' +
      'padding:20px 22px;box-shadow:0 18px 50px rgba(0,0,0,.45);backdrop-filter:blur(8px);' +
      'font-family:"Outfit",system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.55;' +
      'display:flex;gap:18px;align-items:center;flex-wrap:wrap;transform:translateY(120%);' +
      'transition:transform .45s cubic-bezier(.2,.8,.2,1)}' +
    '#dstCookie.in{transform:translateY(0)}' +
    '#dstCookie p{margin:0;flex:1 1 320px;opacity:.9}' +
    '#dstCookie a{color:#d8b26a;text-decoration:underline}' +
    '#dstCookie .dstBtns{display:flex;gap:10px;flex:0 0 auto}' +
    '#dstCookie button{font:inherit;font-weight:600;cursor:pointer;border-radius:999px;padding:11px 20px;' +
      'border:1px solid rgba(255,255,255,.28);background:transparent;color:#fff;transition:.2s}' +
    '#dstCookie button:hover{border-color:#d8b26a}' +
    '#dstCookie button.ok{background:#d8b26a;border-color:#d8b26a;color:#101923}' +
    '#dstCookie button.ok:hover{filter:brightness(1.08)}' +
    '#dstCookie button[aria-pressed="true"]{outline:2px solid #d8b26a;outline-offset:2px}' +
    '#dstCookie .dstNow{display:block;margin-top:6px;font-size:12.5px;opacity:.62}' +
    '@media (max-width:560px){#dstCookie{padding:18px}#dstCookie .dstBtns{width:100%}#dstCookie button{flex:1}}';

  function styles() {
    if (document.getElementById('dstCookieCSS')) return;
    var st = document.createElement('style');
    st.id = 'dstCookieCSS';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function close(box) {
    box.classList.remove('in');
    setTimeout(function () { box.remove(); }, 450);
  }

  function mount() {
    if (document.getElementById('dstCookie')) return;
    styles();

    var box = document.createElement('div');
    box.id = 'dstCookie';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Preferencias de cookies');

    // Al reabrir desde el pie mostramos la decisión vigente; en la primera
    // visita no hay ninguna que mostrar.
    var estado = saved
      ? '<span class="dstNow">Tu preferencia actual: ' +
        (saved === 'granted' ? 'cookies aceptadas' : 'cookies rechazadas') + '.</span>'
      : '';

    box.innerHTML =
      '<p>Usamos cookies propias y de terceros para medir el rendimiento del sitio y la efectividad de ' +
      'nuestra publicidad. Puedes rechazarlas sin perder acceso a nada. ' +
      // URL absoluta a propósito: este archivo también se carga desde
      // blog.destiny.mx, donde /privacidad.html no existe (es WordPress).
      '<a href="https://destiny.mx/privacidad.html">Aviso de Privacidad</a>.' + estado + '</p>' +
      '<div class="dstBtns">' +
        '<button type="button" data-consent="denied" aria-pressed="' + (saved === 'denied') + '">Rechazar</button>' +
        '<button type="button" class="ok" data-consent="granted" aria-pressed="' + (saved === 'granted') + '">Aceptar</button>' +
      '</div>';

    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-consent]');
      if (!b) return;
      apply(b.getAttribute('data-consent'));
      close(box);
    });

    document.body.appendChild(box);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.classList.add('in'); });
    });
  }

  function open() {
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
  }

  // --- 4. API pública para el enlace de preferencias del pie. ---
  window.DESTINY_CONSENT = {
    open: open,
    get state() { return saved; }   // 'granted' | 'denied' | null
  };

  // Delegado en el documento: funciona con los pies que se inyectan por JS.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('#cookiePrefs, [data-cookie-prefs]');
    if (!a) return;
    ev.preventDefault();
    var box = document.getElementById('dstCookie');
    if (box) { close(box); return; }   // segundo clic: cierra
    open();
  });

  // --- 5. Primera visita: el banner se muestra solo. ---
  if (saved) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
