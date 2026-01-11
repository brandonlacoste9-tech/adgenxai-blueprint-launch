import { Button } from "@/components/ui/button";
import type { SectionContent } from "@/lib/landingPageGenerators";

interface CTASectionProps {
  content: SectionContent["en"];
  language?: "en" | "fr";
}

export const CTASection = ({ content, language = "en" }: CTASectionProps) => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-teal/20 via-cyan/20 to-pink/20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {content.title || "Get Started Today"}
        </h2>
        {content.subtitle && (
          <p className="text-xl text-foreground/80 mb-6 max-w-2xl mx-auto">
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
