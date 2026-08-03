import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

function getGoogleLoginUri() {
  const apiBase = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  return apiBase ? `${apiBase}/api/auth/google-login` : "/api/auth/google-login";
}

export default function Login() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user) navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [isLoading, navigate, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-10">
      <Card className="mx-auto w-full max-w-md border border-slate-200 shadow-2xl shadow-slate-300/30">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logo} alt="NEXii Studio logo" className="mb-3 h-12" />
            <h2 className="text-xl font-semibold text-slate-800">Continue with Google</h2>
            <p className="mt-2 text-sm text-slate-500">
              Buyer accounts use Google only. Admin access stays on the separate admin login.
            </p>
          </div>

          {googleClientId ? (
            <div className="mt-2">
              <div className="flex justify-center">
                <GoogleLogin
                  login_uri={getGoogleLoginUri()}
                  ux_mode="redirect"
                  theme="outline"
                  shape="pill"
                  text="signin_with"
                  locale="en"
                />
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Google redirects here after login, so production sessions can be set reliably.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Google sign-in is not configured yet. Add <code>VITE_GOOGLE_CLIENT_ID</code> to enable buyer access.
            </div>
          )}

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Sign up with Google
              </Link>
            </p>
            <p className="text-slate-500">
              Admin?{" "}
              <Link to="/admin/login" className="font-medium text-primary hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
