# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/881d493d-8544-414c-bac0-6eb737eb05d7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/881d493d-8544-414c-bac0-6eb737eb05d7) and start prompting.

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

# Step 4: Set up environment variables (required for AI features)
cp .env.example .env
# Then edit .env and add your API keys:
# - VITE_GOOGLE_API_KEY: Get from https://aistudio.google.com/app/apikey
# - VITE_GITHUB_TOKEN: Get from https://github.com/settings/tokens (needs repo scope)

# Step 5: Start the development server with auto-reloading and an instant preview.
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

## Configuration

### Environment Variables

This app requires API keys to function. You can provide them in different ways depending on your environment:

#### Local Development

1. **Environment Variables (Recommended)**
   - Create a `.env` file in the project root (copy from `.env.example`)
   - Add your keys with the `VITE_` prefix:
     ```
     VITE_GOOGLE_API_KEY=your_key_here
     VITE_GITHUB_TOKEN=your_token_here
     ```

2. **Settings Dialog (For quick testing)**
   - Click "Configure API Keys" in the app
   - Enter your keys (stored in browser localStorage)

**Note:** Environment variables take precedence over localStorage.

#### Vercel/Production Deployment

**IMPORTANT:** When deploying to Vercel, you need to set environment variables in your Vercel project settings:

1. Go to your Vercel project → Settings → Environment Variables
2. Add the following variables:
   - `GOOGLE_API_KEY` - Your Google AI API key (for server-side API)
   - `VITE_GOOGLE_API_KEY` - Same value (for client-side)
   - `VITE_GITHUB_TOKEN` - Your GitHub token (optional, for GitHub integration)

**Why two GOOGLE_API_KEY variables?**
- `GOOGLE_API_KEY` (no prefix) is used by the Vercel serverless function (`/api/generate`)
- `VITE_GOOGLE_API_KEY` (with prefix) is used by the Vite frontend build

### Getting API Keys

- **Google AI API Key**: https://aistudio.google.com/app/apikey
- **GitHub Token**: https://github.com/settings/tokens (needs `repo` scope)

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Google AI (Gemini)
- GitHub API

## How can I deploy this project?

### Deploy via Lovable (Easiest)

Simply open [Lovable](https://lovable.dev/projects/881d493d-8544-414c-bac0-6eb737eb05d7) and click on Share -> Publish.

### Deploy to Vercel Manually

1. Push your code to GitHub
2. Import the repository in Vercel
3. **IMPORTANT:** Set environment variables in Vercel:
   - `GOOGLE_API_KEY` (for API endpoint)
   - `VITE_GOOGLE_API_KEY` (for frontend)
   - `VITE_GITHUB_TOKEN` (optional)
4. Deploy

### Troubleshooting Deployment Issues

If you see errors:
- **500 error on `/api/generate`**: Missing `GOOGLE_API_KEY` in Vercel environment variables
- **Black screen**: Check browser console for errors, see `DEPLOYMENT_DEBUG.md`
- **API key errors**: Ensure both `GOOGLE_API_KEY` and `VITE_GOOGLE_API_KEY` are set

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
