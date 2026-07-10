import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Building2,
  FileText,
  Download,
  Star,
  CheckCircle,
  Home as HomeIcon,
  Package as PackageIcon,
  MapPin as MapPinIcon,
  Loader2
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card, CardContent } from "@/shared/ui/card";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import {
  collectPlanCategories,
  formatPlanCategoryLabel,
  publicPlansApi,
  resolvePlanImageUrl,
  type PublicPlanSummary
} from "@/features/public/api/plansApi";

const categoryIcons: Record<string, any> = {
  "Bungalow": HomeIcon,
  "Duplex": Building2,
  "Modern Villa": PackageIcon,
  "Small Plot Home": MapPinIcon,
  "African Contemporary": Star,
};

const HERO_BACKGROUND =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function PlanCard({ plan }: { plan: PublicPlanSummary }) {
  const imageSrc = resolvePlanImageUrl(plan.images?.[0] ?? plan.previewImages?.[0]);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <ImageWithFallback
          src={imageSrc}
          alt={plan.title}
          className="block h-full w-full object-cover object-center"
        />
      </div>
      <CardContent className="p-6">
        <div className="mb-2">
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
            {formatPlanCategoryLabel(plan.category)}
          </span>
        </div>
        <h3 className="text-xl mb-2">{plan.title}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span>{plan.bedrooms} Beds</span>
          <span>•</span>
          <span>{plan.bathrooms} Baths</span>
          <span>•</span>
          <span>{plan.totalArea}m²</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-primary">
              {formatUsd(plan.price)}
            </p>
          </div>
          <Link to={`/plan/${plan._id}`}>
            <Button>View Plan</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [plans, setPlans] = useState<PublicPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await publicPlansApi.getPlans({ limit: 12, sort: "latest" });
        if (!alive) return;
        setPlans(response.plans ?? []);
      } catch (err) {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadPlans();

    return () => {
      alive = false;
    };
  }, []);

  const latestPlans = useMemo(() => {
    return [...plans]
      .sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [plans]);

  const visibleBestPlans = useMemo(() => {
    const shuffled = [...latestPlans];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [latestPlans]);

  const visibleFeaturedPlans = latestPlans;
  const categories = useMemo(() => collectPlanCategories(plans), [plans]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-slate-900 text-white py-24">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={HERO_BACKGROUND}
            alt="Modern architecture"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover object-center scale-105 blur-[2px] brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-primary/40 to-slate-950/70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl mb-6">
            Find Your Ideal House Plan
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto">
            Premium architectural designs for the global market. Browse live published plans or request custom designs.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2 bg-white rounded-lg p-2">
              <Input
                type="text"
                placeholder="Search house plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-0 bg-transparent text-foreground"
              />
              <Button type="submit" size="lg">
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Featured House Plans</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular live architectural designs
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading published plans...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
              {error}
            </div>
          ) : visibleFeaturedPlans.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-8 text-center text-muted-foreground">
              No published plans yet. Once an admin publishes a plan, it will appear here automatically.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {visibleFeaturedPlans.map((plan) => (
                <PlanCard key={plan._id} plan={plan} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/catalog">
              <Button size="lg" variant="outline">
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Browse by Category</h2>
            <p className="text-muted-foreground">
              Find the perfect style for your dream home
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => {
              const Icon = categoryIcons[category.label] ?? Building2;

              return (
                <Link key={category.value} to={`/catalog?category=${encodeURIComponent(category.value)}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <Icon className="w-12 h-12 mx-auto mb-3 text-primary" />
                      <h4>{category.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.count} live plan{category.count === 1 ? "" : "s"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Popular Plans</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Freshly published plans available right now on the platform
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Loading live catalog...
            </div>
          ) : visibleBestPlans.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted p-8 text-center text-muted-foreground">
              No live plans available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {visibleBestPlans.map((plan) => (
                <PlanCard key={plan._id} plan={plan} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/catalog">
              <Button size="lg" variant="outline">
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Why Choose NEXii</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Premium architectural services designed for the global market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl mb-3">Professional Designs</h3>
                <p className="text-muted-foreground">
                  All plans created by licensed architects with African market expertise
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl mb-3">Instant Download</h3>
                <p className="text-muted-foreground">
                  Get complete building plans immediately after purchase
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl mb-3">Custom Options</h3>
                <p className="text-muted-foreground">
                  Request modifications or fully custom designs tailored to your needs
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
