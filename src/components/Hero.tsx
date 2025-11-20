import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { BRAND_IDENTITY } from "@/lib/constants";

type HeroProps = {
  activeSegment: "marketers" | "engineers" | "enterprise";
  onSegmentChange: (value: "marketers" | "engineers" | "enterprise") => void;
  segmentCopy: { title: string; body: string };
  onRequestDemo: () => void;
  onStartFree: () => void;
  onViewArchitecture: () => void;
};

const Hero = ({
  activeSegment,
  onSegmentChange,
  segmentCopy,
  onRequestDemo,
  onStartFree,
  onViewArchitecture,
}: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#000a18] via-[#001a33] to-[#000f26]">
      {/* Hexagonal honeycomb background */}
      <div className="absolute inset-0 hexagon-bg opacity-50"></div>
      
      {/* Animated glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-10 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-10 w-[500px] h-[500px] bg-amber/15 rounded-full blur-[130px] animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[180px]"></div>
      </div>

      {/* Floating bees */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] text-4xl bee-float opacity-60">🐝</div>
        <div className="absolute top-[60%] left-[20%] text-3xl bee-float opacity-40" style={{ animationDelay: "2s" }}>🐝</div>
        <div className="absolute top-[30%] right-[15%] text-2xl bee-float opacity-50" style={{ animationDelay: "4s" }}>🐝</div>
        <div className="absolute bottom-[20%] right-[25%] text-4xl bee-float opacity-30" style={{ animationDelay: "6s" }}>🐝</div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tab-style selector */}
          <div className="inline-flex items-center gap-3 mb-12">
            <button
              className={`px-6 py-2.5 text-sm font-medium transition-colors rounded-full ${
                activeSegment === "marketers"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSegmentChange("marketers")}
            >
              For Marketers
            </button>
            <button
              className={`px-6 py-2.5 text-sm font-medium transition-colors rounded-full ${
                activeSegment === "engineers"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSegmentChange("engineers")}
            >
              For Engineers
            </button>
            <button
              className={`px-6 py-2.5 text-sm font-medium transition-colors rounded-full ${
                activeSegment === "enterprise"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => onSegmentChange("enterprise")}
            >
              Enterprise-Grade AI
            </button>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full glass-card shadow-lg shadow-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Enterprise-Grade AI Infrastructure</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="text-foreground">{BRAND_IDENTITY.tagline.primary}</span>
            <br />
            <span className="text-primary">{BRAND_IDENTITY.tagline.secondary}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto leading-relaxed">
            Production-ready AI agent swarm with Grafana integration, A/B testing engine, and real-time SLOs. 
            Built for teams who need complete visibility and distributed intelligence.
          </p>

          <div className="max-w-2xl mx-auto mb-10 text-foreground/80">
            <p className="text-lg font-semibold mb-2">{segmentCopy.title}</p>
            <p className="text-base">{segmentCopy.body}</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="text-base px-8 py-6 bg-gradient-to-r from-primary to-amber hover:from-primary-dark hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-primary/40 hover:shadow-primary/60 group rounded-xl"
              onClick={onRequestDemo}
            >
              Request Demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 py-6 glass-card hover:glass-strong transition-all duration-300 transform hover:scale-105 rounded-xl border-none"
              onClick={onStartFree}
            >
              Start Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 py-6 glass-card hover:glass-strong transition-all duration-300 transform hover:scale-105 rounded-xl border-none"
              onClick={onViewArchitecture}
            >
              🛰 View Architecture
            </Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="p-6 rounded-xl glass-card hover:glass-strong transition-all group">
              <div className="text-3xl sm:text-4xl font-bold mb-1">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-110 transition-transform inline-block">P95</span> <span className="text-foreground group-hover:scale-110 transition-transform inline-block">&lt;400ms</span>
              </div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div className="p-6 rounded-xl glass-card hover:glass-strong transition-all group">
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 group-hover:scale-110 transition-transform">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLO</div>
            </div>
            <div className="p-6 rounded-xl glass-card hover:glass-strong transition-all group">
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1 group-hover:scale-110 transition-transform">&lt;1%</div>
              <div className="text-sm text-muted-foreground">Error Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
