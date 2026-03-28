"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VideoCard } from "./VideoCard";
import { UploadVideoDialog } from "./UploadVideoDialog";
import { Video, Upload, Loader2 } from "lucide-react";
import { getVideos } from "@/actions/video.actions";
import { useRouter } from "next/navigation";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type VideoItem = {
	id: number;
	title: string;
	url: string;
	thumbnailUrl: string | null;
	views: number;
	createdAt: Date;
	author: {
		id: number;
		userName: string;
		firstName: string | null;
		lastName: string | null;
		avatar: { photoSrc: string } | null;
	};
	hashtags: { hashtag: { id: number; name: string } }[];
	_count: { likes: number; comments: number };
};

const FILTER_TABS: { id: "all" | "mine" | "friends"; label: string }[] = [
	{ id: "all", label: "All Videos" },
	{ id: "mine", label: "My Videos" },
	{ id: "friends", label: "From Friends" },
];

export function VideosPageClient({
	initialVideos,
	initialHasMore,
	currentFilter,
	currentUserId,
}: {
	initialVideos: VideoItem[];
	initialHasMore: boolean;
	currentFilter: "all" | "mine" | "friends";
	currentUserId: number;
}) {
	const router = useRouter();
	const [uploadOpen, setUploadOpen] = useState(false);
	const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
	const [hasMore, setHasMore] = useState(initialHasMore);
	const [page, setPage] = useState(1);
	const [isPending, startTransition] = useTransition();

	function handleLoadMore() {
		const nextPage = page + 1;
		startTransition(async () => {
			const result = await getVideos({ filter: currentFilter, page: nextPage });
			setVideos((prev) => [...prev, ...(result.videos as VideoItem[])]);
			setHasMore(result.hasMore);
			setPage(nextPage);
		});
	}

	const sentinelRef = useInfiniteScroll(handleLoadMore, { hasMore, loading: isPending });

	return (
		<div className="max-w-6xl mx-auto px-4 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
						<Video className="h-5 w-5 text-indigo-500" />
					</div>
					<h1 className="text-2xl font-bold">Videos</h1>
				</div>
				<Button onClick={() => setUploadOpen(true)} className="gap-2">
					<Upload className="h-4 w-4" />
					Upload Video
				</Button>
			</div>

			{/* Filter tabs */}
			<div className="flex gap-1 border-b mb-6 overflow-x-auto">
				{FILTER_TABS.map(({ id, label }) => (
					<Link
						key={id}
						href={`/videos?filter=${id}`}
						className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
							currentFilter === id
								? "border-primary text-primary"
								: "border-transparent text-muted-foreground hover:text-foreground"
						}`}
					>
						{label}
					</Link>
				))}
			</div>

			{/* Grid */}
			{videos.length === 0 ? (
				<div className="text-center py-20 text-muted-foreground">
					<Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
					<p className="font-semibold text-lg">No videos yet</p>
					<p className="text-sm mt-1 mb-4">
						{currentFilter === "mine"
							? "You haven't uploaded any videos yet."
							: currentFilter === "friends"
								? "Your friends haven't posted any videos yet."
								: "Be the first to upload a video!"}
					</p>
					<Button onClick={() => setUploadOpen(true)} className="gap-2">
						<Upload className="h-4 w-4" />
						Upload Video
					</Button>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
						{videos.map((video) => (
							<VideoCard
								key={video.id}
								video={video}
								currentUserId={currentUserId}
							/>
						))}
					</div>
					{hasMore && (
						<div ref={sentinelRef} className="flex justify-center py-6 col-span-full">
							{isPending && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
						</div>
					)}
				</>
			)}

			<UploadVideoDialog
				open={uploadOpen}
				onClose={() => setUploadOpen(false)}
				onSuccess={() => router.refresh()}
			/>
		</div>
	);
}
