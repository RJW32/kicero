import {motion, AnimatePresence} from 'motion/react';
import {Plus} from 'lucide-react';
import {useState} from 'react';
import {faqItems} from '../data/faq';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <motion.section
      initial={{opacity: 0, y: 28}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, margin: '-60px'}}
      transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
      className="max-w-7xl mx-auto px-6 mt-24"
      aria-labelledby="faq-heading"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
        Frequently asked
      </span>
      <h2
        id="faq-heading"
        className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-12"
      >
        FAQ
      </h2>

      <ul className="border-t border-brand-gray-200">
        {faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <li key={item.question} className="border-b border-brand-gray-200">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full flex items-start justify-between gap-6 py-6 md:py-8 text-left group"
              >
                <span className="font-display text-lg md:text-2xl font-bold uppercase tracking-tight text-brand-black">
                  {item.question}
                </span>
                <Plus
                  size={22}
                  className={`shrink-0 mt-1 transition-transform duration-300 ${
                    isOpen ? 'rotate-45' : 'rotate-0'
                  } text-brand-gray-500 group-hover:text-brand-black`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{height: 0, opacity: 0}}
                    animate={{height: 'auto', opacity: 1}}
                    exit={{height: 0, opacity: 0}}
                    transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
                    className="overflow-hidden"
                  >
                    <p className="pb-8 text-brand-gray-600 font-light leading-relaxed text-base md:text-lg max-w-3xl">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
