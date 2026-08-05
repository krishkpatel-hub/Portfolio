import { ArrowUpRight, Code2, Mail, UserRound } from 'lucide-react';
import { Reveal } from '../components/ui/Reveal';
import type { PersonalDetails } from '../types/portfolio';
import { ExternalLink } from '../components/ui/ExternalLink';

interface ContactProps {
  personal: PersonalDetails;
}

export function Contact({ personal }: ContactProps) {
  const github = personal.socials.find((link) => link.type === 'github');
  const linkedin = personal.socials.find((link) => link.type === 'linkedin');

  return (
    <section id="contact" className="section-shell">
      <Reveal>
        <p className="section-kicker">contact.ready</p>
        <h2 className="mt-3 max-w-3xl text-[clamp(2.7rem,10vw,5.6rem)] font-bold leading-[0.98] tracking-normal text-[var(--text)]">
          Get in touch.
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-8 soft-muted md:text-xl">
          Send a note about product engineering roles, collaborations, portfolio feedback, or a project that needs a careful builder.
        </p>
        <p className="mt-5 max-w-full break-words font-mono text-sm uppercase tracking-normal soft-dim sm:text-base">
          {personal.email}
        </p>
      </Reveal>

      <Reveal className="mt-8 flex flex-wrap gap-3">
        <a
          href={`mailto:${personal.email}`}
          aria-label="Email Krish Patel"
          className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-full px-5 py-3 font-mono text-xs font-bold uppercase tracking-normal primary-soft-action sm:px-6"
        >
          <Mail size={17} />
          <span className="min-w-0 break-words">Email Krish Patel</span>
          <ArrowUpRight size={15} />
        </a>
        {github ? (
          <ExternalLink href={github.href} className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-normal soft-control">
            <Code2 size={17} />
            GitHub
          </ExternalLink>
        ) : null}
        {linkedin ? (
          <ExternalLink href={linkedin.href} className="inline-flex min-h-12 items-center gap-2 rounded-full px-6 py-3 font-mono text-xs uppercase tracking-normal soft-control">
            <UserRound size={17} />
            LinkedIn
          </ExternalLink>
        ) : null}
      </Reveal>
    </section>
  );
}
