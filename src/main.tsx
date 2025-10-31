import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { logger } from "./lib/logger";

// Initialize logger first to filter browser extension noise
logger.info("System", "Autonomous Code Wizard initializing...");

const rootElement = document.getElementById("root");

if (!rootElement) {
  logger.error("System", "Root element not found!", "The #root element is missing from the DOM");
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error: Root element not found</h1><p>The application failed to initialize.</p></div>';
} else {
  try {
    createRoot(rootElement).render(<App />);
    logger.success("System", "Autonomous Code Wizard started successfully", "Application is ready");
  } catch (error) {
    logger.logError("System", error, "Failed to render app");
    rootElement.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error loading application</h1><p>Please check the browser console for details.</p></div>';
  }
}
