import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { countries } from "@/shared/data/countries";
import { Loader2, ShoppingBag, FileText, DollarSign, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getMyOrders, getMyRequests, type BuyerOrder, type BuyerRequest } from "../api/buyerApi";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export default function BuyerProfilePage() {
  const { user, updateProfile } = useAuth();
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    country: "",
  });

  useEffect(() => {
    setProfileForm({
      fullName: user?.fullName ?? "",
      country: user?.country ?? "",
    });
  }, [user?.country, user?.fullName]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const [ordersRes, requestsRes] = await Promise.all([getMyOrders(), getMyRequests()]);
        setOrders(ordersRes.orders ?? []);
        setRequests(requestsRes.requests ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your profile");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "paid"),
    [orders]
  );
  const totalSpent = useMemo(
    () => completedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    [completedOrders]
  );
  const latestOrder = completedOrders[0];
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown";
  const hasChanges =
    profileForm.fullName.trim() !== (user?.fullName ?? "").trim() ||
    profileForm.country !== (user?.country ?? "");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        fullName: profileForm.fullName.trim(),
        country: profileForm.country.trim() || null,
      });
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetProfile = () => {
    setProfileForm({
      fullName: user?.fullName ?? "",
      country: user?.country ?? "",
    });
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
        <h1 className="text-3xl mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">This page reflects your live account data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName ?? "User"} />
                  <AvatarFallback>
                    {user?.fullName
                      ?.split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-semibold">{user?.fullName}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">{user?.role ?? "buyer"}</Badge>
                    <Badge variant="outline">{user?.country || "Country not set"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Member since {memberSince}</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 border-t border-border pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={profileForm.country}
                      onValueChange={(value) => setProfileForm((prev) => ({ ...prev, country: value }))}
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
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email ?? ""}
                    readOnly
                    disabled
                    className="bg-muted"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your email is linked to sign-in and cannot be changed here.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={isSaving || !hasChanges}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetProfile}
                    disabled={isSaving || !hasChanges}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Purchases</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground mb-1">Custom Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                  <p className="text-2xl font-bold">{formatMoney(totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Latest Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              {latestOrder ? (
                <div className="space-y-3">
                  <p className="font-semibold">{latestOrder.plans.map((plan) => plan.title).join(", ")}</p>
                  <p className="text-sm text-muted-foreground">
                    Order {latestOrder.transactionReference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(latestOrder.createdAt).toLocaleDateString()}
                  </p>
                  <p className="font-semibold">
                    {formatMoney(latestOrder.totalAmount, latestOrder.currency)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No purchases yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Need help with your account or files?
              </p>
              <p><strong>Email:</strong> support@nexii.com</p>
              <p><strong>Phone:</strong> +250 796066681</p>
              <p><strong>Hours:</strong> Mon-Fri, 9AM-5PM WAT</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Requests
                </span>
                <span className="font-semibold">{requests.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </span>
                <span className="font-semibold">{orders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Paid Orders
                </span>
                <span className="font-semibold">{completedOrders.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
