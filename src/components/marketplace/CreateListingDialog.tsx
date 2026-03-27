"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { createListing } from "@/actions/marketplace.actions";

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Furniture",
  "Vehicles",
  "Books",
  "HomeGarden",
  "Sports",
  "Toys",
  "Art",
  "Food",
  "Services",
  "Other",
];

const CONDITIONS = ["New", "LikeNew", "Good", "Fair", "Poor"];
const CONDITION_LABELS: Record<string, string> = {
  New: "New",
  LikeNew: "Like New",
  Good: "Good",
  Fair: "Fair",
  Poor: "Poor",
};

type CreatedListing = {
  id: number;
  title: string;
  price: number;
  isFree: boolean;
  category: string;
  condition: string;
  status: string;
  location: string | null;
  slug: string;
  viewCount: number;
  createdAt: Date;
  description: string;
  seller: {
    id: number;
    userName: string;
    firstName: string | null;
    lastName: string | null;
    avatar: { photoSrc: string } | null;
  };
  images: { url: string; order: number }[];
  saves: { id: number }[];
  _count: { saves: number; offers: number; messages: number };
};

export function CreateListingDialog({
  open,
  onClose,
  currentUser,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: {
    id: number;
    userName: string;
    firstName: string | null;
    lastName: string | null;
    avatar: { photoSrc: string } | null;
  };
  onCreated?: (listing: CreatedListing) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [category, setCategory] = useState("Other");
  const [condition, setCondition] = useState("Good");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setIsFree(false);
    setCategory("Other");
    setCondition("Good");
    setLocation("");
    setImages([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImgs = files.slice(0, 6 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImgs]);
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.warning("Please add a title");
      return;
    }
    if (!description.trim()) {
      toast.warning("Please add a description");
      return;
    }
    if (!isFree && (!price || parseFloat(price) <= 0)) {
      toast.warning("Please enter a valid price");
      return;
    }

    startTransition(async () => {
      try {
        const uploadedUrls: string[] = [];
        for (const img of images) {
          const fd = new FormData();
          fd.append("file", img.file);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (!res.ok) throw new Error("Upload failed");
          const { url } = (await res.json()) as { url: string };
          uploadedUrls.push(url);
        }

        const listing = await createListing({
          title,
          description,
          price: isFree ? 0 : parseFloat(price),
          isFree,
          category,
          condition,
          location: location || undefined,
          imageUrls: uploadedUrls,
        });

        const fullListing: CreatedListing = {
          ...listing,
          description,
          seller: currentUser,
          images: uploadedUrls.map((url, i) => ({ url, order: i })),
          saves: [],
          _count: { saves: 0, offers: 0, messages: 0 },
        };

        onCreated?.(fullListing);
        handleClose();
      } catch {
        toast.error("Failed to create listing");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a listing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Photos <span className="text-muted-foreground font-normal">(up to 6)</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                  <Image src={img.preview} alt="" fill className="object-cover" sizes="150px" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-background/80 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors text-xs gap-1"
                >
                  <Upload className="h-5 w-5" />
                  Add photo
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description *</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item (condition, features, reason for selling...)"
              className="resize-none min-h-[100px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
          </div>

          {/* Price + Free toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Price *</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="free-toggle" className="text-sm font-normal text-muted-foreground">
                  Free item
                </Label>
                <Switch
                  id="free-toggle"
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />
              </div>
            </div>
            {!isFree && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            )}
          </div>

          {/* Category + Condition row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "HomeGarden" ? "Home & Garden" : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONDITION_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Neighborhood..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Publishing..." : "Publish listing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
