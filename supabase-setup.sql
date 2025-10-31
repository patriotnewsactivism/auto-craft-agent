-- ============================================
-- AUTONOMOUS AI CODING SYSTEM - DATABASE SETUP
-- ============================================
-- This SQL script sets up the complete database schema
-- for an autonomous AI that learns and improves over time
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text similarity search

-- ============================================
-- TABLE 1: TASK HISTORY
-- Stores all completed tasks and their outcomes
-- ============================================
CREATE TABLE IF NOT EXISTS task_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_description TEXT NOT NULL,
  complexity TEXT NOT NULL CHECK (complexity IN ('low', 'medium', 'high', 'simple', 'moderate', 'complex', 'enterprise')),
  steps_taken TEXT[] NOT NULL DEFAULT '{}',
  files_generated TEXT[] NOT NULL DEFAULT '{}',
  success BOOLEAN NOT NULL DEFAULT true,
  patterns_learned TEXT[] NOT NULL DEFAULT '{}',
  innovation_score DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (innovation_score >= 0 AND innovation_score <= 1),
  execution_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_description_trgm ON task_history USING gin (task_description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_task_success ON task_history (success);
CREATE INDEX IF NOT EXISTS idx_task_created_at ON task_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_complexity ON task_history (complexity);
CREATE INDEX IF NOT EXISTS idx_task_innovation ON task_history (innovation_score DESC);

-- ============================================
-- TABLE 2: CODE PATTERNS
-- Stores learned coding patterns and their success rates
-- ============================================
CREATE TABLE IF NOT EXISTS code_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  use_cases TEXT[] NOT NULL DEFAULT '{}',
  code_template TEXT NOT NULL,
  success_rate DECIMAL(3,2) NOT NULL DEFAULT 0.9 CHECK (success_rate >= 0 AND success_rate <= 1),
  times_used INTEGER NOT NULL DEFAULT 1,
  category TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pattern_type ON code_patterns (pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_success ON code_patterns (success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_times_used ON code_patterns (times_used DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_category ON code_patterns (category);
CREATE INDEX IF NOT EXISTS idx_pattern_tags ON code_patterns USING gin (tags);

-- ============================================
-- TABLE 3: PROJECT CONTEXTS
-- Long-term project memory and state
-- ============================================
CREATE TABLE IF NOT EXISTS project_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  current_phase TEXT NOT NULL DEFAULT 'planning',
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  file_structure JSONB DEFAULT '{}'::jsonb,
  next_steps TEXT[] NOT NULL DEFAULT '{}',
  learnings TEXT[] NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_name ON project_contexts (project_name);
CREATE INDEX IF NOT EXISTS idx_project_status ON project_contexts (status);
CREATE INDEX IF NOT EXISTS idx_project_updated_at ON project_contexts (updated_at DESC);

-- ============================================
-- TABLE 4: DECISION LOGS
-- Tracks AI reasoning and autonomous decisions
-- ============================================
CREATE TABLE IF NOT EXISTS decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  decision_point TEXT NOT NULL,
  options_considered TEXT[] NOT NULL,
  chosen_option TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  outcome_success BOOLEAN NOT NULL DEFAULT true,
  confidence_score DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_decision_task_id ON decision_logs (task_id);
CREATE INDEX IF NOT EXISTS idx_decision_outcome ON decision_logs (outcome_success);
CREATE INDEX IF NOT EXISTS idx_decision_created_at ON decision_logs (created_at DESC);

-- ============================================
-- TABLE 5: LEARNING INSIGHTS
-- Stores meta-learning insights for continuous improvement
-- ============================================
CREATE TABLE IF NOT EXISTS learning_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern', 'improvement', 'innovation', 'warning')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  actionable BOOLEAN NOT NULL DEFAULT true,
  implementation TEXT,
  applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insight_type ON learning_insights (insight_type);
CREATE INDEX IF NOT EXISTS idx_insight_actionable ON learning_insights (actionable);
CREATE INDEX IF NOT EXISTS idx_insight_applied ON learning_insights (applied);

-- ============================================
-- SEED DATA: EXPERT-LEVEL PATTERNS
-- Pre-load the system with expert knowledge
-- ============================================

-- React Component Patterns
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Modern React Component',
  'component',
  ARRAY['UI components', 'reusable widgets', 'interactive elements'],
  'import React from ''react''; interface Props { className?: string; } export const Component: React.FC<Props> = ({ className }) => { return <div className={className}>{/* content */}</div>; };',
  0.95,
  0,
  'react',
  ARRAY['react', 'component', 'typescript']
),
(
  'Data Fetching Hook',
  'hook',
  ARRAY['API calls', 'data loading', 'async operations'],
  'export function useAsync<T>(fn: () => Promise<T>) { const [state, setState] = useState({ data: null, loading: true, error: null }); useEffect(() => { fn().then(data => setState({ data, loading: false, error: null })).catch(error => setState({ data: null, loading: false, error })); }, []); return state; }',
  0.92,
  0,
  'react',
  ARRAY['react', 'hook', 'async', 'data-fetching']
),
(
  'Form with Validation',
  'form',
  ARRAY['user input', 'data submission', 'validation'],
  'const form = useForm({ resolver: zodResolver(schema) }); return <form onSubmit={form.handleSubmit(onSubmit)}>{/* fields */}</form>;',
  0.93,
  0,
  'react',
  ARRAY['react', 'form', 'validation', 'zod']
);

-- API & Backend Patterns
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Type-Safe API Client',
  'api',
  ARRAY['REST API', 'HTTP requests', 'data fetching'],
  'class ApiClient { async request<T>(method: string, endpoint: string, data?: any): Promise<T> { const response = await fetch(endpoint, { method, body: data ? JSON.stringify(data) : undefined }); if (!response.ok) throw new Error(response.statusText); return response.json(); } }',
  0.94,
  0,
  'api',
  ARRAY['api', 'http', 'typescript', 'client']
),
(
  'API Route Handler',
  'api',
  ARRAY['server endpoints', 'request handling'],
  'export async function handler(req: Request) { try { const data = await req.json(); // process return new Response(JSON.stringify(result), { status: 200 }); } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500 }); } }',
  0.91,
  0,
  'api',
  ARRAY['api', 'handler', 'error-handling']
);

-- State Management
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Zustand Store',
  'state-management',
  ARRAY['global state', 'app state', 'state management'],
  'import { create } from ''zustand''; interface State { data: any; setData: (data: any) => void; } export const useStore = create<State>((set) => ({ data: null, setData: (data) => set({ data }) }));',
  0.96,
  0,
  'state',
  ARRAY['zustand', 'state', 'store']
),
(
  'Context Provider',
  'state-management',
  ARRAY['context sharing', 'prop drilling solution'],
  'const Context = createContext(null); export const Provider = ({ children }) => { const [state, setState] = useState(null); return <Context.Provider value={{ state, setState }}>{children}</Context.Provider>; };',
  0.89,
  0,
  'state',
  ARRAY['react', 'context', 'provider']
);

-- Database & Supabase Patterns
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Supabase Query',
  'database',
  ARRAY['data fetching', 'CRUD operations'],
  'const { data, error } = await supabase.from(''table'').select(''*'').eq(''column'', value);',
  0.97,
  0,
  'database',
  ARRAY['supabase', 'query', 'database']
),
(
  'Supabase Real-time Subscription',
  'database',
  ARRAY['live updates', 'real-time data'],
  'const subscription = supabase.channel(''table'').on(''postgres_changes'', { event: ''*'', schema: ''public'', table: ''table'' }, (payload) => { console.log(payload); }).subscribe();',
  0.94,
  0,
  'database',
  ARRAY['supabase', 'realtime', 'subscription']
);

