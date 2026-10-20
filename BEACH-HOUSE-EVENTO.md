# Landing del evento — Presentación privada de Beach House (CDMX, 10 nov 2026)

Página para confirmar asistencia a la presentación presencial de Beach House by
Turnberry. Público tibio (registrados TOFU-MOFU, interacción con anuncios, 50% de
reels), solo CDMX. La pauta BOFU arranca el **3 de noviembre**. Construida desde
el "Brief · Landing pages del evento Beach House".

Un solo CTA en toda la página, **"Confirmar mi lugar"**: nav, hero, formulario,
cierre y botón fijo en móvil. Sin menú, sin enlaces al sitio, sin botón flotante
de WhatsApp.

## Archivos

| Archivo | Qué es |
|---|---|
| `beach-house-presentacion.html` | La landing (LP1). URL: `https://destiny.mx/beach-house-presentacion` |
| `beach-house-presentacion-lp2.html` | Variante A/B: el formulario dentro del hero y otra vez en el bloque 7 |
| `beach-house-presentacion-lp3.html` | Variante A/B: un solo formulario, al cierre |
| `gracias-beach-house.html` | Gracias: "Agregar al calendario" (.ics) + WhatsApp. URL: `/gracias-beach-house` (noindex) |
| `assets/ics/beach-house-presentacion.ics` | Evento de calendario: 10-nov-2026, 10:00–12:00 hora CDMX, aviso 2 h antes |
| `assets/forms.js` | Variante `beachhouse` y el campo `whatsapp_pais` (selector de país) |
| `assets/img/beachhouse/` | Renders (los mismos de la ficha `/proyectos/beach-house-by-turnberry`) |

## Las tres variantes

Mismo contenido y mismo copy (los 9 bloques del brief). Solo cambia **dónde cae el
formulario**, igual que en las landings de Cancún, Bentley y Frida:

| URL | `data-lp` | Dónde está el formulario |
|---|---|---|
| `/beach-house-presentacion` | 1 | En el bloque 7, después de los detalles del evento (orden del brief) |
| `/beach-house-presentacion-lp2` | 2 | Dentro del hero, sin scroll, y otra vez en el bloque 7 |
| `/beach-house-presentacion-lp3` | 3 | Una sola vez, al cierre: la página se lee entera antes de pedir nada |

LP2 y LP3 van **noindex,follow** con canónica a la LP1 y fuera del sitemap. La LP1
tampoco está en el sitemap porque muere con la fecha.

Para saber de qué variante vino cada lead: el `form_context` llega como
`Beach House Evento · LP1` / `LP2` / `LP3`, además del `page_url`.

## El formulario

```html
<div data-destiny-form="lead" data-variant="beachhouse"
     data-context="Beach House Evento · LP1"></div>
```

- **Campos:** nombre completo, WhatsApp con selector de país (+52 por defecto;
  México exige exactamente 10 dígitos y los demás países de 6 a 12) y correo.
- **Teléfono:** viaja en `telefono` ya en formato internacional (`+525512345678`);
  el país del contacto, en `extra.pais_telefono` (`"México"`).
- **Tipo `lead`:** dispara `form_lead` → GTM `generate_lead` con `form_type: "lead"`
  y Meta `Lead` con el mismo `event_id` que la CAPI de Make.
- **Botón:** "Confirmar mi lugar" → `/gracias-beach-house`.
- `desarrollo_slug` llega como `beach-house-by-turnberry` (sale del `data-desarrollo`
  del `<body>`). `desarrollo_nombre` llega en null porque la landing no carga
  data.js, igual que la de Cancún.

**No se pidió el número de asistentes** (1 o 2) que trae el brief: Carlos indicó que
de acompañantes no se dice nada, y preguntar "¿cuántos van?" ya lo dice. Si se
decide pedirlo, se agrega un campo `radios` en `CAMPOS` y se nombra en
`VARIANTES.beachhouse.campos`.

## Página de gracias

"Tu lugar está apartado", resumen (fecha, hora, sede) y dos botones:

- **Agregar al calendario** → el .ics. `tracking.js` lo cuenta como `file_download`
  con `file_extension: "ics"` (se sumó `ics` a la lista de extensiones).
- **Escribir por WhatsApp** → mensaje precargado "Hola, ya confirmé mi lugar en la
  presentación de Beach House". Cuenta como `whatsapp_click`, que en Ads y Meta
  **es conversión** (como en toda la web y en gracias-cancun). Si no se quiere
  contar dos veces a quien ya confirmó, hay que excluir esta página en GTM.

El video opcional de Oscar (15 s) no está: no hay material.

## Datos que faltan o que se asumieron

- **Sede:** la página dice "Ciudad de México · la dirección exacta llega por
  WhatsApp", como pide el brief. El .ics tiene la misma leyenda en `LOCATION`.
- **Hora de fin:** el brief solo dice "a partir de las 10 am". El .ics pone
  **10:00–12:00**; cambiar `DTEND` si dura otra cosa (está en UTC: 18:00Z = 12:00 CDMX).
- **Cupo:** "limitado", sin número.
- **Imagen para compartir:** se usa el render de la torre (`hero.jpg`, 1600×1066), no
  una 1200×630 hecha a la medida.

## Pendientes fuera del sitio (brief §7)

1. **Make (escenario 5871285) — HECHO el 2026-10-19.** Sin router: una variable
   `bh_evento` (`form_variant = "beachhouse"`) en el módulo 2 y campos condicionales.
   Cuando es Beach House: HubSpot `origen` = "Web Beach House Evento",
   `dst_propiedad` = "Beach House by Turnberry", la nota empieza con
   "Formulario: Beach House Evento" (el origen UTM sigue dentro de la nota) y el
   correo de aviso lleva el asunto "Prospecto web Beach House Evento — [nombre]".
   Los demás formularios salen igual que antes. La nota y el correo suman, para
   todos, el país del WhatsApp y el `form_context`. Probado en vivo con un lead real
   (contacto 256385788291 en HubSpot, dueña Camile).

   **Correo de confirmación al registrado (2026-10-19):** después del aviso interno
   hay un router con dos ramas: el PDF de guía/propiedad (sin cambios) y, solo si
   `bh_evento = "si"`, el correo "Tu lugar está apartado — Presentación de Beach
   House, 10 de noviembre" con fecha, hora, lugar, botón al .ics y enlace a WhatsApp.
   Va con copia a camile@destiny.mx. Sale de carlos.cataneo@destiny.mx (la conexión de Outlook del escenario), así que
   las respuestas llegan ahí. El router hace falta porque en un flujo lineal un
   filtro que no pasa corta todo lo que sigue. Las demás landings no mandan correo
   al registrado (decisión de Carlos).
2. **Meta:** crear la conversión personalizada "Confirmación evento Beach House"
   (evento Lead + URL contiene `gracias-beach-house`, o `form_variant`).
3. **Lead en Meta:** la prueba del 2026-10-19 se hizo con los píxeles bloqueados;
   falta ver un Lead real en el Administrador de eventos (con el primer lead de la pauta
   o con una prueba desde un navegador normal).
4. **Comprobar que el escenario de Make está ENCENDIDO** antes de mandar tráfico
   (apagado responde 410 y no se guarda nada).
5. **Después del 10 de noviembre:** noindex en la LP1 y mandar las tres URLs a
   `/proyectos/beach-house-by-turnberry` desde `.htaccess`.
