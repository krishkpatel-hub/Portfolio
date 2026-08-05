import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Reveal } from '../components/ui/Reveal';
import type { Project } from '../types/portfolio';

gsap.registerPlugin(ScrollTrigger);

interface ProjectsProps {
  projects: Project[];
  reducedMotion: boolean;
}

function GithubMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0.2a8 8 0 0 0-2.53 15.59c0.4 0.07 0.55-0.17 0.55-0.38v-1.35c-2.25 0.49-2.72-1.08-2.72-1.08-0.36-0.94-0.89-1.19-0.89-1.19-0.73-0.5 0.06-0.49 0.06-0.49 0.81 0.06 1.23 0.83 1.23 0.83 0.72 1.23 1.88 0.87 2.34 0.67 0.07-0.52 0.28-0.87 0.51-1.07-1.79-0.2-3.67-0.9-3.67-3.98 0-0.88 0.31-1.6 0.82-2.16-0.08-0.2-0.36-1.02 0.08-2.13 0 0 0.68-0.22 2.2 0.82A7.54 7.54 0 0 1 8 3.72c0.68 0 1.36 0.09 2 0.27 1.53-1.04 2.2-0.82 2.2-0.82 0.44 1.11 0.16 1.93 0.08 2.13 0.51 0.56 0.82 1.28 0.82 2.16 0 3.09-1.89 3.77-3.69 3.97 0.29 0.25 0.55 0.74 0.55 1.49v2.2c0 0.21 0.15 0.46 0.56 0.38A8 8 0 0 0 8 0.2Z" />
    </svg>
  );
}

export function Projects({ projects, reducedMotion }: ProjectsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || window.matchMedia('(max-width: 767px)').matches) return undefined;

    const section = sectionRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!section || !track || !progress) return undefined;

    const context = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 48);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, section);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);

    return () => {
      window.removeEventListener('resize', refresh);
      context.revert();
    };
  }, [reducedMotion]);

  return (
    <section id="projects" ref={sectionRef} className="overflow-hidden py-[clamp(5rem,12vw,10rem)]">
      <div className="mx-auto w-[min(1180px,calc(100%-2rem))]">
        <Reveal>
          <p className="section-kicker">projects.sequence</p>
          <h2 className="section-title">Selected builds in a horizontal release lane.</h2>
        </Reveal>
        <div className="mt-10 h-1 overflow-hidden rounded-full bg-white/10 md:mt-14">
          <div ref={progressRef} className="h-full origin-left scale-x-0 bg-white" />
        </div>
      </div>

      <div ref={trackRef} className="mx-auto mt-8 grid w-[min(1180px,calc(100%-2rem))] gap-5 md:flex md:w-max md:px-[calc((100vw-min(1180px,calc(100vw-2rem)))/2)]">
        {projects.map((project, index) => (
          <article
            key={project.title}
            className="group flex min-h-[520px] flex-col justify-between rounded-lg border border-white/12 bg-[#09090a] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/25 md:w-[min(74vw,720px)] md:p-7"
            data-cursor={project.demoUrl || project.sourceUrl ? 'view' : 'interactive'}
          >
            <div>
              <div className="mb-6 flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-normal text-zinc-500">
                <span>{String(index + 1).padStart(2, '0')} / {project.category}</span>
                {project.status ? <span className="rounded-full border border-white/12 px-3 py-1 text-zinc-400">{project.status}</span> : null}
              </div>

              <div className="mb-7 grid min-h-48 place-items-center overflow-hidden rounded-md border border-white/10 bg-black">
                <div className="relative h-full min-h-48 w-full">
                  <div className="technical-grid absolute inset-0 opacity-70" aria-hidden="true" />
                  <div className="absolute inset-x-8 top-1/2 h-px bg-white/30" aria-hidden="true" />
                  <div className="absolute left-8 top-8 font-mono text-xs uppercase tracking-normal text-zinc-500">
                    {project.title}
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-semibold text-white md:text-5xl">{project.title}</h3>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">{project.description}</p>

              <ul className="mt-6 grid gap-3 text-sm text-zinc-400 md:grid-cols-3">
                {project.achievements.map((achievement) => (
                  <li key={achievement} className="border-l border-white/15 pl-3 leading-6">{achievement}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <div className="mb-6 flex flex-wrap gap-2">
                {project.technologies.map((technology) => (
                  <span key={technology} className="rounded-md bg-white/[0.06] px-2.5 py-1.5 font-mono text-[0.68rem] uppercase tracking-normal text-zinc-400">
                    {technology}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {project.sourceUrl ? (
                  <ExternalLink
                    href={project.sourceUrl}
                    aria-label={`View the ${project.title} source code on GitHub`}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs uppercase tracking-normal soft-control"
                    data-cursor="view"
                  >
                    <GithubMark />
                    Source Code
                  </ExternalLink>
                ) : null}
                {project.demoUrl ? (
                  <ExternalLink
                    href={project.demoUrl}
                    aria-label={`Visit the ${project.title} live website`}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-xs font-bold uppercase tracking-normal primary-soft-action"
                    data-cursor="view"
                  >
                    Visit Website
                    <ExternalLinkIcon size={15} />
                  </ExternalLink>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
