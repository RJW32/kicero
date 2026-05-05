import {
  useState,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  type FocusEvent,
} from 'react';
import {motion} from 'motion/react';
import {Mail, Send} from 'lucide-react';
import kiceroLogoOpaque10 from '../assets/Logo/Kicero Logo Opaque 10percent.svg';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (value: string) => EMAIL_REGEX.test(value);

type FormStatus = 'idle' | 'submitting' | 'success';
type FieldName = 'name' | 'email' | 'message';

const FIELD_LABEL: Record<FieldName, string> = {
  name: 'Name',
  email: 'Email Address',
  message: 'Message',
};

const FIELD_PLACEHOLDER: Record<FieldName, string> = {
  name: 'Your name',
  email: 'name@example.com',
  message: 'Tell us about your website needs...',
};

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const EMPTY_FORM: FormState = {name: '', email: '', message: ''};

export default function Contact() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [values, setValues] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleChange = useCallback(
    (field: FieldName) =>
      (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.currentTarget.value;
        setValues((prev) => ({...prev, [field]: value}));
        setErrors((prev) => {
          if (!prev[field]) return prev;
          if (field === 'email') {
            if (value.trim().length === 0) return prev;
            if (!isValidEmail(value.trim())) {
              return {...prev, email: 'Please enter a valid email address.'};
            }
            const {email: _email, ...rest} = prev;
            return rest;
          }
          if (value.trim().length === 0) return prev;
          const {[field]: _removed, ...rest} = prev;
          return rest;
        });
      },
    [],
  );

  const handleEmailBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value.trim();
      if (value.length > 0 && !isValidEmail(value)) {
        setErrors((prev) => ({...prev, email: 'Please enter a valid email address.'}));
      }
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const form = e.currentTarget;
      const formData = new FormData(form);
      const name = String(formData.get('name') ?? '').trim();
      const email = String(formData.get('email') ?? '').trim();
      const message = String(formData.get('message') ?? '').trim();
      const website = String(formData.get('website') ?? '');

      const nextErrors: FieldErrors = {};
      if (name.length === 0) nextErrors.name = 'Please fill in the above field';
      if (email.length === 0) {
        nextErrors.email = 'Please fill in the above field';
      } else if (!isValidEmail(email)) {
        nextErrors.email = 'Please enter a valid email address.';
      }
      if (message.length === 0)
        nextErrors.message = 'Please fill in the above field';

      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      setStatus('submitting');
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({name, email, message, website}),
        });

        if (!response.ok) {
          setStatus('idle');
          return;
        }

        setStatus('success');
        setValues(EMPTY_FORM);
        setErrors({});
        form.reset();
      } catch {
        setStatus('idle');
      }
    },
    [],
  );

  return (
    <section
      id="contact"
      className="py-24 bg-black text-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <motion.div
            initial={{opacity: 0, y: 28}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-80px'}}
            transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
            className="relative overflow-hidden p-4 -m-4"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: '34px 34px',
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-4 right-4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-6 h-52 w-52 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-4 bottom-0 text-[20vw] md:text-[8rem] font-display font-bold tracking-tighter text-white/[0.04] leading-none"
            >
              ELITE
            </div>
            <img
              src={kiceroLogoOpaque10}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute top-2 right-20 w-28 md:w-40 opacity-80"
            />

            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gray-300 mb-6 block">
                Let's talk
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-10 leading-none">
                READY TO <br />
                <span className="text-brand-gray-300">TRANSFORM</span> <br />
                YOUR BUSINESS?
              </h1>

              <div className="space-y-8 mt-12">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 border border-brand-gray-300/30 flex items-center justify-center">
                    <Mail size={20} className="text-brand-gray-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-300/50 mb-1">
                      Email us
                    </p>
                    <p className="text-lg break-all">info@kicero.co.uk</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{opacity: 0, y: 32}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: '-60px'}}
            transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08}}
            className="relative overflow-hidden bg-gradient-to-b from-brand-gray-900 to-[#191919] border border-brand-gray-800 p-8 md:p-12"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-3 border border-white/5" />
            <div className="relative z-10">
              {status === 'success' ? (
                <motion.div
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  className="h-full flex flex-col items-center justify-center text-center py-20"
                >
                  <div className="w-20 h-20 rounded-full bg-brand-white text-brand-black flex items-center justify-center mb-6">
                    <Send size={32} />
                  </div>
                  <h3 className="text-2xl font-bold uppercase mb-4">
                    Message Sent
                  </h3>
                  <p className="text-brand-gray-400 font-light max-w-xs">
                    Thank you for reaching out. We will get back to you within
                    24 hours.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-10 text-xs font-bold uppercase tracking-tighter border-b border-brand-white pb-1"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-7"
                  aria-busy={status === 'submitting'}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field
                      field="name"
                      type="text"
                      autoComplete="name"
                      value={values.name}
                      error={errors.name}
                      onChange={handleChange('name')}
                    />
                    <Field
                      field="email"
                      type="email"
                      autoComplete="email"
                      value={values.email}
                      error={errors.email}
                      onChange={handleChange('email')}
                      onBlur={handleEmailBlur}
                    />
                  </div>
                  <Field
                    field="message"
                    multiline
                    value={values.message}
                    error={errors.message}
                    onChange={handleChange('message')}
                  />
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-5 bg-brand-white text-brand-black text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Static decorative text – no parallax needed; this section is short. */}
      <div
        aria-hidden="true"
        className="absolute bottom-[-10%] right-[-5%] opacity-5 pointer-events-none"
      >
        <span className="font-display text-[30vw] font-bold leading-none select-none tracking-tighter">
          KICERO
        </span>
      </div>
    </section>
  );
}

interface FieldProps {
  field: FieldName;
  type?: string;
  autoComplete?: string;
  multiline?: boolean;
  value: string;
  error?: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
}

function Field({
  field,
  type = 'text',
  autoComplete,
  multiline,
  value,
  error,
  onChange,
  onBlur,
}: FieldProps) {
  const errorClass = error
    ? 'border-red-500 focus:border-red-500'
    : 'border-brand-gray-800 focus:border-brand-gray-500';
  const baseClass = `w-full bg-brand-black/30 border py-3 px-3 focus:outline-none transition-colors text-brand-white placeholder:text-brand-gray-500 ${errorClass}`;

  return (
    <div className="space-y-1">
      <label
        htmlFor={`contact-${field}`}
        className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500"
      >
        {FIELD_LABEL[field]}
      </label>
      {multiline ? (
        <textarea
          id={`contact-${field}`}
          name={field}
          rows={4}
          value={value}
          onChange={onChange}
          placeholder={FIELD_PLACEHOLDER[field]}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          id={`contact-${field}`}
          name={field}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={FIELD_PLACEHOLDER[field]}
          className={baseClass}
        />
      )}
      {error && (
        <p className="text-red-400 text-xs font-medium mt-2">{error}</p>
      )}
    </div>
  );
}
