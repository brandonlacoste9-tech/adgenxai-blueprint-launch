export interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  sections: string[];
  tags: string[];
}

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  {
    id: "saas-startup",
    name: "SaaS Startup",
    description: "Modern SaaS landing page with hero, features, pricing, and testimonials",
    category: "SaaS",
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
    sections: ["hero", "features", "pricing", "testimonials", "cta", "footer"],
    tags: ["bilingual", "modern", "conversion-focused"]
  },
  {
    id: "local-business",
    name: "Local Business",
    description: "Perfect for Quebec local businesses with bilingual support and local payment options",
    category: "Local",
    preview: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400",
    sections: ["hero", "services", "about", "contact", "footer"],
    tags: ["bilingual", "quebec", "local"]
  },
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Product showcase with Canadian pricing (GST/HST) and Interac payment support",
    category: "E-Commerce",
    preview: "https://images.unsplash.com/photo-1557821552-17105176677c?w=400",
    sections: ["hero", "products", "features", "testimonials", "cta", "footer"],
    tags: ["bilingual", "ecommerce", "canadian-pricing"]
  },
  {
    id: "professional-services",
    name: "Professional Services",
    description: "Elegant design for consultants, lawyers, and professional services",
    category: "Professional",
    preview: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400",
    sections: ["hero", "services", "expertise", "testimonials", "contact", "footer"],
    tags: ["bilingual", "professional", "trust-focused"]
  },
  {
    id: "event-landing",
    name: "Event Landing",
    description: "High-converting event registration page with countdown and ticketing",
    category: "Events",
    preview: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
    sections: ["hero", "agenda", "speakers", "pricing", "registration", "footer"],
    tags: ["bilingual", "event", "registration"]
  }
];

export interface LandingPageSection {
  type: string;
  content: {
    [key: string]: any;
  };
}

export interface GeneratedLandingPage {
  id: string;
  templateId: string;
  businessName: string;
  language: "en" | "fr" | "bilingual";
  sections: LandingPageSection[];
  createdAt: string;
  metadata: {
    industry?: string;
    targetAudience?: string;
    primaryCTA?: string;
  };
}
