# Briefs para Claude CoWork

Cinco encargos para cerrar lo que falta. Cada bloque se pega tal cual.

**Reescrito el 2026-08-06.** La versión anterior tenía briefs para ActiveCampaign y
para construir el escenario de Make: las dos cosas ya están hechas y se cayeron.

---

## Dónde está todo — el estado real

Rama `formularios-nativos`, 10 commits por delante de `main`. **`main` no se ha
tocado**, así que destiny.mx en vivo sigue con Zoho: es a propósito.

| Pieza | Estado |
|---|---|
| Formularios nativos, 22 en 16 páginas | ✅ hecho y probado |
| Capa de medición (atribución, conversiones, diagnóstico) | ✅ hecha y probada |
| Lista ActiveCampaign `Leads Web 2026` | ✅ creada · **id 7** |
| 12 tags de ActiveCampaign | ✅ creados · **ids 11–22** |
| Webhook de Make | ✅ **2662269** |
| Escenario de Make **5871285** | ⚠️ armado, **INACTIVO**, sin Meta CAPI ni `dst_*` mapeadas |
| 18 propiedades `dst_*` en HubSpot | ✅ creadas y verificadas el 2026-08-06 |
| Módulo de Meta CAPI | ❌ Brief A · falta el token |
| Contenedor de GTM importado | ❌ Brief C |
| Acción `newsletter_signup` en Google Ads | ✅ creada · rótulo ya pegado en el repo |
| Despliegue | ❌ Brief D |
| PDF del Scorecard | ❌ Brief E |

### Identificadores que vas a necesitar

```
Make · equipo            2342480
  webhook                https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2
  escenario              5871285   (INACTIVO)
  conexión HubSpot       9067982   · la de 41 scopes es 9833579
  conexión ActiveCampaign 9068082
  conexión Microsoft      9069490
  conexión Meta           9833591

HubSpot · portal        8199998   · owner Camile Demboski = 176436235
ActiveCampaign          lista 7 (Leads Web 2026) · lista 6 (Newsletter Web)
Meta · Pixel = Dataset  27857783360524172

GTM   GTM-KW8TPGGG · cuenta 6368951919 · contenedor 259896060
Ads   AW-18368975159 · cuenta 721-558-8421
```

⚠️ **GTM y Google Ads NO están bajo `lic.carlos.cataneo@gmail.com`.** Viven en el
`authuser=6` de ese navegador, que es `it.destiny.real.estate@gmail.com`. Buscarlos
en la cuenta por defecto no da nada. Ojo también con el contenedor gemelo
`GTM-N6ZQ256`, vacío y sin usar: el que carga el sitio es `GTM-KW8TPGGG`.

### El orden

```
Brief A (terminar Make · necesita el token)  ─┐
Brief C (importar GTM, sin publicar)         ─┴─→  Brief D (desplegar y publicar juntos)

Brief E (PDF del Scorecard)  ──── en paralelo, cuando quieras
```

---

## Brief A · Terminar y encender el escenario de Make

Ya no depende del Brief B. Sigue necesitando el token de la CAPI de Meta.