-- Authentication Patterns
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Protected Route',
  'authentication',
  ARRAY['route protection', 'authentication guard'],
  'export const ProtectedRoute = ({ children }) => { const { isAuthenticated } = useAuth(); if (!isAuthenticated) return <Navigate to="/login" />; return children; };',
  0.95,
  0,
  'auth',
  ARRAY['authentication', 'route', 'guard']
),
(
  'Auth Context',
  'authentication',
  ARRAY['user authentication', 'session management'],
  'const AuthContext = createContext(null); export const AuthProvider = ({ children }) => { const [user, setUser] = useState(null); const login = async (credentials) => { /* auth logic */ }; const logout = async () => { /* logout logic */ }; return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>; };',
  0.93,
  0,
  'auth',
  ARRAY['authentication', 'context', 'session']
);

-- UI/UX Patterns
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Responsive Layout',
  'layout',
  ARRAY['page layouts', 'responsive design'],
  '<div className="container mx-auto px-4"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{/* content */}</div></div>',
  0.96,
  0,
  'ui',
  ARRAY['layout', 'responsive', 'tailwind']
),
(
  'Modal Dialog',
  'component',
  ARRAY['dialogs', 'popups', 'overlays'],
  'import { Dialog, DialogContent, DialogHeader, DialogTitle } from ''@/components/ui/dialog''; export const Modal = ({ open, onClose, title, children }) => { return <Dialog open={open} onOpenChange={onClose}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>{children}</DialogContent></Dialog>; };',
  0.94,
  0,
  'ui',
  ARRAY['dialog', 'modal', 'ui']
);

-- Performance & Optimization
INSERT INTO code_patterns (pattern_name, pattern_type, use_cases, code_template, success_rate, times_used, category, tags) VALUES
(
  'Debounce Utility',
  'utility',
  ARRAY['search optimization', 'input handling'],
  'export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) { let timeout: NodeJS.Timeout; return (...args: Parameters<T>) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); }; }',
  0.95,
  0,
  'optimization',
  ARRAY['debounce', 'performance', 'utility']
),
(
  'Lazy Component Loading',
  'optimization',
  ARRAY['code splitting', 'performance'],
  'const Component = lazy(() => import(''./Component'')); export const App = () => <Suspense fallback={<div>Loading...</div>}><Component /></Suspense>;',
  0.93,
  0,
  'optimization',
  ARRAY['lazy', 'suspense', 'code-splitting']
);

