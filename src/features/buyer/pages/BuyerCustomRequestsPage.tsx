import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Plus, Calendar, MapPin, Bed, DollarSign, Loader2, FileText } from "lucide-react";
import { getMyRequests, type BuyerRequest } from "../api/buyerApi";

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function statusClasses(status: string) {
  switch (status) {
    case "approved":
    case "completed":
    case "accepted":
      return "bg-green-100 text-green-700";
    case "quotation-sent":
    case "under-review":
    case "in-progress":
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

export default function BuyerCustomRequestsPage() {
  const [requests, setRequests] = useState<BuyerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await getMyRequests();
        setRequests(res.requests ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load your requests");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Custom Design Requests</h1>
          <p className="text-muted-foreground">
            This list comes from your own account only.
          </p>
        </div>
        <Link to="/custom-design">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {requests.map((request) => (
          <Card key={request._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-xl mb-2">{request.projectTitle}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {request.bedrooms} bedrooms
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm rounded ${statusClasses(request.status)}`}>
                  {request.status.replace(/-/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Bed className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Bedrooms</p>
                    <p className="font-semibold">{request.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Plot Size</p>
                    <p className="font-semibold">{request.plotSize} m²</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold">{formatMoney(request.budget, request.budgetCurrency)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-sm">Description</h4>
                <p className="text-sm text-muted-foreground">{request.description}</p>
              </div>

              {request.quotation ? (
                <div className="border-t border-border pt-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quoted Price</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatMoney(request.quotation.amount, request.quotation.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estimated timeline: {request.quotation.estimatedTimeline}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">View Details</Button>
                      {request.quotation.status === "pending" ? (
                        <Button>Review Quote</Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {!request.quotation ? (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Your request is under review. We will contact you once a quotation is ready.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {requests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl mb-2">No custom requests yet</h3>
            <p className="text-muted-foreground mb-6">
              Submit a custom design request to get a personalized house plan.
            </p>
            <Link to="/custom-design">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Request
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
