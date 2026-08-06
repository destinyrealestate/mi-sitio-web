#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DESTINY — generador de las páginas de captura y de agradecimiento.

Genera desde una sola plantilla:

  agenda.html     -> se sirve en destiny.mx/agenda      (tarea 3.1)
  club.html       -> se sirve en destiny.mx/club
  radar.html      -> se sirve en destiny.mx/radar
  scorecard.html  -> se sirve en destiny.mx/scorecard

  gracias-sesion.html     (tarea 1.4)
  gracias-scorecard.html
  gracias-club.html

Por qué un generador y no siete archivos a mano: el nav, el drawer y el footer
son idénticos en todas. Escritos a mano se desincronizan en la primera
edición. Aquí se editan una vez.

TODAS las rutas de recursos son root-absolutas (/assets/…). Es obligatorio:
estas páginas se sirven en rutas sin extensión (/agenda) y una ruta relativa
se rompería si alguien entra con diagonal final.

Después de correr este script hay que correr scripts/patch-head.py, que inyecta
el bloque de atribución y consentimiento y los atributos del <body>.

Uso:  python3 scripts/build-pages.py && python3 scripts/patch-head.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

WA = "https://api.whatsapp.com/send?phone=525611659009"

NAV = """<nav class="nav" id="nav" data-screen-label="Nav">
  <a class="nav__logo" href="/">
    <img class="logo-light" src="/assets/logo-light.png" alt="Destiny Real Estate" width="150" height="42">
    <img class="logo-dark" src="/assets/logo-dark.png" alt="Destiny Real Estate" width="150" height="42">
  </a>
  <div class="nav__links">
    <a class="nav__link" href="/#mapa">Colección</a>
    <a class="nav__link" href="/#zonas">Zonas</a>
    <a class="nav__link" href="/Marca.html">Residencias de marca</a>
    <a class="nav__link" href="/Inversion.html">Inversión</a>
    <a class="nav__link" href="/club">Club</a>
    <div class="nav__item">
      <a class="nav__link" href="/#firma">La Firma <span class="nav__caret">&#9662;</span></a>
      <div class="nav__menu">
        <a href="https://oscarchapatherealtor.com/" target="_blank" rel="noopener">Sobre Oscar Chapa <span>&#8594;</span></a>
        <a href="https://blog.destiny.mx/">Blog &amp; Análisis <span>&#8594;</span></a>
        <a href="/agenda">Contacto <span>&#8594;</span></a>
      </div>
    </div>
  </div>
  <div class="nav__cta">
    <a class="btn btn-gold" href="/agenda">Agendar sesión</a>
    <button class="nav__burger" id="burger" aria-label="Menú"><span></span><span></span><span></span></button>
  </div>
</nav>

<div class="drawer" id="drawer">
  <div class="drawer__top">
    <img src="/assets/logo-light.png" alt="Destiny Real Estate" style="height:24px;width:auto;">
    <button class="drawer__close" id="drawerClose" aria-label="Cerrar">&#10005;</button>
  </div>
  <div class="drawer__links">
    <a href="/#mapa" data-close>Colección</a>
    <a href="/#zonas" data-close>Zonas</a>
    <a href="/Marca.html" data-close>Residencias de marca</a>
    <a href="/Inversion.html" data-close>Inversión</a>
    <a href="/club" data-close>Miami Investors Club</a>
    <a href="/radar" data-close>Radar semanal</a>
  </div>
  <a class="btn btn-gold" href="/agenda" data-close>Agendar sesión</a>
</div>"""

