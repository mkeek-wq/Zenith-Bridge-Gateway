import { Navbar } from "./Navbar";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-muted/50 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 text-center md:text-left grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="font-serif text-xl font-semibold tracking-tight text-primary block mb-4">Zenith Nova Bridge Wave</span>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto md:mx-0">
              Premium market entry consultancy bridging European enterprise into South East Asia.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-4">Location</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Marina Bay Financial Centre<br />
              Tower 1, Level 11<br />
              8 Marina Boulevard<br />
              Singapore 018981
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-4">Legal</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Zenith Nova Bridge Wave. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
