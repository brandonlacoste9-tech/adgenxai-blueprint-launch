import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { BRAND_IDENTITY } from "@/lib/constants";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Marketing Director",
    company: "TechCorp Inc.",
    content: `${BRAND_IDENTITY.name} transformed our advertising workflow. We've seen a 300% increase in campaign performance and cut our creative production time by 80%.`,
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Founder & CEO",
    company: "GrowthLabs",
    content: "The AI-powered optimization is incredible. Our ROI improved by 250% in just the first month. This tool is a game-changer for digital marketing.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Agency Owner",
    company: "Creative Minds Agency",
    content: `Managing multiple client campaigns has never been easier. ${BRAND_IDENTITY.name} helps us deliver exceptional results while scaling our operations efficiently.`,
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Loved by Marketers Worldwide
          </h2>
          <p className="text-xl text-muted-foreground">
            See what our customers have to say about {BRAND_IDENTITY.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-white/20 bg-white/5 backdrop-blur-xl hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] transition-all">
              <CardContent className="pt-6">
                {/* Rating Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Testimonial Content */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author Info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm flex items-center justify-center border border-white/10">
                    <span className="text-lg font-semibold text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
