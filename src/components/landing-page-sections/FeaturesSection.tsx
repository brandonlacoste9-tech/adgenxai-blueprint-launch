import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { SectionContent } from "@/lib/landingPageGenerators";

interface FeaturesSectionProps {
  content: SectionContent["en"];
  language?: "en" | "fr";
}

export const FeaturesSection = ({ content, language = "en" }: FeaturesSectionProps) => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {content.title || "Features"}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>
        
        {content.features && content.features.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.features.map((feature, index) => (
              <Card key={index} className="glass-card hover:border-teal/50 transition-all">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-teal flex-shrink-0 mt-0.5" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-foreground/50">
            <p>No features available</p>
          </div>
        )}
      </div>
    </section>
  );
};
