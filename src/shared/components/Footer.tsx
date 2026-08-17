import { Link, useNavigate } from "react-router";
import { Mail, Phone, Facebook, Twitter, Instagram, Linkedin, LogOut } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/features/auth/context/AuthContext";
import { SUPPORTED_PLAN_CATEGORIES } from "@/features/public/api/plansApi";

export function Footer() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const accountHref = user?.role === "admin" ? "/admin" : "/dashboard";

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <footer className="bg-[#1e3a8a] text-white mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-[#1e3a8a] font-bold text-sm"></span>
              </div>
              <span className="text-xl font-semibold"></span>
            </div>
            <p className="text-sm text-blue-100">
              International architectural firm providing ready-made house plans and custom designs for the African market.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/catalog" className="hover:text-white">Browse Plans</Link></li>
              <li><Link to="/custom-design" className="hover:text-white">Custom Design</Link></li>
              <li>
                {isAuthenticated && user ? (
                  <Link to={accountHref} className="hover:text-white">
                    My Account
                  </Link>
                ) : (
                  <Link to="/login" className="hover:text-white">
                    Login
                  </Link>
                )}
              </li>
              {isAuthenticated && user && (
                <li>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-0 text-blue-100 hover:text-white hover:bg-transparent"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </Button>
                </li>
              )}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Categories</h3>
            <ul className="space-y-2 text-sm text-blue-100">
              {SUPPORTED_PLAN_CATEGORIES.map((category) => (
                <li key={category.value}>
                  <Link
                    to={`/catalog?category=${encodeURIComponent(category.value)}`}
                    className="hover:text-white"
                  >
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-blue-100">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>info@nexii.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>+250 796066681</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded flex items-center justify-center hover:bg-white/20 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-blue-100">
          © 2025 NEXii. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
