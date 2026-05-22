import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_URL,
  blogArticles,
  extraOrganizationSameAs,
  findBlogArticle,
} from './seoConfig';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;
const FOUNDER_ID = `${SITE_URL}/about#person`;

/**
 * Brand-entity payload. The richer and more cross-linked this is, the more
 * confident Google's Knowledge Graph becomes that "Kicero" the entity ==
 * kicero.co.uk — which drives Knowledge Panels and AI Overview citations on
 * brand searches.
 *
 * Populate `sameAs[]` as social/identity profiles come online (LinkedIn,
 * Companies House, Wikidata, Crunchbase, X, Instagram). Each is a verification
 * edge — they must also link back to kicero.co.uk for the strongest signal.
 *
 * `founder` is intentionally omitted while the founder remains anonymous.
 * Once revealed, add a `Person` entry at `${SITE_URL}/about#person` and
 * cross-reference here + on `BlogPosting.author`.
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  legalName: 'Kicero',
  alternateName: ['Kicero Studio', 'Kicero Web Design'],
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/kicero-logo.png`,
    width: 1080,
    height: 1080,
    caption: 'Kicero logo',
  },
  image: {
    '@type': 'ImageObject',
    url: DEFAULT_OG_IMAGE,
    width: Number(DEFAULT_OG_IMAGE_WIDTH),
    height: Number(DEFAULT_OG_IMAGE_HEIGHT),
  },
  email: 'info@kicero.co.uk',
  description:
    'Kicero is a Scottish web design studio building simple, high-end, low-cost custom websites for small businesses, startups and individuals across the United Kingdom. Designed and built in Scotland. Clients only pay once their website is live.',
  slogan: 'Notable and effective websites.',
  foundingDate: '2026',
  foundingLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
      addressRegion: 'Scotland',
    },
  },
  knowsAbout: [
    'Web design',
    'Web development',
    'Small business websites',
    'Custom website development',
    'Responsive web design',
    'UI/UX design',
    'Website hosting',
    'Cloudflare hosting',
    'UK web design',
    'Scottish web design',
  ],
  knowsLanguage: ['en-GB'],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@kicero.co.uk',
      areaServed: 'GB',
      availableLanguage: 'en-GB',
    },
  ],
  areaServed: {
    '@type': 'Country',
    name: 'United Kingdom',
  },
  brand: {
    '@type': 'Brand',
    name: SITE_NAME,
    logo: `${SITE_URL}/kicero-logo.png`,
  },
  // Off-site identity profiles. See `extraOrganizationSameAs` in
  // `seoConfig.ts` (build-time env: VITE_WIKIDATA_ENTITY_URL,
  // VITE_ORGANIZATION_SAME_AS). Each external profile should also list
  // kicero.co.uk as its official website for bidirectional verification.
  sameAs: [...extraOrganizationSameAs] as string[],
};

// TODO: once the founder is named, define and export `founderSchema` here as
// '@type': 'Person', '@id': FOUNDER_ID, then add `founder: {'@id': FOUNDER_ID}`
// to organizationSchema and `author: {'@id': FOUNDER_ID}` to buildArticleSchema.
// FOUNDER_ID is defined above so future wiring stays consistent.
void FOUNDER_ID;

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': LOCAL_BUSINESS_ID,
  name: SITE_NAME,
  alternateName: ['Kicero Studio', 'Kicero Web Design'],
  url: SITE_URL,
  email: 'info@kicero.co.uk',
  image: `${SITE_URL}/kicero-logo.png`,
  logo: `${SITE_URL}/kicero-logo.png`,
  priceRange: '££',
  description:
    'Affordable, high-end custom websites for small businesses, startups and individuals across the UK. Built in Scotland. Clients only pay once their website is live.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'GB',
    addressRegion: 'Scotland',
  },
  areaServed: [
    {'@type': 'Country', name: 'United Kingdom'},
    {'@type': 'AdministrativeArea', name: 'Scotland'},
    {'@type': 'AdministrativeArea', name: 'England'},
    {'@type': 'AdministrativeArea', name: 'Wales'},
    {'@type': 'AdministrativeArea', name: 'Northern Ireland'},
  ],
  serviceType: [
    'Web design',
    'Web development',
    'Website hosting',
    'Custom website development',
    'UI/UX design',
    'Responsive web design',
  ],
  knowsAbout: [
    'Web design',
    'Small business websites',
    'Custom website development',
    'Website hosting',
    'UK web design',
    'Scottish web design',
  ],
  knowsLanguage: ['en-GB'],
  parentOrganization: {'@id': ORG_ID},
  brand: {'@id': ORG_ID},
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  alternateName: 'Kicero',
  description:
    'Official website of Kicero — a Scottish web design studio building affordable, high-end custom websites for small businesses across the United Kingdom.',
  publisher: {'@id': ORG_ID},
  inLanguage: 'en-GB',
  copyrightHolder: {'@id': ORG_ID},
  copyrightYear: 2026,
};

/**
 * Anchors the home page to the Kicero Organization entity. Without this Google
 * has to infer which page is the canonical "about Kicero" page; with this we
 * declare it directly. Single biggest hint for Knowledge Panel routing.
 */
