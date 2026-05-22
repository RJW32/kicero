export const SITE_URL = 'https://kicero.co.uk';
export const SITE_NAME = 'Kicero';
/**
 * Canonical social card (1200x630). The SVG ships in `public/og-image.svg` —
 * for best compatibility across every social scraper, generate a PNG export
 * at the same dimensions (`public/og-image.png`) and swap this constant.
 * SVG works for Google/Twitter; some Slack/iMessage variants prefer raster.
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`;
export const DEFAULT_OG_IMAGE_WIDTH = '1200';
export const DEFAULT_OG_IMAGE_HEIGHT = '630';
export const SITE_LOCALE = 'en_GB';

/**
 * Canonical Wikidata item for the Kicero organization (`sameAs` / Knowledge Graph).
 * @see https://www.wikidata.org/wiki/Q139890611
 */
export const WIKIDATA_ORGANIZATION_ENTITY =
  'https://www.wikidata.org/wiki/Q139890611' as const;

/**
 * Extra `Organization.sameAs` URLs (Wikidata is always included below; add
 * LinkedIn, Companies House, etc. via `VITE_ORGANIZATION_SAME_AS` or optional
 * `VITE_WIKIDATA_ENTITY_URL` override). Values are injected at **build time**.
 *
 * Canonical Wikidata wiki URL shape: `https://www.wikidata.org/wiki/Q123456789`
 */
function splitCommaSeparatedUrls(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const wikidataEntityUrlEnv =
  typeof import.meta.env.VITE_WIKIDATA_ENTITY_URL === 'string'
    ? import.meta.env.VITE_WIKIDATA_ENTITY_URL.trim()
    : '';

export const extraOrganizationSameAs: readonly string[] = [
  ...new Set([
    WIKIDATA_ORGANIZATION_ENTITY,
    ...(wikidataEntityUrlEnv && wikidataEntityUrlEnv !== WIKIDATA_ORGANIZATION_ENTITY
      ? [wikidataEntityUrlEnv]
      : []),
    ...splitCommaSeparatedUrls(import.meta.env.VITE_ORGANIZATION_SAME_AS),
  ]),
];

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string;
}

export const pageMeta: Record<string, PageMeta> = {
  home: {
    title:
      'Kicero | Affordable Custom Websites for Small Businesses (UK)',
    description:
      'Kicero is a Scottish web design studio building simple, high-end, low-cost custom websites for small businesses, startups and individuals across the UK. Designed and built in Scotland. You only pay when your site is live.',
    path: '/',
    keywords:
      'kicero, kicero web design, kicero studio, web design uk, affordable website, small business website, custom website, scottish web developer, cheap website design, website for small business uk, simple website',
  },
  about: {
    title: 'About Kicero | Scottish Web Design Studio for UK Small Businesses',
    description:
      'Kicero is a Scottish web design studio that builds affordable, high-end custom websites for small businesses, startups and individuals across the United Kingdom. Designed and built in Scotland.',
    path: '/about',
    keywords:
      'about kicero, what is kicero, who runs kicero, where is kicero based, kicero scotland, scottish web design studio',
  },
  services: {
    title: 'Web Design Pricing from £15/month | Kicero',
    description:
      'Transparent website pricing: £40 at launch (£15 first month + £25 setup), then £15 per month for hosting, contact form and small updates. Domain management from £1/month extra. No payment until you are happy. Built by a Scottish studio for UK businesses.',
    path: '/services',
    keywords:
      'website pricing uk, cheap web design, monthly website plan, website hosting included, small business web design pricing, scottish web design',
  },
  portfolio: {
    title: 'Custom Website Examples | Kicero Portfolio',
    description:
      'A selection of custom websites built by Kicero — clean, fast, and tailored to each brand. See real work for small businesses, creators and projects.',
    path: '/portfolio',
    keywords:
      'web design portfolio uk, custom website examples, scottish web design portfolio, small business website examples',
  },
  contact: {
    title: 'Get a Free Website Quote | Kicero',
    description:
      'Tell us about your project and get a no-obligation quote within 24 hours. Kicero is a Scottish studio building affordable, high-end websites for businesses across the UK.',
    path: '/contact',
    keywords:
      'website quote uk, contact web designer, free website quote, scottish web designer contact',
  },
  blog: {
    title: 'Web Design Articles & Guides | Kicero Blog',
    description:
      'Practical articles on building affordable, high-performing websites for small businesses in the UK — pricing, platforms, and what actually drives leads.',
    path: '/blog',
    keywords:
      'small business website blog, web design tips uk, website cost guide, scottish web design blog',
  },
  questionnaire: {
    title: 'Website Questionnaire | Kicero',
    description:
      'Complete this short website questionnaire so we can understand your goals, style, and content needs.',
    path: '/questionnaire',
    noindex: true,
  },
  clientUpload: {
    title: 'Upload website images & videos | Kicero',
    description:
      'Choose photos and videos for each page of your upcoming site. Links are personalised to your questionnaire.',
    path: '/client-upload',
    noindex: true,
  },
  privacy: {
    title: 'Privacy Policy | Kicero',
    description:
      'How Kicero collects, uses and protects information submitted through this website and our services.',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service | Kicero',
    description:
      'Terms governing the use of the Kicero website and our web design and hosting services.',
    path: '/terms',
  },
  notFound: {
    title: 'Page Not Found | Kicero',
    description:
      'The page you were looking for does not exist. Head back to the Kicero homepage.',
    path: '/404',
    noindex: true,
  },
};

