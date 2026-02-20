import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Activer le Service Worker pour le mode offline (PWA)
serviceWorkerRegistration.register({
  onSuccess: () => console.log("App disponible hors ligne."),
  onUpdate: (registration) => {
    // Émet un événement personnalisé pour que UpdateBanner puisse réagir
    window.dispatchEvent(new CustomEvent("swUpdate", { detail: registration }));
  },
});

reportWebVitals();
