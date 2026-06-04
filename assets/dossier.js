/* ============================================================
   DESTINY — Dossier de inversión (dinámico por ?p=slug / ?proj=)
   Imprimible a PDF · alimentado desde data.js
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY;
  const params = new URLSearchParams(location.search);
  const slug = params.get("p") || params.get("proj");
  const p = D.get(slug);
  const doc = document.getElementById("doc");

  if (!p) { document.getElementById("err").style.display = "block"; return; }

  document.title = `Dossier — ${p.name} · Destiny Real Estate`;

  const abs = (g) => D.absUrl ? D.absUrl(g) : g;
  const esc = (s) => (s == null ? "" : String(s));
  const clean = (s) => esc(s).replace(/<[^>]*>/g, "");

  // Enlace al PDF pre-generado (Oscar lo comparte; descarga directa si existe).
  const pdfBase = (typeof window !== "undefined" && window.DESTINY_DOSSIER_BASE) || "dossiers/";
  const pdfBtn = document.getElementById("pdfBtn");
  if (pdfBtn) pdfBtn.setAttribute("href", pdfBase + p.slug + ".pdf");

  // ---- Logo real de Destiny ----
  const logoLight = abs("assets/logo-light.png"); // crema · fondos oscuros
  const logoDark = abs("assets/logo-dark.png");    // tinta · fondos claros
  const markDark = `<img class="dlogo" src="${logoDark}" alt="Destiny Real Estate">`;
  const markLight = `<img class="dlogo" src="${logoLight}" alt="Destiny Real Estate">`;

  // ---- Imágenes ----
  const gimgs = (p.gallery && p.gallery.length ? p.gallery : [p.img]);
  const pick = (i) => abs(gimgs[i % gimgs.length]);

  // ---- Datos derivados ----
  const STATUS = ["En construcción", "Pre-venta", "Entrega inmediata", "Frente al mar", "Frente a la bahía"];
  const status = (p.badges || []).find(b => STATUS.includes(b)) || "Disponible";
  const rentaTxt = p.renta === "corta" ? "Renta corta / flexible" : p.renta === "tradicional" ? "Renta tradicional (anual)" : "—";

  // ---- PORTADA ----
  const badges = (p.badges || []).map(b => `<span>${esc(b)}</span>`).join("");
  const cover = `
  <section class="sheet cover">
    <img class="cover__img" src="${abs(p.img)}" alt="${esc(p.name)}">
    <div class="cover__scrim"></div>
    <div class="cover__in">
      <div class="cover__top">
        ${markLight}
        <div class="cover__tag">Dossier de inversión<br>Confidencial · ${new Date().getFullYear()}</div>
      </div>
      <div class="cover__btm">
        <div class="cover__zone">${esc(p.zone)} · Miami</div>
        <h1>${esc(p.name)}</h1>
        <div class="cover__badges">${badges}</div>
        <div class="cover__price"><small>Precios desde</small>${esc(p.price || "Bajo solicitud")}</div>
        <div class="cover__doc">Preparado por Destiny Real Estate · Oscar Chapa</div>
      </div>
    </div>
  </section>`;

  // ---- RESUMEN + FICHA TÉCNICA + HIGHLIGHTS ----
  const fase = p.fase || status;
  const pago = p.pago || "Estructura de pagos bajo solicitud — la revisamos contigo en la sesión.";
  const entrega = p.entrega || "Por confirmar";
  // recorta texto en frontera de palabra para que cada hoja quepa en 1 página A4
  const trunc = (s, n) => { s = clean(s); if (s.length <= n) return s; let t = s.slice(0, n); const i = t.lastIndexOf(" "); return (i > 40 ? t.slice(0, i) : t) + "…"; };

  const specRows = [
    ["Precio", p.price || "Bajo solicitud"],
    ["Recámaras", (p.bd && p.bd !== "—") ? p.bd : "Consultar"],
    ["Baños", p.ba || "Consultar"],
    ["Superficie", p.m2 || "Consultar"],
    ["Fase", fase],
    ["Renta", rentaTxt],
  ];
  const specs = specRows.map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${esc(v)}</div></div>`).join("");
  const hls = (p.highlights || []).map(h =>
    `<div class="hl"><div class="k">${esc(h[0])}</div><div class="v">${esc(h[1])}</div><div class="d">${esc(h[2])}</div></div>`
  ).join("");
  const lede = p.lectura ? `<p class="lede">${p.lectura}</p>` : (p.desc ? `<p class="lede">${trunc(p.desc, 300)}</p>` : "");

  const summary = `
  <section class="sheet"><div class="pad pad--fill">
    <div class="shead"><span class="eyebrow">Resumen ejecutivo</span>${markDark}</div>
    <h2 class="title">${esc(p.name)}</h2>
    ${lede}
    <div class="specs">${specs}</div>
    <div class="payblock">
      <div class="pb"><span class="pk">Fase del proyecto</span><span class="pv">${esc(fase)}</span></div>
      <div class="pb"><span class="pk">Entrega estimada</span><span class="pv">${esc(entrega)}</span></div>
      <div class="pb pb--wide"><span class="pk">Plan de pago</span><span class="pv">${esc(pago)}</span></div>
    </div>
    <div class="featimg" style="background-image:url('${pick(1)}')"></div>
  </div></section>`;

  // ---- HIGHLIGHTS + LECTURA DE MARCA + DESCRIPCIÓN + AMENIDADES ----
  const hlsBlock = hls ? `<div class="hls" style="margin-bottom:22px;">${hls}</div>` : "";
  const marcaBlock = p.marca ? `<div class="marca"><div class="k">Lectura de marca · la verdad antes de firmar</div><p>${esc(p.marca)}</p></div>` : "";
  const descBlock = p.desc ? `<div class="block"><h3>Sobre el proyecto</h3><p>${trunc(p.desc, 620)}</p></div>` : "";
  const ameBlock = p.amenidades ? `<div class="block"><h3>Amenidades</h3><p>${trunc(p.amenidades, 380)}</p></div>` : "";
  let analysis = "";
  if (hlsBlock || marcaBlock || descBlock || ameBlock) {
    analysis = `
    <section class="sheet"><div class="pad pad--fill">
      <div class="shead"><span class="eyebrow">Lectura Destiny</span>${markDark}</div>
      <h2 class="title" style="margin-bottom:18px;">El análisis honesto</h2>
      ${hlsBlock}${marcaBlock}${descBlock}${ameBlock}
      <div class="featimg" style="background-image:url('${pick(2)}')"></div>
    </div></section>`;
  }

  // ---- GALERÍA (paginada 6 por hoja, imágenes que llenan la hoja) ----
  let galleryPages = "";
  // Solo arma galería si hay imágenes reales (no la única imagen de la tarjeta)
  const imgs = (p.gallery && p.gallery.length > 1) ? p.gallery.slice(0, 18) : [];
  for (let i = 0; i < imgs.length; i += 6) {
    const chunk = imgs.slice(i, i + 6);
    const n = chunk.length;
    const odd = n % 2 === 1;
    const rows = Math.floor(n / 2) + (n % 2);          // imagen impar ocupa su propia fila a todo el ancho
    const gh = Math.round((234 - (rows - 1) * 2.1) / rows); // altura fija que llena ~la hoja
    const grid = chunk.map((g, j) =>
      `<img class="${odd && j === n - 1 ? "span" : ""}" src="${abs(g)}" alt="${esc(p.name)}">`
    ).join("");
    galleryPages += `
    <section class="sheet"><div class="pad">
      <div class="shead"><span class="eyebrow">Galería${i ? " · continúa" : ""}</span>${markDark}</div>
      <div class="gal" style="--gh:${gh}mm">${grid}</div>
    </div></section>`;
  }

  // ---- UBICACIÓN + CONTACTO + DISCLAIMER ----
  const zoneObj = D.getZone ? D.getZone(p.zone) : null;
  const zoneDesc = (zoneObj && (zoneObj.desc || zoneObj.lede)) ? clean(zoneObj.desc || zoneObj.lede) : `${esc(p.zone)}, uno de los enclaves de inversión más sólidos de Miami.`;
  const coordsTxt = (p.coords && p.coords.length === 2) ? `${p.coords[0].toFixed(5)}, ${p.coords[1].toFixed(5)}` : "Disponible a solicitud";
  const wa = "https://api.whatsapp.com/send?phone=525611659009&text=" +
    encodeURIComponent(`Hola Oscar, recibí el dossier de ${p.name} y quiero el análisis completo.`);

  const contact = `
  <section class="sheet contact"><div class="pad pad--fill">
    <div class="shead" style="border-color:rgba(255,255,255,.2)"><span class="eyebrow">Siguiente paso</span>${markLight}</div>
    <h2 class="title">Hablemos con números reales.</h2>
    <p class="lede">Este dossier es el punto de partida. El verdadero valor está en la sesión: te mostramos comisiones, costos ocultos y si este proyecto encaja con tu capital — sin promesas de retorno y sin compromiso de compra.</p>

    <div class="loc">
      <div class="box"><div class="k">Ubicación</div><div class="v">${esc(p.zone)}, Miami, FL<br><span style="opacity:.7;font-size:11px;">${coordsTxt}</span></div></div>
      <div class="box"><div class="k">La zona</div><div class="v" style="font-size:11.5px;line-height:1.6;">${zoneDesc.slice(0, 220)}</div></div>
    </div>

    <div class="advisor">
      <img src="${abs('assets/img/oscar-asesor.jpg')}" alt="Oscar Chapa">
      <div><div class="n">Oscar Chapa</div><div class="r">Tu asesor · Fundador de Destiny Real Estate</div>
      <div style="font-size:11px;opacity:.8;margin-top:8px;color:#fff;">chapa@destiny.mx · destiny.mx</div></div>
    </div>
    <div class="ctas">
      <a class="gold" href="${wa}">Agendar mi sesión de claridad →</a>
      <a class="ghost" href="https://destiny.mx">Ver más proyectos</a>
    </div>

    <div class="featimg featimg--dark" style="background-image:url('${pick(4)}')"></div>

    <div class="disclaimer">
      Este documento es material informativo preparado por Destiny Real Estate y no constituye una oferta de venta ni una recomendación de inversión. Precios, disponibilidad, especificaciones, amenidades y fechas de entrega provienen de los desarrolladores, son aproximados y están sujetos a cambio sin previo aviso; deben verificarse contra los documentos oficiales del desarrollo (offering / purchase agreement) antes de cualquier decisión. Las imágenes son renders artísticos. Destiny Real Estate no garantiza rendimientos. Las marcas y logos mencionados pertenecen a sus respectivos propietarios.
    </div>
    <div class="foot-mark"><span>Destiny Real Estate</span><span>${esc(p.name)} · Dossier ${new Date().getFullYear()}</span></div>
  </div></section>`;

  doc.innerHTML = cover + summary + analysis + galleryPages + contact;

  // ---- Rellena el espacio sobrante de cada hoja con una imagen (sin overflow ni slivers) ----
  function fillSheets() {
    const MM = 3.7795275591, SAFE = Math.round(286 * MM); // alto útil objetivo (deja ~11mm de respiro vs 297mm)
    document.querySelectorAll(".sheet .featimg").forEach(fe => {
      fe.style.height = "0px";
      fe.style.marginTop = "0px";
      const pad = fe.parentElement;
      const used = pad.offsetHeight;          // contenido + padding, con la imagen en 0
      const remaining = SAFE - used;
      if (remaining > 110) { fe.style.marginTop = "16px"; fe.style.height = (remaining - 16) + "px"; }
      else { fe.remove(); }                   // hoja ya llena: sin imagen (evita overflow/sliver)
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fillSheets);
  else window.addEventListener("load", fillSheets);
})();
