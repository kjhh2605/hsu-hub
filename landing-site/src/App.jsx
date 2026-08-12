import { CTA_HREF, featureStories } from './content/landingContent.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';

const ExploreLink = () => <a href={CTA_HREF}>모집 중인 동아리 보기</a>;

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        {featureStories.map((feature) => (
          <section key={feature.id}>
            <h2>{feature.title}</h2>
          </section>
        ))}
        <section>
          <ExploreLink />
        </section>
      </main>
    </>
  );
}
