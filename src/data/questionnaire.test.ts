import {describe, expect, it} from 'vitest';
import {
  EXTRA_PAGE_SETUP_FEE_GBP,
  PAGES_INCLUDED_FREE,
  buildClientUploadHref,
  computeExtraPageFees,
  formatExtraPageFeesSummary,
  isAllowedClientUploadPageLabel,
  orderedSelectedPages,
  pageDetailSection,
  pageLabelFromDetailSection,
  parseClientUploadPagesFromSearch,
  questionnaireSiteOrigin,
} from './questionnaire';
import {appendExtraPageFeesToSections} from '../lib/questionnaireNotification';

describe('orderedSelectedPages', () => {
  it('returns pages in canonical order regardless of selection order', () => {
    expect(orderedSelectedPages(['Contact', 'Home', 'FAQ'])).toEqual(['Home', 'FAQ', 'Contact']);
  });

  it('survives whitespace and NBSP drift in labels', () => {
    expect(orderedSelectedPages(['  home ', 'Portfolio\u00a0/ Gallery'])).toEqual([
      'Home',
      'Portfolio / Gallery',
    ]);
  });

  it('ignores unknown labels and non-array input', () => {
    expect(orderedSelectedPages(['Nope'])).toEqual([]);
    expect(orderedSelectedPages(undefined)).toEqual([]);
    expect(orderedSelectedPages('Home')).toEqual([]);
  });
});

describe('page detail sections', () => {
  it('round-trips page labels', () => {
    expect(pageLabelFromDetailSection(pageDetailSection('Home'))).toBe('Home');
    expect(pageLabelFromDetailSection('Business basics')).toBeNull();
  });
});

describe('computeExtraPageFees', () => {
  it('charges nothing within the included allowance', () => {
    const r = computeExtraPageFees(['Home', 'About', 'Services']);
    expect(r.extraPages).toEqual([]);
    expect(r.extraFeesTotal).toBe(0);
  });

  it('charges per page beyond the allowance, in selection order', () => {
    const selection = ['Contact', 'Home', 'About', 'Services', 'Pricing', 'FAQ'];
    const r = computeExtraPageFees(selection);
    expect(r.includedPages).toEqual(selection.slice(0, PAGES_INCLUDED_FREE));
    expect(r.extraPages).toEqual(['Pricing', 'FAQ']);
    expect(r.extraFeesTotal).toBe(2 * EXTRA_PAGE_SETUP_FEE_GBP);
  });

  it('dedupes and drops unknown pages', () => {
    const r = computeExtraPageFees(['Home', 'Home', 'Bogus']);
    expect(r.selectionOrder).toEqual(['Home']);
  });
});

describe('formatExtraPageFeesSummary', () => {
  it('describes the three pricing states', () => {
    expect(formatExtraPageFeesSummary([])).toContain('no pages selected');
    expect(formatExtraPageFeesSummary(['Home'])).toMatch(/^£0 —/);
    expect(
      formatExtraPageFeesSummary(['Home', 'About', 'Services', 'Pricing', 'FAQ']),
    ).toContain(`£${EXTRA_PAGE_SETUP_FEE_GBP} —`);
  });
});

describe('appendExtraPageFeesToSections', () => {
  it('appends a fee line to the Pages section', () => {
    const sections = new Map([['Pages', [{label: 'Pages wanted', value: 'Home'}]]]);
    appendExtraPageFeesToSections(sections, ['Home']);
    expect(sections.get('Pages')?.at(-1)?.label).toBe('Extra setup fees');
  });

  it('does nothing when there is no Pages section', () => {
    const sections = new Map<string, Array<{label: string; value: string}>>();
    appendExtraPageFeesToSections(sections, ['Home']);
    expect(sections.size).toBe(0);
  });
});

describe('questionnaireSiteOrigin', () => {
  it('prefers a valid PUBLIC_SITE_URL', () => {
    expect(questionnaireSiteOrigin('http://localhost:8787/x', 'https://kicero.co.uk/')).toBe(
      'https://kicero.co.uk',
    );
  });

  it('falls back to the request origin, then the default', () => {
    expect(questionnaireSiteOrigin('http://localhost:8787/x')).toBe('http://localhost:8787');
    expect(questionnaireSiteOrigin('not-a-url')).toBe('https://kicero.co.uk');
  });
});

describe('client upload link helpers', () => {
  it('builds repeatable pages query params', () => {
    expect(buildClientUploadHref('https://kicero.co.uk/', ['Home', 'FAQ'])).toBe(
      'https://kicero.co.uk/client-upload?pages=Home&pages=FAQ',
    );
    expect(buildClientUploadHref('https://kicero.co.uk', [])).toBeNull();
  });

  it('parses repeatable and comma-separated pages params', () => {
    expect(parseClientUploadPagesFromSearch('?pages=Home&pages=FAQ')).toEqual(['Home', 'FAQ']);
    expect(parseClientUploadPagesFromSearch('?pages=Home,FAQ')).toEqual(['Home', 'FAQ']);
  });

  it('always allows the branding label, and token pages otherwise', () => {
    expect(isAllowedClientUploadPageLabel('Business branding', [])).toBe(true);
    expect(isAllowedClientUploadPageLabel('Home', ['Home'])).toBe(true);
    expect(isAllowedClientUploadPageLabel('Home', ['About'])).toBe(false);
  });
});
