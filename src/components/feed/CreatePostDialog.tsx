"use client";

import { useState, useTransition, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Globe, Users, Lock, ImagePlus, X, Loader2 } from "lucide-react";
import { createPost } from "@/actions/post.actions";
import { toast } from "sonner";

type User = {
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

const displayName = (u: User) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const PRIVACY_OPTIONS = [
	{ value: "Public", label: "Public", icon: Globe },
	{ value: "FriendsOnly", label: "Friends", icon: Users },
	{ value: "OnlyMe", label: "Only me", icon: Lock },
] as const;

type Privacy = (typeof PRIVACY_OPTIONS)[number]["value"];

export function CreatePostDialog({
	user,
	open,
	onClose,
}: {
	user: User;
	open: boolean;
	onClose: () => void;
}) {
	const [content, setContent] = useState("");
	const [privacy, setPrivacy] = useState<Privacy>("Public");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const name = displayName(user);
	const PrivacyIcon =
		PRIVACY_OPTIONS.find((o) => o.value === privacy)?.icon ?? Globe;

	const clearFile = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setSelectedFile(file);
		setPreviewUrl(URL.createObjectURL(file));
	};

	const reset = () => {
		setContent("");
		clearFile();
		setPrivacy("Public");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = () => {
		if (!content.trim() && !selectedFile) {
			toast.warning("Write something or add a photo first.");
			return;
		}

		startTransition(async () => {
			try {
				let uploadedUrl = "";
				if (selectedFile) {
					const form = new FormData();
					form.append("file", selectedFile);
					const res = await fetch("/api/upload", {
						method: "POST",
						body: form,
					});
					if (!res.ok) throw new Error("Upload failed");
					const json = (await res.json()) as { url: string };
					uploadedUrl = json.url;
				}
				await createPost(
					content,
					privacy,
					uploadedUrl ? [uploadedUrl] : [],
				);
				toast.success("Post shared!");
				handleClose();
			} catch {
				toast.error("Something went wrong.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle className="text-center">
						Create post
					</DialogTitle>
				</DialogHeader>

				<div className="flex items-center gap-3 pt-1">
					<Avatar className="h-10 w-10 shrink-0">
						<AvatarImage src={user.avatar?.photoSrc ?? undefined} />
						<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
							{name[0]?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="font-semibold text-sm leading-tight">
							{name}
						</p>
						<Select
							value={privacy}
							onValueChange={(v) => setPrivacy(v as Privacy)}
						>
							<SelectTrigger className="h-6 text-xs px-2 gap-1 rounded-md border-border w-auto mt-0.5">
								<PrivacyIcon className="h-3 w-3" />
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PRIVACY_OPTIONS.map(
									({ value, label, icon: Icon }) => (
										<SelectItem key={value} value={value}>
											<span className="flex items-center gap-2">
												<Icon className="h-3.5 w-3.5" />
												{label}
											</span>
										</SelectItem>
									),
								)}
							</SelectContent>
						</Select>
					</div>
				</div>

				<Textarea
					ref={textareaRef}
					autoFocus
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder={`What's on your mind, ${user.firstName || user.userName}?`}
					className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-base p-0 text-foreground placeholder:text-muted-foreground"
				/>

				{previewUrl && (
					<div className="relative rounded-lg overflow-hidden border">
						{selectedFile?.type.startsWith("video/") ? (
							<video
								src={previewUrl}
								controls
								className="w-full max-h-60 object-contain bg-black"
							/>
						) : (
							<img
								src={previewUrl}
								alt="preview"
								className="w-full max-h-60 object-contain"
							/>
						)}
						<button
							onClick={clearFile}
							className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm"
					className="hidden"
					onChange={handleFileChange}
				/>

				<div className="border rounded-lg p-3 flex items-center justify-between">
					<p className="text-sm font-medium">Add to your post</p>
					<button
						onClick={() => fileInputRef.current?.click()}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
						title="Add photo/video"
					>
						<ImagePlus className="h-5 w-5 text-green-500" />
					</button>
				</div>

				<Button
					onClick={handleSubmit}
					disabled={isPending || (!content.trim() && !selectedFile)}
					className="w-full font-semibold"
				>
					{isPending && (
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
					)}
					Post
				</Button>
			</DialogContent>
		</Dialog>
	);
}
