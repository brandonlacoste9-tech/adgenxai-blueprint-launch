# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/015f3ccc-efb7-4caa-9fff-2231ffd23dcb

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/015f3ccc-efb7-4caa-9fff-2231ffd23dcb) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/015f3ccc-efb7-4caa-9fff-2231ffd23dcb) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Colony OS system summary

Need the fast, business-mode overview of BeeHive, FoundryAI, AdGenAI, and the Codex governance stack? Read the [Colony OS - System Summary (Codex Briefing Mode)](docs/colony-os-master-summary.md) for the end-to-end briefing.

Preparing Claude (or any design agent) to render the OrbitalProp Neurosphere? Use the [Neurosphere Visualization Briefing](docs/neurosphere-visual-briefing.md) for the validated prompt packet.

## Deployment checklist (AdGenXAI)

1) Set env vars on your host (Vercel/Lovable):
   - `VITE_SUPABASE_URL` = https://<your-project>.supabase.co
   - `VITE_SUPABASE_PROJECT_ID` = <your-project-id>
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = <your-anon-key>
2) `npm install`
3) `npm run lint` (should be clean)
4) `npm run build` (verified locally)
5) Publish/share in Lovable or push to trigger CI.

### Vercel hydration checklist

- The included `vercel.json` uses `@vercel/static-build` and rewrites every route to `index.html` so the Vite bundle hydrates on every path (no static HTML fallbacks).
- Before pushing, run `npm run build && npm run preview -- --host 0.0.0.0 --port 4173` to mimic the production artifact and confirm click handlers still fire against the built output.
- After deploying, verify the production HTML references hashed assets under `/assets/` (no `/src/main.tsx` in network logs) and that the CSP header mirrors the in-page meta tag.

## Analytics and CSP

- Set `VITE_GA_MEASUREMENT_ID` in your deployment environment (Vercel project settings) to enable the official Google Analytics `gtag.js` loader. When present, the app will automatically inject the external tag and configure page tracking.
- The bundled `vercel.json` and the root `index.html` add a CSP that permits Google Analytics while keeping other sources restricted. If you override headers elsewhere, include at least:
  - `script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com` (and mirror the same allowlist on `script-src-elem`)
  - `connect-src 'self' https://www.google-analytics.com`
  - `img-src 'self' data: https://www.google-analytics.com`
  - `frame-src 'self' https://www.googletagmanager.com`

This keeps analytics working without weakening the baseline CSP.

## Notes

- `.env` is not tracked; use `.env.example` as a template.
- Tailwind config uses ESM import for `tailwindcss-animate`.
- Lint-only Fast Refresh warnings were resolved.
