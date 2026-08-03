# MEDICIÓN — destiny.mx

Qué se mide, dónde vive cada cosa y qué falta configurar fuera del código.

---

## Arquitectura

Tres archivos, en este orden obligatorio dentro del `<head>` de cada página:

```
1. assets/consent.js       Modo de consentimiento de Google. Va PRIMERO.
2. assets/attribution.js   Guarda gclid / wbraid / gbraid / UTM en cookies.
3. assets/tags.js          GA4 + Google Ads + Pixel de Meta + Contentsquare. IDs en un solo lugar.
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

## Google Ads — `AW-18368975159`

Instalado el **2026-08-03** en `assets/tags.js`, junto a GA4 y el Pixel. No hay
un segundo `gtag.js`: la librería que ya carga GA4 sirve para las dos cuentas y
Ads entra con una línea más de `config`. Así es como Google documenta convivir
GA4 + Ads en la misma página.

```js
gtag('config', 'AW-18368975159', { allow_enhanced_conversions: true });
```

Qué queda cubierto de entrada, sin tocar nada más:

- **Vista de página / remarketing.** Todas las páginas de destiny.mx y del blog
  alimentan las listas de audiencia de Ads desde el primer día.
- **Enlazador de conversiones.** El `config` de `AW-` guarda solo el `gclid` en
  la cookie `_gcl_aw`, que es lo que después empata el clic con la conversión.
- **Consentimiento.** `consent.js` va antes y declara `ad_storage`,
  `ad_user_data` y `ad_personalization`; si el visitante rechaza, Ads pasa a
  medición sin cookies (modelado) en vez de escribirlas igual.
- **Conversiones mejoradas.** La bandera queda activada aquí, pero **solo sirve
  cuando además** (a) se active la función en la interfaz de Ads y (b) Zoho
  devuelva el correo en la URL de gracias — ver la sección siguiente.

### Lo que NO hace todavía

La etiqueta base **no registra ninguna conversión**. Cada conversión necesita su
propio rótulo (`AW-18368975159/xxxxxxxx`), que solo existe una vez creada en la
interfaz de Google Ads. Orden a seguir:

1. En Ads, crear las acciones de conversión — como mínimo `generate_lead`
   (principal) y `click_whatsapp` / `click_telefono` (secundarias).
2. Copiar el rótulo de cada una.
3. Dispararlas **desde GTM**, con activadores de *Evento personalizado* sobre
   los eventos que `tracking.js` ya deja en el `dataLayer`. No hace falta tocar
   el código: los 7 eventos ya están ahí con toda la atribución.

Se hace desde GTM y no en código a propósito: los rótulos cambian cada vez que
se crea o rehace una conversión, y no vale la pena redesplegar el sitio por eso.
La etiqueta **base** sí vive en código para que el remarketing no dependa de que
alguien publique el contenedor.

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

### El formulario autoalojado de Cipriani

`/forms/CIPRIANIFORM27052026V1/` es una exportación cruda de Zoho Forms subida
al servidor (con su `.zip` al lado). Entró a la cadena de medición el
**2026-08-03**: antes tenía un GA4 y un Contentsquare pegados a mano y ni
consentimiento ni atribución. Se le quitaron los dos y ahora lleva los cinco
scripts como cualquier otra página, con `data-desarrollo="cipriani-residences"`.

**Pero sigue sin poder generar una conversión**, y no por las etiquetas:

- No es un iframe. Postea directo a `forms.zohopublic.com`, así que
  `zoho-embed.js` —que solo enriquece `iframe.zf-embed` y los contenedores
  `.zoho-form`— **no hace nada aquí**. La atribución no viaja.
- Su campo oculto `zf_redirect_url` está **vacío**. Al enviar, Zoho muestra su
  propia pantalla de gracias en lugar de `/gracias-sesion.html`, así que
  `generate_lead` no se dispara nunca.
- Ninguna página del sitio enlaza a esa URL y no está en el sitemap.

Para que sirviera de verdad harían falta dos cosas: poner
`zf_redirect_url` a `https://destiny.mx/gracias-sesion.html?form_type=sesion&d=cipriani-residences`
y rellenar por JS los campos ocultos con lo que guarda `DestinyAttr`. Antes de
invertir ahí conviene decidir si esa página se usa o se borra.

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

Después de crear los campos en Zoho falta el último tramo, y **el CRM es
HubSpot, no Zoho CRM**. La cadena real es:

```
sitio → iframe de Zoho Forms → webhook → Make → HubSpot
```

