import HiveMindHeader from "@/components/HiveMindHeader";
import AuroraBackground from "@/components/AuroraBackground";
import BeeCard from "@/components/BeeCard";
import PricingCard from "@/components/PricingCard";
import { Button } from "@/components/ui/button";
import { BRAND_IDENTITY } from "@/lib/constants";
import { FileText, Globe, FlaskConical, Scale, DollarSign, Share2 } from "lucide-react";

const bees = [
  {
    title: "AdCopy Bee",
    description: "Generates multilingual, platform‑perfect ads in seconds. Tailor your message for TikTok, Instagram, LinkedIn and more.",
    icon: FileText,
  },
  {
    title: "Landing Bee",
    description: "Builds stunning landing pages from a brief. Fully responsive, optimized for conversions, and ready to deploy.",
    icon: Globe,
  },
  {
    title: "Experiment Bee",
    description: "Spins up hundreds of micro‑sites, routes traffic dynamically, and kills under‑performers. Data‑driven evolution.",
    icon: FlaskConical,
  },
  {
    title: "Legal Bee",
    description: "Summarizes contracts and prospectuses, highlighting key obligations, risks, and opt‑outs. For internal use or premium subscribers.",
    icon: Scale,
  },
  {
    title: "Finance Bee",
    description: "Ingests Stripe and revenue data, calculates MRR/ARPU/LTV, and alerts you to churn and anomalies.",
    icon: DollarSign,
  },
  {
    title: "Social Bee",
    description: "Listens for brand mentions, drafts compliant replies, and schedules posts across social networks.",
    icon: Share2,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    features: [
      "10,000 credits/month",
      "AdCopy, Landing & Experiment Bees",
      "GDPR/CASL compliance built‑in",
    ],
    ctaText: "Subscribe",
  },
  {
    name: "Pro",
    price: "$99",
    features: [
      "100,000 credits/month",
      "Access all Bees (including Legal & Finance)",
      "Dedicated Slack/Discord alerts",
    ],
    ctaText: "Upgrade",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Private cloud or on‑prem deployment",
      "SLA & volume discounts",
      "Custom Bee development",
    ],
    ctaText: "Contact Sales",
  },
];

const HiveMind = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_center,_#001a33_0%,_#000a18_80%)]">
      <AuroraBackground />
      <HiveMindHeader />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-32 px-4 text-center">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#67e5a1] via-[#8beeff] to-[#ffcaff] bg-clip-text text-transparent">
              {BRAND_IDENTITY.name} HiveMind AI
            </h1>
            <p className="text-xl text-foreground/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              Deploy an army of specialized AI Bees to build, analyze, and grow your business. 
              Full‑stack automation for marketing, operations, finance and more — powered by the hive.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-cyan to-teal hover:opacity-90 text-background font-semibold text-lg px-8 py-6"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get Started
            </Button>
          </div>
        </section>

        {/* Bees Section */}
        <section id="bees" className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12 text-cyan">
              Meet the Bees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bees.map((bee, index) => (
                <BeeCard
                  key={index}
                  title={bee.title}
                  description={bee.description}
                  icon={bee.icon}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 px-4 bg-background/20 backdrop-blur-sm">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12 text-teal">
              Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  name={plan.name}
                  price={plan.price}
                  features={plan.features}
                  ctaText={plan.ctaText}
                  popular={plan.popular}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="text-center py-8 px-4 text-foreground/60 text-sm bg-background/50 backdrop-blur-xl border-t border-white/10">
        <p className="mb-2">
          © {new Date().getFullYear()} {BRAND_IDENTITY.name}. All rights reserved. Made with {BRAND_IDENTITY.emoji} by the hive.
        </p>
        <p>
          Contact: <a href={BRAND_IDENTITY.contactHref} className="text-cyan hover:text-teal transition-colors">{BRAND_IDENTITY.contactEmail}</a>
        </p>
      </footer>
    </div>
  );
};

export default HiveMind;
