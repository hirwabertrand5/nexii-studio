import { Outlet, Link, useLocation } from 'react-router';
import { Building2, ShoppingCart, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import logo from "../assets/logo.png";

export default function RootLayout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
  <img
    src={logo}
    alt="NEXii Logo"
    className="h-10 w-auto object-contain"
  />
</Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/catalog" className="text-foreground hover:text-primary transition-colors">
                House Plans
              </Link>
              <Link to="/custom-design" className="text-foreground hover:text-primary transition-colors">
                Custom Design
              </Link>
              <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6" />
                <span className="text-xl font-bold">NEXii</span>
              </div>
              <p className="text-sm text-accent-foreground/80">
                International architectural firm specializing in African market house plans and custom designs.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/catalog" className="hover:underline">Browse Plans</Link></li>
                <li><Link to="/custom-design" className="hover:underline">Custom Design</Link></li>
                <li><a href="#how-it-works" className="hover:underline">How It Works</a></li>
                <li><Link to="/register" className="hover:underline">Get Started</Link></li>
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/catalog?category=Bungalow" className="hover:underline">Bungalow</Link></li>
                <li><Link to="/catalog?category=Duplex" className="hover:underline">Duplex</Link></li>
                <li><Link to="/catalog?category=Modern+Villa" className="hover:underline">Modern Villa</Link></li>
                <li><Link to="/catalog?category=African+Contemporary" className="hover:underline">African Contemporary</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Email: info@nexii.com</li>
                <li>Phone: +234 800 000 0000</li>
                <li>Address: Lagos, Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-accent-foreground/20 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 NEXii. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
