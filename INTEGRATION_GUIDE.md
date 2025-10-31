# Integration Guide - Using the Autonomous AI System

## Quick Integration Examples

### 1. Basic App Generation

```typescript
import { autonomousCodeGenerator } from '@/lib/autonomousCodeGenerator';

// Generate a complete application
const result = await autonomousCodeGenerator.generate(
  {
    description: "Build a task management app with categories and due dates",
    type: 'web-app'
  },
  (progress) => {
    console.log(`${progress.phase}: ${progress.task} (${progress.progress}%)`);
  }
);

console.log(result.summary);
console.log(`Generated ${result.files.length} files`);
console.log(`Quality Score: ${result.quality.overallScore}/100`);
console.log(`Innovation Score: ${result.innovationScore}/1`);
```

### 2. Using the App/Website Expert Directly

```typescript
import { appWebsiteExpert } from '@/lib/appWebsiteExpert';

// Step 1: Analyze a project
const project = await appWebsiteExpert.analyzeProject(
  "Create a modern e-commerce store with product filtering and cart"
);

console.log(project);
// {
//   name: "ecommerce-store",
//   type: "ecommerce",
//   features: ["product catalog", "shopping cart", "checkout", ...],
//   techStack: { frontend: ["React", "TypeScript"], ... },
//   complexity: "moderate"
// }

// Step 2: Create a generation plan
const plan = await appWebsiteExpert.createGenerationPlan(project);

console.log(`Total phases: ${plan.phases.length}`);
console.log(`Estimated time: ${plan.totalEstimatedTime} minutes`);

// Step 3: Generate a specific file
const fileContent = await appWebsiteExpert.generateExpertFile(
  'src/components/ProductCard.tsx',
  'Display product with image, title, price, and add-to-cart button',
  'E-commerce product listing',
  project
);
```

### 3. Leveraging Continuous Learning

```typescript
import { continuousLearning } from '@/lib/continuousLearning';

// Get current AI knowledge state
const state = await continuousLearning.getKnowledgeState();
console.log(`Expertise Level: ${state.expertiseLevel}`);
console.log(`Success Rate: ${(state.successRate * 100).toFixed(1)}%`);
console.log(`Top Patterns: ${state.topPatterns.map(p => p.pattern_name).join(', ')}`);

// Predict optimal approach for a new task
const prediction = await continuousLearning.predictOptimalApproach(
  "Build a real-time chat application"
);

console.log(`Confidence: ${(prediction.confidenceScore * 100).toFixed(0)}%`);
console.log(`Recommended patterns: ${prediction.recommendedPatterns.length}`);
console.log(`Similar successes: ${prediction.similarSuccesses.length}`);
console.log(`Reasoning: ${prediction.reasoning}`);

// Get learning recommendations
const recommendations = await continuousLearning.getLearningRecommendations();
recommendations.forEach(rec => console.log(`💡 ${rec}`));
```

### 4. Using Expert Templates

```typescript
import { EXPERT_TEMPLATES, findRelevantTemplates, getTemplatesByCategory } from '@/lib/expertTemplates';

// Get all React component templates
const componentTemplates = getTemplatesByCategory('react-component');

// Find templates relevant to your task
const relevantTemplates = findRelevantTemplates(['form', 'validation', 'user input']);

relevantTemplates.forEach(template => {
  console.log(`📋 ${template.name}`);
  console.log(`Use cases: ${template.useCase.join(', ')}`);
  console.log(`Success rate: ${(template.bestPractices.length)} best practices`);
  console.log(template.template); // The actual code template
});
```

### 5. Working with Supabase Learning Database

```typescript
import { supabaseService } from '@/lib/supabaseService';

// Check if database is ready
if (supabaseService.isReady()) {
  // Get task history
  const tasks = await supabaseService.getTaskHistory(10);
  
  // Find similar past tasks
  const similar = await supabaseService.getSimilarTasks("e-commerce checkout flow");
  
  // Get successful patterns
  const patterns = await supabaseService.getMostSuccessfulPatterns(5);
  
  // Get success rate
  const successRate = await supabaseService.getSuccessRate();
  console.log(`Overall success rate: ${(successRate * 100).toFixed(1)}%`);
  
  // Get all projects
  const projects = await supabaseService.getAllProjects();
}
```

### 6. Autonomous Validation

```typescript
import { AutonomousValidator } from '@/lib/autonomousValidator';

const validator = new AutonomousValidator();

// Validate a single file
const validation = await validator.validateCode(
  'src/components/Button.tsx',
  buttonCode,
  'Reusable button component with variants'
);

if (!validation.isValid) {
  console.log('Issues found:', validation.issues);
  
  // Auto-correct the code
  const improvedCode = await validator.autonomousCorrection(
    'src/components/Button.tsx',
    buttonCode,
    validation
  );
}

// Validate architecture
const archValidation = await validator.validateArchitecture(
  allFiles,
  'E-commerce application'
);

// Security audit
const securityAudit = await validator.securityAudit(allFiles);
console.log(`Security score: ${securityAudit.score}/100`);
```

