/**
 * Web Worker for Heavy Task Processing
 * Handles CPU-intensive operations without blocking the main thread
 */

interface WorkerTask {
  id: string;
  type: string;
  data: any;
}

// Listen for messages from main thread
self.onmessage = async (event: MessageEvent) => {
  const { type, task } = event.data;
  
  if (type === 'execute_task') {
    await executeTask(task);
  } else if (type === 'cancel_task') {
    // Handle task cancellation
    console.log(`Cancelling task: ${event.data.taskId}`);
  }
};

async function executeTask(task: WorkerTask) {
  console.log(`Worker: Executing task ${task.id}`);
  
  try {
    let result;
    
    switch (task.type) {
      case 'code_generation':
        result = await handleCodeGeneration(task);
        break;
      case 'analysis':
        result = await handleAnalysis(task);
        break;
      case 'github_sync':
        result = await handleGitHubSync(task);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
    
    // Send success message
    self.postMessage({
      type: 'task_complete',
      taskId: task.id,
      result
    });
  } catch (error) {
    // Send error message
    self.postMessage({
      type: 'task_error',
      taskId: task.id,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleCodeGeneration(task: WorkerTask) {
  const { prompt, context, model } = task.data;
  
  // Update progress
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 25
  });
  
  // Make API request
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'gemini-2.5-flash',
      prompt: `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`,
      apiKey: localStorage.getItem('google_api_key')
    })
  });
  
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 75
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 100
  });
  
  return { code: data.text };
}

async function handleAnalysis(task: WorkerTask) {
  const { task: taskDescription } = task.data;
  
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 30
  });
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      prompt: `Analyze this coding task and break it down into steps. Return ONLY a JSON object with this structure:
{
  "steps": ["step 1", "step 2", ...],
  "files": ["file1.tsx", "file2.ts", ...],
  "complexity": "low|medium|high"
}

Task: ${taskDescription}`,
      apiKey: localStorage.getItem('google_api_key')
    })
  });
  
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 80
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const jsonMatch = data.text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }
  
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 100
  });
  
  return JSON.parse(jsonMatch[0]);
}

async function handleGitHubSync(task: WorkerTask) {
  // GitHub sync implementation
  throw new Error('GitHub sync not implemented in worker yet');
}

export {};
