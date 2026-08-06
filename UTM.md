# Convención de UTM — Destiny Real Estate

Una sola forma de etiquetar. Si cada pieza se etiqueta a mano, el reporte no
sirve: `Instagram`, `instagram` e `IG` se cuentan como tres fuentes distintas.

**Todo en minúsculas, sin acentos, separado con guiones.**

---

## Los cinco parámetros

| Parámetro | Qué es | Valores permitidos |
|---|---|---|
| `utm_source` | **plataforma** | `instagram` · `facebook` · `youtube` · `linkedin` · `whatsapp` · `tiktok` · `newsletter` · `google` · `email` |
| `utm_medium` | **tipo de pieza** | `reel` · `story` · `post` · `carrusel` · `bio` · `video` · `descripcion` · `email` · `cpc` · `organico` · `dm` |
| `utm_campaign` | **semana ISO** | `2026-w31` — año y número de semana ISO, siempre así |
| `utm_content` | **identificador de pieza** | `och-reel-01` · `dre-tactico-03` · `blog-hoa-letra-chica` |
| `utm_term` | palabra clave | solo en búsqueda pagada. En orgánico se deja vacío |

### Por qué la semana ISO en `utm_campaign`

Porque la parrilla es semanal. Con `2026-w31` se puede responder "qué semana
generó más sesiones agendadas" sin cruzar hojas de cálculo. El año va delante
para que ordene bien alfabéticamente.

### El prefijo de `utm_content`

- `och-` — piezas de Oscar Chapa (reels, videos, LinkedIn)
- `dre-` — piezas de la marca Destiny Real Estate (tácticos, stories)
- `blog-` — artículos del blog
- `nl-` — enlaces dentro del newsletter

---

## Reglas que no se rompen

1. **Nunca etiquetar enlaces internos.** Un UTM en un enlace de destiny.mx a
   destiny.mx **rompe la sesión en GA4**: se cuenta como una visita nueva y la
   atribución original se pierde. Los UTM son solo para enlaces que entran al
   sitio desde afuera.
2. **El destino es una ruta corta.** `destiny.mx/agenda`, `/club`, `/radar`,
   `/scorecard`. Nunca un ancla del home.
3. **Los cinco parámetros o ninguno.** Media etiqueta es peor que nada.
4. **No inventar valores.** Si falta una plataforma o un tipo de pieza, se
   agrega primero a este documento y a `scripts/build-utm.py`.

---

## El generador

Para que el equipo de contenido no arme las URLs a mano:

```bash
# 1. Plantilla de CSV
python3 scripts/build-utm.py --plantilla > parrilla-2026-w31.csv

# 2. Llenar el CSV (una fila por pieza)

# 3. Generar las URLs
python3 scripts/build-utm.py parrilla-2026-w31.csv

# 4. O directo a un CSV con la columna de URL agregada
python3 scripts/build-utm.py parrilla-2026-w31.csv --salida urls-2026-w31.csv
```

El script **valida** contra las listas de valores permitidos de este documento y
falla con un mensaje claro si una fila tiene `utm_source: IG` o
`utm_campaign: julio`. Ese es el punto: que no se cuele.

Una URL suelta, sin CSV:

```bash
python3 scripts/build-utm.py --una /agenda instagram reel 2026-w31 och-reel-01
```

---

## Ejemplos

| Pieza | URL etiquetada |
|---|---|
| Reel de Oscar, semana 31 | `https://destiny.mx/agenda?utm_source=instagram&utm_medium=reel&utm_campaign=2026-w31&utm_content=och-reel-01` |
| Bio de Instagram | `https://destiny.mx/club?utm_source=instagram&utm_medium=bio&utm_campaign=2026-w31&utm_content=dre-bio` |
| Descripción de YouTube | `https://destiny.mx/scorecard?utm_source=youtube&utm_medium=descripcion&utm_campaign=2026-w31&utm_content=och-video-hoa` |
| Newsletter del lunes | `https://destiny.mx/agenda?utm_source=newsletter&utm_medium=email&utm_campaign=2026-w31&utm_content=nl-cta-principal` |
| Google Ads | el `gclid` lo pone Google. **No agregar UTM a mano en Ads**: usa el etiquetado automático |

---

## Qué pasa con la etiqueta

`assets/attribution.js` guarda los cinco parámetros en cookies de dominio
`.destiny.mx` por 90 días. Sobreviven a:

- la navegación entre `destiny.mx` y `blog.destiny.mx`
- visitas directas posteriores (una visita sin UTM **no borra** la original)
- el envío del formulario nativo (viaja en el objeto `atribucion` del payload)

Y viajan con **cada** evento del `dataLayer`. Ver `MEDICION.md`.
