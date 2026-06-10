export type QuestionType = 'text' | 'textarea' | 'email' | 'radio' | 'checkbox';

export interface BaseQuestion {
  id: string;
  section: string;
  label: string;
  /** Shown below the label (e.g. upload instructions). */
  description?: string;
  optional?: boolean;
  /**
   * Plain text for an expandable “info” control next to the label
   * (use blank lines between paragraphs).
   */
  infoExplainer?: string;
}

export interface TextQuestion extends BaseQuestion {
  type: 'text' | 'textarea' | 'email';
  placeholder?: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'radio' | 'checkbox';
  options: string[];
  /** Checkbox groups only: renders options in a CSS grid with this many columns. */
  gridColumns?: number;
}

export type QuestionnaireQuestion = TextQuestion | ChoiceQuestion;

/** Must match the Pages checkbox order; used for per-page follow-up steps. */
export const PAGE_OPTIONS_ORDER = [
  'Home',
  'About',
  'Services',
  'Pricing',
  'Portfolio / Gallery',
  'Testimonials',
  'FAQ',
  'Contact',
] as const;

export type PageOption = (typeof PAGE_OPTIONS_ORDER)[number];

const PAGE_SECTION_PREFIX = 'Page: ';

export function pageDetailSection(pageName: string): string {
  return `${PAGE_SECTION_PREFIX}${pageName}`;
}

/** Page follow-up sections use `Page: …` — extract the label or return null. */
export function pageLabelFromDetailSection(section: string): string | null {
  if (!section.startsWith(PAGE_SECTION_PREFIX)) return null;
  return section.slice(PAGE_SECTION_PREFIX.length);
}

