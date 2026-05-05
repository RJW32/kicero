export const SITE_URL = 'https://kicero.co.uk';
export const SITE_NAME = 'Kicero';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/kicero-logo.png`;
export const SITE_LOCALE = 'en_GB';

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
      'Kicero builds simple, high-end, low-cost websites for small businesses, startups and individuals across the UK. Designed and built in Scotland. You only pay when your site is live.',
    path: '/',
    keywords:
      'web design uk, affordable website, small business website, custom website, scottish web developer, cheap website design, website for small business uk, simple website',
  },
  services: {
    title: 'Web Design Pricing from £20/month | Kicero',
    description:
      'Transparent website pricing: £40 when your site goes live, then £20 per month for hosting, contact form and small updates. No payment until you are happy. Built by a Scottish studio for UK businesses.',
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

export const blogArticles: Array<{
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  excerpt: string;
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
