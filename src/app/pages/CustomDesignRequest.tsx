import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { africanCountries } from '../data/mockData';
import { toast } from 'sonner';

export default function CustomDesignRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    plotSize: '',
    bedrooms: '',
    budget: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Custom design request submitted! We will contact you within 24-48 hours.');
    setTimeout(() => navigate('/'), 2000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Custom Design</CardTitle>
                <p className="text-muted-foreground">
                  Tell us about your dream home and we'll create a custom architectural design for you
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="font-semibold mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          placeholder="your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Details */}
                  <div>
                    <h3 className="font-semibold mb-4">Project Details</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="country">Country *</Label>
                        <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                          <SelectTrigger id="country">
                            <SelectValue placeholder="Select your country" />
                          </SelectTrigger>
                          <SelectContent>
                            {africanCountries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Label htmlFor="bedrooms">Number of Bedrooms *</Label>
                          <Select value={formData.bedrooms} onValueChange={(value) => handleChange('bedrooms', value)}>
                            <SelectTrigger id="bedrooms">
                              <SelectValue placeholder="Select bedrooms" />
                            </SelectTrigger>
                            <SelectContent>
                              {[2, 3, 4, 5, 6, '7+'].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num} Bedrooms
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="budget">Budget Range *</Label>
                        <Select value={formData.budget} onValueChange={(value) => handleChange('budget', value)}>
                          <SelectTrigger id="budget">
                            <SelectValue placeholder="Select your budget" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="<25000">Less than $25,000</SelectItem>
                            <SelectItem value="25000-35000">$25,000 - $35,000</SelectItem>
                            <SelectItem value="35000-50000">$35,000 - $50,000</SelectItem>
                            <SelectItem value="50000-75000">$50,000 - $75,000</SelectItem>
                            <SelectItem value="75000+">$75,000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Project Description *</Label>
                        <Textarea
                          id="description"
                          required
                          value={formData.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                          placeholder="Tell us about your vision, special requirements, architectural style preferences, etc."
                          rows={6}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">What to Expect</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold">Initial Consultation</p>
                      <p className="text-sm text-muted-foreground">
                        We'll review your request and contact you within 24-48 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold">Quote & Timeline</p>
                      <p className="text-sm text-muted-foreground">
                        Receive a detailed quote and project timeline
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold">Design Process</p>
                      <p className="text-sm text-muted-foreground">
                        Our architects create your custom design with your feedback
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">4</span>
                    </div>
                    <div>
                      <p className="font-semibold">Final Delivery</p>
                      <p className="text-sm text-muted-foreground">
                        Receive complete architectural plans and all documents
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold mb-3">Custom Design Includes</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Unique architectural design</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Multiple design revisions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Complete construction drawings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>3D visualizations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Material specifications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Bill of quantities</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
