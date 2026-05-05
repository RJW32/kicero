import {motion} from 'motion/react';
import {Link, useParams} from 'react-router-dom';
import {ArrowLeft} from 'lucide-react';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta, findBlogArticle} from '../seo/seoConfig';
import {buildArticleSchema, buildBreadcrumb} from '../seo/structuredData';
import {articleBodies} from '../blog/articles';
import NotFoundPage from './NotFoundPage';

export default function BlogArticle() {
  const {slug = ''} = useParams<{slug: string}>();
  const article = findBlogArticle(slug);
  const body = articleBodies[slug];

  usePageSeo({
    meta: article
      ? {
          title: `${article.title} | Kicero`,
          description: article.description,
          path: `/blog/${article.slug}`,
        }
      : pageMeta.notFound,
    structuredData: article
      ? [
          buildArticleSchema(slug),
          buildBreadcrumb([
            {name: 'Home', path: '/'},
            {name: 'Blog', path: '/blog'},
            {name: article.title, path: `/blog/${article.slug}`},
          ]),
        ]
      : [],
  });

  if (!article || !body) {
    return <NotFoundPage />;
  }

  return (
    <div className="pt-32 pb-24">
      <motion.article
        initial={{opacity: 0, y: 24}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
        className="max-w-3xl mx-auto px-6"
      >
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-gray-500 hover:text-brand-black transition-colors mb-12"
        >
          <ArrowLeft size={14} /> Back to blog
        </Link>

        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-gray-400 mb-4 block">
          {new Date(article.publishedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}{' '}
          · {article.readingMinutes} min read
        </span>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter mb-8 leading-[1.05]">
          {article.title}
        </h1>
        <p className="text-brand-gray-600 text-lg md:text-xl font-light leading-relaxed mb-16 border-l-2 border-brand-gray-300 pl-6">
          {article.description}
        </p>

        <div className="kicero-prose space-y-6 text-brand-gray-700 font-light leading-relaxed text-base md:text-lg">
          {body}
        </div>

        <div className="mt-20 pt-12 border-t border-brand-gray-200">
          <p className="text-brand-gray-500 text-sm font-light mb-6">
            Want a fast, simple website for your business?
          </p>
          <Link
            to="/contact"
            className="inline-block px-8 py-5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors font-mono"
          >
            Get a free quote
          </Link>
        </div>
      </motion.article>
    </div>
  );
}
