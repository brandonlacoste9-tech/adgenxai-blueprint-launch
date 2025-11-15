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
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#000a18]/90 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐝</span>
            <span className="text-xl font-bold">Kolony</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Compare</a>
            <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Sign In</a>
            <a 
              href="/creator" 
              className="text-sm font-semibold px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-primary-foreground transition-colors"
            >
              Start Free
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
