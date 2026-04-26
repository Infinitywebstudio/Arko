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

export default function Home() {
  return (
    <>
      <HomeNav />
      <HomeHero />
      <HomeStats />
      <HomeHowItWorks />
      <HomeSitters />
      <HomeTrust />
      <HomeCTA />
      <HomeFooter />
    </>
  );
}
