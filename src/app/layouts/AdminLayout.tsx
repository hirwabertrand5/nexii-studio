import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, Home, ShoppingBag, FileText, Users, LogOut, Menu } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/shared/ui/sheet";
import { useState } from "react";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/plans', label: 'House Plans', icon: Home },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/custom-requests', label: 'Custom Requests', icon: FileText },
    { path: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <aside className="hidden w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <div className="p-6">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="NEXii Logo" className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-xs text-sidebar-foreground/70 mt-1">Admin Panel</p>
        </div>

        <nav className="px-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = 
              item.path === '/admin' 
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path) && item.path !== '/admin';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-sidebar-border">
          <Button
            variant="outline"
            className="w-full justify-start"
            size="sm"
            onClick={async () => {
              await logout();
              navigate("/admin/login", { replace: true });
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
              <img src={logo} alt="NEXii Logo" className="h-9 w-auto object-contain" />
              <span className="text-sm font-medium text-muted-foreground">Admin Panel</span>
            </Link>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open admin navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] bg-sidebar text-sidebar-foreground">
                <SheetHeader>
                  <SheetTitle className="text-sidebar-foreground">Admin navigation</SheetTitle>
                  <SheetDescription className="text-sidebar-foreground/70">
                    Jump between the admin tools.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.path === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.path) && item.path !== "/admin";

                    return (
                      <SheetClose asChild key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 rounded-md px-4 py-3 transition-colors ${
                            isActive
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
                <div className="mt-6 border-t border-sidebar-border pt-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    size="sm"
                    onClick={async () => {
                      await logout();
                      setMobileMenuOpen(false);
                      navigate("/admin/login", { replace: true });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <Outlet />
        </div>
        </main>
      </div>
    </div>
  );
}
