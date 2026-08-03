import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/shared/ui/table";
import { Plus, Search, Edit, Trash2, Eye, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { adminPlansApi, type AdminPlanSummary } from "../api/adminApi";
import { formatPlanCategoryLabel, resolvePlanImageUrl } from "@/features/public/api/plansApi";

export default function ManagePlans() {
  const [searchQuery, setSearchQuery] = useState("");
  const [plans, setPlans] = useState<AdminPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await adminPlansApi.getAllPlans({ limit: 100 });
        setPlans(response.plans);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch plans");
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const filteredPlans = plans.filter((plan) =>
    plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await adminPlansApi.deletePlan(id);
        setPlans((prev) => prev.filter((plan) => plan._id !== id));
        toast.success("Plan deleted successfully");
      } catch {
        toast.error("Failed to delete plan");
      }
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const updatedPlan = await adminPlansApi.publishPlan(id);
      setPlans((prev) => prev.map((plan) => (plan._id === id ? updatedPlan : plan)));
      toast.success("Plan published successfully");
    } catch {
      toast.error("Failed to publish plan");
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const updatedPlan = await adminPlansApi.toggleFeatured(id);
      setPlans((prev) => prev.map((plan) => (plan._id === id ? updatedPlan : plan)));
      toast.success(updatedPlan.isFeatured ? "Plan marked as featured" : "Plan removed from featured");
    } catch {
      toast.error("Failed to update featured state");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading plans: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Manage House Plans</h1>
          <p className="text-muted-foreground">{filteredPlans.length} plans in catalog</p>
        </div>
        <Link to="/admin/plans/add">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add New Plan
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search plans by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Baths</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan, index) => (
                  <TableRow key={plan._id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                        {plan.images?.[0] ? (
                          <ImageWithFallback
                            src={resolvePlanImageUrl(plan.images[0])}
                            alt={plan.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      <div className="flex flex-col gap-1">
                        <span>{plan.title}</span>
                        {plan.isFeatured && (
                          <span className="inline-flex w-fit items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                            Featured
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                        {formatPlanCategoryLabel(plan.category)}
                      </span>
                    </TableCell>
                    <TableCell>{plan.bedrooms}</TableCell>
                    <TableCell>{plan.bathrooms}</TableCell>
                    <TableCell>{plan.totalArea}m²</TableCell>
                    <TableCell className="font-semibold">${plan.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          plan.status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {plan.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/plan/${plan._id}`} aria-label={`Preview ${plan.title}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(plan._id)}
                          title={plan.isFeatured ? "Remove featured" : "Mark as featured"}
                        >
                          <Star className={`w-4 h-4 ${plan.isFeatured ? "fill-yellow-400 text-yellow-500" : ""}`} />
                        </Button>
                        {plan.status !== "published" && (
                          <Button variant="ghost" size="sm" onClick={() => handlePublish(plan._id)} title="Publish plan">
                            Publish
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/admin/plans/${plan._id}/edit`} aria-label={`Edit ${plan.title}`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(plan._id, plan.title)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No plans found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
