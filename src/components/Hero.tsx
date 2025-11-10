import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">AI-Powered Advertising Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
            Generate High-Converting Ads in{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Seconds
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Transform your advertising with AI. Create, optimize, and scale campaigns that drive real results—no design skills required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-primary hover:bg-primary-dark transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2 hover:bg-secondary transition-all duration-300"
            >
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-6">Trusted by leading brands worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold text-foreground">BRAND</div>
              <div className="text-2xl font-bold text-foreground">COMPANY</div>
              <div className="text-2xl font-bold text-foreground">AGENCY</div>
              <div className="text-2xl font-bold text-foreground">STARTUP</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
