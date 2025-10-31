# Autonomous Code Wizard - AI That Truly Learns

## 🚀 Project Overview

An **autonomous AI coding agent** that doesn't just generate code—it learns from experience, makes independent decisions, and improves continuously without constant guidance.

**Project URL**: https://lovable.dev/projects/881d493d-8544-414c-bac0-6eb737eb05d7

## ✨ Autonomous Features

### Without Supabase (Basic Mode)
- ✅ AI-powered code generation
- ✅ Task analysis and planning
- ✅ Multi-file project generation
- ✅ GitHub integration
- ✅ Code validation
- ⚠️ **Forgets everything after each task**

### With Supabase (Autonomous Mode) 🤖
- 🧠 **Persistent Memory** - Remembers all past tasks and solutions
- 📚 **Pattern Learning** - Learns successful coding patterns over time
- 🎯 **Autonomous Decisions** - Makes independent architectural choices
- 💡 **Innovation Engine** - Finds creative solutions beyond the obvious
- 🔍 **Self-Validation** - Checks and corrects its own code
- 📈 **Continuous Improvement** - Gets smarter with every task
- 🚀 **Long-Term Projects** - Works autonomously for weeks without guidance
- 🎨 **App/Website Specialist** - Expert in building complete web applications
- 🔄 **Continuous Learning** - Self-optimizing every 5 minutes
- 📊 **15+ Expert Templates** - Pre-loaded with production-ready patterns

[**📖 Read Full Autonomous Features Guide**](./AUTONOMOUS_FEATURES.md)  
[**🚀 Setup Complete Guide**](./AUTONOMOUS_SETUP_COMPLETE.md)  
[**⚡ Integration Guide**](./INTEGRATION_GUIDE.md)

## 🎯 Quick Setup (5 Minutes)

### Essential Setup

1. **Google AI API Key** (Required)
   - Get from: https://aistudio.google.com/app/apikey
   - Enables AI code generation

2. **GitHub Token** (Optional)
   - Get from: https://github.com/settings/tokens
   - Enables repository sync

3. **Supabase Database** (Recommended - ALREADY CONFIGURED! ✅)
   - Your credentials are set in `.env`
   - **Run SQL setup**: Go to your [Supabase Dashboard](https://app.supabase.com) → SQL Editor → Run `supabase-setup.sql`
   - Enables learning, memory, and true autonomy
   - See [**📖 Setup Complete Guide**](./AUTONOMOUS_SETUP_COMPLETE.md) for details

### 🚀 Your System is Already Expert-Level!
- ✅ Environment configured with Supabase
- ✅ 15+ expert code patterns pre-loaded
- ✅ Continuous learning system active
- ✅ App/Website generation ready
- ✅ Quality validation enabled
- 🔄 Just run the SQL setup to activate database learning!

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

# Step 4: Set up environment variables
# Create .env file with your API keys:
cat > .env << EOF
# Required for AI features
VITE_GOOGLE_API_KEY=your_google_ai_key

# Optional: GitHub integration
VITE_GITHUB_TOKEN=your_github_token

# Optional: Autonomous learning (see SUPABASE_SETUP.md)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

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
- **Supabase Keys**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed guide

## 🛠️ Technologies

**Core Stack:**
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

**AI & Integration:**
- Google AI (Gemini) - Code generation
- Supabase - Autonomous memory & learning
- GitHub API - Repository sync

**Autonomous Features:**
- Pattern recognition engine
- Self-validation system
- Decision logging
- Innovation scoring
- Long-term context management

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
   - `VITE_SUPABASE_URL` (optional - enables autonomous learning)
   - `VITE_SUPABASE_ANON_KEY` (optional - enables autonomous learning)
4. Deploy

### Troubleshooting Deployment Issues

If you see errors:
- **500 error on `/api/generate`**: Missing `GOOGLE_API_KEY` in Vercel environment variables
- **Black screen**: Check browser console for errors, see `DEPLOYMENT_DEBUG.md`
- **API key errors**: Ensure both `GOOGLE_API_KEY` and `VITE_GOOGLE_API_KEY` are set

## 📚 Documentation

- **[Autonomous Setup Complete](./AUTONOMOUS_SETUP_COMPLETE.md)** - ✅ Your system is configured!
- **[Integration Guide](./INTEGRATION_GUIDE.md)** - How to use autonomous features in your code
- **[Autonomous Features Guide](./AUTONOMOUS_FEATURES.md)** - Complete feature documentation
- **[Supabase Setup Guide](./SUPABASE_SETUP.md)** - Database setup (just run the SQL!)
- **[Deployment Guide](#deploy-to-vercel-manually)** - Production deployment

## 🎮 Usage Examples

### Basic Task
```
"Build a todo app with authentication"
```
→ AI generates complete app with auth, validation, and best practices

### Autonomous App Generation (NEW!)
```typescript
import { autonomousCodeGenerator } from '@/lib/autonomousCodeGenerator';

const result = await autonomousCodeGenerator.generate({
  description: "Build a modern e-commerce store with cart and checkout",
  type: 'ecommerce'
});

console.log(`Generated ${result.files.length} files`);
console.log(`Quality Score: ${result.quality.overallScore}/100`);
```
→ Generates complete, production-ready application autonomously

### Autonomous Mode (With Supabase)
```
"Create a social media platform"
```
→ AI autonomously:
- Searches past similar projects
- Applies learned patterns
- Makes architectural decisions
- Validates security and quality
- Learns new patterns for future
- **Expert-level from day one!**

### Long-Term Project
```
Week 1: "Start SaaS platform"
Week 2: "Add team collaboration"  
Week 3: "Implement billing"
```
→ AI maintains full context, builds incrementally, makes consistent decisions

See [Integration Guide](./INTEGRATION_GUIDE.md) for more examples!

## 🚀 Autonomy Progression

- **Tasks 1-10**: Learning your preferences, building pattern library
- **Tasks 11-30**: Recognizing patterns, making better decisions
- **Tasks 31+**: High autonomy, innovative solutions, minimal guidance needed
- **Tasks 100+**: Expert level, truly autonomous coding for days

## 🤝 Contributing

Contributions welcome! This project showcases:
- Advanced AI integration patterns
- Autonomous agent architecture
- Learning system design
- Self-improving AI systems

## 📄 License

MIT License - Feel free to use and modify

## 🌟 Key Differentiators

Unlike traditional AI coding assistants:
- ✅ **Learns from experience** (not just pre-training)
- ✅ **Makes independent decisions** (not just follows prompts)
- ✅ **Improves over time** (not static)
- ✅ **Self-validates** (catches its own mistakes)
- ✅ **Innovates** (finds creative solutions)
- ✅ **Long-term capable** (works for weeks autonomously)

---

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
