import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { isExternalUrl } from '../../lib/utils';

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
  const external = isExternalUrl(href);

  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} {...props}>
      {children}
    </a>
  );
}
