#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESTINY — verificador de enlaces y de sitemap.

Dos modos:

  python3 scripts/check-links.py
      Revisa los enlaces internos de todos los .html del repositorio contra el
      sistema de archivos y contra las rutas limpias declaradas en .htaccess.
      Termina con código 1 si hay enlaces rotos.

  python3 scripts/check-links.py --live
      Además pide por HTTP cada URL de los sitemaps y verifica que responda
      200. Este es el modo que hay que correr DESPUÉS de cada redespliegue:
      es exactamente el fallo que tenía el sitio (canónicas y sitemap
      apuntando a rutas de la era WordPress que devolvían 404).

Sin dependencias externas: solo la biblioteca estándar.
"""
import glob
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)

# Rutas sin extensión que resuelve el .htaccess. Si agregas una ruta corta allá,
# agrégala aquí o el verificador la reportará como roto.
RUTAS_LIMPIAS = {"/agenda", "/club", "/radar", "/scorecard", "/",
                 # Landings de Google Ads y sus páginas de gracias
                 "/preconstruccion-miami", "/invertir-en-dolares", "/guia",
                 "/gracias-preconstruccion", "/gracias-dolares", "/gracias-guia"}

SALTAR = ("http://", "https://", "mailto:", "tel:", "javascript:", "data:", "//", "#")


def revisar_internos() -> int:
    roto = {}
    for f in sorted(glob.glob("*.html") + glob.glob("articles/*.html")):
        s = Path(f).read_text(encoding="utf-8")
        for m in re.findall(r'(?:href|src)="([^"]+)"', s):
            if m.startswith(SALTAR) or "${" in m:
                continue
            ruta = m.split("?")[0].split("#")[0]
            if not ruta:
                continue
            if ruta in RUTAS_LIMPIAS:
                continue
            base = "" if ruta.startswith("/") else os.path.dirname(f)
            p = os.path.normpath(os.path.join(base, ruta.lstrip("/")))
            if not os.path.exists(p):
                roto.setdefault(f, set()).add(m)

    if not roto:
        print("Enlaces internos: sin roturas.")
        return 0
    print("ENLACES INTERNOS ROTOS:")
    for f in sorted(roto):
        for m in sorted(roto[f]):
            print(f"  {f} -> {m}")
    return 1


def revisar_vivo() -> int:
    urls = []
    for sm in glob.glob("sitemap*.xml"):
        s = Path(sm).read_text(encoding="utf-8")
        for loc in re.findall(r"<loc>([^<]+)</loc>", s):
            if loc.endswith(".xml"):
                continue
            urls.append((sm, loc))

    malas = []
    for sm, u in urls:
        try:
            req = urllib.request.Request(u, method="HEAD",
                                        headers={"User-Agent": "destiny-link-check/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                code = r.status
                final = r.geturl()
        except urllib.error.HTTPError as e:
            code, final = e.code, u
        except Exception as e:                                  # red caída, DNS, etc.
            code, final = f"ERROR {e.__class__.__name__}", u
        redir = (final.rstrip("/") != u.rstrip("/"))
        ok = (code == 200 and not redir)
        print(f"  {'OK ' if ok else '!! '} {code:<5} {u}" + (f"\n        -> {final}" if redir else ""))
        if not ok:
            malas.append((sm, u, code, final))

    print(f"\n{len(urls)} URL revisadas · {len(malas)} con problema")
    if malas:
        print("\nToda URL del sitemap tiene que responder 200 sin redirección.")
        return 1
    return 0


def main() -> int:
    rc = revisar_internos()
    if "--live" in sys.argv:
        print("\nSitemap contra el servidor:")
        rc |= revisar_vivo()
    return rc


if __name__ == "__main__":
    sys.exit(main())
