"use client";

import { useState, useTransition } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Upload, X, Loader2 } from "lucide-react";
import { addPhotoToAlbum } from "@/actions/album.actions";
import { toast } from "sonner";

type AlbumOption = { id: number; name: string };

export function AddPhotoDialog({
	open,
	onClose,
	albums,
	defaultAlbumId,
	onAdded,
}: {
	open: boolean;
	onClose: () => void;
	albums: AlbumOption[];
	defaultAlbumId?: number | null;
	onAdded?: (
		photo: {
			id: number;
			photoUrl: string;
			caption: string | null;
			albumId: number | null;
		} | null,
	) => void;
}) {
	const [isPending, startTransition] = useTransition();
	const [photoUrl, setPhotoUrl] = useState("");
	const [caption, setCaption] = useState("");
	const [albumId, setAlbumId] = useState<string>(
		defaultAlbumId != null ? String(defaultAlbumId) : "none",
	);
	const [uploading, setUploading] = useState(false);

	const reset = () => {
		setPhotoUrl("");
		setCaption("");
		setAlbumId(defaultAlbumId != null ? String(defaultAlbumId) : "none");
	};

	function handleClose() {
		reset();
		onClose();
	}

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: fd,
			});
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url)
				throw new Error(data.error ?? "Upload failed");
			setPhotoUrl(data.url);
		} catch {
			toast.error("Upload failed");
		} finally {
			setUploading(false);
		}
	}

	function handleAdd() {
		if (!photoUrl) {
			toast.warning("Please upload a photo");
			return;
		}
		startTransition(async () => {
			try {
				const result = await addPhotoToAlbum({
					albumId: albumId === "none" ? null : parseInt(albumId),
					photoUrl,
					caption: caption || undefined,
				});
				toast.success(
					albumId === "none"
						? "Photo added to your posts!"
						: "Photo added to album!",
				);
				const pickedAlbumId =
					albumId === "none" ? null : parseInt(albumId);
				onAdded?.(
					result
						? {
								id: result.id,
								photoUrl: result.photoUrl,
								caption: result.caption,
								albumId: pickedAlbumId,
							}
						: null,
				);
				handleClose();
			} catch {
				toast.error("Failed to add photo");
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add Photo</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{/* Upload */}
					<div className="space-y-1.5">
						<Label>
							Photo{" "}
							<span className="text-destructive text-xs">*required</span>
						</Label>
						{photoUrl ? (
							<div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={photoUrl}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
								<button
									onClick={() => setPhotoUrl("")}
									className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black"
								>
									<X className="h-3.5 w-3.5 text-white" />
								</button>
							</div>
						) : (
							<label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-36 cursor-pointer hover:border-primary transition-colors bg-muted/30">
								{uploading ? (
									<Loader2 className="h-7 w-7 animate-spin text-muted-foreground mb-1" />
								) : (
									<Upload className="h-7 w-7 text-muted-foreground mb-1" />
								)}
								<span className="text-sm text-muted-foreground">
									{uploading
										? "Uploading…"
										: "Click to upload photo"}
								</span>
								<input
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleFileChange}
									disabled={uploading}
								/>
							</label>
						)}
					</div>

					{/* Caption */}
					<div className="space-y-1.5">
						<Label htmlFor="photo-caption">
							Caption (optional)
						</Label>
						<Input
							id="photo-caption"
							placeholder="Add a caption…"
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
						/>
					</div>

					{/* Album selector */}
					<div className="space-y-1.5">
						<Label>Save to album</Label>
						<Select value={albumId} onValueChange={setAlbumId}>
							<SelectTrigger>
								<SelectValue placeholder="Choose an album" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">
									No album (add to photos)
								</SelectItem>
								{albums.map((a) => (
									<SelectItem key={a.id} value={String(a.id)}>
										{a.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-2">
						<Button
							variant="secondary"
							className="flex-1"
							onClick={handleClose}
							disabled={isPending || uploading}
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							onClick={handleAdd}
							disabled={isPending || uploading || !photoUrl}
						>
							{isPending && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Add Photo
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
