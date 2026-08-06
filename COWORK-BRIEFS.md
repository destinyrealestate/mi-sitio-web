# Briefs para Claude CoWork

Cuatro encargos independientes para cerrar lo que falta del Prompt 3. Cada bloque
se pega tal cual. **No dependen entre sí**: se pueden lanzar en paralelo.

Contexto que comparten todos: `FORMULARIOS.md` (el motor y el payload),
`MEDICION.md` (la capa del navegador) y `MAKE-ESCENARIO.md` (el mapeo propuesto).

---

## Brief 1 · Los PDFs que faltan

El único imprescindible es el del Scorecard: la página lo promete por escrito
("Te lo enviamos por correo") y el archivo no existe. Los otros dos son opcionales
y el brief lo dice.

```
Trabaja en el repositorio de destiny.mx que tienes abierto. Necesito los entregables
descargables que faltan, en el mismo formato que ya usa el sitio.

CÓMO SE HACE UN PDF EN ESTE PROYECTO
No se escribe un PDF directamente. Se escribe una plantilla HTML de impresión y se
convierte con Chrome headless. El patrón ya existe y está documentado en el
encabezado de Guia-PDF.html — léelo antes de empezar y cópialo:

  python3 -m http.server 8899
  nohup "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --disable-gpu --user-data-dir=<tmp>/chrome-profile \
    --virtual-time-budget=25000 --no-pdf-header-footer \
    --print-to-pdf="dossiers/<nombre>.pdf" \
    "http://localhost:8899/<Nombre>-PDF.html" &
  pkill -f print-to-pdf     # Chrome se cuelga después de escribir el PDF

La plantilla lleva meta robots noindex, no se enlaza desde ninguna página y usa la
tipografía y la paleta de Guia-PDF.html (Playfair Display + Outfit, crema #FAF9F3,
navy #13192A, oro #C5A058). Reutiliza su CSS de impresión: ya está resuelto el
salto de página, los márgenes y el pie.

ENTREGABLE 1 — SCORECARD DE INVERSIÓN (obligatorio)
Archivo fuente: Scorecard-PDF.html
Salida:         dossiers/scorecard-inversion-miami.pdf

Es el marco con el que Destiny descarta proyectos, no una versión reducida — así lo
promete /scorecard. Cinco dimensiones, en este orden, que son las que la página
lista textualmente:

  1. Desarrollador — historial de entregas, litigios y capacidad financiera
  2. Estructura de pagos — depósitos, hitos y qué pasa si el proyecto se retrasa
  3. Costos recurrentes — HOA, impuestos, seguros y fees de licencia de marca
  4. Letra chica — cláusulas de rescisión, cambios de plano y reventa antes de la entrega
  5. Salida — liquidez real del producto en reventa, no la proyectada en el brochure

Cada dimensión necesita:
  - qué se revisa exactamente y por qué importa
  - las preguntas concretas que hay que hacerle al desarrollador, redactadas para
    que el lector pueda copiarlas y mandarlas tal cual
  - las señales de alarma que descartan un proyecto
  - un espacio para calificar del 1 al 5, porque es un scorecard y tiene que poder
    llenarse a mano o en pantalla

Cierra con una hoja de puntuación total y qué significa cada rango. El rango bajo
tiene que decir "no compres", sin suavizarlo: es el punto entero de la marca.

ENTREGABLE 2 — DECIDE SI EXISTEN (opcional, tú me dices)
Las páginas /club, /preconstruccion-miami e /invertir-en-dolares NO prometen hoy
ningún PDF en su página de gracias. Antes de escribir nada, revisa esas tres
páginas de gracias y dime si conviene crear un entregable o si el compromiso que
hacen (activar accesos, contactar el mismo día) ya se cumple sin documento.
Si crees que sí conviene, propón qué sería y por qué, y espera mi visto bueno antes
de escribirlo. No inventes un PDF por rellenar.

REGLAS DE COMPLIANCE — NO NEGOCIABLES
Este es un sitio de inversión inmobiliaria y el texto es material de marketing
financiero. Está prohibido, en todo el documento:
  - porcentajes de retorno, rendimiento esperado o proyecciones de ganancia
  - las palabras "garantizado" y "asegurado" aplicadas a resultados
  - cualquier promesa de plusvalía
Los rangos con escenarios sí se pueden usar, siempre etiquetados como escenarios y
con su fuente. Toda cifra lleva fuente embebida y fecha.

⛔ Ojo con un dato que se repite en tres lugares: las cifras de Guia-PDF.html son
las mismas que las de /preconstruccion-miami y /invertir-en-dolares. Si cambias
una, cambian las tres. El tipo de cambio de referencia (17.32 MXN, Banxico
3-ago-2026) se revisa cada trimestre.

VOZ
Transparencia radical y posicionamiento antibroker: se dice lo que los demás
callan, incluido lo que juega en contra de cerrar la venta. Nada de superlativos
vacíos ni de lenguaje de folleto. Si algo es un riesgo, se nombra riesgo.

AL TERMINAR
Genera el PDF, comprueba que pesa menos de 5 MB y que abre bien en móvil, y hazme
un commit por entregable con un mensaje que explique qué decisión de contenido
tomaste y por qué.
```

