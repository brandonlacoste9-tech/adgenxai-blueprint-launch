# Landing Page Studio Documentation

## Overview

The Landing Page Studio is a comprehensive AI-powered landing page builder integrated into AdGenXAI. It allows users to create professional, conversion-optimized landing pages with bilingual support (English/French), preview capabilities, and one-click deployment to multiple platforms.

## Features

### 1. Template Library
- **5 Pre-built Templates**: SaaS Startup, Local Business, E-Commerce, Professional Services, Event Landing
- **Search & Filter**: Find templates by name, description, or tags
- **Template Categories**: SaaS, Local, E-Commerce, Professional, Events
- **Preview Images**: Visual representation of each template

### 2. AI-Powered Generation
- **Business Context**: Input business name, description, industry, and target audience
- **Language Support**: English, French (Quebec), or Bilingual
- **Section Generation**: Automatically generates content for:
  - Hero sections with compelling headlines
  - Feature showcases
  - Pricing tables with Canadian pricing support
  - Customer testimonials
  - Call-to-action sections
  - Professional footers
- **Real-time Progress**: Visual progress bar during generation

### 3. Preview System
- **Responsive Preview**: Test your landing page across devices
  - Desktop view (100% width)
  - Tablet view (768px)
  - Mobile view (375px)
- **Live Rendering**: See exactly how your page will look
- **Iframe Preview**: Isolated rendering environment

### 4. Export Options
- **HTML Download**: Get a standalone HTML file with embedded styles
- **Glass-morphism Design**: Modern, professional styling
- **Fully Responsive**: Works on all devices out of the box
- **No Dependencies**: Single HTML file with inline CSS

### 5. Deployment Integrations

#### GitHub Pages
- **Automatic Repository Creation**: Creates a new GitHub repository
- **GitHub Pages Setup**: Enables GitHub Pages automatically
- **Public URL**: Get a live URL at `username.github.io/repo-name`
- **Version Control**: Full Git history included

#### Vercel
- **Instant Deployment**: Deploy to Vercel's global CDN
- **Custom Domain Support**: Add your own domain later
- **HTTPS by Default**: Secure connections out of the box
- **Zero Configuration**: No setup required

#### Netlify
- **Continuous Deployment**: Automatic updates on changes
- **Form Handling**: Built-in form submissions (future enhancement)
- **CDN Distribution**: Fast loading worldwide
- **Custom Domain**: Easy domain configuration

## Technical Architecture

### Frontend Components

#### LandingPageStudio.tsx
Main component with 4 tabs:
- **Templates**: Browse and select templates
- **Builder**: Configure business details and generate
- **Preview**: Responsive preview with device switching
- **Export & Deploy**: Download or deploy to platforms

#### Key Features:
- State management for generation flow
- Progress tracking during AI generation
- Toast notifications for user feedback
- Tooltips for guidance
- Responsive design

### Backend Edge Functions

#### generate-landing-page
- **Location**: `supabase/functions/generate-landing-page/`
- **Purpose**: AI-powered content generation for landing page sections
- **Model**: Google Gemini 2.5 Flash via Lovable AI Gateway
- **Rate Limiting**: 5 requests per minute per user
- **Quota**: 50 generations per day per user

**Request Format**:
```json
{
  "templateId": "saas-startup",
  "businessName": "Acme Inc",
  "businessDescription": "We help businesses grow",
  "industry": "SaaS",
  "targetAudience": "Small businesses",
  "language": "en",
  "sections": ["hero", "features", "pricing", "testimonials", "cta", "footer"]
}
```

**Response Format**:
```json
{
  "sections": [
    {
      "type": "hero",
      "content": {
        "headline": "...",
        "subheadline": "...",
        "ctaText": "...",
        "ctaLink": "..."
      }
    }
  ]
}
```

#### deploy-github
- **Location**: `supabase/functions/deploy-github/`
- **Purpose**: Deploy landing pages to GitHub Pages
- **Requirements**: `GITHUB_TOKEN` environment variable
- **Process**:
  1. Create new GitHub repository
  2. Add index.html file
  3. Enable GitHub Pages
  4. Return repository and pages URLs

#### deploy-vercel
- **Location**: `supabase/functions/deploy-vercel/`
- **Purpose**: Deploy landing pages to Vercel
- **Requirements**: `VERCEL_TOKEN` environment variable
- **Process**:
  1. Create deployment with files
  2. Deploy to production
  3. Return deployment URL

#### deploy-netlify
- **Location**: `supabase/functions/deploy-netlify/`
- **Purpose**: Deploy landing pages to Netlify
- **Requirements**: `NETLIFY_TOKEN` environment variable
- **Process**:
  1. Create new Netlify site
  2. Deploy HTML content
  3. Return site URL

### Data Structures

#### LandingPageTemplate
```typescript
interface LandingPageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  sections: string[];
  tags: string[];
}
```

#### GeneratedLandingPage
```typescript
interface GeneratedLandingPage {
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
```

## Setup Instructions

### Environment Variables

Add these to your Supabase project or `.env` file:

```bash
# Required for AI generation
LOVABLE_API_KEY=your_lovable_api_key

# Required for GitHub deployment
GITHUB_TOKEN=your_github_personal_access_token

# Required for Vercel deployment
VERCEL_TOKEN=your_vercel_api_token

# Required for Netlify deployment
NETLIFY_TOKEN=your_netlify_api_token
```

### Supabase Setup

