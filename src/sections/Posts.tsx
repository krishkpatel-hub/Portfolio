import { ChevronRight, FileText } from 'lucide-react';
import { ExternalLink } from '../components/ui/ExternalLink';
import { Reveal } from '../components/ui/Reveal';
import type { Post } from '../types/portfolio';

interface PostsProps {
  posts: Post[];
}

export function Posts({ posts }: PostsProps) {
  return (
    <section id="posts" className="section-shell">
      <Reveal>
        <p className="section-kicker">notes.browser</p>
        <h2 className="section-title">Technical notes staged like deploy artifacts.</h2>
      </Reveal>

      <Reveal className="mt-14 overflow-hidden rounded-lg border border-white/12 bg-[#09090a]">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/10 px-4 py-3 font-mono text-xs uppercase tracking-normal text-zinc-500">
          <span>object</span>
          <span className="hidden sm:block">category</span>
          <span>updated</span>
        </div>
        <div>
          {posts.map((post) => (
            <ExternalLink
              key={post.slug}
              href={post.externalUrl ?? `#${post.slug}`}
              className="group grid grid-cols-[1fr_auto] gap-4 border-b border-white/8 px-4 py-5 transition hover:bg-white/[0.035] sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <FileText size={17} className="shrink-0 text-zinc-500" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-zinc-100">{post.title}</span>
                  <span className="mt-1 block font-mono text-xs uppercase tracking-normal text-zinc-500">
                    /notes/{post.slug} · {post.readingTime}
                  </span>
                </span>
              </span>
              <span className="hidden self-center rounded-full border border-white/10 px-3 py-1 font-mono text-xs uppercase tracking-normal text-zinc-500 sm:block">
                {post.category}
              </span>
              <span className="flex items-center gap-3 self-center font-mono text-xs uppercase tracking-normal text-zinc-500">
                {post.date}
                <ChevronRight size={16} className="transition group-hover:translate-x-1" />
              </span>
            </ExternalLink>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
