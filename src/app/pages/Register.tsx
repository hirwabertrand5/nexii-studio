import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { africanCountries } from "../data/mockData";
import { toast } from "sonner";
import logo from "../assets/logo.png";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    toast.success("Account created successfully!");
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4">

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
                placeholder="John Doe"
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
                  {africanCountries.map((country) => (
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
            >
              Create Account
            </Button>

          </form>

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