export const homePageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': `${SITE_URL}/#webpage`,
  url: SITE_URL,
  name: 'Kicero — Scottish web design studio for UK small businesses',
  description:
    'Kicero is a Scottish web design studio building simple, high-end, low-cost custom websites for small businesses across the United Kingdom.',
  isPartOf: {'@id': WEBSITE_ID},
  about: {'@id': ORG_ID},
  mainEntity: {'@id': ORG_ID},
  primaryImageOfPage: {
    '@type': 'ImageObject',
    url: DEFAULT_OG_IMAGE,
    width: Number(DEFAULT_OG_IMAGE_WIDTH),
    height: Number(DEFAULT_OG_IMAGE_HEIGHT),
  },
  inLanguage: 'en-GB',
};

/**
 * Declares /about as the explicit entity definition page for Kicero. AI
 * Overviews preferentially cite pages with this binding when answering "What
 * is X?" / "Who is X?" style brand queries.
 */
export const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#aboutpage`,
  url: `${SITE_URL}/about`,
  name: 'About Kicero — Scottish web design studio',
  description:
    'Learn about Kicero — a Scottish web design studio that builds affordable, high-end custom websites for small businesses, startups and individuals across the United Kingdom.',
  isPartOf: {'@id': WEBSITE_ID},
  about: {'@id': ORG_ID},
  mainEntity: {'@id': ORG_ID},
  inLanguage: 'en-GB',
};

export const buildBreadcrumb = (
  items: Array<{name: string; path: string}>,
) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: `${SITE_URL}${item.path === '/' ? '' : item.path}`,
  })),
});

export const servicesListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: [
    {
      '@type': 'Service',
      name: 'Custom Website Development',
      description:
        'Fully custom websites built around your goals, brand and audience. No templates.',
      provider: {'@id': ORG_ID},
      areaServed: 'GB',
    },
    {
      '@type': 'Service',
      name: 'UI / UX Design',
      description:
        'Clean, considered design — minimal or expressive — tailored to your brand.',
      provider: {'@id': ORG_ID},
      areaServed: 'GB',
    },
    {
      '@type': 'Service',
      name: 'Responsive Web Design',
      description:
        'Pixel-precise experiences across mobile, tablet and ultra-wide displays.',
      provider: {'@id': ORG_ID},
      areaServed: 'GB',
    },
    {
      '@type': 'Service',
      name: 'Website Hosting & Security',
      description:
        'Cloudflare-backed hosting with enterprise-grade security and global performance.',
      provider: {'@id': ORG_ID},
      areaServed: 'GB',
    },
  ].map((service, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    item: service,
  })),
};

export const offerSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Custom Website by Kicero',
  description:
    'A fully custom website designed and built by Kicero, including hosting, contact form, and ongoing small updates.',
  brand: {'@id': ORG_ID},
  offers: [
    {
      '@type': 'Offer',
      name: 'Launch (one-off)',
      price: '40',
      priceCurrency: 'GBP',
      description:
        'One-off payment when your website goes live: £25 setup plus your first month (£15).',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/services`,
    },
    {
      '@type': 'Offer',
      name: 'Hosting & support',
      price: '15',
      priceCurrency: 'GBP',
      description:
        'Recurring monthly fee covering hosting, the live contact form, and up to 30 minutes of small updates each month.',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '15',
        priceCurrency: 'GBP',
        unitText: 'MONTH',
      },
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/services`,
    },
  ],
};

export const faqSchema = (
  questions: Array<{question: string; answer: string}>,
) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questions.map(({question, answer}) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
});

const articleImageUrl = (ogImage: string | undefined): string => {
  if (!ogImage) return DEFAULT_OG_IMAGE;
  if (ogImage.startsWith('http://') || ogImage.startsWith('https://')) return ogImage;
  return `${SITE_URL}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
};

export const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  url: `${SITE_URL}/blog`,
  name: 'Kicero Blog',
  description:
    'Practical articles about building affordable, high-performing websites for small businesses in the UK.',
  publisher: {'@id': ORG_ID},
  inLanguage: 'en-GB',
  blogPost: blogArticles.map((article) => ({
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    url: `${SITE_URL}/blog/${article.slug}`,
    image: articleImageUrl(article.ogImage),
    // TODO: once the founder is named, swap `author` to `{'@id': FOUNDER_ID}`
    // so each post is attributable to a real person (E-E-A-T signal).
    author: {'@id': ORG_ID},
    publisher: {'@id': ORG_ID},
    inLanguage: 'en-GB',
  })),
};

export const buildArticleSchema = (slug: string) => {
  const article = findBlogArticle(slug);
  if (!article) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    url: `${SITE_URL}/blog/${article.slug}`,
    image: articleImageUrl(article.ogImage),
    // TODO: once the founder is named, swap to `{'@id': FOUNDER_ID}`.
    author: {'@id': ORG_ID},
    publisher: {'@id': ORG_ID},
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
    inLanguage: 'en-GB',
    keywords:
      'small business website, web design uk, scottish web design, custom website',
  };
};

export const portfolioListSchema = (
  projects: ReadonlyArray<{
    title: string;
    description: string;
    link: string;
    image: string;
  }>,
) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: projects.map((project, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    item: {
      '@type': 'CreativeWork',
      name: project.title,
      description: project.description,
      url: project.link,
      image: project.image,
      creator: {'@id': ORG_ID},
    },
  })),
});
