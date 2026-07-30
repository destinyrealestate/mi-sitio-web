# DIAGNÓSTICO — sitio destiny.mx

Levantado el 2026-07-29 sobre el commit `bcced7d`. Corresponde al Bloque 0 de
`tareas-claude-code-destiny.md`.

---

## Resumen ejecutivo

El sitio funciona y captura leads. Pero tenía **dos fallas de raíz que ningún
punto de la lista de tareas mencionaba**, y que costaban más que todo lo demás
junto:

1. **28 de las 30 URLs del sitemap respondían 404.** El sitemap listaba las
   rutas de la era WordPress (`/marca/`, `/inversion/`, `/propiedad/?proj=…`)
   que dejaron de existir en la migración al sitio estático. Peor: **la
   etiqueta `rel="canonical"` de cada página apuntaba a esa misma URL rota.**
   Una canónica hacia un 404 le dice a Google que la página buena no existe.
   Con esto en pie, ninguna inversión en contenido o en enlaces podía rendir.

2. **Todas las imágenes de Open Graph respondían 404.** Apuntaban a
   `destiny.mx/wp-content/themes/destiny/assets/img/og-default.jpg`, ruta del
   tema de WordPress que ya no existe. Cada vez que alguien compartía el sitio
   en WhatsApp, Facebook o LinkedIn, la vista previa salía vacía. En un negocio
   que se mueve por WhatsApp, esto es dinero directo.

Las dos ya están corregidas. El detalle está más abajo y en el reporte HTML.

---

## 0.1 · Árbol de rutas publicadas

Sitio estático plano. No hay generador, no hay plantillas del lado del
servidor, no hay parciales: cada página es un `.html` completo en la raíz.

| Archivo | URL pública | Contenido |
|---|---|---|
| `index.html` | `/` | Home. Colección, zonas, ventaja, FAQ, newsletter, agenda |
| `Marca.html` | `/Marca.html` | Residencias de marca |
| `Inversion.html` | `/Inversion.html` | Inversión directa |
| `Propiedad.html` | `/Propiedad.html?p={slug}` | Plantilla de proyecto (29 proyectos) |
| `Zona.html` | `/Zona.html?z={slug}` | Plantilla de zona (12 zonas) |
| `Dossier.html` | `/Dossier.html` | Entrega de dossier |
| `Articulo.html` | — | **301 → blog.destiny.mx** (`.htaccess`) |
| `Blog.html` | — | **301 → blog.destiny.mx** (`.htaccess`) |
| `blog-home.html` | `/blog-home.html` | Índice de blog, consume la API REST del WP |
| `cipriani-lp1/2/3.html` | `/cipriani-lp{n}.html` | Landings de campaña de Cipriani |
| `gracias.html` | `/gracias.html` | Gracias genérica, con entrega de dossier |
| `gracias-newsletter.html` | `/gracias-newsletter.html` | Gracias de newsletter |
| `privacidad.html` | `/privacidad.html` | Aviso de Privacidad |
| `404.html` | (ErrorDocument) | 404 de marca |

Agregadas en este trabajo: `agenda.html`, `club.html`, `radar.html`,
`scorecard.html`, `gracias-sesion.html`, `gracias-scorecard.html`,
`gracias-club.html`.

**Parciales:** no existen. El nav y el footer están copiados a mano en cada
archivo. Es la causa de que el nav de unas páginas tenga enlaces que el de
otras no. Las páginas nuevas se generan con `scripts/build-pages.py`, que sí
tiene el nav y el footer en un solo lugar.

`articles/*.html` (5 archivos) **no son páginas publicadas**: son fragmentos
para importar al WordPress del blog. No tienen `<html>`, `<head>` ni `<body>`.

---

## 0.2 · Formularios de Zoho

El punto 1.3 de la lista pedía "eliminar todo enlace a `forms.zohopublic.com`
que use `target="_blank"`". **No existía ninguno**: los cuatro formularios ya
estaban incrustados en dominio propio. Ese punto ya estaba resuelto.

| Formulario | Endpoint Zoho | Dónde | Método | Redirección |
|---|---|---|---|---|
| Agenda (home-TOFU) | `HOMETOFUFORM27062026V1` | `index.html`, y ahora `/agenda`, `/club`, `/scorecard` | iframe `formperma` | la define Zoho en su panel |
| Newsletter | `FORMNEWSLETTER26072026V1` | `index.html`, y ahora `/radar` | iframe `formperma` | `gracias-newsletter.html` |
| Mercedes-Benz | `MERCEDESBENZFORM24062026V1` | `Propiedad.html?p=mercedes-benz-places-miami` | iframe `formperma` | la define Zoho |
| Cipriani | `CIPRIANIFORM27052026V1` | `Propiedad.html?p=cipriani-residences` | **form propio → `htmlRecords/submit`** | `gracias-sesion.html` por JS |

