import {
  HomeNav,
  HomeHero,
  HomeSitters,
  HomeTrust,
  HomeCTA,
  HomeFooter,
} from "@/components/homepage";
import { HomeApproach } from "@/components/HomeApproach";
import { listSittersForHome } from "@/lib/sitter/helpers";

export default async function Home() {
  const sitters = await listSittersForHome(4);
  return (
    <>
      <HomeNav />
      <HomeHero />
      <HomeApproach />
      <HomeSitters sitters={sitters} />
      <HomeTrust />
      <HomeCTA />
      <HomeFooter />
    </>
  );
}
