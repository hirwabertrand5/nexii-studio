import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Eye, DollarSign, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminCustomRequestsApi,
  type AdminRequestStatus,
  type AdminRequestSummary
} from "../api/adminApi";

const REQUEST_STATUS_FILTERS: Array<{ value: "all" | AdminRequestStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "under-review", label: "Under Review" },
  { value: "clarification-needed", label: "Needs Clarification" },
  { value: "quotation-sent", label: "Quoted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" }
];

const REQUEST_STATUS_ACTIONS: Partial<Record<AdminRequestStatus, Array<{ label: string; value: AdminRequestStatus }>>> = {
  pending: [
    { label: "Mark Under Review", value: "under-review" },
    { label: "Needs Clarification", value: "clarification-needed" }
  ],
  "under-review": [
    { label: "Needs Clarification", value: "clarification-needed" },
    { label: "Send Quote", value: "quotation-sent" }
  ],
  "clarification-needed": [
    { label: "Under Review", value: "under-review" },
    { label: "Send Quote", value: "quotation-sent" }
  ],
  "quotation-sent": [
    { label: "Approve", value: "approved" },
    { label: "Reject", value: "rejected" }
  ],
  approved: [
    { label: "In Progress", value: "in-progress" },
    { label: "Completed", value: "completed" }
  ],
  "in-progress": [{ label: "Completed", value: "completed" }],
  rejected: [],
  completed: []
};

function formatLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "under-review":
      return "bg-orange-100 text-orange-700";
    case "clarification-needed":
      return "bg-amber-100 text-amber-700";
    case "quotation-sent":
      return "bg-blue-100 text-blue-700";
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "in-progress":
      return "bg-purple-100 text-purple-700";
    case "completed":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminCustomRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AdminRequestSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | AdminRequestStatus>("all");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteTimeline, setQuoteTimeline] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await adminCustomRequestsApi.getAllRequests({ limit: 100 });
        setRequests(response.requests);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch requests");
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests =
    statusFilter === "all" ? requests : requests.filter((request) => request.status === statusFilter);

  const statusCounts = REQUEST_STATUS_FILTERS.reduce<Record<string, number>>((counts, item) => {
    if (item.value === "all") {
      counts.all = requests.length;
      return counts;
    }
    counts[item.value] = requests.filter((request) => request.status === item.value).length;
    return counts;
  }, {});

  const handleSendQuote = async (requestId: string) => {
    if (!quoteAmount || !quoteDescription || !quoteTimeline) {
      toast.error("Please fill all quotation fields");
      return;
    }

    const amountValue = Number(quoteAmount);
    if (!Number.isFinite(amountValue) || amountValue < 0) {
      toast.error("Quote amount must be a valid number");
      return;
    }

    try {
      const updatedRequest = await adminCustomRequestsApi.sendQuotation(requestId, {
        amount: amountValue,
        description: quoteDescription.trim(),
        timeline: quoteTimeline.trim()
      });

      setRequests((prev) => prev.map((request) => (request._id === requestId ? updatedRequest : request)));
      toast.success("Quote sent to customer!");
      setQuoteAmount("");
      setQuoteDescription("");
      setQuoteTimeline("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send quote");
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: AdminRequestStatus) => {
    try {
      const updatedRequest = await adminCustomRequestsApi.updateRequestStatus(requestId, newStatus);
      setRequests((prev) => prev.map((request) => (request._id === requestId ? updatedRequest : request)));
      toast.success("Status updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading requests: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Custom Design Requests</h1>
        <p className="text-muted-foreground">{filteredRequests.length} requests found</p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            {REQUEST_STATUS_FILTERS.map((item) => (
              <Button
                key={item.value}
                variant={statusFilter === item.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(item.value)}
              >
                {item.label} ({statusCounts[item.value] ?? 0})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => {
            const actions = REQUEST_STATUS_ACTIONS[request.status] ?? [];
            const canQuote = ["pending", "under-review", "clarification-needed"].includes(request.status);

            return (
              <Card key={request._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{request.projectTitle}</h3>
                        <span className={`px-3 py-1 text-sm rounded ${getStatusColor(request.status)}`}>
                          {formatLabel(request.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Request ID: {request._id.slice(0, 8)}...</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold mb-3">Client Information</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Name:</strong> {request.user.fullName}
                        </p>
                        <p>
                          <strong>Email:</strong> {request.user.email}
                        </p>
                        <p>
                          <strong>Country:</strong> {request.user.country || request.country || "-"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Project Details</h4>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Project Type:</strong> {formatLabel(request.projectType)}
                        </p>
                        <p>
                          <strong>Budget:</strong>{" "}
                          {request.budget !== undefined
                            ? `${request.budgetCurrency} ${request.budget.toLocaleString()}`
                            : "Not specified"}
                        </p>
                        <p>
                          <strong>Location:</strong> {request.location}
                        </p>
                        <p>
                          <strong>Size:</strong> {request.plotSize}m², {request.bedrooms} bed, {request.bathrooms} bath
                        </p>
                        <p>
                          <strong>Style:</strong> {request.architecturalStyle}
                        </p>
                        {request.quotation && (
                          <p>
                            <strong>Quote Sent:</strong> {new Date(request.quotation.sentAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">{request.description}</p>
                  </div>

                  {request.quotation && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">Quotation Details</p>
                      <p className="text-2xl font-bold text-blue-900 mb-2">
                        {request.quotation.currency} {request.quotation.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-700">Timeline: {request.quotation.estimatedTimeline}</p>
                      <p className="text-sm text-blue-700 mt-2">{request.quotation.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    {canQuote && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Send Quote
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Quote to {request.user.fullName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor={`quote-amount-${request._id}`}>Quote Amount (USD)</Label>
                              <Input
                                id={`quote-amount-${request._id}`}
                                type="number"
                                min="0"
                                value={quoteAmount}
                                onChange={(e) => setQuoteAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`quote-desc-${request._id}`}>Description</Label>
                              <Input
                                id={`quote-desc-${request._id}`}
                                type="text"
                                value={quoteDescription}
                                onChange={(e) => setQuoteDescription(e.target.value)}
                                placeholder="Brief description of the quote"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`quote-timeline-${request._id}`}>Timeline</Label>
                              <Input
                                id={`quote-timeline-${request._id}`}
                                type="text"
                                value={quoteTimeline}
                                onChange={(e) => setQuoteTimeline(e.target.value)}
                                placeholder="e.g., 2-3 weeks"
                              />
                            </div>
                            <Button onClick={() => handleSendQuote(request._id)} className="w-full">
                              Send Quote
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {actions.map((action) => (
                      <Button
                        key={action.value}
                        variant="outline"
                        onClick={() => handleStatusChange(request._id, action.value)}
                      >
                        {action.label}
                      </Button>
                    ))}

                    <Button variant="outline">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Customer
                    </Button>

                    <Button variant="ghost" onClick={() => navigate(`/admin/custom-requests/${request._id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No requests found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
