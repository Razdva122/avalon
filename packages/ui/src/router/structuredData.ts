import { basePath } from './paths';

const origin = 'https://avalon-game.com';

/** Use the same localized metadata as the visible page and its canonical link. */
export function updateStructuredData(
  path: string,
  meta: { title: string; description: string; lang: string; skipSiteMap?: boolean },
  breadcrumbs: Array<{ to: string; title: string }>,
) {
  const script = document.querySelector<HTMLScriptElement>('#page-structured-data')!;
  const breadcrumbScript = document.querySelector<HTMLScriptElement>('#breadcrumb-structured-data')!;
  breadcrumbScript.textContent =
    !meta.skipSiteMap && breadcrumbs.length
      ? JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          '@id': origin + path + '#breadcrumbs',
          itemListElement: breadcrumbs.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            item: origin + item.to,
          })),
        }).replace(/</g, '\\u003c')
      : '';
  if (meta.skipSiteMap) {
    script.textContent = '';
    return;
  }

  const url = origin + path;
  const home = basePath(path) === '/';
  const wiki = basePath(path).startsWith('/wiki/');
  const graph = [
    {
      '@type': 'WebSite',
      '@id': origin + '/#website',
      url: origin + '/',
      name: 'Avalon Online',
    },
    {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url,
      name: meta.title,
      description: meta.description,
      inLanguage: meta.lang,
      isPartOf: { '@id': origin + '/#website' },
      ...(home ? { mainEntity: { '@id': origin + '/#game' } } : {}),
      ...(wiki ? { about: { '@id': origin + '/#game' } } : {}),
      ...(breadcrumbs.length ? { breadcrumb: { '@id': url + '#breadcrumbs' } } : {}),
    },
    ...(home
      ? [
          {
            '@type': 'WebApplication',
            '@id': origin + '/#game',
            url: origin + '/',
            name: 'Avalon Online',
            description: meta.description,
            applicationCategory: 'GameApplication',
            operatingSystem: 'Web browser',
            isAccessibleForFree: true,
          },
        ]
      : []),
  ];
  // Keep inline JSON safe when the prerendered DOM is serialized as HTML.
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
