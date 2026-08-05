import type { PersonalDetails } from '../../types/portfolio';

interface FooterProps {
  personal: PersonalDetails;
}

export function Footer({ personal }: FooterProps) {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex w-[min(1180px,calc(100%-2rem))] flex-col justify-between gap-4 font-mono text-[0.68rem] uppercase tracking-normal soft-dim md:flex-row md:text-xs">
        <p>© {new Date().getFullYear()} {personal.name}. All rights reserved.</p>
        <p>Built with React, TypeScript, Motion, GSAP, and Lenis.</p>
      </div>
    </footer>
  );
}
