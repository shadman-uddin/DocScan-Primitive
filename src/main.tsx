import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { theme } from "./config/theme";
import "./index.css";

const root = document.documentElement;
root.style.setProperty("--color-primary", theme.primaryColor);
root.style.setProperty("--color-primary-light", theme.primaryLight);
root.style.setProperty("--color-accent", theme.accentColor);
root.style.setProperty("--color-bg", theme.backgroundColor);
root.style.setProperty("--color-card-bg", theme.cardBackground);
root.style.setProperty("--color-text-primary", theme.textPrimary);
root.style.setProperty("--color-text-secondary", theme.textSecondary);
root.style.setProperty("--color-success", theme.successColor);
root.style.setProperty("--color-warning", theme.warningColor);
root.style.setProperty("--color-error", theme.errorColor);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
