import HiveMindHeader from "@/components/HiveMindHeader";
import AuroraBackground from "@/components/AuroraBackground";
import CreatorStudio from "@/components/CreatorStudio";

const Creator = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_center,_#001a33_0%,_#000a18_80%)]">
      <AuroraBackground />
      <HiveMindHeader />
      <main className="min-h-[calc(100vh-4rem)]">
        <CreatorStudio />
      </main>
      <footer className="text-center py-8 px-4 text-foreground/60 text-sm bg-background/50 backdrop-blur-xl border-t border-white/10">
        <p className="mb-2">© 2025 Kolony. All rights reserved. Made with 🐝 by the hive.</p>
        <p>
          Contact: <a href="mailto:hello@kolony.ai" className="text-cyan hover:text-teal transition-colors">hello@kolony.ai</a>
        </p>
      </footer>
    </div>
  );
};

export default Creator;
