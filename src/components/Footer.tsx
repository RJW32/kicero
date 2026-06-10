import {motion} from 'motion/react';
import {Link} from 'react-router-dom';
import {useCookieConsent} from '../context/CookieConsentContext';
import kiceroLogoBlack from '../assets/Logo/Kicero Logo Black.svg';
import kiceroLogoNameBlack from '../assets/Logo/Kicero Logo Name Black.svg';

type FooterLink =
  | {label: string; to: string}
  | {label: string; cookiePreferences: true};

const footerNav: Array<{
  title: string;
  links: FooterLink[];
}> = [
  {
    title: 'Studio',
    links: [
      {label: 'Home', to: '/'},
      {label: 'About', to: '/about'},
      {label: 'Pricing & Services', to: '/services'},
      {label: 'Portfolio', to: '/portfolio'},
      {label: 'Contact', to: '/contact'},
    ],
  },
  {
    title: 'Resources',
    links: [
      {label: 'Privacy Policy', to: '/privacy'},
      {label: 'Terms of Service', to: '/terms'},
      {label: 'Cookie preferences', cookiePreferences: true},
    ],
  },
];

export default function Footer() {
  const {openPreferenceCentre} = useCookieConsent();

  return (
    <motion.footer
      initial={{opacity: 0, y: 24}}
      whileInView={{opacity: 1, y: 0}}
      viewport={{once: true}}
      transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1]}}
      className="pt-16 pb-12 border-t border-brand-gray-200"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link
              to="/"
              aria-label="Kicero home"
              className="inline-flex items-center gap-1.5"
            >
              <img
                src={kiceroLogoNameBlack}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-[22px] sm:h-6 w-auto object-contain"
              />
              <img
                src={kiceroLogoBlack}
                alt=""
                aria-hidden="true"
                width={21}
                height={21}
                loading="lazy"
                decoding="async"
                className="h-[21px] w-auto object-contain -translate-y-[0px]"
              />
            </Link>
            <p className="text-sm text-brand-gray-600 font-light leading-relaxed mt-4 max-w-sm">
              Affordable, high-end custom websites for small businesses across
              the UK. Designed and built in Scotland.
            </p>
            <a
              href="mailto:info@kicero.co.uk"
              className="inline-block mt-6 text-sm font-medium tracking-wide hover:opacity-60 transition-opacity"
            >
              info@kicero.co.uk
            </a>
          </div>

          {footerNav.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gray-500 mb-5">
                {column.title}
              </p>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={'to' in link ? link.to : link.label}>
                    {'to' in link ? (
                      <Link
                        to={link.to}
                        className="text-sm text-brand-gray-700 hover:text-brand-black transition-colors"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={openPreferenceCentre}
                        className="text-sm text-brand-gray-700 hover:text-brand-black transition-colors"
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-brand-gray-100">
          <p className="text-xs text-brand-gray-600">
            © 2026 Kicero. All rights reserved. Designed &amp; built in
            Scotland.
          </p>
          <p className="text-xs text-brand-gray-500 uppercase tracking-widest">
            Serving the UK
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
