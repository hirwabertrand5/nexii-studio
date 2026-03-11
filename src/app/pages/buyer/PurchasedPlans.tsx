import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { housePlans } from '../../data/mockData';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchasedPlans() {
  const purchasedPlans = housePlans.slice(0, 2);

  const handleDownload = (fileName: string) => {
    toast.success(`Downloading ${fileName}...`);
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
    return `https://images.unsplash.com/photo-${imageMap[imageName] || imageMap['modern-villa-african']}?w=800&q=80`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2">My Purchased Plans</h1>
        <p className="text-muted-foreground">
          Download and access all your purchased house plans
        </p>
      </div>

      <div className="space-y-6">
        {purchasedPlans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Image */}
                <div className="md:col-span-3">
                  <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={getImageUrl(plan.image)}
                      alt={plan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="md:col-span-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl mb-1">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.category}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded">
                      Completed
                    </span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                    <span>{plan.bedrooms} Bedrooms</span>
                    <span>•</span>
                    <span>{plan.bathrooms} Bathrooms</span>
                    <span>•</span>
                    <span>{plan.area}m²</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Purchased:</strong> March 8, 2026
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Order ID:</strong> ORD{plan.id.padStart(3, '0')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Amount Paid:</strong> ${plan.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Download Section */}
                <div className="md:col-span-3">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Available Files
                    </h4>
                    <div className="space-y-2">
                      {plan.filesIncluded.slice(0, 4).map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDownload(file)}
                          className="w-full flex items-center justify-between p-2 text-sm hover:bg-background rounded transition-colors"
                        >
                          <span className="text-left truncate">{file.split(' ')[0]}</span>
                          <Download className="w-4 h-4 text-primary flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => handleDownload('All Files')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Need Help?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">File Access</p>
                <p className="text-sm text-muted-foreground">
                  You have lifetime access to download your purchased plans
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">File Formats</p>
                <p className="text-sm text-muted-foreground">
                  Plans are provided in PDF, DWG (AutoCAD), and other standard formats
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Support</p>
                <p className="text-sm text-muted-foreground">
                  Contact us at support@nexii.com for any assistance
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
