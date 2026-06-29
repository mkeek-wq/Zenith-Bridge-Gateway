import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { api } from "./lib/api";

/**
 * JWT bootstrap (NOT session-based anymore)
 */
async function bootstrapAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    return {
      authenticated: false,
      user: null,
    };
  }

  try {
   const res = await api.get("/auth/me", { 
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      authenticated: true,
      user: res.data,
    };
  } catch (err) {
    localStorage.removeItem("token");

    return {
      authenticated: false,
      user: null,
    };
  }
}

async function init() {
  const auth = await bootstrapAuth();

  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("Root not found");

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App auth={auth} />
    </React.StrictMode>
  );
}

init();
