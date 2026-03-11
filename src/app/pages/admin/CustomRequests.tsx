import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { customRequests } from '../../data/mockData';
import { Eye, DollarSign, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCustomRequests() {
  const [requests, setRequests] = useState(customRequests);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<typeof customRequests[0] | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');

  const filteredRequests = requests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'quoted':
        return 'bg-blue-100 text-blue-700';
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSendQuote = (requestId: string) => {
    if (!quoteAmount) {
      toast.error('Please enter a quote amount');
      return;
    }
    
    setRequests(requests.map(r => 
      r.id === requestId 
        ? { ...r, status: 'quoted' as const, quote: parseInt(quoteAmount) }
        : r
    ));
    
    toast.success('Quote sent to customer!');
    setQuoteAmount('');
    setSelectedRequest(null);
  };

  const handleStatusChange = (requestId: string, newStatus: typeof customRequests[0]['status']) => {
    setRequests(requests.map(r => 
      r.id === requestId ? { ...r, status: newStatus } : r
    ));
    toast.success('Status updated successfully');
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
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All ({requests.length})
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pending ({requests.filter(r => r.status === 'pending').length})
            </Button>
            <Button
              variant={statusFilter === 'quoted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('quoted')}
            >
              Quoted ({requests.filter(r => r.status === 'quoted').length})
            </Button>
            <Button
              variant={statusFilter === 'accepted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('accepted')}
            >
              Accepted ({requests.filter(r => r.status === 'accepted').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-6">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">
                      {request.bedrooms} Bedroom Custom Design
                    </h3>
                    <span className={`px-3 py-1 text-sm rounded ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Request ID: {request.id}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(request.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {request.customerName}</p>
                    <p><strong>Email:</strong> {request.email}</p>
                    <p><strong>Country:</strong> {request.country}</p>
                  </div>
                </div>

                {/* Project Details */}
                <div>
                  <h4 className="font-semibold mb-3">Project Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Plot Size:</strong> {request.plotSize}</p>
                    <p><strong>Bedrooms:</strong> {request.bedrooms}</p>
                    <p><strong>Budget:</strong> {request.budget}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  {request.description}
                </p>
              </div>

              {request.quote && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700 mb-1">Quoted Amount</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${request.quote.toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
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
                        <DialogTitle>Send Quote to {request.customerName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="quote">Quote Amount (USD)</Label>
                          <Input
                            id="quote"
                            type="number"
                            value={quoteAmount}
                            onChange={(e) => setQuoteAmount(e.target.value)}
                            placeholder="Enter amount"
                          />
                        </div>
                        <Button 
                          onClick={() => handleSendQuote(request.id)}
                          className="w-full"
                        >
                          Send Quote
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {request.status === 'quoted' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(request.id, 'accepted')}
                    >
                      Mark as Accepted
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleStatusChange(request.id, 'rejected')}
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
