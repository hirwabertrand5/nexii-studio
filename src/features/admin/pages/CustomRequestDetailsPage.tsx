import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { Loader2, ArrowLeft, Send, Save, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";
import { adminCustomRequestsApi, type AdminRequestStatus, type AdminRequestSummary } from "../api/adminApi";

const REQUEST_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "under-review", label: "Under Review" },
  { value: "clarification-needed", label: "Needs Clarification" },
  { value: "quotation-sent", label: "Quotation Sent" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" }
] as const;

function formatLabel(value?: string) {
  if (!value) return "Not set";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function badgeClass(status?: string) {
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

function getClientName(request: AdminRequestSummary) {
  return request.user?.fullName ?? request.contactName ?? "Guest client";
}

function getClientEmail(request: AdminRequestSummary) {
  return request.user?.email ?? request.contactEmail ?? "-";
}

function getClientCountry(request: AdminRequestSummary) {
  return request.user?.country || request.country || "No country set";
}

export default function CustomRequestDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const requestId = params.id;

  const [request, setRequest] = useState<AdminRequestSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AdminRequestStatus>("pending");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("USD");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteTimeline, setQuoteTimeline] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) {
        setError("Missing request ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await adminCustomRequestsApi.getRequestById(requestId);
        setRequest(response);
        setSelectedStatus(response.status);
        setAdminNotes(response.adminNotes ?? "");
        setQuoteCurrency(response.quotation?.currency ?? "USD");
        setQuoteAmount(response.quotation?.amount ? String(response.quotation.amount) : "");
        setQuoteDescription(response.quotation?.description ?? "");
        setQuoteTimeline(response.quotation?.estimatedTimeline ?? "");
        setQuoteNotes(response.quotation?.notes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load request");
        toast.error("Failed to load request");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  const handleStatusSave = async () => {
    if (!requestId) return;

    setSaving(true);
    try {
      const updated = await adminCustomRequestsApi.updateRequestStatus(requestId, selectedStatus);
      setRequest(updated);
      toast.success("Request status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update request status");
    } finally {
      setSaving(false);
    }
  };

  const handleQuotationSave = async () => {
    if (!requestId) return;
    if (!quoteAmount || !quoteDescription || !quoteTimeline) {
      toast.error("Amount, description, and timeline are required");
      return;
    }

    const amount = Number(quoteAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Quote amount must be a valid number");
      return;
    }

    setSaving(true);
    try {
      const updated = await adminCustomRequestsApi.sendQuotation(requestId, {
        amount,
        currency: quoteCurrency.trim() || "USD",
        description: quoteDescription.trim(),
        timeline: quoteTimeline.trim(),
        notes: quoteNotes.trim() || undefined
      });
      setRequest(updated);
      toast.success("Quotation sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send quotation");
    } finally {
      setSaving(false);
    }
  };

  const handleNotesSave = async () => {
    if (!requestId) return;

    setSaving(true);
    try {
      const updated = await adminCustomRequestsApi.addNotes(requestId, adminNotes);
      setRequest(updated);
      toast.success("Notes saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save notes");
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

  if (error || !request) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading request: {error ?? "Request not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/custom-requests">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl mb-1">{request.projectTitle}</h1>
          <p className="text-muted-foreground">Request ID: {request._id}</p>
        </div>
        <span className={`px-3 py-1 rounded text-xs w-fit ${badgeClass(request.status)}`}>
          {formatLabel(request.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-semibold">{getClientName(request)}</p>
                <p>{getClientEmail(request)}</p>
                <p>{getClientCountry(request)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Project Type</p>
                <p className="font-semibold">{formatLabel(request.projectType)}</p>
                <p className="text-muted-foreground mt-3">Location</p>
                <p className="font-semibold">{request.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Budget</p>
                <p className="font-semibold">
                  {request.budgetCurrency} {request.budget.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Measurements</p>
                <p className="font-semibold">
                  {request.plotSize}m², {request.bedrooms} bed, {request.bathrooms} bath, {request.floors} floor(s)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Architectural Style</p>
                <p className="font-semibold">{request.architecturalStyle}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Assigned Architect</p>
                <p className="font-semibold">
                  {request.assignedArchitect ? request.assignedArchitect.fullName : "Not assigned"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">{request.description}</p>
            </div>

            {request.functionalRequirements?.length ? (
              <div>
                <h3 className="font-semibold mb-2">Functional Requirements</h3>
                <div className="space-y-2">
                  {request.functionalRequirements.map((item, idx) => (
                    <div key={`${item}-${idx}`} className="rounded-lg border border-border p-3 text-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {request.inspirationPreferences?.length ? (
              <div>
                <h3 className="font-semibold mb-2">Inspiration Preferences</h3>
                <div className="space-y-2">
                  {request.inspirationPreferences.map((item, idx) => (
                    <div key={`${item}-${idx}`} className="rounded-lg border border-border p-3 text-sm">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AdminRequestStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {REQUEST_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" onClick={handleStatusSave} disabled={saving}>
              {saving ? "Saving..." : "Save Status"}
            </Button>

            <div className="pt-2 border-t border-border">
              <h3 className="font-semibold mb-3">Quick Quotation</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="quote-amount">Amount</Label>
                  <Input id="quote-amount" type="number" min="0" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="quote-currency">Currency</Label>
                  <Input id="quote-currency" value={quoteCurrency} onChange={(e) => setQuoteCurrency(e.target.value)} placeholder="USD" />
                </div>
                <div>
                  <Label htmlFor="quote-timeline">Timeline</Label>
                  <Input id="quote-timeline" value={quoteTimeline} onChange={(e) => setQuoteTimeline(e.target.value)} placeholder="2-3 weeks" />
                </div>
                <div>
                  <Label htmlFor="quote-description">Description</Label>
                  <Textarea
                    id="quote-description"
                    value={quoteDescription}
                    onChange={(e) => setQuoteDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe what this quotation includes"
                  />
                </div>
                <div>
                  <Label htmlFor="quote-notes">Notes</Label>
                  <Textarea
                    id="quote-notes"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    rows={3}
                    placeholder="Optional internal or client notes"
                  />
                </div>
                <Button className="w-full" variant="secondary" onClick={handleQuotationSave} disabled={saving}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Quotation
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <h3 className="font-semibold mb-3">Admin Notes</h3>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
                placeholder="Add internal notes for the team"
              />
              <Button className="w-full mt-3" variant="outline" onClick={handleNotesSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Notes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {request.quotation ? (
              <>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-semibold">
                    {request.quotation.currency} {request.quotation.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timeline</p>
                  <p className="font-semibold">{request.quotation.estimatedTimeline}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Description</p>
                  <p>{request.quotation.description}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p>{request.quotation.notes || "No notes"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sent At</p>
                  <p>{new Date(request.quotation.sentAt).toLocaleString()}</p>
                </div>
                {request.quotation.responseDeadline && (
                  <div>
                    <p className="text-muted-foreground">Response Deadline</p>
                    <p>{new Date(request.quotation.responseDeadline).toLocaleString()}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No quotation has been sent for this request.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline & Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-2">Timeline</p>
              {request.timeline?.length ? (
                <div className="space-y-3">
                  {request.timeline.map((item, idx) => (
                    <div key={`${item.stage}-${idx}`} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.stage}</p>
                        <span className={`px-2 py-1 rounded text-xs ${badgeClass(item.status)}`}>{formatLabel(item.status)}</span>
                      </div>
                      <p className="text-muted-foreground">{item.description}</p>
                      <p className="text-muted-foreground text-xs mt-2">ETA: {item.estimatedDuration}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No timeline recorded yet.</p>
              )}
            </div>

            <div>
              <p className="font-semibold mb-2">Uploaded Files</p>
              {request.uploadedFiles?.length ? (
                <div className="space-y-2">
                  {request.uploadedFiles.map((file, idx) => (
                    <div key={`${file.fileName}-${idx}`} className="rounded-lg border border-border p-3">
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-muted-foreground text-xs">{file.fileType}</p>
                      {file.url ? (
                        <a href={file.url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">
                          Open file
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No uploaded files.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {request.clientMessages?.length ? (
            request.clientMessages.map((message, idx) => (
              <div key={`${message.createdAt}-${idx}`} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-semibold capitalize">{message.senderType}</p>
                  <p className="text-muted-foreground text-xs">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
                <p>{message.message}</p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>No messages yet.</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Meta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{new Date(request.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Updated</p>
            <p className="font-medium">{request.completedAt ? new Date(request.completedAt).toLocaleString() : "Not completed"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Admin Notes</p>
            <p className="font-medium truncate">{request.adminNotes || "None"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Request ID</p>
            <p className="font-mono break-all">{request._id}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate("/admin/custom-requests")}>
          <FileText className="w-4 h-4 mr-2" />
          Return to Requests
        </Button>
      </div>
    </div>
  );
}
