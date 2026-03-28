"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Globe,
	Users,
	Lock,
	Loader2,
	Upload,
	X,
	ImageIcon,
	Video,
} from "lucide-react";
import { createStory } from "@/actions/story.actions";
import { toast } from "sonner";

const PRIVACY_OPTIONS = [
	{ value: "FriendsOnly", label: "Friends", icon: Users },
	{ value: "Public", label: "Public", icon: Globe },
	{ value: "CloseFriends", label: "Close friends", icon: Lock },
] as const;

type Privacy = (typeof PRIVACY_OPTIONS)[number]["value"];

export function CreateStoryDialog({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const [mediaUrl, setMediaUrl] = useState("");
	const [mediaType, setMediaType] = useState<"image" | "video">("image");
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [caption, setCaption] = useState("");
	const [privacy, setPrivacy] = useState<Privacy>("FriendsOnly");
	const [isPending, startTransition] = useTransition();
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const reset = () => {
		setMediaUrl("");
		setMediaType("image");
		setPreviewUrl(null);
		setCaption("");
		setPrivacy("FriendsOnly");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const isVideo = file.type.startsWith("video/");
		setMediaType(isVideo ? "video" : "image");

		// Show local preview immediately
		const localUrl = URL.createObjectURL(file);
		setPreviewUrl(localUrl);

		// Upload to server
		setIsUploading(true);
		try {
			const form = new FormData();
			form.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: form,
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error ?? "Upload failed");
			}
			const { url } = await res.json();
			setMediaUrl(url);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
			setPreviewUrl(null);
			setMediaUrl("");
		} finally {
			setIsUploading(false);
		}

		// Reset input so the same file can be selected again
		e.target.value = "";
	};

	const handleRemoveMedia = () => {
		setMediaUrl("");
		setPreviewUrl(null);
	};

	const handleSubmit = () => {
		if (!mediaUrl.trim()) {
			toast.warning("Please select a photo or video.");
			return;
		}

		startTransition(async () => {
			try {
				await createStory(mediaUrl, caption, privacy);
				toast.success("Story added!");
				handleClose();
			} catch {
				toast.error("Failed to create story.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Create story</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{/* Media picker */}
					<div>
						<p className="text-sm font-medium mb-1.5">
							Photo or video
						</p>
						{previewUrl ? (
							<div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-64">
								{mediaType === "video" ? (
									<video
										src={previewUrl}
										className="w-full h-full object-cover"
										muted
										playsInline
									/>
								) : (
									<Image
										src={previewUrl}
										alt="Preview"
										fill
										sizes="400px"
										unoptimized
										className="object-cover"
									/>
								)}
								{isUploading && (
									<div className="absolute inset-0 bg-black/60 flex items-center justify-center">
										<Loader2 className="h-8 w-8 text-white animate-spin" />
									</div>
								)}
								<button
									onClick={handleRemoveMedia}
									className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<button
								onClick={() => fileInputRef.current?.click()}
								className="w-full border-2 border-dashed border-border rounded-xl py-10 flex flex-col items-center gap-3 hover:border-primary/50 hover:bg-muted/50 transition-colors"
							>
								<div className="flex gap-3">
									<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
										<ImageIcon className="h-5 w-5 text-muted-foreground" />
									</div>
									<div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
										<Video className="h-5 w-5 text-muted-foreground" />
									</div>
								</div>
								<div className="text-center">
									<p className="text-sm font-medium">
										Choose photo or video
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										JPEG, PNG, GIF, WebP, MP4, WebM · up to
										50 MB
									</p>
								</div>
								<Button
									variant="secondary"
									size="sm"
									className="gap-2 pointer-events-none"
								>
									<Upload className="h-4 w-4" />
									Browse files
								</Button>
							</button>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
							className="hidden"
							onChange={handleFileChange}
						/>
					</div>

					<div>
						<p className="text-sm font-medium mb-1.5">
							Caption (optional)
						</p>
						<Textarea
							placeholder="Add a caption…"
							value={caption}
							onChange={(e) => setCaption(e.target.value)}
							className="resize-none min-h-[80px]"
						/>
					</div>

					<div>
						<p className="text-sm font-medium mb-1.5">Audience</p>
						<Select
							value={privacy}
							onValueChange={(v) => setPrivacy(v as Privacy)}
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
							disabled={isPending || isUploading}
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							onClick={handleSubmit}
							disabled={
								isPending || isUploading || !mediaUrl.trim()
							}
						>
							{(isPending || isUploading) && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Share story
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
