import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  Building2,
  CircleHelp,
  CircleUserRound,
  FileText,
  Home,
  LogOut,
  Menu,
  Phone,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

export default function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/admin/login";
  const accountHref = user?.role === "admin" ? "/admin" : "/dashboard";
  const accountLabel = user?.role === "admin" ? "Admin Panel" : "Dashboard";

  const navItems = [
    { to: "/", label: "Home", icon: Home },
    { to: "/catalog", label: "House Plans", icon: Building2 },
    { to: "/custom-design", label: "Custom Design", icon: FileText },
    { href: "#how-it-works", label: "How It Works", icon: CircleHelp },
    { href: "#contact", label: "Contact", icon: Phone },
  ] as const;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-3 md:h-16">
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="NEXii Logo"
                className="h-9 w-auto object-contain md:h-10"
              />
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              <Link to="/" className="text-foreground transition-colors hover:text-primary">
                Home
              </Link>
              <Link to="/catalog" className="text-foreground transition-colors hover:text-primary">
                House Plans
              </Link>
              <Link to="/custom-design" className="text-foreground transition-colors hover:text-primary">
                Custom Design
              </Link>
              <a href="#how-it-works" className="text-foreground transition-colors hover:text-primary">
                How It Works
              </a>
              <a href="#contact" className="text-foreground transition-colors hover:text-primary">
                Contact
              </a>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              {isAuthenticated && user ? (
                <>
                  <div className="hidden items-center gap-3 rounded-full border border-border bg-muted/50 px-3 py-1.5 xl:flex">
                    <CircleUserRound className="h-5 w-5 text-primary" />
                    <div className="leading-tight">
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={accountHref}>{accountLabel}</Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[360px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Quick access to the main pages and your account.
                  </SheetDescription>
                </SheetHeader>

                {isAuthenticated && user && (
                  <div className="rounded-lg border border-border bg-muted p-4">
                    <div className="flex items-center gap-3">
                      <CircleUserRound className="h-10 w-10 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{user.fullName}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;

                    if ("to" in item) {
                      return (
                        <SheetClose asChild key={item.to}>
                          <Link
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-md px-4 py-3 text-foreground transition-colors hover:bg-secondary"
                          >
                            <Icon className="h-5 w-5 text-primary" />
                            <span>{item.label}</span>
                          </Link>
                        </SheetClose>
                      );
                    }

                    return (
                      <SheetClose asChild key={item.href}>
                        <a
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-md px-4 py-3 text-foreground transition-colors hover:bg-secondary"
                        >
                          <Icon className="h-5 w-5 text-primary" />
                          <span>{item.label}</span>
                        </a>
                      </SheetClose>
                    );
                  })}
                </div>

                <div className="border-t border-border pt-4">
                  {isAuthenticated && user ? (
                    <div className="space-y-2">
                      <SheetClose asChild>
                        <Link
                          to={accountHref}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 rounded-md px-4 py-3 text-foreground transition-colors hover:bg-secondary"
                        >
                          <CircleUserRound className="h-5 w-5 text-primary" />
                          <span>{accountLabel}</span>
                        </Link>
                      </SheetClose>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={async () => {
                          await handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <Button asChild variant="outline">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-accent text-accent-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                <span className="text-xl font-bold">NEXii</span>
              </div>
              <p className="text-sm text-accent-foreground/80">
                International architectural firm specializing in African market house plans and custom designs.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/catalog" className="hover:underline">Browse Plans</Link></li>
                <li><Link to="/custom-design" className="hover:underline">Custom Design</Link></li>
                <li><a href="#how-it-works" className="hover:underline">How It Works</a></li>
                <li><Link to="/register" className="hover:underline">Get Started</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/catalog?category=Bungalow" className="hover:underline">Bungalow</Link></li>
                <li><Link to="/catalog?category=Duplex" className="hover:underline">Duplex</Link></li>
                <li><Link to="/catalog?category=Modern+Villa" className="hover:underline">Modern Villa</Link></li>
                <li><Link to="/catalog?category=African+Contemporary" className="hover:underline">African Contemporary</Link></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1">
              <h4 className="mb-4 font-semibold">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: info@nexii.com</li>
                <li>Phone: +250 796066681</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-accent-foreground/20 pt-8 text-center text-sm">
            <p>&copy; 2026 NEXii. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
