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
  let searchQ = "";
  // normaliza: minúsculas y sin acentos, para búsqueda tolerante
  const norm = (s) => (s == null ? "" : String(s)).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  function renderGrid() {
    let list = activeZone === "Todas" ? D.PROPS : D.PROPS.filter(p => p.zone === activeZone);
    const terms = norm(searchQ).split(/\s+/).filter(Boolean);
    if (terms.length) {
      list = list.filter(p => {
        const hay = norm([p.name, p.zone, p.developer, p.price, p.arquitecto, p.units, (p.badges || []).join(" "), p.desc].filter(Boolean).join(" "));
        return terms.every(t => hay.includes(t));   // todas las palabras deben coincidir
      });
    }
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

  // Buscadores de propiedades (nav de escritorio + menú móvil), filtran el grid
  const searchInputs = $$("#navSearch, #navSearchM");
  if (searchInputs.length) {
    const scrollToMapa = function () { const m = document.getElementById("mapa"); if (m) m.scrollIntoView({ behavior: "smooth" }); };
    // Si llegamos desde otra página con ?q=, pre-carga y baja a la colección
    const q0 = new URLSearchParams(location.search).get("q");
    if (q0) { searchQ = q0; searchInputs.forEach(function (i) { i.value = q0; }); setTimeout(scrollToMapa, 350); }
    searchInputs.forEach(function (input) {
      input.addEventListener("input", function () {
        searchQ = input.value;
        searchInputs.forEach(function (o) { if (o !== input) o.value = input.value; }); // mantiene ambos en sync
        renderGrid();
      });
      const form = input.closest("form");
      if (form) form.addEventListener("submit", function (e) {
        e.preventDefault();                 // en el home: filtra y baja (no recarga)
        renderGrid();
        const drawer = document.getElementById("drawer");
        if (drawer) drawer.classList.remove("open");   // cierra el menú móvil
        scrollToMapa();
      });
    });
  }

  /* ---------- Zonas ---------- */
  $("#zonesList").innerHTML = D.ZONES.map(z => `
    <a class="zone" href="/zonas/${z.slug}">
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
    // La portada va de fondo, detrás del texto. El velo lo pone el CSS.
    // Siempre lazy: el blog está muy abajo y en eager le robaba ~480 KB al LCP.
    const cover = (p, eager) =>
      `<div class="fpost__img"><img src="${D.imgURL(p.img)}" alt="${p.title}"` +
      ` loading="lazy" decoding="async" referrerpolicy="no-referrer"` +
      ` onerror="this.parentNode.classList.add('noimg')"></div>`;
    const m = f[0];
    $("#homeBlogMain").innerHTML =
      `<a class="fpost fpost__main" href="${m.url}">${cover(m, true)}<div><div class="fpost__k">Análisis destacado</div><h3>${m.title}</h3><div class="fpost__date">Oscar Chapa · ${m.date}</div></div></a>`;
    $("#homeBlogSide").innerHTML = f.slice(1, 5).map(p =>
      `<a class="fpost" href="${p.url}">${cover(p, false)}<div><div class="fpost__k">${p.year}</div><h3>${p.title}</h3><div class="fpost__date">${p.date}</div></div></a>`).join("");
  }

  /* ---------- Shell (nav, drawer, scroll, reveal, form) ---------- */
  D.initShell();

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

/* ---------- Hero: carrusel de proyectos premium de marca ----------
   La primera foto es la que mide Google como LCP. Antes se precargaban las
   seis al arrancar (~1.3 MB en JPG) y le peleaban el ancho de banda en móvil.
   Ahora el carrusel espera a que termine de cargar la página y sólo pide la
   foto siguiente, en WebP y del ancho que necesita la pantalla. */
(function () {
  var slides = [
    ["assets/img/stregis-brickell/pool", "St. Regis Residences · Brickell"],
    ["assets/img/mandarin/resortpool", "Mandarin Oriental · Brickell"],
    ["assets/img/faena/infinitypool", "Faena Residences · Miami River"],
    ["assets/img/fourseasons-grove/terrace", "Four Seasons · Coconut Grove"],
    ["assets/img/cipriani/pool", "Cipriani Residences · Brickell"],
    ["assets/img/delano/rooftoppool", "Delano · Downtown"]
  ];
  var a = document.getElementById("heroImg"),
      b = document.getElementById("heroImg2"),
      proj = document.getElementById("heroProj");
  if (!a || !b) return;
  var SRCSET = function (base) { return base + "-800.webp 800w, " + base + "-1280.webp 1280w, " + base + "-1920.webp 1600w"; };
  var idx = 0, top = a;
  var load = function (img, i) { img.sizes = "100vw"; img.srcset = SRCSET(slides[i][0]); img.src = slides[i][0] + ".jpg"; };
  var start = function () {
    var pre = new Image(); load(pre, 1); // sólo la siguiente
    setInterval(function () {
      idx = (idx + 1) % slides.length;
      var next = (top === a) ? b : a;
      var go = function () {
        next.classList.add("is-on"); top.classList.remove("is-on");
        top = next; if (proj) proj.textContent = slides[idx][1];
        var p = new Image(); load(p, (idx + 1) % slides.length);
      };
      next.alt = slides[idx][1]; load(next, idx);
      if (next.complete && next.naturalWidth) go(); else next.onload = go;
    }, 6000);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
})();

/* ---------- Fondos de sección bajo demanda ----------
   Las secciones .secbg traen su foto en data-bg (ruta sin extensión) en lugar
   de un background-image en línea: así el navegador no descarga las seis al
   abrir la página. Se pide la WebP del ancho adecuado cuando la sección está
   a ~600 px de entrar en pantalla. */
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-bg]"));
  if (!els.length) return;
  var w = Math.min(window.innerWidth * (window.devicePixelRatio || 1), 1920);
  var size = w <= 800 ? 800 : w <= 1280 ? 1280 : 1920;
  var paint = function (el) { el.style.backgroundImage = "url('" + el.getAttribute("data-bg") + "-" + size + ".webp')"; el.removeAttribute("data-bg"); };
  if (!("IntersectionObserver" in window)) { els.forEach(paint); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { paint(e.target); io.unobserve(e.target); } });
  }, { rootMargin: "600px 0px" });
  els.forEach(function (el) { io.observe(el); });
})();
