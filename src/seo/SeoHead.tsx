import {useHead} from '@unhead/react';
import {useLocation} from 'react-router-dom';
import {
  organizationSchema,
  localBusinessSchema,
  websiteSchema,
} from './structuredData';
import {SITE_URL} from './seoConfig';

const baseLdScripts = [organizationSchema, localBusinessSchema, websiteSchema];

export default function SeoHead() {
  const {pathname} = useLocation();
  const canonical = `${SITE_URL}${pathname === '/' ? '' : pathname}`;

  useHead({
    htmlAttrs: {lang: 'en-GB'},
    link: [{rel: 'canonical', href: canonical}],
    meta: [
      {property: 'og:locale', content: 'en_GB'},
      {property: 'og:site_name', content: 'Kicero'},
      {property: 'og:url', content: canonical},
    ],
    script: baseLdScripts.map((data) => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(data),
      tagPosition: 'head' as const,
    })),
  });

  return null;
}
