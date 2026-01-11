import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { SectionType, LandingPageTemplate } from "./landingPageTemplates";

export interface SectionContent {
  en: {
    title: string;
    subtitle?: string;
    content: string;
    cta?: string;
    features?: Array<{ title: string; description: string }>;
    items?: Array<Record<string, any>>;
  };
  fr?: {
    title: string;
    subtitle?: string;
    content: string;
    cta?: string;
    features?: Array<{ title: string; description: string }>;
    items?: Array<Record<string, any>>;
  };
}

export interface LandingPageData {
  id: string;
  businessName: string;
  businessDescription: string;
  language: "en" | "fr" | "bilingual";
  templateId: string;
  sections: Record<string, SectionContent>;
  colorScheme: string;
  canadianFeatures: string[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    userId: string;
  };
}

/**
 * Generate section content using AI
 */
export const generateSectionContent = async (
  sectionType: SectionType,
  businessContext: string,
  language: "en" | "fr",
  businessName?: string,
  style?: string,
  tone?: string,
  templateId?: string
): Promise<SectionContent> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Authentication required");
  }

  const { data, error } = await supabase.functions.invoke("generate-landing-section", {
    body: {
      sectionType,
      businessContext,
      language,
      businessName,
      style,
      tone,
      templateId,
    },
  });

  if (error) {
    throw error;
  }

  if (data.error) {
    throw new Error(data.error);
  }

  // Parse the content based on section type
  const rawContent = data.content;
  
  // If content is already structured, use it
  if (typeof rawContent === "object" && rawContent !== null) {
    // Handle different section types
    if (sectionType === "hero") {
      return {
        en: {
          title: rawContent.headline || rawContent.title || "",
          subtitle: rawContent.subheadline || rawContent.subtitle || "",
          content: rawContent.description || "",
          cta: rawContent.cta || rawContent.buttonText || "",
        },
        ...(language === "fr" || language === "bilingual" ? {
          fr: {
            title: rawContent.headlineFr || rawContent.titleFr || "",
            subtitle: rawContent.subheadlineFr || rawContent.subtitleFr || "",
            content: rawContent.descriptionFr || "",
            cta: rawContent.ctaFr || rawContent.buttonTextFr || "",
          },
        } : {}),
      };
    }

    if (sectionType === "features" && Array.isArray(rawContent)) {
      return {
        en: {
          title: "Features",
          content: "",
          features: rawContent.map((item: any) => ({
            title: item.title || item.name || "",
            description: item.description || item.desc || "",
          })),
        },
        ...(language === "fr" || language === "bilingual" ? {
          fr: {
            title: "Caractéristiques",
            content: "",
            features: rawContent.map((item: any) => ({
              title: item.titleFr || item.titre || item.title || "",
              description: item.descriptionFr || item.descFr || item.description || "",
            })),
          },
        } : {}),
      };
    }

    if (sectionType === "pricing" && Array.isArray(rawContent)) {
      return {
        en: {
          title: "Pricing",
          content: "",
          items: rawContent,
        },
        ...(language === "fr" || language === "bilingual" ? {
          fr: {
            title: "Tarification",
            content: "",
            items: rawContent,
          },
        } : {}),
      };
    }

    if (sectionType === "testimonials" && Array.isArray(rawContent)) {
      return {
        en: {
          title: "Testimonials",
          content: "",
          items: rawContent,
        },
        ...(language === "fr" || language === "bilingual" ? {
          fr: {
            title: "Témoignages",
            content: "",
            items: rawContent,
          },
        } : {}),
      };
    }

    // Default: treat as structured content
    return {
      en: {
        title: rawContent.title || rawContent.headline || "",
        subtitle: rawContent.subtitle || rawContent.subheadline || "",
        content: rawContent.content || rawContent.description || JSON.stringify(rawContent),
        cta: rawContent.cta || "",
      },
      ...(language === "fr" || language === "bilingual" ? {
        fr: {
          title: rawContent.titleFr || rawContent.titre || "",
          subtitle: rawContent.subtitleFr || rawContent.sousTitre || "",
          content: rawContent.contentFr || rawContent.descriptionFr || "",
          cta: rawContent.ctaFr || "",
        },
      } : {}),
    };
  }

  // If content is a string, parse it or use as-is
  if (typeof rawContent === "string") {
    try {
      const parsed = JSON.parse(rawContent);
      return generateSectionContent(sectionType, businessContext, language, businessName, style, tone, templateId);
    } catch {
      // Not JSON, use as plain text
      return {
        en: {
          title: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
          content: rawContent,
        },
        ...(language === "fr" || language === "bilingual" ? {
          fr: {
            title: sectionType === "hero" ? "Héro" : 
                  sectionType === "features" ? "Caractéristiques" :
                  sectionType === "pricing" ? "Tarification" :
                  sectionType === "testimonials" ? "Témoignages" :
                  sectionType === "cta" ? "Appel à l'action" : "Section",
            content: rawContent,
          },
        } : {}),
      };
    }
  }

  // Fallback
  return {
    en: {
      title: sectionType,
      content: "Content generation in progress...",
    },
  };
};

