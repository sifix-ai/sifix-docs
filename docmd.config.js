/**
 * SIFIX Documentation - DocMD Configuration
 */
export default {
  title: 'SIFIX Docs',
  url: 'https://sifix-ai.github.io',
  src: 'docs',
  out: 'site',
  base: '/',

  layout: {
    footer: {
      style: 'minimal',
      branding: false
    },
    sidebar: {
      enabled: true,
      collapsible: true,
      defaultCollapsed: false,
      position: 'left'
    },
    spa: true
  }
}
