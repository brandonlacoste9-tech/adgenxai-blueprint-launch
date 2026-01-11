import { Card, CardContent } from "@/components/ui/card";
import type { SectionContent } from "@/lib/landingPageGenerators";

// Quote icon component
const QuoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
  </svg>
);

interface TestimonialsSectionProps {
  content: SectionContent["en"];
  language?: "en" | "fr";
}

export const TestimonialsSection = ({ content, language = "en" }: TestimonialsSectionProps) => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {content.title || "Testimonials"}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </div>
        
        {content.items && Array.isArray(content.items) && content.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.items.map((item: any, index: number) => (
              <Card key={index} className="glass-card hover:border-teal/50 transition-all">
                <CardContent className="pt-6">
                  <QuoteIcon className="h-8 w-8 text-teal/50 mb-4" />
                  <p className="text-foreground/80 mb-6 italic">
                    "{item.text || item.testimonial || ""}"
                  </p>
                  <div className="border-t border-white/10 pt-4">
                    <p className="font-semibold text-teal">{item.name || "Customer"}</p>
                    {item.role && (
                      <p className="text-sm text-foreground/60 mt-1">{item.role}</p>
                    )}
                    {item.company && (
                      <p className="text-sm text-foreground/60">{item.company}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-foreground/50">
            <p>No testimonials available</p>
          </div>
        )}
      </div>
    </section>
  );
};
