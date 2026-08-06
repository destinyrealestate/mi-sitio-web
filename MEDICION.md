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

## Las conversiones de Google Ads dentro de GTM (2026-08-05)

El contenedor dejó de ir vacío. **Versión 2 publicada**: cinco etiquetas, cinco
variables de capa de datos, una de datos del usuario y tres activadores. **Nada
de esto tocó el código del sitio**: los eventos que consume ya los dejaba
`tracking.js`.

Comprobado contra el contenedor en vivo (`gtm.js?id=GTM-KW8TPGGG`), no solo
contra la interfaz: los tres rótulos viajan con sus valores (500 / 2000 / 500) y
las cuatro etiquetas de Ads llevan `once_per_load: true`.

**Dónde vive.** La cuenta de GTM es `Destiny Real Estate` (id `6368951919`,
contenedor `259896060`) y **no** está bajo `lic.carlos.cataneo@gmail.com` como
cuenta principal — es el `authuser=6` de ese navegador. Buscarlo en la cuenta
por defecto no da nada. Ojo también con que existe un contenedor gemelo
`GTM-N6ZQ256`, también llamado *Destiny Real Estate / destiny.mx*, en otra
cuenta (`authuser=5`), vacío y sin usar. El que el sitio carga es
`GTM-KW8TPGGG`. No confundirlos.

| Etiqueta | Tipo | Rótulo | Valor | Activador |
|---|---|---|---|---|
| Vinculador de conversiones | Vinculación de conversiones | — | — | All Pages |
| Ads · form_lead | Conversión de Ads | `D636CNu6xdwcELeigbdE` | 500 MXN | `generate_lead` con `form_type` ≠ `sesion` |
| Ads · agenda_solicitada | Conversión de Ads | `p8UOCOG6xdwcELeigbdE` | 2000 MXN | `generate_lead` con `form_type` = `sesion` |
| Ads · whatsapp_click | Conversión de Ads | `eUBKCN66xdwcELeigbdE` | 500 MXN | `click_whatsapp` |
| Ads · Conversiones mejoradas | User-provided Data Event | — | — | los dos de `generate_lead` |

Los nombres de evento son los que **ya existían** (`generate_lead`,
`click_whatsapp`), no `form_lead` / `whatsapp_click`. No hay ningún evento
`agenda_solicitada` en el sitio: la agenda es otro formulario de Zoho con
`form_type = "sesion"`, y es esa condición la que separa los 2000 de los 500.

Las conversiones mejoradas van en etiqueta aparte (*Google Ads User-provided
Data Event*), no en una casilla de la etiqueta de conversión: la de conversión
ya no la trae. Lee `UPD - Datos del lead`, que a su vez lee `user_email` y
`user_phone` del `dataLayer`.

### La trampa: cada evento llega DOS veces al dataLayer

`tracking.js` emite cada evento por dos vías (ver el encabezado de ese archivo):
`dataLayer.push({event: …})` **y** `gtag('event', …)`. Lo que no era evidente es
que la segunda **también termina en `window.dataLayer`**, porque `tags.js`
define `gtag` justamente como un push a ese array. GTM lee las dos y dispara la
etiqueta dos veces:

```
índice  9 → dataLayer.push({event:'generate_lead', …})
índice 10 → gtag('event','generate_lead', {…})
```

Verificado en Tag Assistant: sin corregir, `form_lead` salía *Activado 2 veces*
en un solo envío. **Cada lead se habría cobrado doble en Google Ads.**

**El arreglo:** las cuatro etiquetas de Ads llevan *Configuración avanzada →
Opciones de activación de la etiqueta* = **`Una vez por página`** (no el
`Una vez por evento` que trae de fábrica). Con eso el segundo `generate_lead`
muestra *Etiquetas activadas: Ninguna*. En `whatsapp_click` implica además que
varios clics en la misma página cuentan uno solo, que es lo que Ads quiere para
una acción de tipo cliente potencial.

**Toda etiqueta nueva que se cuelgue de un evento de `tracking.js` necesita lo
mismo.** Es la regla menos obvia de este contenedor.

### Detalle al validar

La vista previa de GTM congela el estado del contenedor en el momento en que se
abre. Después de editar una etiqueta hay que **volver a pulsar Vista previa** o
los cambios no aparecen, aunque se recargue la página.

### Pendientes que salieron de esta validación

- `/gracias-sesion` (sin `.html`) da **404**: el `.htaccess` solo tiene rutas
  limpias para `gracias-preconstruccion`, `gracias-dolares` y `gracias-guia`.
  Si alguien configura esa redirección en Zoho con la ruta limpia, la conversión
  se pierde. Hoy funciona como `/gracias-sesion.html`.
- `tracking.js` manda `currency: "USD"` y `value: 0` en `generate_lead`. Las
  etiquetas de Ads llevan el valor fijo en MXN, así que no estorba, pero los dos
  números se contradicen y conviene alinearlos.

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

- Los campos ocultos en Zoho Forms, las propiedades en HubSpot y el mapeo en
  Make — ver la sección del puente de atribución. Es el pendiente de más valor:
  hoy ningún contacto del CRM sabe de dónde vino.
- ~~Publicar etiquetas dentro del contenedor de GTM.~~ Publicadas el 2026-08-05
  como **Versión 2**, «Conversiones de Google Ads — fase 1» — ver «Las
  conversiones de Google Ads dentro de GTM».
- ~~Crear las acciones de conversión en Google Ads y disparar sus rótulos desde
  GTM.~~ Los tres rótulos ya están en el contenedor. La etiqueta base
  (`AW-18368975159`) sigue viniendo del código y no se duplica.
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
