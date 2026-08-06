/* ============================================================
   DESTINY — motor de formularios nativos
   ============================================================
   Sustituye a assets/zoho-embed.js. Los formularios dejan de vivir en un
   iframe de forms.zohopublic.com y pasan a ser HTML propio de destiny.mx.

   POR QUÉ SE MIGRÓ
   Los cuatro formularios de Zoho (HOMETOFU, NEWSLETTER, CIPRIANI y
   MERCEDES) NO tenían ni un solo campo oculto de atribución. zoho-embed.js
   les mandaba 16 parámetros en el src del iframe —gclid, wbraid, UTMs,
   desarrollo— y Zoho los descartaba en silencio, exactamente como advertía
   el comentario de ese archivo. Ningún lead llegaba con su origen. Además,
   al enviarse dentro de un iframe de otro dominio, el envío ocurría fuera
   de destiny.mx y no podía disparar la conversión.

   CÓMO SE USA
   En el HTML se marca un contenedor y este archivo dibuja el formulario:

     <div data-destiny-form="lead"></div>
     <div data-destiny-form="lead" data-variant="preconstruccion"></div>
     <div data-destiny-form="newsletter"></div>

   Atributos opcionales del contenedor:
     data-variant   variante del tipo (ver VARIANTES)
     data-cta       texto del botón
     data-gracias   página de gracias a la que redirige
     data-title     si se pasa, dibuja también el encabezado de la tarjeta
     data-sub       texto pequeño a la derecha del encabezado
     data-note      línea bajo el encabezado
     data-extra     campos adicionales separados por coma (del catálogo CAMPOS)
     data-context   contexto legible que viaja al webhook (ej. nombre del proyecto)

   SEPARACIÓN DE RESPONSABILIDADES (no romper)
   Este archivo NO dispara medición. No hay gtag, ni fbq, ni dataLayer aquí
   dentro. Al enviarse con éxito llama a window.destinyTrack (tracking.js) y
   ahí se decide qué se manda a Google Ads, Meta y GA4. Esa separación ya
   existía en el proyecto y se conserva.

   ORDEN DE CARGA
     1. assets/consent.js
     2. assets/attribution.js
     3. assets/tags.js
     ... (data.js donde aplique, para el catálogo de propiedades y zonas)
     n. assets/tracking.js
     n+1. assets/forms.js   <- este archivo
   ============================================================ */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     EL WEBHOOK DE MAKE
     ------------------------------------------------------------------
     Escenario "WEB · Formularios destiny.mx → HubSpot + ActiveCampaign +
     aviso" (id 5871285, equipo 2342480), creado el 2026-08-06.

     ⚠️ EL ESCENARIO ESTÁ INACTIVO. Mientras no se active en Make, este
     webhook acepta la petición y la encola sin procesarla: el lead no se
     pierde, pero tampoco llega a HubSpot ni a ActiveCampaign hasta que
     alguien le dé a Activar. Es lo que se pidió —armado y en revisión—
     pero hay que acordarse de encenderlo el día del despliegue.

     Si algún día se rehace el escenario, la URL cambia y hay que
     actualizarla aquí. Es el único lugar donde vive.
     ------------------------------------------------------------------ */
  var MAKE_WEBHOOK_URL = "https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2";

  var WEBHOOK_LISTO = MAKE_WEBHOOK_URL.indexOf("http") === 0;

  /* Tiempo mínimo de llenado. Por debajo de esto se descarta como bot.
     Un humano no llena ni el formulario de una sola casilla en 3 segundos. */
  var MIN_SEGUNDOS = 3;

  /* ==================================================================
     1 · CATÁLOGO DE CAMPOS
     ==================================================================
     Un campo se define una vez y se reutiliza en todos los tipos. Para
     agregar un campo nuevo al sitio se agrega aquí y se nombra en el
     tipo que lo necesite: no se toca el HTML de ninguna página.
     Las opciones de presupuesto son las mismas que pedía Zoho, para no
     romper el histórico de leads; las de capital y plazo vienen de
     LANDINGS-ADS.md. ================================================== */
  var CAMPOS = {
    nombre: {
      tipo: "text", label: "Nombre completo", ph: "Tu nombre",
      req: true, autocomplete: "name", err: "Ingresa tu nombre."
    },
    email: {
      tipo: "email", label: "Correo electrónico", ph: "tucorreo@empresa.com",
      req: true, autocomplete: "email", inputmode: "email",
      err: "Ingresa un correo válido."
    },
    telefono: {
      tipo: "tel", label: "WhatsApp", ph: "+52 55 1234 5678",
      req: true, autocomplete: "tel", inputmode: "tel",
      err: "Ingresa un teléfono con al menos 10 dígitos."
    },
    pais: {
      tipo: "text", label: "País de origen", ph: "México",
      req: true, autocomplete: "country-name", err: "Requerido."
    },
    ciudad: {
      tipo: "text", label: "Ciudad", ph: "Monterrey",
      req: false, autocomplete: "address-level2"
    },
    presupuesto: {
      tipo: "select", label: "¿Cuál es tu presupuesto?",
      req: true, err: "Selecciona un rango.",
      opciones: ["$500K - $1M USD", "$1M - $2M USD", "$2M - $5M USD", "Más de $5M USD"]
    },
    /* Marca, Inversión y Artículo arrancan un escalón más abajo que el resto
       del sitio: son páginas de descubrimiento, no de un proyecto concreto de
       varios millones. Se conserva su escala tal cual estaba para no dejar
       fuera al inversionista de $250K, que hoy sí cabe en ese formulario. */
    monto: {
      tipo: "select", label: "Monto a invertir (USD)",
      req: true, err: "Selecciona un rango.",
      opciones: ["$250K - $500K USD", "$500K - $1M USD", "$1M - $2M USD", "Más de $2M USD"]
    },
    capital: {
      tipo: "select", label: "¿Con cuánto capital cuentas para invertir?",
      req: true, err: "Selecciona un rango.",
      opciones: ["Menos de $100,000 USD", "$100,000 - $250,000 USD",
                 "$250,000 - $500,000 USD", "Más de $500,000 USD"]
    },
    cuando: {
      tipo: "select", label: "¿Cuándo planeas invertir?",
      req: true, err: "Selecciona una opción.",
      opciones: ["En los próximos 30 días", "En 3 a 6 meses", "Solo estoy explorando"]
    },
    perfil: {
      tipo: "select", label: "¿Qué buscas en una propiedad?",
      req: true, err: "Selecciona una opción.",
      opciones: ["Máxima rentabilidad", "Vivir en Miami, Florida", "Diversificar patrimonio"]
    },
    plazo: {
      tipo: "select", label: "¿En qué plazo tienes pensado comprar?",
      req: true, err: "Selecciona una opción.",
      opciones: ["1 a 3 meses", "3 a 6 meses", "6 a 12 meses", "Más de 12 meses"]
    },
    horario: {
      tipo: "select", label: "Horario preferido para la sesión",
      req: false,
      opciones: ["Mañana (9 a 13 h)", "Tarde (13 a 18 h)", "Indistinto"]
    },
    mensaje: {
      tipo: "textarea", label: "Mensaje (opcional)",
      ph: "Cuéntanos qué estás buscando", req: false, max: 600
    }
  };

  /* ==================================================================
     2 · TIPOS DE FORMULARIO
     ==================================================================
     `evento` es el nombre que se le pasa a window.destinyTrack. `meta` es
     el evento estándar del Pixel que le corresponde: viaja como parámetro
     para que tracking.js lo use, porque el fbq NO se dispara desde aquí.
     ================================================================== */
  var TIPOS = {
    lead: {
      campos: ["nombre", "email", "telefono", "pais", "presupuesto"],
      evento: "form_lead", meta: "Lead", valor: 500,
      gracias: "/gracias.html", cta: "Agendar mi sesión de claridad"
    },
    agenda: {
      campos: ["nombre", "email", "telefono", "pais", "presupuesto"],
      evento: "agenda_solicitada", meta: "Schedule", valor: 2000,
      gracias: "/gracias-sesion", cta: "Agendar mi sesión de claridad"
    },
    guia: {
      campos: ["nombre", "email", "telefono"],
      evento: "form_lead", meta: "Lead", valor: 500,
      gracias: "/gracias-guia", cta: "Recibir la guía"
    },
    club: {
      campos: ["nombre", "email", "telefono", "perfil"],
      evento: "form_lead", meta: "CompleteRegistration", valor: 500,
      gracias: "/gracias-club", cta: "Entrar al Club"
    },
    scorecard: {
      campos: ["nombre", "email", "telefono"],
      evento: "form_lead", meta: "CompleteRegistration", valor: 500,
      gracias: "/gracias-scorecard", cta: "Recibir el Scorecard"
    },
    propiedad: {
      campos: ["nombre", "email", "telefono", "presupuesto"],
      evento: "form_lead", meta: "Lead", valor: 500,
      gracias: "/gracias.html", cta: "Agendar mi sesión de claridad"
    },
    zona: {
      campos: ["nombre", "email", "telefono", "presupuesto"],
      evento: "form_lead", meta: "Lead", valor: 500,
      gracias: "/gracias.html", cta: "Agendar mi sesión de claridad"
    },
    newsletter: {
      campos: ["email"],
      evento: "newsletter_signup", meta: "Subscribe", valor: 100,
      gracias: "/gracias-newsletter", cta: "Suscribirme"
    },
    radar: {
      campos: ["email"],
      evento: "newsletter_signup", meta: "Subscribe", valor: 100,
      gracias: "/gracias-newsletter", cta: "Suscribirme al Radar"
    }
  };

  /* Variantes: heredan todo del tipo y sobrescriben lo que declaren.
     Las dos landings de Google Ads piden los calificadores de capital y
     plazo (LANDINGS-ADS.md) y tienen su propia página de gracias. */
  var VARIANTES = {
    preconstruccion: {
      campos: ["nombre", "telefono", "email", "capital", "cuando"],
      gracias: "/gracias-preconstruccion", cta: "Ver si califico"
    },
    dolares: {
      campos: ["nombre", "telefono", "email", "capital", "cuando"],
      gracias: "/gracias-dolares", cta: "Ver si califico"
    },
    /* Marca, Inversión y Artículo: mismo lead, pero con la escala de monto
       más amplia que ya usaban esas tres páginas. */
    patrimonio: {
      campos: ["nombre", "email", "telefono", "pais", "monto"]
    }
  };

  /* ==================================================================
     3 · UTILIDADES
     ================================================================== */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* UUID v4. crypto.randomUUID no existe en Safari viejo ni en http://,
     así que hay dos respaldos. El event_id es CRÍTICO: es lo que permite
     que Meta deduplique el evento del Pixel (navegador) contra el de la
     CAPI (servidor, desde Make). Si se generaran dos distintos, cada lead
     se contaría dos veces en el Administrador de Eventos. */
  function uuid() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
      }
      if (window.crypto && window.crypto.getRandomValues) {
        var b = new Uint8Array(16);
        window.crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        var h = [];
        for (var i = 0; i < 16; i++) h.push((b[i] + 0x100).toString(16).slice(1));
        return h.slice(0, 4).join("") + "-" + h.slice(4, 6).join("") + "-" +
               h.slice(6, 8).join("") + "-" + h.slice(8, 10).join("") + "-" +
               h.slice(10, 16).join("");
      }
    } catch (e) {}
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : ((r & 0x3) | 0x8)).toString(16);
    });
  }

  function cookie(nombre) {
    var m = document.cookie.match("(^|;\\s*)" + nombre + "=([^;]*)");
    return m ? decodeURIComponent(m[2]) : "";
  }

  /* GA4 client_id: la cookie _ga vale "GA1.1.1234567890.1699999999" y el
     client_id son los dos últimos segmentos. Si no se puede leer (consent
     denegado, navegador que bloquea cookies) se manda null — nunca un
     valor inventado, porque un client_id falso ensucia el informe de GA4
     con usuarios que no existen. */
  function ga4ClientId() {
    var v = cookie("_ga");
    if (!v) return null;
    var p = v.split(".");
    return p.length >= 4 ? p[2] + "." + p[3] : null;
  }

  /* GA4 session_id: vive en _ga_<sufijo del measurement id> con el formato
     "GS1.1.<session_id>.<n>....". El measurement id se lee de tags.js para
     no repetirlo aquí. */
  function ga4SessionId() {
    var id = (window.DestinyTags && window.DestinyTags.GA4_ID) || "";
    var sufijo = id.replace(/^G-/, "");
    if (!sufijo) return null;
    var v = cookie("_ga_" + sufijo);
    if (!v) return null;
    var p = v.split(".");
    return p.length >= 3 && p[2] ? p[2] : null;
  }

  function consentState() {
    try {
      if (window.DESTINY_CONSENT && window.DESTINY_CONSENT.state) {
        return window.DESTINY_CONSENT.state;   // 'granted' | 'denied'
      }
    } catch (e) {}
    return null;   // todavía no decide: el banner sigue abierto
  }

  /* ISO 8601 con la zona horaria real del visitante (-05:00), no en UTC.
     Saber que un lead entró a las 23:40 hora de México, y no a las 05:40
     del día siguiente, cambia cómo se lee el reporte por horario. */
  function ahoraISO() {
    var d = new Date();
    var off = -d.getTimezoneOffset();
    var signo = off >= 0 ? "+" : "-";
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var abs = Math.abs(off);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) +
      signo + pad(Math.floor(abs / 60)) + ":" + pad(abs % 60);
  }

  /* Atribución completa. attribution.js expone `filled()` hoy y va a
     exponer un objeto con first/last touch en el Prompt 2: aquí se leen
     los dos y se usa el que exista, para que este archivo no se rompa ni
     antes ni después de esa extensión. */
  function atribucion() {
    var A = window.DestinyAttr;
    if (!A) return {};
    try {
      if (typeof A.payload === "function") return A.payload() || {};
      if (typeof A.all === "function") return A.all() || {};
    } catch (e) {}
    return {};
  }

  function esLocal() {
    var h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "" || h === "::1" ||
           /\.local$/.test(h) || location.protocol === "file:";
  }

  /* ==================================================================
     4 · CONTEXTO DE PROPIEDAD / ZONA
     ==================================================================
     La página de propiedad y la de zona comparten plantilla y se
     diferencian por el parámetro de la URL. El nombre legible del
     desarrollo o de la zona se saca del catálogo de data.js: mandarle a
     Make solo el slug obligaría a mantener una segunda tabla de nombres
     dentro del escenario. ================================================== */
  function contexto() {
    var qp;
    try { qp = new URLSearchParams(location.search); } catch (e) { qp = null; }
    var g = function (k) { return qp ? (qp.get(k) || "") : ""; };
    var body = document.body;
    var D = window.DESTINY;
    var out = {
      desarrollo_slug: "", desarrollo_nombre: "",
      zona_slug: "", zona_nombre: ""
    };

    var pslug = g("p") || g("proj") || (body && body.getAttribute("data-prop")) || "";
    if (!pslug && body && body.getAttribute("data-page-type") === "proyecto") {
      pslug = body.getAttribute("data-desarrollo") || "";
    }
    if (pslug) {
      out.desarrollo_slug = pslug;
      var p = D && D.get ? D.get(pslug) : null;
      if (p) { out.desarrollo_nombre = p.name; out.zona_nombre = p.zone; }
    }

    var zslug = g("z") || "";
    if (zslug) {
      out.zona_slug = zslug;
      var z = D && D.getZone ? D.getZone(zslug) : null;
      if (z) out.zona_nombre = z.name;
    }

    if (!out.desarrollo_slug && body) {
      var d = body.getAttribute("data-desarrollo") || "";
      if (d && d !== "home") out.desarrollo_slug = d;
    }
    return out;
  }

  /* ==================================================================
     5 · RENDER
     ================================================================== */

  var seq = 0;

  function config(host) {
    var tipo = host.getAttribute("data-destiny-form") || "lead";
    var variante = host.getAttribute("data-variant") || "";
    var base = TIPOS[tipo];
    if (!base) {
      if (window.console) console.warn('[destiny-forms] tipo desconocido: "' + tipo + '"');
      return null;
    }
    var cfg = {};
    var k;
    for (k in base) if (Object.prototype.hasOwnProperty.call(base, k)) cfg[k] = base[k];
    var v = VARIANTES[variante];
    if (v) for (k in v) if (Object.prototype.hasOwnProperty.call(v, k)) cfg[k] = v[k];

    cfg.tipo = tipo;
    cfg.variante = variante;

    // Campos extra declarados en el HTML: <div data-extra="mensaje,horario">
    var extra = (host.getAttribute("data-extra") || "").split(",");
    cfg.campos = cfg.campos.slice();
    for (var i = 0; i < extra.length; i++) {
      var nom = extra[i].trim();
      if (nom && CAMPOS[nom] && cfg.campos.indexOf(nom) < 0) cfg.campos.push(nom);
    }

    if (host.getAttribute("data-cta")) cfg.cta = host.getAttribute("data-cta");
    if (host.getAttribute("data-gracias")) cfg.gracias = host.getAttribute("data-gracias");
    return cfg;
  }

  function campoHTML(nombre, id) {
    var c = CAMPOS[nombre];
    if (!c) return "";
    var fid = id + "_" + nombre;
    var eid = fid + "_err";
    var req = c.req ? " required" : "";
    var aria = ' aria-describedby="' + eid + '"';
    var etiqueta = esc(c.label) + (c.req ? " *" : "");
    var control;

    if (c.tipo === "select") {
      var ops = '<option value="">Selecciona…</option>';
      for (var i = 0; i < c.opciones.length; i++) {
        ops += '<option value="' + esc(c.opciones[i]) + '">' + esc(c.opciones[i]) + "</option>";
      }
      control = '<select id="' + fid + '" name="' + nombre + '"' + req + aria + ">" + ops + "</select>";
    } else if (c.tipo === "textarea") {
      control = '<textarea id="' + fid + '" name="' + nombre + '" rows="3"' +
        (c.max ? ' maxlength="' + c.max + '"' : "") +
        (c.ph ? ' placeholder="' + esc(c.ph) + '"' : "") + req + aria + "></textarea>";
    } else {
      control = '<input type="' + c.tipo + '" id="' + fid + '" name="' + nombre + '"' +
        (c.ph ? ' placeholder="' + esc(c.ph) + '"' : "") +
        (c.autocomplete ? ' autocomplete="' + c.autocomplete + '"' : "") +
        (c.inputmode ? ' inputmode="' + c.inputmode + '"' : "") +
        ' maxlength="120"' + req + aria + ">";
    }

    return '<div class="field" data-campo="' + nombre + '">' +
      '<label for="' + fid + '">' + etiqueta + "</label>" + control +
      '<span class="err" id="' + eid + '">' + esc(c.err || "Requerido.") + "</span></div>";
  }

  function render(host, cfg) {
    var id = "dstf" + (++seq);
    var html = "";

    if (host.getAttribute("data-title")) {
      html += '<div class="form__head"><h3 class="h-3">' + esc(host.getAttribute("data-title")) + "</h3>" +
        (host.getAttribute("data-sub") ? '<span class="form__sub">' + esc(host.getAttribute("data-sub")) + "</span>" : "") +
        "</div>";
    }
    if (host.getAttribute("data-note")) {
      html += '<p class="form__note">' + esc(host.getAttribute("data-note")) + "</p>";
    }

    html += '<form class="dstf" id="' + id + '" novalidate autocomplete="on" ' +
      'aria-label="' + esc(host.getAttribute("data-title") || "Formulario de contacto — Destiny Real Estate") + '">';

    /* Honeypot. Va oculto por CSS y fuera del orden de tabulación: un
       humano nunca lo ve ni lo enfoca, un bot que rellena todo lo que
       encuentra sí. aria-hidden lo saca también del lector de pantalla. */
    html += '<div class="dstf-hp" aria-hidden="true">' +
      '<label for="' + id + '_web">No llenar este campo</label>' +
      '<input type="text" id="' + id + '_web" name="website" tabindex="-1" autocomplete="off"></div>';

    for (var i = 0; i < cfg.campos.length; i++) html += campoHTML(cfg.campos[i], id);

    html += '<button type="submit" class="btn btn-primary dstf-submit">' +
      '<span class="dstf-label">' + esc(cfg.cta) + '</span> <span class="ar">→</span></button>';

    /* Error de envío: no es un alert. Vive dentro del formulario, con
       role="alert" para que el lector de pantalla lo anuncie, y con el
       botón de reintento a un dedo de distancia. */
    html += '<div class="dstf-error" role="alert" hidden>' +
      '<p>No pudimos enviar tus datos. Puede ser tu conexión.</p>' +
      '<button type="button" class="dstf-retry">Reintentar</button>' +
      '<p class="dstf-error-alt">¿Sigue fallando? Escríbenos por ' +
      '<a href="https://api.whatsapp.com/send?phone=525611659009" target="_blank" rel="noopener">WhatsApp</a>.</p></div>';

    html += "</form>";

    /* Leyenda de consentimiento. La exige el aviso de privacidad y la ponía
       zoho-embed.js; se conserva aquí para que ninguna página se quede sin
       ella. URL absoluta a propósito: este archivo también puede cargarse
       desde blog.destiny.mx, donde /privacidad.html no existe. */
    if (host.getAttribute("data-legal") !== "off") {
      html += '<p class="form-legal">Al enviar este formulario aceptas nuestro ' +
        '<a href="https://destiny.mx/privacidad.html">Aviso de Privacidad</a> y el uso de tus ' +
        'datos para contactarte y para las finalidades publicitarias descritas en él.</p>';
    }

    host.innerHTML = html;
    host.classList.add("dstf-host");
    return document.getElementById(id);
  }

  /* ==================================================================
     6 · VALIDACIÓN
     ================================================================== */

  function digitos(s) { return (s || "").replace(/\D/g, ""); }

  function valido(nombre, valor) {
    var c = CAMPOS[nombre];
    var v = (valor || "").trim();
    if (!c) return true;
    if (!c.req && !v) return true;
    if (!v) return false;
    if (nombre === "email") return /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v);
    if (nombre === "telefono") { var d = digitos(v); return d.length >= 10 && d.length <= 15; }
    if (nombre === "nombre") return v.length >= 2;
    return true;
  }

  function marcar(form, nombre, ok) {
    var wrap = form.querySelector('.field[data-campo="' + nombre + '"]');
    if (!wrap) return;
    wrap.classList.toggle("error", !ok);
    var ctrl = wrap.querySelector("input,select,textarea");
    if (ctrl) {
      if (ok) ctrl.removeAttribute("aria-invalid");
      else ctrl.setAttribute("aria-invalid", "true");
    }
  }

  function validar(form, cfg) {
    var primero = null;
    for (var i = 0; i < cfg.campos.length; i++) {
      var n = cfg.campos[i];
      var ctrl = form.querySelector('[name="' + n + '"]');
      if (!ctrl) continue;
      var ok = valido(n, ctrl.value);
      marcar(form, n, ok);
      if (!ok && !primero) primero = ctrl;
    }
    if (primero) { try { primero.focus(); } catch (e) {} return false; }
    return true;
  }

  /* ==================================================================
     7 · ENVÍO
     ================================================================== */

  function payload(form, cfg, host, eventId) {
    var datos = {};
    for (var i = 0; i < cfg.campos.length; i++) {
      var n = cfg.campos[i];
      var ctrl = form.querySelector('[name="' + n + '"]');
      datos[n] = ctrl ? ctrl.value.trim() : "";
    }

    var ctx = contexto();
    var p = {
      form_type: cfg.tipo,
      form_variant: cfg.variante || null,
      form_context: host.getAttribute("data-context") || null,
      page_url: location.href.split("#")[0],
      page_title: document.title,

      nombre: datos.nombre || null,
      email: datos.email || null,
      telefono: datos.telefono || null,
      mensaje: datos.mensaje || null,

      desarrollo_slug: ctx.desarrollo_slug || null,
      desarrollo_nombre: ctx.desarrollo_nombre || null,
      zona_slug: ctx.zona_slug || null,
      zona_nombre: ctx.zona_nombre || null,

      atribucion: atribucion(),
      ga4_client_id: ga4ClientId(),
      ga4_session_id: ga4SessionId(),
      consent_state: consentState(),

      event_id: eventId,
      submitted_at: ahoraISO()
    };

    /* Los campos propios del tipo (presupuesto, capital, perfil…) viajan
       en su propio objeto: así el router de Make no tiene que conocer de
       antemano todos los campos posibles de los nueve tipos. */
    p.extra = {};
    for (var k in datos) {
      if (!Object.prototype.hasOwnProperty.call(datos, k)) continue;
      if (k === "nombre" || k === "email" || k === "telefono" || k === "mensaje") continue;
      if (datos[k]) p.extra[k] = datos[k];
    }
    return p;
  }

  function enviar(p) {
    if (!WEBHOOK_LISTO) {
      if (window.console) {
        console.warn("[destiny-forms] MAKE_WEBHOOK_URL sigue con el placeholder: " +
          "el lead NO se envió a ningún lado. Pega la URL del webhook en assets/forms.js.", p);
      }
      return Promise.resolve();
    }
    return fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
    });
  }

  /* La conversión NO se dispara aquí. Se le pasa a tracking.js todo lo que
     necesita —incluido el event_id, que es lo que deduplica el Pixel del
     navegador contra la CAPI que manda Make— y tracking.js decide qué va a
     Google Ads, a Meta y a GA4. */
  function medir(cfg, p) {
    if (typeof window.destinyTrack !== "function") return;
    try {
      window.destinyTrack(cfg.evento, {
        form_type: p.form_type,
        form_variant: p.form_variant,
        meta_event: cfg.meta,
        event_id: p.event_id,
        value: cfg.valor,
        currency: "MXN",
        user_email: p.email || "",
        user_phone: p.telefono || "",
        desarrollo: p.desarrollo_slug || undefined,
        desarrollo_nombre: p.desarrollo_nombre || undefined,
        zona: p.zona_nombre || undefined
      });
    } catch (e) {}
  }

  function destino(cfg, p) {
    var out = [];
    if (p.desarrollo_slug) out.push("d=" + encodeURIComponent(p.desarrollo_slug));
    if (p.nombre) out.push("n=" + encodeURIComponent(p.nombre.split(" ")[0]));
    out.push("ctx=" + encodeURIComponent(p.form_context || p.desarrollo_nombre || document.title));
    /* form_type viaja para que la página de gracias sepa qué entregar sin
       depender de un atributo escrito a mano en cada archivo. */
    out.push("form_type=" + encodeURIComponent(p.form_type));
    return cfg.gracias + (cfg.gracias.indexOf("?") < 0 ? "?" : "&") + out.join("&");
  }

  /* ==================================================================
     8 · CICLO DE VIDA DE UN FORMULARIO
     ================================================================== */

  function montar(host) {
    if (host.getAttribute("data-dstf-mounted")) return;
    var cfg = config(host);
    if (!cfg) return;
    host.setAttribute("data-dstf-mounted", "1");

    var form = render(host, cfg);
    var boton = form.querySelector(".dstf-submit");
    var etiqueta = form.querySelector(".dstf-label");
    var textoBoton = etiqueta.textContent;
    var cajaError = form.querySelector(".dstf-error");
    var nacido = Date.now();
    var enviando = false;

    // Limpia el estado de error en cuanto el visitante corrige.
    form.addEventListener("input", function (ev) {
      var f = ev.target.closest ? ev.target.closest(".field") : null;
      if (f) f.classList.remove("error");
    });
    form.addEventListener("change", function (ev) {
      var f = ev.target.closest ? ev.target.closest(".field") : null;
      if (f) f.classList.remove("error");
    });

    /* La etiqueta se relee cada vez en lugar de guardarla al montar: la página
       de propiedad la cambia por fuera cuando el visitante pide el dossier o el
       price list, y con un valor cacheado el botón volvía al texto original en
       cuanto había un reintento. */
    function estado(modo) {
      form.setAttribute("data-estado", modo);
      boton.disabled = (modo === "enviando");
      if (modo === "enviando") {
        textoBoton = etiqueta.textContent;
        etiqueta.textContent = "Enviando…";
      } else {
        etiqueta.textContent = textoBoton;
      }
    }

    function intentar() {
      if (enviando) return;                       // bloqueo de doble envío
      if (!validar(form, cfg)) return;

      /* Antibots sin CAPTCHA. Los dos filtros son silenciosos: al bot se
         le responde exactamente igual que a un humano, para que no pueda
         deducir qué lo delató y reintentar sin el honeypot. */
      var trampa = form.querySelector('[name="website"]');
      var rapido = (Date.now() - nacido) < MIN_SEGUNDOS * 1000;
      if ((trampa && trampa.value) || rapido) {
        if (window.DESTINY_DEBUG && window.console) {
          console.log("[destiny-forms] envío descartado", trampa && trampa.value ? "honeypot" : "demasiado rápido");
        }
        estado("enviando");
        setTimeout(function () { location.href = destino(cfg, payload(form, cfg, host, uuid())); }, 600);
        return;
      }

      enviando = true;
      cajaError.hidden = true;
      estado("enviando");

      var p = payload(form, cfg, host, uuid());

      /* En local no sale nada al webhook ni se redirige: se deja el payload
         a la vista. Pero SÍ se llama a tracking.js, porque ahí es donde
         vive la guarda que impide que salga una conversión de verdad, y
         porque sin esta llamada la integración entre los dos archivos no
         se podría probar sin desplegar. tracking.js registra el evento en
         su historial y lo marca como "omitido (desarrollo)": es lo que
         lee diagnostico.html. */
      if (esLocal()) {
        medir(cfg, p);
        if (window.console) console.log("[destiny-forms] modo local — no se envía al webhook ni se redirige", p);
        setTimeout(function () { estado("normal"); enviando = false; alertaLocal(host, p); }, 400);
        return;
      }

      enviar(p).then(function () {
        medir(cfg, p);
        location.href = destino(cfg, p);
      }).catch(function () {
        enviando = false;
        estado("normal");
        cajaError.hidden = false;
        try { cajaError.querySelector(".dstf-retry").focus(); } catch (e) {}
      });
    }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      intentar();
    });
    form.querySelector(".dstf-retry").addEventListener("click", function () {
      cajaError.hidden = true;
      intentar();
    });

    estado("normal");
  }

  /* Vista previa local: en vez de redirigir, deja el payload a la vista.
     Es lo que hace útil a forms-demo.html sin tener Make montado. */
  function alertaLocal(host, p) {
    var caja = host.querySelector(".dstf-local");
    if (!caja) {
      caja = document.createElement("pre");
      caja.className = "dstf-local";
      host.appendChild(caja);
    }
    caja.textContent = "MODO LOCAL — esto es lo que recibiría Make:\n\n" + JSON.stringify(p, null, 2);
  }

  /* ==================================================================
     9 · ARRANQUE
     ================================================================== */

  function run() {
    var nodos = document.querySelectorAll("[data-destiny-form]");
    for (var i = 0; i < nodos.length; i++) montar(nodos[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();

  /* Las páginas de propiedad y de zona montan su formulario por JS después
     del DOM: llaman a refresh() igual que antes llamaban a DestinyZoho. */
  window.DestinyForms = {
    refresh: run,
    TIPOS: TIPOS,
    CAMPOS: CAMPOS,
    VARIANTES: VARIANTES,
    webhookListo: WEBHOOK_LISTO
  };
})();
