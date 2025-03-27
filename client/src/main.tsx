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

createRoot(document.getElementById("root")!).render(
  <Router>
    <InitialRouter />
  </Router>
);
