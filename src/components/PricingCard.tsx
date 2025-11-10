import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

const PricingCard = ({ name, price, features, ctaText, popular }: PricingCardProps) => {
  return (
    <Card className={`group hover:-translate-y-1 transition-all duration-300 bg-card/70 backdrop-blur-xl border-white/12 text-center ${
      popular ? 'ring-2 ring-cyan/50' : ''
    }`}>
      <CardContent className="pt-8 pb-6 px-6">
        {popular && (
          <div className="mb-4 -mt-4">
            <span className="inline-block px-3 py-1 bg-gradient-to-r from-teal to-cyan text-foreground text-xs font-semibold rounded-full">
              Most Popular
            </span>
          </div>
        )}
        <h3 className="text-2xl font-semibold text-pink mb-2">{name}</h3>
        <div className="text-5xl font-bold text-cyan my-4">
          {price}
          {price !== "Custom" && <span className="text-lg text-foreground/60">/mo</span>}
        </div>
        
        <ul className="space-y-3 mb-6 mt-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-foreground/70 text-sm">
              <Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          className="w-full bg-gradient-to-r from-teal to-cyan hover:opacity-90 text-background font-semibold"
          size="lg"
        >
          {ctaText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PricingCard;
