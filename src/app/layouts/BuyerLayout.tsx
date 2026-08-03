import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Home, Package, FileText, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/shared/ui/sheet";
import { useState } from "react";
export default function BuyerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/dashboard/purchased', label: 'My Plans', icon: Package },
    { path: '/dashboard/custom-requests', label: 'Custom Requests', icon: FileText },
    { path: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="NEXii Logo" className="h-10 w-auto object-contain" />
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <Link to="/catalog">
              <Button variant="outline">Browse Plans</Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open dashboard navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader>
                <SheetTitle>Buyer dashboard</SheetTitle>
                <SheetDescription>Navigate your account and purchases.</SheetDescription>
              </SheetHeader>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground break-all">{user?.email}</p>
              </div>

              <div className="mt-6 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <SheetClose asChild key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 rounded-md px-4 py-3 transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={async () => {
                    await logout();
                    setMobileMenuOpen(false);
                    navigate("/login", { replace: true });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          <aside className="hidden lg:block">
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <div className="mb-4 rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-semibold">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground break-all">{user?.email}</p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 rounded-md px-4 py-3 transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
