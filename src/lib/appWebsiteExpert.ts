import { AIService } from './aiService';
import { supabaseService, CodePattern } from './supabaseService';

/**
 * Expert-level autonomous system specifically for building apps and websites
 * Specializes in:
 * - Full-stack web applications
 * - Modern responsive websites
 * - Progressive Web Apps (PWAs)
 * - Single Page Applications (SPAs)
 * - Dashboard and admin panels
 * - E-commerce platforms
 * - Social media applications
 * - Real-time applications
 */

export interface AppWebsiteProject {
  name: string;
  type: 'web-app' | 'website' | 'dashboard' | 'ecommerce' | 'social' | 'saas' | 'portfolio' | 'blog';
  description: string;
  features: string[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    apis: string[];
  };
  architecture: string;
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
}

export interface GenerationPlan {
  phases: Phase[];
  totalEstimatedTime: number;
  innovativeFeatures: string[];
  bestPractices: string[];
}

export interface Phase {
  name: string;
  description: string;
  tasks: Task[];
  estimatedTime: number;
}

export interface Task {
  description: string;
  files: string[];
  dependencies: string[];
  autonomousDecisions: string[];
}

export class AppWebsiteExpert {
  private aiService: AIService;
  private expertPatterns: Map<string, CodePattern[]> = new Map();

  constructor() {
    this.aiService = new AIService();
    this.loadExpertPatterns();
  }

  /**
   * Load expert-level patterns for immediate use
   */
  private async loadExpertPatterns(): Promise<void> {
    // Pre-loaded expert patterns that don't require database
    const expertTemplates: CodePattern[] = [
      {
        pattern_name: 'Modern React Component with TypeScript',
        pattern_type: 'component',
        use_cases: ['UI components', 'reusable widgets', 'interactive elements'],
        code_template: `import React from 'react';\nimport { cn } from '@/lib/utils';\n\ninterface Props {\n  className?: string;\n  children?: React.ReactNode;\n}\n\nexport const Component: React.FC<Props> = ({ className, children }) => {\n  return (\n    <div className={cn('base-styles', className)}>\n      {children}\n    </div>\n  );\n};`,
        success_rate: 0.95,
        times_used: 0
      },
      {
        pattern_name: 'Custom React Hook',
        pattern_type: 'hook',
        use_cases: ['state management', 'side effects', 'data fetching'],
        code_template: `import { useState, useEffect } from 'react';\n\nexport const useCustomHook = (param: string) => {\n  const [state, setState] = useState<T | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    // Implementation\n  }, [param]);\n\n  return { state, loading, error };\n};`,
        success_rate: 0.92,
        times_used: 0
      },
      {
        pattern_name: 'API Route Handler',
        pattern_type: 'api',
        use_cases: ['REST endpoints', 'data processing', 'authentication'],
        code_template: `export async function handler(req: Request) {\n  try {\n    // Validate input\n    // Process request\n    return new Response(JSON.stringify(data), {\n      status: 200,\n      headers: { 'Content-Type': 'application/json' }\n    });\n  } catch (error) {\n    return new Response(JSON.stringify({ error: error.message }), {\n      status: 500,\n      headers: { 'Content-Type': 'application/json' }\n    });\n  }\n}`,
        success_rate: 0.94,
        times_used: 0
      },
      {
        pattern_name: 'Responsive Layout Pattern',
        pattern_type: 'layout',
        use_cases: ['page layouts', 'responsive design', 'grid systems'],
        code_template: `<div className="container mx-auto px-4">\n  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">\n    {/* Content */}\n  </div>\n</div>`,
        success_rate: 0.96,
        times_used: 0
      },
      {
        pattern_name: 'Form with Validation',
        pattern_type: 'form',
        use_cases: ['user input', 'data submission', 'validation'],
        code_template: `import { useForm } from 'react-hook-form';\nimport { zodResolver } from '@hookform/resolvers/zod';\nimport * as z from 'zod';\n\nconst schema = z.object({\n  field: z.string().min(1, 'Required')\n});\n\nexport const Form = () => {\n  const form = useForm({\n    resolver: zodResolver(schema)\n  });\n\n  const onSubmit = async (data) => {\n    // Handle submission\n  };\n\n  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* Fields */}</form>;\n};`,
        success_rate: 0.93,
        times_used: 0
      }
    ];

    for (const pattern of expertTemplates) {
      const type = pattern.pattern_type;
      if (!this.expertPatterns.has(type)) {
        this.expertPatterns.set(type, []);
      }
      this.expertPatterns.get(type)!.push(pattern);
    }

    // Also load from database if available
    try {
      const dbPatterns = await supabaseService.getCodePatterns();
      for (const pattern of dbPatterns) {
        if (!this.expertPatterns.has(pattern.pattern_type)) {
          this.expertPatterns.set(pattern.pattern_type, []);
        }
        this.expertPatterns.get(pattern.pattern_type)!.push(pattern);
      }
    } catch (error) {
      console.log('Database patterns not available, using built-in expert patterns only');
    }
  }

