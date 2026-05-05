import {motion} from 'motion/react';
import {Link} from 'react-router-dom';
import {ArrowRight} from 'lucide-react';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta, blogArticles} from '../seo/seoConfig';
import {blogListSchema, buildBreadcrumb} from '../seo/structuredData';

export default function BlogIndex() {
  usePageSeo({
    meta: pageMeta.blog,
    structuredData: [
      blogListSchema,
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Blog', path: '/blog'},
      ]),
    ],
  });

  return (
    <div className="pt-32 pb-24">
      <motion.div
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
        className="max-w-7xl mx-auto px-6 mb-16"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
          Articles &amp; Guides
        </span>
        <h1 className="font-display text-5xl md:text-8xl font-bold tracking-tighter mb-6">
          BLOG
        </h1>
        <p className="text-brand-gray-600 max-w-2xl text-lg font-light leading-relaxed">
          Practical writing about building affordable, high-performing
          websites for small businesses in the UK. No jargon, no fluff.
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6">
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {blogArticles.map((article, idx) => (
            <motion.li
              key={article.slug}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true}}
              transition={{
                duration: 0.7,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group"
            >
              <Link
                to={`/blog/${article.slug}`}
                className="block border border-brand-gray-200 hover:border-brand-black transition-colors p-8 h-full"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-500 mb-4 block">
                  {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {article.readingMinutes} min read
                </span>
                <h2 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 leading-tight">
                  {article.title}
                </h2>
                <p className="text-brand-gray-600 font-light leading-relaxed mb-8">
                  {article.excerpt}
                </p>
                <span className="inline-flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-brand-black">
                  Read article
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
