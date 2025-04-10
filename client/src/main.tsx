import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";
import "./styles/fullcalendar.css";

// Get the root element
const rootElement = document.getElementById("root");

// Make sure it exists before rendering
if (rootElement) {
  createRoot(rootElement).render(
    <Router>
      <App />
    </Router>
  );
} else {
  console.error("Root element not found!");
}
