import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress known browser extension errors that don't affect functionality
const originalError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(" ");
  // Suppress browser extension errors
  if (
    message.includes("message channel closed") ||
    message.includes("asynchronous response") ||
    message.includes("WebSocket connection to") ||
    message.includes("ws://127.0.0.1:5500") ||
    message.includes("ws://localhost:5500")
  ) {
    return; // Don't log these errors
  }
  originalError.apply(console, args);
};

window.addEventListener("error", (event) => {
  // Suppress Chrome extension message channel errors and WebSocket errors
  if (
    event.message?.includes("message channel closed") ||
    event.message?.includes("asynchronous response") ||
    event.message?.includes("WebSocket connection") ||
    event.filename?.includes("reload.js") ||
    event.filename?.includes("live-server")
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Suppress unhandled promise rejections from browser extensions
window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = reason?.message || reason?.toString() || "";
  
  if (
    message.includes("message channel closed") ||
    message.includes("asynchronous response") ||
    message.includes("WebSocket connection") ||
    message.includes("ws://127.0.0.1:5500") ||
    message.includes("ws://localhost:5500")
  ) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

createRoot(document.getElementById("root")!).render(<App />);
