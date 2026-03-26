"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	ChevronRight,
	X,
	Trash2,
	Eye,
	Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deleteStory, markStoryViewed } from "@/actions/story.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type StoryUser = {
	id: number;
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

export type StoryItem = {
	id: number;
	mediaUrl: string;
	caption: string | null;
	createdAt: Date;
	user: StoryUser;
	views: { id: number }[];
	_count: { views: number };
};

const displayName = (u: StoryUser) =>
	[u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

const STORY_DURATION = 5000;

export function StoryViewer({
	stories,
	initialIndex,
	currentUserId,
	onClose,
}: {
	stories: StoryItem[];
	initialIndex: number;
	currentUserId: number;
	onClose: () => void;
}) {
	const [index, setIndex] = useState(initialIndex);
	const [progress, setProgress] = useState(0);
	const [isPending, startTransition] = useTransition();

	const story = stories[index];
	const isOwn = story?.user.id === currentUserId;

	const goNext = useCallback(() => {
		if (index < stories.length - 1) {
			setIndex((i) => i + 1);
			setProgress(0);
		} else {
			onClose();
		}
	}, [index, stories.length, onClose]);

	const goPrev = () => {
		if (index > 0) {
			setIndex((i) => i - 1);
			setProgress(0);
		}
	};

	useEffect(() => {
		if (!story) return;
		markStoryViewed(story.id).catch(() => {});
	}, [story?.id]);

	useEffect(() => {
		const start = Date.now();
		const interval = setInterval(() => {
			const elapsed = Date.now() - start;
			const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
			setProgress(pct);
			if (pct >= 100) {
				clearInterval(interval);
				goNext();
			}
		}, 50);
		return () => clearInterval(interval);
	}, [index, goNext]);

	const handleDelete = () => {
		if (!story || !isOwn) return;
		startTransition(async () => {
			try {
				await deleteStory(story.id);
				toast.success("Story deleted.");
				if (stories.length === 1) {
					onClose();
				} else {
					goNext();
				}
			} catch {
				toast.error("Failed to delete story.");
			}
		});
	};

	if (!story) return null;

	const name = displayName(story.user);

	return (
		<div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
			<button
				onClick={onClose}
				className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
			>
				<X className="h-7 w-7" />
			</button>

			<div className="relative w-full max-w-sm h-[calc(100vh-2rem)] max-h-[700px] rounded-xl overflow-hidden shadow-2xl">
				<div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
					{stories.map((_, i) => (
						<div
							key={i}
							className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
						>
							<div
								className="h-full bg-white rounded-full transition-none"
								style={{
									width:
										i < index
											? "100%"
											: i === index
												? `${progress}%`
												: "0%",
								}}
							/>
						</div>
					))}
				</div>

				<div className="absolute top-6 left-0 right-0 z-10 flex items-center justify-between px-3 py-2">
					<div className="flex items-center gap-2">
						<Avatar className="h-9 w-9 ring-2 ring-white">
							<AvatarImage src={story.user.avatar?.photoSrc ?? undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
								{name[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div>
							<p className="text-white text-sm font-semibold drop-shadow leading-tight">
								{name}
							</p>
							<p className="text-white/60 text-xs">
								{formatDistanceToNow(new Date(story.createdAt), {
									addSuffix: true,
								})}
							</p>
						</div>
					</div>
					{isOwn && (
						<div className="flex items-center gap-2">
							<span className="text-white/70 text-xs flex items-center gap-1">
								<Eye className="h-3.5 w-3.5" />
								{story._count.views}
							</span>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-white/80 hover:text-red-400 hover:bg-white/10"
								onClick={handleDelete}
								disabled={isPending}
							>
								{isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Trash2 className="h-4 w-4" />
								)}
							</Button>
						</div>
					)}
				</div>

				<div className="relative w-full h-full bg-black">
					<Image
						src={story.mediaUrl}
						alt={story.caption ?? "Story"}
						fill
						className="object-cover"
						sizes="400px"
						priority
					/>
					{story.caption && (
						<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
							<p className="text-white text-sm font-medium text-center drop-shadow">
								{story.caption}
							</p>
						</div>
					)}
				</div>

				{index > 0 && (
					<button
						onClick={goPrev}
						className={cn(
							"absolute left-0 top-0 bottom-0 w-1/3 flex items-center justify-start pl-2",
							"text-white/0 hover:text-white/80 transition-colors",
						)}
					>
						<ChevronLeft className="h-8 w-8" />
					</button>
				)}
				<button
					onClick={goNext}
					className={cn(
						"absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-2",
						"text-white/0 hover:text-white/80 transition-colors",
					)}
				>
					<ChevronRight className="h-8 w-8" />
				</button>
			</div>
		</div>
	);
}
