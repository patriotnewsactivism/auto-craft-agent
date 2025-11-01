/**
 * Service Worker for Background Task Execution
 * Allows tasks to continue running even when the main window is closed
 */

const CACHE_NAME = 'autonomous-wizard-v1';
const TASK_QUEUE = 'background-tasks';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Background sync for tasks
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Sync event', event.tag);
  
  if (event.tag === 'sync-tasks') {
    event.waitUntil(processPendingTasks());
  }
});

// Message handler
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker: Message received', event.data);
  
  if (event.data.type === 'execute_task') {
    executeBackgroundTask(event.data.task);
  } else if (event.data.type === 'cancel_task') {
    cancelTask(event.data.taskId);
  }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'process-tasks') {
      event.waitUntil(processPendingTasks());
    }
  });
}

async function processPendingTasks() {
  try {
    const db = await openDB();
    const tasks = await getAllTasks(db);
    const pending = tasks.filter(t => t.status === 'queued');
    
    console.log(`🔄 Processing ${pending.length} pending tasks`);
    
    for (const task of pending) {
      await executeBackgroundTask(task);
    }
  } catch (error) {
    console.error('❌ Error processing pending tasks:', error);
  }
}

async function executeBackgroundTask(task) {
  console.log(`▶️ Executing background task: ${task.id}`);
  
  try {
    // Update task status
    task.status = 'running';
    task.startedAt = Date.now();
    await saveTask(task);
    
    // Notify all clients
    notifyClients({
      type: 'task_update',
      task
    });
    
    // Execute based on task type
    let result;
    switch (task.type) {
      case 'code_generation':
        result = await executeCodeGeneration(task);
        break;
      case 'analysis':
        result = await executeAnalysis(task);
        break;
      case 'github_sync':
        result = await executeGitHubSync(task);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
    
    // Mark as completed
    task.status = 'completed';
    task.progress = 100;
    task.result = result;
    task.completedAt = Date.now();
    await saveTask(task);
    
    // Notify clients
    notifyClients({
      type: 'task_complete',
      taskId: task.id,
      result
    });
    
    console.log(`✅ Task completed: ${task.id}`);
  } catch (error) {
    console.error(`❌ Task failed: ${task.id}`, error);
    
    task.status = 'failed';
    task.error = error.message;
    task.completedAt = Date.now();
    await saveTask(task);
    
    notifyClients({
      type: 'task_error',
      taskId: task.id,
      error: error.message
    });
  }
}

async function executeCodeGeneration(task) {
  const { prompt, context, model } = task.data;
  
  // Get API key from IndexedDB
  const apiKey = await getApiKey('google');
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }
  
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'gemini-2.5-flash',
      prompt: `You are an expert autonomous coding agent. Generate production-ready code based on this task:\n\n${prompt}${context ? `\n\nContext:\n${context}` : ""}\n\nProvide complete, working code with proper error handling, types, and best practices.`,
      apiKey
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return { code: data.text };
}

async function executeAnalysis(task) {
  const { task: taskDescription } = task.data;
  
  const apiKey = await getApiKey('google');
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }
  
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
      apiKey
    })
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const jsonMatch = data.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }
  
  return JSON.parse(jsonMatch[0]);
}

async function executeGitHubSync(task) {
  // GitHub sync would need to be implemented here
  // This is a placeholder for the background sync functionality
  throw new Error('GitHub sync in background not yet implemented');
}

async function cancelTask(taskId) {
  const db = await openDB();
  const task = await getTask(db, taskId);
  
  if (task) {
    task.status = 'failed';
    task.error = 'Cancelled by user';
    task.completedAt = Date.now();
    await saveTask(task);
    
    notifyClients({
      type: 'task_update',
      task
    });
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// IndexedDB helpers
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BackgroundTasks', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'provider' });
      }
    };
  });
}

async function saveTask(task) {
  const db = await openDB();
  const transaction = db.transaction(['tasks'], 'readwrite');
  const store = transaction.objectStore('tasks');
  store.put(task);
}

async function getTask(db, taskId) {
  const transaction = db.transaction(['tasks'], 'readonly');
  const store = transaction.objectStore('tasks');
  return new Promise((resolve, reject) => {
    const request = store.get(taskId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllTasks(db) {
  const transaction = db.transaction(['tasks'], 'readonly');
  const store = transaction.objectStore('tasks');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getApiKey(provider) {
  const db = await openDB();
  const transaction = db.transaction(['keys'], 'readonly');
  const store = transaction.objectStore('keys');
  return new Promise((resolve, reject) => {
    const request = store.get(provider);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result ? result.key : null);
    };
    request.onerror = () => reject(request.error);
  });
}
