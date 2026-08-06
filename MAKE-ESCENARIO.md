# El escenario de Make — mapeo propuesto

Lo que recibe el webhook de `assets/forms.js` y a dónde va cada cosa.
Ver `FORMULARIOS.md` para el payload y `MEDICION.md` para la capa del navegador.

## Estado — 2026-08-06

**Construido y funcionando, salvo la CAPI de Meta.**

| Pieza | Estado |
|---|---|
| Webhook | `https://hook.us2.make.com/7qv7oss8wfm52wyfier7g9x5qgyvl7n2` · hook `2662269` |
| Escenario | `5871285` — **INACTIVO**, a la espera de revisión |
| Lista ActiveCampaign | `Leads Web 2026` · **id 7** |
| Tags ActiveCampaign | **11 a 22** (12 tags) |
| HubSpot | Escribe en las propiedades que ya existían |
| Meta CAPI | **Pendiente** — falta el token |
| Propiedades `dst_*` de HubSpot | **Pendientes** — ver Brief 2 |

El escenario se construyó sin router: los nueve tipos comparten el mismo flujo y
lo que cambia (lista, tag, PDF, origen legible) se resuelve en un solo
`SetVariables` con búsquedas. Nueve ramas idénticas salvo por un dato habrían sido
nueve sitios donde arreglar el mismo error. Si algún tipo llega a necesitar
tratamiento propio de verdad, ahí sí entra un router.

**Lo que falta para encenderlo:**
1. Crear las 18 propiedades `dst_*` en HubSpot (Brief 2) y mapearlas en el módulo 3.
2. Token de la CAPI de Meta → agregar el módulo HTTP con el `event_id`.
3. Antiduplicados con Data Store (5 min por correo + form_type).
4. Revisarlo y **activarlo**.

---

## 1. Lo que ya existe y se reutiliza

Revisado en la cuenta de Make (equipo **2342480**) el 2026-08-06.

### Conexiones — no hay que crear ninguna

| Sistema | Conexión | id |
|---|---|---|
| HubSpot | `Hubspot Destiny Real Estate` (3 scopes, la que usan los 20 escenarios) | `9067982` |
| HubSpot | `hubspotcrm via Meta Connection #1` (**41 scopes**, sirve para crear propiedades) | `9833579` |
| ActiveCampaign | `My ActiveCampaign connection` | `9068082` |
| Correo | `My Microsoft connection` (carlos.cataneo@destiny.mx) | `9069490` |
| Meta | `facebook-business-extension via Meta Connection #1` | `9833591` |

### El patrón que ya funciona

Los 20 escenarios de Facebook Lead Ads siguen todos la misma forma, y el más
reciente —`AUTO-CONV-ABO-FONDOS-LEADS-CALIFICADOS-V1-02082026` (id 5837439)— es
el que se copia:

```
Trigger → util:SetVariables → hubspotcrm:upsertAContact
        → activecampaign:upsertContact2024 → microsoft-email:createAndSendAMessage
```

Cada módulo lleva un `builtin:Resume` en su ruta de error. **Eso ya resuelve el
requisito de que el escenario no se caiga entero**: si Meta falla, el lead sigue
llegando a HubSpot y a Carlos.

De ahí se copia también el corrector de erratas de correo (`gnail.com` →
`gmail.com`, `hotmial` → `hotmail`, y 15 más). Vale la pena conservarlo.

### Escenarios de Zoho a apagar

Cuando el nuevo esté vivo: **5514580** (HOME-TOFU), **5223878** (Cipriani),
**5485213** (Mercedes-Benz), **5775240** (Newsletter).

Dos defectos suyos que no hay que repetir:

- El de Cipriani manda `hs_analytics_source` **fijo en `PAID_SOCIAL`** para todos
  los leads, vengan de donde vengan. Abajo hay una regla que lo deduce de verdad.
- El de HOME-TOFU lleva **0 ejecuciones** desde el 28-jun-2026.

---

## 2. Arquitectura

**Un escenario, un webhook, sin router.** Así quedó construido:

```
1 Webhook
2 SetVariables    correo limpio · nombre/apellido · origen legible · fuente HubSpot
                  · lista AC · tag AC · calidad · URL del PDF
3 HubSpot         upsertAContact          filtro: trae correo con @
4 ActiveCampaign  upsertContact2024
5 ActiveCampaign  UpdateContactListStatus
6 Correo          aviso a Carlos y Camile
7 Correo          entrega del PDF          filtro: hay algo que entregar
```

