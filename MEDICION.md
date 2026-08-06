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

Cada evento sale por tres vías, con **dos nombres distintos a propósito**:

1. `dataLayer.push({event: 'dst_<nombre>'})` — es lo que consume GTM.
2. `gtag('event', '<nombre>', …)` — GA4.
3. `fbq(...)` — Pixel de Meta, con el `event_id` para deduplicar contra la CAPI.

Los dos nombres son distintos porque `gtag` también escribe en el `dataLayer`;
ver "Los eventos del dataLayer llevan prefijo `dst_`" más abajo.

| Evento | dataLayer | Cuándo | Conversión en Ads |
|---|---|---|---|
| `form_lead` | `dst_form_lead` | envío de formulario de lead, guía, club, scorecard, propiedad o zona | **Sí — 500 MXN** |
| `agenda_solicitada` | `dst_agenda_solicitada` | envío del formulario de `/agenda` | **Sí — 2000 MXN** |
| `newsletter_signup` | `dst_newsletter_signup` | envío de newsletter o radar | **Sí — 100 MXN, secundaria (pendiente)** |
| `whatsapp_click` | `dst_whatsapp_click` | clic a `wa.me` / `api.whatsapp.com` / `web.whatsapp.com` | **Sí — 500 MXN** |
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
- **Conversiones mejoradas.** La bandera queda activada aquí. El correo y el
  teléfono los pasa `forms.js` a `tracking.js` en el momento del envío, ya sin
  depender de ninguna redirección — ver la sección siguiente.

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

Para pasarlas a código hay que hacer las dos cosas **en este orden**:

1. Pausar o borrar en GTM las cuatro etiquetas `Ads · …`.
2. Recién entonces poner la constante en `true`.

Al revés queda un hueco sin conversiones. La página `/diagnostico.html` dice en
todo momento quién las está disparando, en su bloque 5.

GA4 y el Pixel de Meta **sí** salen por código siempre: GTM no los administra
(regla de convivencia en `tags.js`), y el Pixel además necesita el `event_id`
que genera `forms.js` para deduplicar contra la CAPI que manda Make.

### Los eventos del dataLayer llevan prefijo `dst_`

`tags.js` define `gtag` como un push a `window.dataLayer`. Eso significa que un
`gtag('event','form_lead',…)` **también** aterriza en el dataLayer, y GTM lo lee
como un evento más. Con el mismo nombre en las dos vías, cada activador se
cumplía dos veces:

```
índice  9 → dataLayer.push({event:'generate_lead', …})
índice 10 → gtag('event','generate_lead', {…})
```

Verificado en Tag Assistant: la etiqueta salía *Activado 2 veces* en un solo
envío. **Cada lead se habría cobrado doble en Google Ads.**

En agosto de 2026 se parcheó poniendo las etiquetas en *Una vez por página*. Eso
tapa el síntoma, pero deja la trampa puesta para la siguiente etiqueta que
alguien cree. Ahora está arreglado de raíz:

| Vía | Nombre |
|---|---|
| `dataLayer.push` para GTM | `dst_form_lead` |
| `gtag('event', …)` para GA4 | `form_lead` |

Un activador de `dst_form_lead` no puede dispararse con el push de `gtag`,
porque ese llega como `form_lead`. Comprobado en navegador: un envío deja
exactamente **un** `dst_form_lead` en el dataLayer.

Las etiquetas conservan además *Una vez por página*, por si acaso.

### Al desplegar hay que importar el contenedor nuevo

Los activadores publicados escuchan `generate_lead` y `click_whatsapp`, que ya
no se emiten. **Si se sube el sitio sin tocar GTM, las conversiones dejan de
registrarse.** El archivo listo para importar es `gtm-destiny.json`.

Cómo importarlo: *Administración → Importar contenedor →* elegir el archivo,
espacio de trabajo **existente**, y modo **Combinar → Sobrescribir etiquetas,
activadores y variables en conflicto**. Revisar la vista previa de cambios
antes de confirmar, y publicar solo después de validar con Tag Assistant.

| Etiqueta | Rótulo | Valor | Activador |
|---|---|---|---|
| Vinculador de conversiones | — | — | All Pages |
| Ads · form_lead | `D636CNu6xdwcELeigbdE` | 500 MXN | `dst_form_lead` |
| Ads · agenda_solicitada | `p8UOCOG6xdwcELeigbdE` | 2000 MXN | `dst_agenda_solicitada` |
| Ads · whatsapp_click | `eUBKCN66xdwcELeigbdE` | 500 MXN | `dst_whatsapp_click` |
| Ads · newsletter_signup | `mofbCOvqmN0cELeigbdE` | 100 MXN | `dst_newsletter_signup` |

La acción `newsletter_signup` se creó el 2026-08-06: categoría *Suscribirse*,
100 MXN, recuento *Una*.

**No se pudo marcar como secundaria.** Google deshabilita esa opción cuando el
objetivo no es predeterminado de la cuenta. En la práctica se comporta igual,
porque Ads solo la cuenta en la columna *Conversiones* de una campaña que use
explícitamente el objetivo *Suscribirse*. De ahí sale una regla operativa:

⛔ **No agregar el objetivo "Suscribirse" a las campañas de Fase 1.** Si se
agrega, el algoritmo empieza a perseguir suscripciones de 100 pesos en lugar de
inversionistas de varios millones.

Ya no hace falta separar la agenda por `form_type = "sesion"`: cada acción tiene
su propio evento.

**Lo que el archivo NO trae y hay que repuntar a mano:** la etiqueta existente
*Ads · Conversiones mejoradas* (tipo *User-provided Data Event*). Se le cambia el
activador a `dst_form_lead` y `dst_agenda_solicitada` y listo. No se incluyó en
el archivo a propósito: su tipo de etiqueta no se reproduce con seguridad en una
exportación hecha a mano, y una importación mal formada puede dañar un
contenedor que hoy funciona.

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
- **La acción `newsletter_signup` en Google Ads.** Sin ella, las suscripciones se
  miden en GA4 y en Meta pero no en Ads.
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
