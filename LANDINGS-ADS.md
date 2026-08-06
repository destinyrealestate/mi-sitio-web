# Landings de Google Ads — fase 1

Construidas el 4 de agosto de 2026 a partir de la *Guía de construcción · Las 2
landing pages · Fase 1 Google Ads*. Este documento es el puente entre lo que ya
está hecho y lo que falta para poder encender las campañas.

Complementa `MEDICION.md` (etiquetas, conversiones, campos de CRM) y `UTM.md`.

---

## 1. Lo que se entregó

| Archivo | URL limpia | Qué es |
|---|---|---|
| `preconstruccion-miami.html` | `/preconstruccion-miami` | Landing 1 — campaña de preconstrucción genérica (30% del presupuesto) |
| `invertir-en-dolares.html` | `/invertir-en-dolares` | Landing 2 — campaña de patrimonio en dólares (20%) |
| `gracias-preconstruccion.html` | `/gracias-preconstruccion` | Gracias de la landing 1 · dispara la conversión |
| `gracias-dolares.html` | `/gracias-dolares` | Gracias de la landing 2 · dispara la conversión |
| `Guia.html` | `/guia` y `/Guia.html` | Lead magnet — repara el 404 del anexo 06 |
| `gracias-guia.html` | `/gracias-guia` | Gracias de la guía · descarga |

También se tocó:

- `assets/styles.css` — bloque nuevo al final (`.nav--lp`, `.lp-table`,
  `.lp-steps`, `.lp-fine`, `.lp-ticket`, `.lp-disc`, `.lp-sticky`, `.hl--3`).
  Si un día se retiran las campañas, se borra ese bloque y el resto del sitio
  no se entera.
- `.htaccess` — rutas limpias de las seis páginas.
- `scripts/build-sitemap.py` — las dos landings y `/guia` entran al sitemap.
  Las páginas de gracias NO: son `noindex`.
- `scripts/check-links.py` — las rutas limpias nuevas en `RUTAS_LIMPIAS`.

---

## 2. Lo que FALTA antes de encender las campañas

### 2.1 El formulario calificador — resuelto el 2026-08-05

Ya no hace falta crear nada en Zoho: **Zoho se eliminó del sitio**. Las cinco
páginas montan el formulario nativo de `assets/forms.js`, con los cinco campos
que pedía la campaña:

| # | Campo | Tipo |
|---|---|---|
| 1 | Nombre completo | Texto |
| 2 | WhatsApp | Teléfono |
| 3 | Correo | Email |
| 4 | ¿Con cuánto capital cuentas para invertir? | Menos de $100,000 · $100,000–250,000 · $250,000–500,000 · Más de $500,000 USD |
| 5 | ¿Cuándo planeas invertir? | En los próximos 30 días · En 3 a 6 meses · Solo estoy explorando |

La primera opción del campo 4 sigue existiendo a propósito: es donde el no
calificado se auto-etiqueta.

Los 16 campos ocultos tampoco hacen falta. La atribución completa —los cinco
click IDs, los cinco UTM, el referrer y la landing— viaja en el objeto
`atribucion` del JSON que se manda al webhook. Ver `FORMULARIOS.md`.

Cómo está montado, por variante de `lead`:

| Página | Contenedor | Gracias |
|---|---|---|
| `preconstruccion-miami.html` (×2) | `data-variant="preconstruccion"` | `/gracias-preconstruccion` |
| `invertir-en-dolares.html` (×2) | `data-variant="dolares"` | `/gracias-dolares` |
| `Guia.html` | `data-destiny-form="guia"` | `/gracias-guia` |

La página de gracias ya no se configura en ningún panel: la decide el tipo o la
variante en `forms.js`, y se puede sobrescribir por página con `data-gracias`.

**Lo que sí sigue bloqueante:** la constante `MAKE_WEBHOOK_URL` de
`assets/forms.js` es todavía un placeholder. Hasta que el escenario de Make
exista, el formulario valida, mide y redirige, pero el lead no se guarda en
ningún lado.

### 2.2 Las conversiones de Google Ads

La etiqueta base `AW-18368975159` ya sale por código desde `assets/tags.js`.
Falta crear en **GTM** una etiqueta de conversión con su rótulo por cada campaña,
activada por el evento `generate_lead` del dataLayer y filtrada por `form_type`:

