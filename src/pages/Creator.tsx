import HiveMindHeader from "@/components/HiveMindHeader";
import AuroraBackground from "@/components/AuroraBackground";
import CreatorStudio from "@/components/CreatorStudio";
import Footer from "@/components/Footer";
import { BRAND_IDENTITY } from "@/lib/constants";

const Creator = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_center,_#001a33_0%,_#000a18_80%)]">
      <AuroraBackground />
      <HiveMindHeader />
      <main className="min-h-[calc(100vh-4rem)]">
        <CreatorStudio />
      </main>
      <footer className="text-center py-8 px-4 text-foreground/60 text-sm bg-background/50 backdrop-blur-xl border-t border-white/10">
        <p className="mb-2">
          © {new Date().getFullYear()} {BRAND_IDENTITY.name}. All rights reserved. Made with {BRAND_IDENTITY.emoji} by the hive.
        </p>
        <p>
          Contact: <a href={BRAND_IDENTITY.contactHref} className="text-cyan hover:text-teal transition-colors">{BRAND_IDENTITY.contactEmail}</a>
        </p>
      </footer>
    </div>
  );
};

export default Creator;
