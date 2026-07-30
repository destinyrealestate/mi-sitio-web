# Redirecciones y rutas — destiny.mx

Todas las reglas viven en el `.htaccess` de este repositorio. Este documento
explica **por qué** existe cada una.

> **Aviso.** Hay un segundo `.htaccess` en el servidor,
> `~/domains/destiny.mx/public_html/.htaccess`, que enruta los dos dominios y
> tiene el `ErrorDocument 404 /static/404.html`. **Ese no está en este
> repositorio y no se toca desde aquí.**

---

## Rutas cortas de campaña

Se dictan a cámara y van en las biografías. **No pueden cambiar nunca.**

| URL pública | Sirve | Tipo |
|---|---|---|
| `destiny.mx/agenda` | `agenda.html` | reescritura interna (200) |
| `destiny.mx/club` | `club.html` | reescritura interna (200) |
| `destiny.mx/radar` | `radar.html` | reescritura interna (200) |
| `destiny.mx/scorecard` | `scorecard.html` | reescritura interna (200) |
| `destiny.mx/agenda/` (con diagonal) | → `destiny.mx/agenda` | 301 |

**Por qué reescritura interna y no redirección:** la URL visible se queda en
`/agenda`, sin extensión. Si fuera un 301 a `/agenda.html`, la extensión
aparecería en la barra del navegador y en las capturas de pantalla.

**Por qué las cuatro páginas usan rutas root-absolutas** (`/assets/…`, no
`assets/…`): se sirven bajo una URL sin extensión. Si alguien entra con
diagonal final, una ruta relativa se resolvería contra `/agenda/` y todo el CSS
y el JavaScript se romperían. Es el mismo motivo por el que `404.html` ya usaba
rutas absolutas.

**El `.html` sigue funcionando.** `destiny.mx/agenda.html` responde 200 igual
que `/agenda`. No se redirige a propósito: un `301` de `.html` a la ruta limpia,
combinado con la reescritura interna, produce un bucle infinito de
redirecciones. La duplicidad se resuelve con `rel="canonical"`, que en las
cuatro páginas apunta a la ruta corta.

---

## Rescate de las rutas de la era WordPress

Estas URLs estaban en el sitemap y en las canónicas del sitio, y **respondían
404** desde la migración al sitio estático. Ver `DIAGNOSTICO.md` § 0.6.

| Origen (404 antes) | Destino | Tipo |
|---|---|---|
| `/marca/` | `/Marca.html` | 301 |
| `/inversion/` | `/Inversion.html` | 301 |
| `/propiedad/?proj={slug}` | `/Propiedad.html?p={slug}` | 301 |
| `/propiedad/` (sin slug) | `/#mapa` | 301 |
| `/zona/?z={slug}` | `/Zona.html?z={slug}` | 301 |
| `/zona/` (sin slug) | `/#zonas` | 301 |

**Cinturón y tirantes:** además del 301, `assets/property.js` acepta `?proj=`
como sinónimo de `?p=`. Así, si la regla del `.htaccess` fallara o el servidor
la ignorara, los enlaces viejos siguen funcionando.

---

## Migración del blog (ya existía)

| Origen | Destino | Tipo |
|---|---|---|
| `/Articulo.html?post={slug}` | `blog.destiny.mx/blog/tips-invertir/{slug}/` | 301 |
| `/Articulo.html?art={slug}` | igual | 301 |
| `/Articulo.html` (sin slug) | `blog.destiny.mx/` | 301 |
| `/Blog.html` | `blog.destiny.mx/` | 301 |

---

## Sin cadenas de redirección

Regla: **origen → destino final en un salto.** Nunca A → B → C.

Se encontró y corrigió una cadena: los fragmentos de `articles/` enlazaban a
`Articulo.html?post={slug}`, que a su vez redirige al blog. Ahora enlazan
directo al destino final.

Para verificarlo:

```bash
python3 scripts/check-links.py --live
```

Reporta cualquier URL del sitemap que no responda 200 **sin redirección**.

---

## Después de cada redespliegue

En este orden:

1. **`https://destiny.mx/` responde 200.** Un error de sintaxis en el
   `.htaccess` devuelve 500 en todo el sitio. Si pasa:
   `git revert --no-edit <commit>` y volver a desplegar.
2. Las cuatro rutas cortas responden 200: `/agenda` `/club` `/radar` `/scorecard`
3. `python3 scripts/check-links.py --live`
4. En Search Console, volver a enviar `https://destiny.mx/sitemap.xml`
   (ahora es un índice de sitemaps, no una lista).
