import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Eye, DollarSign, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminCustomRequestsApi } from '../api/adminApi';

interface CustomRequest {
  _id: string;
  title: string;
  description: string;
  budget?: number;
  status: 'pending' | 'reviewing' | 'quotation-sent' | 'approved' | 'rejected' | 'completed';
  client: { fullName: string; email: string; country?: string };
  quotation?: { amount: number; description: string; timeline: string; sentAt: string };
  createdAt: string;
}

export default function AdminCustomRequests() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteTimeline, setQuoteTimeline] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await adminCustomRequestsApi.getAllRequests({ limit: 100 });
        if (response.success) {
          setRequests(response.data.requests);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch requests');
        toast.error('Failed to load requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'reviewing':
        return 'bg-orange-100 text-orange-700';
      case 'quotation-sent':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSendQuote = async (requestId: string) => {
    if (!quoteAmount || !quoteDescription || !quoteTimeline) {
      toast.error('Please fill all quotation fields');
      return;
    }
    
    try {
      const response = await adminCustomRequestsApi.sendQuotation(requestId, {
        amount: parseFloat(quoteAmount),
        description: quoteDescription,
        timeline: quoteTimeline
      });
      
      if (response.success) {
        setRequests(requests.map(r => 
          r._id === requestId 
            ? response.data
            : r
        ));
        toast.success('Quote sent to customer!');
        setQuoteAmount('');
        setQuoteDescription('');
        setQuoteTimeline('');
        setSelectedRequest(null);
      }
    } catch (err) {
      toast.error('Failed to send quote');
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: CustomRequest['status']) => {
    try {
      const response = await adminCustomRequestsApi.updateRequestStatus(requestId, newStatus);
      if (response.success) {
        setRequests(requests.map(r => 
          r._id === requestId ? response.data : r
        ));
        toast.success('Status updated successfully');
      }
    } catch (err) {
      toast.error('Failed to update status');
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

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    reviewing: requests.filter(r => r.status === 'reviewing').length,
    'quotation-sent': requests.filter(r => r.status === 'quotation-sent').length
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Custom Design Requests</h1>
        <p className="text-muted-foreground">
          {filteredRequests.length} requests found
        </p>
      </div>

      {/* Status Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({statusCounts.pending})
            </Button>
            <Button
              variant={statusFilter === 'reviewing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('reviewing')}
            >
              Reviewing ({statusCounts.reviewing})
            </Button>
            <Button
              variant={statusFilter === 'quotation-sent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('quotation-sent')}
            >
              Quoted ({statusCounts['quotation-sent']})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-6">
        {filteredRequests.length > 0 &&
          filteredRequests.map((request) => (
            <Card key={request._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">
                        {request.title}
                      </h3>
                      <span className={`px-3 py-1 text-sm rounded ${getStatusColor(request.status)}`}>
                        {request.status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Request ID: {request._id.slice(0, 8)}...
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(request.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-semibold mb-3">Client Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {request.client.fullName}</p>
                      <p><strong>Email:</strong> {request.client.email}</p>
                      <p><strong>Country:</strong> {request.client.country || '-'}</p>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div>
                    <h4 className="font-semibold mb-3">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Budget:</strong> {request.budget ? `$${request.budget.toLocaleString()}` : 'Not specified'}</p>
                      <p><strong>Status:</strong> {request.status}</p>
                      {request.quotation && (
                        <p><strong>Quote Sent:</strong> {new Date(request.quotation.sentAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                    {request.description}
                  </p>
                </div>

                {request.quotation && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 mb-2">Quotation Details</p>
                    <p className="text-2xl font-bold text-blue-900 mb-2">
                      ${request.quotation.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-700">Timeline: {request.quotation.timeline}</p>
                    <p className="text-sm text-blue-700 mt-2">{request.quotation.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  {request.status === 'pending' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedRequest(request)}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          Send Quote
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Send Quote to {request.client.fullName}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="quote-amount">Quote Amount (USD)</Label>
                            <Input
                              id="quote-amount"
                              type="number"
                              value={quoteAmount}
                              onChange={(e) => setQuoteAmount(e.target.value)}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quote-desc">Description</Label>
                            <Input
                              id="quote-desc"
                              type="text"
                              value={quoteDescription}
                              onChange={(e) => setQuoteDescription(e.target.value)}
                              placeholder="Brief description of the quote"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quote-timeline">Timeline</Label>
                            <Input
                              id="quote-timeline"
                              type="text"
                              value={quoteTimeline}
                              onChange={(e) => setQuoteTimeline(e.target.value)}
                              placeholder="e.g., 2-3 weeks"
                            />
                          </div>
                          <Button 
                            onClick={() => handleSendQuote(request._id)}
                            className="w-full"
                          >
                            Send Quote
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {request.status === 'quotation-sent' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(request._id, 'approved')}
                    >
                      Mark as Approved
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(request._id, 'rejected')}
                    >
                      Mark as Rejected
                    </Button>
                  </>
                )}

                <Button variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Customer
                </Button>

                <Button variant="ghost">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No requests found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
