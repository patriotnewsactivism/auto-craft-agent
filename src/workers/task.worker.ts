/**
 * Web Worker for Heavy Task Processing
 * Handles CPU-intensive operations without blocking the main thread
 */

// Safe API key retrieval function for worker context
function getAPIKey(name: string): string | null {
  try {
    // Try persistent storage first
    const persistentKey = localStorage.getItem(`acw_apikey_${name}`);
    if (persistentKey) return persistentKey;
    
    // Fallback to legacy key
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

interface WorkerTask {
  id: string;
  type: string;
  data: any;
}

/**
 * Safe JSON parser for worker context
 * Validates JSON before parsing to catch truncated responses
 */
function safeParseJson(text: string): any {
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response. The AI response may be incomplete or truncated.');
  }
  
  const jsonStr = jsonMatch[0];
  
  // Basic validation: check for unterminated strings
  let braceCount = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  
  // Check if we're still in a string (unterminated string literal)
  if (inString) {
    throw new Error('JSON contains unterminated string. The response was likely truncated due to token limits.');
  }
  
  // Check if braces are balanced
  if (braceCount !== 0) {
    throw new Error('JSON structure is incomplete. The response may have been truncated.');
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unterminated string')) {
      throw new Error('The AI response was truncated and contains an incomplete JSON string. Try using a shorter prompt or requesting less detailed output.');
    }
    throw error;
  }
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
      apiKey: getAPIKey('google_api_key')
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
      apiKey: getAPIKey('google_api_key')
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
  
  // Use safe JSON parser to handle truncated responses
  const analysisResult = safeParseJson(data.text);
  
  self.postMessage({
    type: 'task_progress',
    taskId: task.id,
    progress: 100
  });
  
  return analysisResult;
}

async function handleGitHubSync(task: WorkerTask) {
  // GitHub sync implementation
  throw new Error('GitHub sync not implemented in worker yet');
}

export {};