FOOTER = """<footer class="foot" data-screen-label="Footer">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__brand">
        <img src="/assets/logo-light.png" alt="Destiny Real Estate" style="height:42px;width:auto;margin-bottom:22px;">
        <p>Más de 25 años curando los activos inmobiliarios de mayor protección patrimonial en Miami para el inversionista mexicano exigente.</p>
      </div>
      <div class="foot__col"><h4>Colección</h4><a href="/#mapa">Activos de legado</a><a href="/Marca.html">Residencias de marca</a><a href="/#zonas">Zonas</a><a href="/agenda">Listados off-market</a></div>
      <div class="foot__col"><h4>Recursos</h4><a href="/club">Miami Investors Club</a><a href="/radar">Radar semanal</a><a href="/scorecard">Scorecard de inversión</a><a href="https://blog.destiny.mx/">Blog &amp; análisis</a></div>
      <div class="foot__col"><h4>La Firma</h4><a href="https://oscarchapatherealtor.com/" target="_blank" rel="noopener">Sobre Oscar Chapa</a><a href="/Inversion.html#modelo">Cómo funciona</a><a href="/agenda">Contacto</a><a href="/privacidad.html">Aviso de Privacidad</a></div>
    </div>
    <div class="foot__bot"><span>&copy; 2026 Destiny Real Estate. Todos los derechos reservados. &middot; <a href="/privacidad.html" style="color:inherit;text-decoration:underline;">Aviso de Privacidad</a></span><span>Miami &middot; FL &middot; USA — Ciudad de México &middot; MX</span></div>
    <p class="foot__legal" style="margin-top:2px;font-size:12px;opacity:.6;max-width:90ch;">Información de mercado con fines informativos. No constituye asesoría de inversión, fiscal ni legal personalizada. Las proyecciones son rangos con escenarios, nunca promesas de rendimiento.</p>
  </div>
</footer>"""


def breadcrumb(name: str, path: str) -> str:
    return f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
 {{"@type":"ListItem","position":1,"name":"Inicio","item":"https://destiny.mx/"}},
 {{"@type":"ListItem","position":2,"name":"{name}","item":"https://destiny.mx{path}"}}]}}
</script>"""


def shell(*, filename, canonical, title, desc, body, extra_head="", noindex=False, ld=""):
    robots = '<meta name="robots" content="noindex, nofollow">\n' if noindex else ""
    canon = "" if noindex else f'<link rel="canonical" href="https://destiny.mx{canonical}">\n'
    og = "" if noindex else (
        '<meta property="og:type" content="website">\n'
        f'<meta property="og:title" content="{title}">\n'
        f'<meta property="og:description" content="{desc}">\n'
        '<meta property="og:image" content="https://destiny.mx/assets/img/og-default.jpg">\n'
        f'<meta property="og:url" content="https://destiny.mx{canonical}">\n'
        '<meta property="og:site_name" content="Destiny Real Estate">\n'
        '<meta property="og:locale" content="es_MX">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        f'<meta name="twitter:title" content="{title}">\n'
        f'<meta name="twitter:description" content="{desc}">\n'
        '<meta name="twitter:image" content="https://destiny.mx/assets/img/og-default.jpg">\n')

    html = f"""<!DOCTYPE html>
<html lang="es-MX">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
{robots}{canon}<link rel="icon" type="image/png" href="/favicon.png?v=2">
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
<meta name="description" content="{desc}">
{og}<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,500;1,600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/styles.css?v=52">
{extra_head}{ld}
</head>
<body>

{NAV}

{body}

{FOOTER}

<script src="/assets/data.js?v=45"></script>
<script>if (window.DESTINY && DESTINY.initShell) DESTINY.initShell();</script>
</body>
</html>
"""
    (ROOT / filename).write_text(html, encoding="utf-8")
    return filename


# Acordeón de preguntas frecuentes. assets/app.js lo resuelve solo en el home;
# aquí va autocontenido para no cargar el controlador completo del home.
FAQ_JS = """<script>
  document.querySelectorAll(".faq__item").forEach(function (item) {
    var q = item.querySelector(".faq__q"), a = item.querySelector(".faq__a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq__item.open").forEach(function (o) {
        o.classList.remove("open");
        var oa = o.querySelector(".faq__a"); if (oa) oa.style.maxHeight = null;
      });
      if (!open) { item.classList.add("open"); a.style.maxHeight = a.scrollHeight + "px"; }
    });
  });
</script>"""


def cta_section(*, sid, label, eyebrow, h2, inner, form):
    """Bloque de captura. Estructura obligatoria: `section dark` > `wrap cta` >
    `cta__left`. Los estilos de .cta__list y .cta__trust son crema sobre oscuro:
    fuera de una sección `dark` el texto queda invisible."""
    return f"""<section class="section dark" id="{sid}" data-screen-label="{label}">
  <div class="wrap cta">
    <div class="cta__left reveal">
      <span class="eyebrow">{eyebrow}</span>
      <h2 class="h-1" style="margin-top:16px;">{h2}</h2>
{inner}
    </div>
    {form}
  </div>
