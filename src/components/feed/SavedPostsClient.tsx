"use client";

import { useState, useCallback } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { PostCard } from "@/components/feed/PostCard";
import { fetchSavedPosts } from "@/actions/post.actions";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type Post = Parameters<typeof PostCard>[0]["post"];

export function SavedPostsClient({
	initialPosts,
	currentUserId,
}: {
	initialPosts: Post[];
	currentUserId: number;
}) {
	const [posts, setPosts] = useState(initialPosts);
	const [hasMore, setHasMore] = useState(initialPosts.length >= 20);
	const [loading, setLoading] = useState(false);

	const loadMore = useCallback(async () => {
		if (loading || !hasMore) return;
		setLoading(true);
		try {
			const next = await fetchSavedPosts(posts.length);
			setPosts((prev) => [...prev, ...next]);
			if (next.length < 20) setHasMore(false);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, [loading, hasMore, posts.length]);

	const sentinelRef = useInfiniteScroll(loadMore, { hasMore, loading });

	if (posts.length === 0) {
		return (
			<div className="text-center py-16 text-muted-foreground">
				<Bookmark className="h-10 w-10 mx-auto mb-3 opacity-30" />
				<p className="text-lg font-medium">No saved posts</p>
				<p className="text-sm mt-1">Posts you save will appear here.</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-3">
				{posts.map((post) => (
					<PostCard
						key={post.id}
						post={post}
						currentUserId={currentUserId}
					/>
				))}
			</div>
			{hasMore && (
				<div ref={sentinelRef} className="flex justify-center py-6">
					{loading && (
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					)}
				</div>
			)}
		</>
	);
}
