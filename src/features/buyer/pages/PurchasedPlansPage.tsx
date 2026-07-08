import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { Download, FileText, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/shared/api/http";
import { getMyOrders, type BuyerOrder, type BuyerOrderPlanItem } from "../api/buyerApi";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80";

function getPlanImage(plan: BuyerOrderPlanItem) {
  if (typeof plan.plan !== "object") return FALLBACK_IMAGE;
  return plan.plan.previewImages?.[0] || plan.plan.images?.[0] || FALLBACK_IMAGE;
}

function getPlanId(plan: BuyerOrderPlanItem) {
  return typeof plan.plan === "object" ? plan.plan._id : String(plan.plan);
}

export default function PurchasedPlansPage() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await getMyOrders();
        setOrders(res.orders ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your purchases");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const completedOrders = orders.filter((order) => order.paymentStatus === "paid" || order.downloadAccess);

  const handleDownload = async (plan: BuyerOrderPlanItem) => {
    const planId = getPlanId(plan);
    setActiveDownload(planId);
    try {
      const res = await http<{ download: { files: { label: string }[]; downloadToken: string } }>(
        `/api/downloads/${planId}`,
        { method: "GET" }
      );
      toast.success(`Download authorized for ${plan.title}. ${res.download.files.length} files ready.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not authorize download");
    } finally {
      setActiveDownload(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-red-600">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">My Purchased Plans</h1>
        <p className="text-muted-foreground">
          These are the plans tied to your account and completed orders.
        </p>
      </div>

      {completedOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg mb-2">No completed purchases yet</h3>
            <p className="text-muted-foreground mb-6">
              Buy a plan from the catalog to see it here.
            </p>
            <Button asChild>
              <a href="/catalog">Browse Plans</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {completedOrders.map((order) => (
            <Card key={order._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl mb-1">Order {order.transactionReference}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.currency} {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="space-y-4">
                  {order.plans.map((plan) => {
                    const resolvedPlan = typeof plan.plan === "object" ? plan.plan : null;
                    return (
                      <div key={resolvedPlan?._id ?? plan.title} className="grid grid-cols-1 md:grid-cols-12 gap-6 border border-border rounded-lg p-4">
                        <div className="md:col-span-3">
                          <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                            <ImageWithFallback
                              src={getPlanImage(plan)}
                              alt={plan.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        <div className="md:col-span-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-lg mb-1">{plan.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {resolvedPlan?.category ?? "House plan"}
                              </p>
                            </div>
                            {order.downloadAccess ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">
                                Ready
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded">
                                Pending
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <p><strong>Price:</strong> {order.currency} {plan.price.toLocaleString()}</p>
                            <p><strong>Plan ID:</strong> {getPlanId(plan)}</p>
                            <p><strong>Order Status:</strong> {order.orderStatus}</p>
                            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="bg-muted p-4 rounded-lg h-full">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Download
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Secure download access is tied to your paid order.
                            </p>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleDownload(plan)}
                              disabled={!order.downloadAccess || activeDownload === getPlanId(plan)}
                            >
                              {activeDownload === getPlanId(plan) ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              {order.downloadAccess ? "Authorize Download" : "Not Available"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Need Help?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">File Access</p>
                <p className="text-sm text-muted-foreground">
                  Downloads are authorized from your own completed orders only.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Formats</p>
                <p className="text-sm text-muted-foreground">
                  Your plan files come from the live plan catalog, not demo data.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
