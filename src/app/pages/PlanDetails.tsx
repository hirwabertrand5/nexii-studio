import { useParams, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { housePlans } from '../data/mockData';
import { Bed, Bath, Maximize2, Layers, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState } from 'react';

export default function PlanDetails() {
  const { id } = useParams();
  const plan = housePlans.find(p => p.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Plan not found</h2>
          <Link to="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getImageUrl = (imageName: string) => {
    const imageMap: Record<string, string> = {
      'modern-villa-african': '1600585154340-be6161a56a0c',
      'compact-bungalow': '1600607687939-ce8a6c25118c',
      'luxury-duplex': '1600566753190-17f0baa2a6c3',
      'small-plot-home': '1600607687644-aac4c57e0905',
      'contemporary-family': '1600585154526-990dced4db0d',
      'executive-mansion': '1600596542815-ffad4c1539a9',
    };
    return `https://images.unsplash.com/photo-${imageMap[imageName] || imageMap['modern-villa-african']}?w=1200&q=80`;
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Back Button */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/catalog">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="aspect-[16/10] bg-muted">
                  <ImageWithFallback
                    src={getImageUrl(plan.image)}
                    alt={plan.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 p-4">
                  {plan.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`aspect-[4/3] rounded-md overflow-hidden border-2 transition-colors ${
                        idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <ImageWithFallback
                        src={getImageUrl(img)}
                        alt={`${plan.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Details Tabs */}
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
                    <TabsTrigger value="files" className="flex-1">Files Included</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <h3 className="text-xl mb-4">Description</h3>
                    <p className="text-muted-foreground mb-6">{plan.description}</p>

                    <h3 className="text-xl mb-4">Specifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Bed className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Bedrooms</p>
                          <p className="text-muted-foreground">{plan.bedrooms}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Bath className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Bathrooms</p>
                          <p className="text-muted-foreground">{plan.bathrooms}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Maximize2 className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Total Area</p>
                          <p className="text-muted-foreground">{plan.area}m²</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Layers className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Floors</p>
                          <p className="text-muted-foreground">{plan.floors}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Maximize2 className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Plot Size</p>
                          <p className="text-muted-foreground">{plan.plotSize}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Style</p>
                          <p className="text-muted-foreground">{plan.style}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="mt-6">
                    <h3 className="text-xl mb-4">Key Features</h3>
                    <div className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <p>{feature}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="mt-6">
                    <h3 className="text-xl mb-4">Files Included in Purchase</h3>
                    <p className="text-muted-foreground mb-6">
                      You will receive all the following files immediately after purchase:
                    </p>
                    <div className="space-y-3">
                      {plan.filesIncluded.map((file, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                          <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <p>{file}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl mb-2">{plan.name}</h2>
                  <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {plan.category}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Price</p>
                  <p className="text-4xl font-bold text-primary">${plan.price.toLocaleString()}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <Link to={`/checkout/${plan.id}`} className="block">
                    <Button size="lg" className="w-full">
                      Buy Plan
                    </Button>
                  </Link>
                  <Link to="/custom-design" className="block">
                    <Button size="lg" variant="outline" className="w-full">
                      Request Customization
                    </Button>
                  </Link>
                </div>

                <div className="border-t border-border pt-6">
                  <h4 className="font-semibold mb-3">What's Included</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Complete architectural plans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>CAD drawings (DWG format)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Structural drawings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Material specifications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Instant digital download</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Lifetime access</span>
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
