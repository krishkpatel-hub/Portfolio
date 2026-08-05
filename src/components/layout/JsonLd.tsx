import type { PersonalDetails } from '../../types/portfolio';

interface JsonLdProps {
  personal: PersonalDetails;
}

export function JsonLd({ personal }: JsonLdProps) {
  const sameAs = personal.socials
    .filter((link) => link.type !== 'email')
    .map((link) => link.href);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: personal.name,
    jobTitle: personal.role,
    email: personal.email,
    url: personal.canonicalUrl,
    sameAs,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
