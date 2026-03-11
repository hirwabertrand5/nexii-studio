import { Link } from 'react-router';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { customRequests } from '../../data/mockData';
import { Plus, Calendar, MapPin, Bed, DollarSign } from 'lucide-react';

export default function CustomRequests() {
  const userRequests = customRequests;

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Custom Design Requests</h1>
          <p className="text-muted-foreground">
            Track and manage your custom design requests
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
        {userRequests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl mb-2">{request.bedrooms} Bedroom Custom Design</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(request.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {request.country}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm rounded ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                    <p className="font-semibold">{request.plotSize}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="font-semibold">{request.budget}</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-sm">Description</h4>
                <p className="text-sm text-muted-foreground">{request.description}</p>
              </div>

              {request.quote && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quoted Price</p>
                      <p className="text-2xl font-bold text-primary">
                        ${request.quote.toLocaleString()}
                      </p>
                    </div>
                    {request.status === 'quoted' && (
                      <div className="flex gap-2">
                        <Button variant="outline">View Details</Button>
                        <Button>Accept Quote</Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {request.status === 'pending' && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Your request is being reviewed. We'll send you a quote within 24-48 hours.
                  </p>
                </div>
              )}

              {request.status === 'accepted' && (
                <div className="border-t border-border pt-4 bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700">
                    Design in progress. Estimated completion: 2-3 weeks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {userRequests.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl mb-2">No custom requests yet</h3>
            <p className="text-muted-foreground mb-6">
              Submit a custom design request to get a personalized house plan
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
