import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Tablet, Monitor, Languages } from "lucide-react";
import type { LandingPageData } from "@/lib/landingPageGenerators";
import type { LandingPageTemplate } from "@/lib/landingPageTemplates";
import { HeroSection } from "./landing-page-sections/HeroSection";
import { FeaturesSection } from "./landing-page-sections/FeaturesSection";
import { PricingSection } from "./landing-page-sections/PricingSection";
import { TestimonialsSection } from "./landing-page-sections/TestimonialsSection";
import { CTASection } from "./landing-page-sections/CTASection";
import { FooterSection } from "./landing-page-sections/FooterSection";

interface LandingPagePreviewProps {
  landingPageData: LandingPageData;
  template: LandingPageTemplate;
  previewMode?: "desktop" | "tablet" | "mobile";
  previewLanguage?: "en" | "fr";
  onPreviewModeChange?: (mode: "desktop" | "tablet" | "mobile") => void;
  onLanguageChange?: (lang: "en" | "fr") => void;
}

export const LandingPagePreview = ({
  landingPageData,
  template,
  previewMode = "desktop",
  previewLanguage = "en",
  onPreviewModeChange,
  onLanguageChange,
}: LandingPagePreviewProps) => {
  const [currentMode, setCurrentMode] = useState(previewMode);
  const [currentLang, setCurrentLang] = useState(previewLanguage);

  const handleModeChange = (mode: "desktop" | "tablet" | "mobile") => {
    setCurrentMode(mode);
    onPreviewModeChange?.(mode);
  };

  const handleLanguageChange = (lang: "en" | "fr") => {
    setCurrentLang(lang);
    onLanguageChange?.(lang);
  };

  const getPreviewWidth = () => {
    switch (currentMode) {
      case "mobile":
        return "max-w-sm";
      case "tablet":
        return "max-w-2xl";
      default:
        return "w-full";
    }
  };

  const renderSection = (sectionId: string, sectionType: string) => {
    const sectionData = landingPageData.sections[sectionId];
    if (!sectionData) return null;

    const content = currentLang === "fr" && sectionData.fr
      ? sectionData.fr
      : sectionData.en;

    switch (sectionType) {
      case "hero":
        return <HeroSection key={sectionId} content={content} language={currentLang} />;
      case "features":
        return <FeaturesSection key={sectionId} content={content} language={currentLang} />;
      case "pricing":
        return <PricingSection key={sectionId} content={content} language={currentLang} />;
      case "testimonials":
        return <TestimonialsSection key={sectionId} content={content} language={currentLang} />;
      case "cta":
        return <CTASection key={sectionId} content={content} language={currentLang} />;
      case "footer":
        return <FooterSection key={sectionId} landingPageData={landingPageData} language={currentLang} />;
      default:
        return (
          <section key={sectionId} className="py-16 px-4">
            <div className="container mx-auto">
              <h2 className="text-2xl font-bold mb-4">{content.title || sectionType}</h2>
              {content.subtitle && <p className="text-lg text-foreground/70 mb-4">{content.subtitle}</p>}
              {content.content && <p className="text-foreground/80 whitespace-pre-wrap">{content.content}</p>}
              {content.cta && (
                <Button className="mt-4">{content.cta}</Button>
              )}
            </div>
          </section>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview Controls */}
      <div className="flex items-center justify-between glass-card p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            variant={currentMode === "desktop" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("desktop")}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={currentMode === "tablet" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("tablet")}
          >
            <Tablet className="h-4 w-4 mr-2" />
            Tablet
          </Button>
          <Button
            variant={currentMode === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => handleModeChange("mobile")}
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile
          </Button>
        </div>
        {landingPageData.language === "bilingual" && (
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4" />
            <Button
              variant={currentLang === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange("en")}
            >
              EN
            </Button>
            <Button
              variant={currentLang === "fr" ? "default" : "outline"}
              size="sm"
              onClick={() => handleLanguageChange("fr")}
            >
              FR
            </Button>
          </div>
        )}
      </div>

      {/* Preview Container */}
      <Card className={`glass-card p-6 overflow-auto ${getPreviewWidth()} mx-auto`}>
        <div className="bg-background/50 rounded-lg border border-white/10 p-8 min-h-[600px]">
          <div className="space-y-0">
            {template.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => renderSection(section.id, section.type))}
          </div>
        </div>
      </Card>
    </div>
  );
};
