import {type ChangeEvent, type FormEvent, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {motion} from 'motion/react';
import {questionnaireQuestions, type QuestionnaireQuestion} from '../data/questionnaire';
import {usePersistentForm} from '../hooks/usePersistentForm';

type AnswerValue = string | string[];

interface UploadedAsset {
  key: string;
  url: string;
  filename: string;
  size: number;
  contentType: string;
}

interface FormModel {
  clientName: string;
  clientEmail: string;
  answers: Record<string, AnswerValue>;
  files: UploadedAsset[];
}

const EMPTY_FORM: FormModel = {
  clientName: '',
  clientEmail: '',
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

export default function Questionnaire() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref')?.trim() ?? '';
  const {value, setValue, restored, clear, setRestored} = usePersistentForm<FormModel>(
    `kicero:questionnaire:${ref || 'default'}`,
    EMPTY_FORM,
  );
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const sections = useMemo(() => Object.entries(groupedQuestions), []);

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

  const uploadFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const question = questionnaireQuestions.find((item) => item.type === 'files');
    const maxFiles = question?.type === 'files' ? (question.maxFiles ?? 10) : 10;
    const selected = e.currentTarget.files;
    if (!selected || selected.length === 0) return;
    if (value.files.length + selected.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} files.`);
      e.currentTarget.value = '';
      return;
    }

    setError('');
    setUploading(true);
    try {
      const newFiles: UploadedAsset[] = [];
      for (const file of Array.from(selected)) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/questionnaire/upload', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {error?: string} | null;
          throw new Error(body?.error ?? 'Failed to upload file.');
        }
        const data = (await response.json()) as UploadedAsset;
        newFiles.push(data);
      }
      setValue((prev) => ({...prev, files: [...prev.files, ...newFiles]}));
    } catch (uploadErr) {
      setError(uploadErr instanceof Error ? uploadErr.message : 'Upload failed.');
    } finally {
      setUploading(false);
      e.currentTarget.value = '';
    }
  };

  const removeFile = (key: string) => {
    setValue((prev) => ({...prev, files: prev.files.filter((file) => file.key !== key)}));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.clientName.trim() || !value.clientEmail.trim()) {
      setError('Please add your name and email so we can contact you.');
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
          clientEmail: value.clientEmail.trim(),
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
    } catch (submitErr) {
      setStatus('idle');
      setError(submitErr instanceof Error ? submitErr.message : 'Submission failed.');
    }
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
            <p className="text-brand-gray-600">We will review this and get back to you within 24 hours.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-6">
              <Field
                label="Your name"
                value={value.clientName}
                onChange={(next) => setValue((prev) => ({...prev, clientName: next}))}
                required
              />
              <Field
                label="Your email"
                type="email"
                value={value.clientEmail}
                onChange={(next) => setValue((prev) => ({...prev, clientEmail: next}))}
                required
              />
            </div>

            {sections.map(([section, questions]) => (
              <div key={section} className="border p-6">
                <h2 className="font-bold text-xl mb-4">{section}</h2>
                <div className="space-y-5">
                  {questions.map((question) => (
                    <div key={question.id}>
                      <label className="block text-sm font-semibold mb-2">
                        {question.label}
                        {question.optional !== false && (
                          <span className="text-brand-gray-500 font-normal ml-2">(optional)</span>
                        )}
                      </label>
                      {renderQuestion(question, value.answers[question.id], setAnswer, handleCheckToggle)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="border p-6">
              <label className="block text-sm font-semibold mb-2">Upload logo or brand assets (optional)</label>
              <input type="file" multiple onChange={uploadFiles} accept="image/*,.pdf,.zip,.doc,.docx" />
              {uploading && <p className="text-sm mt-2">Uploading files...</p>}
              {value.files.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {value.files.map((file) => (
                    <li key={file.key} className="flex items-center justify-between border p-2">
                      <a className="underline break-all" href={file.url} target="_blank" rel="noreferrer">
                        {file.filename}
                      </a>
                      <button type="button" className="text-red-600" onClick={() => removeFile(file.key)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={status === 'submitting' || uploading}
              className="w-full py-4 bg-brand-black text-white uppercase tracking-widest disabled:opacity-60"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Questionnaire'}
            </button>
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
