"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Check, Loader2 } from "lucide-react";
import { followPage, unfollowPage } from "@/actions/page.actions";
import { toast } from "sonner";

export function PageFollowButton({
	pageId,
	initialFollowing,
}: {
	pageId: number;
	initialFollowing: boolean;
}) {
	const [isFollowing, setIsFollowing] = useState(initialFollowing);
	const [isPending, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(async () => {
			try {
				if (isFollowing) {
					await unfollowPage(pageId);
					setIsFollowing(false);
					toast.success("Unfollowed page.");
				} else {
					await followPage(pageId);
					setIsFollowing(true);
					toast.success("Following page!");
				}
			} catch {
				toast.error("Something went wrong.");
			}
		});
	};

	return (
		<Button
			onClick={handleToggle}
			disabled={isPending}
			variant={isFollowing ? "secondary" : "default"}
			className="gap-2 font-semibold"
		>
			{isPending ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : isFollowing ? (
				<>
					<Check className="h-4 w-4" />
					Following
				</>
			) : (
				<>
					<UserPlus className="h-4 w-4" />
					Follow page
				</>
			)}
		</Button>
	);
}
