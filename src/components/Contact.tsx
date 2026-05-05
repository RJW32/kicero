import React, { useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { Mail, Send } from 'lucide-react';

export default function Contact() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.5 });
  const bgTextY = useTransform(smoothProgress, [0, 1], [60, -60]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormState('submitting');

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
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
      form.reset();
    } catch {
      setFormState('idle');
    }
  };

  return (
    <section ref={sectionRef} id="contact" className="py-24 bg-black text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-brand-gray-300 mb-6 block">Let's talk</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-10 leading-none">
              READY TO <br />
              <span className="text-brand-gray-300">TRANSFORM</span> <br />
              YOUR BRAND?
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="bg-brand-gray-900 border border-brand-gray-800 p-8 md:p-12"
          >
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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Name</label>
                    <input 
                      name="name"
                      required
                      type="text" 
                      className="w-full bg-brand-black/20 border-b border-brand-gray-700 py-3 px-0 focus:border-brand-gray-400 focus:outline-none transition-colors text-brand-white"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Email Address</label>
                    <input 
                      name="email"
                      required
                      type="email" 
                      className="w-full bg-brand-black/20 border-b border-brand-gray-700 py-3 px-0 focus:border-brand-gray-400 focus:outline-none transition-colors text-brand-white"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Subject</label>
                  <select className="w-full bg-transparent border-b border-brand-gray-700 py-3 px-0 focus:border-brand-gray-400 focus:outline-none transition-colors appearance-none cursor-pointer text-brand-white">
                    <option className="bg-brand-gray-900">Website Project</option>
                    <option className="bg-brand-gray-900">UI/UX Design</option>
                    <option className="bg-brand-gray-900">Consultation</option>
                    <option className="bg-brand-gray-900">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500">Message</label>
                  <textarea 
                    name="message"
                    required
                    rows={4}
                    className="w-full bg-brand-black/20 border-b border-brand-gray-700 py-3 px-0 focus:border-brand-gray-400 focus:outline-none transition-colors resize-none text-brand-white"
                    placeholder="Tell us about your project..."
                  />
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
                  className="w-full py-5 bg-brand-white text-brand-black text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-200 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {formState === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
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
