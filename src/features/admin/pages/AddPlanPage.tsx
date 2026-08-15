import { useEffect, useRef, useState, type DragEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, FileText, Plus, Trash2, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
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
const PRIVATE_FILE_SLOTS = ["Architectural Plans", "Digital Drawings", "Printable Delivery Package"] as const;
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
      JSON.stringify(
        selectedPrivateFiles.map(
          (entry, index) => entry.label.trim() || PRIVATE_FILE_SLOTS[index] || `Private File ${index + 1}`
        )
      )
    );
    selectedPrivateFiles.forEach((entry) => {
      if (entry.file) payload.append("digitalFiles", entry.file);
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

function fieldClassName() {
  return "bg-background";
}

export default function AddPlan() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
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

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingImages(false);
    addImages(event.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const updatePrivateFileLabel = (index: number, label: string) => {
    setPrivateFiles((prev) => prev.map((entry, currentIndex) => (currentIndex === index ? { ...entry, label } : entry)));
  };

  const updatePrivateFile = (index: number, file: File | null) => {
    setPrivateFiles((prev) => prev.map((entry, currentIndex) => (currentIndex === index ? { ...entry, file } : entry)));
  };

  const requiredFieldsFilled =
    formData.name.trim() &&
    formData.category.trim() &&
    formData.description.trim() &&
    formData.bedrooms.trim() &&
    formData.bathrooms.trim() &&
    formData.floors.trim() &&
    formData.area.trim() &&
    formData.plotSize.trim() &&
    formData.price.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.category.trim() || !formData.description.trim()) {
      toast.error("Title, category, and description are required");
      return;
    }

    if (!formData.bedrooms.trim() || !formData.bathrooms.trim() || !formData.floors.trim() || !formData.area.trim() || !formData.plotSize.trim() || !formData.price.trim()) {
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
      toast.success("House plan created successfully");
      setTimeout(() => navigate("/admin/plans"), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/admin/plans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
        </Link>

        <div className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
          Cloudinary-backed uploads
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex w-fit items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Add plan
              </div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Add New House Plan</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Enter the plan details once, add the gallery, and publish when you&apos;re ready. The layout stays focused so you can move quickly without feeling rushed.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-xl">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Core fields</p>
                <p className="mt-2 text-2xl font-semibold">{requiredFieldsFilled ? "Ready" : "Incomplete"}</p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Images</p>
                <p className="mt-2 text-2xl font-semibold">
                  {imageFiles.length}/{MAX_IMAGES}
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Private files</p>
                <p className="mt-2 text-2xl font-semibold">
                  {privateFiles.filter((entry) => entry.file).length}/{PRIVATE_FILE_SLOTS.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Use a short title, a clear category, and a description that answers the first customer questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  className={fieldClassName()}
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Modern African Villa"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    list="category-options"
                    className={fieldClassName()}
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    placeholder="e.g., bungalow, town house, luxury villa"
                  />
                  <datalist id="category-options">
                    {PLAN_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.label} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Architectural Style</Label>
                  <Input
                    id="style"
                    className={fieldClassName()}
                    value={formData.style}
                    onChange={(e) => handleChange("style", e.target.value)}
                    placeholder="e.g., African Contemporary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  className={fieldClassName()}
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Describe the house plan..."
                  rows={5}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Keep the measurements accurate. These are the fields buyers compare first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  className={fieldClassName()}
                  value={formData.bedrooms}
                  onChange={(e) => handleChange("bedrooms", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  className={fieldClassName()}
                  value={formData.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="floors">Floors</Label>
                <Input
                  id="floors"
                  type="number"
                  min="0"
                  className={fieldClassName()}
                  value={formData.floors}
                  onChange={(e) => handleChange("floors", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Total Area (m2)</Label>
                <Input
                  id="area"
                  type="number"
                  min="0"
                  className={fieldClassName()}
                  value={formData.area}
                  onChange={(e) => handleChange("area", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plotSize">Plot Size (m2)</Label>
                <Input
                  id="plotSize"
                  type="number"
                  min="0"
                  className={fieldClassName()}
                  value={formData.plotSize}
                  onChange={(e) => handleChange("plotSize", e.target.value)}
                  placeholder="e.g., 450"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  className={fieldClassName()}
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Plan Images</CardTitle>
                <CardDescription>Upload the main hero image first, then add supporting views if needed.</CardDescription>
              </div>
              <p className="text-xs text-muted-foreground">
                {imageFiles.length}/{MAX_IMAGES} selected
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingImages(true);
              }}
              onDragLeave={() => setIsDraggingImages(false)}
              onDrop={handleImageDrop}
              className={`rounded-2xl border border-dashed p-5 transition-colors ${
                isDraggingImages ? "border-primary bg-primary/5" : "border-border bg-muted/20"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <p className="font-medium">Drop plan images here or choose files</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add up to {MAX_IMAGES} JPEG, PNG, or WebP images. The first image becomes the main preview.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addImages(e.target.files)}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Images
                  </Button>
                </div>
              </div>
            </div>

            {previewUrls.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {previewUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="overflow-hidden rounded-xl border bg-background">
                    <div className="relative aspect-[4/3]">
                      <ImageWithFallback
                        src={url}
                        alt={`Selected image ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{imageFiles[index]?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {((imageFiles[index]?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border bg-background p-6 text-sm text-muted-foreground">
                No images selected yet. Choose at least one public image so visitors can preview the plan.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Private Deliverables</CardTitle>
                <CardDescription>Optional buyer-only files stay hidden from the public catalog until purchase.</CardDescription>
              </div>
              <p className="text-xs text-muted-foreground">
                {privateFiles.filter((entry) => entry.file).length}/{PRIVATE_FILE_SLOTS.length} selected
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <details className="group rounded-xl border bg-muted/10 p-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
                <FileText className="h-4 w-4 text-primary" />
                Optional file uploads
              </summary>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {privateFiles.map((entry, index) => (
                  <div key={entry.label} className="space-y-3 rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span>File {index + 1}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`private-file-label-${index}`}>Label</Label>
                      <Input
                        id={`private-file-label-${index}`}
                        value={entry.label}
                        className={fieldClassName()}
                        onChange={(e) => updatePrivateFileLabel(index, e.target.value)}
                        placeholder={PRIVATE_FILE_SLOTS[index]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`private-file-${index}`}>Upload file</Label>
                      <Input
                        id={`private-file-${index}`}
                        type="file"
                        accept={PRIVATE_FILE_ACCEPT}
                        className={fieldClassName()}
                        onChange={(e) => {
                          updatePrivateFile(index, e.target.files?.[0] ?? null);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>

                    {entry.file ? (
                      <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{entry.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(entry.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => updatePrivateFile(index, null)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No file selected for this slot yet.</p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Publishing..." : "Publish Plan"}
          </Button>
          <Link to="/admin/plans">
            <Button type="button" variant="outline" size="lg">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
