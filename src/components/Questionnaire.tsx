import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {useSearchParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {
  questionnaireQuestions,
  questionnaireStepSections,
  type FileQuestion,
  type QuestionnaireQuestion,
} from '../data/questionnaire';
import {
  DEFAULT_MAX_BYTES,
  WORKER_PROXY_UPLOAD_MAX_BYTES,
} from '../lib/questionnaireUploadPolicy';
import {usePersistentForm} from '../hooks/usePersistentForm';

type AnswerValue = string | string[];

interface UploadedAsset {
  key: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
  relativePath?: string;
}

interface FormModel {
  clientName: string;
  answers: Record<string, AnswerValue>;
  files: UploadedAsset[];
}

const EMPTY_FORM: FormModel = {
  clientName: '',
  answers: {},
  files: [],
};

const groupedQuestions = questionnaireQuestions.reduce<Record<string, QuestionnaireQuestion[]>>(
  (acc, question) => {
    acc[question.section] = acc[question.section] ?? [];
    acc[question.section].push(question);
    return acc;
  },
  {},
);

function getWebkitRelativePath(file: File): string {
  const w = (file as File & {webkitRelativePath?: string}).webkitRelativePath;
  if (typeof w === 'string' && w.length > 0 && w !== file.name) return w;
  return '';
}

/** Safari/WebKit often uses "Load failed" instead of "Failed to fetch". */
function isLikelyFetchNetworkError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false;
  const m = err.message.toLowerCase();
  return (
    /fetch/i.test(m) ||
    m.includes('load failed') ||
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed')
  );
}

/** Same-origin multipart upload via Worker (avoids R2 CORS on direct PUT). */
async function uploadThroughWorkerMultipart(
  file: File,
  batchId: string,
  relativePath: string,
): Promise<UploadedAsset> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('batchId', batchId);
  if (relativePath) fd.append('relativePath', relativePath);
  let r: Response;
  try {
    r = await fetch('/api/questionnaire/upload', {method: 'POST', body: fd});
  } catch (e) {
    if (isLikelyFetchNetworkError(e)) {
      throw new Error(
        'Could not reach the upload API. Check your connection, or run `npm run dev` locally with the API server.',
      );
    }
    throw e;
  }
  if (!r.ok) {
    const b = (await r.json().catch(() => null)) as {error?: string} | null;
    throw new Error(b?.error ?? 'Multipart upload failed.');
  }
  return (await r.json()) as UploadedAsset;
}

