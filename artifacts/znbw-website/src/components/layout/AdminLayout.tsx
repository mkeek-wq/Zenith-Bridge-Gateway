import { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <nav style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
        <Link to="/articles">Articles</Link>{" | "}
        <Link to="/articles/new">New</Link>{" | "}
        <Link to="/login">Login</Link>
      </nav>

      <main style={{ padding: 20 }}>{children}</main>
    </div>
  );
}
