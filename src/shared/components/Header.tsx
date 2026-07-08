import { Link, useLocation, useNavigate } from "react-router";
import { CircleUserRound, LogOut, User } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const accountHref = user?.role === "admin" ? "/admin" : "/dashboard";
  const accountLabel = user?.role === "admin" ? "Admin Panel" : "Dashboard";

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Browse Plans", href: "/catalog" },
    { name: "Custom Design", href: "/custom-design" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
          <img
    src={logo}
    alt="NEXii Logo"
    className="h-10 w-auto object-contain"
  />
</Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm transition-colors ${
                  isActive(item.href)
                    ? "text-[#1e3a8a] font-medium"
                    : "text-gray-600 hover:text-[#1e3a8a]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden lg:flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 bg-gray-50">
                  <CircleUserRound className="w-4 h-4 text-[#1e3a8a]" />
                  <span className="text-sm text-gray-700 max-w-[160px] truncate">
                    {user.fullName}
                  </span>
                </div>
                <Link to={accountHref}>
                  <Button variant="outline" size="sm">
                    {accountLabel}
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                  <LogOut className="w-5 h-5 text-gray-600" />
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-[#1e3a8a] transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-[#1e3a8a] text-white text-sm rounded-lg hover:bg-[#1e3a8a]/90 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  to="/dashboard"
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  title="My Account"
                >
                  <User className="w-5 h-5 text-gray-600" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