</section>"""


def formulario(tipo, heading, sub, note,
               secure="Tus datos están seguros. Nunca los compartimos con terceros.",
               attrs=""):
    """Contenedor declarativo de assets/forms.js. Ver FORMULARIOS.md.

    La leyenda del Aviso de Privacidad NO va aquí: la pone forms.js debajo del
    botón, en todos los formularios del sitio a la vez.
    """
    return f"""<div class="form reveal d1">
      <div class="form__head"><h3 class="h-3">{heading}</h3><span class="form__sub">{sub}</span></div>
      <p class="form__note">{note}</p>
      <div data-destiny-form="{tipo}"{attrs}></div>
      <p class="form__secure">&#128274; {secure}</p>
    </div>"""


def hero(eyebrow, h1, lede, img="/assets/img/hero-bluehour.jpg", alt="Miami al atardecer"):
    return f"""<header class="hero hero--zone" data-screen-label="Hero" style="min-height:auto;padding:150px 0 80px;">
  <div class="hero__bg"><img src="{img}" alt="{alt}" fetchpriority="high" width="1600" height="900"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,25,35,.80) 0%,rgba(16,25,35,.94) 100%);"></div></div>
  <div class="hero__inner wrap" style="max-width:900px;">
    <span class="eyebrow reveal in" style="color:var(--gold-bright);">{eyebrow}</span>
    <h1 class="h-display reveal in d1" style="margin-top:14px;">{h1}</h1>
    <p class="lede reveal in d2" style="margin-top:22px;">{lede}</p>
  </div>
</header>"""


# ============================================================
#  PÁGINAS DE CAPTURA
# ============================================================

def page_agenda():
    body = hero(
        "Sesión de claridad &middot; 30 minutos",
        'Tu próxima inversión empieza con una llamada <span class="serif-em">honesta.</span>',
        "En 30 minutos revisamos tu monto disponible, tu plazo y tu perfil de riesgo, y te decimos "
        "si Miami tiene sentido para tu capital, qué zona encaja y qué proyectos descartar antes de firmar. "
        "Sin costo y sin compromiso de compra.",
    ) + "\n\n" + cta_section(
        sid="agenda", label="Formulario de agenda", eyebrow="Qué obtienes",
        h2='Lo que sí pasa en <span class="serif-em">30 minutos.</span>',
        inner=f"""      <ul class="cta__list">
        <li>Análisis real de tu capacidad inversora, con números tuyos</li>
        <li>Recomendación de zona y tipo de activo según tu horizonte</li>
        <li>Acceso a inventario off-market verificado</li>
        <li>La lista de proyectos que descartamos y por qué</li>
        <li>Sin compromiso de compra</li>
      </ul>
      <ol class="next">
        <li><span class="s">1</span> Dejas tus datos en el formulario.</li>
        <li><span class="s">2</span> Te contactamos por WhatsApp en menos de 24 horas.</li>
        <li><span class="s">3</span> Agendamos tu sesión privada de 30 minutos.</li>
        <li><span class="s">4</span> Recibes tu análisis y los siguientes pasos, por escrito.</li>
      </ol>
      <p style="font-size:15px;margin:26px 0 0;color:rgba(250,249,243,.74);">
        ¿Prefieres escribir? <a href="{WA}&amp;text=Hola%2C%20quiero%20agendar%20una%20sesi%C3%B3n%20de%20claridad." target="_blank" rel="noopener" style="color:var(--gold-bright);">Escríbenos por WhatsApp</a>.
      </p>
      <div class="cta__trust" style="margin-top:26px;">+$500M USD vendidos &middot; 290+ clientes &middot; 25 años &middot; Cupo limitado por trimestre</div>""",
        form=formulario("agenda", "Agenda tu sesión", "Cupo limitado",
                        "Sesión de claridad sin costo ni compromiso."))
    return shell(filename="agenda.html", canonical="/agenda",
                 title="Agenda tu sesión de claridad — Destiny Real Estate",
                 desc="Sesión privada de 30 minutos, sin costo: revisamos tu monto, tu plazo y tu perfil de riesgo, y te decimos si Miami tiene sentido para tu capital.",
                 body=body, ld=breadcrumb("Agenda", "/agenda"))


def page_radar():
    body = hero(
        "Radar semanal &middot; Cada lunes",
        'Los números reales de Miami, <span class="serif-em">cada lunes en tu correo.</span>',
        "Una promesa, un campo. El mismo análisis con el que Oscar asesora a sus inversionistas: "
        "precios reales por zona, listados off-market antes de que salgan al mercado y la fuente de cada dato.",
        img="/assets/img/blog-skyline2.jpg", alt="Skyline de Miami",
    ) + f"""

