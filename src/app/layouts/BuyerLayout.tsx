import { Outlet, Link, useLocation } from 'react-router';
import { Building2, Home, Package, FileText, User, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from "../assets/logo.png";
export default function BuyerLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/dashboard/purchased', label: 'My Plans', icon: Package },
    { path: '/dashboard/custom-requests', label: 'Custom Requests', icon: FileText },
    { path: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="NEXii Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/catalog">
                <Button variant="outline">Browse Plans</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="icon">
                  <LogOut className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg border border-border p-4">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
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

          {/* Main Content */}
          <main className="col-span-12 md:col-span-9">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
