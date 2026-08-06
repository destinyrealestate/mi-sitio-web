#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESTINY — parche de <head> y <body> en todas las páginas del sitio.

Aplica, de forma idempotente (se puede correr varias veces sin duplicar):

  1. <html lang="es-MX">                                        (tarea 4.10)
  2. consent.js + attribution.js al inicio del <head>, ANTES de
     GA4 / Meta Pixel / GTM                                     (tareas 1.1, 1.5)
  3. preconnect a Google y Meta                                  (tarea 4.8)
  4. ContentSquare en async (deja de bloquear el render)         (tarea 4.9)
  5. data-desarrollo / data-page-type en el <body>               (tarea 1.2)
  6. tracking.js + forms.js antes de </body>                     (tareas 1.3, 2.2)

Uso:  python3 scripts/patch-head.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# archivo -> (data-desarrollo, data-page-type, extra attrs)
PAGES = {
    "index.html":              ("home",                "home",      ""),
    "Marca.html":              ("marca",               "contenido", ""),
    "Inversion.html":          ("inversion",           "contenido", ""),
    "Propiedad.html":          ("",                    "proyecto",  ""),
    "Zona.html":               ("zona",                "zona",      ""),
    "Dossier.html":            ("dossier",             "dossier",   ""),
    "blog-home.html":          ("blog",                "blog",      ""),
    "Articulo.html":           ("blog",                "blog",      ""),
    "Blog.html":               ("blog",                "blog",      ""),
    "cipriani-lp1.html":       ("cipriani-residences", "proyecto",  ""),
    "cipriani-lp2.html":       ("cipriani-residences", "proyecto",  ""),
    "cipriani-lp3.html":       ("cipriani-residences", "proyecto",  ""),
    "gracias.html":            ("home",                "gracias",   'data-form-type="sesion"'),
    "gracias-newsletter.html": ("home",                "gracias",   'data-form-type="newsletter"'),
    "gracias-sesion.html":     ("home",                "gracias",   'data-form-type="sesion"'),
    "gracias-scorecard.html":  ("home",                "gracias",   'data-form-type="scorecard"'),
    "gracias-club.html":       ("home",                "gracias",   'data-form-type="club"'),
    "agenda.html":             ("agenda",              "captura",   ""),
    "club.html":               ("club",                "captura",   ""),
    "radar.html":              ("radar",               "captura",   ""),
    "scorecard.html":          ("scorecard",           "captura",   ""),
    "privacidad.html":         ("legal",               "legal",     ""),
    "404.html":                ("404",                 "404",       ""),
}

V = "7"  # versión de caché de los scripts nuevos

HEAD_BLOCK = f"""<!-- ATRIBUCIÓN Y CONSENTIMIENTO — no mover: van antes de GA4, Meta y GTM -->
<script src="/assets/consent.js?v={V}"></script>
<script src="/assets/attribution.js?v={V}"></script>
<link rel="preconnect" href="https://www.googletagmanager.com">
<link rel="dns-prefetch" href="https://connect.facebook.net">
<link rel="dns-prefetch" href="https://t.contentsquare.net">
<!-- FIN ATRIBUCIÓN Y CONSENTIMIENTO -->"""

MARK_HEAD = "<!-- FIN ATRIBUCIÓN Y CONSENTIMIENTO -->"
# GA4 + Pixel de Meta + Contentsquare. Los IDs viven en assets/tags.js, no aquí.
TAGS_LINE = f'<script src="/assets/tags.js?v={V}"></script>'

# forms.js NO va en todas las páginas: solo en las que tienen un contenedor
# [data-destiny-form]. En una página de gracias o en el aviso de privacidad
# sería una descarga que no dibuja nada.
FOOT_TRACKING = f'<script src="/assets/tracking.js?v={V}"></script>'
FOOT_FORMS = f'<script src="/assets/forms.js?v={V}"></script>'


def foot_block(html: str) -> str:
    lineas = ["<!-- CAPA DE MEDICIÓN -->", FOOT_TRACKING]
    if "data-destiny-form" in html:
        lineas.append(FOOT_FORMS)
    lineas.append("<!-- FIN CAPA DE MEDICIÓN -->")
    return "\n".join(lineas)

CS_OLD = '<script src="https://t.contentsquare.net/uxa/7dccdd22cb616.js"></script>'
CS_NEW = '<script async src="https://t.contentsquare.net/uxa/7dccdd22cb616.js"></script>'


def patch(path: Path, desarrollo: str, page_type: str, extra: str) -> list:
    s = original = path.read_text(encoding="utf-8")
    notes = []

    # 1. lang
    new = re.sub(r'<html\s+lang="es"(\s|>)', r'<html lang="es-MX"\1', s, count=1)
    if new != s:
        notes.append("lang=es-MX")
        s = new

    # 2 y 3. bloque de cabeza, justo después del charset
    if "FIN ATRIBUCIÓN Y CONSENTIMIENTO" not in s:
        m = re.search(r'<meta charset="[^"]+">\s*\n', s)
        if not m:
            notes.append("!! sin <meta charset>: bloque de cabeza NO insertado")
        else:
            s = s[: m.end()] + HEAD_BLOCK + "\n" + s[m.end():]
            notes.append("head: consent+attribution+preconnect")

    # 3.b Etiquetas de medición centralizadas (GA4 + Pixel + Contentsquare).
    #     Van justo después del bloque de consentimiento y atribución.
    if "assets/tags.js" not in s and MARK_HEAD in s:
        s = s.replace(MARK_HEAD, MARK_HEAD + "\n" + TAGS_LINE, 1)
        notes.append("tags.js")

    # 4. ContentSquare async
    if CS_OLD in s:
        s = s.replace(CS_OLD, CS_NEW)
        notes.append("contentsquare async")

    # 5. atributos del body
    m = re.search(r"<body([^>]*)>", s)
    if m:
        attrs = m.group(1)
        add = []
        if "data-desarrollo" not in attrs:
            add.append(f'data-desarrollo="{desarrollo}"')
        if "data-page-type" not in attrs:
            add.append(f'data-page-type="{page_type}"')
        if extra and extra.split("=")[0] not in attrs:
            add.append(extra)
        if add:
            s = s[: m.start()] + "<body" + attrs + " " + " ".join(add) + ">" + s[m.end():]
            notes.append("body: " + " ".join(a.split("=")[0] for a in add))

    # 6. bloque de pie
    if "FIN CAPA DE MEDICIÓN" not in s:
        i = s.rfind("</body>")
        if i < 0:
            notes.append("!! sin </body>: capa de medición NO insertada")
        else:
            bloque = foot_block(s)
            s = s[:i] + bloque + "\n" + s[i:]
            notes.append("foot: tracking" + ("+forms" if FOOT_FORMS in bloque else ""))

    if s != original:
        path.write_text(s, encoding="utf-8")
    return notes


def main() -> int:
    missing = []
    for name, (des, pt, extra) in PAGES.items():
        p = ROOT / name
        if not p.exists():
            missing.append(name)
            continue
        notes = patch(p, des, pt, extra)
        print(f"{name:26s} {' · '.join(notes) if notes else 'sin cambios'}")
    for name in missing:
        print(f"{name:26s} (no existe todavía — se omite)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