---

## Brief 2 · Las 18 propiedades de HubSpot

```
Necesito crear 18 propiedades de contacto en HubSpot (portal 8199998) para guardar
la atribución de los formularios de destiny.mx. Hoy no existe ninguna: comprobado
por API el 2026-08-06. Sin ellas, el escenario de Make recibe la atribución
completa y no tiene dónde escribirla.

GRUPO
Crea primero un grupo de propiedades nuevo:
  nombre interno: dst_atribucion
  etiqueta:       Atribución web (Destiny)

El prefijo dst_ en todo es a propósito: distingue de un vistazo estas propiedades
de las nativas de HubSpot y de las que ya existían en el portal.

LAS 18 PROPIEDADES
Todas de objeto CONTACT, todas en el grupo dst_atribucion.

Identificadores de clic — tipo string, fieldType text:
  dst_gclid        · Google Ads · gclid     · Identificador de clic de Google Ads. Es lo que empata el lead con la campaña que lo trajo.
  dst_wbraid       · Google Ads · wbraid    · Identificador de Google cuando el navegador bloquea cookies de terceros (Safari/iOS, web a app).
  dst_gbraid       · Google Ads · gbraid    · Igual que wbraid, para tráfico de app a web.
  dst_msclkid      · Microsoft Ads · msclkid · Identificador de clic de Bing. Se captura aunque todavía no se use ese canal.
  dst_ttclid       · TikTok · ttclid        · Identificador de clic de TikTok. Se captura de antemano para tener histórico el día que se encienda el canal.
  dst_li_fat_id    · LinkedIn · li_fat_id   · Identificador de clic de LinkedIn. Mismo criterio que TikTok.

UTM — tipo string, fieldType text:
  dst_utm_source   · UTM source    · Fuente de la campaña.
  dst_utm_medium   · UTM medium    · Medio de la campaña.
  dst_utm_campaign · UTM campaign  · Nombre de la campaña.
  dst_utm_term     · UTM term      · Término de búsqueda o segmento.
  dst_utm_content  · UTM content   · Variante creativa.

Contexto del formulario:
  dst_form_type    · Tipo de formulario · enumeration / select
                     Opciones: lead, agenda, guia, club, scorecard, propiedad, zona, newsletter, radar
  dst_form_variant · Variante del formulario · enumeration / select
                     Opciones: preconstruccion, dolares, patrimonio
  dst_pagina_origen · Página de origen · string / text
                     URL exacta desde la que se envió el formulario.
  dst_propiedad    · Propiedad de interés · string / text
  dst_zona         · Zona de interés      · string / text

Atribución de recorrido:
  dst_primer_contacto · Primer contacto · string / textarea
    JSON del primer contacto del visitante: campaña, click ID, referente y fecha.
    Se escribe una vez y no se vuelve a tocar. El anuncio que descubre al
    inversionista casi nunca es el que cierra la conversión tres semanas después,
    y sin esto esa primera campaña desaparece del registro.

Calidad:
  dst_calidad_lead · Calidad del lead · enumeration / select
    Opciones: ok, correo_desechable, telefono_invalido, patron_spam
    Marca automática que NO frena nada: sirve para filtrar reportes sin bloquear la
    señal a las plataformas de anuncios.

LO QUE NO HAY QUE TOCAR
Estas ya existen en el portal y el escenario de Make las va a reutilizar. No las
dupliques ni las modifiques:
  origen                            (texto libre, origen legible de campaña)
  estatus_art  "Estatus DRE"        (el estado de venta que el equipo lleva a mano)
  hablame_de_ti_quiero_conocerte_mas
  hs_analytics_source               (nativa, enumeración)
  hs_facebook_click_id              (nativa, ahí va el fbclid)

Muy importante: la marca de calidad va en dst_calidad_lead y NO en estatus_art. Si
se escribiera en estatus_art, un lead marcado como spam borraría el estado de venta
que el equipo actualiza a mano.

CÓMO CREARLAS
Por la API de propiedades de HubSpot (POST /crm/v3/properties/contacts) o desde
Configuración › Propiedades. Si usas la API, hazlo idempotente: comprueba primero
si la propiedad existe y no falles si ya está.

AL TERMINAR
Dame la lista de las que creaste y de las que ya existían, y confirma que
dst_form_type y dst_form_variant tienen exactamente las opciones de arriba: el
escenario de Make escribe esos valores literales y una opción mal escrita hace que
HubSpot rechace el contacto entero.
```

