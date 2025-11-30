import { useMemo, useState } from "react";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Stats from "@/components/Stats";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import Chatbot from "@/components/Chatbot";
import { BRAND_IDENTITY } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Segment = "marketers" | "engineers" | "enterprise";

type InterestType = "demo" | "start";

const Index = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [segment, setSegment] = useState<Segment>("engineers");
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestType, setInterestType] = useState<InterestType>("demo");
  const [architectureOpen, setArchitectureOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const segmentCopy = useMemo(
    () => ({
      marketers: {
        title: "Campaign velocity, always-on experimentation",
        body: "Spin up multi-channel creatives with swarm agents, ship variants in minutes, measure lift with built-in A/B and SLO dashboards.",
      },
      engineers: {
        title: "Observability-first autonomous agents",
        body: "Streaming logs, Grafana-native dashboards, P95 under 400ms, and a pluggable Supabase edge. Designed for people who ship production systems.",
      },
      enterprise: {
        title: "Governed AI at scale",
        body: "Role-based access, audit trails, rate limiting, and compliance-ready observability. Swarms you can explain to your CISO.",
      },
    }),
    []
  );

  const openInterest = (type: InterestType) => {
    setInterestType(type);
    setInterestOpen(true);
    setEmailError("");
  };

  const scrollToSection = (id: string) => {
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      toast({
        title: "Coming soon",
        description: "This section is being polished.",
      });
    }
  };

  const saveEmail = () => {
    const trimmed = email.trim();
    const valid = /\S+@\S+\.\S+/.test(trimmed);
    if (!valid) {
      setEmailError("Enter a valid email");
      return;
    }
    try {
      const key = "adgenxai_interest";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [
        ...existing,
        { email: trimmed, type: interestType, ts: new Date().toISOString() },
      ];
      localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.warn("Unable to store email locally", err);
    }
    setEmail("");
    setInterestOpen(false);
    setEmailError("");
    toast({
      title: "Thanks!",
      description: "We'll be in touch soon.",
    });
  };

  return (
    <main className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{BRAND_IDENTITY.emoji}</span>
            <span className="text-xl font-bold">{BRAND_IDENTITY.name}</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => scrollToSection("pricing")}
            >
              Pricing
            </button>
            <button
              className="text-sm text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => scrollToSection("compare")}
            >
              Compare
            </button>
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={signOut}>Sign Out</Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            <button
              onClick={() => openInterest("start")}
              className="text-sm font-semibold px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-primary-foreground transition-colors"
            >
              Start Free
            </button>
          </div>
        </div>
      </nav>

      <Hero
        activeSegment={segment}
        onSegmentChange={setSegment}
        segmentCopy={segmentCopy[segment]}
        onRequestDemo={() => openInterest("demo")}
        onStartFree={() => openInterest("start")}
        onViewArchitecture={() => setArchitectureOpen(true)}
      />

      <section id="features">
        <Features />
      </section>
      <section id="how-it-works">
        <HowItWorks />
      </section>
      <section id="stats">
        <Stats />
      </section>
      <section id="pricing">
        <Pricing />
      </section>
      <section id="compare">
        <Testimonials />
      </section>
      <CTA onStartFree={() => openInterest("start")} onScheduleDemo={() => openInterest("demo")} />
      <Footer />
      <Chatbot />

      <Dialog open={interestOpen} onOpenChange={setInterestOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>
              {interestType === "demo" ? "Request a Demo" : "Start Free"}
            </DialogTitle>
            <DialogDescription>
              Share your email and we&apos;ll get you access. Storage is local-only for now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
            />
            {emailError && <p className="text-sm text-amber-300">{emailError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setInterestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEmail}>
              {interestType === "demo" ? "Request Demo" : "Start Free"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={architectureOpen} onOpenChange={setArchitectureOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Architecture Overview</DialogTitle>
            <DialogDescription>
              Colony-inspired swarm: edge workers, orchestrators, observability, and intent routers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-foreground/80">
            <p>Swarm Agents → Intent Router → A/B Engine → Observability (Grafana) → Supabase Edge.</p>
            <Separator className="bg-white/10" />
            <p>
              Built for <span className="text-primary">P95 &lt; 400ms</span>, real-time logs, and safe rollout
              controls. Full diagram coming soon.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setArchitectureOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Index;
