# Studio Dashboard Setup Guide

## Overview

The Studio Dashboard is a "Modern Voyageur" themed AI workspace that connects to Google Vertex AI for content generation.

## Features

- **3-Column Layout**: Left sidebar (leather texture), center stage (main workspace), right settings panel
- **Quick Start Cards**: Landing Page, Ad Creative, MVP Builder
- **Streaming AI Responses**: Real-time streaming from Vertex AI
- **Model Selection**: Choose between Gemini 2.0 Flash, 1.5 Pro, and 1.5 Flash
- **Temperature Control**: Adjust creativity level (0.0 - 1.0)

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your Supabase project:

**Supabase Dashboard → Project Settings → Edge Functions → Secrets:**

```
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

### 2. Google Cloud Setup

1. **Create a Google Cloud Project** (if you don't have one)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Vertex AI API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Vertex AI API"
   - Click "Enable"

3. **Create a Service Account**
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "vertex-ai-service")
   - Grant role: "Vertex AI User"
   - Click "Create Key" → "JSON"
   - Download the JSON file

4. **Extract Credentials from JSON**
   - Open the downloaded JSON file
   - Copy `project_id` → `GOOGLE_PROJECT_ID`
   - Copy `client_email` → `GOOGLE_CLIENT_EMAIL`
   - Copy `private_key` → `GOOGLE_PRIVATE_KEY` (keep the `\n` characters)

### 3. Deploy Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
# Link to your project
supabase link --project-ref tpsseyzezbmfxydeaibr

# Deploy the function
supabase functions deploy generate-vertex-ai
```

### 4. Test the Studio

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/studio` in your browser

3. Try a quick start card or enter a custom prompt

## Architecture

### Frontend (`src/components/StudioDashboard.tsx`)
- React component with Modern Voyageur styling
- Handles user input and displays streaming responses
- Connects to Supabase Edge Function via fetch API

### Backend (`supabase/functions/generate-vertex-ai/index.ts`)
- Deno Edge Function
- Authenticates users via Supabase Auth
- Connects to Google Vertex AI
- Streams responses back to frontend

## Styling Details

- **Background**: Deep Void Black (#0f0f10)
- **Accents**: Prestige Gold (#FFD966)
- **Leather Texture**: Radial gradient pattern on sidebar
- **Smoked Glass**: `bg-white/5 backdrop-blur-md border border-white/10`
- **Fonts**: Inter (UI), Playfair Display (Headings)

## Troubleshooting

### "Vertex AI configuration error"
- Check that all environment variables are set in Supabase
- Verify the service account has Vertex AI User role
- Ensure the private key includes `\n` characters

### "Rate limit exceeded"
- The function limits to 20 requests per minute per user
- Wait 60 seconds before trying again

### Streaming not working
- Check browser console for errors
- Verify the Edge Function is deployed
- Ensure authentication is working

## Cost Considerations

- Vertex AI charges per token generated
- Gemini 2.0 Flash is the most cost-effective option
- Monitor usage in Google Cloud Console
- Consider implementing usage quotas

## Next Steps

1. Add project saving functionality
2. Implement library/history feature
3. Add export options for generated content
4. Implement user preferences persistence
