"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Plus,
	Trash2,
	X,
	Loader2,
	CheckSquare,
	Square,
} from "lucide-react";
import {
	removePhotoFromAlbum,
	removeMultiplePhotosFromAlbum,
	getAlbumById,
	deleteAlbum,
} from "@/actions/album.actions";
import { toast } from "sonner";
import { AddPhotoDialog } from "@/components/profile/AddPhotoDialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

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
	albumId: number;
	albumMeta: {
		name: string;
		description: string | null;
		privacy: string;
		isOwner: boolean;
	};
	allAlbums?: AlbumOption[];
	onBack: () => void;
	onPhotosChanged?: (
		albumId: number,
		count: number,
		firstPhotoUrl: string | null,
	) => void;
	onAlbumDeleted?: (albumId: number) => void;
};

export function AlbumView({
	albumId,
	albumMeta,
	allAlbums = [],
	onBack,
	onPhotosChanged,
	onAlbumDeleted,
}: AlbumViewProps) {
	const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
	const [loading, setLoading] = useState(true);
	const [hovered, setHovered] = useState<number | null>(null);
	const [lightbox, setLightbox] = useState<AlbumPhoto | null>(null);
	const [addPhotoOpen, setAddPhotoOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	// Multi-select state
	const [selectMode, setSelectMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

	// Confirm dialog state
	const [confirmAction, setConfirmAction] = useState<{
		type: "bulk" | "all" | "album";
		title: string;
		description: string;
	} | null>(null);

	useEffect(() => {
		setLoading(true);
		getAlbumById(albumId)
			.then((album) => {
				if (album) setPhotos(album.photos);
			})
			.catch(() => toast.error("Failed to load album photos"))
			.finally(() => setLoading(false));
	}, [albumId]);

	const handleRemovePhoto = (photoId: number) => {
		startTransition(async () => {
			try {
				await removePhotoFromAlbum(photoId);
				const next = photos.filter((p) => p.id !== photoId);
				setPhotos(next);
				onPhotosChanged?.(
					albumId,
					next.length,
					next[0]?.photoUrl ?? null,
				);
				toast.success("Photo removed");
			} catch {
				toast.error("Failed to remove photo");
			}
		});
	};

	const handleBulkDelete = () => {
		if (selectedIds.size === 0) return;
		setConfirmAction({
			type: "bulk",
			title: `Delete ${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""}?`,
			description:
				"This action cannot be undone. The selected photos will be permanently removed from this album.",
		});
	};

	const handleDeleteAll = () => {
		if (photos.length === 0) return;
		setConfirmAction({
			type: "all",
			title: `Delete all ${photos.length} photos?`,
			description:
				"This will permanently remove every photo from this album. This cannot be undone.",
		});
	};

	const handleDeleteAlbum = () => {
		setConfirmAction({
			type: "album",
			title: `Delete album "${albumMeta.name}"?`,
			description:
				"This will permanently delete the album and all its photos. This action cannot be undone.",
		});
	};

	const executeConfirmedAction = async () => {
		if (!confirmAction) return;
		const { type } = confirmAction;
		if (type === "bulk") {
			await removeMultiplePhotosFromAlbum([...selectedIds]);
			const next = photos.filter((p) => !selectedIds.has(p.id));
			setPhotos(next);
			onPhotosChanged?.(albumId, next.length, next[0]?.photoUrl ?? null);
			setSelectedIds(new Set());
			setSelectMode(false);
			toast.success(
				`${selectedIds.size} photo${selectedIds.size > 1 ? "s" : ""} deleted`,
			);
		} else if (type === "all") {
			await removeMultiplePhotosFromAlbum(photos.map((p) => p.id));
			setPhotos([]);
			onPhotosChanged?.(albumId, 0, null);
			setSelectedIds(new Set());
			setSelectMode(false);
			toast.success("All photos deleted");
		} else if (type === "album") {
			await deleteAlbum(albumId);
			toast.success("Album deleted");
			onAlbumDeleted?.(albumId);
			onBack();
		}
	};

	const toggleSelect = (id: number) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAll = () => {
		setSelectedIds(new Set(photos.map((p) => p.id)));
	};

	const handlePhotoAdded = (
		photo: { id: number; photoUrl: string; caption: string | null } | null,
	) => {
		if (photo) {
			const next = [...photos, photo];
			setPhotos(next);
			onPhotosChanged?.(albumId, next.length, next[0]?.photoUrl ?? null);
		}
		setAddPhotoOpen(false);
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={onBack}
					className="h-8 w-8"
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="flex-1">
					<h2 className="font-semibold text-lg">{albumMeta.name}</h2>
					{albumMeta.description && (
						<p className="text-sm text-muted-foreground">
							{albumMeta.description}
						</p>
					)}
				</div>
				<Badge variant="secondary" className="capitalize text-xs">
					{albumMeta.privacy === "FriendsOnly"
						? "Friends"
						: albumMeta.privacy}
				</Badge>
				{albumMeta.isOwner && (
					<>
						{!selectMode ? (
							<>
								{photos.length > 0 && (
									<Button
										size="sm"
										variant="outline"
										className="gap-1.5"
										onClick={() => setSelectMode(true)}
									>
										<CheckSquare className="h-4 w-4" />
										Select
									</Button>
								)}
								<Button
									size="sm"
									className="gap-1.5"
									onClick={() => setAddPhotoOpen(true)}
								>
									<Plus className="h-4 w-4" />
									Add Photo
								</Button>
								<Button
									size="sm"
									variant="destructive"
									className="gap-1.5"
									onClick={handleDeleteAlbum}
									disabled={isPending}
								>
									<Trash2 className="h-4 w-4" />
									Delete Album
								</Button>
							</>
						) : (
							<>
								<span className="text-xs text-muted-foreground">
									{selectedIds.size} selected
								</span>
								<Button
									size="sm"
									variant="outline"
									onClick={selectAll}
								>
									Select All
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={handleBulkDelete}
									disabled={
										selectedIds.size === 0 || isPending
									}
								>
									{isPending ? (
										<Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
									) : (
										<Trash2 className="h-3.5 w-3.5 mr-1" />
									)}
									Delete Selected
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={handleDeleteAll}
									disabled={isPending}
								>
									Delete All
								</Button>
								<Button
									size="sm"
									variant="ghost"
									onClick={() => {
										setSelectMode(false);
										setSelectedIds(new Set());
									}}
								>
									Cancel
								</Button>
							</>
						)}
						<AddPhotoDialog
							open={addPhotoOpen}
							onClose={() => setAddPhotoOpen(false)}
							albums={[
								{ id: albumId, name: albumMeta.name },
								...allAlbums.filter((a) => a.id !== albumId),
							]}
							defaultAlbumId={albumId}
							onAdded={handlePhotoAdded}
						/>
					</>
				)}
			</div>

			{/* Photo grid */}
			{loading ? (
				<div className="flex items-center justify-center py-16">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			) : photos.length === 0 ? (
				<div className="text-center py-16 text-muted-foreground">
					<p className="font-medium">No photos in this album yet</p>
					{albumMeta.isOwner && (
						<p className="text-sm mt-1">
							Click &ldquo;Add Photo&rdquo; to upload your first
							photo
						</p>
					)}
				</div>
			) : (
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
					{photos.map((photo) => (
						<div
							key={photo.id}
							className={`relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer ${
								selectMode && selectedIds.has(photo.id)
									? "ring-2 ring-primary"
									: ""
							}`}
							onMouseEnter={() => setHovered(photo.id)}
							onMouseLeave={() => setHovered(null)}
							onClick={() => {
								if (selectMode) {
									toggleSelect(photo.id);
								} else {
									setLightbox(photo);
								}
							}}
						>
							<img
								src={photo.photoUrl}
								alt={photo.caption ?? "Album photo"}
								className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
							/>
							{/* Select checkbox overlay */}
							{selectMode && (
								<div className="absolute top-2 left-2 z-10">
									{selectedIds.has(photo.id) ? (
										<CheckSquare className="h-5 w-5 text-primary fill-primary/20" />
									) : (
										<Square className="h-5 w-5 text-white/80" />
									)}
								</div>
							)}
							{/* Caption overlay */}
							{photo.caption &&
								hovered === photo.id &&
								!selectMode && (
									<div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1.5">
										<p className="text-white text-xs truncate">
											{photo.caption}
										</p>
									</div>
								)}
							{/* Delete button for owner */}
							{albumMeta.isOwner &&
								hovered === photo.id &&
								!selectMode && (
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
					<div
						className="max-w-4xl max-h-[90vh] relative"
						onClick={(e) => e.stopPropagation()}
					>
						<img
							src={lightbox.photoUrl}
							alt={lightbox.caption ?? "Photo"}
							className="max-w-full max-h-[85vh] object-contain rounded-lg"
						/>
						{lightbox.caption && (
							<p className="text-white/80 text-sm text-center mt-2">
								{lightbox.caption}
							</p>
						)}
					</div>
				</div>
			)}

			{/* Confirm delete dialog */}
			<ConfirmDeleteDialog
				open={!!confirmAction}
				onClose={() => setConfirmAction(null)}
				onConfirm={executeConfirmedAction}
				title={confirmAction?.title ?? ""}
				description={confirmAction?.description ?? ""}
				confirmLabel={
					confirmAction?.type === "album" ? "Delete Album" : "Delete"
				}
			/>
		</div>
	);
}
