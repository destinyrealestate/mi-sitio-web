#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESTINY — generador de sitemap.

Lee los proyectos y las zonas directamente de assets/data.js (única fuente de
verdad) y escribe:

  sitemap.xml        índice de sitemaps
  sitemap-pages.xml  páginas fijas y rutas de campaña
  sitemap-props.xml  una entrada por proyecto de la colección
  sitemap-zonas.xml  una entrada por zona

Por qué existe este script: el sitemap anterior estaba escrito a mano y
listaba las rutas de la era WordPress (/marca/, /propiedad/?proj=…). 28 de sus
30 URLs respondían 404. Ahora se genera de los datos y solo puede contener
URLs que existen.

REGLA: toda URL del sitemap tiene que responder 200. Nunca una redirección,
nunca una URL con noindex. Verifícalo con `python3 scripts/check-links.py`.

Uso:  python3 scripts/build-sitemap.py
"""
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOM = "https://destiny.mx"
TODAY = date.today().isoformat()


def slugify(s: str) -> str:
    """Réplica exacta de la función slug() de assets/data.js."""
    s = s.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("&", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def names_between(src: str, start: str, end: str) -> list:
    i, j = src.find(start), src.find(end)
    if i < 0 or j < 0:
        raise SystemExit(f"No pude delimitar el bloque {start!r} en assets/data.js")
    return re.findall(r'name:\s*"((?:[^"\\]|\\.)*)"', src[i:j])


# Páginas fijas. Solo rutas que responden 200.
PAGES = [
    ("/",                        "1.0", "weekly"),
    ("/agenda",                  "0.9", "monthly"),
    ("/club",                    "0.9", "monthly"),
    ("/radar",                   "0.8", "monthly"),
    ("/scorecard",               "0.8", "monthly"),
    ("/Marca.html",              "0.8", "monthly"),
    ("/Inversion.html",          "0.8", "monthly"),
    ("/privacidad.html",         "0.2", "yearly"),
]


def urlset(entries: list) -> str:
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, prio, freq in entries:
        out.append("  <url>")
        out.append(f"    <loc>{DOM}{loc}</loc>")
        out.append(f"    <lastmod>{TODAY}</lastmod>")
        out.append(f"    <changefreq>{freq}</changefreq>")
        out.append(f"    <priority>{prio}</priority>")
        out.append("  </url>")
    out.append("</urlset>")
    return "\n".join(out) + "\n"


def main() -> int:
    src = (ROOT / "assets" / "data.js").read_text(encoding="utf-8")

    props = [slugify(n) for n in names_between(src, "const PROPS = [", "].map(p =>")]
    zonas = [slugify(n) for n in names_between(src, "const ZONES = [", "].map(z =>")]

    files = {
        "sitemap-pages.xml": urlset(PAGES),
        "sitemap-props.xml": urlset([(f"/Propiedad.html?p={s}", "0.7", "weekly") for s in props]),
        "sitemap-zonas.xml": urlset([(f"/Zona.html?z={s}", "0.6", "monthly") for s in zonas]),
    }

    idx = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for name in list(files) + ["__blog__"]:
        loc = "https://blog.destiny.mx/sitemap_index.xml" if name == "__blog__" else f"{DOM}/{name}"
        idx.append(f"  <sitemap><loc>{loc}</loc><lastmod>{TODAY}</lastmod></sitemap>")
    idx.append("</sitemapindex>")
    files["sitemap.xml"] = "\n".join(idx) + "\n"

    for name, body in files.items():
        (ROOT / name).write_text(body, encoding="utf-8")
        n = body.count("<loc>")
        print(f"{name:22s} {n} URL")

    print(f"\n{len(props)} proyectos · {len(zonas)} zonas · {len(PAGES)} páginas fijas")
    return 0


if __name__ == "__main__":
    sys.exit(main())