  /**
   * Analyzes a project description and creates a comprehensive plan
   */
  async analyzeProject(description: string): Promise<AppWebsiteProject> {
    const prompt = `You are an EXPERT full-stack developer and architect with 10+ years of experience building modern web applications.

Project Description: ${description}

Analyze this project and determine:
1. What type of application is this?
2. What are the core features needed?
3. What is the optimal tech stack?
4. What is the architectural approach?
5. What is the complexity level?

Apply your EXPERT knowledge of:
- React, Vue, Angular, Next.js, Remix
- Node.js, Express, Fastify
- PostgreSQL, MongoDB, Redis, Supabase
- REST APIs, GraphQL, WebSockets
- Authentication (JWT, OAuth, Auth0)
- Cloud deployment (Vercel, Netlify, AWS)
- Modern UI libraries (Tailwind, shadcn/ui, Material-UI)
- State management (Redux, Zustand, React Query)
- TypeScript best practices

Return ONLY a JSON object:
{
  "name": "project-name",
  "type": "web-app|website|dashboard|ecommerce|social|saas|portfolio|blog",
  "description": "clear project description",
  "features": ["feature 1", "feature 2", ...],
  "techStack": {
    "frontend": ["React", "TypeScript", "Tailwind CSS", ...],
    "backend": ["Node.js", "Express", ...],
    "database": ["PostgreSQL", "Redis", ...],
    "apis": ["REST API", "authentication", ...]
  },
  "architecture": "architecture pattern (e.g., 'MVC', 'Component-based', 'Microservices')",
  "complexity": "simple|moderate|complex|enterprise"
}`;

    const response = await this.aiService.generateCode(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to analyze project');
    
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Creates a comprehensive generation plan with autonomous execution steps
   */
  async createGenerationPlan(project: AppWebsiteProject): Promise<GenerationPlan> {
    const prompt = `You are an EXPERT project planner and architect for building ${project.type} applications.

Project: ${project.name}
Description: ${project.description}
Features: ${project.features.join(', ')}
Tech Stack: ${JSON.stringify(project.techStack)}
Complexity: ${project.complexity}

Create a COMPREHENSIVE, DETAILED plan for building this application autonomously.

The plan should include:
1. **Setup Phase**: Project initialization, dependencies, configuration
2. **Core Architecture Phase**: Base structure, routing, state management
3. **Feature Implementation Phase**: All main features, one by one
4. **Integration Phase**: API connections, database, authentication
5. **UI/UX Phase**: Styling, responsive design, animations
6. **Testing Phase**: Unit tests, integration tests, E2E tests
7. **Optimization Phase**: Performance, SEO, accessibility
8. **Deployment Phase**: Build configuration, deployment setup

For each phase, break down into specific tasks with:
- Exact files to create/modify
- Dependencies between tasks
- Autonomous decisions that need to be made

Return ONLY a JSON object:
{
  "phases": [
    {
      "name": "Phase Name",
      "description": "What this phase accomplishes",
      "tasks": [
        {
          "description": "Specific task description",
          "files": ["path/to/file1.tsx", "path/to/file2.ts"],
          "dependencies": ["task that must complete first"],
          "autonomousDecisions": ["decisions AI will make independently"]
        }
      ],
      "estimatedTime": 30
    }
  ],
  "totalEstimatedTime": 240,
  "innovativeFeatures": ["unique features to implement"],
  "bestPractices": ["best practices to follow"]
}`;

    const response = await this.aiService.generateCode(prompt);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to create plan');
    
    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generates a complete file with expert-level code
   */
  async generateExpertFile(
    filePath: string,
    purpose: string,
    context: string,
    project: AppWebsiteProject
  ): Promise<string> {
    // Get relevant patterns
    const fileType = this.determineFileType(filePath);
    const patterns = this.expertPatterns.get(fileType) || [];
    
    const patternContext = patterns.length > 0
      ? `\n\nExpert Patterns to Apply:\n${patterns.map(p => 
          `${p.pattern_name}:\n${p.code_template}`
        ).join('\n\n')}`
      : '';

    const prompt = `You are an EXPERT senior developer with 10+ years of experience.

Project: ${project.name} (${project.type})
Tech Stack: ${JSON.stringify(project.techStack)}

File: ${filePath}
Purpose: ${purpose}
Context: ${context}
${patternContext}

Generate PRODUCTION-READY, EXPERT-LEVEL code with:

✅ **Best Practices**:
- SOLID principles
- DRY (Don't Repeat Yourself)
- Clean Code principles
- Proper separation of concerns
- Industry-standard naming conventions

✅ **Modern Patterns**:
- Latest React patterns (hooks, composition)
- TypeScript best practices
- Functional programming where appropriate
- Performance optimization
- Error boundaries and error handling

✅ **Code Quality**:
- Full TypeScript typing
- Comprehensive error handling
- Input validation
- Security best practices
- Accessible components (ARIA, semantic HTML)
- Responsive design
- Loading and error states

✅ **Documentation**:
- Clear comments for complex logic
- JSDoc for public APIs
- Self-documenting code structure

✅ **Testing Ready**:
- Testable architecture
- Clear dependencies
- Mockable external services

✅ **Performance**:
- Optimized re-renders
- Lazy loading where appropriate
- Memoization for expensive computations
- Efficient data structures

Generate the COMPLETE file content. Think like a senior engineer who takes pride in their craft!`;

    return this.aiService.generateCode(prompt);
  }

  /**
   * Generates an entire application autonomously
   */
  async generateCompleteApplication(
    description: string,
    onProgress?: (phase: string, task: string, progress: number) => void
  ): Promise<{ files: Array<{ path: string; content: string }>; summary: string }> {
    // Step 1: Analyze project
    const project = await this.analyzeProject(description);
    onProgress?.('Analysis', 'Project analyzed', 10);

    // Step 2: Create plan
    const plan = await this.createGenerationPlan(project);
    onProgress?.('Planning', 'Generation plan created', 20);

    const files: Array<{ path: string; content: string }> = [];
    let currentProgress = 20;
    const progressPerPhase = 70 / plan.phases.length;

    // Step 3: Execute each phase
    for (const phase of plan.phases) {
      onProgress?.(phase.name, `Starting ${phase.name}`, currentProgress);

      const progressPerTask = progressPerPhase / phase.tasks.length;
      
      for (const task of phase.tasks) {
        // Generate each file in the task
        for (const filePath of task.files) {
          const content = await this.generateExpertFile(
            filePath,
            task.description,
            `Phase: ${phase.name}\nDependencies: ${task.dependencies.join(', ')}`,
            project
          );

          files.push({ path: filePath, content });
          
          currentProgress += progressPerTask;
          onProgress?.(phase.name, `Generated ${filePath}`, currentProgress);
        }
      }
    }

    // Step 4: Generate summary
    const summary = this.generateProjectSummary(project, plan, files);
    onProgress?.('Complete', 'Application generated successfully', 100);

    // Save to learning database
    await this.saveGenerationToDatabase(project, plan, files);

    return { files, summary };
  }

  /**
   * Determines file type from path
   */
  private determineFileType(filePath: string): string {
    if (filePath.includes('component') || filePath.endsWith('.tsx')) return 'component';
    if (filePath.includes('hook') || filePath.startsWith('use')) return 'hook';
    if (filePath.includes('api') || filePath.includes('route')) return 'api';
    if (filePath.includes('layout')) return 'layout';
    if (filePath.includes('form')) return 'form';
    if (filePath.includes('service')) return 'service';
    if (filePath.includes('util')) return 'utility';
    return 'general';
  }

  /**
   * Generates a comprehensive project summary
   */
  private generateProjectSummary(
    project: AppWebsiteProject,
    plan: GenerationPlan,
    files: Array<{ path: string; content: string }>
  ): string {
    return `
# ${project.name}

## Project Overview
**Type**: ${project.type}
**Complexity**: ${project.complexity}
**Description**: ${project.description}

## Features Implemented
${project.features.map(f => `- ${f}`).join('\n')}

## Tech Stack
**Frontend**: ${project.techStack.frontend.join(', ')}
**Backend**: ${project.techStack.backend.join(', ')}
**Database**: ${project.techStack.database.join(', ')}
**APIs**: ${project.techStack.apis.join(', ')}

## Architecture
${project.architecture}

## Innovative Features
${plan.innovativeFeatures.map(f => `- ${f}`).join('\n')}

## Best Practices Applied
${plan.bestPractices.map(bp => `- ${bp}`).join('\n')}

## Files Generated
${files.map(f => `- ${f.path}`).join('\n')}

## Estimated Development Time
${plan.totalEstimatedTime} minutes

## Next Steps
1. Review generated code
2. Install dependencies: \`npm install\`
3. Set up environment variables
4. Run development server: \`npm run dev\`
5. Run tests: \`npm test\`
6. Build for production: \`npm run build\`

## Autonomous Decisions Made
This application was built with expert-level autonomous decisions including:
- Architecture patterns selection
- Component structure and organization
- State management approach
- API design and error handling
- UI/UX best practices
- Performance optimizations
- Security implementations

Built with ❤️ by Autonomous AI Expert System
`;
  }

  /**
   * Saves generation data for continuous learning
   */
  private async saveGenerationToDatabase(
    project: AppWebsiteProject,
    plan: GenerationPlan,
    files: Array<{ path: string; content: string }>
  ): Promise<void> {
    try {
      // Save project context
      await supabaseService.saveProjectContext({
        project_name: project.name,
        description: project.description,
        current_phase: 'completed',
        tech_stack: [
          ...project.techStack.frontend,
          ...project.techStack.backend,
          ...project.techStack.database
        ],
        file_structure: { files: files.map(f => f.path) },
        next_steps: ['Test application', 'Deploy to production', 'Monitor performance'],
        learnings: plan.innovativeFeatures
      });

      // Extract and save new patterns discovered
      for (const file of files) {
        const fileType = this.determineFileType(file.path);
        await supabaseService.saveCodePattern({
          pattern_name: `${project.type} - ${fileType}`,
          pattern_type: fileType,
          use_cases: [project.type, ...project.features.slice(0, 3)],
          code_template: file.content.substring(0, 1000), // Store sample
          success_rate: 0.9,
          times_used: 1
        });
      }
    } catch (error) {
      console.log('Could not save to database, continuing anyway');
    }
  }

  /**
   * Continuously learns from feedback
   */
  async learnFromFeedback(
    projectName: string,
    feedback: {
      successful: boolean;
      issues: string[];
      improvements: string[];
      rating: number;
    }
  ): Promise<void> {
    // Save feedback for learning
    await supabaseService.saveTaskHistory({
      task_description: `Generated ${projectName}`,
      complexity: 'high',
      steps_taken: ['Analysis', 'Planning', 'Generation', 'Validation'],
      files_generated: [],
      success: feedback.successful,
      patterns_learned: feedback.improvements,
      innovation_score: feedback.rating / 10,
      execution_time: 0
    });
  }
}

// Export singleton
export const appWebsiteExpert = new AppWebsiteExpert();
