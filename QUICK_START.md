# 🚀 Quick Start Guide - Autonomous Code Wizard

## Get Running in 5 Minutes

### Step 1: Clone and Install (2 min)

```bash
git clone <your-repo-url>
cd <project-name>
npm install
```

### Step 2: Get Google AI Key (1 min)

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 3: Configure (1 min)

Create `.env` file:

```bash
VITE_GOOGLE_API_KEY=AIzaSy...your_key_here
```

### Step 4: Run (30 seconds)

```bash
npm run dev
```

Open http://localhost:5173 🎉

---

## First Task

Try this in the app:

```
Build a todo app with TypeScript and React
```

Watch the AI:
- Analyze the task
- Plan the steps
- Generate all files
- Validate the code
- Provide quality reports

---

## Optional: Enable Autonomous Learning (+ 5 min)

Want the AI to **learn and improve**?

### Quick Supabase Setup

1. **Create Account**: Go to https://app.supabase.com
2. **New Project**: Name it "code-wizard", set password, wait 2 min
3. **Run SQL**: Go to SQL Editor, paste this:

```sql
-- Copy full SQL from SUPABASE_SETUP.md
-- Or use this quick version:

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
```

4. **Get Keys**: Settings → API
   - Copy "Project URL"
   - Copy "anon public" key

5. **Update .env**:

```bash
VITE_GOOGLE_API_KEY=your_google_key
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

6. **Restart app** and reload page

Now you'll see: ✅ **"Learning Active"** badge!

---

## What to Try Next

### Test Autonomous Learning

Run these tasks in order and watch the AI learn:

**Task 1:**
```
Create a simple REST API with Express
```

**Task 2:**
```
Add authentication to the API
```

**Task 3:** (AI will remember Tasks 1 & 2!)
```
Create another REST API with auth
```

Notice: Task 3 will be **faster and better** because AI learned from Tasks 1 & 2!

### Try Innovation

```
Build a modern real-time chat app
```

With learning enabled, AI will:
- Search for similar past projects
- Apply proven patterns
- Suggest innovative features (WebSockets, presence, typing indicators)
- Validate security automatically
- Learn new patterns for future

### Long-Term Project

```
Day 1: "Start a SaaS platform with auth and subscriptions"
Day 2: "Add team collaboration features"
Day 3: "Implement admin dashboard"
```

AI maintains context across days!

---

## Troubleshooting

### "API Key Required" error
- Check `.env` file exists in project root
- Verify key starts with `AIza`
- Restart dev server after creating .env

### "Learning Disabled" showing
- Verify Supabase keys in `.env`
- Reload the page after saving keys
- Check browser console for connection errors

### Code generation fails
- Verify Google AI key is valid
- Check internet connection
- Look at browser console for detailed errors

### Supabase connection issues
- Confirm project is active (not paused) at app.supabase.com
- Verify URL has no trailing slash
- Ensure anon key is complete (very long string)

---

## Next Steps

1. ✅ **Read**: [AUTONOMOUS_FEATURES.md](./AUTONOMOUS_FEATURES.md) - Full feature guide
2. ✅ **Setup**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Detailed Supabase guide  
3. ✅ **Experiment**: Run 10-20 diverse tasks to build the pattern library
4. ✅ **Watch**: See innovation scores and success rates improve!

---

## Key Features to Explore

### Without Supabase
- ✅ AI code generation
- ✅ Multi-file projects
- ✅ Quality validation
- ✅ GitHub sync

### With Supabase
- 🧠 AI learns from every task
- 📚 Builds pattern library
- 🎯 Makes autonomous decisions
- 💡 Suggests innovations
- 📈 Improves continuously
- 🚀 Works long-term autonomously

---

## Production Deployment

### Vercel (Easiest)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   ```
   GOOGLE_API_KEY=your_key
   VITE_GOOGLE_API_KEY=your_key
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Deploy!

---

## Support

- 📖 Full docs: [README.md](./README.md)
- 🤖 Features: [AUTONOMOUS_FEATURES.md](./AUTONOMOUS_FEATURES.md)
- 🗄️ Database: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- 💬 Issues: GitHub Issues

---

**That's it! You're ready to experience truly autonomous AI coding!** 🚀

The more you use it with Supabase enabled, the smarter it becomes. Have fun! 🎉
