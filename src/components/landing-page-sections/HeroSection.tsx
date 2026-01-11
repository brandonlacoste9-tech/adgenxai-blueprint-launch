import { Button } from "@/components/ui/button";
import type { SectionContent } from "@/lib/landingPageGenerators";

interface HeroSectionProps {
  content: SectionContent["en"];
  language?: "en" | "fr";
}

export const HeroSection = ({ content, language = "en" }: HeroSectionProps) => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-teal via-cyan to-pink bg-clip-text text-transparent">
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            {content.subtitle}
          </p>
        )}
        {content.content && (
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
            {content.content}
          </p>
        )}
        {content.cta && (
          <Button size="lg" className="bg-gradient-to-r from-teal to-cyan hover:opacity-90 text-background font-semibold">
            {content.cta}
          </Button>
        )}
      </div>
    </section>
  );
};