---

## Brief 3 · Las listas y los tags de ActiveCampaign

```
Necesito preparar ActiveCampaign para recibir los leads de los formularios de
destiny.mx. Hoy hay 3 listas y 8 tags, y ninguno corresponde a formularios web.

LO QUE YA EXISTE — no lo toques
  Lista id 4 · BD-9.5K-18032026-DRE      (7,806 suscriptores, la base grande)
  Lista id 5 · Leads-Fondos-Inversion-2026 (4)
  Lista id 6 · Newsletter Web            (2)  ← esta sí se usa, ver abajo
  Tags: hubspot-calificacion-AAA, BD-HUBSPOT-9.5K-18032026-DRE, mbp_* (4), cip_* (3)

LO QUE HAY QUE CREAR

1. Una lista nueva:
   Nombre:   Leads Web 2026
   stringid: leads-web-2026
   URL del remitente: https://destiny.mx

   Texto de recordatorio de suscripción (ActiveCampaign lo exige y aparece al pie
   de cada envío — tiene que decir la verdad de por qué recibe el correo):

   "Recibes este correo porque dejaste tus datos en destiny.mx para recibir
   información sobre inversión inmobiliaria en Miami. Puedes darte de baja con un
   solo clic cuando quieras."

   Por qué una lista aparte y no reusar Newsletter Web: quien pidió una sesión de
   claridad no es lo mismo que quien solo quiere el boletín del lunes. Mezclarlos
   obliga a segmentar en cada envío y termina mandándole material de venta a gente
   que solo quería leer. Newsletter Web (id 6) se queda para newsletter y radar.

2. Doce tags, uno por tipo de formulario. Descripción incluida, porque en seis
   meses nadie recuerda qué era cada uno:

   web_lead            · Formulario general de lead del sitio
   web_preconstruccion · Landing de Google Ads de preconstrucción
   web_dolares         · Landing de Google Ads de patrimonio en dólares
   web_patrimonio      · Formulario de Marca, Inversión o Artículo
   web_agenda          · Solicitud de sesión desde /agenda
   web_guia            · Descargó la guía de inversión en Miami
   web_club            · Se registró al Miami Investors Club
   web_scorecard       · Pidió el Scorecard de inversión
   web_propiedad       · Interés en un desarrollo concreto
   web_zona            · Interés en una zona concreta
   web_newsletter      · Suscripción al newsletter desde el home
   web_radar           · Suscripción al Radar semanal

MAPEO QUE VA A USAR EL ESCENARIO DE MAKE
  newsletter y radar  → lista Newsletter Web (id 6)
  club                → lista Leads Web 2026 + Newsletter Web (pide las dos cosas)
  todo lo demás       → lista Leads Web 2026

Además, los tipos propiedad y zona reciben un segundo tag dinámico con el slug del
desarrollo o la zona (prop_cipriani-residences, zona_brickell). Esos NO hay que
crearlos por adelantado: son 29 propiedades y 12 zonas, y ActiveCampaign los crea
al vuelo cuando el escenario los aplica.

AL TERMINAR
Dame el id numérico de la lista nueva y el de cada tag. El escenario de Make los
necesita literales; con el nombre no basta.
```

---

## Brief 4 · El escenario de Make completo

