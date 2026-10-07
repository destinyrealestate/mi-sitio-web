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
| `/propiedad/?proj={slug}` | `/proyectos/{slug}` | 301 |
| `/propiedad/` (sin slug) | `/?#mapa` | 301 |
| `/zona/?z={slug}` | `/zonas/{slug}` | 301 |
| `/zona/` (sin slug) | `/?#zonas` | 301 |

Hasta el 2026-10-07 estas iban a `/Propiedad.html?p=` y `/Zona.html?z=`. Ahora
van directo a la URL limpia: si siguieran apuntando a la plantilla serían una
cadena de dos saltos.

**Cinturón y tirantes:** además del 301, `assets/property.js` acepta `?proj=`
como sinónimo de `?p=`. Así, si la regla del `.htaccess` fallara o el servidor
la ignorara, los enlaces viejos siguen funcionando.

---

## Fichas de proyecto y de zona (2026-10-07)

`Propiedad.html` y `Zona.html` eran una sola plantilla que se llenaba por
JavaScript: el HTML crudo llegaba con el mismo título, la misma descripción y
una canónica a `/Propiedad.html` en los 29 proyectos, y un slug mal escrito
mostraba Faena (o Brickell) con 200. Search Console las trataba como
duplicadas. Ahora cada proyecto y cada zona tiene su HTML con el contenido
ya escrito, generado por `scripts/build-fichas.py`.

| URL pública | Sirve | Tipo |
|---|---|---|
| `/proyectos/{slug}` (con o sin `/` final) | `proyectos/{slug}.html` | reescritura interna (200) |
| `/zonas/{slug}` (con o sin `/` final) | `zonas/{slug}.html` | reescritura interna (200) |
| `/proyectos/{inexistente}` | 404 de marca | 404 |
| `/Propiedad.html?p={slug}` (también `?proj=`) | `/proyectos/{slug}` | 301, uno por slug |
| `/Propiedad.html?p={inexistente}` y `/Propiedad.html` | `/?#mapa` | 301 |
| `/Zona.html?z={slug}` | `/zonas/{slug}` | 301, uno por slug |
| `/Zona.html?z={inexistente}` y `/Zona.html` | `/?#zonas` | 301 |

**Los 301 por slug no se escriben a mano.** Viven entre `# BEGIN fichas` y
`# END fichas` y los reescribe `scripts/build-fichas.py` cada vez que corre.
Al dar de alta un proyecto: `python3 scripts/build-fichas.py` y
`python3 scripts/build-sitemap.py`.

**Por qué `/?#mapa` y no `/#mapa`:** cuando la URL de origen trae query,
LiteSpeed la pega después del `#` (verificado: `/propiedad/?foo=1` →
`/#mapa?foo=1`) y el ancla deja de funcionar. El `?` vacío la descarta. Por
el mismo motivo los destinos por slug terminan en `?`: `/proyectos/{slug}`
llega limpio aunque el origen trajera `?p=…&utm_source=…`. Los UTM de un
enlace viejo a `Propiedad.html` se pierden; las campañas usan las landings.

**El `.html` sigue respondiendo 200** (`/proyectos/{slug}.html`), igual que
las rutas cortas: la duplicidad la resuelve la canónica.

**Si un slug no existe en el navegador** (una landing con `data-prop` mal
escrito, por ejemplo), `property.js` y `zone.js` ya no inventan contenido:
ponen `noindex` y mandan a `/#mapa` o `/#zonas` con `location.replace`.

---

## La era WordPress, al blog (2026-10-07)

Search Console reportaba 525 páginas sin indexar. Buena parte eran URLs del
WordPress viejo que Google seguía rastreando en `destiny.mx` y que daban 404.
Las 75 entradas `/blog/tips-invertir/{slug}/` existen con la misma ruta en
`blog.destiny.mx` (verificado: 75/75 responden 200).

| Origen | Destino | Tipo |
|---|---|---|
| `/blog/…` `/category/…` `/tag/…` `/author/…` `/feed/…` `/wp-content/…` | `blog.destiny.mx/` + la misma ruta | 301 |
| `/?p={número}` `/?page_id={número}` `/?attachment_id={número}` (también con `index.html`) | `blog.destiny.mx/?p={número}` | 301 |

**Por qué va antes que todas las demás reglas:** es la más amplia y no choca
con ninguna; si quedara abajo, cualquier regla nueva que empiece por `blog`
podría ganarle sin que nadie lo note.

**Lo que no atrapa, a propósito:** `blog-home.html` (el patrón exige `blog`
sola o seguida de `/`) y `Blog.html` (la regla distingue mayúsculas; `Blog.html`
tiene su propia regla más abajo).

**Por qué el `?p=` viaja intacto:** la redirección no le quita el parámetro,
así que llega a `blog.destiny.mx/?p=143` y WordPress lo resuelve a la entrada
que tenía ese ID. Solo atrapa IDs numéricos: el `?p={slug}` de las fichas de
proyecto lleva letras y nunca coincide.

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
2. Las cuatro rutas cortas responden 200: `/agenda` `/club` `/radar` `/scorecard`,
   y una ficha: `/proyectos/bentley-residences-miami`
3. `python3 scripts/check-links.py --live`
4. En Search Console, volver a enviar `https://destiny.mx/sitemap.xml`
   (ahora es un índice de sitemaps, no una lista).
