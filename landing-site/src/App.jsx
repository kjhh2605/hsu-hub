import { CTA_HREF, featureStories, hero } from './content/landingContent.js';

const ExploreLink = () => <a href={CTA_HREF}>모집 중인 동아리 보기</a>;

export default function App() {
  return (
    <>
      <header>
        <ExploreLink />
      </header>
      <main>
        <section>
          <h1>{hero.title}</h1>
          <ExploreLink />
        </section>
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