Cada módulo del 3 al 7 lleva un `builtin:Resume` en su ruta de error: si
ActiveCampaign truena, el lead ya está en HubSpot y el aviso sale igual.

**Por qué sin router.** El plan original decía router por `form_type`. Al
construirlo quedó claro que las nueve ramas serían idénticas salvo por cuatro
datos —lista, tag, PDF y evento de Meta—, y eso son nueve sitios donde arreglar
el mismo error. Los cuatro datos se resuelven en el `SetVariables` del módulo 2 y
el flujo es uno solo. Si algún tipo llega a necesitar tratamiento propio de
verdad, ahí sí entra un router.

---

## 3. El mapeo, tipo por tipo

| `form_type` | Evento Meta | Lista AC | Tag AC | PDF que se entrega |
|---|---|---|---|---|
| `lead` | `Lead` | Leads Web 2026 | `web_lead` | — |
| `lead` · `preconstruccion` | `Lead` | Leads Web 2026 | `web_preconstruccion` | *(a definir)* |
| `lead` · `dolares` | `Lead` | Leads Web 2026 | `web_dolares` | *(a definir)* |
| `lead` · `patrimonio` | `Lead` | Leads Web 2026 | `web_patrimonio` | — |
| `agenda` | `Schedule` | Leads Web 2026 | `web_agenda` | — |
| `guia` | `Lead` | Leads Web 2026 | `web_guia` | `guia-invertir-en-miami.pdf` ✅ |
| `club` | `CompleteRegistration` | Leads Web 2026 + Newsletter Web | `web_club` | *(a definir)* |
| `scorecard` | `CompleteRegistration` | Leads Web 2026 | `web_scorecard` | *(falta el PDF)* |
| `propiedad` | `Lead` | Leads Web 2026 | `web_propiedad` + `prop_<slug>` | `dossiers/<slug>.pdf` ✅ |
| `zona` | `Lead` | Leads Web 2026 | `web_zona` + `zona_<slug>` | — |
| `newsletter` | `Subscribe` | Newsletter Web (id 6) | `web_newsletter` | — |
| `radar` | `Subscribe` | Newsletter Web (id 6) | `web_radar` | — |

**Sobre el PDF de propiedad:** los 29 dossiers ya están en `/dossiers/<slug>.pdf`
y el payload trae `desarrollo_slug`, así que la URL se arma sola. No hace falta
una tabla de PDFs por proyecto ni mantenerla.

**Lo que falta en ActiveCampaign.** Hoy solo hay 3 listas (`BD-9.5K` id 4,
`Leads-Fondos-Inversion-2026` id 5, `Newsletter Web` id 6) y 8 tags, ninguno de
formularios web. La propuesta es **una lista nueva** —`Leads Web 2026`— para todo
lo que entra por el sitio, y tags por tipo. Así el newsletter no se mezcla con
quien pidió una sesión, que es lo que importa para segmentar los envíos.

---

## 4. Propiedades de HubSpot

### Las que ya existen y se reutilizan

| Propiedad | Uso |
|---|---|
| `origen` | Origen legible: `Google Ads · campaña X · término Y` |
| `estatus_art` (*Estatus DRE*) | Se pone en `Nuevo`. **No se toca después**: es el estado de venta |
| `hablame_de_ti_quiero_conocerte_mas` | Las respuestas de los campos calificadores, concatenadas |
| `hs_analytics_source` | Con la regla de abajo, ya no fijo en `PAID_SOCIAL` |
| `hs_facebook_click_id` | El `fbclid` |
| `hubspot_owner_id` | Camile Demboski = `176436235` |

### Las que hay que crear (18)

Ninguna existe hoy — comprobado por API. **Las creo yo** con la conexión de 41
scopes; no hace falta que las hagas a mano.

```
dst_gclid          dst_wbraid         dst_gbraid        dst_msclkid
dst_ttclid         dst_li_fat_id
dst_utm_source     dst_utm_medium     dst_utm_campaign  dst_utm_term
dst_utm_content
dst_form_type      dst_form_variant   dst_pagina_origen
dst_propiedad      dst_zona
dst_primer_contacto  dst_calidad_lead
```

El prefijo `dst_` es para que se distingan de un vistazo de las nativas de
HubSpot y de las que ya existían.

