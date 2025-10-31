import { appWebsiteExpert, AppWebsiteProject, GenerationPlan } from './appWebsiteExpert';
import { continuousLearning } from './continuousLearning';
import { AutonomousAI } from './autonomousAI';
import { AutonomousValidator } from './autonomousValidator';
import { supabaseService } from './supabaseService';
import { EXPERT_TEMPLATES, findRelevantTemplates } from './expertTemplates';

/**
 * AUTONOMOUS CODE GENERATOR
 * 
 * The ultimate autonomous system that:
 * - Generates complete apps and websites without steady guidance
 * - Continuously learns and improves
 * - Expert-level out of the box
 * - Long-term project tracking
 * - Self-optimizing and self-correcting
 */

export interface GenerationRequest {
  description: string;
  type?: 'auto' | 'web-app' | 'website' | 'dashboard' | 'ecommerce' | 'social' | 'saas';
  requirements?: string[];
  constraints?: {
    techStack?: string[];
    deadline?: number; // minutes
    complexity?: 'simple' | 'moderate' | 'complex' | 'enterprise';
  };
}

export interface GenerationResult {
  success: boolean;
  project: AppWebsiteProject;
  files: Array<{ path: string; content: string; validated: boolean }>;
  plan: GenerationPlan;
  summary: string;
  learnings: string[];
  innovationScore: number;
  executionTime: number;
  quality: {
    codeQuality: number;
    architectureScore: number;
    securityScore: number;
    overallScore: number;
  };
}

export interface GenerationProgress {
  phase: string;
  task: string;
  progress: number;
  currentFile?: string;
  estimatedTimeRemaining?: number;
}

export class AutonomousCodeGenerator {
  private autonomousAI: AutonomousAI;
  private validator: AutonomousValidator;
  private isGenerating: boolean = false;
  private currentProject: string | null = null;

  constructor() {
    this.autonomousAI = new AutonomousAI();
    this.validator = new AutonomousValidator();
  }

  /**
   * Main entry point: Generate a complete application autonomously
   */
  async generate(
    request: GenerationRequest,
    onProgress?: (progress: GenerationProgress) => void
  ): Promise<GenerationResult> {
    if (this.isGenerating) {
      throw new Error('Generation already in progress');
    }

    this.isGenerating = true;
    const startTime = Date.now();

    try {
      // Phase 1: Intelligent Analysis
      onProgress?.({
        phase: 'Analysis',
        task: 'Analyzing requirements with AI',
        progress: 5
      });

      const enhancedRequest = await this.enhanceRequest(request);
      
      // Phase 2: Learning from Past
      onProgress?.({
        phase: 'Learning',
        task: 'Learning from similar past projects',
        progress: 10
      });

      const prediction = await continuousLearning.predictOptimalApproach(
        enhancedRequest.description
      );

      // Phase 3: Expert Planning
      onProgress?.({
        phase: 'Planning',
        task: 'Creating expert-level generation plan',
        progress: 15
      });

      const project = await appWebsiteExpert.analyzeProject(enhancedRequest.description);
      this.currentProject = project.name;
      
      const plan = await appWebsiteExpert.createGenerationPlan(project);

      // Phase 4: Autonomous Generation
      onProgress?.({
        phase: 'Generation',
        task: 'Generating code autonomously',
        progress: 20
      });

      const files = await this.generateAllFiles(
        project,
        plan,
        prediction.recommendedPatterns,
        (fileProgress) => {
          onProgress?.({
            phase: 'Generation',
            task: `Generating ${fileProgress.currentFile}`,
            progress: 20 + (fileProgress.progress * 0.5), // 20-70%
            currentFile: fileProgress.currentFile
          });
        }
      );

      // Phase 5: Autonomous Validation
      onProgress?.({
        phase: 'Validation',
        task: 'Validating and improving code',
        progress: 70
      });

      const validatedFiles = await this.validateAndImprove(files, project, (progress) => {
        onProgress?.({
          phase: 'Validation',
          task: 'Validating code quality',
          progress: 70 + (progress * 0.15) // 70-85%
        });
      });

      // Phase 6: Quality Assessment
      onProgress?.({
        phase: 'Quality Check',
        task: 'Assessing overall quality',
        progress: 85
      });

      const quality = await this.assessQuality(validatedFiles, project);

      // Phase 7: Generate Documentation
      onProgress?.({
        phase: 'Documentation',
        task: 'Creating project documentation',
        progress: 90
      });

      const summary = await this.generateComprehensiveSummary(
        project,
        plan,
        validatedFiles,
        quality,
        prediction
      );

      // Phase 8: Learning & Optimization
      onProgress?.({
        phase: 'Learning',
        task: 'Saving learnings for future improvements',
        progress: 95
      });

      const executionTime = (Date.now() - startTime) / 1000;
      
      const reflection = await this.autonomousAI.reflectAndLearn(
        request.description,
        validatedFiles,
        true,
        executionTime
      );

      await this.autonomousAI.saveTaskExecution(
        {
          description: request.description,
          complexity: project.complexity as any,
          steps: plan.phases.map(p => p.name),
          files: validatedFiles.map(f => f.path),
          innovationOpportunities: plan.innovativeFeatures,
          learnedPatterns: prediction.recommendedPatterns.map(p => p.pattern_name)
        },
        validatedFiles.map(f => f.path),
        true,
        executionTime,
        reflection
      );

      // Save project context for long-term tracking
      await supabaseService.saveProjectContext({
        project_name: project.name,
        description: project.description,
        current_phase: 'completed',
        tech_stack: [
          ...project.techStack.frontend,
          ...project.techStack.backend,
          ...project.techStack.database
        ],
        file_structure: { files: validatedFiles.map(f => f.path) },
        next_steps: [
          'Review generated code',
          'Install dependencies',
          'Configure environment variables',
          'Run development server',
          'Deploy to production'
        ],
        learnings: reflection.strengths
      });

      onProgress?.({
        phase: 'Complete',
        task: 'Application generated successfully!',
        progress: 100
      });

      return {
        success: true,
        project,
        files: validatedFiles,
        plan,
        summary,
        learnings: reflection.strengths,
        innovationScore: reflection.innovationScore,
        executionTime,
        quality
      };

    } catch (error) {
      console.error('Generation error:', error);
      
      // Even failures are learning opportunities
      await this.autonomousAI.saveTaskExecution(
        {
          description: request.description,
          complexity: 'high' as any,
          steps: ['Failed during generation'],
          files: [],
          innovationOpportunities: [],
          learnedPatterns: []
        },
        [],
        false,
        (Date.now() - startTime) / 1000,
        {
          strengths: [],
          improvements: [error instanceof Error ? error.message : 'Unknown error'],
          newPatterns: [],
          innovationScore: 0
        }
      );

      throw error;
    } finally {
      this.isGenerating = false;
      this.currentProject = null;
    }
  }

