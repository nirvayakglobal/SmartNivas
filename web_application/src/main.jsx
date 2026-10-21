import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { DesktopApplicationRouter } from "./DesktopApplicationRouter";
import "./index.css";

const rootHtmlElement = document.getElementById("root");

if (rootHtmlElement) {
  ReactDOM.createRoot(rootHtmlElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <DesktopApplicationRouter />
      </BrowserRouter>
    </React.StrictMode>
  );
}
