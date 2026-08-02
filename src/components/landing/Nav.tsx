import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logomark } from '../icons/Logomark';
import { Button } from '../primitives/Button';
import { cn } from '../../lib/cn';

const links = ['Platform', 'How it works', 'Pricing'];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'fixed top-0 z-50 flex w-full items-center justify-between px-6 py-4 transition-all duration-300 md:px-10',
        scrolled ? 'border-b border-border-subtle bg-base/70 backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
      )}
    >
      <Link to="/" className="flex items-center gap-2">
        <Logomark size={26} />
        <span className="font-display text-[15px] font-semibold text-text-bright">PathVector</span>
      </Link>

      <div className="hidden items-center gap-8 md:flex">
        {links.map((l) => (
          <a key={l} href="#" className="group relative text-sm text-text-muted transition-colors hover:text-text-bright">
            {l}
            <span className="absolute -bottom-1 left-0 h-px w-0 bg-blue transition-all duration-200 group-hover:w-full" />
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Link to="/login" className="hidden text-sm text-text-muted transition-colors hover:text-text-bright sm:block">
          Log in
        </Link>
        <Link to="/login">
          <Button size="sm" sheen>
            Start free
          </Button>
        </Link>
      </div>
    </motion.nav>
  );
}
