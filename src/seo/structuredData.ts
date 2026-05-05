import {SITE_NAME, SITE_URL, blogArticles, findBlogArticle} from './seoConfig';

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/kicero-logo.png`,
  email: 'info@kicero.co.uk',
  description:
    'Kicero is a Scottish web design studio building affordable, high-end websites for small businesses, startups and individuals across the United Kingdom.',
  foundingLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
      addressRegion: 'Scotland',
    },
  },
  areaServed: {
    '@type': 'Country',
    name: 'United Kingdom',
  },
  sameAs: [],
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': LOCAL_BUSINESS_ID,
  name: SITE_NAME,
  url: SITE_URL,
  email: 'info@kicero.co.uk',
  image: `${SITE_URL}/kicero-logo.png`,
  priceRange: '££',
  description:
    'Affordable, high-end custom websites for small businesses, startups and individuals across the UK. Built in Scotland.',
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
  ],
  parentOrganization: {'@id': ORG_ID},
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: {'@id': ORG_ID},
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
        'One-off payment when your website goes live, equivalent to two months of hosting.',
      availability: 'https://schema.org/InStock',
      url: `${SITE_URL}/services`,
    },
    {
      '@type': 'Offer',
      name: 'Hosting & support',
      price: '20',
      priceCurrency: 'GBP',
      description:
        'Recurring monthly fee covering hosting, the live contact form, and up to 30 minutes of small updates each month.',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '20',
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

export const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  url: `${SITE_URL}/blog`,
  name: 'Kicero Blog',
  publisher: {'@id': ORG_ID},
  blogPost: blogArticles.map((article) => ({
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    url: `${SITE_URL}/blog/${article.slug}`,
    author: {'@id': ORG_ID},
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
    image: `${SITE_URL}/kicero-logo.png`,
    author: {'@id': ORG_ID},
    publisher: {'@id': ORG_ID},
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
    inLanguage: 'en-GB',
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