```
En Make, equipo 2342480, hay un escenario llamado
"WEB · Formularios destiny.mx → HubSpot + ActiveCampaign + aviso", id 5871285.
Está armado, es válido y está INACTIVO. Le faltan tres cosas.

Antes de tocarlo, lee MAKE-ESCENARIO.md y FORMULARIOS.md del repositorio: el
primero explica el mapeo y por qué se construyó sin router, el segundo trae el JSON
exacto que manda el navegador.

CÓMO ESTÁ HOY
  1 Webhook (gateway:CustomWebHook, hook 2662269)
  2 util:SetVariables      correo limpio, nombre/apellido, origen legible,
                           fuente de HubSpot, lista AC, tag AC, calidad, URL del PDF
  3 hubspotcrm:upsertAContact          filtro: trae correo con @
  4 activecampaign:upsertContact2024
  5 activecampaign:UpdateContactListStatus
  6 microsoft-email  aviso a carlos.cataneo@ y camile@
  7 microsoft-email  entrega del PDF     filtro: hay algo que entregar
Del 3 al 7, cada módulo lleva builtin:Resume en su ruta de error.

FALTA 1 — MAPEAR LAS PROPIEDADES dst_* EN EL MÓDULO 3
Hoy el módulo de HubSpot solo escribe en las propiedades que ya existían (origen,
estatus_art, hablame_de_ti_quiero_conocerte_mas, hs_analytics_source). Las 18
propiedades dst_* YA EXISTEN, creadas y verificadas el 2026-08-06, así que
mapearlas ya no tiene riesgo:

  dst_gclid            ← {{1.atribucion.gclid}}
  dst_wbraid           ← {{1.atribucion.wbraid}}
  dst_gbraid           ← {{1.atribucion.gbraid}}
  dst_msclkid          ← {{1.atribucion.msclkid}}
  dst_ttclid           ← {{1.atribucion.ttclid}}
  dst_li_fat_id        ← {{1.atribucion.li_fat_id}}
  dst_utm_source       ← {{1.atribucion.utm_source}}      (y los otros cuatro utm)
  dst_form_type        ← {{1.form_type}}
  dst_form_variant     ← {{1.form_variant}}
  dst_pagina_origen    ← {{1.page_url}}
  dst_propiedad        ← {{1.desarrollo_nombre}}
  dst_zona             ← {{1.zona_nombre}}
  dst_primer_contacto  ← {{toString(1.atribucion.first_touch)}}
  dst_calidad_lead     ← {{2.calidad}}

Las tres enumeraciones aceptan SOLO estos valores, y el SetVariables del módulo 2
ya produce los correctos:
  dst_form_type     lead · agenda · guia · club · scorecard · propiedad · zona ·
                    newsletter · radar
  dst_form_variant  preconstruccion · dolares · patrimonio
  dst_calidad_lead  ok · correo_desechable · telefono_invalido · patron_spam
Un valor fuera de esa lista hace que HubSpot rechace el contacto entero.

Si necesitas llamadas crudas a la API de HubSpot: el módulo hubspotcrm:MakeAPICall
exige el encabezado Content-Type: application/json explícito, y el body como TEXTO
JSON, no como objeto (si le pasas objeto manda "[object Object]" y HubSpot responde
400). Usa la conexión 9833579, la de 41 permisos.

FALTA 2 — EL MÓDULO DE META CAPI
Va entre el 5 y el 6. Lee esto entero antes de escribirlo:

Los cuatro escenarios de Meta que ya existen en la cuenta usan
facebook-conversion-leads:CreateALead. Eso es la CAPI para CRM: manda etapas de
lead identificadas por lead_id y NO admite event_id ni eventos web. NO SIRVE AQUÍ,
por mucho que parezca lo mismo. Si copias ese módulo, la deduplicación contra el
Pixel nunca va a funcionar y el fallo es silencioso: solo se nota semanas después
viendo leads duplicados en el Administrador de Eventos.

Lo que hace falta es la CAPI web, con el módulo HTTP de Make:

  POST https://graph.facebook.com/v21.0/27857783360524172/events

  {
    "data": [{
      "event_name": "<Lead | CompleteRegistration | Schedule | Subscribe>",
      "event_time": <unix del submitted_at>,
      "event_id": "{{1.event_id}}",          ← TAL CUAL, no generes uno nuevo
      "event_source_url": "{{1.page_url}}",
      "action_source": "website",
      "user_data": {
        "em": ["<sha256 del correo en minúsculas y sin espacios>"],
        "ph": ["<sha256 del teléfono en E.164 SIN el +>"],
        "fbc": "fb.1.<timestamp>.<fbclid>",
        "client_user_agent": "..."
      }
    }],
    "access_token": "<variable de escenario, NO en el blueprint>"
  }

El event_name YA está calculado: el SetVariables del módulo 2 expone
{{2.meta_event}} con el mapeo correcto (Lead para lead/guia/propiedad/zona,
CompleteRegistration para club/scorecard, Schedule para agenda, Subscribe para
newsletter/radar). Solo tienes que leerlo.

El event_id es lo único que le dice a Meta que el evento del Pixel y el del
servidor son el mismo. Normaliza ANTES de hashear, no después.

Ponle también su builtin:Resume: si Meta truena, el lead ya está en HubSpot y el
aviso a Carlos tiene que salir igual.

FALTA 3 — ANTIDUPLICADOS
Data Store con clave correo+form_type y TTL de 5 minutos, entre el módulo 2 y el 3.
Si la clave existe, corta la ejecución.

PRUEBA DE PUNTA A PUNTA
Cuando esté completo: activa el escenario, manda este POST y revisa los siete
módulos en el historial de ejecuciones.

  curl -X POST https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2 \
    -H "Content-Type: application/json" \
    -d '{"form_type":"propiedad","nombre":"PRUEBA CoWork","email":"prueba@destiny.mx",
         "telefono":"+525611659009","desarrollo_slug":"cipriani-residences",
         "desarrollo_nombre":"Cipriani Residences","zona_nombre":"Brickell",
         "page_url":"https://destiny.mx/Propiedad.html?p=cipriani-residences",
         "event_id":"aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
         "submitted_at":"2026-08-06T11:00:00-06:00",
         "atribucion":{"gclid":"PRUEBA123","utm_source":"google","utm_medium":"cpc",
                       "utm_campaign":"preconstruccion","utm_term":"departamentos miami"},
         "extra":{"presupuesto":"$2M - $5M USD"}}'

Verifica: el contacto en HubSpot con su origen legible y su gclid; el contacto en
ActiveCampaign en la lista 7; el correo a Carlos con el origen legible y NO el
gclid crudo; el correo de entrega con la URL del dossier de Cipriani; y el evento
en el Depurador de Meta con ese event_id.

SEGUNDA PRUEBA — el correo de entrega
Manda un segundo POST con form_type "newsletter" y solo correo:

  curl -X POST https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2 \
    -H "Content-Type: application/json" \
    -d '{"form_type":"newsletter","email":"prueba2@destiny.mx"}'

Confirma que el módulo 7 NO se dispara: newsletter no entrega nada, y un correo con
un enlace roto es peor que ningún correo. El filtro ya exige que pdf_url contenga
".pdf" precisamente por esto — la primera versión usaba "exist", que es ambiguo con
las cadenas vacías. Si aun así sale el correo, revisa el filtro.

Comprueba también que el lead SÍ llegó a HubSpot y a la lista 6 de ActiveCampaign:
lo que no debe salir es la entrega, no el lead.

Después borra los dos contactos de prueba de HubSpot y de ActiveCampaign.

DÉJALO ACTIVO. A diferencia de la primera vez, ahora sí tiene que quedar encendido:
el sitio se despliega después y un escenario apagado rechaza los leads con HTTP 410
(comprobado). El Brief D depende de esto.

Cuando termines, avísame y dime qué escenarios viejos de Zoho hay que apagar:
son 5514580, 5223878, 5485213 y 5775240.
```

