"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { removePhotoFromAlbum } from "@/actions/album.actions";
import { toast } from "sonner";
import { AddPhotoDialog } from "@/components/profile/AddPhotoDialog";

type AlbumPhoto = {
  id: number;
  photoUrl: string;
  caption: string | null;
};

type AlbumOption = {
  id: number;
  name: string;
};

type AlbumViewProps = {
  album: {
    id: number;
    name: string;
    description: string | null;
    privacy: string;
    photos: AlbumPhoto[];
    isOwner: boolean;
  };
  allAlbums?: AlbumOption[];
  onBack: () => void;
};

export function AlbumView({ album, allAlbums = [], onBack }: AlbumViewProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<AlbumPhoto[]>(album.photos);
  const [hovered, setHovered] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<AlbumPhoto | null>(null);
  const [addPhotoOpen, setAddPhotoOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRemovePhoto = (photoId: number) => {
    startTransition(async () => {
      try {
        await removePhotoFromAlbum(photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        toast.success("Photo removed");
      } catch {
        toast.error("Failed to remove photo");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="font-semibold text-lg">{album.name}</h2>
          {album.description && (
            <p className="text-sm text-muted-foreground">{album.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="capitalize text-xs">
          {album.privacy === "FriendsOnly" ? "Friends" : album.privacy}
        </Badge>
        {album.isOwner && (
          <>
            <Button size="sm" className="gap-1.5" onClick={() => setAddPhotoOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Photo
            </Button>
            <AddPhotoDialog
              open={addPhotoOpen}
              onClose={() => setAddPhotoOpen(false)}
              albums={[{ id: album.id, name: album.name }, ...allAlbums.filter((a) => a.id !== album.id)]}
              defaultAlbumId={album.id}
              onAdded={() => { setAddPhotoOpen(false); router.refresh(); }}
            />
          </>
        )}
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="font-medium">No photos in this album yet</p>
          {album.isOwner && (
            <p className="text-sm mt-1">Click &ldquo;Add Photo&rdquo; to upload your first photo</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
              onMouseEnter={() => setHovered(photo.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setLightbox(photo)}
            >
              <img
                src={photo.photoUrl}
                alt={photo.caption ?? "Album photo"}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {/* Caption overlay */}
              {photo.caption && hovered === photo.id && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5">
                  <p className="text-white text-xs truncate">{photo.caption}</p>
                </div>
              )}
              {/* Delete button for owner */}
              {album.isOwner && hovered === photo.id && (
                <button
                  className="absolute top-2 right-2 bg-black/60 hover:bg-destructive text-white rounded-full p-1 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(photo.id);
                  }}
                  disabled={isPending}
                  title="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            <X className="h-7 w-7" />
          </button>
          <div className="max-w-4xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.photoUrl}
              alt={lightbox.caption ?? "Photo"}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {lightbox.caption && (
              <p className="text-white/80 text-sm text-center mt-2">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
