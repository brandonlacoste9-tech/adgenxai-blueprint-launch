import { supabase } from "@/integrations/supabase/client";

export interface DeploymentConfig {
  platform: "github" | "vercel" | "netlify";
  repositoryName?: string;
  projectName?: string;
  html: string;
  metadata: {
    businessName: string;
    description?: string;
  };
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  repositoryUrl?: string;
  error?: string;
  platform: string;
}

/**
 * Deploy to GitHub as a new repository
 */
export async function deployToGitHub(config: DeploymentConfig): Promise<DeploymentResult> {
  try {
    const { data, error } = await supabase.functions.invoke("deploy-github", {
      body: {
        repositoryName: config.repositoryName || `landing-${Date.now()}`,
        html: config.html,
        metadata: config.metadata,
      },
    });

    if (error) throw error;

    return {
      success: true,
      repositoryUrl: data.repositoryUrl,
      url: data.pagesUrl,
      platform: "github",
    };
  } catch (error) {
    console.error("GitHub deployment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deploy to GitHub",
      platform: "github",
    };
  }
}

/**
 * Deploy to Vercel
 */
export async function deployToVercel(config: DeploymentConfig): Promise<DeploymentResult> {
  try {
    const { data, error } = await supabase.functions.invoke("deploy-vercel", {
      body: {
        projectName: config.projectName || `landing-${Date.now()}`,
        html: config.html,
        metadata: config.metadata,
      },
    });

    if (error) throw error;

    return {
      success: true,
      url: data.url,
      platform: "vercel",
    };
  } catch (error) {
    console.error("Vercel deployment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deploy to Vercel",
      platform: "vercel",
    };
  }
}

/**
 * Deploy to Netlify
 */
export async function deployToNetlify(config: DeploymentConfig): Promise<DeploymentResult> {
  try {
    const { data, error } = await supabase.functions.invoke("deploy-netlify", {
      body: {
        siteName: config.projectName || `landing-${Date.now()}`,
        html: config.html,
        metadata: config.metadata,
      },
    });

    if (error) throw error;

    return {
      success: true,
      url: data.url,
      platform: "netlify",
    };
  } catch (error) {
    console.error("Netlify deployment error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deploy to Netlify",
      platform: "netlify",
    };
  }
}

/**
 * Main deployment function that routes to the appropriate platform
 */
export async function deployLandingPage(config: DeploymentConfig): Promise<DeploymentResult> {
  switch (config.platform) {
    case "github":
      return deployToGitHub(config);
    case "vercel":
      return deployToVercel(config);
    case "netlify":
      return deployToNetlify(config);
    default:
      return {
        success: false,
        error: "Invalid deployment platform",
        platform: config.platform,
      };
  }
}

/**
 * Generate a standalone HTML file with embedded styles
 */
