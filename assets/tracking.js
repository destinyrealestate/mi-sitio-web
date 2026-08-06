/* ============================================================
   DESTINY — capa de eventos. EL ÚNICO LUGAR DONDE SE MIDE.
   ============================================================
   Ningún otro archivo del sitio llama a gtag, a fbq ni a dataLayer.
   forms.js dibuja y envía formularios y avisa aquí; aquí se decide qué
   sale a Google Ads, a Meta y a GA4.

   ------------------------------------------------------------
   1 · POR QUÉ LOS EVENTOS DEL dataLayer LLEVAN PREFIJO dst_
   ------------------------------------------------------------
   `tags.js` define gtag como un push a window.dataLayer. Eso significa
   que un `gtag('event','form_lead',…)` TAMBIÉN aterriza en el dataLayer
   y GTM lo lee como un evento más. Con el mismo nombre en las dos vías,
   cada activador se cumplía dos veces:

     índice  9 → dataLayer.push({event:'generate_lead', …})
     índice 10 → gtag('event','generate_lead', {…})

   Verificado en Tag Assistant el 2026-08-05: la etiqueta salía "Activado
   2 veces" en un solo envío. Cada lead se habría cobrado doble en Ads.

   Se parcheó entonces poniendo las etiquetas en "Una vez por página".
   Eso tapa el síntoma pero deja la trampa puesta para la siguiente
   etiqueta que alguien cree. Aquí se arregla de raíz: **lo que va al
   dataLayer para GTM lleva prefijo `dst_`, y lo que va a GA4 va con su
   nombre limpio por gtag.** Los dos nombres ya no se pueden confundir, y
   un activador de GTM no puede dispararse dos veces por el mismo evento.

   Al desplegar esto HAY QUE importar el contenedor nuevo (gtm-destiny.json):
   los activadores publicados escuchan `generate_lead` y `click_whatsapp`,
   que ya no se emiten. Ver MEDICION.md.

   ------------------------------------------------------------
   2 · QUIÉN DISPARA LAS CONVERSIONES DE GOOGLE ADS
   ------------------------------------------------------------
   Hoy las dispara GTM (contenedor GTM-KW8TPGGG, versión 2 publicada).
   Por eso CONVERSIONES_POR_CODIGO arranca en false: si este archivo
   también las disparara, cada conversión se contaría DOS veces —una por
   código y otra por GTM— y el costo por lead que reporta Ads saldría a la
   mitad del real.

   Para pasarlas a código hay que hacer las dos cosas, en este orden:
     1. Pausar o borrar en GTM las cuatro etiquetas "Ads · …".
     2. Recién entonces poner CONVERSIONES_POR_CODIGO en true.
   Al revés queda un hueco sin conversiones.

   GA4 y el Pixel de Meta SÍ salen por código siempre: GTM no los
   administra (ver la regla de convivencia en tags.js), y el Pixel además
   necesita el event_id que genera forms.js para deduplicar contra la CAPI
   que manda Make.
   ============================================================ */
