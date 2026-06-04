/* ============================================================
   DESTINY — cargador de artículo (Articulo.html?post=slug)
   ============================================================ */
(function () {
  "use strict";
  const D = window.DESTINY, B = window.DESTINY_BLOG;
  const $ = (s) => document.querySelector(s);
  const slug = new URLSearchParams(location.search).get("post");
  const post = (B && B.POSTS.find(p => p.slug === slug)) || null;

  if (post) {
    document.title = post.title + " — Destiny Real Estate";
    $("#artTitle").textContent = post.title;
    $("#artDate").textContent = post.date;
    $("#artKicker").textContent = "Blog & Análisis · " + post.year;

    // SEO dinámico del artículo
    const DOM = "https://destiny.mx", TH = DOM + "/wp-content/themes/destiny/";
    const url = `${DOM}/articulo/?art=${post.slug}`;
    const img = TH + "assets/img/og-default.jpg";
    const desc = post.title + " — análisis de Destiny Real Estate.";
    const meta = (sel, a, v) => { const e = document.querySelector(sel); if (e) e.setAttribute(a, v); };
    meta('link[rel="canonical"]', "href", url);
    meta('meta[property="og:url"]', "content", url);
    meta('meta[property="og:type"]', "content", "article");
    meta('meta[property="og:title"]', "content", post.title);
    meta('meta[property="og:description"]', "content", desc);
    meta('meta[name="twitter:title"]', "content", post.title);
    meta('meta[name="description"]', "content", desc);
    const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title,
      url: url, image: img, author: { "@type": "Person", name: "Oscar Chapa" },
      publisher: { "@type": "Organization", name: "Destiny Real Estate", logo: { "@type": "ImageObject", url: TH + "assets/logo-dark.png" } } };
    const sc = document.createElement("script"); sc.type = "application/ld+json";
    sc.textContent = JSON.stringify(ld); document.head.appendChild(sc);
  }

  // Cargar el cuerpo del artículo
  const prose = $("#prose");
  if (post) {
    fetch("articles/" + slug + ".html")
      .then(r => { if (!r.ok) throw new Error("no"); return r.text(); })
      .then(html => { prose.innerHTML = html; })
      .catch(() => {
        prose.innerHTML = `<p>Este análisis se está preparando para su lectura completa en el sitio.</p>
        <p>Mientras tanto, agenda una <a href="Destiny Home.html#agenda">sesión de claridad</a> y te lo enviamos directo, o explora los demás <a href="Blog.html">análisis disponibles</a>.</p>`;
      });
  } else {
    prose.innerHTML = `<p>No encontramos ese análisis. Vuelve al <a href="Blog.html">blog</a>.</p>`;
  }

  // Relacionados (3, excluyendo el actual)
  if (B && $("#artRelated")) {
    const rel = B.POSTS.filter(p => p.slug !== slug).slice(0, 3);
    $("#artRelated").innerHTML = rel.map(p =>
      `<a class="fpost" href="${p.url}"><div><div class="fpost__k">${p.year}</div><h3>${p.title}</h3><div class="fpost__date">${p.date}</div></div></a>`).join("");
  }

  D.initShell();
})();
