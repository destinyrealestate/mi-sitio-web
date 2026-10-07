#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESTINY — generador de fichas de proyecto y de zona con URL limpia.

Lee los proyectos y las zonas de assets/data.js (única fuente de verdad, con
la misma slugify y el mismo bloque de proyectos que scripts/build-sitemap.py)
y escribe:

  proyectos/{slug}.html   desde Propiedad.html   → https://destiny.mx/proyectos/{slug}
  zonas/{slug}.html       desde Zona.html        → https://destiny.mx/zonas/{slug}

y el bloque "# BEGIN fichas" … "# END fichas" del .htaccess (un 301 por slug
desde Propiedad.html?p= y Zona.html?z=).

Por qué existe: Propiedad.html y Zona.html eran una sola plantilla que se
llenaba por JavaScript. El HTML crudo —lo primero que lee Google y lo único
que leen WhatsApp y LinkedIn— traía el mismo título, la misma descripción y
una canónica a /Propiedad.html en los 29 proyectos. Search Console las
trataba como duplicadas. Ahora cada ficha lleva ya escritos su título, su
description, su canónica, su Open Graph, su JSON-LD y el texto visible.

property.js y zone.js siguen corriendo encima y vuelven a pintar lo mismo
(galería, video, mapa, formulario): el HTML crudo y el renderizado coinciden.
Si cambias cómo property.js o zone.js pintan un elemento, cámbialo también
aquí.

REGLA: después de tocar assets/data.js, Propiedad.html o Zona.html, correr:

  python3 scripts/build-fichas.py
  python3 scripts/build-sitemap.py