---

## Brief B · ~~Las 18 propiedades de HubSpot~~ — HECHO

Creadas y verificadas por API el 2026-08-06, en el grupo `dst_atribucion`
("Atribución web (Destiny)"), con las tres enumeraciones y sus opciones literales.
No hay nada que hacer aquí.

Un dato que salió de crearlas y sirve para el Brief A: el módulo
`hubspotcrm:MakeAPICall` de Make falla si no le mandas el encabezado
`Content-Type: application/json` explícito, y si le pasas el cuerpo como objeto en
vez de como texto JSON lo serializa como `[object Object]` y HubSpot responde 400.
Usa la conexión `9833579`, la de 41 permisos; la `9067982` puede no traer los
scopes de esquemas.

---

## Brief C · GTM

La parte de Google Ads ya está hecha y el rótulo ya está pegado en el repositorio.
Solo queda importar el contenedor.

```
⛔ NO PUBLIQUES EL CONTENEDOR. Lee el punto 2 antes de tocar nada.

1 · IMPORTAR EL CONTENEDOR
Contenedor GTM-KW8TPGGG (cuenta 6368951919, contenedor 259896060). Está en el
authuser=6 de Chrome, que es it.destiny.real.estate@gmail.com, NO en
lic.carlos.cataneo@gmail.com. Ojo con el gemelo GTM-N6ZQ256, vacío y sin uso.

  Administración › Importar contenedor
  Archivo:            gtm-destiny.json del repositorio
  Espacio de trabajo: EXISTENTE
  Modo:               Combinar › Sobrescribir etiquetas, activadores y variables
                      en conflicto

El archivo ya trae los cuatro rótulos, incluido newsletter_signup
(mofbCOvqmN0cELeigbdE), y esa etiqueta ya viene despausada. Revisa la vista previa
de cambios antes de confirmar.

Después, a mano: la etiqueta que YA existe "Ads · Conversiones mejoradas" (tipo
User-provided Data Event) necesita que le cambies el activador a dst_form_lead y
dst_agenda_solicitada. No viene en el archivo a propósito: su tipo no se reproduce
con seguridad en una exportación hecha a mano, y una importación mal formada puede
dañar un contenedor que hoy funciona.

POR QUÉ CAMBIAN LOS NOMBRES DE LOS ACTIVADORES
Los publicados escuchan generate_lead y click_whatsapp. El sitio nuevo emite
dst_form_lead, dst_agenda_solicitada, dst_newsletter_signup y dst_whatsapp_click.
El prefijo dst_ evita el doble conteo: tags.js define gtag como un push al
dataLayer, así que un gtag('event','form_lead') también aterrizaba ahí y GTM lo
leía como un segundo evento. Está explicado en MEDICION.md.

2 · CUÁNDO PUBLICAR
NO publiques todavía. El sitio en vivo sigue emitiendo los nombres viejos: si
publicas ahora, las conversiones de hoy se apagan. Publicar GTM y desplegar el
sitio son el MISMO paso y van en el Brief D. Deja los cambios guardados en el
espacio de trabajo, sin publicar, y avísame.

3 · UNA REGLA QUE VIENE DE GOOGLE ADS
newsletter_signup no se pudo marcar como secundaria: Google deshabilita esa opción
cuando el objetivo no es predeterminado de la cuenta. En la práctica se comporta
igual, pero de ahí sale una regla al armar las campañas:

  NO agregar el objetivo "Suscribirse" a las campañas de Fase 1.

Si se agrega, el algoritmo empieza a perseguir suscripciones de 100 pesos en lugar
de inversionistas de varios millones.
```

