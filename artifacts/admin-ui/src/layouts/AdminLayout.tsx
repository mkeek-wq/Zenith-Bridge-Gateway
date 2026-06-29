import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type NavItem = {
  label: string;
  to?: string;
  href?: string;
  disabled?: boolean;
};

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Editorial",
    items: [
      { label: "Articles", to: "/dashboard" },
      { label: "New Article", to: "/editor" },
      { label: "Media Library", disabled: true },
      { label: "Categories", disabled: true },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Publication Queue", to: "/publication-queue" },
      { label: "CMS Package Intake", to: "/cms-package-intake" },
      { label: "Intelligence Center", to: "/intelligence" },
      { label: "Intelligence Assets", to: "/intelligence-assets" },
      { label: "Datasets", to: "/intelligence-datasets" },
      { label: "Graph Packages", to: "/intelligence-graph-packages" },
      { label: "Article Workbench", to: "/article-workbench" },
      { label: "Analytics", disabled: true },
      { label: "BI Dashboards", disabled: true },
      { label: "Reports", disabled: true },
    ],
  },
  {
    title: "Clients",
    items: [
      { label: "Organizations", disabled: true },
      { label: "Users & Roles", disabled: true },
      { label: "Permissions", disabled: true },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        label: "Google Analytics",
        href: "https://analytics.google.com/",
      },
      { label: "Integrations", disabled: true },
      { label: "Settings", disabled: true },
    ],
  },
];

export default function AdminLayout({ children }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const logout = async () => {
    await fetch("/api/v1/admin/logout", {
      method: "POST",
      credentials: "include",
    });

    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={`cms-shell ${sidebarVisible ? "" : "nav-hidden"}`}>
      {sidebarVisible && (
        <aside className="cms-sidebar">
          <div className="cms-sidebar-brand">
            <div className="cms-sidebar-mark">Z</div>
            <div>
              <strong>Zenith</strong>
              <span>Editorial Intelligence</span>
            </div>
          </div>

          <nav className="cms-sidebar-nav">
            {navGroups.map((group) => (
              <section key={group.title} className="cms-sidebar-group">
                <p>{group.title}</p>

                {group.items.map((item) => {
                  const active = item.to && location.pathname === item.to;

                  if (item.href) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="cms-sidebar-link"
                      >
                        {item.label}
                      </a>
                    );
                  }

                  if (item.disabled || !item.to) {
                    return (
                      <span key={item.label} className="cms-sidebar-link disabled">
                        {item.label}
                        <small>soon</small>
                      </span>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`cms-sidebar-link ${active ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </section>
            ))}
          </nav>

          <div className="cms-sidebar-footer">
            <div>
              <strong>Admin Workspace</strong>
              <span>Private CMS access</span>
            </div>

            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>
      )}

      <main className="cms-main">
        <div className="cms-nav-toggle-row">
  <button
    className="cms-nav-toggle"
    type="button"
    onClick={() => setSidebarVisible((visible) => !visible)}
  >
    {sidebarVisible ? "☰ Hide nav" : "☰ Show nav"}
  </button>
</div>

        {children}
      </main>
    </div>
  );
}
