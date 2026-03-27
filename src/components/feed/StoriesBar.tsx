"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { CreateStoryDialog } from "@/components/feed/CreateStoryDialog";
import { StoryViewer, type StoryItem } from "@/components/feed/StoryViewer";

type Story = {
	id: number;
	mediaUrl: string;
	caption: string | null;
	createdAt: Date;
	user: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	views: { id: number }[];
	_count: { views: number };
};

type CurrentUser = {
	id: number;
	firstName: string | null;
	lastName: string | null;
	userName: string;
	avatar: { photoSrc: string } | null;
};

const displayName = (u: {
	firstName: string | null;
	lastName: string | null;
	userName: string;
}) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.userName;

export function StoriesBar({
	stories,
	currentUser,
}: {
	stories: Story[];
	currentUser: CurrentUser;
}) {
	const [createOpen, setCreateOpen] = useState(false);
	const [viewIndex, setViewIndex] = useState<number | null>(null);

	const userName = displayName(currentUser);

	const viewerStories: StoryItem[] = stories.map((s) => ({
		...s,
		user: { ...s.user },
	}));

	return (
		<>
			<ScrollArea className="w-full pb-2">
				<div className="flex gap-2.5">
					<button
						onClick={() => setCreateOpen(true)}
						className="relative w-[112px] h-[196px] rounded-xl overflow-hidden bg-muted flex-shrink-0 cursor-pointer group border border-border"
					>
						<div className="h-[140px] w-full overflow-hidden relative bg-muted">
							{currentUser.avatar && (
								<Image
									src={currentUser.avatar.photoSrc}
									alt=""
									fill
									unoptimized
									className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-200"
									sizes="112px"
								/>
							)}
						</div>
						<div className="absolute top-[110px] left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary flex items-center justify-center border-4 border-background z-10">
							<Plus className="h-5 w-5 text-primary-foreground" />
						</div>
						<div className="absolute bottom-0 left-0 right-0 bg-card pb-3 pt-6 px-2">
							<p className="text-[11px] font-semibold text-center leading-tight truncate">
								Create story
							</p>
						</div>
					</button>

					{stories.map((story, i) => {
						const storyName = displayName(story.user);
						const viewed = story.views.length > 0;
						return (
							<button
								key={story.id}
								onClick={() => setViewIndex(i)}
								className="relative w-[112px] h-[196px] rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
							>
								<Image
									src={story.mediaUrl}
									alt=""
									fill
									unoptimized
									className="object-cover group-hover:scale-105 transition-transform duration-200"
									sizes="112px"
								/>
								<div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
								<div
									className={`absolute top-2 left-2 rounded-full p-0.5 ${viewed ? "ring-2 ring-white/60" : "ring-[3px] ring-primary"}`}
								>
									<Avatar className="h-9 w-9">
										<AvatarImage
											src={
												story.user.avatar?.photoSrc ??
												undefined
											}
										/>
										<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
											{storyName[0]?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
								</div>
								<div className="absolute bottom-2 left-2 right-2">
									<p className="text-white text-xs font-semibold truncate drop-shadow">
										{storyName}
									</p>
								</div>
							</button>
						);
					})}
				</div>
				<ScrollBar orientation="horizontal" />
			</ScrollArea>

			<CreateStoryDialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
			/>

			{viewIndex !== null && (
				<StoryViewer
					stories={viewerStories}
					initialIndex={viewIndex}
					currentUserId={currentUser.id}
					onClose={() => setViewIndex(null)}
				/>
			)}
		</>
	);
}
