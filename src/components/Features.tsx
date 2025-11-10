import { Zap, Target, BarChart3, Sparkles, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Zap,
    title: "Lightning-Fast Generation",
    description: "Create professional ad creatives in seconds with our advanced AI algorithms. No waiting, no complex tools.",
  },
  {
    icon: Target,
    title: "Precision Targeting",
    description: "AI-powered audience insights help you reach the right people at the right time with laser-focused precision.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track, measure, and optimize campaigns with real-time analytics and actionable insights.",
  },
  {
    icon: Sparkles,
    title: "Smart Optimization",
    description: "Our AI continuously learns and improves your campaigns for maximum ROI and conversion rates.",
  },
  {
    icon: Globe,
    title: "Multi-Platform Support",
    description: "Deploy ads across Google, Facebook, Instagram, LinkedIn, and more from a single dashboard.",
  },
  {
    icon: Shield,
    title: "Brand Safety",
    description: "Maintain brand consistency with AI-powered content moderation and compliance checking.",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Powerful Features for Modern Marketers
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to create, manage, and optimize winning advertising campaigns
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] transition-all duration-300 hover:-translate-y-1 border-white/20 bg-white/5 backdrop-blur-xl"
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors border border-white/10">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
