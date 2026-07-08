import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Loader2, ArrowLeft, Download, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { adminPaymentsApi, type AdminOrderSummary } from "../api/adminApi";

const ORDER_STATUS_OPTIONS = [
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" }
] as const;

function formatLabel(value?: string) {
  if (!value) return "Not set";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status?: string) {
  switch (status) {
    case "paid":
    case "completed":
    case "verified":
      return "bg-green-100 text-green-700";
    case "pending":
    case "processing":
      return "bg-yellow-100 text-yellow-700";
    case "failed":
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function OrderDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.id;

  const [order, setOrder] = useState<AdminOrderSummary | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Record<string, unknown> | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("processing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError("Missing order ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [orderRes, historyRes] = await Promise.all([
          adminPaymentsApi.getOrderById(orderId),
          adminPaymentsApi.getPaymentHistory(orderId)
        ]);
        setOrder(orderRes);
        setPaymentHistory(historyRes);
        setSelectedStatus(orderRes.orderStatus ?? "processing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load order");
        toast.error("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleSaveStatus = async () => {
    if (!orderId) return;

    setSaving(true);
    try {
      const updated = await adminPaymentsApi.updateOrderStatus(orderId, selectedStatus);
      setOrder(updated);
      toast.success("Order status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDownload = async () => {
    if (!orderId) return;

    setSaving(true);
    try {
      const updated = await adminPaymentsApi.toggleDownloadAccess(orderId);
      setOrder(updated);
      toast.success(updated.downloadAccess ? "Download access enabled" : "Download access disabled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update download access");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading order: {error ?? "Order not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl mb-1">Order Details</h1>
          <p className="text-muted-foreground">Transaction {order.transactionReference}</p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded text-xs ${statusClass(order.paymentStatus)}`}>
            Payment: {formatLabel(order.paymentStatus)}
          </span>
          <span className={`px-3 py-1 rounded text-xs ${statusClass(order.orderStatus)}`}>
            Order: {formatLabel(order.orderStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Purchased Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.plans.map((plan, idx) => (
              <div key={`${plan.title}-${idx}`} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="font-semibold">{plan.title}</p>
                  <p className="text-sm text-muted-foreground">Plan ID: {plan.plan ?? "N/A"}</p>
                </div>
                <p className="font-semibold">${plan.price.toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Order Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleSaveStatus} disabled={saving}>
              {saving ? "Saving..." : "Save Status"}
            </Button>

            <Button variant="outline" className="w-full" onClick={handleToggleDownload} disabled={saving}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              Toggle Download Access
            </Button>

            {order.receiptUrl && (
              <Button asChild variant="secondary" className="w-full">
                <a href={order.receiptUrl} target="_blank" rel="noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  View Receipt
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer & Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-semibold">{order.user.fullName}</p>
              <p>{order.user.email}</p>
              <p>{order.user.country || "No country set"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold">
                  {(order.currency ?? "USD")} {order.totalAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{formatLabel(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Verification</p>
                <p className="font-semibold">{formatLabel(order.verificationStatus)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Download Access</p>
                <p className="font-semibold">{order.downloadAccess ? "Enabled" : "Disabled"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Transaction Reference</p>
                <p className="font-mono break-all">{order.transactionReference}</p>
              </div>
              {order.paymentReference && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Payment Reference</p>
                  <p className="font-mono break-all">{order.paymentReference}</p>
                </div>
              )}
              {order.paymentGateway && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Gateway</p>
                  <p className="font-semibold">{formatLabel(order.paymentGateway)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {paymentHistory ? (
              Object.entries(paymentHistory).map(([key, value]) => (
                <div key={key} className="flex items-start justify-between gap-4 border-b border-border pb-2">
                  <p className="text-muted-foreground capitalize">{formatLabel(key)}</p>
                  <p className="text-right">
                    {typeof value === "string"
                      ? value
                      : typeof value === "number" || typeof value === "boolean"
                      ? String(value)
                      : value
                      ? JSON.stringify(value)
                      : "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No payment history available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Updated</p>
            <p className="font-medium">{order.updatedAt ? new Date(order.updatedAt).toLocaleString() : "Not available"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Order ID</p>
            <p className="font-mono break-all">{order._id}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate("/admin/orders")}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Return to Orders
        </Button>
      </div>
    </div>
  );
}
