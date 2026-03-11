import { Link } from 'react-router';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Package, FileText, Download, Plus } from 'lucide-react';
import { housePlans, customRequests } from '../../data/mockData';

export default function BuyerDashboard() {
  // Mock user data
  const purchasedPlans = housePlans.slice(0, 2);
  const userRequests = customRequests.slice(0, 2);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Manage your house plans and custom requests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Purchased Plans</p>
                <p className="text-3xl font-bold">{purchasedPlans.length}</p>
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
                <p className="text-3xl font-bold">{userRequests.length}</p>
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
                <p className="text-3xl font-bold">{purchasedPlans.length * 6}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Recent Purchases</h2>
          <Link to="/dashboard/purchased">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {purchasedPlans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">No purchases yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse our catalog to find your perfect house plan
              </p>
              <Link to="/catalog">
                <Button>Browse Plans</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {purchasedPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.category}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Purchased on March 8, 2026
                    </p>
                    <Link to="/dashboard/purchased">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Custom Requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl">Custom Design Requests</h2>
          <Link to="/dashboard/custom-requests">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {userRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg mb-2">No custom requests</h3>
              <p className="text-muted-foreground mb-6">
                Need a custom design? Submit a request to our architects
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
            {userRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold mb-1">{request.bedrooms} Bedroom Design</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {request.country} • {request.plotSize}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      request.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : request.status === 'quoted'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                  {request.quote && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Quoted Price: <span className="font-semibold text-primary">${request.quote.toLocaleString()}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
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
                  <p className="text-sm text-muted-foreground">Explore our catalog</p>
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
                  <p className="text-sm text-muted-foreground">Get a personalized plan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
