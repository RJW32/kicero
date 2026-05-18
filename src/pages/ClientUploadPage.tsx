import {useId, useMemo, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {
  orderedSelectedPages,
  parseClientUploadPagesFromSearch,
} from '../data/questionnaire';
import {decodeClientUploadTokenForUi} from '../lib/clientUploadToken';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';
import {usePageSeo} from '../seo/usePageSeo';

type RowStatus =
  | {kind: 'idle'}
  | {kind: 'uploading'}
  | {kind: 'ok'; url?: string}
  | {kind: 'err'; message: string};

function PageUploadRow({
  pageLabel,
  uploadToken,
  uploadsAllowed,
  simulateUploadOnly,
}: {
  pageLabel: string;
  uploadToken: string;
  uploadsAllowed: boolean;
  /** Dev-only: show live controls and pretend uploads succeed without calling R2. */
  simulateUploadOnly?: boolean;
}) {
  const inputId = useId();
  const [filenames, setFilenames] = useState<string[]>([]);
  const [lastStatus, setLastStatus] = useState<Record<string, RowStatus>>({});

  const canPickFiles = uploadsAllowed || Boolean(simulateUploadOnly);

  const uploadMany = async (files: FileList | null) => {
    if (!files?.length || !canPickFiles) return;
    await Promise.all(Array.from(files).map((file) => uploadSingle(file)));
  };

  const uploadSingle = async (file: File) => {
    if (!canPickFiles) return;

    if (simulateUploadOnly && !uploadsAllowed) {
      setLastStatus((m) => ({...m, [file.name]: {kind: 'uploading'}}));
      await new Promise((r) => setTimeout(r, 350));
      setLastStatus((m) => ({
        ...m,
        [file.name]: {kind: 'ok'},
      }));
      return;
    }

    if (!uploadsAllowed) return;
    setLastStatus((m) => ({...m, [file.name]: {kind: 'uploading'}}));

    try {
      const req = await fetch('/api/client-upload/presign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          token: uploadToken,
          pageLabel,
          filename: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
        }),
      });
      const data = (await req.json().catch(() => ({}))) as {
        putUrl?: string;
        url?: string;
        error?: string;
      };

      if (!req.ok || !data.putUrl) {
        throw new Error(data?.error ?? 'Could not upload (check R2 credentials on the server).');
      }

      const putResp = await fetch(data.putUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!putResp.ok) {
        throw new Error('Upload rejected by storage (CORS / size / signing).');
      }

      setLastStatus((m) => ({
        ...m,
        [file.name]: {kind: 'ok', url: data.url},
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Upload failed.';
      setLastStatus((m) => ({...m, [file.name]: {kind: 'err', message: msg}}));
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <h3 className="font-display text-sm font-semibold tracking-wide text-white">{pageLabel}</h3>
      <div className="flex flex-1 flex-col gap-3 sm:min-w-[12rem] sm:max-w-[24rem] sm:items-end">
        <input
          id={inputId}
          type="file"
          className="sr-only"
          multiple
          accept="image/*,video/*"
          onChange={(e) => {
            const list = e.target.files ? Array.from(e.target.files).map((f) => f.name) : [];
            setFilenames(list);
            uploadMany(e.target.files).finally(() => {
              e.target.value = '';
            });
          }}
          disabled={!canPickFiles}
        />
        <label
          htmlFor={inputId}
          aria-disabled={!canPickFiles}
          className={
            canPickFiles
              ? 'inline-flex cursor-pointer items-center justify-center rounded-md border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white outline-offset-4 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80'
              : 'pointer-events-none inline-flex cursor-not-allowed items-center justify-center rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/40 outline-offset-4'
          }>
          Upload photos &amp; videos
        </label>
        {filenames.length > 0 && (
          <ul className="w-full space-y-1 text-right text-xs sm:text-xs">
            {filenames.map((name) => {
              const st = lastStatus[name] ?? {kind: 'idle'};
              let line = name;
              if (st.kind === 'uploading') line += ' — uploading…';
              if (st.kind === 'ok') line += simulateUploadOnly && !uploadsAllowed ? ' — saved (preview only)' : ' — saved';
              if (st.kind === 'err') line += ` — ${st.message}`;
              return (
                <li key={name} className="text-white/70">
                  {line}
                </li>
              );
            })}
          </ul>
        )}
        {filenames.length === 0 && (
          <p className="text-right text-xs text-white/45">
            {canPickFiles
              ? simulateUploadOnly && !uploadsAllowed
                ? 'Choose files — uploads are simulated in this dev preview.'
                : 'Choose files above.'
              : 'Uploads unavailable for this link type.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ClientUploadPage() {
  const location = useLocation();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const rawToken = (searchParams.get('t') ?? '').trim();

  const devLayoutPreview =
    import.meta.env.DEV &&
    ['1', 'true', 'yes'].includes((searchParams.get('preview') ?? '').trim().toLowerCase());

  const tokenPreview = useMemo(() => decodeClientUploadTokenForUi(rawToken || undefined), [rawToken]);

  const expiresAtMs = tokenPreview?.exp != null ? tokenPreview.exp * 1000 : null;
  const tokenExpired =
    expiresAtMs != null && Number.isFinite(expiresAtMs) && Date.now() > expiresAtMs;

  const legacyRaw = useMemo(
    () => parseClientUploadPagesFromSearch(location.search),
    [location.search],
  );
  const pagesFromLegacy = useMemo(() => orderedSelectedPages(legacyRaw), [legacyRaw]);

  /** Signed links (`t=`): pages come only from the token payload — never merge loose `pages=` query params. */
  const pages = useMemo(() => {
    if (!rawToken.length) return pagesFromLegacy;
    if (!tokenPreview?.pages?.length || tokenExpired) return [];
    return orderedSelectedPages(tokenPreview.pages as string[]);
  }, [rawToken.length, tokenPreview?.pages, tokenExpired, pagesFromLegacy]);

  const tokenMalformed = rawToken.length > 0 && tokenPreview === null;

  const tokenPagesDecodeButUnmatched =
    rawToken.length > 0 &&
    tokenPreview !== null &&
    !tokenExpired &&
    Boolean(tokenPreview.pages?.length) &&
    pages.length === 0;

  const uploadsAllowed =
    rawToken.length > 0 &&
    tokenPreview !== null &&
    pages.length > 0 &&
    !tokenMalformed &&
    !tokenExpired;

  usePageSeo({
    meta: pageMeta.clientUpload,
    structuredData: [
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Upload media', path: '/client-upload'},
      ]),
    ],
  });

  const hasPages = pages.length > 0;

  const simulateUploadOnly =
    devLayoutPreview &&
    hasPages &&
    !uploadsAllowed &&
    !tokenMalformed &&
    !tokenExpired &&
    !tokenPagesDecodeButUnmatched;

  const opsBucketDetails =
    uploadsAllowed && tokenPreview?.folder ? (
      <details className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
        <summary className="cursor-pointer select-none text-white/70 outline-offset-2 hover:text-white/85">
          Technical details (storage path)
        </summary>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-emerald-100/80">
          client-media/{tokenPreview.folder}/…
        </p>
      </details>
    ) : simulateUploadOnly ? (
      <details className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55">
        <summary className="cursor-pointer select-none text-white/70 outline-offset-2 hover:text-white/85">
          Example storage layout (dev preview)
        </summary>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/60">
          client-media/your-client-name-xxxx/[page]/[date]-[filename]
        </p>
      </details>
    ) : null;

  return (
    <div className="pt-20 pb-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 md:px-6">
        <header className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Website images &amp; videos
          </h1>
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            Upload photos and videos for each page you chose on your questionnaire. Each section below matches
            one page on your site — use as many files as you need per section.
          </p>
          {import.meta.env.DEV ? (
            <p className="text-xs leading-relaxed text-white/45">
              Dev: draft UI without signing uses{' '}
              <code className="text-white/70">?preview=1&amp;pages=Home&amp;pages=About</code>. Signed links from
              questionnaire emails upload for real.
            </p>
          ) : null}
        </header>

        {devLayoutPreview ? (
          <p className="rounded-lg border border-violet-400/35 bg-violet-950/30 px-4 py-3 text-sm text-violet-100/95">
            <strong className="text-white">Development layout preview</strong> (<code>?preview=1</code>). This mode
            is disabled in production builds. Below is the client-facing UI; picking files{' '}
            simulates success only.&nbsp;
            Configure <code className="text-white/90">CLIENT_UPLOAD_SECRET</code> and use the signed upload link
            from a questionnaire submission to test real uploads to R2.
          </p>
        ) : null}

        {tokenExpired ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/35 px-4 py-4 text-amber-100/90">
            <strong className="text-amber-50">This upload link has expired.</strong>{' '}
            Contact Kicero for a replacement link (links are typically valid about 90 days).
          </p>
        ) : null}

        {tokenMalformed ? (
          <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-4 text-white/75">
            <strong className="text-white/85">Could not read this upload link.</strong>{' '}
            Please paste the URL exactly as emailed, without editing.
          </p>
        ) : null}

        {hasPages && !uploadsAllowed && !tokenMalformed && !devLayoutPreview ? (
          <p className="rounded-lg border border-sky-500/25 bg-sky-950/30 px-4 py-4 text-sky-100/90">
            Preview only:&nbsp; this URL lists your pages but is not signed for uploading.&nbsp; Use the{' '}
            <strong className="text-white">personalised upload link</strong> from your latest questionnaire email
            (includes a long <code className="text-white/95">t=</code> section) once{' '}
            <code className="text-white/95">CLIENT_UPLOAD_SECRET</code> is configured on the server.
          </p>
        ) : null}

        {tokenPagesDecodeButUnmatched ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/35 px-4 py-4 text-amber-100/90">
            <strong className="text-amber-50">This link&apos;s page list could not be matched.</strong>{' '}
            Please open the upload URL exactly as sent by Kicero, or reply to your questionnaire email so we can
            send a fresh link.
          </p>
        ) : null}

        {uploadsAllowed ? (
          <p className="rounded-md border border-emerald-500/20 bg-emerald-950/25 px-3 py-2 text-sm leading-relaxed text-emerald-100/90">
            You&apos;re ready to upload — choose files under each page below. Everything is sent securely to our
            team for your build.
          </p>
        ) : null}

        {opsBucketDetails}

        {hasPages ? (
          <ul className="flex flex-col gap-3">
            {pages.map((page) => (
              <li key={page}>
                <PageUploadRow
                  pageLabel={page}
                  uploadToken={rawToken}
                  uploadsAllowed={uploadsAllowed}
                  simulateUploadOnly={simulateUploadOnly}
                />
              </li>
            ))}
          </ul>
        ) : !tokenMalformed && !tokenExpired && !tokenPagesDecodeButUnmatched ? (
          <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-4 text-white/75">
            <strong className="text-white/85">Invalid or expired link.</strong>{' '}
            {devLayoutPreview ? (
              <>
                With <code className="text-white/85">preview=1</code>, include page names,&nbsp;e.g.&nbsp;
                <code className="text-white/85">?preview=1&amp;pages=Home&amp;pages=About</code>.
              </>
            ) : (
              <>
                Please use the personalised upload URL you received from Kicero, or get in touch and we will
                send a new one.&nbsp;
                {rawToken.length > 0
                  ? '(If your link was clipped or shortened by email, paste the full URL.)'
                  : ''}
              </>
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
