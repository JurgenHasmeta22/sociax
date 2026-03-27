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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Globe, Users, Lock, Loader2 } from "lucide-react";
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
	const [caption, setCaption] = useState("");
	const [privacy, setPrivacy] = useState<Privacy>("FriendsOnly");
	const [isPending, startTransition] = useTransition();

	const reset = () => {
		setMediaUrl("");
		setCaption("");
		setPrivacy("FriendsOnly");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleSubmit = () => {
		if (!mediaUrl.trim()) {
			toast.warning("Please provide an image URL.");
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
					<div>
						<p className="text-sm font-medium mb-1.5">Image URL</p>
						<Input
							placeholder="https://example.com/photo.jpg"
							value={mediaUrl}
							onChange={(e) => setMediaUrl(e.target.value)}
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
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button
							className="flex-1"
							onClick={handleSubmit}
							disabled={isPending || !mediaUrl.trim()}
						>
							{isPending && (
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
