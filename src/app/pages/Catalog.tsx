import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { housePlans, categories } from '../data/mockData';
import { Bed, Bath, Maximize2, Search } from 'lucide-react';

export default function Catalog() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Plans');
  const [bedroomFilter, setBedroomFilter] = useState<number | null>(null);
  const [bathroomFilter, setBathroomFilter] = useState<number | null>(null);
  const [floorFilter, setFloorFilter] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [filteredPlans, setFilteredPlans] = useState(housePlans);

  useEffect(() => {
    let filtered = [...housePlans];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'All Plans') {
      filtered = filtered.filter(plan => plan.category === selectedCategory);
    }

    // Bedroom filter
    if (bedroomFilter) {
      filtered = filtered.filter(plan => plan.bedrooms === bedroomFilter);
    }

    // Bathroom filter
    if (bathroomFilter) {
      filtered = filtered.filter(plan => plan.bathrooms === bathroomFilter);
    }

    // Floor filter
    if (floorFilter) {
      filtered = filtered.filter(plan => plan.floors === floorFilter);
    }

    // Price range filter
    filtered = filtered.filter(
      plan => plan.price >= priceRange[0] && plan.price <= priceRange[1]
    );

    setFilteredPlans(filtered);
  }, [searchQuery, selectedCategory, bedroomFilter, bathroomFilter, floorFilter, priceRange]);

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
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl mb-4">House Plans Catalog</h1>
          <p className="text-muted-foreground">
            Browse our collection of {filteredPlans.length} professional house plans
          </p>

          {/* Search Bar */}
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
          {/* Filters Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="bg-white rounded-lg border border-border p-6 sticky top-4">
              <h3 className="font-semibold mb-4">Filters</h3>

              {/* Category */}
              <div className="mb-6">
                <Label className="mb-3 block">Category</Label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bedrooms */}
              <div className="mb-6">
                <Label className="mb-3 block">Bedrooms</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBedroomFilter(bedroomFilter === num ? null : num)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        bedroomFilter === num
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="mb-6">
                <Label className="mb-3 block">Bathrooms</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBathroomFilter(bathroomFilter === num ? null : num)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        bathroomFilter === num
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Floors */}
              <div className="mb-6">
                <Label className="mb-3 block">Floors</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((num) => (
                    <button
                      key={num}
                      onClick={() => setFloorFilter(floorFilter === num ? null : num)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        floorFilter === num
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {num} Floor{num > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <Label className="mb-3 block">
                  Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={100000}
                  step={5000}
                  className="mb-2"
                />
              </div>

              {/* Reset Filters */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Plans');
                  setBedroomFilter(null);
                  setBathroomFilter(null);
                  setFloorFilter(null);
                  setPriceRange([0, 100000]);
                }}
              >
                Reset Filters
              </Button>
            </div>
          </aside>

          {/* Plans Grid */}
          <main className="col-span-12 md:col-span-9">
            {filteredPlans.length === 0 ? (
              <div className="bg-white rounded-lg border border-border p-12 text-center">
                <p className="text-muted-foreground">No plans match your filters. Try adjusting your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => (
                  <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-[4/3] bg-muted">
                      <ImageWithFallback
                        src={getImageUrl(plan.image)}
                        alt={plan.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {plan.category}
                        </span>
                      </div>
                      <h3 className="text-lg mb-3">{plan.name}</h3>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
                          <span>{plan.area}m²</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <p className="text-xl font-bold text-primary">
                            ${plan.price.toLocaleString()}
                          </p>
                        </div>
                        <Link to={`/plan/${plan.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
