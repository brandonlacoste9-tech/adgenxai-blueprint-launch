import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { formatCanadianPrice } from "@/lib/canadianFeatures";
import type { SectionContent } from "@/lib/landingPageGenerators";

interface PricingSectionProps {
  content: SectionContent["en"];
  language?: "en" | "fr";
}

export const PricingSection = ({ content, language = "en" }: PricingSectionProps) => {
  return (
    <section className="py-16 md:py-24 bg-background/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {content.title || "Pricing"}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>
        
        {content.items && Array.isArray(content.items) && content.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {content.items.map((item: any, index: number) => (
              <Card
                key={index}
                className={`glass-card hover:border-teal/50 transition-all ${
                  item.popular ? "ring-2 ring-teal/50" : ""
                }`}
              >
                {item.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-teal to-cyan text-background">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{item.name || "Plan"}</CardTitle>
                  <CardDescription className="text-sm mt-2">
                    {item.description || ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-teal">
                      {formatCanadianPrice(item.price || 0, "ON", false)}
                    </span>
                    {item.period && (
                      <span className="text-foreground/60 ml-2">/{item.period}</span>
                    )}
                  </div>
                  {item.features && Array.isArray(item.features) && (
                    <ul className="space-y-3">
                      {item.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-teal flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/70">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-gradient-to-r from-teal to-cyan hover:opacity-90 text-background font-semibold">
                    {item.cta || "Get Started"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-foreground/50">
            <p>No pricing plans available</p>
          </div>
        )}
      </div>
    </section>
  );
};
