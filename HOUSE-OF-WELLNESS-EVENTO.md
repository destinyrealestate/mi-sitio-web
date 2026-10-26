# Landing del evento — Presentación privada de House of Wellness (CDMX, 18 nov 2026)

Página para confirmar asistencia a la presentación presencial de House of
Wellness (Brickell). Es una réplica de la de Beach House (`BEACH-HOUSE-EVENTO.md`):
mismo diseño, mismos scripts, mismo formulario y las mismas tres variantes. Solo
cambian el texto, las imágenes y la variante del formulario. Construida desde
"Instrucciones para Claude Code · 3 landing pages de House of Wellness".

Un solo CTA en toda la página, **"Confirmar mi lugar"**, que baja al formulario.
Sin menú, sin enlaces al sitio, sin botón flotante de WhatsApp.

## Archivos

| Archivo | Qué es |
|---|---|
| `house-of-wellness-presentacion.html` | La landing (LP1). URL: `https://destiny.mx/house-of-wellness-presentacion` |
| `house-of-wellness-presentacion-lp2.html` | Variante A/B: el formulario dentro del hero y otra vez en el bloque 7 |
| `house-of-wellness-presentacion-lp3.html` | Variante A/B: un solo formulario, al cierre |
| `gracias-house-of-wellness.html` | Gracias: "Agregar al calendario" (.ics) + WhatsApp. URL: `/gracias-house-of-wellness` (noindex) |
| `assets/ics/house-of-wellness-presentacion.ics` | Evento de calendario: 18-nov-2026, 10:00–12:00 hora CDMX, aviso 2 h antes |
| `assets/forms.js` (v17) | Variante `houseofwellness`: mismos campos que `beachhouse` |
| `assets/img/houseofwellness/evento-hero.jpg` | Hero nuevo: la azotea al atardecer (`HoW_Exterior_PoolView_Sunset`, recortada a 3:2) |

La galería usa renders que ya estaban en `assets/img/houseofwellness/` (los de la
ficha `/proyectos/house-of-wellness`): `rooftop-pool`, `lobby`, `gym`,
`residence-b1` y `kitchen`.

## Las tres variantes

| URL | `data-lp` | Dónde está el formulario |
|---|---|---|
| `/house-of-wellness-presentacion` | 1 | En el bloque 7, después de los detalles. Hero con el video de Oscar (escritorio) |
| `/house-of-wellness-presentacion-lp2` | 2 | Dentro del hero, sin scroll, y otra vez en el bloque 7 |
| `/house-of-wellness-presentacion-lp3` | 3 | Una sola vez, al cierre |

LP2 y LP3 van **noindex,follow** con canónica a la LP1 y fuera del sitemap. La LP1
tampoco está en el sitemap porque muere con la fecha.

El `form_context` llega como `House of Wellness Evento · LP1` / `LP2` / `LP3`.

## El formulario

```html
<div data-destiny-form="lead" data-variant="houseofwellness"
     data-context="House of Wellness Evento · LP1"></div>
```

Nombre, WhatsApp con lada, correo y cuántas personas asisten (`extra.asistentes`).
Tipo `lead`: `generate_lead` en GTM y `Lead` en Meta, igual que Beach House.
`desarrollo_slug` llega como `house-of-wellness`. El botón lleva a
`/gracias-house-of-wellness`.

## Imágenes que se descartaron

- **Vistas reales del piso 31 al atardecer:** la del oeste (la del sol) tiene en
  primer plano el edificio Magnus Brickell con su lona "Now Leasing" y teléfono,
  y dos grúas. Las demás son skyline sin atardecer.
- **`the underline.jpg`:** es un collage con el texto "THE UNDERLINE" encima.
- No hizo falta sacar nada del PDF: la carpeta de renders del kit viene limpia.

## Datos que se asumieron

- **Hora:** "a partir de las 10:00 a. m." (Carlos, 2026-10-25). El .ics pone
  10:00–12:00 como Beach House; cambiar `DTEND` si dura otra cosa.
- **Sede:** "Ciudad de México · la dirección exacta llega por WhatsApp".
- **Cupo:** "limitado", sin número. "Sala chica, con pocos lugares" se queda en
  la cita de Oscar (Carlos lo confirmó).

## Pendientes fuera del sitio

1. **Make (escenario 5871285):** variable `how_evento` (`form_variant =
   "houseofwellness"`) con el mismo patrón que `bh_evento`: origen "Web House of
   Wellness Evento", `dst_propiedad` "House of Wellness", asunto propio y rama de
   confirmación al registrado (18 de noviembre, con copia a camile@destiny.mx).
2. **Meta:** conversión personalizada "Confirmación evento House of Wellness"
   (Lead + URL contiene `gracias-house-of-wellness`).
3. **Comprobar que el escenario de Make está encendido** antes de mandar tráfico.
4. **Después del 18 de noviembre:** noindex en la LP1 y mandar las tres URLs a
   `/proyectos/house-of-wellness` desde `.htaccess`.
