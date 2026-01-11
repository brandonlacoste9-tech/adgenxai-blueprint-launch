import { useState, useEffect } from "react";
import { Menu, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { BRAND_IDENTITY } from "@/lib/constants";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const HiveMindHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/40 border-b border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/hivemind" className="text-xl font-bold text-foreground tracking-wider">
            {BRAND_IDENTITY.name}
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a 
              href="/hivemind#bees" 
              className="text-foreground/80 hover:text-foreground font-semibold transition-colors"
            >
              Bees
            </a>
            <NavLink 
              to="/creator" 
              className="text-foreground/80 hover:text-foreground font-semibold transition-colors"
            >
              Creator Studio
            </NavLink>
            <a 
              href="/hivemind#pricing" 
              className="text-foreground/80 hover:text-foreground font-semibold transition-colors"
            >
              Pricing
            </a>
            <a 
              href="/hivemind#contact" 
              className="text-foreground/80 hover:text-foreground font-semibold transition-colors"
            >
              Contact
            </a>
            {isInstallable && (
              <Button
                variant="ghost"
                className="text-yellow-400 hover:text-white"
                onClick={handleInstall}
                title="Install AdGen XAI Atelier"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="text-[10px] uppercase tracking-widest">Install App</span>
              </Button>
            )}
          </nav>

          {/* Install Button (Mobile) & Menu Button */}
          <div className="flex items-center gap-2">
            {isInstallable && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden text-yellow-400 hover:text-white"
                onClick={handleInstall}
                title="Install AdGen XAI Atelier"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-3">
            <a 
              href="/hivemind#bees" 
              className="block text-foreground/80 hover:text-foreground font-semibold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Bees
            </a>
            <NavLink 
              to="/creator" 
              className="block text-foreground/80 hover:text-foreground font-semibold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Creator Studio
            </NavLink>
            <a 
              href="/hivemind#pricing" 
              className="block text-foreground/80 hover:text-foreground font-semibold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a 
              href="/hivemind#contact" 
              className="block text-foreground/80 hover:text-foreground font-semibold transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </a>
            {isInstallable && (
              <Button
                variant="ghost"
                className="w-full justify-start text-yellow-400 hover:text-white"
                onClick={() => {
                  handleInstall();
                  setMobileMenuOpen(false);
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="text-xs uppercase tracking-widest">Install App</span>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default HiveMindHeader;
