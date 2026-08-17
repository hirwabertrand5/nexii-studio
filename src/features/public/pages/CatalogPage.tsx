import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import {
  collectPlanCategories,
  formatPlanCategoryLabel,
  publicPlansApi,
  resolvePlanImageUrl,
  type PublicPlanSummary
} from "@/features/public/api/plansApi";
import { Bed, Bath, Maximize2, Search, Loader2 } from "lucide-react";

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [bedroomFilter, setBedroomFilter] = useState<number | null>(null);
  const [bathroomFilter, setBathroomFilter] = useState<number | null>(null);
  const [floorFilter, setFloorFilter] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [plans, setPlans] = useState<PublicPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadPlans = async () => {
      try {
        setLoading(true);
        const response = await publicPlansApi.getPlans({ limit: 50, sort: "latest" });
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

  const searchParamsKey = searchParams.toString();

  useEffect(() => {
    const nextSearch = searchParams.get("search") || "";
    const nextCategory = searchParams.get("category") || "all";
    setSearchQuery(nextSearch);
    setSelectedCategory(nextCategory);
  }, [searchParamsKey]);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const maxCatalogPrice = useMemo(
    () => Math.max(100000, ...plans.map((plan) => plan.price)),
    [plans]
  );
  const categories = useMemo(() => collectPlanCategories(plans), [plans]);

  useEffect(() => {
    setPriceRange([0, maxCatalogPrice]);
  }, [maxCatalogPrice]);

  const filteredPlans = useMemo(() => {
    let filtered = [...plans];

    const searchTerm = deferredSearchQuery.trim().toLowerCase();
    if (searchTerm) {
      filtered = filtered.filter((plan) =>
        [plan.title, plan.description, plan.architecturalStyle, formatPlanCategoryLabel(plan.category)]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm)
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((plan) => {
        const categoryLabel = formatPlanCategoryLabel(plan.category).toLowerCase();
        return plan.category === selectedCategory || categoryLabel === selectedCategory.toLowerCase();
      });
    }

    if (bedroomFilter !== null) {
      filtered = filtered.filter((plan) => plan.bedrooms === bedroomFilter);
    }

    if (bathroomFilter !== null) {
      filtered = filtered.filter((plan) => plan.bathrooms === bathroomFilter);
    }

    if (floorFilter !== null) {
      filtered = filtered.filter((plan) => plan.floors === floorFilter);
    }

    filtered = filtered.filter(
      (plan) => plan.price >= priceRange[0] && plan.price <= priceRange[1]
    );

    return filtered;
  }, [
    bathroomFilter,
    bedroomFilter,
    deferredSearchQuery,
    floorFilter,
    plans,
    priceRange,
    selectedCategory
  ]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl mb-4">House Plans Catalog</h1>
          <p className="text-muted-foreground">
            Browse our collection of {filteredPlans.length} live published plans
          </p>

          <div className="mt-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search plans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg border border-border p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Filters</h3>

              <div className="mb-6">
                <Label className="mb-3 block">Category</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === "all"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    All Plans
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => setSelectedCategory(category.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.value
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block">Bedrooms</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBedroomFilter(bedroomFilter === num ? null : num)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        bedroomFilter === num
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block">Bathrooms</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBathroomFilter(bathroomFilter === num ? null : num)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        bathroomFilter === num
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block">Floors</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => setFloorFilter(floorFilter === num ? null : num)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        floorFilter === num
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {num} Floor{num > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <Label className="mb-3 block">
                  Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange([value[0] ?? 0, value[1] ?? maxCatalogPrice])}
                  min={0}
                  max={maxCatalogPrice}
                  step={5000}
                  className="mb-2"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setBedroomFilter(null);
                  setBathroomFilter(null);
                  setFloorFilter(null);
                  setPriceRange([0, maxCatalogPrice]);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </aside>

          <main className="col-span-12 md:col-span-9">
            {loading ? (
              <div className="bg-white rounded-lg border border-border p-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-muted-foreground">Loading live plans...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-border p-12 text-center text-red-600">
                {error}
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="bg-white rounded-lg border border-border p-12 text-center">
                <p className="text-muted-foreground">No plans match your filters. Try adjusting your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {filteredPlans.map((plan) => (
                  <Link key={plan._id} to={`/plan/${plan._id}`} className="block h-full">
                  <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="aspect-[4/3] bg-muted">
                      <ImageWithFallback
                        src={resolvePlanImageUrl(plan.images?.[0] ?? plan.previewImages?.[0])}
                        alt={plan.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="flex h-full flex-col p-3 sm:p-4">
                      <div className="mb-2">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {formatPlanCategoryLabel(plan.category)}
                        </span>
                      </div>
                      <h3 className="mb-2 text-sm sm:mb-3 sm:text-lg">{plan.title}</h3>

                      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          <span>{plan.bedrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          <span>{plan.bathrooms}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>{plan.totalArea}m²</span>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <p className="text-lg font-bold text-primary sm:text-xl">
                            ${plan.price.toLocaleString()}
                          </p>
                        </div>
                        <Button asChild size="sm" className="pointer-events-none w-full sm:w-auto">
                          <span>View</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
