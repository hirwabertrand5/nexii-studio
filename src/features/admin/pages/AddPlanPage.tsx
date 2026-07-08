import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { adminPlansApi } from "../api/adminApi";

const PLAN_CATEGORY_OPTIONS = [
  { value: "bungalow", label: "Bungalow" },
  { value: "duplex", label: "Duplex" },
  { value: "modern-villa", label: "Modern Villa" },
  { value: "small-plot-home", label: "Small Plot Home" },
  { value: "african-contemporary", label: "African Contemporary" },
  { value: "town-house", label: "Town House" },
  { value: "luxury-villa", label: "Luxury Villa" }
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

function createPrivateFileEntries() {
  return PRIVATE_FILE_SLOTS.map((label) => ({ label, file: null })) as PrivateFileEntry[];
}

function buildFormData(formData: Record<string, string>, imageFiles: File[], privateFiles: PrivateFileEntry[]) {
  const payload = new FormData();

  payload.append("title", formData.name.trim());
  payload.append("category", formData.category);
  payload.append("bedrooms", formData.bedrooms);
  payload.append("bathrooms", formData.bathrooms);
  payload.append("floors", formData.floors);
  payload.append("totalArea", formData.area);
  payload.append("plotSize", formData.plotSize);
  payload.append("price", formData.price);
  payload.append("architecturalStyle", formData.style.trim());
  payload.append("description", formData.description.trim());
  payload.append("status", "published");

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

function isDuplicateFile(existing: File[], nextFile: File) {
  return existing.some(
    (file) =>
      file.name === nextFile.name &&
      file.size === nextFile.size &&
      file.lastModified === nextFile.lastModified
  );
}

export default function AddPlan() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    description: ""
  });

  useEffect(() => {
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category || !formData.description.trim()) {
      toast.error("Title, category, and description are required");
      return;
    }

    if (!formData.bedrooms || !formData.bathrooms || !formData.floors || !formData.area || !formData.plotSize || !formData.price) {
      toast.error("Bedrooms, bathrooms, floors, area, plot size, and price are required");
      return;
    }

    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      await adminPlansApi.createPlan(buildFormData(formData, imageFiles, privateFiles));
      toast.success("House plan created successfully!");
      setTimeout(() => navigate("/admin/plans"), 1200);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addImages = (files: FileList | null) => {
    if (!files?.length) return;

    const incoming = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!incoming.length) {
      toast.error("Please choose image files");
      return;
    }

    const availableSlots = MAX_IMAGES - imageFiles.length;
    if (availableSlots <= 0) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images`);
      return;
    }

    const uniqueIncoming = incoming.filter((file) => !isDuplicateFile(imageFiles, file));
    const filesToAdd = uniqueIncoming.slice(0, availableSlots);

    if (!filesToAdd.length) {
      toast.error("These images are already selected");
      return;
    }

    if (uniqueIncoming.length > availableSlots) {
      toast.info(`Only the first ${availableSlots} new image(s) were added`);
    }

    setImageFiles((prev) => [...prev, ...filesToAdd]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const updatePrivateFileLabel = (index: number, label: string) => {
    setPrivateFiles((prev) => prev.map((entry, currentIndex) => currentIndex === index ? { ...entry, label } : entry));
  };

  const updatePrivateFile = (index: number, file: File | null) => {
    setPrivateFiles((prev) => prev.map((entry, currentIndex) => currentIndex === index ? { ...entry, file } : entry));
  };

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
        <h1 className="text-3xl mb-2">Add New House Plan</h1>
        <p className="text-muted-foreground">Create a new house plan listing with real uploads</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category *</Label>
                        <Input
                          id="category"
                          list="category-options"
                          required
                          value={formData.category}
                          onChange={(e) => handleChange("category", e.target.value)}
                          placeholder="e.g., bungalow, town house, luxury villa"
                        />
                        <datalist id="category-options">
                          {PLAN_CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.value} value={cat.label} />
                          ))}
                        </datalist>
                        <p className="mt-1 text-xs text-muted-foreground">
                          You can type a new category if the business adds one later.
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="e.g., 450"
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Plan Images</h3>
                    <p className="text-xs text-muted-foreground">
                      {imageFiles.length}/{MAX_IMAGES} selected
                    </p>
                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">Upload plan images *</p>
                        <p className="text-sm text-muted-foreground">
                          Add up to {MAX_IMAGES} images. Choose more any time until the limit is reached.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          ref={fileInputRef}
                          id="images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="max-w-xs"
                          onChange={(e) => addImages(e.target.files)}
                        />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Images
                        </Button>
                      </div>
                    </div>

                    {previewUrls.length > 0 && (
                      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {previewUrls.map((url, index) => (
                          <div key={`${url}-${index}`} className="rounded-lg border bg-background overflow-hidden">
                            <div className="aspect-[4/3] relative">
                              <ImageWithFallback
                                src={url}
                                alt={`Selected image ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-3 p-3">
                              <p className="text-xs text-muted-foreground truncate">{imageFiles[index]?.name}</p>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Private Deliverables</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload buyer-only files here. They stay private until purchase.
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {privateFiles.filter((entry) => entry.file).length}/{PRIVATE_FILE_SLOTS.length} selected
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {privateFiles.map((entry, index) => (
                      <div key={entry.label} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText className="w-4 h-4 text-primary" />
                          <span>File {index + 1}</span>
                        </div>
                        <div>
                          <Label htmlFor={`private-file-label-${index}`}>Label</Label>
                          <Input
                            id={`private-file-label-${index}`}
                            value={entry.label}
                            onChange={(e) => updatePrivateFileLabel(index, e.target.value)}
                            placeholder={PRIVATE_FILE_SLOTS[index]}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`private-file-${index}`}>Upload file</Label>
                          <Input
                            id={`private-file-${index}`}
                            type="file"
                            accept={PRIVATE_FILE_ACCEPT}
                            onChange={(e) => {
                              updatePrivateFile(index, e.target.files?.[0] ?? null);
                              e.currentTarget.value = "";
                            }}
                          />
                        </div>
                        {entry.file ? (
                          <div className="flex items-start justify-between gap-3 rounded-lg bg-background border border-border p-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{entry.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(entry.file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => updatePrivateFile(index, null)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No file selected for this slot yet.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Add Plan"}
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
              <CardTitle>Plan Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>• Title, category, and description are required</li>
                <li>• Bedrooms, bathrooms, floors, area, plot size, and price must be numbers</li>
                <li>• At least one public image upload is required</li>
                <li>• Private deliverables are optional and stay hidden from public pages</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