/**
 * Stable last-modified dates per route. Update when the page content
 * meaningfully changes. Sitemap freshness signal — Google uses `lastmod` to
 * decide when to recrawl, so honest dates beat "everything updated today".
 */
export const pageLastModified: Record<string, string> = {
  '/': '2026-05-22',
  '/about': '2026-05-22',
  '/services': '2026-05-20',
  '/portfolio': '2026-05-20',
  '/contact': '2026-05-20',
  '/blog': '2026-05-22',
  '/privacy': '2026-05-20',
  '/terms': '2026-05-20',
};

export const blogArticles: Array<{
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  excerpt: string;
  /**
   * Optional per-article social card. Path under `/public` or absolute URL.
   * Falls back to `DEFAULT_OG_IMAGE` when omitted. Per-article images
   * dramatically improve Discover + social CTR.
   */
  ogImage?: string;
}> = [
  {
    slug: 'how-much-should-a-small-business-website-cost-uk-2026',
    title:
      'How Much Should a Small Business Website Cost in the UK? (2026 Guide)',
    description:
      'A no-nonsense breakdown of what UK small businesses actually pay for a website in 2026 — from DIY builders to bespoke design — and how to avoid overpaying.',
    publishedAt: '2026-04-12',
    updatedAt: '2026-05-01',
    readingMinutes: 7,
    excerpt:
      'If you are running a small business in the UK and looking for a website, the price you will be quoted varies wildly. Here is what is actually fair in 2026.',
  },
  {
    slug: 'why-scottish-small-businesses-need-fast-simple-websites',
    title: 'Why Every Scottish Small Business Needs a Fast, Simple Website',
    description:
      'Most Scottish high-street businesses still rely on Facebook pages and word of mouth. Here is why a small, fast website beats both — and what it should look like.',
    publishedAt: '2026-04-22',
    updatedAt: '2026-04-22',
    readingMinutes: 6,
    excerpt:
      'You do not need a 40-page website. You need a fast, clear one that answers three questions for anyone who lands on it.',
  },
  {
    slug: 'custom-website-vs-wix-vs-squarespace',
    title: 'Custom Website vs Wix vs Squarespace: What Actually Wins?',
    description:
      'Wix and Squarespace are easy. A custom website is faster and more flexible. Here is how to choose between them honestly, with real costs and trade-offs.',
    publishedAt: '2026-05-02',
    updatedAt: '2026-05-02',
    readingMinutes: 8,
    excerpt:
      'The honest answer depends on three things: your budget, how unique you need to look, and how much you care about page speed.',
  },
];

export const findBlogArticle = (slug: string) =>
  blogArticles.find((article) => article.slug === slug);
