import { Globe, Mail, Phone, MapPin } from "lucide-react";
import type { LandingPageData } from "@/lib/landingPageGenerators";

interface FooterSectionProps {
  landingPageData: LandingPageData;
  language?: "en" | "fr";
}

export const FooterSection = ({ landingPageData, language = "en" }: FooterSectionProps) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-12 border-t border-white/10 bg-background/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-teal">
              {landingPageData.businessName}
            </h3>
            <p className="text-foreground/70 text-sm">
              {landingPageData.businessDescription.substring(0, 150)}...
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">
              {language === "fr" ? "Liens rapides" : "Quick Links"}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-foreground/70 hover:text-teal transition-colors">
                  {language === "fr" ? "À propos" : "About"}
                </a>
              </li>
              <li>
                <a href="#services" className="text-foreground/70 hover:text-teal transition-colors">
                  {language === "fr" ? "Services" : "Services"}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-foreground/70 hover:text-teal transition-colors">
                  {language === "fr" ? "Contact" : "Contact"}
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">
              {language === "fr" ? "Contact" : "Contact"}
            </h4>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@{landingPageData.businessName.toLowerCase().replace(/\s+/g, "")}.ca</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 text-center">
          <p className="text-foreground/60 text-sm">
            © {currentYear} {landingPageData.businessName}. {language === "fr" ? "Tous droits réservés." : "All rights reserved."}
          </p>
          <p className="text-foreground/50 text-xs mt-2">
            {language === "fr" ? "Fait avec ❤️ au Canada" : "Made with ❤️ in Canada"}
          </p>
        </div>
      </div>
    </footer>
  );
};
