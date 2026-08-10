import { Menu, X } from 'lucide-react';
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { NavItem, PersonalDetails } from '../../types/portfolio';
import { cn } from '../../lib/utils';
import { useActiveSection } from '../../hooks/useActiveSection';
import { scrollToHash } from '../../lib/scrollNavigation';

interface NavigationProps {
  nav: NavItem[];
  personal: PersonalDetails;
}

export function Navigation({ nav, personal }: NavigationProps) {
  const [open, setOpen] = useState(false);
  const sectionIds = useMemo(() => nav.map((item) => item.href.slice(1)), [nav]);
  const activeSection = useActiveSection(sectionIds);

  const handleNavigate = () => setOpen(false);
  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    const wasOpen = open;
    setOpen(false);
    const scrollToSection = () => {
      scrollToHash(href, { history: 'push' });
    };

    if (wasOpen) {
      window.setTimeout(scrollToSection, 260);
    } else {
      window.requestAnimationFrame(scrollToSection);
    }
  };

  const handleNavKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === ' ') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <header data-site-header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
      <nav data-site-header-bar className="mx-auto flex h-16 w-[min(1180px,calc(100%-2rem))] items-center justify-between" aria-label="Primary navigation">
        <a href="#top" onClick={(event) => handleNavClick(event, '#top')} onKeyDown={handleNavKeyDown} className="font-mono text-xs font-semibold uppercase tracking-normal text-white">
          {personal.name}
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const id = item.href.slice(1);
            const active = activeSection === id;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? 'location' : undefined}
                onClick={(event) => handleNavClick(event, item.href)}
                onKeyDown={handleNavKeyDown}
                className={cn(
                  'nav-link relative px-3 py-2 font-mono text-[0.72rem] uppercase tracking-normal transition-colors',
                  active ? 'is-active text-white' : 'text-zinc-400 hover:text-white',
                )}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-white/15 text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={cn(
          'grid border-t border-white/10 bg-black/95 transition-[grid-template-rows] lg:hidden',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-2 py-4">
            {nav.map((item) => {
              const active = activeSection === item.href.slice(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'location' : undefined}
                  onClick={(event) => {
                    handleNavigate();
                    handleNavClick(event, item.href);
                  }}
                  onKeyDown={handleNavKeyDown}
                  className={cn(
                    'mobile-nav-link rounded-md border border-white/10 px-4 py-3 font-mono text-sm uppercase tracking-normal text-zinc-200',
                    active && 'is-active',
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