**Campos mapeados hoy** (los visibles del form de Cipriani, que es el único
escrito en el repositorio): `Name_First`, `Name_Last`, `Email`,
`PhoneNumber_countrycode`, `MultipleChoice` (objetivo), `MultipleChoice1`
(plazo), `MultipleChoice2` (presupuesto). Más los técnicos de Zoho:
`zf_referrer_name`, `zf_redirect_url`, `zc_gad`.

**Hallazgo pendiente de tu decisión:** el comentario en `assets/property.js`
dice que el POST directo a `htmlRecords/submit` "lo rechaza Zoho (503) y el
lead nunca se guarda", y que por eso Mercedes usa iframe. Cipriani sigue en el
método viejo. **Si eso aplica también a Cipriani, sus leads se están
perdiendo.** No lo migré porque cambiar el método de captura de una campaña
activa sin poder probar el envío real es demasiado riesgo. Es lo primero que
hay que verificar en el panel de Zoho: entra a `CIPRIANIFORM27052026V1` y mira
si hay registros de los últimos días.

---

## 0.3 · Páginas de proyecto

No hay una página por proyecto: hay **una plantilla** (`Propiedad.html`) que se
llena en el navegador desde `assets/data.js` según el parámetro `?p={slug}`.
Son 29 proyectos. Su listado completo está en `data/proyectos.json`, generado
desde `assets/data.js`.

Consecuencia importante: **el contenido de proyecto no existe en el HTML que
recibe el buscador.** Google ejecuta JavaScript y en general los indexa, pero
sale más lento y con menos confianza que HTML servido. Es una decisión de
arquitectura, no un bug, y cambiarla es un proyecto aparte (pre-render en la
compilación).

---

## 0.4 · Scripts de terceros

Estado **antes** de este trabajo:

| Script | Se cargaba desde | Bloqueante |
|---|---|---|
| Contentsquare | inline en el `<head>` de cada `.html` | **Sí — sin `async`** |
| GA4 (`gtag.js`) | inline en el `<head>` de cada `.html` | No (`async`) |
| Meta Pixel | inline en el `<head>` de cada `.html` | No (se autoinyecta) |
| Google Fonts | `<link rel=stylesheet>` | **Sí (CSS)** |
| Google Maps embed | iframe en `Propiedad.html` | No (`loading=lazy`) |
| Zoho Forms | iframe | No |

El ID de GA4 y el del Pixel estaban **copiados a mano en 16 archivos**.

Estado **después**: los tres viven en `assets/tags.js`, un solo archivo, y el
script de Contentsquare ahora es `async`. Google Fonts sigue bloqueando: es la
tipografía de marca y quitarlo del render crítico provocaría un salto visible
de fuente. Se deja así a propósito.

**Código muerto encontrado:** `assets/data.js` tiene su propia función
`initTracking()` con constantes `GA4_ID` y `META_PIXEL_ID` vacías, más un
`LEAD_WEBHOOK` y una integración de HubSpot, todos vacíos. Nada de eso se
ejecuta. No lo borré para no tocar un archivo del que dependen todas las
páginas, pero es candidato a limpieza.

---

## 0.5 · Rastreo del sitio

- **Enlaces internos rotos:** 5, todos en los fragmentos de `articles/`, que
  apuntaban a `Articulo.html?post={slug}`. Eso es una **cadena de
  redirección**: `Articulo.html?post=x` → 301 → `blog.destiny.mx/...`.
  Corregidos para apuntar al destino final en un solo salto.
- **Cadenas de redirección:** la anterior era la única. Las reglas del
  `.htaccess` van directo al destino final.
- **Páginas huérfanas:** `Dossier.html` y `blog-home.html` no reciben ningún
  enlace interno. `blog-home.html` además tiene su canónica apuntando a
  `blog.destiny.mx`, así que es un remanente de la migración. **Sugerencia: son
  candidatas a borrarse.** No las toqué.
- **404 personalizada:** enganchada por `ErrorDocument 404 /static/404.html` en
  el `.htaccess` de `public_html`, que **no es este archivo del repositorio**.
  Ese `.htaccess` del servidor no está bajo control de versiones.

Verificador permanente: `python3 scripts/check-links.py`.

---

## 0.6 · El fallo del `sitemap.xml`

