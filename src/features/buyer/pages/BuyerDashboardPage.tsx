import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Package, FileText, Download, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getMyOrders, getMyRequests, type BuyerOrder, type BuyerRequest } from "../api/buyerApi";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function orderLabel(order: BuyerOrder) {
  return order.plans.map((item) => item.title).join(", ");
}

function requestStatusClass(status: string) {
  switch (status) {
    case "approved":
    case "completed":
      return "bg-green-100 text-green-700";
    case "quotation-sent":
    case "under-review":
      return "bg-blue-100 text-blue-700";
    case "clarification-needed":
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [ordersRes, requestsRes] = await Promise.all([getMyOrders(), getMyRequests()]);
        setOrders(ordersRes.orders ?? []);
        setRequests(requestsRes.requests ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const paidOrders = useMemo(() => orders.filter((order) => order.paymentStatus === "paid"), [orders]);
  const completedOrders = useMemo(() => orders.filter((order) => order.orderStatus === "completed"), [orders]);
  const totalSpent = useMemo(
    () => paidOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [paidOrders]
  );
  const recentOrders = orders.slice(0, 3);
  const recentRequests = requests.slice(0, 3);
  const downloadablePlans = orders
    .filter((order) => order.downloadAccess)
    .reduce((count, order) => count + order.plans.length, 0);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
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
        <h1 className="text-3xl mb-2">
          Welcome back, {user?.fullName?.split(" ")[0] ?? "there"}!
        </h1>
        <p className="text-muted-foreground">
          This dashboard shows only your orders, downloads, and custom requests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Purchased Plans</p>
                <p className="text-3xl font-bold">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Custom Requests</p>
                <p className="text-3xl font-bold">{requests.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Downloads</p>
                <p className="text-3xl font-bold">{downloadablePlans}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-bold">{formatMoney(totalSpent)}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Recent Purchases</h2>
          <Link to="/dashboard/purchased">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse the catalog to find a plan for your next project.
              </p>
              <Link to="/catalog">
                <Button>Browse Plans</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentOrders.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{orderLabel(order)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.plans.length} plan{order.plans.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Ordered on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="font-semibold">{formatMoney(order.totalAmount, order.currency)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Custom Design Requests</h2>
          <Link to="/dashboard/custom-requests">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">No custom requests yet</h3>
              <p className="text-muted-foreground mb-6">
                Submit a custom request so we can tailor a design to your site.
              </p>
              <Link to="/custom-design">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Custom Design
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <Card key={request._id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">{request.projectTitle}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.country} • {request.location}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${requestStatusClass(request.status)}`}>
                      {request.status.replace(/-/g, " ")}
                    </span>
                  </div>
                  {request.quotation?.amount ? (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Quoted price
                      </p>
                      <p className="font-semibold">
                        {formatMoney(request.quotation.amount, request.quotation.currency)}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/catalog" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Browse House Plans</h4>
                  <p className="text-sm text-muted-foreground">Explore live catalog data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/custom-design" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Request Custom Design</h4>
                  <p className="text-sm text-muted-foreground">Create a new request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Account: {user?.email}
      </p>
      <p className="text-xs text-muted-foreground">
        Completed orders: {completedOrders.length}
      </p>
    </div>
  );
}
