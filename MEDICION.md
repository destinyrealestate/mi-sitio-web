# MEDICIÓN — destiny.mx

Qué se mide, dónde vive cada cosa y qué falta configurar fuera del código.

---

## Arquitectura

Tres archivos, en este orden obligatorio dentro del `<head>` de cada página:

```
1. assets/consent.js       Modo de consentimiento de Google. Va PRIMERO.
2. assets/attribution.js   Guarda gclid / wbraid / gbraid / UTM en cookies.
3. assets/tags.js          GA4 + Pixel de Meta + Contentsquare. IDs en un solo lugar.
```

Y al final del `<body>`:

```
assets/zoho-embed.js   Pasa la atribución a los formularios de Zoho.
assets/tracking.js     Emite los eventos de conversión.
```

Los cinco se insertan con `python3 scripts/patch-head.py`, que es idempotente:
se puede correr las veces que sea sin duplicar nada. **Si creas una página
nueva, agrégala al diccionario `PAGES` de ese script y córrelo.**

### Por qué el orden importa

`consent.js` tiene que declarar `gtag('consent', 'default', …)` **antes** de que
cargue cualquier etiqueta. Si se carga después, Google ignora el modo de
consentimiento por completo. Es la razón por la que ese bloque en el HTML lleva
el comentario "no mover".

---

## Eventos

Todos salen por tres vías a la vez, según lo que exista en la página:

1. `window.dataLayer` — es lo que consumirá GTM cuando exista el contenedor.
2. `gtag('event', …)` — para que **ya funcionen hoy** con el GA4 directo.
3. `fbq(...)` — Pixel de Meta.

Cuando se instale GTM y se retiren GA4 y el Pixel del código, `tracking.js` no
cambia: las vías 2 y 3 dejan de existir y se omiten solas.

| Evento | Cuándo | Parámetros propios | Conversión en Ads |
|---|---|---|---|
| `generate_lead` | carga de cualquier página de gracias | `form_type`, `contexto`, `value`, `currency`, `user_email`, `user_phone` | **Sí — principal** |
| `view_project` | carga de una landing de proyecto | `project_slug`, `project_name` | No (audiencia) |
| `click_whatsapp` | clic a `wa.me` / `api.whatsapp.com` / `web.whatsapp.com` | `link_url`, `link_text` | **Sí — secundaria** |
| `click_telefono` | clic a `tel:` | `phone` | **Sí — secundaria** |
| `click_email` | clic a `mailto:` | `email_to` | No |
| `file_download` | clic a `.pdf` `.xlsx` `.xls` `.zip` `.docx` `.csv` | `file_name`, `file_extension` | No (micro) |
| `scroll_90` | 90 % de la página | `percent_scrolled` | No (micro) |
| `engaged_60s` | 60 s de tiempo activo (descuenta pestaña oculta) | `engagement_time_msec` | No (micro) |
| `consent_update` | el visitante acepta o rechaza cookies | `consent_state` | No |

**Todos** llevan además, sin excepción:

- `desarrollo` — slug del proyecto o de la sección (`data-desarrollo` del `<body>`)
- `gclid`, `wbraid`, `gbraid`, `fbclid`, `msclkid` (los que existan)
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- `landing_page`, `referrer`, `first_seen`

### Depuración

En la consola del navegador:

```js
window.DESTINY_DEBUG = true;   // imprime cada evento con su carga completa
window.DestinyAttr.all();      // qué atribución tiene guardada este visitante
window.destinyTrack('prueba', {a: 1});   // dispara un evento a mano
```

---

## Conversiones mejoradas para clientes potenciales

Google Ads mejora la medición si recibe el correo del prospecto, con hash.
`tracking.js` lo expone en el `dataLayer` en un campo dedicado, **solo si Zoho
lo devuelve en la URL de redirección**:

```
/gracias-sesion.html?form_type=sesion&d=bentley-residences-miami&email=juan%40ejemplo.com
```

→ `dataLayer.push({event: 'generate_lead', user_email: 'juan@ejemplo.com', ...})`

El correo **nunca sale del navegador desde este código**: solo se deja en el
`dataLayer` para que GTM lo tome y lo mande con hash a Ads. Si Zoho no lo
devuelve, el campo simplemente no aparece y el resto del evento funciona igual.

**Pendiente en Zoho:** configurar la redirección post-envío de cada formulario
para que incluya `email` (y `d` con el slug del desarrollo) en la URL.

---

## Páginas de gracias, una por conversión

Separadas para poder distinguirlas en Google Ads. Todas con
`<meta name="robots" content="noindex, nofollow">` y con el escape de iframe.

| Página | `form_type` | De dónde llega |
|---|---|---|
| `/gracias-sesion.html` | `sesion` | `/agenda`, formulario del home, Cipriani |
| `/gracias-scorecard.html` | `scorecard` | `/scorecard` |
| `/gracias-club.html` | `club` | `/club` |
| `/gracias-newsletter.html` | `newsletter` | `/radar`, newsletter del home |
| `/gracias.html` | `sesion` | genérica, además entrega el dossier por `?d={slug}` |

### El escape de iframe

Las cinco llevan:

```js
if (window.top !== window.self) { window.top.location = window.location.href; }
```

Sin esto, cuando Zoho redirige **dentro** de su propio iframe, la página de
gracias se pinta en un recuadro de 700 px y **la conversión no se mide nunca**,
porque el evento se queda atrapado en el iframe.

---

## La atribución hacia Zoho — el eslabón que falta

`zoho-embed.js` agrega los datos de atribución al `src` del iframe de Zoho.
Eso ya funciona: se puede verificar en el HTML.