## React Component Integration

### Example: Project Generator Component

```typescript
import React, { useState } from 'react';
import { autonomousCodeGenerator, GenerationProgress } from '@/lib/autonomousCodeGenerator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export const ProjectGenerator: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const result = await autonomousCodeGenerator.generate(
        {
          description: "Build a modern todo app with categories and tags",
          type: 'web-app'
        },
        (progress) => {
          setProgress(progress);
        }
      );
      
      setResult(result);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleGenerate} disabled={generating}>
        {generating ? 'Generating...' : 'Generate App'}
      </Button>
      
      {progress && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            {progress.phase}: {progress.task}
          </div>
          <Progress value={progress.progress} />
          {progress.currentFile && (
            <div className="text-xs text-muted-foreground">
              {progress.currentFile}
            </div>
          )}
        </div>
      )}
      
      {result && (
        <div className="space-y-2">
          <h3 className="font-bold">Generation Complete!</h3>
          <p>Generated {result.files.length} files</p>
          <p>Quality Score: {result.quality.overallScore.toFixed(1)}/100</p>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-96">
            {result.summary}
          </pre>
        </div>
      )}
    </div>
  );
};
```

### Example: Learning Insights Display

```typescript
import React, { useEffect, useState } from 'react';
import { continuousLearning, KnowledgeState } from '@/lib/continuousLearning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const LearningInsights: React.FC = () => {
  const [state, setState] = useState<KnowledgeState | null>(null);

  useEffect(() => {
    continuousLearning.getKnowledgeState().then(setState);
  }, []);

  if (!state) return <div>Loading...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Expertise Level</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={
            state.expertiseLevel === 'expert' ? 'default' :
            state.expertiseLevel === 'advanced' ? 'secondary' : 'outline'
          }>
            {state.expertiseLevel.toUpperCase()}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {(state.successRate * 100).toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {state.totalTasks}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Top Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {state.topPatterns.map((pattern, i) => (
              <Badge key={i} variant="secondary">
                {pattern.pattern_name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Specializations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {state.specializations.map((spec, i) => (
              <Badge key={i} variant="outline">
                {spec}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## API Integration

### Creating an API Endpoint for Generation

```typescript
// api/generate-app.ts
import { autonomousCodeGenerator } from '@/lib/autonomousCodeGenerator';

export async function POST(req: Request) {
  try {
    const { description, type, requirements } = await req.json();
    
    const result = await autonomousCodeGenerator.generate({
      description,
      type,
      requirements
    });
    
    return new Response(JSON.stringify({
      success: true,
      project: result.project,
      filesCount: result.files.length,
      quality: result.quality,
      summary: result.summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

## Best Practices

### 1. Always Handle Errors
```typescript
try {
  const result = await autonomousCodeGenerator.generate(request);
} catch (error) {
  console.error('Generation failed:', error);
  // Show user-friendly error message
}
```

### 2. Provide Progress Feedback
```typescript
await autonomousCodeGenerator.generate(
  request,
  (progress) => {
    updateUI(progress); // Keep user informed
  }
);
```

### 3. Cache Knowledge State
```typescript
// Cache for 5 minutes
let cachedState: KnowledgeState | null = null;
let cacheTime = 0;

async function getKnowledge() {
  const now = Date.now();
  if (cachedState && now - cacheTime < 5 * 60 * 1000) {
    return cachedState;
  }
  
  cachedState = await continuousLearning.getKnowledgeState();
  cacheTime = now;
  return cachedState;
}
```

### 4. Validate Before Using Generated Code
```typescript
const result = await autonomousCodeGenerator.generate(request);

if (result.quality.overallScore < 70) {
  console.warn('Quality score is low, review code carefully');
}

if (result.quality.securityScore < 80) {
  console.warn('Security issues detected, manual review required');
}
```

## Environment Variables

Make sure these are set:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## TypeScript Types

All major types are exported:
```typescript
import type {
  GenerationRequest,
  GenerationResult,
  GenerationProgress,
  AppWebsiteProject,
  GenerationPlan,
  KnowledgeState,
  LearningInsight,
  ExpertTemplate
} from '@/lib/...';
```

## Performance Tips

1. **Parallel Generation**: The system already generates files in parallel
2. **Caching**: Knowledge state is cached internally
3. **Debouncing**: Debounce user input before generating
4. **Lazy Loading**: Load the system only when needed

## Troubleshooting

### Generation is Slow
- First generation initializes patterns (slower)
- Complex projects take more time naturally
- Check network connection to Supabase

### Low Quality Scores
- Provide more detailed descriptions
- Specify requirements explicitly
- Check if database has learned patterns

### Database Not Connecting
- Verify .env file has correct credentials
- Check Supabase project is not paused
- Ensure SQL setup script was run

## Next Steps

1. ✅ Set up database with `supabase-setup.sql`
2. ✅ Test with a simple generation
3. ✅ Integrate into your UI
4. ✅ Monitor learning progress
5. ✅ Provide feedback for improvement

Happy autonomous coding! 🚀
