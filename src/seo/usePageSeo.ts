import {useHead} from '@unhead/react';
import {DEFAULT_OG_IMAGE, SITE_URL, type PageMeta} from './seoConfig';

interface UsePageSeoOptions {
  meta: PageMeta;
  structuredData?: Array<Record<string, unknown> | null>;
}

export function usePageSeo({meta, structuredData = []}: UsePageSeoOptions) {
  const ogImage = meta.ogImage ?? DEFAULT_OG_IMAGE;
  const url = `${SITE_URL}${meta.path === '/' ? '' : meta.path}`;

  const headInput: Parameters<typeof useHead>[0] = {
    title: meta.title,
    meta: [
      {name: 'description', content: meta.description},
      {
        name: 'robots',
        content: meta.noindex ? 'noindex, nofollow' : 'index, follow',
      },
      ...(meta.keywords
        ? [{name: 'keywords', content: meta.keywords}]
        : []),
      {property: 'og:type', content: 'website'},
      {property: 'og:title', content: meta.title},
      {property: 'og:description', content: meta.description},
      {property: 'og:url', content: url},
      {property: 'og:image', content: ogImage},
      {property: 'og:image:width', content: '1200'},
      {property: 'og:image:height', content: '630'},
      {property: 'og:image:alt', content: `${meta.title} — Kicero`},
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:title', content: meta.title},
      {name: 'twitter:description', content: meta.description},
      {name: 'twitter:image', content: ogImage},
    ],
    script: structuredData
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((data) => ({
        type: 'application/ld+json',
        innerHTML: JSON.stringify(data),
        tagPosition: 'head' as const,
      })),
  };

  useHead(headInput);
}
