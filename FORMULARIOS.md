# Formularios nativos

Cómo funcionan los formularios de destiny.mx y cómo agregar uno nuevo.
Reemplaza al esquema de iframes de Zoho descrito en `MEDICION.md`.

Complementa `MEDICION.md` (etiquetas y conversiones), `LANDINGS-ADS.md` (las dos
landings de Google Ads) y `UTM.md`.

---

## 1. Por qué se migró

Los cuatro formularios de Zoho —`HOMETOFUFORM27062026V1`,
`FORMNEWSLETTER26072026V1`, `CIPRIANIFORM27052026V1` y
`MERCEDESBENZFORM24062026V1`— **no tenían ni un solo campo oculto de
atribución**. Se comprobó trayendo los cuatro en vivo el 5 de agosto de 2026:
ninguno contenía `gclid`, `wbraid`, `utm_source` ni nada parecido.

`assets/zoho-embed.js` les mandaba 16 parámetros en el `src` del iframe y Zoho
los descartaba en silencio, tal como advertía el comentario de ese propio
archivo. Ningún lead llegaba con su origen.

Y había un segundo problema, más caro: al vivir el formulario en un iframe de
`forms.zohopublic.com`, el envío ocurría fuera de destiny.mx. El navegador nunca
se enteraba de que había habido una conversión, así que Google Ads y el Pixel de
Meta no podían medirla en el momento del envío.

---

## 2. Las piezas

| Archivo | Qué hace |
|---|---|
| `assets/forms.js` | El motor. Dibuja, valida, envía al webhook de Make y avisa a `tracking.js` |
| `assets/styles.css` | Bloque final `FORMULARIOS NATIVOS`. Solo lo que el sistema `.field` no tenía |
| `forms-demo.html` | Banco de pruebas con los nueve tipos juntos. `noindex`, sin enlazar |

Y lo que se retiró con la migración:

| Archivo | Qué pasó |
|---|---|
| `assets/zoho-embed.js` | Borrado |
| `/forms/CIPRIANIFORM27052026V1/` | Borrado. Exportación cruda de Zoho que nada enlazaba y que no podía convertir |
| `assets/property.js` | Deja de montar formularios. Cipriani posteaba a `htmlRecords/submit` y Mercedes incrustaba un iframe; los dos son ahora el formulario nativo de propiedad |
| `assets/data.js` | Pierde el pipeline viejo de leads (Netlify Forms + HubSpot + webhook + redirección). Dos caminos de envío compitiendo por el mismo formulario es como se pierden leads |
| `scripts/build-pages.py` · `scripts/patch-head.py` | Actualizados. Sin esto, la próxima corrida habría vuelto a escribir los iframes |

Lo que **no** hace `forms.js`: medir. No hay un solo `gtag`, `fbq` ni
`dataLayer.push` dentro. Al enviarse con éxito llama a `window.destinyTrack` y
`assets/tracking.js` decide qué sale a cada plataforma. Esa separación ya existía
en el proyecto y hay que conservarla: si un día se mueve la medición a GTM, se
toca un archivo y no diez.

---

## 3. Cómo se pone un formulario en una página

Un `div` con un atributo. Nada más.

```html
<div data-destiny-form="lead"></div>
```

Dentro de una tarjeta del sitio, con el encabezado ya escrito en el HTML:

```html
<div class="form reveal d1">
  <div class="form__head">
    <h3 class="h-3">Agenda tu sesión</h3>
    <span class="form__sub">Cupo limitado</span>
  </div>
  <p class="form__note">Sesión de claridad sin costo ni compromiso.</p>
  <div data-destiny-form="lead"></div>
  <p class="form__secure">🔒 Tus datos están seguros. Nunca los compartimos con terceros.</p>
</div>
```

O dejando que `forms.js` dibuje también el encabezado (es lo que hace la página
de propiedad, que monta su formulario por JS):

```html
<div data-destiny-form="propiedad"
     data-title="Agenda tu sesión"
     data-sub="5 lugares / mes"
     data-note="Sesión de claridad sin costo ni compromiso."></div>
```

