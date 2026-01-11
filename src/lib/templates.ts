export type TemplateCategory = "Holidays" | "Business" | "Marketing" | "Social";

export interface Template {
  id: string;
  name: {
    en: string;
    fr: string;
  };
  category: TemplateCategory;
  description: {
    en: string;
    fr: string;
  };
  prompt: {
    en: string;
    fr: string;
  };
  suggestedStyle: string;
  suggestedTone: string;
  preview: {
    en: string;
    fr: string;
  };
  icon: string;
  dateRange?: {
    start: string; // MM-DD format
    end: string; // MM-DD format
  };
}

export const templates: Template[] = [
  // Holidays
  {
    id: "canada-day",
    name: {
      en: "Canada Day",
      fr: "Fête du Canada",
    },
    category: "Holidays",
    description: {
      en: "Celebrate Canada Day with patriotic content that unites all Canadians",
      fr: "Célébrez la Fête du Canada avec du contenu patriotique qui unit tous les Canadiens",
    },
    prompt: {
      en: "Create engaging Canada Day content celebrating Canadian unity, diversity, and national pride. Include references to Canadian values, culture, and achievements. Make it suitable for social media sharing.",
      fr: "Créez du contenu engageant pour la Fête du Canada célébrant l'unité canadienne, la diversité et la fierté nationale. Incluez des références aux valeurs canadiennes, à la culture et aux réalisations. Rendez-le adapté au partage sur les réseaux sociaux.",
    },
    suggestedStyle: "creative",
    suggestedTone: "enthusiastic",
    preview: {
      en: "🇨🇦 Happy Canada Day! Celebrating our beautiful nation, from coast to coast to coast...",
      fr: "🇨🇦 Joyeuse Fête du Canada! Célébrons notre belle nation, d'un océan à l'autre...",
    },
    icon: "🇨🇦",
    dateRange: {
      start: "06-25",
      end: "07-05",
    },
  },
  {
    id: "quebec-national-day",
    name: {
      en: "Quebec National Day",
      fr: "Fête nationale du Québec",
    },
    category: "Holidays",
    description: {
      en: "Honor Quebec's National Day with content that celebrates Quebec culture and heritage",
      fr: "Honorez la Fête nationale du Québec avec du contenu qui célèbre la culture et le patrimoine québécois",
    },
    prompt: {
      en: "Create content for Quebec National Day (Saint-Jean-Baptiste Day) that celebrates Quebec culture, language, traditions, and identity. Include Quebec French expressions and cultural references. Make it authentic and engaging for Quebec audiences.",
      fr: "Créez du contenu pour la Fête nationale du Québec (Saint-Jean-Baptiste) qui célèbre la culture québécoise, la langue, les traditions et l'identité. Incluez des expressions québécoises et des références culturelles. Rendez-le authentique et engageant pour les audiences québécoises.",
    },
    suggestedStyle: "creative",
    suggestedTone: "enthusiastic",
    preview: {
      en: "🎵 Bonne Fête nationale du Québec! Celebrating our unique culture and vibrant traditions...",
      fr: "🎵 Bonne Fête nationale du Québec! Célébrons notre culture unique et nos traditions vibrantes...",
    },
    icon: "🎵",
    dateRange: {
      start: "06-20",
      end: "06-25",
    },
  },
  {
    id: "canadian-thanksgiving",
    name: {
      en: "Canadian Thanksgiving",
      fr: "Action de grâce",
    },
    category: "Holidays",
    description: {
      en: "Express gratitude with Canadian Thanksgiving content celebrating harvest and togetherness",
      fr: "Exprimez votre gratitude avec du contenu de l'Action de grâce célébrant la récolte et la convivialité",
    },
    prompt: {
      en: "Create Canadian Thanksgiving content that celebrates gratitude, harvest season, family gatherings, and Canadian autumn traditions. Include references to local produce and fall activities. Make it warm and appreciative.",
      fr: "Créez du contenu de l'Action de grâce canadienne qui célèbre la gratitude, la saison des récoltes, les rassemblements familiaux et les traditions automnales canadiennes. Incluez des références aux produits locaux et aux activités d'automne. Rendez-le chaleureux et reconnaissant.",
    },
    suggestedStyle: "casual",
    suggestedTone: "friendly",
    preview: {
      en: "🍂 Happy Canadian Thanksgiving! Grateful for family, friends, and the bountiful harvest...",
      fr: "🍂 Joyeuse Action de grâce! Reconnaissants pour la famille, les amis et la généreuse récolte...",
    },
    icon: "🍂",
    dateRange: {
      start: "10-06",
      end: "10-14",
    },
  },
  {
    id: "hockey-season",
    name: {
      en: "Hockey Season",
      fr: "Saison de hockey",
    },
    category: "Holidays",
    description: {
      en: "Celebrate Canada's favorite sport with content for hockey season and playoffs",
      fr: "Célébrez le sport préféré du Canada avec du contenu pour la saison de hockey et les séries éliminatoires",
    },
    prompt: {
      en: "Create exciting hockey season content celebrating Canada's national winter sport. Include references to NHL, local teams, community hockey, and the passion Canadians have for the game. Make it energetic and community-focused.",
      fr: "Créez du contenu excitant pour la saison de hockey célébrant le sport d'hiver national du Canada. Incluez des références à la LNH, aux équipes locales, au hockey communautaire et à la passion que les Canadiens ont pour ce sport. Rendez-le énergique et axé sur la communauté.",
    },
    suggestedStyle: "playful",
    suggestedTone: "energetic",
    preview: {
      en: "🏒 Hockey season is here! Time to cheer on our favorite teams and celebrate Canada's game...",
      fr: "🏒 La saison de hockey est arrivée! Il est temps d'encourager nos équipes favorites et de célébrer le sport du Canada...",
    },
    icon: "🏒",
    dateRange: {
      start: "10-01",
      end: "06-30",
    },
  },
  {
    id: "back-to-school-canada",
    name: {
      en: "Back to School (Canada)",
      fr: "Rentrée scolaire (Canada)",
    },
    category: "Holidays",
    description: {
      en: "Welcome students back to school with content tailored for Canadian academic year",
      fr: "Accueillez les étudiants de retour à l'école avec du contenu adapté à l'année scolaire canadienne",
    },
    prompt: {
      en: "Create back-to-school content for the Canadian academic year (typically September start). Include references to fresh starts, learning goals, Canadian education system, and supporting students. Make it encouraging and motivating.",
      fr: "Créez du contenu de rentrée scolaire pour l'année académique canadienne (généralement début septembre). Incluez des références aux nouveaux départs, aux objectifs d'apprentissage, au système éducatif canadien et au soutien aux étudiants. Rendez-le encourageant et motivant.",
    },
    suggestedStyle: "professional",
    suggestedTone: "friendly",
    preview: {
      en: "📚 Back to school season! Supporting students as they embark on another year of learning...",
      fr: "📚 Saison de rentrée scolaire! Soutenons les étudiants alors qu'ils entament une autre année d'apprentissage...",
    },
    icon: "📚",
    dateRange: {
      start: "08-20",
      end: "09-15",
    },
  },
  // Business
  {
    id: "business-announcement",
    name: {
      en: "Business Announcement",
      fr: "Annonce d'affaires",
    },
    category: "Business",
    description: {
      en: "Professional business announcements for product launches, partnerships, or company news",
      fr: "Annonces d'affaires professionnelles pour lancements de produits, partenariats ou actualités d'entreprise",
    },
    prompt: {
      en: "Create a professional business announcement for a Canadian company. Include key information, value proposition, and call to action. Ensure it follows Canadian business communication standards.",
      fr: "Créez une annonce d'affaires professionnelle pour une entreprise canadienne. Incluez les informations clés, la proposition de valeur et l'appel à l'action. Assurez-vous qu'elle respecte les normes de communication d'affaires canadiennes.",
    },
    suggestedStyle: "professional",
    suggestedTone: "professional",
    preview: {
      en: "We're excited to announce our latest initiative designed to serve Canadian businesses better...",
      fr: "Nous sommes ravis d'annoncer notre dernière initiative conçue pour mieux servir les entreprises canadiennes...",
    },
    icon: "💼",
  },
  {
    id: "client-testimonial",
    name: {
      en: "Client Testimonial",
      fr: "Témoignage client",
    },
    category: "Business",
    description: {
      en: "Share client success stories and testimonials to build trust",
      fr: "Partagez les témoignages et réussites de clients pour établir la confiance",
    },
    prompt: {
      en: "Create content showcasing a client testimonial or success story. Highlight the value delivered and results achieved. Make it authentic and credible for Canadian audiences.",
      fr: "Créez du contenu présentant un témoignage ou une réussite client. Mettez en valeur la valeur livrée et les résultats obtenus. Rendez-le authentique et crédible pour les audiences canadiennes.",
    },
    suggestedStyle: "professional",
    suggestedTone: "friendly",
    preview: {
      en: "We're proud to share how [Client Name] achieved success with our solutions...",
      fr: "Nous sommes fiers de partager comment [Nom du client] a réussi avec nos solutions...",
    },
    icon: "⭐",
  },
  // Marketing
  {
    id: "product-launch",
    name: {
      en: "Product Launch",
      fr: "Lancement de produit",
    },
    category: "Marketing",
    description: {
      en: "Announce new products or services with engaging launch content",
      fr: "Annoncez de nouveaux produits ou services avec du contenu de lancement engageant",
    },
    prompt: {
      en: "Create exciting product launch content that highlights key features, benefits, and why it matters to Canadian consumers. Include a clear call to action and make it shareable.",
      fr: "Créez du contenu de lancement de produit excitant qui met en évidence les caractéristiques clés, les avantages et pourquoi cela compte pour les consommateurs canadiens. Incluez un appel à l'action clair et rendez-le partageable.",
    },
    suggestedStyle: "creative",
    suggestedTone: "enthusiastic",
    preview: {
      en: "🎉 Introducing [Product Name] - designed specifically for Canadian needs...",
      fr: "🎉 Présentation de [Nom du produit] - conçu spécifiquement pour les besoins canadiens...",
    },
    icon: "🚀",
  },
  {
    id: "limited-offer",
    name: {
      en: "Limited Time Offer",
      fr: "Offre à durée limitée",
    },
    category: "Marketing",
    description: {
      en: "Create urgency with time-limited promotions and special offers",
      fr: "Créez de l'urgence avec des promotions à durée limitée et des offres spéciales",
    },
    prompt: {
      en: "Create compelling limited-time offer content with clear value proposition, urgency, and terms. Ensure it complies with Canadian advertising standards and is clear about the offer details.",
      fr: "Créez du contenu d'offre à durée limitée convaincant avec une proposition de valeur claire, de l'urgence et des conditions. Assurez-vous qu'il respecte les normes publicitaires canadiennes et qu'il soit clair sur les détails de l'offre.",
    },
    suggestedStyle: "creative",
    suggestedTone: "persuasive",
    preview: {
      en: "⏰ Limited time only! Special offer for Canadian customers...",
      fr: "⏰ Temps limité seulement! Offre spéciale pour les clients canadiens...",
    },
    icon: "⏰",
  },
  // Social
  {
    id: "community-spotlight",
    name: {
      en: "Community Spotlight",
      fr: "Mise en vedette communautaire",
    },
    category: "Social",
    description: {
      en: "Highlight community members, local heroes, or community initiatives",
      fr: "Mettez en vedette les membres de la communauté, les héros locaux ou les initiatives communautaires",
    },
    prompt: {
      en: "Create content spotlighting a community member, local initiative, or Canadian making a positive impact. Celebrate their contribution and encourage community engagement.",
      fr: "Créez du contenu mettant en vedette un membre de la communauté, une initiative locale ou un Canadien ayant un impact positif. Célébrez leur contribution et encouragez l'engagement communautaire.",
    },
    suggestedStyle: "casual",
    suggestedTone: "friendly",
    preview: {
      en: "🌟 Meet [Name], a community hero making a difference in [Location]...",
      fr: "🌟 Rencontrez [Nom], un héros communautaire qui fait une différence à [Lieu]...",
    },
    icon: "🌟",
  },
  {
    id: "tips-advice",
    name: {
      en: "Tips & Advice",
      fr: "Conseils et astuces",
    },
    category: "Social",
    description: {
      en: "Share helpful tips, advice, or educational content",
      fr: "Partagez des conseils utiles, des astuces ou du contenu éducatif",
    },
    prompt: {
      en: "Create helpful tips and advice content relevant to Canadian audiences. Make it practical, actionable, and valuable. Use clear formatting for easy reading.",
      fr: "Créez du contenu de conseils et d'astuces utiles pertinent pour les audiences canadiennes. Rendez-le pratique, actionnable et précieux. Utilisez un formatage clair pour une lecture facile.",
    },
    suggestedStyle: "professional",
    suggestedTone: "informative",
    preview: {
      en: "💡 Quick tips for [Topic] - Here's what every Canadian should know...",
      fr: "💡 Conseils rapides pour [Sujet] - Voici ce que chaque Canadien devrait savoir...",
    },
    icon: "💡",
  },
];

