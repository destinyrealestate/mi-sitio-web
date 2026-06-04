/* ============================================================
   DESTINY — home
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Inventario ---------- */
  const grid = $("#grid");
  let activeZone = "Todas";
  function renderGrid() {
    const list = activeZone === "Todas" ? D.PROPS : D.PROPS.filter(p => p.zone === activeZone);
    grid.innerHTML = list.map(D.cardHTML).join("");
    $("#invCount").textContent = list.length;
    $("#invEmpty").style.display = list.length ? "none" : "block";
    $$(".card", grid).forEach((c, i) => {
      c.classList.add("reveal");
      if (i % 3 === 1) c.classList.add("d1");
      if (i % 3 === 2) c.classList.add("d2");
      D.revealObserve(c);
    });
  }

  const zoneSet = ["Todas", ...Array.from(new Set(D.PROPS.map(p => p.zone)))];
  $("#zoneFilters").innerHTML = zoneSet.map((z, i) =>
    `<button class="chip${i === 0 ? " active" : ""}" data-zone="${z}">${z}</button>`).join("");
  $("#zoneFilters").addEventListener("click", e => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    activeZone = btn.dataset.zone;
    $$("#zoneFilters .chip").forEach(c => c.classList.toggle("active", c === btn));
    renderGrid();
  });

  /* ---------- Zonas ---------- */
  $("#zonesList").innerHTML = D.ZONES.map(z => `
    <a class="zone" href="Zona.html?z=${z.slug}">
      <div class="zone__idx">${z.idx}</div>
      <div class="zone__thumb"><img src="${D.imgURL(z.img)}" alt="${z.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')"></div>
      <div class="zone__name"><div class="k">${z.kicker}</div><h3>${z.name}</h3></div>
      <div class="zone__desc">${z.desc}</div>
      <span class="zone__link">Explorar atractivos <span class="ar">→</span></span>
    </a>`).join("");

  renderGrid();

  /* ---------- Avance del blog (5 análisis recientes) ---------- */
  const B = window.DESTINY_BLOG;
  if (B && $("#homeBlogMain")) {
    const f = B.POSTS.slice(0, 5);
    const m = f[0];
    $("#homeBlogMain").innerHTML =
      `<a class="fpost fpost__main" href="${m.url}"><div><div class="fpost__k">Análisis destacado</div><h3>${m.title}</h3><div class="fpost__date">Oscar Chapa · ${m.date}</div></div></a>`;
    $("#homeBlogSide").innerHTML = f.slice(1, 5).map(p =>
      `<a class="fpost" href="${p.url}"><div><div class="fpost__k">${p.year}</div><h3>${p.title}</h3><div class="fpost__date">${p.date}</div></div></a>`).join("");
  }

  /* ---------- Shell (nav, drawer, scroll, reveal, form) ---------- */
  D.initShell();

  /* ---------- Calculadora de inversión ---------- */
  const calcRange = $("#calcMonto");
  if (calcRange) {
    const fmt = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
    let ltv = 0.5;
    const setT = (id, v) => { const e = $("#" + id); if (e) e.textContent = v; };
    const render = () => {
      const M = +calcRange.value;
      setT("calcMontoVal", "$" + M.toLocaleString("en-US"));
      const rentaNeta = M * 0.065;
      const financiado = M * ltv, capital = M - financiado;
      const r = 0.06375 / 12, n = 360;
      const mortgage = financiado > 0 ? financiado * r / (1 - Math.pow(1 + r, -n)) : 0;
      const flujoMensual = rentaNeta / 12 - mortgage;
      const plus5 = M * (Math.pow(1.06, 5) - 1);
      setT("calcRenta", fmt(rentaNeta));
      setT("calcFlujo", (flujoMensual >= 0 ? "+" : "") + fmt(flujoMensual));
      setT("calcPlus", fmt(plus5));
      setT("calcCapital", fmt(capital));
    };
    calcRange.addEventListener("input", render);
    $$("#calc .seg-btn").forEach(b => b.addEventListener("click", () => {
      $$("#calc .seg-btn").forEach(x => x.classList.remove("active"));
      b.classList.add("active"); ltv = +b.dataset.ltv; render();
    }));
    render();
  }
  requestAnimationFrame(() => $$(".hero .reveal").forEach(el => el.classList.add("in")));

  /* ---------- FAQ acordeón ---------- */
  $$(".faq__item").forEach(item => {
    const q = $(".faq__q", item), a = $(".faq__a", item);
    q.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      $$(".faq__item.open").forEach(o => { o.classList.remove("open"); $(".faq__a", o).style.maxHeight = null; });
      if (!isOpen) { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });

  /* ---------- Barra fija de conversión ---------- */
  const sticky = $("#stickybar"), agenda = $("#agenda");
  if (sticky && agenda) {
    const stickyState = () => {
      const past = window.scrollY > window.innerHeight * 0.85;
      const r = agenda.getBoundingClientRect();
      const formVisible = r.top < window.innerHeight && r.bottom > 0;
      sticky.classList.toggle("show", past && !formVisible);
    };
    window.addEventListener("scroll", stickyState, { passive: true });
    window.addEventListener("resize", stickyState, { passive: true });
    stickyState();
  }
})();

/* ---------- Hero: carrusel de proyectos premium de marca ---------- */
(function () {
  var slides = [
    ["assets/img/stregis-brickell/pool.jpg", "St. Regis Residences · Brickell"],
    ["assets/img/mandarin/resortpool.jpg", "Mandarin Oriental · Brickell"],
    ["assets/img/faena/infinitypool.jpg", "Faena Residences · Miami River"],
    ["assets/img/fourseasons-grove/terrace.jpg", "Four Seasons · Coconut Grove"],
    ["assets/img/cipriani/pool.jpg", "Cipriani Residences · Brickell"],
    ["assets/img/delano/rooftoppool.jpg", "Delano · Downtown"]
  ];
  var a = document.getElementById("heroImg"),
      b = document.getElementById("heroImg2"),
      proj = document.getElementById("heroProj");
  if (!a || !b) return;
  slides.forEach(function (s) { var i = new Image(); i.src = s[0]; }); // preload
  var idx = 0, top = a;
  setInterval(function () {
    idx = (idx + 1) % slides.length;
    var next = (top === a) ? b : a;
    var go = function () {
      next.classList.add("is-on"); top.classList.remove("is-on");
      top = next; if (proj) proj.textContent = slides[idx][1];
    };
    next.alt = slides[idx][1]; next.src = slides[idx][0];
    if (next.complete && next.naturalWidth) go(); else next.onload = go;
  }, 6000);
})();
