# MEDICIÓN — destiny.mx

Qué se mide, dónde vive cada cosa y qué falta configurar fuera del código.

---

## Arquitectura

Tres archivos, en este orden obligatorio dentro del `<head>` de cada página:

```
1. assets/consent.js       Modo de consentimiento de Google. Va PRIMERO.
2. assets/attribution.js   Guarda gclid / wbraid / gbraid / UTM en cookies.
3. assets/tags.js          GA4 + Google Ads + Pixel de Meta + Pixel de OpenAI + Contentsquare. IDs en un solo lugar.
```

Y al final del `<body>`:

```
assets/tracking.js     Emite los eventos de conversión.
assets/forms.js        Dibuja y envía los formularios. Solo en las páginas que tienen uno.
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

Cada evento sale por cuatro vías, con **dos nombres distintos a propósito**:

1. `dataLayer.push({event: …})` — es lo que consume GTM.
2. `gtag('event', '<nombre>', …)` — GA4.
3. `fbq(...)` — Pixel de Meta, con el `event_id` para deduplicar contra la CAPI.
4. `oaiq('measure', …)` — Pixel de OpenAI, con el mismo `event_id`.

Los dos nombres son distintos porque `gtag` también escribe en el `dataLayer`;
ver "Por qué el nombre del dataLayer nunca es el de GA4" más abajo.

Los tres eventos que el contenedor escucha van con el nombre que él espera
(`generate_lead`, `click_whatsapp`); el resto lleva prefijo `dst_` para no
chocar nunca con un nombre de GA4.

| Evento | dataLayer | Cuándo | Conversión en Ads |
|---|---|---|---|
| `form_lead` | `generate_lead` (+ `form_type` ≠ `sesion`) | envío de formulario de lead, guía, club, scorecard, propiedad o zona | **Sí — 500 MXN** |
| `agenda_solicitada` | `generate_lead` (+ `form_type` = `sesion`) | envío del formulario de `/agenda` | **Sí — 2000 MXN** |
| `newsletter_signup` | `dst_newsletter_signup` | envío de newsletter o radar | No — la acción existe en Ads (100 MXN) pero **no hay etiqueta que la dispare** |
| `whatsapp_click` | `click_whatsapp` | clic a `wa.me` / `api.whatsapp.com` / `web.whatsapp.com` | **Sí — 500 MXN** |
| `gracias_vista` | `dst_gracias_vista` | carga de una página de gracias | No — solo mide la caída entre envío y llegada |
| `view_project` | `dst_view_project` | carga de una landing de proyecto | No (audiencia) |
| `click_telefono` | `dst_click_telefono` | clic a `tel:` | No |
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

## Pixel de OpenAI (ChatGPT Ads) — `LZf9xnoYjgDpBLbXzJm8Ck`

Instalado el 2026-08-10. Base en `assets/tags.js`, eventos en `assets/tracking.js`,
igual que el Pixel de Meta. **No va por GTM**: no hay plantilla oficial, y meterlo
como HTML personalizado costaría la guarda de consentimiento.

### Tres cosas que no funcionan como Meta

**1 · El consentimiento tiene API propia, y se declara ANTES del init.**
El SDK asume "concedido" mientras nadie diga lo contrario, así que
`oaiq("consent", false)` tiene que salir antes de `oaiq("init", …)` o el
visitante que rechazó ya se midió. `consent.js` vuelve a llamarlo cuando el
visitante cambia de opinión desde el banner, para no depender de una recarga.

**2 · La vista de página no es automática.** `fbq("init")` manda el PageView
solo; `oaiq("init")` no manda nada. Por eso `tags.js` cierra con un
`oaiq("measure", "page_viewed", …)` explícito. Si se borra esa línea, el pixel
queda instalado y sin medir una sola visita.

**3 · El vocabulario de eventos es cerrado.** Un nombre inventado no se mide:
o es uno de los estándar, o va como evento `custom` con `custom_event_name`.
Los nombres estándar se agrupan por "forma" de datos, y la forma tiene que
coincidir con el evento:

| Forma | Eventos | Campos |
|---|---|---|
| `contents` | `page_viewed`, `contents_viewed`, `items_added`, `checkout_started`, `order_created` | `amount`, `currency`, `contents[]` |
| `customer_action` | `lead_created`, `registration_completed`, `appointment_scheduled` | `amount`, `currency` |
| `plan_enrollment` | `subscription_created`, `trial_started` | `plan_id`, `amount`, `currency` |

### Qué mandamos

El mapa vive en la constante `OPENAI` de `tracking.js`:

| Evento nuestro | Evento de OpenAI |
|---|---|
| `form_lead` | `lead_created` |
| `whatsapp_click` | `lead_created` |
| `click_telefono` | `lead_created` |
| `agenda_solicitada` | `appointment_scheduled` |
| `newsletter_signup` | `registration_completed` |

La conversión configurada en el Ads Manager de OpenAI es `lead_created`; las
otras dos se mandan para tener la foto completa. WhatsApp y teléfono entran
como `lead_created` porque en este sitio son contacto directo y OpenAI no tiene
un equivalente al `Contact` de Meta.

El valor va en `amount` + `currency` **en MXN**, igual que en Ads y en Meta.
El `event_id` viaja en el cuarto argumento (`{ event_id }`), listo para
deduplicar el día que Make mande también por la API de conversiones.

### Lo que falta

- **Datos de identidad.** `oaiq("init", { user: { email_sha256, external_id_sha256,
  country, city, zip_code } })` mejora el emparejamiento, igual que las
  conversiones mejoradas de Ads. Requiere hashear con SHA-256 en el navegador
  (`crypto.subtle.digest`, que es asíncrono) — no está puesto.
- **API de conversiones.** El `event_id` ya sale; falta el lado de Make.

---

## Google Ads — `AW-18368975159`

Instalado el **2026-08-03** en `assets/tags.js` con una línea de `config`.
**Desde el 2026-08-11 ya no está ahí:** la etiqueta base la carga el contenedor
de GTM, que trae su propia Etiqueta de Google, y tenerla en los dos lados la
hacía cargar dos veces por página. La constante `GOOGLE_ADS_ID` sigue en
`tags.js` como referencia para `tracking.js` y `diagnostico.html`, pero no
configura nada.

Qué queda cubierto, sin tocar nada más:

- **Vista de página / remarketing.** Todas las páginas de destiny.mx alimentan
  las listas de audiencia de Ads. (El blog es WordPress y lleva su propia
  instalación.)
- **Enlazador de conversiones.** Es una etiqueta del contenedor, disparándose en
  todas las páginas: guarda el `gclid` en la cookie `_gcl_aw`, que es lo que
  después empata el clic con la conversión. Por separado, `attribution.js` guarda
  el `gclid` en su propia cookie de 90 días y lo manda en cada lead, para las
  conversiones offline de la fase 2.
- **Consentimiento.** `consent.js` va antes de todo y declara `ad_storage`,
  `ad_user_data` y `ad_personalization`; si el visitante rechaza, Ads pasa a
  medición sin cookies (modelado) en vez de escribirlas igual.
- **Conversiones mejoradas.** Las arma la etiqueta *User-provided Data* del
  contenedor, leyendo `user_email` y `user_phone` del dataLayer. El correo y el
  teléfono los pasa `forms.js` a `tracking.js` en el momento del envío, ya
  normalizados y sin depender de ninguna redirección — ver la sección siguiente.

### Los rótulos viven en dos lugares

Los tres rótulos existentes están **en GTM** (que es quien dispara hoy) y
**también** en la constante `ETIQUETAS` de `tracking.js`, lista para el día que
se pasen a código. Si se crea o rehace una acción en Ads, hay que actualizar los
dos sitios o quedarán desalineados.

Los cuatro rótulos ya existen y están en los dos sitios:

| Acción | Rótulo | Valor |
|---|---|---|
| `form_lead` | `D636CNu6xdwcELeigbdE` | 500 MXN |
| `whatsapp_click` | `eUBKCN66xdwcELeigbdE` | 500 MXN |
| `agenda_solicitada` | `p8UOCOG6xdwcELeigbdE` | 2000 MXN |
| `newsletter_signup` | `mofbCOvqmN0cELeigbdE` | 100 MXN |

---

## Conversiones mejoradas: de dónde sale el correo

Antes esto dependía de que **Zoho** devolviera el correo en la URL de
redirección, algo que nunca se llegó a configurar. Ya no: el formulario es
nativo, así que `forms.js` le pasa el correo y el teléfono a `tracking.js` en el
momento del envío, sin que pasen por la URL en ningún momento.

`tracking.js` los normaliza y los deja en el `dataLayer` en `user_email` y
`user_phone`. La etiqueta *Ads · Conversiones mejoradas* de GTM los lee de ahí.
**El correo nunca sale del navegador desde este código**: quien lo manda a
Google, con hash, es gtag.

Ver el detalle de la normalización más abajo.

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

Se puso cuando el formulario vivía en un iframe de Zoho: al redirigir dentro del
recuadro, la página de gracias se pintaba en 700 px y la conversión no se medía
nunca. Desde el 2026-08-05 no hay iframes, pero la línea se queda: cuesta nada y
sigue cubriendo el caso de que alguien incruste la página de gracias desde fuera.

---

## Los formularios de Zoho — retirados el 2026-08-05

Aquí vivían dos secciones largas: una sobre el formulario autoalojado de
Cipriani y otra sobre los 16 campos ocultos que había que crear en el panel de
Zoho Forms para que la atribución sobreviviera. **Las dos quedaron sin objeto:
Zoho se eliminó por completo del sitio.**

Lo que se comprobó antes de borrarlo, trayendo los cuatro formularios en vivo:
**ninguno tenía un solo campo oculto de atribución**. `zoho-embed.js` llevaba
años mandando 16 parámetros en el `src` del iframe y Zoho los descartaba en
silencio. Ni un lead llegó nunca con su `gclid`. El eslabón no estaba roto de
Zoho en adelante: estaba roto *en* Zoho.

Y había un segundo problema, más caro: al vivir el formulario en un iframe de
otro dominio, el envío ocurría fuera de destiny.mx y el navegador no podía
disparar la conversión en el momento del envío.

Hoy los formularios son nativos. Ver **`FORMULARIOS.md`** para el motor, los
nueve tipos y el JSON que se manda. Lo que queda de aquella cadena:

| Qué era | Qué es ahora |
|---|---|
| 4 formularios en el panel de Zoho | `TIPOS` en `assets/forms.js` |
| 16 campos ocultos por formulario | El objeto `atribucion` del payload |
| `zoho-embed.js` | `forms.js` |
| `/forms/CIPRIANIFORM27052026V1/` | Borrado. Nada lo enlazaba y no podía convertir |
| 4 escenarios de Make, uno por formulario | 1 escenario con router por `form_type` (Prompt 3) |

Los cuatro escenarios viejos de Make (5514580 HOME-TOFU, 5223878 Cipriani,
5485213 Mercedes-Benz, 5775240 Newsletter) siguen existiendo en el equipo
2342480 y **hay que apagarlos** cuando el escenario nuevo esté vivo. Dos cosas
que se sabían de ellos y conviene no repetir en el nuevo:

- El de Cipriani mandaba `hs_analytics_source` **fijo en `"PAID_SOCIAL"`** para
  todos los leads. Debe salir del `utm_source` real.
- El de HOME-TOFU llevaba **0 ejecuciones** desde el 28-jun-2026, con su webhook
  activo y sin cola. Encaja con lo demás: el formulario principal no estaba
  llamando a su webhook.

HubSpot sigue sin propiedades personalizadas para la atribución. Eso no lo
resuelve la migración: lo crea el escenario de Make del Prompt 3.

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

## Las conversiones de Google Ads y GTM

### Quién las dispara: GTM, no el código

Solo puede ser uno de los dos. Si GTM y `tracking.js` disparan la misma
conversión, cada lead se cuenta **dos veces** y el costo por lead que reporta
Ads sale a la mitad del real.

Hoy las dispara **GTM**. Por eso `tracking.js` arranca con:

```js
var CONVERSIONES_POR_CODIGO = false;
```

Para pasarlas a código hay que hacer las tres cosas **en este orden**:

1. Pausar o borrar en GTM las etiquetas `Ads · …`.
2. Devolver a `tags.js` el `gtag("config", GOOGLE_ADS_ID, …)` que se quitó el
   2026-08-11 (ver abajo). Sin la etiqueta base configurada, un
   `gtag("event","conversion",{send_to:"AW-…/rótulo"})` no llega a ninguna parte.
3. Recién entonces poner la constante en `true`.

En otro orden queda un hueco sin conversiones o un doble conteo. La página
`/diagnostico.html` dice en todo momento quién las está disparando, en su
bloque 5.

### La etiqueta base de Ads vive solo en GTM

Del 2026-08-03 al 2026-08-11 la Etiqueta de Google `AW-18368975159` cargó **dos
veces en cada página**: una por `gtag("config", …)` en `tags.js` y otra por la
Etiqueta de Google que trae el contenedor. No duplicaba conversiones —esas son
eventos aparte— pero sí las señales de remarketing y la vista de página de Ads.

El `config` se quitó de `tags.js`. La constante `GOOGLE_ADS_ID` sigue ahí porque
la leen `tracking.js` y `diagnostico.html`: **que el ID exista no significa que
se configure ahí.**

GA4, el Pixel de Meta, el de OpenAI y Contentsquare **sí** salen por código
siempre: GTM no los administra (regla de convivencia en `tags.js`), y el Pixel
de Meta además necesita el `event_id` que genera `forms.js` para deduplicar
contra la CAPI que manda Make.

### La redirección espera a que la conversión salga

`forms.js` medía y redirigía en la misma línea. Como GTM evalúa sus etiquetas de
forma asíncrona, `location.href` cortaba la petición de la conversión a medio
camino en las conexiones lentas.

Ahora el push lleva `eventCallback` y `eventTimeout: 1200`, y la redirección a la
página de gracias espera a que GTM avise. Hay además un `setTimeout` de 1500 ms
por si GTM ni siquiera cargó —bloqueador de anuncios, red caída— y por lo tanto
nunca va a llamar a nadie: el visitante no se queda atrapado por un archivo de
medición.

Los clics de WhatsApp no necesitan esa espera: **todos** los enlaces del sitio
son `api.whatsapp.com` con `target="_blank"`, así que la página no se descarga.
El día que alguien ponga uno sin `target="_blank"`, ese clic se pierde.

### Por qué el nombre del dataLayer nunca es el de GA4

`tags.js` define `gtag` como un push a `window.dataLayer`. Eso significa que un
`gtag('event','generate_lead',…)` **también** aterriza en el dataLayer, y GTM lo
lee como un evento más. Con el mismo nombre en las dos vías, cada activador se
cumplía dos veces:

```
índice  9 → dataLayer.push({event:'generate_lead', …})
índice 10 → gtag('event','generate_lead', {…})
```

Verificado en Tag Assistant: la etiqueta salía *Activado 2 veces* en un solo
envío. **Cada lead se habría cobrado doble en Google Ads.**

La regla que evita eso es simple: **el nombre que va al dataLayer y el que va a
GA4 nunca son iguales.**

| Evento | `dataLayer.push` para GTM | `gtag('event', …)` para GA4 |
|---|---|---|
| lead normal | `generate_lead` | `form_lead` |
| sesión de claridad | `generate_lead` + `form_type: 'sesion'` | `agenda_solicitada` |
| clic de WhatsApp | `click_whatsapp` | `whatsapp_click` |
| todo lo demás | `dst_<nombre>` | `<nombre>` |

La tabla vive en `tracking.js`, en la constante `GTM_EVENTO`, y es un **contrato
con el contenedor**: cambiar una línea sin cambiar el activador de GTM apaga esa
conversión en silencio.

Los eventos que GTM no escucha conservan el prefijo `dst_` justamente para no
poder chocar nunca. Al agregar un evento nuevo, solo se le pone nombre limpio si
el contenedor lo escucha.

#### La semana sin conversiones (2026-08-05 → 2026-08-11)

Entre esas dos fechas **todos** los eventos salieron con prefijo `dst_`,
incluidos los tres que el contenedor escucha. El contenedor esperaba
`generate_lead`; el sitio emitía `dst_form_lead`. Nadie escuchaba a nadie y
**Google Ads no registró ni una sola conversión en toda la semana.** El plan era
importar `gtm-destiny.json` para reapuntar los activadores, y nunca se importó.

Al revisar el rendimiento de Ads de esos días, hay que descartar el periodo: las
conversiones no es que hayan bajado, es que no se midieron.

> `gtm-destiny.json` quedó obsoleto: propone activadores `dst_form_lead` que ya
> no se emiten. **No importarlo.** Se conserva solo como registro histórico.

### La sesión de claridad se distingue por `form_type`

Los dos leads viajan como `generate_lead`, así que lo único que separa la sesión
—y sus 2000 MXN— del lead de 500 es `form_type`:

| Etiqueta | Rótulo | Valor | Se dispara con |
|---|---|---|---|
| Vinculador de conversiones | — | — | `gtm.js` (All Pages) |
| Etiqueta de Google `AW-18368975159` | — | — | inicialización |
| Ads · form_lead | `D636CNu6xdwcELeigbdE` | 500 MXN | `generate_lead` **sin** `form_type = sesion` |
| Ads · agenda_solicitada | `p8UOCOG6xdwcELeigbdE` | 2000 MXN | `generate_lead` **con** `form_type = sesion` |
| Ads · whatsapp_click | `eUBKCN66xdwcELeigbdE` | 500 MXN | `click_whatsapp` |
| Ads · Conversiones mejoradas | — | — | los dos `generate_lead` |

`forms.js` no manda `sesion`: su catálogo de tipos llama `agenda` a ese
formulario, y ese nombre también viaja a Make, a HubSpot y a las páginas de
gracias. Renombrarlo allá por un detalle de medición rompería el historial de
leads, así que **`tracking.js` traduce `agenda` → `sesion` solo para el push del
dataLayer** (constante `GTM_FORM_TYPE`) y conserva el valor original en
`form_tipo`.

Cuidado con una trampa del dataLayer: una variable **conserva su valor entre
pushes de la misma página**. Si un `generate_lead` llegara sin `form_type`, GTM
leería el de la vez anterior y podría cobrar una sesión de 2000 por un lead de
500. Por eso `tracking.js` escribe `form_type` siempre, aunque quien llame no lo
mande.

#### El newsletter no dispara nada

La acción `newsletter_signup` (`mofbCOvqmN0cELeigbdE`) se creó en Ads el
2026-08-06 —categoría *Suscribirse*, 100 MXN, recuento *Una*— pero **no existe
ninguna etiqueta en GTM que la dispare**, así que hoy no se cuenta en ningún
lado. El evento sale como `dst_newsletter_signup`, listo para el día que se cree
esa etiqueta.

No se mapeó a `generate_lead` a propósito: contaría como lead de 500, inflaría
el volumen con suscriptores de correo y le enseñaría al algoritmo a perseguir
newsletters en lugar de inversionistas.

**No se pudo marcar como secundaria.** Google deshabilita esa opción cuando el
objetivo no es predeterminado de la cuenta. En la práctica se comporta igual,
porque Ads solo la cuenta en la columna *Conversiones* de una campaña que use
explícitamente el objetivo *Suscribirse*. De ahí sale una regla operativa:

⛔ **No agregar el objetivo "Suscribirse" a las campañas de Fase 1.** Si se
agrega, el algoritmo empieza a perseguir suscripciones de 100 pesos en lugar de
inversionistas de varios millones.

### Una pendiente de higiene en el contenedor

Las tres etiquetas de conversión están en **Una vez por carga de página**
(`once_per_load`). Era el parche del 2026-08-05 contra el doble disparo. Ahora
que el doble disparo está resuelto de raíz por los nombres, esa opción solo
puede restar: si un visitante envía dos formularios distintos en la misma página
sin recargar, el segundo no se cuenta.

En la práctica casi no ocurre —cada envío redirige a su página de gracias— pero
conviene cambiarlas a **Ilimitado** la próxima vez que se toque el contenedor.

### Dónde vive el contenedor

Cuenta `Destiny Real Estate` (id `6368951919`, contenedor `259896060`). **No**
está bajo `lic.carlos.cataneo@gmail.com` como cuenta principal — es el
`authuser=6` de ese navegador. Buscarlo en la cuenta por defecto no da nada. Ojo
también con el contenedor gemelo `GTM-N6ZQ256`, en `authuser=5`, vacío y sin
usar. El que el sitio carga es `GTM-KW8TPGGG`.

### Detalle al validar

La vista previa de GTM congela el estado del contenedor en el momento en que se
abre. Después de editar una etiqueta hay que **volver a pulsar Vista previa** o
los cambios no aparecen, aunque se recargue la página.

---

## Conversiones mejoradas: qué se manda

`tracking.js` normaliza y **no hashea**: gtag hashea del lado del cliente. Si se
mandara sin normalizar, el hash no coincidiría con el que Google tiene y la
conversión mejorada no emparejaría con nadie.

- **Correo:** sin espacios y en minúsculas.
- **Teléfono:** E.164. El mercado principal es México, así que 10 dígitos sin
  lada se asumen mexicanos (`+52`). Los 11 dígitos que empiezan en 1 se asumen de
  Estados Unidos (`+1`), que en un sitio de Miami es el caso real; el prefijo
  mexicano heredado aparece como 13 dígitos (`521…`) y ese sí se limpia.

Comprobado: `5611659009`, `56 1165 9009`, `+52 56 1165 9009`, `5215611659009`,
`525611659009` y `(56) 1165-9009` dan todos `+525611659009`. `13055551234` y
`+1 305 555 1234` dan `+13055551234`.

---

## Las páginas de gracias ya no disparan la conversión

Antes, cualquier página con `data-page-type="gracias"` emitía `generate_lead` al
cargar. Tenía sentido cuando el formulario era un iframe de Zoho: el envío
ocurría en otro dominio y la única señal que llegaba al navegador era el
aterrizaje en la página de gracias.

Desde que los formularios son nativos, **`forms.js` dispara la conversión en el
momento del envío**. Dejar además el disparo al cargar contaría cada lead dos
veces, y una tercera cada vez que alguien recargara la página de gracias o
volviera a ella desde el historial.

Disparar al enviar es mejor por otra razón: no depende de que el visitante
complete la redirección. Si se le cae la red justo después de enviar, el lead ya
está registrado y medido.

Lo que sí queda es `gracias_vista`, sin valor y sin conversión, para poder medir
la caída entre envío y llegada.

---

## Atribución: primer contacto y último contacto

`attribution.js` guarda tres capas:

| Capa | Qué es | Cookie |
|---|---|---|
| Planas, una por clave | El último valor conocido de cada parámetro | `gclid`, `utm_source`, … |
| Primer contacto | Se escribe una vez y no se toca nunca más | `dst_ft` (JSON) |
| Último contacto | Se reescribe con cada campaña nueva | `dst_lt` (JSON) |

El anuncio que **descubre** al inversionista casi nunca es el que **cierra** la
conversión tres semanas después. Con una sola capa, esa primera campaña
desaparecía del registro y su presupuesto parecía no producir nada.

Comprobado en navegador: entrando por Google Ads (`gclid` + campaña
`preconstruccion`) y volviendo después por un anuncio de Meta (`fbclid` +
campaña `retargeting`), el primer contacto conserva Google y el último registra
Meta. Las cookies planas conservan los dos click IDs.

Se capturan además `ttclid` (TikTok) y `li_fat_id` (LinkedIn), que todavía no se
usan: el día que se encienda uno de esos canales habrá histórico en vez de
arrancar de cero.

Vigencia: **90 días**, que es la ventana de conversión de Google Ads. Guardar más
tiempo produce atribuciones que Ads ya no acepta.

`DestinyAttr.payload()` devuelve el objeto completo, con `first_touch` y
`last_touch` dentro. Es lo que manda `forms.js` al webhook.

---

## La página de diagnóstico

`/diagnostico.html` — `noindex`, sin enlazar. Responde sin adivinar:

- qué click IDs y UTM se capturaron, y el primer y último contacto completos
- si Consent Mode declaró los cuatro parámetros, y si está permitiendo o bloqueando
- el `ga4_client_id` y el `ga4_session_id` que viajan al webhook
- **quién** está disparando las conversiones de Ads
- qué eventos se dispararon en esa página, con su valor, su `event_id` y qué le
  pasó a cada uno en Ads, en Meta y en GA4

Trae además la lista de pasos de prueba manual: entrar con `?gclid=PRUEBA123`,
qué mirar en Tag Assistant y en el Depurador de Meta, y cómo cruzar el
`event_id` contra la ejecución de Make.

A diferencia de `forms-demo.html`, esta página **sí** carga `tags.js`: sin él no
se puede comprobar que `gtag` y `fbq` existan de verdad. El precio es una visita
extra en GA4 y en el Pixel cada vez que se abre.

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

### El consentimiento cruza al blog (arreglado 2026-08-03)

Hasta ese día la decisión vivía solo en `localStorage`, que es **por origen**.
Las cookies de `attribution.js` sí cruzaban, porque llevan `domain=.destiny.mx`;
`localStorage` no tiene ese mecanismo. Comprobado en el navegador: quien aceptaba
o rechazaba en `destiny.mx` volvía a ver el banner en `blog.destiny.mx` y —lo
serio— quien **rechazaba** arrancaba en el blog con los valores por defecto de
México, que son `granted`. Su rechazo no se respetaba. Dejó de ser cosmético en
cuanto se instaló Google Ads: `ad_storage` y `ad_personalization` dependen justo
de esa decisión.

Ahora la elección se guarda en una **cookie `destiny_consent_v1` con
`domain=.destiny.mx`**, 180 días, y `localStorage` queda como respaldo:

- Al leer manda la cookie. Si no hay cookie pero sí `localStorage` —alguien que
  decidió antes del cambio— se migra en silencio y se escribe la cookie.
- Al escribir se escriben las dos, por si el navegador rechaza la cookie.
- Solo se aceptan los valores `granted` y `denied`; cualquier otra cosa se
  trata como "sin decisión" y vuelve a preguntar.
- 180 días porque es una decisión del visitante, no un dato de campaña. Queda
  debajo de los 13 meses de la práctica europea.

Para volver a ver el banner en pruebas hay que borrar **las dos**:

```js
localStorage.removeItem('destiny_consent_v1');
document.cookie = 'destiny_consent_v1=;max-age=0;path=/;domain=.destiny.mx';
location.reload();
```

Borrar solo el `localStorage` ya no sirve de nada: la cookie lo repone.

---

## Lo que este código NO resuelve

- **Las propiedades de atribución en HubSpot y el escenario de Make.** Es el
  pendiente de más valor: el navegador ya captura y manda todo, pero mientras
  `MAKE_WEBHOOK_URL` siga siendo un placeholder en `assets/forms.js`, el lead no
  llega a ningún CRM. Ver `FORMULARIOS.md`.
- **La etiqueta de `newsletter_signup` en GTM.** La acción ya existe en Ads
  (100 MXN, *Suscribirse*), pero nada la dispara: hoy las suscripciones se miden
  en GA4 y en Meta, no en Ads. El evento `dst_newsletter_signup` ya está en el
  dataLayer esperando.
- **Pasar las tres etiquetas de conversión a *Ilimitado*.** Siguen en *Una vez
  por carga de página*, que era el parche contra el doble disparo del 2026-08-05
  y ya no hace falta.
- ~~Publicar etiquetas dentro del contenedor de GTM.~~ Publicadas el 2026-08-05
  (Versión 2) y rehechas el 2026-08-11 (Versión 3).
- ~~Crear las acciones de conversión en Google Ads y disparar sus rótulos desde
  GTM.~~ Los tres rótulos están en el contenedor, junto con la etiqueta base
  `AW-18368975159`, que desde el 2026-08-11 **ya no** sale también del código.
- ~~Emitir los nombres de evento que el contenedor escucha.~~ Corregido el
  2026-08-11: `generate_lead` y `click_whatsapp`. Durante la semana anterior el
  sitio emitía `dst_*` y **Ads no registró ninguna conversión**.
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
