# Guía — Blog en WordPress + Elementor Pro (subdirectorio `/blog`)

Arquitectura objetivo:

```
destiny.mx/              → sitio HTML estático (lo que ya tienes en Hostinger)
destiny.mx/blog/         → WordPress + Elementor Pro (solo el blog)
```

El sitio principal **sigue siendo HTML**. WordPress vive aislado en `/blog` y solo sirve el blog. Así obtienes la velocidad del HTML y la facilidad de publicar del WP.

> **Archivos de este paquete (carpeta `wordpress/`):**
> - `destiny-blog-export.xml` — importación de los **5 análisis premium 2026** (contenido completo).
> - `destiny-elementor-kit.css` — CSS que replica el diseño del sitio en el blog.
> - `GUIA-WORDPRESS-BLOG.md` — este documento.

---

## 1. Instalar WordPress en `/blog` (Hostinger)

1. Entra a **hPanel** → tu sitio `aliceblue-parrot-...` (o `destiny.mx`).
2. **Sitio web → Instalar WordPress** (Auto Installer).
3. En **"Directorio / ruta de instalación"** escribe: `blog`
   → quedará en `https://destiny.mx/blog`. **No lo instales en la raíz** (sobrescribiría tu sitio HTML).
4. Crea usuario admin y contraseña fuerte. Idioma: **Español (México)**.
5. Termina la instalación y entra a `https://destiny.mx/blog/wp-admin`.

> Si tu HTML está en `public_html/`, WordPress quedará en `public_html/blog/`. Tu `index.html` de la raíz no se toca.

---

## 2. Tema + Elementor

1. **Apariencia → Temas → Añadir** → instala y activa **"Hello Elementor"** (tema base mínimo, ideal para Elementor).
2. **Plugins → Añadir** → instala y activa **Elementor**.
3. Sube e instala **Elementor Pro** (tu licencia) → **Plugins → Añadir → Subir Plugin** → activa con tu clave. *(El Theme Builder de header/footer/single requiere Pro.)*
4. Recomendado: instala **Rank Math** o **Yoast SEO** (SEO) y **Redirection** (para los redirects del paso 9).

---

## 3. Permalinks (URLs limpias)

**Ajustes → Enlaces permanentes → "Nombre de la entrada"** (`/%postname%/`).
Como WordPress está en `/blog`, las entradas quedarán automáticamente en:

```
destiny.mx/blog/nombre-del-articulo/
```

Esto coincide con los enlaces internos del archivo de importación. **Importante hacerlo ANTES de importar.**

---

## 4. Cargar las fuentes de marca

El sitio usa **Playfair Display** (títulos) + **Outfit** (texto). Dos opciones:

- **Fácil:** Elementor ya trae Google Fonts. En el paso 5 las eliges desde el selector.
- **Custom Fonts (opcional, más control):** Elementor Pro → *Custom Fonts*, o usa el plugin *OMGF* para auto-alojar Google Fonts (mejor rendimiento/GDPR).

---

## 5. Global Kit de Elementor (colores + tipografía)

**Elementor → (cualquier página) → Editar con Elementor → ☰ menú → Configuración del sitio → Colores globales / Fuentes globales.**

### Colores globales (pega estos HEX)

| Rol Elementor | Nombre | HEX |
|---|---|---|
| Primary | Oro de marca | `#C5A058` |
| Secondary | Navy primario | `#1A2E50` |
| Text | Azul-gris texto | `#3F516B` |
| Accent | Tinta (titulares) | `#13192A` |
| *(custom)* | Marfil base (fondo) | `#FAF9F3` |
| *(custom)* | Marfil profundo | `#EDEADD` |
| *(custom)* | Oro claro | `#D8BC83` |
| *(custom)* | Navy footer | `#101923` |

### Fuentes globales

| Rol | Familia | Peso |
|---|---|---|
| Primary (Headings) | **Playfair Display** | 600 |
| Secondary (Text) | **Outfit** | 400 |
| Text | Outfit | 400 |
| Accent | Playfair Display | 600 |

### Escala tipográfica (Site Settings → Tipografía)

| Elemento | Familia | Tamaño (desktop) | Interlineado |
|---|---|---|---|
| H1 | Playfair Display 600 | 48–56px | 1.1 |
| H2 | Playfair Display 600 | 34–40px | 1.12 |
| H3 | Playfair Display 600 | 24–28px | 1.2 |
| Body | Outfit 400 | 17px | 1.78 |

> Estos valores ya están alineados con el `styles.css` del sitio (paleta "Brand Guidelines V2").

---

## 6. Aplicar el CSS del kit

**Apariencia → Personalizar → CSS adicional** → pega TODO el contenido de
`wordpress/destiny-elementor-kit.css` → **Publicar**.

Esto estiliza automáticamente el cuerpo de los artículos (citas, tablas, listas, botones) para que se vean como el sitio, sin maquetar a mano.

---

## 7. Header y Footer iguales al sitio (Theme Builder)

**Elementor → Theme Builder → Header → Añadir nuevo.**