```
Construye el escenario de Make que recibe los formularios nativos de destiny.mx y
los reparte. El sitio ya está listo y probado: lo único que falta es el otro lado
del webhook.

LEE PRIMERO, en este orden:
  MAKE-ESCENARIO.md  — el mapeo completo, ya aprobado. Es tu especificación.
  FORMULARIOS.md     — el JSON exacto que manda el navegador.
  MEDICION.md        — qué se mide en el navegador, para no duplicarlo aquí.

NO EMPIECES DE CERO. En el equipo 2342480 hay 20 escenarios que ya siguen el patrón
correcto. Copia el más reciente: AUTO-CONV-ABO-FONDOS-LEADS-CALIFICADOS-V1-02082026
(id 5837439). De ahí sale la estructura, el manejo de errores con builtin:Resume en
cada módulo, y el corrector de erratas de correo (gnail.com → gmail.com y 16 más)
que vale la pena conservar.

Revisa también BACKFILL · HubSpot MQL+ → Meta CAPI CRM (id 5815339) antes de tocar
nada de Meta.

CONEXIONES — ya existen todas, no crees ninguna
  HubSpot           9067982   (la que usan los 20 escenarios)
  HubSpot           9833579   (41 scopes, si necesitas escribir esquemas)
  ActiveCampaign    9068082
  Correo Microsoft  9069490   (carlos.cataneo@destiny.mx)
  Meta              9833591

ARQUITECTURA
Un escenario, un webhook, un router por form_type. No once escenarios iguales: los
nueve tipos comparten el 90% de los módulos y solo cambian en la lista de
ActiveCampaign, el evento de Meta y el PDF que entregan. Si al construirlo ves que
alguno merece escenario propio, propónmelo con la razón antes de hacerlo.

FLUJO
1. Webhook recibe el JSON. Valida que traiga correo. Si falta, corta y avísame.
2. Antiduplicados: Data Store con clave correo+form_type y TTL de 5 minutos.
3. Conversión de Google Ads: NO la dupliques. La dispara el navegador. Aquí solo se
   guardan los click IDs en HubSpot para la carga offline posterior. Si viene sin
   gclid pero con msclkid, guárdalo igual etiquetado como Microsoft Ads.
4. Meta CAPI web — la parte delicada, lee esto entero:
   Los cuatro escenarios de Meta que ya existen usan
   facebook-conversion-leads:CreateALead, que es la CAPI para CRM: manda etapas de
   lead identificadas por lead_id y NO admite event_id ni eventos web. NO SIRVE
   AQUÍ. Lo que hace falta es la CAPI web, por módulo HTTP:

     POST https://graph.facebook.com/v21.0/27857783360524172/events

   con event_name (Lead / CompleteRegistration / Schedule / Subscribe según el
   mapeo), action_source "website", event_source_url, y el event_id DEL PAYLOAD
   TAL CUAL. Ese event_id es lo único que le dice a Meta que el evento del Pixel y
   el del servidor son el mismo; si generas uno nuevo, cada lead se cuenta dos
   veces en el Administrador de Eventos.
   user_data con SHA-256: normaliza ANTES de hashear (correo en minúsculas sin
   espacios, teléfono en E.164 sin el +). El fbclid va como fbc con el formato
   fb.1.<timestamp>.<fbclid>.
   El token de acceso te lo paso aparte — no lo escribas en el blueprint, ponlo
   como variable de escenario.
5. HubSpot: crea o actualiza el contacto con upsertAContact. Las propiedades dst_*
   ya deberían existir; si alguna falta, dímelo en vez de perder el dato en
   silencio. Deduce hs_analytics_source con la regla de MAKE-ESCENARIO.md, no lo
   dejes fijo en PAID_SOCIAL como hace el escenario viejo de Cipriani.
6. ActiveCampaign: upsertContact2024 + UpdateContactListStatus. El upsert NO
   suscribe a la lista por sí solo, hacen falta los dos módulos.
7. Entrega al usuario: para guia manda dossiers/guia-invertir-en-miami.pdf. Para
   propiedad, la URL se arma sola con desarrollo_slug del payload
   (https://destiny.mx/dossiers/<slug>.pdf) — no hagas una tabla de PDFs.
8. Correo a carlos.cataneo@destiny.mx y camile@destiny.mx. Informativo, no espera
   aprobación. Copia el diseño del escenario 5837439. Que traiga nombre, correo,
   teléfono, qué formulario llenó, propiedad o zona si aplica, la liga al contacto
   en HubSpot, y el origen LEGIBLE — "Google Ads · campaña Preconstrucción ·
   término departamentos miami", nunca el gclid crudo. Asunto escaneable en el
   celular.
9. Marca de calidad: evalúa correo desechable, teléfono inválido y patrón de spam,
   y escribe el resultado en dst_calidad_lead. NO frenes nada por esto.

ERRORES
builtin:Resume en cada llamada externa. Si Meta CAPI truena, el lead tiene que
llegar igual a HubSpot y a Carlos. Ruta de error global que me avise por correo.

ENTREGABLES
- El escenario armado y DESACTIVADO hasta que yo lo revise.
- La URL del webhook, para pegarla en la constante MAKE_WEBHOOK_URL de
  assets/forms.js. Es lo único que falta para poder desplegar el sitio.
- Instrucciones para probarlo de punta a punta con un lead falso.
- Dime qué escenarios viejos de Zoho hay que apagar y cuándo: son 5514580,
  5223878, 5485213 y 5775240.

NO ACTIVES NADA. Ni el escenario nuevo ni cambios en los viejos.
```

---

## En qué orden lanzarlos

Los briefs 2 y 3 son requisitos del 4: el escenario de Make escribe en propiedades
y listas que tienen que existir antes. El 1 es independiente.

```
Brief 2 (HubSpot)  ─┐
Brief 3 (AC)       ─┴─→  Brief 4 (Make)

Brief 1 (PDFs)     ─────  en paralelo, cuando quieras
```

El brief 4 además necesita el **token de la CAPI de Meta**, que es el único
bloqueante que no puede resolver ninguno de los cuatro.
