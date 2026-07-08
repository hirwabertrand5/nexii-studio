import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { adminLogin, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [isLoading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const authUser = await adminLogin({ email, password });
      toast.success("Welcome, admin.");
      navigate(authUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-12">
      <Card className="w-full max-w-md border border-white/10 bg-white/95 shadow-2xl backdrop-blur">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <img src={logo} alt="NEXii Studio logo" className="h-12 mb-3" />
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 mb-2">Admin Access</p>
            <h1 className="text-2xl font-semibold text-slate-900">Sign in to the admin panel</h1>
            <p className="text-sm text-slate-500 mt-2">
              Use the admin email and temporary password created by the setup script.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexii-studio.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>

            <Button type="submit" size="lg" className="w-full font-semibold" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Admin Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>
              Buyer account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Go to buyer sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