`dst_calidad_lead` es la marca de calidad del punto 8: `ok`, `correo_desechable`,
`telefono_invalido`, `patron_spam`. Va en propiedad aparte y **no** en
`estatus_art` a propósito: si se escribiera ahí, un lead marcado como spam
borraría el estado de venta que lleva el equipo a mano.

### La regla de `hs_analytics_source`

En orden; el primero que se cumple, gana:

| Condición | Valor |
|---|---|
| hay `gclid`, `wbraid` o `gbraid` | `PAID_SEARCH` |
| hay `fbclid`, o `utm_source` es facebook/instagram/meta | `PAID_SOCIAL` |
| `utm_medium` es `email` | `EMAIL_MARKETING` |
| hay cualquier otro `utm_source` | `OTHER_CAMPAIGNS` |
| hay referente externo | `REFERRALS` |
| nada de lo anterior | `DIRECT_TRAFFIC` |

---

## 5. Meta CAPI — la parte delicada

El evento server-side tiene que llevar el **mismo `event_id`** que generó el
navegador. Es lo único que le dice a Meta que el evento del Pixel y el de la CAPI
son el mismo; si Make genera uno nuevo, cada lead se cuenta dos veces.

**Aquí hay un detalle técnico que cambia el trabajo.** Los cuatro escenarios de
Meta que ya existen usan el módulo `facebook-conversion-leads:CreateALead`, que
es la **CAPI para CRM**: manda etapas de lead (`initial_lead`, `qualified_lead`)
identificadas por `lead_id`, y **no admite `event_id` ni eventos web** como
`Lead` o `Subscribe`.

Para lo que pide el Prompt 3 hace falta la **CAPI web**, que es otra cosa: un
POST a

```
https://graph.facebook.com/v21.0/27857783360524172/events
```

con `event_name`, `event_id`, `event_source_url`, `action_source: "website"` y
`user_data` con SHA-256. Se hace con el módulo HTTP de Make.

El Dataset ID es el mismo que el Pixel (`27857783360524172`, ya confirmado en
`tags.js`). **Lo único que falta es el token de acceso de la CAPI**, que se saca
del Administrador de Eventos de Meta. Es el único bloqueante real de todo esto.

Hasheado: correo y teléfono se normalizan **antes** de hashear (minúsculas, sin
espacios, teléfono en E.164 sin el `+`). El `fbclid` va como `fbc` con el formato
`fb.1.<timestamp>.<fbclid>` que exige Meta.

---

## 6. Manejo de errores

- Cada llamada a plataforma externa con `builtin:Resume` en su ruta de error —
  el patrón que ya usan los 20 escenarios. Si Meta CAPI truena, el lead igual
  llega a HubSpot y a Carlos.
- **Antiduplicados:** un Data Store con clave `correo + form_type` y TTL de 5
  minutos. Si la clave existe, se corta.
- **Ruta de error global:** correo a carlos.cataneo@destiny.mx cuando algo truene.
- Reintentos con espera creciente en HubSpot, ActiveCampaign y Meta.

---

## 7. El correo de aviso

Se copia el diseño del escenario 5837439, que ya está resuelto. Cambia el
contenido:

- Asunto escaneable en el celular: `💼 <tipo> — <nombre> (<origen legible>)`
- Nombre, correo, teléfono, qué formulario llenó
- Propiedad o zona si aplica
- **Origen legible, no el `gclid` crudo:** `Google Ads · campaña Preconstrucción ·
  término "departamentos miami"`
- Liga directa al contacto en HubSpot
- La marca de calidad si el lead salió sospechoso

---

## 8. Lo que falta para poder construirlo

| # | Qué | Por qué bloquea |
|---|---|---|
| 1 | **Token de acceso de la CAPI de Meta** | Sin él no hay evento server-side. Es el único bloqueante duro |
| 2 | Aprobar el mapeo de listas y tags de la sección 3 | Se crean solos una vez aprobados |
| 3 | PDF del Scorecard | El tipo `scorecard` promete un envío por correo y no hay archivo |
| 4 | ¿`club`, `preconstruccion` y `dolares` entregan algo? | Hoy sus páginas de gracias no prometen PDF; si no entregan nada, se cierra el punto |
| 5 | ¿El correo interno va solo a Carlos o también a Camile? | Los escenarios de Ads mandan a los dos |