  /**
   * Enhances the user's request with intelligent defaults
   */
  private async enhanceRequest(request: GenerationRequest): Promise<GenerationRequest> {
    // Use AI to understand and enhance the request
    const enhanced = { ...request };

    if (!enhanced.type || enhanced.type === 'auto') {
      // Auto-detect project type
      const description = request.description.toLowerCase();
      if (description.includes('dashboard') || description.includes('admin')) {
        enhanced.type = 'dashboard';
      } else if (description.includes('ecommerce') || description.includes('shop') || description.includes('store')) {
        enhanced.type = 'ecommerce';
      } else if (description.includes('social') || description.includes('community')) {
        enhanced.type = 'social';
      } else if (description.includes('saas') || description.includes('platform')) {
        enhanced.type = 'saas';
      } else if (description.includes('portfolio') || description.includes('personal')) {
        enhanced.type = 'website';
      } else {
        enhanced.type = 'web-app';
      }
    }

    return enhanced;
  }

  /**
   * Generates all files for the project
   */
  private async generateAllFiles(
    project: AppWebsiteProject,
    plan: GenerationPlan,
    recommendedPatterns: any[],
    onProgress?: (progress: { progress: number; currentFile: string }) => void
  ): Promise<Array<{ path: string; content: string; validated: boolean }>> {
    const files: Array<{ path: string; content: string; validated: boolean }> = [];
    const totalTasks = plan.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
    let completedTasks = 0;

    // Find relevant expert templates
    const keywords = [
      ...project.features,
      project.type,
      ...project.techStack.frontend
    ];
    const relevantTemplates = findRelevantTemplates(keywords);

    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        for (const filePath of task.files) {
          // Generate file with expert knowledge
          const content = await appWebsiteExpert.generateExpertFile(
            filePath,
            task.description,
            `Phase: ${phase.name}\nPatterns: ${recommendedPatterns.map(p => p.pattern_name).join(', ')}`,
            project
          );

          files.push({
            path: filePath,
            content,
            validated: false
          });

          completedTasks++;
          const progress = completedTasks / totalTasks;
          
          onProgress?.({ progress, currentFile: filePath });
        }
      }
    }

    return files;
  }

  /**
   * Validates and improves generated files
   */
  private async validateAndImprove(
    files: Array<{ path: string; content: string; validated: boolean }>,
    project: AppWebsiteProject,
    onProgress?: (progress: number) => void
  ): Promise<Array<{ path: string; content: string; validated: boolean }>> {
    const validatedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate code quality
      const validation = await this.validator.validateCode(
        file.path,
        file.content,
        project.description
      );

      let finalContent = file.content;

      // Auto-correct if needed
      if (!validation.isValid || validation.score < 80) {
        finalContent = await this.validator.autonomousCorrection(
          file.path,
          file.content,
          validation
        );
      }

      validatedFiles.push({
        path: file.path,
        content: finalContent,
        validated: true
      });

      onProgress?.((i + 1) / files.length);
    }

    // Validate overall architecture
    const architectureValidation = await this.validator.validateArchitecture(
      validatedFiles,
      project.description
    );

    if (!architectureValidation.isValid) {
      console.warn('Architecture issues detected:', architectureValidation.issues);
    }

    return validatedFiles;
  }

  /**
   * Assesses overall quality of the generated code
   */
  private async assessQuality(
    files: Array<{ path: string; content: string }>,
    project: AppWebsiteProject
  ): Promise<{
    codeQuality: number;
    architectureScore: number;
    securityScore: number;
    overallScore: number;
  }> {
    // Validate architecture
    const architectureResult = await this.validator.validateArchitecture(
      files,
      project.description
    );

    // Security audit
    const securityResult = await this.validator.securityAudit(files);

    // Calculate average code quality from individual file validations
    let totalCodeQuality = 0;
    for (const file of files.slice(0, 5)) { // Sample first 5 files
      const validation = await this.validator.validateCode(
        file.path,
        file.content,
        project.description
      );
      totalCodeQuality += validation.score;
    }
    const avgCodeQuality = totalCodeQuality / Math.min(files.length, 5);

    const overallScore = (
      avgCodeQuality * 0.4 +
      architectureResult.score * 0.3 +
      securityResult.score * 0.3
    );

    return {
      codeQuality: avgCodeQuality,
      architectureScore: architectureResult.score,
      securityScore: securityResult.score,
      overallScore
    };
  }

  /**
   * Generates comprehensive project summary
   */
  private async generateComprehensiveSummary(
    project: AppWebsiteProject,
    plan: GenerationPlan,
    files: Array<{ path: string; content: string }>,
    quality: any,
    prediction: any
  ): Promise<string> {
    return `
# ${project.name} - Autonomous Generation Complete! 🚀

## 📊 Project Overview
- **Type**: ${project.type.toUpperCase()}
- **Complexity**: ${project.complexity.toUpperCase()}
- **Files Generated**: ${files.length}
- **Quality Score**: ${quality.overallScore.toFixed(1)}/100

## ✨ Key Features
${project.features.map(f => `- ✅ ${f}`).join('\n')}

## 🛠️ Tech Stack
**Frontend**: ${project.techStack.frontend.join(', ')}
**Backend**: ${project.techStack.backend.join(', ')}
**Database**: ${project.techStack.database.join(', ')}

## 🏗️ Architecture
${project.architecture}

## 💡 Innovative Features
${plan.innovativeFeatures.map(f => `- 🎯 ${f}`).join('\n')}

## 📈 Quality Metrics
- Code Quality: ${quality.codeQuality.toFixed(1)}/100
- Architecture: ${quality.architectureScore.toFixed(1)}/100
- Security: ${quality.securityScore.toFixed(1)}/100

## 🧠 AI Insights
${prediction.confidenceScore > 0.7 ? '✅ High confidence - based on successful past projects' : '🔄 Learning - first time with this pattern'}

**Reasoning**: ${prediction.reasoning}

## 📝 Generated Files
${files.map(f => `- \`${f.path}\``).join('\n')}

