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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Globe, Users, Lock, Loader2, Upload, Hash, X } from "lucide-react";
import { createVideo } from "@/actions/video.actions";
import { toast } from "sonner";
import type { PostPrivacy } from "../../../prisma/generated/prisma/enums";

const PRIVACY_OPTIONS: {
	value: PostPrivacy;
	label: string;
	icon: React.ElementType;
}[] = [
	{ value: "Public", label: "Public", icon: Globe },
	{ value: "FriendsOnly", label: "Friends only", icon: Users },
	{ value: "OnlyMe", label: "Only me", icon: Lock },
];

export function UploadVideoDialog({
	open,
	onClose,
	onSuccess,
}: {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}) {
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [thumbnailUrl, setThumbnailUrl] = useState("");
	const [tagsInput, setTagsInput] = useState("");
	const [privacy, setPrivacy] = useState<PostPrivacy>("Public");
	const [uploading, setUploading] = useState(false);
	const [videoFile, setVideoFile] = useState<File | null>(null);

	const reset = () => {
		setTitle("");
		setDescription("");
		setVideoUrl("");
		setThumbnailUrl("");
		setTagsInput("");
		setPrivacy("Public");
		setVideoFile(null);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setVideoFile(file);
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
			setVideoUrl(data.url);
			toast.success("Video uploaded");
		} catch {
			toast.error("Upload failed");
			setVideoFile(null);
		} finally {
			setUploading(false);
		}
	}

	async function handleThumbnailFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const fd = new FormData();
		fd.append("file", file);
		try {
			const res = await fetch("/api/upload", {
				method: "POST",
				body: fd,
			});
			const data = (await res.json()) as { url?: string; error?: string };
			if (!res.ok || !data.url)
				throw new Error(data.error ?? "Upload failed");
			setThumbnailUrl(data.url);
		} catch {
			toast.error("Thumbnail upload failed");
		}
	}

	function handleSubmit() {
		if (!title.trim()) {
			toast.warning("Title is required");
			return;
		}
		if (!videoUrl) {
			toast.warning("Please upload a video");
			return;
		}

		startTransition(async () => {
			try {
				await createVideo({
					title,
					description: description || undefined,
					url: videoUrl,
					thumbnailUrl: thumbnailUrl || undefined,
					privacy,
					hashtags: tagsInput.split(/[,\s]+/).filter(Boolean),
				});
				toast.success("Video published!");
				handleClose();
				onSuccess?.();
			} catch {
				toast.error("Failed to publish video");
			}
		});
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Upload Video</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Video upload */}
					<div className="space-y-1.5">
						<Label>Video file *</Label>
						{videoUrl ? (
							<div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
								<video
									src={videoUrl}
									className="w-full h-full object-contain"
									controls={false}
								/>
								<button
									onClick={() => {
										setVideoUrl("");
										setVideoFile(null);
									}}
									className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black"
								>
									<X className="h-3.5 w-3.5 text-white" />
								</button>
								<div className="absolute bottom-2 left-2 text-xs text-white bg-black/60 rounded px-1.5 py-0.5">
									{videoFile?.name}
								</div>
							</div>
						) : (
							<label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-40 cursor-pointer hover:border-primary transition-colors bg-muted/50">
								{uploading ? (
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
								) : (
									<Upload className="h-8 w-8 text-muted-foreground mb-2" />
								)}
								<span className="text-sm text-muted-foreground">
									{uploading
										? "Uploading…"
										: "Click to upload video (MP4, WebM)"}
								</span>
								<input
									type="file"
									accept="video/mp4,video/webm"
									className="hidden"
									onChange={handleVideoFile}
									disabled={uploading}
								/>
							</label>
						)}
					</div>

					{/* Thumbnail */}
					<div className="space-y-1.5">
						<Label>Thumbnail (optional)</Label>
						<label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-muted transition-colors">
							<Upload className="h-4 w-4 text-muted-foreground shrink-0" />
							<span className="text-sm text-muted-foreground truncate">
								{thumbnailUrl
									? "Thumbnail uploaded ✓"
									: "Upload thumbnail image"}
							</span>
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleThumbnailFile}
							/>
						</label>
					</div>

					{/* Title */}
					<div className="space-y-1.5">
						<Label htmlFor="video-title">Title *</Label>
						<Input
							id="video-title"
							placeholder="Give your video a title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>

					{/* Description */}
					<div className="space-y-1.5">
						<Label htmlFor="video-desc">Description</Label>
						<Textarea
							id="video-desc"
							placeholder="Tell viewers about your video…"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="resize-none min-h-[72px]"
						/>
					</div>

					{/* Tags */}
					<div className="space-y-1.5">
						<Label htmlFor="video-tags">Tags</Label>
						<div className="relative">
							<Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								id="video-tags"
								placeholder="music, tutorial, vlog"
								value={tagsInput}
								onChange={(e) => setTagsInput(e.target.value)}
								className="pl-9"
							/>
						</div>
					</div>

					{/* Privacy */}
					<div className="space-y-1.5">
						<Label>Visibility</Label>
						<Select
							value={privacy}
							onValueChange={(v) => setPrivacy(v as PostPrivacy)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PRIVACY_OPTIONS.map(
									({ value, label, icon: Icon }) => (
										<SelectItem key={value} value={value}>
											<span className="flex items-center gap-2">
												<Icon className="h-4 w-4" />
												{label}
											</span>
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-2 pt-1">
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
							onClick={handleSubmit}
							disabled={
								isPending ||
								uploading ||
								!videoUrl ||
								!title.trim()
							}
						>
							{isPending && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Publish
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
