# Landing de registro — Sesión privada con Oscar Chapa (Puerto Cancún, 8 y 9 oct 2026)

Página de una sola pantalla larga cuyo único objetivo es capturar registros
para las sesiones uno a uno de 45 minutos. Un solo CTA repetido: **apartar
lugar**. Nada compite con el formulario: el nav no tiene menú, el pie no tiene
enlaces y no hay botón flotante de WhatsApp.

## Archivos

| Archivo | Qué es |
|---|---|
| `sesion-cancun.html` | La landing. URL pública: `https://destiny.mx/sesion-cancun` |
| `gracias-cancun.html` | Página de gracias. URL: `/gracias-cancun` (noindex) |
| `assets/forms.js` | Aquí viven los campos y la variante `cancun` del formulario |

No se creó proyecto aparte ni se metió otro pixel: la página usa la misma capa
de medición del sitio (`consent.js` → `attribution.js` → `tags.js` … →
`tracking.js` → `forms.js`). Los IDs de GA4, Meta, Google Ads y GTM siguen
viviendo **solo** en `assets/tags.js`.

## El hero

De fondo va el render de Cipriani Residences (`assets/img/cipriani/hero.jpg`)
y, encima, `assets/video/cipriani-hero.mp4` en mute y en bucle: 28 segundos
recortados del film del proyecto (`assets/img/cipriani/cipriani-lifestyle.mp4`),
sin pista de audio y a 2.8 MB.

El video **solo se descarga en pantallas de 768 px para arriba**, con conexión
decente y sin ahorro de datos activado; si algo de eso falla, o el navegador
bloquea el autoplay, se queda el render y nadie se entera. Mismo criterio que
las landings de Bentley. Si se quiere otro tramo del film, se recorta así:

```
ffmpeg -ss 63 -i assets/img/cipriani/cipriani-lifestyle.mp4 -t 28 -an \
  -c:v libx264 -preset slow -crf 27 -maxrate 1100k -bufsize 2200k \
  -pix_fmt yuv420p -movflags +faststart -r 25 assets/video/cipriani-hero.mp4
```

## El formulario

Hay **dos formularios, iguales**: uno en la sección de autoridad (junto al
retrato de Oscar, que es donde llega el visitante que apenas está decidiendo)
y otro al cierre. El de arriba es el ancla `#registro` —a donde apuntan todos
los CTA— y el de abajo es `#registro-final`. Es el mismo patrón de
`preconstruccion-miami.html`. Los dos mandan el mismo payload; el motor los
monta por separado y les da ids distintos, así que no chocan.

Se dibuja con una línea de HTML; los campos no están en la página:

```html
<div data-destiny-form="agenda" data-variant="cancun"
     data-context="Sesión privada Puerto Cancún · 8 y 9 oct 2026"></div>
```

La variante `cancun` (en `assets/forms.js`) hereda del tipo `agenda` y define:

- **Campos:** nombre, WhatsApp, correo, rango de inversión (select),
  intereses (casillas, selección múltiple) y día que le acomoda (opciones).
- **Botón:** "Quiero mi lugar".
- **Gracias:** `/gracias-cancun`.
- **Evento de Meta:** `Lead` (el tipo `agenda` manda `Schedule`; se cambió
  porque así lo pide el brief de la campaña).

Los tres campos nuevos viajan dentro de `extra` en el payload que recibe Make:

```json
"extra": {
  "rango_sesion": "500 mil–1 millón",
  "intereses": "Proyectos, Financiamiento",
  "dia_sesion": "9 de octubre"
}
```

`intereses` y `dia_sesion` estrenan dos tipos de campo que el motor no tenía:
`checks` (casillas) y `radios` (opciones). Se renderizan como `<fieldset>` con
`<legend>` para que un lector de pantalla entienda que las opciones son una
sola pregunta. Su CSS está en el `<style>` de `sesion-cancun.html`; si otro
formulario los llega a usar, ese bloque se muda a `assets/styles.css`.

### Rangos de inversión

Son los del documento de la campaña:
`Menos de 300 mil USD` · `300–500 mil` · `500 mil–1 millón` · `Más de 1 millón`.

Si la propiedad equivalente de HubSpot usa otros cortes, cámbialos en
`CAMPOS.rango_sesion` dentro de `assets/forms.js` y empatan sin limpieza
manual.

## Medición

No hay nada que pegar en esta página. El envío exitoso llama a
`window.destinyTrack("agenda_solicitada", …)` y de ahí en adelante todo es lo
de siempre:

- **GTM** recibe `generate_lead` con `form_type: "sesion"` → conversión de
  Google Ads de la sesión (valor 2000).
- **Meta** recibe `Lead` con el mismo `event_id` que manda la CAPI desde Make,
  así que el evento se deduplica y no se cuenta dos veces.
- **UTMs y gclid** los captura `attribution.js` en la primera visita y viajan
  en el payload. No hay campos ocultos que mantener.

Los eventos **solo** se disparan al enviar el formulario con éxito, nunca al
cargar la página.

## Pendientes de Carlos

1. **Imagen para compartir.** Hoy usa la OG genérica del sitio
   (`/assets/img/og-default.jpg`). Una de 1200×630 propia de la sesión se ve
   mucho mejor en WhatsApp y en los reels.
2. **Propiedades en HubSpot.** Crear (o mapear en el escenario de Make) las
   tres del formulario: rango de inversión, intereses y día. Si no existen,
   el lead entra igual pero esos datos se quedan en el payload.
3. **Después del 9 de octubre.** Poner `<meta name="robots" content="noindex,
   nofollow">` en `sesion-cancun.html` y mandar la URL a la landing que la
   sustituya desde `.htaccess`. La página no se agregó al sitemap justamente
   porque muere con la fecha.
4. **Antes de mandar tráfico:** comprobar que el escenario de Make está
   ENCENDIDO. Con el escenario apagado el webhook responde 410 y ningún lead
   se guarda (ver la cabecera de `assets/forms.js`).
