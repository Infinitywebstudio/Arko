import {
  HomeNav,
  HomeHero,
  HomeStats,
  HomeHowItWorks,
  HomeSitters,
  HomeTrust,
  HomeCTA,
  HomeFooter,
} from "@/components/homepage";
import { listSittersForHome } from "@/lib/sitter/helpers";

export default async function Home() {
  const sitters = await listSittersForHome(4);
  return (
    <>
      <HomeNav />
      <HomeHero />
      <HomeStats />
      <HomeHowItWorks />
      <HomeSitters sitters={sitters} />
      <HomeTrust />
      <HomeCTA />
      <HomeFooter />
    </>
  );
}
