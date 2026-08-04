#!/usr/bin/env python3
"""
Rellena el mapa de imágenes destacadas de assets/blog-data.js.

El home de destiny.mx no consulta el API de WordPress (se quiere estático y sin
peticiones extra), así que las portadas de los artículos se congelan aquí. Este
script las va a buscar al blog y reescribe SOLO el bloque marcado con
AUTO:INICIO / AUTO:FIN. Todo lo demás del archivo se respeta.

Correr después de publicar una entrada nueva, junto con la actualización de la
lista POSTS:

    python3 scripts/blog-imgs.py            # escribe
    python3 scripts/blog-imgs.py --dry-run  # solo reporta

Los artículos que no viven en WordPress (los que se leen con Articulo.html) y
los que aún no tienen imagen destacada asignada se resuelven con OVERRIDES.
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

API = "https://blog.destiny.mx/wp-json/wp/v2"
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "assets" / "blog-data.js"

# Tamaños que registra el tema, del más barato al más pesado. La tarjeta más
# grande del home mide ~700px de ancho, así que 800x560 sobra.
SIZES = ("destiny-card", "medium_large", "large")

# Portadas elegidas a mano, del banco de imágenes del propio sitio.
# Cubren dos casos: artículos que no viven en WordPress, y artículos de WP a los
# que todavía nadie les asignó imagen destacada. En cuanto se les asigne una en
# WP, basta con borrar su línea de aquí: el script la tomará del blog.
OVERRIDES = {
    # No viven en WordPress (se leen con Articulo.html)
    "costos-de-cierre-preconstruccion-price-list": "assets/img/midtownpark/exterior.jpg",
    "frida-kahlo-wynwood-residences-analisis":     "assets/img/frida/hero.jpg",
    "premium-residencias-marca-miami":             "assets/img/mandarin/hero.jpg",
    "marcas-miami-renta-vs-prestigio":             "assets/img/stregis-brickell/hero.jpg",
    "premium-marca-reventa-cuando-no":             "assets/img/cipriani/hero.jpg",
    # En WordPress, pero sin imagen destacada asignada
    "invertir-en-miami-proteger-patrimonio-2026":              "assets/img/hero-miami.jpg",
    "invertir-miami-desde-mexico-blindaje-patrimonial":        "assets/img/hero-bahia.jpg",
    "financiamiento-inmobiliario-miami-inversionistas":        "assets/img/hero-dusk.jpg",
    "titulo-propiedad-miami-extranjeros":                      "assets/img/onepark/hero.jpg",
    "invertir-miami-siendo-extranjero":                        "assets/img/blog-skyline.jpg",
    "mejores-ciudades-invertir-bienes-raices-cuando":          "assets/img/hero-turquesa.jpg",
    "economia-mexicana-analisis-real-inversionistas":          "assets/img/hero-bluehour.jpg",
    "invertir-en-miami-desde-mexico-guia-completa":            "assets/img/blog-skyline2.jpg",
    "que-pasa-si-no-pago-hipoteca-miami":                      "assets/img/viceroy/exterior.jpg",
    "titulo-propiedad-estados-unidos-inversionistas-mexicanos": "assets/img/rivage/dusk.jpg",
    "seguridad-juridica-propiedad-estados-unidos-extranjeros": "assets/img/stregis-brickell/entrance.jpg",
    "inversion-inmobiliaria-miami-tips":                       "assets/img/hero-pool.jpg",
    "south-beach":                                             "assets/img/faena/beach.jpg",
}

# El archivo de 2021 quedó sin portada: su featured_media apunta a adjuntos que
# la migración dejó huérfanos. No se listan aquí porque el home sólo muestra los
# 5 artículos más recientes y nunca los alcanza; caen en el pool de respaldo de
# blog-data.js, que rota para que no se repita la misma foto.


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "destiny-blog-imgs/1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def wp_images():
    """slug -> URL de la imagen destacada, tal como está hoy en el blog.

    Se resuelve con _embed y no consultando /media por id: muchas entradas
    viejas traen un featured_media que apunta a un adjunto que ya no existe
    (huérfanos de la migración), y /media?include= los omite en silencio.
    Con _embed el propio WordPress decide qué puede resolver.

    Ojo: _embed sólo funciona si _links viaja en _fields. Sin _links, WordPress
    devuelve el listado sin ningún _embedded y todo queda sin imagen.
    """
    out, total = {}, 0
    for page in range(1, 6):
        try:
            batch = fetch(f"{API}/posts?per_page=50&page={page}"
                          f"&_embed&_fields=slug,featured_media,_embedded,_links")
        except Exception:
            break
        if not batch:
            break
        total += len(batch)
        for p in batch:
            media = (p.get("_embedded") or {}).get("wp:featuredmedia") or [{}]
            fm = media[0] if media else {}
            if not fm.get("source_url"):
                continue
            sizes = (fm.get("media_details") or {}).get("sizes") or {}
            out[p["slug"]] = next((sizes[s]["source_url"] for s in SIZES if s in sizes),
                                  fm["source_url"])
        if len(batch) < 50:
            break
    return out, total


def main():
    dry = "--dry-run" in sys.argv
    src = DATA.read_text(encoding="utf-8")

    slugs = re.findall(r'^\s*\[".*?",\s*"([^"]+)"', src, re.M)
    if not slugs:
        sys.exit("No pude leer la lista POSTS de blog-data.js — ¿cambió el formato?")

    from_wp, total = wp_images()
    print(f"WordPress: {total} entradas, {len(from_wp)} con imagen destacada")

    lines, faltan, usados_wp, usados_ov = [], [], 0, 0
    for s in slugs:
        url = from_wp.get(s) or OVERRIDES.get(s)
        if not url:
            faltan.append(s)
            continue
        if s in from_wp:
            usados_wp += 1
        else:
            usados_ov += 1
        lines.append(f'    "{s}": "{url}",')

    print(f"blog-data.js: {len(slugs)} artículos → {usados_wp} del blog, {usados_ov} del banco local")
    if faltan:
        print(f"\nSIN IMAGEN ({len(faltan)}) — usarán la de respaldo; agrégalas a OVERRIDES:")
        for s in faltan:
            print("   ", s)

    bloque = "/* AUTO:INICIO */\n" + "\n".join(lines) + "\n  /* AUTO:FIN */"
    nuevo, n = re.subn(r"/\* AUTO:INICIO \*/.*?/\* AUTO:FIN \*/", lambda _: bloque, src, flags=re.S)
    if n != 1:
        sys.exit("No encontré los marcadores AUTO:INICIO / AUTO:FIN en blog-data.js")

    if dry:
        print("\n--dry-run: no escribí nada")
    elif nuevo == src:
        print("\nSin cambios")
    else:
        DATA.write_text(nuevo, encoding="utf-8")
        print(f"\nEscrito: {DATA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