-- ============================================
-- SEED DATA: INITIAL LEARNING INSIGHTS
-- ============================================

INSERT INTO learning_insights (insight_type, title, description, confidence, actionable, implementation) VALUES
(
  'pattern',
  'React Hooks over Class Components',
  'Modern React development favors functional components with hooks for better performance and cleaner code',
  0.98,
  true,
  'Use functional components with useState, useEffect, and custom hooks'
),
(
  'pattern',
  'TypeScript for Type Safety',
  'TypeScript reduces bugs by 15-30% and improves developer experience with autocomplete',
  0.95,
  true,
  'Use TypeScript for all new projects with strict mode enabled'
),
(
  'innovation',
  'Server Components for Performance',
  'React Server Components reduce client bundle size and improve initial page load',
  0.85,
  true,
  'Consider using Next.js App Router with Server Components for data-heavy apps'
),
(
  'improvement',
  'Error Boundaries for Better UX',
  'Implement error boundaries to gracefully handle component errors',
  0.92,
  true,
  'Wrap route components in error boundaries with fallback UI'
),
(
  'warning',
  'Avoid Prop Drilling',
  'Deep prop drilling leads to maintenance issues; use Context or state management',
  0.90,
  true,
  'Use React Context or Zustand for state that needs to be accessed by many components'
);

-- ============================================
-- SEED DATA: SAMPLE PROJECT CONTEXTS
-- ============================================

INSERT INTO project_contexts (project_name, description, current_phase, tech_stack, next_steps, learnings, status) VALUES
(
  'example-dashboard',
  'Admin dashboard with analytics and user management',
  'completed',
  ARRAY['React', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Recharts'],
  ARRAY['Add real-time updates', 'Implement notifications', 'Add export functionality'],
  ARRAY['Component composition patterns work well', 'Chart libraries need careful memoization', 'Table virtualization improves performance'],
  'completed'
),
(
  'example-ecommerce',
  'E-commerce platform with cart and checkout',
  'completed',
  ARRAY['React', 'TypeScript', 'Stripe', 'Supabase', 'Zustand'],
  ARRAY['Add product reviews', 'Implement wishlist', 'Add email notifications'],
  ARRAY['State management crucial for cart', 'Payment integration requires careful error handling', 'Image optimization is essential'],
  'completed'
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for code_patterns
DROP TRIGGER IF EXISTS update_code_patterns_updated_at ON code_patterns;
CREATE TRIGGER update_code_patterns_updated_at
    BEFORE UPDATE ON code_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for project_contexts
DROP TRIGGER IF EXISTS update_project_contexts_updated_at ON project_contexts;
CREATE TRIGGER update_project_contexts_updated_at
    BEFORE UPDATE ON project_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Success rate by complexity
CREATE OR REPLACE VIEW task_success_by_complexity AS
SELECT 
  complexity,
  COUNT(*) as total_tasks,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_tasks,
  ROUND(AVG(CASE WHEN success THEN 1 ELSE 0 END)::numeric, 2) as success_rate,
  ROUND(AVG(innovation_score)::numeric, 2) as avg_innovation,
  ROUND(AVG(execution_time)::numeric, 0) as avg_execution_time
FROM task_history
GROUP BY complexity;

-- View: Top performing patterns
CREATE OR REPLACE VIEW top_patterns AS
SELECT 
  pattern_name,
  pattern_type,
  category,
  success_rate,
  times_used,
  ROUND((success_rate * times_used)::numeric, 2) as effectiveness_score
FROM code_patterns
WHERE times_used > 0
ORDER BY effectiveness_score DESC
LIMIT 20;

-- View: Recent learning progress
CREATE OR REPLACE VIEW learning_progress AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as tasks_completed,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_tasks,
  ROUND(AVG(innovation_score)::numeric, 2) as avg_innovation,
  ROUND(AVG(execution_time)::numeric, 0) as avg_time
FROM task_history
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get similar tasks (for learning from past)
CREATE OR REPLACE FUNCTION get_similar_tasks(search_text TEXT, max_results INT DEFAULT 5)
RETURNS TABLE (
  id UUID,
  task_description TEXT,
  similarity REAL,
  success BOOLEAN,
  patterns_learned TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    th.id,
    th.task_description,
    similarity(th.task_description, search_text) as similarity,
    th.success,
    th.patterns_learned
  FROM task_history th
  WHERE similarity(th.task_description, search_text) > 0.3
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Verify setup
DO $$
DECLARE
  pattern_count INT;
  insight_count INT;
BEGIN
  SELECT COUNT(*) INTO pattern_count FROM code_patterns;
  SELECT COUNT(*) INTO insight_count FROM learning_insights;
  
  RAISE NOTICE '✅ Database setup complete!';
  RAISE NOTICE '📊 Tables created: 5';
  RAISE NOTICE '🎯 Expert patterns loaded: %', pattern_count;
  RAISE NOTICE '💡 Learning insights: %', insight_count;
  RAISE NOTICE '🚀 System ready for autonomous coding!';
END $$;
