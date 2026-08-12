import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Comparison from './components/Comparison.jsx';
import Journey from './components/Journey.jsx';
import FeatureShowcase from './components/FeatureShowcase.jsx';
import FinalCta from './components/FinalCta.jsx';
import Footer from './components/Footer.jsx';
import Reveal from './components/Reveal.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Reveal><Comparison /></Reveal>
        <Reveal><Journey /></Reveal>
        <Reveal><FeatureShowcase /></Reveal>
        <Reveal><FinalCta /></Reveal>
      </main>
      <Footer />
    </>
  );
}
