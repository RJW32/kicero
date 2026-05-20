import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {ChevronDown} from 'lucide-react';
import {
  orderedSelectedPages,
  parseClientUploadPagesFromSearch,
} from '../data/questionnaire';
import {decodeClientUploadTokenForUi} from '../lib/clientUploadToken';
import {
  CLIENT_PORTAL_MAX_BYTES_TOTAL_PER_PAGE,
  DEFAULT_MAX_BYTES,
} from '../lib/questionnaireUploadPolicy';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';
import {usePageSeo} from '../seo/usePageSeo';

type SectionStats = {
  queued: number;
  uploading: number;
  done: number;
  error: number;
};

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
const MAX_MB_TOTAL_PER_PAGE = Math.round(CLIENT_PORTAL_MAX_BYTES_TOTAL_PER_PAGE / (1024 * 1024));
const MAX_MB_SINGLE_FILE = Math.round(DEFAULT_MAX_BYTES / (1024 * 1024));

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
  disableFilePick?: boolean;
  onStatsChange?: (pageLabel: string, stats: SectionStats) => void;
  onRegisterUploadAll?: (pageLabel: string, fn: (() => void) | null) => void;
}

function PageUploadSection({
  pageLabel,
  uploadToken,
  uploadsAllowed,
  simulateUploadOnly,
  disableFilePick,
  onStatsChange,
  onRegisterUploadAll,
}: PageUploadSectionProps) {
  const inputId = useId();
  const [files, setFiles] = useState<TrackedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [filesListOpen, setFilesListOpen] = useState(true);
  const [pageSizeError, setPageSizeError] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const filesRef = useRef<TrackedFile[]>([]);
  filesRef.current = files;

  const canPickFiles = (uploadsAllowed || Boolean(simulateUploadOnly)) && !disableFilePick;

  useEffect(() => {
    if (files.length > 0) setFilesListOpen(true);
  }, [files.length]);

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
      if (tracked.file.size > DEFAULT_MAX_BYTES) {
        updateFile(tracked.id, {
          status: {kind: 'error', message: `File exceeds ${MAX_MB_SINGLE_FILE} MB (single-file limit).`},
        });
        return;
      }

      const othersSum = filesRef.current
        .filter((f) => f.id !== tracked.id)
        .reduce((a, f) => a + f.file.size, 0);
      if (othersSum + tracked.file.size > CLIENT_PORTAL_MAX_BYTES_TOTAL_PER_PAGE) {
        updateFile(tracked.id, {
          status: {
            kind: 'error',
            message: `With your other files on this page, this would go over the ${MAX_MB_TOTAL_PER_PAGE} MB total limit.`,
          },
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

  const runUploadWorkers = useCallback(
    (batch: TrackedFile[]) => {
      if (batch.length === 0) return;
      const queue = [...batch];
      const workers = Array.from(
        {length: Math.min(MAX_PARALLEL_PER_PAGE, queue.length)},
        async () => {
          while (queue.length > 0) {
            const next = queue.shift();
            if (!next) return;
            await uploadOne(next);
          }
        },
      );
      Promise.all(workers).catch(() => undefined);
    },
    [uploadOne],
  );

  const uploadAllQueuedInSection = useCallback(() => {
    const pending = filesRef.current.filter((f) => f.status.kind === 'queued');
    runUploadWorkers(pending);
  }, [runUploadWorkers]);

  useEffect(() => {
    onRegisterUploadAll?.(pageLabel, uploadAllQueuedInSection);
    return () => onRegisterUploadAll?.(pageLabel, null);
  }, [onRegisterUploadAll, pageLabel, uploadAllQueuedInSection]);

  const enqueue = useCallback(
    (incoming: File[]) => {
      if (!canPickFiles || incoming.length === 0) return;
      const currentSum = filesRef.current.reduce((a, f) => a + f.file.size, 0);
      const incomingSum = incoming.reduce((a, f) => a + f.size, 0);
      for (const file of incoming) {
        if (file.size > DEFAULT_MAX_BYTES) {
          setPageSizeError(
            `Each file must be ${MAX_MB_SINGLE_FILE} MB or smaller. "${file.name}" is too large.`,
          );
          return;
        }
      }
      if (currentSum + incomingSum > CLIENT_PORTAL_MAX_BYTES_TOTAL_PER_PAGE) {
        setPageSizeError(
          `These files would go over the ${MAX_MB_TOTAL_PER_PAGE} MB total limit for this page. Remove some files or use smaller ones.`,
        );
        return;
      }
      setPageSizeError(null);
      const tracked: TrackedFile[] = incoming.map((file, i) => ({
        id: `${Date.now()}-${i}-${file.name}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        status: {kind: 'queued'},
      }));
      setFiles((prev) => [...prev, ...tracked]);
    },
    [canPickFiles],
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
    setPageSizeError(null);
    setFiles((current) => {
      const removed = current.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((f) => f.id !== id);
    });
  };

  const queuedCount = files.filter((f) => f.status.kind === 'queued').length;
  const doneCount = files.filter((f) => f.status.kind === 'done').length;
  const uploadingCount = files.filter((f) => f.status.kind === 'uploading').length;
  const errorCount = files.filter((f) => f.status.kind === 'error').length;

  useEffect(() => {
    onStatsChange?.(pageLabel, {queued: queuedCount, uploading: uploadingCount, done: doneCount, error: errorCount});
  }, [pageLabel, queuedCount, uploadingCount, doneCount, errorCount, onStatsChange]);

  const pageTotalBytes = files.reduce((a, f) => a + f.file.size, 0);

  const statusSummary =
    files.length === 0
      ? `Images and videos · up to ${MAX_MB_TOTAL_PER_PAGE} MB total for this page`
      : [
          `${formatBytes(pageTotalBytes)} / ${MAX_MB_TOTAL_PER_PAGE} MB for this page`,
          queuedCount ? `${queuedCount} ready to upload` : null,
          uploadingCount ? `${uploadingCount} uploading` : null,
          doneCount ? `${doneCount} sent` : null,
          errorCount ? `${errorCount} failed` : null,
        ]
          .filter(Boolean)
          .join(' · ');

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="rounded-sm border border-brand-gray-200 bg-brand-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:p-6">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-gray-500">
            For this page
          </p>
          <h2
            id={`${inputId}-heading`}
            className="font-display text-lg font-bold tracking-tight text-brand-black md:text-xl">
            {pageLabel}
          </h2>
        </div>
        <p className="text-xs leading-snug text-brand-gray-600 sm:max-w-[240px] sm:text-right">{statusSummary}</p>
      </header>

      <p className="mb-3 text-sm leading-relaxed text-brand-gray-600">
        Add photos or videos for this page. When everything is ready, use the upload button at the bottom of the page to
        send all sections together.
      </p>

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
          (canPickFiles ? 'cursor-pointer ' : 'cursor-not-allowed opacity-60 ') +
          'flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed px-6 py-8 text-center transition-colors ' +
          (isDragging
            ? 'border-brand-black bg-brand-gray-100 text-brand-black'
            : canPickFiles
              ? 'border-brand-gray-300 bg-brand-gray-50/80 text-brand-gray-700 hover:border-brand-gray-400'
              : 'border-brand-gray-200 bg-brand-gray-50/50 text-brand-gray-500')
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
        <span className="text-sm font-semibold text-brand-black">
          {canPickFiles ? (
            <>
              Drop photos or videos here{' '}
              <span className="font-normal text-brand-gray-600">or </span>
              <span className="underline decoration-brand-gray-400 underline-offset-4">browse files</span>
            </>
          ) : disableFilePick ? (
            'Adding more files is paused while an upload is in progress, or this link has already been used.'
          ) : (
            'Uploads are not available for this link.'
          )}
        </span>
        <span className="text-xs text-brand-gray-600">
          Multiple files allowed.{' '}
          {simulateUploadOnly && !uploadsAllowed ? 'Dev preview only (simulated upload).' : 'Delivered over an encrypted connection.'}
        </span>
      </label>

      {pageSizeError ? (
        <p className="mt-3 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950" role="alert">
          {pageSizeError}
        </p>
      ) : null}

      {files.length > 0 ? (
        <>
          <button
            type="button"
            aria-expanded={filesListOpen}
            onClick={() => setFilesListOpen((o) => !o)}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-sm border border-brand-gray-200 bg-brand-gray-50 px-3 py-2.5 text-left text-sm font-semibold text-brand-black transition-colors hover:bg-brand-gray-100">
            <span>
              {filesListOpen ? 'Hide' : 'Show'} file list ({files.length})
            </span>
            <ChevronDown
              aria-hidden
              className={`h-4 w-4 shrink-0 text-brand-gray-600 transition-transform duration-200 ${filesListOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {filesListOpen ? (
            <ul className="mt-2 flex flex-col gap-2 border-t border-brand-gray-100 pt-3">
              {files.map((tracked) => (
                <li
                  key={tracked.id}
                  className="flex items-center gap-3 rounded-sm border border-brand-gray-200 bg-brand-gray-50/80 px-3 py-2">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-brand-gray-200 bg-brand-white">
                    {tracked.previewUrl ? (
                      <img
                        src={tracked.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-gray-400">
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
                    <p className="truncate text-sm font-medium text-brand-black">{tracked.file.name}</p>
                    <p className="text-[11px] text-brand-gray-600">
                      {formatBytes(tracked.file.size)}
                      {tracked.status.kind === 'uploading' ? ` · ${tracked.status.progress}%` : ''}
                      {tracked.status.kind === 'done' ? ' · Sent to Kicero' : ''}
                      {tracked.status.kind === 'queued' ? ' · Waiting for upload' : ''}
                      {tracked.status.kind === 'error' ? ` · ${tracked.status.message}` : ''}
                    </p>
                    {tracked.status.kind === 'uploading' && (
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-brand-gray-200">
                        <div
                          className="h-full rounded-full bg-brand-black transition-[width] duration-200"
                          style={{width: `${tracked.status.progress}%`}}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {tracked.status.kind === 'done' ? (
                      <span
                        aria-label="Uploaded"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-gray-200 text-brand-black">
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
                        className="rounded-sm border border-brand-gray-300 bg-brand-white px-2 py-1 text-xs font-semibold uppercase tracking-wider text-brand-black hover:bg-brand-gray-50">
                        Retry
                      </button>
                    ) : null}
                    {tracked.status.kind !== 'uploading' && canPickFiles && (
                      <button
                        type="button"
                        aria-label={`Remove ${tracked.file.name}`}
                        onClick={() => remove(tracked.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-brand-gray-500 hover:bg-brand-gray-200 hover:text-brand-black">
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
          ) : null}
        </>
      ) : null}
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

  const completedStorageKey = useMemo(() => {
    const sig = rawToken || `preview:${pages.join('|')}`;
    return `kicero:client-upload-link-used:${sig}`;
  }, [rawToken, pages]);

  const [linkUsed, setLinkUsed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(completedStorageKey) === '1') setLinkUsed(true);
    } catch {
      // ignore
    }
  }, [completedStorageKey]);

  const [sectionStats, setSectionStats] = useState<Record<string, SectionStats>>({});
  const uploadAllByPageRef = useRef<Map<string, () => void>>(new Map());

  const handleSectionStats = useCallback((pageLabel: string, stats: SectionStats) => {
    setSectionStats((prev) => ({...prev, [pageLabel]: stats}));
  }, []);

  const registerSectionUploadAll = useCallback((pageLabel: string, fn: (() => void) | null) => {
    const m = uploadAllByPageRef.current;
    if (fn) m.set(pageLabel, fn);
    else m.delete(pageLabel);
  }, []);

  const aggregated = useMemo(() => {
    const values = Object.values(sectionStats);
    return values.reduce(
      (acc, s) => ({
        queued: acc.queued + s.queued,
        uploading: acc.uploading + s.uploading,
        done: acc.done + s.done,
        error: acc.error + s.error,
      }),
      {queued: 0, uploading: 0, done: 0, error: 0},
    );
  }, [sectionStats]);

  const totalQueued = aggregated.queued;

  const uploadAllSections = useCallback(() => {
    for (const fn of uploadAllByPageRef.current.values()) {
      fn();
    }
  }, []);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [uploadCommittedOnce, setUploadCommittedOnce] = useState(false);

  useEffect(() => {
    if (!uploadCommittedOnce) return;
    if (aggregated.queued > 0 || aggregated.uploading > 0) return;
    if (aggregated.error > 0) return;
    if (aggregated.done > 0) {
      try {
        localStorage.setItem(completedStorageKey, '1');
      } catch {
        // ignore
      }
      setLinkUsed(true);
      setUploadCommittedOnce(false);
    }
  }, [uploadCommittedOnce, aggregated, completedStorageKey]);

  const disableFilePick =
    linkUsed ||
    (uploadCommittedOnce && (aggregated.queued > 0 || aggregated.uploading > 0));

  const canUseUploader = uploadsAllowed || simulateUploadOnly;

  const showBottomBar =
    canUseUploader && hasPages && !linkUsed && (totalQueued > 0 || aggregated.uploading > 0);

  const openConfirmModal = () => setShowConfirmModal(true);

  const closeConfirmModal = () => setShowConfirmModal(false);

  const confirmUpload = () => {
    setShowConfirmModal(false);
    setUploadCommittedOnce(true);
    uploadAllSections();
  };

  return (
    <section className="relative z-[1] pt-32 pb-24 px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-brand-black">
            Send us your images &amp; videos
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-brand-gray-600 md:text-base">
            These uploads are grouped by the pages you chose in your questionnaire. Add files in each section, then
            scroll down to send everything in one go. After a successful upload, this link cannot be used again — contact
            us if you need to send more.
          </p>
          {canUseUploader && hasPages && !linkUsed ? (
            <ol className="max-w-3xl list-decimal space-y-2 pl-5 text-sm text-brand-gray-700 marker:font-semibold marker:text-brand-black">
              <li>Open each section below that matches a page on your site.</li>
              <li>Drop files in or browse.</li>
              <li>
                When you&apos;re ready, use the <strong className="text-brand-black">Upload</strong> button at the bottom
                of the page. You&apos;ll be asked to confirm before anything is sent.
              </li>
            </ol>
          ) : null}
        </header>

        {linkUsed && hasPages ? (
          <div className="rounded-sm border border-brand-gray-200 bg-brand-white px-4 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="font-display text-xl font-bold text-brand-black">Thank you — we&apos;ve received your files</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-gray-700">
              This upload link has already been used on this device. If you still have files to share, reply to your
              questionnaire email and we&apos;ll help you with the next steps.
            </p>
          </div>
        ) : null}

        {tokenExpired ? (
          <p className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <strong className="font-semibold">This upload link has expired.</strong>{' '}
            Reply to your questionnaire email and we&apos;ll send you a fresh link (links are valid for about 90 days).
          </p>
        ) : null}

        {tokenMalformed ? (
          <p className="rounded-sm border border-brand-gray-200 bg-brand-gray-50 px-4 py-4 text-sm text-brand-gray-800">
            <strong className="font-semibold text-brand-black">We could not read this upload link.</strong>{' '}
            Please paste the URL from your email exactly as we sent it, without editing or trimming.
          </p>
        ) : null}

        {tokenPagesDecodeButUnmatched ? (
          <p className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
            <strong className="font-semibold">This link&apos;s page list could not be matched.</strong>{' '}
            Please open the URL exactly as we sent it, or reply to your questionnaire email so we can send a fresh link.
          </p>
        ) : null}

        {hasPages && !uploadsAllowed && !tokenMalformed && !devLayoutPreview && !tokenExpired ? (
          <p className="rounded-sm border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-950">
            <strong className="font-semibold text-brand-black">Preview only.</strong> This URL lists your pages but is
            not signed for uploading. Use the personalised link from your latest questionnaire email (the long{' '}
            <code className="rounded-sm bg-brand-white px-1 py-0.5 text-xs text-brand-black ring-1 ring-brand-gray-200">
              t=
            </code>{' '}
            part in the address bar).
          </p>
        ) : null}

        {devLayoutPreview ? (
          <p className="rounded-sm border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950">
            <strong className="font-semibold text-brand-black">Dev preview</strong> — uploads are simulated (no storage
            calls). Use a signed link from a real questionnaire submission to test live uploads.
          </p>
        ) : null}

        {uploadsAllowed && !linkUsed ? (
          <p className="rounded-sm border border-brand-gray-200 bg-brand-white px-4 py-3 text-sm leading-relaxed text-brand-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <strong className="text-brand-black">Your upload link is active.</strong> Files are stored securely and
            labelled by page so we can place them when we build your site.
          </p>
        ) : null}

        {hasPages && !linkUsed ? (
          <ul className="flex flex-col gap-8">
            {pages.map((page) => (
              <li key={page}>
                <PageUploadSection
                  pageLabel={page}
                  uploadToken={rawToken}
                  uploadsAllowed={uploadsAllowed}
                  simulateUploadOnly={simulateUploadOnly}
                  disableFilePick={disableFilePick}
                  onStatsChange={handleSectionStats}
                  onRegisterUploadAll={registerSectionUploadAll}
                />
              </li>
            ))}
          </ul>
        ) : !linkUsed && !tokenMalformed && !tokenExpired && !tokenPagesDecodeButUnmatched ? (
          <p className="rounded-sm border border-brand-gray-200 bg-brand-gray-50 px-4 py-4 text-sm text-brand-gray-800">
            <strong className="font-semibold text-brand-black">Invalid or expired link.</strong>{' '}
            {devLayoutPreview ? (
              <>
                Add page names to the URL, for example{' '}
                <code className="rounded-sm bg-brand-white px-1.5 py-0.5 text-xs text-brand-black ring-1 ring-brand-gray-200">
                  ?preview=1&amp;pages=Home&amp;pages=About
                </code>
                .
              </>
            ) : (
              <>Please open the upload link we sent you, or get in touch and we&apos;ll send a new one.</>
            )}
          </p>
        ) : null}

        {showBottomBar ? (
          <div className="flex w-full justify-center px-2">
            <div className="flex w-full max-w-xl flex-col gap-3 rounded-sm border border-brand-gray-200 bg-brand-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-brand-gray-700">
                <p className="font-display font-bold text-brand-black">
                  {aggregated.uploading > 0 ? 'Uploading…' : 'Ready to send'}
                </p>
                <p className="mt-1 text-brand-gray-600">
                  {aggregated.uploading > 0 ? (
                    <>Please keep this page open until your files finish sending.</>
                  ) : (
                    <>
                      <span className="font-semibold text-brand-black">{totalQueued}</span> file
                      {totalQueued !== 1 ? 's' : ''} waiting across all sections.
                    </>
                  )}
                </p>
              </div>
              {aggregated.uploading > 0 ? (
                <span className="shrink-0 py-4 px-6 text-center text-xs font-bold uppercase tracking-widest text-brand-gray-500">
                  In progress
                </span>
              ) : (
                <button
                  type="button"
                  onClick={openConfirmModal}
                  className="shrink-0 py-4 px-6 bg-brand-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors">
                  Upload {totalQueued} file{totalQueued !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {showConfirmModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={closeConfirmModal}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-upload-confirm-title"
            className="w-full max-w-md rounded-sm border border-brand-gray-200 bg-brand-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            onClick={(e) => e.stopPropagation()}>
            <h2 id="client-upload-confirm-title" className="font-display text-lg font-bold text-brand-black">
              Confirm you want to upload
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-gray-700">
              You&apos;re about to send{' '}
              <strong className="text-brand-black">
                {totalQueued} file{totalQueued !== 1 ? 's' : ''}
              </strong>{' '}
              to Kicero. After everything finishes successfully, this page will stop accepting new uploads for this link
              on this device. If you&apos;re unsure, go back and check your lists first.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="py-3 px-5 border border-brand-black text-xs font-bold uppercase tracking-widest text-brand-black hover:bg-brand-gray-50 transition-colors">
                Go back
              </button>
              <button
                type="button"
                onClick={confirmUpload}
                className="py-3 px-5 bg-brand-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors">
                Confirm upload
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
