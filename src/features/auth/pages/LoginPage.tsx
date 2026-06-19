import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const navigate = useNavigate();
  const { login, user, isLoading, googleLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user) navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [isLoading, navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      toast.success("Welcome back!");
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (res: any) => {
    const credential = res?.credential;
    if (!credential) return toast.error("Google sign-in failed");
    setIsSubmitting(true);
    try {
      await googleLogin(credential);
      toast.success("Signed in with Google");
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">

      <Card className="w-full max-w-md shadow-2xl border border-slate-200">

        <CardContent className="p-8">

          {/* Logo + Brand */}
          <div className="flex flex-col items-center text-center mb-8">

            <img
              src={logo}
              alt="NEXii Studio logo"
              className="h-12 mb-3"
            />

            <h2 className="text-xl font-semibold text-slate-800">
              Login to your account
            </h2>

           
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>

              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

          </form>

          <div className="mt-4">
            <div className="text-center text-sm text-slate-500 mb-3">Or continue with</div>
            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google sign-in failed")} />
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center text-sm">

            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-medium hover:underline"
              >
                Create account
              </Link>
            </p>

          </div>

        </CardContent>
      </Card>

    </div>
  );
}
