import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const renderApp = () => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
};

if (new URLSearchParams(window.location.search).get("qa") === "1") {
  void import("./browserQa").then(({ setupBrowserQa }) => {
    setupBrowserQa();
    renderApp();
  });
} else {
  renderApp();
}
