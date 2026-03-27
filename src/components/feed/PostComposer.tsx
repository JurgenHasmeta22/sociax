"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, Video } from "lucide-react";
import { CreatePostDialog } from "@/components/feed/CreatePostDialog";

type ComposerUser = {
	userName: string;
	firstName: string | null;
	lastName: string | null;
	avatar: { photoSrc: string } | null;
};

export function PostComposer({ user }: { user: ComposerUser }) {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<>
			<Card className="shadow-sm border-border/50">
				<CardContent className="pt-4 pb-4">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 shrink-0 ring-2 ring-primary/20">
							<AvatarImage src={user.avatar?.photoSrc ?? undefined} />
							<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
								{(user.firstName || user.userName)[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<button
							onClick={() => setDialogOpen(true)}
							className="flex-1 flex items-center justify-between text-left bg-muted/60 hover:bg-muted rounded-full px-4 py-2.5 transition-colors group"
						>
							<span className="text-muted-foreground text-sm">
								What do you have in mind?
							</span>
							<div className="flex items-center gap-2 ml-2">
								<div
									onClick={(e) => {
										e.stopPropagation();
										setDialogOpen(true);
									}}
									className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-500/10 hover:bg-pink-500/20 transition-colors cursor-pointer"
								>
									<ImageIcon className="h-4 w-4 text-pink-400" />
								</div>
								<div
									onClick={(e) => {
										e.stopPropagation();
										setDialogOpen(true);
									}}
									className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
								>
									<Video className="h-4 w-4 text-blue-400" />
								</div>
							</div>
						</button>
					</div>
				</CardContent>
			</Card>

			<CreatePostDialog
				user={user}
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
			/>
		</>
	);
}
