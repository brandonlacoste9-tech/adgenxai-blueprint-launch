import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";

const Index = () => {
  return (
    <main className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/40 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <span className="text-xl font-bold">AdGenXAI</span>
          <div className="flex items-center gap-4">
            <a 
              href="/hivemind" 
              className="text-sm font-semibold text-foreground/80 hover:text-foreground transition-colors"
            >
              HiveMind AI →
            </a>
          </div>
        </div>
      </nav>
      
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
      <Chatbot />
    </main>
  );
};

export default Index;
