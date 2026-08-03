import { Link, useNavigate } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useAuth } from "@/features/auth/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

export default function Register() {
  const navigate = useNavigate();
  const { user, isLoading, googleLogin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (user) navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }, [isLoading, navigate, user]);

  const handleGoogleSuccess = useCallback(
    async (res: any) => {
      const credential = res?.credential;
      if (!credential) return toast.error("Google sign-in failed");

      setIsSubmitting(true);
      try {
        const nextUser = await googleLogin(credential);
        toast.success("Account ready");
        navigate(nextUser.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Google login failed");
      } finally {
        setIsSubmitting(false);
      }
    },
    [googleLogin, navigate]
  );

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 py-12">
      <Card className="w-full max-w-md border border-slate-200 shadow-2xl shadow-slate-300/30">
        <CardContent className="p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <img src={logo} alt="NEXii Studio logo" className="mb-3 h-12" />
            <h2 className="text-xl font-semibold text-slate-800">Sign up with Google</h2>
            <p className="mt-2 text-sm text-slate-500">
              Buyer accounts now use Google only. Admin access stays separate.
            </p>
          </div>

          {googleClientId ? (
            <div className="mt-2">
              <div className={`flex justify-center ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error("Google sign-in failed")}
                  theme="outline"
                  shape="pill"
                  text="signup_with"
                  locale="en"
                />
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Google redirects here after signup, so the session cookie is set reliably in production.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Google sign-in is not configured yet. Add <code>VITE_GOOGLE_CLIENT_ID</code> to enable buyer access.
            </div>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Continue with Google
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
