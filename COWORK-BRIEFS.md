# Briefs para Claude CoWork

Encargos para cerrar lo que falta. Cada bloque se pega tal cual.

**Actualizado el 2026-08-11.** El despliegue y GTM ya ocurrieron: los briefs C y D
se cerraron y quedan solo como registro. El encargo vivo es el **Brief F**.

---

## Dónde está todo — el estado real

Todo está fusionado y desplegado en `main`. destiny.mx en vivo ya corre con
formularios nativos; los iframes de Zoho se quitaron del sitio el 2026-08-05.
(Los cuatro escenarios de Zoho en Make siguen encendidos pero inertes — ver el
final del Brief A.)

| Pieza | Estado |
|---|---|
| Formularios nativos, 22 en 16 páginas | ✅ en vivo |
| Capa de medición (atribución, conversiones, diagnóstico) | ✅ en vivo |
| Lista ActiveCampaign `Leads Web 2026` | ✅ creada · **id 7** |
| 12 tags de ActiveCampaign | ✅ creados · **ids 11–22** |
| Webhook de Make | ✅ **2662269** |
| Escenario de Make **5871285** | ✅ **ACTIVO** (verificado 2026-08-11) · sigue sin Meta CAPI |
| 18 propiedades `dst_*` en HubSpot | ✅ creadas y verificadas el 2026-08-06 |
| Módulo de Meta CAPI | ❌ Brief A · falta el token |
| Contenedor de GTM | ✅ **versión 3 publicada** el 2026-08-11 |
| Nombres de evento que emite el sitio | ✅ corregidos el 2026-08-11 · commit `f580caf` |
| Etiqueta de `newsletter_signup` en GTM | ❌ **Brief F** |
| Verificar las conversiones con Tag Assistant | ❌ **Brief F** |
| PDF del Scorecard | ❌ Brief E |

> ⛔ **`gtm-destiny.json` no se importa nunca.** Propone activadores `dst_form_lead`
> que el sitio ya no emite para las conversiones. Importarlo apagaría Google Ads.
> El archivo está marcado como obsoleto por dentro y se conserva solo como
> registro histórico. Ver `MEDICION.md`, «La semana sin conversiones».

### Identificadores que vas a necesitar

```
Make · equipo            2342480
  webhook                https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2
  escenario              5871285   (ACTIVO desde el 2026-08-09)
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
Brief F (cerrar la medición de Ads en GTM)  ──── PRIMERO, hoy
Brief A (terminar Make · necesita el token) ──── después, independiente
Brief E (PDF del Scorecard)                 ──── en paralelo, cuando quieras
```

El Brief F ya no está acoplado a ningún despliegue. Antes publicar GTM y subir el
sitio eran el mismo paso —los nombres de evento tenían que cambiar a la vez— y esa
dependencia desapareció: el sitio en vivo ya emite lo que el contenedor escucha.

---

## Brief A · Terminar y encender el escenario de Make

Ya no depende del Brief B. Sigue necesitando el token de la CAPI de Meta.

