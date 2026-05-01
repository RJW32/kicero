import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleNavLinkClick = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header id="main-header" className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-brand-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Link 
            to="/" 
            className="text-2xl font-display font-bold tracking-tighter"
            onClick={() => handleNavLinkClick('/')}
          >
            KICERO
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href}
              className="text-sm font-medium tracking-wide uppercase hover:opacity-50 transition-opacity"
              onClick={() => handleNavLinkClick(link.href)}
            >
              {link.name}
            </Link>
          ))}
          <Link 
            to="/contact"
            className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
            onClick={() => handleNavLinkClick('/contact')}
          >
            Start a project
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
        className="md:hidden overflow-hidden bg-white border-b border-brand-gray-200"
      >
        <div className="px-6 py-10 flex flex-col gap-6 items-center">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href}
              onClick={() => handleNavLinkClick(link.href)}
              className="text-xl font-display font-medium tracking-wide uppercase hover:opacity-50 transition-opacity"
            >
              {link.name}
            </Link>
          ))}
          <Link 
            to="/contact"
            onClick={() => handleNavLinkClick('/contact')}
            className="mt-4 px-10 py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-brand-gray-800 transition-colors"
          >
            Start a project
          </Link>
        </div>
      </motion.div>
    </header>
  );
}
