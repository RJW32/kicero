import Contact from '../components/Contact';
import {usePageSeo} from '../seo/usePageSeo';
import {pageMeta} from '../seo/seoConfig';
import {buildBreadcrumb} from '../seo/structuredData';

export default function ContactPage() {
  usePageSeo({
    meta: pageMeta.contact,
    structuredData: [
      buildBreadcrumb([
        {name: 'Home', path: '/'},
        {name: 'Contact', path: '/contact'},
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        url: 'https://kicero.co.uk/contact',
        mainEntity: {
          '@type': 'Organization',
          name: 'Kicero',
          email: 'info@kicero.co.uk',
        },
      },
    ],
  });

  return (
    <div className="pt-20">
      <Contact />
    </div>
  );
}