No necesita Node: lee data.js con un lector de literales de JavaScript
escrito aquí mismo (solo acepta datos: cadenas, números, listas y objetos).
"""
import html
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOM = "https://destiny.mx"
BASE = "https://blog.destiny.mx/wp-content/uploads/"
SITE = "Destiny Real Estate"

# Misma slugify y mismo delimitador de bloques que el sitemap: si un proyecto
# está en el sitemap, tiene ficha, y viceversa.
_spec = importlib.util.spec_from_file_location("build_sitemap", ROOT / "scripts" / "build-sitemap.py")
_sm = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sm)
slugify, names_between = _sm.slugify, _sm.names_between


# ------------------------------------------------------------------
# Lector de literales de JavaScript
# ------------------------------------------------------------------
class JSLiteral:
    """Convierte un literal de datos de JS ([…], {…}) a Python. Falla en voz
    alta ante cualquier expresión (variables, sumas, funciones)."""

    ESC = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}

    def __init__(self, src: str, pos: int):
        self.s, self.i = src, pos

    def fail(self, msg):
        line = self.s.count("\n", 0, self.i) + 1
        raise SystemExit(f"assets/data.js línea {line}: {msg}")

    def ws(self):
        s = self.s
        while self.i < len(s):
            c = s[self.i]
            if c in " \t\r\n":
                self.i += 1
            elif s.startswith("//", self.i):
                self.i = s.index("\n", self.i)
            elif s.startswith("/*", self.i):
                self.i = s.index("*/", self.i) + 2
            else:
                break

    def value(self):
        self.ws()
        c = self.s[self.i]
        if c == "[":
            return self.array()
        if c == "{":
            return self.obj()
        if c in "\"'":
            return self.string()
        m = re.compile(r"-?\d+(\.\d+)?").match(self.s, self.i)
        if m:
            self.i = m.end()
            return float(m.group()) if m.group(1) else int(m.group())
        for word, val in (("true", True), ("false", False), ("null", None)):
            if self.s.startswith(word, self.i):
                self.i += len(word)
                return val
        self.fail(f"no es un dato literal: {self.s[self.i:self.i + 40]!r}")

    def string(self):
        q, s, out = self.s[self.i], self.s, []
        self.i += 1
        while True:
            c = s[self.i]
            if c == q:
                self.i += 1
                return "".join(out)
            if c == "\\":
                n = s[self.i + 1]
                if n == "u":
                    if s[self.i + 2] == "{":
                        j = s.index("}", self.i)
                        out.append(chr(int(s[self.i + 3:j], 16)))
                        self.i = j + 1
                    else:
                        out.append(chr(int(s[self.i + 2:self.i + 6], 16)))
                        self.i += 6
                    continue
                if n == "x":
                    out.append(chr(int(s[self.i + 2:self.i + 4], 16)))
                    self.i += 4
                    continue
                if n == "\n":
                    self.i += 2
                    continue
                out.append(self.ESC.get(n, n))
                self.i += 2
                continue
            if c == "\n":
                self.fail("cadena sin cerrar")
            out.append(c)
            self.i += 1

    def array(self):
        self.i += 1
        out = []
        while True:
            self.ws()
            if self.s[self.i] == "]":
                self.i += 1
                return out
            out.append(self.value())
            self.ws()
            if self.s[self.i] == ",":
                self.i += 1
            elif self.s[self.i] != "]":
                self.fail("se esperaba , o ]")

    def obj(self):
        self.i += 1
        out = {}
        while True:
            self.ws()
            c = self.s[self.i]
            if c == "}":
                self.i += 1
                return out
            if c in "\"'":
                key = self.string()
            else:
                m = re.compile(r"[A-Za-z_$][\w$]*").match(self.s, self.i)
                if not m:
                    self.fail("clave inválida")
                key, self.i = m.group(), m.end()
            self.ws()
            if self.s[self.i] != ":":
                self.fail(f"se esperaba : después de {key!r}")
            self.i += 1
            out[key] = self.value()
            self.ws()
            if self.s[self.i] == ",":
                self.i += 1
            elif self.s[self.i] != "}":
                self.fail("se esperaba , o }")


def literal_after(src: str, marker: str):
    i = src.find(marker)
    if i < 0:
        raise SystemExit(f"No encontré {marker!r} en assets/data.js")
    return JSLiteral(src, i + len(marker)).value()


def load_data():
    src = (ROOT / "assets" / "data.js").read_text(encoding="utf-8")
    props = literal_after(src, "const PROPS = ")
    zones = literal_after(src, "const ZONES = ")
    order = literal_after(src, "const ZONE_ORDER = ")
    for p in props:
        p["slug"] = slugify(p["name"])
    for z in zones:
        z["slug"] = slugify(z["name"])
    # Igual que data.js: orden geográfico, idx renumerado y stats vacías.
    zones.sort(key=lambda z: order.index(z["zoneName"]) if z["zoneName"] in order else -1)
    for n, z in enumerate(zones, 1):
        z["idx"], z["stats"] = f"{n:02d}", []

    # Contrato con el sitemap: exactamente los mismos slugs.
    sm_props = [slugify(n) for n in names_between(src, "const PROPS = [", "].map(p =>")]
    sm_zones = [slugify(n) for n in names_between(src, "const ZONES = [", "].map(z =>")]
    if [p["slug"] for p in props] != sm_props or sorted(z["slug"] for z in zones) != sorted(sm_zones):
        raise SystemExit("Los slugs no coinciden con los de build-sitemap.py: revisa assets/data.js")
    return props, zones


# ------------------------------------------------------------------
# Utilidades de HTML
# ------------------------------------------------------------------
def esc(s) -> str:
    return html.escape(str(s), quote=True)


def plain(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", "", s or "")).strip()


def clip(s: str, n: int = 160) -> str:
    """Corta en palabra completa sin pasar de n caracteres."""
    s = plain(s)
    if len(s) <= n:
        return s
    cut = s[:n - 1].rsplit(" ", 1)[0].rstrip(" ,;:—–-·.")
    return cut + "…"


def absurl(img: str) -> str:
    """data.js absUrl(): ruta que sirve el navegador."""
    if re.match(r"^(https?:|/)", img):
        return img
    if re.match(r"^(assets/|uploads/)", img):
        return "/" + img
    return BASE + img


def gallery_url(e: str) -> str:
    """property.js toUrl(): assets/ local o un id de Google Drive."""
    if re.match(r"^(/?assets/|https?:)", e):
        return ("/" + e) if e.startswith("assets/") else e
    return "https://lh3.googleusercontent.com/d/" + e + "=w1600"


def full(u: str) -> str:
    return DOM + u if u.startswith("/") else u


def root(u: str) -> str:
    return "/" + u if u.startswith("assets/") else u


def find_el(doc: str, el_id: str):
    """(inicio de la etiqueta, fin de la etiqueta de apertura, inicio del
    cierre, fin del cierre) del elemento con ese id. Cuenta anidamiento."""
    m = re.search(r'<([a-zA-Z0-9]+)\b[^>]*\bid="' + re.escape(el_id) + r'"[^>]*>', doc)
    if not m:
        raise SystemExit(f"La plantilla no tiene #{el_id}")
    tag = m.group(1)
    if tag.lower() in ("img", "input", "meta", "link", "source", "br", "hr"):
        return m.start(), m.end(), m.end(), m.end()
    depth, i = 1, m.end()
    pat = re.compile(r"<(/?)" + tag + r"\b[^>]*>")
    while depth:
        n = pat.search(doc, i)
        if not n:
            raise SystemExit(f"#{el_id} sin cierre")
        depth += -1 if n.group(1) else 1
        i = n.end()
    return m.start(), m.end(), n.start(), n.end()


def set_inner(doc: str, el_id: str, inner: str) -> str:
    _, a, b, _ = find_el(doc, el_id)
    return doc[:a] + inner + doc[b:]


def set_attr(doc: str, el_id: str, attr: str, val) -> str:
    s, a, _, _ = find_el(doc, el_id)
    tag = doc[s:a]
    if val is None:
        new = re.sub(r"\s" + attr + r'(="[^"]*")?(?=[\s>])', "", tag, count=1)
    elif re.search(r"\s" + attr + r'="', tag):
        new = re.sub(r"(\s" + attr + r')="[^"]*"', lambda m: f'{m.group(1)}="{esc(val)}"', tag, count=1)
    else:
        new = tag[:-1] + f' {attr}="{esc(val)}">'
    return doc[:s] + new + doc[a:]


def set_meta(doc: str, pattern: str, attr: str, val: str) -> str:
    """Reemplaza el valor de attr en la primera etiqueta que contiene pattern."""
    rx = re.compile(r"<[^>]*" + re.escape(pattern) + r"[^>]*>")
    m = rx.search(doc)
    if not m:
        raise SystemExit(f"La plantilla no tiene {pattern}")
    tag = re.sub(r"(\s" + attr + r')="[^"]*"', lambda k: f'{k.group(1)}="{esc(val)}"', m.group(), count=1)
    return doc[:m.start()] + tag + doc[m.end():]


SKIP = ("/", "#", "http:", "https:", "mailto:", "tel:", "javascript:", "data:", "${")


def root_absolute(doc: str) -> str:
    """Las fichas viven en /proyectos/ y /zonas/: toda ruta relativa se
    resolvería contra la subcarpeta. index.html pasa a ser /."""
    def fix(m):
        attr, val = m.group(1), m.group(2)
        if not val or val.startswith(SKIP):
            return m.group()
        if val == "index.html" or val.startswith(("index.html#", "index.html?")):
            val = "/" + val[len("index.html"):]
        else:
            val = "/" + val
        return f'{attr}="{val}"'
    return re.sub(r'\b(href|src|action|poster)="([^"]*)"', fix, doc)


def head_common(doc, title, desc, url, img, og_title, tw_title):
    doc = re.sub(r"<title>[^<]*</title>", f"<title>{esc(title)}</title>", doc, count=1)
    doc = set_meta(doc, 'rel="canonical"', "href", url)
    doc = set_meta(doc, 'name="description"', "content", desc)
    doc = set_meta(doc, 'property="og:title"', "content", og_title)
    doc = set_meta(doc, 'property="og:description"', "content", desc)
    doc = set_meta(doc, 'property="og:image"', "content", img)
    doc = set_meta(doc, 'property="og:url"', "content", url)
    doc = set_meta(doc, 'name="twitter:title"', "content", tw_title)
    doc = set_meta(doc, 'name="twitter:description"', "content", desc)
    doc = set_meta(doc, 'name="twitter:image"', "content", img)
    return doc


def ld_script(obj) -> str:
    # "</" escapado: un texto con "</script>" no puede cerrar la etiqueta.
    return ('<script type="application/ld+json">'
            + json.dumps(obj, ensure_ascii=False).replace("</", "<\\/") + "</script>\n")


GENERATED = "<!-- GENERADO por scripts/build-fichas.py desde {src}. No editar a mano: cambia assets/data.js o la plantilla y vuelve a correrlo. -->\n"


# ------------------------------------------------------------------
# Réplica de lo que pinta property.js
# ------------------------------------------------------------------
STATUS = ["En construcción", "Pre-venta", "Entrega inmediata", "Cerca de la playa"]
SCAR = {"Pre-venta": "Preventa · precios de fase inicial",
        "En construcción": "En construcción · unidades limitadas",
        "Entrega inmediata": "Entrega inmediata · disponibilidad final"}
STATUS_NOTE = {"Pre-venta": "Entras al mejor precio, antes del público.",
               "En construcción": "Plusvalía capturada antes de la entrega.",
               "Entrega inmediata": "Flujo de renta desde el primer mes."}


def card_html(p) -> str:
    """data.js cardHTML()."""
    badges = "".join(f'<span class="badge{" gold" if (p.get("gold") and i == 0) else ""}">{b}</span>'
                     for i, b in enumerate(p["badges"]))
    specs = []
    if p.get("bd") and p["bd"] != "—":
        specs.append(f"<span>◈ {p['bd']} rec.</span>")
    if p.get("ba"):
        specs.append(f"<span>◷ {p['ba']} baños</span>")
    if p.get("m2"):
        specs.append(f"<span>▦ {p['m2']}</span>")
    return f"""<article class="card" data-zone="{esc(p['zone'])}">
      <div class="card__img">
        <img src="{esc(absurl(p['img']))}" alt="{esc(p['name'])}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('noimg')">
      </div>
      <div class="card__badges">{badges}</div>
      <div class="card__body">
        <div class="card__zone">{esc(p['zone'])}</div>
        <h3 class="card__title">{esc(p['name'])}</h3>
        <div class="card__price">{esc(p['price'])}</div>
        <div class="card__specs">{"".join(specs)}</div>
      </div>
      <span class="card__cta">→</span>
      <a class="card__link" href="/proyectos/{p['slug']}" aria-label="Ver {esc(p['name'])}"></a>
    </article>"""


def maps_iframe(title: str, q: str, zoom: int) -> str:
    from urllib.parse import quote
    q = quote(q, safe="-_.!~*'()")  # = encodeURIComponent
    return (f'<iframe title="{esc(title)}" src="https://maps.google.com/maps?q={q}&z={zoom}&output=embed" '
            'style="width:100%;height:100%;border:0;display:block;" loading="lazy" '
            'referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>')


def build_prop(tpl: str, p: dict, props: list, zones: list) -> str:
    name, zname = p["name"], p["zone"]
    zone = next((z for z in zones if z["zoneName"] == zname), None)
    url = f"{DOM}/proyectos/{p['slug']}"
    title = f"{name} · {zname} — {SITE}"
    fallback_desc = (f"{name} es uno de los desarrollos verificados por Destiny en {zname}. Solicita la ficha "
                     "completa — números reales, comisiones del desarrollador y costos ocultos — en tu sesión de claridad.")
    desc = clip(p.get("desc") or fallback_desc)
    img = full(absurl(p["img"]))

    doc = head_common(tpl, title, desc, url, img, title, f"{name} · {zname}")
    zitem = f"{DOM}/zonas/{zone['slug']}" if zone else f"{DOM}/#zonas"
    ld = {"@context": "https://schema.org", "@type": "Product", "name": name, "description": desc,
          "image": [full(gallery_url(g)) for g in (p.get("gallery") or [])][:4] or [img],
          "brand": {"@type": "Brand", "name": p.get("developer") or SITE},
          "category": f"Bienes raíces · {zname}, Miami", "url": url}
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": DOM + "/"},
        {"@type": "ListItem", "position": 2, "name": zname, "item": zitem},
        {"@type": "ListItem", "position": 3, "name": name, "item": url}]}
    doc = doc.replace("</head>", ld_script(ld) + ld_script(bc) + "</head>", 1)
    doc = re.sub(r"<body[^>]*>", f'<body data-prop="{p["slug"]}" data-desarrollo="{p["slug"]}" data-page-type="proyecto">', doc, count=1)

    status = next((b for b in p["badges"] if b in STATUS), "Disponible")
    area = p.get("m2") or "Consultar"
    beds = p["bd"] if p.get("bd") and p["bd"] != "—" else "Consultar"
    ptype = next((b for b in p["badges"] if b not in STATUS), "Residencia de lujo")
    price_from = p["price"].replace("Desde ", "", 1).split("–")[0].strip()

    gal = p.get("gallery") or []
    hero = gallery_url(gal[0]) if gal else absurl(p["img"])
    doc = set_attr(doc, "pHeroImg", "src", hero)
    doc = set_attr(doc, "pHeroImg", "alt", name)

    if gal:
        g = f'<div class="big"><img src="{esc(gallery_url(gal[0]))}" alt="{esc(name)}" loading="lazy" referrerpolicy="no-referrer"></div>'
        g += "".join(f'<div><img src="{esc(gallery_url(e))}" alt="{esc(name)}" loading="lazy" referrerpolicy="no-referrer"></div>' for e in gal[1:])
    else:
        labels = ["Render — lobby", "Render — amenidades", "Render — vista", "Plano tipo"]
        g = f'<div class="big"><img src="{esc(absurl(p["img"]))}" alt="{esc(name)}" referrerpolicy="no-referrer"></div>'
        g += "".join(f'<div class="ph"><span>{l}</span></div>' for l in labels)
    doc = set_inner(doc, "pGallery", g)

    doc = set_inner(doc, "pBadges", "".join(
        f'<span class="badge{" gold" if (p.get("gold") and i == 0) else ""}">{b}</span>' for i, b in enumerate(p["badges"])))
    for el, val in [("pName", name), ("pPrice", p["price"].replace("Desde ", "", 1).replace(" USD", "", 1)),
                    ("pBeds", beds), ("pBaths", p.get("ba") or "—"), ("pArea", p.get("entrega") or area),
                    ("pZoneCrumb", zname), ("fStatus", status), ("fType", ptype), ("fBeds", beds),
                    ("fArea", "Renta corta" if p.get("renta") == "corta" else "Renta anual"),
                    ("sobreTitle", name), ("ctaName", name), ("pFase", p.get("fase") or status),
                    ("pEntrega2", p.get("entrega") or "Por confirmar"),
                    ("pPago", p.get("pago") or "Estructura de pagos bajo solicitud — la revisamos contigo en la sesión."),
                    ("sbName", name), ("sbPrice", price_from)]:
        doc = set_inner(doc, el, esc(val))

    desc_txt = p.get("desc") or fallback_desc
    doc = set_inner(doc, "pDesc", "<br><br>".join(s.strip() for s in re.split(r"\n\n+", desc_txt) if s.strip()))

    renta = ""
    if p.get("renta"):
        renta = "Renta corta permitida" if p["renta"] == "corta" else "Renta tradicional (anual)"
    ficha = [("Zona", zname), ("Tipo", ptype), ("Modalidad de renta", renta), ("Recámaras", beds),
             ("Superficie", p.get("m2")), ("Amenidades", p.get("amenidades")), ("Desarrollador", p.get("developer")),
             ("Arquitectura", p.get("arquitecto")), ("Unidades", p.get("units")), ("Entrega", p.get("entrega"))]
    doc = set_inner(doc, "pFicha", "".join(f'<div class="row"><div class="k">{k}</div><div class="v">{v}</div></div>'
                                           for k, v in ficha if v))

    if p.get("docs") or p.get("priceTable"):
        doc = set_attr(doc, "docs", "hidden", None)
        if p.get("docs"):
            cards = []
            for d in p["docs"]:
                ext = ' target="_blank" rel="noopener"' if d.get("external") else " download"
                cards.append(f'<a class="payinfo__card payinfo__doc" href="{esc(root(d["href"]))}"{ext} style="text-decoration:none;display:flex;align-items:center;justify-content:space-between;gap:14px;">'
                             f'<span><span class="payinfo__k">{d.get("sub") or "Documento"}</span><span class="payinfo__v" style="display:block;">{d["label"]}</span></span>'
                             f'<span class="ar" style="color:var(--gold);font-size:20px;">{"↗" if d.get("external") else "↓"}</span></a>')
            doc = set_inner(doc, "pDocs", "".join(cards))
        else:
            doc = set_attr(doc, "pDocs", "style", "margin-bottom:8px;display:none;")
        if p.get("priceTable"):
            doc = set_attr(doc, "pPriceWrap", "hidden", None)
            doc = set_inner(doc, "pPriceTable", "".join(
                f'<div class="row"><div class="k">{r[0]}</div><div class="v">{r[1]} · <strong>desde {r[2]}</strong></div></div>'
                for r in p["priceTable"]))

    doc = set_inner(doc, "pVerdict", p.get("lectura") or
                    "Te decimos <em>cómo se arma la compra</em> — el activo, los números y la estructura — antes de que firmes.")
    if p.get("marca"):
        doc = set_inner(doc, "pMarca", p["marca"])
        doc = set_attr(doc, "pMarcaBlock", "hidden", None)

    if zone:
        doc = set_inner(doc, "ubicTitle", esc(zone["name"]))
        doc = set_inner(doc, "ubicDesc", esc(zone.get("long") or zone["desc"]))
        zhref = f"/zonas/{zone['slug']}"
        doc = set_attr(doc, "pZoneLink", "href", zhref)
        doc = set_attr(doc, "pZoneCrumb", "href", zhref)
    else:
        doc = set_inner(doc, "ubicTitle", esc(zname))
        doc = set_inner(doc, "ubicDesc", esc(f"{zname} es una de las zonas que cubrimos en Miami. Solicita el análisis de demanda de renta y plusvalía para esta ubicación."))
        doc = set_attr(doc, "pZoneLink", "href", "/#zonas")
        doc = set_attr(doc, "pZoneCrumb", "href", "/#mapa")

    doc = set_inner(doc, "pMap", maps_iframe("Ubicación de " + name, f"{name}, {zname}, FL", 15))

    same = [x for x in props if x["zone"] == zname]
    rel = [x for x in same if x["slug"] != p["slug"]]
    if len(rel) < 3:
        rel += [x for x in props if x["slug"] != p["slug"] and x["zone"] != zname]
    doc = set_inner(doc, "railTitle", esc(f"Más proyectos en {zname}" if len(same) > 1 else "Sigue explorando la colección"))
    doc = set_inner(doc, "pRail", "".join(card_html(x) for x in rel[:3]))

    doc = set_inner(doc, "pScarcity", '<span class="dot"></span> ' + SCAR.get(status, "Disponibilidad limitada"))

    hls = p.get("highlights") or [
        ["Ubicación", zname, zone["kicker"] if zone else "Zona prime de Miami"],
        ["Precio de entrada", price_from, "Precio de entrada al proyecto, verificado y sin sobreprecio."],
        ["Financiamiento", "Hasta 70%", "Disponible para compradores nacionales y extranjeros."],
        ["Estatus", status, STATUS_NOTE.get(status, "Activo verificado por Destiny.")]]
    doc = set_inner(doc, "pHighlights", "".join(
        f'<div class="hl__card"><div class="hl__k">{h[0]}</div><div class="hl__v">{h[1]}</div><div class="hl__d">{h[2]}</div></div>' for h in hls))

    doc = doc.replace("<!-- El desarrollo lo resuelve solo forms.js: lee ?p= de la URL y saca el",
                      "<!-- El desarrollo lo resuelve solo forms.js: lee data-prop del <body> y saca el", 1)
    doc = root_absolute(doc)
    return doc.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + GENERATED.format(src="Propiedad.html"), 1)


# ------------------------------------------------------------------
# Réplica de lo que pinta zone.js
# ------------------------------------------------------------------
def build_zone(tpl: str, z: dict, props: list, zones: list) -> str:
    name = z["name"]
    url = f"{DOM}/zonas/{z['slug']}"
    title = f"{name} — Inversión en Miami | {SITE}"
    desc = clip(z.get("desc") or f"Inversión inmobiliaria en {name}, Miami.")
    img = full(absurl(z["img"]))

    doc = head_common(tpl, title, desc, url, img, f"{name} — Inversión en Miami | Destiny", f"{name} — Inversión en Miami")
    bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": DOM + "/"},
        {"@type": "ListItem", "position": 2, "name": name, "item": url}]}
    doc = doc.replace("</head>", ld_script(bc) + "</head>", 1)
    doc = re.sub(r"<body[^>]*>", f'<body data-zona="{z["slug"]}" data-desarrollo="zona-{z["slug"]}" data-page-type="zona">', doc, count=1)

    doc = set_attr(doc, "zHeroImg", "src", absurl(z["img"]))
    doc = set_attr(doc, "zHeroImg", "alt", name)
    for el, val in [("zKicker", z["kicker"]), ("zName", name), ("zCrumb", name), ("zDesc", z["desc"]),
                    ("zTesisTitle", f"Por qué {name}"), ("zLong", z.get("long") or z["desc"]), ("ctaZone", name),
                    ("zPoiTitle", f"Qué hay alrededor de {name}"), ("zInvTitle", f"Proyectos en {name}")]:
        doc = set_inner(doc, el, esc(val))
    if not z["stats"]:
        doc = set_attr(doc, "zStats", "style", "display:none")

    poi = ""
    for cat, items in (z.get("poi") or {}).items():
        lis = []
        for it in items:
            if isinstance(it, str):
                lis.append(f'<li><span class="poi__n">{it}</span></li>')
                continue
            m = f'<span class="poi__m">{it["m"]}</span>' if it.get("m") else ""
            note = f'<span class="poi__note">{it["note"]}</span>' if it.get("note") else ""
            lis.append(f'<li><span class="poi__n">{it["n"]}{m}</span>{note}</li>')
        poi += f'<div class="poi__cat"><h4>{cat}</h4><ul>{"".join(lis)}</ul></div>'
    doc = set_inner(doc, "zPoi", poi)
    doc = set_inner(doc, "zMap", maps_iframe("Mapa de " + name, name + ", FL", 14))
    doc = set_attr(doc, "zMapLegend", "style", "display:none")

    inv = [p for p in props if p["zone"] == z["zoneName"]]
    doc = set_inner(doc, "zCount", str(len(inv)))
    doc = set_inner(doc, "zGrid", "".join(card_html(p) for p in inv) if inv else
                    '<p class="inv__empty" style="display:block;">Inventario de esta zona disponible bajo solicitud. '
                    '<a href="#agenda" style="color:var(--gold);">Solicitar →</a></p>')

    otras = "".join(f"""
    <a class="zone" href="/zonas/{o['slug']}">
      <div class="zone__idx">{o['idx']}</div>
      <div class="zone__name"><div class="k">{o['kicker']}</div><h3>{o['name']}</h3></div>
      <div class="zone__desc">{o['desc']}</div>
      <div class="zone__stats">
        {"".join(f'<div class="zone__stat"><div class="n">{s[0]}</div><div class="l">{s[1]}</div></div>' for s in o['stats'])}
      </div>
      <span class="zone__link">Ver zona <span class="ar">→</span></span>
    </a>""" for o in zones if o["slug"] != z["slug"])
    doc = set_inner(doc, "zOtras", otras)

    doc = root_absolute(doc)
    return doc.replace("<!DOCTYPE html>\n", "<!DOCTYPE html>\n" + GENERATED.format(src="Zona.html"), 1)


# ------------------------------------------------------------------
# Bloque del .htaccess
# ------------------------------------------------------------------
def htaccess_block(props, zones) -> str:
    out = ["# BEGIN fichas — generado por scripts/build-fichas.py; no editar a mano.",
           "  # Un 301 por slug desde la plantilla vieja a la URL limpia. El \"?\" final",
           "  # descarta la query: el destino no arrastra ?p= ni ?z=."]
    for p in props:
        out.append(f"  RewriteCond %{{QUERY_STRING}} (^|&)(p|proj)={p['slug']}(&|$)")
        out.append(f"  RewriteRule ^Propiedad\\.html$ /proyectos/{p['slug']}? [R=301,L]")
    out += ["  # Slug inexistente o sin parámetro: a la colección. \"/?#mapa\" y no",
            "  # \"/#mapa\": LiteSpeed pega la query después del # y el ancla deja",
            "  # de funcionar (verificado en /propiedad/?foo=1 → /#mapa?foo=1).",
            "  RewriteRule ^Propiedad\\.html$ /?#mapa [R=301,L,NE]"]
    for z in zones:
        out.append(f"  RewriteCond %{{QUERY_STRING}} (^|&)z={z['slug']}(&|$)")
        out.append(f"  RewriteRule ^Zona\\.html$ /zonas/{z['slug']}? [R=301,L]")
    out += ["  RewriteRule ^Zona\\.html$ /?#zonas [R=301,L,NE]",
            "  # END fichas"]
    return "\n".join(out)


def write_htaccess(props, zones) -> bool:
    f = ROOT / ".htaccess"
    s = f.read_text(encoding="utf-8")
    rx = re.compile(r"  # BEGIN fichas.*?# END fichas", re.S)
    if not rx.search(s):
        print("AVISO: .htaccess no tiene los marcadores '# BEGIN fichas' / '# END fichas'; no se tocó.")
        return False
    new = rx.sub(lambda m: "  " + htaccess_block(props, zones), s, count=1)
    if new != s:
        f.write_text(new, encoding="utf-8")
    return True


def write_dir(name: str, pages: dict):
    d = ROOT / name
    d.mkdir(exist_ok=True)
    for old in d.glob("*.html"):
        if old.stem not in pages:
            old.unlink()
            print(f"  borrada {name}/{old.name} (ya no está en data.js)")
    for slug, body in pages.items():
        (d / f"{slug}.html").write_text(body, encoding="utf-8")


def main() -> int:
    props, zones = load_data()
    ptpl = (ROOT / "Propiedad.html").read_text(encoding="utf-8")
    ztpl = (ROOT / "Zona.html").read_text(encoding="utf-8")

    write_dir("proyectos", {p["slug"]: build_prop(ptpl, p, props, zones) for p in props})
    write_dir("zonas", {z["slug"]: build_zone(ztpl, z, props, zones) for z in zones})
    ok = write_htaccess(props, zones)

    print(f"proyectos/  {len(props)} fichas")
    print(f"zonas/      {len(zones)} fichas")
    print(f".htaccess   {'bloque de fichas actualizado' if ok else 'SIN CAMBIOS'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