**Pero Zoho descarta lo que no tiene un campo donde guardarlo.** Hay que crear,
dentro de cada formulario en el panel de Zoho Forms, un **campo oculto** por
cada parámetro, con el nombre de enlace exacto:

```
gclid          wbraid         gbraid         fbclid        msclkid
utm_source     utm_medium     utm_campaign   utm_term      utm_content
landing_page   referrer       first_seen
desarrollo     form_type      page_url
```

Formularios a los que hay que hacerlo:

- `HOMETOFUFORM27062026V1` (agenda, club, scorecard)
- `FORMNEWSLETTER26072026V1` (radar, newsletter)
- `MERCEDESBENZFORM24062026V1`
- `CIPRIANIFORM27052026V1`

Si Zoho no permite alguno de esos nombres y le asigna otro (`SingleLine3`, por
ejemplo), **no se cambia en cada página**: se mapea en el objeto `FIELD_MAP` al
inicio de `assets/zoho-embed.js`.

Después de crear los campos en Zoho, falta el último tramo: mapearlos a campos
personalizados del prospecto en **Zoho CRM**. Sin ese paso la atribución llega
al formulario y muere ahí.

Verificación rápida de que el puente funciona: abre
`destiny.mx/agenda?gclid=prueba123`, inspecciona el iframe y confirma que su
`src` contiene `gclid=prueba123`.

---

## Google Tag Manager — contenedor `GTM-KW8TPGGG`

Instalado el 2026-07-30 en **modo convivencia**: GTM carga en paralelo con GA4
y el Pixel, que siguen disparándose desde `tags.js`. Se eligió así para no
dejar el sitio sin medición ni un día mientras se arma el contenedor.

### Dónde está instalado

| Superficie | Cómo carga | Archivo |
|---|---|---|
| destiny.mx (23 HTML) | vía `assets/tags.js` | `assets/tags.js` línea 39 |
| blog.destiny.mx — artículos y demás rutas WP | fragmento pegado en el `<head>` | `theme-v3/header.php` |
| blog.destiny.mx**/** (home) | fragmento pegado en el `<head>` | `public_html/blog-home.html` |

El home del blog es un archivo suelto en `public_html`, **no** el
`blog-home.html` del repo. El `.htaccess` lo sirve solo cuando el host es
`blog.destiny.mx` y la ruta es `/`. Por eso lleva el fragmento a mano.

Como `blog.destiny.mx` es subdominio de `destiny.mx`, GA4 mantiene la sesión al
saltar entre los dos sin configurar medición entre dominios.

### La regla que no se puede romper

Mientras `GTM_ADMINISTRA_ETIQUETAS` sea `false` en `tags.js`, **no crear dentro
de GTM ninguna etiqueta de GA4 ni del Pixel de Meta**. Si se crean, cada visita
y cada evento se cuentan dos veces. GTM es hoy el contenedor para lo *nuevo*
(Google Ads, remarketing, LinkedIn), no un segundo camino para lo que ya sale
por código.

Los 7 eventos de la tabla de arriba ya llegan al `dataLayer`, así que se pueden
consumir desde GTM con activadores de tipo *Evento personalizado* y el nombre
exacto del evento — siempre que el destino sea una plataforma que hoy **no**
esté midiendo por código.

### Para migrar de verdad a GTM algún día

1. Crear en GTM la etiqueta de configuración de GA4, la del Pixel y los
   activadores de los 7 eventos.
2. Publicar el contenedor.
3. **Recién entonces** poner `GTM_ADMINISTRA_ETIQUETAS = true` en `tags.js`.

Al revés queda un hueco sin datos. `CONTENTSQUARE_ID` se queda siempre en
código: necesita carga temprana.

**Nota sobre el `<noscript>` del contenedor:** se omite a propósito en
destiny.mx. Sin JavaScript ese sitio no muestra ni un proyecto, así que no hay
nada que medir en esa condición. En el blog **sí** se puso: es WordPress y los
artículos se leen sin JavaScript.

---

## Consentimiento

`assets/consent.js` implementa Consent Mode v2:

- **Fuera del EEE y Reino Unido (México incluido):** consentimiento otorgado por
  defecto, con banner visible que permite rechazar.
- **EEE, Reino Unido y Suiza:** denegado por defecto hasta que el visitante
  acepta, como exige la política de consentimiento de la UE de Google.
- La elección se guarda en `localStorage` bajo `destiny_consent_v1` y se
  respeta en visitas siguientes.
- Enfoque de **modo de consentimiento, no bloqueo de scripts**: las etiquetas
  cargan siempre y lo que cambia es si pueden escribir cookies. Así no se pierde
  el modelado de conversiones de Google.

Para volver a ver el banner en pruebas:

```js
localStorage.removeItem('destiny_consent_v1'); location.reload();
```

---

## Lo que este código NO resuelve

- Crear los campos ocultos en Zoho Forms y mapearlos a Zoho CRM.
- Publicar etiquetas dentro del contenedor de GTM (el contenedor ya está
  instalado y cargando, pero va vacío a propósito — ver la sección de GTM).
- Unificar los dos Pixels de Meta: destiny.mx usa `27857783360524172` y el blog
  usa `928885525615857` (este último vía el plugin PixelYourSite y el
  fragmento inline de `blog-home.html`). Son cuentas distintas: hoy la
  audiencia del blog y la del sitio no se acumulan.
- Medir el blog en GA4. `blog.destiny.mx` no carga GA4 ni Consent Mode; hoy es
  invisible en Analytics.
- Crear la cuenta de Google Ads y obtener el `AW-`.
- Recuperar el acceso administrativo a la propiedad GA4 `G-J8KK325F2B`.
- Verificar las propiedades en Search Console y volver a enviar el sitemap.