**Diagnóstico: no era el sitemap. Era su contenido.**

El servidor lo entrega perfecto:

```
HTTP/2 200
content-type: application/xml
content-length: 3116
```

No hay problema de generación, ni de compresión, ni de encabezado
`Content-Type`. Lo que se veía como "datos binarios ilegibles" era, casi con
certeza, un visor intentando interpretar XML sin hoja de estilo, o una caché
del navegador.

**El fallo real era mucho peor:** de las 30 URLs listadas, **28 respondían
404**. El sitemap se escribió cuando el sitio corría en WordPress y nunca se
actualizó tras la migración.

Verificado:

```
https://destiny.mx/marca/                              404
https://destiny.mx/inversion/                          404
https://destiny.mx/propiedad/?proj=bentley-...         404
```

Además faltaban 5 proyectos que sí existen (Nobu, Mercedes-Benz, Bentley,
Midtown Park, Miami Tropic).

**Corregido:** el sitemap se genera ahora desde `assets/data.js` con
`scripts/build-sitemap.py`, sale partido en índice + tres sitemaps (páginas,
proyectos, zonas) y solo puede contener URLs que existen.

---

## 0.7 · Línea base de rendimiento

**No pude producirla.** Lighthouse necesita Node.js y esta Mac no lo tiene
instalado (`node`, `npm` y `npx` no existen en el PATH). Tampoco hay forma de
instalarlo sin tu autorización.

Lo que sí se puede afirmar sin medir, por inspección del código:

- El único script que bloqueaba el render era Contentsquare. **Ya es `async`.**
- El LCP en el home y en las landings es la imagen del hero. **Le puse
  `fetchpriority="high"` a las páginas nuevas.** En las existentes hay que
  revisarlo caso por caso.
- El peso lo dominan las imágenes: son JPG, no WebP ni AVIF, y varias pasan
  de 1 MB. **Es la palanca más grande de rendimiento que queda sin tocar**, y
  la dejé fuera porque convertir ~200 imágenes es un cambio masivo que debe
  hacerse con tu visto bueno y revisión visual.

Para medir cuando quieras, sin instalar nada: PageSpeed Insights
(`pagespeed.web.dev`) sobre `https://destiny.mx/`, una landing de proyecto y
`/gracias.html`.

---

## 0.8 · Stack

| | |
|---|---|
| Generador / CMS | **Ninguno.** HTML estático escrito a mano |
| Proceso de compilación | **Ninguno** antes de este trabajo. Ahora hay scripts de Python en `scripts/` |
| Configuración de redirecciones | `.htaccess` (Apache/LiteSpeed en Hostinger) |
| Despliegue | Git desde hPanel de Hostinger → `~/domains/destiny.mx/public_html/static/` |
| Blog | WordPress aparte, en `blog.destiny.mx` |
| Runtime disponible en esta máquina | `python3`. **No hay Node.js.** |

**Consecuencia de no tener Node:** los puntos de la lista que piden scripts
`.js` de línea de comandos (`scripts/build-utm.js`, `scripts/build-inventario.js`)
y todo el Bloque 6 (Playwright, Lighthouse en integración continua, validación
de JSON-LD) **no se pueden ejecutar aquí**. Los equivalentes que sí corren están
escritos en Python:

| Pedido en la lista | Escrito como |
|---|---|
| `scripts/build-utm.js` | `scripts/build-utm.py` |
| generación de sitemap | `scripts/build-sitemap.py` |
| rastreo de enlaces (6.3) | `scripts/check-links.py` |
| — | `scripts/build-pages.py`, `scripts/patch-head.py` |

---

## Riesgo abierto: el `.htaccess`

Este repositorio tiene un `.htaccess` que **sí está activo** (verificado: las
reglas de `Articulo.html` y `Blog.html` responden 301 en producción). Le agregué
las rutas cortas y el rescate de las URLs de WordPress.

**No pude probarlo.** Un `.htaccess` solo se prueba contra Apache, y aquí no
hay Apache. Un error de sintaxis en ese archivo devuelve **500 en todo el
sitio**.

Al redesplegar, lo primero que hay que hacer es abrir `https://destiny.mx/`.
Si responde 500, el arreglo es inmediato:

```bash
git revert --no-edit <commit>   # y redesplegar
```

Y después, la verificación completa:

```bash
python3 scripts/check-links.py --live
```

Nota aparte: el `.htaccess` de `public_html` —el que enruta los dos dominios y
tiene el `ErrorDocument` de la 404— **no está en este repositorio** y no se toca
desde aquí.
