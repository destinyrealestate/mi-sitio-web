/* ============================================================
   DESTINY — blog (índice)
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY, B = window.DESTINY_BLOG;
  const $ = (s) => document.querySelector(s);
  const posts = B.POSTS;

  // Destacados: los 5 más recientes (2026)
  const feat = posts.slice(0, 5);
  const main = feat[0];
  $("#featMain").innerHTML = `
    <a class="fpost fpost__main" href="${main.url}">
      <div><div class="fpost__k">Análisis destacado</div>
      <h3>${main.title}</h3>
      <div class="fpost__date">Oscar Chapa · ${main.date}</div></div>
    </a>`;
  $("#featSide").innerHTML = feat.slice(1, 5).map(p => `
    <a class="fpost" href="${p.url}">
      <div><div class="fpost__k">${p.year}</div>
      <h3>${p.title}</h3>
      <div class="fpost__date">${p.date}</div></div>
    </a>`).join("");

  // Lista completa agrupada por año
  const rest = posts.slice(5);
  let html = "", curYear = null;
  rest.forEach(p => {
    if (p.year !== curYear) { curYear = p.year; html += `<div class="blog-yhead">${curYear}</div>`; }
    html += `<a class="blog-row" href="${p.url}">
      <span class="blog-row__yr">${String(p.date.match(/\d{1,2}/)[0]).padStart(2,"0")}</span>
      <span class="blog-row__t">${p.title}</span>
      <span class="blog-row__d">${p.date}</span>
      <span class="blog-row__ar">→</span>
    </a>`;
  });
  $("#blogList").innerHTML = html;
  $("#blogCount").textContent = posts.length;

  D.initShell();
  document.querySelectorAll(".hero .reveal").forEach(el => el.classList.add("in"));
})();
