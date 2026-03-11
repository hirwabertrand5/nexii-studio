import { Outlet, Link, useLocation } from 'react-router';
import { 
  Building2, 
  LayoutDashboard, 
  Home, 
  ShoppingBag, 
  FileText, 
  Users, 
  LogOut 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from "../assets/logo2.png";

export default function AdminLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/plans', label: 'House Plans', icon: Home },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/custom-requests', label: 'Custom Requests', icon: FileText },
    { path: '/admin/users', label: 'Users', icon: Users },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6">
<Link to="/" className="flex items-center">
  <img
    src={logo}
    alt="NEXii Logo"
    className="h-10 w-auto object-contain"
  />
</Link>
          <p className="text-xs text-sidebar-foreground/70 mt-1">Admin Panel</p>
        </div>

        <nav className="px-4 space-y-1">
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

        <div className="absolute bottom-4 left-4 right-4">
          <Link to="/login">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-muted overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
