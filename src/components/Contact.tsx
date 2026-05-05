import React, { useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { Mail, Send } from 'lucide-react';
import kiceroLogoOpaque10 from '../assets/Logo/Kicero Logo Opaque 10percent.svg';

export default function Contact() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [emailError, setEmailError] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [emailValueState, setEmailValueState] = useState('');
  const [messageValue, setMessageValue] = useState('');
  const [nameEmptyError, setNameEmptyError] = useState(false);
  const [emailEmptyError, setEmailEmptyError] = useState(false);
  const [messageEmptyError, setMessageEmptyError] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.5 });
  const bgTextY = useTransform(smoothProgress, [0, 1], [60, -60]);
  const leftGlowY = useTransform(smoothProgress, [0, 1], [40, -48]);
  const leftGlowX = useTransform(smoothProgress, [0, 1], [-18, 18]);
  const leftRingY = useTransform(smoothProgress, [0, 1], [26, -34]);
  const leftGridY = useTransform(smoothProgress, [0, 1], [18, -18]);
  const leftGridOpacity = useTransform(smoothProgress, [0, 0.5, 1], [0.07, 0.13, 0.07]);
  const leftTextY = useTransform(smoothProgress, [0, 1], [55, -65]);
  const leftLogoY = useTransform(smoothProgress, [0, 1], [30, -38]);
  const leftLogoX = useTransform(smoothProgress, [0, 1], [20, -22]);
  const leftLogoRotate = useTransform(smoothProgress, [0, 1], [0, 18]);
  const leftKiceroSecondaryY = useTransform(smoothProgress, [0, 1], [46, -54]);
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const nameTrimmed = String(formData.get('name') ?? '').trim();
    const emailTrimmed = String(formData.get('email') ?? '').trim();
    const messageTrimmed = String(formData.get('message') ?? '').trim();

    const isNameEmpty = nameTrimmed.length === 0;
    const isEmailEmpty = emailTrimmed.length === 0;
    const isMessageEmpty = messageTrimmed.length === 0;
    const isEmailInvalid = !isEmailEmpty && !isValidEmail(emailTrimmed);

    setNameEmptyError(isNameEmpty);
    setEmailEmptyError(isEmailEmpty);
    setMessageEmptyError(isMessageEmpty);
    setEmailError(isEmailInvalid);

    if (isNameEmpty || isEmailEmpty || isMessageEmpty || isEmailInvalid) {
      return;
    }

    setFormState('submitting');

    const payload = {
      name: nameTrimmed,
      email: emailTrimmed,
      message: messageTrimmed,
      website: String(formData.get('website') ?? ''),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        setFormState('idle');
        return;
      }

      setFormState('success');
      setEmailError(false);
      setNameEmptyError(false);
      setEmailEmptyError(false);
      setMessageEmptyError(false);
      setNameValue('');
      setEmailValueState('');
      setMessageValue('');
      form.reset();
    } catch {
      setFormState('idle');
    }
  };

  const flashOverlayClass =
    'pointer-events-none absolute left-3 top-3 text-brand-gray-500 transition-opacity';

  return (
    <section ref={sectionRef} id="contact" className="py-24 bg-black text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden p-4 -m-4"
          >
            <motion.div
              style={{ y: leftGridY, opacity: leftGridOpacity }}
              className="pointer-events-none absolute inset-0"
            >
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '34px 34px',
                }}
              />
            </motion.div>
            <motion.div
              style={{ y: leftGlowY, x: leftGlowX }}
              className="pointer-events-none absolute top-4 right-4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />
            <motion.div
              style={{ y: leftRingY }}
              className="pointer-events-none absolute bottom-6 left-6 h-52 w-52 rounded-full border border-white/10"
            />
            <motion.div
              style={{ y: leftTextY }}
              className="pointer-events-none absolute right-4 bottom-0 text-[20vw] md:text-[8rem] font-display font-bold tracking-tighter text-white/[0.04] leading-none"
            >
              ELITE
            </motion.div>
            <motion.img
              src={kiceroLogoOpaque10}
              alt=""
              aria-hidden="true"
              style={{ y: leftLogoY, x: leftLogoX, rotate: leftLogoRotate }}
              className="pointer-events-none absolute top-2 right-20 w-28 md:w-40 opacity-80 will-change-transform"
            />
            <motion.div
              style={{ y: leftKiceroSecondaryY }}
              className="pointer-events-none absolute left-20 bottom-16 text-[10vw] md:text-[4.5rem] font-display font-bold tracking-tighter text-white/[0.05] leading-none"
            >
              KICERO
            </motion.div>
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gray-300 mb-6 block">Let's talk</span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-10 leading-none">
                READY TO <br />
                <span className="text-brand-gray-300">TRANSFORM</span> <br />
                YOUR BUSINESS?
              </h2>
              
              <div className="space-y-8 mt-12">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 border border-brand-gray-300/30 flex items-center justify-center">
                    <Mail size={20} className="text-brand-gray-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-300/50 mb-1">Email us</p>
                    <p className="text-lg break-all">info@kicero.co.uk</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="relative overflow-hidden bg-gradient-to-b from-brand-gray-900 to-[#191919] border border-brand-gray-800 p-8 md:p-12"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-3 border border-white/5" />
            <div className="relative z-10">
            {formState === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-20"
              >
                <div className="w-20 h-20 rounded-full bg-brand-white text-brand-black flex items-center justify-center mb-6">
                   <Send size={32} />
                </div>
                <h3 className="text-2xl font-bold uppercase mb-4">Message Sent</h3>
                <p className="text-brand-gray-400 font-light max-w-xs">
                  Thank you for reaching out. We will get back to you within 24 hours.
                </p>
                <button 
                  onClick={() => setFormState('idle')}
                  className="mt-10 text-xs font-bold uppercase tracking-tighter border-b border-brand-white pb-1"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Name</label>
                    <div className="relative">
                      <input
                        name="name"
                        type="text"
                        value={nameValue}
                        onChange={(e) => {
                          setNameValue(e.currentTarget.value);
                          if (e.currentTarget.value.trim().length > 0) {
                            setNameEmptyError(false);
                          }
                        }}
                        className={`w-full bg-brand-black/30 border py-3 px-3 focus:outline-none transition-colors text-brand-white ${
                          nameEmptyError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-brand-gray-800 focus:border-brand-gray-500'
                        }`}
                      />
                      {nameValue.length === 0 && (
                        <motion.span
                          className={flashOverlayClass}
                          animate={{ opacity: [0.08, 1, 0.08] }}
                          transition={{ duration: 3.6, ease: 'easeInOut', repeat: Infinity }}
                          key="name-placeholder-active"
                        >
                          Name
                        </motion.span>
                      )}
                    </div>
                    {nameEmptyError && (
                      <p className="text-red-400 text-xs font-medium mt-2">
                        Please fill in the above field
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Email Address</label>
                    <div className="relative">
                      <input
                        name="email"
                        type="email"
                        value={emailValueState}
                        onBlur={(e) => setEmailError(e.currentTarget.value.trim().length > 0 && !isValidEmail(e.currentTarget.value.trim()))}
                        onChange={(e) => {
                          setEmailValueState(e.currentTarget.value);
                          if (e.currentTarget.value.trim().length > 0) {
                            setEmailEmptyError(false);
                          }
                          if (emailError) {
                            setEmailError(!isValidEmail(e.currentTarget.value.trim()));
                          }
                        }}
                        className={`w-full bg-brand-black/30 border py-3 px-3 focus:outline-none transition-colors text-brand-white ${
                          emailError || emailEmptyError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-brand-gray-800 focus:border-brand-gray-500'
                        }`}
                      />
                      {emailValueState.length === 0 && (
                        <motion.span
                          className={flashOverlayClass}
                          animate={
                            nameValue.length > 0
                              ? { opacity: [0.08, 1, 0.08] }
                              : { opacity: 0.5 }
                          }
                          transition={
                            nameValue.length > 0
                              ? { duration: 3.6, ease: 'easeInOut', repeat: Infinity }
                              : { duration: 0.3 }
                          }
                          key={nameValue.length > 0 ? 'email-active' : 'email-static'}
                        >
                          name@example.com
                        </motion.span>
                      )}
                    </div>
                    {emailEmptyError && !emailError && (
                      <p className="text-red-400 text-xs font-medium mt-2">
                        Please fill in the above field
                      </p>
                    )}
                    {emailError && (
                      <p className="text-red-400 text-xs font-medium mt-2">
                        please enter a valid email address
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Message</label>
                  <div className="relative">
                    <textarea
                      name="message"
                      rows={4}
                      value={messageValue}
                      onChange={(e) => {
                        setMessageValue(e.currentTarget.value);
                        if (e.currentTarget.value.trim().length > 0) {
                          setMessageEmptyError(false);
                        }
                      }}
                      className={`w-full bg-brand-black/30 border py-3 px-3 focus:outline-none transition-colors resize-none text-brand-white ${
                        messageEmptyError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-brand-gray-800 focus:border-brand-gray-500'
                      }`}
                    />
                    {messageValue.length === 0 && (
                      <motion.span
                        className={flashOverlayClass}
                        animate={
                          emailValueState.length > 0
                            ? { opacity: [0.08, 1, 0.08] }
                            : { opacity: 0.5 }
                        }
                        transition={
                          emailValueState.length > 0
                            ? { duration: 3.6, ease: 'easeInOut', repeat: Infinity }
                            : { duration: 0.3 }
                        }
                        key={emailValueState.length > 0 ? 'message-active' : 'message-static'}
                      >
                        Tell us about your website needs...
                      </motion.span>
                    )}
                  </div>
                  {messageEmptyError && (
                    <p className="text-red-400 text-xs font-medium mt-2">
                      Please fill in the above field
                    </p>
                  )}
                </div>
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
                  disabled={formState === 'submitting'}
                  className="w-full py-5 bg-brand-white text-brand-black text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                >
                  {formState === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Decorative text */}
      <motion.div style={{ y: bgTextY }} className="absolute bottom-[-10%] right-[-5%] opacity-5 pointer-events-none">
        <span className="font-display text-[30vw] font-bold leading-none select-none tracking-tighter">KICERO</span>
      </motion.div>
    </section>
  );
}
