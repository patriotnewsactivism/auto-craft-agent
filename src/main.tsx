import { createRoot } from "react-dom/client";
import "./index.css";

// Global error handler for initialization errors
window.addEventListener('error', (event) => {
  console.error('[ACW Init Error]', event.error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: #0a0a0a; color: white; min-height: 100vh;">
        <h1 style="color: #ef4444;">?? Error loading application</h1>
        <p style="margin: 20px 0;">The application failed to initialize. Please check the browser console for details.</p>
        <pre style="background: #1a1a1a; padding: 15px; border-radius: 8px; overflow: auto; max-width: 100%;">${event.error?.message || 'Unknown error'}\n\n${event.error?.stack || ''}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
});

// Update loading message
const updateLoadingMessage = (message: string) => {
  const rootElement = document.getElementById("root");
  if (rootElement && rootElement.innerHTML.includes('Loading Autonomous Code Wizard')) {
    const loadingDiv = rootElement.querySelector('div');
    if (loadingDiv) {
      const messageDiv = loadingDiv.querySelector('div:last-child');
      if (messageDiv) {
        messageDiv.textContent = message;
      }
    }
  }
};

try {
  updateLoadingMessage("Loading core modules...");
  
  // Set a timeout to detect if loading hangs
  const loadingTimeout = setTimeout(() => {
    console.error('[ACW Timeout] Application loading timed out after 10 seconds');
    const rootElement = document.getElementById("root");
    if (rootElement && rootElement.innerHTML.includes('Loading Autonomous Code Wizard')) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; background: #0a0a0a; color: white; min-height: 100vh;">
          <h1 style="color: #f59e0b;">?? Loading Timeout</h1>
          <p style="margin: 20px 0;">The application is taking longer than expected to load. This could be due to:</p>
          <ul style="text-align: left; margin: 20px 0; padding-left: 40px;">
            <li>Slow network connection</li>
            <li>Large module size</li>
            <li>Background initialization tasks</li>
          </ul>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Reload Page
          </button>
          <p style="margin-top: 20px; font-size: 0.875rem; color: #888;">If this persists, try clearing your browser cache or opening the browser console (F12) for more details.</p>
        </div>
      `;
    }
  }, 10000); // 10 second timeout
  
  // Dynamically import to catch module loading errors
  Promise.all([
    import("./App.tsx"),
    import("./lib/logger")
  ]).then(([{ default: App }, { logger }]) => {
    clearTimeout(loadingTimeout); // Clear timeout on successful load
    updateLoadingMessage("Initializing application...");
    
    logger.info("System", "Autonomous Code Wizard initializing...");

    const rootElement = document.getElementById("root");

    if (!rootElement) {
      logger.error("System", "Root element not found!", "The #root element is missing from the DOM");
      document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif; background: #0a0a0a; color: white;"><h1>Error: Root element not found</h1><p>The application failed to initialize.</p></div>';
    } else {
      try {
        updateLoadingMessage("Starting React...");
        createRoot(rootElement).render(<App />);
        logger.success("System", "Autonomous Code Wizard started successfully", "Application is ready");
      } catch (error) {
        logger.logError("System", error, "Failed to render app");
        rootElement.innerHTML = `
          <div style="padding: 20px; font-family: sans-serif; background: #0a0a0a; color: white;">
            <h1 style="color: #ef4444;">Error loading application</h1>
            <p>Please check the browser console for details.</p>
            <pre style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-top: 10px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
          </div>
        `;
      }
    }
  }).catch(error => {
    clearTimeout(loadingTimeout); // Clear timeout on error
    console.error('[ACW Module Load Error]', error);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; background: #0a0a0a; color: white; min-height: 100vh;">
          <h1 style="color: #ef4444;">?? Module Loading Error</h1>
          <p style="margin: 20px 0;">Failed to load application modules. This might be due to a network issue or a code error.</p>
          <pre style="background: #1a1a1a; padding: 15px; border-radius: 8px; overflow: auto; max-width: 100%;">${error instanceof Error ? error.message : String(error)}\n\n${error instanceof Error ? error.stack || '' : ''}</pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  });
} catch (error) {
  console.error('[ACW Critical Error]', error);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; background: #0a0a0a; color: white; min-height: 100vh;">
        <h1 style="color: #ef4444;">?? Critical Error</h1>
        <p>The application encountered a critical error during initialization.</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}
