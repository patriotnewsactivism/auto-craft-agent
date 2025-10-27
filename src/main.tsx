import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Log app start
console.log("Autonomous Code Wizard initializing...");

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Root element not found!");
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error: Root element not found</h1><p>The application failed to initialize.</p></div>';
} else {
  try {
    createRoot(rootElement).render(<App />);
    console.log("Autonomous Code Wizard started successfully");
  } catch (error) {
    console.error("Failed to render app:", error);
    rootElement.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h1>Error loading application</h1><p>Please check the browser console for details.</p></div>';
  }
}