```
En Make, equipo 2342480, hay un escenario llamado
"WEB · Formularios destiny.mx → HubSpot + ActiveCampaign + aviso", id 5871285.
Está ACTIVO y recibiendo leads de verdad desde el 2026-08-09, así que trabaja con
cuidado: cada cambio afecta a los envíos en vivo. Le faltan tres cosas.

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

DÉJALO ACTIVO. El sitio ya está en vivo mandando leads a este webhook: un escenario
apagado los rechaza con HTTP 410 y el visitante ve la caja de error del formulario
(comprobado). Si en algún momento lo pausas para editarlo, vuelve a encenderlo
antes de cerrar.

Este escenario es el único que recibe los leads del sitio: no hay red de seguridad
detrás.

Los cuatro escenarios viejos de Zoho siguen ENCENDIDOS, comprobado por API el
2026-08-11: 5514580 (HOME-TOFU), 5485213 (Mercedes-Benz), 5775240 (Newsletter) y
5223878 (Cipriani). Están inertes —el sitio ya no tiene formularios de Zoho, así
que su watchFormEntries no recibe nada— pero consumen una operación por sondeo.
Apagarlos es una decisión de Carlos, no la tomes tú: dile lo que ves y espera.
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

## Brief C · ~~Importar el contenedor de GTM~~ — CANCELADO

**No se hizo y no se debe hacer.** Este brief pedía importar `gtm-destiny.json`
para reapuntar los activadores a los nombres `dst_*`. Nunca se importó, y el
2026-08-11 se resolvió por el otro lado: el sitio volvió a emitir los nombres que
el contenedor ya escuchaba (`generate_lead`, `click_whatsapp`).

⛔ **Importar ese archivo hoy apagaría las conversiones de Google Ads.** Está
marcado como obsoleto por dentro y se conserva solo como registro.

Lo que quedó vivo de este brief está en el **Brief F**.

---

## Brief D · ~~El despliegue~~ — HECHO

Fusionado a `main` y desplegado. Zoho apagado el 2026-08-05. El contenedor de GTM
se publicó como **versión 3** el 2026-08-11.

La regla que este brief repetía —«publicar GTM y desplegar el sitio son el mismo
paso»— **ya no aplica**: existía porque los nombres de evento iban a cambiar en
los dos lados a la vez. Hoy el sitio y el contenedor hablan el mismo idioma y cada
uno se puede tocar por separado.

Lo que sí sigue siendo cierto de aquí: Hostinger despliega solo desde `main`, y hay
que verificar en hPanel › GIT que «Actual» coincida con el HEAD que se subió. El
auto-deploy a veces se queda en un commit viejo y parece que no pasó nada.

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

---

## Brief F · Cerrar la medición de Google Ads en GTM

El encargo vivo. Es todo dentro de GTM: no se toca el repositorio ni se despliega
nada.

**Contexto de una línea:** del 5 al 11 de agosto Google Ads no registró ni una
conversión porque el sitio emitía `dst_form_lead` y el contenedor escuchaba
`generate_lead`. El sitio ya se corrigió (commit `f580caf`, en vivo). Falta
comprobar que de verdad llegan, y cerrar dos cabos sueltos del contenedor.

```
Tres cosas dentro del contenedor GTM-KW8TPGGG. La 1 es verificación y va primero;
las 2 y 3 son cambios y se publican juntas al final.

DÓNDE ESTÁ EL CONTENEDOR
GTM-KW8TPGGG · cuenta 6368951919 · contenedor 259896060.
Vive en el authuser=6 de Chrome, que es it.destiny.real.estate@gmail.com, NO en
lic.carlos.cataneo@gmail.com. Buscarlo en la cuenta por defecto no da nada. Ojo
con el contenedor gemelo GTM-N6ZQ256, vacío y sin uso: el que carga el sitio es
GTM-KW8TPGGG.

Va por la versión 3, publicada el 2026-08-11.

⛔ TRES COSAS QUE NO SE HACEN
  · NO importar gtm-destiny.json. Propone activadores dst_form_lead que el sitio
    ya no emite para las conversiones: apagaría Google Ads. El archivo está
    marcado como obsoleto por dentro.
  · NO crear etiquetas de GA4 ni del Pixel de Meta. Esos salen por código desde
    assets/tags.js y se contarían dos veces. Google Ads es la única excepción y
    ya vive entero aquí.
  · NO tocar la Etiqueta de Google AW-18368975159 ni el Vinculador de
    conversiones. Ya están bien.

────────────────────────────────────────────────────────────
1 · VERIFICAR QUE LAS CONVERSIONES LLEGAN  (hazlo primero)
────────────────────────────────────────────────────────────
Abre Vista previa (Tag Assistant) contra https://destiny.mx y haz las cuatro
pruebas. Ojo: la Vista previa congela el estado del contenedor al abrirse; si
editas algo, hay que volver a pulsar Vista previa — recargar la página no basta.

  a) Formulario de /agenda
     dataLayer:  event = generate_lead  ·  form_type = sesion
     Dispara:    Ads · agenda_solicitada (2000 MXN) + Ads · Conversiones mejoradas

     ⚠️ Si ves form_type = "agenda" en vez de "sesion", el despliegue no llegó al
     servidor. Revisa hPanel › GIT que "Actual" sea f580caf o posterior y vuelve
     a empezar. Con "agenda", Ads cobraría la sesión como lead de 500.

  b) Cualquier otro formulario (guía, club, scorecard, propiedad, zona)
     dataLayer:  event = generate_lead  ·  form_type = guia / club / …
     Dispara:    Ads · form_lead (500 MXN) + Ads · Conversiones mejoradas

  c) Botón flotante de WhatsApp
     dataLayer:  event = click_whatsapp
     Dispara:    Ads · whatsapp_click (500 MXN)

  d) En los dos casos de formulario, comprueba en el dataLayer:
     user_email  en minúsculas y sin espacios
     user_phone  en formato +52…  (E.164, sin espacios ni guiones)
     Son los que alimentan las conversiones mejoradas. Si llegan sin normalizar,
     el hash no empata con el de Google y no emparejan con nadie.

  e) Cada etiqueta tiene que salir UNA sola vez. Si alguna sale "Activado 2
     veces", para y avísame: significa que alguien creó un activador con un
     nombre que también usa GA4.

