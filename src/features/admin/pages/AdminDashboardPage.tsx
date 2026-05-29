import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Home, Users, ShoppingBag, DollarSign, TrendingUp, FileText, Loader2 } from 'lucide-react';
import { adminDashboardApi } from '../api/adminApi';

interface DashboardOverview {
  totalPlans: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingRequests: number;
  failedPayments: number;
}

interface ActivityData {
  recentOrders: unknown[];
  newUsers: unknown[];
  newRequests: unknown[];
  failedPayments: unknown[];
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewRes, activityRes] = await Promise.all([
          adminDashboardApi.getOverview(),
          adminDashboardApi.getRecentActivity()
        ]);

        if (overviewRes.success) {
          setOverview(overviewRes.data);
        }
        if (activityRes.success) {
          setActivity(activityRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <p>Error loading dashboard: {error}</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total House Plans',
      value: overview?.totalPlans ?? 0,
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Users',
      value: overview?.totalUsers ?? 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Orders',
      value: overview?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Revenue',
      value: `$${(overview?.totalRevenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back to NEXii Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.recentOrders && activity.recentOrders.length > 0 ? (
                activity.recentOrders.slice(0, 5).map((order: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{order.plans?.[0]?.title || 'Order'}</p>
                      <p className="text-xs text-muted-foreground">{order.user?.fullName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${order.totalAmount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-700'
                          : order.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Design Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity?.newRequests && activity.newRequests.length > 0 ? (
                activity.newRequests.slice(0, 5).map((request: any, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{request.title}</p>
                      <p className="text-xs text-muted-foreground">{request.client?.fullName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      request.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : request.status === 'quotation-sent'
                        ? 'bg-blue-100 text-blue-700'
                        : request.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No requests</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Orders</p>
                <p className="text-2xl font-bold">{activity?.recentOrders?.filter((o: any) => o.orderStatus === 'completed').length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{overview?.pendingRequests ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed Payments</p>
                <p className="text-2xl font-bold">{overview?.failedPayments ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