Escenarios de Make involucrados (equipo 2342480):

| Escenario | id | Formulario | Destino |
|---|---|---|---|
| Integración Zoho Forms — HOME-TOFU | 5514580 | HOMETOFUFORM27062026V1 | HubSpot |
| Integration Zoho Forms - Cipriani | 5223878 | CIPRIANIFORM27052026V1 | HubSpot |
| Integración Zoho Forms — Mercedes-Benz | 5485213 | MERCEDESBENZFORM24062026V1 | HubSpot |
| Integración Zoho Forms — Newsletter | 5775240 | FORMNEWSLETTER26072026V1 | ActiveCampaign |

Hacen falta las tres cosas, en este orden: campos ocultos en Zoho → propiedades
personalizadas en HubSpot → mapeo en el módulo `upsertAContact` de Make. Si se
hace solo la primera, la atribución muere un paso más adelante.

**Estado verificado el 2026-07-30:** los formularios de Zoho tienen **cero**
campos de atribución y HubSpot **ninguna** propiedad personalizada para
recibirla. El puente está roto de Zoho en adelante.

Dos cosas más que hay que corregir al hacerlo:

- El escenario de Cipriani manda `hs_analytics_source` **fijo en
  `"PAID_SOCIAL"`** para todos los leads. Debe salir del `utm_source` real.
- El escenario HOME-TOFU (5514580) lleva **0 ejecuciones** desde el 28-jun-2026.
  Su webhook (`hookId` 2511344) está activo y sin cola, así que o no ha entrado
  un solo lead por el formulario principal, o el formulario de Zoho no lo está
  llamando. **Verificar esto antes de crear nada.**

Verificación rápida del tramo que SÍ funciona: abre
`destiny.mx/agenda?gclid=prueba123`, inspecciona el iframe y confirma que su
`src` contiene `gclid=prueba123`. Verificado el 2026-07-30: llegan los 9
parámetros.

---

## Google Tag Manager — contenedor `GTM-KW8TPGGG`

Instalado el 2026-07-30 en **modo convivencia**: GTM carga en paralelo con GA4
y el Pixel, que siguen disparándose desde `tags.js`. Se eligió así para no
dejar el sitio sin medición ni un día mientras se arma el contenedor.

### Dónde está instalado

Las tres superficies cargan **la misma cadena**, y ningún ID vive fuera de
`assets/tags.js`:

