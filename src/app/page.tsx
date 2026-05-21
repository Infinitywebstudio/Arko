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
import { getCurrentUser, navUserFrom } from "@/lib/auth/helpers";

export default async function Home() {
  const sitters = await listSittersForHome(4);
  const navUser = navUserFrom(await getCurrentUser());
  return (
    <>
      <HomeNav user={navUser} />
      <HomeHero />
      <HomeApproach />
      <HomeSitters sitters={sitters} />
      <HomeTrust />
      <HomeCTA />
      <HomeFooter />
    </>
  );
}
