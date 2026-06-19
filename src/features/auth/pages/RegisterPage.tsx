import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { countries } from "@/shared/data/countries";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Register() {
  const navigate = useNavigate();
  const { register, user, isLoading, googleLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user) navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [isLoading, navigate, user]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        country: formData.country || undefined
      });
      toast.success("Account created successfully!");
      navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
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

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-12 flex justify-center">

      <Card className="w-full max-w-md shadow-2xl border border-slate-200">

        <CardContent className="p-8">

          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-8">

            <img
              src={logo}
              alt="NEXii Studio logo"
              className="h-12 mb-3"
            />

            <h2 className="text-xl font-semibold text-slate-800">
              Create your account
            </h2>



          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>

              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="your full name "
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>

              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>

              <Select
                value={formData.country}
                onValueChange={(value) => handleChange("country", value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>

                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>

              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>

              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </Button>

          </form>

          <div className="mt-4">
            <div className="text-center text-sm text-slate-500 mb-3">Or continue with</div>
            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google sign-in failed")} />
            </div>
          </div>

          {/* Login link */}
          <div className="mt-6 text-center text-sm">

            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>

          </div>

        </CardContent>
      </Card>
    </div>
  );
}