export function generateStandaloneHTML(sections: any[], metadata: any): string {
  const sectionsHTML = sections.map(section => {
    switch (section.type) {
      case "hero":
        return generateHeroHTML(section.content);
      case "features":
        return generateFeaturesHTML(section.content);
      case "pricing":
        return generatePricingHTML(section.content);
      case "testimonials":
        return generateTestimonialsHTML(section.content);
      case "cta":
        return generateCTAHTML(section.content);
      case "footer":
        return generateFooterHTML(section.content);
      default:
        return "";
    }
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="${metadata.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.businessName || 'Landing Page'}</title>
  <meta name="description" content="${metadata.description || ''}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
    .hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center; }
    .hero h1 { font-size: 3rem; margin-bottom: 20px; }
    .hero p { font-size: 1.25rem; margin-bottom: 30px; opacity: 0.9; }
    .btn { display: inline-block; padding: 12px 30px; background: white; color: #667eea; text-decoration: none; border-radius: 5px; font-weight: 600; transition: transform 0.2s; }
    .btn:hover { transform: translateY(-2px); }
    .section { padding: 80px 20px; }
    .section-title { text-align: center; font-size: 2.5rem; margin-bottom: 50px; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
    .feature { padding: 30px; background: #f8f9fa; border-radius: 10px; }
    .feature h3 { margin-bottom: 15px; color: #667eea; }
    .pricing { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
    .price-card { padding: 40px; background: white; border: 2px solid #e9ecef; border-radius: 10px; text-align: center; }
    .price { font-size: 3rem; font-weight: bold; color: #667eea; margin: 20px 0; }
    .testimonials { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
    .testimonial { padding: 30px; background: #f8f9fa; border-radius: 10px; font-style: italic; }
    .cta { background: #667eea; color: white; text-align: center; padding: 80px 20px; }
    .cta h2 { font-size: 2.5rem; margin-bottom: 20px; }
    .footer { background: #2d3748; color: white; padding: 40px 20px; text-align: center; }
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .section-title { font-size: 1.75rem; }
    }
  </style>
</head>
<body>
  ${sectionsHTML}
</body>
</html>`;
}

function generateHeroHTML(content: any): string {
  return `
  <section class="hero">
    <div class="container">
      <h1>${content.headline || 'Welcome'}</h1>
      <p>${content.subheadline || 'Your success starts here'}</p>
      <a href="${content.ctaLink || '#'}" class="btn">${content.ctaText || 'Get Started'}</a>
    </div>
  </section>`;
}

function generateFeaturesHTML(content: any): string {
  const features = content.features || [];
  const featuresHTML = features.map((f: any) => `
    <div class="feature">
      <h3>${f.title}</h3>
      <p>${f.description}</p>
    </div>
  `).join('');

  return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">${content.title || 'Features'}</h2>
      <div class="features">
        ${featuresHTML}
      </div>
    </div>
  </section>`;
}

function generatePricingHTML(content: any): string {
  const plans = content.plans || [];
  const plansHTML = plans.map((p: any) => `
    <div class="price-card">
      <h3>${p.name}</h3>
      <div class="price">${p.price}</div>
      <ul style="list-style: none; margin: 20px 0;">
        ${(p.features || []).map((f: string) => `<li style="margin: 10px 0;">✓ ${f}</li>`).join('')}
      </ul>
      <a href="${p.ctaLink || '#'}" class="btn">${p.ctaText || 'Choose Plan'}</a>
    </div>
  `).join('');

  return `
  <section class="section" style="background: #f8f9fa;">
    <div class="container">
      <h2 class="section-title">${content.title || 'Pricing'}</h2>
      <div class="pricing">
        ${plansHTML}
      </div>
    </div>
  </section>`;
}

function generateTestimonialsHTML(content: any): string {
  const testimonials = content.testimonials || [];
  const testimonialsHTML = testimonials.map((t: any) => `
    <div class="testimonial">
      <p>"${t.quote}"</p>
      <p style="margin-top: 15px; font-style: normal; font-weight: 600;">— ${t.author}</p>
    </div>
  `).join('');

  return `
  <section class="section">
    <div class="container">
      <h2 class="section-title">${content.title || 'Testimonials'}</h2>
      <div class="testimonials">
        ${testimonialsHTML}
      </div>
    </div>
  </section>`;
}

function generateCTAHTML(content: any): string {
  return `
  <section class="cta">
    <div class="container">
      <h2>${content.headline || 'Ready to get started?'}</h2>
      <p style="font-size: 1.25rem; margin-bottom: 30px;">${content.subheadline || 'Join us today'}</p>
      <a href="${content.ctaLink || '#'}" class="btn">${content.ctaText || 'Get Started Now'}</a>
    </div>
  </section>`;
}

function generateFooterHTML(content: any): string {
  return `
  <footer class="footer">
    <div class="container">
      <p>${content.copyright || `© ${new Date().getFullYear()} All rights reserved`}</p>
      ${content.links ? `<p style="margin-top: 10px;">${content.links.map((l: any) => `<a href="${l.url}" style="color: white; margin: 0 10px;">${l.text}</a>`).join('')}</p>` : ''}
    </div>
  </footer>`;
}
