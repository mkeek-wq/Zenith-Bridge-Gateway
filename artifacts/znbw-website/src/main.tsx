import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";


const originalFetch = window.fetch;

window.fetch = (input: any, init?: any) => {
  if (typeof input === "string" && input.startsWith("/api")) {
    input = "https://api.zenithnovabridgewave.com" + input;
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(<App />);
