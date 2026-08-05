import { useReducedMotion } from 'motion/react';
import { JsonLd } from './components/layout/JsonLd';
import { Footer } from './components/layout/Footer';
import { Navigation } from './components/layout/Navigation';
import { CursorFollower } from './components/ui/CursorFollower';
import { portfolioData } from './data/portfolio';
import { useLenisScroll } from './hooks/useLenisScroll';
import { About } from './sections/About';
import { Contact } from './sections/Contact';
import { Certifications } from './sections/Certifications';
import { Experience } from './sections/Experience';
import { Hero } from './sections/Hero';
import { Leadership } from './sections/Leadership';
import { Posts } from './sections/Posts';
import { Projects } from './sections/Projects';
import { Skills } from './sections/Skills';

function App() {
  const reducedMotion = Boolean(useReducedMotion());
  useLenisScroll(reducedMotion);

  return (
    <>
      <JsonLd personal={portfolioData.personal} />
      <CursorFollower />
      <a className="skip-link" href="#about">
        Skip to content
      </a>
      <Navigation nav={portfolioData.nav} personal={portfolioData.personal} />
      <main>
        <Hero personal={portfolioData.personal} />
        <About about={portfolioData.about} education={portfolioData.education} personal={portfolioData.personal} />
        <Skills skills={portfolioData.skills} />
        <Certifications certifications={portfolioData.certifications} />
        <Experience experience={portfolioData.experience} />
        <Leadership leadership={portfolioData.leadership} />
        <Projects projects={portfolioData.projects} reducedMotion={reducedMotion} />
        <Posts posts={portfolioData.posts} />
        <Contact personal={portfolioData.personal} />
      </main>
      <Footer personal={portfolioData.personal} />
    </>
  );
}

export default App;