export default function Questionnaire() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref')?.trim() ?? '';
  const batchIdRef = useRef('');
  const {value, setValue, restored, clear, setRestored} = usePersistentForm<FormModel>(
    `kicero:questionnaire:${ref || 'default'}`,
    EMPTY_FORM,
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  const totalSteps = questionnaireStepSections.length;
  const progressFraction = totalSteps ? (stepIndex + 1) / totalSteps : 1;

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, [stepIndex]);

  const filesQuestion = questionnaireQuestions.find((q) => q.type === 'files') as
    | FileQuestion
    | undefined;
  const maxFiles = filesQuestion?.maxFiles ?? 100;
  const maxBytesPerFile =
    (filesQuestion?.maxSizeMB ?? Math.round(DEFAULT_MAX_BYTES / (1024 * 1024))) * 1024 * 1024;
  const acceptUploads =
    filesQuestion?.accept ??
    'image/*,video/*,.pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx';

  function ensureBatchId(): string {
    if (!batchIdRef.current) {
      batchIdRef.current = crypto.randomUUID();
    }
    return batchIdRef.current;
  }

  function resetBatchId() {
    batchIdRef.current = crypto.randomUUID();
  }

  const setAnswer = (id: string, next: AnswerValue) => {
    setValue((prev) => ({...prev, answers: {...prev.answers, [id]: next}}));
  };

  const handleCheckToggle = (id: string, option: string) => {
    const current = value.answers[id];
    const asArray = Array.isArray(current) ? current : [];
    const next = asArray.includes(option)
      ? asArray.filter((item) => item !== option)
      : [...asArray, option];
    setAnswer(id, next);
  };

  const uploadSingleFile = async (file: File): Promise<UploadedAsset> => {
    if (file.size > maxBytesPerFile) {
      throw new Error(
        `File "${file.name}" exceeds the ${Math.round(maxBytesPerFile / (1024 * 1024))} MB limit.`,
      );
    }

    const relativePath = getWebkitRelativePath(file);
    const contentType = file.type || 'application/octet-stream';
    const batchId = ensureBatchId();

    let init: Response;
    try {
      init = await fetch('/api/questionnaire/upload-url', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          batchId,
          filename: file.name,
          contentType,
          size: file.size,
          relativePath: relativePath || undefined,
        }),
      });
    } catch (e) {
      if (isLikelyFetchNetworkError(e)) {
        throw new Error(
          'Could not reach the upload API. Check your connection, or run `npm run dev` locally with the API server.',
        );
      }
      throw e;
    }

    if (init.ok) {
      const meta = (await init.json()) as {
        putUrl: string;
        key: string;
        url: string;
        filename: string;
      };
      let put: Response;
      try {
        put = await fetch(meta.putUrl, {
          method: 'PUT',
          body: file,
          headers: {'Content-Type': contentType},
        });
      } catch (e) {
        if (
          isLikelyFetchNetworkError(e) &&
          file.size <= WORKER_PROXY_UPLOAD_MAX_BYTES
        ) {
          return await uploadThroughWorkerMultipart(file, batchId, relativePath);
        }
        if (isLikelyFetchNetworkError(e)) {
          throw new Error(
            `This file is about ${Math.round(file.size / (1024 * 1024))} MB; direct browser uploads need R2 CORS configured for this site's exact URL (www vs non-www). Ask Kicero to fix CORS, use a smaller file (under ${Math.round(WORKER_PROXY_UPLOAD_MAX_BYTES / (1024 * 1024))} MB can upload via the site instead), or try Chrome/Edge.`,
          );
        }
        throw e;
      }
      if (!put.ok) {
        if (file.size <= WORKER_PROXY_UPLOAD_MAX_BYTES) {
          try {
            return await uploadThroughWorkerMultipart(file, batchId, relativePath);
          } catch {
            /* prefer HTTP status message below */
          }
        }
        throw new Error(
          `Upload failed for "${file.name}" (${put.status}). If this persists, ask Kicero to check R2 CORS settings.`,
        );
      }
      return {
        key: meta.key,
        url: meta.url,
        filename: meta.filename,
        size: file.size,
        contentType,
        relativePath: relativePath || undefined,
      };
    }

    const errJson = (await init.json().catch(() => ({}))) as {
      error?: string;
      fallback?: boolean;
    };

    if (init.status === 501 && errJson.fallback) {
      return await uploadThroughWorkerMultipart(file, batchId, relativePath);
    }

    throw new Error(errJson.error ?? 'Could not start upload.');
  };

  const processFileList = async (selected: FileList | File[]) => {
    const list = Array.from(selected);
    if (list.length === 0) return;

    if (value.files.length + list.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} files.`);
      return;
    }

    setError('');
    setUploading(true);
    try {
      const newFiles: UploadedAsset[] = [];
      for (const file of list) {
        const asset = await uploadSingleFile(file);
        newFiles.push(asset);
      }
      setValue((prev) => ({...prev, files: [...prev.files, ...newFiles]}));
    } catch (uploadErr) {
      if (isLikelyFetchNetworkError(uploadErr)) {
        setError(
          'Upload failed: API server is not reachable. Run `npm run dev` (starts frontend + API) and try again.',
        );
      } else {
        setError(uploadErr instanceof Error ? uploadErr.message : 'Upload failed.');
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.currentTarget.files;
    if (!selected?.length) return;
    await processFileList(selected);
    e.currentTarget.value = '';
  };

  const removeFile = (key: string) => {
    setValue((prev) => ({...prev, files: prev.files.filter((file) => file.key !== key)}));
  };

  const submitQuestionnaire = async () => {
    if (!value.clientName.trim()) {
      setError('Please add your name so we can reach you.');
      return;
    }
    setStatus('submitting');
    setError('');
    try {
      const response = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          clientName: value.clientName.trim(),
          clientEmail: '',
          ref,
          answers: value.answers,
          files: value.files,
          website: '',
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {error?: string} | null;
        throw new Error(body?.error ?? 'Submission failed. Please try again.');
      }
      setStatus('success');
      clear();
      resetBatchId();
      setStepIndex(0);
    } catch (submitErr) {
      setStatus('idle');
      if (isLikelyFetchNetworkError(submitErr)) {
        setError(
          'Submission failed: API server is not reachable. Run `npm run dev` and try again.',
        );
      } else {
        setError(submitErr instanceof Error ? submitErr.message : 'Submission failed.');
      }
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (stepIndex < totalSteps - 1) {
      setError('');
      setStepIndex((i) => Math.min(totalSteps - 1, i + 1));
      return;
    }
    await submitQuestionnaire();
  };

  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-4">
          Website Questionnaire
        </h1>
        <p className="text-brand-gray-600 mb-2">Takes ~3 minutes. All questions optional.</p>
        {ref && (
          <p className="inline-block text-xs uppercase tracking-widest bg-brand-black text-white px-3 py-1 mb-4">
            Ref: {ref}
          </p>
        )}
        {restored && status === 'idle' && (
          <div className="mb-6 border border-brand-gray-300 bg-brand-gray-50 p-4 text-sm">
            Restored your previous progress.
            <button
              type="button"
              onClick={() => {
                clear();
                resetBatchId();
                setStepIndex(0);
                setRestored(false);
              }}
              className="ml-3 underline"
            >
              Start over
            </button>
          </div>
        )}

        {status === 'success' ? (
          <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="border p-8">
            <h2 className="text-2xl font-bold mb-3">Thanks, your questionnaire is submitted.</h2>
            <p className="text-brand-gray-600">Kicero will be in touch.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 text-sm text-brand-gray-600">
                <span>
                  Step {stepIndex + 1} of {totalSteps}
                </span>
                <span className="tabular-nums">{Math.round(progressFraction * 100)}%</span>
              </div>
              <div
                className="h-3 rounded-full bg-brand-gray-200 overflow-hidden shadow-inner"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-valuenow={stepIndex + 1}
                aria-label="Questionnaire progress"
              >
                <div
                  className="h-full bg-brand-black transition-[width] duration-300 ease-out rounded-full"
                  style={{width: `${progressFraction * 100}%`}}
                />
              </div>
              <input
                type="range"
                min={1}
                max={totalSteps}
                step={1}
                value={stepIndex + 1}
                disabled
                className="w-full h-2 accent-brand-black"
                aria-hidden
              />
            </div>

            <div className="border p-6 space-y-10">
              {stepIndex === 0 && (
                <div className="max-w-xl">
                  <Field
                    label="Your name"
                    value={value.clientName}
                    onChange={(next) => setValue((prev) => ({...prev, clientName: next}))}
                    required
                  />
                </div>
              )}

              {(questionnaireStepSections[stepIndex] ?? []).map((sectionKey) => {
                const questions = groupedQuestions[sectionKey] ?? [];
                if (questions.length === 0) return null;
                return (
                  <div key={sectionKey} className="space-y-5">
                    <h2 className="font-bold text-xl border-b border-brand-gray-200 pb-2">
                      {sectionKey}
                    </h2>
                    {questions.map((question) => (
                      <div key={question.id}>
                        <label className="block text-sm font-semibold mb-2">
                          {question.label}
                          {question.optional !== false && (
                            <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
                          )}
                        </label>
                        {question.description && (
                          <p className="text-sm text-brand-gray-600 mb-3 leading-relaxed max-w-3xl whitespace-pre-line">
                            {question.description}
                          </p>
                        )}
                        {question.type === 'files' ? (
                          <FilesField
                            accept={acceptUploads}
                            disabled={uploading}
                            files={value.files}
                            maxFiles={maxFiles}
                            onRemove={removeFile}
                            onChangeFiles={uploadFiles}
                            onChangeFolder={uploadFiles}
                          />
                        ) : (
                          renderQuestion(
                            question,
                            value.answers[question.id],
                            setAnswer,
                            handleCheckToggle,
                          )
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-between sm:items-center">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => {
                  setError('');
                  setStepIndex((i) => Math.max(0, i - 1));
                }}
                className="py-4 px-6 border border-brand-black uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={status === 'submitting' || uploading}
                className="py-4 px-8 bg-brand-black text-white uppercase tracking-widest disabled:opacity-60 shrink-0"
              >
                {stepIndex >= totalSteps - 1
                  ? status === 'submitting'
                    ? 'Submitting...'
                    : 'Submit questionnaire'
                  : 'Next'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function FilesField({
  accept,
  disabled,
  files,
  maxFiles,
  onChangeFiles,
  onChangeFolder,
  onRemove,
}: {
  accept: string;
  disabled: boolean;
  files: UploadedAsset[];
  maxFiles: number;
  onChangeFiles: (e: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onChangeFolder: (e: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onRemove: (key: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm border px-3 py-2 cursor-pointer bg-white">
          <span className="font-semibold">Files</span>
          <input
            type="file"
            multiple
            accept={accept}
            disabled={disabled}
            onChange={onChangeFiles}
            className="sr-only"
          />
          <span className="text-brand-gray-600">Choose files…</span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm border px-3 py-2 cursor-pointer bg-white">
          <span className="font-semibold">Folder</span>
          <input
            type="file"
            multiple
            // @ts-expect-error non-standard attribute for directory picks (Chromium/Safari)
            webkitdirectory=""
            accept={accept}
            disabled={disabled}
            onChange={onChangeFolder}
            className="sr-only"
          />
          <span className="text-brand-gray-600">Choose folder…</span>
        </label>
      </div>
      <p className="text-xs text-brand-gray-500">
        Up to {maxFiles} files; large videos supported. Folder upload works best in Chrome / Edge /
        Safari.
      </p>
      {files.length > 0 && (
        <ul className="mt-2 space-y-2 text-sm">
          {files.map((file) => (
            <li key={file.key} className="flex items-center justify-between border p-2 gap-2">
              <a className="underline break-all min-w-0" href={file.url} target="_blank" rel="noreferrer">
                {file.filename}
              </a>
              <button type="button" className="text-red-600 shrink-0" onClick={() => onRemove(file.key)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="w-full border px-3 py-2"
      />
    </div>
  );
}

function renderQuestion(
  question: QuestionnaireQuestion,
  currentValue: AnswerValue | undefined,
  setAnswer: (id: string, next: AnswerValue) => void,
  handleCheckToggle: (id: string, option: string) => void,
) {
  if (question.type === 'textarea') {
    return (
      <textarea
        className="w-full border px-3 py-2 min-h-24"
        value={typeof currentValue === 'string' ? currentValue : ''}
        placeholder={question.placeholder}
        onChange={(e) => setAnswer(question.id, e.currentTarget.value)}
      />
    );
  }

  if (question.type === 'text' || question.type === 'email') {
    return (
      <input
        type={question.type}
        className="w-full border px-3 py-2"
        value={typeof currentValue === 'string' ? currentValue : ''}
        placeholder={question.placeholder}
        onChange={(e) => setAnswer(question.id, e.currentTarget.value)}
      />
    );
  }

  if (question.type === 'radio') {
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={question.id}
              checked={currentValue === option}
              onChange={() => setAnswer(question.id, option)}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  if (question.type === 'checkbox') {
    const selected = Array.isArray(currentValue) ? currentValue : [];
    return (
      <div className="space-y-2">
        {question.options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => handleCheckToggle(question.id, option)}
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  return null;
}
