import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../components/Hero';
import Services from '../components/Services';
import Portfolio from '../components/Portfolio';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <>
      {/* Development Disclaimer Section */}
      <section id="disclaimer" className="pt-32 pb-16 bg-brand-white border-b border-brand-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-black mb-6"
          >
            <span className="font-display font-bold text-xl">!</span>
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-2xl md:text-3xl font-bold tracking-tighter mb-4 uppercase"
          >
            Project Under Development
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-brand-gray-600 text-base md:text-lg font-light leading-relaxed"
          >
            Please note that the <span className="font-bold text-brand-black">Kicero</span> website is currently in its development phase. The content, design, and features shown here are not final and are subject to change as we fine-tune the experience.
          </motion.p>
        </div>
      </section>

      <Hero />
      
      <div className="py-24 px-6 max-w-7xl mx-auto flex flex-col gap-40">
         <motion.section 
           initial={{ opacity: 0, y: 40 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="text-center"
         >
           <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">Our philosophy</span>
           <h2 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8 italic leading-none">
             TECHNICAL PRECISION <br />
             MEETS HIGH-END <br />
             MINIMALISM
           </h2>
           <p className="max-w-2xl mx-auto text-brand-gray-600 text-lg md:text-xl font-light leading-relaxed">
             Kicero is an elite digital workshop. We don't just build websites; we craft digital identities that demand attention through speed, aesthetics, and unmatched performance.
           </p>
         </motion.section>

         <section>
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">Crafted Work</span>
                <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter">PORTFOLIO</h2>
              </div>
              <p className="text-brand-gray-500 font-mono text-xs uppercase tracking-widest max-w-xs text-right">
                A selection of high-performance digital products and experiences.
              </p>
            </div>
            <Portfolio />
         </section>

         <motion.section 
           initial={{ opacity: 0, scale: 0.98 }}
           whileInView={{ opacity: 1, scale: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="bg-brand-black text-brand-white p-12 md:p-32 relative overflow-hidden"
         >
           <div className="absolute -right-20 -bottom-20 text-[25vw] font-black text-white/5 select-none font-display">
             ELITE
           </div>
           
           <div className="relative z-10 max-w-2xl">
             <h2 className="font-display text-4xl md:text-7xl font-bold uppercase tracking-tighter mb-12 leading-[0.85]">
               READY TO <br />
               COMMAND THE <br />
               DIGITAL SPACE?
             </h2>
             <Link 
               to="/contact" 
               className="group inline-flex items-center gap-6 text-sm font-bold uppercase tracking-[0.4em] border-b border-white/30 pb-4 hover:border-white transition-all duration-500"
             >
               Start your project <ArrowRight size={20} className="group-hover:translate-x-4 transition-transform duration-500" />
             </Link>
           </div>
         </motion.section>

         <section className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">Capabilities</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-16 uppercase tracking-tighter">Our Services</h2>
            <Services />
         </section>
      </div>
    </>
  );
}
