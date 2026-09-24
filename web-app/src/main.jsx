import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";

const DEV_MODE = true;

if (typeof window !== "undefined") {
  window.__BROKEBUDDY_DEV_MODE__ = DEV_MODE;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);