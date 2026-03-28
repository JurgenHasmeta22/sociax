"use client";

import { useState } from "react";
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
	Plus,
	BookOpen,
	Camera,
	Video,
	UsersRound,
	Flag,
	CalendarDays,
	ShoppingBag,
	Gamepad2,
	PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePostDialog } from "@/components/feed/CreatePostDialog";
import { CreateStoryDialog } from "@/components/feed/CreateStoryDialog";

const LIST_ITEMS = [
	{
		label: "Group",
		description: "Build a community around a shared interest.",
		icon: UsersRound,
		href: "/groups",
		iconBg: "bg-yellow-500/15 text-yellow-500",
	},
	{
		label: "Page",
		description: "Find and connect with businesses.",
		icon: Flag,
		href: "/pages",
		iconBg: "bg-red-500/15 text-red-500",
	},
	{
		label: "Event",
		description: "Discover fun activities near you.",
		icon: CalendarDays,
		href: "/events",
		iconBg: "bg-green-500/15 text-green-500",
	},
	{
		label: "Listing",
		description: "Sell items on the marketplace.",
		icon: ShoppingBag,
		href: "/marketplace/create",
		iconBg: "bg-purple-500/15 text-purple-500",
	},
	{
		label: "Blog",
		description: "Write a long-form article or story.",
		icon: BookOpen,
		href: "/blog/create",
		iconBg: "bg-sky-500/15 text-sky-500",
	},
	{
		label: "Video",
		description: "Upload a video to share with friends.",
		icon: Video,
		href: "/videos",
		iconBg: "bg-pink-500/15 text-pink-500",
	},
	{
		label: "Games",
		description: "Play games with friends and have fun.",
		icon: Gamepad2,
		href: "/feed",
		iconBg: "bg-cyan-500/15 text-cyan-500",
	},
] as const;

export function CreateMenu() {
	const [open, setOpen] = useState(false);
	const [postOpen, setPostOpen] = useState(false);
	const [storyOpen, setStoryOpen] = useState(false);
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
						<Link
							href="/videos"
							onClick={() => setOpen(false)}
							className="flex flex-col items-center gap-2 rounded-xl p-3 hover:bg-muted transition-colors cursor-pointer border border-border/50"
						>
							<div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/15 text-pink-500">
								<Video className="h-6 w-6" />
							</div>
							<span className="text-xs font-medium">Reel</span>
						</Link>
					</div>

					<Separator className="mb-3" />

					{/* List items */}
					<div className="space-y-1">
						{LIST_ITEMS.map(({ label, description, icon: Icon, href, iconBg }) => (
							<Link
								key={label}
								href={href}
								onClick={() => setOpen(false)}
								className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors"
							>
								<div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", iconBg)}>
									<Icon className="h-[18px] w-[18px]" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-semibold leading-tight">{label}</p>
									<p className="text-xs text-muted-foreground truncate">{description}</p>
								</div>
							</Link>
						))}
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
		</>
	);
}
