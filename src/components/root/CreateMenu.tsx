"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Plus,
	BookOpen,
	Camera,
	Video,
	UsersRound,
	Flag,
	CalendarDays,
	ShoppingBag,
	PenLine,
	Upload,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePostDialog } from "@/components/feed/CreatePostDialog";
import { CreateStoryDialog } from "@/components/feed/CreateStoryDialog";
import { CreateGroupDialog } from "@/components/groups/CreateGroupDialog";
import { CreatePageDialog } from "@/components/pages/CreatePageDialog";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { createVideo } from "@/actions/video.actions";
import type { PostPrivacy } from "../../../prisma/generated/prisma/enums";
import { toast } from "sonner";

function CreateVideoModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [privacy, setPrivacy] = useState<PostPrivacy>("Public");
	const [videoUrl, setVideoUrl] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [fileName, setFileName] = useState("");
	const [isPending, startTransition] = useTransition();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const reset = () => {
		setTitle("");
		setDescription("");
		setPrivacy("Public");
		setVideoUrl("");
		setFileName("");
	};

	const handleClose = () => {
		reset();
		onClose();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setFileName(file.name);
		setIsUploading(true);
		try {
			const form = new FormData();
			form.append("file", file);
			const res = await fetch("/api/upload", {
				method: "POST",
				body: form,
			});
			if (!res.ok) {
				const d = await res.json();
				throw new Error(d.error ?? "Upload failed");
			}
			const { url } = await res.json();
			setVideoUrl(url);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
			setVideoUrl("");
			setFileName("");
		} finally {
			setIsUploading(false);
			e.target.value = "";
		}
	};

	const handleSubmit = () => {
		if (!title.trim() || !videoUrl) return;
		startTransition(async () => {
			try {
				await createVideo({
					title,
					description,
					url: videoUrl,
					privacy,
				});
				toast.success("Video uploaded!");
				handleClose();
				router.push("/videos");
			} catch {
				toast.error("Failed to upload video.");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Upload video</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div>
						<p className="text-sm font-medium mb-1.5">Video file</p>
						<button
							onClick={() => fileInputRef.current?.click()}
							className={cn(
								"w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-muted/50 transition-colors",
								videoUrl && "border-primary/40 bg-muted/30",
							)}
						>
							<Video
								className={cn(
									"h-8 w-8",
									videoUrl
										? "text-primary"
										: "text-muted-foreground",
								)}
							/>
							<p className="text-sm font-medium">
								{fileName || "Choose video file"}
							</p>
							{isUploading && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							{!isUploading && (
								<p className="text-xs text-muted-foreground">
									MP4, WebM · up to 50 MB
								</p>
							)}
						</button>
						<input
							ref={fileInputRef}
							type="file"
							accept="video/mp4,video/webm"
							className="hidden"
							onChange={handleFileChange}
						/>
					</div>
					<div>
						<p className="text-sm font-medium mb-1.5">Title</p>
						<Input
							placeholder="Video title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
						/>
					</div>
					<div>
						<p className="text-sm font-medium mb-1.5">
							Description (optional)
						</p>
						<Textarea
							placeholder="Describe your video…"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="resize-none min-h-[70px]"
						/>
					</div>
					<div>
						<p className="text-sm font-medium mb-1.5">Audience</p>
						<Select
							value={privacy}
							onValueChange={(v) => setPrivacy(v as PostPrivacy)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Public">Public</SelectItem>
								<SelectItem value="FriendsOnly">
									Friends only
								</SelectItem>
								<SelectItem value="OnlyMe">Only me</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
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
								isPending ||
								isUploading ||
								!title.trim() ||
								!videoUrl
							}
						>
							{(isPending || isUploading) && (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							)}
							Upload
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

const MODAL_ITEMS = [
	{
		label: "Group",
		description: "Build a community around a shared interest.",
		icon: UsersRound,
		modal: "group" as const,
		iconBg: "bg-yellow-500/15 text-yellow-500",
	},
	{
		label: "Page",
		description: "Create a presence for a business or brand.",
		icon: Flag,
		modal: "page" as const,
		iconBg: "bg-red-500/15 text-red-500",
	},
	{
		label: "Event",
		description: "Organise an event and invite people.",
		icon: CalendarDays,
		modal: "event" as const,
		iconBg: "bg-green-500/15 text-green-500",
	},
];

const LINK_ITEMS = [
	{
		label: "Listing",
		description: "Sell items on the marketplace.",
		icon: ShoppingBag,
		href: "/marketplace/create",
		iconBg: "bg-purple-500/15 text-purple-500",
	},
	{
		label: "Blog",
		description: "Write a long‑form article or story.",
		icon: BookOpen,
		href: "/blog/create",
		iconBg: "bg-sky-500/15 text-sky-500",
	},
];

type ModalKey = "group" | "page" | "event" | "video";

export function CreateMenu() {
	const [open, setOpen] = useState(false);
	const [postOpen, setPostOpen] = useState(false);
	const [storyOpen, setStoryOpen] = useState(false);
	const [modalOpen, setModalOpen] = useState<ModalKey | null>(null);
	const { data: session } = useSession();

	const user = session?.user
		? {
				userName: session.user.name ?? "",
				firstName: null as string | null,
				lastName: null as string | null,
				avatar: session.user.image
					? { photoSrc: session.user.image }
					: null,
			}
		: null;

	const openModal = (key: ModalKey) => {
		setOpen(false);
		setModalOpen(key);
	};

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="rounded-full bg-muted h-9 w-9 hover:bg-accent transition-colors"
						aria-label="Create"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="end"
					sideOffset={8}
					className="w-72 p-4 shadow-xl"
				>
					<p className="text-base font-bold mb-3">Create</p>

					{/* Top row: Story / Post / Reel */}
					<div className="grid grid-cols-3 gap-2 mb-4">
						<button
							onClick={() => {
								setOpen(false);
								setStoryOpen(true);
							}}
							className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-muted transition-colors cursor-pointer border border-border/50"
						>
							<div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-500">
								<Camera className="h-6 w-6" />
							</div>
							<span className="text-xs font-medium">Story</span>
						</button>
						<button
							onClick={() => {
								setOpen(false);
								setPostOpen(true);
							}}
							className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-muted transition-colors cursor-pointer border border-border/50"
						>
							<div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/15 text-blue-500">
								<PenLine className="h-6 w-6" />
							</div>
							<span className="text-xs font-medium">Post</span>
						</button>
						<button
							onClick={() => openModal("video")}
							className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-muted transition-colors cursor-pointer border border-border/50"
						>
							<div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/15 text-pink-500">
								<Upload className="h-6 w-6" />
							</div>
							<span className="text-xs font-medium">Video</span>
						</button>
					</div>

					<Separator className="mb-3" />

					{/* Modal items: Group, Page, Event, Video */}
					<div className="space-y-1">
						{MODAL_ITEMS.map(
							({
								label,
								description,
								icon: Icon,
								modal,
								iconBg,
							}) => (
								<button
									key={label}
									onClick={() => openModal(modal)}
									className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors text-left"
								>
									<div
										className={cn(
											"w-9 h-9 rounded-full flex items-center justify-center shrink-0",
											iconBg,
										)}
									>
										<Icon className="h-[18px] w-[18px]" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold leading-tight">
											{label}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{description}
										</p>
									</div>
								</button>
							),
						)}
						{/* Link items: Listing & Blog keep their creation pages */}
						{LINK_ITEMS.map(
							({
								label,
								description,
								icon: Icon,
								href,
								iconBg,
							}) => (
								<Link
									key={label}
									href={href}
									onClick={() => setOpen(false)}
									className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors"
								>
									<div
										className={cn(
											"w-9 h-9 rounded-full flex items-center justify-center shrink-0",
											iconBg,
										)}
									>
										<Icon className="h-[18px] w-[18px]" />
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold leading-tight">
											{label}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{description}
										</p>
									</div>
								</Link>
							),
						)}
					</div>
				</PopoverContent>
			</Popover>

			{user && (
				<CreatePostDialog
					user={user}
					open={postOpen}
					onClose={() => setPostOpen(false)}
				/>
			)}
			<CreateStoryDialog
				open={storyOpen}
				onClose={() => setStoryOpen(false)}
			/>
			<CreateGroupDialog
				open={modalOpen === "group"}
				onClose={() => setModalOpen(null)}
			/>
			<CreatePageDialog
				open={modalOpen === "page"}
				onClose={() => setModalOpen(null)}
			/>
			<CreateEventDialog
				open={modalOpen === "event"}
				onClose={() => setModalOpen(null)}
			/>
			<CreateVideoModal
				open={modalOpen === "video"}
				onClose={() => setModalOpen(null)}
			/>
		</>
	);
}
