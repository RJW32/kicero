import {formatExtraPageFeesSummary} from '../data/questionnaire';

/** Append extra page setup fee summary to the Pages block in questionnaire emails. */
export function appendExtraPageFeesToSections(
  sections: Map<string, Array<{label: string; value: string}>>,
  pagesWanted: unknown,
): void {
  const pagesItems = sections.get('Pages');
  if (!pagesItems) return;
  const raw = Array.isArray(pagesWanted) ? (pagesWanted as string[]) : undefined;
  pagesItems.push({
    label: 'Extra setup fees',
    value: formatExtraPageFeesSummary(raw),
  });
}
