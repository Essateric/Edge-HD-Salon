import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// Set the initial route to the login page
const initialPath = '/login';

createRoot(document.getElementById("root")!).render(
  <Router base="" path={initialPath}>
    <App />
  </Router>
);
