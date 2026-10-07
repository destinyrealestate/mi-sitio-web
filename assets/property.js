/* ============================================================
   DESTINY — página de propiedad
   Las fichas viven en /proyectos/{slug} (generadas por
   scripts/build-fichas.py con el contenido ya escrito en el HTML) y
   llevan el slug en <body data-prop>. Las landings de proyecto también.
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  // Primero data-prop, que es el que llevan las fichas y las landings. ?p= y
  // ?proj= quedan de respaldo: el .htaccess ya los manda a /proyectos/{slug}.
  const slug = (document.body && document.body.dataset.prop) ||
    params.get("p") || params.get("proj") || "";
  const p = D.get(slug);

  // Slug inexistente: antes caía en Faena con 200, y Google veía una copia de
  // Faena en cada URL mal escrita. Ahora se marca noindex y se va a la colección.
  if (!p) {
    const m = document.createElement("meta");
    m.name = "robots"; m.content = "noindex";
    document.head.appendChild(m);
    location.replace("/#mapa");
    return;
  }

  // Las fichas viven en /proyectos/, así que toda ruta de assets/ tiene que
  // ser root-absoluta o se resolvería contra la subcarpeta.
  const root = (u) => (/^assets\//).test(u) ? "/" + u : u;

  // El desarrollo de la página se resuelve aquí y lo consume tracking.js para
  // el evento view_project. El formulario NO lo necesita: forms.js lee
  // data-prop y saca el nombre y la zona del catálogo por su cuenta.
  if (document.body) document.body.setAttribute("data-desarrollo", p.slug);

  /* ---------- El formulario en modo solicitud ----------
     Los CTA "Solicitar dossier" y "Solicitar price list" no abren un formulario
     distinto: reusan el de la página cambiándole el encabezado, la nota y el
     texto del botón, y escribiéndole el contexto. forms.js lee data-context en
     el momento del envío, no al dibujar, así que basta con ponerlo aquí para
     que viaje a Make y a la página de gracias. */
  function modoSolicitud(titulo, nota, boton, contexto) {
    const card = $("#formPropiedad");
    if (!card) return;
    const host = card.querySelector("[data-destiny-form]");
    if (host) host.setAttribute("data-context", contexto);
    const head = card.querySelector(".form__head .h-3");
    if (head) head.textContent = titulo;
    const note = card.querySelector(".form__note");
    if (note) note.textContent = nota;
    // La etiqueta la dibuja forms.js, así que puede no existir todavía si el
    // visitante hace clic antes de que el motor monte. No es un error.
    const label = card.querySelector(".dstf-label");
    if (label) label.textContent = boton;
  }

  // Contexto por defecto del formulario: este proyecto.
  (function () {
    const host = document.querySelector("#formPropiedad [data-destiny-form]");
    if (host) host.setAttribute("data-context", p.name);
  })();

  const STATUS = ["En construcción", "Pre-venta", "Entrega inmediata", "Cerca de la playa"];
  const status = p.badges.find(b => STATUS.includes(b)) || "Disponible";
  const area = p.m2 || "Consultar";
  const beds = (p.bd && p.bd !== "—") ? p.bd : "Consultar";

  const set = (sel, val) => { const e = $(sel); if (e) e.textContent = val; };
  document.title = `${p.name} · ${p.zone} — Destiny Real Estate`;

  // Canónica, Open Graph, description y JSON-LD ya vienen escritos en el HTML
  // de cada ficha (scripts/build-fichas.py). Aquí no se tocan: Google y las
  // vistas previas de WhatsApp leen el HTML crudo, no lo que pinta el JS.

  // hero
  const toUrl = e => (/^(\/?assets\/|https?:)/).test(e) ? root(e) : "https://lh3.googleusercontent.com/d/" + e + "=w1600";
  const heroSrc = (p.gallery && p.gallery[0]) ? toUrl(p.gallery[0]) : D.absUrl(p.img);
  $("#pHeroImg").src = heroSrc;
  $("#pHeroImg").alt = p.name;

  /* ---------- video de fondo del hero (solo proyectos con `heroVideo`) ----------
     El <img> del hero queda como cartel de respaldo y el video se funde encima
     cuando ya puede reproducirse. Solo se descarga en pantallas grandes, con
     conexión decente y sin ahorro de datos: en móvil o datos limitados se queda
     la imagen. El archivo va sin pista de audio, y además lo silenciamos.
     Las LP que ya traen su propio #pHeroVideo en el HTML se saltan este bloque. */
  (function () {
    if (!p.heroVideo || document.getElementById("pHeroVideo")) return;
    const bg = $(".hero--prop .hero__bg");
    if (!bg) return;

    const mqMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mqMotion && mqMotion.matches) return;
    if (window.innerWidth < 768) return;

    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (c && (c.saveData || /^(slow-)?2g$/.test(c.effectiveType || "") || c.effectiveType === "3g")) return;

    const v = document.createElement("video");
    v.id = "pHeroVideo";
    v.className = "hero__video";
    v.muted = true;
    v.volume = 0;
    v.autoplay = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("aria-hidden", "true");
    v.tabIndex = -1;
    v.addEventListener("canplay", () => v.classList.add("is-ready"));
    v.addEventListener("error", () => v.remove());
    v.preload = "auto";
    v.src = root(p.heroVideo);
    bg.appendChild(v);

    const play = v.play();
    if (play && play.catch) play.catch(() => { /* si el navegador lo bloquea, queda la imagen */ });
  })();

  // galería dinámica — muestra TODOS los renders disponibles
  const gal = $("#pGallery");
  if (gal) {
    const imgs = p.gallery || [];
    if (imgs.length) {
      let g = `<div class="big"><img src="${toUrl(imgs[0])}" alt="${p.name}" loading="lazy" referrerpolicy="no-referrer"></div>`;
      for (let i = 1; i < imgs.length; i++) g += `<div><img src="${toUrl(imgs[i])}" alt="${p.name}" loading="lazy" referrerpolicy="no-referrer"></div>`;
      gal.innerHTML = g;
    } else {
      const labels = ["Render — lobby", "Render — amenidades", "Render — vista", "Plano tipo"];
      let g = `<div class="big"><img src="${D.absUrl(p.img)}" alt="${p.name}" referrerpolicy="no-referrer"></div>`;
      for (let i = 0; i < 4; i++) g += `<div class="ph"><span>${labels[i]}</span></div>`;
      gal.innerHTML = g;
    }
    /* video del proyecto (solo proyectos con campo `video`). Si la página trae su
       propia sección #pVideoBox —arriba de la galería— lo montamos ahí, con la
       carátula del hero y un botón de play (sin autoplay); si no existe, cae al
       final de la galería como antes. */
    if (p.video) {
      const src = `<source src="${root(p.video)}" type="video/mp4">`;
      const box = $("#pVideoBox");
      if (box) {
        box.innerHTML = `<video controls preload="metadata" playsinline poster="${heroSrc}">${src}</video>`;
        const sec = box.closest("section");
        if (sec) sec.hidden = false;
        set("#pVideoTitle", `${p.name}, por dentro.`);
        const vid = box.querySelector("video");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lpvid__play";
        btn.setAttribute("aria-label", `Reproducir el video de ${p.name}`);
        btn.innerHTML = "<i></i>";
        box.appendChild(btn);
        btn.addEventListener("click", () => vid.play());
        vid.addEventListener("play", () => box.classList.add("playing"));
      } else {
        const vid = document.createElement("div");
        vid.className = "pVideo reveal d1";
        vid.style.marginTop = "18px";
        vid.innerHTML = `<video controls preload="metadata" playsinline poster="${heroSrc}" style="width:100%;aspect-ratio:16/9;height:auto;display:block;border-radius:14px;background:#000;object-fit:cover;">${src}</video>`;
        gal.insertAdjacentElement("afterend", vid);
      }
    }
  }
  $("#pBadges").innerHTML = p.badges.map((b, i) =>
    `<span class="badge${(p.gold && i === 0) ? " gold" : ""}">${b}</span>`).join("");
  set("#pName", p.name);
  set("#pPrice", p.price.replace("Desde ", "").replace(" USD", ""));
  set("#pBeds", beds);
  set("#pBaths", p.ba || "—");
  set("#pArea", p.entrega || area);
  const crumb = $("#pZoneCrumb");
  if (crumb) crumb.textContent = p.zone;

  // facts bar
  const type = p.badges.find(b => !STATUS.includes(b)) || "Residencia de lujo";
  set("#fStatus", status);
  set("#fType", type);
  set("#fBeds", beds);
  set("#fArea", p.renta === "corta" ? "Renta corta" : "Renta anual");

  // sobre el proyecto + ficha técnica
  set("#sobreTitle", p.name);
  const descEl = $("#pDesc");
  if (descEl) {
    const descTxt = p.desc || `${p.name} es uno de los desarrollos verificados por Destiny en ${p.zone}. Solicita la ficha completa — números reales, comisiones del desarrollador y costos ocultos — en tu sesión de claridad.`;
    // Soporta varios párrafos: separar el texto en bloques con doble salto de línea.
    descEl.innerHTML = descTxt.split(/\n\n+/).map(s => s.trim()).filter(Boolean).join("<br><br>");
  }
  const ficha = [["Zona", p.zone], ["Tipo", type], ["Modalidad de renta", p.renta ? (p.renta === "corta" ? "Renta corta permitida" : "Renta tradicional (anual)") : ""], ["Recámaras", beds], ["Superficie", p.m2], ["Amenidades", p.amenidades], ["Desarrollador", p.developer], ["Arquitectura", p.arquitecto], ["Unidades", p.units], ["Entrega", p.entrega]].filter(r => r[1]);
  const fichaEl = $("#pFicha");
  if (fichaEl) fichaEl.innerHTML = ficha.map(r => `<div class="row"><div class="k">${r[0]}</div><div class="v">${r[1]}</div></div>`).join("");

  // Documentos oficiales (fact sheet / brochure) + price list por tipología.
  // Solo se muestra en proyectos que definen `docs` o `priceTable`; el resto no cambia.
  (function () {
    const sec = $("#docs");
    if (!sec || (!p.docs && !p.priceTable)) return;
    sec.hidden = false;
    const docsEl = $("#pDocs");
    if (docsEl && p.docs) {
      docsEl.innerHTML = p.docs.map(d => {
        const ext = d.external ? ' target="_blank" rel="noopener"' : ' download';
        return `<a class="payinfo__card payinfo__doc" href="${root(d.href)}"${ext} style="text-decoration:none;display:flex;align-items:center;justify-content:space-between;gap:14px;">`
          + `<span><span class="payinfo__k">${d.sub || "Documento"}</span><span class="payinfo__v" style="display:block;">${d.label}</span></span>`
          + `<span class="ar" style="color:var(--gold);font-size:20px;">${d.external ? "↗" : "↓"}</span></a>`;
      }).join("");
    } else if (docsEl) { docsEl.style.display = "none"; }
    const priceWrap = $("#pPriceWrap"), priceTbl = $("#pPriceTable");
    if (priceWrap && priceTbl && p.priceTable) {
      priceWrap.hidden = false;
      priceTbl.innerHTML = p.priceTable.map(r =>
        `<div class="row"><div class="k">${r[0]}</div><div class="v">${r[1]} · <strong>desde ${r[2]}</strong></div></div>`).join("");
    }
    // CTA "Solicitar price list completo" → abre el formulario en modo solicitud (como el dossier)
    const reqPL = $("#reqPriceList");
    if (reqPL) {
      reqPL.addEventListener("click", () => modoSolicitud(
        "Solicita el price list completo",
        `Te enviamos el price list completo por unidad de ${p.name} por WhatsApp o correo.`,
        "Solicitar el price list",
        `${p.name} — price list`
      ));
    }
  })();

  // veredicto Lectura Destiny (por proyecto, con fallback)
  const verdictEl = $("#pVerdict");
  if (verdictEl) verdictEl.innerHTML = p.lectura || "Te decimos <em>cómo se arma la compra</em> — el activo, los números y la estructura — antes de que firmes.";

  // lectura de marca (solo proyectos branded con campo `marca`)
  const marcaEl = $("#pMarca");
  if (marcaEl && p.marca) {
    marcaEl.innerHTML = p.marca;
    const blk = $("#pMarcaBlock");
    if (blk) blk.hidden = false;
  }

  // cta name
  set("#ctaName", p.name);

  // Fase / plan de pago / entrega
  set("#pFase", p.fase || status);
  set("#pEntrega2", p.entrega || "Por confirmar");
  set("#pPago", p.pago || "Estructura de pagos bajo solicitud — la revisamos contigo en la sesión.");

  // Botón "Solicitar dossier" → el mismo formulario, en modo solicitud
  (function () {
    const btn = $("#reqDossier");
    if (!btn) return;
    btn.addEventListener("click", () => modoSolicitud(
      "Solicita el dossier",
      `Te enviamos el dossier completo de ${p.name} por WhatsApp o correo.`,
      "Solicitar el dossier",
      `${p.name} — dossier`
    ));
  })();

  // ubicación + zona link
  const zone = D.ZONES.find(z => z.zoneName === p.zone);
  const zlink = $("#pZoneLink");
  if (zone) {
    set("#ubicTitle", zone.name);
    set("#ubicDesc", zone.long || zone.desc);
    if (zlink) zlink.href = `/zonas/${zone.slug}`;
    if (crumb) crumb.href = `/zonas/${zone.slug}`;
  } else {
    set("#ubicTitle", p.zone);
    set("#ubicDesc", `${p.zone} es una de las zonas que cubrimos en Miami. Solicita el análisis de demanda de renta y plusvalía para esta ubicación.`);
    if (zlink) zlink.href = "/#zonas";
    if (crumb) crumb.href = "/#mapa";
  }

  // mapa de la propiedad — Google Maps (embed, sin API key)
  const mapEl = $("#pMap");
  if (mapEl) {
    const ZC = {
      "Brickell": [25.7589, -80.1935], "Sunny Isles": [25.9529, -80.1207],
      "Downtown": [25.7765, -80.1880], "Coral Gables": [25.7460, -80.2580],
      "Wynwood": [25.8045, -80.1990], "North Bay Village": [25.8470, -80.1530],
      "Bal Harbour": [25.8915, -80.1265], "North Miami": [25.9000, -80.1700],
      "Hollywood": [26.0112, -80.1495], "Pompano Beach": [26.2360, -80.1250]
    };
    const center = p.coords || ZC[p.zone] || [25.7617, -80.1918];
    const q = encodeURIComponent(p.name + ", " + p.zone + ", FL");
    mapEl.innerHTML = '<iframe title="Ubicación de ' + p.name + '" src="https://maps.google.com/maps?q=' + q + '&z=15&output=embed" style="width:100%;height:100%;border:0;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
  }

  // relacionados (misma zona, excluye actual; completa con otros)
  let rel = D.byZone(p.zone).filter(x => x.slug !== p.slug);
  if (rel.length < 3) rel = rel.concat(D.PROPS.filter(x => x.slug !== p.slug && x.zone !== p.zone));
  rel = rel.slice(0, 3);
  set("#railTitle", D.byZone(p.zone).length > 1 ? `Más proyectos en ${p.zone}` : "Sigue explorando la colección");
  const railEl = $("#pRail");
  if (railEl) railEl.innerHTML = rel.map(D.cardHTML).join("");

  // scarcity (conservando el punto)
  const SCAR = { "Pre-venta": "Preventa · precios de fase inicial", "En construcción": "En construcción · unidades limitadas", "Entrega inmediata": "Entrega inmediata · disponibilidad final" };
  const sc = $("#pScarcity"); if (sc) sc.innerHTML = '<span class="dot"></span> ' + (SCAR[status] || "Disponibilidad limitada");

  // barra fija: datos
  const priceFrom = p.price.replace("Desde ", "").split("–")[0].trim();
  set("#sbName", p.name);
  set("#sbPrice", priceFrom);

  // highlights dinámicos
  const STATUS_NOTE = { "Pre-venta": "Entras al mejor precio, antes del público.", "En construcción": "Plusvalía capturada antes de la entrega.", "Entrega inmediata": "Flujo de renta desde el primer mes." };
  const hls = p.highlights || [
    ["Ubicación", p.zone, zone ? zone.kicker : "Zona prime de Miami"],
    ["Precio de entrada", priceFrom, "Precio de entrada al proyecto, verificado y sin sobreprecio."],
    ["Financiamiento", "Hasta 70%", "Disponible para compradores nacionales y extranjeros."],
    ["Estatus", status, STATUS_NOTE[status] || "Activo verificado por Destiny."]
  ];
  const hlEl = $("#pHighlights");
  if (hlEl) hlEl.innerHTML = hls.map(h => `<div class="hl__card"><div class="hl__k">${h[0]}</div><div class="hl__v">${h[1]}</div><div class="hl__d">${h[2]}</div></div>`).join("");

  // barra fija: mostrar tras el hero, ocultar cerca del formulario
  const sticky = $("#stickybar"), agendaSec = $("#agenda");
  if (sticky && agendaSec) {
    const st = () => { const past = window.scrollY > window.innerHeight * 0.7; const r = agendaSec.getBoundingClientRect(); const fv = r.top < window.innerHeight && r.bottom > 0; sticky.classList.toggle("show", past && !fv); };
    window.addEventListener("scroll", st, { passive: true });
    window.addEventListener("resize", st, { passive: true });
    st();
  }

  D.initShell();
  document.querySelectorAll(".hero .reveal").forEach(el => el.classList.add("in"));
  document.querySelectorAll("#pRail .card").forEach((c, i) => { c.classList.add("reveal"); if (i) c.classList.add("d" + i); D.revealObserve(c); });
})();
