import { Link } from 'react-router';
import { Search, Building2, FileText, Download, Star, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { housePlans, categories } from '../data/mockData';
import { useState } from 'react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/catalog?search=${encodeURIComponent(searchQuery)}`;
  };

  const featuredPlans = housePlans.slice(0, 3);
  const mainCategories = categories.filter(c => c !== 'All Plans');

  // Rwandan Franc (RWF) formatter
  const formatRwf = (amount: number) =>
    new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: 'RWF',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-accent to-primary text-white py-24">
        <div className="absolute inset-0 opacity-10">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt="Modern architecture"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl mb-6">
            Find Your Ideal House Plan
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto">
            Premium architectural designs for the African market. Browse ready-made plans or request custom designs.
          </p>

          {/* Search Bar */}
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

      {/* Featured Plans */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Featured House Plans</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our most popular architectural designs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] bg-muted">
                  <ImageWithFallback
                    src={`https://images.unsplash.com/photo-${plan.image === 'modern-villa-african' ? '1600585154340-be6161a56a0c' : plan.image === 'compact-bungalow' ? '1600607687939-ce8a6c25118c' : '1600566753190-17f0baa2a6c3'}?w=800&q=80`}
                    alt={plan.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl mb-2">{plan.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{plan.bedrooms} Beds</span>
                    <span>•</span>
                    <span>{plan.bathrooms} Baths</span>
                    <span>•</span>
                    <span>{plan.area}m²</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {formatRwf(plan.price)}
                      </p>
                    </div>
                    <Link to={`/plan/${plan.id}`}>
                      <Button>View Plan</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/catalog">
              <Button size="lg" variant="outline">
                View All Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Browse by Category</h2>
            <p className="text-muted-foreground">
              Find the perfect style for your dream home
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {mainCategories.map((category) => (
              <Link key={category} to={`/catalog?category=${encodeURIComponent(category)}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-primary" />
                    <h4>{category}</h4>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose NEXii */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Why Choose NEXii</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Premium architectural services designed for the African market
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

      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">How It Works</h2>
            <p className="text-muted-foreground">
              Get your dream house plan in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                1
              </div>
              <h3 className="text-xl mb-3">Browse Plans</h3>
              <p className="text-muted-foreground">
                Explore our catalog of professionally designed house plans or request a custom design
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                2
              </div>
              <h3 className="text-xl mb-3">Purchase</h3>
              <p className="text-muted-foreground">
                Secure checkout with African payment methods including Mobile Money and bank transfer
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
                3
              </div>
              <h3 className="text-xl mb-3">Download Plans</h3>
              <p className="text-muted-foreground">
                Instantly access complete architectural, structural, and CAD drawings
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/register">
              <Button size="lg">Get Started Now</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">What Our Clients Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Excellent service! The plans were detailed and perfect for my plot in Kigali. Very professional."
                </p>
                <div>
                  <p className="font-semibold">Jean Claude N.</p>
                  <p className="text-sm text-muted-foreground">Kigali, Rwanda</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "The custom design service was outstanding. They understood exactly what I wanted for my family home."
                </p>
                <div>
                  <p className="font-semibold">Aline Mukamana</p>
                  <p className="text-sm text-muted-foreground">Musanze, Rwanda</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">
                  "Great value for money. The plans are comprehensive and saved me thousands in architect fees."
                </p>
                <div>
                  <p className="font-semibold">Eric Habimana</p>
                  <p className="text-sm text-muted-foreground">Huye, Rwanda</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl mb-4">Ready to Build Your Dream Home?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Start browsing our catalog or request a custom design today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/catalog">
              <Button size="lg" variant="secondary">
                Browse Plans
              </Button>
            </Link>
            <Link to="/custom-design">
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                Request Custom Design
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}