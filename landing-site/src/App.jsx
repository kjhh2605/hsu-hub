import { CTA_HREF } from './content/landingContent.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Comparison from './components/Comparison.jsx';
import Journey from './components/Journey.jsx';
import FeatureShowcase from './components/FeatureShowcase.jsx';

const ExploreLink = () => <a href={CTA_HREF}>모집 중인 동아리 보기</a>;

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Comparison />
        <Journey />
        <FeatureShowcase />
        <section>
          <ExploreLink />
        </section>
      </main>
    </>
  );
}
