import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { Loader2, Bed, Bath, Maximize2, Layers, CheckCircle, ArrowLeft } from "lucide-react";
import {
  formatPlanCategoryLabel,
  publicPlansApi,
  resolvePlanImageUrl,
  type PublicPlanSummary
} from "@/features/public/api/plansApi";

function buildGalleryImages(plan?: PublicPlanSummary | null) {
  if (!plan) return [];

  const ordered = [...(plan.images ?? []), ...(plan.previewImages ?? [])];
  return Array.from(new Set(ordered.filter(Boolean)));
}

export default function PlanDetails() {
  const { id } = useParams();
  const [plan, setPlan] = useState<PublicPlanSummary | null>(null);
  const [relatedPlans, setRelatedPlans] = useState<PublicPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let alive = true;

    const loadPlan = async () => {
      if (!id) {
        setError("Plan not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await publicPlansApi.getPlanById(id);
        if (!alive) return;
        setPlan(response.plan);
        setRelatedPlans(response.relatedPlans ?? []);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load plan");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadPlan();

    return () => {
      alive = false;
    };
  }, [id]);

  const galleryImages = useMemo(() => buildGalleryImages(plan), [plan]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [plan?._id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">{error || "Plan not found"}</h2>
          <Link to="/catalog">
            <Button>Back to Catalog</Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeImage = galleryImages[currentImageIndex] ?? galleryImages[0];

  return (
    <div className="min-h-screen bg-muted">
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
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="aspect-[16/10] bg-muted">
                  <ImageWithFallback
                    src={resolvePlanImageUrl(activeImage)}
                    alt={plan.title}
                    priority
                    className="w-full h-full object-contain bg-muted/50 p-4"
                  />
                </div>
                {galleryImages.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={`${img}-${idx}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`aspect-[4/3] rounded-md overflow-hidden border-2 transition-colors ${
                          idx === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <ImageWithFallback
                          src={resolvePlanImageUrl(img)}
                          alt={`${plan.title} view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="features" className="flex-1">Highlights</TabsTrigger>
                  <TabsTrigger value="files" className="flex-1">Secure Delivery</TabsTrigger>
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
                          <p className="text-muted-foreground">{plan.totalArea}m²</p>
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
                          <p className="text-muted-foreground">{plan.plotSize}m²</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">Style</p>
                          <p className="text-muted-foreground">{plan.architecturalStyle}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="mt-6">
                    <h3 className="text-xl mb-4">Plan Highlights</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>{formatPlanCategoryLabel(plan.category)} design optimized for live publishing.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>{plan.bedrooms} bedroom and {plan.bathrooms} bathroom configuration.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>{plan.totalArea}m² architectural footprint with {plan.floors} floor{plan.floors > 1 ? "s" : ""}.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>Real uploaded gallery images are displayed directly from storage.</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="mt-6">
                    <h3 className="text-xl mb-4">Buyer-only deliverables</h3>
                    <div className="rounded-lg border border-border bg-muted/40 p-5 space-y-3">
                      <p className="text-muted-foreground">
                        The full plan package is prepared by the admin and unlocked after purchase.
                      </p>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>Secure files stay private until checkout is completed.</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p>Preview images remain public so visitors can review the design before buying.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl mb-2">{plan.title}</h2>
                  <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm">
                    {formatPlanCategoryLabel(plan.category)}
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Price</p>
                  <p className="text-4xl font-bold text-primary">${plan.price.toLocaleString()}</p>
                </div>

                <div className="space-y-3 mb-6">
                  <Link to={`/checkout/${plan._id}`} className="block">
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
                  <h4 className="font-semibold mb-3">What&apos;s Included</h4>
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

        {relatedPlans.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl mb-6">Related Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedPlans.map((related) => (
                <Card key={related._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] bg-muted">
                    <ImageWithFallback
                      src={resolvePlanImageUrl(related.images?.[0] ?? related.previewImages?.[0])}
                      alt={related.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{related.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {formatPlanCategoryLabel(related.category)}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-primary">${related.price.toLocaleString()}</p>
                      <Link to={`/plan/${related._id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