### Atributos del contenedor

| Atributo | Para qué |
|---|---|
| `data-destiny-form` | **Obligatorio.** El tipo (ver tabla abajo) |
| `data-variant` | Variante del tipo: `preconstruccion`, `dolares` |
| `data-title` `data-sub` `data-note` | Si se pasan, dibuja también el encabezado de la tarjeta |
| `data-cta` | Texto del botón, si el del tipo no encaja |
| `data-gracias` | Página de gracias distinta a la del tipo |
| `data-extra` | Campos extra del catálogo, separados por coma: `data-extra="mensaje,ciudad"` |
| `data-context` | Texto legible que viaja a Make y a la página de gracias |
| `data-legal="off"` | Quita la leyenda del Aviso de Privacidad. **Casi nunca se usa**: la exige el aviso |

---

## 4. Los nueve tipos

| Tipo | Campos | Evento | Meta | Valor | Gracias |
|---|---|---|---|---|---|
| `lead` | nombre, correo, teléfono, país, presupuesto | `form_lead` | Lead | 500 | `/gracias.html` |
| `agenda` | nombre, correo, teléfono, país, presupuesto | `agenda_solicitada` | Schedule | 2000 | `/gracias-sesion` |
| `guia` | nombre, correo, teléfono | `form_lead` | Lead | 500 | `/gracias-guia` |
| `club` | nombre, correo, teléfono, perfil | `form_lead` | CompleteRegistration | 500 | `/gracias-club` |
| `scorecard` | nombre, correo, teléfono | `form_lead` | CompleteRegistration | 500 | `/gracias-scorecard` |
| `propiedad` | nombre, correo, teléfono, presupuesto | `form_lead` | Lead | 500 | `/gracias.html` |
| `zona` | nombre, correo, teléfono, presupuesto | `form_lead` | Lead | 500 | `/gracias.html` |
| `newsletter` | correo | `newsletter_signup` | Subscribe | 100 | `/gracias-newsletter` |
| `radar` | correo | `newsletter_signup` | Subscribe | 100 | `/gracias-newsletter` |

Y tres variantes de `lead`:

| Variante | Campos | Gracias | Por qué existe |
|---|---|---|---|
| `preconstruccion` | nombre, WhatsApp, correo, capital, cuándo invertir | `/gracias-preconstruccion` | Los calificadores que pide `LANDINGS-ADS.md` |
| `dolares` | nombre, WhatsApp, correo, capital, cuándo invertir | `/gracias-dolares` | Igual, la otra campaña |
| `patrimonio` | nombre, correo, teléfono, país, monto | `/gracias.html` | Escala de monto que arranca en $250K |

`propiedad` y `zona` resuelven solos el desarrollo y la zona: leen `?p=` o `?z=`
de la URL y buscan el nombre legible en el catálogo de `assets/data.js`. Por eso
esas dos páginas necesitan que `data.js` cargue antes que `forms.js`.

### Por qué hay dos escalas de dinero

`presupuesto` arranca en $500K y es la escala que pedía Zoho: se conserva tal
cual para no partir en dos el histórico de leads en HubSpot.

`monto` arranca en $250K. Es la que ya usaban Marca, Inversión y Artículo, que
son páginas de descubrimiento y no la ficha de un proyecto de varios millones.
Bajar ese piso al resto del sitio habría metido ruido en las páginas de
propiedad; subirlo en esas tres habría dejado fuera a un inversionista que hoy
sí cabe. Por eso son dos campos y no uno.

---

## 4bis. Dónde está cada formulario

22 formularios en 16 páginas.

| Página | Contenedor |
|---|---|
| `index.html` | `newsletter` · `lead` + `data-gracias="/gracias-sesion"` |
| `Guia.html` | `guia` |
| `agenda.html` | `agenda` |
| `club.html` | `club` |
| `radar.html` | `radar` |
| `scorecard.html` | `scorecard` |
| `invertir-en-dolares.html` | `lead` variante `dolares` (×2) |
| `preconstruccion-miami.html` | `lead` variante `preconstruccion` (×2) |
| `Propiedad.html` | `propiedad`, dentro de `#formPropiedad` |
| `Zona.html` | `zona` |
| `Marca.html` · `Inversion.html` · `Articulo.html` | `lead` variante `patrimonio` |
| `cipriani-lp1/2/3.html` | `propiedad` (×2 cada una) |

