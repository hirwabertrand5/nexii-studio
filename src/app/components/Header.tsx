import { Link, useLocation } from "react-router";
import { User } from "lucide-react";
import logo from "@/assets/logo.png";
export function Header() {
  const location = useLocation();

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
              to="/buyer"
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              title="My Account"
            >
              <User className="w-5 h-5 text-gray-600" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
