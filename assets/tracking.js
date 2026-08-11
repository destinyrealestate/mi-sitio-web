/* ============================================================
   DESTINY — capa de eventos. EL ÚNICO LUGAR DONDE SE MIDE.
   ============================================================
   Ningún otro archivo del sitio llama a gtag, a fbq, a oaiq ni a dataLayer.
   forms.js dibuja y envía formularios y avisa aquí; aquí se decide qué
   sale a Google Ads, a Meta, a GA4 y al Pixel de OpenAI.

   ------------------------------------------------------------
   1 · CÓMO SE LLAMA CADA EVENTO Y POR QUÉ
   ------------------------------------------------------------
   Un evento sale de aquí con DOS nombres a la vez:

     · al dataLayer, con el nombre que escucha el contenedor de GTM;
     · a GA4, con su nombre propio por `gtag('event', …)`.

   Los dos nombres tienen que ser DISTINTOS, y ese es el detalle que hay
   que entender antes de tocar nada. `tags.js` define gtag como un push a
   window.dataLayer, así que un `gtag('event','generate_lead',…)` TAMBIÉN
   aterriza en el dataLayer y GTM lo lee como un evento más. Con el mismo
   nombre en las dos vías, cada activador se cumple dos veces:

     índice  9 → dataLayer.push({event:'generate_lead', …})
     índice 10 → gtag('event','generate_lead', {…})

   Verificado en Tag Assistant el 2026-08-05: la etiqueta salía "Activado
   2 veces" en un solo envío. Cada lead se habría cobrado doble en Ads.

   La tabla de abajo (GTM_EVENTO) respeta esa regla: el nombre de GA4 es
   siempre el interno (`form_lead`, `agenda_solicitada`, `whatsapp_click`)
   y el del dataLayer es el que pide el contenedor (`generate_lead`,
   `click_whatsapp`). Ninguno de los dos coincide, así que ningún
   activador puede dispararse dos veces.

   ⚠️ AL AGREGAR UN EVENTO NUEVO: si el nombre que va al dataLayer llegara
   a ser igual al que se manda a GA4, vuelve el doble conteo. Los eventos
   que GTM no escucha llevan prefijo `dst_` justamente para no chocar
   nunca; solo se le pone nombre limpio a lo que el contenedor escucha.

   Historia: entre el 2026-08-05 y el 2026-08-11 TODOS los eventos salieron
   con prefijo `dst_`, incluidos los tres que el contenedor escucha. En ese
   periodo Google Ads no registró ni una conversión: el contenedor esperaba
   `generate_lead` y el sitio emitía `dst_form_lead`. Ver MEDICION.md.

   ------------------------------------------------------------
   2 · QUIÉN DISPARA LAS CONVERSIONES DE GOOGLE ADS
   ------------------------------------------------------------
   Hoy las dispara GTM (contenedor GTM-KW8TPGGG, versión 3 publicada el
   2026-08-11). Por eso CONVERSIONES_POR_CODIGO arranca en false: si este
   archivo también las disparara, cada conversión se contaría DOS veces
   —una por código y otra por GTM— y el costo por lead que reporta Ads
   saldría a la mitad del real.

   Para pasarlas a código hay que hacer las TRES cosas, en este orden:
     1. Pausar o borrar en GTM las etiquetas "Ads · …".
     2. Devolver a tags.js el `gtag("config", GOOGLE_ADS_ID)` que se quitó
        el 2026-08-11: sin la etiqueta base configurada, un
        `gtag("event","conversion",{send_to:"AW-…/rótulo"})` no llega.
     3. Recién entonces poner CONVERSIONES_POR_CODIGO en true.
   En otro orden queda un hueco sin conversiones o un doble conteo.

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

  /* Evento estándar del Pixel de OpenAI por acción. El vocabulario es
     cerrado (lead_created, registration_completed, appointment_scheduled,
     order_created…): un nombre inventado no se mide, hay que mandarlo como
     evento "custom". Los tres que usamos comparten la forma
     "customer_action", que admite amount y currency.

     La conversión configurada en el Ads Manager de OpenAI es lead_created;
     las otras dos se mandan para tener la foto completa.

     whatsapp_click y click_telefono también entran como lead_created: en
     este sitio son contacto directo, no navegación, y OpenAI no tiene un
     equivalente al "Contact" de Meta. */
  var OPENAI = {
    form_lead:         "lead_created",
    whatsapp_click:    "lead_created",
    click_telefono:    "lead_created",
    agenda_solicitada: "appointment_scheduled",
    newsletter_signup: "registration_completed"
  };

  var CONVERSIONES = ["form_lead", "whatsapp_click", "agenda_solicitada", "newsletter_signup"];

  /* ---------- Los nombres que escucha GTM ----------
     Esta tabla es un CONTRATO con el contenedor publicado: cambiar una
     línea aquí sin cambiar el activador de GTM apaga esa conversión sin
     que nada avise. Lo que no esté en la tabla sale como `dst_<nombre>`,
     que ningún activador escucha.

     Contenedor GTM-KW8TPGGG, versión 3:
       generate_lead + form_type = 'sesion'  → Ads · agenda_solicitada (2000)
       generate_lead + form_type ≠ 'sesion'  → Ads · form_lead (500)
       click_whatsapp                        → Ads · whatsapp_click (500)

     newsletter_signup NO está aquí a propósito. En Ads existe su acción
     de conversión (Suscribirse, 100 MXN), pero no hay etiqueta que la
     dispare en GTM y no debe contarse como form_lead: inflaría los leads
     con suscriptores de correo y le enseñaría al algoritmo a perseguir
     newsletters en lugar de inversionistas. Sale como
     dst_newsletter_signup, listo para el día que se cree la etiqueta. */
  var GTM_EVENTO = {
    form_lead:         "generate_lead",
    agenda_solicitada: "generate_lead",
    whatsapp_click:    "click_whatsapp"
  };

  /* Los dos leads viajan con el mismo nombre de evento, así que lo único
     que distingue a la sesión de claridad —y sus 2000 MXN— es form_type.
     forms.js manda la clave de su catálogo de tipos ("agenda"); el
     contenedor espera "sesion". Se traduce aquí, en un solo lugar, en vez
     de renombrar el tipo en forms.js: ese nombre también viaja a Make, a
     HubSpot y a las páginas de gracias, y renombrarlo allá rompería el
     historial de leads por un detalle de medición. El valor original no se
     pierde: viaja en form_tipo. */
  var GTM_FORM_TYPE = { agenda_solicitada: "sesion" };

  /* ---------- Guardas ---------- */

  function esDesarrollo() {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "" || h === "::1" ||
           /\.local$/.test(h) || location.protocol === "file:";
  }
  var DEV = esDesarrollo();

  /* Ni Meta ni OpenAI leen el Consent Mode de Google: si el visitante
     rechazó, hay que no llamarlos nosotros. Google Ads y GA4 sí lo respetan
     solos a través de gtag, así que a esos no hay que ponerles guarda.

     (OpenAI además tiene su propio oaiq("consent", …), que se declara en
     tags.js y se actualiza en consent.js. Esta guarda es el cinturón sobre
     los tirantes: si el SDK todavía no cargó, la llamada se queda encolada
     y saldría igual.) */
  function consentimientoPermitido() {
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

  /* `listo` es opcional. Cuando se pasa, se llama en cuanto GTM terminó de
     disparar sus etiquetas para este evento. Lo usa forms.js para no
     redirigir a la página de gracias antes de que la conversión salga:
     `location.href` corta las peticiones pendientes, y las etiquetas de
     GTM se evalúan de forma asíncrona. Sin esta espera, la conversión del
     formulario se perdía en las conexiones lentas. */
  function emitir(nombre, params, listo) {
    params = params || {};

    var esConversion = CONVERSIONES.indexOf(nombre) >= 0;
    var eventId = params.event_id || "";
    var valor = params.value != null ? params.value : VALORES[nombre];
    var moneda = params.currency || "MXN";

    var email = normEmail(params.user_email);
    var tel = normTel(params.user_phone);

    /* El payload que ve GTM. Lleva la atribución completa —incluido el
       gclid que guardó attribution.js en su cookie de 90 días— para que
       cualquier etiqueta nueva pueda leerla sin volver a resolverla. */
    var eventoGTM = GTM_EVENTO[nombre] || ("dst_" + nombre);
    var payload = Object.assign(
      { event: eventoGTM, evento: nombre, desarrollo: desarrollo() },
      atribucion(),
      params
    );
    if (valor != null) { payload.value = valor; payload.currency = moneda; }
    // Los datos del usuario van normalizados: es lo que lee la etiqueta de
    // conversiones mejoradas de GTM. Nunca salen a ninguna otra parte.
    if (email) payload.user_email = email;
    if (tel) payload.user_phone = tel;

    /* Una variable del dataLayer CONSERVA su valor entre pushes de la misma
       página: si un push de generate_lead llegara sin form_type, GTM leería
       el de la vez anterior y podría cobrar una sesión de 2000 por un lead
       de 500. Por eso form_type siempre se escribe, aunque quien llame no
       lo mande. */
    if (GTM_FORM_TYPE[nombre]) {
      if (params.form_type) payload.form_tipo = params.form_type;
      payload.form_type = GTM_FORM_TYPE[nombre];
    } else if (eventoGTM === "generate_lead" && !payload.form_type) {
      payload.form_type = nombre;
    }

    /* eventTimeout: si una etiqueta se cuelga, GTM llama igual al callback
       al cumplirse el plazo. El setTimeout de más es para el caso en que
       GTM ni siquiera cargó —bloqueador de anuncios, red caída— y por lo
       tanto nunca va a llamar a nadie. */
    if (typeof listo === "function") {
      var avisado = false;
      var avisar = function () {
        if (avisado) return;
        avisado = true;
        try { listo(); } catch (e) {}
      };
      payload.eventCallback = avisar;
      payload.eventTimeout = 1200;
      setTimeout(avisar, 1500);
    }

    window.dataLayer.push(payload);

    var registro = {
      evento: nombre, dataLayer: eventoGTM, valor: valor, moneda: moneda,
      event_id: eventId, meta: null, ads: null, ga4: null, openai: null,
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
    } else if (!consentimientoPermitido()) {
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

    /* ---- Pixel de OpenAI ----
       Se manda el MISMO event_id que a Meta. Aquí sirve para deduplicar
       contra la API de conversiones de OpenAI el día que Make la mande;
       mientras tanto no estorba. */
    var oaEvento = params.openai_event || OPENAI[nombre];
    if (!oaEvento) {
      registro.openai = null;                       // evento sin equivalente
    } else if (DEV) {
      registro.openai = "omitido (desarrollo)";
    } else if (!consentimientoPermitido()) {
      registro.openai = "omitido (consentimiento denegado)";
    } else if (typeof window.oaiq === "function") {
      try {
        var op = { type: "customer_action" };
        if (valor != null) { op.amount = valor; op.currency = moneda; }
        // Sin event_id se llama con tres argumentos, no con un cuarto en
        // undefined: el SDK encola `arguments` tal cual y no hay por qué
        // hacerle leer un objeto que no existe.
        if (eventId) window.oaiq("measure", oaEvento, op, { event_id: eventId });
        else window.oaiq("measure", oaEvento, op);
        registro.openai = oaEvento + (eventId ? " · event_id " + eventId : " · SIN event_id");
      } catch (e) { registro.openai = "error: " + e.message; }
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
    formLead:         function (p, listo) { emitir("form_lead", p, listo); },
    agendaSolicitada: function (p, listo) { emitir("agenda_solicitada", p, listo); },
    newsletterSignup: function (p, listo) { emitir("newsletter_signup", p, listo); },
    whatsappClick:    function (p, listo) { emitir("whatsapp_click", p, listo); },
    emitir: emitir,

    // Lo que consume diagnostico.html
    historial: function () { return HISTORIAL.slice(); },
    config: function () {
      return {
        ads_id: ADS_ID,
        conversiones_por_codigo: CONVERSIONES_POR_CODIGO,
        etiquetas: ETIQUETAS,
        valores: VALORES,
        gtm_evento: GTM_EVENTO,
        gtm_form_type: GTM_FORM_TYPE,
        desarrollo: DEV,
        openai_pixel_id: (window.DestinyTags && window.DestinyTags.OPENAI_PIXEL_ID) || "",
        openai_eventos: OPENAI,
        consentimiento_permitido: consentimientoPermitido()
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
     el pie— sin volver a enganchar nada.

     No se hace preventDefault ni se retrasa la navegación, y no hace falta:
     TODOS los enlaces de WhatsApp del sitio son api.whatsapp.com con
     target="_blank", así que la página no se descarga y el evento sale
     tranquilo. El día que alguien ponga un enlace de WhatsApp sin
     target="_blank", ese clic se va a perder: hay que retrasar la
     navegación como se hace en forms.js con el eventCallback. */

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
