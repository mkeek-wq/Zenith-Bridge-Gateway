import { useEffect, useState } from "react";
import { api } from "../lib/api";

let cachedAuth: "unknown" | "authenticated" | "unauthenticated" = "unknown";

export function useAuthStore() {
  const [state, setState] = useState(cachedAuth);

  useEffect(() => {
    if (cachedAuth !== "unknown") {
      setState(cachedAuth);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      cachedAuth = "unauthenticated";
      setState("unauthenticated");
      return;
    }

    let alive = true;

    const verify = async () => {
      try {
        await api.get("/admin/me");

        if (!alive) return;

        cachedAuth = "authenticated";
        setState("authenticated");
      } catch {
        localStorage.removeItem("token");

        if (!alive) return;

        cachedAuth = "unauthenticated";
        setState("unauthenticated");
      }
    };

    verify();

    return () => {
      alive = false;
    };
  }, []);

  return state;
}
