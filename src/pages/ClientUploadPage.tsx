import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {
  orderedSelectedPages,
  parseClientUploadPagesFromSearch,
} from '../data/questionnaire';
import {decodeClientUploadTokenForUi} from '../lib/clientUploadToken';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';
import {usePageSeo} from '../seo/usePageSeo';

type FileStatus =
  | {kind: 'queued'}
  | {kind: 'uploading'; progress: number}
  | {kind: 'done'; url?: string}
  | {kind: 'error'; message: string};

interface TrackedFile {
  id: string;
  file: File;
  previewUrl?: string;
  status: FileStatus;
}

const MAX_PARALLEL_PER_PAGE = 3;
const MAX_BYTES_PER_FILE = 500 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function presignClientUpload(args: {
  token: string;
  pageLabel: string;
  file: File;
}): Promise<{putUrl: string; url?: string}> {
  const res = await fetch('/api/client-upload/presign', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      token: args.token,
      pageLabel: args.pageLabel,
      filename: args.file.name,
      contentType: args.file.type || 'application/octet-stream',
      size: args.file.size,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    putUrl?: string;
    url?: string;
    error?: string;
  };
  if (!res.ok || !data.putUrl) {
    throw new Error(data.error ?? `Could not start upload (${res.status}).`);
  }
  return {putUrl: data.putUrl, url: data.url};
}

function putWithProgress(args: {
  url: string;
  file: File;
  onProgress: (pct: number) => void;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', args.url, true);
    xhr.setRequestHeader('Content-Type', args.file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        args.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onerror = () =>
      reject(new Error('Network error during upload (check connection or CORS).'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        args.onProgress(100);
        resolve();
      } else {
        reject(new Error(`Upload rejected by storage (HTTP ${xhr.status}).`));
      }
    };
    xhr.send(args.file);
  });
}

interface PageUploadSectionProps {
  pageLabel: string;
  uploadToken: string;
  uploadsAllowed: boolean;
  simulateUploadOnly?: boolean;
}

