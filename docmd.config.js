export default {
  title: 'SIFIX Docs',
  url: 'https://sifix-ai.github.io',
  src: 'docs',
  out: 'site',
  base: '/',

  layout: {
    spa: false,
    header: { enabled: true },
    breadcrumbs: true,
    sidebar: { enabled: true, collapsible: true, defaultCollapsed: false, position: 'left' },
    optionsMenu: { position: 'header', components: { search: true, themeSwitch: true, sponsor: null } },
    footer: { style: 'minimal', branding: false, content: '© ' + new Date().getFullYear() + ' SIFIX Docs' },
  },

  theme: {
    name: 'default',
    appearance: 'dark',
    codeHighlight: true,
    customCss: ['assets/css/sifix-theme.css'],
  },

  minify: true,
  autoTitleFromH1: true,
  copyCode: true,
  pageNavigation: true,

  navigation: [
    { title: 'Home', path: '/', icon: 'home' },
    { title: 'Overview', icon: 'book-open', collapsible: true, children: [
      { title: 'Introduction', path: '/overview/introduction' },
      { title: 'Problem Statement', path: '/overview/problem-statement' },
      { title: 'Solution', path: '/overview/solution' },
      { title: 'Tech Stack', path: '/overview/tech-stack' },
    ]},
    { title: 'Product', icon: 'layout-dashboard', collapsible: true, children: [
      { title: 'Extension', path: '/product/extension' },
      { title: 'Dashboard', path: '/product/dashboard' },
      { title: 'AI Agent', path: '/product/ai-agent' },
      { title: 'Agentic Identity', path: '/product/agentic-identity' },
      { title: '0G Integration', path: '/product/0g-integration' },
    ]},
    { title: 'Architecture', icon: 'workflow', collapsible: true, children: [
      { title: 'System Overview', path: '/architecture/system-overview' },
      { title: 'Data Flow', path: '/architecture/data-flow' },
      { title: 'Security Model', path: '/architecture/security-model' },
      { title: 'Database Schema', path: '/architecture/database-schema' },
      { title: 'Auth Flow', path: '/architecture/auth-flow' },
    ]},
    { title: 'API Reference', icon: 'server', collapsible: true, children: [
      { title: '@sifix/agent SDK', path: '/api-reference/agent-sdk' },
      { title: 'REST API', path: '/api-reference/rest-api' },
      { title: 'Extension API', path: '/api-reference/extension-api' },
      { title: '0G Storage API', path: '/api-reference/0g-storage-api' },
    ]},
  ],
};