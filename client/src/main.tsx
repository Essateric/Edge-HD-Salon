import { createRoot } from "react-dom/client";
import { Router, useLocation } from "wouter";
import App from "./App";
import "./index.css";

// Make sure we start on the login page for non-authenticated users
const InitialRouter = () => {
  const [location, setLocation] = useLocation();

  // If we're at the root path, redirect to login
  if (location === '/') {
    setLocation('/login');
  }

  return <App />;
};

// Get the root element
const rootElement = document.getElementById("root");

// Make sure it exists before rendering
if (rootElement) {
  createRoot(rootElement).render(
    <Router>
      <InitialRouter />
    </Router>
  );
} else {
  console.error("Root element not found!");
}