/**
 * Generate complete landing page
 */
export const generateLandingPage = async (
  templateId: string,
  businessName: string,
  businessDescription: string,
  language: "en" | "fr" | "bilingual",
  template: LandingPageTemplate,
  style?: string,
  tone?: string,
  customizations?: Record<string, any>,
  onProgress?: (current: number, total: number) => void
): Promise<LandingPageData> => {
  const sections: Record<string, SectionContent> = {};
  const businessContext = `${businessDescription}\n\nBusiness Type: ${template.category}\nTemplate: ${template.name.en}`;
  
  const requiredSections = template.sections.filter(s => s.required || customizations?.sections?.includes(s.id));
  const totalSections = requiredSections.length;
  let currentSection = 0;

  // Generate all required sections
  for (const section of template.sections.sort((a, b) => a.order - b.order)) {
    if (section.required || customizations?.sections?.includes(section.id)) {
      try {
        currentSection++;
        onProgress?.(currentSection, totalSections);
        
        const sectionContent = await generateSectionContent(
          section.type,
          businessContext,
          language === "bilingual" ? "en" : language,
          businessName,
          style,
          tone,
          templateId
        );

        // If bilingual, generate French version too
        if (language === "bilingual" && sectionContent.en && !sectionContent.fr) {
          const frContent = await generateSectionContent(
            section.type,
            businessContext,
            "fr",
            businessName,
            style,
            tone,
            templateId
          );
          sectionContent.fr = frContent.en || frContent.fr;
        }

        sections[section.id] = sectionContent;
      } catch (error) {
        console.error(`Error generating section ${section.id}:`, error);
        // Continue with other sections even if one fails
        sections[section.id] = {
          en: {
            title: section.type,
            content: `Error generating content for ${section.type} section. Please try again.`,
          },
        };
      }
    }
  }

  const { data: { user } } = await supabase.auth.getUser();

  return {
    id: `lp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    businessName,
    businessDescription,
    language,
    templateId,
    sections,
    colorScheme: template.colorScheme,
    canadianFeatures: template.canadianFeatures,
    metadata: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: user?.id || "",
    },
  };
};

/**
 * Generate a single section (for incremental generation)
 */
export const generateSingleSection = async (
  sectionId: string,
  sectionType: SectionType,
  businessContext: string,
  language: "en" | "fr" | "bilingual",
  businessName?: string,
  style?: string,
  tone?: string
): Promise<SectionContent> => {
  const targetLang = language === "bilingual" ? "en" : language;
  const content = await generateSectionContent(
    sectionType,
    businessContext,
    targetLang,
    businessName,
    style,
    tone
  );

  // If bilingual, generate French version
  if (language === "bilingual" && !content.fr) {
    const frContent = await generateSectionContent(
      sectionType,
      businessContext,
      "fr",
      businessName,
      style,
      tone
    );
    content.fr = frContent.en || frContent.fr;
  }

  return content;
};
