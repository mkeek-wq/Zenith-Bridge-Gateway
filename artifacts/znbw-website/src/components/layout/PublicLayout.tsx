import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="font-serif text-xl md:text-2xl tracking-wide"
            onClick={closeMobileMenu}
          >
            Zenith Nova Bridge Wave
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className="hover:text-secondary transition-colors">
              Home
            </Link>
            <Link href="/editorials" className="hover:text-secondary transition-colors">
              Editorials
            </Link>
            <Link href="/about" className="hover:text-secondary transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-secondary transition-colors">
              Contact
            </Link>
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-border rounded-sm hover:bg-muted transition-colors"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4 text-sm font-medium">
              <Link
                href="/"
                className="py-2 hover:text-secondary transition-colors"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                href="/editorials"
                className="py-2 hover:text-secondary transition-colors"
                onClick={closeMobileMenu}
              >
                Editorials
              </Link>
              <Link
                href="/about"
                className="py-2 hover:text-secondary transition-colors"
                onClick={closeMobileMenu}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="py-2 hover:text-secondary transition-colors"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border px-6 py-8 text-sm text-muted-foreground">
  <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
    <p>
      © {new Date().getFullYear()} Zenith Nova Bridge Wave
    </p>

    <nav className="flex items-center gap-5">
      <Link href="/about" className="hover:text-secondary transition-colors">
        About
      </Link>
      <Link href="/editorials" className="hover:text-secondary transition-colors">
        Editorials
      </Link>
      <Link href="/contact" className="hover:text-secondary transition-colors">
        Contact
      </Link>
      <Link href="/privacy" className="hover:text-secondary transition-colors">
        Privacy
      </Link>
    </nav>
  </div>
</footer>
    </div>
  );
}