Si algo de esto falla, PARA AQUÍ y avísame antes de tocar nada. No sigas con los
puntos 2 y 3.

────────────────────────────────────────────────────────────
2 · CREAR LA ETIQUETA DEL NEWSLETTER
────────────────────────────────────────────────────────────
La acción de conversión ya existe en Google Ads desde el 2026-08-06, pero no hay
ninguna etiqueta que la dispare: hoy las suscripciones se miden en GA4 y en Meta,
en Ads no. El evento ya está saliendo al dataLayer, esperando.

  Activador nuevo
    Tipo:     Evento personalizado
    Nombre del evento:  dst_newsletter_signup
    Se activa en:       Todos los eventos personalizados
    Nómbralo:           Evento · dst_newsletter_signup

  Etiqueta nueva
    Tipo:               Seguimiento de conversiones de Google Ads
    Nombre:             Ads · newsletter_signup
    ID de conversión:   18368975159
    Rótulo:             mofbCOvqmN0cELeigbdE
    Valor:              100
    Moneda:             MXN
    Vinculador de conversiones: activado
    Opciones de activación:     Ilimitado
    Activador:          el de arriba

  Y una mejora barata: la etiqueta que YA existe "Ads · Conversiones mejoradas"
  (tipo Datos proporcionados por el usuario) hoy se dispara con los dos
  generate_lead. Agrégale también este activador nuevo. El formulario de
  newsletter solo pide correo, pero con eso basta para que Google empareje la
  suscripción.

REGLA QUE VIENE DE GOOGLE ADS Y HAY QUE RESPETAR
newsletter_signup no se pudo marcar como secundaria: Google deshabilita esa opción
cuando el objetivo no es predeterminado de la cuenta. En la práctica se comporta
igual, porque Ads solo la cuenta en la columna Conversiones de una campaña que use
explícitamente el objetivo "Suscribirse". De ahí sale la regla:

  ⛔ NO agregar el objetivo "Suscribirse" a las campañas de Fase 1.

Si se agrega, el algoritmo empieza a perseguir suscripciones de 100 pesos en lugar
de inversionistas de varios millones.

────────────────────────────────────────────────────────────
3 · PASAR LAS TRES ETIQUETAS DE CONVERSIÓN A "ILIMITADO"
────────────────────────────────────────────────────────────
Ads · form_lead, Ads · agenda_solicitada y Ads · whatsapp_click están hoy en
Opciones de activación = "Una vez por carga de página". Cámbialas a "Ilimitado".

Por qué: esa opción era un parche del 2026-08-05 contra un doble disparo que ya
está resuelto de raíz por los nombres de evento. Hoy solo puede restar — si un
visitante envía dos formularios distintos en la misma página sin recargar, el
segundo no se cuenta. Pasa poco, porque cada envío redirige a su página de
gracias, pero no hay razón para dejarlo.

Deja el Vinculador de conversiones y la Etiqueta de Google como están.

────────────────────────────────────────────────────────────
4 · PUBLICAR Y COMPROBAR
────────────────────────────────────────────────────────────
Publica como versión 4. Nombre: "Newsletter + activación ilimitada".

Vuelve a abrir Vista previa y suscríbete al newsletter del home (sección
#newsletter, pide solo correo). Confirma que dispara Ads · newsletter_signup con
100 MXN. Comprueba de paso que las tres pruebas del punto 1 siguen pasando.

AL TERMINAR
Dime qué versión quedó publicada y pega el resultado de las cinco pruebas: los
tres formularios, el WhatsApp y el newsletter. Si algo no disparó, dime qué viste
en el dataLayer — el nombre del evento y el form_type — antes de intentar
arreglarlo.

DÓNDE ESTÁ TODO EXPLICADO
  MEDICION.md · "Las conversiones de Google Ads y GTM"
  assets/tracking.js · la constante GTM_EVENTO es el contrato con este contenedor
  https://destiny.mx/diagnostico.html · dice en vivo qué se disparó en la página
```

### Cómo comprobar el contenedor sin entrar a la interfaz

Útil si algo no cuadra y quieres ver qué escucha el contenedor **publicado**, no el
espacio de trabajo:

```bash
curl -s "https://www.googletagmanager.com/gtm.js?id=GTM-KW8TPGGG" > /tmp/gtm.js
```

Al principio del archivo, antes del runtime compilado, están en JSON legible los
bloques `"macros"`, `"tags"`, `"predicates"` y `"rules"`: de ahí salen los nombres
de evento que escucha, los rótulos de conversión, los valores y las opciones de
activación. Es la forma más rápida de confirmar que el código y el contenedor
están de acuerdo.
