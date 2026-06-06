/* ============================================================
   DESTINY — página de zona (dinámica por ?z=slug)
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY;
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const z = D.getZone(params.get("z")) || D.ZONES[0]; // default: Brickell

  const set = (sel, val) => { const e = $(sel); if (e) e.textContent = val; };
  document.title = `${z.name} — Inversión en Miami | Destiny Real Estate`;

  // SEO dinámico de la zona
  (function () {
    const DOM = "https://destiny.mx";
    const url = `${DOM}/zona/?z=${z.slug}`;
    const desc = (z.desc || `Inversión inmobiliaria en ${z.name}, Miami.`).replace(/<[^>]*>/g, "").slice(0, 180);
    const meta = (sel, a, v) => { const e = document.querySelector(sel); if (e) e.setAttribute(a, v); };
    meta('link[rel="canonical"]', "href", url);
    meta('meta[property="og:url"]', "content", url);
    meta('meta[property="og:title"]', "content", `${z.name} — Inversión en Miami | Destiny`);
    meta('meta[property="og:description"]', "content", desc);
    meta('meta[name="description"]', "content", desc);
  })();

  // hero
  $("#zHeroImg").src = D.absUrl ? D.absUrl(z.img) : D.BASE + z.img;
  $("#zHeroImg").alt = z.name;
  set("#zKicker", z.kicker);
  set("#zName", z.name);
  set("#zCrumb", z.name);
  set("#zDesc", z.desc);

  // tesis
  set("#zTesisTitle", `Por qué ${z.name}`);
  set("#zLong", z.long || z.desc);
  set("#ctaZone", z.name);
  $("#zStats").innerHTML = z.stats.map(s =>
    `<div class="zstat"><div class="n">${s[0]}</div><div class="l">${s[1]}</div></div>`).join("");
  if (!z.stats || !z.stats.length) { const _zs = $("#zStats"); if (_zs) _zs.style.display = "none"; }

  // vida en la zona — puntos de interés
  set("#zPoiTitle", `Qué hay alrededor de ${z.name}`);
  const poiEl = $("#zPoi");
  if (poiEl) {
    poiEl.innerHTML = z.poi
      ? Object.entries(z.poi).map(([cat, items]) =>
          `<div class="poi__cat"><h4>${cat}</h4><ul>${items.map(i => {
            if (typeof i === "string") return `<li><span class="poi__n">${i}</span></li>`;
            const m = i.m ? `<span class="poi__m">${i.m}</span>` : "";
            const note = i.note ? `<span class="poi__note">${i.note}</span>` : "";
            return `<li><span class="poi__n">${i.n}${m}</span>${note}</li>`;
          }).join("")}</ul></div>`).join("")
      : "";
  }

  // mapa interactivo de la zona — pines de atractivos por categoría + proyectos Destiny
  const mapEl = $("#zMap");
  if (mapEl) {
    const ZC = { "Brickell": [25.7589, -80.1935], "Sunny Isles": [25.9529, -80.1207], "Downtown": [25.7765, -80.1880], "Coral Gables": [25.7460, -80.2580], "Wynwood": [25.8045, -80.1990], "North Bay Village": [25.8470, -80.1530], "Bal Harbour": [25.8915, -80.1265], "North Miami": [25.9000, -80.1700], "Hollywood": [26.0112, -80.1495], "Pompano Beach": [26.2360, -80.1250], "Midtown": [25.8076, -80.1925], "Coconut Grove": [25.7270, -80.2420] };
    const center = ZC[z.zoneName] || [25.7617, -80.1918];
    const q = encodeURIComponent((z.name || z.zoneName) + ", FL");
    mapEl.innerHTML = '<iframe title="Mapa de ' + (z.name || z.zoneName) + '" src="https://maps.google.com/maps?q=' + q + '&z=14&output=embed" style="width:100%;height:100%;border:0;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>';
    const leg = $("#zMapLegend");
    if (leg) leg.style.display = "none";   // la leyenda era para los pines de Leaflet
  }

  // inventario
  const list = D.byZone(z.zoneName);
  set("#zInvTitle", `Proyectos en ${z.name}`);
  set("#zCount", list.length);
  $("#zGrid").innerHTML = list.length
    ? list.map(D.cardHTML).join("")
    : `<p class="inv__empty" style="display:block;">Inventario de esta zona disponible bajo solicitud. <a href="#agenda" style="color:var(--gold);">Solicitar →</a></p>`;

  // otras zonas
  const otras = D.ZONES.filter(x => x.slug !== z.slug);
  $("#zOtras").innerHTML = otras.map(o => `
    <a class="zone" href="Zona.html?z=${o.slug}">
      <div class="zone__idx">${o.idx}</div>
      <div class="zone__name"><div class="k">${o.kicker}</div><h3>${o.name}</h3></div>
      <div class="zone__desc">${o.desc}</div>
      <div class="zone__stats">
        ${o.stats.map(s => `<div class="zone__stat"><div class="n">${s[0]}</div><div class="l">${s[1]}</div></div>`).join("")}
      </div>
      <span class="zone__link">Ver zona <span class="ar">→</span></span>
    </a>`).join("");

  D.initShell();
  document.querySelectorAll(".hero .reveal").forEach(el => el.classList.add("in"));
  document.querySelectorAll("#zGrid .card").forEach((c, i) => {
    c.classList.add("reveal"); if (i % 3) c.classList.add("d" + (i % 3)); D.revealObserve(c);
  });
})();
