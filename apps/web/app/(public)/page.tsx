import { Suspense } from 'react';
import { HomeBranches } from '../../features/home/home-branches';
import { HomeHero } from '../../features/home/home-hero';
import { FoodDiscovery } from '../../features/home/food-discovery';
import { HomeExperience, HomePromotion } from '../../features/home/home-experience';
import { HomeQuestions, OrderingGuide } from '../../features/home/ordering-guide';

export default function HomePage() {
  return (
    <main className="home-refined">
      <HomeHero />
      <FoodDiscovery />
      <HomePromotion />
      <OrderingGuide />
      <Suspense
        fallback={
          <div className="home-branches-loading public-container" role="status">
            Buscando tu próxima parada…
          </div>
        }
      >
        <HomeBranches />
      </Suspense>
      <HomeExperience />
      <HomeQuestions />
    </main>
  );
}
