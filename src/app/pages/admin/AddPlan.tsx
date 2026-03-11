import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { categories } from '../../data/mockData';
import { ArrowLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function AddPlan() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    bedrooms: '',
    bathrooms: '',
    floors: '',
    area: '',
    plotSize: '',
    price: '',
    style: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('House plan added successfully!');
    setTimeout(() => navigate('/admin/plans'), 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/plans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl mb-2">Add New House Plan</h1>
        <p className="text-muted-foreground">Create a new house plan listing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Plan Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g., Modern African Villa"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c !== 'All Plans').map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="style">Architectural Style *</Label>
                        <Input
                          id="style"
                          required
                          value={formData.style}
                          onChange={(e) => handleChange('style', e.target.value)}
                          placeholder="e.g., African Contemporary"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        required
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Describe the house plan..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <h3 className="font-semibold mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms *</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        required
                        value={formData.bedrooms}
                        onChange={(e) => handleChange('bedrooms', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bathrooms">Bathrooms *</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        required
                        value={formData.bathrooms}
                        onChange={(e) => handleChange('bathrooms', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="floors">Floors *</Label>
                      <Input
                        id="floors"
                        type="number"
                        required
                        value={formData.floors}
                        onChange={(e) => handleChange('floors', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="area">Total Area (m²) *</Label>
                      <Input
                        id="area"
                        type="number"
                        required
                        value={formData.area}
                        onChange={(e) => handleChange('area', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="plotSize">Plot Size *</Label>
                      <Input
                        id="plotSize"
                        required
                        value={formData.plotSize}
                        onChange={(e) => handleChange('plotSize', e.target.value)}
                        placeholder="e.g., 20m x 30m"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price (USD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        required
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" size="lg">
                    Add Plan
                  </Button>
                  <Link to="/admin/plans">
                    <Button type="button" variant="outline" size="lg">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Media & Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Plan Images</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload images
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>

              <div>
                <Label>Plan Documents</Label>
                <div className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Upload plan files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DWG, etc.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-2 text-sm">Files to include:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Architectural Floor Plans (PDF)</li>
                  <li>• AutoCAD Drawings (DWG)</li>
                  <li>• Structural Drawings</li>
                  <li>• 3D Renderings</li>
                  <li>• Material Specifications</li>
                  <li>• Bill of Quantities</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