(function () {
  "use strict";

  window.dataLayer = window.dataLayer || [];

  /* ---------- Configuración ---------- */

  // false = las conversiones de Ads las dispara GTM (estado actual).
  var CONVERSIONES_POR_CODIGO = false;

  var ADS_ID = (window.DestinyTags && window.DestinyTags.GOOGLE_ADS_ID) || "AW-18368975159";

  /* Rótulos de las acciones de conversión de Google Ads. */
  var ETIQUETAS = {
    form_lead:         "D636CNu6xdwcELeigbdE",
    whatsapp_click:    "eUBKCN66xdwcELeigbdE",
    agenda_solicitada: "p8UOCOG6xdwcELeigbdE",
    /* Creada en Google Ads el 2026-08-06, categoría Suscribirse, 100 MXN,
       recuento Una.

       NO se pudo marcar como secundaria: Google deshabilita esa opción
       cuando el objetivo no es predeterminado de la cuenta. En la práctica
       se comporta igual, porque Ads solo la cuenta en la columna
       Conversiones de una campaña que use explícitamente el objetivo
       Suscribirse. De ahí sale una regla que hay que respetar:

       ⛔ NO agregar el objetivo "Suscribirse" a las campañas de Fase 1.

       Si se agrega, el algoritmo empieza a perseguir suscripciones de 100
       pesos en lugar de inversionistas de varios millones. */
    newsletter_signup: "mofbCOvqmN0cELeigbdE"
  };

  var VALORES = {
    form_lead: 500,
    whatsapp_click: 500,
    agenda_solicitada: 2000,
    newsletter_signup: 100
  };

  /* Evento estándar del Pixel por acción. forms.js manda uno más fino en
     params.meta_event (CompleteRegistration para club y scorecard), y ese
     tiene prioridad. */
  var META = {
    form_lead: "Lead",
    whatsapp_click: "Contact",
    agenda_solicitada: "Schedule",
    newsletter_signup: "Subscribe",
    click_telefono: "Contact"
  };

  var CONVERSIONES = ["form_lead", "whatsapp_click", "agenda_solicitada", "newsletter_signup"];

  /* ---------- Guardas ---------- */

  function esDesarrollo() {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "" || h === "::1" ||
           /\.local$/.test(h) || location.protocol === "file:";
  }
  var DEV = esDesarrollo();

  /* Meta no lee el Consent Mode de Google: si el visitante rechazó, hay que
     no llamar a fbq nosotros. Google Ads y GA4 sí lo respetan solos a
     través de gtag, así que a esos no hay que ponerles guarda. */
  function metaPermitido() {
    try {
      return !(window.DESTINY_CONSENT && window.DESTINY_CONSENT.state === "denied");
    } catch (e) { return true; }
  }

  /* ---------- Normalización para conversiones mejoradas ----------
     Google hashea del lado del cliente; nosotros solo normalizamos. Si se
     manda sin normalizar, el hash no coincide con el que Google tiene y la
     conversión mejorada no empareja con nadie. */

  function normEmail(v) {
    return String(v || "").trim().toLowerCase();
  }

  /* E.164. El mercado principal es México, así que un número de 10 dígitos
     sin lada se asume mexicano. Los 11 dígitos que empiezan en 1 se asumen
     de Estados Unidos (+1), que en un sitio de Miami es el caso real; el
     prefijo mexicano heredado "1" aparece como 13 dígitos (521…), y ese sí
     se limpia. */
  function normTel(v) {
    var s = String(v || "").trim();
    if (!s) return "";
    var mas = s.charAt(0) === "+";
    var d = s.replace(/\D/g, "");
    if (!d) return "";
    if (mas) return "+" + d;
    if (d.length === 10) return "+52" + d;
    if (d.length === 13 && d.slice(0, 3) === "521") return "+52" + d.slice(3);
    if (d.length === 12 && d.slice(0, 2) === "52") return "+" + d;
    if (d.length === 11 && d.charAt(0) === "1") return "+" + d;
    return "+" + d;
  }

  /* ---------- Contexto ---------- */

  var ATTR = window.DestinyAttr;

  function desarrollo() {
    return (document.body && document.body.getAttribute("data-desarrollo")) || "home";
  }

  function atribucion() {
    if (!ATTR) return {};
    try { return ATTR.filled() || {}; } catch (e) { return {}; }
  }

  function log() {
    if (!window.DESTINY_DEBUG && !DEV) return;
    try { console.log.apply(console, ["[destiny]"].concat([].slice.call(arguments))); } catch (e) {}
  }

  /* Historial de lo que se disparó en esta página. Lo lee diagnostico.html:
     sin esto, comprobar la medición es abrir Tag Assistant y adivinar. */
  var HISTORIAL = [];

  /* ==================================================================
     EL EMISOR
     ================================================================== */

  function emitir(nombre, params) {
    params = params || {};

    var esConversion = CONVERSIONES.indexOf(nombre) >= 0;
    var eventId = params.event_id || "";
    var valor = params.value != null ? params.value : VALORES[nombre];
    var moneda = params.currency || "MXN";

    var email = normEmail(params.user_email);
    var tel = normTel(params.user_phone);

    /* El payload que ve GTM. Lleva la atribución completa para que
       cualquier etiqueta nueva pueda leerla sin volver a resolverla. */
    var payload = Object.assign(
      { event: "dst_" + nombre, evento: nombre, desarrollo: desarrollo() },
      atribucion(),
      params
    );
    if (valor != null) { payload.value = valor; payload.currency = moneda; }
    // Los datos del usuario van normalizados: es lo que lee la etiqueta de
    // conversiones mejoradas de GTM. Nunca salen a ninguna otra parte.
    if (email) payload.user_email = email;
    if (tel) payload.user_phone = tel;

    window.dataLayer.push(payload);

    var registro = {
      evento: nombre, dataLayer: "dst_" + nombre, valor: valor, moneda: moneda,
      event_id: eventId, meta: null, ads: null, ga4: null,
      ts: new Date().toISOString()
    };

    /* ---- Google Ads ---- */
    var etiqueta = ETIQUETAS[nombre];
    if (esConversion) {
      if (!CONVERSIONES_POR_CODIGO) {
        registro.ads = "la dispara GTM";
      } else if (!etiqueta) {
        registro.ads = "sin rótulo — acción no creada en Ads";
      } else if (DEV) {
        registro.ads = "omitida (desarrollo)";
      } else if (typeof window.gtag === "function") {
        try {
          // Conversiones mejoradas: se declaran ANTES de la conversión.
          if (email || tel) {
            var ud = {};
            if (email) ud.email = email;
            if (tel) ud.phone_number = tel;
            window.gtag("set", "user_data", ud);
          }
          window.gtag("event", "conversion", {
            send_to: ADS_ID + "/" + etiqueta,
            value: valor,
            currency: moneda,
            transaction_id: eventId
          });
          registro.ads = ADS_ID + "/" + etiqueta;
        } catch (e) { registro.ads = "error: " + e.message; }
      }
    }

    /* ---- GA4 ---- */
    if (DEV) {
      registro.ga4 = "omitido (desarrollo)";
    } else if (typeof window.gtag === "function") {
      try {
        var ga = Object.assign({}, params);
        delete ga.user_email;
        delete ga.user_phone;
        delete ga.meta_event;
        ga.desarrollo = desarrollo();
        if (valor != null) { ga.value = valor; ga.currency = moneda; }
        window.gtag("event", nombre, ga);
        registro.ga4 = nombre;
      } catch (e) { registro.ga4 = "error: " + e.message; }
    }

    /* ---- Meta Pixel ----
       El eventID es lo que permite que Meta deduplique este evento contra
       el que Make manda por la CAPI con el MISMO id. Sin él, cada lead
       aparece dos veces en el Administrador de Eventos. */
    var metaEvento = params.meta_event || META[nombre];
    if (DEV) {
      registro.meta = "omitido (desarrollo)";
    } else if (!metaPermitido()) {
      registro.meta = "omitido (consentimiento denegado)";
    } else if (typeof window.fbq === "function") {
      try {
        var mp = { content_name: desarrollo() };
        if (valor != null) { mp.value = valor; mp.currency = moneda; }
        if (params.form_type) mp.content_category = params.form_type;
        var opts = eventId ? { eventID: eventId } : undefined;
        if (metaEvento) window.fbq("track", metaEvento, mp, opts);
        else window.fbq("trackCustom", nombre, mp, opts);
        registro.meta = (metaEvento || nombre) + (eventId ? " · eventID " + eventId : " · SIN eventID");
      } catch (e) { registro.meta = "error: " + e.message; }
    }

    HISTORIAL.push(registro);
    log(nombre, registro, payload);
  }

  /* ==================================================================
     API PÚBLICA
     ==================================================================
     destinyTrack(nombre, params) es lo que llama forms.js. Las funciones
     con nombre son azúcar para no escribir cadenas sueltas por ahí. */

  window.destinyTrack = emitir;

  window.DestinyMedicion = {
    formLead:         function (p) { emitir("form_lead", p); },
    agendaSolicitada: function (p) { emitir("agenda_solicitada", p); },
    newsletterSignup: function (p) { emitir("newsletter_signup", p); },
    whatsappClick:    function (p) { emitir("whatsapp_click", p); },
    emitir: emitir,

    // Lo que consume diagnostico.html
    historial: function () { return HISTORIAL.slice(); },
    config: function () {
      return {
        ads_id: ADS_ID,
        conversiones_por_codigo: CONVERSIONES_POR_CODIGO,
        etiquetas: ETIQUETAS,
        valores: VALORES,
        desarrollo: DEV,
        meta_permitido: metaPermitido()
      };
    },
    normEmail: normEmail,
    normTel: normTel
  };

  /* ==================================================================
     CLICS DELEGADOS
     ==================================================================
     Delegación en document con captura: funciona con enlaces que se
     agregan después de cargar la página —los pinta app.js, property.js y
     el pie— sin volver a enganchar nada. */

  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";

    if (/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(href)) {
      emitir("whatsapp_click", {
        link_url: href,
        link_text: (a.textContent || "").trim().slice(0, 80)
      });
      return;
    }
    if (/^tel:/i.test(href)) {
      emitir("click_telefono", { phone: href.replace(/^tel:/i, "") });
      return;
    }
    if (/^mailto:/i.test(href)) {
      emitir("click_email", { email_to: href.replace(/^mailto:/i, "") });
      return;
    }
    var file = href.match(/\/([^\/?#]+\.(?:pdf|xlsx|xls|zip|docx|csv))(?:[?#]|$)/i);
    if (file) {
      emitir("file_download", {
        file_name: decodeURIComponent(file[1]),
        file_extension: file[1].split(".").pop().toLowerCase(),
        link_url: href
      });
    }
  }, true);

  /* ==================================================================
     EVENTOS DE CARGA
     ================================================================== */

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  onReady(function () {
    var body = document.body;
    var pageType = body.getAttribute("data-page-type") || "";
    var qp = new URLSearchParams(location.search);

    if (pageType === "proyecto") {
      emitir("view_project", {
        project_slug: desarrollo(),
        project_name: (document.getElementById("pName") || {}).textContent || ""
      });
    }

    /* ------------------------------------------------------------
       LAS PÁGINAS DE GRACIAS YA NO DISPARAN LA CONVERSIÓN
       ------------------------------------------------------------
       Aquí vivía un `generate_lead` que salía al cargar cualquier página
       con data-page-type="gracias". Tenía sentido cuando el formulario
       era un iframe de Zoho: el envío ocurría en otro dominio y la única
       señal que llegaba al navegador era el aterrizaje en la página de
       gracias.

       Desde que los formularios son nativos, forms.js dispara la
       conversión en el momento del envío. Dejar además el disparo al
       cargar contaría cada lead dos veces, y además una tercera por cada
       vez que alguien recargara la página de gracias o volviera a ella
       desde el historial.

       Disparar al enviar es mejor por otra razón: no depende de que el
       visitante complete la redirección. Si se le cae la red justo
       después de enviar, el lead ya está registrado y medido.

       Lo que sí se conserva es la señal de que la página se vio, sin
       valor y sin conversión, para poder medir la caída entre envío y
       llegada. ------------------------------------------------------- */
    if (pageType === "gracias") {
      var d = (qp.get("d") || "").trim();
      if (d) body.setAttribute("data-desarrollo", d);
      emitir("gracias_vista", {
        form_type: body.getAttribute("data-form-type") || qp.get("form_type") || "",
        contexto: qp.get("ctx") || ""
      });
    }
  });

  /* ==================================================================
     MICRO-CONVERSIONES
     ================================================================== */

  var scrolled90 = false;
  window.addEventListener("scroll", function () {
    if (scrolled90) return;
    var h = document.documentElement;
    var max = (h.scrollHeight - h.clientHeight);
    if (max <= 0) return;
    if ((h.scrollTop || document.body.scrollTop) / max >= 0.9) {
      scrolled90 = true;
      emitir("scroll_90", { percent_scrolled: 90 });
    }
  }, { passive: true });

  var engaged = false, active = 0, last = Date.now();
  setInterval(function () {
    if (engaged || document.hidden) { last = Date.now(); return; }
    var now = Date.now();
    active += (now - last);
    last = now;
    if (active >= 60000) {
      engaged = true;
      emitir("engaged_60s", { engagement_time_msec: active });
    }
  }, 5000);
  document.addEventListener("visibilitychange", function () { last = Date.now(); });
})();