| Superficie | Cómo carga la cadena | Archivo a editar |
|---|---|---|
| destiny.mx (23 HTML) | `/assets/…` | ya inyectado por `patch-head.py` |
| blog.destiny.mx — artículos y demás rutas WP | `https://destiny.mx/assets/…` | `theme-v3/header.php` |
| blog.destiny.mx**/** (home) | `https://destiny.mx/assets/…` | `public_html/blog-home.html` |

El home del blog es un archivo suelto en `public_html`, **no** el
`blog-home.html` del repo. El `.htaccess` lo sirve solo cuando el host es
`blog.destiny.mx` y la ruta es `/`. Editar el del repo no cambia nada ahí.

**El `?v=` del blog se sube a mano, por SSH.** No lo toca ningún deploy. El
2026-08-03 estaba en `v=2` mientras el repo iba en `v=3`: se había quedado atrás
dos versiones sin que nadie lo notara. Se subió a `v=4` en los tres archivos
—`theme-v3/header.php`, `theme-v3/footer.php` y el `blog-home.html` suelto—
con respaldos `.bak-claude-20260803` al lado. Ruta real en el servidor:
`~/domains/destiny.mx/public_html/`. Cada vez que suba `V` en `patch-head.py`
hay que repetir esto o el blog se queda con la copia vieja hasta que expire
(el servidor manda `max-age=604800`, siete días).

En el blog los tres scripts van **después** del `<meta charset>`: si se ponen
antes, el bloque de comentarios empuja el charset fuera del primer kilobyte y
WordPress renderiza los acentos rotos.

**El blog también mide eventos** desde el 2026-07-30, no solo vistas. Lleva
`tracking.js` al final del `<body>` (en `theme-v3/footer.php` y en el
`blog-home.html` suelto) y `data-desarrollo="blog"` en el `<body>`, para que sus
eventos no se confundan con los de destiny.mx. Importaba porque un solo artículo
tiene 6 enlaces a `#agenda` y 2 a WhatsApp, que son el trabajo entero del blog y
no se estaban midiendo. Verificado: el evento sale con `desarrollo: "blog"` y
arrastra el `gclid` y los UTM guardados en destiny.mx.

Como `blog.destiny.mx` es subdominio de `destiny.mx`, GA4 mantiene la sesión al
saltar entre los dos sin configurar medición entre dominios, y las cookies de
`attribution.js` (dominio `.destiny.mx`) cruzan solas.

**El plugin `PixelYourSite` quedó desactivado** el 2026-07-30. Disparaba un
Pixel distinto (`928885525615857`) y además forzaba Consent Mode con todo en
`granted`, pisando a `consent.js`. Si se reactiva habrá pixel doble y el
consentimiento dejará de respetarse.

### La regla que no se puede romper

Mientras `GTM_ADMINISTRA_ETIQUETAS` sea `false` en `tags.js`, **no crear dentro
de GTM ninguna etiqueta de GA4, del Pixel de Meta ni la etiqueta base de Google
Ads** (la de tipo *Etiqueta de Google* con el `AW-`). Si se crean, cada visita y
cada evento se cuentan dos veces. GTM es hoy el contenedor para lo que **no**
sale por código.

Con Google Ads la distinción importa: la **etiqueta base** ya está en el código
—no se toca— pero las **etiquetas de conversión** (las que llevan rótulo) sí van
en GTM. No se duplican entre sí: una declara la cuenta, la otra registra el
hecho.

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

### El consentimiento no cruza al blog (verificado 2026-08-03)

La decisión se guarda en `localStorage`, que es **por origen**. Las cookies de
`attribution.js` sí cruzan, porque llevan `domain=.destiny.mx`; `localStorage`
no tiene ese mecanismo. Consecuencia comprobada en el navegador: quien acepta o
rechaza en `destiny.mx` vuelve a ver el banner al entrar a `blog.destiny.mx`, y
—peor— quien **rechazó** en destiny.mx arranca en el blog con los valores por
defecto de México, que son `granted`. Su rechazo no se respeta ahí.

Importa más ahora que Google Ads está instalado: `ad_storage` y
`ad_personalization` dependen justamente de esa decisión.

Se arregla guardando la elección en una cookie con `domain=.destiny.mx` en vez
de (o además de) `localStorage`, leyendo la cookie primero. Es un cambio de unas
diez líneas en `consent.js`, en `read()` y `write()`.

Para volver a ver el banner en pruebas:

```js
localStorage.removeItem('destiny_consent_v1'); location.reload();
```

---

## Lo que este código NO resuelve

- Los campos ocultos en Zoho Forms, las propiedades en HubSpot y el mapeo en
  Make — ver la sección del puente de atribución. Es el pendiente de más valor:
  hoy ningún contacto del CRM sabe de dónde vino.
- Publicar etiquetas dentro del contenedor de GTM (el contenedor ya está
  instalado y cargando, pero va vacío a propósito — ver la sección de GTM).
- Crear las acciones de conversión en Google Ads y disparar sus rótulos desde
  GTM. La etiqueta base (`AW-18368975159`) ya está puesta, pero sola no registra
  ni una conversión.
- Recuperar el acceso administrativo a la propiedad GA4 `G-J8KK325F2B`.

---

## Search Console (revisado 2026-07-30)

**Ya estaba verificado**, y mejor de lo que parecía: es una propiedad de
**dominio** (`sc-domain:destiny.mx`) verificada por DNS. Por eso no hay ningún
`<meta name="google-site-verification">` en el HTML y no hace falta ponerlo. Al
ser de dominio, **cubre también `blog.destiny.mx`** — no es una propiedad
aparte.

Lo que sí estaba roto eran los sitemaps: los dos enviados fallaban y Google
llevaba **0 páginas descubiertas**.

- `https://www.destiny.mx/sitemap_index.xml` — resto de la era WordPress. Da
  **404**: ni existe el subdominio `www` ni esa ruta. Sigue en la lista
  marcando error; se puede quitar desde la interfaz.
- `https://blog.destiny.mx/sitemap_index.xml` — sí responde 200, pero su última
  lectura era de **junio de 2022**. Reenviado el 2026-07-30 para forzar
  relectura.
- `https://destiny.mx/sitemap.xml` — **es el bueno** y no estaba enviado.
  Enviado el 2026-07-30, estado **Correcto** el mismo día.

Antes de reenviar conviene correr `python3 scripts/check-links.py --live`: el
2026-07-30 dio 49/49 URLs en 200 sin redirección.
