export interface NavItem {
  label: string;
  href: `#${string}`;
}

export interface SocialLink {
  label: string;
  href: string;
  type: 'github' | 'linkedin' | 'email';
}

export interface PersonalDetails {
  name: string;
  role: string;
  status: string;
  tagline: string;
  email: string;
  location: string;
  focus: string;
  availability: string;
  canonicalUrl: string;
  socials: SocialLink[];
  audioTrack?: {
    title: string;
    src: string;
  };
}

export interface Education {
  institution: string;
  dates: string;
  degree: string;
  focus: string;
  gpa: string;
  recognition: string;
}

export interface SkillGroup {
  title: string;
  status: string;
  completion: number;
  skills: string[];
}

export interface Certification {
  name: string;
  issuer: string;
  type: string;
  issueDate?: string;
  expirationDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  certificateAsset?: string;
  skills: string[];
  description: string;
  verified: boolean;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  dates: string;
  location: string;
  description: string;
  achievements: string[];
  technologies: string[];
  link?: string;
  metrics?: string[];
}

export interface LeadershipEntry {
  organization: string;
  role: string;
  dates: string;
  location: string;
  category: string;
  summary: string;
  achievements: string[];
  technologies: string[];
  secondary?: boolean;
}

export interface Project {
  title: string;
  category: string;
  description: string;
  achievements: string[];
  technologies: string[];
  sourceUrl?: string;
  demoUrl?: string;
  status?: string;
  image?: string;
}

export interface Post {
  title: string;
  slug: string;
  category: string;
  date: string;
  readingTime: string;
  externalUrl?: string;
}

export interface PortfolioData {
  personal: PersonalDetails;
  nav: NavItem[];
  education: Education;
  about: {
    annotation: string;
    paragraphs: string[];
    highlights: string[];
    currentFocus: string[];
    terminalFacts: Array<{ label: string; value: string }>;
  };
  skills: SkillGroup[];
  certifications: Certification[];
  experience: ExperienceEntry[];
  leadership: LeadershipEntry[];
  projects: Project[];
  posts: Post[];
}