---

## Brief D · El despliegue, en orden

El más corto y el más fácil de romper.

```
Poner en producción los formularios nativos y la medición nueva. El orden importa
y cada paso tiene una razón; no los reordenes.

REQUISITOS — los tres, antes de empezar
  [ ] Brief A terminado y el escenario de Make 5871285 ACTIVO
  [x] Las 18 propiedades dst_* existen — hecho y verificado el 2026-08-06
  [ ] Brief C terminado, con los cambios de GTM guardados SIN publicar

PASO 1 — Comprobar que el escenario está encendido
  curl -X POST https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2 \
    -H "Content-Type: application/json" -d '{"form_type":"lead","email":"ping@destiny.mx"}'

  Si responde "Accepted", sigue. Si responde HTTP 410 "There is no scenario
  listening for this webhook", el escenario está apagado: PARA AQUÍ. Con el
  escenario apagado, cada visitante vería la caja de error del formulario y ningún
  lead se guardaría. Comprobado el 2026-08-06.

PASO 2 — Fusionar y desplegar
  git checkout main
  git merge formularios-nativos
  git push origin main

  Hostinger despliega solo desde main. Verifica en hPanel › GIT que "Actual"
  coincide con el HEAD que acabas de subir: el auto-deploy a veces se queda en un
  commit viejo y parece que no pasó nada.

PASO 3 — Publicar GTM, inmediatamente después
  Publica el espacio de trabajo del Brief C.

  Los pasos 2 y 3 no se pueden separar. El sitio nuevo emite eventos dst_*; los
  activadores viejos escuchan generate_lead. Si despliegas sin publicar, las
  conversiones se apagan. Si publicas sin desplegar, también. Hazlos seguidos.

PASO 4 — Validar
  Abre https://destiny.mx/diagnostico.html?gclid=PRUEBA123&utm_source=google&utm_medium=cpc&utm_campaign=prueba

  Esa página lo dice todo sin adivinar. Que no haya nada en rojo. Los siete
  bloques: la cadena de scripts, el consentimiento con sus cuatro parámetros, los
  click IDs, los identificadores de GA4, quién dispara las conversiones, los
  eventos disparados y los pasos de prueba manual.

  Después, con la vista previa de GTM abierta, llena un formulario de cada tipo y
  confirma que cada etiqueta se dispara UNA sola vez. Si sale "Activado 2 veces",
  el contenedor conserva los activadores viejos además de los nuevos.

  Y comprueba lo que la página no puede: el lead en HubSpot con su gclid, el
  contacto en ActiveCampaign, el correo a Carlos, y el evento en el Depurador de
  Meta con su event_id.

PASO 5 — Apagar Zoho
  Solo cuando el paso 4 esté limpio, apaga los cuatro escenarios viejos en Make:
  5514580, 5223878, 5485213 y 5775240. No antes: son la red de seguridad.

SI ALGO SALE MAL
  git revert del merge y volver a publicar la versión anterior de GTM. Las dos
  cosas, otra vez juntas.
```

