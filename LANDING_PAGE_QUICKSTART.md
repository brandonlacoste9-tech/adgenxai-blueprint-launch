# Landing Page Studio - Quick Start Guide

## 🚀 What's New

Your AdGenXAI project now includes a complete **Landing Page Studio** feature that allows you to:
- Generate professional landing pages with AI
- Preview pages on desktop, tablet, and mobile
- Export as standalone HTML files
- Deploy to GitHub Pages, Vercel, or Netlify with one click

## 📍 Access the Feature

Navigate to: **`/landing-pages`**

Or add a link in your navigation:
```tsx
<a href="/landing-pages">Landing Pages</a>
```

## ⚙️ Setup Required

### 1. Deploy Edge Functions

```bash
# Deploy the AI generation function
supabase functions deploy generate-landing-page

# Deploy deployment integration functions
supabase functions deploy deploy-github
supabase functions deploy deploy-vercel
supabase functions deploy deploy-netlify
```

### 2. Set Environment Variables

In your Supabase project dashboard, add these secrets:

```bash
# Required for AI generation (already set if you have Creator Studio working)
LOVABLE_API_KEY=your_lovable_api_key

# Optional: For GitHub Pages deployment
GITHUB_TOKEN=your_github_personal_access_token

# Optional: For Vercel deployment
VERCEL_TOKEN=your_vercel_api_token

# Optional: For Netlify deployment
NETLIFY_TOKEN=your_netlify_api_token
```

**Note**: Deployment integrations are optional. You can still use the feature to generate and download HTML files without these tokens.

### 3. Getting API Tokens

#### GitHub Token
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full repository access)
4. Copy the token

#### Vercel Token
1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Copy the token

#### Netlify Token
1. Go to: https://app.netlify.com/user/applications#personal-access-tokens
2. Click "New access token"
3. Copy the token

## 🎯 Quick Usage

### Generate Your First Landing Page

1. **Select a Template**
   - Choose from 5 pre-built templates
   - Search by name or tags

2. **Fill in Business Details**
   - Business Name (required)
   - Business Description
   - Industry
   - Target Audience
   - Language (English, French, or Bilingual)

3. **Generate**
   - Click "Generate Landing Page"
   - Wait for AI to create content (~10-30 seconds)

4. **Preview**
   - Switch to Preview tab
   - Test on different devices

5. **Export or Deploy**
   - Download HTML file, or
   - Deploy to GitHub/Vercel/Netlify

## 📋 Available Templates

1. **SaaS Startup** - Modern SaaS landing page
2. **Local Business** - Quebec local business with bilingual support
3. **E-Commerce** - Product showcase with Canadian pricing
4. **Professional Services** - Elegant design for consultants
5. **Event Landing** - Event registration page

## 🔧 Customization

### Add More Templates

Edit `src/lib/landing-templates.ts`:

```typescript
export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
  // ... existing templates
  {
    id: "your-template",
    name: "Your Template Name",
    description: "Description",
    category: "Category",
    preview: "https://image-url.com/preview.jpg",
    sections: ["hero", "features", "pricing", "cta", "footer"],
    tags: ["tag1", "tag2"]
  }
];
```

### Modify AI Prompts

Edit `supabase/functions/generate-landing-page/index.ts` to customize how AI generates content for each section.

### Style the Output

Edit `src/lib/deployment.ts` in the `generateStandaloneHTML` function to change CSS styles.

## 📚 Full Documentation

See `docs/LANDING_PAGE_STUDIO.md` for complete documentation including:
- Technical architecture
- API reference
- Troubleshooting guide
- Future enhancements

## 🐛 Troubleshooting

### "Supabase not configured" error
- Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in your environment

### Generation fails
- Check Supabase function logs
- Verify `LOVABLE_API_KEY` is set correctly
- Check rate limits (5/min, 50/day per user)

### Deployment fails
- Verify the respective API token is set
- Check token permissions
- Ensure unique names for repos/projects/sites

## 🎉 What's Included

### Files Added
- `src/components/LandingPageStudio.tsx` - Main UI component
- `src/pages/LandingPages.tsx` - Page wrapper
- `src/lib/landing-templates.ts` - Template definitions
- `src/lib/deployment.ts` - Deployment utilities
- `supabase/functions/generate-landing-page/` - AI generation
- `supabase/functions/deploy-github/` - GitHub deployment
- `supabase/functions/deploy-vercel/` - Vercel deployment
- `supabase/functions/deploy-netlify/` - Netlify deployment
- `docs/LANDING_PAGE_STUDIO.md` - Full documentation

### Files Modified
- `src/App.tsx` - Added `/landing-pages` route
- `src/components/CreatorStudio.tsx` - Fixed HTML structure

## 🚀 Next Steps

1. Deploy the edge functions
2. Set up at least the `LOVABLE_API_KEY` (required)
3. Optionally set up deployment tokens
4. Navigate to `/landing-pages` and create your first landing page!

## 💡 Tips

- Start with the "SaaS Startup" template for a quick test
- Provide detailed business descriptions for better AI results
- Always preview on multiple devices before deploying
- Download HTML first to review before deploying
- Use bilingual mode if targeting Quebec markets

---

**Questions or Issues?** Check the full documentation in `docs/LANDING_PAGE_STUDIO.md`
