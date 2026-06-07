# Fase 1 — hPanel (lo que haces tú)

Dos cosas en este paso:
1. Conectar el dominio `destiny.mx` al Hostinger nuevo (donde despliega este repo).
2. Instalar WordPress en la carpeta `/blog`.

Antes de empezar confirma una cosa crítica: **el WordPress viejo de `destiny.mx` (el que sirve hoy) — ¿es la misma cuenta de Hostinger o es otro hosting / hPanel?** Si es la misma cuenta, vamos a desconectar el dominio del WP viejo. Si es otra cuenta, además hay que apagar el WP viejo o migrar primero los 46 posts antiguos antes del cutover (paso de Fase 3).

---

## 1A. Conectar `destiny.mx` al Hostinger del sitio nuevo

**Caso A — `destiny.mx` ya está en el mismo hPanel** (donde vive `aliceblue-parrot-804072.hostingersite.com`):
1. hPanel → **Dominios → Dominios**.
2. Ubica `destiny.mx`. Si dice "Apuntado a otro sitio", clic en **Cambiar sitio** y asígnalo a la cuenta del repo `destinyrealestate/mi-sitio-web` (la que despliega el HTML estático).
3. Espera ~5 min y verifica: `https://destiny.mx` debe servir `index.html` del repo.

**Caso B — `destiny.mx` está en otro hosting (probable, porque actualmente sirve WP distinto):**
1. En hPanel del Hostinger nuevo → **Dominios → Agregar dominio**.
2. Captura `destiny.mx`. Hostinger te dará 2 nameservers (algo como `ns1.dns-parking.com`, `ns2.dns-parking.com`).
3. En el panel de tu **registrador** (donde compraste el dominio: GoDaddy, Cloudflare, Namecheap, etc.) cambia los nameservers a los que te dio Hostinger. ⚠ Esto **rompe el WP viejo** una vez que propague (15 min a 24 h).
4. Mientras propaga, sigue con el paso 2 abajo — la URL temporal sigue siendo `https://aliceblue-parrot-804072.hostingersite.com/`.

> **No me des credenciales por chat.** Hazlo tú en hPanel; cuando termines me avisas y seguimos.

---

## 2. Instalar WordPress en `/blog`

1. hPanel → tu sitio → **Sitio web → Auto Installer** (o "Instalar WordPress").
2. Selecciona **WordPress**.
3. Campos:
   - **URL**: `https://destiny.mx` (o `https://aliceblue-parrot-804072.hostingersite.com` si todavía no propaga el DNS).
   - **Ruta / Directorio**: `blog`  ← **CRÍTICO**. Si lo dejas vacío instala en la raíz y borra el sitio HTML.
   - **Idioma**: `Español (México)` (es-MX).
   - **Título del sitio**: `Destiny Real Estate — Blog`.
   - **Usuario admin**: el que prefieras (no uses `admin`).
   - **Contraseña**: genera una fuerte y guárdala.
   - **Email admin**: tu email.
4. Clic **Instalar**. Tarda 1-2 min.
5. Verifica:
   - `https://destiny.mx/blog/` debe mostrar la página por defecto de WP ("¡Hola, mundo!").
   - `https://destiny.mx/blog/wp-admin` debe pedirte login.

---

## 3. Cuando termines, avísame con esto

Mándame un mensaje con:
- [ ] `destiny.mx` ya apunta al Hostinger nuevo (raíz sirve el HTML estático).
- [ ] WP instalado en `/blog`. Pude entrar a `/blog/wp-admin`.
- [ ] URL exacta del WP (debe ser `https://destiny.mx/blog/` — confírmalo).

Con eso arrancamos Fase 2 (configuración de WP, Elementor, importación del XML). Yo te paso paso a paso lo que haces en `wp-admin`.

---

## Riesgos / cosas a vigilar

- **Mientras propaga el DNS**: parte del tráfico verá el sitio viejo, parte el nuevo. Es normal. Dura horas.
- **No borres el WP viejo todavía** hasta haber exportado los 46 posts antiguos (Fase 3). Si no podemos exportar nativamente, te toca raspar (peor).
- **HTTPS**: Hostinger emite cert SSL automático al conectar el dominio. Verifica que `https://destiny.mx` cargue sin warning de certificado antes de seguir.
- **El `.htaccess`** que generé en la raíz del repo necesita que Apache de Hostinger lo respete (lo hace por defecto). Si después de cutover ves que las URLs `Articulo.html?post=X` no redirigen, verifica que `.htaccess` se subió y que el AllowOverride está habilitado.