- **Logo:** sube `assets/logo-dark.png` (sobre fondo claro) → enlázalo a `https://destiny.mx/` (regresa al sitio HTML).
- **Menú:** crea un menú con enlaces **al sitio HTML** (no a páginas WP):
  - Colección → `https://destiny.mx/#mapa`
  - Zonas → `https://destiny.mx/#zonas`
  - Residencias de marca → `https://destiny.mx/Marca.html`
  - Inversión → `https://destiny.mx/Inversion.html`
  - Blog → `https://destiny.mx/blog/` (página actual)
  - Botón dorado "Agendar sesión" → `https://destiny.mx/#agenda` (clase `is-gold`)
- **Condición de visualización:** *Todo el sitio*.

**Footer → Añadir nuevo** — replica el footer del sitio:
- Logo claro (`logo-light.png`) sobre fondo navy `#101923` (clase `destiny-dark`).
- Columnas: Colección / Inversión / La Firma (mismos enlaces que el footer HTML).
- Línea inferior: `© 2026 Destiny Real Estate…` + enlace **Aviso de Privacidad** → `https://destiny.mx/privacidad.html`.
- Condición: *Todo el sitio*.

---

## 8. Plantillas de Single y Archivo

**Theme Builder → Single Post → Añadir nuevo:**
- Estructura: Título (H1 Playfair) + meta (autor "Oscar Chapa" + fecha, color oro) + imagen destacada + **Post Content** (hereda el CSS del kit) + bloque CTA al final (sección `destiny-dark` con botón "Agendar sesión de claridad" → `https://destiny.mx/#agenda`).
- Condición: *Todas las entradas*.

**Theme Builder → Archive → Añadir nuevo:**
- Grid de **Posts** (widget) en tarjetas (clase `destiny-post-card`): imagen, categoría, título, fecha.
- Condición: *Todos los archivos* (o solo la categoría del blog).

---

## 9. Importar los 5 artículos premium (2026)

1. **Herramientas → Importar → WordPress → Instalar/Ejecutar el importador.**
2. Sube `wordpress/destiny-blog-export.xml`.
3. Asigna el autor a **Oscar Chapa** (o créalo) y marca **"Descargar e importar archivos adjuntos"**.
4. Importa. Quedarán publicados con sus fechas y categorías ("Análisis" / "Residencias de marca").
5. Revisa cada uno y asígnale **imagen destacada** (puedes reutilizar las del sitio en `assets/img/`).

---

## 10. Migrar los 46 artículos antiguos (2021–2025)

Esos posts **ya viven en tu WordPress original** (`destiny.mx/blog/tips-invertir/...`). La forma correcta y sin pérdida de calidad **no es rasparlos**, es exportarlos nativamente:

1. En el **WordPress original** (donde está el blog viejo): **Herramientas → Exportar → "Entradas" → Descargar archivo de exportación** (genera un WXR con contenido, imágenes, fechas y SEO intactos).
2. En el **WordPress nuevo de `/blog`**: **Herramientas → Importar** ese archivo.
3. Ajusta categorías y revisa imágenes destacadas.

> Si **no tienes acceso** al WordPress original o ya no existe, avísame: puedo extraer los 46 artículos desde sus URLs en vivo y armarte un segundo `.xml` (con la advertencia de que el raspado puede requerir limpieza manual). La exportación nativa siempre será superior.

---

## 11. Enlazar el blog con el sitio HTML

En tu sitio HTML, actualiza los enlaces a "Blog" para que apunten al WordPress:

- En `index.html`, `Marca.html`, `Inversion.html`, `Propiedad.html`, etc.: cambia `Blog.html` → `/blog/`.
- Mantén `Blog.html` como respaldo o conviértelo en una redirección a `/blog/`.

*(Si quieres, hago yo este reemplazo en todas las páginas cuando el blog esté arriba.)*

---

## 12. SEO y redirecciones (no pierdas posicionamiento)

- **Redirección 301** de las URLs viejas a las nuevas con el plugin *Redirection*:
  - `…/articulo/?art=SLUG` → `…/blog/SLUG/`
  - `…/blog/tips-invertir/SLUG/` → `…/blog/SLUG/`
- **Sitemap:** activa el sitemap de Rank Math/Yoast del blog y añádelo en Google Search Console. Añade `https://destiny.mx/blog/` al `robots.txt` y al `sitemap.xml` del sitio.
- **Canonical:** deja que Rank Math/Yoast gestione canónicas del blog.
- **Meta por post:** los excerpts del import sirven como meta description inicial; afínalos en Rank Math.

---

## Checklist rápido

- [ ] WordPress instalado en `/blog`
- [ ] Elementor + Elementor Pro activos
- [ ] Permalinks = "Nombre de la entrada"
- [ ] Global Colors + Fonts cargados (tabla del paso 5)
- [ ] CSS del kit pegado en *CSS adicional*
- [ ] Header + Footer (Theme Builder) iguales al sitio
- [ ] Single + Archive templates
- [ ] Importado `destiny-blog-export.xml` (5 posts)
- [ ] Exportados/importados los 46 posts antiguos
- [ ] Enlaces "Blog" del sitio HTML → `/blog/`
- [ ] Redirecciones 301 + sitemap en Search Console
