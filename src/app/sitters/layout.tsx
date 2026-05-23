import { getCurrentUser, navUserFrom } from "@/lib/auth/helpers";
import { HomeNav } from "@/components/homepage";

export default async function SittersLayout({ children }: { children: React.ReactNode }) {
  const navUser = navUserFrom(await getCurrentUser());
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <HomeNav user={navUser} />
      {/* Buffer for the floating fixed pill nav (top:16 + ~56px height) +
          breathing room so the page header sits comfortably below it. */}
      <main style={{ flex: 1, paddingTop: 120 }}>{children}</main>
    </div>
  );
}
