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
			<ScrollArea className="w-full">
				<div className="flex gap-4 px-1 py-2">
					{/* Create Story button */}
					<button
						onClick={() => setCreateOpen(true)}
						className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
					>
						<div className="relative w-14 h-14">
							<div className="w-14 h-14 rounded-full overflow-hidden border-2 border-muted bg-muted group-hover:border-primary/50 transition-colors">
								{currentUser.avatar ? (
									<Image
										src={currentUser.avatar.photoSrc}
										alt=""
										fill
										unoptimized
										className="object-cover"
										sizes="56px"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-muted">
										<span className="text-muted-foreground font-bold text-lg">
											{userName[0]?.toUpperCase()}
										</span>
									</div>
								)}
							</div>
							<div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
								<Plus className="h-3 w-3 text-primary-foreground" />
							</div>
						</div>
						<span className="text-[11px] text-muted-foreground font-medium w-14 text-center truncate">
							Add story
						</span>
					</button>

					{/* Story items */}
					{stories.map((story, i) => {
						const storyName = displayName(story.user);
						const viewed = story.views.length > 0;
						return (
							<button
								key={story.id}
								onClick={() => setViewIndex(i)}
								className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
							>
								<div
									className={`w-14 h-14 rounded-full p-0.5 ${
										viewed
											? "bg-muted"
											: "bg-gradient-to-br from-fuchsia-500 via-rose-400 to-amber-400"
									}`}
								>
									<div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
										<Avatar className="h-full w-full rounded-full">
											<AvatarImage
												src={
													story.user.avatar
														?.photoSrc ?? undefined
												}
												className="object-cover"
											/>
											<AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold rounded-full">
												{storyName[0]?.toUpperCase()}
											</AvatarFallback>
										</Avatar>
									</div>
								</div>
								<span className="text-[11px] text-foreground/70 font-medium w-14 text-center truncate">
									{storyName.split(" ")[0]}
								</span>
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
