import {type FormEvent, useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {ChevronDown} from 'lucide-react';
import {
  ABOUT_FOCUS_FIELD_IDS,
  ABOUT_FOCUS_OPTIONS,
  FAQ_MAX_SLOTS,
  PORTFOLIO_GALLERY_UPLOAD_NOTE,
  QUESTIONNAIRE_EXPLAINER_DISCLAIMER,
  QUESTIONNAIRE_EXPLAINER_PARAGRAPHS,
  TESTIMONIALS_MAX_SLOTS,
  buildQuestionnaireWizardSteps,
  orderedSelectedPages,
  pageDetailSection,
  pageLabelFromDetailSection,
  questionnaireQuestions,
  type QuestionnaireQuestion,
} from '../data/questionnaire';
import {usePersistentForm} from '../hooks/usePersistentForm';

type AnswerValue = string | string[];

interface FormModel {
  clientName: string;
  answers: Record<string, AnswerValue>;
}

const EMPTY_FORM: FormModel = {
  clientName: '',
  answers: {},
};

function clampParsedCount(raw: AnswerValue | undefined, max: number, min = 0): number {
  if (typeof raw !== 'string') return 0;
  const trimmed = raw.trim();
  if (trimmed === '') return 0;
  const n = parseInt(trimmed, 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

function noopCheckToggle(_id: string, _option: string): void {
  /* renderQuestion expects a checkbox handler even for non-checkbox fields */
}

function QuestionInfoDropdown({explainer}: {explainer: string}) {
  return (
    <details className="group w-full min-w-0 max-w-none text-sm">
      <summary className="flex w-full cursor-pointer list-none items-center justify-end [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5 rounded border border-brand-gray-300 bg-white px-2.5 py-1 font-semibold uppercase tracking-wide text-brand-gray-800 hover:bg-brand-gray-50">
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden
            className="shrink-0 text-brand-gray-500 transition-transform group-open:rotate-180"
          />
          More info
        </span>
      </summary>
      <div className="mt-3 w-full min-w-0 border border-brand-gray-200 bg-brand-gray-50/90 px-3 py-3 text-left shadow-sm">
        <p className="text-brand-gray-600 leading-relaxed whitespace-pre-line">{explainer}</p>
      </div>
    </details>
  );
}

const groupedQuestions = questionnaireQuestions.reduce<Record<string, QuestionnaireQuestion[]>>(
  (acc, question) => {
    acc[question.section] = acc[question.section] ?? [];
    acc[question.section].push(question);
    return acc;
  },
  {},
);

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

function AboutPageDetailFields({
  answers,
  setAnswer,
  handleCheckToggle,
}: {
  answers: FormModel['answers'];
  setAnswer: (id: string, next: AnswerValue) => void;
  handleCheckToggle: (id: string, option: string) => void;
}) {
  const checklist = questionnaireQuestions.find((q) => q.id === 'page_about_elements');
  if (!checklist || checklist.type !== 'checkbox') return null;

  const selectedAreas = Array.isArray(answers.page_about_elements)
    ? answers.page_about_elements
    : [];

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-semibold mb-2">
          {checklist.label}
          {checklist.optional !== false && (
            <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
          )}
        </label>
        {renderQuestion(checklist, answers[checklist.id], setAnswer, handleCheckToggle)}
      </div>
      {ABOUT_FOCUS_OPTIONS.map((option) => {
        if (!selectedAreas.includes(option)) return null;
        const fieldId = ABOUT_FOCUS_FIELD_IDS[option];
        const q = questionnaireQuestions.find((x) => x.id === fieldId);
        if (!q) return null;
        return (
          <div key={fieldId}>
            <label className="block text-sm font-semibold mb-2">
              {q.label}
              {q.optional !== false && (
                <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
              )}
            </label>
            {q.description && (
              <p className="text-sm text-brand-gray-600 mb-3 leading-relaxed max-w-3xl whitespace-pre-line">
                {q.description}
              </p>
            )}
            {renderQuestion(q, answers[q.id], setAnswer, handleCheckToggle)}
          </div>
        );
      })}
    </div>
  );
}

function TestimonialsPageDetailFields({
  answers,
  setAnswer,
}: {
  answers: FormModel['answers'];
  setAnswer: (id: string, next: AnswerValue) => void;
}) {
  const countQ = questionnaireQuestions.find((q) => q.id === 'page_testimonials_count');
  const nSlots = clampParsedCount(answers.page_testimonials_count, TESTIMONIALS_MAX_SLOTS, 0);

  return (
    <div className="space-y-8">
      {countQ && countQ.type === 'text' && (
        <div>
          <label className="block text-sm font-semibold mb-2">
            {countQ.label}
            {countQ.optional !== false && (
              <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
            )}
          </label>
          {countQ.description && (
            <p className="text-sm text-brand-gray-600 mb-3 leading-relaxed max-w-3xl whitespace-pre-line">
              {countQ.description}
            </p>
          )}
          <input
            type="number"
            min={0}
            max={TESTIMONIALS_MAX_SLOTS}
            className="w-full max-w-xs border px-3 py-2"
            placeholder={countQ.placeholder}
            value={typeof answers.page_testimonials_count === 'string' ? answers.page_testimonials_count : ''}
            onChange={(e) => setAnswer('page_testimonials_count', e.target.value)}
          />
        </div>
      )}
      {nSlots > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-brand-gray-600">Enter each testimonial below.</p>
          {Array.from({length: nSlots}, (_, index) => {
            const slot = index + 1;
            const q = questionnaireQuestions.find((x) => x.id === `page_testimonial_${slot}_body`);
            if (!q) return null;
            return (
              <div key={q.id}>
                <label className="block text-sm font-semibold mb-2">
                  Testimonial {slot}
                  <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
                </label>
                {renderQuestion(q, answers[q.id], setAnswer, noopCheckToggle)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FaqPageDetailFields({
  answers,
  setAnswer,
}: {
  answers: FormModel['answers'];
  setAnswer: (id: string, next: AnswerValue) => void;
}) {
  const countQ = questionnaireQuestions.find((q) => q.id === 'page_faq_count');
  const nPairs = clampParsedCount(answers.page_faq_count, FAQ_MAX_SLOTS, 0);

  return (
    <div className="space-y-8">
      {countQ && countQ.type === 'text' && (
        <div>
          <label className="block text-sm font-semibold mb-2">
            {countQ.label}
            {countQ.optional !== false && (
              <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
            )}
          </label>
          {countQ.description && (
            <p className="text-sm text-brand-gray-600 mb-3 leading-relaxed max-w-3xl whitespace-pre-line">
              {countQ.description}
            </p>
          )}
          <input
            type="number"
            min={0}
            max={FAQ_MAX_SLOTS}
            className="w-full max-w-xs border px-3 py-2"
            placeholder={countQ.placeholder}
            value={typeof answers.page_faq_count === 'string' ? answers.page_faq_count : ''}
            onChange={(e) => setAnswer('page_faq_count', e.target.value)}
          />
        </div>
      )}
      {nPairs > 0 && (
        <div className="space-y-8">
          {Array.from({length: nPairs}, (_, index) => {
            const num = index + 1;
            const qField = questionnaireQuestions.find((x) => x.id === `page_faq_${num}_question`);
            const aField = questionnaireQuestions.find((x) => x.id === `page_faq_${num}_answer`);
            if (!qField || !aField) return null;
            return (
              <div
                key={`faq-${num}`}
                className="border border-brand-gray-200 p-4 space-y-4 bg-brand-gray-50/40"
              >
                <p className="text-sm font-bold tracking-wide">FAQ {num}</p>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Question
                    {qField.optional !== false && (
                      <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
                    )}
                  </label>
                  {renderQuestion(qField, answers[qField.id], setAnswer, noopCheckToggle)}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Answer
                    {aField.optional !== false && (
                      <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
                    )}
                  </label>
                  {renderQuestion(aField, answers[aField.id], setAnswer, noopCheckToggle)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Questionnaire() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref')?.trim() ?? '';
  const {value, setValue, restored, clear, setRestored} = usePersistentForm<FormModel>(
    `kicero:questionnaire:${ref || 'default'}`,
    EMPTY_FORM,
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!restored) return;
    setValue((prev) => {
      if (!('files' in (prev as FormModel & {files?: unknown}))) return prev;
      const {files: _removed, ...rest} = prev as FormModel & {files?: unknown};
      return rest as FormModel;
    });
  }, [restored, setValue]);

  const pagesSelectionKey = Array.isArray(value.answers.pagesWanted)
    ? [...value.answers.pagesWanted].sort().join('\0')
    : '';
  const wizardSteps = useMemo(
    () => buildQuestionnaireWizardSteps(orderedSelectedPages(value.answers.pagesWanted)),
    [pagesSelectionKey],
  );

  const totalSteps = wizardSteps.length;
  const progressFraction = totalSteps ? (stepIndex + 1) / totalSteps : 1;
  const progressPercentRounded = Math.min(100, Math.round((progressFraction * 100) / 5) * 5);
  const activeWizardStep = wizardSteps[stepIndex];
  const sectionKeysForStep: string[] =
    activeWizardStep?.kind === 'sections'
      ? activeWizardStep.sectionKeys
      : activeWizardStep?.kind === 'pageFollowUp'
        ? [pageDetailSection(activeWizardStep.page)]
        : [];

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, [stepIndex]);

  useEffect(() => {
    setStepIndex((i) => (totalSteps ? Math.min(i, totalSteps - 1) : 0));
  }, [totalSteps]);

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
          files: [],
          website: '',
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {error?: string} | null;
        throw new Error(body?.error ?? 'Submission failed. Please try again.');
      }
      setStatus('success');
      clear();
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

        <details className="group mb-10 border border-brand-gray-200 bg-brand-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] open:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow rounded-sm overflow-hidden">
          <summary className="cursor-pointer list-none flex gap-4 px-5 py-4 sm:px-6 sm:py-5 items-start sm:items-center text-left hover:bg-brand-gray-50/90 transition-colors [&::-webkit-details-marker]:hidden">
            <span
              className="mt-0.5 sm:mt-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-gray-200 bg-brand-white text-brand-gray-700"
              aria-hidden
            >
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180" />
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="font-display block text-lg sm:text-xl font-bold tracking-tight text-brand-black">
                Must read
              </span>
              <span className="block text-sm text-brand-gray-600 leading-snug">
                How we use your answers — and why everything here is optional.
              </span>
            </span>
          </summary>
          <div className="border-t border-brand-gray-100 px-5 py-5 sm:px-6 sm:py-6 space-y-4 bg-brand-white">
            <div className="space-y-4 text-sm sm:text-[0.9375rem] text-brand-gray-700 leading-relaxed">
              {QUESTIONNAIRE_EXPLAINER_PARAGRAPHS.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="pt-4 mt-1 border-t border-brand-gray-200">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-brand-gray-500 mb-2">
                A note on how this works
              </p>
              <p className="text-sm text-brand-gray-600 leading-relaxed">
                {QUESTIONNAIRE_EXPLAINER_DISCLAIMER}
              </p>
            </div>
          </div>
        </details>

        {restored && status === 'idle' && (
          <div className="mb-6 border border-brand-gray-300 bg-brand-gray-50 p-4 text-sm">
            Restored your previous progress.
            <button
              type="button"
              onClick={() => {
                clear();
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
                <span className="tabular-nums">{progressPercentRounded}%</span>
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
                  style={{width: `${progressPercentRounded}%`}}
                />
              </div>
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

              {sectionKeysForStep.map((sectionKey) => {
                  const questions = groupedQuestions[sectionKey] ?? [];
                  if (questions.length === 0) return null;
                  const detailPageLabel = pageLabelFromDetailSection(sectionKey);

                  return (
                    <div key={sectionKey} className="space-y-5">
                      <h2 className="font-bold text-xl border-b border-brand-gray-200 pb-2">
                        {sectionKey}
                      </h2>
                      {detailPageLabel === 'Portfolio / Gallery' && (
                        <p className="text-sm text-brand-gray-600 border border-brand-gray-200 bg-brand-gray-50 px-4 py-3 leading-relaxed">
                          {PORTFOLIO_GALLERY_UPLOAD_NOTE}
                        </p>
                      )}
                      {detailPageLabel === 'About' && (
                        <AboutPageDetailFields
                          answers={value.answers}
                          setAnswer={setAnswer}
                          handleCheckToggle={handleCheckToggle}
                        />
                      )}
                      {detailPageLabel === 'Testimonials' && (
                        <TestimonialsPageDetailFields answers={value.answers} setAnswer={setAnswer} />
                      )}
                      {detailPageLabel === 'FAQ' && (
                        <FaqPageDetailFields answers={value.answers} setAnswer={setAnswer} />
                      )}
                      {detailPageLabel !== 'About' &&
                        detailPageLabel !== 'Testimonials' &&
                        detailPageLabel !== 'FAQ' &&
                        questions.map((question) => (
                          <div key={question.id} className="min-w-0 w-full">
                            {question.infoExplainer ? (
                              <div className="mb-2 w-full min-w-0 space-y-2">
                                <label className="block text-sm font-semibold">
                                  {question.label}
                                  {question.optional !== false && (
                                    <span className="text-brand-gray-500 font-normal ml-2">
                                      (optional)
                                    </span>
                                  )}
                                </label>
                                <QuestionInfoDropdown explainer={question.infoExplainer} />
                              </div>
                            ) : (
                              <label className="mb-2 block text-sm font-semibold">
                                {question.label}
                                {question.optional !== false && (
                                  <span className="text-brand-gray-500 font-normal ml-2">
                                    (optional)
                                  </span>
                                )}
                              </label>
                            )}
                            {question.description && (
                              <p className="text-sm text-brand-gray-600 mb-3 leading-relaxed max-w-3xl whitespace-pre-line">
                                {question.description}
                              </p>
                            )}
                            {renderQuestion(
                              question,
                              value.answers[question.id],
                              setAnswer,
                              handleCheckToggle,
                            )}
                            {question.id === 'hasPhotos' && value.answers.hasPhotos === 'Yes' && (
                              <p className="mt-3 text-sm text-brand-gray-600 leading-relaxed max-w-3xl">
                                Wonderful — once someone at Kicero has read through your answers, we
                                will email you a link so you can upload your photos for the site.
                              </p>
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
                disabled={status === 'submitting'}
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
        onChange={(e) => setAnswer(question.id, e.target.value)}
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
        onChange={(e) => setAnswer(question.id, e.target.value)}
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
    const cols = 'gridColumns' in question ? question.gridColumns : undefined;
    const useGrid = typeof cols === 'number' && cols > 1;
    return (
      <div
        className={useGrid ? 'grid gap-x-8 gap-y-2 text-sm' : 'space-y-2'}
        style={useGrid ? {gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`} : undefined}
      >
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