---

## Brief E · Los PDFs que faltan

Independiente de todo lo demás.

```
Trabaja en el repositorio de destiny.mx. Falta un entregable que el sitio ya
promete por escrito.

CÓMO SE HACE UN PDF AQUÍ
No se escribe un PDF directamente: se escribe una plantilla HTML de impresión y se
convierte con Chrome headless. El patrón está documentado en el encabezado de
Guia-PDF.html — léelo y cópialo.

  python3 -m http.server 8899
  nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu --user-data-dir=<tmp>/chrome-profile \
    --virtual-time-budget=25000 --no-pdf-header-footer \
    --print-to-pdf="dossiers/<nombre>.pdf" \
    "http://localhost:8899/<Nombre>-PDF.html" &
  pkill -f print-to-pdf     # Chrome se cuelga después de escribir el PDF

La plantilla lleva noindex, no se enlaza desde ninguna página, y usa la tipografía
y la paleta de Guia-PDF.html (Playfair Display + Outfit, crema #FAF9F3, navy
#13192A, oro #C5A058). Reutiliza su CSS de impresión: ya está resuelto el salto de
página y los márgenes.

OBLIGATORIO — EL SCORECARD DE INVERSIÓN
  Fuente: Scorecard-PDF.html
  Salida: dossiers/scorecard-inversion-miami.pdf

/scorecard promete "te lo enviamos por correo" y el archivo no existe. Es el mismo
marco con el que Destiny descarta proyectos, no una versión reducida. Cinco
dimensiones, en este orden, que son las que la página lista textualmente:

  1. Desarrollador — historial de entregas, litigios y capacidad financiera
  2. Estructura de pagos — depósitos, hitos y qué pasa si el proyecto se retrasa
  3. Costos recurrentes — HOA, impuestos, seguros y fees de licencia de marca
  4. Letra chica — rescisión, cambios de plano y reventa antes de la entrega
  5. Salida — liquidez real en reventa, no la proyectada en el brochure

Cada dimensión: qué se revisa y por qué importa; las preguntas concretas para el
desarrollador, redactadas para copiarlas y mandarlas tal cual; las señales de
alarma que descartan un proyecto; y un espacio para calificar del 1 al 5, porque es
un scorecard y tiene que poder llenarse.

Cierra con la hoja de puntuación y qué significa cada rango. El rango bajo dice "no
compres", sin suavizarlo: es el punto entero de la marca.

OPCIONAL — DECIDE SI HACEN FALTA
/club, /preconstruccion-miami e /invertir-en-dolares no prometen ningún PDF en su
página de gracias. Revísalas y dime si conviene crear un entregable o si el
compromiso que hacen ya se cumple sin documento. Si crees que sí, propón qué sería
y espera mi visto bueno. No inventes un PDF por rellenar.

COMPLIANCE — NO NEGOCIABLE
Prohibido en todo el documento: porcentajes de retorno o rendimiento esperado, las
palabras "garantizado" y "asegurado" aplicadas a resultados, y cualquier promesa de
plusvalía. Los rangos con escenarios sí, siempre etiquetados como escenarios y con
su fuente. Toda cifra lleva fuente y fecha.

⛔ Las cifras de Guia-PDF.html son las mismas que las de /preconstruccion-miami y
/invertir-en-dolares. Si cambias una, cambian las tres.

VOZ
Transparencia radical y posicionamiento antibroker: se dice lo que los demás
callan, incluido lo que juega en contra de cerrar la venta. Si algo es un riesgo,
se nombra riesgo.

AL TERMINAR
Genera el PDF, comprueba que abre bien en móvil, y haz un commit explicando qué
decisiones de contenido tomaste.
```
