import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/AuthContext";
import { createCustomRequest } from "@/features/public/api/customRequestApi";
import { countries } from "@/shared/data/countries";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

const projectTypes = [
  { value: "residential", label: "Residential" },
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed-use", label: "Mixed Use" },
];

const architecturalStyles = [
  { value: "modern", label: "Modern" },
  { value: "contemporary", label: "Contemporary" },
  { value: "african-contemporary", label: "African Contemporary" },
  { value: "traditional", label: "Traditional" },
  { value: "minimalist", label: "Minimalist" },
  { value: "bungalow", label: "Bungalow" },
  { value: "duplex", label: "Duplex" },
];

const currencies = ["USD", "NGN", "KES", "RWF", "GHS", "ZAR"];

export default function CustomDesignRequest() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectTitle: "",
    projectType: "residential",
    plotSize: "",
    bedrooms: "3",
    bathrooms: "2",
    floors: "1",
    budget: "",
    budgetCurrency: "USD",
    country: "",
    location: "",
    architecturalStyle: "modern",
    description: "",
  });

  useEffect(() => {
    if (user?.country) {
      setFormData((prev) => (prev.country ? prev : { ...prev, country: user.country ?? "" }));
    }
  }, [user?.country]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast.error("Please sign in before submitting a custom request.");
      navigate("/login", { replace: false, state: { from: "/custom-design" } });
      return;
    }

    const plotSize = Number(formData.plotSize);
    const bedrooms = Number(formData.bedrooms);
    const bathrooms = Number(formData.bathrooms);
    const floors = Number(formData.floors);
    const budget = Number(formData.budget);

    if ([plotSize, bedrooms, bathrooms, floors, budget].some((value) => Number.isNaN(value))) {
      toast.error("Please fill in all numeric fields with valid numbers.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await createCustomRequest({
        projectTitle: formData.projectTitle.trim(),
        projectType: formData.projectType,
        plotSize,
        bedrooms,
        bathrooms,
        floors,
        budget,
        budgetCurrency: formData.budgetCurrency,
        country: formData.country.trim(),
        location: formData.location.trim(),
        architecturalStyle: formData.architecturalStyle,
        description: formData.description.trim(),
      });

      toast.success("Custom design request submitted successfully.");
      navigate("/dashboard/custom-requests", {
        replace: true,
        state: {
          requestId: result.requestId,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit your request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-muted">
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
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Request Custom Design</CardTitle>
                <p className="text-muted-foreground">
                  Tell us about your dream home and we&apos;ll create a custom architectural design for you.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={user?.fullName ?? ""}
                          readOnly
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email ?? ""}
                          readOnly
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-4">Project Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="projectTitle">Project Title *</Label>
                          <Input
                            id="projectTitle"
                            required
                            value={formData.projectTitle}
                            onChange={(e) => handleChange("projectTitle", e.target.value)}
                            placeholder="e.g. Family villa in Kigali"
                          />
                        </div>
                        <div>
                          <Label htmlFor="projectType">Project Type *</Label>
                          <Select
                            value={formData.projectType}
                            onValueChange={(value) => handleChange("projectType", value)}
                          >
                            <SelectTrigger id="projectType">
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                            <SelectContent>
                              {projectTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="country">Country *</Label>
                          <Select value={formData.country} onValueChange={(value) => handleChange("country", value)}>
                            <SelectTrigger id="country">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="location">Site Location *</Label>
                          <Input
                            id="location"
                            required
                            value={formData.location}
                            onChange={(e) => handleChange("location", e.target.value)}
                            placeholder="Town, city, or district"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="plotSize">Plot Size (m²) *</Label>
                          <Input
                            id="plotSize"
                            type="number"
                            min="0"
                            step="0.1"
                            required
                            value={formData.plotSize}
                            onChange={(e) => handleChange("plotSize", e.target.value)}
                            placeholder="e.g. 450"
                          />
                        </div>
                        <div>
                          <Label htmlFor="architecturalStyle">Architectural Style *</Label>
                          <Select
                            value={formData.architecturalStyle}
                            onValueChange={(value) => handleChange("architecturalStyle", value)}
                          >
                            <SelectTrigger id="architecturalStyle">
                              <SelectValue placeholder="Select a style" />
                            </SelectTrigger>
                            <SelectContent>
                              {architecturalStyles.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  {style.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="bedrooms">Bedrooms *</Label>
                          <Select value={formData.bedrooms} onValueChange={(value) => handleChange("bedrooms", value)}>
                            <SelectTrigger id="bedrooms">
                              <SelectValue placeholder="Select bedrooms" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                <SelectItem key={num} value={String(num)}>
                                  {num} Bedrooms
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="bathrooms">Bathrooms *</Label>
                          <Select
                            value={formData.bathrooms}
                            onValueChange={(value) => handleChange("bathrooms", value)}
                          >
                            <SelectTrigger id="bathrooms">
                              <SelectValue placeholder="Select bathrooms" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map((num) => (
                                <SelectItem key={num} value={String(num)}>
                                  {num} Bathrooms
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="floors">Floors *</Label>
                          <Select value={formData.floors} onValueChange={(value) => handleChange("floors", value)}>
                            <SelectTrigger id="floors">
                              <SelectValue placeholder="Select floors" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4].map((num) => (
                                <SelectItem key={num} value={String(num)}>
                                  {num} Floor{num > 1 ? "s" : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="budget">Budget *</Label>
                          <Input
                            id="budget"
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={formData.budget}
                            onChange={(e) => handleChange("budget", e.target.value)}
                            placeholder="e.g. 50000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budgetCurrency">Currency *</Label>
                          <Select
                            value={formData.budgetCurrency}
                            onValueChange={(value) => handleChange("budgetCurrency", value)}
                          >
                            <SelectTrigger id="budgetCurrency">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency} value={currency}>
                                  {currency}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Project Description *</Label>
                        <Textarea
                          id="description"
                          required
                          value={formData.description}
                          onChange={(e) => handleChange("description", e.target.value)}
                          placeholder="Tell us about your vision, special requirements, room needs, site conditions, and any preferences."
                          rows={6}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Signed In User</h3>
                {user ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-base">{user.fullName}</p>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-muted-foreground">{user.country ?? "Country not set"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sign in first so your request is tied to your account, email, and future purchases.
                    </p>
                    <Link to="/login">
                      <Button className="w-full">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

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
                        We review your request and contact you within 24-48 hours.
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
                        Receive a detailed quote and project timeline.
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
                        Our architects create your custom design with your feedback.
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
                        Receive complete architectural plans and documents.
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
