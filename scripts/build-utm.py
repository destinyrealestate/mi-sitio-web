#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESTINY — generador de URLs etiquetadas con UTM.

La convención está en UTM.md. Este script la aplica y la VALIDA: si una fila
trae `utm_source: IG` en vez de `instagram`, falla con un mensaje claro en vez
de generar una URL que ensucia el reporte para siempre.

(La lista de tareas pedía scripts/build-utm.js, pero esta máquina no tiene
Node.js instalado. En Python corre tal cual, sin instalar nada.)

Uso:
    python3 scripts/build-utm.py --plantilla > parrilla.csv
    python3 scripts/build-utm.py parrilla.csv
    python3 scripts/build-utm.py parrilla.csv --salida urls.csv
    python3 scripts/build-utm.py --una /agenda instagram reel 2026-w31 och-reel-01
"""
import argparse
import csv
import io
import re
import sys
from urllib.parse import quote

DOMINIO = "https://destiny.mx"

FUENTES = {"instagram", "facebook", "youtube", "linkedin", "whatsapp", "tiktok",
           "newsletter", "google", "email"}
MEDIOS = {"reel", "story", "post", "carrusel", "bio", "video", "descripcion",
          "email", "cpc", "organico", "dm"}
DESTINOS = {"/agenda", "/club", "/radar", "/scorecard", "/", "/Marca.html",
            "/Inversion.html"}

RE_SEMANA = re.compile(r"^20\d{2}-w(0[1-9]|[1-4]\d|5[0-3])$")
RE_CONTENIDO = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

COLUMNAS = ["destino", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]

PLANTILLA = """destino,utm_source,utm_medium,utm_campaign,utm_content,utm_term
/agenda,instagram,reel,2026-w31,och-reel-01,
/club,instagram,bio,2026-w31,dre-bio,
/radar,youtube,descripcion,2026-w31,och-video-hoa,
/scorecard,newsletter,email,2026-w31,nl-cta-principal,
"""


def validar(fila: dict, n: int) -> list:
    e = []
    d = (fila.get("destino") or "").strip()
    if not d.startswith("/"):
        e.append(f'destino "{d}" tiene que empezar con /')
    elif d not in DESTINOS:
        e.append(f'destino "{d}" no está en la lista. Permitidos: {", ".join(sorted(DESTINOS))}')

    s = (fila.get("utm_source") or "").strip()
    if s not in FUENTES:
        e.append(f'utm_source "{s}" no permitido. Usa: {", ".join(sorted(FUENTES))}')

    m = (fila.get("utm_medium") or "").strip()
    if m not in MEDIOS:
        e.append(f'utm_medium "{m}" no permitido. Usa: {", ".join(sorted(MEDIOS))}')

    c = (fila.get("utm_campaign") or "").strip()
    if not RE_SEMANA.match(c):
        e.append(f'utm_campaign "{c}" no es una semana ISO. Formato: 2026-w31')

    k = (fila.get("utm_content") or "").strip()
    if not RE_CONTENIDO.match(k):
        e.append(f'utm_content "{k}" tiene que ser minúsculas y guiones (ej. och-reel-01)')

    t = (fila.get("utm_term") or "").strip()
    if t and not RE_CONTENIDO.match(t):
        e.append(f'utm_term "{t}" tiene que ser minúsculas y guiones')
    if t and m != "cpc":
        e.append("utm_term solo se usa en búsqueda pagada (utm_medium=cpc)")

    return [f"fila {n}: {x}" for x in e]


def construir(fila: dict) -> str:
    partes = []
    for k in ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"):
        v = (fila.get(k) or "").strip()
        if v:
            partes.append(f"{k}={quote(v, safe='')}")
    d = fila["destino"].strip()
    return DOMINIO + d + ("?" if partes else "") + "&".join(partes)


def main() -> int:
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("csv", nargs="?", help="CSV de la parrilla")
    ap.add_argument("--plantilla", action="store_true", help="imprime un CSV de ejemplo")
    ap.add_argument("--salida", help="escribe un CSV con la columna url agregada")
    ap.add_argument("--una", nargs=5,
                    metavar=("DESTINO", "SOURCE", "MEDIUM", "CAMPAIGN", "CONTENT"),
                    help="genera una sola URL")
    a = ap.parse_args()

    if a.plantilla:
        sys.stdout.write(PLANTILLA)
        return 0

    if a.una:
        fila = dict(zip(["destino", "utm_source", "utm_medium", "utm_campaign", "utm_content"], a.una))
        fila["utm_term"] = ""
        errs = validar(fila, 1)
        if errs:
            print("\n".join(errs), file=sys.stderr)
            return 1
        print(construir(fila))
        return 0

    if not a.csv:
        ap.print_help()
        return 2

    with open(a.csv, newline="", encoding="utf-8-sig") as fh:
        filas = list(csv.DictReader(fh))

    if not filas:
        print(f"{a.csv} está vacío o no tiene encabezados.", file=sys.stderr)
        return 1

    faltan = [c for c in COLUMNAS if c not in filas[0]]
    if faltan:
        print(f"Faltan columnas en el CSV: {', '.join(faltan)}", file=sys.stderr)
        print(f"Encabezados esperados: {','.join(COLUMNAS)}", file=sys.stderr)
        return 1

    errores, urls = [], []
    for i, fila in enumerate(filas, start=2):          # 2 = primera fila de datos
        e = validar(fila, i)
        if e:
            errores += e
        else:
            urls.append((fila, construir(fila)))

    if errores:
        print(f"{len(errores)} problema(s). No se generó nada:\n", file=sys.stderr)
        print("\n".join("  " + x for x in errores), file=sys.stderr)
        print("\nLa convención está en UTM.md.", file=sys.stderr)
        return 1

    if a.salida:
        with open(a.salida, "w", newline="", encoding="utf-8") as fh:
            w = csv.DictWriter(fh, fieldnames=COLUMNAS + ["url"])
            w.writeheader()
            for fila, url in urls:
                w.writerow({**{k: fila.get(k, "") for k in COLUMNAS}, "url": url})
        print(f"{len(urls)} URL escritas en {a.salida}")
    else:
        for fila, url in urls:
            print(f"{fila['utm_content']:24s} {url}")
        print(f"\n{len(urls)} URL generadas.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