El home usa `lead` y no `agenda` porque el inventario de conversiones lo cuenta
como `form_lead` (500 MXN); `/agenda` es la que vale 2000. La página de gracias
sí es la de sesión, que es a donde llegaba antes desde Zoho.

En `Propiedad.html`, los botones "Solicitar dossier" y "Solicitar price list" no
abren otro formulario: `property.js` reusa el mismo cambiándole el encabezado,
la nota y el texto del botón, y escribiéndole `data-context`. forms.js lee ese
atributo **al enviar**, no al dibujar, así que el cambio viaja a Make y a la
página de gracias sin volver a montar nada.

---

## 5. Agregar un formulario nuevo

### Caso A — un tipo nuevo

En `assets/forms.js`, dentro de `TIPOS`:

```js
webinar: {
  campos: ["nombre", "email", "telefono"],
  evento: "form_lead", meta: "Lead", valor: 500,
  gracias: "/gracias-webinar", cta: "Apartar mi lugar"
}
```

Y en el HTML: `<div data-destiny-form="webinar"></div>`. Listo. **No se toca
ningún otro archivo.**

Después hay que darle su rama en el router de Make (por `form_type`) y su página
de gracias.

### Caso B — un campo nuevo

En `assets/forms.js`, dentro de `CAMPOS`:

```js
recamaras: {
  tipo: "select", label: "¿Cuántas recámaras buscas?",
  req: true, err: "Selecciona una opción.",
  opciones: ["1", "2", "3", "4 o más"]
}
```

Y se nombra en el tipo que lo necesite, o se enciende desde el HTML sin tocar el
JS: `data-extra="recamaras"`.

El campo viaja a Make dentro del objeto `extra` del payload. Nombre, correo,
teléfono y mensaje son los únicos que van en la raíz, porque son los que toda
rama del escenario necesita.

### Caso C — una variante

Misma idea, en `VARIANTES`. Hereda todo del tipo base y sobrescribe solo lo que
declare.

---

## 6. Lo que se manda a Make

Un `POST` con `Content-Type: application/json`:

```json
{
  "form_type": "propiedad",
  "form_variant": null,
  "form_context": null,
  "page_url": "https://destiny.mx/Propiedad.html?p=cipriani-residences",
  "page_title": "Cipriani Residences · Brickell — Destiny Real Estate",

  "nombre": "…", "email": "…", "telefono": "…", "mensaje": null,

  "desarrollo_slug": "cipriani-residences",
  "desarrollo_nombre": "Cipriani Residences",
  "zona_slug": null,
  "zona_nombre": "Brickell",

  "atribucion": {
    "gclid": "…", "wbraid": "", "gbraid": "", "fbclid": "", "msclkid": "",
    "utm_source": "…", "utm_medium": "…", "utm_campaign": "…",
    "utm_term": "", "utm_content": "",
    "landing_page": "…", "referrer": "…", "first_seen": "2026-08-05"
  },

  "ga4_client_id": "1234567890.1699999999",
  "ga4_session_id": "1754400000",
  "consent_state": "granted",

  "event_id": "1c3f…-4a2b-…",
  "submitted_at": "2026-08-05T18:42:07-06:00"
}
```

Notas que importan al construir el escenario:

- **`event_id` es lo más delicado de todo.** Es el mismo UUID que el navegador le
  pasa al Pixel de Meta. Make **tiene** que reenviarlo tal cual en el evento de
  la CAPI: es lo único que le dice a Meta que el evento del navegador y el del
  servidor son el mismo. Si Make genera uno nuevo, cada lead se cuenta dos veces.
- **`ga4_client_id` y `ga4_session_id` pueden venir en `null`.** Pasa cuando el
  visitante rechazó cookies o su navegador las bloquea. Se manda `null` a
  propósito: un identificador inventado ensucia el informe de GA4 con usuarios
  que no existen.
