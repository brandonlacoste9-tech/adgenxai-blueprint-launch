# Modern Voyageur Studio - Quick Start Prompts

## 🏔️ Canadian Entrepreneur Landing Page Template

### Primary Test Prompt (Copy & Paste into Studio)

```
Create a compelling landing page for "Aurora Coffee Roasters", a premium Toronto-based coffee company that sources beans directly from Canadian farmers. The business focuses on sustainable, single-origin coffee with an emphasis on Canadian terroir and community.

Design a modern landing page with:
- Hero section featuring Canadian landscape photography
- Features highlighting Canadian sourcing and sustainability
- Pricing tiers for subscription coffee boxes
- Testimonials from Canadian coffee enthusiasts
- Call-to-action for free coffee tasting events

Use Canadian English spelling and cultural references. Make it conversion-optimized for e-commerce.
```

### Alternative Test Prompts

#### 2. Tech Startup (Vancouver)
```
Build a landing page for "Northern Lights Analytics", a Vancouver-based AI consulting firm specializing in machine learning for Canadian businesses.

Include:
- Hero with data visualization graphics
- Service packages for small/medium enterprises
- Case studies from Canadian companies
- Free consultation CTA
- Trust indicators (Canadian certifications, privacy compliance)

Focus on B2B messaging and technical credibility.
```

#### 3. E-commerce Store (Montreal)
```
Design a landing page for "Maple & Oak Furnishings", a Montreal-based furniture store specializing in Canadian-made hardwood furniture.

Features needed:
- Product showcase with Canadian wood types
- Customization options for furniture
- Free design consultation
- Canadian shipping information
- Sustainable forestry messaging

Emphasize craftsmanship and Canadian heritage.
```

#### 4. Service Business (Calgary)
```
Create a landing page for "Prairie Sky Consulting", a Calgary-based management consulting firm helping Canadian businesses with digital transformation.

Structure:
- Problem/solution focused hero
- Service offerings (Strategy, Technology, Change Management)
- Team section with Canadian business leaders
- Case studies from oil & gas and tech sectors
- Contact form with free initial assessment

Use professional, trustworthy language.
```

## 🧪 Testing Checklist

### Function Deployment Test
```bash
# Test the Vertex AI function directly
curl -X POST 'https://tpsseyzezbmfxydeaibr.supabase.co/functions/v1/generate-vertex-ai' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Hello, generate a simple landing page idea",
    "model": "gemini-2.0-flash-exp",
    "temperature": 0.7
  }'
```

### Studio Interface Test
1. ✅ Navigate to `/studio`
2. ✅ Click "Landing Page" quick start card
3. ✅ Verify prompt auto-fills
4. ✅ Click generate and watch streaming response
5. ✅ Test model selection dropdown
6. ✅ Adjust temperature slider

### Content Quality Test
1. ✅ Verify Canadian English spelling
2. ✅ Check for cultural references
3. ✅ Ensure conversion optimization
4. ✅ Test responsive design elements
5. ✅ Validate HTML structure

## 🎯 Expected Results

### Performance Metrics
- **Response Time:** < 2 seconds initial response
- **Streaming Quality:** Smooth, readable text flow
- **Content Length:** 500-2000 words for landing pages
- **Canadian Localization:** Proper spelling, references, and context

### Content Quality Checks
- ✅ Compelling headlines and copy
- ✅ Clear value propositions
- ✅ Strong call-to-actions
- ✅ Mobile-responsive design
- ✅ SEO-optimized structure
- ✅ Conversion-optimized layout

## 🚀 Production Launch Sequence

### Pre-Launch
1. Deploy function with Google Cloud credentials
2. Test all prompt templates
3. Verify streaming performance
4. Check error handling

### Launch Day
1. Enable `/studio` route in production
2. Monitor function usage and performance
3. Track user engagement metrics
4. Gather feedback for iterations

### Post-Launch
1. Add user analytics
2. Implement A/B testing for prompts
3. Expand template library
4. Add user-generated content features

---

## 📝 Custom Prompt Template Generator

Use this template to create your own Canadian business prompts:

```
Create a [type] landing page for "[Business Name]", a [location]-based [industry] company that [value proposition].

Design with:
- [Key sections/features]
- [Target audience focus]
- [Unique Canadian elements]

Use [tone] language and focus on [conversion goals].
```

**Example:** "Create a SaaS landing page for 'Northern SaaS Solutions', a Toronto-based software company that helps Canadian businesses automate their workflows. Design with: onboarding flow demo, pricing calculator, Canadian compliance badges, testimonials from local businesses. Use professional language and focus on ROI metrics."

---

**Ready to test your Modern Voyageur Studio?** The Aurora Coffee Roasters prompt is the perfect starting point! 🇨🇦☕✨