function PageUploadSection({
  pageLabel,
  uploadToken,
  uploadsAllowed,
  simulateUploadOnly,
}: PageUploadSectionProps) {
  const inputId = useId();
  const [files, setFiles] = useState<TrackedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const canPickFiles = uploadsAllowed || Boolean(simulateUploadOnly);

  useEffect(() => {
    return () => {
      setFiles((current) => {
        current.forEach((f) => f.previewUrl && URL.revokeObjectURL(f.previewUrl));
        return current;
      });
    };
  }, []);

  const updateFile = useCallback(
    (id: string, patch: Partial<TrackedFile> | ((f: TrackedFile) => Partial<TrackedFile>)) => {
      setFiles((current) =>
        current.map((f) => {
          if (f.id !== id) return f;
          const next = typeof patch === 'function' ? patch(f) : patch;
          return {...f, ...next};
        }),
      );
    },
    [],
  );

  const uploadOne = useCallback(
    async (tracked: TrackedFile) => {
      if (tracked.file.size > MAX_BYTES_PER_FILE) {
        updateFile(tracked.id, {
          status: {kind: 'error', message: 'File exceeds 500 MB limit.'},
        });
        return;
      }

      updateFile(tracked.id, {status: {kind: 'uploading', progress: 0}});

      try {
        if (simulateUploadOnly && !uploadsAllowed) {
          for (let p = 10; p <= 100; p += 10) {
            await new Promise((r) => setTimeout(r, 60));
            updateFile(tracked.id, {status: {kind: 'uploading', progress: p}});
          }
          updateFile(tracked.id, {status: {kind: 'done'}});
          return;
        }

        const {putUrl, url} = await presignClientUpload({
          token: uploadToken,
          pageLabel,
          file: tracked.file,
        });
        await putWithProgress({
          url: putUrl,
          file: tracked.file,
          onProgress: (pct) =>
            updateFile(tracked.id, {status: {kind: 'uploading', progress: pct}}),
        });
        updateFile(tracked.id, {status: {kind: 'done', url}});
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Upload failed.';
        updateFile(tracked.id, {status: {kind: 'error', message: msg}});
      }
    },
    [pageLabel, simulateUploadOnly, updateFile, uploadToken, uploadsAllowed],
  );

  const enqueue = useCallback(
    (incoming: File[]) => {
      if (!canPickFiles || incoming.length === 0) return;
      const tracked: TrackedFile[] = incoming.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: {kind: 'queued'},
      }));
      setFiles((prev) => [...prev, ...tracked]);

      const queue = [...tracked];
      const workers = Array.from({length: Math.min(MAX_PARALLEL_PER_PAGE, queue.length)}, async () => {
        while (queue.length > 0) {
          const next = queue.shift();
          if (!next) return;
          await uploadOne(next);
        }
      });
      Promise.all(workers).catch(() => undefined);
    },
    [canPickFiles, uploadOne],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    enqueue(list);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    if (!canPickFiles) return;
    const dropped = Array.from(e.dataTransfer.files ?? []);
    enqueue(dropped);
  };

  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!canPickFiles) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const onDragLeave = () => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const retry = (tracked: TrackedFile) => {
    uploadOne(tracked).catch(() => undefined);
  };

  const remove = (id: string) => {
    setFiles((current) => {
      const removed = current.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((f) => f.id !== id);
    });
  };

  const doneCount = files.filter((f) => f.status.kind === 'done').length;
  const uploadingCount = files.filter((f) => f.status.kind === 'uploading').length;
  const errorCount = files.filter((f) => f.status.kind === 'error').length;

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm md:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={`${inputId}-heading`}
          className="font-display text-lg font-semibold tracking-tight text-white md:text-xl">
          {pageLabel}
        </h2>
        <p className="text-xs text-white/55">
          {files.length === 0
            ? 'Images & videos only · up to 500 MB each'
            : `${doneCount} uploaded · ${uploadingCount} in progress${errorCount ? ` · ${errorCount} failed` : ''}`}
        </p>
      </header>

      <input
        id={inputId}
        type="file"
        className="sr-only"
        multiple
        accept="image/*,video/*"
        onChange={onInputChange}
        disabled={!canPickFiles}
      />
      <label
        htmlFor={inputId}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-disabled={!canPickFiles}
        className={
          (canPickFiles ? 'cursor-pointer ' : 'cursor-not-allowed ') +
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ' +
          (isDragging
            ? 'border-emerald-400/70 bg-emerald-500/10 text-emerald-50'
            : canPickFiles
              ? 'border-white/25 bg-white/[0.03] text-white/80 hover:border-white/40 hover:bg-white/[0.06]'
              : 'border-white/10 bg-white/[0.02] text-white/35')
        }>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-8 w-8 text-current"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
        <span className="text-sm font-medium">
          {canPickFiles ? (
            <>
              <span className="text-white">Drag photos &amp; videos here</span>
              <span className="text-white/60"> or </span>
              <span className="underline decoration-white/40 underline-offset-4">click to choose files</span>
            </>
          ) : (
            'Uploads unavailable for this link.'
          )}
        </span>
        <span className="text-xs text-white/45">
          Multiple files allowed · {simulateUploadOnly && !uploadsAllowed ? 'dev preview (no real upload)' : 'sent securely to Kicero'}
        </span>
      </label>

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((tracked) => (
            <li
              key={tracked.id}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/40">
                {tracked.previewUrl ? (
                  <img
                    src={tracked.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/40">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h12v12H4z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 9l4-2v10l-4-2" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white/90">{tracked.file.name}</p>
                <p className="text-[11px] text-white/45">
                  {formatBytes(tracked.file.size)}
                  {tracked.status.kind === 'uploading' ? ` · ${tracked.status.progress}%` : ''}
                  {tracked.status.kind === 'done' ? ' · saved' : ''}
                  {tracked.status.kind === 'error' ? ` · ${tracked.status.message}` : ''}
                </p>
                {tracked.status.kind === 'uploading' && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400/80 transition-[width] duration-200"
                      style={{width: `${tracked.status.progress}%`}}
                    />
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {tracked.status.kind === 'done' ? (
                  <span
                    aria-label="Uploaded"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                    </svg>
                  </span>
                ) : tracked.status.kind === 'error' ? (
                  <button
                    type="button"
                    onClick={() => retry(tracked)}
                    className="rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs text-white/85 hover:bg-white/10">
                    Retry
                  </button>
                ) : null}
                {tracked.status.kind !== 'uploading' && (
                  <button
                    type="button"
                    aria-label={`Remove ${tracked.file.name}`}
                    onClick={() => remove(tracked.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/45 hover:bg-white/10 hover:text-white/80">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
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

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 md:px-6">
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Upload your website images &amp; videos
          </h1>
          <p className="text-sm leading-relaxed text-white/70 md:text-base">
            One section per page you picked on the questionnaire. Drop in photos and videos, or click to
            browse — uploads run in the background and we&apos;ll use them when building your site.
          </p>
        </header>

        {tokenExpired ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/35 px-4 py-4 text-amber-100/90">
            <strong className="text-amber-50">This upload link has expired.</strong>{' '}
            Reply to your questionnaire email and we&apos;ll send you a fresh link (links are valid for about 90 days).
          </p>
        ) : null}

        {tokenMalformed ? (
          <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-4 text-white/75">
            <strong className="text-white/85">Could not read this upload link.</strong>{' '}
            Please paste the URL from your email exactly as we sent it, without editing or trimming.
          </p>
        ) : null}

        {tokenPagesDecodeButUnmatched ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/35 px-4 py-4 text-amber-100/90">
            <strong className="text-amber-50">This link&apos;s page list could not be matched.</strong>{' '}
            Please open the URL exactly as we sent it, or reply to your questionnaire email so we can send a fresh link.
          </p>
        ) : null}

        {hasPages && !uploadsAllowed && !tokenMalformed && !devLayoutPreview && !tokenExpired ? (
          <p className="rounded-lg border border-sky-500/25 bg-sky-950/30 px-4 py-4 text-sky-100/90">
            <strong className="text-white">Preview only.</strong> This URL lists your pages but is not signed for uploading.
            Use the personalised link from your latest questionnaire email (long <code className="text-white/95">t=</code>{' '}
            section in the URL).
          </p>
        ) : null}

        {devLayoutPreview ? (
          <p className="rounded-lg border border-violet-400/35 bg-violet-950/30 px-4 py-3 text-sm text-violet-100/95">
            <strong className="text-white">Dev preview</strong> — uploads are simulated (no R2 calls). Use a signed link from
            a real questionnaire submission to test live uploads.
          </p>
        ) : null}

        {uploadsAllowed ? (
          <p className="rounded-lg border border-emerald-500/25 bg-emerald-950/30 px-4 py-3 text-sm leading-relaxed text-emerald-100/95">
            You&apos;re ready to upload. Files go straight to our secure storage, organised by page.
          </p>
        ) : null}

        {hasPages ? (
          <ul className="flex flex-col gap-5">
            {pages.map((page) => (
              <li key={page}>
                <PageUploadSection
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
                Add page names to the URL,&nbsp;e.g.&nbsp;
                <code className="text-white/85">?preview=1&amp;pages=Home&amp;pages=About</code>.
              </>
            ) : (
              <>
                Please open the upload link we sent you, or get in touch and we&apos;ll send a new one.
              </>
            )}
          </p>
        ) : null}

        {(uploadsAllowed && tokenPreview?.folder) || simulateUploadOnly ? (
          <details className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
            <summary className="cursor-pointer select-none text-white/65 outline-offset-2 hover:text-white/85">
              Technical details (storage path)
            </summary>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-white/60">
              {uploadsAllowed && tokenPreview?.folder
                ? `client-media/${tokenPreview.folder}/{page}/{date}-{filename}`
                : 'client-media/your-client-name-xxxx/{page}/{date}-{filename}'}
            </p>
          </details>
        ) : null}
      </div>
    </div>
  );
}
