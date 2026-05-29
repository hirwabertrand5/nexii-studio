import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ImageWithFallback } from '@/shared/components/ImageWithFallback';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/shared/ui/table';
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminPlansApi } from '../api/adminApi';

interface HousePlan {
  _id: string;
  title: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  price: number;
  images: string[];
  status: string;
  isFeatured: boolean;
}

export default function ManagePlans() {
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<HousePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await adminPlansApi.getAllPlans({ limit: 100 });
        if (response.success) {
          setPlans(response.data.plans);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const filteredPlans = plans.filter(plan =>
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await adminPlansApi.deletePlan(id);
        if (response.success) {
          setPlans(plans.filter(p => p._id !== id));
          toast.success('Plan deleted successfully');
        }
      } catch (err) {
        toast.error('Failed to delete plan');
      }
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
        <p>Error loading plans: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Manage House Plans</h1>
          <p className="text-muted-foreground">
            {filteredPlans.length} plans in catalog
          </p>
        </div>
        <Link to="/admin/plans/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Plan
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plans by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Baths</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell>
                      <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                        {plan.images && plan.images[0] ? (
                          <ImageWithFallback
                            src={plan.images[0]}
                            alt={plan.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{plan.title}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                        {plan.category}
                      </span>
                    </TableCell>
                    <TableCell>{plan.bedrooms}</TableCell>
                    <TableCell>{plan.bathrooms}</TableCell>
                    <TableCell>{plan.totalArea}m²</TableCell>
                    <TableCell className="font-semibold">${plan.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        plan.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {plan.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" disabled>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(plan._id, plan.title)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No plans found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
