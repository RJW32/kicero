import {motion} from 'motion/react';
import {Link} from 'react-router-dom';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';

export default function NotFoundPage() {
  usePageSeo({meta: pageMeta.notFound});

  return (
    <div className="pt-32 pb-24 min-h-[60vh] flex items-center">
      <motion.div
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
        className="max-w-3xl mx-auto px-6 text-center"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-6 block">
          Error 404
        </span>
        <h1 className="font-display text-6xl md:text-9xl font-bold tracking-tighter mb-8">
          PAGE NOT FOUND
        </h1>
        <p className="text-brand-gray-600 text-lg font-light max-w-xl mx-auto mb-12">
          The page you were looking for has moved or never existed. Head back
          to the homepage or get in touch and we&apos;ll point you in the
          right direction.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors font-mono"
          >
            Back to home
          </Link>
          <Link
            to="/contact"
            className="px-8 py-5 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all font-mono"
          >
            Contact us
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