/** Normalize labels so token / questionnaire answers survive NBSP or stray whitespace drift. */
function normalizePageLabelForMatch(label: string): string {
  return label
    .replace(/\u00a0/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function orderedSelectedPages(pagesRaw: string | string[] | undefined): string[] {
  const selected = Array.isArray(pagesRaw) ? pagesRaw : [];
  const normalizedSelected = new Set(selected.map(normalizePageLabelForMatch));
  return PAGE_OPTIONS_ORDER.filter((p) => normalizedSelected.has(normalizePageLabelForMatch(p)));
}

/** Client-facing stub upload UI (linked from questionnaire notification email). */
export const CLIENT_UPLOAD_PATH = '/client-upload' as const;

/** Always available on the client upload portal (not tied to questionnaire page picks). */
export const CLIENT_UPLOAD_BRANDING_LABEL = 'Business branding' as const;

export function isAllowedClientUploadPageLabel(
  pageLabel: string,
  tokenPages: readonly string[],
): boolean {
  if (pageLabel === CLIENT_UPLOAD_BRANDING_LABEL) return true;
  return tokenPages.includes(pageLabel);
}

/** Brochure sites include up to this many questionnaire pages at no extra setup cost. */
export const PAGES_INCLUDED_FREE = 4;

/** Added to the one-off setup fee for each page beyond {@link PAGES_INCLUDED_FREE}. */
export const EXTRA_PAGE_SETUP_FEE_GBP = 14;

/** Extra setup fees use {@link pagesWanted} array order (order the client ticked boxes). */
export function computeExtraPageFees(pagesWanted: string[] | string | undefined): {
  selectionOrder: string[];
  includedPages: string[];
  extraPages: string[];
  extraFeesTotal: number;
} {
  const allowed = new Set<string>(PAGE_OPTIONS_ORDER);
  const selectionOrder: string[] = [];
  const raw = Array.isArray(pagesWanted) ? pagesWanted : [];
  for (const page of raw) {
    if (typeof page !== 'string' || !allowed.has(page) || selectionOrder.includes(page)) continue;
    selectionOrder.push(page);
  }
  const includedPages = selectionOrder.slice(0, PAGES_INCLUDED_FREE);
  const extraPages = selectionOrder.slice(PAGES_INCLUDED_FREE);
  return {
    selectionOrder,
    includedPages,
    extraPages,
    extraFeesTotal: extraPages.length * EXTRA_PAGE_SETUP_FEE_GBP,
  };
}

/** One-line summary for internal questionnaire notification emails (Pages section). */
export function formatExtraPageFeesSummary(
  pagesWanted: string[] | string | undefined,
): string {
  const {selectionOrder, extraPages, extraFeesTotal} = computeExtraPageFees(pagesWanted);
  if (selectionOrder.length === 0) return '£0 (no pages selected)';
  if (extraFeesTotal === 0) {
    return `£0 — ${selectionOrder.length} page(s) selected, all within ${PAGES_INCLUDED_FREE} included`;
  }
  return `£${extraFeesTotal} — ${extraPages.length} extra page(s) at £${EXTRA_PAGE_SETUP_FEE_GBP} each (${extraPages.join(', ')})`;
}

/** Stable field id for the “Anything else?” textarea on each page follow-up step. */
export const PAGE_ANYTHING_ELSE_FIELD_IDS: Record<PageOption, string> = {
  Home: 'page_home_anythingElse',
  About: 'page_about_anythingElse',
  Services: 'page_services_anythingElse',
  Pricing: 'page_pricing_anythingElse',
  'Portfolio / Gallery': 'page_portfolio_anythingElse',
  Testimonials: 'page_testimonials_anythingElse',
  FAQ: 'page_faq_anythingElse',
  Contact: 'page_contact_anythingElse',
};

export const PAGE_ANYTHING_ELSE_FIELD_ID_SET: ReadonlySet<string> = new Set(
  Object.values(PAGE_ANYTHING_ELSE_FIELD_IDS),
);

function buildPageAnythingElseQuestion(pageName: PageOption): QuestionnaireQuestion {
  return {
    id: PAGE_ANYTHING_ELSE_FIELD_IDS[pageName],
    section: pageDetailSection(pageName),
    label: 'Anything else?',
    type: 'textarea',
    optional: true,
  };
}

/** Origin for questionnaire notification links: PUBLIC_SITE_URL when set (recommended for separate API/UI hosts), otherwise request URL, then production default. */
export function questionnaireSiteOrigin(requestUrl: string, publicSiteUrl?: string): string {
  const trimmedEnv = typeof publicSiteUrl === 'string' ? publicSiteUrl.trim().replace(/\/$/, '') : '';
  if (trimmedEnv && trimmedEnv.startsWith('http')) return trimmedEnv;

  try {
    const fromRequest = new URL(requestUrl).origin;
    if (fromRequest?.startsWith('http')) return fromRequest;
  } catch {
    /* ignore */
  }
  return trimmedEnv ? trimmedEnv.replace(/\/$/, '') : 'https://kicero.co.uk';
}

/** Parses `pages` query — repeatable `?pages=` and/or comma-separated values. */
export function parseClientUploadPagesFromSearch(search: string): string[] {
  const q = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(q);
  const out: string[] = [];
  for (const chunk of params.getAll('pages')) {
    for (const part of chunk.split(',')) {
      const t = part.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

/** Canonical order; returns `null` if there is nothing valid to show. */
export function buildClientUploadHref(siteOrigin: string, pagesCanonical: string[]): string | null {
  if (pagesCanonical.length === 0) return null;
  const base = siteOrigin.replace(/\/$/, '');
  const u = new URL(CLIENT_UPLOAD_PATH, `${base}/`);
  for (const p of pagesCanonical) {
    u.searchParams.append('pages', p);
  }
  return u.href;
}

/** Personalised signed link (`t` carries folder + pages; no tampering without secret). */
export function buildClientUploadHrefSigned(siteOrigin: string, signedToken: string): string | null {
  if (!signedToken.trim()) return null;
  const base = siteOrigin.replace(/\/$/, '');
  const u = new URL(CLIENT_UPLOAD_PATH, `${base}/`);
  u.searchParams.set('t', signedToken);
  return u.href;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

type QuestionWithoutSection = DistributiveOmit<QuestionnaireQuestion, 'section'>;

function pageQuestions(
  pageName: PageOption,
  items: QuestionWithoutSection[],
): QuestionnaireQuestion[] {
  const section = pageDetailSection(pageName);
  return [
    ...items.map((q) => ({...q, section} as QuestionnaireQuestion)),
    buildPageAnythingElseQuestion(pageName),
  ];
}

export const ABOUT_FOCUS_OPTIONS = ['Team', 'Mission', 'Story', 'Credentials'] as const;

export const ABOUT_FOCUS_FIELD_IDS: Record<(typeof ABOUT_FOCUS_OPTIONS)[number], string> = {
  Team: 'page_about_team',
  Mission: 'page_about_mission',
  Story: 'page_about_story',
  Credentials: 'page_about_credentials',
};

/** Shown near portfolio/gallery fields in the questionnaire. */
export const PORTFOLIO_GALLERY_UPLOAD_NOTE =
  'An option to upload gallery images directly in this questionnaire will be added later. For now, describe what should appear above—you can share images with us separately after we get in touch.';

/** Shown in the collapsible “Must read” panel (body paragraphs, then disclaimer). */
export const QUESTIONNAIRE_EXPLAINER_PARAGRAPHS: string[] = [
  'If figuring out your website still feels fuzzy or a bit overwhelming, you are in the right place. Every question here is optional on purpose — share what feels easy today, skip what does not, and we will read between the lines and suggest sensible defaults so you are not navigating endless “what should this look like?” loops on your own.',
  'If you would rather hand more of the creative choices to us, that is completely fine. We will use whatever you share as gentle direction and shape a site that fits your goals and audience as well as we can from your answers.',
];

export const QUESTIONNAIRE_EXPLAINER_DISCLAIMER =
  'We treat your answers as our guide and aim to reflect your direction closely. Like any creative project, the finished site might not mirror an exact picture in your head — that is normal — but we will work thoughtfully from what you have shared.';

export const TESTIMONIALS_MAX_SLOTS = 10;

export const FAQ_MAX_SLOTS = 50;

const testimonialsPageQuestions: QuestionnaireQuestion[] = (() => {
  const section = pageDetailSection('Testimonials');
  const slots: QuestionnaireQuestion[] = Array.from({length: TESTIMONIALS_MAX_SLOTS}, (_, i) => {
    const num = i + 1;
    return {
      id: `page_testimonial_${num}_body`,
      section,
      label: `Testimonial ${num} — quote, attribution, role, or anything else we should include`,
      type: 'textarea',
      optional: true,
    };
  });
  return [
    {
      id: 'page_testimonials_count',
      section,
      label: 'How many testimonials would you like on the website?',
      description: `Optional. Enter 0–${TESTIMONIALS_MAX_SLOTS}. That many testimonial boxes will appear below.`,
      type: 'text',
      optional: true,
      placeholder: `0–${TESTIMONIALS_MAX_SLOTS}`,
    },
    ...slots,
    buildPageAnythingElseQuestion('Testimonials'),
  ];
})();

const faqPageQuestions: QuestionnaireQuestion[] = (() => {
  const section = pageDetailSection('FAQ');
  const pairs: QuestionnaireQuestion[] = [];
  for (let i = 1; i <= FAQ_MAX_SLOTS; i++) {
    pairs.push({
      id: `page_faq_${i}_question`,
      section,
      label: `FAQ ${i} — Question`,
      type: 'text',
      optional: true,
    });
    pairs.push({
      id: `page_faq_${i}_answer`,
      section,
      label: `FAQ ${i} — Answer`,
      type: 'textarea',
      optional: true,
    });
  }
  return [
    {
      id: 'page_faq_count',
      section,
      label: 'How many FAQs would you like on this page?',
      description: `Optional. Enter how many FAQs you want (up to ${FAQ_MAX_SLOTS}); leave blank until you decide. Matching FAQ blocks will appear below.`,
      type: 'text',
      optional: true,
      placeholder: `1–${FAQ_MAX_SLOTS}`,
    },
    ...pairs,
    buildPageAnythingElseQuestion('FAQ'),
  ];
})();

const questionnairePageFollowUps: QuestionnaireQuestion[] = [
  ...pageQuestions('Home', [
    {
      id: 'page_home_backgroundVideo',
      label: 'Do you want a background video playing on the homepage?',
      type: 'radio',
      options: ['Yes', 'No'],
      optional: true,
    },
    {
      id: 'page_home_businessIntro',
      label: 'Enter a brief description about your business to have on the homepage',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'homepageNeeds',
      label: 'Must-have homepage sections',
      type: 'textarea',
      optional: true,
    },
  ]),
  ...pageQuestions('About', [
    {
      id: 'page_about_elements',
      label: 'What should we include on your About page? (tick any that apply)',
      type: 'checkbox',
      options: [...ABOUT_FOCUS_OPTIONS],
      gridColumns: 2,
      optional: true,
    },
    {
      id: 'page_about_team',
      label: 'Team — information or names to include',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'page_about_mission',
      label: 'Mission — information to include',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'page_about_story',
      label: 'Story — information or narrative to include',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'page_about_credentials',
      label: 'Credentials — qualifications or proof points to include',
      type: 'textarea',
      optional: true,
    },
  ]),
  ...pageQuestions('Services', [
    {
      id: 'page_services_overview',
      label: 'Describe the services or packages you want listed on this page',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'page_services_emphasis',
      label: 'Anything you want emphasised (for example pricing tiers, comparisons, process steps)?',
      type: 'textarea',
      optional: true,
    },
  ]),
  ...pageQuestions('Pricing', [
    {
      id: 'page_pricing_format',
      label: 'How would you like pricing shown (for example simple list, cards, table, or enquiry-only)?',
      type: 'text',
      optional: true,
    },
    {
      id: 'page_pricing_detail',
      label: 'Describe your pricing structure, tiers, or what visitors should know',
      type: 'textarea',
      optional: true,
    },
  ]),
  ...pageQuestions('Portfolio / Gallery', [
    {
      id: 'page_portfolio_content',
      label: 'What projects, work, or images should appear in the gallery?',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'page_portfolio_structure',
      label: 'Should work be grouped (for example by category or year), or a single grid?',
      type: 'text',
      optional: true,
    },
  ]),
  ...testimonialsPageQuestions,
  ...faqPageQuestions,
  ...pageQuestions('Contact', [
    {
      id: 'page_contact_email',
      label: 'Contact email',
      type: 'email',
      optional: true,
    },
    {
      id: 'page_contact_phone',
      label: 'Contact phone number',
      type: 'text',
      optional: true,
    },
    {
      id: 'page_contact_address',
      label: 'Business address',
      type: 'textarea',
      optional: true,
    },
    {
      id: 'page_contact_social',
      label: 'Social media links (one per line or separated by commas is fine)',
      type: 'textarea',
      optional: true,
    },
  ]),
];

const questionnaireQuestions: QuestionnaireQuestion[] = [
  {
    id: 'businessName',
    section: 'Business Basics',
    label: 'Business name',
    type: 'text',
    optional: true,
  },
  {
    id: 'businessSummary',
    section: 'Business Basics',
    label: 'What do you do?',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'customerType',
    section: 'Business Basics',
    label: 'Who are your typical customers?',
    type: 'text',
    optional: true,
  },
  {
    id: 'mainGoal',
    section: 'Business Basics',
    label: 'Main goal for the website',
    type: 'text',
    optional: true,
  },
  {
    id: 'logoReady',
    section: 'Brand & Style',
    label: 'Do you already have a logo?',
    type: 'radio',
    options: ['Yes', 'No'],
    optional: true,
  },
  {
    id: 'stylePreference',
    section: 'Brand & Style',
    label: 'Preferred style',
    type: 'checkbox',
    options: ['Modern / Minimal', 'Professional / Corporate', 'Friendly / Casual', 'Bold / Creative'],
    optional: true,
  },
  {
    id: 'inspirationSites',
    section: 'Brand & Style',
    label: 'Websites you like (links)',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'preferredColours',
    section: 'Colour Preferences',
    label: 'Preferred main colours',
    type: 'text',
    optional: true,
  },
  {
    id: 'avoidColours',
    section: 'Colour Preferences',
    label: 'Colours to avoid',
    type: 'text',
    optional: true,
  },
  {
    id: 'fontPreference',
    section: 'Fonts',
    label: 'Any font preferences?',
    type: 'text',
    optional: true,
  },
  {
    id: 'pagesWanted',
    section: 'Pages',
    label: 'Pages you would like',
    description:
      'Up to 4 pages are included at no extra setup cost. Each additional page you select adds £14 to your one-off setup fee.',
    type: 'checkbox',
    options: [...PAGE_OPTIONS_ORDER],
    optional: true,
  },
  {
    id: 'mustAndAvoid',
    section: 'Final Notes',
    label: 'Anything you definitely want or do not want?',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'mobilePriority',
    section: 'Final Notes',
    label: 'Is mobile-friendly design important?',
    type: 'radio',
    options: ['Important', 'Not important'],
    optional: true,
  },
  {
    id: 'alternativePricingInterest',
    section: 'Final Notes',
    label: 'Would you like a quote for alternative pricing?',
    type: 'radio',
    options: ['Yes', 'No'],
    optional: true,
    infoExplainer:
      `Alternative pricing is another way to pay for your website after we understand what you need:

• You receive a one-off quote for the build — typically from upwards of £250 depending on scope — and that amount is invoiced when your site launches.

• After launch it is £32 per year recurring (equivalent to £2.50 per month), including domain management if we manage your custom domain. Website updates are quoted separately.

If you are not happy with the alternative quote you may still opt for our standard pricing strategy.`,
  },
  {
    id: 'feelWords',
    section: 'Final Notes',
    label: '3 words for how you want the website to feel',
    type: 'text',
    optional: true,
  },
  {
    id: 'extraNotes',
    section: 'Final Notes',
    label: 'Anything else you want included?',
    type: 'textarea',
    optional: true,
  },
  {
    id: 'hasPhotos',
    section: 'Images & Visuals',
    label: 'Do you have photos for your website?',
    type: 'radio',
    options: ['Yes', 'No'],
    optional: true,
  },
  ...questionnairePageFollowUps,
];

export {questionnaireQuestions};

export const questionnaireQuestionMap = new Map(
  questionnaireQuestions.map((question) => [question.id, question]),
);

/** Ordered wizard steps — each entry is section key(s); Colour + Fonts stay on one step. */
export const questionnaireStepSections: string[][] = [
  ['Business Basics'],
  ['Brand & Style'],
  ['Colour Preferences', 'Fonts'],
  ['Pages'],
  ['Final Notes'],
  ['Images & Visuals'],
];

export type QuestionnaireWizardStep =
  | {kind: 'sections'; sectionKeys: string[]}
  | {kind: 'pageFollowUp'; page: string};

/** Base steps plus one follow-up step per selected page (in catalogue order), immediately after Pages. */
export function buildQuestionnaireWizardSteps(
  orderedSelectedPageLabels: string[],
): QuestionnaireWizardStep[] {
  const steps: QuestionnaireWizardStep[] = [];
  for (const sectionKeys of questionnaireStepSections) {
    steps.push({kind: 'sections', sectionKeys});
    if (sectionKeys.length === 1 && sectionKeys[0] === 'Pages') {
      for (const page of orderedSelectedPageLabels) {
        steps.push({kind: 'pageFollowUp', page});
      }
    }
  }
  return steps;
}