export const getTemplatesByCategory = (category?: TemplateCategory): Template[] => {
  if (!category) return templates;
  return templates.filter((t) => t.category === category);
};

export const getTemplateById = (id: string): Template | undefined => {
  return templates.find((t) => t.id === id);
};

export const isTemplateInSeason = (template: Template): boolean => {
  if (!template.dateRange) return true;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();
  
  const [startMonth, startDay] = template.dateRange.start.split("-").map(Number);
  const [endMonth, endDay] = template.dateRange.end.split("-").map(Number);
  
  const startDate = new Date(currentYear, startMonth - 1, startDay);
  const endDate = new Date(currentYear, endMonth - 1, endDay);
  
  // Handle date ranges that span the year (e.g., October to June)
  if (endDate < startDate) {
    // Range spans across year end (e.g., Oct to June)
    // If we're before the end date, we're in next year's season
    // If we're after the start date, we're in this year's season
    const current = new Date(currentYear, currentMonth - 1, currentDay);
    if (current >= startDate) {
      // We're after start, so season ends next year
      endDate.setFullYear(currentYear + 1);
      return current <= endDate;
    } else {
      // We're before start, check if we're in last year's season (ended this year)
      const lastYearEnd = new Date(currentYear, endMonth - 1, endDay);
      const lastYearStart = new Date(currentYear - 1, startMonth - 1, startDay);
      return current >= lastYearStart && current <= lastYearEnd;
    }
  } else {
    // Normal range within same year
    const current = new Date(currentYear, currentMonth - 1, currentDay);
    return current >= startDate && current <= endDate;
  }
};
