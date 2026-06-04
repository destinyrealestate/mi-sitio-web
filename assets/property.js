/* ============================================================
   DESTINY — página de propiedad (dinámica por ?p=slug)
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const slug = params.get("p");
  const p = D.get(slug) || D.PROPS[1]; // default: Faena

  const STATUS = ["En construcción", "Pre-venta", "Entrega inmediata", "Cerca de la playa"];
  const status = p.badges.find(b => STATUS.includes(b)) || "Disponible";
  const area = p.m2 || "Consultar";
  const beds = (p.bd && p.bd !== "—") ? p.bd : "Consultar";

  const set = (sel, val) => { const e = $(sel); if (e) e.textContent = val; };
  document.title = `${p.name} · ${p.zone} — Destiny Real Estate`;

  // SEO dinámico: canonical, Open Graph y JSON-LD propios de esta propiedad
  (function () {
    const DOM = "https://destiny.mx", TH = DOM + "/wp-content/themes/destiny/";
    const url = `${DOM}/propiedad/?proj=${p.slug}`;
    const abs = (g) => (/^https?:/).test(g) ? g : TH + g;
    const img = abs(p.img);
    const desc = (p.desc || `${p.name} en ${p.zone}, Miami.`).replace(/<[^>]*>/g, "").slice(0, 180);
    const meta = (sel, attr, val) => { const e = document.querySelector(sel); if (e) e.setAttribute(attr, val); };
    meta('link[rel="canonical"]', "href", url);
    meta('meta[property="og:url"]', "content", url);
    meta('meta[property="og:title"]', "content", `${p.name} · ${p.zone} — Destiny Real Estate`);
    meta('meta[property="og:description"]', "content", desc);
    meta('meta[property="og:image"]', "content", img);
    meta('meta[name="twitter:title"]', "content", `${p.name} · ${p.zone}`);
    meta('meta[name="twitter:description"]', "content", desc);
    meta('meta[name="twitter:image"]', "content", img);
    meta('meta[name="description"]', "content", desc);
    const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, description: desc,
      image: (p.gallery || [p.img]).slice(0, 4).map(abs),
      brand: { "@type": "Brand", name: p.developer || "Destiny Real Estate" },
      category: "Bienes raíces · " + p.zone + ", Miami", url: url };
    const sc = document.createElement("script"); sc.type = "application/ld+json";
    sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
  })();

  // hero
  const toUrl = e => (/^(assets\/|https?:)/).test(e) ? e : "https://lh3.googleusercontent.com/d/" + e + "=w1600";
  const heroSrc = (p.gallery && p.gallery[0]) ? toUrl(p.gallery[0]) : (D.BASE + p.img);
  $("#pHeroImg").src = heroSrc;
  $("#pHeroImg").alt = p.name;
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
      let g = `<div class="big"><img src="${D.BASE + p.img}" alt="${p.name}" referrerpolicy="no-referrer"></div>`;
      for (let i = 0; i < 4; i++) g += `<div class="ph"><span>${labels[i]}</span></div>`;
      gal.innerHTML = g;
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
  crumb.textContent = p.zone;

  // facts bar
  const type = p.badges.find(b => !STATUS.includes(b)) || "Residencia de lujo";
  set("#fStatus", status);
  set("#fType", type);
  set("#fBeds", beds);
  set("#fArea", p.renta === "corta" ? "Renta corta" : "Renta anual");

  // sobre el proyecto + ficha técnica
  set("#sobreTitle", p.name);
  set("#pDesc", p.desc || `${p.name} es uno de los desarrollos verificados por Destiny en ${p.zone}. Solicita la ficha completa — números reales, comisiones del desarrollador y costos ocultos — en tu sesión de claridad.`);
  const ficha = [["Zona", p.zone], ["Tipo", type], ["Modalidad de renta", p.renta ? (p.renta === "corta" ? "Renta corta permitida" : "Renta tradicional (anual)") : ""], ["Recámaras", beds], ["Amenidades", p.amenidades], ["Desarrollador", p.developer], ["Arquitectura", p.arquitecto], ["Unidades", p.units], ["Entrega", p.entrega]].filter(r => r[1]);
  const fichaEl = $("#pFicha");
  if (fichaEl) fichaEl.innerHTML = ficha.map(r => `<div class="row"><div class="k">${r[0]}</div><div class="v">${r[1]}</div></div>`).join("");

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

  // Botón "Solicitar dossier" → modo dossier en el formulario (entrega diferida)
  (function () {
    const form = $("#agendaForm");
    if (!form) return;
    form.setAttribute("data-context", p.name); // contexto por defecto = este proyecto
    const btn = $("#reqDossier");
    if (!btn) return;
    btn.addEventListener("click", () => {
      form.setAttribute("data-intent", "dossier");
      form.setAttribute("data-context", p.name);
      const head = form.querySelector(".form__head .h-3");
      if (head) head.textContent = "Solicita el dossier";
      const note = form.querySelector(".form__note");
      if (note) note.textContent = `Te enviamos el dossier completo de ${p.name} por WhatsApp o correo.`;
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.innerHTML = 'Solicitar el dossier <span class="ar">→</span>';
      const wrap = form.closest(".form") || form.parentNode;
      const succP = wrap && wrap.querySelector(".form__success p");
      if (succP) succP.innerHTML = `Recibimos tu solicitud del dossier de <strong>${p.name}</strong>. Se abrió <strong>WhatsApp</strong> con tu mensaje — solo presiona enviar y Oscar te hace llegar el dossier completo. ¿No se abrió? Escríbenos al <a href="https://api.whatsapp.com/send?phone=525611659009" target="_blank" rel="noopener" style="color:var(--gold);">+52 56 1165 9009</a>.`;
    });
  })();

  // ubicación + zona link
  const zone = D.ZONES.find(z => z.zoneName === p.zone);
  if (zone) {
    set("#ubicTitle", zone.name);
    set("#ubicDesc", zone.long || zone.desc);
    $("#pZoneLink").href = `Zona.html?z=${zone.slug}`;
    crumb.href = `Zona.html?z=${zone.slug}`;
  } else {
    set("#ubicTitle", p.zone);
    set("#ubicDesc", `${p.zone} es una de las zonas que cubrimos en Miami. Solicita el análisis de demanda de renta y plusvalía para esta ubicación.`);
    $("#pZoneLink").href = "Destiny Home.html#zonas";
    crumb.href = "Destiny Home.html#mapa";
  }

  // mapa interactivo (Leaflet + OpenStreetMap/CARTO, sin API key) — estilo oscuro, por proyecto/zona
  const mapEl = $("#pMap");
  if (mapEl && window.L) {
    const ZC = {
      "Brickell": [25.7589, -80.1935], "Sunny Isles": [25.9529, -80.1207],
      "Downtown": [25.7765, -80.1880], "Coral Gables": [25.7460, -80.2580],
      "Wynwood": [25.8045, -80.1990], "North Bay Village": [25.8470, -80.1530],
      "Bal Harbour": [25.8915, -80.1265], "North Miami": [25.9000, -80.1700],
      "Hollywood": [26.0112, -80.1495], "Pompano Beach": [26.2360, -80.1250]
    };
    const center = p.coords || ZC[p.zone] || [25.7617, -80.1918];
    const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true }).setView(center, 15);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19, subdomains: "abcd",
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    L.marker(center).addTo(map).bindPopup(`<b>${p.name}</b><br>${p.zone}, Miami`);
    setTimeout(() => map.invalidateSize(), 250);
  }

  // relacionados (misma zona, excluye actual; completa con otros)
  let rel = D.byZone(p.zone).filter(x => x.slug !== p.slug);
  if (rel.length < 3) rel = rel.concat(D.PROPS.filter(x => x.slug !== p.slug && x.zone !== p.zone));
  rel = rel.slice(0, 3);
  set("#railTitle", D.byZone(p.zone).length > 1 ? `Más proyectos en ${p.zone}` : "Sigue explorando la colección");
  $("#pRail").innerHTML = rel.map(D.cardHTML).join("");

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

  // estimador de renta
  const range = $("#roiRange"), amt = $("#roiAmt"), low = $("#roiLow"), high = $("#roiHigh");
  const fmt = n => "$" + Math.round(n).toLocaleString("en-US");
  if (range) {
    const roi = () => { const v = +range.value; amt.textContent = fmt(v); low.textContent = fmt(v * 0.06); high.textContent = fmt(v * 0.08); };
    range.addEventListener("input", roi); roi();
  }

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