<section class="section dark magnet" id="radar" data-screen-label="Alta al Radar">
  <div class="wrap magnet__in">
    <div class="reveal">
      <span class="eyebrow">Qué llega</span>
      <h2 class="h-1" style="margin:16px 0 18px;">Un correo. Un día. <span class="serif-em">Cero ruido.</span></h2>
      <ul class="magnet__pts">
        <li>Análisis de mercado semanal — precios reales por zona, no titulares</li>
        <li>Listados off-market antes de que lleguen a los portales</li>
        <li>La fuente de cada dato, siempre citada</li>
        <li>Cancela cuando quieras, con un clic</li>
      </ul>
      <p style="font-size:15px;margin-top:26px;color:rgba(250,249,243,.7);">
        No vendemos ni compartimos tu correo. No hay promesas de rendimiento: hay datos con su fuente.
      </p>
    </div>
    {formulario("radar", "Suscríbete al Radar", "Gratis",
                "Cada lunes. Cancela cuando quieras.",
                secure="Sin spam. Solo análisis que mueven tu patrimonio.")}
  </div>
</section>"""
    return shell(filename="radar.html", canonical="/radar",
                 title="Radar semanal de Miami — Destiny Real Estate",
                 desc="El análisis semanal de Oscar Chapa: precios reales por zona, listados off-market y la fuente de cada dato. Un correo cada lunes.",
                 body=body, ld=breadcrumb("Radar", "/radar"))


def page_club():
    promesas = [
        ("Radar semanal",
         "El análisis de mercado de cada lunes, con precios reales por zona y la fuente de cada dato."),
        ("Alertas de WhatsApp",
         "Aviso directo cuando entra un listado off-market o cambia el plan de pagos de un proyecto que sigues."),
        ("Scorecard de inversión",
         "El marco de evaluación con el que descartamos proyectos: desarrollador, plan de pagos, HOA, letra chica."),
        ("Acceso anticipado a listas de precios",
         "Las tablas por tipología antes de que el desarrollador las publique al mercado general."),
        ("Sesiones para miembros",
         "Llamadas periódicas de preguntas y respuestas, solo para el Club, con lectura de mercado en vivo."),
    ]
    cards = "\n".join(
        f"""      <div class="adv__card">
        <div class="adv__num">0{i+1}</div>
        <h3>{t}</h3>
        <p>{d}</p>
      </div>""" for i, (t, d) in enumerate(promesas))

    body = hero(
        "Miami Investors Club",
        'El círculo que ve los números <span class="serif-em">antes que el mercado.</span>',
        "No es una lista de correos: es el acceso a la información con la que decidimos qué proyectos "
        "entran a la colección y cuáles descartamos. Gratis, por invitación abierta.",
    ) + f"""

<section class="section dark" id="promesas" data-screen-label="Beneficios del Club">
  <div class="wrap">
    <div class="adv__head">
      <div class="reveal">
        <span class="eyebrow">Cinco accesos</span>
        <h2 class="h-1" style="margin-top:18px;">Qué incluye <span class="serif-em">la membresía</span></h2>
      </div>
      <p class="lede reveal d1">Sin costo. Sin letra chica. Puedes salirte cuando quieras, con un clic.</p>
    </div>
    <div class="adv__grid reveal d1">
{cards}
    </div>
  </div>
</section>

""" + cta_section(
        sid="alta", label="Alta al Club", eyebrow="Únete",
        h2='Entra al <span class="serif-em">Club.</span>',
        inner="""      <p class="lede">Deja tus datos y activamos tus cinco accesos. El Radar te llega el lunes siguiente.</p>
      <ul class="cta__list">
        <li>Sin costo y sin tarjeta</li>
        <li>Un solo correo a la semana, el lunes</li>
        <li>Puedes salirte con un clic, sin explicaciones</li>
      </ul>
      <div class="cta__trust">+$500M USD vendidos &middot; 290+ clientes &middot; 25 años en el mercado</div>""",
        form=formulario("club", "Entra al Miami Investors Club", "Sin costo",
                        "Activamos tus cinco accesos y te confirmamos por WhatsApp."))
    return shell(filename="club.html", canonical="/club",
                 title="Miami Investors Club — Destiny Real Estate",
                 desc="Radar semanal, alertas de WhatsApp, Scorecard de inversión, acceso anticipado a listas de precios y sesiones para miembros. Sin costo.",
                 body=body, ld=breadcrumb("Miami Investors Club", "/club"))


def page_scorecard():
    faq = [
        ("¿El Scorecard tiene costo?",
         "No. Se entrega a cambio de tu correo, para poder enviártelo y avisarte cuando lo actualicemos."),
        ("¿Sirve si todavía no sé en qué zona quiero comprar?",
         "Sí. El Scorecard evalúa el proyecto y al desarrollador, no la zona. Se aplica igual en Brickell que en Sunny Isles."),
        ("¿Es asesoría de inversión?",
         "No. Es un marco de evaluación e información de mercado. No sustituye asesoría fiscal, legal ni de inversión personalizada."),
    ]
    # Misma estructura que el acordeón del home (assets/app.js engancha .faq__q).
    faq_html = "\n".join(
        f"""      <div class="faq__item"><button class="faq__q" type="button">{q}<span class="pm">+</span></button>"""
        f"""<div class="faq__a"><p>{a}</p></div></div>""" for q, a in faq)
    faq_ld = ",\n".join(
        '  {"@type":"Question","name":"%s","acceptedAnswer":{"@type":"Answer","text":"%s"}}' % (q, a)
        for q, a in faq)

    ld = breadcrumb("Scorecard", "/scorecard") + f"""