1. Deploy edge functions:
```bash
supabase functions deploy generate-landing-page
supabase functions deploy deploy-github
supabase functions deploy deploy-vercel
supabase functions deploy deploy-netlify
```

2. Set environment secrets:
```bash
supabase secrets set LOVABLE_API_KEY=xxx
supabase secrets set GITHUB_TOKEN=xxx
supabase secrets set VERCEL_TOKEN=xxx
supabase secrets set NETLIFY_TOKEN=xxx
```

### GitHub Token Setup

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Create a new token with these scopes:
   - `repo` (full repository access)
   - `workflow` (if using GitHub Actions)
3. Copy the token and set it as `GITHUB_TOKEN`

### Vercel Token Setup

1. Go to Vercel Account Settings → Tokens
2. Create a new token
3. Copy and set as `VERCEL_TOKEN`

### Netlify Token Setup

1. Go to Netlify User Settings → Applications → Personal Access Tokens
2. Create a new token
3. Copy and set as `NETLIFY_TOKEN`

## Usage Guide

### Creating a Landing Page

1. **Navigate to Landing Page Studio**
   - Go to `/landing-pages` route
   - Or add a navigation link in your app

2. **Select a Template**
   - Browse the template library
   - Use search to filter templates
   - Click on a template to select it

3. **Configure Business Details**
   - Switch to the "Builder" tab
   - Fill in your business information:
     - Business Name (required)
     - Business Description
     - Industry
     - Target Audience
     - Language preference
   - Click "Generate Landing Page"

4. **Preview Your Page**
   - Switch to the "Preview" tab
   - Test different device sizes:
     - Desktop
     - Tablet
     - Mobile
   - Review all sections

5. **Export or Deploy**
   - Switch to "Export & Deploy" tab
   - Choose an option:
     - **Download HTML**: Get a standalone file
     - **Deploy to GitHub**: Create a GitHub Pages site
     - **Deploy to Vercel**: Instant deployment
     - **Deploy to Netlify**: Continuous deployment

### Best Practices

1. **Business Description**: Provide detailed information for better AI-generated content
2. **Target Audience**: Be specific about who you're targeting
3. **Language Selection**: Choose bilingual if you need both English and French
4. **Preview Testing**: Always preview on multiple devices before deploying
5. **Deployment**: Start with HTML download to review, then deploy

## Customization

### Adding New Templates

Edit `src/lib/landing-templates.ts`:

```typescript
{
  id: "your-template-id",
  name: "Your Template Name",
  description: "Description of your template",
  category: "Category",
  preview: "https://image-url.com/preview.jpg",
  sections: ["hero", "features", "pricing", "cta", "footer"],
  tags: ["tag1", "tag2", "tag3"]
}
```

### Modifying Section Prompts

Edit the `buildSectionPrompt` function in `supabase/functions/generate-landing-page/index.ts` to customize how AI generates content for each section type.

### Styling the HTML Output

Modify the `generateStandaloneHTML` function in `src/lib/deployment.ts` to change the embedded CSS styles.

## Troubleshooting

### Generation Fails
- **Check Supabase logs**: Look for edge function errors
- **Verify API keys**: Ensure `LOVABLE_API_KEY` is set correctly
- **Rate limits**: Wait if you've hit the rate limit (5/min)
- **Quota**: Check if daily quota (50/day) is exceeded

### Deployment Fails

#### GitHub
- Verify `GITHUB_TOKEN` has correct permissions
- Check if repository name already exists
- Ensure token isn't expired

#### Vercel
- Verify `VERCEL_TOKEN` is valid
- Check Vercel account limits
- Ensure project name is unique

#### Netlify
- Verify `NETLIFY_TOKEN` is valid
- Check Netlify account limits
- Ensure site name is unique

### Preview Not Loading
- Check browser console for errors
- Verify generated content structure
- Try refreshing the preview

## Future Enhancements

### Planned Features
1. **Section Editor**: Edit individual sections after generation
2. **Custom Sections**: Add your own custom sections
3. **Image Upload**: Upload custom images for sections
4. **Color Themes**: Choose from predefined color schemes
5. **A/B Testing**: Create variants and test performance
6. **Analytics Integration**: Add Google Analytics, Plausible, etc.
7. **Form Integration**: Connect contact forms to email services
8. **SEO Optimization**: Meta tags, Open Graph, Twitter Cards
9. **Multi-page Support**: Create multi-page websites
10. **Template Marketplace**: Share and download community templates

### Integration Opportunities
- **Email Marketing**: Mailchimp, ConvertKit integration
- **CRM**: Salesforce, HubSpot integration
- **Payment**: Stripe, PayPal integration for pricing pages
- **Chat**: Intercom, Drift integration
- **Social Proof**: Trustpilot, G2 reviews integration

## API Reference

### Client-Side Functions

#### deployLandingPage
```typescript
async function deployLandingPage(config: DeploymentConfig): Promise<DeploymentResult>
```

#### generateStandaloneHTML
```typescript
function generateStandaloneHTML(sections: any[], metadata: any): string
```

### Edge Function Endpoints

#### POST /generate-landing-page
Generate landing page content using AI

#### POST /deploy-github
Deploy to GitHub Pages

#### POST /deploy-vercel
Deploy to Vercel

#### POST /deploy-netlify
Deploy to Netlify

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase function logs
3. Check browser console for client-side errors
4. Contact support at the configured support email

## License

Part of the AdGenXAI project. See main project license.
