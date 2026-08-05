import { BadgeCheck, Calendar, ExternalLink as ExternalLinkIcon, ShieldCheck } from 'lucide-react';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Reveal } from '../components/ui/Reveal';
import type { Certification } from '../types/portfolio';
import { cn } from '../lib/utils';

interface CertificationsProps {
  certifications: Certification[];
}

export function Certifications({ certifications }: CertificationsProps) {
  return (
    <section id="certifications" className="section-shell">
      <Reveal>
        <p className="section-kicker">credentials.verify</p>
        <h2 className="section-title">Verified credentials and applied training.</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {certifications.map((certification, index) => {
          const isEmt = certification.type === 'Professional Certification';

          return (
            <Reveal key={certification.name} delay={index * 0.05}>
              <article className="group flex h-full flex-col rounded-lg border border-white/12 bg-[#09090a] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_0_42px_rgba(255,255,255,0.06)] md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md border border-white/12 bg-black/45 font-mono text-sm font-bold uppercase text-white">
                      {certification.issuer
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join('')}
                    </div>
                    <div
                      className={cn(
                        'mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-normal',
                        isEmt
                          ? 'border-[var(--warning)]/25 text-[var(--warning)]'
                          : 'border-[var(--success)]/25 text-[var(--success)]',
                      )}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_12px_currentColor]" />
                      {certification.type}
                    </div>
                    <h3 className="text-2xl font-semibold leading-tight text-white">{certification.name}</h3>
                    <p className="mt-3 leading-6 text-zinc-400">{certification.issuer}</p>
                  </div>
                  {certification.verified ? (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/12 bg-white/[0.03] text-[var(--success)]" aria-label="Verified credential">
                      <BadgeCheck size={18} />
                    </span>
                  ) : null}
                </div>

                <div className="technical-grid mt-6 grid min-h-28 place-items-center rounded-md border border-dashed border-white/12 bg-black/40 text-center font-mono text-xs uppercase tracking-normal text-zinc-600">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={15} />
                    issuer record
                  </span>
                </div>

                <p className="mt-6 leading-7 text-zinc-300">{certification.description}</p>

                {(certification.issueDate || certification.expirationDate || certification.credentialId) ? (
                  <dl className="mt-5 grid gap-3 font-mono text-xs uppercase tracking-normal text-zinc-500">
                    {certification.issueDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <dt className="sr-only">Issue date</dt>
                        <dd>Issued {certification.issueDate}</dd>
                      </div>
                    ) : null}
                    {certification.expirationDate ? (
                      <div>
                        <dt className="sr-only">Expiration date</dt>
                        <dd>Expires {certification.expirationDate}</dd>
                      </div>
                    ) : null}
                    {certification.credentialId ? (
                      <div>
                        <dt className="sr-only">Credential ID</dt>
                        <dd>ID {certification.credentialId}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  {certification.skills.map((skill) => (
                    <span key={skill} className="rounded-md bg-white/[0.06] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-normal text-zinc-400">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  {certification.credentialUrl ? (
                    <ExternalLink href={certification.credentialUrl} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 font-mono text-xs uppercase tracking-normal text-zinc-200 transition hover:border-white/35">
                      View credential
                      <ExternalLinkIcon size={15} />
                    </ExternalLink>
                  ) : null}

                  {certification.certificateAsset ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer list-none font-mono text-xs uppercase tracking-normal text-zinc-400 transition hover:text-white">
                        View certificate
                      </summary>
                      <img
                        src={certification.certificateAsset}
                        alt={`${certification.name} certificate`}
                        className="mt-4 aspect-[16/9] w-full rounded-md border border-white/10 object-cover"
                        loading="lazy"
                      />
                    </details>
                  ) : null}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