| form_type | Campaña |
|---|---|
| `preconstruccion` | Preconstrucción genérica |
| `dolares` | Patrimonio en dólares |
| `guia` | Marca / remarketing (conversión suave) |

Verificado localmente: al abrir una página de gracias, el dataLayer recibe
`generate_lead` con su `form_type`, su `desarrollo` y el `gclid` de la cookie.

**Recordatorio que no se puede romper:** mientras `GTM_ADMINISTRA_ETIQUETAS` sea
`false` en `tags.js`, NO crear en GTM etiquetas de GA4, del Pixel ni la etiqueta
base de Ads. Solo las de conversión.

### 2.3 El PDF de la guía

`gracias-guia.html` espera el archivo en:

```
/dossiers/guia-invertir-en-miami.pdf
```

Mientras no exista, el botón de descarga **no se muestra** (hay un guardián que
hace un HEAD al archivo) y la página entrega la guía por WhatsApp. En cuanto se
suba el PDF a esa ruta, el botón aparece solo. No hay que editar nada.

Contenido pedido por la guía de construcción: 10–15 páginas — los costos reales,
la letra chica del contrato, la estructura LLC + fideicomiso, el financiamiento
para extranjeros y los cinco errores más caros. Sin porcentajes de retorno.

---

## 3. El dato que caduca

`invertir-en-dolares.html`, bloque 2, usa un tipo de cambio de referencia:

> **$17.32 MXN por dólar** — cierre oficial de Banxico del 3 de agosto de 2026.

Está marcado en el HTML con un comentario de caja. **Revisar cada trimestre.** Al
actualizarlo hay que mover tres cosas: el texto, el ejemplo numérico y la fecha
del pie del bloque.

**Ojo con el ancla histórica.** La guía de construcción decía «hace diez años, un
dólar costaba alrededor de trece pesos». Diez años atrás (2016) el dólar rondaba
los 18–19 pesos, no trece: con esa redacción el argumento se cae solo, y en una
página cuya tesis es la transparencia eso cuesta caro. Los trece pesos
corresponden a 2014, así que la página dice **«hace doce años»** y fecha el
ejemplo en 2014. Confirmar ambos datos contra la serie histórica de Banxico antes
de publicar.

---

## 4. Criterios de aceptación

Verificados en local antes de desplegar:

- [x] Estructura HTML y JSON-LD válidos en las seis páginas.
- [x] Sin desbordamiento horizontal a 1425 px ni a 375 px.
- [x] `scripts/check-links.py` sin roturas.
- [x] El H1 de cada landing contiene la keyword principal de su campaña.
- [x] Entrando por `?gclid=PRUEBA123`, el `gclid`, los UTM y el `form_type`
      llegan al payload del formulario nativo (verificado el 2026-08-05).
- [x] La página de gracias emite `generate_lead` al dataLayer con su `form_type`.
- [x] El escape de iframe de las páginas de gracias funciona.
- [x] Barrido de compliance: cero promesas de retorno, cero «garantizado» y cero
      «asegurado» en el texto visible.
- [x] Sin menú de navegación; un solo CTA repetido, con barra fija en móvil.

Pendientes de verificar **después** del despliegue:

- [ ] Ambas URLs responden 200 y cargan en menos de 2 s en móvil
      (`python3 scripts/check-links.py --live`).
- [ ] El lead con su `gclid` llega hasta HubSpot (depende de 2.1).
- [ ] La conversión aparece en Google Ads en menos de 24 h (depende de 2.2).
- [ ] Revisadas en iPhone y Android reales, no solo en el simulador.

---

## 5. Nota sobre el barrido de compliance

El barrido debe correrse sobre el **texto visible**, no sobre el HTML crudo. Las
dos landings llevan comentarios internos que contienen a propósito las palabras
prohibidas — son la advertencia para quien edite la página en el futuro:

```
⛔ NUNCA agregar una columna de rendimiento, retorno esperado o %.
```

Un `grep` sobre el archivo los reporta como falsos positivos. El disclaimer
obligatorio de la landing 2 también contiene «no garantiza», que es justamente lo
contrario de una promesa y debe quedarse literal.
