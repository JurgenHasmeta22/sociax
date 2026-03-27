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
import { Input } from "@/components/ui/input";
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
	const [mediaUrl, setMediaUrl] = useState("");
	const [showImageInput, setShowImageInput] = useState(false);
	const [isPending, startTransition] = useTransition();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const name = displayName(user);
	const PrivacyIcon =
		PRIVACY_OPTIONS.find((o) => o.value === privacy)?.icon ?? Globe;

	const reset = () => {
		setContent("");
		setMediaUrl("");
		setPrivacy("Public");
		setShowImageInput(false);
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = () => {
		if (!content.trim() && !mediaUrl.trim()) {
			toast.warning("Write something or add a photo first.");
			return;
		}

		startTransition(async () => {
			try {
				await createPost(
					content,
					privacy,
					mediaUrl.trim() ? [mediaUrl.trim()] : [],
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

				{showImageInput && (
					<div className="flex items-center gap-2 border rounded-lg p-3 bg-muted/40">
						<Input
							placeholder="Paste image URL…"
							value={mediaUrl}
							onChange={(e) => setMediaUrl(e.target.value)}
							className="border-0 bg-transparent focus-visible:ring-0 text-sm p-0"
						/>
						<button
							onClick={() => {
								setMediaUrl("");
								setShowImageInput(false);
							}}
							className="text-muted-foreground hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
				)}

				<div className="border rounded-lg p-3 flex items-center justify-between">
					<p className="text-sm font-medium">Add to your post</p>
					<button
						onClick={() => setShowImageInput((v) => !v)}
						className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
						title="Add photo"
					>
						<ImagePlus className="h-5 w-5 text-green-500" />
					</button>
				</div>

				<Button
					onClick={handleSubmit}
					disabled={
						isPending || (!content.trim() && !mediaUrl.trim())
					}
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
