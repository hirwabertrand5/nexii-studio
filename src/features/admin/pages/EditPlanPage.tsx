import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { ArrowLeft, Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { adminPlansApi, type AdminPlanSummary } from "../api/adminApi";
import { resolvePlanImageUrl } from "@/features/public/api/plansApi";

const PLAN_CATEGORY_OPTIONS = [
  { value: "bungalow", label: "Bungalow" },
  { value: "duplex", label: "Duplex" },
  { value: "modern-villa", label: "Modern Villa" },
  { value: "small-plot-home", label: "Small Plot Home" },
  { value: "african-contemporary", label: "African Contemporary" },
  { value: "town-house", label: "Town House" },
  { value: "luxury-villa", label: "Luxury Villa" }
] as const;

const PLAN_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" }
] as const;

const MAX_IMAGES = 5;
const PRIVATE_FILE_SLOTS = [
  "Architectural Plans",
  "Digital Drawings",
  "Printable Delivery Package"
] as const;
const PRIVATE_FILE_ACCEPT = ".pdf,.dwg,.dxf,.zip,.rar,.doc,.docx,.png,.jpg,.jpeg,.webp";

type PrivateFileEntry = {
  label: string;
  file: File | null;
};

function createPrivateFileEntries(existingLabels?: string[]) {
  return PRIVATE_FILE_SLOTS.map((label, index) => ({
    label: existingLabels?.[index] ?? label,
    file: null
  })) as PrivateFileEntry[];
}

