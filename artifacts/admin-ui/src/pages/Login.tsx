import { useState } from "react";
import { api } from "../lib/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res?.data?.token;
      if (!token) throw new Error("No token returned from server");

      localStorage.setItem("token", token);
      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <section className="login-brand-panel">
          <div className="login-eyebrow">
            <span />
            Private Workspace
          </div>

          <h1>
            Zenith Nova
            <br />
            Bridge Wave
          </h1>

          <p>
            Authorized access for editorial publishing and platform management.
          </p>

          <div className="login-note-grid">
            {["Editorial", "Private", "Managed"].map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </section>

        <section className="login-form-panel">
          <h2>Admin Login</h2>
          <p>Sign in to continue.</p>

          <form onSubmit={login}>
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            {error && <div className="login-error">{error}</div>}

            <button disabled={loading}>
              {loading ? "Signing in..." : "Enter Dashboard"}
            </button>
          </form>

          <small>Private administration area</small>
        </section>
      </div>
    </div>
  );
}
