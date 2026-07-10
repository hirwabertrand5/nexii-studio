import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { CheckCircle, Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/shared/api/http";
import { getMyOrders, type BuyerOrder, type BuyerOrderPlanItem } from "../api/buyerApi";

type DownloadFile = {
  label: string;
  fileName: string;
  contentType: string;
  sizeInBytes: number | null;
  downloadUrl?: string | null;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80";

function getPlanImage(plan: BuyerOrderPlanItem) {
  if (typeof plan.plan !== "object") return FALLBACK_IMAGE;
  return plan.plan.previewImages?.[0] || plan.plan.images?.[0] || FALLBACK_IMAGE;
}

function getPlanId(plan: BuyerOrderPlanItem) {
  return typeof plan.plan === "object" ? plan.plan._id : String(plan.plan);
}

function getOrderPaymentLabel(order: BuyerOrder) {
  if (order.paymentStatus === "paid") return "Paid";
  if (order.paymentStatus === "failed") return "Failed";
  if (order.paymentStatus === "refunded") return "Refunded";
  if (order.paymentStatus === "cancelled" || order.orderStatus === "cancelled") return "Cancelled";
  return "Pending Payment";
}

function getOrderPaymentClass(order: BuyerOrder) {
  if (order.paymentStatus === "paid") return "bg-green-100 text-green-700";
  if (order.paymentStatus === "failed") return "bg-red-100 text-red-700";
  if (order.paymentStatus === "refunded") return "bg-blue-100 text-blue-700";
  if (order.paymentStatus === "cancelled" || order.orderStatus === "cancelled") return "bg-gray-100 text-gray-700";
  return "bg-yellow-100 text-yellow-700";
}

export default function PurchasedPlansPage() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDownload, setActiveDownload] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<Record<string, DownloadFile[]>>({});
  const [loadingDeliverables, setLoadingDeliverables] = useState<Record<string, boolean>>({});
  const requestedPlanIds = useRef<Set<string>>(new Set());

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

  const completedOrders = useMemo(() => orders.filter((order) => order.paymentStatus === "paid" || order.downloadAccess), [orders]);
  const visibleOrders = useMemo(() => orders, [orders]);

  useEffect(() => {
    const pendingPlans = completedOrders.flatMap((order) =>
      order.plans
        .filter((plan) => order.downloadAccess && !deliverables[getPlanId(plan)] && !requestedPlanIds.current.has(getPlanId(plan)))
        .map((plan) => ({ plan }))
    );

    if (pendingPlans.length === 0) return;

    pendingPlans.forEach(async ({ plan }) => {
      const planId = getPlanId(plan);
      requestedPlanIds.current.add(planId);
      setLoadingDeliverables((prev) => ({ ...prev, [planId]: true }));

      try {
        const res = await http<{ download: { files: DownloadFile[] } }>(`/api/downloads/${planId}`, { method: "GET" });
        setDeliverables((prev) => ({ ...prev, [planId]: res.download.files ?? [] }));
      } catch {
        setDeliverables((prev) => ({ ...prev, [planId]: [] }));
      } finally {
        setLoadingDeliverables((prev) => ({ ...prev, [planId]: false }));
      }
    });
  }, [completedOrders, deliverables]);

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
          These are the plans and payment statuses tied to your account.
        </p>
      </div>

      {visibleOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg mb-2">No orders yet</h3>
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
          {visibleOrders.map((order) => (
            <Card key={order._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl mb-1">Order {order.transactionReference}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.currency} {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded ${getOrderPaymentClass(order)}`}>
                    {getOrderPaymentLabel(order)}
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
                                {getOrderPaymentLabel(order)}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <p><strong>Price:</strong> {order.currency} {plan.price.toLocaleString()}</p>
                            <p><strong>Plan ID:</strong> {getPlanId(plan)}</p>
                            <p><strong>Order Status:</strong> {getOrderPaymentLabel(order)}</p>
                            <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                          </div>
                        </div>

                        <div className="md:col-span-3">
                          <div className="bg-muted p-4 rounded-lg h-full">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Private Deliverables
                            </h4>
                            <p className="text-sm text-muted-foreground mb-4">
                              Files unlock automatically after payment and stay private to your account.
                            </p>
                            {order.downloadAccess && (
                              <div className="space-y-2 mb-4">
                                {loadingDeliverables[getPlanId(plan)] ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading files...
                                  </div>
                                ) : (deliverables[getPlanId(plan)]?.length ?? 0) > 0 ? (
                                  <ul className="space-y-2 text-sm">
                                    {deliverables[getPlanId(plan)]?.map((file) => (
                                      <li key={file.fileName} className="rounded border border-border bg-background/70 px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <span>{file.label}</span>
                                          {file.downloadUrl ? (
                                            <a href={file.downloadUrl} className="text-primary underline" target="_blank" rel="noreferrer">
                                              Download
                                            </a>
                                          ) : null}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No private files were uploaded for this plan yet.</p>
                                )}
                              </div>
                            )}
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
                              {order.downloadAccess ? "Refresh Access" : "Not Available"}
                            </Button>
                            {!order.downloadAccess && order.paymentStatus !== "refunded" && order.paymentStatus !== "cancelled" && (
                              <Button asChild className="mt-3 w-full">
                                <a href={`/checkout/${getPlanId(plan)}`}>Retry Payment</a>
                              </Button>
                            )}
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
