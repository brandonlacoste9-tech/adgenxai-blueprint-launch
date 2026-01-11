export type LandingPageCategory = 
  | "saas" 
  | "ecommerce" 
  | "portfolio" 
  | "canadian-business" 
  | "non-profit"
  | "restaurant"
  | "real-estate"
  | "government";

export type SectionType = 
  | "hero" 
  | "features" 
  | "pricing" 
  | "testimonials" 
  | "cta" 
  | "footer" 
  | "about" 
  | "contact" 
  | "products" 
  | "services"
  | "location-map"
  | "shipping-info"
  | "accessibility";

export interface LandingPageSection {
  id: string;
  type: SectionType;
  required: boolean;
  order: number;
  configurable: boolean;
}

export interface LandingPageTemplate {
  id: string;
  name: { en: string; fr: string };
  category: LandingPageCategory;
  description: { en: string; fr: string };
  sections: LandingPageSection[];
  bilingual: boolean;
  primaryLanguage?: "en" | "fr";
  colorScheme: "canadian" | "quebec" | "modern" | "classic" | "bold";
  preview: string;
  canadianFeatures: string[];
  icon: string;
}

export const landingPageTemplates: LandingPageTemplate[] = [
  {
    id: "montreal-startup",
    name: {
      en: "Montreal Startup",
      fr: "Startup Montréal",
    },
    category: "saas",
    description: {
      en: "Clean, bilingual SaaS landing page perfect for tech startups in Montreal",
      fr: "Page d'atterrissage SaaS bilingue et épurée, parfaite pour les startups technologiques à Montréal",
    },
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, configurable: true },
      { id: "features", type: "features", required: true, order: 2, configurable: true },
      { id: "pricing", type: "pricing", required: false, order: 3, configurable: true },
      { id: "testimonials", type: "testimonials", required: false, order: 4, configurable: true },
      { id: "cta", type: "cta", required: true, order: 5, configurable: true },
      { id: "footer", type: "footer", required: true, order: 6, configurable: false },
    ],
    bilingual: true,
    primaryLanguage: "en",
    colorScheme: "modern",
    preview: "Modern SaaS design with bilingual toggle, feature cards, and pricing tiers",
    canadianFeatures: ["bilingual-toggle", "canadian-pricing", "gst-display"],
    icon: "🚀",
  },
  {
    id: "quebec-local-business",
    name: {
      en: "Quebec Local Business",
      fr: "Entreprise Locale Québécoise",
    },
    category: "canadian-business",
    description: {
      en: "French-first business landing page with Quebec-specific features and legal compliance",
      fr: "Page d'atterrissage d'entreprise axée sur le français avec des fonctionnalités spécifiques au Québec et conformité légale",
    },
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, configurable: true },
      { id: "services", type: "services", required: true, order: 2, configurable: true },
      { id: "about", type: "about", required: false, order: 3, configurable: true },
      { id: "location-map", type: "location-map", required: true, order: 4, configurable: true },
      { id: "contact", type: "contact", required: true, order: 5, configurable: true },
      { id: "footer", type: "footer", required: true, order: 6, configurable: false },
    ],
    bilingual: true,
    primaryLanguage: "fr",
    colorScheme: "quebec",
    preview: "French-first design with Quebec blue accents, service listings, and location map",
    canadianFeatures: ["quebec-legal", "french-first", "local-map", "bilingual-contact"],
    icon: "🏢",
  },
  {
    id: "toronto-ecommerce",
    name: {
      en: "Toronto E-commerce",
      fr: "Commerce Électronique Toronto",
    },
    category: "ecommerce",
    description: {
      en: "Product showcase with Canadian shipping options and payment methods (Interac, credit cards)",
      fr: "Vitrine de produits avec options d'expédition canadiennes et méthodes de paiement (Interac, cartes de crédit)",
    },
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, configurable: true },
      { id: "products", type: "products", required: true, order: 2, configurable: true },
      { id: "shipping-info", type: "shipping-info", required: true, order: 3, configurable: true },
      { id: "testimonials", type: "testimonials", required: false, order: 4, configurable: true },
      { id: "cta", type: "cta", required: true, order: 5, configurable: true },
      { id: "footer", type: "footer", required: true, order: 6, configurable: false },
    ],
    bilingual: true,
    colorScheme: "canadian",
    preview: "E-commerce layout with product grid, Canadian shipping calculator, and Interac payment options",
    canadianFeatures: ["canadian-shipping", "interac-payment", "gst-pricing", "bilingual-checkout"],
    icon: "🛒",
  },
  {
    id: "ottawa-government",
    name: {
      en: "Ottawa Government Services",
      fr: "Services Gouvernementaux Ottawa",
    },
    category: "government",
    description: {
      en: "Accessible bilingual government services page with WCAG AA compliance and official branding",
      fr: "Page de services gouvernementaux bilingue et accessible avec conformité WCAG AA et image de marque officielle",
    },
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, configurable: true },
      { id: "services", type: "services", required: true, order: 2, configurable: true },
      { id: "accessibility", type: "accessibility", required: true, order: 3, configurable: false },
      { id: "contact", type: "contact", required: true, order: 4, configurable: true },
      { id: "footer", type: "footer", required: true, order: 5, configurable: false },
    ],
    bilingual: true,
    colorScheme: "classic",
    preview: "Official government design with accessibility features, service listings, and bilingual navigation",
    canadianFeatures: ["wcag-aa", "bilingual-required", "official-branding", "accessibility-statement"],
    icon: "🏛️",
  },
  {
    id: "vancouver-restaurant",
    name: {
      en: "Vancouver Restaurant",
      fr: "Restaurant Vancouver",
    },
    category: "restaurant",
    description: {
      en: "Bilingual restaurant page with menu display, location map, and reservation system",
      fr: "Page de restaurant bilingue avec affichage du menu, carte de localisation et système de réservation",
    },
    sections: [
      { id: "hero", type: "hero", required: true, order: 1, configurable: true },
      { id: "about", type: "about", required: false, order: 2, configurable: true },
      { id: "products", type: "products", required: true, order: 3, configurable: true },
      { id: "location-map", type: "location-map", required: true, order: 4, configurable: true },
      { id: "contact", type: "contact", required: true, order: 5, configurable: true },
      { id: "footer", type: "footer", required: true, order: 6, configurable: false },
    ],
    bilingual: true,
    colorScheme: "bold",
    preview: "Restaurant design with menu showcase, location map, and bilingual reservation form",
    canadianFeatures: ["bilingual-menu", "location-map", "reservation-system", "canadian-hours"],
    icon: "🍽️",
  },
];

export const getTemplatesByCategory = (category: LandingPageCategory | "All"): LandingPageTemplate[] => {
  if (category === "All") {
    return landingPageTemplates;
  }
  return landingPageTemplates.filter(template => template.category === category);
};

export const getTemplateById = (id: string): LandingPageTemplate | undefined => {
  return landingPageTemplates.find(template => template.id === id);
};

export const getTemplatesByLanguage = (primaryLanguage: "en" | "fr" | "both"): LandingPageTemplate[] => {
  if (primaryLanguage === "both") {
    return landingPageTemplates;
  }
  return landingPageTemplates.filter(template => 
    template.primaryLanguage === primaryLanguage || 
    (primaryLanguage === "en" && !template.primaryLanguage)
  );
};
