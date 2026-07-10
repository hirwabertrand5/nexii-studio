import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentStatusPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const isSuccess = query.get("gateway") !== "cancel" && query.get("gateway") !== "failed";
  const gateway = query.get("gateway") ?? "payment";
  const orderId = query.get("orderId");

  useEffect(() => {
    if (!orderId) return;
    const timer = window.setTimeout(() => {
      navigate("/dashboard/purchased", { replace: true });
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [navigate, orderId]);

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardContent className="p-8 text-center">
          {isSuccess ? (
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-600" />
          ) : (
            <XCircle className="mx-auto mb-4 h-14 w-14 text-red-600" />
          )}
          <h1 className="text-2xl font-semibold mb-2">
            {isSuccess ? "Payment completed" : "Payment cancelled"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isSuccess
              ? `Your ${gateway} payment was received. Your private deliverables will be available in your dashboard shortly.`
              : "Your payment was not completed. You can try again from the plan page."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button onClick={() => navigate("/dashboard/purchased")}>Open My Purchases</Button>
            <Button variant="outline" onClick={() => navigate("/catalog")}>Browse More Plans</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
