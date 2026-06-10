import {
  buildClientUploadHref,
  buildClientUploadHrefSigned,
  questionnaireSiteOrigin,
} from '../data/questionnaire';
import {escapeHtml} from './api/shared';
import {
  CLIENT_UPLOAD_TOKEN_TTL_SECONDS,
  buildClientUploadFolder,
  mintClientUploadToken,
} from './clientUploadToken';

export type ClientUploadEmailParts = {
  href: string | null;
  bucketFolder: string | null;
  plainAppend: string;
  htmlAppend: string;
};

/** Build internal-email lines + HTML fragment for personalised client uploads. */
export async function buildClientUploadEmailParts(options: {
  requestUrl: string;
  publicSiteUrl?: string;
  clientName: string;
  ref: string;
  orderedPages: readonly string[];
  clientUploadSecret?: string;
}): Promise<ClientUploadEmailParts> {
  const origin = questionnaireSiteOrigin(options.requestUrl, options.publicSiteUrl);
  const pages = [...options.orderedPages];
  const secret = options.clientUploadSecret?.trim();

  if (pages.length === 0) {
    const plainAppend =
      '\n\nClient asset upload URL:\nNot generated — no pages selected on the questionnaire.';
    return {
      href: null,
      bucketFolder: null,
      plainAppend,
      htmlAppend:
        '<p><em>No client asset upload URL (no questionnaire pages selected).</em></p>',
    };
  }

  let href: string | null;
  let bucketFolder: string | null = null;

  if (secret) {
    try {
      bucketFolder = buildClientUploadFolder(options.clientName, options.ref);
      const token = await mintClientUploadToken(secret, {
        folder: bucketFolder,
        pages,
        ttlSeconds: CLIENT_UPLOAD_TOKEN_TTL_SECONDS,
      });
      href = buildClientUploadHrefSigned(origin, token);
    } catch {
      href = buildClientUploadHref(origin, pages);
      bucketFolder = null;
    }
  } else {
    href = buildClientUploadHref(origin, pages);
  }

  if (!href) {
    return {
      href: null,
      bucketFolder,
      plainAppend: '\n\nClient asset upload URL:\n(not generated)',
      htmlAppend: '<p><em>Client asset upload URL could not be generated.</em></p>',
    };
  }

  let plainAppend = `\n\nClient asset upload URL:\n${href}`;
  if (bucketFolder) {
    plainAppend += `\n\nR2 folder prefix:\nclient-media/${bucketFolder}/`;
  }

  let htmlAppend = `<p><strong>Client asset upload URL:</strong> <a href="${escapeHtml(href)}">${escapeHtml(href)}</a></p>`;
  if (bucketFolder) {
    htmlAppend += `<p><strong>R2 folder prefix:</strong> <code>${escapeHtml(`client-media/${bucketFolder}/`)}</code></p>`;
  }

  return {href, bucketFolder, plainAppend, htmlAppend};
}
