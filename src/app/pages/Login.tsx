import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (email === "admin@nexii.rw") {
      toast.success("Welcome back, Admin!");
      setTimeout(() => navigate("/admin"), 1000);
    } else {
      toast.success("Welcome back!");
      setTimeout(() => navigate("/dashboard"), 1000);
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
            >
              Sign In
            </Button>

          </form>

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

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-slate-50 border text-xs text-slate-600">

            <p className="font-semibold mb-2">Demo Credentials</p>

            <p>Admin: admin@nexii.rw</p>
            <p>Buyer: buyer@example.com</p>

          </div>

        </CardContent>
      </Card>

    </div>
  );
}
