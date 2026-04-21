import { Link, useLocation } from "wouter";
import { useAdminMe, useAdminLogout, getAdminMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FileText, LogOut, Settings, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: session, isLoading } = useAdminMe({
    query: {
      queryKey: getAdminMeQueryKey()
    }
  });
  
  const logout = useAdminLogout();

  useEffect(() => {
    if (!isLoading && !session?.authenticated) {
      setLocation("/admin/login");
    }
  }, [session, isLoading, setLocation]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData(getAdminMeQueryKey(), null);
        setLocation("/admin/login");
      }
    });
  };

  if (isLoading || !session?.authenticated) {
    return <div className="min-h-screen bg-muted/20 flex items-center justify-center">Loading...</div>;
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/articles/new", icon: FileText, label: "New Article" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-primary-foreground/10 shrink-0">
          <span className="font-serif text-xl font-semibold tracking-tight text-secondary">ZNBW. Admin</span>
        </div>
        
        <div className="p-6">
          <div className="text-xs text-primary-foreground/50 uppercase tracking-wider font-semibold mb-4">Content</div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  (location === item.href || (location.startsWith(item.href) && item.href !== "/admin")) 
                    ? "bg-primary-foreground/10 text-white" 
                    : "text-primary-foreground/70 hover:bg-primary-foreground/5 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-primary-foreground/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-medium">
              {session.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{session.username}</div>
              <div className="text-xs text-primary-foreground/50">Administrator</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Link href="/" target="_blank">
              <Button variant="ghost" className="w-full justify-start text-primary-foreground/70 hover:text-white hover:bg-primary-foreground/5 h-9 px-2">
                <ExternalLink className="w-4 h-4 mr-2" /> View Site
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-2"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center px-8 shrink-0 sticky top-0 z-10">
          <h1 className="text-lg font-medium">Content Management System</h1>
        </header>
        <div className="flex-1 p-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