<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
{faq_ld}]}}
</script>"""

    body = hero(
        "Scorecard de inversión",
        'Las 27 preguntas que le hacemos a un proyecto <span class="serif-em">antes de recomendarlo.</span>',
        "El mismo marco con el que descartamos la mayoría de los desarrollos que nos presentan: "
        "desarrollador, plan de pagos, HOA, licencia de marca y letra chica. Para que puedas evaluar "
        "cualquier proyecto sin depender de quien te lo vende.",
    ) + "\n\n" + cta_section(
        sid="descarga", label="Descarga del Scorecard", eyebrow="Qué evalúa",
        h2='Cinco frentes, <span class="serif-em">una decisión.</span>',
        inner="""      <ul class="cta__list">
        <li><strong>Desarrollador</strong> — historial de entregas, litigios y capacidad financiera</li>
        <li><strong>Estructura de pagos</strong> — depósitos, hitos y qué pasa si el proyecto se retrasa</li>
        <li><strong>Costos recurrentes</strong> — HOA, impuestos, seguros y fees de licencia de marca</li>
        <li><strong>Letra chica</strong> — cláusulas de rescisión, cambios de plano y reventa antes de la entrega</li>
        <li><strong>Salida</strong> — liquidez real del producto en reventa, no la proyectada en el brochure</li>
      </ul>
      <p style="font-size:15px;margin:0 0 26px;color:rgba(250,249,243,.74);">
        Te lo enviamos por correo en cuanto dejes tus datos.
      </p>
      <div class="cta__trust">Es el mismo marco con el que descartamos proyectos, no una versión reducida</div>""",
        form=formulario("scorecard", "Recibe el Scorecard", "Gratis",
                        "Te lo enviamos por correo. Tres datos y listo.")) + f"""

<section class="section" id="faq" data-screen-label="Preguntas frecuentes">
  <div class="wrap" style="max-width:840px;">
    <span class="eyebrow reveal">Preguntas frecuentes</span>
    <h2 class="h-1 reveal" style="margin:14px 0 30px;">Lo que <span class="serif-em">siempre nos preguntan.</span></h2>
    <div class="faq reveal d1">
{faq_html}
    </div>
  </div>
</section>"""
    return shell(filename="scorecard.html", canonical="/scorecard",
                 title="Scorecard de inversión en Miami — Destiny Real Estate",
                 desc="Las 27 preguntas que le hacemos a un proyecto antes de recomendarlo: desarrollador, plan de pagos, HOA, letra chica y salida. Gratis.",
                 body=body + "\n\n" + FAQ_JS, ld=ld)


# ============================================================
#  PÁGINAS DE AGRADECIMIENTO
# ============================================================

# Escape de iframe. Se puso cuando el formulario vivía en un iframe de Zoho y
# la redirección se quedaba atrapada dentro del recuadro. Ya no hay iframes,
# pero se conserva: cuesta una línea y sigue cubriendo el caso de que alguien
# incruste la página de gracias desde fuera.
IFRAME_ESCAPE = """<script>
  /* Escape de iframe: la página de gracias nunca debe quedarse dentro de un
     recuadro. Si se queda, la conversión no se mide. */
  if (window.top !== window.self) { window.top.location = window.location.href; }