- **`atribucion` puede venir con campos vacíos.** Tráfico directo, orgánico o
  referido no trae `gclid`. No es un error.
- **`consent_state`** vale `"granted"`, `"denied"` o `null` (el visitante todavía
  no decide). Sirve para saber a quién sí se le puede mandar publicidad
  personalizada.

---

## 7. Antibots

Sin CAPTCHA, a propósito: un reCAPTCHA cuesta conversión y además mete a Google
en un formulario que ya de por sí es sensible.

Dos filtros:

1. **Honeypot.** Un campo `website` fuera de la pantalla, sin orden de tabulación
   y con `aria-hidden`. Un humano no lo ve ni lo enfoca; un bot que rellena todo
   lo que encuentra sí.
2. **Tiempo mínimo de llenado.** Menos de 3 segundos entre que se dibuja el
   formulario y se envía = descartado.

Los dos son **silenciosos**: al bot se le responde exactamente igual que a un
humano —botón "Enviando…" y redirección a la página de gracias— para que no pueda
deducir qué lo delató. Lo que no pasa es el envío al webhook ni la conversión.

---

## 8. Lo que hay que tener en la cabeza

### El webhook todavía es un placeholder

En `assets/forms.js`, arriba del todo:

```js
var MAKE_WEBHOOK_URL = "MAKE_WEBHOOK_URL";
```

Mientras diga eso, el formulario valida, mide y redirige, pero **el lead no se
envía a ningún lado** y deja un aviso en la consola. Es a propósito: así se puede
revisar el diseño y la medición antes de que exista el escenario de Make. Es lo
único que hay que cambiar cuando el Prompt 3 entregue la URL.

### En local no se mide nada

`localhost`, `127.0.0.1` y `file://` no envían al webhook ni disparan
conversiones. En su lugar dejan debajo del formulario el JSON exacto que
recibiría Make. Sin esa guarda, cada prueba de diseño ensuciaría Google Ads y
Meta con leads que no existen.

### La conversión se dispara al enviar, no al llegar a gracias

Resuelto. Hubo un momento en que las páginas de gracias disparaban la conversión
al cargar (`tracking.js` con `data-page-type="gracias"`) **y además** `forms.js`
la disparaba al enviar: cada lead se contaba dos veces, y una tercera por cada
recarga de la página de gracias.

Hoy solo dispara `forms.js`, en el envío. Es mejor por una razón de fondo: no
depende de que el visitante complete la redirección. Si se le cae la red justo
después de enviar, el lead ya está registrado y medido. Las páginas de gracias
conservan un `gracias_vista` sin valor y sin conversión, para poder medir la
caída entre envío y llegada.

### Por qué la redirección tarda un instante

`forms.js` no salta a la página de gracias en cuanto el webhook responde: le pasa
un callback a `tracking.js` y espera a que GTM avise que terminó de disparar sus
etiquetas. `location.href` corta las peticiones en vuelo, así que redirigir de
inmediato mataba la conversión a medio camino en las conexiones lentas.

La espera tiene dos topes: `eventTimeout: 1200` de GTM, y un `setTimeout` de
1500 ms por si GTM ni siquiera cargó —bloqueador de anuncios, red caída— y por lo
tanto nunca va a llamar a nadie. El visitante nunca se queda atrapado por un
archivo de medición. Mientras espera, el botón sigue en estado *enviando*.

### La etiqueta de `newsletter_signup` no existe todavía

Falta crearla en Google Ads (categoría Suscribirse, 100 MXN, recuento Una, y
marcada como **secundaria** para que no ensucie la optimización de campañas). El
tipo ya manda el evento; lo que falta es el rótulo del lado de Ads.

### El teléfono se valida, no se normaliza

`forms.js` acepta de 10 a 15 dígitos y manda lo que el visitante escribió.
Normalizar a E.164 para las conversiones mejoradas es trabajo del Prompt 2 en
`tracking.js`, y de Make para la CAPI. Aquí no, porque el dato crudo también
sirve para llamarle a la persona.
