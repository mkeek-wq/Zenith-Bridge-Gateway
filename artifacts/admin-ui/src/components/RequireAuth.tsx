import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type React from "react";

interface Props {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: Props) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("token");

      // No token → immediate redirect
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        // Hard backend verification
        await api.get("/auth/me");

        setAuthenticated(true);
      } catch (err) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, []);

  // Block rendering until auth is confirmed
  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        Verifying session...
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return children;
}
