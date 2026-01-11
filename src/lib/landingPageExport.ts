import type { LandingPageData, SectionContent } from "./landingPageGenerators";
import type { LandingPageTemplate } from "./landingPageTemplates";
import { formatCanadianPrice } from "./canadianFeatures";

/**
 * Export landing page as standalone HTML
 */
export const exportLandingPageAsHTML = (
  landingPageData: LandingPageData,
  template: LandingPageTemplate,
  language: "en" | "fr" = "en"
): string => {
  const content = language === "fr" && landingPageData.language === "bilingual"
    ? landingPageData.sections
    : Object.fromEntries(
        Object.entries(landingPageData.sections).map(([key, value]) => [
          key,
          { en: value.en, fr: value.en }, // Use English as fallback
        ])
      );

  const sections = template.sections
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const sectionData = content[section.id];
      if (!sectionData) return "";

      const sectionContent = language === "fr" && sectionData.fr
        ? sectionData.fr
        : sectionData.en;

      return renderSectionHTML(section.type, sectionContent, landingPageData, template);
    })
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="${language === "fr" ? "fr-CA" : "en-CA"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${landingPageData.businessDescription.substring(0, 160)}">
  <title>${landingPageData.businessName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #e0e0e0;
      background: linear-gradient(135deg, #001a33 0%, #000a18 100%);
      min-height: 100vh;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .section {
      padding: 4rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    h1, h2, h3 {
      color: #ffffff;
      margin-bottom: 1rem;
    }
    
    h1 {
      font-size: 3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #00d4aa 0%, #00b8d4 50%, #ff6b9d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    h2 {
      font-size: 2.5rem;
      font-weight: 600;
    }
    
    h3 {
      font-size: 1.5rem;
      font-weight: 500;
    }
    
    p {
      color: #b0b0b0;
      margin-bottom: 1rem;
      font-size: 1.1rem;
    }
    
    .btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #00d4aa 0%, #00b8d4 100%);
      color: #000;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      transition: transform 0.2s, opacity 0.2s;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }
    
    .btn:hover {
      transform: translateY(-2px);
      opacity: 0.9;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .feature-card {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .feature-card h3 {
      margin-bottom: 0.5rem;
      color: #00d4aa;
    }
    
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .pricing-card {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }
    
    .pricing-card h3 {
      margin-bottom: 1rem;
    }
    
    .price {
      font-size: 2.5rem;
      font-weight: 700;
      color: #00d4aa;
      margin: 1rem 0;
    }
    
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }
    
    .testimonial-card {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .testimonial-card p {
      font-style: italic;
      margin-bottom: 1rem;
    }
    
    .testimonial-card .author {
      font-weight: 600;
      color: #00d4aa;
    }
    
    footer {
      padding: 3rem 0;
      text-align: center;
      color: #888;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 4rem;
    }
    
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 2rem;
      }
      
      .container {
        padding: 1rem;
      }
      
      .section {
        padding: 2rem 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${sections}
  </div>
</body>
</html>`;

  return html;
};

/**
 * Render a section as HTML based on its type
 */
const renderSectionHTML = (
  sectionType: string,
  content: SectionContent["en"],
  landingPageData: LandingPageData,
  template: LandingPageTemplate
): string => {
  switch (sectionType) {
    case "hero":
      return `
        <section class="section">
          <h1>${content.title || landingPageData.businessName}</h1>
          ${content.subtitle ? `<p style="font-size: 1.3rem; color: #b0b0b0;">${content.subtitle}</p>` : ""}
          ${content.content ? `<p>${content.content}</p>` : ""}
          ${content.cta ? `<a href="#contact" class="btn">${content.cta}</a>` : ""}
        </section>
      `;

    case "features":
      return `
        <section class="section">
          <h2>${content.title || "Features"}</h2>
          ${content.subtitle ? `<p>${content.subtitle}</p>` : ""}
          ${content.features ? `
            <div class="features-grid">
              ${content.features.map(feature => `
                <div class="feature-card">
                  <h3>${feature.title}</h3>
                  <p>${feature.description}</p>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </section>
      `;

    case "pricing":
      return `
        <section class="section">
          <h2>${content.title || "Pricing"}</h2>
          ${content.subtitle ? `<p>${content.subtitle}</p>` : ""}
          ${content.items ? `
            <div class="pricing-grid">
              ${content.items.map((item: any) => `
                <div class="pricing-card">
                  <h3>${item.name || "Plan"}</h3>
                  <div class="price">${formatCanadianPrice(item.price || 0, "ON", true, false)}</div>
                  <p>${item.description || ""}</p>
                  ${item.features ? `
                    <ul style="list-style: none; margin: 1.5rem 0; text-align: left;">
                      ${item.features.map((feature: string) => `<li style="padding: 0.5rem 0;">✓ ${feature}</li>`).join("")}
                    </ul>
                  ` : ""}
                  <a href="#contact" class="btn">Get Started</a>
                </div>
              `).join("")}
            </div>
          ` : ""}
        </section>
      `;

    case "testimonials":
      return `
        <section class="section">
          <h2>${content.title || "Testimonials"}</h2>
          ${content.items ? `
            <div class="testimonials-grid">
              ${content.items.map((item: any) => `
                <div class="testimonial-card">
                  <p>"${item.text || item.testimonial || ""}"</p>
                  <div class="author">— ${item.name || "Customer"}</div>
                  ${item.role ? `<div style="color: #888; font-size: 0.9rem;">${item.role}</div>` : ""}
                </div>
              `).join("")}
            </div>
          ` : ""}
        </section>
      `;

    case "cta":
      return `
        <section class="section" id="contact">
          <h2>${content.title || "Get Started Today"}</h2>
          ${content.subtitle ? `<p style="font-size: 1.2rem;">${content.subtitle}</p>` : ""}
          ${content.content ? `<p>${content.content}</p>` : ""}
          ${content.cta ? `<a href="#contact" class="btn">${content.cta}</a>` : ""}
        </section>
      `;

    case "footer":
      return `
        <footer>
          <p>&copy; ${new Date().getFullYear()} ${landingPageData.businessName}. All rights reserved.</p>
          <p style="margin-top: 1rem; font-size: 0.9rem;">
            Made with ❤️ in Canada
          </p>
        </footer>
      `;

    default:
      return `
        <section class="section">
          <h2>${content.title || sectionType}</h2>
          ${content.subtitle ? `<p>${content.subtitle}</p>` : ""}
          ${content.content ? `<p>${content.content}</p>` : ""}
        </section>
      `;
  }
};

/**
 * Download HTML file
 */
export const downloadLandingPageHTML = (
  landingPageData: LandingPageData,
  template: LandingPageTemplate,
  language: "en" | "fr" = "en"
): void => {
  const html = exportLandingPageAsHTML(landingPageData, template, language);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${landingPageData.businessName.replace(/\s+/g, "-").toLowerCase()}-landing-page.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