</script>"""


def page_gracias(*, filename, form_type, eyebrow, h1, lede, cta_txt, cta_href, wa_msg, extra="", title=None):
    body = f"""<header class="hero hero--zone" data-screen-label="Gracias" style="min-height:auto;padding:160px 0 90px;">
  <div class="hero__bg"><img src="/assets/img/hero-bluehour.jpg" alt="Miami al atardecer" fetchpriority="high" width="1600" height="900"><div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,25,35,.82) 0%,rgba(16,25,35,.94) 100%);"></div></div>
  <div class="hero__inner wrap" style="max-width:760px;">
    <span class="eyebrow reveal in" style="color:var(--gold-bright);">{eyebrow}</span>
    <h1 class="h-display reveal in d1" style="margin-top:14px;">{h1}<span id="gName"></span><span class="serif-em">.</span></h1>
    <p class="lede reveal in d2" id="gLede" style="margin-top:22px;">{lede}</p>
{extra}
    <div class="hero__actions reveal in d3" style="margin-top:34px;">
      <a class="btn btn-gold" id="waBtn" href="{WA}&amp;text={wa_msg}" target="_blank" rel="noopener">Continuar por WhatsApp <span class="ar">&#8594;</span></a>
      <a class="btn btn-ghost" href="{cta_href}">{cta_txt}</a>
    </div>
  </div>
</header>"""
    return shell(filename=filename, canonical="/" + filename, noindex=True,
                 title=title or "Gracias — Destiny Real Estate",
                 desc="Recibimos tus datos. Te contactamos en menos de 24 horas.",
                 body=body, extra_head=IFRAME_ESCAPE + "\n")


def main() -> int:
    out = [
        page_agenda(), page_club(), page_radar(), page_scorecard(),
        page_gracias(filename="gracias-sesion.html", form_type="sesion",
                     eyebrow="Solicitud recibida",
                     h1="Tu sesión está en proceso",
                     lede="Recibimos tus datos. Oscar o su equipo te contacta por WhatsApp en menos de 24 horas para "
                          "cerrar la fecha de tu sesión de claridad — sin costo y sin compromiso.",
                     cta_txt="Ver la colección", cta_href="/#mapa",
                     title="Sesión agendada — Destiny Real Estate",
                     wa_msg="Hola%2C%20acabo%20de%20agendar%20una%20sesi%C3%B3n%20y%20quiero%20confirmar%20la%20fecha."),
        page_gracias(filename="gracias-scorecard.html", form_type="scorecard",
                     eyebrow="Scorecard en camino",
                     h1="Tu Scorecard va a tu correo",
                     lede="Revisa tu bandeja en los próximos minutos. Si no llega, mira la carpeta de promociones o "
                          "escríbenos por WhatsApp y te lo mandamos directo.",
                     cta_txt="Entrar al Club", cta_href="/club",
                     title="Scorecard enviado — Destiny Real Estate",
                     wa_msg="Hola%2C%20ped%C3%AD%20el%20Scorecard%20y%20quiero%20que%20me%20lo%20env%C3%ADen%20por%20aqu%C3%AD.",
                     extra="""
    <div class="reveal in d2" style="margin-top:34px;padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(16,25,35,.34);">
      <div style="font-family:var(--sans);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold-bright);">Siguiente paso</div>
      <div style="font-family:var(--serif);font-size:clamp(19px,2.2vw,25px);margin-top:8px;color:#fff;">Aplica el Scorecard a un proyecto real</div>
      <p style="font-size:14px;opacity:.82;margin-top:8px;">En tu sesión de claridad lo llenamos juntos sobre el proyecto que estés considerando.</p>
      <a class="btn btn-gold" href="/agenda" style="margin-top:16px;">Agendar mi sesión <span class="ar">&#8594;</span></a>
    </div>"""),
        page_gracias(filename="gracias-club.html", form_type="club",
                     eyebrow="Ya eres del Club",
                     h1="Estás dentro",
                     lede="Tus cinco accesos quedaron activos. El Radar semanal te llega el lunes siguiente y las "
                          "alertas de WhatsApp empiezan a correr desde hoy.",
                     cta_txt="Ver la colección", cta_href="/#mapa",
                     title="Bienvenido al Club — Destiny Real Estate",
                     wa_msg="Hola%2C%20acabo%20de%20entrar%20al%20Miami%20Investors%20Club."),
    ]
    for f in out:
        print("escrito:", f)
    print("\nAhora corre:  python3 scripts/patch-head.py")
    return 0


if __name__ == "__main__":
    sys.exit(main())