function splitListInput(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinListInput(values?: string[]) {
  return values?.join(", ") ?? "";
}

function buildFormData(formData: Record<string, string | boolean>, imageFiles: File[], privateFiles: PrivateFileEntry[]) {
  const payload = new FormData();

  payload.append("title", String(formData.name).trim());
  payload.append("category", String(formData.category));
  payload.append("bedrooms", String(formData.bedrooms));
  payload.append("bathrooms", String(formData.bathrooms));
  payload.append("floors", String(formData.floors));
  payload.append("totalArea", String(formData.area));
  payload.append("plotSize", String(formData.plotSize));
  payload.append("price", String(formData.price));
  payload.append("architecturalStyle", String(formData.style).trim());
  payload.append("description", String(formData.description).trim());
  payload.append("status", String(formData.status));
  payload.append("isFeatured", String(Boolean(formData.isFeatured)));

  if (String(formData.previewImages).trim()) {
    payload.append("previewImages", String(formData.previewImages));
  }

  if (String(formData.filesIncluded).trim()) {
    payload.append("filesIncluded", String(formData.filesIncluded));
  }

  imageFiles.forEach((file) => payload.append("images", file));

  const selectedPrivateFiles = privateFiles.filter((entry) => entry.file);
  if (selectedPrivateFiles.length > 0) {
    payload.append(
      "digitalFilesLabels",
      JSON.stringify(selectedPrivateFiles.map((entry, index) => entry.label.trim() || PRIVATE_FILE_SLOTS[index] || `Private File ${index + 1}`))
    );
    selectedPrivateFiles.forEach((entry) => {
      if (entry.file) {
        payload.append("digitalFiles", entry.file);
      }
    });
  }

  return payload;
}

export default function EditPlanPage() {
  const navigate = useNavigate();
  const params = useParams();
  const planId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<AdminPlanSummary | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [privateFiles, setPrivateFiles] = useState<PrivateFileEntry[]>(() => createPrivateFileEntries());
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    bedrooms: "",
    bathrooms: "",
    floors: "",
    area: "",
    plotSize: "",
    price: "",
    style: "",
    description: "",
    previewImages: "",
    filesIncluded: "",
    status: "draft",
    isFeatured: false
  });

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        setError("Missing plan ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await adminPlansApi.getPlanById(planId);
        setPlan(response);
        const existingPrivateFiles = response.digitalFiles?.length
          ? createPrivateFileEntries(response.digitalFiles.map((file) => file.label))
          : createPrivateFileEntries();
        setPrivateFiles(existingPrivateFiles);
        setFormData({
          name: response.title ?? "",
          category: response.category ?? "",
          bedrooms: String(response.bedrooms ?? ""),
          bathrooms: String(response.bathrooms ?? ""),
          floors: String(response.floors ?? ""),
          area: String(response.totalArea ?? ""),
          plotSize: String(response.plotSize ?? ""),
          price: String(response.price ?? ""),
          style: response.architecturalStyle ?? "",
          description: response.description ?? "",
          previewImages: joinListInput(response.previewImages),
          filesIncluded: joinListInput(response.filesIncluded),
          status: String(response.status ?? "draft"),
          isFeatured: Boolean(response.isFeatured)
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plan");
        toast.error("Failed to load plan");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [planId]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelection = (files: FileList | null) => {
    if (!files?.length) return;

    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) {
      toast.error("Please choose image files");
      return;
    }

    const limited = selected.slice(0, MAX_IMAGES);

    if (selected.length > MAX_IMAGES) {
      toast.info(`Only the first ${MAX_IMAGES} images were selected`);
    }

    setImageFiles(limited);
  };

  const updatePrivateFileLabel = (index: number, label: string) => {
    setPrivateFiles((prev) => prev.map((entry, currentIndex) => currentIndex === index ? { ...entry, label } : entry));
  };

  const updatePrivateFile = (index: number, file: File | null) => {
    setPrivateFiles((prev) => prev.map((entry, currentIndex) => currentIndex === index ? { ...entry, file } : entry));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!planId) {
      toast.error("Missing plan ID");
      return;
    }

    const bedrooms = Number(formData.bedrooms);
    const bathrooms = Number(formData.bathrooms);
    const floors = Number(formData.floors);
    const area = Number(formData.area);
    const plotSize = Number(formData.plotSize);
    const price = Number(formData.price);

    if (![bedrooms, bathrooms, floors, area, plotSize, price].every(Number.isFinite)) {
      toast.error("All numeric fields must contain valid numbers");
      return;
    }

    if (!formData.category) {
      toast.error("Please choose a plan category");
      return;
    }

    if (imageFiles.length === 0 && !(plan?.images?.length ?? 0)) {
      toast.error("Please upload at least one image for the plan");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedPlan = await adminPlansApi.updatePlan(
        planId,
        buildFormData(
          {
            ...formData,
            bedrooms: String(bedrooms),
            bathrooms: String(bathrooms),
            floors: String(floors),
            area: String(area),
            plotSize: String(plotSize),
            price: String(price)
          },
          imageFiles,
          privateFiles
        )
      );

      setPlan(updatedPlan);
      toast.success("House plan updated successfully!");
      navigate("/admin/plans");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading plan: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/admin/plans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl mb-2">Edit House Plan</h1>
        <p className="text-muted-foreground">Update plan details, publication state, and gallery uploads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Plan Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="e.g., Modern African Villa"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          list="edit-category-options"
                          required
                          value={formData.category}
                          onChange={(e) => handleChange("category", e.target.value)}
                          placeholder="e.g., bungalow, town house, luxury villa"
                        />
                        <datalist id="edit-category-options">
                          {PLAN_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.label} />
                          ))}
                        </datalist>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Type a new category when needed. It will be saved and shown everywhere automatically.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="style">Architectural Style *</Label>
                        <Input
                          id="style"
                          required
                          value={formData.style}
                          onChange={(e) => handleChange("style", e.target.value)}
                          placeholder="e.g., African Contemporary"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        required
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        placeholder="Describe the house plan..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms *</Label>
                      <Input
                        id="bedrooms"
                        type="number"
                        min="0"
                        required
                        value={formData.bedrooms}
                        onChange={(e) => handleChange("bedrooms", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bathrooms">Bathrooms *</Label>
                      <Input
                        id="bathrooms"
                        type="number"
                        min="0"
                        required
                        value={formData.bathrooms}
                        onChange={(e) => handleChange("bathrooms", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="floors">Floors *</Label>
                      <Input
                        id="floors"
                        type="number"
                        min="0"
                        required
                        value={formData.floors}
                        onChange={(e) => handleChange("floors", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="area">Total Area (m²) *</Label>
                      <Input
                        id="area"
                        type="number"
                        min="0"
                        required
                        value={formData.area}
                        onChange={(e) => handleChange("area", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="plotSize">Plot Size (m²) *</Label>
                      <Input
                        id="plotSize"
                        type="number"
                        min="0"
                        required
                        value={formData.plotSize}
                        onChange={(e) => handleChange("plotSize", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Price (USD) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Current Gallery</h3>
                  {plan?.images?.length ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {plan.images.map((src, idx) => (
                        <div key={`${src}-${idx}`} className="space-y-2">
                          <div className="aspect-[4/3] overflow-hidden rounded-md border">
                            <ImageWithFallback
                              src={resolvePlanImageUrl(src)}
                              alt={`${plan.title} image ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Current image {idx + 1}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No current images on this plan.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Current Private Deliverables</h3>
                  {plan?.digitalFiles?.length ? (
                    <div className="space-y-3">
                      {plan.digitalFiles.map((file, idx) => (
                        <div key={`${file.fileName}-${idx}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{file.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{file.fileName}</p>
                          </div>
                          <span className="text-xs rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                            Private
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No buyer-only files uploaded yet.</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Replace Gallery Uploads</h3>
                  <div className="rounded-lg border border-dashed border-border p-6">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="images">Upload replacement images</Label>
                      <p className="text-xs text-muted-foreground">{imageFiles.length}/{MAX_IMAGES} selected</p>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      className="mt-2"
                      onChange={(e) => handleImageSelection(e.target.files)}
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      If you select new images here, they replace the current gallery. You can upload up to {MAX_IMAGES} images.
                    </p>

                    {previewUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {previewUrls.map((url, index) => (
                          <div key={url} className="space-y-2">
                            <div className="aspect-[4/3] overflow-hidden rounded-md border">
                              <ImageWithFallback src={url} alt={`Replacement image ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{imageFiles[index]?.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Replace Private Deliverables</h3>
                  <div className="rounded-lg border border-dashed border-border p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Upload buyer-only files</p>
                        <p className="text-xs text-muted-foreground">
                          These stay hidden from public pages and will be used after purchase.
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {privateFiles.filter((entry) => entry.file).length}/{PRIVATE_FILE_SLOTS.length} selected
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {privateFiles.map((entry, index) => (
                        <div key={entry.label} className="rounded-lg border bg-background p-4 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="w-4 h-4 text-primary" />
                            <span>File {index + 1}</span>
                          </div>
                          <div>
                            <Label htmlFor={`edit-private-file-label-${index}`}>Label</Label>
                            <Input
                              id={`edit-private-file-label-${index}`}
                              value={entry.label}
                              onChange={(e) => updatePrivateFileLabel(index, e.target.value)}
                              placeholder={PRIVATE_FILE_SLOTS[index]}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`edit-private-file-${index}`}>Upload file</Label>
                            <Input
                              id={`edit-private-file-${index}`}
                              type="file"
                              accept={PRIVATE_FILE_ACCEPT}
                              onChange={(e) => {
                                updatePrivateFile(index, e.target.files?.[0] ?? null);
                                e.currentTarget.value = "";
                              }}
                            />
                          </div>
                          {entry.file ? (
                            <div className="flex items-start justify-between gap-3 rounded-lg bg-muted p-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{entry.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(entry.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => updatePrivateFile(index, null)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">No replacement file selected.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="previewImages">Preview Images</Label>
                    <Textarea
                      id="previewImages"
                      value={formData.previewImages}
                      onChange={(e) => handleChange("previewImages", e.target.value)}
                      placeholder="Optional preview images separated by commas or new lines"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filesIncluded">Files Included</Label>
                    <Textarea
                      id="filesIncluded"
                      value={formData.filesIncluded}
                      onChange={(e) => handleChange("filesIncluded", e.target.value)}
                      placeholder="Optional files included separated by commas or new lines"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="status">Publication Status</Label>
                      <p className="text-xs text-muted-foreground">Draft plans stay private until published.</p>
                    </div>
                    <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                      <SelectTrigger id="status" className="w-44">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLAN_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="featured">Featured Plan</Label>
                      <p className="text-xs text-muted-foreground">Highlight this plan in catalog sections.</p>
                    </div>
                    <Switch
                      id="featured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => handleChange("isFeatured", checked)}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                  <Link to="/admin/plans">
                    <Button type="button" variant="outline" size="lg">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Plan ID</p>
                <p className="font-mono break-all">{plan?._id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Status</p>
                <p className="font-medium">{String(plan?.status ?? "draft")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Featured</p>
                <p className="font-medium">{plan?.isFeatured ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {plan?.updatedAt ? new Date(plan.updatedAt).toLocaleString() : "Not available"}
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <h4 className="font-semibold mb-2">Validation rules</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Title, category, description, style, and core measurements are required</li>
                  <li>• Public images replace the current image gallery when you upload new ones</li>
                  <li>• Buyer-only files stay private and are shown only after purchase</li>
                  <li>• Status stays constrained to draft or published</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
