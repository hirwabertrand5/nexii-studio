import { Link } from 'react-router';
import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { housePlans } from '../../data/mockData';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagePlans() {
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState(housePlans);

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setPlans(plans.filter(p => p.id !== id));
      toast.success('Plan deleted successfully');
    }
  };

  const getImageUrl = (imageName: string) => {
    const imageMap: Record<string, string> = {
      'modern-villa-african': '1600585154340-be6161a56a0c',
      'compact-bungalow': '1600607687939-ce8a6c25118c',
      'luxury-duplex': '1600566753190-17f0baa2a6c3',
      'small-plot-home': '1600607687644-aac4c57e0905',
      'contemporary-family': '1600585154526-990dced4db0d',
      'executive-mansion': '1600596542815-ffad4c1539a9',
    };
    return `https://images.unsplash.com/photo-${imageMap[imageName] || imageMap['modern-villa-african']}?w=200&q=80`;
  };

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
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Baths</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                      <ImageWithFallback
                        src={getImageUrl(plan.image)}
                        alt={plan.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{plan.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                      {plan.category}
                    </span>
                  </TableCell>
                  <TableCell>{plan.bedrooms}</TableCell>
                  <TableCell>{plan.bathrooms}</TableCell>
                  <TableCell>{plan.area}m²</TableCell>
                  <TableCell className="font-semibold">${plan.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/plan/${plan.id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
