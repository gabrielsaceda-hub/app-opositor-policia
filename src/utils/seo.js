const SITE_ORIGIN = 'https://app-opositor-policia-bay.vercel.app'

export const PUBLIC_TABS = new Set(['inicio', 'guia', 'calculadora', 'ritmo', 'sobre', 'privacidad'])

const SEO_BY_TAB = {
  inicio: {
    title: 'App Opositor Policía | Entrenamiento, nutrición y calendario',
    description:
      'Planificador gratuito de entrenamiento para oposiciones policiales: calculadora de marcas y baremos, calendario, nutrición deportiva y ranking.',
  },
  guia: {
    title: 'Guía de pruebas físicas: Policía Nacional, Guardia Civil y Policía Local',
    description:
      'Cómo funcionan las pruebas físicas de Policía Nacional, Guardia Civil y Policía Local de Madrid: baremos, marcas mínimas y consejos.',
  },
  calculadora: {
    title: 'Calculadora de baremos: nota de físicas Policía Nacional, Local y Guardia Civil',
    description:
      'Calcula gratis tu nota en las pruebas físicas: baremos de Policía Nacional, Policía Local de Madrid y Guardia Civil por sexo y edad.',
  },
  ritmo: {
    title: 'Calculadora de ritmos 800 y 1000 metros | Parciales de carrera',
    description:
      'Calcula gratis tus parciales de carrera: introduce tu marca de 800 metros y obtén ritmos objetivo por distancia y fase de temporada.',
  },
  sobre: {
    title: 'Contacto | App Opositor Policía',
    description: 'Contacta con App Opositor Policía y envía correcciones de baremos con su fuente oficial.',
  },
  privacidad: {
    title: 'Privacidad y cookies | App Opositor Policía',
    description: 'Política de privacidad y cookies de App Opositor Policía.',
  },
}

const FALLBACK_SEO = {
  title: 'App Opositor Policía',
  description: 'App gratuita de preparación física para oposiciones policiales.',
}

export function pathForTabId(tab) {
  return tab === 'inicio' ? '/' : `/${tab}`
}

function upsertMeta(name, content, attr = 'name') {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export function applySeo(tab) {
  const seo = SEO_BY_TAB[tab] ?? FALLBACK_SEO
  document.title = seo.title
  upsertMeta('description', seo.description)
  upsertMeta('og:title', seo.title, 'property')
  upsertMeta('og:description', seo.description, 'property')
  upsertMeta('og:url', `${SITE_ORIGIN}${pathForTabId(tab)}`, 'property')

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', `${SITE_ORIGIN}${pathForTabId(tab)}`)

  upsertMeta('robots', PUBLIC_TABS.has(tab) ? 'index, follow' : 'noindex, nofollow')
}