## 🚀 Next Steps
1. Review the generated code
2. Install dependencies: \`npm install\`
3. Configure environment variables (check .env.example)
4. Start development server: \`npm run dev\`
5. Run tests: \`npm test\` (if tests generated)
6. Deploy: \`npm run build\`

## 🎓 Learnings Applied
${prediction.recommendedPatterns.slice(0, 3).map(p => `- ${p.pattern_name} (${(p.success_rate * 100).toFixed(0)}% success rate)`).join('\n')}

## 📚 Best Practices Implemented
${plan.bestPractices.map(bp => `- ✓ ${bp}`).join('\n')}

---

**Generated autonomously** with continuous learning AI 🤖
**Execution time**: ${plan.totalEstimatedTime} minutes
**Innovation score**: ${plan.innovativeFeatures.length}/10

💡 This system gets smarter with every project! Each generation improves my expertise.
`;
  }

  /**
   * Gets current generation status
   */
  getStatus(): { isGenerating: boolean; currentProject: string | null } {
    return {
      isGenerating: this.isGenerating,
      currentProject: this.currentProject
    };
  }

  /**
   * Gets AI's current capabilities
   */
  async getCapabilities(): Promise<{
    expertiseLevel: string;
    specializations: string[];
    totalProjects: number;
    successRate: number;
    topPatterns: string[];
  }> {
    const state = await continuousLearning.getKnowledgeState();
    
    return {
      expertiseLevel: state.expertiseLevel,
      specializations: state.specializations,
      totalProjects: state.totalTasks,
      successRate: state.successRate,
      topPatterns: state.topPatterns.slice(0, 5).map(p => p.pattern_name)
    };
  }
}

// Export singleton
export const autonomousCodeGenerator = new AutonomousCodeGenerator();
