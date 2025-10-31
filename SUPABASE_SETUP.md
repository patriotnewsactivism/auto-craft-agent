# Supabase Setup Guide for Autonomous Learning

## Why Supabase?

Enabling Supabase integration gives your autonomous coding bot **true long-term memory and learning capabilities**:

- 🧠 **Persistent Memory** - Remembers all tasks and solutions
- 📚 **Pattern Recognition** - Learns successful coding patterns over time
- 🎯 **Context Awareness** - Maintains project state across sessions
- 🚀 **Self-Improvement** - Gets better with each task
- 💡 **Innovative Solutions** - References past successes for creative problem-solving

Without Supabase, the bot is functional but **forgets everything** after each task. With Supabase, it becomes truly autonomous and continuously improving!

## Quick Start (5 minutes)

### 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Project name (e.g., "autonomous-code-wizard")
   - Database password (save this!)
   - Region (choose closest to you)
4. Wait 2 minutes for project to initialize

### 2. Create Database Tables

Go to your project → SQL Editor → New Query, and run this SQL:

```sql
-- Task History: Stores all completed tasks and learnings
CREATE TABLE task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_description TEXT NOT NULL,
  complexity TEXT NOT NULL,
  steps_taken TEXT[] NOT NULL,
  files_generated TEXT[] NOT NULL,
  success BOOLEAN NOT NULL,
  patterns_learned TEXT[] NOT NULL,
  innovation_score DECIMAL(3,2) NOT NULL,
  execution_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Code Patterns: Stores learned coding patterns
CREATE TABLE code_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  use_cases TEXT[] NOT NULL,
  code_template TEXT NOT NULL,
  success_rate DECIMAL(3,2) NOT NULL,
  times_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Contexts: Long-term project memory
CREATE TABLE project_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  current_phase TEXT NOT NULL,
  tech_stack TEXT[] NOT NULL,
  file_structure JSONB,
  next_steps TEXT[] NOT NULL,
  learnings TEXT[] NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Decision Logs: Tracks AI reasoning
CREATE TABLE decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  decision_point TEXT NOT NULL,
  options_considered TEXT[] NOT NULL,
  chosen_option TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  outcome_success BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable full-text search (helps AI find similar tasks)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for performance
CREATE INDEX idx_task_description ON task_history USING gin (task_description gin_trgm_ops);
CREATE INDEX idx_pattern_type ON code_patterns (pattern_type);
CREATE INDEX idx_project_name ON project_contexts (project_name);
CREATE INDEX idx_decision_task ON decision_logs (task_id);
```

### 3. Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with: `eyJhbG...`)

### 4. Configure Your App

#### Option A: Environment Variables (Recommended for Production)

Create a `.env` file in your project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Option B: Settings Dialog (Quick Testing)

1. Open your app
2. Click "Configure API Keys"
3. Scroll to "Supabase - Autonomous Memory" section
4. Paste your Project URL and Anon Key
5. Click "Save Keys" and **reload the page**

## Verifying It Works

Once configured, you should see:

1. ✅ "Learning Active" badge in the Autonomous Intelligence panel
2. 📊 Autonomous insights showing success rates and patterns
3. 🧠 "Autonomous learning ENABLED" in the thinking panel when executing tasks

## What Happens Next?

As you use the bot:

- **First Task**: Limited memory, baseline performance
- **After 5 Tasks**: Starts recognizing patterns, slight improvements
- **After 20 Tasks**: Noticeable autonomous behavior, suggests innovations
- **After 50+ Tasks**: Highly autonomous, consistently innovative, minimal guidance needed

The AI will:
- 🔍 Search for similar past tasks before starting
- 🎓 Apply proven patterns automatically
- 💾 Save new learnings after each task
- 📈 Track and improve its innovation score
- 🤖 Make increasingly better autonomous decisions

## Security Notes

- ✅ The anon key is **safe for public use** (it's meant to be in frontend code)
- ✅ Supabase Row Level Security protects your data
- ✅ Keys are stored in localStorage or environment variables
- ⚠️ Don't share your **service_role** key (not used by this app)

## Troubleshooting

### "Learning Disabled" showing even after setup

- **Reload the page** after saving keys
- Check browser console for connection errors
- Verify your keys are correct in Settings

### Tables not created

- Make sure you ran the entire SQL script
- Check for error messages in SQL Editor
- Try running each CREATE TABLE separately

### Connection errors

- Verify your Supabase project is active (not paused)
- Check that the URL is correct (no trailing slash)
- Ensure the anon key is the full value (very long)

## Advanced: Production Deployment

For Vercel/Netlify/etc:

1. Add environment variables in your deployment platform:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. Redeploy your app

3. The bot will automatically use these values

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Dashboard: https://app.supabase.com
- Check browser console for detailed error messages

---

## What's Next?

Once Supabase is configured, explore these autonomous features:

- **Similar Task Search**: AI finds and learns from past similar tasks
- **Pattern Library**: View learned coding patterns in Supabase dashboard
- **Decision History**: See how AI makes autonomous choices
- **Innovation Tracking**: Monitor how creative solutions evolve over time

The more you use it, the smarter it becomes! 🚀
